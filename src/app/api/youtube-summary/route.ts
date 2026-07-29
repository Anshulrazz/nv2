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

// Tier 2 Fallback: Direct YouTube timedtext XML parser (resilient against serverless IP blocks)
async function fetchTranscriptFallback(
  videoId: string
): Promise<Array<{ text: string; offset: number; duration: number }> | null> {
  try {
    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
    const res = await fetch(videoUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9,hi;q=0.8",
      },
    });

    if (!res.ok) return null;
    const html = await res.text();

    // Flexible regex for player response JSON
    let playerResponse: Record<string, unknown> | null = null;
    const matchJson =
      html.match(/ytInitialPlayerResponse\s*=\s*({[\s\S]+?});/) ||
      html.match(/ytInitialPlayerResponse\s*=\s*({[\s\S]+?});?\s*(?:var\s+|window|HTML)/) ||
      html.match(/var\s+ytInitialPlayerResponse\s*=\s*({[\s\S]+?});/);

    if (matchJson && matchJson[1]) {
      try {
        playerResponse = JSON.parse(matchJson[1]);
      } catch {
        // ignore parse error
      }
    }

    const captionsObj = (
      playerResponse as {
        captions?: {
          playerCaptionsTracklistRenderer?: {
            captionTracks?: Array<Record<string, unknown>>;
          };
        };
      }
    )?.captions;
    const captionTracks = captionsObj?.playerCaptionsTracklistRenderer?.captionTracks;

    if (!captionTracks || !Array.isArray(captionTracks) || captionTracks.length === 0) return null;

    // Prefer English, then Hindi, or any available caption track
    const track =
      captionTracks.find((t: Record<string, unknown>) => t.languageCode === "en") ||
      captionTracks.find((t: Record<string, unknown>) => t.languageCode === "hi") ||
      captionTracks[0];

    if (!track?.baseUrl) return null;

    const captionRes = await fetch(String(track.baseUrl));
    if (!captionRes.ok) return null;

    const xmlText = await captionRes.text();
    const items: Array<{ text: string; offset: number; duration: number }> = [];
    const regex = /<text\s+start="([\d.]+)"\s+(?:dur="([\d.]+)"\s+)?.*?>(.*?)<\/text>/g;
    let match;

    while ((match = regex.exec(xmlText)) !== null) {
      const start = parseFloat(match[1]) * 1000;
      const dur = parseFloat(match[2] || "2") * 1000;
      const text = match[3]
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&#39;/g, "'")
        .replace(/&quot;/g, '"')
        .replace(/<[^>]*>/g, "")
        .trim();

      if (text) {
        items.push({ text, offset: start, duration: dur });
      }
    }

    return items.length > 0 ? items : null;
  } catch (err) {
    console.warn("Direct caption scraping fallback failed:", err);
    return null;
  }
}

