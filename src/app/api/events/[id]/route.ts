import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { Event } from "@/models/Event";
import { Challenge } from "@/models/Challenge";
import { EventRegistration } from "@/models/EventRegistration";
import { Attempt } from "@/models/Attempt";
import { Run } from "@/models/Run";
import { LeaderboardSnapshot } from "@/models/LeaderboardSnapshot";
import { Certificate } from "@/models/Certificate";
import { User } from "@/models/User";
import { isValidObjectId } from "@/lib/validation";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: identifier } = await params;
    await connectToDatabase();

    let event = null;
    if (isValidObjectId(identifier)) {
      event = await Event.findById(identifier).populate("createdBy", "name email image role").lean();
    } else {
      event = await Event.findOne({ slug: identifier }).populate("createdBy", "name email image role").lean();
    }

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const session = await auth();
    const userId = session?.user?.id;
    let isOwnerOrAdmin = false;

    if (userId) {
      const user = await User.findById(userId).select("role").lean();
      isOwnerOrAdmin = event.createdBy._id.toString() === userId || user?.role === "admin";
    }

    // Public users can only see published/live/ended events (teachers/admins can see draft)
    if (event.status === "draft" && !isOwnerOrAdmin) {
      return NextResponse.json({ error: "Event not published yet" }, { status: 403 });
    }

    return NextResponse.json({ event, canManage: isOwnerOrAdmin });
  } catch (error) {
    console.error("GET /api/events/[id] error:", error);
    return NextResponse.json({ error: "Failed to fetch event" }, { status: 500 });
  }
}

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
      return NextResponse.json({ error: "Forbidden: Only event owner or admin can edit event." }, { status: 403 });
    }

    const body = await req.json();
    const allowedFields = [
      "title",
      "description",
      "bannerUrl",
      "category",
      "status",
      "registrationStart",
      "registrationEnd",
      "eventStart",
      "eventEnd",
      "maxParticipants",
      "isPaid",
      "entryFeeINR",
      "rules",
      "certificate",
    ];

    allowedFields.forEach((field) => {
      if (body[field] !== undefined) {
        if (field.endsWith("Start") || field.endsWith("End")) {
          (event as unknown as Record<string, unknown>)[field] = new Date(body[field]);
        } else {
          (event as unknown as Record<string, unknown>)[field] = body[field];
        }
      }
    });

    event.updatedAt = new Date();
    await event.save();

    return NextResponse.json({ message: "Event updated successfully", event });
  } catch (error: unknown) {
    console.error("PATCH /api/events/[id] error:", error);
    const msg = error instanceof Error ? error.message : "Failed to update event";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
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
      return NextResponse.json({ error: "Forbidden: Only event owner or admin can delete event." }, { status: 403 });
    }

    const eventId = event._id;

    // Cascade deletion per Notexia rule: deleting an event deletes dependent challenges, registrations, attempts, runs, snapshots & certificates
    await Challenge.deleteMany({ eventId });
    await EventRegistration.deleteMany({ eventId });
    await Attempt.deleteMany({ eventId });
    await Run.deleteMany({ eventId });
    await LeaderboardSnapshot.deleteMany({ eventId });
    await Certificate.deleteMany({ eventId });
    await Event.deleteOne({ _id: eventId });

    return NextResponse.json({ message: "🗑️ Event and all associated challenges, runs, and records deleted successfully!" });
  } catch (error: unknown) {
    console.error("DELETE /api/events/[id] error:", error);
    const msg = error instanceof Error ? error.message : "Failed to delete event";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
