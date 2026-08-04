import { NextResponse } from "next/server";
import crypto from "crypto";
import mongoose from "mongoose";
import { auth } from "@/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { Event } from "@/models/Event";
import { EventChallenge } from "@/models/EventChallenge";
import { EventRegistration } from "@/models/EventRegistration";
import { EventSubmission } from "@/models/EventSubmission";
import { User } from "@/models/User";
import { pusherServer } from "@/lib/pusher";

const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 10; // max 10 submissions per minute per user per challenge

function hashFlag(flag: string): string {
  return crypto.createHash("sha256").update(flag.trim()).digest("hex");
}

// POST /api/events/[id]/challenges/[cid]/submit
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string; cid: string }> }
) {
  try {
    const { id, cid } = await params;
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }
    const userId = session.user.id;

    await connectToDatabase();

    // ── Load event (server-side timing authority) ─────────────────────────
    const event = await Event.findById(id);
    if (!event) {
      return NextResponse.json({ error: "Event not found." }, { status: 404 });
    }

    const now = new Date();

    // ── Event must be live (server enforces this, not client timer) ────────
    if (now < event.eventStart || now > event.eventEnd) {
      return NextResponse.json(
        { error: "Event is not active. Submissions are closed." },
        { status: 403 }
      );
    }

    // ── Registration check ─────────────────────────────────────────────────
    const registration = await EventRegistration.findOne({
      eventId: id,
      userId,
      paymentStatus: { $in: ["not_required", "paid"] },
    });
    if (!registration) {
      return NextResponse.json(
        { error: "You are not registered for this event." },
        { status: 403 }
      );
    }

    // ── Disqualification check ─────────────────────────────────────────────
    if (registration.isDisqualified) {
      return NextResponse.json(
        { error: "You have been disqualified from this event." },
        { status: 403 }
      );
    }

    // ── Rate limiting (max 10 attempts per minute per user per challenge) ──
    const windowStart = new Date(now.getTime() - RATE_LIMIT_WINDOW_MS);
    const recentCount = await EventSubmission.countDocuments({
      challengeId: cid,
      userId,
      submittedAt: { $gte: windowStart },
    });
    if (recentCount >= RATE_LIMIT_MAX) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Please wait before trying again." },
        { status: 429 }
      );
    }

    // ── Already solved? ────────────────────────────────────────────────────
    const alreadySolved = await EventSubmission.findOne({
      challengeId: cid,
      eventId: id,
      userId,
      isCorrect: true,
    });
    if (alreadySolved) {
      return NextResponse.json(
        { correct: true, message: "Already solved!", pointsAwarded: alreadySolved.pointsAwarded },
        { status: 200 }
      );
    }

    // ── Load challenge (with flagHash — server only) ───────────────────────
    const challenge = await EventChallenge.findOne({ _id: cid, eventId: id });
    if (!challenge) {
      return NextResponse.json({ error: "Challenge not found." }, { status: 404 });
    }

    // ── Challenge visibility check (server-side) ───────────────────────────
    const releaseMode = event.challengeReleaseMode ?? "all_at_once";
    if (releaseMode === "scheduled" && challenge.releaseAt && new Date(challenge.releaseAt) > now) {
      return NextResponse.json({ error: "Challenge not yet released." }, { status: 403 });
    }
    if (releaseMode === "sequential" && challenge.unlockAfterChallengeId) {
      const prereqSolved = await EventSubmission.findOne({
        challengeId: challenge.unlockAfterChallengeId,
        eventId: id,
        userId,
        isCorrect: true,
      });
      if (!prereqSolved) {
        return NextResponse.json(
          { error: "Complete the prerequisite challenge first." },
          { status: 403 }
        );
      }
    }

    // ── Parse and validate flag ────────────────────────────────────────────
    const body = await req.json();
    const { flag } = body;
    if (!flag || typeof flag !== "string" || !flag.trim()) {
      return NextResponse.json({ error: "Flag is required." }, { status: 400 });
    }

    // ── Compare hash ───────────────────────────────────────────────────────
    const submittedHash = hashFlag(flag);
    const isCorrect = submittedHash === challenge.flagHash;

    // ── Attempt count ──────────────────────────────────────────────────────
    const totalAttempts = await EventSubmission.countDocuments({
      challengeId: cid,
      eventId: id,
      userId,
    });

    // ── Dynamic scoring (decay) ────────────────────────────────────────────
    let pointsAwarded = 0;
    if (isCorrect) {
      if (challenge.solveDecayFactor > 0 && challenge.maxPoints && challenge.minPoints != null) {
        // Count previous correct solvers
        const solverCount = await EventSubmission.countDocuments({
          challengeId: cid,
          eventId: id,
          isCorrect: true,
        });
        const decayed = Math.floor(
          challenge.maxPoints * Math.pow(1 - challenge.solveDecayFactor, solverCount)
        );
        pointsAwarded = Math.max(challenge.minPoints, decayed);
      } else {
        pointsAwarded = challenge.points;
      }
    }

    // ── Record submission ──────────────────────────────────────────────────
    await EventSubmission.create({
      challengeId: cid,
      eventId: id,
      userId,
      teamId: registration.teamId ?? null,
      submittedFlag: flag.trim(), // store plaintext for audit log
      isCorrect,
      pointsAwarded,
      attemptNumber: totalAttempts + 1,
      submittedAt: now,
    });

    // ── On correct: update user XP, update leaderboard snapshot, push Pusher ──
    if (isCorrect) {
      // Award XP into existing gamification system (User.points)
      const xpGained = pointsAwarded;
      await User.findByIdAndUpdate(userId, { $inc: { points: xpGained } });

      // Build live leaderboard entry and push to Pusher
      // Compute total score for this user in this event
      const scoreAgg = await EventSubmission.aggregate([
        {
          $match: {
            eventId: new mongoose.Types.ObjectId(id),
            userId: new mongoose.Types.ObjectId(userId),
            isCorrect: true,
          },
        },
        { $group: { _id: null, totalPoints: { $sum: "$pointsAwarded" } } },
      ]);
      
      // Use a simpler approach for Pusher - just trigger leaderboard refresh
      await pusherServer.trigger(`event-${id}-leaderboard`, "new-solve", {
        userId,
        codename: registration.codename,
        challengeId: cid,
        challengeTitle: challenge.title,
        pointsAwarded,
        solvedAt: now.toISOString(),
        newTotal: scoreAgg[0]?.totalPoints ?? pointsAwarded,
      });
    }

    return NextResponse.json({
      correct: isCorrect,
      message: isCorrect
        ? `Correct! You earned ${pointsAwarded} points.`
        : "Incorrect flag. Try again.",
      pointsAwarded: isCorrect ? pointsAwarded : 0,
    });
  } catch (err) {
    console.error("[POST /api/events/[id]/challenges/[cid]/submit]", err);
    return NextResponse.json({ error: "Submission failed. Please try again." }, { status: 500 });
  }
}
