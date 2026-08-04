import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { Event } from "@/models/Event";
import { User } from "@/models/User";
import { requireAdminOrHost } from "@/lib/eventAuth";
import mongoose from "mongoose";

// GET /api/events/[id]/judges — list current judges (host/admin only)
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    await connectToDatabase();

    const event = await Event.findById(id).lean();
    if (!event) return NextResponse.json({ error: "Event not found." }, { status: 404 });

    const check = requireAdminOrHost(session, event);
    if (!check.ok) return NextResponse.json({ error: check.error }, { status: check.status });

    const judges = event.judgeIds?.length
      ? await User.find({ _id: { $in: event.judgeIds } })
          .select("_id name email image")
          .lean()
      : [];

    return NextResponse.json({ judges });
  } catch (err) {
    console.error("[GET /api/events/[id]/judges]", err);
    return NextResponse.json({ error: "Failed to fetch judges." }, { status: 500 });
  }
}

// POST /api/events/[id]/judges — add a judge by email (host/admin only)
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    await connectToDatabase();

    const event = await Event.findById(id);
    if (!event) return NextResponse.json({ error: "Event not found." }, { status: 404 });

    const check = requireAdminOrHost(session, event);
    if (!check.ok) return NextResponse.json({ error: check.error }, { status: check.status });

    const body = await req.json();
    const { email } = body;
    if (!email || typeof email !== "string" || !email.trim()) {
      return NextResponse.json({ error: "Email is required." }, { status: 400 });
    }

    const user = await User.findOne({ email: email.trim().toLowerCase() })
      .select("_id name email image")
      .lean();
    if (!user) {
      return NextResponse.json({ error: "No user found with that email." }, { status: 404 });
    }

    const uid = user._id as mongoose.Types.ObjectId;

    // Already a judge?
    if (event.judgeIds.some((j: mongoose.Types.ObjectId) => j.toString() === uid.toString())) {
      return NextResponse.json({ error: "This user is already a judge." }, { status: 409 });
    }

    event.judgeIds.push(uid);
    await event.save();

    return NextResponse.json({ judge: user }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/events/[id]/judges]", err);
    return NextResponse.json({ error: "Failed to add judge." }, { status: 500 });
  }
}

// DELETE /api/events/[id]/judges — remove a judge (host/admin only)
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    await connectToDatabase();

    const event = await Event.findById(id);
    if (!event) return NextResponse.json({ error: "Event not found." }, { status: 404 });

    const check = requireAdminOrHost(session, event);
    if (!check.ok) return NextResponse.json({ error: check.error }, { status: check.status });

    const body = await req.json();
    const { judgeId } = body;
    if (!judgeId) return NextResponse.json({ error: "judgeId is required." }, { status: 400 });

    event.judgeIds = event.judgeIds.filter((j: mongoose.Types.ObjectId) => j.toString() !== judgeId);
    await event.save();

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[DELETE /api/events/[id]/judges]", err);
    return NextResponse.json({ error: "Failed to remove judge." }, { status: 500 });
  }
}
