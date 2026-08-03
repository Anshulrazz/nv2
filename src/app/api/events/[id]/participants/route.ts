import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { Event } from "@/models/Event";
import { EventRegistration } from "@/models/EventRegistration";
import { Attempt } from "@/models/Attempt";
import { Certificate } from "@/models/Certificate";
import { User } from "@/models/User";
import { isValidObjectId } from "@/lib/validation";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
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

    // Non-owners/non-admins get their own registration record
    const filter = isOwner || isAdmin ? { eventId: event._id } : { eventId: event._id, userId };

    // Fetch registrations matching filter
    const registrations = await EventRegistration.find(filter)
      .populate("userId", "name email image")
      .sort({ registeredAt: -1 })
      .lean();

    // Fetch all solved attempts for score summary
    const solvedAttempts = await Attempt.find({ eventId: event._id, status: "solved" }).lean();
    const userScoreMap = new Map<string, { totalPoints: number; solvedCount: number }>();
    solvedAttempts.forEach((att) => {
      const uid = att.userId.toString();
      const existing = userScoreMap.get(uid) || { totalPoints: 0, solvedCount: 0 };
      existing.totalPoints += att.pointsAwarded || 0;
      existing.solvedCount += 1;
      userScoreMap.set(uid, existing);
    });

    // Fetch all issued certificates for this event
    const issuedCerts = await Certificate.find({ eventId: event._id }).lean();
    const userCertMap = new Map<string, unknown>();
    issuedCerts.forEach((cert) => {
      userCertMap.set(cert.userId.toString(), cert);
    });

    const participants = registrations.map((reg) => {
      const uid = reg.userId?._id?.toString() || reg.userId?.toString();
      const scoreData = userScoreMap.get(uid) || { totalPoints: 0, solvedCount: 0 };
      const cert = userCertMap.get(uid) || null;

      return {
        _id: reg._id,
        user: reg.userId,
        displayName: reg.displayName,
        username: reg.username,
        paymentStatus: reg.paymentStatus,
        registeredAt: reg.registeredAt,
        totalPoints: scoreData.totalPoints,
        solvedCount: scoreData.solvedCount,
        certificate: cert,
      };
    });

    return NextResponse.json({
      event: {
        _id: event._id,
        title: event.title,
        slug: event.slug,
        status: event.status,
        maxParticipants: event.maxParticipants,
        isPaid: event.isPaid,
        entryFeeINR: event.entryFeeINR,
      },
      participants,
      totalCount: participants.length,
      issuedCertificateCount: issuedCerts.length,
    });
  } catch (error) {
    console.error("GET /api/events/[id]/participants error:", error);
    return NextResponse.json({ error: "Failed to fetch participants" }, { status: 500 });
  }
}
