import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { Event } from "@/models/Event";
import { Certificate } from "@/models/Certificate";
import { isValidObjectId } from "@/lib/validation";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
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
      event = await Event.findById(identifier).select("_id title").lean();
    } else {
      event = await Event.findOne({ slug: identifier }).select("_id title").lean();
    }

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const certificate = await Certificate.findOne({ eventId: event._id, userId }).lean();
    if (!certificate) {
      return NextResponse.json({ error: "No certificate found for this user in this event." }, { status: 404 });
    }

    return NextResponse.json({ certificate });
  } catch (error) {
    console.error("GET certificate error:", error);
    return NextResponse.json({ error: "Failed to fetch certificate" }, { status: 500 });
  }
}
