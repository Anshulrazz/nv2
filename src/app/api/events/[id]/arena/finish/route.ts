import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { Event } from "@/models/Event";
import { EventRegistration } from "@/models/EventRegistration";
import { Run } from "@/models/Run";
import { Attempt } from "@/models/Attempt";
import { updateLeaderboardSnapshot } from "@/lib/ctf-leaderboard";
import { isValidObjectId } from "@/lib/validation";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

    const isRegistered = await EventRegistration.exists({ eventId: event._id, userId });
    if (!isRegistered) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const run = await Run.findOne({ eventId: event._id, userId });
    if (!run) {
      return NextResponse.json({ error: "No run active for this user." }, { status: 400 });
    }

    const now = new Date();
    const challengeOrder = event.challengeOrder || [];
    const lastChallengeId = challengeOrder[run.currentSequenceIndex || 0];

    // If last attempt is still in progress and user explicitly finishes without solving, mark skipped
    if (lastChallengeId) {
      const lastAttempt = await Attempt.findOne({ eventId: event._id, challengeId: lastChallengeId, userId });
      if (lastAttempt && lastAttempt.status === "in_progress") {
        lastAttempt.status = "skipped";
        lastAttempt.resolvedAt = now;
        lastAttempt.pointsAwarded = 0;
        await lastAttempt.save();
      }
    }

    run.status = "completed";
    run.completedAt = now;
    await run.save();

    // Final leaderboard update marking completed: true
    await updateLeaderboardSnapshot(event._id.toString());

    return NextResponse.json({
      message: "🎉 CTF Run Completed Successfully!",
      completedAt: run.completedAt,
      totalPoints: run.totalPoints,
      totalTimeSeconds: run.totalTimeSeconds,
    });
  } catch (error) {
    console.error("POST /api/events/[id]/arena/finish error:", error);
    return NextResponse.json({ error: "Failed to complete run" }, { status: 500 });
  }
}
