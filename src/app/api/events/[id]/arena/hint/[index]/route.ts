import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { Event } from "@/models/Event";
import { Challenge } from "@/models/Challenge";
import { EventRegistration } from "@/models/EventRegistration";
import { Run } from "@/models/Run";
import { Attempt } from "@/models/Attempt";
import { isValidObjectId } from "@/lib/validation";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string; index: string }> }
) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: identifier, index: hintIndexStr } = await params;
    const hintIdx = parseInt(hintIndexStr, 10);
    if (isNaN(hintIdx) || hintIdx < 0) {
      return NextResponse.json({ error: "Invalid hint index." }, { status: 400 });
    }

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
    const currentChallengeId = challengeOrder[run.currentSequenceIndex || 0];

    if (!currentChallengeId) {
      return NextResponse.json({ error: "No active challenge found." }, { status: 400 });
    }

    const challenge = await Challenge.findById(currentChallengeId);
    if (!challenge || !challenge.hints || !challenge.hints[hintIdx]) {
      return NextResponse.json({ error: "Hint not found." }, { status: 404 });
    }

    let attempt = await Attempt.findOne({ eventId: event._id, challengeId: challenge._id, userId });
    if (!attempt) {
      attempt = await Attempt.create({
        eventId: event._id,
        challengeId: challenge._id,
        userId,
        sequenceIndex: run.currentSequenceIndex || 0,
        status: "in_progress",
        startedAt: new Date(),
        hintsUsed: [],
      });
    }

    if (!attempt.hintsUsed.includes(hintIdx)) {
      attempt.hintsUsed.push(hintIdx);
      await attempt.save();
    }

    const targetHint = challenge.hints[hintIdx];
    return NextResponse.json({
      hintText: targetHint.text,
      pointsPenalty: targetHint.pointsPenalty,
      hintsUsed: attempt.hintsUsed,
    });
  } catch (error) {
    console.error("POST /api/events/[id]/arena/hint/[index] error:", error);
    return NextResponse.json({ error: "Failed to reveal hint" }, { status: 500 });
  }
}
