import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { Event } from "@/models/Event";
import { requireAdminOrHost } from "@/lib/eventAuth";

// POST /api/events/[id]/publish — flip draft → published (host/admin only)
export async function POST(
  _req: Request,
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

    if (event.status !== "draft") {
      return NextResponse.json(
        { error: `Cannot publish: event is currently '${event.status}'.` },
        { status: 400 }
      );
    }

    event.status = "published";
    await event.save();

    return NextResponse.json({ event });
  } catch (err) {
    console.error("[POST /api/events/[id]/publish]", err);
    return NextResponse.json({ error: "Failed to publish event." }, { status: 500 });
  }
}
