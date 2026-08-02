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
      return NextResponse.json({ error: "You must join this event before submitting flags." }, { status: 403 });
    }

    const body = await req.json();
    const { challengeId, submittedFlag } = body;

    if (!challengeId || typeof submittedFlag !== "string" || !submittedFlag.trim()) {
      return NextResponse.json({ error: "Challenge ID and flag string are required." }, { status: 400 });
    }

    const challenge = (event.challenges || []).find((c: { _id?: { toString(): string } }) => c._id?.toString() === challengeId);
    if (!challenge) {
      return NextResponse.json({ error: "Challenge not found for this event." }, { status: 404 });
    }

    if (!challenge.flag || !challenge.flag.trim()) {
      return NextResponse.json({ error: "This challenge has no active flag." }, { status: 400 });
    }

    const cleanInputFlag = submittedFlag.trim();
    const cleanSecretFlag = challenge.flag.trim();

    // Exact string match (case sensitive or exact)
    if (cleanInputFlag !== cleanSecretFlag) {
      return NextResponse.json({ error: "❌ Incorrect flag. Double check and try again!" }, { status: 400 });
    }

    // Flag is correct! Check if user already solved it
    let submission = await EventSubmission.findOne({ eventId: event._id, userId });
    if (!submission) {
      submission = new EventSubmission({
        eventId: event._id,
        userId,
        projectTitle: "Hackathon Challenge Competitor",
        description: "Participated in Hackathon Flag Challenges",
        score: 0,
        solvedChallenges: [],
      });
    }

    const alreadySolved = (submission.solvedChallenges || []).some(
      (sc: { challengeId: string }) => sc.challengeId === challengeId
    );

    if (alreadySolved) {
      return NextResponse.json({
        message: "You have already solved this challenge!",
        alreadySolved: true,
        pointsEarned: 0,
        currentScore: submission.score,
      });
    }

    const pointsEarned = Number(challenge.points) || 100;
    submission.solvedChallenges = submission.solvedChallenges || [];
    submission.solvedChallenges.push({
      challengeId,
      solvedAt: new Date(),
      pointsEarned,
    });
    submission.score = (submission.score || 0) + pointsEarned;
    submission.updatedAt = new Date();

    await submission.save();

    return NextResponse.json({
      message: `🎉 Correct Flag! You earned +${pointsEarned} points!`,
      success: true,
      pointsEarned,
      currentScore: submission.score,
      solvedChallenges: submission.solvedChallenges,
    });
  } catch (error) {
    console.error("POST /api/events/[id]/submit-flag error:", error);
    return NextResponse.json({ error: "Failed to submit flag" }, { status: 500 });
  }
}
