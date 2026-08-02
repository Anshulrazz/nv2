import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Event } from "@/models/Event";
import { checkAndSuggestUsername } from "@/lib/username-suggestions";
import { isValidObjectId } from "@/lib/validation";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: identifier } = await params;
    const { searchParams } = new URL(req.url);
    const username = searchParams.get("u") || searchParams.get("username") || "";
    const displayName = searchParams.get("displayName") || "";

    if (!username) {
      return NextResponse.json({ available: false, suggestions: [] });
    }

    await connectToDatabase();

    let event = null;
    if (isValidObjectId(identifier)) {
      event = await Event.findById(identifier).select("_id").lean();
    } else {
      event = await Event.findOne({ slug: identifier }).select("_id").lean();
    }

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const result = await checkAndSuggestUsername(event._id.toString(), username, displayName);
    return NextResponse.json(result);
  } catch (error) {
    console.error("GET username-check error:", error);
    return NextResponse.json({ error: "Failed to check username" }, { status: 500 });
  }
}
