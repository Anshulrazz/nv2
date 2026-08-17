import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { Event } from "@/models/Event";
import { requireAdminOrHost } from "@/lib/eventAuth";

// GET /api/events/[id] — detail by MongoDB _id or slug
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await connectToDatabase();
    const session = await auth();
    const role = session?.user?.role ?? "user";
    const userId = session?.user?.id;

    // Try by _id first, then by slug
    const isObjectId = /^[a-f\d]{24}$/i.test(id);
    const event = isObjectId
      ? await Event.findById(id).lean()
      : await Event.findOne({ slug: id }).lean();

    if (!event) {
      return NextResponse.json({ error: "Event not found." }, { status: 404 });
    }

    // Non-admin, non-host: hide draft/archived events
    const isHost =
      role === "admin" ||
      event.createdBy?.toString() === userId ||
      event.hostIds?.some((h: { toString: () => string }) => h.toString() === userId);

    if (!isHost && !["published", "live", "ended"].includes(event.status)) {
      return NextResponse.json({ error: "Event not found." }, { status: 404 });
    }

    return NextResponse.json({ event });
  } catch (err) {
    console.error("[GET /api/events/[id]]", err);
    return NextResponse.json({ error: "Failed to fetch event." }, { status: 500 });
  }
}

// PATCH /api/events/[id] — update (host/admin only)
export async function PATCH(
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

    // Prevent status mutation via PATCH (use /publish endpoint instead)
    delete body.status;
    delete body.createdBy;
    delete body.slug; // slug is immutable after creation

    // Date re-validation if dates are being updated
    const patchedRegStart = body.registrationStart
      ? new Date(body.registrationStart)
      : event.registrationStart;
    const patchedRegEnd = body.registrationEnd
      ? new Date(body.registrationEnd)
      : event.registrationEnd;
    const patchedEvStart = body.eventStart ? new Date(body.eventStart) : event.eventStart;
    const patchedEvEnd = body.eventEnd ? new Date(body.eventEnd) : event.eventEnd;

    if (patchedRegStart >= patchedRegEnd) {
      return NextResponse.json(
        { error: "registrationStart must be before registrationEnd." },
        { status: 400 }
      );
    }
    if (patchedRegEnd > patchedEvStart) {
      return NextResponse.json(
        { error: "registrationEnd must be on or before eventStart." },
        { status: 400 }
      );
    }
    if (patchedEvStart >= patchedEvEnd) {
      return NextResponse.json(
        { error: "eventStart must be before eventEnd." },
        { status: 400 }
      );
    }

    Object.assign(event, body);
    if (typeof body.isPrizeRevealed === "boolean") {
      event.isPrizeRevealed = body.isPrizeRevealed;
      event.prizeRevealedAt = body.isPrizeRevealed ? (event.prizeRevealedAt || new Date()) : null;
    }
    event.registrationStart = patchedRegStart;
    event.registrationEnd = patchedRegEnd;
    event.eventStart = patchedEvStart;
    event.eventEnd = patchedEvEnd;
    await event.save();

    return NextResponse.json({ event });
  } catch (err) {
    console.error("[PATCH /api/events/[id]]", err);
    return NextResponse.json({ error: "Failed to update event." }, { status: 500 });
  }
}
