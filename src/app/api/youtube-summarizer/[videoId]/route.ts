import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectToDatabase } from "@/lib/mongodb";
import VideoSummary from "@/models/VideoSummary";
import mongoose from "mongoose";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ videoId: string }> }
) {
  try {
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { videoId } = await params;
    if (!videoId) {
      return NextResponse.json({ error: "Video ID parameter is required." }, { status: 400 });
    }

    await connectToDatabase();

    // Query either by videoId or by Mongoose _id
    let summary;
    if (mongoose.Types.ObjectId.isValid(videoId)) {
      summary = await VideoSummary.findById(videoId).lean();
    }
    if (!summary) {
      summary = await VideoSummary.findOne({ videoId }).lean();
    }

    if (!summary) {
      return NextResponse.json({ error: "Video summary not found." }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      summary,
    });
  } catch (error) {
    console.error("[Get Single Summary API] Error:", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
