import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { Note } from "@/models/Note";
import { Todo } from "@/models/Todo";
import Anthropic from "@anthropic-ai/sdk";

export const dynamic = "force-dynamic";

// Fallback dynamic study planner when Claude API Key is not configured
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
      reason: "Start the day by reviewing active study guides.",
      estimatedMinutes: 45
    });
  }

  // Generate afternoon task based on notes
  if (notesList.length > 0) {
    timeline.push({
      timeSlot: "Afternoon" as const,
      task: `Review notes: ${notesList[0].title}`,
      reason: `Scan and synthesize concepts from document "${notesList[0].title}".`,
      estimatedMinutes: 90
    });
  } else {
    timeline.push({
      timeSlot: "Afternoon" as const,
      task: "Digested Video Review",
      reason: "Review key terminology from YouTube studies.",
      estimatedMinutes: 60
    });
  }

  // Generate evening wrap-up task
  if (pendingTodos.length > 1) {
    timeline.push({
      timeSlot: "Evening" as const,
      task: `Check off: ${pendingTodos[1].title}`,
      reason: "Complete final checklist items for the day.",
      estimatedMinutes: 30
    });
  } else if (notesList.length > 1) {
    timeline.push({
      timeSlot: "Evening" as const,
      task: `Spaced recall study: ${notesList[1].title}`,
      reason: `Synthesize concept glossary for "${notesList[1].title}".`,
      estimatedMinutes: 45
    });
  } else {
    timeline.push({
      timeSlot: "Evening" as const,
      task: "Prep Quiz Check",
      reason: "Verify comprehension levels with mock quiz check.",
      estimatedMinutes: 30
    });
  }

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

    await connectToDatabase();

    // Fetch user's active notes and pending todos
    const notesList = await Note.find({ userId, isTrashed: false })
      .sort({ updatedAt: -1 })
      .limit(10);
    
    const pendingTodos = await Todo.find({ userId, isCompleted: false })
      .sort({ createdAt: -1 })
      .limit(10);

    const apiKey = process.env.ANTHROPIC_API_KEY;

    // 1. Fallback dynamic plan compiler if key is missing
    if (!apiKey || apiKey === "placeholder" || apiKey === "") {
      const fallbackResult = generateFallbackPlan(notesList, pendingTodos);
      // Simulate delay for generating planner
      await new Promise(r => setTimeout(r, 1200));
      return NextResponse.json(fallbackResult);
    }

    // 2. Format notes and todos into prompting instructions
    const notesText = notesList.map((n, idx) => `[Note ${idx + 1}] Title: "${n.title}"`).join("\n");
    const todosText = pendingTodos.map((t, idx) => `[Todo ${idx + 1}] Title: "${t.title}" ${t.reminderAt ? `(Reminder: ${t.reminderAt})` : ""}`).join("\n");

    const anthropic = new Anthropic({ apiKey });
    const response = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 4096,
      system: `You are Notexia's smart daily planner assistant. Analyze the user's notes list and outstanding checklist items.
      Based on these, generate a comprehensive daily timeline schedule for today (2026-07-25) in strict, clean JSON format.
      Do NOT wrap in markdown code blocks. Return ONLY raw JSON.`,
      messages: [
        {
          role: "user",
          content: `Analyze the study files and outstanding items:
          
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
                "reason": "Explanation of why this task is scheduled (e.g. 'Derived from pending Todo \"X\"' or 'Study document \"Y\"').",
                "estimatedMinutes": 45
              }
            ]
          }
          
          Generate exactly 3 timeline slots (Morning, Afternoon, Evening). Ensure the JSON is clean and valid.`
        }
      ]
    });

    let rawText = response.content[0].type === "text" ? response.content[0].text : "";
    
    // Strip markdown code blocks if Claude wraps them
    if (rawText.startsWith("```json")) {
      rawText = rawText.substring(7);
    }
    if (rawText.endsWith("```")) {
      rawText = rawText.substring(0, rawText.length - 3);
    }
    rawText = rawText.trim();

    try {
      const parsed = JSON.parse(rawText);
      return NextResponse.json(parsed);
    } catch (parseErr) {
      console.error("Failed to parse daily plan JSON from Claude response:", parseErr, rawText);
      const fallbackResult = generateFallbackPlan(notesList, pendingTodos);
      return NextResponse.json(fallbackResult);
    }
  } catch (error) {
    console.error("AI Daily Planner API error:", error);
    return NextResponse.json({ error: "Failed to generate AI Daily Plan." }, { status: 500 });
  }
});
