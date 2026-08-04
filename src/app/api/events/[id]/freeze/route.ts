import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { Event } from "@/models/Event";
import { requireAdminOrHost } from "@/lib/eventAuth";
import { pusherServer } from "@/lib/pusher";

// POST /api/events/[id]/freeze — freeze or unfreeze leaderboard
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
    const { freeze } = body; // boolean

    event.scoreFreezeAt = freeze ? new Date() : null;
    await event.save();

    // Trigger Pusher notification for leaderboard listeners
    await pusherServer.trigger(`event-${id}-leaderboard`, "freeze-status-change", {
      isFrozen: !!event.scoreFreezeAt,
      scoreFreezeAt: event.scoreFreezeAt,
    });

    return NextResponse.json({ event });
  } catch (err) {
    console.error("[POST /api/events/[id]/freeze]", err);
    return NextResponse.json({ error: "Failed to update freeze status." }, { status: 500 });
  }
}
