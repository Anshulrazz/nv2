import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { Event } from "@/models/Event";
import { EventHint } from "@/models/EventHint";
import { EventHintUnlock } from "@/models/EventHintUnlock";
import { EventRegistration } from "@/models/EventRegistration";

// POST /api/events/[id]/hints/[hintId]/unlock
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string; hintId: string }> }
) {
  try {
    const { id, hintId } = await params;
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }
    const userId = session.user.id;

    await connectToDatabase();

    const event = await Event.findById(id).select("eventStart eventEnd status").lean();
    if (!event) {
      return NextResponse.json({ error: "Event not found." }, { status: 404 });
    }

    const now = new Date();
    if (now < new Date(event.eventStart as Date) || now > new Date(event.eventEnd as Date)) {
      return NextResponse.json({ error: "Event is not active." }, { status: 403 });
    }

    const reg = await EventRegistration.findOne({
      eventId: id,
      userId,
      paymentStatus: { $in: ["not_required", "paid"] },
      isDisqualified: false,
    });
    if (!reg) {
      return NextResponse.json({ error: "Not registered or disqualified." }, { status: 403 });
    }

    const hint = await EventHint.findById(hintId);
    if (!hint || hint.eventId.toString() !== id) {
      return NextResponse.json({ error: "Hint not found." }, { status: 404 });
    }

    // ── Idempotent unlock check ───────────────────────────────────────────
    const existingUnlock = await EventHintUnlock.findOne({ hintId, userId });
    if (existingUnlock) {
      return NextResponse.json({
        unlocked: true,
        text: hint.text,
        alreadyUnlocked: true,
        pointsDeducted: 0,
      });
    }

    // Create unlock record
    const unlock = await EventHintUnlock.create({
      hintId,
      challengeId: hint.challengeId,
      eventId: id,
      userId,
      teamId: reg.teamId ?? null,
      pointsDeducted: hint.pointsDeducted,
    });

    return NextResponse.json({
      unlocked: true,
      text: hint.text,
      pointsDeducted: unlock.pointsDeducted,
      alreadyUnlocked: false,
    });
  } catch (err: unknown) {
    console.error("[POST /api/events/[id]/hints/[hintId]/unlock]", err);
    if (
      typeof err === "object" &&
      err !== null &&
      "code" in err &&
      (err as { code: number }).code === 11000
    ) {
      // Race condition idempotency fallback
      const hint = await EventHint.findById((await params).hintId);
      return NextResponse.json({
        unlocked: true,
        text: hint?.text ?? "",
        alreadyUnlocked: true,
        pointsDeducted: 0,
      });
    }
    return NextResponse.json({ error: "Unlock failed." }, { status: 500 });
  }
}
