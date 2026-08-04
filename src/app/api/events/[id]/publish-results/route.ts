import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { auth } from "@/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { Event } from "@/models/Event";
import { EventRegistration } from "@/models/EventRegistration";
import { EventSubmission } from "@/models/EventSubmission";
import { requireAdminOrHost } from "@/lib/eventAuth";
import { pusherServer } from "@/lib/pusher";

// POST /api/events/[id]/publish-results — calculate final ranks, set resultsRevealedAt
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    await connectToDatabase();

    const event = await Event.findById(id);
    if (!event) {
      return NextResponse.json({ error: "Event not found." }, { status: 404 });
    }

    const check = requireAdminOrHost(session, event);
    if (!check.ok) {
      return NextResponse.json({ error: check.error }, { status: check.status });
    }

    // Aggregate scores across all non-disqualified active participants
    const [registrations, solveAgg] = await Promise.all([
      EventRegistration.find({ eventId: id, paymentStatus: { $in: ["not_required", "paid"] } }),
      EventSubmission.aggregate([
        { $match: { eventId: new mongoose.Types.ObjectId(id), isCorrect: true } },
        {
          $group: {
            _id: "$userId",
            totalPoints: { $sum: "$pointsAwarded" },
            lastSolveAt: { $max: "$submittedAt" },
          },
        },
      ]),
    ]);

    const solveMap = new Map(solveAgg.map((s) => [s._id.toString(), s]));

    // Rank participants: non-DQ first, score desc, lastSolveAt asc
    const rankedList = registrations.map((r) => {
      const stats = solveMap.get(r.userId.toString());
      return {
        reg: r,
        totalPoints: stats?.totalPoints ?? 0,
        lastSolveAt: stats?.lastSolveAt ?? new Date(0),
        isDisqualified: r.isDisqualified,
      };
    });

    rankedList.sort((a, b) => {
      if (a.isDisqualified !== b.isDisqualified) return a.isDisqualified ? 1 : -1;
      if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
      return new Date(a.lastSolveAt).getTime() - new Date(b.lastSolveAt).getTime();
    });

    // Save final scores and ranks
    let rank = 1;
    for (const item of rankedList) {
      item.reg.finalScore = item.totalPoints;
      item.reg.finalRank = item.isDisqualified ? null : rank;
      item.reg.finalizedAt = new Date();
      await item.reg.save();
      if (!item.isDisqualified) rank++;
    }

    // Set resultsRevealedAt on event and change status to ended
    event.resultsRevealedAt = new Date();
    if (event.status !== "ended") event.status = "ended";
    await event.save();

    // Trigger Pusher notification
    await pusherServer.trigger(`event-${id}-leaderboard`, "results-published", {
      resultsRevealedAt: event.resultsRevealedAt,
    });

    return NextResponse.json({
      success: true,
      resultsRevealedAt: event.resultsRevealedAt,
      totalRanked: rank - 1,
    });
  } catch (err) {
    console.error("[POST /api/events/[id]/publish-results]", err);
    return NextResponse.json({ error: "Failed to publish results." }, { status: 500 });
  }
}
