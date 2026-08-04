import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { EventRegistration } from "@/models/EventRegistration";
import { EventTeam } from "@/models/EventTeam";
import { TeamJoinRequest } from "@/models/TeamJoinRequest";

// POST /api/events/[id]/teams/[teamId]/join-request
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string; teamId: string }> }
) {
  try {
    const { id, teamId } = await params;
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }
    const userId = session.user.id;

    await connectToDatabase();

    const reg = await EventRegistration.findOne({ eventId: id, userId });
    if (!reg) {
      return NextResponse.json({ error: "Not registered for this event." }, { status: 403 });
    }
    if (reg.teamId) {
      return NextResponse.json({ error: "You are already in a team." }, { status: 400 });
    }

    const team = await EventTeam.findById(teamId);
    if (!team || team.eventId.toString() !== id) {
      return NextResponse.json({ error: "Team not found." }, { status: 404 });
    }

    // Idempotent join request
    const existing = await TeamJoinRequest.findOne({ teamId, fromUserId: userId });
    if (existing) {
      return NextResponse.json({
        message: `Request is currently '${existing.status}'.`,
        request: existing,
      });
    }

    const joinRequest = await TeamJoinRequest.create({
      eventId: id,
      teamId,
      fromUserId: userId,
      status: "pending",
    });

    return NextResponse.json({ request: joinRequest }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/events/[id]/teams/[teamId]/join-request]", err);
    return NextResponse.json({ error: "Failed to send join request." }, { status: 500 });
  }
}
