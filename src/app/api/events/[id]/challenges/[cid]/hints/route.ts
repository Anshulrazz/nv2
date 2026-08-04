import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { Event } from "@/models/Event";
import { EventHint } from "@/models/EventHint";
import { EventHintUnlock } from "@/models/EventHintUnlock";
import { requireAdminOrHost } from "@/lib/eventAuth";

// GET /api/events/[id]/challenges/[cid]/hints — participant/host view
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string; cid: string }> }
) {
  try {
    const { id, cid } = await params;
    const session = await auth();
    const userId = session?.user?.id;
    const role = session?.user?.role ?? "user";

    await connectToDatabase();

    const hints = await EventHint.find({ challengeId: cid, eventId: id })
      .sort({ order: 1 })
      .lean();

    const event = await Event.findById(id).select("createdBy hostIds").lean();
    const isHost =
      role === "admin" ||
      (event &&
        (event.createdBy?.toString() === userId ||
          event.hostIds?.some((h: { toString: () => string }) => h.toString() === userId)));

    if (isHost || !userId) {
      // Hosts see all hints with full text
      return NextResponse.json({ hints });
    }

    // Participant: check which hints this user has unlocked
    const unlocks = await EventHintUnlock.find({
      challengeId: cid,
      eventId: id,
      userId,
    })
      .select("hintId")
      .lean();

    const unlockedSet = new Set(unlocks.map((u) => u.hintId.toString()));

    const safeHints = hints.map((h) => {
      const unlocked = unlockedSet.has(h._id.toString());
      return {
        _id: h._id,
        pointsDeducted: h.pointsDeducted,
        order: h.order,
        unlocked,
        // Text withheld unless unlocked
        text: unlocked ? h.text : undefined,
      };
    });

    return NextResponse.json({ hints: safeHints });
  } catch (err) {
    console.error("[GET /api/events/[id]/challenges/[cid]/hints]", err);
    return NextResponse.json({ error: "Failed to fetch hints." }, { status: 500 });
  }
}

// POST /api/events/[id]/challenges/[cid]/hints — create hint (host/admin)
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string; cid: string }> }
) {
  try {
    const { id, cid } = await params;
    const session = await auth();
    await connectToDatabase();

    const event = await Event.findById(id).select("createdBy hostIds").lean();
    if (!event) {
      return NextResponse.json({ error: "Event not found." }, { status: 404 });
    }

    const check = requireAdminOrHost(session, event);
    if (!check.ok) {
      return NextResponse.json({ error: check.error }, { status: check.status });
    }

    const body = await req.json();
    const { text, pointsDeducted, order } = body;

    if (!text || !text.trim()) {
      return NextResponse.json({ error: "Hint text is required." }, { status: 400 });
    }

    const hint = await EventHint.create({
      challengeId: cid,
      eventId: id,
      text: text.trim(),
      pointsDeducted: pointsDeducted ?? 0,
      order: order ?? 0,
    });

    return NextResponse.json({ hint }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/events/[id]/challenges/[cid]/hints]", err);
    return NextResponse.json({ error: "Failed to create hint." }, { status: 500 });
  }
}
