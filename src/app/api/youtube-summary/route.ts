import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { VideoSummary } from "@/models/VideoSummary";
import { User } from "@/models/User";
import { generateGeminiContent } from "@/lib/gemini";
import Anthropic from "@anthropic-ai/sdk";
import { YoutubeTranscript } from "youtube-transcript";
import { memoryCache, getCacheHeaders } from "@/lib/cache";

export const dynamic = "force-dynamic";

// Regex helper to extract YouTube Video ID from any standard link
function extractVideoId(url: string): string | null {
  if (!url || typeof url !== "string") return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|shorts\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.trim().match(regExp);
  return match && match[2].length === 11 ? match[2] : null;
}

// Background processor to handle transcript fetch, oEmbed metadata, and AI summarization asynchronously
async function processVideoSummaryAsync(
  recordId: string,
  userId: string,
  videoId: string
) {
  try {
    await connectToDatabase();

    // 1. Fetch transcript via youtube-transcript
    let transcriptItems: Array<{ text: string; offset: number; duration: number }> = [];
    try {
      transcriptItems = await YoutubeTranscript.fetchTranscript(videoId);
    } catch (transcriptErr: unknown) {
      const errMsg = transcriptErr instanceof Error ? transcriptErr.message : String(transcriptErr);
      console.warn(`Transcript fetch failed for video ${videoId}:`, errMsg);
      await VideoSummary.findByIdAndUpdate(recordId, {
        status: "failed",
        errorMessage: "This video doesn't have captions available for summarization",
      });
      return;
    }

    if (!transcriptItems || transcriptItems.length === 0) {
      await VideoSummary.findByIdAndUpdate(recordId, {
        status: "failed",
        errorMessage: "This video doesn't have captions available for summarization",
      });
      return;
    }

    // Build raw transcript text and calculate duration
    const fullTranscriptText = transcriptItems.map((item) => item.text).join(" ");
    const transcriptRaw = fullTranscriptText.slice(0, 50000); // Cap at 50,000 chars
    const lastItem = transcriptItems[transcriptItems.length - 1];
    const durationSeconds = Math.round(((lastItem?.offset || 0) + (lastItem?.duration || 0)) / 1000);

    // 2. Fetch oEmbed metadata (Title, Channel Name, Thumbnail)
    let title = "YouTube Video";
    let channelName = "YouTube Creator";
    let thumbnailUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;

    try {
      const oEmbedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
      const metaRes = await fetch(oEmbedUrl);
      if (metaRes.ok) {
        const meta = await metaRes.json();
        title = meta.title || title;
        channelName = meta.author_name || channelName;
        thumbnailUrl = meta.thumbnail_url || thumbnailUrl;
      }
    } catch (metaErr) {
      console.warn("YouTube oEmbed fetch warning:", metaErr);
    }

    // Prepare transcript sample with timing markers for chapter generation
    const transcriptSampleWithTiming = transcriptItems
      .slice(0, 150)
      .map((item) => `[${Math.floor(item.offset / 1000)}s] ${item.text}`)
      .join("\n");

    const systemPrompt = `You are an expert AI Video Summarizer for Notexia. Analyze the transcript of a YouTube video and generate a structured educational summary in strict valid JSON format.`;

    const userPrompt = `Video Title: "${title}"
Channel/Creator: "${channelName}"
Transcript Content:
"${transcriptRaw.slice(0, 14000)}"

Transcript Snippets with Timestamps:
${transcriptSampleWithTiming.slice(0, 4000)}

Please return a single, strictly valid JSON object with the following exact schema:
{
  "summary": "A comprehensive 2-3 sentence overview paragraph summarizing the core theme, lessons, and purpose of the video.",
  "keyPoints": [
    "Key takeaway bullet point 1",
    "Key takeaway bullet point 2",
    "Key takeaway bullet point 3",
    "Key takeaway bullet point 4",
    "Key takeaway bullet point 5"
  ],
  "chapters": [
    {
      "timestampSeconds": 0,
      "title": "Introduction",
      "summary": "Brief chapter summary sentence."
    }
  ]
}

Ensure you provide 5-10 keyPoints and 3-8 chronological chapters with approximate timestampSeconds matching the transcript timing. Do NOT include markdown formatting or backticks around the JSON. Return raw valid JSON only.`;

    let aiRawOutput = "";

    // Strategy 1: Gemini API
    const geminiKey = process.env.GEMINI_API_KEY;
    if (geminiKey && geminiKey !== "placeholder" && geminiKey.trim() !== "") {
      try {
        aiRawOutput = await generateGeminiContent({
          systemPrompt,
          userPrompt,
          jsonMode: true,
        });
      } catch (gErr: unknown) {
        const msg = gErr instanceof Error ? gErr.message : String(gErr);
        console.warn("Gemini summarization failed, trying fallbacks:", msg);
      }
    }

    // Strategy 2: Anthropic API (Claude)
    if (!aiRawOutput && process.env.ANTHROPIC_API_KEY) {
      try {
        const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
        const resp = await anthropic.messages.create({
          model: "claude-3-5-sonnet-20241022",
          max_tokens: 2500,
          system: systemPrompt,
          messages: [{ role: "user", content: userPrompt }],
        });
        const firstBlock = resp.content?.[0];
        if (firstBlock && firstBlock.type === "text") {
          aiRawOutput = firstBlock.text;
        }
      } catch (aErr: unknown) {
        const msg = aErr instanceof Error ? aErr.message : String(aErr);
        console.warn("Anthropic summarization failed, trying fallbacks:", msg);
      }
    }

    // Strategy 3: OpenRouter API
    if (!aiRawOutput && process.env.OPENROUTER_API_KEY) {
      try {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-flash-1.5",
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userPrompt },
            ],
          }),
        });
        if (response.ok) {
          const resData = await response.json();
          aiRawOutput = resData.choices?.[0]?.message?.content || "";
        }
      } catch (oErr: unknown) {
        const msg = oErr instanceof Error ? oErr.message : String(oErr);
        console.warn("OpenRouter summarization failed:", msg);
      }
    }

    if (!aiRawOutput) {
      await VideoSummary.findByIdAndUpdate(recordId, {
        status: "failed",
        errorMessage: "Summarization failed, please try again",
      });
      return;
    }

    // Helper function for JSON extraction
    const extractJson = (text: string) => {
      const start = text.indexOf("{");
      const end = text.lastIndexOf("}");
      if (start === -1 || end === -1) throw new Error("No JSON object found in response");
      return JSON.parse(text.substring(start, end + 1));
    };

    let parsed: Record<string, unknown>;
    try {
      parsed = extractJson(aiRawOutput);
    } catch {
      console.error("AI returned malformed JSON output:", aiRawOutput);
      await VideoSummary.findByIdAndUpdate(recordId, {
        status: "failed",
        errorMessage: "Summarization failed, please try again",
      });
      return;
    }

    const summary = typeof parsed.summary === "string" ? parsed.summary : "No overview available.";
    const keyPoints = Array.isArray(parsed.keyPoints)
      ? parsed.keyPoints.map(String)
      : ["Core takeaways extracted from YouTube video."];
    const chapters = Array.isArray(parsed.chapters)
      ? (parsed.chapters as Record<string, unknown>[]).map((ch) => ({
          timestampSeconds: typeof ch.timestampSeconds === "number" ? ch.timestampSeconds : 0,
          title: String(ch.title || "Chapter"),
          summary: String(ch.summary || ""),
        }))
      : [];

    // Save final completed summary
    await VideoSummary.findByIdAndUpdate(recordId, {
      title,
      thumbnailUrl,
      channelName,
      durationSeconds,
      transcriptRaw,
      summary,
      keyPoints,
      chapters,
      status: "completed",
      xpAwarded: true,
    });

    // Award XP (+50 points to user)
    await User.findByIdAndUpdate(userId, { $inc: { points: 50 } });
  } catch (err: unknown) {
    console.error("Unhandled error in processVideoSummaryAsync:", err);
    await VideoSummary.findByIdAndUpdate(recordId, {
      status: "failed",
      errorMessage: "Summarization failed, please try again",
    });
  }
}

