import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { Event } from "@/models/Event";
import { EventRegistration } from "@/models/EventRegistration";
import { requireAdminOrHost } from "@/lib/eventAuth";
import { pusherServer } from "@/lib/pusher";

// POST /api/events/[id]/participants/[userId]/disqualify
export async function POST(
  req: Request,
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

    const body = await req.json();
    const { reason } = body;

    const registration = await EventRegistration.findOne({
      eventId: id,
      userId: targetUserId,
    });

    if (!registration) {
      return NextResponse.json({ error: "Participant not found." }, { status: 404 });
    }

    registration.isDisqualified = true;
    registration.disqualifiedReason = reason ?? "Disqualified by host.";
    registration.disqualifiedAt = new Date();
    await registration.save();

    // Push to user's private channel to lock their arena immediately
    await pusherServer.trigger(`private-user-${targetUserId}`, "disqualified", {
      eventId: id,
      reason: registration.disqualifiedReason,
    });

    // Push to leaderboard channel to refresh everyone else's view
    await pusherServer.trigger(`event-${id}-leaderboard`, "participant-dq", {
      userId: targetUserId,
      codename: registration.codename,
    });

    return NextResponse.json({ success: true, registration });
  } catch (err) {
    console.error("[POST /api/events/[id]/participants/[userId]/disqualify]", err);
    return NextResponse.json({ error: "Disqualification failed." }, { status: 500 });
  }
}