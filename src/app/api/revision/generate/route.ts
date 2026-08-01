import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { Note } from "@/models/Note";
import Anthropic from "@anthropic-ai/sdk";
import { isValidObjectId } from "@/lib/validation";

import { verifyPremiumUser } from "@/lib/premium";
import { generateGeminiContent } from "@/lib/gemini";

export const dynamic = "force-dynamic";

interface TipTapNode {
  type?: string;
  text?: string;
  content?: TipTapNode[];
}

function extractText(node: TipTapNode): string {
  if (!node) return "";
  if (node.type === "text") return node.text || "";
  if (node.content) {
    return node.content.map(extractText).join(" ");
  }
  return "";
}

// Robust JSON response normalizer for Cheat Sheets, Flashcards, and Quizzes
function parseAndNormalizeRevisionResponse(
  rawText: string,
  mode: "cheatsheet" | "flashcards" | "quiz",
  noteTitle: string
) {
  let cleaned = rawText
    .replace(/```json/gi, "")
    .replace(/```/gi, "")
    .trim();

  const jsonMatch = cleaned.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
  if (jsonMatch) {
    cleaned = jsonMatch[0];
  }

  let parsed = JSON.parse(cleaned);

  if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
    if (parsed.data && typeof parsed.data === "object") parsed = parsed.data;
    else if (parsed.result && typeof parsed.result === "object") parsed = parsed.result;
    else if (parsed.revision && typeof parsed.revision === "object") parsed = parsed.revision;
  }

  // Mode: Cheat Sheet
  if (mode === "cheatsheet") {
    let cheatsheetData = parsed.cheatsheet || parsed;
    if (!cheatsheetData.summary && typeof cheatsheetData === "object") {
      cheatsheetData = {
        summary: cheatsheetData.overview || cheatsheetData.summary || "Summary of the study content.",
        concepts: Array.isArray(cheatsheetData.concepts) ? cheatsheetData.concepts : (Array.isArray(cheatsheetData.terms) ? cheatsheetData.terms : []),
        formulas: Array.isArray(cheatsheetData.formulas) ? cheatsheetData.formulas : (Array.isArray(cheatsheetData.equations) ? cheatsheetData.equations : []),
        highlights: Array.isArray(cheatsheetData.highlights) ? cheatsheetData.highlights : (Array.isArray(cheatsheetData.keyPoints) ? cheatsheetData.keyPoints : []),
      };
    }

    return {
      title: parsed.title || `${noteTitle} Cheat Sheet`,
      type: "cheatsheet",
      cheatsheet: {
        summary: cheatsheetData.summary || "Executive overview of the study material.",
        concepts: (cheatsheetData.concepts || []).map((c: Record<string, unknown>) => ({
          term: String(c.term || c.name || "Concept"),
          definition: String(c.definition || c.description || "Explanation of key concept."),
        })),
        formulas: (cheatsheetData.formulas || []).map((f: Record<string, unknown>) => ({
          name: String(f.name || f.title || "Rule / Formula"),
          description: String(f.description || f.formula || f.value || "Description or equation."),
        })),
        highlights: Array.isArray(cheatsheetData.highlights)
          ? cheatsheetData.highlights.map(String)
          : ["Focus on core concepts.", "Review formulas repeatedly."],
      },
    };
  }

  // Mode: Flashcards
  if (mode === "flashcards") {
    let rawCards = parsed.flashcards || parsed.cards || (Array.isArray(parsed) ? parsed : []);
    if (!Array.isArray(rawCards) && typeof parsed === "object") {
      const foundArray = Object.values(parsed).find(Array.isArray);
      if (foundArray) rawCards = foundArray;
    }

    const flashcards = (Array.isArray(rawCards) ? rawCards : []).map((c: Record<string, unknown>) => ({
      question: String(c.question || c.q || "What is the key concept discussed?"),
      answer: String(c.answer || c.a || c.definition || "Explanation details."),
    }));

    return {
      title: parsed.title || `${noteTitle} Spaced Flashcards`,
      type: "flashcards",
      flashcards: flashcards.length > 0 ? flashcards : [
        { question: `What is the primary topic of ${noteTitle}?`, answer: "Review the key topics and foundational principles explained in the note." }
      ],
    };
  }

  // Mode: Quiz
  let rawQuiz = parsed.quiz || parsed.questions || parsed.mcqs || (Array.isArray(parsed) ? parsed : []);
  if (!Array.isArray(rawQuiz) && typeof parsed === "object") {
    const foundArray = Object.values(parsed).find(Array.isArray);
    if (foundArray) rawQuiz = foundArray;
  }

  const quiz = (Array.isArray(rawQuiz) ? rawQuiz : []).map((q: Record<string, unknown>) => {
    const rawOptions = Array.isArray(q.options)
      ? q.options.map(String)
      : Array.isArray(q.choices)
      ? q.choices.map(String)
      : ["Option A", "Option B", "Option C", "Option D"];

    while (rawOptions.length < 4) {
      rawOptions.push(`Option ${String.fromCharCode(65 + rawOptions.length)}`);
    }

    let correctIndex = typeof q.correctAnswerIndex === "number"
      ? q.correctAnswerIndex
      : typeof q.correctIndex === "number"
      ? q.correctIndex
      : typeof q.answerIndex === "number"
      ? q.answerIndex
      : 0;

    if (correctIndex < 0 || correctIndex > 3) correctIndex = 0;

    return {
      question: q.question || "Which of the following statements is correct?",
      options: rawOptions.slice(0, 4),
      correctAnswerIndex: correctIndex,
      explanation: q.explanation || `Option ${String.fromCharCode(65 + correctIndex)} is the correct answer according to the study material.`,
    };
  });

  return {
    title: parsed.title || `${noteTitle} Practice Quiz`,
    type: "quiz",
    quiz: quiz.length > 0 ? quiz : [
      {
        question: `What is the main objective of studying ${noteTitle}?`,
        options: ["To master core concepts", "To skip revision", "To ignore formulas", "None of the above"],
        correctAnswerIndex: 0,
        explanation: "Mastering core concepts is the primary goal of smart revision."
      }
    ],
  };
}

