import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { Event } from "@/models/Event";
import { EventRegistration } from "@/models/EventRegistration";
import { EventSubmission } from "@/models/EventSubmission";
import { isValidObjectId } from "@/lib/validation";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
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

    // Leaderboard sorted by score desc, then submittedAt asc
    const submissions = await EventSubmission.find({ eventId: event._id })
      .populate("userId", "name email image role points")
      .sort({ score: -1, submittedAt: 1 })
      .lean();

    const leaderboard = submissions.map((sub, index) => ({
      ...sub,
      rank: index + 1,
    }));

    return NextResponse.json({
      submissions: leaderboard,
      totalSubmissions: leaderboard.length,
    });
  } catch (error) {
    console.error("GET /api/events/[id]/submissions error:", error);
    return NextResponse.json({ error: "Failed to fetch submissions" }, { status: 500 });
  }
}

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

    if (event.eventType !== "hackathon") {
      return NextResponse.json({ error: "Submissions are only open for Hackathons." }, { status: 400 });
    }

    // Check if user is registered
    const isRegistered = await EventRegistration.exists({ eventId: event._id, userId });
    if (!isRegistered) {
      return NextResponse.json({ error: "You must join the event before submitting a project." }, { status: 403 });
    }

    const body = await req.json();
    const { projectTitle, description, githubUrl = "", demoUrl = "", techStack = [] } = body;

    if (!projectTitle || !description) {
      return NextResponse.json(
        { error: "Project title and description are required." },
        { status: 400 }
      );
    }

    const parsedTechStack = Array.isArray(techStack)
      ? techStack
      : String(techStack).split(",").map((s) => s.trim()).filter(Boolean);

    // Upsert project submission
    let submission = await EventSubmission.findOne({ eventId: event._id, userId });

    if (submission) {
      submission.projectTitle = projectTitle.trim();
      submission.description = description;
      submission.githubUrl = githubUrl.trim();
      submission.demoUrl = demoUrl.trim();
      submission.techStack = parsedTechStack;
      submission.updatedAt = new Date();
      await submission.save();
    } else {
      submission = await EventSubmission.create({
        eventId: event._id,
        userId,
        projectTitle: projectTitle.trim(),
        description,
        githubUrl: githubUrl.trim(),
        demoUrl: demoUrl.trim(),
        techStack: parsedTechStack,
      });
    }

    return NextResponse.json({
      message: "Project submitted successfully!",
      submission,
    });
  } catch (error) {
    console.error("POST /api/events/[id]/submissions error:", error);
    return NextResponse.json({ error: "Failed to submit project" }, { status: 500 });
  }
}
