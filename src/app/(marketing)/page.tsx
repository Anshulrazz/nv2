"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

import { NotexiaLogo } from "@/components/common/NotexiaLogo";
import { RazorpayPaymentButton } from "@/components/common/RazorpayPaymentButton";
import { GsapHeroGraphic } from "@/components/marketing/GsapHeroGraphic";
import { CoinEconomyWidget } from "@/components/marketing/CoinEconomyWidget";
import { GsapPinnedShowcase } from "@/components/marketing/GsapPinnedShowcase";
import { ContestCampaignPoster } from "@/components/marketing/ContestCampaignPoster";
import { buildFAQSchema } from "@/lib/seo/jsonld";
import { InstagramIcon, LinkedInIcon, TwitterXIcon } from "@/components/common/SocialIcons";

import {
  Sparkles,
  ArrowRight,
  ArrowUpRight,
  BrainCircuit,
  BookOpen,
  Coins,
  Trophy,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Play,
  FileText,
  Calculator,
  Laptop,
  Flame,
  ShieldCheck,
  Send,
  Menu,
  X,
  Star,
  Users,
  Award,
} from "lucide-react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, useGSAP);
}

const sampleDoubts = [
  {
    topic: "Physics · Quantum",
    prompt: "Derive Schrodinger's time-independent wave equation in 3 steps.",
    lines: [
      "1. Free Particle Wavefunction: Ψ(x,t) = A·exp[i(kx - ωt)]",
      "2. Energy Operator: ĤΨ = EΨ where Ĥ = -(ħ²/2m)∇² + V(x)",
      "3. Time-Independent Form: -(ħ²/2m)(d²Ψ/dx²) + V(x)Ψ = EΨ",
    ],
  },
  {
    topic: "Computer Science",
    prompt: "When should I use BFS vs DFS in GATE algorithm questions?",
    lines: [
      "• BFS (Queue / FIFO): Guarantees shortest path on unweighted graphs; Level-order tree traversal.",
      "• DFS (Stack / LIFO): Topological sorting, cycle detection, strongly connected components.",
      "• GATE Exam Tip: If asked minimum edge distance, strictly use BFS.",
    ],
  },
  {
    topic: "Mathematics",
    prompt: "Derive the quadratic formula from ax² + bx + c = 0 step-by-step.",
    lines: [
      "1. Divide by a: x² + (b/a)x + (c/a) = 0",
      "2. Complete square: [x + b/(2a)]² = (b² - 4ac)/(4a²)",
      "3. Square root & isolate x: x = [-b ± √(b² - 4ac)] / (2a)",
    ],
  },
  {
    topic: "Chemistry · NEET",
    prompt: "Explain Le Chatelier's Principle with the Haber Process.",
    lines: [
      "• Principle: Systems at dynamic equilibrium shift to counteract any external change.",
      "• Haber Reaction: N₂(g) + 3H₂(g) ⇌ 2NH₃(g) + 92.4 kJ",
      "• NEET Strategy: Increasing pressure favors right (fewer gas moles). Lower temp favors exothermic forward shift.",
    ],
  },
];

const homepageFaqs = [
  {
    question: "What is Notexia and who is it designed for?",
    answer:
      "Notexia is an AI-powered study platform built for Indian students, engineering undergraduates, researchers, and competitive exam aspirants (JEE, NEET, CBSE, GATE, UPSC). It unifies TipTap markdown notes, LaTeX formulas, instant AI doubt solving, verified courses, and a transparent coin economy in one workspace.",
  },
  {
    question: "How does the Coin Economy (1 INR = 10 Coins) work?",
    answer:
      "Notexia operates on a simple, transparent standard: ₹1 equals 10 Coins. Students can use coins to unlock premium courses, project files, and revision masterclasses. Content creators, teachers, and student authors receive 70% of the coin value with direct UPI or bank account payouts.",
  },
  {
    question: "How does the AI Study Copilot work?",
    answer:
      "Our AI copilot integrates Claude 3.5 Sonnet and OpenRouter models to answer complex STEM questions. It produces step-by-step derivations, clean copyable LaTeX formulas, code blueprints, and instant summaries for lengthy PDF textbooks or video lectures.",
  },
  {
    question: "Can I publish my research notes and semester projects publicly?",
    answer:
      "Yes! You can publish your verified notes, cheat sheets, and source code projects publicly. Every note receives a public canonical URL indexed on Google, allowing you to build an academic portfolio and earn creator coins.",
  },
  {
    question: "Is Notexia free for students?",
    answer:
      "Yes! Core features—including markdown note taking, LaTeX rendering, public community browsing, and formula calculators—are 100% free. Optional upgrades unlock higher AI query quotas and creator monetization tools.",
  },
  {
    question: "How do teachers and student creators withdraw earnings?",
    answer:
      "Creators can withdraw their verified earnings anytime via the Creator Studio wallet. Once your balance reaches the minimum withdrawal threshold, funds are transferred directly to your bank account or UPI ID with zero hidden fees.",
  },
];

const studentReviews = [
  {
    quote:
      "Notexia's LaTeX rendering and AI copilot helped me derive complex Electromagnetic Wave equations for GATE revision in seconds. Truly game-changing.",
    author: "Rohan Kulkarni",
    role: "GATE Physics Aspirant • IIT Bombay Batch",
    rating: 5,
  },
  {
    quote:
      "The TipTap editor and formula sheets saved me countless hours during semester exams. Easily the most polished study workspace for engineers.",
    author: "Sneha Nair",
    role: "Computer Science Undergrad • VTU",
    rating: 5,
  },
  {
    quote:
      "Publishing my semester revision projects earned me over 450 coins on the platform. The transparent 70% creator payout is incredible!",
    author: "Aarav Sharma",
    role: "JEE Advanced Scholar • Kota",
    rating: 5,
  },
];

