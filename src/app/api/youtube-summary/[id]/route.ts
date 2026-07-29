import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { VideoSummary } from "@/models/VideoSummary";
import { isValidObjectId } from "@/lib/validation";

export const dynamic = "force-dynamic";

export const GET = auth(async function GET(req, context) {
  try {
    const userId = req.auth?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await (context?.params as Promise<{ id: string }>);
    if (!isValidObjectId(id)) {
      return NextResponse.json({ error: "Invalid summary ID format." }, { status: 400 });
    }

    await connectToDatabase();

    const summary = await VideoSummary.findById(id);
    if (!summary) {
      return NextResponse.json({ error: "Summary not found." }, { status: 404 });
    }

    // Verify ownership server-side
    if (summary.userId.toString() !== userId) {
      return NextResponse.json({ error: "Forbidden: You do not own this summary." }, { status: 403 });
    }

    return NextResponse.json(summary);
  } catch (error) {
    console.error("GET /api/youtube-summary/[id] error:", error);
    return NextResponse.json({ error: "Failed to fetch summary detail." }, { status: 500 });
  }
});

export const DELETE = auth(async function DELETE(req, context) {
  try {
    const userId = req.auth?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await (context?.params as Promise<{ id: string }>);
    if (!isValidObjectId(id)) {
      return NextResponse.json({ error: "Invalid summary ID format." }, { status: 400 });
    }

    await connectToDatabase();

    const summary = await VideoSummary.findById(id);
    if (!summary) {
      return NextResponse.json({ error: "Summary not found." }, { status: 404 });
    }

    // Verify ownership server-side
    if (summary.userId.toString() !== userId) {
      return NextResponse.json({ error: "Forbidden: You do not own this summary." }, { status: 403 });
    }

    await VideoSummary.findByIdAndDelete(id);

    return NextResponse.json({ success: true, message: "Summary deleted successfully." });
  } catch (error) {
    console.error("DELETE /api/youtube-summary/[id] error:", error);
    return NextResponse.json({ error: "Failed to delete summary." }, { status: 500 });
  }
});
