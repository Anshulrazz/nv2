import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { verifyPremiumUser } from "@/lib/premium";
import { generateGeminiContent } from "@/lib/gemini";
import Anthropic from "@anthropic-ai/sdk";

export const dynamic = "force-dynamic";

function getTopicImages(topic: string) {
  const t = topic.toLowerCase();

  // ── Quantum Physics / Mechanics ──────────────────────────────────────────
  if (t.includes("quantum") || t.includes("qubit") || t.includes("entanglement") || t.includes("superposition")) {
    return {
      hero: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=1200&q=80",
      architecture: "https://images.unsplash.com/photo-1509228468518-180dd4864904?auto=format&fit=crop&w=800&q=80",
      lab: "https://images.unsplash.com/photo-1518825710019-0631a09bfaea?auto=format&fit=crop&w=800&q=80",
    };
  }

  // ── General Physics / Relativity / Thermodynamics ────────────────────────
  if (t.includes("physics") || t.includes("relativity") || t.includes("thermodynamic") || t.includes("electro") || t.includes("optics") || t.includes("particle")) {
    return {
      hero: "https://images.unsplash.com/photo-1534224039826-c7a0eda0e6b3?auto=format&fit=crop&w=1200&q=80",
      architecture: "https://images.unsplash.com/photo-1564325724739-bae0bd08762c?auto=format&fit=crop&w=800&q=80",
      lab: "https://images.unsplash.com/photo-1517976487492-5750f3195933?auto=format&fit=crop&w=800&q=80",
    };
  }

  // ── Machine Learning / Deep Learning / AI ────────────────────────────────
  if (t.includes("machine learning") || t.includes("deep learning") || t.includes("neural") || t.includes("transformer") || t.includes("large language") || t.includes("llm") || t.includes("gpt") || t.includes("diffusion")) {
    return {
      hero: "https://images.unsplash.com/photo-1677442136019-21780efad99a?auto=format&fit=crop&w=1200&q=80",
      architecture: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=800&q=80",
      lab: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=800&q=80",
    };
  }

  // ── Data Science / Analytics / Statistics ────────────────────────────────
  if (t.includes("data science") || t.includes("analytics") || t.includes("statistic") || t.includes("visualization") || t.includes("dataset") || t.includes("regression") || t.includes("clustering")) {
    return {
      hero: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80",
      architecture: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80",
      lab: "https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?auto=format&fit=crop&w=800&q=80",
    };
  }

  // ── Software / Web / Microservices / Cloud ───────────────────────────────
  if (t.includes("software") || t.includes("microservice") || t.includes("cloud") || t.includes("devops") || t.includes("kubernetes") || t.includes("docker") || t.includes("api") || t.includes("architecture")) {
    return {
      hero: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1200&q=80",
      architecture: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80",
      lab: "https://images.unsplash.com/photo-1504639725590-34d0984388bd?auto=format&fit=crop&w=800&q=80",
    };
  }

  // ── Web Development / Frontend / React ───────────────────────────────────
  if (t.includes("web") || t.includes("frontend") || t.includes("react") || t.includes("javascript") || t.includes("typescript") || t.includes("html") || t.includes("css") || t.includes("next.js")) {
    return {
      hero: "https://images.unsplash.com/photo-1547658719-da2b51169166?auto=format&fit=crop&w=1200&q=80",
      architecture: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=800&q=80",
      lab: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&w=800&q=80",
    };
  }

  // ── Cybersecurity / Cryptography / Network Security ──────────────────────
  if (t.includes("security") || t.includes("cyber") || t.includes("cryptograph") || t.includes("hacking") || t.includes("blockchain") || t.includes("encryption") || t.includes("zero-day") || t.includes("vulnerability")) {
    return {
      hero: "https://images.unsplash.com/photo-1614064641938-3bbee52942c7?auto=format&fit=crop&w=1200&q=80",
      architecture: "https://images.unsplash.com/photo-1563986768494-4dee2763ff3f?auto=format&fit=crop&w=800&q=80",
      lab: "https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?auto=format&fit=crop&w=800&q=80",
    };
  }

  // ── Biology / Genetics / DNA / Genomics ──────────────────────────────────
  if (t.includes("biology") || t.includes("genetic") || t.includes("dna") || t.includes("rna") || t.includes("genomic") || t.includes("crispr") || t.includes("cell") || t.includes("protein") || t.includes("evolution")) {
    return {
      hero: "https://images.unsplash.com/photo-1530026405186-ed1f139313f8?auto=format&fit=crop&w=1200&q=80",
      architecture: "https://images.unsplash.com/photo-1576086213369-97a306d36557?auto=format&fit=crop&w=800&q=80",
      lab: "https://images.unsplash.com/photo-1559757175-0eb30cd8c063?auto=format&fit=crop&w=800&q=80",
    };
  }

  // ── Chemistry / Molecular / Materials Science ─────────────────────────────
  if (t.includes("chemistry") || t.includes("molecule") || t.includes("chemical") || t.includes("polymer") || t.includes("catalyst") || t.includes("reaction") || t.includes("organic") || t.includes("spectroscopy")) {
    return {
      hero: "https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=1200&q=80",
      architecture: "https://images.unsplash.com/photo-1507668077129-56e32842fceb?auto=format&fit=crop&w=800&q=80",
      lab: "https://images.unsplash.com/photo-1614935151651-0bea6508db6b?auto=format&fit=crop&w=800&q=80",
    };
  }

  // ── Neuroscience / Brain / Cognitive Science ──────────────────────────────
  if (t.includes("neuro") || t.includes("brain") || t.includes("cognitive") || t.includes("consciousness") || t.includes("synapse") || t.includes("cortex") || t.includes("fmri") || t.includes("mental")) {
    return {
      hero: "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?auto=format&fit=crop&w=1200&q=80",
      architecture: "https://images.unsplash.com/photo-1507413245164-6160d8298b31?auto=format&fit=crop&w=800&q=80",
      lab: "https://images.unsplash.com/photo-1582719471384-894fbb16e074?auto=format&fit=crop&w=800&q=80",
    };
  }

  // ── Space / Astronomy / Astrophysics / Cosmology ─────────────────────────
  if (t.includes("space") || t.includes("astro") || t.includes("galaxy") || t.includes("cosmos") || t.includes("telescope") || t.includes("black hole") || t.includes("satellite") || t.includes("mars") || t.includes("orbit")) {
    return {
      hero: "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=1200&q=80",
      architecture: "https://images.unsplash.com/photo-1484600899469-230e8d1d59c0?auto=format&fit=crop&w=800&q=80",
      lab: "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?auto=format&fit=crop&w=800&q=80",
    };
  }

  // ── Robotics / Automation / Mechatronics ─────────────────────────────────
  if (t.includes("robot") || t.includes("automati") || t.includes("mechatron") || t.includes("servo") || t.includes("autonomous") || t.includes("drone") || t.includes("actuator") || t.includes("manipulator")) {
    return {
      hero: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=1200&q=80",
      architecture: "https://images.unsplash.com/photo-1531746790731-6c087fecd65a?auto=format&fit=crop&w=800&q=80",
      lab: "https://images.unsplash.com/photo-1518314916381-77a37c2a49ae?auto=format&fit=crop&w=800&q=80",
    };
  }

  // ── Medicine / Healthcare / Biomedical ────────────────────────────────────
  if (t.includes("medicine") || t.includes("medical") || t.includes("health") || t.includes("clinical") || t.includes("drug") || t.includes("vaccine") || t.includes("disease") || t.includes("biomedical") || t.includes("surgery")) {
    return {
      hero: "https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=1200&q=80",
      architecture: "https://images.unsplash.com/photo-1631549916768-4119b2e5f926?auto=format&fit=crop&w=800&q=80",
      lab: "https://images.unsplash.com/photo-1559757175-5700dde675bc?auto=format&fit=crop&w=800&q=80",
    };
  }

  // ── Mathematics / Number Theory / Topology ────────────────────────────────
  if (t.includes("math") || t.includes("algebra") || t.includes("topology") || t.includes("calculus") || t.includes("theorem") || t.includes("proof") || t.includes("prime") || t.includes("graph theory") || t.includes("combinatoric")) {
    return {
      hero: "https://images.unsplash.com/photo-1509228468518-180dd4864904?auto=format&fit=crop&w=1200&q=80",
      architecture: "https://images.unsplash.com/photo-1635070041409-b21abeb63a23?auto=format&fit=crop&w=800&q=80",
      lab: "https://images.unsplash.com/photo-1596495578065-6e0763fa1178?auto=format&fit=crop&w=800&q=80",
    };
  }

  // ── Economics / Finance / Markets ─────────────────────────────────────────
  if (t.includes("econom") || t.includes("financ") || t.includes("market") || t.includes("trading") || t.includes("invest") || t.includes("gdp") || t.includes("inflation") || t.includes("monetary") || t.includes("fiscal")) {
    return {
      hero: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=1200&q=80",
      architecture: "https://images.unsplash.com/photo-1468254095679-bbcba94a7066?auto=format&fit=crop&w=800&q=80",
      lab: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=800&q=80",
    };
  }

  // ── Climate / Environment / Sustainability ────────────────────────────────
  if (t.includes("climate") || t.includes("environment") || t.includes("carbon") || t.includes("renewable") || t.includes("solar") || t.includes("ecology") || t.includes("sustainability") || t.includes("green") || t.includes("emission")) {
    return {
      hero: "https://images.unsplash.com/photo-1497436072909-60f360e1d4b1?auto=format&fit=crop&w=1200&q=80",
      architecture: "https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?auto=format&fit=crop&w=800&q=80",
      lab: "https://images.unsplash.com/photo-1508193638397-1c4234db14d8?auto=format&fit=crop&w=800&q=80",
    };
  }

  // ── Psychology / Behavioral Science ──────────────────────────────────────
  if (t.includes("psycholog") || t.includes("behavior") || t.includes("emotion") || t.includes("motivation") || t.includes("perception") || t.includes("cogniti") || t.includes("learning theory") || t.includes("social psychology")) {
    return {
      hero: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=1200&q=80",
      architecture: "https://images.unsplash.com/photo-1474631245212-32dc3c8310c6?auto=format&fit=crop&w=800&q=80",
      lab: "https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=800&q=80",
    };
  }

  // ── History / Archaeology / Civilization ─────────────────────────────────
  if (t.includes("history") || t.includes("archaeolog") || t.includes("civilization") || t.includes("ancient") || t.includes("empire") || t.includes("medieval") || t.includes("war") || t.includes("revolution")) {
    return {
      hero: "https://images.unsplash.com/photo-1552728089-57bdde30beb3?auto=format&fit=crop&w=1200&q=80",
      architecture: "https://images.unsplash.com/photo-1565615833231-e8c91a38ad68?auto=format&fit=crop&w=800&q=80",
      lab: "https://images.unsplash.com/photo-1503819452578-a3c4fe2e5a31?auto=format&fit=crop&w=800&q=80",
    };
  }

  // ── Philosophy / Ethics / Logic ───────────────────────────────────────────
  if (t.includes("philosoph") || t.includes("ethics") || t.includes("moral") || t.includes("logic") || t.includes("epistemolog") || t.includes("ontolog") || t.includes("metaphysic") || t.includes("existential")) {
    return {
      hero: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?auto=format&fit=crop&w=1200&q=80",
      architecture: "https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=800&q=80",
      lab: "https://images.unsplash.com/photo-1519791883288-dc8bd696e667?auto=format&fit=crop&w=800&q=80",
    };
  }

  // ── Education / Pedagogy / E-Learning ────────────────────────────────────
  if (t.includes("education") || t.includes("pedagog") || t.includes("e-learning") || t.includes("teaching") || t.includes("curriculum") || t.includes("student") || t.includes("classroom") || t.includes("adaptive learning")) {
    return {
      hero: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=1200&q=80",
      architecture: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=800&q=80",
      lab: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=800&q=80",
    };
  }

  // ── Electrical / Electronics / VLSI / Signal Processing ──────────────────
  if (t.includes("electrical") || t.includes("circuit") || t.includes("semiconductor") || t.includes("signal") || t.includes("vlsi") || t.includes("embedded") || t.includes("microcontroller") || t.includes("fpga")) {
    return {
      hero: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80",
      architecture: "https://images.unsplash.com/photo-1592659762303-90081d34b277?auto=format&fit=crop&w=800&q=80",
      lab: "https://images.unsplash.com/photo-1543966888-7c1dc482a810?auto=format&fit=crop&w=800&q=80",
    };
  }

  // ── Default / General Research ────────────────────────────────────────────
  return {
    hero: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80",
    architecture: "https://images.unsplash.com/photo-1507668077129-56e32842fceb?auto=format&fit=crop&w=800&q=80",
    lab: "https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=800&q=80",
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
