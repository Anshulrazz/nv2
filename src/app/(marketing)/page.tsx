/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  ArrowUpRight,
  Sparkles,
  MessageSquare,
  Bot,
  FileText,
  Trophy,
  Plus,
  BookOpen,
  Star,
  ShieldCheck,
  CreditCard,
  GraduationCap,
  Check,
} from "lucide-react";
import { Hero3DShowcase } from "@/components/marketing/Hero3DShowcase";
import { motion, AnimatePresence } from "framer-motion";

/* ────────────────────────────────────────────────────────────────
   Reveal-on-scroll and CountUp primitives with smooth easing
   ──────────────────────────────────────────────────────────────── */

function Reveal({
  children,
  className = "",
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible(true);
            obs.disconnect();
          }
        });
      },
      { threshold: 0.15 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
      } ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

function CountUp({
  value,
  decimals = 0,
  prefix = "",
  suffix = "",
  duration = 1300,
}: {
  value: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const [display, setDisplay] = useState(0);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !started.current) {
            started.current = true;
            const start = performance.now();
            const step = (now: number) => {
              const progress = Math.min((now - start) / duration, 1);
              const eased = 1 - Math.pow(1 - progress, 3);
              setDisplay(eased * value);
              if (progress < 1) requestAnimationFrame(step);
              else setDisplay(value);
            };
            requestAnimationFrame(step);
            obs.disconnect();
          }
        });
      },
      { threshold: 0.4 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [value, duration]);

  return (
    <span ref={ref}>
      {prefix}
      {display.toFixed(decimals)}
      {suffix}
    </span>
  );
}

