import { NextResponse } from "next/server";
import crypto from "crypto";
import { auth } from "@/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { Event } from "@/models/Event";
import { EventChallenge } from "@/models/EventChallenge";
import { EventRegistration } from "@/models/EventRegistration";
import { EventSubmission } from "@/models/EventSubmission";
import { requireAdminOrHost } from "@/lib/eventAuth";

// ── Flag hashing ──────────────────────────────────────────────────────────────
function hashFlag(flag: string): string {
  return crypto.createHash("sha256").update(flag.trim()).digest("hex");
}

// GET /api/events/[id]/challenges — filtered by visibility for current user
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await connectToDatabase();
    const session = await auth();
    const userId = session?.user?.id;
    const role = session?.user?.role ?? "user";

    const event = await Event.findById(id).lean();
    if (!event) {
      return NextResponse.json({ error: "Event not found." }, { status: 404 });
    }

    // Only host/admin see challenges before event starts
    const isHost =
      role === "admin" ||
      event.createdBy?.toString() === userId ||
      event.hostIds?.some((h: { toString: () => string }) => h.toString() === userId);

    // Fetch all challenges for this event (without flagHash — stripped below)
    const allChallenges = await EventChallenge.find({ eventId: id })
      .select("-flagHash") // NEVER send hash to client
      .sort({ order: 1, createdAt: 1 })
      .lean();

    if (isHost) {
      // Hosts see all challenges with visibility metadata
      return NextResponse.json({ challenges: allChallenges });
    }

    // Participants: check registration
    const registration = userId
      ? await EventRegistration.findOne({
          eventId: id,
          userId,
          paymentStatus: { $in: ["not_required", "paid"] },
          isDisqualified: false,
        }).lean()
      : null;

    const now = new Date();
    const releaseMode = event.challengeReleaseMode ?? "all_at_once";

    // ── Visibility filtering ─────────────────────────────────────────────
    let visibleChallenges = allChallenges;

    if (releaseMode === "scheduled") {
      visibleChallenges = allChallenges.filter(
        (c) => !c.releaseAt || new Date(c.releaseAt) <= now
      );
    } else if (releaseMode === "sequential" && registration) {
      // Get user's solved challenge IDs
      const solvedDocs = await EventSubmission.find({
        eventId: id,
        userId,
        isCorrect: true,
      })
        .select("challengeId")
        .lean();
      const solvedIds = new Set(solvedDocs.map((s) => s.challengeId.toString()));

      // Challenge is visible if: no unlockAfter, OR the prerequisite is solved
      visibleChallenges = allChallenges.filter((c) => {
        if (!c.unlockAfterChallengeId) return true;
        return solvedIds.has(c.unlockAfterChallengeId.toString());
      });
    }

    // Attach solved status per challenge if user is logged in
    let solvedIds: Set<string> = new Set();
    if (userId) {
      const solved = await EventSubmission.find({
        eventId: id,
        userId,
        isCorrect: true,
      })
        .select("challengeId")
        .lean();
      solvedIds = new Set(solved.map((s) => s.challengeId.toString()));
    }

    const challengesWithStatus = visibleChallenges.map((c) => ({
      ...c,
      isSolved: solvedIds.has(c._id?.toString() ?? ""),
    }));

    return NextResponse.json({ challenges: challengesWithStatus });
  } catch (err) {
    console.error("[GET /api/events/[id]/challenges]", err);
    return NextResponse.json({ error: "Failed to fetch challenges." }, { status: 500 });
  }
}

// POST /api/events/[id]/challenges — create challenge (host/admin only)
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    await connectToDatabase();

    const event = await Event.findById(id);
    if (!event) {
      return NextResponse.json({ error: "Event not found." }, { status: 404 });
    }

    const check = requireAdminOrHost(session, event);
    if (!check.ok) {
      return NextResponse.json({ error: check.error }, { status: check.status });
    }

    const body = await req.json();
    const {
      title,
      descriptionMarkdown,
      images,
      attachmentUrl,
      category,
      points,
      difficulty,
      flag, // plaintext flag — hashed server-side, never stored plaintext
      unlockAfterChallengeId,
      releaseAt,
      order,
      maxPoints,
      minPoints,
      solveDecayFactor,
    } = body;

    if (!title || !title.trim()) {
      return NextResponse.json({ error: "Title is required." }, { status: 400 });
    }
    if (!flag || !flag.trim()) {
      return NextResponse.json({ error: "Flag is required." }, { status: 400 });
    }
    if (!points || typeof points !== "number" || points < 1) {
      return NextResponse.json({ error: "Points must be a positive number." }, { status: 400 });
    }

    // Hash the flag server-side — plaintext is NEVER stored
    const flagHash = hashFlag(flag);

    const challenge = await EventChallenge.create({
      eventId: id,
      title: title.trim(),
      descriptionMarkdown: descriptionMarkdown ?? "",
      images: images ?? [],
      attachmentUrl: attachmentUrl ?? null,
      category: category ?? "Misc",
      points,
      difficulty: difficulty ?? "medium",
      flagHash,
      unlockAfterChallengeId: unlockAfterChallengeId ?? null,
      releaseAt: releaseAt ? new Date(releaseAt) : null,
      order: order ?? 0,
      maxPoints: maxPoints ?? null,
      minPoints: minPoints ?? null,
      solveDecayFactor: solveDecayFactor ?? 0,
    });

    // Don't return flagHash in response
    const { flagHash: _removed, ...safeChallenge } = challenge.toObject();
    void _removed;

    return NextResponse.json({ challenge: safeChallenge }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/events/[id]/challenges]", err);
    return NextResponse.json({ error: "Failed to create challenge." }, { status: 500 });
  }
}
