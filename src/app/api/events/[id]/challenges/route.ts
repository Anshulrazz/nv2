import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { Event } from "@/models/Event";
import { Challenge } from "@/models/Challenge";
import { User } from "@/models/User";
import { hashFlag } from "@/lib/ctf-security";
import { isValidObjectId } from "@/lib/validation";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: identifier } = await params;
    await connectToDatabase();

    let event = null;
    if (isValidObjectId(identifier)) {
      event = await Event.findById(identifier).select("status createdBy").lean();
    } else {
      event = await Event.findOne({ slug: identifier }).select("status createdBy").lean();
    }

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Return challenges excluding flagHash (never send flag to client)
    const challenges = await Challenge.find({ eventId: event._id })
      .select("-flagHash")
      .sort({ order: 1, createdAt: 1 })
      .lean();

    return NextResponse.json({ challenges });
  } catch (error) {
    console.error("GET /api/events/[id]/challenges error:", error);
    return NextResponse.json({ error: "Failed to fetch challenges" }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
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

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: "Forbidden: Only event owner or admin can add challenges." }, { status: 403 });
    }

    const body = await req.json();
    const {
      title,
      description = "",
      category = "Misc",
      difficulty = "medium",
      points = 100,
      flag,
      timeLimitSeconds = 1800,
      hints = [],
      attachmentUrls = [],
      order = 0,
    } = body;

    if (!title || !flag) {
      return NextResponse.json({ error: "Challenge title and secret flag string are required." }, { status: 400 });
    }

    // SERVER-SIDE SECURITY: Hash the raw flag with SHA-256
    const flagHash = hashFlag(flag);

    const challenge = await Challenge.create({
      eventId: event._id,
      title: title.trim(),
      description,
      category,
      difficulty,
      points: Number(points) || 100,
      flagHash,
      timeLimitSeconds: Number(timeLimitSeconds) || 1800,
      hints,
      attachmentUrls,
      order: Number(order) || 0,
    });

    // Return created challenge WITHOUT flagHash
    const sanitized = challenge.toObject();
    delete (sanitized as unknown as Record<string, unknown>).flagHash;

    return NextResponse.json({ message: "Challenge created successfully!", challenge: sanitized });
  } catch (error: unknown) {
    console.error("POST /api/events/[id]/challenges error:", error);
    const msg = error instanceof Error ? error.message : "Failed to create challenge";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
