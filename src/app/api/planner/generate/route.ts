import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { Note } from "@/models/Note";
import { Todo } from "@/models/Todo";
import Anthropic from "@anthropic-ai/sdk";

import { verifyPremiumUser } from "@/lib/premium";
import { generateGeminiContent } from "@/lib/gemini";

export const dynamic = "force-dynamic";

// Fallback dynamic study planner when AI Key is not configured
function generateFallbackPlan(notesList: Array<{ title?: string }>, pendingTodos: Array<{ title?: string }>) {
  const dateStr = "2026-07-25";
  const focus = pendingTodos.length > 0 
    ? `Address critical outstanding assignments: "${pendingTodos[0].title}". Also digest recent updates in notes.`
    : "Review active study files and structure key summaries.";

  const timeline = [];

  // Generate morning task based on pending todos
  if (pendingTodos.length > 0) {
    timeline.push({
      timeSlot: "Morning" as const,
      task: `Finish pending task: ${pendingTodos[0].title}`,
      reason: "High priority task outstanding in your checklist.",
      estimatedMinutes: 60
    });
  } else {
    timeline.push({
      timeSlot: "Morning" as const,
      task: "Morning Concept Refresher",
      reason: "Review recent notes to solidify core definitions.",
      estimatedMinutes: 45
    });
  }

  // Generate afternoon task based on notes
  if (notesList.length > 0) {
    timeline.push({
      timeSlot: "Afternoon" as const,
      task: `Deep study: ${notesList[0].title || "Notes File"}`,
      reason: "Comprehensive note analysis and formula review.",
      estimatedMinutes: 90
    });
  } else {
    timeline.push({
      timeSlot: "Afternoon" as const,
      task: "Deep Focus Session",
      reason: "Create new structured study materials.",
      estimatedMinutes: 75
    });
  }

  // Evening consolidation task
  timeline.push({
    timeSlot: "Evening" as const,
    task: "Quiz & Recall Practice",
    reason: "Test retention with flashcards or practice questions.",
    estimatedMinutes: 30
  });

  return {
    date: dateStr,
    focus,
    timeline
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
          error: "AI Daily Planner is an exclusive Premium feature. Upgrade to Premium to unlock Gemini AI study timelines!",
          isPremiumRequired: true,
        },
        { status: 403 }
      );
    }

    await connectToDatabase();

    const notesList = await Note.find({ userId })
      .select("title")
      .sort({ updatedAt: -1 })
      .limit(10);
    
    const pendingTodos = await Todo.find({ userId, isCompleted: false })
      .sort({ createdAt: -1 })
      .limit(10);

    const notesText = notesList.map((n, idx) => `[Note ${idx + 1}] Title: "${n.title}"`).join("\n");
    const todosText = pendingTodos.map((t, idx) => `[Todo ${idx + 1}] Title: "${t.title}" ${t.reminderAt ? `(Reminder: ${t.reminderAt})` : ""}`).join("\n");

    const systemPrompt = `You are Notexia's smart daily planner assistant. Analyze the user's notes list and outstanding checklist items.
    Based on these, generate a comprehensive daily timeline schedule for today (2026-07-25) in strict, clean JSON format.
    Do NOT wrap in markdown code blocks. Return ONLY raw JSON.`;

    const userPrompt = `Analyze the study files and outstanding items:
    
    User Active Notes List:
    ${notesText || "(No active notes found)"}
    
    Outstanding Todo Checklist:
    ${todosText || "(No pending todos found)"}
    
    Today's Date Context: 2026-07-25
    
    Task: Generate a customized study schedule for today.
    
    Required Output Schema:
    {
      "date": "2026-07-25",
      "focus": "Summary of today's primary focus based on notes and checklist items.",
      "timeline": [
        {
          "timeSlot": "Morning" | "Afternoon" | "Evening",
          "task": "Actionable task title derived from note review or pending todos.",
          "reason": "Explanation of why this task is scheduled.",
          "estimatedMinutes": 45
        }
      ]
    }`;

    // 1. Try Gemini API
    const geminiKey = process.env.GEMINI_API_KEY;
    if (geminiKey && geminiKey !== "placeholder" && geminiKey.trim() !== "") {
      try {
        const rawJson = await generateGeminiContent({
          systemPrompt,
          userPrompt,
          jsonMode: true,
        });

        const cleaned = rawJson.replace(/```json/g, "").replace(/```/g, "").trim();
        const parsed = JSON.parse(cleaned);
        return NextResponse.json(parsed);
      } catch (geminiErr) {
        console.warn("Gemini planner failed, trying Anthropic fallback:", geminiErr);
      }
    }

    // 2. Try Anthropic API
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (apiKey && apiKey !== "placeholder" && apiKey !== "") {
      try {
        const anthropic = new Anthropic({ apiKey });
        const response = await anthropic.messages.create({
          model: "claude-3-5-sonnet-20241022",
          max_tokens: 4096,
          system: systemPrompt,
          messages: [{ role: "user", content: userPrompt }],
        });

        let rawText = response.content[0].type === "text" ? response.content[0].text : "";
        rawText = rawText.replace(/```json/g, "").replace(/```/g, "").trim();
        const parsed = JSON.parse(rawText);
        return NextResponse.json(parsed);
      } catch (anthropicErr) {
        console.warn("Anthropic planner failed:", anthropicErr);
      }
    }

    // 3. Fallback Plan Compiler
    const fallbackResult = generateFallbackPlan(notesList, pendingTodos);
    return NextResponse.json(fallbackResult);
  } catch (error) {
    console.error("Generate planner error:", error);
    return NextResponse.json({ error: "Failed to generate daily plan." }, { status: 500 });
  }
});
