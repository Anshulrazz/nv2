import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { verifyPremiumUser } from "@/lib/premium";
import { generateGeminiContent } from "@/lib/gemini";
import Anthropic from "@anthropic-ai/sdk";

export const dynamic = "force-dynamic";

export const POST = auth(async function POST(req) {
  try {
    const userId = req.auth?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify Premium / Admin Membership
    const { isPremium } = await verifyPremiumUser(userId);
    if (!isPremium) {
      return NextResponse.json(
        {
          error: "Smart AI Notes Writing is an exclusive Premium feature. Upgrade to unlock Gemini AI Superpowers!",
          isPremiumRequired: true,
        },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { action, text, title } = body;

    if (!text || typeof text !== "string" || text.trim() === "") {
      return NextResponse.json({ error: "Note content is required for AI writing." }, { status: 400 });
    }

    let systemPrompt = "You are Notexia's Smart AI Writing Assistant for academic and technical notes.";
    let userPrompt = "";

    switch (action) {
      case "continue":
        systemPrompt += " Continue writing seamlessly from where the user left off. Return ONLY the new continuation text in clean HTML or Markdown format without repeating original text.";
        userPrompt = `Document Title: "${title || "Untitled Note"}"\n\nCurrent Note Text:\n${text}\n\nTask: Continue writing the next logical paragraphs or section of this note seamlessly.`;
        break;

      case "summarize":
        systemPrompt += " Provide a crisp, well-formatted summary of the provided text with bullet points.";
        userPrompt = `Document Title: "${title || "Untitled Note"}"\n\nText:\n${text}\n\nTask: Summarize key takeaways, main thesis, and conclusions clearly.`;
        break;

      case "improve":
        systemPrompt += " Improve writing quality, polish grammar, refine vocabulary, and make the text clear and professional. Return ONLY the revised text.";
        userPrompt = `Text to improve:\n${text}\n\nTask: Rewrite and polish this text while maintaining its original core meaning.`;
        break;

      case "action_items":
        systemPrompt += " Extract actionable tasks, key study checklists, or follow-up items as bullet points.";
        userPrompt = `Text:\n${text}\n\nTask: Extract all actionable tasks, key formulas to review, and study action items.`;
        break;

      default:
        return NextResponse.json({ error: "Invalid AI action specified." }, { status: 400 });
    }

    // 1. Try Gemini API
    const geminiKey = process.env.GEMINI_API_KEY;
    if (geminiKey && geminiKey !== "placeholder" && geminiKey.trim() !== "") {
      try {
        const aiOutput = await generateGeminiContent({
          systemPrompt,
          userPrompt,
          temperature: 0.7,
        });

        return NextResponse.json({ result: aiOutput, engine: "gemini" });
      } catch (geminiError) {
        console.warn("Gemini API failed, attempting Anthropic fallback:", geminiError);
      }
    }

    // 2. Try Anthropic API fallback
    const anthropicKey = process.env.ANTHROPIC_API_KEY;
    if (anthropicKey && anthropicKey !== "placeholder" && anthropicKey.trim() !== "") {
      const anthropic = new Anthropic({ apiKey: anthropicKey });
      const msg = await anthropic.messages.create({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 1500,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
      });

      const firstBlock = msg.content[0];
      const textOutput = firstBlock && "text" in firstBlock ? firstBlock.text : "";
      return NextResponse.json({ result: textOutput, engine: "anthropic" });
    }

    // 3. Fallback smart completion
    const fallbackText = `[AI Smart ${action.toUpperCase()}]\nKey Insights derived from "${title || "Note"}":\n- ${text.substring(0, 150)}...\n- Deep dive into core concepts and structured formulas.\n- Review associated checklists and study items.`;
    return NextResponse.json({ result: fallbackText, engine: "fallback" });
  } catch (error) {
    console.error("Smart AI Notes Writing Error:", error);
    return NextResponse.json({ error: "Failed to process AI writing request." }, { status: 500 });
  }
});
