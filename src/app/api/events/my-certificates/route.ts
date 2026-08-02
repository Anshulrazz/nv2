import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { Certificate } from "@/models/Certificate";
import { Event } from "@/models/Event";

export async function GET() {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    const certificates = await Certificate.find({ userId })
      .populate("eventId", "title slug bannerUrl category eventEnd")
      .sort({ issuedAt: -1 })
      .lean();

    return NextResponse.json({ certificates });
  } catch (error) {
    console.error("GET /api/events/my-certificates error:", error);
    return NextResponse.json({ error: "Failed to fetch event certificates" }, { status: 500 });
  }
}
