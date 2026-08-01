import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectToDatabase } from "@/lib/mongodb";
import VideoSummary from "@/models/VideoSummary";
import { User } from "@/models/User";
import { extractVideoId, extractTranscript, TranscriptError } from "@/lib/youtube/transcript";
import { runSummarizerPipeline } from "@/lib/youtube/summarizer-pipeline";
import { pusherServer } from "@/lib/pusher";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: "Unauthorized. Please sign in to summarize YouTube videos." }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await req.json().catch(() => ({}));
    const { url } = body;

    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "A valid YouTube URL is required." }, { status: 400 });
    }

    await connectToDatabase();

    let videoId: string;
    try {
      videoId = extractVideoId(url);
    } catch (err) {
      if (err instanceof TranscriptError) {
        return NextResponse.json({ error: err.message, code: err.code }, { status: 400 });
      }
      return NextResponse.json({ error: "Invalid YouTube URL provided." }, { status: 400 });
    }

    // 1. Cache Check: If summary already exists and is completed, return immediately
    const existingSummary = await VideoSummary.findOne({ videoId, generationStatus: "completed" });
    if (existingSummary) {
      return NextResponse.json({
        success: true,
        cached: true,
        summary: existingSummary,
      });
    }

    // 2. Transcript Extraction
    let transcriptResult;
    try {
      transcriptResult = await extractTranscript(url);
    } catch (err) {
      if (err instanceof TranscriptError) {
        return NextResponse.json({ error: err.message, code: err.code }, { status: 422 });
      }
      return NextResponse.json(
        { error: "Failed to extract transcript from the provided video.", code: "TRANSCRIPT_FAILED" },
        { status: 422 }
      );
    }

    const { metadata, cleanText } = transcriptResult;

    // 3. Initial pending/processing record creation
    const summaryDoc = await VideoSummary.findOneAndUpdate(
      { videoId },
      {
        videoId,
        url: metadata.url,
        title: metadata.title,
        channelName: metadata.channelName,
        thumbnailUrl: metadata.thumbnailUrl,
        durationSeconds: metadata.durationSeconds,
        transcriptRaw: cleanText,
        transcriptLanguage: "en",
        generatedBy: userId,
        generationStatus: "processing",
        aiModelUsed: process.env.AI_SUMMARIZER_MODEL || process.env.GEMINI_MODEL || "gemini-1.5-flash",
      },
      { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
    );

    // 4. Run AI Pipeline
    try {
      const pipelineOutput = await runSummarizerPipeline(cleanText);

      summaryDoc.summary = pipelineOutput.summary;
      summaryDoc.keyPoints = pipelineOutput.keyPoints;
      summaryDoc.lectures = pipelineOutput.lectures;
      summaryDoc.quiz = pipelineOutput.quiz;
      summaryDoc.beyondTheVideo = pipelineOutput.beyondTheVideo;
      summaryDoc.subject = pipelineOutput.subject;
      summaryDoc.examTags = pipelineOutput.examTags;
      summaryDoc.generationStatus = "completed";
      summaryDoc.aiModelUsed = pipelineOutput.aiModelUsed;
      summaryDoc.processingTimeMs = pipelineOutput.processingTimeMs;

      await summaryDoc.save();

      // 5. Award +15 XP for creating a new video summary
      await User.updateOne({ _id: userId }, { $inc: { points: 15 } });

      try {
        await pusherServer.trigger(`user-${userId}`, "xp-updated", {
          pointsEarned: 15,
          reason: "YouTube Video Summary Generated",
        });
      } catch (pusherErr) {
        console.warn("[Pusher] Notification trigger warning:", pusherErr);
      }

      return NextResponse.json({
        success: true,
        cached: false,
        xpAwarded: 15,
        summary: summaryDoc,
      });
    } catch (pipelineErr) {
      console.error("[Generate API] Pipeline execution failed:", pipelineErr);
      summaryDoc.generationStatus = "failed";
      summaryDoc.failureReason = pipelineErr instanceof Error ? pipelineErr.message : "AI pipeline execution failed.";
      await summaryDoc.save();

      return NextResponse.json(
        { error: "AI pipeline processing failed. Please try again.", failureReason: summaryDoc.failureReason },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("[Generate API] Internal server error:", error);
    return NextResponse.json({ error: "An unexpected server error occurred." }, { status: 500 });
  }
}
