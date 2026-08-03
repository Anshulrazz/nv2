import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { Event } from "@/models/Event";
import { User } from "@/models/User";
import { isValidObjectId } from "@/lib/validation";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: eventId } = await params;
    await connectToDatabase();

    let event = null;
    if (isValidObjectId(eventId)) {
      event = await Event.findById(eventId);
    } else {
      event = await Event.findOne({ slug: eventId });
    }

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const user = await User.findById(userId).select("role").lean();
    const isHost = (event.createdBy?.toString() || "") === userId;
    const isAdmin = user?.role === "admin";

    if (!isHost && !isAdmin) {
      return NextResponse.json({ error: "Forbidden: Only event host can publish official results." }, { status: 403 });
    }

    const body = await req.json();
    const { winners = [] } = body;

    if (!Array.isArray(winners) || winners.length === 0) {
      return NextResponse.json({ error: "At least one winner position is required to publish results." }, { status: 400 });
    }

    const formattedWinners = winners.map((w: { rank?: number; participantId: string; submissionId?: string; prize?: string; note?: string }, index: number) => ({
      rank: w.rank || index + 1,
      participantId: w.participantId,
      submissionId: w.submissionId || undefined,
      prize: w.prize || "",
      note: w.note || "",
    }));

    event.isResultsPublished = true;
    event.publishedResults = formattedWinners;
    event.status = "ended";
    await event.save();

    return NextResponse.json({
      message: "Official results published successfully!",
      event,
    });
  } catch (error) {
    console.error("POST /api/events/[id]/publish-results error:", error);
    return NextResponse.json({ error: "Failed to publish results" }, { status: 500 });
  }
}
