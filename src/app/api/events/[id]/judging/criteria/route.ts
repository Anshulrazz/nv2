import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { Event } from "@/models/Event";
import { JudgingCriteria } from "@/models/JudgingCriteria";
import { requireAdminOrHost } from "@/lib/eventAuth";

// GET /api/events/[id]/judging/criteria — fetch rubric criteria
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await connectToDatabase();

    const criteria = await JudgingCriteria.find({ eventId: id })
      .sort({ order: 1 })
      .lean();

    return NextResponse.json({ criteria });
  } catch (err) {
    console.error("[GET /api/events/[id]/judging/criteria]", err);
    return NextResponse.json({ error: "Failed to fetch judging criteria." }, { status: 500 });
  }
}

// POST /api/events/[id]/judging/criteria — set or add criteria (host/admin)
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    await connectToDatabase();

    const event = await Event.findById(id).select("createdBy hostIds").lean();
    if (!event) {
      return NextResponse.json({ error: "Event not found." }, { status: 404 });
    }

    const check = requireAdminOrHost(session, event);
    if (!check.ok) {
      return NextResponse.json({ error: check.error }, { status: check.status });
    }

    const body = await req.json();
    const { label, maxScore, weight, order } = body;

    if (!label || !label.trim()) {
      return NextResponse.json({ error: "Label is required." }, { status: 400 });
    }
    if (!maxScore || typeof maxScore !== "number" || maxScore < 1) {
      return NextResponse.json({ error: "maxScore must be at least 1." }, { status: 400 });
    }
    if (weight == null || typeof weight !== "number" || weight < 0 || weight > 1) {
      return NextResponse.json({ error: "weight must be between 0 and 1." }, { status: 400 });
    }

    const criterion = await JudgingCriteria.create({
      eventId: id,
      label: label.trim(),
      maxScore,
      weight,
      order: order ?? 0,
    });

    return NextResponse.json({ criterion }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/events/[id]/judging/criteria]", err);
    return NextResponse.json({ error: "Failed to create judging criterion." }, { status: 500 });
  }
}
