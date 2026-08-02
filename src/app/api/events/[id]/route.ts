import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { Event } from "@/models/Event";
import { EventRegistration } from "@/models/EventRegistration";
import { EventSubmission } from "@/models/EventSubmission";
import { User } from "@/models/User";
import { isValidObjectId } from "@/lib/validation";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await auth();
    const currentUserId = session?.user?.id;

    await connectToDatabase();

    let event = null;
    if (isValidObjectId(id)) {
      event = await Event.findById(id).populate("hostId", "name email image role bio").lean();
    } else {
      event = await Event.findOne({ slug: id }).populate("hostId", "name email image role bio").lean();
    }

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const participantCount = await EventRegistration.countDocuments({ eventId: event._id });

    let isJoined = false;
    let registration = null;
    let submission = null;

    if (currentUserId) {
      registration = await EventRegistration.findOne({
        eventId: event._id,
        userId: currentUserId,
      }).lean();
      isJoined = !!registration;

      if (event.eventType === "hackathon") {
        submission = await EventSubmission.findOne({
          eventId: event._id,
          userId: currentUserId,
        }).lean();
      }
    }

    const isHost = currentUserId
      ? (event.hostId as unknown as { _id?: string })?._id?.toString() === currentUserId ||
        (event.hostId as unknown as string)?.toString() === currentUserId
      : false;

    // Check if current user is admin
    let isAdmin = false;
    if (currentUserId) {
      const user = await User.findById(currentUserId).select("role").lean();
      isAdmin = user?.role === "admin";
    }

    const canManage = isHost || isAdmin;

    // Sanitize secret flags for non-hosts/admins
    const sanitizedChallenges = (event.challenges || []).map((ch: { _id?: unknown; title: string; description: string; category?: string; points: number; flag?: string; hints?: string[]; imageUrl?: string }) => {
      const { flag: _flag, ...rest } = ch;
      return canManage ? ch : rest;
    });

    return NextResponse.json({
      event: {
        ...event,
        challenges: sanitizedChallenges,
        participantCount,
        isJoined,
        isHost,
        canManage,
        userRegistration: registration,
        userSubmission: submission,
      },
    });
  } catch (error) {
    console.error("GET /api/events/[id] error:", error);
    return NextResponse.json({ error: "Failed to fetch event details" }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    await connectToDatabase();

    const event = await Event.findById(id);
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const user = await User.findById(userId).select("role").lean();
    const isHost = event.hostId.toString() === userId;
    const isAdmin = user?.role === "admin";

    if (!isHost && !isAdmin) {
      return NextResponse.json({ error: "Only the host or admin can edit this event." }, { status: 403 });
    }

    const body = await req.json();
    const {
      title,
      description,
      shortDescription,
      bannerImage,
      eventType,
      isPaid,
      priceINR,
      mode,
      location,
      meetingLink,
      startDate,
      endDate,
      registrationDeadline,
      maxParticipants,
      tags,
      problemStatement,
      prizes,
      status,
    } = body;

    if (title) event.title = title.trim();
    if (description) event.description = description;
    if (shortDescription !== undefined) event.shortDescription = shortDescription;
    if (bannerImage !== undefined) event.bannerImage = bannerImage;
    if (eventType) event.eventType = eventType;
    if (isPaid !== undefined) event.isPaid = Boolean(isPaid);
    if (priceINR !== undefined) event.priceINR = Math.max(0, Number(priceINR));
    if (mode) event.mode = mode;
    if (location !== undefined) event.location = location;
    if (meetingLink !== undefined) event.meetingLink = meetingLink;
    if (startDate) event.startDate = new Date(startDate);
    if (endDate) event.endDate = new Date(endDate);
    if (registrationDeadline) event.registrationDeadline = new Date(registrationDeadline);
    if (maxParticipants !== undefined) event.maxParticipants = maxParticipants ? Number(maxParticipants) : null;
    if (tags && Array.isArray(tags)) event.tags = tags;
    if (problemStatement !== undefined) event.problemStatement = problemStatement;
    if (prizes !== undefined) event.prizes = prizes;
    if (status) event.status = status;

    await event.save();

    return NextResponse.json({ message: "Event updated successfully", event });
  } catch (error) {
    console.error("PUT /api/events/[id] error:", error);
    return NextResponse.json({ error: "Failed to update event" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    await connectToDatabase();

    const event = await Event.findById(id);
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const user = await User.findById(userId).select("role").lean();
    const isHost = event.hostId.toString() === userId;
    const isAdmin = user?.role === "admin";

    if (!isHost && !isAdmin) {
      return NextResponse.json({ error: "Only the host or admin can delete this event." }, { status: 403 });
    }

    // Cascade delete dependent documents (Registrations & Submissions)
    await EventRegistration.deleteMany({ eventId: event._id });
    await EventSubmission.deleteMany({ eventId: event._id });
    await Event.findByIdAndDelete(event._id);

    return NextResponse.json({ message: "Event deleted successfully along with dependent data" });
  } catch (error) {
    console.error("DELETE /api/events/[id] error:", error);
    return NextResponse.json({ error: "Failed to delete event" }, { status: 500 });
  }
}
