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
    <div className="min-h-[100dvh] bg-[#030305] text-zinc-100 font-sans selection:bg-cyan-500/30 selection:text-cyan-200 overflow-x-hidden antialiased flex flex-col">
      {/* Background Ambient Mesh Glow Orbs */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[1200px] h-[600px] bg-gradient-to-b from-cyan-500/15 via-violet-600/10 to-transparent blur-[140px] opacity-70" />
        <div className="absolute top-[900px] -right-40 w-[700px] h-[500px] bg-cyan-500/10 blur-[160px]" />
        <div className="absolute top-[1800px] -left-40 w-[600px] h-[500px] bg-violet-500/10 blur-[160px]" />
      </div>

      {/* Floating Island Glass Navbar */}
      <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-4xl px-4 pointer-events-none">
        <header className="pointer-events-auto rounded-full bg-zinc-950/80 border border-white/10 backdrop-blur-2xl px-6 py-2.5 flex items-center justify-between shadow-[0_20px_50px_rgba(0,0,0,0.8)]">
          <Link href="/" className="flex items-center gap-3 group">
            <img src="/logo.png" className="h-6 w-auto object-contain" alt="Notexia Logo" />
            <span className="font-bold tracking-tight text-sm text-white">
              Notexia <span className="text-cyan-400 font-mono text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 ml-1">v2.4</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-7 text-xs font-medium text-zinc-400 tracking-wide">
            <a href="#features" className="hover:text-white transition-colors duration-200">Features</a>
            <a href="#reviews" className="hover:text-white transition-colors duration-200">Reviews</a>
            <a href="#pricing" className="hover:text-white transition-colors duration-200">Pricing (INR)</a>
            <a href="#faq" className="hover:text-white transition-colors duration-200">FAQ</a>
          </nav>

          <div className="flex items-center gap-3">
            {isLoggedIn ? (
              <Link
                href="/dashboard"
                className="group rounded-full bg-white hover:bg-zinc-100 text-zinc-950 font-bold text-xs pl-4 pr-1.5 py-1.5 inline-flex items-center gap-2.5 transition-all duration-300 active:scale-[0.97] shadow-[0_0_20px_rgba(255,255,255,0.2)]"
              >
                <span>Dashboard</span>
                <div className="size-6 rounded-full bg-zinc-950 flex items-center justify-center text-white">
                  <ArrowUpRight className="size-3.5 text-white" />
                </div>
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-xs font-medium text-zinc-400 hover:text-white transition-colors px-2 py-1"
                >
                  Log in
                </Link>
                <Link
                  href="/signup"
                  className="group rounded-full bg-white hover:bg-zinc-100 text-zinc-950 font-bold text-xs pl-4 pr-1.5 py-1.5 inline-flex items-center gap-2.5 transition-all duration-300 active:scale-[0.97] shadow-[0_0_20px_rgba(255,255,255,0.2)]"
                >
                  <span>Get Started</span>
                  <div className="size-6 rounded-full bg-zinc-950/10 flex items-center justify-center group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-200">
                    <ArrowUpRight className="size-3.5 text-zinc-950" />
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
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 font-mono text-[10px] uppercase tracking-[0.25em] mx-auto">
              <span className="size-1.5 rounded-full bg-cyan-400 animate-pulse" />
              <span>MODERN LEARNING PLATFORM FOR INDIAN STUDENTS &amp; ENGINEERS</span>
            </div>
          </Reveal>

          <Reveal delay={80}>
            <h1 className="text-5xl sm:text-7xl lg:text-8xl font-black tracking-[-0.03em] leading-[0.94] text-white max-w-5xl mx-auto">
              Learn Smarter. <br />
              <span className="bg-gradient-to-r from-cyan-400 via-teal-300 to-violet-400 bg-clip-text text-transparent">
                Grow Faster.
              </span>
            </h1>
          </Reveal>

          <Reveal delay={160}>
            <p className="text-base sm:text-lg text-zinc-400 max-w-[54ch] mx-auto leading-relaxed font-light">
              One place to share notes, solve doubts, and collaborate with peers. Designed for fast workflows, clean content, and measurable academic progress.
            </p>
          </Reveal>

          <Reveal delay={240}>
            <div className="flex flex-wrap gap-4 justify-center items-center">
              {isLoggedIn ? (
                <Link
                  href="/dashboard"
                  className="group rounded-full bg-white hover:bg-zinc-100 text-zinc-950 font-bold text-sm pl-6 pr-2 py-3.5 inline-flex items-center gap-3 transition-all duration-300 active:scale-[0.97] shadow-[0_0_35px_rgba(255,255,255,0.25)]"
                >
                  <span>Open dashboard</span>
                  <div className="size-8 rounded-full bg-zinc-950 flex items-center justify-center text-white group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-200">
                    <ArrowUpRight className="size-4 text-white" />
                  </div>
                </Link>
              ) : (
                <>
                  <Link
                    href="/signup"
                    className="group rounded-full bg-white hover:bg-zinc-100 text-zinc-950 font-bold text-sm pl-6 pr-2 py-3.5 inline-flex items-center gap-3 transition-all duration-300 active:scale-[0.97] shadow-[0_0_35px_rgba(255,255,255,0.25)]"
                  >
                    <span>Get Started Free</span>
                    <div className="size-8 rounded-full bg-zinc-950 flex items-center justify-center text-white group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-200">
                      <ArrowUpRight className="size-4 text-white" />
                    </div>
                  </Link>
                  <Link
                    href="/login"
                    className="rounded-full bg-zinc-900/90 hover:bg-zinc-850 border border-white/10 text-zinc-300 font-semibold text-xs px-6 py-3.5 transition-all duration-200 active:scale-[0.97] backdrop-blur-xl"
                  >
                    Log in
                  </Link>
                </>
              )}
            </div>
          </Reveal>

          {/* Doppelrand Quick Metrics */}
          <div className="pt-8 max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { value: 248, label: "New Notes", accent: "text-cyan-400" },
              { value: 931, label: "Doubts Answered", accent: "text-violet-400" },
              { value: 118, label: "Forum Discussions", accent: "text-teal-400" },
            ].map(({ value, label, accent }, i) => (
              <Reveal key={label} delay={i * 90}>
                <div className="rounded-[2rem] bg-zinc-900/30 border border-white/10 p-2">
                  <div className="rounded-[calc(2rem-0.5rem)] bg-[#07070a] border border-white/5 p-6 text-center space-y-1">
                    <div className={`font-mono text-3xl sm:text-4xl font-bold ${accent}`}>
                      <CountUp value={value} prefix="+" />
                    </div>
                    <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
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
            <h2 className="text-4xl sm:text-5xl font-extrabold tracking-[-0.02em] text-white">
              Built for speed, clarity, and depth
            </h2>
            <p className="text-zinc-400 text-sm font-light">
              Everything you need to master your courses, collaborate with peers, and track progress.
            </p>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Feature 1: Smart Notes */}
            <div className="md:col-span-8 rounded-[2rem] bg-zinc-900/30 border border-white/10 p-2 backdrop-blur-2xl hover:border-cyan-500/30 transition-colors group">
              <div className="rounded-[calc(2rem-0.5rem)] bg-[#07070a] border border-white/5 p-8 h-full flex flex-col justify-between space-y-8">
                <div className="space-y-4">
                  <div className="size-11 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                    <FileText className="size-5" />
                  </div>
                  <h3 className="text-2xl font-bold text-white tracking-tight">Smart Collaborative Notes</h3>
                  <p className="text-zinc-400 text-sm leading-relaxed max-w-[52ch]">
                    Organize your semester with TipTap markdown editing, nested folders, live code block evaluation, inline math equations, and instant PDF exports.
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-zinc-950 border border-white/5 font-mono text-xs text-zinc-300 space-y-2">
                  <div className="text-zinc-500">{"// Real-time synchronization active..."}</div>
                  <div className="text-emerald-400">✓ Over 50,000 notes synchronized across batches</div>
                </div>
              </div>
            </div>

            {/* Feature 2: AI Study Copilot */}
            <div className="md:col-span-4 rounded-[2rem] bg-zinc-900/30 border border-white/10 p-2 backdrop-blur-2xl hover:border-violet-500/30 transition-colors group">
              <div className="rounded-[calc(2rem-0.5rem)] bg-[#07070a] border border-white/5 p-8 h-full flex flex-col justify-between space-y-8">
                <div className="space-y-4">
                  <div className="size-11 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
                    <Bot className="size-5" />
                  </div>
                  <h3 className="text-2xl font-bold text-white tracking-tight">AI Assistant &amp; Research</h3>
                  <p className="text-zinc-400 text-sm leading-relaxed">
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
            <div className="md:col-span-4 rounded-[2rem] bg-zinc-900/30 border border-white/10 p-2 hover:border-teal-500/30 transition-colors">
              <div className="rounded-[calc(2rem-0.5rem)] bg-[#07070a] border border-white/5 p-6 space-y-3 h-full">
                <div className="size-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
                  <MessageSquare className="size-4" />
                </div>
                <h4 className="text-lg font-bold text-white tracking-tight">Peer Doubts &amp; Forums</h4>
                <p className="text-zinc-400 text-xs leading-relaxed">
                  Ask questions, upvote quality answers, and join focused topic discussions.
                </p>
              </div>
            </div>

            {/* Feature 4: Interactive Courses */}
            <div className="md:col-span-4 rounded-[2rem] bg-zinc-900/30 border border-white/10 p-2 hover:border-amber-500/30 transition-colors">
              <div className="rounded-[calc(2rem-0.5rem)] bg-[#07070a] border border-white/5 p-6 space-y-3 h-full">
                <div className="size-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                  <BookOpen className="size-4" />
                </div>
                <h4 className="text-lg font-bold text-white tracking-tight">Interactive Courses</h4>
                <p className="text-zinc-400 text-xs leading-relaxed">
                  Master step-by-step learning tracks and earn digital completion certificates.
                </p>
              </div>
            </div>

            {/* Feature 5: Gamified Leaderboard */}
            <div className="md:col-span-4 rounded-[2rem] bg-zinc-900/30 border border-white/10 p-2 hover:border-rose-500/30 transition-colors">
              <div className="rounded-[calc(2rem-0.5rem)] bg-[#07070a] border border-white/5 p-6 space-y-3 h-full">
                <div className="size-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                  <Trophy className="size-4" />
                </div>
                <h4 className="text-lg font-bold text-white tracking-tight">Gamified Progress</h4>
                <p className="text-zinc-400 text-xs leading-relaxed">
                  Earn points for note contributions and climb the batch leaderboard.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* USER REVIEWS SECTION */}
        <section id="reviews" className="border-t border-white/5 bg-[#050508] py-36">
          <div className="max-w-[1400px] mx-auto px-6 space-y-16">
            <Reveal className="text-center space-y-4 max-w-[650px] mx-auto">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 font-mono text-[10px] uppercase tracking-widest mx-auto">
                <Star className="size-3 fill-current text-amber-400" />
                <span>STUDENT TESTIMONIALS</span>
              </div>
              <h2 className="text-4xl sm:text-5xl font-extrabold tracking-[-0.02em] text-white">
                Loved by 25,000+ students across India
              </h2>
              <p className="text-zinc-400 text-sm font-light leading-relaxed">
                See how students from top engineering institutes and universities use Notexia to boost their academic scores.
              </p>
            </Reveal>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {reviews.map((rev, idx) => (
                <Reveal key={rev.name} delay={idx * 80}>
                  <div className="rounded-[2rem] bg-zinc-900/30 border border-white/10 p-2 h-full hover:border-cyan-500/30 transition-colors">
                    <div className="rounded-[calc(2rem-0.5rem)] bg-[#07070a] border border-white/5 p-6 h-full flex flex-col justify-between space-y-6">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex gap-1 text-amber-400">
                            {[...Array(rev.rating)].map((_, i) => (
                              <Star key={i} className="size-3.5 fill-current" />
                            ))}
                          </div>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                            Verified Student
                          </span>
                        </div>
                        <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed font-light italic">
                          &quot;{rev.review}&quot;
                        </p>
                      </div>

                      <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                        <div>
                          <div className="text-sm font-bold text-white">{rev.name}</div>
                          <div className="text-[11px] text-zinc-400">{rev.role}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs font-semibold text-cyan-400 flex items-center gap-1">
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
        <section id="pricing" className="max-w-[1400px] mx-auto px-6 py-36 space-y-16">
          <div className="text-center space-y-4 max-w-[600px] mx-auto">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 font-mono text-[10px] uppercase tracking-widest mx-auto">
              <ShieldCheck className="size-3.5 text-emerald-400" />
              <span>AFFORDABLE INDIAN PRICING (INR)</span>
            </div>
            <h2 className="text-4xl sm:text-5xl font-extrabold tracking-[-0.02em] text-white">
              Student-friendly plans for India
            </h2>
            <p className="text-zinc-400 text-sm font-light">
              No expensive USD conversions. Pay seamlessly with UPI, Google Pay, PhonePe, Paytm, or NetBanking.
            </p>

            <div className="pt-4 flex items-center justify-center gap-3 text-xs font-medium text-zinc-400">
              <span>Monthly</span>
              <button
                onClick={() => setIsAnnual(!isAnnual)}
                className={`w-11 h-6 rounded-full p-1 transition-colors ${
                  isAnnual ? "bg-cyan-500" : "bg-zinc-800"
                }`}
              >
                <div
                  className={`size-4 rounded-full bg-zinc-950 transition-transform ${
                    isAnnual ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
              <span>Annual <span className="text-cyan-400 font-bold">(Save 37%)</span></span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Free Starter Tier */}
            <div className="rounded-[2rem] bg-zinc-900/30 border border-white/10 p-2">
              <div className="rounded-[calc(2rem-0.5rem)] bg-[#07070a] border border-white/5 p-8 h-full flex flex-col justify-between space-y-8">
                <div className="space-y-5">
                  <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-zinc-500">Free Starter</div>
                  <div className="text-4xl font-extrabold text-white">₹0 <span className="text-xs font-normal text-zinc-500">/ forever</span></div>
                  <p className="text-xs text-zinc-400 leading-relaxed">Perfect for individual creators and students looking for clean note-taking &amp; doubt solving.</p>
                  <ul className="space-y-3 text-xs text-zinc-300 pt-6 border-t border-white/5">
                    <li className="flex items-center gap-2.5"><Check className="size-4 text-cyan-400" /> Unlimited Local Notes &amp; Folders</li>
                    <li className="flex items-center gap-2.5"><Check className="size-4 text-cyan-400" /> 100 AI Queries / Month</li>
                    <li className="flex items-center gap-2.5"><Check className="size-4 text-cyan-400" /> Peer Doubt Forum &amp; Feed</li>
                    <li className="flex items-center gap-2.5"><Check className="size-4 text-zinc-400 opacity-40" /><span className="opacity-40">Realtime Team Collaboration</span></li>
                  </ul>
                </div>
                <Link
                  href="/signup"
                  className="w-full h-11 rounded-full bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs flex items-center justify-center transition-all duration-200 active:scale-[0.97]"
                >
                  Get Started Free
                </Link>
              </div>
            </div>

            {/* Scholar Pro Tier (INR Most Popular) */}
            <div className="rounded-[2rem] bg-cyan-500/10 border border-cyan-500/40 p-2 shadow-[0_0_60px_rgba(6,182,212,0.15)] relative">
              <div className="absolute -top-3.5 right-8 px-3.5 py-1 rounded-full bg-cyan-500 text-zinc-950 font-bold text-[10px] uppercase tracking-widest shadow-lg">
                Most Popular
              </div>
              <div className="rounded-[calc(2rem-0.5rem)] bg-[#07070a] border border-white/5 p-8 h-full flex flex-col justify-between space-y-8">
                <div className="space-y-5">
                  <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-cyan-400 font-bold">Scholar Pro</div>
                  <div className="text-4xl font-extrabold text-white">
                    {isAnnual ? "₹124" : "₹199"} <span className="text-xs font-normal text-zinc-500">/ month</span>
                  </div>
                  <div className="text-[11px] text-cyan-400 font-mono">
                    {isAnnual ? "Billed ₹1,499 annually" : "Billed monthly"}
                  </div>
                  <p className="text-xs text-zinc-400 leading-relaxed">For serious students needing unlimited AI research, flashcards, and realtime collaboration.</p>
                  <ul className="space-y-3 text-xs text-zinc-300 pt-6 border-t border-white/5">
                    <li className="flex items-center gap-2.5"><Check className="size-4 text-cyan-400" /> Everything in Free Starter</li>
                    <li className="flex items-center gap-2.5"><Check className="size-4 text-cyan-400" /> Unlimited AI Research &amp; Flashcards</li>
                    <li className="flex items-center gap-2.5"><Check className="size-4 text-cyan-400" /> Realtime CRDT Collaborative Sync</li>
                    <li className="flex items-center gap-2.5"><Check className="size-4 text-cyan-400" /> Verified Course Completion Certificates</li>
                  </ul>
                </div>
                <Link
                  href="/signup?plan=pro"
                  className="group w-full h-11 rounded-full bg-white hover:bg-zinc-100 text-zinc-950 font-bold text-xs flex items-center justify-center gap-2 transition-all duration-300 active:scale-[0.97] shadow-[0_0_25px_rgba(255,255,255,0.2)]"
                >
                  <span>Upgrade to Pro</span>
                  <ArrowUpRight className="size-4 text-zinc-950 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </Link>
              </div>
            </div>

            {/* Campus / Team Tier */}
            <div className="rounded-[2rem] bg-zinc-900/30 border border-white/10 p-2">
              <div className="rounded-[calc(2rem-0.5rem)] bg-[#07070a] border border-white/5 p-8 h-full flex flex-col justify-between space-y-8">
                <div className="space-y-5">
                  <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-violet-400 font-bold">Campus / Team</div>
                  <div className="text-4xl font-extrabold text-white">
                    {isAnnual ? "₹333" : "₹499"} <span className="text-xs font-normal text-zinc-500">/ user / mo</span>
                  </div>
                  <div className="text-[11px] text-violet-400 font-mono">
                    {isAnnual ? "Billed ₹3,999 annually" : "Billed monthly"}
                  </div>
                  <p className="text-xs text-zinc-400 leading-relaxed">For study groups, college clubs, and campus labs needing priority AI &amp; admin controls.</p>
                  <ul className="space-y-3 text-xs text-zinc-300 pt-6 border-t border-white/5">
                    <li className="flex items-center gap-2.5"><Check className="size-4 text-cyan-400" /> Everything in Scholar Pro</li>
                    <li className="flex items-center gap-2.5"><Check className="size-4 text-cyan-400" /> Priority Claude 3.5 Sonnet Synthesis</li>
                    <li className="flex items-center gap-2.5"><Check className="size-4 text-cyan-400" /> Zero-Knowledge Client Encryption Keys</li>
                    <li className="flex items-center gap-2.5"><Check className="size-4 text-cyan-400" /> Group Shared Workspace &amp; Analytics</li>
                  </ul>
                </div>
                <Link
                  href="/signup?plan=team"
                  className="w-full h-11 rounded-full bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs flex items-center justify-center transition-all duration-200 active:scale-[0.97]"
                >
                  Get Campus Pass
                </Link>
              </div>
            </div>
          </div>

          {/* Payment Gateways Bar */}
          <div className="max-w-4xl mx-auto p-4 rounded-2xl bg-zinc-950/60 border border-white/5 flex flex-wrap items-center justify-between gap-4 text-xs font-mono text-zinc-400">
            <div className="flex items-center gap-2">
              <CreditCard className="size-4 text-cyan-400" />
              <span>Accepted Payments in India:</span>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-white font-bold">
              <span className="px-2.5 py-1 rounded bg-zinc-900 border border-white/10 text-[11px]">UPI</span>
              <span className="px-2.5 py-1 rounded bg-zinc-900 border border-white/10 text-[11px]">Google Pay</span>
              <span className="px-2.5 py-1 rounded bg-zinc-900 border border-white/10 text-[11px]">PhonePe</span>
              <span className="px-2.5 py-1 rounded bg-zinc-900 border border-white/10 text-[11px]">Paytm</span>
              <span className="px-2.5 py-1 rounded bg-zinc-900 border border-white/10 text-[11px]">Net Banking</span>
            </div>
          </div>
        </section>

        {/* FAQ SECTION */}
        <section id="faq" className="border-t border-white/5 bg-[#050508] py-28">
          <div className="max-w-4xl mx-auto px-6 space-y-12">
            <Reveal className="text-center space-y-3">
              <h2 className="text-4xl sm:text-5xl font-extrabold tracking-[-0.02em] text-white">
                Frequently asked questions
              </h2>
              <p className="text-zinc-400 text-sm font-light">
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
                  className="rounded-2xl bg-zinc-900/30 border border-white/10 p-2"
                >
                  <button
                    onClick={() => toggleFaq(index)}
                    className="w-full text-left rounded-xl bg-[#07070a] border border-white/5 p-6 flex items-center justify-between gap-4 text-white font-bold text-base hover:bg-zinc-900/50 transition-colors"
                  >
                    <span>{q}</span>
                    <Plus className={`size-5 text-cyan-400 transition-transform duration-300 ${openFaq === index ? "rotate-45" : ""}`} />
                  </button>
                  {openFaq === index && (
                    <div className="px-6 pb-6 pt-2 text-xs sm:text-sm text-zinc-400 leading-relaxed">
                      {a}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-white/5 bg-zinc-950 py-16 text-xs text-zinc-500">
        <div className="max-w-[1400px] mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-2.5">
            <div className="size-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-mono text-zinc-400">All systems operational</span>
          </div>
          <div className="text-zinc-500">
            &copy; {new Date().getFullYear()} Notexia Inc. All rights reserved. Made for Indian Students &amp; Engineers.
          </div>
          <div className="flex items-center gap-8">
            <a href="#features" className="hover:text-white transition-colors">Privacy</a>
            <a href="#features" className="hover:text-white transition-colors">Terms</a>
            <a href="#features" className="hover:text-white transition-colors">Security</a>
          </div>
        </div>
      </footer>
    </div>
  );
}