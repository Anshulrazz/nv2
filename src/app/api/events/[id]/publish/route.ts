import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { Event } from "@/models/Event";
import { Challenge } from "@/models/Challenge";
import { User } from "@/models/User";
import { isValidObjectId } from "@/lib/validation";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: identifier } = await params;
    await connectToDatabase();

    let event = null;
    if (isValidObjectId(identifier)) {
      event = await Event.findById(identifier);
    } else {
      event = await Event.findOne({ slug: identifier });
    }

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const user = await User.findById(userId).select("role").lean();
    const isOwner = event.createdBy.toString() === userId;
    const isAdmin = user?.role === "admin";

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: "Forbidden: Only event owner or admin can publish." }, { status: 403 });
    }

    // Validation: Require at least 1 challenge
    const challengeCount = await Challenge.countDocuments({ eventId: event._id });
    if (challengeCount < 1) {
      return NextResponse.json(
        { error: "Cannot publish event: Event must contain at least 1 challenge." },
        { status: 400 }
      );
    }

    // Validate dates
    if (new Date(event.registrationEnd) > new Date(event.eventStart)) {
      return NextResponse.json(
        { error: "Validation failed: Registration end date must be before or equal to event start date." },
        { status: 400 }
      );
    }
    if (new Date(event.eventStart) >= new Date(event.eventEnd)) {
      return NextResponse.json(
        { error: "Validation failed: Event start date must be before event end date." },
        { status: 400 }
      );
    }

    event.status = "published";
    event.updatedAt = new Date();
    await event.save();

    return NextResponse.json({ message: "🎉 Event published successfully!", event });
  } catch (error) {
    console.error("POST /api/events/[id]/publish error:", error);
    return NextResponse.json({ error: "Failed to publish event" }, { status: 500 });
  }
}
