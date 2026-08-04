import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { requireAdminOrHost } from "@/lib/eventAuth";
import { Event } from "@/models/Event";
import { EventAnnouncement } from "@/models/EventAnnouncement";
import { EventRegistration } from "@/models/EventRegistration";
import { pusherServer } from "@/lib/pusher";
import { sendPushToUser } from "@/lib/push";

// GET /api/events/[id]/announcements — public list
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await connectToDatabase();

    const announcements = await EventAnnouncement.find({ eventId: id })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    return NextResponse.json({ announcements });
  } catch (err) {
    console.error("[GET /api/events/[id]/announcements]", err);
    return NextResponse.json({ error: "Failed to fetch announcements." }, { status: 500 });
  }
}

// POST /api/events/[id]/announcements — create announcement (host/admin)
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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
    const { title, body: announcementBody, content, isPinned, pinnedUntil, sendPush } = body;

    const finalTitle = title?.trim() || "Event Announcement";
    const finalBody = announcementBody || content || "";

    if (!finalBody && !title) {
      return NextResponse.json({ error: "Announcement text is required." }, { status: 400 });
    }

    const announcement = await EventAnnouncement.create({
      eventId: id,
      title: finalTitle,
      body: finalBody,
      pinnedUntil: isPinned ? new Date(Date.now() + 7 * 86400000) : pinnedUntil ? new Date(pinnedUntil) : null,
      createdBy: check.userId,
    });

    // ── Pusher realtime broadcast to arena ──
    await pusherServer.trigger(`event-${id}-announcements`, "new-announcement", {
      _id: announcement._id.toString(),
      title: announcement.title,
      body: announcement.body,
      createdAt: announcement.createdAt,
      pinnedUntil: announcement.pinnedUntil,
    });

    // ── Optional Web Push notifications to all registered participants ──
    if (sendPush) {
      const registrations = await EventRegistration.find({ eventId: id })
        .select("userId")
        .lean();

      const pushPayload = {
        title: `Announcement: ${event.name}`,
        body: finalTitle ? `${finalTitle} - ${finalBody.slice(0, 80)}` : finalBody.slice(0, 100),
        link: `/events/${event.slug}`,
      };

      for (const reg of registrations) {
        await sendPushToUser(reg.userId.toString(), pushPayload).catch(() => {});
      }
    }

    return NextResponse.json({ announcement }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/events/[id]/announcements]", err);
    return NextResponse.json({ error: "Failed to create announcement." }, { status: 500 });
  }
}