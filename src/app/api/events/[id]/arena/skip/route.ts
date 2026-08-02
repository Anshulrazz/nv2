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
    if (!run || run.status === "completed") {
      return NextResponse.json({ error: "Run is completed or inactive." }, { status: 400 });
    }

    const challengeOrder = event.challengeOrder || [];
    const index = run.currentSequenceIndex || 0;
    const currentChallengeId = challengeOrder[index];

    if (!currentChallengeId) {
      return NextResponse.json({ error: "No active challenge to skip." }, { status: 400 });
    }

    const now = new Date();
    let attempt = await Attempt.findOne({ eventId: event._id, challengeId: currentChallengeId, userId });
    if (!attempt) {
      attempt = await Attempt.create({
        eventId: event._id,
        challengeId: currentChallengeId,
        userId,
        sequenceIndex: index,
        status: "skipped",
        resolvedAt: now,
        pointsAwarded: 0,
      });
    } else {
      attempt.status = "skipped";
      attempt.resolvedAt = now;
      attempt.pointsAwarded = 0;
      await attempt.save();
    }

    // Advance sequence index
    run.currentSequenceIndex += 1;
    await run.save();

    await updateLeaderboardSnapshot(event._id.toString());

    return NextResponse.json({
      message: "Challenge skipped. Advanced to next challenge.",
      status: "skipped",
      nextIndex: run.currentSequenceIndex,
    });
  } catch (error) {
    console.error("POST /api/events/[id]/arena/skip error:", error);
    return NextResponse.json({ error: "Failed to skip challenge" }, { status: 500 });
  }
}
