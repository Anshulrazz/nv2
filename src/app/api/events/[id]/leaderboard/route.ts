import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/mongodb";
import { Event } from "@/models/Event";
import { EventSubmission } from "@/models/EventSubmission";
import { EventRegistration } from "@/models/EventRegistration";
import { EventChallenge } from "@/models/EventChallenge";
import { auth } from "@/auth";

// GET /api/events/[id]/leaderboard
// CTF: ranked by total points (correct submissions), tiebreak by last solve time (earliest wins)
// Hackathon: computed from judge scores (Phase 14 — fallback to empty until implemented)
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await connectToDatabase();

    const session = await auth();
    const userId = session?.user?.id;
    const role = session?.user?.role ?? "user";

    const event = await Event.findById(id)
      .select("type status scoreFreezeAt resultsRevealedAt createdBy hostIds")
      .lean();

    if (!event) {
      return NextResponse.json({ error: "Event not found." }, { status: 404 });
    }

    const isHost =
      role === "admin" ||
      event.createdBy?.toString() === userId ||
      event.hostIds?.some((h: { toString: () => string }) => h.toString() === userId);

    // If results not yet revealed and not host: return hidden state
    if (!event.resultsRevealedAt && !isHost && event.status !== "live" && event.status !== "published") {
      return NextResponse.json({
        hidden: true,
        message: "Results have not been revealed yet.",
      });
    }

    const now = new Date();
    const isFrozen =
      event.scoreFreezeAt ? now >= new Date(event.scoreFreezeAt as Date) : false;
    const freezeTime = isFrozen ? new Date(event.scoreFreezeAt as Date) : null;

    if (event.type === "ctf") {
      // ── CTF Leaderboard ───────────────────────────────────────────────────
      // Aggregate correct submissions per user, total points, last solve time
      const eventObjId = new mongoose.Types.ObjectId(id);
      const submissionQuery = {
        eventId: eventObjId,
        isCorrect: true,
        ...(freezeTime ? { submittedAt: { $lte: freezeTime } } : {}),
      };

      // Fetch all registered participants and aggregate solves
      const [registrations, solveAgg] = await Promise.all([
        EventRegistration.find({
          eventId: id,
          paymentStatus: { $in: ["not_required", "paid"] },
        })
          .select("userId codename isDisqualified createdAt")
          .lean(),
        EventSubmission.aggregate([
          { $match: submissionQuery },
          {
            $group: {
              _id: "$userId",
              totalPoints: { $sum: "$pointsAwarded" },
              lastSolveAt: { $max: "$submittedAt" },
              solveCount: { $sum: 1 },
            },
          },
        ]),
      ]);

      const solveMap = new Map(
        solveAgg.map((a) => [a._id.toString(), a])
      );

      const entries = registrations.map((reg) => {
        const solve = solveMap.get(reg.userId.toString());
        return {
          userId: reg.userId.toString(),
          codename: reg.codename,
          totalPoints: solve ? solve.totalPoints : 0,
          lastSolveAt: solve ? solve.lastSolveAt : (reg.createdAt ?? new Date(0)),
          solveCount: solve ? solve.solveCount : 0,
          isDisqualified: reg.isDisqualified,
        };
      });

      // Sort: non-DQ first by points desc, then by lastSolveAt asc (earlier = better)
      entries.sort((a, b) => {
        if (a.isDisqualified !== b.isDisqualified) return a.isDisqualified ? 1 : -1;
        if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
        return new Date(a.lastSolveAt).getTime() - new Date(b.lastSolveAt).getTime();
      });

      // Assign ranks (DQ participants excluded from rank numbering)
      let rank = 1;
      const ranked = entries.map((e) => {
        const entry = { ...e, rank: e.isDisqualified ? null : rank };
        if (!e.isDisqualified) rank++;
        return entry;
      });

      // Count total distinct challenges for progress bar
      const totalChallenges = await EventChallenge.countDocuments({ eventId: id });

      return NextResponse.json({
        type: "ctf",
        leaderboard: ranked,
        isFrozen,
        freezeAt: freezeTime?.toISOString() ?? null,
        totalChallenges,
      });
    }

    // Hackathon leaderboard (Phase 14 implementation)
    return NextResponse.json({ type: "hackathon", leaderboard: [], message: "Judging in progress." });
  } catch (err) {
    console.error("[GET /api/events/[id]/leaderboard]", err);
    return NextResponse.json({ error: "Failed to load leaderboard." }, { status: 500 });
  }
}