export default function LandingPage() {
  const { data: session } = useSession();
  const isLoggedIn = !!session?.user;
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [isAnnual, setIsAnnual] = useState(true);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const reviews = [
    {
      name: "Aarav Sharma",
      role: "CS Senior",
      college: "IIT Bombay",
      review: "The AI assistant saved me during mid-sem revision. Generating flashcards directly from lecture notes in 1 click is a game changer for exam prep.",
      rating: 5,
    },
    {
      name: "Priya Sundaram",
      role: "ECE Student",
      college: "NIT Trichy",
      review: "I used to struggle with unorganized PDFs. Notexia's folder hierarchy and TipTap editor keep all my semester subjects structured in one clean vault.",
      rating: 5,
    },
    {
      name: "Rohan Verma",
      role: "Full-Stack Dev",
      college: "SRM Chennai",
      review: "The real-time collaborative notes and instant doubt solving helped our study group clear GATE prep in record time. Sub-10ms search is super fast.",
      rating: 5,
    },
    {
      name: "Ananya Patel",
      role: "IT Major",
      college: "BITS Pilani",
      review: "The Indian pricing at ₹199/month is extremely student-friendly. The peer doubt forum alone is worth 10x the subscription price.",
      rating: 5,
    },
    {
      name: "Vikram Singh",
      role: "Data Science",
      college: "DTU Delhi",
      review: "Local-first markdown export and WebAssembly vector search make finding old code snippets and class notes sub-second fast.",
      rating: 5,
    },
    {
      name: "Neha Kulkarni",
      role: "AI & ML",
      college: "VTU Bengaluru",
      review: "The leaderboard streaks keep me accountable every day. I haven't missed a single study session in 45 consecutive days!",
      rating: 5,
    },
  ];

  return (
    <div className="min-h-[100dvh] bg-[#16261D] text-[#F3F0E4] font-sans selection:bg-[#F0C93B]/30 selection:text-[#F0C93B] overflow-x-hidden antialiased flex flex-col relative">
      {/* Background Ambient Mesh Glow Orbs */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[600px] bg-[#8FC3DE]/10 blur-[140px] animate-float-glow" />
        <div className="absolute top-[900px] -right-40 w-[700px] h-[500px] bg-[#C9A9E0]/10 blur-[160px] animate-float-glow-reverse" />
        <div className="absolute top-[1800px] -left-40 w-[600px] h-[500px] bg-[#F0C93B]/10 blur-[160px] animate-float-glow" />
      </div>

      {/* Floating Island Glass Navbar */}
      <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-4xl px-4 pointer-events-none">
        <header className="pointer-events-auto rounded-full bg-[#1A2D23]/90 border border-[#F3F0E4]/15 backdrop-blur-2xl px-6 py-2.5 flex items-center justify-between shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
          <Link href="/" className="flex items-center gap-3 group">
            <img src="/logo.png" className="h-6 w-auto object-contain" alt="Notexia Logo" />
            <span className="font-bold tracking-tight text-sm text-[#F3F0E4] font-heading">
              Notexia <span className="text-[#F0C93B] font-mono text-[10px] px-2 py-0.5 rounded-full bg-[#F0C93B]/15 border border-[#F0C93B]/30 ml-1">v2.4</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-7 text-xs font-medium text-[#9FAEA1] tracking-wide">
            <a href="#features" className="hover:text-[#F3F0E4] transition-colors duration-200">Features</a>
            <a href="#reviews" className="hover:text-[#F3F0E4] transition-colors duration-200">Reviews</a>
            <a href="#pricing" className="hover:text-[#F3F0E4] transition-colors duration-200">Pricing (INR)</a>
            <a href="#faq" className="hover:text-[#F3F0E4] transition-colors duration-200">FAQ</a>
          </nav>

          <div className="flex items-center gap-3">
            {isLoggedIn ? (
              <Link
                href="/dashboard"
                className="group rounded-xl bg-[#F0C93B] hover:bg-[#F0C93B]/90 text-[#2A2118] font-bold text-xs pl-4 pr-1.5 py-1.5 inline-flex items-center gap-2.5 transition-all duration-300 active:scale-[0.97] shadow-[2px_2px_0_0_#F28B6E] font-heading"
              >
                <span>Dashboard</span>
                <div className="size-6 rounded-full bg-[#2A2118] flex items-center justify-center text-[#F0C93B]">
                  <ArrowUpRight className="size-3.5 text-[#F0C93B]" />
                </div>
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-xs font-medium text-[#9FAEA1] hover:text-[#F3F0E4] transition-colors px-2 py-1"
                >
                  Log in
                </Link>
                <Link
                  href="/signup"
                  className="group rounded-xl bg-[#F0C93B] hover:bg-[#F0C93B]/90 text-[#2A2118] font-bold text-xs pl-4 pr-1.5 py-1.5 inline-flex items-center gap-2.5 transition-all duration-300 active:scale-[0.97] shadow-[2px_2px_0_0_#F28B6E] font-heading"
                >
                  <span>Get Started</span>
                  <div className="size-6 rounded-full bg-[#2A2118]/10 flex items-center justify-center group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-200">
                    <ArrowUpRight className="size-3.5 text-[#2A2118]" />
                  </div>
                </Link>
              </>
            )}
          </div>
        </header>
      </div>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative z-10 pt-28">
        {/* HERO SECTION */}
        <section className="max-w-[1400px] mx-auto px-6 pt-16 pb-24 text-center space-y-12">
          <Reveal>
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#F0C93B]/15 border border-[#F0C93B]/30 text-[#F0C93B] font-mono text-[10px] uppercase tracking-[0.25em] mx-auto">
              <span className="size-1.5 rounded-full bg-[#F0C93B] animate-pulse" />
              <span>MODERN LEARNING PLATFORM FOR INDIAN STUDENTS &amp; ENGINEERS</span>
            </div>
          </Reveal>

          <Reveal delay={80}>
            <h1 className="text-5xl sm:text-7xl lg:text-8xl font-black tracking-[-0.03em] leading-[0.94] text-[#F3F0E4] max-w-5xl mx-auto font-heading">
              Learn Smarter. <br />
              <span className="text-[#F0C93B]">
                Grow Faster.
              </span>
            </h1>
          </Reveal>

          <Reveal delay={160}>
            <p className="text-base sm:text-lg text-[#9FAEA1] max-w-[54ch] mx-auto leading-relaxed font-light">
              One place to share notes, solve doubts, and collaborate with peers. Designed for fast workflows, clean content, and measurable academic progress.
            </p>
          </Reveal>

          <Reveal delay={240}>
            <div className="flex flex-wrap gap-4 justify-center items-center">
              {isLoggedIn ? (
                <Link
                  href="/dashboard"
                  className="group rounded-xl bg-[#F0C93B] hover:bg-[#F0C93B]/90 text-[#2A2118] font-bold text-sm pl-6 pr-2 py-3.5 inline-flex items-center gap-3 transition-all duration-300 active:scale-[0.97] shadow-[4px_4px_0_0_#F28B6E] font-heading"
                >
                  <span>Open dashboard</span>
                  <div className="size-8 rounded-full bg-[#2A2118] flex items-center justify-center text-[#F0C93B] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-200">
                    <ArrowUpRight className="size-4 text-[#F0C93B]" />
                  </div>
                </Link>
              ) : (
                <>
                  <Link
                    href="/signup"
                    className="group rounded-xl bg-[#F0C93B] hover:bg-[#F0C93B]/90 text-[#2A2118] font-bold text-sm pl-6 pr-2 py-3.5 inline-flex items-center gap-3 transition-all duration-300 active:scale-[0.97] shadow-[4px_4px_0_0_#F28B6E] font-heading"
                  >
                    <span>Get Started Free</span>
                    <div className="size-8 rounded-full bg-[#2A2118] flex items-center justify-center text-[#F0C93B] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-200">
                      <ArrowUpRight className="size-4 text-[#F0C93B]" />
                    </div>
                  </Link>
                  <Link
                    href="/login"
                    className="rounded-xl bg-[#1A2D23] hover:bg-[#1F362A] border border-[#F3F0E4]/15 text-[#F3F0E4] font-semibold text-xs px-6 py-3.5 transition-all duration-200 active:scale-[0.97] backdrop-blur-xl"
                  >
                    Log in
                  </Link>
                </>
              )}
            </div>
          </Reveal>

          {/* Interactive 3D Model Tilt Showcase */}
          <Reveal delay={280}>
            <Hero3DShowcase />
          </Reveal>

          {/* Doppelrand Quick Metrics */}
          <div className="pt-8 max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { value: 248, label: "New Notes", accent: "text-[#F0C93B]" },
              { value: 931, label: "Doubts Answered", accent: "text-[#8FC3DE]" },
              { value: 118, label: "Forum Discussions", accent: "text-[#C9A9E0]" },
            ].map(({ value, label, accent }, i) => (
              <Reveal key={label} delay={i * 90}>
                <div className="rounded-[2rem] bg-[#1A2D23]/80 border border-[#F3F0E4]/15 p-2 shadow-[0_10px_30px_rgba(0,0,0,0.25)]">
                  <div className="rounded-[calc(2rem-0.5rem)] bg-[#121F18] border border-[#F3F0E4]/10 p-6 text-center space-y-1">
                    <div className={`font-mono text-3xl sm:text-4xl font-bold ${accent}`}>
                      <CountUp value={value} prefix="+" />
                    </div>
                    <div className="text-[10px] font-mono text-[#9FAEA1] uppercase tracking-widest">
                      {label}
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* FEATURES MATRIX */}
        <section id="features" className="max-w-[1400px] mx-auto px-6 py-28 space-y-16">
          <Reveal className="text-center space-y-3 max-w-[600px] mx-auto">
            <h2 className="text-4xl sm:text-5xl font-extrabold tracking-[-0.02em] text-[#F3F0E4] font-heading">
              Built for speed, clarity, and depth
            </h2>
            <p className="text-[#9FAEA1] text-sm font-light">
              Everything you need to master your courses, collaborate with peers, and track progress.
            </p>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Feature 1: Smart Notes */}
            <div className="md:col-span-8 rounded-[2rem] bg-[#1A2D23]/80 border border-[#F3F0E4]/15 p-2 backdrop-blur-2xl hover:border-[#F0C93B]/40 transition-colors group shadow-[0_10px_30px_rgba(0,0,0,0.25)]">
              <div className="rounded-[calc(2rem-0.5rem)] bg-[#121F18] border border-[#F3F0E4]/10 p-8 h-full flex flex-col justify-between space-y-8">
                <div className="space-y-4">
                  <div className="size-11 rounded-2xl bg-[#F0C93B]/10 border border-[#F0C93B]/30 flex items-center justify-center text-[#F0C93B] shadow-[2px_2px_0_0_#F28B6E]">
                    <FileText className="size-5" />
                  </div>
                  <h3 className="text-2xl font-bold text-[#F3F0E4] tracking-tight font-heading">Smart Collaborative Notes</h3>
                  <p className="text-[#9FAEA1] text-sm leading-relaxed max-w-[52ch]">
                    Organize your semester with TipTap markdown editing, nested folders, live code block evaluation, inline math equations, and instant PDF exports.
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-[#16261D] border border-[#F3F0E4]/10 font-mono text-xs text-[#F3F0E4] space-y-2">
                  <div className="text-[#9FAEA1]">{"// Real-time synchronization active..."}</div>
                  <div className="text-[#8FC3DE]">✓ Over 50,000 notes synchronized across batches</div>
                </div>
              </div>
            </div>

            {/* Feature 2: AI Study Copilot */}
            <div className="md:col-span-4 rounded-[2rem] bg-[#1A2D23]/80 border border-[#F3F0E4]/15 p-2 backdrop-blur-2xl hover:border-[#C9A9E0]/40 transition-colors group shadow-[0_10px_30px_rgba(0,0,0,0.25)]">
              <div className="rounded-[calc(2rem-0.5rem)] bg-[#121F18] border border-[#F3F0E4]/10 p-8 h-full flex flex-col justify-between space-y-8">
                <div className="space-y-4">
                  <div className="size-11 rounded-2xl bg-[#C9A9E0]/10 border border-[#C9A9E0]/30 flex items-center justify-center text-[#C9A9E0] shadow-[2px_2px_0_0_#F28B6E]">
                    <Bot className="size-5" />
                  </div>
                  <h3 className="text-2xl font-bold text-[#F3F0E4] tracking-tight font-heading">AI Assistant &amp; Research</h3>
                  <p className="text-[#9FAEA1] text-sm leading-relaxed">
                    Summarize long lecture notes, generate flashcards, and clear complex concepts instantly.
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs font-mono text-violet-300 bg-violet-950/30 p-3.5 rounded-xl border border-violet-500/20">
                  <Sparkles className="size-4 text-violet-400" />
                  <span>Anthropic Claude 3.5 Assistant</span>
                </div>
              </div>
            </div>

            {/* Feature 3: Forums & Doubts */}
            <div className="md:col-span-4 rounded-[2rem] bg-[#1A2D23]/80 border border-[#F3F0E4]/15 p-2 hover:border-[#8FC3DE]/40 transition-colors shadow-[0_10px_30px_rgba(0,0,0,0.25)]">
              <div className="rounded-[calc(2rem-0.5rem)] bg-[#121F18] border border-[#F3F0E4]/10 p-6 space-y-3 h-full">
                <div className="size-10 rounded-xl bg-[#8FC3DE]/10 border border-[#8FC3DE]/30 flex items-center justify-center text-[#8FC3DE] shadow-[2px_2px_0_0_#F28B6E]">
                  <MessageSquare className="size-4" />
                </div>
                <h4 className="text-lg font-bold text-[#F3F0E4] tracking-tight font-heading">Peer Doubts &amp; Forums</h4>
                <p className="text-[#9FAEA1] text-xs leading-relaxed font-light">
                  Ask questions, upvote quality answers, and join focused topic discussions.
                </p>
              </div>
            </div>

            {/* Feature 4: Interactive Courses */}
            <div className="md:col-span-4 rounded-[2rem] bg-[#1A2D23]/80 border border-[#F3F0E4]/15 p-2 hover:border-[#F0C93B]/40 transition-colors shadow-[0_10px_30px_rgba(0,0,0,0.25)]">
              <div className="rounded-[calc(2rem-0.5rem)] bg-[#121F18] border border-[#F3F0E4]/10 p-6 space-y-3 h-full">
                <div className="size-10 rounded-xl bg-[#F0C93B]/10 border border-[#F0C93B]/30 flex items-center justify-center text-[#F0C93B] shadow-[2px_2px_0_0_#F28B6E]">
                  <BookOpen className="size-4" />
                </div>
                <h4 className="text-lg font-bold text-[#F3F0E4] tracking-tight font-heading">Interactive Courses</h4>
                <p className="text-[#9FAEA1] text-xs leading-relaxed font-light">
                  Master step-by-step learning tracks and earn digital completion certificates.
                </p>
              </div>
            </div>

            {/* Feature 5: Gamified Leaderboard */}
            <div className="md:col-span-4 rounded-[2rem] bg-[#1A2D23]/80 border border-[#F3F0E4]/15 p-2 hover:border-[#F28B6E]/40 transition-colors shadow-[0_10px_30px_rgba(0,0,0,0.25)]">
              <div className="rounded-[calc(2rem-0.5rem)] bg-[#121F18] border border-[#F3F0E4]/10 p-6 space-y-3 h-full">
                <div className="size-10 rounded-xl bg-[#F28B6E]/10 border border-[#F28B6E]/30 flex items-center justify-center text-[#F28B6E] shadow-[2px_2px_0_0_#F0C93B]">
                  <Trophy className="size-4" />
                </div>
                <h4 className="text-lg font-bold text-[#F3F0E4] tracking-tight font-heading">Gamified Progress</h4>
                <p className="text-[#9FAEA1] text-xs leading-relaxed font-light">
                  Earn points for note contributions and climb the batch leaderboard.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 4-STEP SCHOLAR WORKFLOW SECTION */}
        <section className="max-w-[1400px] mx-auto px-6 py-28 border-t border-[#F3F0E4]/10 space-y-16 relative z-10">
          <Reveal className="text-center space-y-3 max-w-[650px] mx-auto">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#8FC3DE]/15 border border-[#8FC3DE]/30 text-[#8FC3DE] font-mono text-[10px] uppercase tracking-widest mx-auto">
              <span>HOW NOTEXIA WORKS</span>
            </div>
            <h2 className="text-4xl sm:text-5xl font-extrabold tracking-[-0.02em] text-[#F3F0E4] font-heading">
              Four steps from lecture notes to exam mastery
            </h2>
            <p className="text-[#9FAEA1] text-sm font-light">
              Streamlined study pipeline designed for computer science, engineering, and competitive entrance preparation.
            </p>
          </Reveal>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                step: "01",
                title: "Draft & Capture",
                desc: "Write clean TipTap notes with live code syntax highlighting, nested folder trees, and LaTeX math formulas.",
                color: "text-[#F0C93B]",
                bg: "bg-[#F0C93B]/10",
                border: "border-[#F0C93B]/30",
              },
              {
                step: "02",
                title: "AI Synthesis",
                desc: "Use Anthropic Claude 3.5 Copilot to extract 1-click study flashcards, generate revision summaries, and solve doubts.",
                color: "text-[#C9A9E0]",
                bg: "bg-[#C9A9E0]/10",
                border: "border-[#C9A9E0]/30",
              },
              {
                step: "03",
                title: "Peer Doubt Forum",
                desc: "Post tricky problems to student forums, receive verified answers, upvote quality code, and build study groups.",
                color: "text-[#8FC3DE]",
                bg: "bg-[#8FC3DE]/10",
                border: "border-[#8FC3DE]/30",
              },
              {
                step: "04",
                title: "Certify & Rank",
                desc: "Complete structured subject tracks, earn digital certificates, gain streak points, and top the campus leaderboard.",
                color: "text-[#F28B6E]",
                bg: "bg-[#F28B6E]/10",
                border: "border-[#F28B6E]/30",
              },
            ].map(({ step, title, desc, color, bg, border }, i) => (
              <Reveal key={step} delay={i * 80}>
                <div className="rounded-[2rem] bg-[#1A2D23]/80 border border-[#F3F0E4]/15 p-2 h-full shadow-[0_10px_30px_rgba(0,0,0,0.25)]">
                  <div className="rounded-[calc(2rem-0.5rem)] bg-[#121F18] border border-[#F3F0E4]/10 p-6 h-full flex flex-col justify-between space-y-6">
                    <div className="space-y-4">
                      <div className={`size-10 rounded-xl ${bg} border ${border} flex items-center justify-center font-mono font-bold text-sm ${color} shadow-[2px_2px_0_0_#F28B6E]`}>
                        {step}
                      </div>
                      <h3 className="text-xl font-bold text-[#F3F0E4] font-heading">{title}</h3>
                      <p className="text-xs text-[#9FAEA1] font-light leading-relaxed">{desc}</p>
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* SUPPORTED EXAMS & INSTITUTIONS DISPATCH */}
        <section className="max-w-[1400px] mx-auto px-6 py-24 border-t border-[#F3F0E4]/10 space-y-12 relative z-10">
          <Reveal className="text-center space-y-3 max-w-[600px] mx-auto">
            <h2 className="text-3xl sm:text-4xl font-black text-[#F3F0E4] font-heading">
              Curated for premier Indian entrance exams &amp; degrees
            </h2>
            <p className="text-xs sm:text-sm text-[#9FAEA1] font-light">
              Structured note vaults and peer study groups tailored to key academic domains.
            </p>
          </Reveal>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
            {[
              { name: "GATE CSE / ECE", badge: "5.4k Notes", accent: "border-[#F0C93B]/40 text-[#F0C93B]" },
              { name: "JEE Advanced", badge: "8.2k Notes", accent: "border-[#8FC3DE]/40 text-[#8FC3DE]" },
              { name: "B.Tech CS / IT", badge: "12k Notes", accent: "border-[#C9A9E0]/40 text-[#C9A9E0]" },
              { name: "AI & Data Science", badge: "4.1k Notes", accent: "border-[#F28B6E]/40 text-[#F28B6E]" },
              { name: "UPSC Tech Optional", badge: "2.8k Notes", accent: "border-[#F0C93B]/40 text-[#F0C93B]" },
              { name: "NEET / Biology", badge: "6.9k Notes", accent: "border-[#8FC3DE]/40 text-[#8FC3DE]" },
            ].map(({ name, badge, accent }, i) => (
              <Reveal key={name} delay={i * 60}>
                <div className="rounded-2xl bg-[#1A2D23]/80 border border-[#F3F0E4]/15 p-4 text-center space-y-2 shadow-md hover:scale-105 transition-transform duration-300">
                  <div className={`text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-[#121F18] border ${accent} inline-block`}>
                    {badge}
                  </div>
                  <div className="text-xs font-bold text-[#F3F0E4] font-heading">{name}</div>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* USER REVIEWS SECTION */}
        <section id="reviews" className="border-t border-[#F3F0E4]/10 bg-[#16261D] py-36 relative z-10">
          <div className="max-w-[1400px] mx-auto px-6 space-y-16">
            <Reveal className="text-center space-y-4 max-w-[650px] mx-auto">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F0C93B]/15 border border-[#F0C93B]/30 text-[#F0C93B] font-mono text-[10px] uppercase tracking-widest mx-auto">
                <Star className="size-3 fill-current text-[#F0C93B]" />
                <span>STUDENT TESTIMONIALS</span>
              </div>
              <h2 className="text-4xl sm:text-5xl font-extrabold tracking-[-0.02em] text-[#F3F0E4] font-heading">
                Loved by 25,000+ students across India
              </h2>
              <p className="text-[#9FAEA1] text-sm font-light leading-relaxed">
                See how students from top engineering institutes and universities use Notexia to boost their academic scores.
              </p>
            </Reveal>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {reviews.map((rev, idx) => (
                <Reveal key={rev.name} delay={idx * 80}>
                  <div className="rounded-[2rem] bg-[#1A2D23]/80 border border-[#F3F0E4]/15 p-2 h-full hover:border-[#F0C93B]/40 transition-colors shadow-[0_10px_30px_rgba(0,0,0,0.25)]">
                    <div className="rounded-[calc(2rem-0.5rem)] bg-[#121F18] border border-[#F3F0E4]/10 p-6 h-full flex flex-col justify-between space-y-6">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex gap-1 text-[#F0C93B]">
                            {[...Array(rev.rating)].map((_, i) => (
                              <Star key={i} className="size-3.5 fill-current" />
                            ))}
                          </div>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#8FC3DE]/15 text-[#8FC3DE] border border-[#8FC3DE]/30">
                            Verified Student
                          </span>
                        </div>
                        <p className="text-xs sm:text-sm text-[#F3F0E4] leading-relaxed font-light italic">
                          &quot;{rev.review}&quot;
                        </p>
                      </div>

                      <div className="pt-4 border-t border-[#F3F0E4]/10 flex items-center justify-between">
                        <div>
                          <div className="text-sm font-bold text-[#F3F0E4] font-heading">{rev.name}</div>
                          <div className="text-[11px] text-[#9FAEA1]">{rev.role}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs font-semibold text-[#8FC3DE] flex items-center gap-1">
                            <GraduationCap className="size-3.5" />
                            <span>{rev.college}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* PRICING SECTION ACCORDING TO INDIA (INR) */}
        <section id="pricing" className="max-w-[1400px] mx-auto px-6 py-36 space-y-16 relative z-10">
          <div className="text-center space-y-4 max-w-[600px] mx-auto">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#8FC3DE]/15 border border-[#8FC3DE]/30 text-[#8FC3DE] font-mono text-[10px] uppercase tracking-widest mx-auto">
              <ShieldCheck className="size-3.5 text-[#8FC3DE]" />
              <span>AFFORDABLE INDIAN PRICING (INR)</span>
            </div>
            <h2 className="text-4xl sm:text-5xl font-extrabold tracking-[-0.02em] text-[#F3F0E4] font-heading">
              Student-friendly plans for India
            </h2>
            <p className="text-[#9FAEA1] text-sm font-light">
              No expensive USD conversions. Pay seamlessly with UPI, Google Pay, PhonePe, Paytm, or NetBanking.
            </p>

            <div className="pt-4 flex items-center justify-center gap-3 text-xs font-medium text-[#9FAEA1]">
              <span>Monthly</span>
              <button
                onClick={() => setIsAnnual(!isAnnual)}
                className={`w-11 h-6 rounded-full p-1 transition-colors ${
                  isAnnual ? "bg-[#F0C93B]" : "bg-[#121F18]"
                }`}
              >
                <div
                  className={`size-4 rounded-full bg-[#2A2118] transition-transform ${
                    isAnnual ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
              <span>Annual <span className="text-[#F0C93B] font-bold">(Save 37%)</span></span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Free Starter Tier */}
            <div className="rounded-[2rem] bg-[#1A2D23]/80 border border-[#F3F0E4]/15 p-2 shadow-[0_10px_30px_rgba(0,0,0,0.25)]">
              <div className="rounded-[calc(2rem-0.5rem)] bg-[#121F18] border border-[#F3F0E4]/10 p-8 h-full flex flex-col justify-between space-y-8">
                <div className="space-y-5">
                  <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#9FAEA1]">Free Starter</div>
                  <div className="text-4xl font-extrabold text-[#F3F0E4] font-heading">₹0 <span className="text-xs font-normal text-[#9FAEA1]">/ forever</span></div>
                  <p className="text-xs text-[#9FAEA1] leading-relaxed font-light">Perfect for individual creators and students looking for clean note-taking &amp; doubt solving.</p>
                  <ul className="space-y-3 text-xs text-[#F3F0E4] pt-6 border-t border-[#F3F0E4]/10">
                    <li className="flex items-center gap-2.5"><Check className="size-4 text-[#F0C93B]" /> Unlimited Local Notes &amp; Folders</li>
                    <li className="flex items-center gap-2.5"><Check className="size-4 text-[#F0C93B]" /> 100 AI Queries / Month</li>
                    <li className="flex items-center gap-2.5"><Check className="size-4 text-[#F0C93B]" /> Peer Doubt Forum &amp; Feed</li>
                    <li className="flex items-center gap-2.5"><Check className="size-4 text-[#9FAEA1] opacity-40" /><span className="opacity-40">Realtime Team Collaboration</span></li>
                  </ul>
                </div>
                <Link
                  href="/signup"
                  className="w-full h-11 rounded-xl bg-[#16261D] hover:bg-[#1F362A] text-[#F3F0E4] font-bold text-xs flex items-center justify-center transition-all duration-200 active:scale-[0.97] border border-[#F3F0E4]/15"
                >
                  Get Started Free
                </Link>
              </div>
            </div>

            {/* Scholar Pro Tier (INR Most Popular) */}
            <div className="rounded-[2rem] bg-[#1A2D23] border border-[#F0C93B]/50 p-2 shadow-[0_15px_40px_rgba(0,0,0,0.3)] relative">
              <div className="absolute -top-3.5 right-8 px-3.5 py-1 rounded-full bg-[#F0C93B] text-[#2A2118] font-bold text-[10px] uppercase tracking-widest shadow-[2px_2px_0_0_#F28B6E]">
                Most Popular
              </div>
              <div className="rounded-[calc(2rem-0.5rem)] bg-[#121F18] border border-[#F3F0E4]/10 p-8 h-full flex flex-col justify-between space-y-8">
                <div className="space-y-5">
                  <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#F0C93B] font-bold">Scholar Pro</div>
                  <div className="text-4xl font-extrabold text-[#F3F0E4] font-heading">
                    {isAnnual ? "₹124" : "₹199"} <span className="text-xs font-normal text-[#9FAEA1]">/ month</span>
                  </div>
                  <div className="text-[11px] text-[#F0C93B] font-mono">
                    {isAnnual ? "Billed ₹1,499 annually" : "Billed monthly"}
                  </div>
                  <p className="text-xs text-[#9FAEA1] leading-relaxed font-light">For serious students needing unlimited AI research, flashcards, and realtime collaboration.</p>
                  <ul className="space-y-3 text-xs text-[#F3F0E4] pt-6 border-t border-[#F3F0E4]/10">
                    <li className="flex items-center gap-2.5"><Check className="size-4 text-[#F0C93B]" /> Everything in Free Starter</li>
                    <li className="flex items-center gap-2.5"><Check className="size-4 text-[#F0C93B]" /> Unlimited AI Research &amp; Flashcards</li>
                    <li className="flex items-center gap-2.5"><Check className="size-4 text-[#F0C93B]" /> Realtime CRDT Collaborative Sync</li>
                    <li className="flex items-center gap-2.5"><Check className="size-4 text-[#F0C93B]" /> Verified Course Completion Certificates</li>
                  </ul>
                </div>
                <Link
                  href="/signup?plan=pro"
                  className="group w-full h-11 rounded-xl bg-[#F0C93B] hover:bg-[#F0C93B]/90 text-[#2A2118] font-bold text-xs flex items-center justify-center gap-2 transition-all duration-300 active:scale-[0.97] shadow-[2px_2px_0_0_#F28B6E] font-heading"
                >
                  <span>Upgrade to Pro</span>
                  <ArrowUpRight className="size-4 text-[#2A2118] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </Link>
              </div>
            </div>

            {/* Campus / Team Tier */}
            <div className="rounded-[2rem] bg-[#1A2D23]/80 border border-[#F3F0E4]/15 p-2 shadow-[0_10px_30px_rgba(0,0,0,0.25)]">
              <div className="rounded-[calc(2rem-0.5rem)] bg-[#121F18] border border-[#F3F0E4]/10 p-8 h-full flex flex-col justify-between space-y-8">
                <div className="space-y-5">
                  <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#C9A9E0] font-bold">Campus / Team</div>
                  <div className="text-4xl font-extrabold text-[#F3F0E4] font-heading">
                    {isAnnual ? "₹333" : "₹499"} <span className="text-xs font-normal text-[#9FAEA1]">/ user / mo</span>
                  </div>
                  <div className="text-[11px] text-[#C9A9E0] font-mono">
                    {isAnnual ? "Billed ₹3,999 annually" : "Billed monthly"}
                  </div>
                  <p className="text-xs text-[#9FAEA1] leading-relaxed font-light">For study groups, college clubs, and campus labs needing priority AI &amp; admin controls.</p>
                  <ul className="space-y-3 text-xs text-[#F3F0E4] pt-6 border-t border-[#F3F0E4]/10">
                    <li className="flex items-center gap-2.5"><Check className="size-4 text-[#F0C93B]" /> Everything in Scholar Pro</li>
                    <li className="flex items-center gap-2.5"><Check className="size-4 text-[#F0C93B]" /> Priority Claude 3.5 Sonnet Synthesis</li>
                    <li className="flex items-center gap-2.5"><Check className="size-4 text-[#F0C93B]" /> Zero-Knowledge Client Encryption Keys</li>
                    <li className="flex items-center gap-2.5"><Check className="size-4 text-[#F0C93B]" /> Group Shared Workspace &amp; Analytics</li>
                  </ul>
                </div>
                <Link
                  href="/signup?plan=team"
                  className="w-full h-11 rounded-xl bg-[#16261D] hover:bg-[#1F362A] text-[#F3F0E4] font-bold text-xs flex items-center justify-center transition-all duration-200 active:scale-[0.97] border border-[#F3F0E4]/15"
                >
                  Get Campus Pass
                </Link>
              </div>
            </div>
          </div>

          {/* Payment Gateways Bar */}
          <div className="max-w-4xl mx-auto p-4 rounded-2xl bg-[#121F18] border border-[#F3F0E4]/15 flex flex-wrap items-center justify-between gap-4 text-xs font-mono text-[#9FAEA1]">
            <div className="flex items-center gap-2">
              <CreditCard className="size-4 text-[#8FC3DE]" />
              <span>Accepted Payments in India:</span>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-[#F3F0E4] font-bold">
              <span className="px-2.5 py-1 rounded-lg bg-[#16261D] border border-[#F3F0E4]/10 text-[11px]">UPI</span>
              <span className="px-2.5 py-1 rounded-lg bg-[#16261D] border border-[#F3F0E4]/10 text-[11px]">Google Pay</span>
              <span className="px-2.5 py-1 rounded-lg bg-[#16261D] border border-[#F3F0E4]/10 text-[11px]">PhonePe</span>
              <span className="px-2.5 py-1 rounded-lg bg-[#16261D] border border-[#F3F0E4]/10 text-[11px]">Paytm</span>
              <span className="px-2.5 py-1 rounded-lg bg-[#16261D] border border-[#F3F0E4]/10 text-[11px]">Net Banking</span>
            </div>
          </div>
        </section>

        {/* FAQ SECTION */}
        <section id="faq" className="border-t border-[#F3F0E4]/10 bg-[#16261D] py-28 relative z-10">
          <div className="max-w-4xl mx-auto px-6 space-y-12">
            <Reveal className="text-center space-y-3">
              <h2 className="text-4xl sm:text-5xl font-extrabold tracking-[-0.02em] text-[#F3F0E4] font-heading">
                Frequently asked questions
              </h2>
              <p className="text-[#9FAEA1] text-sm font-light">
                Everything you need to know about Notexia.
              </p>
            </Reveal>

            <div className="space-y-4">
              {[
                {
                  q: "Is Notexia free to use for students in India?",
                  a: "Yes! Notexia offers a complete free tier (₹0/forever) with unlimited local note creation, folder organization, community access, and AI query credits.",
                },
                {
                  q: "How can I pay for Scholar Pro in India?",
                  a: "We support all major Indian payment options including Instant UPI (GPay, PhonePe, Paytm, BHIM), Credit/Debit cards, and Net Banking.",
                },
                {
                  q: "How does the AI Assistant work?",
                  a: "The AI Assistant uses Anthropic Claude 3.5 to analyze your uploaded notes, generate study flashcards, summarize research papers, and clear doubts.",
                },
                {
                  q: "Can I collaborate with my classmates in real time?",
                  a: "Absolutely. Notexia uses real-time WebSocket transport (Pusher) and CRDT algorithms so multiple users can edit notes simultaneously without sync conflicts.",
                },
                {
                  q: "Is my note data secure?",
                  a: "Your notes are encrypted both in transit and at rest. Pro members get end-to-end client-side encryption keys so only you can read your vault.",
                },
              ].map(({ q, a }, index) => (
                <div
                  key={q}
                  className="rounded-[2rem] bg-[#1A2D23]/80 border border-[#F3F0E4]/15 p-2 shadow-[0_10px_30px_rgba(0,0,0,0.25)] overflow-hidden"
                >
                  <button
                    onClick={() => toggleFaq(index)}
                    className="w-full text-left rounded-[calc(2rem-0.5rem)] bg-[#121F18] border border-[#F3F0E4]/10 p-6 flex items-center justify-between gap-4 text-[#F3F0E4] font-bold text-base hover:bg-[#16261D] transition-colors font-heading"
                  >
                    <span>{q}</span>
                    <Plus className={`size-5 text-[#F0C93B] transition-transform duration-300 ${openFaq === index ? "rotate-45" : ""}`} />
                  </button>
                  <AnimatePresence>
                    {openFaq === index && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                        className="overflow-hidden"
                      >
                        <div className="px-6 pb-6 pt-3 text-xs sm:text-sm text-[#9FAEA1] leading-relaxed font-light">
                          {a}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-[#F3F0E4]/10 bg-[#121F18] py-16 text-xs text-[#9FAEA1] relative z-10">
        <div className="max-w-[1400px] mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-2.5">
            <div className="size-2 rounded-full bg-[#8FC3DE] animate-pulse" />
            <span className="font-mono text-[#8FC3DE]">All systems operational</span>
          </div>
          <div className="text-[#9FAEA1]">
            &copy; {new Date().getFullYear()} Notexia Inc. All rights reserved. Made for Indian Students &amp; Engineers.
          </div>
          <div className="flex items-center gap-8">
            <a href="#features" className="hover:text-[#F3F0E4] transition-colors">Privacy</a>
            <a href="#features" className="hover:text-[#F3F0E4] transition-colors">Terms</a>
            <a href="#features" className="hover:text-[#F3F0E4] transition-colors">Security</a>
          </div>
        </div>
      </footer>
    </div>
  );
}