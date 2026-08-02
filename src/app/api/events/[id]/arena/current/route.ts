import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { Event } from "@/models/Event";
import { Challenge } from "@/models/Challenge";
import { EventRegistration } from "@/models/EventRegistration";
import { Run } from "@/models/Run";
import { Attempt } from "@/models/Attempt";
import { isValidObjectId } from "@/lib/validation";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized. Please sign in." }, { status: 401 });
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

    // SERVER-SIDE GATE 1: Verify Registration
    const registration = await EventRegistration.findOne({
      eventId: event._id,
      userId,
      paymentStatus: { $in: ["paid", "not_required"] },
    }).lean();

    if (!registration) {
      return NextResponse.json(
        { error: "Access denied. You must register for this event before entering the arena." },
        { status: 403 }
      );
    }

    // SERVER-SIDE GATE 2: Event Live Check
    if (event.status !== "live" && event.status !== "published") {
      return NextResponse.json(
        { error: `Event is currently ${event.status}. Arena access is available when event is live.` },
        { status: 403 }
      );
    }

    // Get or Create User Run
    let run = await Run.findOne({ eventId: event._id, userId });
    if (!run) {
      run = await Run.create({
        eventId: event._id,
        userId,
        currentSequenceIndex: 0,
        status: "in_progress",
        startedAt: new Date(),
      });
    }

    if (run.status === "completed") {
      return NextResponse.json({
        runStatus: "completed",
        message: "Run completed! Redirecting to results...",
        completedAt: run.completedAt,
        totalPoints: run.totalPoints,
        totalTimeSeconds: run.totalTimeSeconds,
      });
    }

    // Fetch challenge sequence from event.challengeOrder or sorted challenges
    let challengeOrder = event.challengeOrder || [];
    if (challengeOrder.length === 0) {
      const allChallenges = await Challenge.find({ eventId: event._id }).sort({ order: 1 }).select("_id").lean();
      challengeOrder = allChallenges.map((c) => c._id);
      event.challengeOrder = challengeOrder;
      await event.save();
    }

    const totalChallenges = challengeOrder.length;
    if (totalChallenges === 0) {
      return NextResponse.json({ error: "No challenges available in this event." }, { status: 404 });
    }

    // Auto-advance sequence index if out of bounds or current attempt is resolved
    let index = run.currentSequenceIndex || 0;
    let currentChallengeId = challengeOrder[index];

    // Loop to auto-advance past already resolved attempts
    while (index < totalChallenges) {
      currentChallengeId = challengeOrder[index];
      const attempt = await Attempt.findOne({ eventId: event._id, challengeId: currentChallengeId, userId });

      if (attempt && ["solved", "skipped", "expired"].includes(attempt.status)) {
        index += 1;
        run.currentSequenceIndex = index;
        await run.save();
      } else {
        break;
      }
    }

    // Check if run reached end of sequence
    if (index >= totalChallenges) {
      run.status = "completed";
      run.completedAt = new Date();
      await run.save();

      return NextResponse.json({
        runStatus: "completed",
        message: "All challenges in sequence resolved!",
        completedAt: run.completedAt,
        totalPoints: run.totalPoints,
        totalTimeSeconds: run.totalTimeSeconds,
      });
    }

    // Fetch current challenge details WITHOUT secret flagHash
    const challenge = await Challenge.findById(currentChallengeId).select("-flagHash").lean();
    if (!challenge) {
      return NextResponse.json({ error: "Current challenge not found" }, { status: 404 });
    }

    // Fetch or initialize Attempt
    const now = new Date();
    let attempt = await Attempt.findOne({ eventId: event._id, challengeId: challenge._id, userId });
    if (!attempt) {
      attempt = await Attempt.create({
        eventId: event._id,
        challengeId: challenge._id,
        userId,
        sequenceIndex: index,
        status: "in_progress",
        startedAt: now,
      });
    } else if (attempt.status === "not_started") {
      attempt.status = "in_progress";
      attempt.startedAt = now;
      attempt.sequenceIndex = index;
      await attempt.save();
    }

    return NextResponse.json({
      runStatus: run.status,
      challenge,
      attempt: {
        _id: attempt._id,
        status: attempt.status,
        startedAt: attempt.startedAt,
        wrongAttemptCount: attempt.wrongAttemptCount,
        hintsUsed: attempt.hintsUsed || [],
      },
      progress: {
        current: index + 1,
        total: totalChallenges,
      },
      timeLimitSeconds: challenge.timeLimitSeconds,
      startedAt: attempt.startedAt,
      isLastChallenge: index === totalChallenges - 1,
    });
  } catch (error: unknown) {
    console.error("GET /api/events/[id]/arena/current error:", error);
    const msg = error instanceof Error ? error.message : "Failed to fetch current challenge";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
