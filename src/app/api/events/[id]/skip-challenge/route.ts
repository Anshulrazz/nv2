import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { Event } from "@/models/Event";
import { EventRegistration } from "@/models/EventRegistration";
import { EventSubmission } from "@/models/EventSubmission";
import { isValidObjectId } from "@/lib/validation";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized. Please sign in." }, { status: 401 });
    }

    const { id: eventId } = await params;
    await connectToDatabase();

    let event = null;
    if (isValidObjectId(eventId)) {
      event = await Event.findById(eventId);
    } else {
      event = await Event.findOne({ slug: eventId });
    }

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const isRegistered = await EventRegistration.exists({ eventId: event._id, userId });
    if (!isRegistered) {
      return NextResponse.json({ error: "You must join this event before skipping challenges." }, { status: 403 });
    }

    const body = await req.json();
    const { challengeId } = body;

    if (!challengeId) {
      return NextResponse.json({ error: "Challenge ID is required." }, { status: 400 });
    }

    let submission = await EventSubmission.findOne({ eventId: event._id, userId });
    if (!submission) {
      submission = new EventSubmission({
        eventId: event._id,
        userId,
        projectTitle: "Hackathon Competitor",
        description: "Participated in Hackathon Challenges",
        score: 0,
        solvedChallenges: [],
      });
    }

    const skippedChallenges = (submission.get("skippedChallenges") as Array<{ challengeId: string }> || []);
    const alreadySkipped = skippedChallenges.some((sc) => sc.challengeId === challengeId);

    if (alreadySkipped) {
      return NextResponse.json({
        message: "Challenge is already locked & skipped.",
        alreadySkipped: true,
      });
    }

    // Add to skipped list
    skippedChallenges.push({ challengeId, skippedAt: new Date() } as unknown as { challengeId: string });
    submission.set("skippedChallenges", skippedChallenges);
    submission.updatedAt = new Date();
    await submission.save();

    return NextResponse.json({
      message: "🔒 Challenge skipped and locked.",
      skipped: true,
      challengeId,
    });
  } catch (error) {
    console.error("POST /api/events/[id]/skip-challenge error:", error);
    return NextResponse.json({ error: "Failed to skip challenge" }, { status: 500 });
  }
}
