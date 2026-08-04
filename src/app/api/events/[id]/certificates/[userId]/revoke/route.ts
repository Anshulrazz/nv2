import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { Event } from "@/models/Event";
import { Certificate } from "@/models/Certificate";
import { requireAdminOrHost } from "@/lib/eventAuth";

// POST /api/events/[id]/certificates/[userId]/revoke
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string; userId: string }> }
) {
  try {
    const { id, userId: targetUserId } = await params;
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

    const body = await req.json();
    const { reason } = body;

    const cert = await Certificate.findOne({ eventId: id, userId: targetUserId });
    if (!cert) {
      return NextResponse.json({ error: "Certificate not found." }, { status: 404 });
    }

    cert.revoked = true;
    cert.revokedReason = reason || "Revoked by event host.";
    await cert.save();

    return NextResponse.json({ success: true, certificate: cert });
  } catch (err) {
    console.error("[POST /api/events/[id]/certificates/[userId]/revoke]", err);
    return NextResponse.json({ error: "Revocation failed." }, { status: 500 });
  }
}
