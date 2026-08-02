import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { Event } from "@/models/Event";
import { Challenge } from "@/models/Challenge";
import { EventRegistration } from "@/models/EventRegistration";
import { Attempt } from "@/models/Attempt";
import { isValidObjectId } from "@/lib/validation";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string; cid: string }> }
) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized. Please sign in." }, { status: 401 });
    }

    const { id: identifier, cid: challengeId } = await params;
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

    // Verify registration
    const isRegistered = await EventRegistration.exists({ eventId: event._id, userId });
    if (!isRegistered) {
      return NextResponse.json({ error: "You must register for this event before attempting challenges." }, { status: 403 });
    }

    const challenge = await Challenge.findOne({ _id: challengeId, eventId: event._id });
    if (!challenge) {
      return NextResponse.json({ error: "Challenge not found" }, { status: 404 });
    }

    const now = new Date();
    let attempt = await Attempt.findOne({ eventId: event._id, challengeId: challenge._id, userId });

    if (!attempt) {
      attempt = await Attempt.create({
        eventId: event._id,
        challengeId: challenge._id,
        userId,
        status: "in_progress",
        startedAt: now,
      });
    } else if (attempt.status === "not_started") {
      attempt.status = "in_progress";
      attempt.startedAt = now;
      await attempt.save();
    }

    return NextResponse.json({
      attemptId: attempt._id,
      status: attempt.status,
      startedAt: attempt.startedAt,
      timeLimitSeconds: challenge.timeLimitSeconds,
      hintsUsed: attempt.hintsUsed,
      wrongAttemptCount: attempt.wrongAttemptCount,
    });
  } catch (error) {
    console.error("POST /api/events/[id]/challenges/[cid]/start error:", error);
    return NextResponse.json({ error: "Failed to start challenge timer" }, { status: 500 });
  }
}
