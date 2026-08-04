import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { auth } from "@/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { Event } from "@/models/Event";
import { EventRegistration } from "@/models/EventRegistration";
import { EventSubmission } from "@/models/EventSubmission";
import { requireAdminOrHost } from "@/lib/eventAuth";

// GET /api/events/[id]/participants — host/admin only, full participant list with scores
export async function GET(
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

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") ?? "1", 10);
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "50", 10), 100);
    const skip = (page - 1) * limit;

    const [registrations, total] = await Promise.all([
      EventRegistration.find({ eventId: id })
        .sort({ registeredAt: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      EventRegistration.countDocuments({ eventId: id }),
    ]);

    // Aggregate scores for all participants
    const userIds = registrations.map((r) => r.userId.toString());
    const eventObjId = new mongoose.Types.ObjectId(id);
    const scoreAgg = await EventSubmission.aggregate([
      {
        $match: {
          eventId: eventObjId,
          isCorrect: true,
        },
      },
      {
        $group: {
          _id: "$userId",
          totalPoints: { $sum: "$pointsAwarded" },
          solveCount: { $sum: 1 },
          lastSolveAt: { $max: "$submittedAt" },
        },
      },
    ]);

    const scoreMap = new Map(
      scoreAgg.map((a) => [a._id.toString(), a])
    );

    // Attempt frequency for cheating signal
    const attemptAgg = await EventSubmission.aggregate([
      { $match: { eventId: eventObjId } },
      {
        $group: {
          _id: "$userId",
          totalAttempts: { $sum: 1 },
          wrongAttempts: {
            $sum: { $cond: [{ $eq: ["$isCorrect", false] }, 1, 0] },
          },
        },
      },
    ]);
    const attemptMap = new Map(
      attemptAgg.map((a) => [a._id.toString(), a])
    );

    const participants = registrations
      .filter((r) => userIds.includes(r.userId.toString()))
      .map((r) => {
        const uid = r.userId.toString();
        const score = scoreMap.get(uid);
        const attempts = attemptMap.get(uid);
        return {
          userId: uid,
          codename: r.codename,
          realName: r.realName, // only visible to hosts/admins
          paymentStatus: r.paymentStatus,
          isDisqualified: r.isDisqualified,
          disqualifiedReason: r.disqualifiedReason,
          registeredAt: r.registeredAt,
          totalPoints: score?.totalPoints ?? 0,
          solveCount: score?.solveCount ?? 0,
          lastSolveAt: score?.lastSolveAt ?? null,
          totalAttempts: attempts?.totalAttempts ?? 0,
          wrongAttempts: attempts?.wrongAttempts ?? 0,
        };
      });

    return NextResponse.json({ participants, total, page, limit });
  } catch (err) {
    console.error("[GET /api/events/[id]/participants]", err);
    return NextResponse.json({ error: "Failed to fetch participants." }, { status: 500 });
  }
}
