import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { Event } from "@/models/Event";
import { requireAdminOrHost } from "@/lib/eventAuth";
import mongoose from "mongoose";

// POST /api/events/[id]/price-reveal — toggle or set prize/price reveal (host/admin only)
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    await connectToDatabase();

    const isObjectId = mongoose.Types.ObjectId.isValid(id);
    const event = isObjectId
      ? await Event.findById(id)
      : await Event.findOne({ slug: id });

    if (!event) {
      return NextResponse.json({ error: "Event not found." }, { status: 404 });
    }

    const check = requireAdminOrHost(session, event);
    if (!check.ok) {
      return NextResponse.json({ error: check.error }, { status: check.status });
    }

    let revealExplicit: boolean | undefined;
    try {
      const body = await req.json();
      if (typeof body.reveal === "boolean") {
        revealExplicit = body.reveal;
      }
    } catch {
      // Empty or non-JSON body: toggle current state
    }

    const newRevealedState =
      typeof revealExplicit === "boolean" ? revealExplicit : !event.isPrizeRevealed;

    event.isPrizeRevealed = newRevealedState;
    event.prizeRevealedAt = newRevealedState ? new Date() : null;
    await event.save();

    return NextResponse.json({
      isPrizeRevealed: event.isPrizeRevealed,
      prizeRevealedAt: event.prizeRevealedAt,
      event,
    });
  } catch (err) {
    console.error("[POST /api/events/[id]/price-reveal]", err);
    return NextResponse.json({ error: "Failed to update price reveal status." }, { status: 500 });
  }
}
