import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { query } = await req.json().catch(() => ({}));

    if (!query || typeof query !== "string" || !query.trim()) {
      return NextResponse.json({ error: "Query is required." }, { status: 400 });
    }

    const openRouterApiKey = process.env.OPENROUTER_API_KEY;
    if (!openRouterApiKey || openRouterApiKey === "placeholder") {
      return NextResponse.json({ error: "OpenRouter API key is not configured." }, { status: 500 });
    }

    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openRouterApiKey}`,
        "HTTP-Referer": process.env.OPENROUTER_SITE_URL || "https://notexia.in",
        "X-Title": process.env.OPENROUTER_SITE_NAME || "Notexia",
      },
      body: JSON.stringify({
        model: "openai/gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "You are Notexia AI Copilot, an elite academic assistant for Indian engineering & competitive exams (JEE, NEET, GATE, VTU). Format your answer using concise Markdown, clean bullet points, code snippets, or LaTeX math equations ($...$ or $$...$$). Keep answers under 200 words.",
          },
          {
            role: "user",
            content: query.trim(),
          },
        ],
        temperature: 0.5,
        max_tokens: 500,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("OpenRouter Demo AI Error:", errText);
      return NextResponse.json({ error: "Failed to fetch response from OpenRouter." }, { status: 500 });
    }

    const data = await res.json();
    const answer = data.choices?.[0]?.message?.content || "No response generated.";

    return NextResponse.json({
      response: answer,
      engine: "OpenRouter (GPT-4o-mini)",
    });
  } catch (error) {
    console.error("Demo AI route error:", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
