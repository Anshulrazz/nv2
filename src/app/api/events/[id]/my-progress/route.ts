import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { Event } from "@/models/Event";
import { EventRegistration } from "@/models/EventRegistration";
import { EventSubmission } from "@/models/EventSubmission";

// GET /api/events/[id]/my-progress — participant reconnection state
// Returns: solved challenges, current score, DQ status, server now + eventEnd for timer sync
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }
    const userId = session.user.id;

    await connectToDatabase();

    const event = await Event.findById(id)
      .select("eventStart eventEnd status scoreFreezeAt resultsRevealedAt challengeReleaseMode")
      .lean();

    if (!event) {
      return NextResponse.json({ error: "Event not found." }, { status: 404 });
    }

    const registration = await EventRegistration.findOne({ eventId: id, userId })
      .select("paymentStatus isDisqualified disqualifiedReason codename finalScore finalRank")
      .lean();

    const now = new Date();

    if (!registration || !["not_required", "paid"].includes(registration.paymentStatus as string)) {
      return NextResponse.json({ registered: false, now: now.toISOString() });
    }

    // Gather solved challenges
    const solvedSubmissions = await EventSubmission.find({
      eventId: id,
      userId,
      isCorrect: true,
    })
      .select("challengeId pointsAwarded submittedAt")
      .lean();

    const totalScore = solvedSubmissions.reduce((sum, s) => sum + (s.pointsAwarded ?? 0), 0);
    const solvedChallengeIds = solvedSubmissions.map((s) => s.challengeId.toString());

    // Gather unlocked hints for this user
    // (imported in Phase 10 — return empty for now)
    const unlockedHintIds: string[] = [];

    return NextResponse.json({
      registered: true,
      codename: registration.codename,
      isDisqualified: registration.isDisqualified,
      disqualifiedReason: registration.isDisqualified
        ? registration.disqualifiedReason
        : null,
      totalScore,
      finalScore: registration.finalScore ?? null,
      finalRank: registration.finalRank ?? null,
      solvedChallengeIds,
      unlockedHintIds,
      // ── Server-authoritative timing ──────────────────────────────────────
      now: now.toISOString(), // client computes offset once: serverNow - clientNow
      eventStart: (event.eventStart as Date).toISOString(),
      eventEnd: (event.eventEnd as Date).toISOString(),
      eventStatus: event.status,
      isScoreFrozen:
        event.scoreFreezeAt ? now >= new Date(event.scoreFreezeAt as Date) : false,
      resultsRevealed: !!event.resultsRevealedAt,
    });
  } catch (err) {
    console.error("[GET /api/events/[id]/my-progress]", err);
    return NextResponse.json({ error: "Failed to load progress." }, { status: 500 });
  }
}
