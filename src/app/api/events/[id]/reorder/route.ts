import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { Event } from "@/models/Event";
import { Challenge } from "@/models/Challenge";
import { User } from "@/models/User";
import { isValidObjectId } from "@/lib/validation";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
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
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { challengeIds } = await req.json();
    if (!Array.isArray(challengeIds) || challengeIds.length === 0) {
      return NextResponse.json({ error: "challengeIds array is required" }, { status: 400 });
    }

    const validObjectIds = challengeIds.filter((cid) => isValidObjectId(cid));
    event.challengeOrder = validObjectIds;
    await event.save();

    // Update order property on each challenge
    for (let i = 0; i < validObjectIds.length; i++) {
      await Challenge.updateOne({ _id: validObjectIds[i], eventId: event._id }, { order: i + 1 });
    }

    return NextResponse.json({ message: "Challenge sequence reordered successfully!", challengeOrder: event.challengeOrder });
  } catch (error) {
    console.error("PATCH /api/events/[id]/reorder error:", error);
    return NextResponse.json({ error: "Failed to reorder challenges" }, { status: 500 });
  }
}
