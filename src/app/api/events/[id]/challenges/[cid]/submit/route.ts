import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { Event } from "@/models/Event";
import { Challenge } from "@/models/Challenge";
import { EventRegistration } from "@/models/EventRegistration";
import { Attempt } from "@/models/Attempt";
import { verifyFlag } from "@/lib/ctf-security";
import { updateLeaderboardSnapshot } from "@/lib/ctf-leaderboard";
import { isValidObjectId } from "@/lib/validation";

// In-memory rate limiting map: key = `${userId}_${challengeId}`, value = lastSubmissionTimestamp
const rateLimitMap = new Map<string, number>();

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
    const rateKey = `${userId}_${challengeId}`;
    const nowTime = Date.now();
    const lastSubTime = rateLimitMap.get(rateKey) || 0;

    // Rate Limit: Max 1 submission per 2 seconds per user per challenge
    if (nowTime - lastSubTime < 2000) {
      return NextResponse.json(
        { error: "Too fast! Please wait 2 seconds between flag submissions." },
        { status: 429 }
      );
    }
    rateLimitMap.set(rateKey, nowTime);

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
      return NextResponse.json({ error: "You must register for this event before submitting flags." }, { status: 403 });
    }

    const challenge = await Challenge.findOne({ _id: challengeId, eventId: event._id });
    if (!challenge) {
      return NextResponse.json({ error: "Challenge not found" }, { status: 404 });
    }

    const attempt = await Attempt.findOne({ eventId: event._id, challengeId: challenge._id, userId });
    if (!attempt || !attempt.startedAt) {
      return NextResponse.json({ error: "Challenge not started yet. Please open challenge first." }, { status: 400 });
    }

    if (attempt.status === "solved") {
      return NextResponse.json({ message: "Challenge already solved!", status: "solved", pointsAwarded: attempt.pointsAwarded });
    }

    if (attempt.status === "expired" || attempt.status === "locked") {
      return NextResponse.json({ error: "Time's up — challenge is locked." }, { status: 400 });
    }

    const now = new Date();
    const elapsedSeconds = Math.floor((now.getTime() - new Date(attempt.startedAt).getTime()) / 1000);

    // SERVER-AUTHORITATIVE TIMER CHECK
    if (elapsedSeconds > challenge.timeLimitSeconds) {
      attempt.status = "expired";
      await attempt.save();
      return NextResponse.json({ error: "Time's up — challenge is locked.", status: "expired" }, { status: 400 });
    }

    const body = await req.json();
    const submittedFlag = (body.flag || "").trim();

    if (!submittedFlag) {
      return NextResponse.json({ error: "Flag string is required." }, { status: 400 });
    }

    // SERVER-SIDE SECURITY: Constant-time comparison against stored flagHash
    const isCorrect = verifyFlag(submittedFlag, challenge.flagHash);

    if (isCorrect) {
      // Calculate hint penalties
      let penaltyTotal = 0;
      (attempt.hintsUsed || []).forEach((hintIdx: number) => {
        if (challenge.hints && challenge.hints[hintIdx]) {
          penaltyTotal += challenge.hints[hintIdx].pointsPenalty || 0;
        }
      });

      const finalPoints = Math.max(1, challenge.points - penaltyTotal);

      attempt.status = "solved";
      attempt.solvedAt = now;
      attempt.timeTakenSeconds = elapsedSeconds;
      attempt.pointsAwarded = finalPoints;
      await attempt.save();

      // Trigger leaderboard snapshot update and Pusher broadcast
      await updateLeaderboardSnapshot(event._id.toString());

      return NextResponse.json({
        message: `🎉 Correct Flag! +${finalPoints} points awarded.`,
        status: "solved",
        pointsAwarded: finalPoints,
        timeTakenSeconds: elapsedSeconds,
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
    console.error("POST submit flag error:", error);
    const msg = error instanceof Error ? error.message : "Failed to submit flag";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
