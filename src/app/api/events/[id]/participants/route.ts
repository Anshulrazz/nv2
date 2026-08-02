import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { Event } from "@/models/Event";
import { EventRegistration } from "@/models/EventRegistration";
import { User } from "@/models/User";
import { isValidObjectId } from "@/lib/validation";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: eventId } = await params;
    await connectToDatabase();

    let event = null;
    if (isValidObjectId(eventId)) {
      event = await Event.findById(eventId);
    } else {
      event = await Event.findOne({ slug: eventId });
    }

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const user = await User.findById(userId).select("role").lean();
    const isHost = event.hostId.toString() === userId;
    const isAdmin = user?.role === "admin";

    if (!isHost && !isAdmin) {
      return NextResponse.json({ error: "Forbidden: Only event host can view participants list." }, { status: 403 });
    }

    const participants = await EventRegistration.find({ eventId: event._id })
      .populate("userId", "name email image role points coins createdAt")
      .sort({ registeredAt: -1 })
      .lean();

    return NextResponse.json({
      participants,
      totalCount: participants.length,
    });
  } catch (error) {
    console.error("GET /api/events/[id]/participants error:", error);
    return NextResponse.json({ error: "Failed to fetch participants" }, { status: 500 });
  }
}
