/**
 * Google Gemini AI & OpenRouter API Service Wrapper
 * Primary engine: Google Gemini API
 * Fallback engine: OpenRouter API (if Gemini is unavailable, unconfigured, slow, or rate-limited)
 */

export interface GeminiGenerateOptions {
  systemPrompt?: string;
  userPrompt: string;
  temperature?: number;
  jsonMode?: boolean;
}

/**
 * Fetch helper with strict timeout to prevent 504 Gateway Timeouts
 */
async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs = 20000): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(timer);
    return response;
  } catch (err) {
    clearTimeout(timer);
    throw err;
  }
}

async function callOpenRouter(options: GeminiGenerateOptions): Promise<string> {
  const openRouterKey = process.env.OPENROUTER_API_KEY;
  if (!openRouterKey || openRouterKey === "placeholder" || openRouterKey.trim() === "") {
    throw new Error("OPENROUTER_API_KEY is not configured on the server.");
  }

  const model = process.env.OPENROUTER_MODEL || "openai/gpt-4o-mini";
  const messages: Array<{ role: "system" | "user"; content: string }> = [];

  if (options.systemPrompt) {
    messages.push({ role: "system", content: options.systemPrompt });
  }
  messages.push({ role: "user", content: options.userPrompt });

  const payload: Record<string, unknown> = {
    model,
    messages,
    temperature: options.temperature ?? 0.5,
  };

  if (options.jsonMode) {
    payload.response_format = { type: "json_object" };
  }

  const res = await fetchWithTimeout("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${openRouterKey}`,
      "HTTP-Referer": process.env.OPENROUTER_SITE_URL || "https://notexia.in",
      "X-Title": process.env.OPENROUTER_SITE_NAME || "Notexia AI",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  }, 25000);

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`OpenRouter API Error (${res.status}): ${errorText}`);
  }

  const data = await res.json();
  const textOutput = data?.choices?.[0]?.message?.content;
  if (!textOutput || typeof textOutput !== "string") {
    throw new Error("OpenRouter returned an empty response.");
  }

  return textOutput.trim();
}

export async function generateGeminiContent(options: GeminiGenerateOptions): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;

  // 1. Try Gemini API first if configured
  if (apiKey && apiKey !== "placeholder" && apiKey.trim() !== "") {
    try {
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
          temperature: options.temperature ?? 0.5,
          ...(options.jsonMode ? { responseMimeType: "application/json" } : {}),
        },
      };

      const res = await fetchWithTimeout(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }, 20000); // 20s max for Gemini

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
    } catch (geminiErr: unknown) {
      const errMsg = geminiErr instanceof Error ? geminiErr.message : String(geminiErr);
      console.warn(`[AI Engine] Gemini API unavailable or slow (${errMsg}). Attempting OpenRouter fallback...`);
    }
  } else {
    console.log(`[AI Engine] GEMINI_API_KEY not configured. Falling back directly to OpenRouter API...`);
  }

  // 2. Fallback to OpenRouter API
  try {
    return await callOpenRouter(options);
  } catch (openRouterErr: unknown) {
    const errMsg = openRouterErr instanceof Error ? openRouterErr.message : String(openRouterErr);
    console.error(`[AI Engine] OpenRouter fallback also failed: ${errMsg}`);
    throw new Error(`AI Generation failed: Neither Gemini nor OpenRouter could fulfill the request. (${errMsg})`);
  }
}
