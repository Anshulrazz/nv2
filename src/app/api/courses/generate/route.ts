/* eslint-disable */
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { generateGeminiContent } from "@/lib/gemini";

export const maxDuration = 60; // Allow up to 60s for multi-stage AI generation

/**
 * Robust JSON parser for LLM outputs containing control characters, unescaped newlines inside strings, or extra text
 */
function safeParseJson(raw: string): any {
  let cleaned = raw.trim();

  // Strip markdown code fences if present
  cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();

  // Extract outermost JSON object braces
  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1) {
    cleaned = cleaned.slice(firstBrace, lastBrace + 1);
  }

  // Attempt 1: Direct JSON parse
  try {
    return JSON.parse(cleaned);
  } catch (err1) {
    console.warn("[AI Course Generator] Direct JSON parse failed, attempting string-literal control character fix...");
  }

  // Attempt 2: Fix unescaped control characters (like raw unescaped line breaks, tabs) inside string values
  try {
    const fixedStrings = cleaned.replace(/"((?:[^"\\]|[\s\S])*?)"/g, (match) => {
      return match
        .replace(/\n/g, "\\n")
        .replace(/\r/g, "\\r")
        .replace(/\t/g, "\\t");
    });
    return JSON.parse(fixedStrings);
  } catch (err2) {
    console.warn("[AI Course Generator] String-literal fix failed, attempting control character sanitization...");
  }

  // Attempt 3: Remove invalid control characters (0x00 - 0x1F except \n \r \t)
  try {
    const sanitized = cleaned.replace(/[\u0000-\u0009\u000B\u000C\u000E-\u001F]/g, "");
    return JSON.parse(sanitized);
  } catch (err3) {
    console.error("[AI Course Generator] All JSON parsing attempts failed:", err3);
    throw new Error("Failed to parse course structure from AI. Please try again.");
  }
}

export const POST = auth(async function POST(req) {
  try {
    const userId = req.auth?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized. Please sign in." }, { status: 401 });
    }

    const body = await req.json();
    const { topic, level = "Intermediate", targetAudience = "General Learners", price = 0, additionalInstructions = "" } = body;

    if (!topic || typeof topic !== "string" || topic.trim() === "") {
      return NextResponse.json({ error: "Course topic is required." }, { status: 400 });
    }

    const systemPrompt = `You are an elite master curriculum designer and domain expert. Your task is to generate a comprehensive, highly thorough, professional course on the given topic.

CRITICAL REQUIREMENTS:
1. The total course word count across all modules and lessons MUST BE EXTREMELY DETAILED (at least 5,000+ words in total across all text fields).
2. Create 4 to 6 Modules.
3. Each Module MUST contain 3 to 5 Lessons.
4. For EACH Lesson:
   - Provide an extensive, deep-dive explanation text in Markdown (at least 300 to 500+ words per lesson) covering theoretical concepts, step-by-step code/formula examples, key takeaways, diagrams in ASCII or bullet lists, and real-world practical applications.
   - Include 2 to 3 Knowledge Check Quiz questions with 4 options and the zero-based index of the correct option.
5. Provide a captivating course title and description.
6. STYLE & FORMAT: Return strictly valid JSON. Escape all newlines in string properties using \\n so that the JSON is 100% valid.

Return ONLY a valid JSON object strictly adhering to this structure with NO markdown backticks or commentary outside JSON:
{
  "title": "Course Title",
  "description": "Comprehensive course overview and learning objectives...",
  "price": ${Number(price) || 0},
  "modules": [
    {
      "title": "Module 1 Title",
      "lessons": [
        {
          "title": "Lesson 1.1 Title",
          "text": "Detailed, deep-dive lesson content in Markdown...",
          "quiz": [
            {
              "question": "Question text?",
              "options": ["Option A", "Option B", "Option C", "Option D"],
              "correctOptionIndex": 0
            }
          ]
        }
      ]
    }
  ]
}`;

    const userPrompt = `Topic: "${topic.trim()}"
Target Level: ${level}
Target Audience: ${targetAudience}
${additionalInstructions ? `Special Instructions: ${additionalInstructions}` : ""}

Please construct the complete 5000+ word, multi-module, multi-lecture course in exact JSON format. Ensure all lesson text fields are filled with comprehensive, high-quality, step-by-step markdown explanations.`;

    const rawOutput = await generateGeminiContent({
      systemPrompt,
      userPrompt,
      temperature: 0.7,
      jsonMode: true,
    });

    const parsedCourse = safeParseJson(rawOutput);
    parsedCourse.price = typeof price === "number" ? price : Number(price) || 0;

    return NextResponse.json({
      success: true,
      course: parsedCourse,
    });
  } catch (error: any) {
    console.error("[AI Course Generation Error]:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate course with AI." },
      { status: 500 }
    );
  }
});
