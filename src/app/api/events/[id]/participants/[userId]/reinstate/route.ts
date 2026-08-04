import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { Event } from "@/models/Event";
import { EventRegistration } from "@/models/EventRegistration";
import { requireAdminOrHost } from "@/lib/eventAuth";
import { pusherServer } from "@/lib/pusher";

// POST /api/events/[id]/participants/[userId]/reinstate
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string; userId: string }> }
) {
  try {
    const { id, userId: targetUserId } = await params;
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

    const registration = await EventRegistration.findOne({
      eventId: id,
      userId: targetUserId,
    });

    if (!registration) {
      return NextResponse.json({ error: "Participant not found." }, { status: 404 });
    }

    registration.isDisqualified = false;
    registration.disqualifiedReason = null;
    registration.disqualifiedAt = null;
    await registration.save();

    // Notify user and refresh leaderboard
    await pusherServer.trigger(`private-user-${targetUserId}`, "reinstated", {
      eventId: id,
    });

    await pusherServer.trigger(`event-${id}-leaderboard`, "participant-reinstated", {
      userId: targetUserId,
      codename: registration.codename,
    });

    return NextResponse.json({ success: true, registration });
  } catch (err) {
    console.error("[POST /api/events/[id]/participants/[userId]/reinstate]", err);
    return NextResponse.json({ error: "Reinstatement failed." }, { status: 500 });
  }
}