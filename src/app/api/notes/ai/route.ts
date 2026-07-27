import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { verifyPremiumUser } from "@/lib/premium";
import { generateGeminiContent } from "@/lib/gemini";
import Anthropic from "@anthropic-ai/sdk";

export const dynamic = "force-dynamic";

function getTopicImages(topic: string) {
  const t = topic.toLowerCase();
  if (t.includes("quantum") || t.includes("physics") || t.includes("qubit")) {
    return {
      hero: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=1200&q=80",
      architecture: "https://images.unsplash.com/photo-1509228468518-180dd4864904?auto=format&fit=crop&w=800&q=80",
      lab: "https://images.unsplash.com/photo-1517976487492-5750f3195933?auto=format&fit=crop&w=800&q=80"
    };
  }
  if (t.includes("ai") || t.includes("learning") || t.includes("neural") || t.includes("data") || t.includes("model")) {
    return {
      hero: "https://images.unsplash.com/photo-1677442136019-21780efad99a?auto=format&fit=crop&w=1200&q=80",
      architecture: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=800&q=80",
      lab: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=800&q=80"
    };
  }
  if (t.includes("code") || t.includes("software") || t.includes("web") || t.includes("microservice") || t.includes("system")) {
    return {
      hero: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1200&q=80",
      architecture: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80",
      lab: "https://images.unsplash.com/photo-1504639725590-34d0984388bd?auto=format&fit=crop&w=800&q=80"
    };
  }
  return {
    hero: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80",
    architecture: "https://images.unsplash.com/photo-1507668077129-56e32842fceb?auto=format&fit=crop&w=800&q=80",
    lab: "https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=800&q=80"
  };
}

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
    const { action, text, title, topic } = body;

    const inputTopic = (topic && typeof topic === "string" && topic.trim() !== "")
      ? topic.trim()
      : (title && typeof title === "string" && title.trim() !== "" && title !== "Untitled Note" && title !== "Untitled Blog" && title !== "Untitled AI Blog")
      ? title.trim()
      : text;

    if (action !== "generate_topic" && (!text || typeof text !== "string" || text.trim() === "")) {
      return NextResponse.json({ error: "Note content is required for AI writing." }, { status: 400 });
    }

    if (action === "generate_topic" && (!inputTopic || typeof inputTopic !== "string" || inputTopic.trim() === "")) {
      return NextResponse.json({ error: "Topic is required for generating a topic note." }, { status: 400 });
    }

    const topicImages = getTopicImages(inputTopic);
    let systemPrompt = "You are Notexia's Smart AI Writing Assistant for academic and technical notes.";
    let userPrompt = "";

    switch (action) {
      case "generate_topic":
        systemPrompt = `You are Notexia's World-Class Academic and Technical AI Author. Your task is to write an EXHAUSTIVE, DEEP-DIVE, HIGHLY DETAILED research paper on the requested topic. The resulting paper MUST be EXTREMELY COMPREHENSIVE, containing AT LEAST 2,000 WORDS.

You MUST embed 2-3 high-resolution figure images using standard Markdown image syntax directly in appropriate sections:
Figure 1 (Primary Visual): ${topicImages.hero}
Figure 2 (Theoretical Architecture): ${topicImages.architecture}
Figure 3 (Experimental Setup): ${topicImages.lab}

OUTPUT FORMAT: Use ONLY clean Markdown syntax:
- Headings: ## Section Title, ### Subsection
- Bold: **text**, Italic: *text*
- Code blocks: triple backtick with language (e.g. \`\`\`python)
- Images: ![Caption](url)
- Tables: Markdown pipe tables
- Lists: - item or 1. item
- Blockquotes: > text
- Horizontal rules: ---

DO NOT use any HTML tags. Use ONLY Markdown.

Structure: 1) ## Executive Summary & Abstract, 2) Figure 1 image, 3) ## Fundamental Theoretical Framework, 4) Figure 2 image, 5) ## Real-World Applications & Step-by-Step Code Blueprint (with actual runnable code blocks), 6) Figure 3 image, 7) ## Deep Trade-off Analysis (pipe table), 8) ## Master Study Checklist.`;
        userPrompt = `Topic: "${inputTopic}"\n\nTask: Write an in-depth, masterclass research paper on this topic with AT LEAST 2,000 words. Use clean Markdown with proper headings, fenced code blocks (\`\`\`language), embedded Markdown images ![caption](url), pipe tables, and exhaustive explanations. DO NOT use HTML tags.`;
        break;

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
        console.warn("Gemini API failed, attempting OpenRouter fallback:", geminiError);
      }
    }

    // 2. Try OpenRouter API (secondary fallback — openai/gpt-4o-mini)
    const openRouterKey = process.env.OPENROUTER_API_KEY;
    if (openRouterKey && openRouterKey !== "placeholder" && openRouterKey.trim() !== "") {
      try {
        const orRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${openRouterKey}`,
            "HTTP-Referer": process.env.OPENROUTER_SITE_URL || "https://notexia.in",
            "X-Title": process.env.OPENROUTER_SITE_NAME || "Notexia",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "openai/gpt-4o-mini",
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userPrompt },
            ],
            max_tokens: 4000,
            temperature: 0.7,
          }),
        });

        if (!orRes.ok) {
          const errText = await orRes.text();
          throw new Error(`OpenRouter error ${orRes.status}: ${errText}`);
        }

        const orData = await orRes.json();
        const orOutput: string = orData.choices?.[0]?.message?.content ?? "";
        if (orOutput) {
          return NextResponse.json({ result: orOutput, engine: "openrouter" });
        }
      } catch (orError) {
        console.warn("OpenRouter API failed, attempting Anthropic fallback:", orError);
      }
    }

    // 3. Try Anthropic API fallback
    const anthropicKey = process.env.ANTHROPIC_API_KEY;
    if (anthropicKey && anthropicKey !== "placeholder" && anthropicKey.trim() !== "") {
      const anthropic = new Anthropic({ apiKey: anthropicKey });
      const msg = await anthropic.messages.create({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 4000,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
      });

      const firstBlock = msg.content[0];
      const textOutput = firstBlock && "text" in firstBlock ? firstBlock.text : "";
      return NextResponse.json({ result: textOutput, engine: "anthropic" });
    }

    // 3. Fallback smart completion (Dev Mode)
    let fallbackText = "";
    if (action === "generate_topic") {
      fallbackText = `<h2>1. Executive Summary & Abstract: ${inputTopic}</h2>
<p>This comprehensive research paper provides an in-depth analysis of <strong>${inputTopic}</strong>. It synthesizes core principles, theoretical foundations, architectural mechanics, real-world implementations, and key analytical frameworks necessary for mastery of the subject.</p>

<figure style="margin: 24px 0;">
  <img src="${topicImages.hero}" alt="${inputTopic} Visual Overview" style="width: 100%; max-height: 400px; object-fit: cover; border-radius: 16px; border: 1px solid rgba(255,255,255,0.1);" />
  <figcaption style="font-size: 12px; color: #9FAEA1; margin-top: 8px; font-family: monospace;">Figure 1: High-level visual representation and contextual domain map of ${inputTopic}.</figcaption>
</figure>

<h2>2. Fundamental Theoretical Framework</h2>
<p>Understanding <em>${inputTopic}</em> requires establishing its primary principles and underlying axioms. At its core, this field addresses key operational challenges through systematic methodology:</p>
<ul>
  <li><strong>First Principles Axiom:</strong> Deconstructing complex behavior into baseline primitives.</li>
  <li><strong>Structural Decomposition:</strong> Breaking down multi-tiered mechanics into isolated modules.</li>
  <li><strong>State Synchronization & Efficiency:</strong> Ensuring continuous reliability across distributed nodes.</li>
</ul>

<figure style="margin: 24px 0;">
  <img src="${topicImages.architecture}" alt="${inputTopic} System Architecture" style="width: 100%; max-height: 380px; object-fit: cover; border-radius: 16px; border: 1px solid rgba(255,255,255,0.1);" />
  <figcaption style="font-size: 12px; color: #9FAEA1; margin-top: 8px; font-family: monospace;">Figure 2: Detailed architectural blueprint and component interaction pipeline for ${inputTopic}.</figcaption>
</figure>

<h2>3. In-Depth Operational Mechanics & Step-by-Step Dynamics</h2>
<p>The practical execution of ${inputTopic} relies on a structured sequence of transformations. Below is the multi-stage pipeline governing system state changes:</p>

<h3>3.1 Phase 1: Initialization & Context Parsing</h3>
<p>During initialization, the framework establishes invariant boundaries, allocating isolated heap spaces and validating configuration parameters before execution.</p>

<h3>3.2 Phase 2: Dynamic Execution & Optimizations</h3>
<p>In the runtime phase, workload execution is parallelized using hardware-accelerated vectors, ensuring minimal latency and maximal throughput.</p>

<h2>4. Code & Practical Implementation Blueprint</h2>
<pre><code>// Comprehensive Research Implementation Blueprint for ${inputTopic}
class ${inputTopic.replace(/[^a-zA-Z0-9]/g, "") || "Research"}Engine {
  private state: Map&lt;string, any&gt; = new Map();

  constructor(public config: Record&lt;string, unknown&gt;) {
    this.initializeEngine();
  }

  private initializeEngine(): void {
    console.log("Initializing ${inputTopic} Subsystem...");
    this.state.set("status", "ACTIVE");
    this.state.set("timestamp", Date.now());
  }

  public executePipeline(payload: Record&lt;string, unknown&gt;): Record&lt;string, unknown&gt; {
    const transformed = { ...payload, processedAt: Date.now() };
    return transformed;
  }
}

const instance = new ${inputTopic.replace(/[^a-zA-Z0-9]/g, "") || "Research"}Engine({ mode: "HIGH_PERFORMANCE" });
console.log("Execution Result:", instance.executePipeline({ data: "${inputTopic} Test Vector" }));
</code></pre>

<figure style="margin: 24px 0;">
  <img src="${topicImages.lab}" alt="${inputTopic} Experimental Setup" style="width: 100%; max-height: 380px; object-fit: cover; border-radius: 16px; border: 1px solid rgba(255,255,255,0.1);" />
  <figcaption style="font-size: 12px; color: #9FAEA1; margin-top: 8px; font-family: monospace;">Figure 3: Experimental laboratory setup and telemetry measurement environment.</figcaption>
</figure>

<h2>5. Trade-Off Analysis & Performance Metrics</h2>
<table>
  <thead>
    <tr>
      <th>Metric Dimension</th>
      <th>Standard Baseline</th>
      <th>Optimized ${inputTopic} Architecture</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Latency (p99)</td>
      <td>120 ms</td>
      <td>14 ms</td>
    </tr>
    <tr>
      <td>Memory Footprint</td>
      <td>512 MB</td>
      <td>64 MB</td>
    </tr>
    <tr>
      <td>Scalability Coefficient</td>
      <td>Linear O(N)</td>
      <td>Sub-linear O(log N)</td>
    </tr>
  </tbody>
</table>

<h2>6. Master Study Checklist & Key Formulas</h2>
<ul>
  <li>✔ Verify invariant states before state transition</li>
  <li>✔ Validate payload serialization efficiency</li>
  <li>✔ Audit security boundaries and memory isolation</li>
  <li>✔ Monitor runtime telemetry and error budgets</li>
</ul>

<h2>7. Conclusion & Research Horizons</h2>
<p>Mastery of <strong>${inputTopic}</strong> equips researchers and engineers with the capability to architect scalable, resilient systems. Continuous iteration and deep exploration of these core paradigms remain pivotal for cutting-edge development.</p>`;
    } else {
      fallbackText = `[AI Smart ${action.toUpperCase()}]\nKey Insights derived from "${title || "Note"}":\n- ${(text || "").substring(0, 150)}...\n- Deep dive into core concepts and structured formulas.\n- Review associated checklists and study items.`;
    }
    return NextResponse.json({ result: fallbackText, engine: "fallback" });
  } catch (error) {
    console.error("Smart AI Notes Writing Error:", error);
    return NextResponse.json({ error: "Failed to process AI writing request." }, { status: 500 });
  }
});
