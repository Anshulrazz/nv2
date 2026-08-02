import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { Event } from "@/models/Event";
import { Challenge } from "@/models/Challenge";
import { User } from "@/models/User";
import { hashFlag } from "@/lib/ctf-security";
import { isValidObjectId } from "@/lib/validation";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; cid: string }> }
) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: identifier, cid: challengeId } = await params;
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
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const challenge = await Challenge.findOne({ _id: challengeId, eventId: event._id });
    if (!challenge) {
      return NextResponse.json({ error: "Challenge not found" }, { status: 404 });
    }

    const body = await req.json();
    if (body.title !== undefined) challenge.title = body.title.trim();
    if (body.description !== undefined) challenge.description = body.description;
    if (body.category !== undefined) challenge.category = body.category;
    if (body.difficulty !== undefined) challenge.difficulty = body.difficulty;
    if (body.points !== undefined) challenge.points = Number(body.points);
    if (body.timeLimitSeconds !== undefined) challenge.timeLimitSeconds = Number(body.timeLimitSeconds);
    if (body.hints !== undefined) challenge.hints = body.hints;
    if (body.attachmentUrls !== undefined) challenge.attachmentUrls = body.attachmentUrls;
    if (body.order !== undefined) challenge.order = Number(body.order);

    if (body.flag) {
      challenge.flagHash = hashFlag(body.flag);
    }

    await challenge.save();

    const sanitized = challenge.toObject();
    delete (sanitized as unknown as Record<string, unknown>).flagHash;

    return NextResponse.json({ message: "Challenge updated", challenge: sanitized });
  } catch (error) {
    console.error("PATCH challenge error:", error);
    return NextResponse.json({ error: "Failed to update challenge" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string; cid: string }> }
) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: identifier, cid: challengeId } = await params;
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
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await Challenge.deleteOne({ _id: challengeId, eventId: event._id });
    return NextResponse.json({ message: "Challenge deleted" });
  } catch (error) {
    console.error("DELETE challenge error:", error);
    return NextResponse.json({ error: "Failed to delete challenge" }, { status: 500 });
  }
}