interface LeaderboardItem {
  rank: number;
  name: string;
  batch: string;
  points: string;
  badge: string;
}

export default function MarketingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [isMounted, setIsMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeDoubtIndex, setActiveDoubtIndex] = useState(0);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const [showGiveaway, setShowGiveaway] = useState(false);

  // Newsletter state
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterMsg, setNewsletterMsg] = useState("");
  const [newsletterStatus, setNewsletterStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  // Leaderboard state
  const [leaderboard, setLeaderboard] = useState<LeaderboardItem[]>([
    { rank: 1, name: "Priya Sharma", batch: "IIT Bombay Physics", points: "1,420 coins", badge: "Gold Scholar" },
    { rank: 2, name: "Arjun Dev", batch: "VTU CS Semester 4", points: "1,015 coins", badge: "Silver Scholar" },
    { rank: 3, name: "Rohan Kulkarni", batch: "GATE Physics Scholar", points: "890 coins", badge: "Bronze Scholar" },
  ]);

  const pageRef = useRef<HTMLDivElement>(null);
  const heroH1Ref = useRef<HTMLHeadingElement>(null);
  const heroSubRef = useRef<HTMLParagraphElement>(null);
  const heroCtaRef = useRef<HTMLDivElement>(null);
  const heroVisualRef = useRef<HTMLDivElement>(null);
  const bentoRef = useRef<HTMLDivElement>(null);

  // Mount effect
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Redirect authenticated users directly to dashboard
  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      router.replace("/dashboard");
    }
  }, [status, session, router]);

  // Fetch real MongoDB Leaderboard
  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const res = await fetch("/api/leaderboard/public");
        const data = await res.json();
        if (data.success && Array.isArray(data.leaderboard) && data.leaderboard.length > 0) {
          setLeaderboard(data.leaderboard.slice(0, 5));
        }
      } catch (e) {
        console.warn("Using fallback leaderboard:", e);
      }
    };
    fetchLeaderboard();
  }, []);

  // GSAP Animations with @gsap/react useGSAP
  useGSAP(
    () => {
      if (!isMounted) return;

      // 1. Hero Kinetic Entrance Timeline
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

      tl.from(heroH1Ref.current, {
        y: 40,
        opacity: 0,
        duration: 1,
        delay: 0.1,
      })
        .from(
          heroSubRef.current,
          {
            y: 25,
            opacity: 0,
            duration: 0.8,
          },
          "-=0.6"
        )
        .from(
          heroCtaRef.current,
          {
            y: 20,
            opacity: 0,
            duration: 0.7,
          },
          "-=0.5"
        )
        .from(
          heroVisualRef.current,
          {
            scale: 0.95,
            opacity: 0,
            duration: 1,
            ease: "back.out(1.2)",
          },
          "-=0.5"
        );

      // 2. Bento Grid Stagger Entrance on Scroll
      if (bentoRef.current) {
        gsap.from(bentoRef.current.querySelectorAll(".bento-card"), {
          scrollTrigger: {
            trigger: bentoRef.current,
            start: "top 80%",
          },
          y: 45,
          opacity: 0,
          duration: 0.7,
          stagger: 0.12,
          ease: "power2.out",
        });
      }
    },
    { scope: pageRef, dependencies: [isMounted] }
  );

  // Newsletter submission
  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail.trim() || !newsletterEmail.includes("@")) {
      setNewsletterMsg("Please enter a valid email address.");
      setNewsletterStatus("error");
      return;
    }

    setNewsletterStatus("loading");
    setNewsletterMsg("");

    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: newsletterEmail.trim(), source: "gsap_landing" }),
      });
      const data = await res.json();

      if (res.ok) {
        setNewsletterMsg(data.message || "Welcome to the Notexia community! 🎉");
        setNewsletterStatus("success");
        setNewsletterEmail("");
      } else {
        setNewsletterMsg(data.error || "Subscription failed. Please try again.");
        setNewsletterStatus("error");
      }
    } catch {
      setNewsletterMsg("Server error. Please try again later.");
      setNewsletterStatus("error");
    }
  };

  if (!isMounted || status === "loading" || (status === "authenticated" && session?.user)) {
    return (
      <div className="min-h-screen bg-[#0A0806] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl border-2 border-[#F5B429] border-t-transparent animate-spin" />
          <span className="font-mono text-xs text-[#8A8078] tracking-widest uppercase">Loading Notexia...</span>
        </div>
      </div>
    );
  }

  return (
    <main ref={pageRef} className="overflow-x-hidden w-full max-w-full bg-[#0A0806] text-[#FAFAF8] antialiased selection:bg-[#F5B429]/30">
      {/* FAQ Schema for Google SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildFAQSchema(homepageFaqs)) }}
      />

      {/* ── 1. TOP ANNOUNCEMENT BANNER ── */}
      <div className="w-full bg-[#150F0B] border-b border-[#2E2118] py-2.5 px-4 text-center text-xs font-mono text-[#B8AFA6] flex items-center justify-center gap-2">
        <span className="w-2 h-2 rounded-full bg-[#22C55E] animate-pulse" />
        <span>
          <strong className="text-[#F5B429]">Live Coin Standard:</strong> 1 INR = 10 Coins • 70% Creator Revenue Share •
        </span>
        <Link href="/courses" className="text-[#FAFAF8] hover:text-[#F5B429] underline underline-offset-4 ml-1">
          Explore Courses & Projects →
        </Link>
      </div>

      {/* ── 2. FLOATING GLASS NAVBAR ── */}
      <header className="sticky top-0 z-50 w-full bg-[#0A0806]/85 backdrop-blur-xl border-b border-[#2E2118]/80 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center">
            <NotexiaLogo size="md" />
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-8 text-xs font-mono uppercase tracking-wider text-[#B8AFA6]">
            <a href="#features" className="hover:text-[#F5B429] transition-colors">Features</a>
            <a href="#ecosystem" className="hover:text-[#F5B429] transition-colors">Ecosystem</a>
            <a href="#economy" className="hover:text-[#F5B429] transition-colors">Coin Economy</a>
            <a href="#leaderboard" className="hover:text-[#F5B429] transition-colors">Leaderboard</a>
            <a href="#pricing" className="hover:text-[#F5B429] transition-colors">Pro Tier</a>
            <a href="#faq" className="hover:text-[#F5B429] transition-colors">FAQ</a>
          </nav>

          {/* Nav Actions */}
          <div className="hidden sm:flex items-center gap-4">
            <div className="hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#150F0B] border border-[#2E2118] text-[11px] font-mono text-[#8A8078]">
              <Coins className="w-3.5 h-3.5 text-[#F5B429]" />
              <span>₹1 = 10 Coins</span>
            </div>

            <Link
              href="/login"
              className="text-xs font-mono font-semibold uppercase tracking-wider text-[#B8AFA6] hover:text-[#FAFAF8] transition-colors px-3 py-2"
            >
              Sign In
            </Link>

            <Link
              href="/register"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#F5B429] hover:bg-[#F5941D] text-[#0A0806] font-mono font-bold text-xs uppercase tracking-wider transition-all duration-300 shadow-[0_0_20px_rgba(245,180,41,0.25)] hover:scale-[1.02]"
            >
              <span>Get Started</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Mobile Menu Hamburger */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl bg-[#150F0B] border border-[#2E2118] text-[#FAFAF8]"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-[#0A0806] border-b border-[#2E2118] px-6 py-6 space-y-4">
            <div className="flex flex-col gap-3 text-sm font-mono uppercase tracking-wider text-[#B8AFA6]">
              <a href="#features" onClick={() => setMobileMenuOpen(false)} className="py-2 hover:text-[#F5B429]">Features</a>
              <a href="#ecosystem" onClick={() => setMobileMenuOpen(false)} className="py-2 hover:text-[#F5B429]">Ecosystem</a>
              <a href="#economy" onClick={() => setMobileMenuOpen(false)} className="py-2 hover:text-[#F5B429]">Coin Economy</a>
              <a href="#leaderboard" onClick={() => setMobileMenuOpen(false)} className="py-2 hover:text-[#F5B429]">Leaderboard</a>
              <a href="#pricing" onClick={() => setMobileMenuOpen(false)} className="py-2 hover:text-[#F5B429]">Pro Tier</a>
              <a href="#faq" onClick={() => setMobileMenuOpen(false)} className="py-2 hover:text-[#F5B429]">FAQ</a>
            </div>

            <div className="pt-4 border-t border-[#2E2118] flex flex-col gap-3">
              <Link
                href="/login"
                className="w-full text-center py-2.5 rounded-xl border border-[#2E2118] text-xs font-mono font-bold uppercase text-[#FAFAF8]"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="w-full text-center py-2.5 rounded-xl bg-[#F5B429] text-[#0A0806] text-xs font-mono font-bold uppercase"
              >
                Get Started Free
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* ── 3. ATTENTION: CINEMATIC GSAP HERO SECTION ── */}
      <section className="relative pt-20 pb-28 md:pt-32 md:pb-40 overflow-hidden">
        {/* Radial ambient background wash */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-gradient-to-b from-[#F5B429]/12 via-[#F5941D]/4 to-transparent blur-[160px] pointer-events-none" />

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Central Wide Editorial Copy */}
          <div className="text-center space-y-6 max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#150F0B] border border-[#2E2118] text-[#F5B429] text-xs font-mono uppercase tracking-widest shadow-inner">
              <Sparkles className="w-3.5 h-3.5 text-[#F5B429]" />
              The Academic Operating System
            </div>

            {/* 2-line iron rule: max-w-5xl wide container allows smooth 2-line wrap */}
            <h1
              ref={heroH1Ref}
              className="text-4xl sm:text-6xl lg:text-7xl font-extrabold font-display text-[#FAFAF8] tracking-tight leading-[1.08]"
            >
              Study Smarter. <span className="text-[#F5B429]">Earn Coins.</span> Build the Future.
            </h1>

            <p
              ref={heroSubRef}
              className="text-lg sm:text-xl text-[#B8AFA6] max-w-2xl mx-auto leading-relaxed"
            >
              TipTap markdown study notes, LaTeX formula derivations, instant AI doubt solving, and a coin-powered course marketplace for Indian students and engineers.
            </p>

            {/* Dual High-Contrast CTAs */}
            <div
              ref={heroCtaRef}
              className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4"
            >
              <Link
                href="/register"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 rounded-2xl bg-[#F5B429] hover:bg-[#F5941D] text-[#0A0806] font-bold text-sm font-mono uppercase tracking-wider transition-all duration-300 shadow-[0_0_35px_rgba(245,180,41,0.3)] hover:scale-105"
              >
                <span>Start Studying Free</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <Link
                href="/courses"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-[#150F0B] hover:bg-[#241811] text-[#FAFAF8] border border-[#2E2118] hover:border-[#F5B429]/50 font-bold text-sm font-mono uppercase tracking-wider transition-all duration-300"
              >
                <span>Browse Courses & Projects</span>
                <ArrowUpRight className="w-4 h-4 text-[#F5B429]" />
              </Link>
            </div>

            {/* Key Metric Pills */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-8 text-left border-t border-[#2E2118]/60 mt-8">
              <div className="p-3 rounded-xl bg-[#150F0B]/60 border border-[#2E2118]/80">
                <span className="font-mono text-xl font-bold text-[#FAFAF8]">10,000+</span>
                <p className="text-xs text-[#8A8078] font-mono">Verified Notes</p>
              </div>
              <div className="p-3 rounded-xl bg-[#150F0B]/60 border border-[#2E2118]/80">
                <span className="font-mono text-xl font-bold text-[#F5B429]">₹1 = 10</span>
                <p className="text-xs text-[#8A8078] font-mono">Coins Valuation</p>
              </div>
              <div className="p-3 rounded-xl bg-[#150F0B]/60 border border-[#2E2118]/80">
                <span className="font-mono text-xl font-bold text-[#22C55E]">70% Split</span>
                <p className="text-xs text-[#8A8078] font-mono">Creator Royalties</p>
              </div>
              <div className="p-3 rounded-xl bg-[#150F0B]/60 border border-[#2E2118]/80">
                <span className="font-mono text-xl font-bold text-[#FAFAF8]">24/7 Live</span>
                <p className="text-xs text-[#8A8078] font-mono">AI Doubt Solvers</p>
              </div>
            </div>
          </div>

          {/* Hero Visual: Side-by-side Motion Graphics SVG & Live AI Doubt Terminal */}
          <div
            ref={heroVisualRef}
            className="mt-16 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center"
          >
            {/* Left: Animated GSAP Orbital SVG */}
            <div className="lg:col-span-5 flex justify-center">
              <GsapHeroGraphic />
            </div>

            {/* Right: Live Interactive AI Doubt Resolution Terminal */}
            <div className="lg:col-span-7 rounded-3xl bg-[#150F0B] border border-[#2E2118] p-6 sm:p-8 relative shadow-2xl overflow-hidden backdrop-blur-xl">
              <div className="flex items-center justify-between pb-4 border-b border-[#2E2118]">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-[#EF4444]" />
                  <span className="w-3 h-3 rounded-full bg-[#F5B429]" />
                  <span className="w-3 h-3 rounded-full bg-[#22C55E]" />
                  <span className="ml-2 font-mono text-xs text-[#8A8078]">AI_SOLVER_ENGINE // CLAUDE_SONNET</span>
                </div>
                <span className="text-[11px] font-mono text-[#22C55E] flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E] animate-ping" />
                  ONLINE
                </span>
              </div>

              {/* Topic Selector Chips */}
              <div className="flex flex-wrap gap-2 py-4">
                {sampleDoubts.map((item, idx) => (
                  <button
                    key={item.topic}
                    type="button"
                    onClick={() => setActiveDoubtIndex(idx)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all border ${
                      activeDoubtIndex === idx
                        ? "bg-[#F5B429] text-[#0A0806] font-bold border-[#F5B429]"
                        : "bg-[#0A0806] text-[#B8AFA6] border-[#2E2118] hover:border-[#F5B429]/40"
                    }`}
                  >
                    {item.topic}
                  </button>
                ))}
              </div>

              {/* Doubt Query Prompt */}
              <div className="p-4 rounded-xl bg-[#0A0806] border border-[#2E2118] mb-4">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#8A8078] block mb-1">
                  Input Academic Query:
                </span>
                <p className="text-sm font-semibold text-[#FAFAF8]">
                  &quot;{sampleDoubts[activeDoubtIndex].prompt}&quot;
                </p>
              </div>

              {/* AI Structured Response Output */}
              <div className="space-y-2.5 p-4 rounded-xl bg-[#0A0806]/80 border border-[#2E2118]/80 font-mono text-xs sm:text-sm text-[#FAFAF8]">
                <div className="text-[#F5B429] text-xs font-bold uppercase tracking-wider pb-1 flex items-center gap-1.5">
                  <BrainCircuit className="w-4 h-4" />
                  Verifiable Mathematical Solution:
                </div>
                {sampleDoubts[activeDoubtIndex].lines.map((line, lIdx) => (
                  <div key={lIdx} className="text-[#B8AFA6] leading-relaxed">
                    {line}
                  </div>
                ))}
              </div>

              <div className="mt-4 flex items-center justify-between text-xs text-[#8A8078]">
                <span>KaTeX formatting enabled</span>
                <Link href="/tools" className="text-[#F5B429] hover:underline font-mono">
                  Ask custom doubts in Studio →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 4. INTEREST: THE GAPLESS BENTO GRID (grid-flow-dense) ── */}
      <section id="features" className="py-24 md:py-36 bg-[#0A0806] border-t border-[#2E2118]/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#150F0B] border border-[#2E2118] text-[#F5B429] text-xs font-mono uppercase tracking-wider">
              <BookOpen className="w-3.5 h-3.5" />
              Unified Architecture
            </div>
            <h2 className="text-3xl sm:text-5xl font-extrabold font-display text-[#FAFAF8] tracking-tight">
              A mathematically complete workspace.
            </h2>
            <p className="text-[#B8AFA6] text-base sm:text-lg">
              Every tool works together seamlessly: note taking, AI derivations, transparent coin commerce, and competitive rankings.
            </p>
          </div>

          {/* Gapless Grid: mathematically verified col-spans with grid-flow-dense */}
          <div
            ref={bentoRef}
            id="economy"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 grid-flow-dense"
          >
            {/* Bento Card 1: Interactive Coin Economy Widget (Spans 2 columns) */}
            <div className="bento-card sm:col-span-2">
              <CoinEconomyWidget />
            </div>

            {/* Bento Card 2: TipTap & LaTeX Equation Studio (Spans 1 column) */}
            <div className="bento-card p-6 sm:p-8 rounded-3xl bg-[#150F0B] border border-[#2E2118] flex flex-col justify-between hover:border-[#F5B429]/30 transition-all duration-300 group shadow-xl">
              <div>
                <div className="w-10 h-10 rounded-xl bg-[#0A0806] border border-[#2E2118] flex items-center justify-center text-[#F5B429] mb-6 group-hover:scale-110 transition-transform">
                  <BookOpen className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-bold font-display text-[#FAFAF8] mb-2">
                  LaTeX & TipTap Studio
                </h3>
                <p className="text-sm text-[#B8AFA6] leading-relaxed mb-4">
                  Write notes with full inline ($) and block ($$) KaTeX math rendering, mermaid flowcharts, and syntax highlighted code snippets.
                </p>

                {/* Equation Card Mock */}
                <div className="p-3 rounded-xl bg-[#0A0806] border border-[#2E2118] font-mono text-xs text-[#F5B429] text-center my-4">
                  ∇ × B = μ₀J + μ₀ε₀(∂E/∂t)
                </div>
              </div>

              <Link
                href="/study-notes"
                className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-[#F5B429] font-bold hover:text-[#FCD34D] mt-4"
              >
                <span>Open Notes Studio</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Bento Card 3: Video & PDF Lecture Summarizer (Spans 1 column) */}
            <div className="bento-card p-6 sm:p-8 rounded-3xl bg-[#150F0B] border border-[#2E2118] flex flex-col justify-between hover:border-[#F5B429]/30 transition-all duration-300 group shadow-xl">
              <div>
                <div className="w-10 h-10 rounded-xl bg-[#0A0806] border border-[#2E2118] flex items-center justify-center text-[#F5B429] mb-6 group-hover:scale-110 transition-transform">
                  <Play className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-bold font-display text-[#FAFAF8] mb-2">
                  AI Video & PDF Summarizer
                </h3>
                <p className="text-sm text-[#B8AFA6] leading-relaxed mb-4">
                  Paste any YouTube lecture URL or PDF chapter to extract timestamped study guides, formula breakdowns, and revision flashcards.
                </p>

                <div className="p-3 rounded-xl bg-[#0A0806] border border-[#2E2118] space-y-1.5 font-mono text-[11px] text-[#B8AFA6]">
                  <div className="text-[#22C55E] font-bold">04:12 • QFT Derivation</div>
                  <div>11:30 • Solved Exam Numerical</div>
                  <div className="text-[#F5B429]">Earned +40 Scholar XP</div>
                </div>
              </div>

              <Link
                href="/tools"
                className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-[#F5B429] font-bold hover:text-[#FCD34D] mt-4"
              >
                <span>Explore AI Tools</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Bento Card 4: Academic Tool Suite (Spans 2 columns) */}
            <div className="bento-card sm:col-span-2 p-6 sm:p-8 rounded-3xl bg-[#150F0B] border border-[#2E2118] flex flex-col justify-between hover:border-[#F5B429]/30 transition-all duration-300 shadow-xl">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div>
                  <Calculator className="w-6 h-6 text-[#F5B429] mb-3" />
                  <h4 className="font-bold text-base text-[#FAFAF8] mb-1">CGPA & Percentage</h4>
                  <p className="text-xs text-[#B8AFA6]">VTU, Anna Univ, and AKTU grading conversions made instant.</p>
                </div>
                <div>
                  <FileText className="w-6 h-6 text-[#F5B429] mb-3" />
                  <h4 className="font-bold text-base text-[#FAFAF8] mb-1">Formula Sheets</h4>
                  <p className="text-xs text-[#B8AFA6]">Printable cheat sheets for JEE Physics, Chemistry, and GATE CS.</p>
                </div>
                <div>
                  <ShieldCheck className="w-6 h-6 text-[#F5B429] mb-3" />
                  <h4 className="font-bold text-base text-[#FAFAF8] mb-1">Verified Peer Notes</h4>
                  <p className="text-xs text-[#B8AFA6]">Ranked and peer-reviewed lecture notes from university toppers.</p>
                </div>
              </div>

              <div className="pt-6 mt-6 border-t border-[#2E2118] flex flex-col sm:flex-row items-center justify-between gap-4">
                <span className="text-xs text-[#8A8078] font-mono">Available without account creation</span>
                <Link
                  href="/tools"
                  className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-[#F5B429] font-bold hover:text-[#FCD34D]"
                >
                  <span>Launch Free Academic Tools</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 5. DESIRE: GSAP SCROLLTRIGGER PINNED STORYBOARD ── */}
      <section id="ecosystem">
        <GsapPinnedShowcase />
      </section>

      {/* ── 6. CAMPUS CONTEST CAMPAIGN HIGHLIGHT ── */}
      <section className="py-16 bg-[#150F0B]/40 border-b border-[#2E2118]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl bg-[#150F0B] border border-[#2E2118] p-6 sm:p-10 flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl relative overflow-hidden">
            <div className="space-y-3 max-w-xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F5B429]/10 border border-[#F5B429]/25 text-[#F5B429] text-xs font-mono uppercase tracking-wider">
                <Trophy className="w-3.5 h-3.5" />
                Semester Scholar Rewards
              </div>
              <h3 className="text-2xl sm:text-3xl font-bold font-display text-[#FAFAF8]">
                Publish Notes & Win Flagship Apple Devices
              </h3>
              <p className="text-sm text-[#B8AFA6] leading-relaxed">
                Contribute verified notes, publish project repositories, and invite peers to earn activity points toward our national semester giveaways.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4 shrink-0">
              <button
                type="button"
                onClick={() => setShowGiveaway(!showGiveaway)}
                className="px-6 py-3 rounded-xl bg-[#0A0806] border border-[#2E2118] hover:border-[#F5B429] text-[#FAFAF8] text-xs font-mono uppercase tracking-wider font-semibold transition-all"
              >
                {showGiveaway ? "Hide Campaign Details" : "View Campaign Rules"}
              </button>
              <Link
                href="/register"
                className="px-6 py-3 rounded-xl bg-[#F5B429] hover:bg-[#F5941D] text-[#0A0806] text-xs font-mono uppercase tracking-wider font-bold transition-all shadow-[0_0_20px_rgba(245,180,41,0.25)]"
              >
                Enter Contest
              </Link>
            </div>
          </div>

          {showGiveaway && (
            <div className="mt-8 transition-all">
              <ContestCampaignPoster />
            </div>
          )}
        </div>
      </section>

      {/* ── 7. SOCIAL PROOF: LIVE MONGODB LEADERBOARD ── */}
      <section id="leaderboard" className="py-24 md:py-36 bg-[#0A0806]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-12">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#150F0B] border border-[#2E2118] text-[#F5B429] text-xs font-mono uppercase tracking-wider">
                <Flame className="w-3.5 h-3.5" />
                Live Network Activity
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold font-display text-[#FAFAF8]">
                National Scholar Leaderboard
              </h2>
              <p className="text-sm text-[#B8AFA6] max-w-xl">
                Real-time contributor ranks based on peer-verified study notes, answered community doubts, and unlocked courses.
              </p>
            </div>

            <Link
              href="/feed"
              className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-[#F5B429] font-bold hover:text-[#FCD34D]"
            >
              <span>View Full Community Feed</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Leaderboard Table */}
          <div className="rounded-3xl bg-[#150F0B] border border-[#2E2118] overflow-hidden shadow-2xl">
            <div className="grid grid-cols-12 px-6 py-3.5 bg-[#0A0806] border-b border-[#2E2118] text-xs font-mono uppercase text-[#8A8078] tracking-wider">
              <span className="col-span-2 sm:col-span-1">Rank</span>
              <span className="col-span-6 sm:col-span-6">Scholar</span>
              <span className="hidden sm:block sm:col-span-3">Batch / University</span>
              <span className="col-span-4 sm:col-span-2 text-right">Activity Coins</span>
            </div>

            <div className="divide-y divide-[#2E2118]">
              {leaderboard.map((item) => (
                <div
                  key={item.rank}
                  className="grid grid-cols-12 items-center px-6 py-4 hover:bg-[#1C140F] transition-colors"
                >
                  <div className="col-span-2 sm:col-span-1 font-mono font-bold text-sm">
                    {item.rank === 1 ? (
                      <span className="text-[#F5B429]">#1 🥇</span>
                    ) : item.rank === 2 ? (
                      <span className="text-[#FAFAF8]">#2 🥈</span>
                    ) : item.rank === 3 ? (
                      <span className="text-[#D9720E]">#3 🥉</span>
                    ) : (
                      <span className="text-[#8A8078]">#{item.rank}</span>
                    )}
                  </div>

                  <div className="col-span-6 sm:col-span-6 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#241811] border border-[#2E2118] flex items-center justify-center font-bold text-xs text-[#FAFAF8]">
                      {item.name.charAt(0)}
                    </div>
                    <div>
                      <span className="font-semibold text-sm text-[#FAFAF8] block">{item.name}</span>
                      <span className="text-[11px] font-mono text-[#F5B429]">{item.badge}</span>
                    </div>
                  </div>

                  <div className="hidden sm:block sm:col-span-3 text-xs text-[#8A8078] font-mono">
                    {item.batch}
                  </div>

                  <div className="col-span-4 sm:col-span-2 text-right font-mono font-bold text-sm text-[#FAFAF8]">
                    {item.points}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── 8. STUDENT REVIEWS / WALL OF LOVE ── */}
      <section className="py-24 bg-[#150F0B]/50 border-y border-[#2E2118]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <h2 className="text-3xl sm:text-4xl font-extrabold font-display text-[#FAFAF8]">
              Trusted by 10,000+ ambitious students.
            </h2>
            <p className="text-sm text-[#B8AFA6]">
              From Kota JEE aspirants to IIT Bombay and VTU engineering toppers.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {studentReviews.map((rev, rIdx) => (
              <div
                key={rIdx}
                className="p-6 sm:p-8 rounded-3xl bg-[#0A0806] border border-[#2E2118] flex flex-col justify-between hover:border-[#F5B429]/40 transition-all duration-300 shadow-lg"
              >
                <div>
                  <div className="flex items-center gap-1 text-[#F5B429] mb-4">
                    {[...Array(rev.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-[#F5B429]" />
                    ))}
                  </div>
                  <p className="text-sm text-[#B8AFA6] leading-relaxed italic mb-6">
                    &quot;{rev.quote}&quot;
                  </p>
                </div>

                <div className="pt-4 border-t border-[#2E2118]">
                  <span className="font-bold text-sm text-[#FAFAF8] block">{rev.author}</span>
                  <span className="text-xs text-[#8A8078] font-mono">{rev.role}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 9. TRANSPARENT PRICING & PRO UPGRADE ── */}
      <section id="pricing" className="py-24 md:py-36 bg-[#0A0806]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#150F0B] border border-[#2E2118] text-[#F5B429] text-xs font-mono uppercase tracking-wider">
              <Award className="w-3.5 h-3.5" />
              Simple Pricing
            </div>
            <h2 className="text-3xl sm:text-5xl font-extrabold font-display text-[#FAFAF8] tracking-tight">
              Invest in your academic career.
            </h2>
            <p className="text-sm sm:text-base text-[#B8AFA6]">
              Start completely free. Upgrade when you need unlimited AI derivations, higher coin limits, and creator tools.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
            {/* Tier 1: Free Student */}
            <div className="rounded-3xl bg-[#150F0B] border border-[#2E2118] p-8 flex flex-col justify-between">
              <div className="space-y-6">
                <div>
                  <span className="text-xs font-mono uppercase tracking-wider text-[#8A8078] block mb-1">
                    Free Forever
                  </span>
                  <h3 className="text-2xl font-bold font-display text-[#FAFAF8]">Student Basic</h3>
                </div>

                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-black font-display text-[#FAFAF8]">₹0</span>
                  <span className="text-xs font-mono text-[#8A8078]">/ forever</span>
                </div>

                <ul className="space-y-3 text-sm text-[#B8AFA6] border-y border-[#2E2118] py-6">
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#F5B429]" />
                    <span>Unlimited TipTap markdown notes & PDF export</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#F5B429]" />
                    <span>KaTeX LaTeX inline and block math support</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#F5B429]" />
                    <span>10 AI Doubt Solver queries daily</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#F5B429]" />
                    <span>Public note publishing with canonical URL</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#F5B429]" />
                    <span>Access to live university leaderboard</span>
                  </li>
                </ul>
              </div>

              <Link
                href="/register"
                className="mt-8 w-full py-3.5 rounded-xl bg-[#0A0806] border border-[#2E2118] hover:border-[#F5B429] text-[#FAFAF8] text-center font-mono text-xs uppercase tracking-wider font-bold transition-all"
              >
                Sign Up Free
              </Link>
            </div>

            {/* Tier 2: Scholar Pro */}
            <div className="rounded-3xl bg-[#150F0B] border-2 border-[#F5B429] p-8 flex flex-col justify-between relative shadow-[0_0_40px_-10px_rgba(245,180,41,0.2)]">
              <div className="absolute -top-3.5 right-8 px-3 py-1 rounded-full bg-[#F5B429] text-[#0A0806] font-mono font-bold text-[10px] uppercase tracking-wider">
                Most Popular
              </div>

              <div className="space-y-6">
                <div>
                  <span className="text-xs font-mono uppercase tracking-wider text-[#F5B429] block mb-1">
                    Premium Scholar
                  </span>
                  <h3 className="text-2xl font-bold font-display text-[#FAFAF8]">Scholar Pro</h3>
                </div>

                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-black font-display text-[#FAFAF8]">₹299</span>
                  <span className="text-xs font-mono text-[#8A8078]">/ one-time or semester pass</span>
                </div>

                <ul className="space-y-3 text-sm text-[#FAFAF8] border-y border-[#2E2118] py-6">
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#F5B429]" />
                    <span>Unlimited Claude 3.5 Sonnet AI derivations</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#F5B429]" />
                    <span>Full creator monetization & 70% direct payouts</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#F5B429]" />
                    <span>High-capacity project file uploads (zip, code, repos)</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#F5B429]" />
                    <span>Verified Gold Scholar profile badge</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#F5B429]" />
                    <span>Coupon code discounts supported at checkout</span>
                  </li>
                </ul>
              </div>

              <div className="mt-8 space-y-3">
                <RazorpayPaymentButton className="w-full flex items-center justify-center" />
                <p className="text-center text-[11px] font-mono text-[#8A8078]">
                  Secured by Razorpay • Instant profile activation
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 10. GSAP INTERACTIVE FAQ ACCORDION ── */}
      <section id="faq" className="py-24 bg-[#0A0806] border-t border-[#2E2118]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 space-y-3">
            <h2 className="text-3xl sm:text-4xl font-extrabold font-display text-[#FAFAF8]">
              Frequently Asked Questions
            </h2>
            <p className="text-sm text-[#B8AFA6]">
              Everything you need to know about Notexia, the coin economy, and AI solvers.
            </p>
          </div>

          <div className="space-y-4">
            {homepageFaqs.map((faq, index) => {
              const isOpen = openFaqIndex === index;
              return (
                <div
                  key={index}
                  className="rounded-2xl bg-[#150F0B] border border-[#2E2118] overflow-hidden transition-all duration-300"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                    className="w-full px-6 py-5 flex items-center justify-between text-left gap-4 hover:text-[#F5B429] transition-colors"
                  >
                    <span className="font-semibold text-base text-[#FAFAF8]">{faq.question}</span>
                    {isOpen ? (
                      <ChevronUp className="w-5 h-5 text-[#F5B429] shrink-0" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-[#8A8078] shrink-0" />
                    )}
                  </button>

                  {isOpen && (
                    <div className="px-6 pb-6 text-sm text-[#B8AFA6] leading-relaxed border-t border-[#2E2118]/60 pt-4">
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── 11. HIGH-CONTRAST CONVERSION CTA BANNER ── */}
      <section className="py-28 bg-[#0A0806] relative overflow-hidden">
        <div className="absolute inset-0 bg-radial from-[#F5B429]/15 via-transparent to-transparent blur-3xl pointer-events-none" />

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10 space-y-8">
          <h2 className="text-4xl sm:text-6xl font-extrabold font-display text-[#FAFAF8] tracking-tight">
            Ready to master your syllabus?
          </h2>

          <p className="text-lg text-[#B8AFA6] max-w-xl mx-auto">
            Join thousands of engineering and exam aspirants accelerating their preparation on Notexia today.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/register"
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-[#F5B429] hover:bg-[#F5941D] text-[#0A0806] font-bold text-sm font-mono uppercase tracking-wider transition-all duration-300 shadow-[0_0_35px_rgba(245,180,41,0.35)] hover:scale-105"
            >
              Get Started Free Now
            </Link>
            <Link
              href="/courses"
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-[#150F0B] hover:bg-[#241811] text-[#FAFAF8] border border-[#2E2118] font-bold text-sm font-mono uppercase tracking-wider transition-all duration-300"
            >
              Browse Courses
            </Link>
          </div>
        </div>
      </section>

      {/* ── 12. INTEGRATED FOOTER & DATABASE NEWSLETTER ── */}
      <footer className="bg-[#0A0806] border-t border-[#2E2118] pt-16 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-12 pb-12 border-b border-[#2E2118]">
            {/* Brand column */}
            <div className="md:col-span-4 space-y-4">
              <NotexiaLogo size="md" />
              <p className="text-xs text-[#8A8078] leading-relaxed max-w-sm font-sans">
                Notexia is India&apos;s intelligent study operating system. TipTap markdown notes, instant AI doubt solving, formula banks, and creator monetization for engineering scholars.
              </p>

              <div className="flex items-center gap-4 text-[#8A8078] pt-2">
                <a href="https://instagram.com/notexia.in" target="_blank" rel="noreferrer" className="hover:text-[#F5B429] transition-colors" aria-label="Instagram">
                  <InstagramIcon className="w-4 h-4" />
                </a>
                <a href="https://linkedin.com/company/notexia" target="_blank" rel="noreferrer" className="hover:text-[#F5B429] transition-colors" aria-label="LinkedIn">
                  <LinkedInIcon className="w-4 h-4" />
                </a>
                <a href="https://twitter.com/notexia" target="_blank" rel="noreferrer" className="hover:text-[#F5B429] transition-colors" aria-label="Twitter">
                  <TwitterXIcon className="w-4 h-4" />
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div className="md:col-span-2 space-y-3">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#FAFAF8]">Platform</span>
              <ul className="space-y-2 text-xs text-[#8A8078] font-mono">
                <li><Link href="/courses" className="hover:text-[#F5B429]">Courses</Link></li>
                <li><Link href="/tools" className="hover:text-[#F5B429]">AI Study Tools</Link></li>
                <li><Link href="/study-notes" className="hover:text-[#F5B429]">Study Notes</Link></li>
                <li><Link href="/feed" className="hover:text-[#F5B429]">Leaderboard</Link></li>
                <li><Link href="/blog" className="hover:text-[#F5B429]">Articles & Blog</Link></li>
              </ul>
            </div>

            <div className="md:col-span-2 space-y-3">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#FAFAF8]">Legal & Trust</span>
              <ul className="space-y-2 text-xs text-[#8A8078] font-mono">
                <li><Link href="/terms" className="hover:text-[#F5B429]">Terms of Service</Link></li>
                <li><Link href="/privacy" className="hover:text-[#F5B429]">Privacy Policy</Link></li>
                <li><Link href="/refund-policy" className="hover:text-[#F5B429]">Refund Policy</Link></li>
                <li><Link href="/community-guidelines" className="hover:text-[#F5B429]">Community Guidelines</Link></li>
                <li><Link href="/contact" className="hover:text-[#F5B429]">Contact Support</Link></li>
              </ul>
            </div>

            {/* Database Newsletter Subscription */}
            <div className="md:col-span-4 space-y-3">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#FAFAF8]">Exam Dispatch</span>
              <p className="text-xs text-[#8A8078] leading-relaxed">
                Receive weekly formula cheat sheets, GATE exam updates, and peer notes directly to your inbox.
              </p>

              <form onSubmit={handleNewsletterSubmit} className="space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="email"
                    placeholder="student@college.edu"
                    value={newsletterEmail}
                    onChange={(e) => setNewsletterEmail(e.target.value)}
                    className="flex-1 bg-[#150F0B] border border-[#2E2118] rounded-xl px-3.5 py-2.5 text-xs text-[#FAFAF8] placeholder-[#8A8078] focus:outline-none focus:border-[#F5B429]"
                  />
                  <button
                    type="submit"
                    disabled={newsletterStatus === "loading"}
                    className="px-4 py-2.5 rounded-xl bg-[#F5B429] text-[#0A0806] text-xs font-mono font-bold hover:bg-[#F5941D] transition-colors shrink-0 disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>

                {newsletterMsg && (
                  <p
                    className={`text-[11px] font-mono ${
                      newsletterStatus === "success" ? "text-[#22C55E]" : "text-[#EF4444]"
                    }`}
                  >
                    {newsletterMsg}
                  </p>
                )}
              </form>
            </div>
          </div>

          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs font-mono text-[#8A8078] gap-4">
            <p>© {new Date().getFullYear()} Notexia Inc. All rights reserved.</p>
            <p className="text-[11px]">1 INR = 10 Coins • Powered by GSAP Motion Engine</p>
          </div>
        </div>
      </footer>
    </main>
  );
}