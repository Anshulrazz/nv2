import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { EventRegistration } from "@/models/EventRegistration";

// GET /api/events/[id]/codename-check?codename=xxx
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const codename = searchParams.get("codename")?.trim();

    if (!codename || codename.length < 3) {
      return NextResponse.json({ available: null, error: "Codename too short." });
    }

    await connectToDatabase();

    const exists = await EventRegistration.findOne({
      eventId: id,
      codename: { $regex: `^${codename}$`, $options: "i" },
    })
      .select("_id")
      .lean();

    return NextResponse.json({ available: !exists });
  } catch (err) {
    console.error("[GET /api/events/[id]/codename-check]", err);
    return NextResponse.json({ available: null, error: "Check failed." }, { status: 500 });
  }
}
