import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { Event } from "@/models/Event";
import { EventRegistration } from "@/models/EventRegistration";
import { Certificate } from "@/models/Certificate";
import { requireAdminOrHost } from "@/lib/eventAuth";

// POST /api/events/[id]/certificates/generate
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    await connectToDatabase();

    const event = await Event.findById(id).select("name status createdBy hostIds").lean();
    if (!event) {
      return NextResponse.json({ error: "Event not found." }, { status: 404 });
    }

    const check = requireAdminOrHost(session, event);
    if (!check.ok) {
      return NextResponse.json({ error: check.error }, { status: check.status });
    }

    // Find all non-disqualified, active participants
    const registrations = await EventRegistration.find({
      eventId: id,
      paymentStatus: { $in: ["not_required", "paid"] },
      isDisqualified: false,
    })
      .sort({ finalScore: -1, registeredAt: 1 })
      .lean();

    if (registrations.length === 0) {
      return NextResponse.json(
        { message: "No eligible participants found for certificate generation.", createdCount: 0 }
      );
    }

    let createdCount = 0;

    for (let index = 0; index < registrations.length; index++) {
      const reg = registrations[index];

      // Upsert certificate idempotently
      await Certificate.findOneAndUpdate(
        { eventId: id, userId: reg.userId },
        {
          $setOnInsert: {
            eventId: id,
            userId: reg.userId,
            displayName: reg.realName || reg.codename,
            rank: reg.finalRank ?? index + 1,
            issuedAt: new Date(),
            revoked: false,
            revokedReason: null,
          },
        },
        { upsert: true, new: true }
      );
      createdCount++;
    }

    return NextResponse.json({
      message: `Generated/verified certificates for ${createdCount} participants.`,
      createdCount,
    });
  } catch (err) {
    console.error("[POST /api/events/[id]/certificates/generate]", err);
    return NextResponse.json({ error: "Certificate generation failed." }, { status: 500 });
  }
}
