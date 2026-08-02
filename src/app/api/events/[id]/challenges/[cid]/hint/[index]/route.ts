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
  { params }: { params: Promise<{ id: string; cid: string; index: string }> }
) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: identifier, cid: challengeId, index: hintIndexStr } = await params;
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
      return NextResponse.json({ error: "You must register for this event." }, { status: 403 });
    }

    const challenge = await Challenge.findOne({ _id: challengeId, eventId: event._id });
    if (!challenge || !challenge.hints || !challenge.hints[hintIdx]) {
      return NextResponse.json({ error: "Hint not found." }, { status: 404 });
    }

    let attempt = await Attempt.findOne({ eventId: event._id, challengeId: challenge._id, userId });
    if (!attempt) {
      attempt = await Attempt.create({
        eventId: event._id,
        challengeId: challenge._id,
        userId,
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
    console.error("POST hint error:", error);
    return NextResponse.json({ error: "Failed to reveal hint" }, { status: 500 });
  }
}
