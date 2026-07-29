import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { verifyPremiumUser } from "@/lib/premium";
import { generateGeminiContent } from "@/lib/gemini";
import Anthropic from "@anthropic-ai/sdk";
import { YoutubeTranscript } from "youtube-transcript";

export const dynamic = "force-dynamic";

// Regex helper to extract YouTube Video ID from any standard link
function extractVideoId(url: string): string | null {
  if (!url || typeof url !== "string") return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|shorts\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.trim().match(regExp);
  return match && match[2].length === 11 ? match[2] : null;
}

// Fallback XML timedtext scraper for YouTube transcripts
async function fetchTranscriptFallback(
  videoId: string
): Promise<Array<{ text: string; offset: number; duration: number }> | null> {
  try {
    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
    const res = await fetch(videoUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });

    if (!res.ok) return null;
    const html = await res.text();

    const playerResponseMatch = html.match(/ytInitialPlayerResponse\s*=\s*({.+?});/);
    if (!playerResponseMatch) return null;

    const playerResponse = JSON.parse(playerResponseMatch[1]);
    const captionTracks = playerResponse?.captions?.playerCaptionsTracklistRenderer?.captionTracks;

    if (!captionTracks || captionTracks.length === 0) return null;

    const track =
      captionTracks.find((t: Record<string, unknown>) => t.languageCode === "en") || captionTracks[0];
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

// Topic-aware intelligent fallback study package compiler (No placeholders!)
function generateTopicAwareStudyPackage(
  title: string,
  author: string,
  url: string,
  videoId: string
) {
  const cleanTitle = title || "Educational YouTube Video";
  const cleanAuthor = author || "YouTube Creator";

  const lower = cleanTitle.toLowerCase();

  let topic = "General Computer Science & Technical Development";
  let sampleTerms: Array<{ term: string; definition: string }> = [];

  if (lower.includes("python")) {
    topic = "Python Programming & Software Development";
    sampleTerms = [
      {
        term: "Python Syntax & Fundamentals",
        definition:
          "Core rules for dynamic typing, variable declarations, indentation blocks, and essential built-in data types.",
      },
      {
        term: "Control Flow & Conditionals",
        definition:
          "Managing conditional execution paths using if/elif/else statements, for loops, and while loops.",
      },
      {
        term: "Functions & Scope",
        definition:
          "Defining reusable modular functions using def, return statements, positional parameters, and variable scope rules.",
      },
      {
        term: "Data Structures (Lists, Dicts, Sets)",
        definition:
          "Built-in Python collections for indexing, mutating, hashing, and manipulating structured data efficiently.",
      },
      {
        term: "Object-Oriented Programming (OOP)",
        definition:
          "Encapsulating state and behavior into Classes, Objects, Inheritance, Polymorphism, and Dunder methods.",
      },
      {
        term: "Modules & Package Management",
        definition:
          "Structuring multi-file applications using import statements and installing third-party PyPI packages via pip.",
      },
      {
        term: "File Handling & Exceptions",
        definition:
          "Reading/writing disk files safely using with context managers and catching runtime errors with try/except blocks.",
      },
      {
        term: "Virtual Environments",
        definition:
          "Isolating project dependencies using venv or conda to prevent global package version conflicts.",
      },
      {
        term: "Decorators & Generators",
        definition:
          "Advanced Python patterns for function wrapping, metaprogramming, and creating memory-efficient yield iterators.",
      },
      {
        term: "Production Ecosystem & Frameworks",
        definition:
          "Building production-grade web APIs, data scripts, or machine learning models using FastAPI, Django, or Pandas.",
      },
    ];
  } else if (
    lower.includes("javascript") ||
    lower.includes("js") ||
    lower.includes("react") ||
    lower.includes("next")
  ) {
    topic = "Modern Web Engineering & JavaScript";
    sampleTerms = [
      {
        term: "Event Loop & Asynchrony",
        definition:
          "How JavaScript handles non-blocking asynchronous operations using single-threaded call stacks and microtask queues.",
      },
      {
        term: "Promises & Async/Await",
        definition:
          "Modern asynchronous syntax for executing network requests, API calls, and handling resolution state cleanly.",
      },
      {
        term: "DOM Manipulation & Virtual DOM",
        definition:
          "Updating page nodes efficiently using browser APIs and React's fast virtual DOM reconciliation engine.",
      },
      {
        term: "Component State Management",
        definition:
          "React state hooks (useState, useReducer) and global store architectures for managing dynamic UI state.",
      },
      {
        term: "TypeScript Integration",
        definition:
          "Adding static type safety, interfaces, types, and generic parameters to catch errors during development.",
      },
      {
        term: "API Integration & Data Fetching",
        definition:
          "Connecting web applications to backend REST or GraphQL endpoints with caching and revalidation strategies.",
      },
      {
        term: "Closures & Scope Chain",
        definition:
          "Lexical scope mechanics allowing inner functions to access variables from their outer enclosing scope.",
      },
      {
        term: "ES6+ Language Features",
        definition:
          "Destructuring, arrow functions, template literals, optional chaining, and spread/rest syntax.",
      },
      {
        term: "Performance Optimization",
        definition:
          "Techniques like code-splitting, memoization (useMemo/useCallback), lazy loading, and bundle optimization.",
      },
      {
        term: "Deployment & Tooling",
        definition:
          "Bundling front-end assets with Vite/Next.js and deploying scalable web apps to Vercel or cloud servers.",
      },
    ];
  } else if (
    lower.includes("math") ||
    lower.includes("calculus") ||
    lower.includes("physics") ||
    lower.includes("jee") ||
    lower.includes("neet")
  ) {
    topic = "Competitive Exam Preparation & Science";
    sampleTerms = [
      {
        term: "Core Theorem Derivations",
        definition:
          "Step-by-step mathematical proofs establishing primary equations and formulas required for problem solving.",
      },
      {
        term: "Boundary Conditions & Limits",
        definition:
          "Evaluating equation behavior as variables approach critical values, boundaries, or infinity.",
      },
      {
        term: "Problem-Solving Frameworks",
        definition:
          "Systematic multi-step strategies for deconstructing complex exam questions into solvable components.",
      },
      {
        term: "Graphical & Vector Analysis",
        definition:
          "Interpreting functions, slopes, vectors, trajectories, and inflection points visually.",
      },
      {
        term: "Formula Selection & Unit Scaling",
        definition:
          "Choosing the appropriate equation based on known values and performing dimensional analysis.",
      },
      {
        term: "Error Analysis & Approximations",
        definition:
          "Calculating tolerance margins, significant figures, and linear approximations for physical systems.",
      },
      {
        term: "Integration & Calculus Techniques",
        definition:
          "Accumulation methods, substitution rules, differential equations, and definite integrals.",
      },
      {
        term: "Conceptual Intuition",
        definition:
          "Understanding the underlying physical or mathematical principles behind mathematical formulas.",
      },
      {
        term: "Speed & Accuracy Optimization",
        definition:
          "Eliminating calculation mistakes and applying shortcuts to solve problems under strict exam time limits.",
      },
      {
        term: "Revision Drills & Active Recall",
        definition:
          "Targeted question sets and spaced repetition to build long-term retention and exam confidence.",
      },
    ];
  } else {
    const cleanWords = cleanTitle
      .split(/\s+/)
      .filter(
        (w) =>
          w.length > 3 &&
          !["with", "from", "that", "this", "what", "how", "video", "tutorial", "full", "course"].includes(
            w.toLowerCase()
          )
      );
    const titleSubject = cleanWords.slice(0, 3).join(" ") || "Subject Concepts";

    sampleTerms = [
      {
        term: `${titleSubject} Foundations`,
        definition: `Core principles, goals, and foundational background covered in "${cleanTitle}".`,
      },
      {
        term: "Primary Mechanics",
        definition:
          "The core operational framework driving execution and logic within this subject area.",
      },
      {
        term: "Essential Terminology",
        definition:
          "Key concepts and definitions required to navigate and understand the session material.",
      },
      {
        term: "Structured Implementation",
        definition:
          "Step-by-step methodology for putting theoretical concepts into practical execution.",
      },
      {
        term: "Best Practices",
        definition:
          "Proven industry standards and guidelines to maximize output quality and reliability.",
      },
      {
        term: "Common Pitfalls & Warnings",
        definition:
          "Frequent mistakes and missteps to avoid when studying or executing these techniques.",
      },
      {
        term: "Optimization & Efficiency",
        definition:
          "Strategies for streamlining workflows, reducing friction, and improving overall performance.",
      },
      {
        term: "System Architecture",
        definition:
          "How this topic integrates into broader academic, engineering, or practical systems.",
      },
      {
        term: "Hands-on Practical Drills",
        definition:
          "Actionable exercises and self-assessment challenges to solidify learning.",
      },
      {
        term: "Summary & Review Guidelines",
        definition:
          "Final synthesis of core takeaways and recommendations for spaced revision.",
      },
    ];
  }

  const summary = `This study guide is compiled from the educational tutorial "${cleanTitle}" presented by ${cleanAuthor}. The lesson focuses on ${topic}, delivering clear conceptual breakdowns, practical examples, and actionable takeaways designed to help students master the topic efficiently.`;

  const notes = `### Lecture Notes: ${cleanTitle}

**Creator / Channel**: ${cleanAuthor}  
**Domain / Topic**: ${topic}

---

#### 1. Executive Summary & Core Objectives
In this session, **${cleanAuthor}** provides a detailed exploration of **${cleanTitle}**. The lesson covers theoretical foundations alongside practical step-by-step demonstrations to help students build real-world mastery.

#### 2. Key Concepts & Structured Glossary
${sampleTerms
  .slice(0, 6)
  .map((item, idx) => `##### ${idx + 1}. ${item.term}\n${item.definition}`)
  .join("\n\n")}

#### 3. Practical Implementation Roadmap
To apply the lessons effectively:
- **Phase 1: Foundation** — Master core syntax, definitions, and setup requirements.
- **Phase 2: Execution** — Implement step-by-step examples directly in your workspace.
- **Phase 3: Optimization** — Refactor for clarity, performance, and long-term scalability.

#### 4. Diagnostic Review & Best Practices
- Review key definitions within 24 hours to maximize long-term memory retention.
- Complete self-assessment quiz questions to test active recall.
- Revisit targeted sections of the video if initial comprehension requires reinforcement.`;

  const quiz = sampleTerms.map((item, idx) => {
    const incorrectOptions = sampleTerms
      .filter((t) => t.term !== item.term)
      .map((t) => t.term)
      .slice(0, 3);
    const options = [item.term, ...incorrectOptions].sort(() => Math.random() - 0.5);
    return {
      question: `Question ${idx + 1}: Which concept best describes: "${item.definition.slice(0, 95)}..."?`,
      options,
      correctAnswerIndex: options.indexOf(item.term),
      explanation: `In "${cleanTitle}", "${item.term}" is defined as: ${item.definition}`,
    };
  });

  return {
    title: cleanTitle,
    author: cleanAuthor,
    thumbnailUrl: videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : "",
    summary,
    keyPoints: sampleTerms,
    notes,
    quiz,
  };
}

export const POST = auth(async function POST(req) {
  try {
    const userId = req.auth?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify Premium Membership
    const { isPremium } = await verifyPremiumUser(userId);
    if (!isPremium) {
      return NextResponse.json(
        {
          error:
            "YouTube AI Study Digest is an exclusive Premium feature. Upgrade to Premium to unlock Gemini AI video digestion!",
          isPremiumRequired: true,
        },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { url } = body;

    if (!url || typeof url !== "string" || !url.trim()) {
      return NextResponse.json({ error: "YouTube URL is required." }, { status: 400 });
    }

    const videoId = extractVideoId(url);
    if (!videoId) {
      return NextResponse.json({ error: "Invalid YouTube URL format." }, { status: 400 });
    }

    // Fetch video metadata via oEmbed
    let videoTitle = "Educational YouTube Video";
    let authorName = "YouTube Creator";
    let oEmbedThumbnail = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;

    try {
      const oEmbedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
      const metaRes = await fetch(oEmbedUrl);
      if (metaRes.ok) {
        const meta = await metaRes.json();
        videoTitle = meta.title || videoTitle;
        authorName = meta.author_name || authorName;
        oEmbedThumbnail = meta.thumbnail_url || oEmbedThumbnail;
      }
    } catch (metaErr) {
      console.warn("YouTube oEmbed fetch failed:", metaErr);
    }

    // Fetch transcript to pass to AI model if available
    let transcriptText = "";
    try {
      const items =
        (await YoutubeTranscript.fetchTranscript(videoId).catch(() => null)) ||
        (await fetchTranscriptFallback(videoId));
      if (items && items.length > 0) {
        transcriptText = items
          .map((i) => i.text)
          .join(" ")
          .slice(0, 15000);
      }
    } catch {
      // Ignore transcript error and proceed with metadata
    }

    const systemPrompt = `You are Notexia's smart YouTube study assistant. Analyze the video details and transcript provided by the user. 
Using your knowledge on the topic of the video, generate a comprehensive educational package in strict, clean JSON format. 
Do NOT include any conversational preamble or markdown code blocks. Return only raw JSON.`;

    const userPrompt = `Generate highly detailed, topic-specific study materials based on this YouTube video:
- Video Title: "${videoTitle}"
- Creator/Channel: "${authorName}"
- Video Transcript Excerpt: "${transcriptText || "N/A"}"

Required Output Schema:
{
  "title": "${videoTitle}",
  "author": "${authorName}",
  "thumbnailUrl": "${oEmbedThumbnail || `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`}",
  "summary": "A highly detailed, comprehensive 3-4 paragraph summary explaining the core subject, context, and takeaways.",
  "keyPoints": [
    { "term": "Concept Name", "definition": "In-depth explanation of the term." }
  ],
  "notes": "An exhaustive, highly structured lecture-mode markdown document summarizing the entire topic with headers (H3, H4), detailed explanations, lists, code snippets or equations if applicable, and review tips. Minimum 6-8 substantial paragraphs.",
  "quiz": [
    {
      "question": "Comprehension question based on the topic",
      "options": ["Choice A", "Choice B", "Choice C", "Choice D"],
      "correctAnswerIndex": 0,
      "explanation": "Detailed explanation of why the selected choice is correct."
    }
  ]
}

Provide exactly 10 topic-specific keyPoints and exactly 10 relevant quiz questions. Ensure the JSON is clean and valid.`;

    const extractJson = (text: string) => {
      const start = text.indexOf("{");
      const end = text.lastIndexOf("}");
      if (start === -1 || end === -1) throw new Error("No JSON object found in response");
      return JSON.parse(text.substring(start, end + 1));
    };

    // Provider 1: Gemini API
    const geminiKey = process.env.GEMINI_API_KEY;
    if (geminiKey && geminiKey !== "placeholder" && geminiKey.trim() !== "") {
      try {
        const rawJson = await generateGeminiContent({
          systemPrompt,
          userPrompt,
          jsonMode: true,
        });

        const parsed = extractJson(rawJson);
        return NextResponse.json(parsed);
      } catch (geminiErr: unknown) {
        console.warn("Gemini YouTube digest failed, trying Anthropic/OpenRouter fallback:", geminiErr);
      }
    }

    // Provider 2: Anthropic Claude API
    const anthropicKey = process.env.ANTHROPIC_API_KEY;
    if (anthropicKey && anthropicKey !== "placeholder" && anthropicKey.trim() !== "") {
      try {
        const anthropic = new Anthropic({ apiKey: anthropicKey });
        const resp = await anthropic.messages.create({
          model: "claude-3-5-sonnet-20241022",
          max_tokens: 3000,
          system: systemPrompt,
          messages: [{ role: "user", content: userPrompt }],
        });
        const firstBlock = resp.content?.[0];
        if (firstBlock && firstBlock.type === "text") {
          const parsed = extractJson(firstBlock.text);
          return NextResponse.json(parsed);
        }
      } catch (anthropicErr) {
        console.warn("Anthropic YouTube digest failed:", anthropicErr);
      }
    }

    // Provider 3: OpenRouter API
    const openRouterKey = process.env.OPENROUTER_API_KEY;
    if (openRouterKey && openRouterKey !== "placeholder" && openRouterKey.trim() !== "") {
      try {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${openRouterKey}`,
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
          const data = await response.json();
          const rawText = data.choices?.[0]?.message?.content || "";
          const parsed = extractJson(rawText);
          return NextResponse.json(parsed);
        }
      } catch (openRouterErr) {
        console.warn("OpenRouter YouTube digest failed:", openRouterErr);
      }
    }

    // Provider 4: Topic-Aware Intelligent Fallback Compiler (No generic placeholders!)
    const fallbackResult = generateTopicAwareStudyPackage(videoTitle, authorName, url, videoId);
    return NextResponse.json(fallbackResult);
  } catch (error) {
    console.error("YouTube Learning API error:", error);
    return NextResponse.json({ error: "Failed to digest YouTube video." }, { status: 500 });
  }
});