export const POST = auth(async function POST(req) {
  try {
    const userId = req.auth?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { videoUrl } = body || {};

    if (!videoUrl || typeof videoUrl !== "string" || !videoUrl.trim()) {
      return NextResponse.json({ error: "YouTube URL is required." }, { status: 400 });
    }

    const videoId = extractVideoId(videoUrl);
    if (!videoId) {
      return NextResponse.json(
        { error: "Please enter a valid YouTube URL (e.g. youtube.com/watch?v=... or youtu.be/...)" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // 1. Server-side Rate Limiting: 10 per day per user
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const count24h = await VideoSummary.countDocuments({
      userId,
      createdAt: { $gte: oneDayAgo },
    });

    if (count24h >= 10) {
      return NextResponse.json(
        { error: "Daily summarization quota exceeded (10/day limit). Please try again tomorrow.", remaining: 0 },
        { status: 429 }
      );
    }

    // 2. Check User-level existing summary
    const existingUserSummary = await VideoSummary.findOne({ userId, videoId });
    if (existingUserSummary) {
      if (existingUserSummary.status === "completed") {
        return NextResponse.json(existingUserSummary, { status: 200 });
      }
      if (existingUserSummary.status === "processing") {
        return NextResponse.json({ _id: existingUserSummary._id, status: "processing" }, { status: 200 });
      }
      // If status is 'failed', remove previous attempt to allow re-trigger
      await VideoSummary.findByIdAndDelete(existingUserSummary._id);
    }

    // 3. Fast Path Cache Check: If video was already completed by ANY user
    const cachedGlobalSummary = await VideoSummary.findOne({ videoId, status: "completed" });
    if (cachedGlobalSummary) {
      // Clone global cached record for this user
      const clonedSummary = await VideoSummary.create({
        userId,
        videoId,
        videoUrl: `https://www.youtube.com/watch?v=${videoId}`,
        title: cachedGlobalSummary.title,
        thumbnailUrl: cachedGlobalSummary.thumbnailUrl,
        channelName: cachedGlobalSummary.channelName,
        durationSeconds: cachedGlobalSummary.durationSeconds,
        transcriptRaw: cachedGlobalSummary.transcriptRaw,
        summary: cachedGlobalSummary.summary,
        keyPoints: cachedGlobalSummary.keyPoints,
        chapters: cachedGlobalSummary.chapters,
        status: "completed",
        xpAwarded: true,
      });

      // Award XP once for this user
      await User.findByIdAndUpdate(userId, { $inc: { points: 50 } });

      return NextResponse.json(clonedSummary, { status: 201 });
    }

    // 4. Create new VideoSummary record with status 'processing'
    const newSummary = await VideoSummary.create({
      userId,
      videoId,
      videoUrl: `https://www.youtube.com/watch?v=${videoId}`,
      status: "processing",
    });

    // 5. Trigger async processing without blocking response
    processVideoSummaryAsync(newSummary._id.toString(), userId, videoId);

    // Return 202 Accepted immediately
    return NextResponse.json({ _id: newSummary._id, status: "processing" }, { status: 202 });
  } catch (error) {
    console.error("POST /api/youtube-summary error:", error);
    return NextResponse.json({ error: "Failed to initiate video summarization." }, { status: 500 });
  }
});

export const GET = auth(async function GET(req) {
  try {
    const userId = req.auth?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = Math.min(parseInt(searchParams.get("limit") || "20", 10), 50);
    const skip = (page - 1) * limit;

    const summaries = await VideoSummary.find({ userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await VideoSummary.countDocuments({ userId });

    return NextResponse.json(
      {
        summaries,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
      {
        headers: getCacheHeaders({ public: false, maxAge: 10, staleWhileRevalidate: 30 }),
      }
    );
  } catch (error) {
    console.error("GET /api/youtube-summary error:", error);
    return NextResponse.json({ error: "Failed to fetch summaries." }, { status: 500 });
  }
});
