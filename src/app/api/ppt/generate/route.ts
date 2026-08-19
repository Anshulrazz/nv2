import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { generateGeminiContent } from "@/lib/gemini";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

export type SlideLayout =
  | "title"
  | "bullets"
  | "two-col"
  | "quote"
  | "code"
  | "closing";

export interface Slide {
  id: number;
  layout: SlideLayout;
  title: string;
  subtitle?: string;
  bullets?: string[];
  leftCol?: string[];
  rightCol?: string[];
  leftColTitle?: string;
  rightColTitle?: string;
  quote?: string;
  quoteAuthor?: string;
  codeSnippet?: string;
  codeLanguage?: string;
  note?: string;
}

export interface GeneratePPTRequest {
  topic: string;
  slideCount: number;
  theme: string;
  audience: "student" | "professional" | "general";
  extraContext?: string;
}

function cleanJSON(raw: string): string {
  let s = raw.replace(/```json/gi, "").replace(/```/gi, "").trim();
  const arrMatch = s.match(/\[[\s\S]*\]/);
  if (arrMatch) return arrMatch[0];
  const objMatch = s.match(/\{[\s\S]*\}/);
  if (objMatch) return objMatch[0];
  return s;
}

function sanitizeSlides(raw: Slide[]): Slide[] {
  return raw.slice(0, 15).map((s, i) => ({
    id: i + 1,
    layout: (
      ["title", "bullets", "two-col", "quote", "code", "closing"].includes(s.layout)
        ? s.layout
        : "bullets"
    ) as SlideLayout,
    title: String(s.title || `Slide ${i + 1}`).slice(0, 120),
    subtitle: s.subtitle ? String(s.subtitle).slice(0, 220) : undefined,
    bullets: Array.isArray(s.bullets)
      ? s.bullets.slice(0, 6).map((b) => String(b).slice(0, 160))
      : undefined,
    leftCol: Array.isArray(s.leftCol)
      ? s.leftCol.slice(0, 5).map((b) => String(b).slice(0, 120))
      : undefined,
    rightCol: Array.isArray(s.rightCol)
      ? s.rightCol.slice(0, 5).map((b) => String(b).slice(0, 120))
      : undefined,
    leftColTitle: s.leftColTitle ? String(s.leftColTitle).slice(0, 60) : undefined,
    rightColTitle: s.rightColTitle ? String(s.rightColTitle).slice(0, 60) : undefined,
    quote: s.quote ? String(s.quote).slice(0, 320) : undefined,
    quoteAuthor: s.quoteAuthor ? String(s.quoteAuthor).slice(0, 80) : undefined,
    codeSnippet: s.codeSnippet ? String(s.codeSnippet).slice(0, 1800) : undefined,
    codeLanguage: s.codeLanguage ? String(s.codeLanguage).slice(0, 30) : undefined,
    note: s.note ? String(s.note).slice(0, 220) : undefined,
  }));
}

