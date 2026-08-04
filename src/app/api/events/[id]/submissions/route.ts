import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { Event } from "@/models/Event";
import { EventRegistration } from "@/models/EventRegistration";
import { ProjectSubmission } from "@/models/ProjectSubmission";

// GET /api/events/[id]/submissions — list submissions
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const trackId = searchParams.get("trackId");

    await connectToDatabase();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filter: Record<string, any> = { eventId: id };
    if (trackId) filter.trackId = trackId;

    const submissions = await ProjectSubmission.find(filter)
      .populate("teamId", "teamName")
      .populate("userId", "name username")
      .populate("trackId", "name sponsorName")
      .sort({ submittedAt: -1 })
      .lean();

    return NextResponse.json({ submissions });
  } catch (err) {
    console.error("[GET /api/events/[id]/submissions]", err);
    return NextResponse.json({ error: "Failed to fetch submissions." }, { status: 500 });
  }
}

// POST /api/events/[id]/submissions — create or update project submission
export async function POST(
  req: Request,
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

    const event = await Event.findById(id).select("type eventEnd status").lean();
    if (!event) {
      return NextResponse.json({ error: "Event not found." }, { status: 404 });
    }

    if (event.type !== "hackathon") {
      return NextResponse.json({ error: "Project submissions are only for hackathons." }, { status: 400 });
    }

    // ── Server-authoritative timing lock ─────────────────────────────────
    const now = new Date();
    const eventEnd = new Date(event.eventEnd as Date);
    if (now > eventEnd) {
      return NextResponse.json({ error: "Submissions are closed. Event has ended." }, { status: 403 });
    }

    const reg = await EventRegistration.findOne({
      eventId: id,
      userId,
      paymentStatus: { $in: ["not_required", "paid"] },
      isDisqualified: false,
    });

    if (!reg) {
      return NextResponse.json({ error: "You are not registered or disqualified." }, { status: 403 });
    }

    const body = await req.json();
    const { title, description, repoUrl, demoUrl, videoUrl, deckUrl, trackId } = body;

    if (!title || typeof title !== "string" || !title.trim()) {
      return NextResponse.json({ error: "Project title is required." }, { status: 400 });
    }

    // Upsert project submission (team submission if in team, solo otherwise)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const query: Record<string, any> = { eventId: id };
    if (reg.teamId) {
      query.teamId = reg.teamId;
    } else {
      query.userId = userId;
    }

    let submission = await ProjectSubmission.findOne(query);

    if (submission && submission.isFinal) {
      return NextResponse.json({ error: "Submission has been locked as final." }, { status: 403 });
    }

    if (!submission) {
      submission = new ProjectSubmission({
        eventId: id,
        teamId: reg.teamId ?? null,
        userId: reg.teamId ? null : userId,
        trackId: trackId ?? null,
        title: title.trim(),
        description: description ?? "",
        repoUrl: repoUrl ?? "",
        demoUrl: demoUrl ?? "",
        videoUrl: videoUrl ?? "",
        deckUrl: deckUrl ?? "",
        submittedAt: now,
        isFinal: false,
      });
    } else {
      submission.title = title.trim();
      submission.description = description ?? "";
      submission.repoUrl = repoUrl ?? "";
      submission.demoUrl = demoUrl ?? "";
      submission.videoUrl = videoUrl ?? "";
      submission.deckUrl = deckUrl ?? "";
      if (trackId) submission.trackId = trackId;
      submission.submittedAt = now;
    }

    await submission.save();

    return NextResponse.json({ submission }, { status: 200 });
  } catch (err) {
    console.error("[POST /api/events/[id]/submissions]", err);
    return NextResponse.json({ error: "Failed to save submission." }, { status: 500 });
  }
}
