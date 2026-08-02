import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Event } from "@/models/Event";
import { LeaderboardSnapshot } from "@/models/LeaderboardSnapshot";
import { updateLeaderboardSnapshot } from "@/lib/ctf-leaderboard";
import { isValidObjectId } from "@/lib/validation";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: identifier } = await params;
    await connectToDatabase();

    let event = null;
    if (isValidObjectId(identifier)) {
      event = await Event.findById(identifier).select("_id title").lean();
    } else {
      event = await Event.findOne({ slug: identifier }).select("_id title").lean();
    }

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    let snapshot = await LeaderboardSnapshot.findOne({ eventId: event._id }).lean();
    if (!snapshot) {
      snapshot = await updateLeaderboardSnapshot(event._id.toString());
    }

    return NextResponse.json({
      eventId: event._id,
      eventTitle: event.title,
      entries: snapshot.entries || [],
      updatedAt: snapshot.updatedAt,
    });
  } catch (error) {
    console.error("GET leaderboard error:", error);
    return NextResponse.json({ error: "Failed to fetch leaderboard" }, { status: 500 });
  }
}