// POST /api/ppt/generate
export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized. Please sign in." },
        { status: 401 }
      );
    }

    const body = (await req.json()) as GeneratePPTRequest;
    const {
      topic,
      slideCount = 7,
      theme = "Dark Tech",
      audience = "general",
      extraContext,
    } = body;

    if (!topic || typeof topic !== "string" || !topic.trim()) {
      return NextResponse.json({ error: "Topic is required." }, { status: 400 });
    }
    if (topic.trim().length > 500) {
      return NextResponse.json(
        { error: "Topic must be under 500 characters." },
        { status: 400 }
      );
    }

    const clampedCount = Math.min(Math.max(Number(slideCount) || 7, 4), 15);
    const cleanTopic = topic.trim();

    const audienceNote =
      audience === "student"
        ? "Target audience: students — include foundational explanations, relatable analogies, and examples."
        : audience === "professional"
        ? "Target audience: professionals — focus on applied knowledge, industry relevance, best practices, and data."
        : "Target audience: general — balanced mix of concepts, examples, and real-world relevance.";

    // ── PHASE 1: DEEP RESEARCH ─────────────────────────────────────────────
    const researchRaw = await generateGeminiContent({
      systemPrompt: `You are a world-class research assistant and subject-matter expert. 
Produce a deep, factual, comprehensive research brief on any given topic. 
Return ONLY valid JSON — no markdown, no code fences, no preamble.`,
      userPrompt: `Research this topic thoroughly: "${cleanTopic}"
${extraContext ? `Additional focus: ${extraContext.trim()}` : ""}
${audienceNote}

Return a JSON object with these exact fields:
{
  "overview": "2-3 sentence high-level summary",
  "keyConceptsAndDefinitions": [{ "term": "...", "definition": "1-2 sentences" }],
  "coreSubtopics": [{ "title": "...", "points": ["fact1", "fact2", "fact3"] }],
  "realWorldApplications": ["application 1", "application 2", "application 3"],
  "notableQuote": { "text": "a real, accurate quote", "author": "Author Name" },
  "keyStatisticsOrFacts": ["fact or stat 1", "fact or stat 2", "fact or stat 3"],
  "commonMisconceptions": ["misconception 1", "misconception 2"],
  "codeExample": { "language": "...", "snippet": "short realistic snippet" },
  "suggestedSlideTopics": ["topic 1", "topic 2", "topic 3", "topic 4", "topic 5"]
}

IMPORTANT: Set "codeExample" to null if the topic is NOT technical/programming-related.
Make ALL content factually accurate — not generic filler.
Return ONLY the JSON object.`,
      temperature: 0.35,
      jsonMode: true,
    });

    let research: Record<string, unknown> = {};
    try {
      research = JSON.parse(cleanJSON(researchRaw));
    } catch {
      console.warn("[ppt/generate] Could not parse research JSON, using raw text");
      research = { rawNotes: researchRaw.slice(0, 3000) };
    }

    // ── PHASE 2: SLIDE GENERATION ──────────────────────────────────────────
    const slideRaw = await generateGeminiContent({
      systemPrompt: `You are an expert presentation designer. You have been given deep research notes on a topic.
Transform this research into structured, visually rich slide content for a ${theme}-themed HTML presentation.
Return ONLY valid JSON — no markdown, no code fences, no explanations.`,
      userPrompt: `Create exactly ${clampedCount} slides on: "${cleanTopic}"
Audience: ${audience} | Theme: ${theme}

RESEARCH BRIEF (use this as your sole source of truth — all content MUST come from this research):
${JSON.stringify(research, null, 2)}

SLIDE LAYOUT RULES:
- Slide 1: layout "title" — use overview as subtitle
- Last slide: layout "closing" — e.g. "Thank You" or "Any Questions?"
- Use a VARIED mix: bullets, two-col, quote, code, title, closing
- Quote slide: MUST use the notableQuote from research (exact text + author)
- Code slide: use codeExample from research ONLY if codeExample is not null
- bullets layout: 3-5 crisp bullet points (max 12 words each) — draw from facts, stats, applications
- two-col layout: use for comparisons, pros/cons, or two subtopics side-by-side
- Titles: specific and engaging (max 8 words), avoid generic "Introduction" etc.
- Speaker notes: brief tip or stat to mention aloud (max 20 words)

JSON schema per slide:
{
  "id": number,
  "layout": "title"|"bullets"|"two-col"|"quote"|"code"|"closing",
  "title": string,
  "subtitle": string (title/closing only),
  "bullets": string[] (bullets only, 3-5 items),
  "leftCol": string[] (two-col only, 2-4 items),
  "rightCol": string[] (two-col only, 2-4 items),
  "leftColTitle": string (two-col only),
  "rightColTitle": string (two-col only),
  "quote": string (quote only),
  "quoteAuthor": string (quote only),
  "codeSnippet": string (code only),
  "codeLanguage": string (code only),
  "note": string (optional, max 20 words)
}

Return ONLY the JSON array of exactly ${clampedCount} slide objects.`,
      temperature: 0.6,
      jsonMode: true,
    });

    let slides: Slide[];
    try {
      const parsed = JSON.parse(cleanJSON(slideRaw));
      if (!Array.isArray(parsed)) throw new Error("Not an array");
      slides = sanitizeSlides(parsed);
    } catch {
      console.error("[ppt/generate] Failed to parse slides JSON:", slideRaw.slice(0, 500));
      return NextResponse.json(
        { error: "AI returned an invalid response. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      slides,
      topic: cleanTopic,
      theme,
      slideCount: slides.length,
      researchSummary: (research.overview as string) || "",
    });
  } catch (err) {
    console.error("[ppt/generate] Error:", err);
    return NextResponse.json(
      { error: "Failed to generate presentation. Please try again." },
      { status: 500 }
    );
  }
}
