import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { Event } from "@/models/Event";
import { Certificate } from "@/models/Certificate";
import { requireAdminOrHost } from "@/lib/eventAuth";

// GET /api/events/[id]/certificates/list — host/admin list all event certs
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    await connectToDatabase();

    const event = await Event.findById(id).select("createdBy hostIds").lean();
    if (!event) {
      return NextResponse.json({ error: "Event not found." }, { status: 404 });
    }

    const check = requireAdminOrHost(session, event);
    if (!check.ok) {
      return NextResponse.json({ error: check.error }, { status: check.status });
    }

    const certificates = await Certificate.find({ eventId: id })
      .sort({ rank: 1, issuedAt: -1 })
      .lean();

    return NextResponse.json({ certificates });
  } catch (err) {
    console.error("[GET /api/events/[id]/certificates/list]", err);
    return NextResponse.json({ error: "Failed to list certificates." }, { status: 500 });
  }
}