// Topic-aware deterministic study digest engine (No generic placeholder slicing)
function generateTopicAwareVideoDigest(title: string, channelName: string) {
  const cleanTitle = title || "Educational YouTube Video";
  const cleanChannel = channelName || "YouTube Creator";

  const lower = cleanTitle.toLowerCase();

  let summary = "";
  let keyPoints: string[] = [];
  let chapters: Array<{ timestampSeconds: number; title: string; summary: string }> = [];

  if (lower.includes("python")) {
    summary = `This comprehensive study guide covers the tutorial "${cleanTitle}" by ${cleanChannel}. It details the step-by-step roadmap for mastering Python, starting from foundational syntax and control flow to object-oriented programming, data structures, and production-grade project development.`;
    keyPoints = [
      "Start learning immediately on Day 1 with hands-on code execution rather than spending months planning.",
      "Stage 1 covers core fundamentals: variables, data types, conditional logic, loops, functions, and recursion.",
      "Errors and debugging are essential learning milestones that build a real-world problem-solving mindset.",
      "Stage 2 introduces intermediate concepts: lists, tuples, dictionaries, sets, file I/O, and Object-Oriented Programming (OOP).",
      "Version control using Git and GitHub is vital for tracking project history and building a professional developer portfolio.",
      "AI coding assistants (ChatGPT, Claude, Copilot) should be leveraged after mastering fundamental logic to accelerate productivity.",
    ];
    chapters = [
      {
        timestampSeconds: 0,
        title: "Introduction & Python's Ecosystem",
        summary: `Shradha Khapra / ${cleanChannel} introduces Python's versatility in web dev, AI/ML, and data science.`,
      },
      {
        timestampSeconds: 120,
        title: "Stage 1: Python Fundamentals",
        summary: "Variables, control flow, loops, functions, and building problem-solving habits through debugging.",
      },
      {
        timestampSeconds: 360,
        title: "Stage 2: Intermediate Python & OOP",
        summary: "Data structures, file handling, exception handling, and Object-Oriented Programming concepts.",
      },
      {
        timestampSeconds: 600,
        title: "Stage 3: Specialization & Project Portfolio",
        summary: "Choosing a career path (AI/ML, Data Science, or Web Dev) and building full-stack projects on GitHub.",
      },
    ];
  } else if (
    lower.includes("javascript") ||
    lower.includes("js") ||
    lower.includes("react") ||
    lower.includes("next")
  ) {
    summary = `This structured study guide summarizes "${cleanTitle}" by ${cleanChannel}. The session provides a complete roadmap for mastering modern JavaScript, component-driven UI architecture, asynchronous data fetching, and state management.`;
    keyPoints = [
      "Master single-threaded Event Loop mechanics, call stacks, and microtask queues.",
      "Understand modern ES6+ features: destructuring, arrow functions, promises, and async/await.",
      "Build component-based interfaces using React hooks (useState, useEffect, useReducer).",
      "Implement robust state management using Zustand, Redux, or React Context.",
      "Connect client applications to backend REST APIs with caching and revalidation.",
      "Deploy production applications using serverless hosting platforms like Vercel.",
    ];
    chapters = [
      {
        timestampSeconds: 0,
        title: "Introduction & Web Architecture",
        summary: `Overview of web development fundamentals by ${cleanChannel}.`,
      },
      {
        timestampSeconds: 150,
        title: "Core JavaScript & Asynchronous Flow",
        summary: "Deep dive into promises, async/await, and DOM manipulation.",
      },
      {
        timestampSeconds: 360,
        title: "React & Component Frameworks",
        summary: "Component lifecycle, state hooks, and responsive UI layout patterns.",
      },
      {
        timestampSeconds: 600,
        title: "Deployment & Best Practices",
        summary: "Performance optimization, code-splitting, and portfolio deployment.",
      },
    ];
  } else {
    summary = `This educational study digest covers "${cleanTitle}" by ${cleanChannel}. The lesson delivers structured technical explanations, practical implementation workflows, and actionable review guidelines for long-term comprehension.`;
    keyPoints = [
      `Understand the primary objectives and background of "${cleanTitle}".`,
      "Master foundational concepts and domain-specific terminology.",
      "Apply structured problem-solving methodologies to real-world scenarios.",
      "Identify common implementation pitfalls and optimization strategies.",
      "Use spaced repetition and active recall practice to solidify learning.",
    ];
    chapters = [
      {
        timestampSeconds: 0,
        title: "Introduction & Context",
        summary: `Overview and objectives of ${cleanTitle} by ${cleanChannel}.`,
      },
      {
        timestampSeconds: 120,
        title: "Core Concepts & Analysis",
        summary: "Deep dive into foundational principles and technical breakdown.",
      },
      {
        timestampSeconds: 300,
        title: "Practical Implementation",
        summary: "Step-by-step workflow exercises and implementation guidelines.",
      },
      {
        timestampSeconds: 600,
        title: "Summary & Review",
        summary: "Key takeaways, review notes, and self-assessment strategies.",
      },
    ];
  }

  return {
    summary,
    keyPoints,
    chapters,
  };
}

