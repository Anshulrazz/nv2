import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { Event } from "@/models/Event";
import { EventRegistration } from "@/models/EventRegistration";
import { EventSubmission } from "@/models/EventSubmission";

// POST /api/events/[id]/finalize-participation
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }
    const userId = session.user.id;

    await connectToDatabase();

    const event = await Event.findById(id).select("eventEnd status").lean();
    if (!event) {
      return NextResponse.json({ error: "Event not found." }, { status: 404 });
    }

    const registration = await EventRegistration.findOne({
      eventId: id,
      userId,
      paymentStatus: { $in: ["not_required", "paid"] },
    });

    if (!registration) {
      return NextResponse.json({ error: "Not registered." }, { status: 403 });
    }

    if (registration.finalizedAt) {
      return NextResponse.json({
        alreadyFinalized: true,
        finalScore: registration.finalScore,
        finalRank: registration.finalRank,
      });
    }

    const eventEnd = new Date(event.eventEnd as Date);
    const scoreAgg = await EventSubmission.aggregate([
      {
        $match: {
          eventId: { $toString: id },
          userId: { $toString: userId },
          isCorrect: true,
          submittedAt: { $lte: eventEnd },
        },
      },
      { $group: { _id: null, total: { $sum: "$pointsAwarded" } } },
    ]);

    const finalScore = scoreAgg[0]?.total ?? 0;

    registration.finalScore = finalScore;
    registration.finalizedAt = new Date();
    await registration.save();

    return NextResponse.json({ finalized: true, finalScore });
  } catch (err) {
    console.error("[POST /api/events/[id]/finalize-participation]", err);
    return NextResponse.json({ error: "Finalization failed." }, { status: 500 });
  }
}