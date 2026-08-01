import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { generateGeminiContent } from "@/lib/gemini";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { title, subject, prompt: customPrompt } = body;

    if (!title && !subject && !customPrompt) {
      return NextResponse.json({ error: "Please provide a title, subject, or prompt for image generation." }, { status: 400 });
    }

    let imagePrompt = customPrompt || "";

    if (!imagePrompt) {
      try {
        imagePrompt = await generateGeminiContent({
          systemPrompt: "You are an AI image prompt engineer. Convert the given academic topic into a concise, vivid 25-word visual prompt suitable for generating an artistic 1200x630 banner. Output ONLY the raw prompt text, no quotes.",
          userPrompt: `Title: "${title || "Academic Study Note"}"\nSubject: "${subject || "Education"}"\nGenerate an aesthetic cover image prompt.`,
          temperature: 0.7,
        });
      } catch (err) {
        console.warn("[AI Cover] Prompt refinement failed, using fallback:", err);
        imagePrompt = `${subject || "Study"} ${title || "Lecture Notes"} futuristic academic banner dark aesthetic 8k`;
      }
    }

    // Clean prompt for URL
    const cleanPrompt = String(imagePrompt)
      .replace(/[^\w\s,-]/gi, "")
      .trim();

    const seed = Math.floor(Math.random() * 900000) + 100000;
    const coverImageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(cleanPrompt)}?width=1200&height=630&nologo=true&seed=${seed}`;

    return NextResponse.json({
      success: true,
      coverImageUrl,
      prompt: cleanPrompt,
    });
  } catch (error) {
    console.error("[AI Cover Error]:", error);
    return NextResponse.json({ error: "Failed to generate AI cover image." }, { status: 500 });
  }
}
