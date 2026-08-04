import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { Event } from "@/models/Event";
import { EventTeam } from "@/models/EventTeam";
import { EventRegistration } from "@/models/EventRegistration";
import { TeamJoinRequest } from "@/models/TeamJoinRequest";

// PATCH /api/events/[id]/teams/requests/[requestId] — leader accepts/rejects join request
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; requestId: string }> }
) {
  try {
    const { id, requestId } = await params;
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }
    const userId = session.user.id;

    await connectToDatabase();

    const joinRequest = await TeamJoinRequest.findById(requestId);
    if (!joinRequest || joinRequest.eventId.toString() !== id) {
      return NextResponse.json({ error: "Request not found." }, { status: 404 });
    }

    const team = await EventTeam.findById(joinRequest.teamId);
    if (!team) {
      return NextResponse.json({ error: "Team not found." }, { status: 404 });
    }

    // Only team leader can accept/reject
    if (team.leaderUserId.toString() !== userId) {
      return NextResponse.json({ error: "Only the team leader can manage join requests." }, { status: 403 });
    }

    const body = await req.json();
    const { action } = body; // 'accept' | 'reject'

    if (!["accept", "reject"].includes(action)) {
      return NextResponse.json({ error: "Invalid action." }, { status: 400 });
    }

    if (action === "reject") {
      joinRequest.status = "rejected";
      joinRequest.resolvedAt = new Date();
      await joinRequest.save();
      return NextResponse.json({ request: joinRequest });
    }

    // Check max team size
    const event = await Event.findById(id).select("maxTeamSize").lean();
    const maxTeamSize = event?.maxTeamSize ?? 4;

    if (team.memberUserIds.length >= maxTeamSize) {
      return NextResponse.json({ error: `Team capacity reached (${maxTeamSize} members max).` }, { status: 400 });
    }

    // Add user to team and update registration
    if (!team.memberUserIds.map((m: { toString: () => string }) => m.toString()).includes(joinRequest.fromUserId.toString())) {
      team.memberUserIds.push(joinRequest.fromUserId);
      if (team.memberUserIds.length >= maxTeamSize) {
        team.lookingForMembers = false;
      }
      await team.save();
    }

    await EventRegistration.updateOne(
      { eventId: id, userId: joinRequest.fromUserId },
      { $set: { teamId: team._id } }
    );

    joinRequest.status = "accepted";
    joinRequest.resolvedAt = new Date();
    await joinRequest.save();

    return NextResponse.json({ request: joinRequest, team });
  } catch (err) {
    console.error("[PATCH /api/events/[id]/teams/requests/[requestId]]", err);
    return NextResponse.json({ error: "Failed to resolve join request." }, { status: 500 });
  }
}
