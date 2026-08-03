import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Certificate } from "@/models/Certificate";
import { Event } from "@/models/Event";
import { User } from "@/models/User";
import { isValidObjectId } from "@/lib/validation";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: certificateId } = await params;
    await connectToDatabase();

    let cert = null;

    // 1. Check if format is eventId_userId
    if (certificateId.includes("_")) {
      const [eventId, userId] = certificateId.split("_");
      if (isValidObjectId(eventId) && isValidObjectId(userId)) {
        cert = await Certificate.findOne({ eventId, userId });
      }
    }

    // 2. Lookup by ObjectId or URL match
    if (!cert) {
      if (isValidObjectId(certificateId)) {
        cert = await Certificate.findById(certificateId);
      } else {
        cert = await Certificate.findOne({ certificateUrl: { $regex: certificateId } });
      }
    }

    if (!cert) {
      return NextResponse.json({ error: "CTF Certificate not found" }, { status: 404 });
    }

    const event = await Event.findById(cert.eventId).select("title category bannerUrl rules").lean();
    const user = await User.findById(cert.userId).select("name email image").lean();

    return NextResponse.json({
      certificateId: cert._id.toString(),
      displayName: cert.displayName || user?.name || "Competitor",
      eventTitle: event?.title || "Notexia Cyber CTF Event",
      category: event?.category || "Web Security",
      rank: cert.rank,
      issuedAt: cert.issuedAt,
      certificateUrl: cert.certificateUrl,
    });
  } catch (error) {
    console.error("GET /api/events/certificates/[id] error:", error);
    return NextResponse.json({ error: "Failed to fetch CTF certificate" }, { status: 500 });
  }
}
