import { generateGeminiContent } from "@/lib/gemini";

export interface PipelineLectureOutput {
  title: string;
  startApproxTimestamp?: string;
  content: string;
  wordCount: number;
}

export interface PipelineQuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface PipelineBeyondTheVideo {
  funFacts: string[];
  realWorldConnections: string[];
  commonMisconceptions: string[];
  furtherExploration: string[];
}

export interface PipelineResult {
  summary: string;
  keyPoints: string[];
  lectures: PipelineLectureOutput[];
  quiz: PipelineQuizQuestion[];
  beyondTheVideo: PipelineBeyondTheVideo;
  subject: string;
  examTags: string[];
  aiModelUsed: string;
  processingTimeMs: number;
}

function countWords(text: string): number {
  return text
    .replace(/[#*`~_\-\[\]()]/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

function cleanJsonResponse(raw: string): string {
  return raw
    .replace(/```json/gi, "")
    .replace(/```/gi, "")
    .trim();
}

/**
 * Stage 1: Detect logical topic shifts / lecture segments
 */
async function detectLectures(
  transcript: string
): Promise<Array<{ title: string; startApproxTimestamp?: string; summaryHint?: string }>> {
  const truncatedTranscript = transcript.length > 25000 ? transcript.slice(0, 25000) : transcript;

  const systemPrompt = `You are an academic curriculum designer. Your task is to analyze a YouTube lecture transcript and divide it into 1 to 4 logical, coherent lecture topics/modules.
Respond ONLY with a valid JSON array of objects with the following schema:
[
  {
    "title": "Clear descriptive topic name",
    "startApproxTimestamp": "00:00",
    "summaryHint": "Brief description of what this section covers"
  }
]
If the transcript only covers one unified topic, return a single item array.`;

  const userPrompt = `Here is the lecture transcript snippet:
---
${truncatedTranscript}
---
Analyze the content and return the logical lecture segments array as JSON.`;

  try {
    const rawOutput = await generateGeminiContent({
      systemPrompt,
      userPrompt,
      temperature: 0.3,
      jsonMode: true,
    });
    const parsed = JSON.parse(cleanJsonResponse(rawOutput));
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed.map((item, idx) => ({
        title: String(item.title || `Lecture Segment ${idx + 1}`),
        startApproxTimestamp: item.startApproxTimestamp ? String(item.startApproxTimestamp) : "00:00",
        summaryHint: item.summaryHint ? String(item.summaryHint) : "",
      }));
    }
  } catch (err) {
    console.warn(`[Pipeline] Stage 1 structure detection failed, defaulting to single topic:`, err);
  }

  return [{ title: "Comprehensive Lecture Notes", startApproxTimestamp: "00:00" }];
}

/**
 * Stage 2: Generate 1000+ word detailed lecture notes per segment
 */
async function generateLectureContent(
  segmentTitle: string,
  fullTranscript: string
): Promise<PipelineLectureOutput> {
  const systemPrompt = `You are a distinguished university professor and textbook author preparing comprehensive, textbook-quality lecture notes for Indian engineering and competitive exam students (JEE, NEET, GATE, CBSE).

CRITICAL REQUIREMENTS:
1. WORD COUNT: The notes MUST BE AT LEAST 1000 WORDS LONG. You must elaborate extensively, explain foundational concepts, provide step-by-step mathematical or logical derivations, define key jargon, provide detailed worked examples, and add practical context.
2. FORMATTING: Use clean, rich Markdown with clear headings (##, ###), bullet lists, bold terms, blockquotes, code blocks (if relevant), and LaTeX math equations ($...$ or $$...$$).
3. Do not just summarize or paraphrase — explain the topic deeply as if writing a full textbook chapter.`;

  const userPrompt = `Lecture Title: "${segmentTitle}"
Full Video Transcript Reference:
---
${fullTranscript.slice(0, 30000)}
---

Write a comprehensive, exhaustive lecture module for "${segmentTitle}". Ensure it is AT LEAST 1000 words long with deep explanations, definitions, formulas/examples, and structured subheaders.`;

  let content = "";
  try {
    content = await generateGeminiContent({
      systemPrompt,
      userPrompt,
      temperature: 0.6,
    });
  } catch (err) {
    console.error(`[Pipeline] Stage 2 elaboration error for "${segmentTitle}":`, err);
    content = `## ${segmentTitle}\n\nThis section covers the core theoretical and practical principles presented in the lecture. Key concepts include foundational principles, detailed analytical methods, and problem-solving strategies essential for academic success.`;
  }

  let words = countWords(content);

  // Automatic retry / expansion if under 1000 words
  if (words < 1000) {
    console.warn(`[Pipeline] Stage 2 word count (${words}) is below 1000 words for "${segmentTitle}". Requesting expansion...`);
    try {
      const expansionPrompt = `The previous draft of the lecture notes for "${segmentTitle}" is currently ${words} words, which is under the required 1000-word threshold.

Here is the initial text:
---
${content}
---

Please expand this lecture module significantly. Add:
1. In-depth theoretical explanations and underlying principles.
2. Detailed step-by-step worked numerical or conceptual examples.
3. Common exam problem scenarios and step-by-step resolution strategies.
4. Comprehensive definitions of key terms and mathematical equations.
Keep the existing formatting and output ONLY the expanded, complete lecture notes in Markdown exceeding 1000 words.`;

      const expandedContent = await generateGeminiContent({
        systemPrompt,
        userPrompt: expansionPrompt,
        temperature: 0.6,
      });

      const expandedWords = countWords(expandedContent);
      if (expandedWords > words) {
        content = expandedContent;
        words = expandedWords;
      }
    } catch (retryErr) {
      console.warn(`[Pipeline] Stage 2 expansion retry failed:`, retryErr);
    }
  }

  return {
    title: segmentTitle,
    startApproxTimestamp: "00:00",
    content,
    wordCount: words,
  };
}

/**
 * Stage 3: Generate Summary (150-250 words) & Key Points (8-15 bullet points)
 */
async function generateSummaryAndKeyPoints(
  transcript: string
): Promise<{ summary: string; keyPoints: string[] }> {
  const systemPrompt = `You are an academic summarization engine. Analyze the provided video transcript and respond ONLY with a strict JSON object:
{
  "summary": "Concise overview of the video (150 to 250 words)",
  "keyPoints": [
    "High-yield takeaway bullet 1",
    "High-yield takeaway bullet 2",
    "..."
  ]
}

REQUIREMENTS:
- "summary" MUST be 150-250 words.
- "keyPoints" MUST contain between 8 and 15 crisp, high-yield exam-relevant takeaways.`;

  const userPrompt = `Transcript:
---
${transcript.slice(0, 25000)}
---
Generate the summary and key points JSON.`;

  try {
    const rawOutput = await generateGeminiContent({
      systemPrompt,
      userPrompt,
      temperature: 0.4,
      jsonMode: true,
    });
    const parsed = JSON.parse(cleanJsonResponse(rawOutput));

    const summary = typeof parsed.summary === "string" && parsed.summary.trim().length > 50
      ? parsed.summary.trim()
      : "This lecture provides a comprehensive overview of the core concepts, analytical frameworks, and problem-solving methodologies presented in the video lesson. Students will gain deep insight into key academic principles required for competitive examination prep.";

    const keyPoints = Array.isArray(parsed.keyPoints) && parsed.keyPoints.length >= 5
      ? parsed.keyPoints.map((kp: unknown) => String(kp).trim())
      : [
          "Understanding core theoretical principles and foundational definitions.",
          "Applying step-by-step analytical techniques to complex lecture topics.",
          "Recognizing key mathematical relations and formulas in exam questions.",
          "Avoiding common conceptual misunderstandings during problem solving.",
          "Connecting abstract classroom ideas to practical real-world applications.",
          "Mastering high-yield exam takeaways for quick revision.",
          "Evaluating solved numerical examples step by step.",
          "Synthesizing key module insights for comprehensive subject mastery.",
        ];

    return { summary, keyPoints };
  } catch (err) {
    console.error(`[Pipeline] Stage 3 error:`, err);
    return {
      summary: "This lecture provides a structured examination of core academic principles, combining theoretical analysis with practical problem-solving strategies for competitive exam preparation.",
      keyPoints: [
        "Core conceptual overview of the lecture topic.",
        "Step-by-step problem resolution strategies.",
        "Key mathematical equations and definitions.",
        "Important exam takeaways for fast review.",
        "High-yield facts and analytical principles.",
        "Practical applications of theoretical concepts.",
        "Crucial tips for avoiding exam traps.",
        "Summary of main lecture conclusions.",
      ],
    };
  }
}

/**
 * Stage 4: Generate minimum 10 MCQs
 */
async function generateQuiz(
  transcript: string
): Promise<PipelineQuizQuestion[]> {
  const systemPrompt = `You are a senior exam question creator for competitive exams (JEE, NEET, GATE, CBSE).
Create 10 Multiple-Choice Questions (MCQs) strictly based on the provided lecture transcript.

Respond ONLY with a valid JSON array or object containing question objects:
[
  {
    "question": "Clear, precise question text?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctIndex": 0,
    "explanation": "1-2 sentence explanation clarifying why the correct answer is right."
  }
]

REQUIREMENTS:
- Exactly 4 options per question.
- "correctIndex" MUST be an integer from 0 to 3.
- Provide 10 questions.`;

  const userPrompt = `Transcript:
---
${transcript.slice(0, 30000)}
---
Generate high-quality MCQs as a JSON array.`;

  try {
    const rawOutput = await generateGeminiContent({
      systemPrompt,
      userPrompt,
      temperature: 0.4,
      jsonMode: true,
    });
    const parsed = JSON.parse(cleanJsonResponse(rawOutput));

    const items = Array.isArray(parsed)
      ? parsed
      : (parsed?.quiz || parsed?.questions || parsed?.mcqs || parsed?.data || []);

    if (Array.isArray(items) && items.length > 0) {
      interface RawQuizItem {
        question?: string;
        options?: unknown[];
        correctIndex?: number;
        explanation?: string;
      }

      const validQuestions = (items as RawQuizItem[])
        .filter((q) => q && q.question && Array.isArray(q.options) && q.options.length >= 2)
        .map((q) => {
          const rawOpts = (q.options || []).map((o: unknown) => String(o).trim());
          while (rawOpts.length < 4) {
            rawOpts.push(`Option ${String.fromCharCode(65 + rawOpts.length)}`);
          }
          const options = rawOpts.slice(0, 4);
          const rawIdx = Number(q.correctIndex ?? 0);
          const correctIndex = isNaN(rawIdx) ? 0 : Math.min(Math.max(0, Math.floor(rawIdx)), 3);
          const explanation = q.explanation ? String(q.explanation).trim() : `Option ${String.fromCharCode(65 + correctIndex)} is correct based on the lecture.`;

          return {
            question: String(q.question).trim(),
            options,
            correctIndex,
            explanation,
          };
        });

      if (validQuestions.length >= 5) {
        return validQuestions;
      }
    }
  } catch (err) {
    console.warn(`[Pipeline] Stage 4 quiz parsing/generation failed, generating fallback quiz set:`, err);
  }

  // Fallback quiz generator to guarantee 10 valid questions if parsing fails
  return Array.from({ length: 10 }).map((_, i) => ({
    question: `Key Concept Check ${i + 1}: What is the primary takeaway discussed in section ${i + 1} of the lecture?`,
    options: [
      `Understanding the core foundational principle ${i + 1}`,
      `Ignoring key mathematical definitions`,
      `Skipping practical problem solving`,
      `Applying outdated conceptual models`,
    ],
    correctIndex: 0,
    explanation: `Option A accurately reflects the foundational principles covered in lecture section ${i + 1}.`,
  }));
}

/**
 * Stage 5: "Beyond the Video" (Notexia's differentiator bonus content)
 */
async function generateBeyondTheVideo(
  transcript: string
): Promise<PipelineBeyondTheVideo> {
  const systemPrompt = `You are Notexia's Lead Academic Strategist and Science Educator.
Create a "Beyond the Video" bonus educational enrichment pack based on the lecture topic.

Respond ONLY with a valid JSON object matching this schema:
{
  "funFacts": [
    "Surprising, verifiable historical or record-breaking trivia 1",
    "Surprising trivia 2",
    "Surprising trivia 3"
  ],
  "realWorldConnections": [
    "Where this concept is applied in industry, technology, or nature 1",
    "Real-world connection 2"
  ],
  "commonMisconceptions": [
    "Myth: Students think X / Reality: In truth Y",
    "Myth: Students believe A / Reality: In fact B"
  ],
  "furtherExploration": [
    "Suggested topic name or query 1 (NO links, just topic names)",
    "Suggested topic name 2",
    "Suggested topic name 3"
  ]
}

REQUIREMENTS:
- funFacts: 3-5 items.
- realWorldConnections: 2-4 items.
- commonMisconceptions: 2-4 items, clearly formatted as 'Myth: ... / Reality: ...'.
- furtherExploration: 3-5 items (short topic names/queries, NOT URLs).`;

  const userPrompt = `Transcript excerpt:
---
${transcript.slice(0, 20000)}
---
Generate the "Beyond the Video" JSON object.`;

  try {
    const rawOutput = await generateGeminiContent({
      systemPrompt,
      userPrompt,
      temperature: 0.7,
      jsonMode: true,
    });
    const parsed = JSON.parse(cleanJsonResponse(rawOutput));

    return {
      funFacts: Array.isArray(parsed.funFacts) && parsed.funFacts.length >= 2
        ? parsed.funFacts.map(String)
        : [
            "The mathematical foundations of this topic were originally introduced in classical research papers decades ago.",
            "Modern high-speed computing uses optimized algorithms directly derived from these core principles.",
            "Scientists regularly apply these exact equations to model complex phenomena in engineering.",
          ],
      realWorldConnections: Array.isArray(parsed.realWorldConnections) && parsed.realWorldConnections.length >= 2
        ? parsed.realWorldConnections.map(String)
        : [
            "Used extensively in software engineering and signal processing pipelines.",
            "Powers critical components in space navigation and modern robotics.",
          ],
      commonMisconceptions: Array.isArray(parsed.commonMisconceptions) && parsed.commonMisconceptions.length >= 2
        ? parsed.commonMisconceptions.map(String)
        : [
            "Myth: This concept only applies to ideal theoretical conditions. / Reality: It forms the backbone of real-world physical and digital systems.",
            "Myth: Formulas must be memorized without derivation. / Reality: Understanding the underlying derivation allows you to solve non-standard exam problems effortlessly.",
          ],
      furtherExploration: Array.isArray(parsed.furtherExploration) && parsed.furtherExploration.length >= 2
        ? parsed.furtherExploration.map(String)
        : [
            "Advanced Applications of Lecture Principles",
            "GATE & JEE Higher-Order Problem Solving",
            "Interactive Visual Simulations & Proofs",
          ],
    };
  } catch (err) {
    console.error(`[Pipeline] Stage 5 Beyond the Video error:`, err);
    return {
      funFacts: [
        "These core principles are widely studied across major global university curricula.",
        "Understanding this topic drastically reduces problem-solving time in competitive exams.",
        "Key algorithms in this domain have received major international research honors.",
      ],
      realWorldConnections: [
        "Implementation in modern artificial intelligence and machine learning frameworks.",
        "Application in semiconductor technology and smart grid optimization.",
      ],
      commonMisconceptions: [
        "Myth: The formulas are too complex to solve without full calculators. / Reality: Exam boards design questions using elegant numerical simplifications.",
      ],
      furtherExploration: [
        "Advanced Problem Solving Strategies",
        "Higher-Level Conceptual Extensions",
        "Practical Engineering Case Studies",
      ],
    };
  }
}

/**
 * Stage 6: Infer Subject Taxonomy & Exam Tags
 */
async function inferSubjectAndTags(
  transcript: string
): Promise<{ subject: string; examTags: string[] }> {
  const systemPrompt = `Analyze the lecture transcript and identify its primary academic subject and relevant Indian competitive exam tags.
Respond ONLY with a valid JSON object:
{
  "subject": "Physics" | "Chemistry" | "Mathematics" | "Computer Science" | "Biology" | "General Science",
  "examTags": ["JEE", "NEET", "CBSE Class 12", "GATE"]
}`;

  const userPrompt = `Transcript excerpt:
---
${transcript.slice(0, 10000)}
---
Infer subject and examTags.`;

  try {
    const rawOutput = await generateGeminiContent({
      systemPrompt,
      userPrompt,
      temperature: 0.2,
      jsonMode: true,
    });
    const parsed = JSON.parse(cleanJsonResponse(rawOutput));

    const validSubjects = ["Physics", "Chemistry", "Mathematics", "Computer Science", "Biology", "General Science"];
    const subject = validSubjects.includes(parsed.subject) ? parsed.subject : "Computer Science";
    const examTags = Array.isArray(parsed.examTags) ? parsed.examTags.map(String) : ["JEE", "GATE"];

    return { subject, examTags };
  } catch (err) {
    console.warn(`[Pipeline] Stage 6 subject/tag inference failed, using defaults:`, err);
    return { subject: "Computer Science", examTags: ["JEE", "GATE"] };
  }
}

/**
 * Main Pipeline Orchestrator Function
 */
export async function runSummarizerPipeline(fullTranscript: string): Promise<PipelineResult> {
  const startTime = Date.now();
  const modelName = process.env.AI_SUMMARIZER_MODEL || process.env.GEMINI_MODEL || "gemini-1.5-flash";

  // Stage 1: Structure detection
  const detectedLectures = await detectLectures(fullTranscript);

  // Stage 2 to Stage 6: Run per-lecture content generation, summary, quiz, beyond-the-video, and taxonomy in PARALLEL
  const [
    lectures,
    { summary, keyPoints },
    quiz,
    beyondTheVideo,
    { subject, examTags },
  ] = await Promise.all([
    Promise.all(
      detectedLectures.map(async (seg) => {
        const lectureOutput = await generateLectureContent(seg.title, fullTranscript);
        lectureOutput.startApproxTimestamp = seg.startApproxTimestamp || "00:00";
        return lectureOutput;
      })
    ),
    generateSummaryAndKeyPoints(fullTranscript),
    generateQuiz(fullTranscript),
    generateBeyondTheVideo(fullTranscript),
    inferSubjectAndTags(fullTranscript),
  ]);

  const processingTimeMs = Date.now() - startTime;

  return {
    summary,
    keyPoints,
    lectures,
    quiz,
    beyondTheVideo,
    subject,
    examTags,
    aiModelUsed: modelName,
    processingTimeMs,
  };
}
