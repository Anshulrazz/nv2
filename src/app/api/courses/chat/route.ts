/* eslint-disable */
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { generateGeminiContent } from "@/lib/gemini";

export const POST = auth(async function POST(req) {
  try {
    const userId = req.auth?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized. Please sign in." }, { status: 401 });
    }

    const body = await req.json();
    const { courseTitle, lessonTitle, lessonText, messages } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "Messages array is required." }, { status: 400 });
    }

    const lastUserMessage = messages[messages.length - 1]?.content || "";

    const systemPrompt = `You are "Gemini Course Copilot", an elite AI private tutor helping a student study the course "${courseTitle || "Course"}", specifically on the lecture "${lessonTitle || "Current Lecture"}".

CONTEXT FOR CURRENT LECTURE:
---
${lessonText ? lessonText.slice(0, 4000) : "No specific lecture text available."}
---

INSTRUCTIONS:
1. Answer the student's questions clearly, accurately, and concisely in Markdown.
2. Use the provided lecture context to give relevant, grounded explanations, code examples, or step-by-step solutions.
3. Be encouraging, supportive, and pedagogical.
4. Keep answers focused on the course/lecture topic.
5. If the student asks for practice questions, code snippets, or simplified analogies, provide them directly!`;

    // Construct conversation history for prompt
    const chatHistory = messages
      .slice(-6) // Keep last 6 exchanges for context brevity
      .map((m: { role: string; content: string }) => `${m.role === "user" ? "Student" : "Gemini Copilot"}: ${m.content}`)
      .join("\n\n");

    const userPrompt = `${chatHistory}\n\nStudent: ${lastUserMessage}\n\nGemini Copilot:`;

    const aiResponse = await generateGeminiContent({
      systemPrompt,
      userPrompt,
      temperature: 0.7,
    });

    return NextResponse.json({
      reply: aiResponse,
      engine: process.env.GEMINI_API_KEY ? "Gemini AI (Fallback: OpenRouter)" : "OpenRouter AI",
    });
  } catch (error: any) {
    console.error("[Course Chat API Error]:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process chat message." },
      { status: 500 }
    );
  }
});