// Fallback dynamic generator if AI keys fail completely
function generateFallbackMaterial(text: string, mode: "cheatsheet" | "flashcards" | "quiz", title: string) {
  const cleanTitle = title || "Study Guide";
  const words = text.split(/\s+/).filter(w => w.length > 3);
  
  const keywords = Array.from(new Set(
    words
      .map(w => w.replace(/[^a-zA-Z]/g, ""))
      .filter(w => w.length > 4 && w[0] === w[0].toUpperCase())
  )).slice(0, 8);

  const defaultKeywords = keywords.length > 2 ? keywords : ["Variable", "Function", "Module", "Database", "Asynchronous"];

  const sentences = text
    .split(/[.!?]+/)
    .map(s => s.trim())
    .filter(s => s.length > 10);
  
  const summary = sentences.slice(0, 3).join(". ") + (sentences.length > 3 ? "." : "");

  if (mode === "cheatsheet") {
    const concepts = defaultKeywords.map((kw) => {
      const matchingSentence = sentences.find(s => s.toLowerCase().includes(kw.toLowerCase()));
      return {
        term: kw,
        definition: matchingSentence || `${kw} is a key concept defined in the notes, representing crucial functionality in ${cleanTitle}.`
      };
    });

    const formulas = [
      { name: "Optimal Study Interval", description: "T = (Session Duration) * 1.5 + (Break time)" },
      { name: "Retention Rate Efficiency", description: "R = (Active Recalls / Total Reviews) * 100%" }
    ];

    const highlights = sentences.slice(0, 4).length > 0 ? sentences.slice(0, 4) : [
      "Revision is key to long-term memory retrieval.",
      "Reviewing concept summaries before self-testing increases confidence."
    ];

    return {
      title: `${cleanTitle} Cheat Sheet`,
      type: "cheatsheet",
      cheatsheet: {
        summary: summary || "This study guide provides an overview of the core concepts explained in the note.",
        concepts,
        formulas,
        highlights
      }
    };
  }

  if (mode === "flashcards") {
    const flashcards = defaultKeywords.map((kw) => {
      const matchingSentence = sentences.find(s => s.toLowerCase().includes(kw.toLowerCase()));
      return {
        question: `What is the significance of "${kw}" in ${cleanTitle}?`,
        answer: matchingSentence || `In the context of ${cleanTitle}, "${kw}" represents a fundamental building block.`
      };
    });

    return {
      title: `${cleanTitle} Flashcards`,
      type: "flashcards",
      flashcards
    };
  }

  const quiz = defaultKeywords.map((kw) => {
    const incorrectChoices = defaultKeywords.filter(k => k !== kw).slice(0, 3);
    while (incorrectChoices.length < 3) {
      incorrectChoices.push(`Alternative ${incorrectChoices.length + 1}`);
    }
    const options = [kw, ...incorrectChoices].sort(() => Math.random() - 0.5);
    const correctAnswerIndex = options.indexOf(kw);

    return {
      question: `Which term represents the core concept "${kw}" in ${cleanTitle}?`,
      options,
      correctAnswerIndex,
      explanation: `In ${cleanTitle}, "${kw}" is the primary concept.`
    };
  });

  return {
    title: `${cleanTitle} Prep Quiz`,
    type: "quiz",
    quiz
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
          error: "Revision Generator (Cheat Sheets, Flashcards, Quizzes) is an exclusive Premium feature. Upgrade to Premium to unlock AI Revision!",
          isPremiumRequired: true,
        },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { noteId, customText, mode } = body;

    if (!mode || !["cheatsheet", "flashcards", "quiz"].includes(mode)) {
      return NextResponse.json({ error: "Invalid revision mode specified." }, { status: 400 });
    }

    await connectToDatabase();

    let studyText = "";
    let noteTitle = "Untitled Study Note";

    if (noteId && typeof noteId === "string") {
      if (!isValidObjectId(noteId)) {
        return NextResponse.json({ error: "Invalid note ID format." }, { status: 400 });
      }

      const note = await Note.findOne({ _id: noteId, userId });
      if (!note) {
        return NextResponse.json({ error: "Study note not found or access denied." }, { status: 404 });
      }
      noteTitle = note.title;
      studyText = extractText(note.content as TipTapNode) || note.title;
    } else if (customText && typeof customText === "string") {
      studyText = customText.trim();
      noteTitle = "Custom Text";
    }

    if (!studyText) {
      return NextResponse.json({ error: "Please select a note with content or paste study text." }, { status: 400 });
    }

    let promptDetails = "";
    if (mode === "cheatsheet") {
      promptDetails = `
      Create a Cheat Sheet with:
      - title: Short title string
      - summary: A 2-3 paragraph detailed summary condensing the core lessons.
      - concepts: An array of up to 6 objects, each with:
          - term: concept name
          - definition: detailed explanation of term
      - formulas: An array of key formulas or rules, each with:
          - name: Formula/rule name
          - description: Formula equation or rule summary
      - highlights: Array of 3-5 bullet points.
      
      Output JSON:
      {
        "title": "${noteTitle} Cheat Sheet",
        "type": "cheatsheet",
        "cheatsheet": {
          "summary": "...",
          "concepts": [{"term": "...", "definition": "..."}],
          "formulas": [{"name": "...", "description": "..."}],
          "highlights": ["..."]
        }
      }
      `;
    } else if (mode === "flashcards") {
      promptDetails = `
      Create Flashcards containing up to 8 cards. Each has a question and a detailed answer.
      
      Output JSON:
      {
        "title": "${noteTitle} Spaced Flashcards",
        "type": "flashcards",
        "flashcards": [{"question": "...", "answer": "..."}]
      }
      `;
    } else {
      promptDetails = `
      Create an Exam Practice Quiz of 5 multiple choice questions. Each question has:
      - question: Question text
      - options: Array of 4 string choices
      - correctAnswerIndex: Index of correct choice (0, 1, 2, or 3)
      - explanation: Detailed explanation of why it is correct.
      
      Output JSON:
      {
        "title": "${noteTitle} Practice Quiz",
        "type": "quiz",
        "quiz": [{"question": "...", "options": ["...", "...", "...", "..."], "correctAnswerIndex": 0, "explanation": "..."}]
      }
      `;
    }

    const systemPrompt = `You are Notexia's smart study assistant. You generate revision materials (Cheat sheets, Flashcards, and Quizzes) from notes in strict, clean JSON. 
Do NOT include any preamble or conversational text. Return raw valid JSON matching the requested structure.`;
    const userPrompt = `Study Content:\n\n${studyText}\n\nTask: ${promptDetails}`;

    // 1. Primary Engine: Gemini (with automatic OpenRouter fallback)
    try {
      const rawResponseText = await generateGeminiContent({
        systemPrompt,
        userPrompt,
        jsonMode: true,
      });

      const normalizedResult = parseAndNormalizeRevisionResponse(rawResponseText, mode, noteTitle);
      return NextResponse.json(normalizedResult);
    } catch (aiEngineErr) {
      console.warn("[Revision API] Primary AI Engine (Gemini / OpenRouter) failed:", aiEngineErr);
    }

    // 2. Secondary Backup Engine: Anthropic API (if configured)
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (apiKey && apiKey !== "placeholder" && apiKey !== "") {
      try {
        const anthropic = new Anthropic({ apiKey });
        const response = await anthropic.messages.create({
          model: "claude-3-5-sonnet-20241022",
          max_tokens: 4090,
          system: systemPrompt,
          messages: [{ role: "user", content: userPrompt }],
        });

        const rawText = response.content[0].type === "text" ? response.content[0].text : "";
        const normalizedResult = parseAndNormalizeRevisionResponse(rawText, mode, noteTitle);
        return NextResponse.json(normalizedResult);
      } catch (anthropicErr) {
        console.warn("[Revision API] Anthropic fallback failed:", anthropicErr);
      }
    }

    // 3. Last Resort Fallback Generator
    console.warn("[Revision API] All AI engines failed. Utilizing dynamic fallback material.");
    const fallbackResult = generateFallbackMaterial(studyText, mode, noteTitle);
    return NextResponse.json(fallbackResult);
  } catch (error) {
    console.error("Generate revision error:", error);
    return NextResponse.json({ error: "Failed to generate revision materials." }, { status: 500 });
  }
});
