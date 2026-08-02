import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { Event } from "@/models/Event";
import { Challenge } from "@/models/Challenge";
import { EventRegistration } from "@/models/EventRegistration";
import { Run } from "@/models/Run";
import { Attempt } from "@/models/Attempt";
import { verifyFlag } from "@/lib/ctf-security";
import { updateLeaderboardSnapshot } from "@/lib/ctf-leaderboard";
import { isValidObjectId } from "@/lib/validation";

const rateLimitMap = new Map<string, number>();

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized. Please sign in." }, { status: 401 });
    }

    const { id: identifier } = await params;
    await connectToDatabase();

    let event = null;
    if (isValidObjectId(identifier)) {
      event = await Event.findById(identifier);
    } else {
      event = await Event.findOne({ slug: identifier });
    }

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // SERVER-SIDE GATE: Verify Registration
    const registration = await EventRegistration.exists({
      eventId: event._id,
      userId,
      paymentStatus: { $in: ["paid", "not_required"] },
    });

    if (!registration) {
      return NextResponse.json({ error: "Unauthorized. Must be registered to submit flags." }, { status: 403 });
    }

    const run = await Run.findOne({ eventId: event._id, userId });
    if (!run || run.status === "completed") {
      return NextResponse.json({ error: "Run is completed or not found." }, { status: 400 });
    }

    const challengeOrder = event.challengeOrder || [];
    const index = run.currentSequenceIndex || 0;
    const currentChallengeId = challengeOrder[index];

    if (!currentChallengeId) {
      return NextResponse.json({ error: "No active challenge found for this sequence step." }, { status: 400 });
    }

    // Rate Limit: Max 1 submission per 2 seconds
    const rateKey = `${userId}_${currentChallengeId}`;
    const nowMs = Date.now();
    const lastSub = rateLimitMap.get(rateKey) || 0;
    if (nowMs - lastSub < 2000) {
      return NextResponse.json({ error: "Too fast! Please wait 2 seconds between flag submissions." }, { status: 429 });
    }
    rateLimitMap.set(rateKey, nowMs);

    const challenge = await Challenge.findById(currentChallengeId);
    if (!challenge) {
      return NextResponse.json({ error: "Challenge not found" }, { status: 404 });
    }

    const attempt = await Attempt.findOne({ eventId: event._id, challengeId: challenge._id, userId });
    if (!attempt || !attempt.startedAt) {
      return NextResponse.json({ error: "Challenge timer not started." }, { status: 400 });
    }

    if (attempt.status === "solved") {
      return NextResponse.json({ message: "Already solved!", status: "solved" });
    }

    const now = new Date();
    const elapsedSeconds = Math.floor((now.getTime() - new Date(attempt.startedAt).getTime()) / 1000);

    // SERVER-AUTHORITATIVE TIMER CHECK
    if (elapsedSeconds > challenge.timeLimitSeconds) {
      attempt.status = "expired";
      attempt.resolvedAt = now;
      await attempt.save();

      // Advance sequence
      run.currentSequenceIndex += 1;
      await run.save();

      return NextResponse.json(
        { error: "Time's up — challenge locked.", status: "expired", advanced: true },
        { status: 400 }
      );
    }

    const body = await req.json();
    const submittedFlag = (body.flag || "").trim();
    if (!submittedFlag) {
      return NextResponse.json({ error: "Flag string is required." }, { status: 400 });
    }

    // SHA-256 Constant-time comparison
    const isCorrect = verifyFlag(submittedFlag, challenge.flagHash);

    if (isCorrect) {
      let penaltyTotal = 0;
      (attempt.hintsUsed || []).forEach((hintIdx: number) => {
        if (challenge.hints && challenge.hints[hintIdx]) {
          penaltyTotal += challenge.hints[hintIdx].pointsPenalty || 0;
        }
      });

      const finalPoints = Math.max(1, challenge.points - penaltyTotal);

      attempt.status = "solved";
      attempt.solvedAt = now;
      attempt.resolvedAt = now;
      attempt.timeTakenSeconds = elapsedSeconds;
      attempt.pointsAwarded = finalPoints;
      await attempt.save();

      // Update Run total score and total time
      run.totalPoints += finalPoints;
      run.totalTimeSeconds += elapsedSeconds;
      run.currentSequenceIndex += 1;
      await run.save();

      // Update Leaderboard Snapshot & broadcast via Pusher
      await updateLeaderboardSnapshot(event._id.toString());

      return NextResponse.json({
        message: `🎉 Correct Flag! +${finalPoints} points earned.`,
        status: "solved",
        pointsAwarded: finalPoints,
        timeTakenSeconds: elapsedSeconds,
        advanced: true,
      });
    } else {
      attempt.wrongAttemptCount += 1;
      await attempt.save();

      return NextResponse.json(
        { error: "Flag is not right — try again.", status: "in_progress", wrongAttemptCount: attempt.wrongAttemptCount },
        { status: 400 }
      );
    }
  } catch (error: unknown) {
    console.error("POST /api/events/[id]/arena/submit error:", error);
    const msg = error instanceof Error ? error.message : "Failed to submit flag";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