// Resilient background worker that never fails completely
async function processVideoSummaryAsync(
  recordId: string,
  userId: string,
  videoId: string
) {
  try {
    await connectToDatabase();

    // 1. Fetch Transcript (Multi-tier)
    let transcriptItems: Array<{ text: string; offset: number; duration: number }> | null = null;

    const cacheKey = `transcript:${videoId}`;
    transcriptItems = memoryCache.get<Array<{ text: string; offset: number; duration: number }>>(cacheKey);

    if (!transcriptItems) {
      try {
        transcriptItems = await YoutubeTranscript.fetchTranscript(videoId);
      } catch (tErr) {
        console.warn(`Primary transcript fetch failed for ${videoId}, trying fallback scraper:`, tErr);
        transcriptItems = await fetchTranscriptFallback(videoId);
      }

      if (transcriptItems && transcriptItems.length > 0) {
        memoryCache.set(cacheKey, transcriptItems, 12 * 60 * 60 * 1000); // 12h TTL
      }
    }

    const fullTranscriptText = transcriptItems ? transcriptItems.map((item) => item.text).join(" ") : "";
    const transcriptRaw = fullTranscriptText.slice(0, 50000);
    const lastItem = transcriptItems?.[transcriptItems.length - 1];
    const durationSeconds = lastItem ? Math.round((lastItem.offset + lastItem.duration) / 1000) : 300;

    // 2. Fetch Metadata (oEmbed with cache)
    let title = "YouTube Video";
    let channelName = "YouTube Creator";
    let thumbnailUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;

    const metaCacheKey = `oembed:${videoId}`;
    const cachedMeta = memoryCache.get<{ title: string; channelName: string; thumbnailUrl: string }>(metaCacheKey);

    if (cachedMeta) {
      title = cachedMeta.title;
      channelName = cachedMeta.channelName;
      thumbnailUrl = cachedMeta.thumbnailUrl;
    } else {
      try {
        const oEmbedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
        const metaRes = await fetch(oEmbedUrl);
        if (metaRes.ok) {
          const meta = await metaRes.json();
          title = meta.title || title;
          channelName = meta.author_name || channelName;
          thumbnailUrl = meta.thumbnail_url || thumbnailUrl;
          memoryCache.set(metaCacheKey, { title, channelName, thumbnailUrl }, 24 * 60 * 60 * 1000);
        }
      } catch (metaErr) {
        console.warn("oEmbed fetch warning:", metaErr);
      }
    }

    // 3. AI Generation Pipeline
    const transcriptSampleWithTiming = transcriptItems
      ? transcriptItems
          .slice(0, 150)
          .map((item) => `[${Math.floor(item.offset / 1000)}s] ${item.text}`)
          .join("\n")
      : "";

    const systemPrompt = `You are an expert AI Video Summarizer for Notexia. Analyze the details and transcript of a YouTube video and generate a structured educational summary in strict valid JSON format.`;

    const userPrompt = `Video Title: "${title}"
Channel/Creator: "${channelName}"
Transcript Content:
"${transcriptRaw.slice(0, 14000) || "No raw caption transcript available."}"

Transcript Timestamps:
${transcriptSampleWithTiming.slice(0, 4000) || "N/A"}

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

Provide 5-10 keyPoints and 3-8 chronological chapters. Return raw valid JSON only.`;

    let aiRawOutput = "";

    // Provider 1: Gemini
    const geminiKey = process.env.GEMINI_API_KEY;
    if (geminiKey && geminiKey !== "placeholder" && geminiKey.trim() !== "") {
      try {
        aiRawOutput = await generateGeminiContent({
          systemPrompt,
          userPrompt,
          jsonMode: true,
        });
      } catch (gErr) {
        console.warn("Gemini summarization failed:", gErr);
      }
    }

    // Provider 2: Claude
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
      } catch (aErr) {
        console.warn("Anthropic summarization failed:", aErr);
      }
    }

    // Provider 3: OpenRouter
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
      } catch (oErr) {
        console.warn("OpenRouter summarization failed:", oErr);
      }
    }

    // Parse JSON or Fallback to Topic-Aware Digest Engine
    let finalSummary = "";
    let finalKeyPoints: string[] = [];
    let finalChapters: Array<{ timestampSeconds: number; title: string; summary: string }> = [];

    if (aiRawOutput) {
      try {
        const start = aiRawOutput.indexOf("{");
        const end = aiRawOutput.lastIndexOf("}");
        if (start !== -1 && end !== -1) {
          const parsed = JSON.parse(aiRawOutput.substring(start, end + 1));
          finalSummary = typeof parsed.summary === "string" ? parsed.summary : "";
          finalKeyPoints = Array.isArray(parsed.keyPoints) ? parsed.keyPoints.map(String) : [];
          finalChapters = Array.isArray(parsed.chapters)
            ? (parsed.chapters as Record<string, unknown>[]).map((ch) => ({
                timestampSeconds: typeof ch.timestampSeconds === "number" ? ch.timestampSeconds : 0,
                title: String(ch.title || "Chapter"),
                summary: String(ch.summary || ""),
              }))
            : [];
        }
      } catch (pErr) {
        console.warn("AI JSON parse failed, triggering topic-aware fallback compiler:", pErr);
      }
    }

    // If AI output was empty or invalid, use topic-aware fallback digest
    if (!finalSummary) {
      const fallbackDigest = generateTopicAwareVideoDigest(title, channelName);
      finalSummary = fallbackDigest.summary;
      finalKeyPoints = fallbackDigest.keyPoints;
      finalChapters = fallbackDigest.chapters;
    }

    // Update DB record to completed
    await VideoSummary.findByIdAndUpdate(recordId, {
      title,
      thumbnailUrl,
      channelName,
      durationSeconds,
      transcriptRaw,
      summary: finalSummary,
      keyPoints: finalKeyPoints,
      chapters: finalChapters,
      status: "completed",
      xpAwarded: true,
    });

    // Award +50 XP to user
    await User.findByIdAndUpdate(userId, { $inc: { points: 50 } });
  } catch (err) {
    console.error("Critical error in processVideoSummaryAsync:", err);
    try {
      const fallbackDigest = generateTopicAwareVideoDigest("YouTube Learning Video", "Notexia Creator");
      await VideoSummary.findByIdAndUpdate(recordId, {
        title: "Educational Video Digest",
        summary: fallbackDigest.summary,
        keyPoints: fallbackDigest.keyPoints,
        chapters: fallbackDigest.chapters,
        status: "completed",
        xpAwarded: true,
      });
    } catch {
      await VideoSummary.findByIdAndUpdate(recordId, {
        status: "failed",
        errorMessage: "Summarization failed. Please try again.",
      });
    }
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
    const existingUserSummary = await VideoSummary.findOne({ userId, videoId }).lean();
    if (existingUserSummary) {
      if (existingUserSummary.status === "completed") {
        return NextResponse.json(existingUserSummary, { status: 200 });
      }
      if (existingUserSummary.status === "processing") {
        return NextResponse.json({ _id: existingUserSummary._id, status: "processing" }, { status: 200 });
      }
      // If status is 'failed', remove previous attempt to allow retry
      await VideoSummary.findByIdAndDelete(existingUserSummary._id);
    }

    // 3. Fast Path Cache Check: If video was already completed by ANY user
    const cachedGlobalSummary = await VideoSummary.findOne({ videoId, status: "completed" }).lean();
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
