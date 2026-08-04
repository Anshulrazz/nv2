import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { Event } from "@/models/Event";
import { EventTeam } from "@/models/EventTeam";
import { EventRegistration } from "@/models/EventRegistration";

// GET /api/events/[id]/teams — list teams (e.g. looking for members)
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const lookingForMembers = searchParams.get("lookingForMembers");

    await connectToDatabase();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filter: Record<string, any> = { eventId: id };
    if (lookingForMembers === "true") {
      filter.lookingForMembers = true;
    }

    const teams = await EventTeam.find(filter)
      .populate("leaderUserId", "name username image")
      .populate("memberUserIds", "name username image")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ teams });
  } catch (err) {
    console.error("[GET /api/events/[id]/teams]", err);
    return NextResponse.json({ error: "Failed to fetch teams." }, { status: 500 });
  }
}

// POST /api/events/[id]/teams — create a team
export async function POST(
  req: Request,
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

    const event = await Event.findById(id).select("teamMode maxTeamSize status").lean();
    if (!event) {
      return NextResponse.json({ error: "Event not found." }, { status: 404 });
    }

    if (!event.teamMode) {
      return NextResponse.json({ error: "This event is not in team mode." }, { status: 400 });
    }

    const registration = await EventRegistration.findOne({ eventId: id, userId });
    if (!registration) {
      return NextResponse.json({ error: "You are not registered for this event." }, { status: 403 });
    }

    if (registration.teamId) {
      return NextResponse.json({ error: "You are already in a team for this event." }, { status: 400 });
    }

    const body = await req.json();
    const { teamName, lookingForMembers } = body;

    if (!teamName || typeof teamName !== "string" || !teamName.trim()) {
      return NextResponse.json({ error: "Team name is required." }, { status: 400 });
    }

    // Check unique team name per event
    const existing = await EventTeam.findOne({
      eventId: id,
      teamName: { $regex: `^${teamName.trim()}$`, $options: "i" },
    });
    if (existing) {
      return NextResponse.json({ error: "Team name is already taken." }, { status: 409 });
    }

    const team = await EventTeam.create({
      eventId: id,
      teamName: teamName.trim(),
      leaderUserId: userId,
      memberUserIds: [userId],
      lookingForMembers: lookingForMembers ?? true,
    });

    // Update registration with teamId
    registration.teamId = team._id;
    await registration.save();

    return NextResponse.json({ team }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/events/[id]/teams]", err);
    return NextResponse.json({ error: "Failed to create team." }, { status: 500 });
  }
}
