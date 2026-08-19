import { auth } from "@/auth";
import { generateGeminiContent } from "@/lib/gemini";

export const dynamic = "force-dynamic";
export const maxDuration = 120; // research + generation can take ~60-90s

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
    layout: (["title", "bullets", "two-col", "quote", "code", "closing"].includes(s.layout)
      ? s.layout
      : "bullets") as SlideLayout,
    title: String(s.title || `Slide ${i + 1}`).slice(0, 120),
    subtitle: s.subtitle ? String(s.subtitle).slice(0, 220) : undefined,
    bullets: Array.isArray(s.bullets) ? s.bullets.slice(0, 6).map((b) => String(b).slice(0, 160)) : undefined,
    leftCol: Array.isArray(s.leftCol) ? s.leftCol.slice(0, 5).map((b) => String(b).slice(0, 120)) : undefined,
    rightCol: Array.isArray(s.rightCol) ? s.rightCol.slice(0, 5).map((b) => String(b).slice(0, 120)) : undefined,
    leftColTitle: s.leftColTitle ? String(s.leftColTitle).slice(0, 60) : undefined,
    rightColTitle: s.rightColTitle ? String(s.rightColTitle).slice(0, 60) : undefined,
    quote: s.quote ? String(s.quote).slice(0, 320) : undefined,
    quoteAuthor: s.quoteAuthor ? String(s.quoteAuthor).slice(0, 80) : undefined,
    codeSnippet: s.codeSnippet ? String(s.codeSnippet).slice(0, 1800) : undefined,
    codeLanguage: s.codeLanguage ? String(s.codeLanguage).slice(0, 30) : undefined,
    note: s.note ? String(s.note).slice(0, 220) : undefined,
  }));
}

// ── SSE helper ────────────────────────────────────────────────────────────
function sseEvent(type: string, data: unknown): string {
  return `data: ${JSON.stringify({ type, ...( typeof data === "object" && data !== null ? data : { value: data }) })}\n\n`;
}

