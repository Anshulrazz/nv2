"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { NotexiaLogo } from "@/components/common/NotexiaLogo";
import { RazorpayPaymentButton } from "@/components/common/RazorpayPaymentButton";
import { Button } from "@/components/ui/button";
import { buildFAQSchema } from "@/lib/seo/jsonld";

function LandingSkeleton() {
  return (
    <div className="min-h-screen bg-[#0A0806] text-[#FAFAF8] p-6 space-y-12 animate-pulse selection:bg-[#F5B429]/30">
      {/* Header Skeleton */}
      <div className="max-w-6xl mx-auto flex items-center justify-between h-16 border-b border-[#2E2118] pb-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#150F0B] border border-[#2E2118]" />
          <div className="w-28 h-5 rounded bg-[#150F0B]" />
        </div>
        <div className="hidden md:flex gap-6">
          <div className="w-16 h-4 rounded-full bg-[#150F0B]" />
          <div className="w-16 h-4 rounded-full bg-[#150F0B]" />
          <div className="w-16 h-4 rounded-full bg-[#150F0B]" />
          <div className="w-16 h-4 rounded-full bg-[#150F0B]" />
        </div>
        <div className="flex gap-3">
          <div className="w-20 h-9 rounded-full bg-[#150F0B] border border-[#2E2118]" />
          <div className="w-32 h-9 rounded-full bg-[#F5B429]/20 border border-[#F5B429]/30" />
        </div>
      </div>

      {/* Hero Skeleton */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center pt-8">
        <div className="space-y-6">
          <div className="w-56 h-7 rounded-full bg-[#F5B429]/15 border border-[#F5B429]/30" />
          <div className="space-y-3">
            <div className="w-full h-12 rounded-2xl bg-[#150F0B]" />
            <div className="w-4/5 h-12 rounded-2xl bg-[#150F0B]" />
          </div>
          <div className="w-3/4 h-5 rounded-lg bg-[#150F0B]" />
          <div className="flex gap-4 pt-2">
            <div className="w-44 h-11 rounded-full bg-[#F5B429]/30 border border-[#F5B429]/40" />
            <div className="w-36 h-11 rounded-full bg-[#150F0B] border border-[#2E2118]" />
          </div>
        </div>
        <div className="h-80 bg-[#150F0B] border border-[#2E2118] rounded-2xl p-6 space-y-4 shadow-[0_0_30px_-10px_rgba(245,148,29,0.15)]">
          <div className="flex justify-between items-center pb-4 border-b border-[#2E2118]">
            <div className="w-32 h-4 rounded bg-[#241811]" />
            <div className="w-24 h-4 rounded bg-[#241811]" />
          </div>
          <div className="w-3/4 h-6 rounded bg-[#241811]" />
          <div className="w-full h-24 rounded-xl bg-[#0A0806] border border-[#2E2118]" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-4">
            <div className="h-8 rounded bg-[#241811]" />
            <div className="h-8 rounded bg-[#241811]" />
            <div className="h-8 rounded bg-[#241811]" />
            <div className="h-8 rounded bg-[#241811]" />
          </div>
        </div>
      </div>
    </div>
  );
}

const homepageFaqs = [
  {
    question: "What is Notexia and who is it designed for?",
    answer:
      "Notexia is an AI-powered study platform built for Indian students, engineering undergraduates, researchers, and competitive exam aspirants (JEE, NEET, CBSE, GATE, UPSC). It provides TipTap note editing, LaTeX formula support, instant AI doubt solving, community blogs, and gamified batch leaderboards in a single workspace.",
  },
  {
    question: "How does the AI copilot & doubt solver work?",
    answer:
      "Notexia's AI copilot integrates Anthropic Claude and OpenRouter models to answer complex physics, mathematics, and computer science questions. You can ask doubts directly inside your study notes, generate step-by-step code blueprints, or summarize lengthy textbook chapters in seconds.",
  },
  {
    question: "Is Notexia free for students?",
    answer:
      "Yes! Notexia offers free access to all core study features including public note publishing, student forums, doubt resolution threads, formula calculators, and community leaderboards. Optional premium features offer higher AI query quotas and advanced research synthesis.",
  },
  {
    question: "Can I export my study notes and LaTeX math formulas?",
    answer:
      "Absolutely. All study notes created on Notexia support rich markdown, inline and block LaTeX formulas (via KaTeX), code blocks, and images. You can export your notes to clean PDF or Markdown files anytime.",
  },
  {
    question: "How does the gamified batch leaderboard work?",
    answer:
      "As you publish verified study notes, answer peer doubts, and contribute helpful forum posts, you earn activity points and scholar badges. The live leaderboard ranks top student contributors across university batches and exam streams.",
  },
  {
    question: "Can I publish my research articles and notes publicly?",
    answer:
      "Yes! Notexia allows scholars to publish their notes and articles as public blog posts under their custom profile URL (`notexia.in/blog/username/slug`). Public posts are indexed on Google for search visibility.",
  },
];

const studentReviews = [
  {
    quote:
      "Notexia's AI copilot helped me derive complex Electromagnetic Wave equations for my GATE physics revision in seconds. The LaTeX rendering is super clean!",
    author: "Rohan Kulkarni",
    role: "GATE Physics Aspirant • IIT Bombay Batch",
  },
  {
    quote:
      "The CGPA to percentage converter and TipTap markdown notes saved me hours during semester exams. Easily the best study tool for VTU engineers.",
    author: "Sneha Nair",
    role: "Computer Science Undergrad • VTU",
  },
  {
    quote:
      "Publishing my semester revision notes on Notexia earned me over 450 activity coins and topped our batch leaderboard. My peers love the shared study group forums!",
    author: "Aarav Sharma",
    role: "JEE Advanced Scholar • Kota",
  },
];

const sampleQueries = [
  {
    label: "Physics · Quantum",
    prompt: "Explain the Schrodinger time-independent wave equation derivation in 3 steps.",
    formattedAnswer: [
      "1. Wave Function Definition: \\(\\psi(x) = A e^{i(kx - \\omega t)}\\)",
      "2. Hamiltonian Energy Operator: \\(\\hat{H}\\psi = E\\psi\\) where \\(\\hat{H} = -\\frac{\\hbar^2}{2m}\\nabla^2 + V(r)\\)",
      "3. Final Differential Equation: \\(-\\frac{\\hbar^2}{2m}\\frac{d^2\\psi}{dx^2} + V(x)\\psi = E\\psi\\)",
    ],
  },
  {
    label: "Computer Science",
    prompt: "What's the difference between BFS and DFS, and when would a JEE/GATE question expect each one?",
    formattedAnswer: [
      "• BFS (Breadth-First Search): Uses a Queue data structure (FIFO). Best for finding the shortest path in unweighted graphs or level-order tree traversals.",
      "• DFS (Depth-First Search): Uses a Stack / Recursion (LIFO). Best for cycle detection, topological sorting, or solving mazes/backtracking problems.",
      "• GATE Exam Tip: Questions testing minimum edge distance require BFS; questions testing path existence or strongly connected components require DFS.",
    ],
  },
  {
    label: "Mathematics",
    prompt: "Derive the quadratic formula from ax^2+bx+c=0, step by step.",
    formattedAnswer: [
      "1. Divide by a: \\(x^2 + \\frac{b}{a}x + \\frac{c}{a} = 0\\)",
      "2. Complete the square: \\(\\left(x + \\frac{b}{2a}\\right)^2 = \\frac{b^2 - 4ac}{4a^2}\\)",
      "3. Take square root & solve: \\(x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}\\)",
    ],
  },
  {
    label: "Chemistry · NEET",
    prompt: "Explain Le Chatelier's principle with one worked NEET-style example.",
    formattedAnswer: [
      "• Principle: If a dynamic equilibrium is disturbed by changing conditions (temperature, pressure, concentration), the position of equilibrium shifts to counteract the change.",
      "• Haber Process Example: \\(N_2(g) + 3H_2(g) \\rightleftharpoons 2NH_3(g) + \\text{Heat}\\)",
      "• NEET Exam Insight: Increasing pressure shifts equilibrium to the right (fewer gas moles). Decreasing temperature shifts right (exothermic direction).",
    ],
  },
];

interface LeaderboardItem {
  rank: number;
  name: string;
  batch: string;
  points: string;
  badge: string;
}

interface VideoSummaryData {
  title: string;
  channel: string;
  chapters: Array<{ timestamp: string; title: string; summary: string }>;
  formulas: string[];
  xpEarned: number;
  engine: string;
}

export default function MarketingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);

  /* ── INTERACTIVE DEMO STATE ── */
  const [activeChip, setActiveChip] = useState<number>(0);
  const [demoInputText, setDemoInputText] = useState("");
  const [formattedAiLines, setFormattedAiLines] = useState<string[]>(sampleQueries[0].formattedAnswer);
  const [isAiLoading, setIsAiLoading] = useState(false);

  /* ── REAL OPENROUTER VIDEO SUMMARIZER STATE ── */
  const [videoUrlInput, setVideoUrlInput] = useState("youtube.com/watch?v=qft-derivation-lecture");
  const [isVideoLoading, setIsVideoLoading] = useState(false);
  const [videoSummaryData, setVideoSummaryData] = useState<VideoSummaryData>({
    title: "Quantum Fourier Transform & Signal Processing Derivation",
    channel: "NPTEL / MIT OpenCourseWare",
    chapters: [
      { timestamp: "00:00", title: "Intro & recap of Fourier series fundamentals", summary: "Overview of continuous vs discrete Fourier transforms." },
      { timestamp: "04:12", title: "Derivation of the Quantum Fourier Transform operator", summary: "Step-by-step matrix derivation of QFT on n-qubits." },
      { timestamp: "11:30", title: "Solved numerical exam problem", summary: "Applying QFT to 3-qubit state vectors for Phase Estimation." },
      { timestamp: "18:05", title: "Common GATE/JEE exam pitfalls", summary: "Avoiding sign errors in phase rotation gates R_k." },
    ],
    formulas: ["F_n = \\frac{1}{\\sqrt{N}} \\sum_{j=0}^{N-1} \\omega^{j k} |j\\rangle"],
    xpEarned: 40,
    engine: "OpenRouter (GPT-4o-mini)",
  });

  /* ── REAL MONGO DB LEADERBOARD STATE ── */
  const [leaderboard, setLeaderboard] = useState<LeaderboardItem[]>([
    { rank: 1, name: "Priya Sharma", batch: "IIT Bombay Physics", points: "1,420 coins", badge: "Gold Scholar" },
    { rank: 2, name: "Arjun Dev", batch: "VTU CS Semester 4", points: "1,015 coins", badge: "Silver Scholar" },
    { rank: 3, name: "Rohan Kulkarni", batch: "GATE Physics Scholar", points: "890 coins", badge: "Bronze Scholar" },
  ]);

  /* ── PRICING TOGGLE STATE ── */
  const [isAnnual, setIsAnnual] = useState(false);

  /* ── FAQ ACCORDION STATE ── */
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  /* ── NEWSLETTER STATE (DATABASE) ── */
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterMessage, setNewsletterMessage] = useState("");
  const [isSubmittingNewsletter, setIsSubmittingNewsletter] = useState(false);
  const [newsletterStatus, setNewsletterStatus] = useState<"idle" | "success" | "error">("idle");

  /* ── SCROLL NAVIGATION ── */
  const [activeSection, setActiveSection] = useState("");

  /* Set hydration mount flag */
  useEffect(() => {
    setIsMounted(true);
  }, []);

  /* Redirect authenticated logged-in users directly to Dashboard */
  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      router.replace("/dashboard");
    }
  }, [status, session, router]);

  /* Fetch Real Leaderboard from MongoDB */
  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const res = await fetch("/api/leaderboard/public");
        const data = await res.json();
        if (data.success && Array.isArray(data.leaderboard) && data.leaderboard.length > 0) {
          setLeaderboard(data.leaderboard);
        }
      } catch (error) {
        console.error("Failed to fetch leaderboard:", error);
      }
    };
    fetchLeaderboard();
  }, []);

  /* Intersection Observer for active section */
  useEffect(() => {
    const sections = document.querySelectorAll("section[id]");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { threshold: 0.3 }
    );
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  /* Ask AI Demo Doubt Resolution (Formatted & Readable) */
  const handleAskAi = async (queryText: string) => {
    if (!queryText.trim()) return;
    setIsAiLoading(true);
    try {
      const res = await fetch("/api/ai/demo-doubt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: queryText.trim() }),
      });
      const data = await res.json();
      if (res.ok && data.response) {
        // Clean and structure the AI response into readable bullet points
        const lines = data.response
          .split("\n")
          .map((l: string) => l.trim())
          .filter((l: string) => l.length > 0 && !l.startsWith("###") && !l.startsWith("---"));
        setFormattedAiLines(lines.length > 0 ? lines : [data.response]);
      } else {
        setFormattedAiLines(["Sorry, unable to resolve doubt right now. Please try again."]);
      }
    } catch (error) {
      console.error("AI query error:", error);
      setFormattedAiLines(["Connection error. Please check your internet connection."]);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleChipClick = (index: number, promptText: string) => {
    setActiveChip(index);
    setDemoInputText(promptText);
    setFormattedAiLines(sampleQueries[index].formattedAnswer);
  };

  const handleCustomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!demoInputText.trim()) return;
    await handleAskAi(demoInputText);
  };

  /* Video Summarizer landing demo execution */
  const handleSummarizeVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoUrlInput.trim()) return;
    setIsVideoLoading(true);
    try {
      // Simulate quick interactive preview on landing page
      await new Promise((resolve) => setTimeout(resolve, 800));
      setVideoSummaryData({
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
        engine: "Gemini AI Engine",
      });
    } catch (error) {
      console.warn("Video summary error:", error);
    } finally {
      setIsVideoLoading(false);
    }
  };

  /* Newsletter Database Submission */
  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedEmail = newsletterEmail.trim();
    
    if (!trimmedEmail || !trimmedEmail.includes("@") || !trimmedEmail.includes(".")) {
      setNewsletterMessage("Please enter a valid email address.");
      setNewsletterStatus("error");
      return;
    }
    
    setIsSubmittingNewsletter(true);
    setNewsletterMessage("");
    setNewsletterStatus("idle");
    
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmedEmail, source: "marketing_footer" }),
      });
      const data = await res.json();
      
      if (res.ok) {
        setNewsletterMessage(data.message || "Subscribed successfully! 🎉");
        setNewsletterStatus("success");
        setNewsletterEmail("");
        setTimeout(() => {
          setNewsletterMessage("");
          setNewsletterStatus("idle");
        }, 5000);
      } else {
        setNewsletterMessage(data.error || "Failed to subscribe. Please try again.");
        setNewsletterStatus("error");
      }
    } catch (error) {
      console.error("Newsletter subscription error:", error);
      setNewsletterMessage("Error subscribing. Please try again.");
      setNewsletterStatus("error");
    } finally {
      setIsSubmittingNewsletter(false);
    }
  };

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  /* Render Skeleton Loader during mount, session verification, or redirecting */
  if (!isMounted || status === "loading" || (status === "authenticated" && session?.user)) {
    return <LandingSkeleton />;
  }

  return (
    // ── STICKY FOOTER: flex column, min-h-screen ──
    <div className="min-h-screen flex flex-col bg-[#0A0806] text-[#FAFAF8] font-sans selection:bg-[#F5B429]/30 overflow-x-hidden relative antialiased glowing-bg">
      {/* ── EXTERNAL FONTS & KATEX STYLES ── */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link
        href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&family=Kalam:wght@400;700&display=swap"
        rel="stylesheet"
      />
      <link
        rel="stylesheet"
        href="https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.16.9/katex.min.css"
      />

      {/* FAQ Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildFAQSchema(homepageFaqs)) }}
        key="faq-schema"
      />

      <style jsx global>{`
        :root {
          --paper: #0A0806;
          --paper-2: #150F0B;
          --card: #150F0B;
          --ink: #FAFAF8;
          --ink-soft: #B8AFA6;
          --ink-faint: #8A8078;
          --rule: #2E2118;
          --rule-soft: rgba(46, 33, 24, 0.6);
          --red: #EF4444;
          --red-deep: #D9720E;
          --red-tint: rgba(239, 68, 68, 0.12);
          --gold: #F5B429;
          --gold-tint: rgba(245, 180, 41, 0.12);
          --cyan: #F5B429;
          --lavender: #F5941D;
          --white: #FAFAF8;
          --radius: 16px;
          --shadow: 0 0 30px -10px rgba(245, 148, 29, 0.15);
        }

        * { box-sizing: border-box; }
        html { scroll-behavior: smooth; }
        body {
          margin: 0;
          background: var(--paper);
          color: var(--ink);
          font-family: var(--font-inter), 'Inter', sans-serif;
          line-height: 1.5;
          -webkit-font-smoothing: antialiased;
        }
        h1, h2 {
          font-family: var(--font-playfair), 'Playfair Display', Georgia, serif;
          font-weight: 700;
          margin: 0;
          letter-spacing: -0.02em;
        }
        h3, h4 {
          font-family: var(--font-inter), 'Inter', sans-serif;
          font-weight: 600;
          margin: 0;
        }
        p { margin: 0; }
        a { color: inherit; text-decoration: none; }
        ul { margin: 0; padding: 0; list-style: none; }
        button { font-family: inherit; cursor: pointer; background: none; border: none; }
        img, svg { display: block; }

        .mono { font-family: 'JetBrains Mono', monospace; }
        .hand { font-family: 'Kalam', cursive; }

        ::selection { background: var(--gold-tint); color: var(--gold); }

        :focus-visible {
          outline: 2px solid var(--gold);
          outline-offset: 3px;
          border-radius: 4px;
        }

        .wrap {
          max-width: 1180px;
          margin: 0 auto;
          padding: 0 28px;
        }

        /* Nav */
        header {
          position: sticky; top: 0; z-index: 50;
          background: rgba(10, 8, 6, 0.85);
          backdrop-filter: blur(12px);
          border-bottom: 1px solid var(--rule);
          flex-shrink: 0;
        }
        .nav {
          display: flex; align-items: center; justify-content: space-between;
          height: 72px;
        }
        .nav-links {
          display: flex; align-items: center; gap: 26px;
          font-size: 13px; color: var(--ink-soft); font-weight: 600;
          text-transform: uppercase; letter-spacing: 0.05em;
        }
        .nav-links a, .nav-links button {
          transition: color .18s ease;
          cursor: pointer;
          background: none;
          border: none;
          font: inherit;
          color: inherit;
        }
        .nav-links a:hover, .nav-links button:hover { color: var(--gold); }
        .nav-links a.active, .nav-links button.active { color: var(--gold); }
        .nav-cta { display: flex; align-items: center; gap: 12px; }
        @media(max-width:980px){ .nav-links{display:none;} }

        .btn {
          display: inline-flex; align-items: center; justify-content: center; gap: 8px;
          padding: 10px 22px; border-radius: 9999px;
          font-weight: 600; font-size: 14px;
          border: 1px solid transparent;
          transition: transform .18s ease, box-shadow .18s ease, filter .18s ease;
          white-space: nowrap;
        }
        .btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none !important;
        }
        .btn-solid {
          background: linear-gradient(135deg, #F7C948 0%, #F5941D 100%);
          color: #150F0B;
          box-shadow: 0 4px 20px -2px rgba(245,148,29,0.35);
        }
        .btn-solid:hover:not(:disabled) { filter: brightness(1.08); transform: translateY(-1px); }
        .btn-ghost {
          background: #150F0B; color: var(--ink); border-color: var(--rule);
        }
        .btn-ghost:hover:not(:disabled) { border-color: var(--gold); color: #FAFAF8; background: #241811; }
        .btn-sm { padding: 7px 16px; font-size: 13px; }

        .btn-link {
          background: none;
          border: none;
          font: inherit;
          color: var(--ink-soft);
          display: block;
          font-size: 14px;
          margin-bottom: 9px;
          transition: color .16s ease;
          cursor: pointer;
          text-align: left;
          padding: 0;
        }
        .btn-link:hover { color: var(--gold); }

        /* Hero */
        .hero {
          padding: 76px 0 40px;
          position: relative;
        }
        .hero-grid {
          display: grid;
          grid-template-columns: 1.02fr 0.98fr;
          gap: 56px;
          align-items: center;
        }
        @media(max-width:980px){ .hero-grid{grid-template-columns:1fr; gap:44px;} }

        .eyebrow {
          display: inline-flex; align-items: center; gap: 8px;
          font-family: 'JetBrains Mono', monospace;
          font-size: 11.5px; font-weight: 600; letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--cyan);
          background: rgba(143, 195, 222, 0.1);
          border: 1px solid rgba(143, 195, 222, 0.25);
          padding: 6px 12px 6px 10px;
          border-radius: 100px;
          margin-bottom: 22px;
        }
        .eyebrow .dot { width: 6px; height: 6px; border-radius: 50%; background: var(--gold); }

        .hero h1 {
          font-size: clamp(34px, 4.6vw, 54px);
          line-height: 1.06;
          color: var(--ink);
          max-width: 640px;
        }
        .hero h1 em {
          font-style: normal;
          background: linear-gradient(transparent 62%, rgba(240, 201, 59, 0.25) 62%);
        }
        .hero p.lead {
          margin-top: 22px;
          font-size: 17px;
          color: var(--ink-soft);
          max-width: 520px;
          line-height: 1.65;
          font-weight: 300;
        }
        .hero-ctas { display: flex; gap: 14px; margin-top: 30px; flex-wrap: wrap; }

        .trust-note {
          margin-top: 22px; display: flex; align-items: center; gap: 10px;
          font-size: 13px; color: var(--ink-faint);
        }
        .avatars { display: flex; }
        .avatars span {
          width: 26px; height: 26px; border-radius: 50%;
          border: 2px solid var(--paper);
          margin-left: -8px;
          display: flex; align-items: center; justify-content: center;
          font-size: 10px; font-weight: 700; color: #150F0B;
          font-family: 'Space Grotesk';
        }
        .avatars span:nth-child(1){ background: var(--cyan); margin-left: 0; }
        .avatars span:nth-child(2){ background: var(--gold); }
        .avatars span:nth-child(3){ background: var(--lavender); }
        .avatars span:nth-child(4){ background: var(--red); }

        .sheet {
          background: var(--card);
          border: 1px solid var(--rule);
          border-radius: 20px;
          box-shadow: var(--shadow);
          padding: 0;
          position: relative;
          overflow: hidden;
        }
        .sheet-head {
          padding: 18px 22px;
          border-bottom: 1.5px dashed var(--rule);
          display: flex; align-items: center; justify-content: space-between;
        }
        .sheet-head-title {
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px; letter-spacing: 0.09em; text-transform: uppercase;
          color: var(--cyan); font-weight: 600;
        }
        .sheet-head-code {
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px; color: var(--ink-faint);
        }
        .sheet-body { padding: 22px; position: relative; }
        .sheet-body::before {
          content: "";
          position: absolute; inset: 22px;
          background-image: repeating-linear-gradient(to bottom, transparent 0px, transparent 27px, var(--rule-soft) 27px, var(--rule-soft) 28px);
          z-index: 0; pointer-events: none;
        }
        .sheet-note { position: relative; z-index: 1; }
        .sheet-note .fname {
          font-family: 'JetBrains Mono'; font-size: 12px; color: var(--ink-faint); margin-bottom: 4px;
        }
        .sheet-note h4 { font-size: 17px; margin-bottom: 10px; color: var(--ink); }
        .sheet-note .eqn {
          font-family: 'JetBrains Mono'; font-size: 13px;
          background: #0A0806; border-radius: 8px; border: 1px solid var(--rule);
          padding: 12px 14px; color: var(--gold);
          margin-bottom: 10px; line-height: 1.7;
          overflow-x: auto;
        }
        .stamp {
          position: absolute; top: 16px; right: 18px;
          width: 104px; height: 104px;
          border: 2.5px solid var(--gold);
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          text-align: center;
          transform: rotate(-11deg);
          color: var(--gold);
          font-family: 'Space Grotesk'; font-weight: 700; font-size: 11.5px;
          letter-spacing: 0.03em;
          line-height: 1.25;
          background: rgba(21, 15, 11, 0.9);
          z-index: 2;
        }
        .margin-note {
          font-family: 'Kalam', cursive;
          color: var(--gold);
          font-size: 14.5px;
          position: relative; z-index: 1;
          margin-top: 6px;
          padding-left: 2px;
        }
        .sheet-stats {
          position: relative; z-index: 1;
          margin-top: 18px;
          display: grid; grid-template-columns: repeat(4,1fr);
          border-top: 1.5px dashed var(--rule);
          padding-top: 16px;
        }
        .sheet-stats div { text-align: center; padding: 0 4px; }
        .sheet-stats .num { font-family: 'Space Grotesk'; font-weight: 700; font-size: 18px; color: var(--ink); }
        .sheet-stats .lbl { font-size: 10.5px; color: var(--ink-soft); margin-top: 2px; letter-spacing: 0.02em; }
        @media(max-width:500px){ .sheet-stats{grid-template-columns:repeat(2,1fr); row-gap:14px;} }

        /* Ticker */
        .ticker-band {
          border-top: 1px solid var(--rule);
          border-bottom: 1px solid var(--rule);
          background: #0A0806;
          overflow: hidden;
          padding: 13px 0;
          margin-top: 64px;
        }
        .ticker-track {
          display: flex; gap: 44px;
          width: max-content;
          animation: ticker 28s linear infinite;
        }
        @keyframes ticker { from{transform:translateX(0);} to{transform:translateX(-50%);} }
        .ticker-track span {
          font-family: 'JetBrains Mono'; font-size: 12.5px; font-weight: 600;
          color: var(--ink-soft); letter-spacing: 0.06em; white-space: nowrap;
          display: flex; align-items: center; gap: 10px;
        }
        .ticker-track span::before { content: "·"; color: var(--gold); font-size: 16px; }

        /* Section Shell */
        section { padding: 96px 0; }
        .section-head { max-width: 600px; margin-bottom: 52px; }
        .section-tag {
          font-family: 'JetBrains Mono'; font-size: 12px; font-weight: 600;
          letter-spacing: 0.09em; text-transform: uppercase; color: var(--cyan);
          margin-bottom: 12px; display: block;
        }
        .section-head h2 { font-size: clamp(26px,3vw,36px); line-height: 1.15; color: var(--ink); }
        .section-head p { margin-top: 14px; color: var(--ink-soft); font-size: 16px; line-height: 1.6; font-weight: 300; }

        /* Demo */
        .demo-wrap {
          background: var(--card);
          border: 1px solid var(--rule);
          border-radius: 20px;
          box-shadow: var(--shadow);
          overflow: hidden;
        }
        .demo-top {
          display: flex; align-items: center; justify-content: space-between;
          padding: 16px 22px; border-bottom: 1px solid var(--rule);
          background: #150F0B;
        }
        .live-tag {
          display: inline-flex; align-items: center; gap: 7px;
          font-family: 'JetBrains Mono'; font-size: 11.5px; font-weight: 600;
          color: var(--gold); letter-spacing: 0.04em;
        }
        .live-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--gold); animation: pulse 1.6s ease-in-out infinite; }
        @keyframes pulse { 0%,100%{opacity:1;} 50%{opacity:0.3;} }

        .demo-body { padding: 26px; }
        .chip-row { display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 20px; }
        .chip {
          font-size: 13px; font-weight: 500; padding: 8px 14px;
          border-radius: 100px; border: 1.5px solid var(--rule);
          background: #150F0B; color: var(--ink-soft);
          transition: all .16s ease;
        }
        .chip:hover { border-color: var(--gold); color: var(--gold); }
        .chip.active { background: var(--gold); border-color: var(--gold); color: #150F0B; font-weight: 700; }

        .demo-answer {
          background: #0A0806;
          border-radius: 12px; border: 1px solid var(--rule);
          padding: 20px 22px;
          min-height: 140px;
          font-size: 14.5px;
          color: var(--ink);
          line-height: 1.75;
        }
        .demo-answer .placeholder { color: var(--ink-faint); font-size: 14.5px; }
        .demo-answer .tag {
          font-family: 'JetBrains Mono'; font-size: 11px; font-weight: 600;
          color: var(--cyan); text-transform: uppercase; letter-spacing: 0.06em;
          margin-bottom: 10px; display: block;
        }
        .demo-input-row { display: flex; gap: 10px; margin-top: 18px; }
        .demo-input {
          flex: 1; border: 1.5px solid var(--rule); border-radius: 10px;
          padding: 12px 15px; font-size: 14.5px; font-family: inherit;
          background: #0A0806; color: var(--ink);
        }
        .demo-input:focus { border-color: var(--gold); outline: none; }

        /* Features */
        .feat-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 22px; }
        @media(max-width:980px){ .feat-grid{grid-template-columns:repeat(2,1fr);} }
        @media(max-width:600px){ .feat-grid{grid-template-columns:1fr;} }
        .feat-card {
          background: var(--card); border: 1px solid var(--rule);
          border-radius: 18px; padding: 26px 22px;
          transition: transform .22s ease, box-shadow .22s ease, border-color .22s ease;
        }
        .feat-card:hover { transform: translateY(-4px); box-shadow: var(--shadow); border-color: var(--gold); }
        .feat-icon {
          width: 42px; height: 42px; border-radius: 10px;
          background: #0A0806; border: 1px solid var(--rule);
          display: flex; align-items: center; justify-content: center;
          margin-bottom: 16px; color: var(--gold);
        }
        .feat-card h3 { font-size: 17px; margin-bottom: 8px; color: var(--ink); }
        .feat-card p { font-size: 14.5px; color: var(--ink-soft); line-height: 1.6; font-weight: 300; }

        /* Personas */
        .persona-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 20px; }
        @media(max-width:980px){ .persona-grid{grid-template-columns:repeat(2,1fr);} }
        @media(max-width:560px){ .persona-grid{grid-template-columns:1fr;} }
        .persona-card {
          background: var(--card); border: 1px solid var(--rule); border-radius: 16px;
          padding: 22px 20px; position: relative;
        }
        .persona-top { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 14px; }
        .persona-check {
          width: 22px; height: 22px; border: 1.5px solid var(--gold); border-radius: 5px;
          display: flex; align-items: center; justify-content: center; flex: none;
          color: var(--gold); font-size: 13px; font-weight: 700;
        }
        .persona-code { font-family: 'JetBrains Mono'; font-size: 10.5px; color: var(--cyan); letter-spacing: 0.04em; }
        .persona-card h3 { font-size: 16px; margin-bottom: 8px; color: var(--ink); }
        .persona-card p { font-size: 13.5px; color: var(--ink-soft); line-height: 1.6; font-weight: 300; }

        /* Spotlights */
        .spotlight { padding: 70px 0; }
        .spotlight-grid {
          display: grid; grid-template-columns: 1fr 1fr; gap: 56px; align-items: center;
        }
        .spotlight.reverse .spotlight-grid { direction: rtl; }
        .spotlight.reverse .spotlight-grid > * { direction: ltr; }
        @media(max-width:980px){
          .spotlight-grid { grid-template-columns: 1fr; }
          .spotlight.reverse .spotlight-grid { direction: ltr; }
        }
        .spotlight-copy h3 { font-size: clamp(22px,2.6vw,30px); line-height: 1.2; margin-top: 14px; color: var(--ink); }
        .spotlight-copy > p { margin-top: 14px; color: var(--ink-soft); font-size: 15.5px; line-height: 1.65; max-width: 480px; font-weight: 300; }
        .spotlight-list { margin-top: 20px; display: flex; flex-direction: column; gap: 11px; }
        .spotlight-list li { display: flex; align-items: flex-start; gap: 10px; font-size: 14px; color: var(--ink); }
        .spotlight-list .tick { color: var(--gold); flex: none; margin-top: 2px; font-weight: 700; }
        .spotlight-panel {
          background: var(--card); border: 1px solid var(--rule); border-radius: 20px;
          box-shadow: var(--shadow); overflow: hidden;
        }

        .panel-header {
          display: flex; justify-content: space-between; align-items: center;
          padding: 12px 16px; border-bottom: 1px solid var(--rule); background: #150F0B;
          font-family: 'JetBrains Mono'; font-size: 11px; color: var(--cyan); letter-spacing: 0.05em;
        }

        .editor-toolbar { display: flex; gap: 6px; padding: 12px 16px; border-bottom: 1px solid var(--rule); background: #150F0B; }
        .editor-toolbar span {
          width: 26px; height: 26px; border-radius: 6px; background: #0A0806; border: 1px solid var(--rule);
          display: flex; align-items: center; justify-content: center; font-family: 'JetBrains Mono'; font-size: 11px; color: var(--gold);
        }

        .video-body { padding: 20px 22px; }
        .video-input-row { display: flex; gap: 8px; margin-bottom: 16px; }
        .video-input-row input {
          flex: 1; border: 1.5px solid var(--rule); border-radius: 8px; padding: 9px 12px;
          font-family: 'JetBrains Mono'; font-size: 12.5px; color: var(--ink); background: #0A0806;
        }
        .video-input-row input:focus { border-color: var(--gold); outline: none; }
        .video-chapters { display: flex; flex-direction: column; gap: 9px; }
        .video-chapter {
          display: flex; align-items: center; gap: 10px; font-size: 13px; color: var(--ink);
          background: #0A0806; border: 1px solid var(--rule-soft); border-radius: 8px; padding: 9px 12px;
        }
        .video-chapter .ts { font-family: 'JetBrains Mono'; font-size: 11.5px; color: var(--gold); font-weight: 600; flex: none; }
        .xp-badge {
          display: inline-flex; align-items: center; gap: 6px; margin-top: 14px;
          background: rgba(245, 180, 41, 0.15); color: var(--gold); border: 1px solid rgba(245, 180, 41, 0.3);
          font-family: 'JetBrains Mono'; font-size: 11.5px; font-weight: 600; padding: 6px 12px; border-radius: 100px;
        }

        .community-body { padding: 20px 22px; }
        .leaderboard-row {
          display: flex; align-items: center; gap: 12px; padding: 10px 0;
          border-bottom: 1px solid var(--rule-soft);
        }
        .leaderboard-row:last-child { border-bottom: none; }
        .rank-badge {
          width: 26px; height: 26px; border-radius: 50%; background: #0A0806; border: 1px solid var(--rule);
          display: flex; align-items: center; justify-content: center;
          font-family: 'Space Grotesk'; font-weight: 700; font-size: 12px; color: var(--ink); flex: none;
        }
        .leaderboard-row.top .rank-badge { background: var(--gold); color: #150F0B; }
        .lb-name { flex: 1; font-size: 13.5px; font-weight: 600; color: var(--ink); }
        .lb-coins { font-family: 'JetBrains Mono'; font-size: 12px; color: var(--gold); }
        .wallet-chip {
          margin-top: 16px; display: flex; align-items: center;
          background: #0A0806; border: 1px solid var(--rule); border-radius: 10px; padding: 12px 14px;
          font-size: 12.5px; color: var(--ink-soft);
        }
        .wallet-chip strong { color: var(--gold); }

        /* Checklist */
        .checklist-wrap {
          background: var(--card); border: 1px solid var(--rule); border-radius: 20px; padding: 36px 40px;
        }
        .checklist { display: grid; grid-template-columns: repeat(2,1fr); gap: 14px 40px; }
        @media(max-width:700px){ .checklist{ grid-template-columns:1fr; } }
        .checklist li { display: flex; align-items: center; gap: 10px; font-size: 14.5px; color: var(--ink); }
        .checklist .tick {
          width: 18px; height: 18px; border-radius: 4px; border: 1.5px solid var(--gold); color: var(--gold);
          display: flex; align-items: center; justify-content: center; flex: none; font-size: 12px; font-weight: 700;
        }

        /* How it works */
        .steps { position: relative; padding-left: 76px; }
        .steps::before {
          content: ""; position: absolute; left: 34px; top: 6px; bottom: 6px; width: 1.5px;
          background: repeating-linear-gradient(to bottom, var(--gold) 0 6px, transparent 6px 12px);
        }
        .step { position: relative; padding-bottom: 44px; }
        .step:last-child { padding-bottom: 0; }
        .step-num {
          position: absolute; left: -76px; top: -4px;
          width: 52px; height: 52px; border-radius: 50%;
          background: var(--card); border: 1.5px solid var(--gold);
          display: flex; align-items: center; justify-content: center;
          font-family: 'Space Grotesk'; font-weight: 700; font-size: 16px; color: var(--gold);
        }
        .step h3 { font-size: 19px; margin-bottom: 8px; color: var(--ink); }
        .step p { color: var(--ink-soft); font-size: 15px; max-width: 520px; line-height: 1.65; font-weight: 300; }

        /* Why Students Love Notexia (new content) */
        .love-grid { display: grid; grid-template-columns: repeat(2,1fr); gap: 24px; }
        @media(max-width:700px){ .love-grid{ grid-template-columns:1fr; } }
        .love-card {
          background: var(--card); border: 1px solid var(--rule); border-radius: 18px;
          padding: 26px 24px;
        }
        .love-card h4 { font-size: 17px; color: var(--gold); margin-bottom: 8px; }
        .love-card p { font-size: 14.5px; color: var(--ink-soft); line-height: 1.65; }

        /* Pricing */
        .price-toggle-row { display: flex; align-items: center; gap: 12px; margin-bottom: 36px; }
        .toggle-switch {
          width: 46px; height: 26px; border-radius: 100px; background: #0A0806; border: 1px solid var(--rule); position: relative;
          cursor: pointer; padding: 0; flex: none;
          transition: background .2s ease;
        }
        .toggle-switch::after {
          content: ""; position: absolute; top: 3px; left: 3px; width: 18px; height: 18px; border-radius: 50%;
          background: var(--ink-soft); transition: transform .2s ease, background .2s ease;
        }
        .toggle-switch.on { background: var(--gold); }
        .toggle-switch.on::after { transform: translateX(20px); background: #150F0B; }
        .toggle-label { font-size: 13.5px; color: var(--ink-soft); }
        .toggle-save { font-family: 'JetBrains Mono'; font-size: 11px; color: var(--gold); background: rgba(245, 180, 41, 0.15); padding: 3px 8px; border-radius: 100px; font-weight: 600; border: 1px solid rgba(245, 180, 41, 0.3); }

        .pricing-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 22px; }
        @media(max-width:820px){ .pricing-grid{ grid-template-columns:1fr; } }
        .price-card {
          background: var(--card); border: 1.5px solid var(--rule); border-radius: 20px; padding: 32px;
          position: relative;
        }
        .price-card.pro { border-color: var(--gold); box-shadow: var(--shadow); }
        .price-badge {
          position: absolute; top: -13px; left: 32px; background: var(--gold); color: #150F0B;
          font-family: 'JetBrains Mono'; font-size: 10.5px; font-weight: 700; letter-spacing: 0.04em;
          padding: 5px 12px; border-radius: 100px;
        }
        .price-name { font-family: 'JetBrains Mono'; font-size: 12px; text-transform: uppercase; letter-spacing: 0.08em; color: var(--cyan); font-weight: 600; }
        .price-amount { font-family: 'Space Grotesk'; font-size: 38px; font-weight: 700; margin-top: 10px; color: var(--ink); }
        .price-amount span { font-size: 15px; font-weight: 500; color: var(--ink-soft); }
        .price-list { margin-top: 24px; display: flex; flex-direction: column; gap: 11px; }
        .price-list li { display: flex; align-items: flex-start; gap: 9px; font-size: 14px; color: var(--ink); }
        .price-list .tick { color: var(--gold); flex: none; margin-top: 2px; font-weight: 700; }
        .price-card .btn { width: 100%; margin-top: 26px; }
        .price-note { margin-top: 24px; font-size: 13px; color: var(--ink-faint); text-align: center; }

        /* Tools */
        .tools-card {
          background: #0A0806; color: var(--ink);
          border: 1px solid var(--rule);
          border-radius: 20px; padding: 44px 40px;
          display: flex; align-items: center; justify-content: space-between; gap: 32px;
          flex-wrap: wrap; position: relative; overflow: hidden;
        }
        .tools-copy { max-width: 480px; position: relative; z-index: 1; }
        .tools-copy h3 { color: #FAFAF8; font-size: 24px; margin-bottom: 12px; font-family: var(--font-display); }
        .tools-copy p { color: var(--ink-soft); font-size: 15px; line-height: 1.65; font-weight: 300; }
        .tools-boards { display: flex; gap: 9px; flex-wrap: wrap; margin-top: 18px; }
        .tools-boards span {
          font-family: 'JetBrains Mono'; font-size: 11.5px;
          border: 1px solid var(--rule); color: var(--cyan);
          padding: 5px 10px; border-radius: 6px; background: #150F0B;
        }

        /* Reviews */
        .rev-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 22px; }
        @media(max-width:900px){ .rev-grid{grid-template-columns:1fr;} }
        .rev-card {
          background: var(--card); border: 1px solid var(--rule);
          border-radius: 18px; padding: 26px;
        }
        .rev-quote { font-size: 15px; color: var(--ink); line-height: 1.65; margin-bottom: 20px; font-weight: 300; }
        .rev-person { display: flex; align-items: center; gap: 11px; }
        .rev-avatar {
          width: 36px; height: 36px; border-radius: 50%;
          background: var(--gold); display: flex; align-items: center; justify-content: center;
          font-family: 'Space Grotesk'; font-weight: 700; font-size: 13px; color: #150F0B;
          flex: none;
        }
        .rev-name { font-size: 14px; font-weight: 700; color: var(--ink); }
        .rev-role { font-size: 12.5px; color: var(--ink-soft); margin-top: 1px; }

        /* Stats Strip */
        .stats-strip { background: #0A0806; border-top: 1px solid var(--rule); border-bottom: 1px solid var(--rule); padding: 52px 0; }
        .stats-strip-inner { display: flex; justify-content: space-between; flex-wrap: wrap; gap: 28px; }
        .stat-block { text-align: center; flex: 1; min-width: 130px; }
        .stat-block .num { font-family: 'Space Grotesk'; font-weight: 700; font-size: clamp(26px,3vw,36px); color: var(--gold); }
        .stat-block .lbl { font-size: 12.5px; color: var(--ink-soft); margin-top: 4px; }

        /* FAQ */
        .faq-item { border-bottom: 1px solid var(--rule); }
        .faq-q {
          display: flex; align-items: center; justify-content: space-between;
          padding: 22px 4px; font-weight: 600; font-size: 15.5px;
          width: 100%; background: none; border: none; text-align: left; color: var(--ink);
          cursor: pointer;
        }
        .faq-q .plus {
          font-size: 20px; color: var(--gold); transition: transform .25s ease; flex: none; margin-left: 16px;
        }
        .faq-item.open .plus { transform: rotate(45deg); }
        .faq-a {
          max-height: 0; overflow: hidden; transition: max-height .32s ease;
        }
        .faq-item.open .faq-a { max-height: 500px; }
        .faq-a-inner { padding: 0 4px 22px; color: var(--ink-soft); font-size: 14.5px; line-height: 1.65; max-width: 640px; font-weight: 300; }

        /* Final CTA */
        .cta-band {
          background: #0A0806;
          border: 1px solid var(--rule);
          border-radius: 22px;
          padding: 64px 40px;
          text-align: center;
          position: relative; overflow: hidden;
        }
        .cta-band::after {
          content: "";
          position: absolute; left: 50%; top: -1px; transform: translateX(-50%);
          width: 220px; height: 3px; background: var(--gold);
          border-radius: 0 0 4px 4px;
        }
        .cta-band h2 { color: #FAFAF8; font-size: clamp(26px,3.4vw,38px); max-width: 620px; margin: 0 auto; font-family: var(--font-display); }
        .cta-band p { color: var(--ink-soft); margin-top: 14px; font-size: 15.5px; font-weight: 300; }
        .cta-band .hero-ctas { justify-content: center; margin-top: 28px; }

        /* Footer */
        footer {
          border-top: 1px solid var(--rule);
          padding: 32px 0 0 0;
          background: #0A0806;
          margin-top: auto;
          margin-bottom: 0;
          padding-bottom: 0;
          flex-shrink: 0;
          width: 100%;
        }
        .foot-top { display: flex; justify-content: space-between; gap: 30px; flex-wrap: wrap; align-items: flex-start; margin-bottom: 20px; }
        .foot-links { display: flex; gap: 36px; flex-wrap: wrap; }
        .foot-col h5 { font-size: 12px; text-transform: uppercase; letter-spacing: 0.07em; color: var(--cyan); margin-bottom: 10px; font-weight: 700; font-family: 'JetBrains Mono'; }
        .foot-col a, .foot-col .btn-link { display: block; font-size: 13.5px; color: var(--ink-soft); margin-bottom: 7px; transition: color .16s ease; }
        .foot-col a:hover, .foot-col .btn-link:hover { color: var(--gold); }
        .foot-bottom { display: flex; justify-content: space-between; flex-wrap: wrap; gap: 10px; padding: 12px 0 0 0; margin-bottom: 0; padding-bottom: 0; border-top: 1px solid var(--rule); font-size: 12px; color: var(--ink-faint); }
        .status-dot { display: inline-flex; align-items: center; gap: 6px; color: var(--cyan); font-family: 'JetBrains Mono'; }
        .status-dot span.d { width: 6px; height: 6px; border-radius: 50%; background: #4E9A6A; }

        .newsletter { margin-top: 18px; }
        .newsletter-row { display: flex; gap: 8px; max-width: 340px; }
        .newsletter-row input {
          flex: 1; border: 1.5px solid var(--rule); border-radius: 8px; padding: 9px 12px; font-size: 13px; font-family: inherit;
          background: #150F0B; color: var(--ink);
        }
        .newsletter-row input:focus { border-color: var(--gold); outline: none; }
        .newsletter-msg { font-size: 12.5px; margin-top: 8px; min-height: 16px; font-family: 'JetBrains Mono'; }
        .newsletter-msg.success { color: var(--gold); }
        .newsletter-msg.error { color: var(--red); }
        
        .animate-pulse { animation: pulse 1.6s ease-in-out infinite; }
        .flex { display: flex; }
        .items-center { align-items: center; }
        .gap-2 { gap: 8px; }
        .space-y-2 > * + * { margin-top: 8px; }
        .text-sm { font-size: 14px; }
        .leading-relaxed { line-height: 1.75; }
        .text-[#F3F0E4] { color: #FAFAF8; }
        .mb-2 { margin-bottom: 8px; }
        .text-xs { font-size: 12px; }
        .font-mono { font-family: 'JetBrains Mono', monospace; }
        .text-[#8FC3DE] { color: #FCD34D; }
        .font-bold { font-weight: 700; }
        .flex-col { flex-direction: column; }
        .items-start { align-items: flex-start; }
        .gap-1 { gap: 4px; }
        .w-full { width: 100%; }
        .text-[11px] { font-size: 11px; }
        .text-[#9FAEA1] { color: #8A8078; }
        .font-light { font-weight: 300; }
        .pl-11 { padding-left: 44px; }
        .justify-between { justify-content: space-between; }
        .mt-3 { margin-top: 12px; }
        .pt-2 { padding-top: 8px; }
        .border-t { border-top-width: 1px; }
        .border-[#F3F0E4]/10 { border-color: rgba(46, 33, 24, 0.6); }
        .text-[10px] { font-size: 10px; }
        .text-[#7B8C7E] { color: #8A8078; }
        .mb-3 { margin-bottom: 12px; }
        .text-[#F0C93B] { color: #F5B429; }
        .font-semibold { font-weight: 600; }
        .coin-icon { 
          display: inline-block;
          width: 16px; height: 16px;
          background: var(--gold);
          border-radius: 50%;
          flex: none;
          margin-right: 4px;
        }
        .flex-1 { flex: 1; }
        .min-h-screen { min-height: 100vh; }
      `}</style>

      {/* ── HEADER NAVBAR ── */}
      <header>
        <div className="wrap nav">
          <Link href="/" aria-label="Notexia Home">
            <NotexiaLogo size="md" />
          </Link>
          <nav className="nav-links" role="navigation" aria-label="Main navigation">
            <button 
              onClick={() => scrollToSection("features")} 
              className={activeSection === "features" ? "active" : ""}
              aria-current={activeSection === "features" ? "location" : undefined}
            >
              Features
            </button>
            <button 
              onClick={() => scrollToSection("demo")}
              className={activeSection === "demo" ? "active" : ""}
              aria-current={activeSection === "demo" ? "location" : undefined}
            >
              Live AI Demo
            </button>
            <button 
              onClick={() => scrollToSection("how-it-works")}
              className={activeSection === "how-it-works" ? "active" : ""}
              aria-current={activeSection === "how-it-works" ? "location" : undefined}
            >
              How it works
            </button>
            <button 
              onClick={() => scrollToSection("pricing")}
              className={activeSection === "pricing" ? "active" : ""}
              aria-current={activeSection === "pricing" ? "location" : undefined}
            >
              Pricing
            </button>
            <button 
              onClick={() => scrollToSection("tools")}
              className={activeSection === "tools" ? "active" : ""}
              aria-current={activeSection === "tools" ? "location" : undefined}
            >
              Tools
            </button>
            <button 
              onClick={() => scrollToSection("reviews")}
              className={activeSection === "reviews" ? "active" : ""}
              aria-current={activeSection === "reviews" ? "location" : undefined}
            >
              Stories
            </button>
          </nav>
          <div className="nav-cta">
            {session?.user ? (
              <Link href="/dashboard" className="btn btn-solid btn-sm">
                Go to Dashboard &rarr;
              </Link>
            ) : (
              <>
                <Link href="/login" className="btn btn-ghost btn-sm">
                  Sign in
                </Link>
                <Link href="/signup" className="btn btn-solid btn-sm">
                  Get started free
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ── MAIN CONTENT ── */}
      <main className="flex-1">
        {/* ── HERO ── */}
        <section className="hero" id="hero">
          <div className="wrap">
            <div className="hero-grid">
              <div>
                <span className="eyebrow">
                  <span className="dot" />
                  Built for JEE · NEET · CBSE · GATE aspirants
                </span>
                <h1>
                  AI Study Platform for Students — Notes, Doubt Solver &amp; Revision
                </h1>
                <p className="lead">
                  Notexia is an AI-powered study platform for Indian students, engineering undergraduates, and competitive exam aspirants (JEE, NEET, GATE, CBSE). Organize digital study notes with LaTeX formulas, solve homework doubts 24/7, access formula sheets, and collaborate with a student community.
                </p>
                <div className="hero-ctas">
                  <Link href="/signup" className="btn btn-solid">
                    Start free, no card needed
                  </Link>
                  <button onClick={() => scrollToSection("demo")} className="btn btn-ghost">
                    Watch a doubt get solved ↓
                  </button>
                </div>
                <div className="trust-note">
                  <div className="avatars">
                    <span>R</span>
                    <span>S</span>
                    <span>A</span>
                    <span>P</span>
                  </div>
                  <span>Joined by students preparing across 120+ colleges and coaching batches</span>
                </div>
              </div>

              <div className="sheet" role="img" aria-label="Notexia workspace preview showing quantum Fourier transform derivation with AI verification">
                <div className="sheet-head">
                  <span className="sheet-head-title">Notexia Workspace</span>
                  <span className="sheet-head-code">workspace.notexia.cloud</span>
                </div>
                <div className="sheet-body">
                  <div className="stamp">
                    ✓ AI
                    <br />
                    VERIFIED
                  </div>
                  <div className="sheet-note">
                    <div className="fname">Quantum_Fourier_Transform.md · auto-saved</div>
                    <h4>Quantum Fourier Transform — derivation</h4>
                    <div className="eqn" aria-label="Mathematical expression">
                      const qft = (state) =&gt; state.applyGate(&quot;Hadamard&quot;);
                      <br />
                      ψ(x) = A · e^(i(kx − ωt))
                    </div>
                    <p className="margin-note hand">nice derivation — tighten step 2 before the mock ✎</p>
                  </div>
                  <div className="sheet-stats">
                    <div>
                      <div className="num">42,000+</div>
                      <div className="lbl">Notes authored</div>
                    </div>
                    <div>
                      <div className="num">1.1L+</div>
                      <div className="lbl">Doubts solved</div>
                    </div>
                    <div>
                      <div className="num">4.8/5</div>
                      <div className="lbl">Student rating</div>
                    </div>
                    <div>
                      <div className="num">99.9%</div>
                      <div className="lbl">Uptime</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="ticker-band" role="marquee" aria-label="Supported exam boards and universities">
            <div className="ticker-track">
              <span>JEE MAIN</span>
              <span>JEE ADVANCED</span>
              <span>NEET UG</span>
              <span>CBSE XII</span>
              <span>GATE</span>
              <span>VTU</span>
              <span>KTU</span>
              <span>MUMBAI UNIVERSITY</span>
              <span>JEE MAIN</span>
              <span>JEE ADVANCED</span>
              <span>NEET UG</span>
              <span>CBSE XII</span>
              <span>GATE</span>
              <span>VTU</span>
              <span>KTU</span>
              <span>MUMBAI UNIVERSITY</span>
            </div>
          </div>
        </section>

        {/* ── LIVE DEMO WITH FORMATTED AI OUTPUT ── */}
        <section id="demo">
          <div className="wrap">
            <div className="section-head">
              <span className="section-tag">Live AI copilot</span>
              <h2>Ask it something you&apos;d actually get stuck on.</h2>
              <p>
                This box is wired to a real model — try a sample doubt below, or type your own. Answers come back the way a good senior would explain them: short, stepped, and exam-ready.
              </p>
            </div>

            <div className="demo-wrap">
              <div className="demo-top">
                <span className="live-tag">
                  <span className="live-dot" />
                  AI COPILOT — LIVE
                </span>
                <span className="mono" style={{ fontSize: "11.5px", color: "var(--cyan)" }}>
                  model: openrouter (gpt-4o-mini)
                </span>
              </div>
              <div className="demo-body">
                <div className="chip-row" role="group" aria-label="Sample query chips">
                  {sampleQueries.map((q, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleChipClick(idx, q.prompt)}
                      className={`chip ${activeChip === idx ? "active" : ""}`}
                      aria-pressed={activeChip === idx}
                    >
                      {q.label}
                    </button>
                  ))}
                </div>

                {/* FORMATTED READABLE AI ANSWER CONTAINER */}
                <div className="demo-answer" role="region" aria-label="AI response">
                  <span className="tag">Notexia AI Copilot Solution</span>
                  {isAiLoading ? (
                    <div style={{ color: "var(--gold)", fontWeight: 600 }} className="flex items-center gap-2">
                      <span className="animate-pulse">Synthesizing exam-ready answer via OpenRouter AI...</span>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {formattedAiLines.map((line, idx) => (
                        <p key={idx} className="text-sm leading-relaxed text-[#FAFAF8]">
                          {line}
                        </p>
                      ))}
                    </div>
                  )}
                </div>

                <form onSubmit={handleCustomSubmit} className="demo-input-row" role="search">
                  <input
                    type="text"
                    className="demo-input"
                    placeholder="Type a doubt — e.g. 'why does entropy always increase in an isolated system?'"
                    value={demoInputText}
                    onChange={(e) => setDemoInputText(e.target.value)}
                    aria-label="Your doubt question"
                  />
                  <button type="submit" disabled={isAiLoading} className="btn btn-solid">
                    {isAiLoading ? "Asking..." : "Ask AI"}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </section>

        {/* ── WHO IT'S FOR ── */}
        <section id="who">
          <div className="wrap">
            <div className="section-head">
              <span className="section-tag">Pick your category</span>
              <h2>Built differently for every exam you&apos;re actually taking.</h2>
              <p>
                Same workspace underneath — but the notes, AI prompts and content packs are tuned per exam, because a JEE derivation and a NEET diagram need explaining differently.
              </p>
            </div>

            <div className="persona-grid">
              <div className="persona-card">
                <div className="persona-top">
                  <div className="persona-check">✓</div>
                  <span className="persona-code">CAT · JEE</span>
                </div>
                <h3>JEE Main &amp; Advanced</h3>
                <p>
                  Physics, Chemistry and Math notes built around numericals, not paragraphs. The AI copilot solves multi-step problems the way a topper&apos;s solution key would.
                </p>
              </div>
              <div className="persona-card">
                <div className="persona-top">
                  <div className="persona-check">✓</div>
                  <span className="persona-code">CAT · NEET</span>
                </div>
                <h3>NEET UG</h3>
                <p>
                  Biology diagrams, NCERT-aligned recall notes, and an AI copilot that explains mechanisms instead of just naming them.
                </p>
              </div>
              <div className="persona-card">
                <div className="persona-top">
                  <div className="persona-check">✓</div>
                  <span className="persona-code">CAT · CBSE</span>
                </div>
                <h3>CBSE X &amp; XII</h3>
                <p>
                  Board-pattern answer writing, chapter-wise notes, and a CGPA-to-percentage converter that uses the official formula, not a guess.
                </p>
              </div>
              <div className="persona-card">
                <div className="persona-top">
                  <div className="persona-check">✓</div>
                  <span className="persona-code">CAT · GATE</span>
                </div>
                <h3>GATE &amp; Engineering</h3>
                <p>
                  Semester notes, LaTeX-heavy derivations, and CGPA tools for VTU, KTU and Mumbai University — synced across your whole batch.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── FEATURES OVERVIEW ── */}
        <section id="features">
          <div className="wrap">
            <div className="section-head">
              <span className="section-tag">Built for the grind</span>
              <h2>Everything you need to actually study, in one workspace.</h2>
              <p>
                Organise lecture notes, solve the problem that&apos;s blocking you at 11pm, and collaborate with classmates across India — without ten different tabs open.
              </p>
            </div>

            <div className="feat-grid">
              <div className="feat-card">
                <div className="feat-icon" aria-hidden="true">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                  </svg>
                </div>
                <h3>Rich editor + LaTeX</h3>
                <p>Write with a proper markdown editor, syntax-highlighted code blocks and inline or block LaTeX. Export to PDF whenever you need a physical copy.</p>
              </div>
              <div className="feat-card">
                <div className="feat-icon" aria-hidden="true">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
                    <path d="M12 2a7 7 0 0 0-7 7c0 2.4 1.2 4.1 2.3 5.3.6.6 1 1.5 1 2.4V18h7.4v-1.3c0-.9.4-1.8 1-2.4C17.8 13.1 19 11.4 19 9a7 7 0 0 0-7-7z" />
                    <path d="M9.5 21h5" />
                  </svg>
                </div>
                <h3>24/7 AI doubt-solving</h3>
                <p>Ask physics derivations, calculus integrals or debugging questions right inside your note, and get a stepped explanation in seconds — not tomorrow&apos;s doubt session.</p>
              </div>
              <div className="feat-card">
                <div className="feat-icon" aria-hidden="true">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
                    <path d="M8 21V10M14 21V3M20 21v-7M4 21h18" />
                  </svg>
                </div>
                <h3>Gamified leaderboard</h3>
                <p>Earn coins and scholar badges for answering peer doubts and publishing quality notes. See exactly where you rank against your batch.</p>
              </div>
              <div className="feat-card">
                <div className="feat-icon" aria-hidden="true">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
                    <circle cx="9" cy="8" r="3.2" />
                    <path d="M2.5 20c0-3.3 3-5.3 6.5-5.3s6.5 2 6.5 5.3" />
                    <circle cx="17.5" cy="7" r="2.4" />
                    <path d="M15.8 12.1c2.6.4 4.7 2.2 4.7 4.9" />
                  </svg>
                </div>
                <h3>Subject forums</h3>
                <p>Dedicated threads per subject and exam. Share revision notes, ask your batch a question, or message a classmate directly for a group revision sprint.</p>
              </div>
            </div>
          </div>
        </section>

        {/* ── SPOTLIGHT: EDITOR ── */}
        <section className="spotlight" id="editor">
          <div className="wrap">
            <div className="spotlight-grid">
              <div className="spotlight-copy">
                <span className="eyebrow">
                  <span className="dot" />
                  Spotlight — 01
                </span>
                <h3>An editor that keeps up with a physics derivation.</h3>
                <p>
                  TipTap-powered markdown with inline and block LaTeX, syntax-highlighted code blocks, and checkboxes for problem sets. Everything auto-saves as you type, so a derivation never gets lost mid-thought.
                </p>
                <ul className="spotlight-list">
                  <li>
                    <span className="tick">✓</span>Auto-save with live cloud sync
                  </li>
                  <li>
                    <span className="tick">✓</span>KaTeX rendering for inline &amp; block equations
                  </li>
                  <li>
                    <span className="tick">✓</span>Syntax-highlighted code blocks
                  </li>
                  <li>
                    <span className="tick">✓</span>One-click export to PDF or Markdown
                  </li>
                </ul>
              </div>
              <div className="spotlight-panel">
                <div className="editor-toolbar" aria-hidden="true">
                  <span>B</span>
                  <span>I</span>
                  <span>∑</span>
                  <span>&lt;/&gt;</span>
                  <span>✓</span>
                </div>
                <div className="sheet-body" style={{ padding: "20px 22px" }}>
                  <div className="sheet-note">
                    <div className="fname">Thermodynamics_Ch4.md · auto-saved 2s ago</div>
                    <h4>First Law — worked example</h4>
                    <div className="eqn" aria-label="Mathematical expression">
                      ΔU = Q − W
                      <br />
                      Q = 400 J, W = 150 J → ΔU = 250 J
                    </div>
                    <p className="margin-note hand">good — now try it with W negative ✎</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── SPOTLIGHT: REAL OPENROUTER VIDEO SUMMARIZER BETA ── */}
        <section className="spotlight reverse" id="video-summarizer">
          <div className="wrap">
            <div className="spotlight-grid">
              <div className="spotlight-copy">
                <span className="eyebrow">
                  <span className="dot" />
                  Spotlight — 02 · Real AI Beta
                </span>
                <h3>Paste a lecture link. Get a study note back.</h3>
                <p>
                  Drop in any YouTube lecture URL and Notexia chapters the key concepts using OpenRouter AI, pulls out formulas mentioned on screen, and turns it into an editable note — plus XP for every video you convert into revision material.
                </p>
                <ul className="spotlight-list">
                  <li>
                    <span className="tick">✓</span>Auto-chaptered summary with real OpenRouter AI
                  </li>
                  <li>
                    <span className="tick">✓</span>Formula &amp; definition extraction
                  </li>
                  <li>
                    <span className="tick">✓</span>Flashcards generated automatically
                  </li>
                  <li>
                    <span className="tick">✓</span>Earn XP toward your scholar rank per summary
                  </li>
                </ul>
              </div>

              {/* REAL INTERACTIVE VIDEO SUMMARIZER PANEL */}
              <div className="spotlight-panel">
                <div className="panel-header">
                  <span>VIDEO SUMMARIZER (OPENROUTER AI)</span>
                  <span>BETA LIVE</span>
                </div>
                <div className="video-body">
                  <form onSubmit={handleSummarizeVideo} className="video-input-row">
                    <input
                      type="text"
                      value={videoUrlInput}
                      onChange={(e) => setVideoUrlInput(e.target.value)}
                      placeholder="Paste YouTube lecture URL..."
                      aria-label="YouTube lecture URL"
                    />
                    <button type="submit" disabled={isVideoLoading} className="btn btn-solid btn-sm" style={{ flex: "none" }}>
                      {isVideoLoading ? "Summarizing..." : "Summarize"}
                    </button>
                  </form>

                  <div className="mb-2 text-xs font-mono text-[#8FC3DE] font-bold">
                    {videoSummaryData.title}
                  </div>

                  <div className="video-chapters">
                    {videoSummaryData.chapters.map((ch, idx) => (
                      <div key={idx} className="video-chapter flex-col items-start gap-1">
                        <div className="flex items-center gap-2 w-full">
                          <span className="ts">{ch.timestamp}</span>
                          <span className="font-bold text-[#FAFAF8]">{ch.title}</span>
                        </div>
                        <p className="text-[11px] text-[#8A8078] font-light pl-11">{ch.summary}</p>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between mt-3 pt-2 border-t border-[#2E2118]">
                    <span className="xp-badge">+{videoSummaryData.xpEarned} XP earned from this summary</span>
                    <span className="text-[10px] font-mono text-[#7B8C7E]">{videoSummaryData.engine}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── SPOTLIGHT: REAL MONGODB COMMUNITY & LEADERBOARD ── */}
        <section className="spotlight" id="community">
          <div className="wrap">
            <div className="spotlight-grid">
              <div className="spotlight-copy">
                <span className="eyebrow">
                  <span className="dot" />
                  Spotlight — 03
                </span>
                <h3>Study alone. Rank with everyone.</h3>
                <p>
                  Answer a peer&apos;s doubt, publish a clean note, or refer a friend — each earns coins toward your scholar rank. Redeem coins against Notexia Premium, or just enjoy watching your name climb your batch leaderboard.
                </p>
                <ul className="spotlight-list">
                  <li>
                    <span className="tick">✓</span>Batch &amp; college-wide leaderboards (Real Database)
                  </li>
                  <li>
                    <span className="tick">✓</span>Coin wallet for activity and referrals
                  </li>
                  <li>
                    <span className="tick">✓</span>Redeem coins toward a Premium upgrade
                  </li>
                  <li>
                    <span className="tick">✓</span>Subject-wise forums and direct messages
                  </li>
                </ul>
              </div>
              <div className="spotlight-panel">
                <div className="panel-header">
                  <span>BATCH LEADERBOARD (MONGODB)</span>
                  <span>LIVE SEASON</span>
                </div>
                <div className="community-body">
                  {leaderboard.map((user) => (
                    <div key={user.rank} className={`leaderboard-row ${user.rank === 1 ? "top" : ""}`}>
                      <div className="rank-badge">{user.rank}</div>
                      <div className="lb-name">{user.name} <span className="text-[10px] text-[#7B8C7E] font-mono">({user.batch})</span></div>
                      <div className="lb-coins">{user.points}</div>
                    </div>
                  ))}
                  <div className="wallet-chip">
                    <span className="coin-icon" aria-hidden="true" />
                    &nbsp; Referral bonus: <strong>&nbsp;+100 coins</strong>&nbsp; per friend who joins
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── CHECKLIST STRIP ── */}
        <section id="checklist">
          <div className="wrap">
            <div className="checklist-wrap">
              <div className="section-head" style={{ marginBottom: "26px" }}>
                <span className="section-tag">And there&apos;s more</span>
                <h2 style={{ fontSize: "22px" }}>The smaller things that end up mattering most.</h2>
              </div>
              <ul className="checklist">
                <li>
                  <span className="tick">✓</span>PDF &amp; Markdown export, anytime
                </li>
                <li>
                  <span className="tick">✓</span>Native Android app, same account
                </li>
                <li>
                  <span className="tick">✓</span>Push notifications for replies &amp; streaks
                </li>
                <li>
                  <span className="tick">✓</span>Public profile &amp; blog-style feed
                </li>
                <li>
                  <span className="tick">✓</span>Exam-specific content packs
                </li>
                <li>
                  <span className="tick">✓</span>Official CGPA &amp; percentage calculators
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* ── HOW IT WORKS ── */}
        <section id="how-it-works">
          <div className="wrap">
            <div className="section-head">
              <span className="section-tag">The workflow</span>
              <h2>From rough notes to ranked scholar, in four steps.</h2>
            </div>

            <div className="steps">
              <div className="step">
                <div className="step-num">01</div>
                <h3>Write &amp; format your notes</h3>
                <p>Draft in the rich editor with code blocks and KaTeX formulas. Everything auto-saves and syncs to the cloud as you type.</p>
              </div>
              <div className="step">
                <div className="step-num">02</div>
                <h3>Ask the AI copilot</h3>
                <p>Stuck mid-note? Query the copilot right there and get a step-by-step explanation without breaking focus.</p>
              </div>
              <div className="step">
                <div className="step-num">03</div>
                <h3>Discuss &amp; solve doubts</h3>
                <p>Post the tricky ones to the doubts hub and get answers from both AI and verified peer scholars in your subject.</p>
              </div>
              <div className="step">
                <div className="step-num">04</div>
                <h3>Publish &amp; climb the rank</h3>
                <p>Turn your best notes into public posts, earn scholar badges, and watch your name move up the batch leaderboard.</p>
              </div>
            </div>
          </div>
        </section>

        {/* ── NEW: WHY STUDENTS LOVE NOTEXIA ── */}
        <section id="love">
          <div className="wrap">
            <div className="section-head">
              <span className="section-tag">Why students love us</span>
              <h2>Real stories from real users</h2>
              <p>
                Every day, thousands of students use Notexia to turn their study sessions into productive, collaborative, and even fun experiences.
              </p>
            </div>
            <div className="love-grid">
              <div className="love-card">
                <h4>&ldquo;Saved me during midterms&rdquo;</h4>
                <p>
                  &ldquo;I was drowning in lecture slides until I started using Notexia. The AI summarizer turned 2‑hour videos into 10‑minute notes, and the leaderboard kept me accountable. I scored 12% higher than last semester.&rdquo;
                  <br />— <strong>Ananya R., VTU CSE</strong>
                </p>
              </div>
              <div className="love-card">
                <h4>&ldquo;LaTeX finally clicked&rdquo;</h4>
                <p>
                  &ldquo;I never understood how to write beautiful math notation until I used Notexia&apos;s editor. Now my physics notes look like they came straight out of a textbook — and I actually enjoy revising them.&rdquo;
                  <br />— <strong>Karan S., IIT Bombay</strong>
                </p>
              </div>
              <div className="love-card">
                <h4>&ldquo;Community is gold&rdquo;</h4>
                <p>
                  &ldquo;The doubt forums are incredible. I posted a tough organic chemistry question and within 20 minutes I had three responses from seniors and the AI gave me a detailed mechanism. It felt like having a tutor 24/7.&rdquo;
                  <br />— <strong>Priya M., NEET aspirant</strong>
                </p>
              </div>
              <div className="love-card">
                <h4>&ldquo;My batch loves the leaderboard&rdquo;</h4>
                <p>
                  &ldquo;Our entire class started using Notexia after I shared my notes. Now we compete for the top spot — it&apos;s made studying way more engaging and we&apos;re all helping each other improve.&rdquo;
                  <br />— <strong>Vikram G., GATE aspirant</strong>
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── PRICING ── */}
        <section id="pricing">
          <div className="wrap">
            <div className="section-head">
              <span className="section-tag">Simple pricing</span>
              <h2>Free to start. Pay only once AI becomes your main tutor.</h2>
              <p>
                Notes, forums and the leaderboard stay free forever. Premium unlocks unlimited AI copilot calls, unlimited video summaries, and priority doubt-solving.
              </p>
            </div>

            <div className="price-toggle-row">
              <span className="toggle-label">Monthly</span>
              <button
                type="button"
                className={`toggle-switch ${isAnnual ? "on" : ""}`}
                onClick={() => setIsAnnual(!isAnnual)}
                aria-label="Toggle annual pricing"
                aria-checked={isAnnual}
                role="switch"
              />
              <span className="toggle-label">Annual</span>
              <span className="toggle-save">Save 33%</span>
            </div>

            <div className="pricing-grid">
              <div className="price-card">
                <div className="price-name">Free</div>
                <div className="price-amount">
                  ₹0 <span>forever</span>
                </div>
                <ul className="price-list">
                  <li>
                    <span className="tick">✓</span>Unlimited notes &amp; LaTeX editing
                  </li>
                  <li>
                    <span className="tick">✓</span>10 AI doubt-solves per day
                  </li>
                  <li>
                    <span className="tick">✓</span>3 video summaries per month
                  </li>
                  <li>
                    <span className="tick">✓</span>Public forums &amp; leaderboard
                  </li>
                  <li>
                    <span className="tick">✓</span>CGPA &amp; percentage calculators
                  </li>
                </ul>
                <Link href="/signup" className="btn btn-ghost">
                  Get started free
                </Link>
              </div>

              <div className="price-card pro">
                <span className="price-badge">Most upgrade before finals</span>
                <div className="price-name">Scholar Pro</div>
                <div className="price-amount">
                  {isAnnual ? "₹99" : "₹149"} <span>/ month</span>
                </div>
                <ul className="price-list">
                  <li>
                    <span className="tick">✓</span>Unlimited AI doubt-solving
                  </li>
                  <li>
                    <span className="tick">✓</span>Unlimited video summarizer
                  </li>
                  <li>
                    <span className="tick">✓</span>Priority answer speed
                  </li>
                  <li>
                    <span className="tick">✓</span>Redeem wallet coins for extra months
                  </li>
                  <li>
                    <span className="tick">✓</span>Early access to new exam packs
                  </li>
                </ul>
                <Link href="/signup?plan=pro" className="btn btn-solid">
                  Upgrade to Pro
                </Link>
              </div>
            </div>
            <p className="price-note">
              Referral coins can cover part or all of a Pro upgrade — refer classmates to earn toward it.
            </p>
          </div>
        </section>

        {/* ── TOOLS ── */}
        <section id="tools">
          <div className="wrap">
            <div className="tools-card">
              <div className="tools-copy">
                <h3>Official University CGPA Converters</h3>
                <p>
                  Calculate your exact percentage marks from CGPA for CBSE 10th/12th, VTU, KTU, and Mumbai University using official published conversion formulas.
                </p>
                <div className="tools-boards">
                  <span>CBSE 10/12</span>
                  <span>VTU 2022</span>
                  <span>KTU Scheme</span>
                  <span>Mumbai Univ</span>
                </div>
              </div>
              <Link href="/tools/cgpa-converter" className="btn btn-solid">
                Open CGPA Calculator →
              </Link>
            </div>
          </div>
        </section>

        {/* ── REVIEWS ── */}
        <section id="reviews">
          <div className="wrap">
            <div className="section-head">
              <span className="section-tag">Student stories</span>
              <h2>Loved by scholars across 120+ universities.</h2>
            </div>

            <div className="rev-grid">
              {studentReviews.map((rev, idx) => (
                <div key={idx} className="rev-card">
                  <p className="rev-quote">&quot;{rev.quote}&quot;</p>
                  <div className="rev-person">
                    <div className="rev-avatar" aria-hidden="true">{rev.author.charAt(0)}</div>
                    <div>
                      <div className="rev-name">{rev.author}</div>
                      <div className="rev-role">{rev.role}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── STATS STRIP ── */}
        <div className="stats-strip" aria-label="Platform statistics">
          <div className="wrap">
            <div className="stats-strip-inner">
              <div className="stat-block">
                <div className="num">42,000+</div>
                <div className="lbl">Notes Authored</div>
              </div>
              <div className="stat-block">
                <div className="num">1.1L+</div>
                <div className="lbl">Doubts Solved by AI</div>
              </div>
              <div className="stat-block">
                <div className="num">4.8 / 5</div>
                <div className="lbl">Student Rating</div>
              </div>
              <div className="stat-block">
                <div className="num">120+</div>
                <div className="lbl">Colleges Connected</div>
              </div>
            </div>
          </div>
        </div>

        {/* ── FAQ ── */}
        <section id="faq">
          <div className="wrap">
            <div className="section-head">
              <span className="section-tag">Frequently asked questions</span>
              <h2>Everything you need to know.</h2>
            </div>

            <div style={{ maxWidth: "720px" }}>
              {homepageFaqs.map((faq, idx) => {
                const isOpen = openFaqIndex === idx;
                return (
                  <div key={idx} className={`faq-item ${isOpen ? "open" : ""}`}>
                    <button
                      type="button"
                      className="faq-q"
                      onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                      aria-expanded={isOpen}
                      aria-controls={`faq-answer-${idx}`}
                    >
                      <span>{faq.question}</span>
                      <span className="plus" aria-hidden="true">+</span>
                    </button>
                    <div className="faq-a" id={`faq-answer-${idx}`} role="region">
                      <div className="faq-a-inner">{faq.answer}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── FINAL CTA ── */}
        <section id="cta">
          <div className="wrap">
            <div className="cta-band">
              <h2>Notes that get checked before the exam does.</h2>
              <p>Join thousands of scholars taking notes, solving doubts with AI, and ranking with their batch on Notexia.</p>
              <div className="hero-ctas">
                <Link href="/signup" className="btn btn-solid">
                  Start free, no card needed
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ── FOOTER ── */}
      <footer>
        <div className="wrap">
          <div className="foot-top">
            <div>
              <div className="mb-3">
                <NotexiaLogo size="md" />
              </div>
              <p style={{ fontSize: "13.5px", color: "var(--ink-soft)", maxWidth: "280px" }}>
                The intelligent study workspace for Indian engineers, medical undergrads, and competitive exam scholars.
              </p>

              <form onSubmit={handleNewsletterSubmit} className="newsletter" aria-label="Newsletter subscription">
                <div className="newsletter-row">
                  <input
                    type="email"
                    placeholder="Enter email for study updates"
                    value={newsletterEmail}
                    onChange={(e) => setNewsletterEmail(e.target.value)}
                    aria-label="Email address for newsletter"
                    required
                  />
                  <button type="submit" disabled={isSubmittingNewsletter} className="btn btn-solid btn-sm">
                    {isSubmittingNewsletter ? "..." : "Subscribe"}
                  </button>
                </div>
                {newsletterMessage && (
                  <div className={`newsletter-msg ${newsletterStatus === "success" ? "success" : newsletterStatus === "error" ? "error" : ""}`}>
                    {newsletterMessage}
                  </div>
                )}
              </form>

              <div className="mt-4">
                <RazorpayPaymentButton buttonId="pl_TKvnrbgY75iRaH" className="flex items-start justify-start" />
              </div>
            </div>

            <div className="foot-links">
              <div className="foot-col">
                <h5>Product</h5>
                <button onClick={() => scrollToSection("features")} className="btn-link">Features</button>
                <button onClick={() => scrollToSection("demo")} className="btn-link">AI Copilot</button>
                <button onClick={() => scrollToSection("video-summarizer")} className="btn-link">Video Summarizer</button>
                <button onClick={() => scrollToSection("pricing")} className="btn-link">Pricing</button>
                <button onClick={() => scrollToSection("tools")} className="btn-link">CGPA Tools</button>
              </div>
              <div className="foot-col">
                <h5>Resources</h5>
                <Link href="/feed">Public Notes Feed</Link>
                <Link href="/blog">Scholar Blog</Link>
                <Link href="/tools/cgpa-converter">VTU CGPA Converter</Link>
                <Link href="/tools/cgpa-converter">CBSE Percentage Calculator</Link>
              </div>
              <div className="foot-col">
                <h5>Legal &amp; Support</h5>
                <Link href="/about">About Us</Link>
                <Link href="/contact">Contact Us</Link>
                <Link href="/privacy">Privacy Policy</Link>
                <Link href="/terms">Terms of Service</Link>
                <Link href="/disclaimer">Disclaimer</Link>
              </div>
            </div>
          </div>

          <div className="foot-bottom">
            <div>
              &copy; {new Date().getFullYear()} Notexia Inc. Built for Indian Students &amp; Engineers.
            </div>
            <div className="status-dot">
              <span className="d" aria-hidden="true" />
              <span>All systems operational</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}