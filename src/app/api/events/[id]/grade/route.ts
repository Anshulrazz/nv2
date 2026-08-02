import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { Event } from "@/models/Event";
import { EventSubmission } from "@/models/EventSubmission";
import { User } from "@/models/User";
import { isValidObjectId } from "@/lib/validation";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
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
    const isHost = event.hostId.toString() === userId;
    const isAdmin = user?.role === "admin";

    if (!isHost && !isAdmin) {
      return NextResponse.json({ error: "Forbidden: Only event host can grade submissions." }, { status: 403 });
    }

    const body = await req.json();
    const { submissionId, score, feedback, isShortlisted } = body;

    if (!submissionId) {
      return NextResponse.json({ error: "submissionId is required." }, { status: 400 });
    }

    const submission = await EventSubmission.findOne({ _id: submissionId, eventId: event._id });
    if (!submission) {
      return NextResponse.json({ error: "Submission not found for this event." }, { status: 404 });
    }

    if (score !== undefined) {
      submission.score = Math.min(100, Math.max(0, Number(score) || 0));
    }
    if (feedback !== undefined) {
      submission.feedback = String(feedback);
    }
    if (isShortlisted !== undefined) {
      submission.isShortlisted = Boolean(isShortlisted);
    }

    submission.updatedAt = new Date();
    await submission.save();

    return NextResponse.json({
      message: "Submission evaluated successfully",
      submission,
    });
  } catch (error) {
    console.error("PUT /api/events/[id]/grade error:", error);
    return NextResponse.json({ error: "Failed to grade submission" }, { status: 500 });
  }
}
