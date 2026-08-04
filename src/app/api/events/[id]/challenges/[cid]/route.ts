import { NextResponse } from "next/server";
import crypto from "crypto";
import { auth } from "@/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { Event } from "@/models/Event";
import { EventChallenge } from "@/models/EventChallenge";
import { requireAdminOrHost } from "@/lib/eventAuth";

function hashFlag(flag: string): string {
  return crypto.createHash("sha256").update(flag.trim()).digest("hex");
}

// PATCH /api/events/[id]/challenges/[cid] — update challenge (host/admin only)
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; cid: string }> }
) {
  try {
    const { id, cid } = await params;
    const session = await auth();
    await connectToDatabase();

    const event = await Event.findById(id);
    if (!event) return NextResponse.json({ error: "Event not found." }, { status: 404 });

    const check = requireAdminOrHost(session, event);
    if (!check.ok) return NextResponse.json({ error: check.error }, { status: check.status });

    const challenge = await EventChallenge.findOne({ _id: cid, eventId: id });
    if (!challenge) return NextResponse.json({ error: "Challenge not found." }, { status: 404 });

    const body = await req.json();
    const {
      title, descriptionMarkdown, images, attachmentUrl,
      category, points, difficulty, flag,
      unlockAfterChallengeId, releaseAt, order,
      maxPoints, minPoints, solveDecayFactor,
    } = body;

    if (title !== undefined) challenge.title = title.trim();
    if (descriptionMarkdown !== undefined) challenge.descriptionMarkdown = descriptionMarkdown;
    if (images !== undefined) challenge.images = images;
    if (attachmentUrl !== undefined) challenge.attachmentUrl = attachmentUrl ?? null;
    if (category !== undefined) challenge.category = category;
    if (points !== undefined) challenge.points = points;
    if (difficulty !== undefined) challenge.difficulty = difficulty;
    if (flag && flag.trim()) challenge.flagHash = hashFlag(flag);
    if (unlockAfterChallengeId !== undefined) challenge.unlockAfterChallengeId = unlockAfterChallengeId ?? null;
    if (releaseAt !== undefined) challenge.releaseAt = releaseAt ? new Date(releaseAt) : null;
    if (order !== undefined) challenge.order = order;
    if (maxPoints !== undefined) challenge.maxPoints = maxPoints ?? null;
    if (minPoints !== undefined) challenge.minPoints = minPoints ?? null;
    if (solveDecayFactor !== undefined) challenge.solveDecayFactor = solveDecayFactor ?? 0;

    await challenge.save();

    const obj = challenge.toObject();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { flagHash: _removed, ...safe } = obj;
    return NextResponse.json({ challenge: safe });
  } catch (err) {
    console.error("[PATCH /api/events/[id]/challenges/[cid]]", err);
    return NextResponse.json({ error: "Failed to update challenge." }, { status: 500 });
  }
}

// DELETE /api/events/[id]/challenges/[cid] — delete challenge (host/admin only)
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; cid: string }> }
) {
  try {
    const { id, cid } = await params;
    const session = await auth();
    await connectToDatabase();

    const event = await Event.findById(id);
    if (!event) return NextResponse.json({ error: "Event not found." }, { status: 404 });

    const check = requireAdminOrHost(session, event);
    if (!check.ok) return NextResponse.json({ error: check.error }, { status: check.status });

    const result = await EventChallenge.findOneAndDelete({ _id: cid, eventId: id });
    if (!result) return NextResponse.json({ error: "Challenge not found." }, { status: 404 });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[DELETE /api/events/[id]/challenges/[cid]]", err);
    return NextResponse.json({ error: "Failed to delete challenge." }, { status: 500 });
  }
}