// POST /api/ppt/generate  →  SSE stream
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return new Response(JSON.stringify({ error: "Unauthorized. Please sign in." }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  let body: GeneratePPTRequest;
  try {
    body = (await req.json()) as GeneratePPTRequest;
  } catch {
    return new Response(JSON.stringify({ error: "Invalid request body." }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { topic, slideCount = 7, theme = "Dark Tech", audience = "general", extraContext } = body;

  if (!topic || typeof topic !== "string" || !topic.trim()) {
    return new Response(JSON.stringify({ error: "Topic is required." }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
  if (topic.trim().length > 500) {
    return new Response(JSON.stringify({ error: "Topic must be under 500 characters." }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const clampedCount = Math.min(Math.max(Number(slideCount) || 7, 4), 15);
  const cleanTopic = topic.trim();

  // ── Stream setup ────────────────────────────────────────────────────────
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (type: string, data: unknown) =>
        controller.enqueue(encoder.encode(sseEvent(type, data)));

      try {
        // ── PHASE 1: RESEARCH ──────────────────────────────────────────
        send("phase", { phase: "research", message: "Researching your topic with AI…" });

        const researchSystemPrompt = `You are a world-class research assistant and subject-matter expert. 
Your task is to produce a deep, factual, comprehensive research brief on any given topic. 
Return ONLY valid JSON — no markdown, no code fences, no preamble.`;

        const audienceNote =
          audience === "student"
            ? "Target audience: students — include foundational explanations, relatable analogies, and examples."
            : audience === "professional"
            ? "Target audience: professionals — focus on applied knowledge, industry relevance, best practices, and data."
            : "Target audience: general — balanced mix of concepts, examples, and real-world relevance.";

        const researchPrompt = `Research the topic thoroughly: "${cleanTopic}"
${extraContext ? `Additional constraints/focus: ${extraContext.trim()}` : ""}
${audienceNote}

Produce a structured JSON research brief with these fields:
{
  "overview": "2-3 sentence high-level summary of the topic",
  "keyConceptsAndDefinitions": [
    { "term": "Term name", "definition": "Clear definition (1-2 sentences)" }
  ],
  "coreSubtopics": [
    {
      "title": "Subtopic heading",
      "points": ["key fact or insight", "another fact", "another"]
    }
  ],
  "realWorldApplications": ["application 1", "application 2", "application 3"],
  "notableQuote": { "text": "a real, relevant quote", "author": "Author Name" },
  "keyStatisticsOrFacts": ["statistic or fact 1", "statistic or fact 2", "statistic or fact 3"],
  "commonMisconceptions": ["misconception 1", "misconception 2"],
  "codeExample": { "language": "language name", "snippet": "short realistic code snippet" },
  "suggestedSlideTopics": ["topic 1", "topic 2", "topic 3", "topic 4", "topic 5", "topic 6", "topic 7"]
}

For "codeExample": only fill it if the topic is technical/programming-related; otherwise set it to null.
Make ALL content factually accurate and genuinely informative — not generic filler.
Return ONLY the JSON object.`;

        const researchRaw = await generateGeminiContent({
          systemPrompt: researchSystemPrompt,
          userPrompt: researchPrompt,
          temperature: 0.4, // lower temp for factual accuracy
          jsonMode: true,
        });

        let research: Record<string, unknown> = {};
        try {
          research = JSON.parse(cleanJSON(researchRaw));
        } catch {
          console.warn("[ppt/generate] Could not parse research JSON, continuing with raw text");
          research = { rawNotes: researchRaw.slice(0, 3000) };
        }

        send("phase", { phase: "structuring", message: "Organising slide structure…" });

        // ── PHASE 2: SLIDE GENERATION ──────────────────────────────────
        send("phase", { phase: "generating", message: "Writing slide content…" });

        const slideSystemPrompt = `You are an expert presentation designer. You have been given deep research notes on a topic.
Your job is to transform this research into structured, visually rich slide content for a ${theme}-themed HTML presentation.
Return ONLY valid JSON — no markdown, no code fences, no explanations.`;

        const slidePrompt = `Create exactly ${clampedCount} slides on: "${cleanTopic}"
Audience: ${audience} | Theme: ${theme}

RESEARCH BRIEF (use this as the sole source of truth — all content MUST come from or be consistent with this research):
${JSON.stringify(research, null, 2)}

SLIDE LAYOUT RULES:
- Slide 1: layout "title" — use overview as subtitle
- Last slide: layout "closing" — "Thank You" or "Q&A"
- Use a VARIED mix: bullets, two-col, quote, code, title, closing
- Quote slide: use the notableQuote from research (exact text + author)
- Code slide: use the codeExample from research (only if codeExample is not null)
- bullets layout: 3-5 crisp bullet points (max 12 words each) — use key facts, statistics, misconceptions, applications
- two-col layout: use for comparisons, pros/cons, before/after, or two subtopics side-by-side
- Titles: engaging, max 8 words, no generic titles like "Introduction" — be specific
- Speaker notes: brief, max 20 words, practical tip or stat to mention

JSON schema for each slide:
{
  "id": number (1-based, sequential),
  "layout": "title" | "bullets" | "two-col" | "quote" | "code" | "closing",
  "title": string,
  "subtitle": string (title/closing only),
  "bullets": string[] (bullets layout only — 3-5 items),
  "leftCol": string[] (two-col only — 2-4 items),
  "rightCol": string[] (two-col only — 2-4 items),
  "leftColTitle": string (two-col only),
  "rightColTitle": string (two-col only),
  "quote": string (quote layout only),
  "quoteAuthor": string (quote layout only),
  "codeSnippet": string (code layout only),
  "codeLanguage": string (code layout only),
  "note": string (optional, max 20 words)
}

Return ONLY the JSON array of ${clampedCount} slide objects.`;

        const slideRaw = await generateGeminiContent({
          systemPrompt: slideSystemPrompt,
          userPrompt: slidePrompt,
          temperature: 0.6,
          jsonMode: true,
        });

        send("phase", { phase: "polishing", message: "Adding final polish…" });

        // Parse slides
        let slides: Slide[];
        try {
          const parsed = JSON.parse(cleanJSON(slideRaw));
          if (!Array.isArray(parsed)) throw new Error("Not an array");
          slides = sanitizeSlides(parsed);
        } catch {
          console.error("[ppt/generate] Failed to parse slides:", slideRaw.slice(0, 500));
          send("error", { error: "AI returned an invalid response. Please try again." });
          controller.close();
          return;
        }

        // Done
        send("done", {
          slides,
          topic: cleanTopic,
          theme,
          slideCount: slides.length,
          researchSummary: (research.overview as string) || "",
        });

        controller.close();
      } catch (err) {
        console.error("[ppt/generate] Pipeline error:", err);
        send("error", { error: "Failed to generate presentation. Please try again." });
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
