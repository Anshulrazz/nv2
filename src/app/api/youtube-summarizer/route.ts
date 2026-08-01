import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectToDatabase } from "@/lib/mongodb";
import VideoSummary from "@/models/VideoSummary";

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "10", 10)));
    const skip = (page - 1) * limit;

    await connectToDatabase();

    const query = { generatedBy: session.user.id, generationStatus: "completed" };

    const [summaries, total] = await Promise.all([
      VideoSummary.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select("videoId url title channelName thumbnailUrl durationSeconds subject examTags createdAt summary keyPoints")
        .lean(),
      VideoSummary.countDocuments(query),
    ]);

    return NextResponse.json({
      success: true,
      summaries,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("[List API] Error listing video summaries:", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
