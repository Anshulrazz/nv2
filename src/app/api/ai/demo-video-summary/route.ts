import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { videoUrl } = await req.json().catch(() => ({}));

    const cleanUrl = videoUrl && typeof videoUrl === "string" ? videoUrl.trim() : "https://youtube.com/watch?v=qft-derivation-lecture";
    const openRouterApiKey = process.env.OPENROUTER_API_KEY;

    if (!openRouterApiKey || openRouterApiKey === "placeholder") {
      // Fallback structured response if key is missing
      return NextResponse.json({
        success: true,
        videoUrl: cleanUrl,
        title: "Quantum Fourier Transform & Signal Processing Derivation",
        channel: "NPTEL / MIT OpenCourseWare",
        chapters: [
          { timestamp: "00:00", title: "Intro & recap of Fourier series fundamentals", summary: "Brief overview of continuous vs discrete Fourier transforms." },
          { timestamp: "04:12", title: "Derivation of the Quantum Fourier Transform operator", summary: "Step-by-step matrix derivation of QFT on n-qubits." },
          { timestamp: "11:30", title: "Solved numerical exam problem", summary: "Applying QFT to 3-qubit state vectors for Phase Estimation." },
          { timestamp: "18:05", title: "Common GATE/JEE exam pitfalls", summary: "Avoiding sign errors in phase rotation gates R_k." },
        ],
        formulas: [
          "F_n = \\frac{1}{\\sqrt{N}} \\sum_{j=0}^{N-1} \\omega^{j k} |j\\rangle",
          "\\omega = e^{2\\pi i / N}",
        ],
        xpEarned: 40,
        engine: "OpenRouter (Fallback Preset)",
      });
    }

    const prompt = `Analyze the following educational YouTube video URL/topic: "${cleanUrl}". 
Generate a realistic academic lecture breakdown for Indian engineering/competitive exam students (GATE, JEE, VTU).
Return JSON with:
1. "title": Crisp lecture title.
2. "channel": Realistic channel name (e.g., NPTEL, Physics Wallah, Unacademy, MIT OCW).
3. "chapters": Array of 4 objects with "timestamp" (mm:ss), "title" (short chapter title), and "summary" (1 sentence key takeaway).
4. "formulas": Array of 2 LaTeX math formulas (e.g. \\(E = mc^2\\)).
5. "xpEarned": integer (40).

Return ONLY raw JSON.`;

    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openRouterApiKey}`,
        "HTTP-Referer": process.env.OPENROUTER_SITE_URL || "https://notexia.in",
        "X-Title": process.env.OPENROUTER_SITE_NAME || "Notexia",
      },
      body: JSON.stringify({
        model: "openai/gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are Notexia Video Summarizer AI. Return valid JSON only.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.5,
        max_tokens: 600,
      }),
    });

    if (!res.ok) {
      throw new Error(`OpenRouter returned status ${res.status}`);
    }

    const data = await res.json();
    const rawContent = data.choices?.[0]?.message?.content || "";
    const cleanJson = rawContent.replace(/```json/g, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(cleanJson);

    return NextResponse.json({
      success: true,
      videoUrl: cleanUrl,
      title: parsed.title || "Lecture Chapter Summary",
      channel: parsed.channel || "Academic Channel",
      chapters: parsed.chapters || [
        { timestamp: "00:00", title: "Introduction", summary: "Core lecture overview." },
        { timestamp: "05:00", title: "Key Proofs", summary: "Step-by-step mathematical derivation." },
      ],
      formulas: parsed.formulas || [],
      xpEarned: 40,
      engine: "OpenRouter (GPT-4o-mini)",
    });
  } catch (error) {
    console.error("Demo Video Summary Route Error:", error);
    return NextResponse.json({
      success: true,
      videoUrl: "https://youtube.com/watch?v=qft-derivation-lecture",
      title: "Quantum Fourier Transform & Signal Processing Derivation",
      channel: "NPTEL / MIT OpenCourseWare",
      chapters: [
        { timestamp: "00:00", title: "Intro & recap of Fourier series fundamentals", summary: "Brief overview of continuous vs discrete Fourier transforms." },
        { timestamp: "04:12", title: "Derivation of the Quantum Fourier Transform operator", summary: "Step-by-step matrix derivation of QFT on n-qubits." },
        { timestamp: "11:30", title: "Solved numerical exam problem", summary: "Applying QFT to 3-qubit state vectors for Phase Estimation." },
        { timestamp: "18:05", title: "Common GATE/JEE exam pitfalls", summary: "Avoiding sign errors in phase rotation gates R_k." },
      ],
      formulas: [
        "F_n = \\frac{1}{\\sqrt{N}} \\sum_{j=0}^{N-1} \\omega^{j k} |j\\rangle",
      ],
      xpEarned: 40,
      engine: "OpenRouter (Fallback)",
    });
  }
}
