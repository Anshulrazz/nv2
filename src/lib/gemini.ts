/**
 * Google Gemini AI API Service Wrapper
 * Supports prompt completion, structured JSON parsing, and streaming responses using GEMINI_API_KEY.
 */

export interface GeminiGenerateOptions {
  systemPrompt?: string;
  userPrompt: string;
  temperature?: number;
  jsonMode?: boolean;
}

export async function generateGeminiContent(options: GeminiGenerateOptions): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "placeholder" || apiKey.trim() === "") {
    throw new Error("GEMINI_API_KEY is not configured on the server.");
  }

  const model = process.env.GEMINI_MODEL || "gemini-1.5-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const contents = [];
  if (options.systemPrompt) {
    contents.push({
      role: "user",
      parts: [{ text: `[System Instruction]\n${options.systemPrompt}` }],
    });
    contents.push({
      role: "model",
      parts: [{ text: "Understood. I will strictly follow these instructions." }],
    });
  }

  contents.push({
    role: "user",
    parts: [{ text: options.userPrompt }],
  });

  const payload: Record<string, unknown> = {
    contents,
    generationConfig: {
      temperature: options.temperature ?? 0.7,
      ...(options.jsonMode ? { responseMimeType: "application/json" } : {}),
    },
  };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Gemini API Error (${res.status}): ${errorText}`);
  }

  const data = await res.json();
  const textOutput = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!textOutput) {
    throw new Error("Gemini returned an empty response.");
  }

  return textOutput;
}
