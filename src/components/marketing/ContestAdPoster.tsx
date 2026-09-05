"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Trophy,
  Smartphone,
  Laptop,
  Sparkles,
  Upload,
  BookOpen,
  MessageSquare,
  Users,
  Award,
  ArrowRight,
  CheckCircle2,
  Copy,
  Check,
  Flame,
  Gift,
  Clock,
  ShieldCheck,
  Share2,
  ExternalLink,
  ChevronRight,
  Calculator,
} from "lucide-react";

export function ContestAdPoster() {
  const [copied, setCopied] = useState(false);
  const [activeStep, setActiveStep] = useState<number>(1);
  const [adFormat, setAdFormat] = useState<"full" | "banner" | "card">("full");

  // Calculator state
  const [notesCount, setNotesCount] = useState<number>(5);
  const [blogsCount, setBlogsCount] = useState<number>(2);
  const [repliesCount, setRepliesCount] = useState<number>(15);
  const [referralsCount, setReferralsCount] = useState<number>(4);

  const calculatedPoints =
    notesCount * 150 + blogsCount * 250 + repliesCount * 30 + referralsCount * 150 + 500; // 500 bonus for signing up

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText("https://notexia.in/signup?campaign=apple-flagship-giveaway");
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const steps = [
    {
      step: 1,
      title: "Sign Up & Upload Notes & Projects",
      shortTitle: "Upload Notes & Projects",
      badge: "+150 pts per upload",
      icon: Upload,
      color: "from-[#F5B429] to-[#F5941D]",
      desc: "Create your free Notexia scholar account and upload your handwritten notes, LaTeX cheat sheets, semester project source codes, and lab practicals.",
      perks: [
        "Instant +500 Welcome Coins on signup",
        "150 Activity Points per approved note or project",
        "Supports PDF, Markdown, LaTeX & GitHub repositories",
      ],
      actionLabel: "Start Uploading Notes",
      href: "/signup",
    },
    {
      step: 2,
      title: "Start Writing Blogs",
      shortTitle: "Write Blogs",
      badge: "+250 pts per article",
      icon: BookOpen,
      color: "from-[#F5941D] to-[#EA580C]",
      desc: "Publish in-depth academic blogs, exam strategy guides, engineering tutorials, and research summaries under your verified Notexia author profile.",
      perks: [
        "250 Points per verified blog publication",
        "Rank on Google search with your custom author URL",
        "Bonus coins when students bookmark your guides",
      ],
      actionLabel: "Explore Blog Creator",
      href: "/blogs",
    },
    {
      step: 3,
      title: "Start Interacting With Others",
      shortTitle: "Interact & Solve Doubts",
      badge: "+30 pts per interaction",
      icon: MessageSquare,
      color: "from-[#FCD34D] to-[#F5B429]",
      desc: "Engage with students across India in our subject forums. Answer homework doubts, review code solutions, upvote helpful posts, and join study rooms.",
      perks: [
        "30 Points per helpful forum response",
        "100 Points when your solution is marked 'Verified Answer'",
        "Climb the weekly peer-mentorship rank",
      ],
      actionLabel: "Join Forum Discussions",
      href: "/forums",
    },
    {
      step: 4,
      title: "Refer to Your Friends",
      shortTitle: "Refer Friends",
      badge: "+150 pts + 10% bonus",
      icon: Users,
      color: "from-[#F5941D] to-[#D97706]",
      desc: "Share your unique Notexia invitation link with classmates, batch WhatsApp groups, and university clubs to accelerate your leaderboard climb.",
      perks: [
        "150 Points for every friend who signs up",
        "10% lifetime coin bonus on your friends' contributions",
        "Special Campus Ambassador recognition badges",
      ],
      actionLabel: "Get Your Referral Link",
      href: "/signup",
    },
    {
      step: 5,
      title: "Top Contributor Wins iPhone or MacBook",
      shortTitle: "Win Flagship Prizes!",
      badge: "Grand Prize Tier",
      icon: Trophy,
      color: "from-[#F7C948] to-[#F5941D]",
      desc: "Season 1 All-India Contributor Championship closes at the end of the semester. The highest-ranking scholars will take home Apple's finest hardware!",
      perks: [
        "🥇 Rank 1: Apple MacBook Air M3 (15-inch, Midnight finish)",
        "🥈 Rank 2: Apple iPhone 16 Pro (Natural Titanium, A18 Pro)",
        "🥉 Top 3–10: Apple AirPods Pro + 5,000 Coins + Pro Lifetime",
      ],
      actionLabel: "View Live Leaderboard",
      href: "/signup",
    },
  ];

  const topContributors = [
    { rank: 1, name: "Rohan Kulkarni", college: "IIT Bombay", pts: "5,420", prize: "MacBook Air M3 Tier" },
    { rank: 2, name: "Priya Sundaram", college: "BITS Pilani", pts: "4,910", prize: "iPhone 16 Pro Tier" },
    { rank: 3, name: "Aarav Sharma", college: "NIT Trichy", pts: "4,350", prize: "AirPods Pro Tier" },
    { rank: 4, name: "Sneha Nair", college: "DTU Delhi", pts: "3,890", prize: "Scholar Kit Tier" },
  ];

  return (
    <section id="contest-poster" className="py-16 sm:py-24 relative overflow-hidden bg-[#0A0806] text-[#FAFAF8]">
      {/* Dynamic Background Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-[#F5B429]/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[450px] h-[450px] bg-[#F5941D]/10 rounded-full blur-[130px] pointer-events-none" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10 space-y-12">
        {/* Section Header & Subtitle */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#F5B429]/10 border border-[#F5B429]/30 text-[#F5B429] text-xs font-mono font-semibold uppercase tracking-widest shadow-[0_0_20px_rgba(245,180,41,0.2)] animate-pulse">
            <Gift className="w-3.5 h-3.5" />
            Official Creator &amp; Scholar Championship
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
            Get a Chance to Win an{" "}
            <span className="bg-gradient-to-r from-[#F7C948] via-[#F5B429] to-[#F5941D] bg-clip-text text-transparent">
              iPhone 16 Pro or MacBook Air
            </span>
          </h2>
          <p className="text-[#A89F91] text-base sm:text-lg leading-relaxed">
            The biggest academic incentive program in India. Contribute your knowledge to{" "}
            <strong className="text-[#FAFAF8] font-semibold">notexia.in</strong>, help thousands of peers study better,
            and walk away with Apple flagship hardware.
          </p>
        </div>

        {/* ── AD FORMAT CONTROLS (Website Ads & Poster Mode) ── */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-3 rounded-2xl bg-[#150F0B]/90 border border-[#2E2118] backdrop-blur-md">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-[#8A8078] uppercase tracking-wider pl-2 hidden sm:inline">
              Display Mode:
            </span>
            <div className="flex items-center gap-1 bg-[#0A0806] p-1 rounded-xl border border-[#2E2118]">
              <button
                type="button"
                onClick={() => setAdFormat("full")}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  adFormat === "full"
                    ? "bg-[#F5B429] text-[#150F0B] font-bold shadow-[0_0_12px_rgba(245,180,41,0.3)]"
                    : "text-[#A89F91] hover:text-white"
                }`}
              >
                🌟 Full Campaign Hub
              </button>
              <button
                type="button"
                onClick={() => setAdFormat("card")}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  adFormat === "card"
                    ? "bg-[#F5B429] text-[#150F0B] font-bold shadow-[0_0_12px_rgba(245,180,41,0.3)]"
                    : "text-[#A89F91] hover:text-white"
                }`}
              >
                🖼️ Ad Poster View
              </button>
              <button
                type="button"
                onClick={() => setAdFormat("banner")}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  adFormat === "banner"
                    ? "bg-[#F5B429] text-[#150F0B] font-bold shadow-[0_0_12px_rgba(245,180,41,0.3)]"
                    : "text-[#A89F91] hover:text-white"
                }`}
              >
                🏷️ Website Ribbon Ad
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyLink}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#241811] hover:bg-[#2E2118] text-xs font-mono text-[#F5B429] border border-[#F5B429]/30 transition-all active:scale-95"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-green-400" />
                  <span className="text-green-400">Contest Link Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Ad URL</span>
                </>
              )}
            </button>
            <Link
              href="/signup"
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-gradient-to-r from-[#F7C948] to-[#F5941D] text-[#150F0B] font-bold text-xs hover:brightness-110 transition-all shadow-[0_0_15px_rgba(245,180,41,0.3)]"
            >
              <span>Enter Contest</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* ── BANNER AD VIEW (728x90 style preview for ads on notexia.in) ── */}
        {adFormat === "banner" && (
          <div className="rounded-2xl bg-gradient-to-r from-[#150F0B] via-[#241811] to-[#150F0B] border-2 border-[#F5B429]/40 p-4 sm:p-6 shadow-[0_15px_50px_rgba(245,180,41,0.15)] relative overflow-hidden transition-all duration-300">
            <div className="absolute -right-12 -top-12 w-48 h-48 bg-[#F5B429]/15 rounded-full blur-3xl pointer-events-none" />
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#F7C948] to-[#F5941D] p-0.5 shadow-[0_0_20px_rgba(245,180,41,0.4)] shrink-0 flex items-center justify-center">
                  <div className="w-full h-full rounded-[14px] bg-[#0A0806] flex items-center justify-center text-[#F5B429]">
                    <Trophy className="w-7 h-7" />
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#F5B429]/20 text-[#F5B429] border border-[#F5B429]/30">
                      Website Ad · notexia.in
                    </span>
                    <span className="text-xs text-[#8A8078]">Active Season 1</span>
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-white mt-1">
                    Upload Notes, Write Blogs &amp;{" "}
                    <span className="text-[#F5B429]">Win an iPhone 16 Pro or MacBook!</span>
                  </h3>
                  <p className="text-xs text-[#A89F91] hidden sm:block">
                    5 Easy Steps: Upload Notes → Write Blogs → Answer Doubts → Refer Friends → Top Contributor Wins.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <div className="text-right hidden lg:block">
                  <div className="text-xs font-mono text-[#F5B429]">Top Prize: MacBook Air M3</div>
                  <div className="text-[11px] text-[#8A8078]">Runner Up: iPhone 16 Pro</div>
                </div>
                <Link
                  href="/signup"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#F7C948] to-[#F5941D] text-[#150F0B] font-bold text-xs sm:text-sm hover:brightness-110 transition-all shadow-[0_0_20px_rgba(245,180,41,0.35)] flex items-center gap-2"
                >
                  <span>Claim 500 Coins &amp; Enter</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* ── VISUAL AD POSTER VIEW (High-impact poster for ads on notexia.in) ── */}
        {adFormat === "card" && (
          <div className="max-w-4xl mx-auto rounded-3xl bg-[#150F0B] border border-[#F5B429]/40 p-6 sm:p-10 shadow-[0_30px_90px_rgba(0,0,0,0.9)] relative overflow-hidden transition-all duration-300">
            <div className="absolute top-0 right-0 w-80 h-80 bg-[#F5B429]/15 rounded-full blur-[100px] pointer-events-none" />
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
              {/* Left Details */}
              <div className="md:col-span-7 space-y-6">
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F5B429]/15 border border-[#F5B429]/30 text-[#F5B429] text-xs font-mono font-bold">
                    <Sparkles className="w-3.5 h-3.5" />
                    NOTEXIA.IN OFFICIAL AD POSTER
                  </div>
                  <h3 className="text-2xl sm:text-4xl font-black text-white leading-tight">
                    Get a Chance to Win an{" "}
                    <span className="text-[#F5B429] underline decoration-[#F5B429]/50 underline-offset-4">
                      iPhone or MacBook
                    </span>
                  </h3>
                  <p className="text-sm text-[#A89F91]">
                    Empower your fellow students by sharing knowledge. Every contribution gives you tickets &amp; activity
                    points towards the flagship tech pool!
                  </p>
                </div>

                {/* 5 Points list */}
                <div className="space-y-2.5">
                  {[
                    "1. Sign Up and start Uploading notes & projects",
                    "2. Start writing blogs",
                    "3. Start Interacting with others (forums & doubts)",
                    "4. Refer to your friends (+150 pts each)",
                    "5. Top Contributor can get chance to win iPhone or MacBook!",
                  ].map((item, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 p-2.5 rounded-xl bg-[#0A0806] border border-[#2E2118] text-xs sm:text-sm font-medium text-white"
                    >
                      <div className="w-6 h-6 rounded-full bg-[#F5B429]/20 text-[#F5B429] font-mono font-bold flex items-center justify-center shrink-0 border border-[#F5B429]/40">
                        {i + 1}
                      </div>
                      <span className={i === 4 ? "text-[#F5B429] font-bold" : ""}>{item}</span>
                    </div>
                  ))}
                </div>

                <div className="pt-2 flex flex-wrap items-center gap-4">
                  <Link
                    href="/signup"
                    className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#F7C948] to-[#F5941D] text-[#150F0B] font-bold text-sm hover:brightness-110 transition-all shadow-[0_0_20px_rgba(245,180,41,0.35)] flex items-center gap-2"
                  >
                    <span>Start Free Now</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="px-4 py-3 rounded-xl bg-[#241811] hover:bg-[#2E2118] border border-[#2E2118] text-xs font-mono text-[#FAFAF8] transition-all"
                  >
                    {copied ? "Link Copied!" : "Share Poster Link"}
                  </button>
                </div>
              </div>

              {/* Right Device Visual */}
              <div className="md:col-span-5 relative">
                <div className="relative rounded-2xl overflow-hidden border border-[#2E2118] bg-[#0A0806] shadow-2xl group">
                  <div className="relative aspect-[3/4] w-full">
                    <Image
                      src="/images/contest/poster-bg.jpg"
                      alt="MacBook Air and iPhone 16 Pro Grand Prizes"
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0A0806] via-transparent to-transparent opacity-80" />
                    <div className="absolute bottom-4 left-4 right-4 p-3 rounded-xl bg-[#150F0B]/90 border border-[#F5B429]/40 backdrop-blur-md text-center">
                      <div className="text-xs font-mono text-[#F5B429] font-bold uppercase tracking-wider">
                        Season 1 Grand Prizes
                      </div>
                      <div className="text-sm font-bold text-white">MacBook Air M3 &amp; iPhone 16 Pro</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── FULL CAMPAIGN HUB (Default Interactive Experience) ── */}
        {adFormat === "full" && (
          <div className="space-y-12">
            {/* 1. Grand Prizes Showcase Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Prize 1: MacBook Air */}
              <div className="rounded-3xl bg-[#150F0B] border-2 border-[#F5B429]/50 p-6 relative overflow-hidden shadow-[0_20px_50px_rgba(245,180,41,0.15)] flex flex-col justify-between group hover:border-[#F5B429] transition-all">
                <div className="absolute top-0 right-0 px-4 py-1.5 rounded-bl-2xl bg-gradient-to-r from-[#F7C948] to-[#F5941D] text-[#150F0B] font-mono font-bold text-[11px] tracking-wider uppercase shadow-md">
                  Rank 1 Grand Prize
                </div>
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-[#F5B429]/20 border border-[#F5B429]/40 flex items-center justify-center text-[#F5B429]">
                    <Laptop className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Apple MacBook Air M3</h3>
                    <p className="text-xs text-[#F5B429] font-mono mt-0.5">15-inch Liquid Retina · Midnight</p>
                  </div>
                  <p className="text-xs text-[#A89F91] leading-relaxed">
                    Awarded to the #1 All-India Top Contributor on Notexia. Liquid Retina display, M3 silicon, 18-hour
                    battery life, and uncompromised academic power.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-[#2E2118] flex items-center justify-between text-xs text-[#8A8078]">
                  <span>+ All-India Contributor Trophy</span>
                  <span className="text-[#F5B429] font-semibold">5,000+ pts threshold</span>
                </div>
              </div>

              {/* Prize 2: iPhone 16 Pro */}
              <div className="rounded-3xl bg-[#150F0B] border border-[#2E2118] hover:border-[#F5B429]/50 p-6 relative overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.6)] flex flex-col justify-between transition-all">
                <div className="absolute top-0 right-0 px-4 py-1.5 rounded-bl-2xl bg-[#241811] text-[#F5941D] border-l border-b border-[#2E2118] font-mono font-bold text-[11px] tracking-wider uppercase">
                  Rank 2 Prize
                </div>
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-[#F5941D]/20 border border-[#F5941D]/40 flex items-center justify-center text-[#F5941D]">
                    <Smartphone className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Apple iPhone 16 Pro</h3>
                    <p className="text-xs text-[#F5941D] font-mono mt-0.5">Grade 5 Titanium · A18 Pro Chip</p>
                  </div>
                  <p className="text-xs text-[#A89F91] leading-relaxed">
                    Awarded to the 2nd Highest Contributor. Pro camera system, aerospace-grade titanium frame, and
                    groundbreaking mobile AI capability.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-[#2E2118] flex items-center justify-between text-xs text-[#8A8078]">
                  <span>+ Gold Scholar Medallion</span>
                  <span className="text-[#F5941D] font-semibold">4,000+ pts threshold</span>
                </div>
              </div>

              {/* Prize 3: Top 10 Swag & Gadgets */}
              <div className="rounded-3xl bg-[#150F0B] border border-[#2E2118] hover:border-[#F5B429]/50 p-6 relative overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.6)] flex flex-col justify-between transition-all">
                <div className="absolute top-0 right-0 px-4 py-1.5 rounded-bl-2xl bg-[#241811] text-[#A89F91] border-l border-b border-[#2E2118] font-mono font-bold text-[11px] tracking-wider uppercase">
                  Ranks 3 – 10
                </div>
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-[#241811] border border-[#2E2118] flex items-center justify-center text-[#FCD34D]">
                    <Award className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Apple AirPods &amp; Kit</h3>
                    <p className="text-xs text-[#FCD34D] font-mono mt-0.5">AirPods Pro 2 + 5,000 Coins + Pro</p>
                  </div>
                  <p className="text-xs text-[#A89F91] leading-relaxed">
                    Active Noise Cancellation AirPods Pro, physical Notexia Scholar developer hoodie, mechanical
                    keyboards, and lifetime Notexia Pro access.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-[#2E2118] flex items-center justify-between text-xs text-[#8A8078]">
                  <span>+ 8 Winners Guaranteed</span>
                  <span className="text-[#FCD34D] font-semibold">Top 10 Leaderboard</span>
                </div>
              </div>
            </div>

            {/* 2. The 5 Core Steps to Win (Interactive Stepper) */}
            <div className="rounded-3xl bg-[#150F0B] border border-[#2E2118] p-6 sm:p-10 shadow-[0_25px_70px_rgba(0,0,0,0.8)] relative overflow-hidden">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-8 border-b border-[#2E2118]">
                <div>
                  <span className="text-xs font-mono uppercase tracking-widest text-[#F5B429]">
                    The 5 Contribution Pillars
                  </span>
                  <h3 className="text-2xl sm:text-3xl font-bold text-white mt-1">
                    How You Can Qualify to Win
                  </h3>
                </div>
                <div className="flex items-center gap-2 text-xs font-mono text-[#A89F91] bg-[#0A0806] px-3.5 py-1.5 rounded-full border border-[#2E2118]">
                  <Clock className="w-3.5 h-3.5 text-[#F5B429]" />
                  <span>Season 1 Closes at Semester End</span>
                </div>
              </div>

              {/* Step Navigation Pills */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 my-8">
                {steps.map((s) => {
                  const Icon = s.icon;
                  const isSelected = activeStep === s.step;
                  return (
                    <button
                      key={s.step}
                      type="button"
                      onClick={() => setActiveStep(s.step)}
                      className={`p-3 rounded-2xl border text-left transition-all relative flex flex-col justify-between gap-2 ${
                        isSelected
                          ? "bg-[#241811] border-[#F5B429] shadow-[0_0_20px_rgba(245,180,41,0.2)]"
                          : "bg-[#0A0806] border-[#2E2118] hover:border-[#2E2118]/80 text-[#8A8078] hover:text-[#FAFAF8]"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className={`w-6 h-6 rounded-full font-mono text-xs font-bold flex items-center justify-center ${
                            isSelected
                              ? "bg-[#F5B429] text-[#150F0B]"
                              : "bg-[#150F0B] text-[#8A8078] border border-[#2E2118]"
                          }`}
                        >
                          {s.step}
                        </span>
                        <Icon className={`w-4 h-4 ${isSelected ? "text-[#F5B429]" : "text-[#8A8078]"}`} />
                      </div>
                      <div className="text-xs font-semibold leading-snug line-clamp-2 text-white">
                        {s.shortTitle}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Active Step Detailed Card */}
              {(() => {
                const current = steps.find((s) => s.step === activeStep) || steps[0];
                const Icon = current.icon;
                return (
                  <div className="rounded-2xl bg-[#0A0806] border border-[#2E2118] p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                    <div className="lg:col-span-7 space-y-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#F7C948] to-[#F5941D] text-[#150F0B] flex items-center justify-center font-bold font-mono">
                          {current.step}
                        </div>
                        <div>
                          <div className="text-xs font-mono text-[#F5B429] uppercase tracking-wider">
                            Step {current.step} of 5
                          </div>
                          <h4 className="text-xl sm:text-2xl font-bold text-white">{current.title}</h4>
                        </div>
                      </div>

                      <p className="text-sm sm:text-base text-[#A89F91] leading-relaxed">{current.desc}</p>

                      <div className="space-y-2.5 pt-2">
                        {current.perks.map((perk, i) => (
                          <div key={i} className="flex items-center gap-2.5 text-xs sm:text-sm text-[#FAFAF8]">
                            <CheckCircle2 className="w-4 h-4 text-[#F5B429] shrink-0" />
                            <span>{perk}</span>
                          </div>
                        ))}
                      </div>

                      <div className="pt-4 flex items-center gap-4">
                        <Link
                          href={current.href}
                          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#F7C948] to-[#F5941D] text-[#150F0B] font-bold text-xs sm:text-sm hover:brightness-110 transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(245,180,41,0.25)]"
                        >
                          <span>{current.actionLabel}</span>
                          <ArrowRight className="w-4 h-4" />
                        </Link>
                        {activeStep < 5 && (
                          <button
                            type="button"
                            onClick={() => setActiveStep(activeStep + 1)}
                            className="text-xs font-mono text-[#A89F91] hover:text-[#F5B429] transition-colors flex items-center gap-1"
                          >
                            <span>Next Step</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Step Visual Summary Box */}
                    <div className="lg:col-span-5 rounded-2xl bg-[#150F0B] border border-[#2E2118] p-5 space-y-4">
                      <div className="flex items-center justify-between border-b border-[#2E2118] pb-3">
                        <span className="text-xs font-mono text-[#8A8078]">Points Multiplier</span>
                        <span className="text-xs font-mono font-bold text-[#F5B429] px-2 py-0.5 rounded bg-[#F5B429]/10 border border-[#F5B429]/30">
                          {current.badge}
                        </span>
                      </div>

                      {/* Device Render Visual */}
                      <div className="relative aspect-video rounded-xl overflow-hidden border border-[#2E2118] bg-[#0A0806]">
                        <Image
                          src="/images/contest/devices.jpg"
                          alt="MacBook and iPhone Prizes"
                          fill
                          className="object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0A0806]/80 via-transparent to-transparent" />
                        <div className="absolute bottom-2 left-3 right-3 text-center">
                          <span className="text-[11px] font-mono text-[#FAFAF8] bg-[#150F0B]/80 px-2 py-1 rounded-md border border-[#2E2118]">
                            Apple Flagship Hardware Pool
                          </span>
                        </div>
                      </div>

                      <div className="text-[11px] text-[#8A8078] leading-tight text-center">
                        All verified contributions are synced continuously to the All-India Leaderboard.
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* 3. Interactive Score & Rank Simulator */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Calculator Box */}
              <div className="lg:col-span-7 rounded-3xl bg-[#150F0B] border border-[#2E2118] p-6 sm:p-8 space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#241811] border border-[#2E2118] text-[#F5B429] flex items-center justify-center">
                    <Calculator className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-white">Points &amp; Prize Potential Calculator</h4>
                    <p className="text-xs text-[#A89F91]">Estimate how fast you can climb the leaderboard to Rank 1</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Notes Slider */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-[#FAFAF8]">Notes &amp; Projects Uploaded:</span>
                      <span className="text-[#F5B429] font-bold">{notesCount} docs (+{notesCount * 150} pts)</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="30"
                      value={notesCount}
                      onChange={(e) => setNotesCount(parseInt(e.target.value) || 0)}
                      className="w-full accent-[#F5B429] cursor-pointer"
                    />
                  </div>

                  {/* Blogs Slider */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-[#FAFAF8]">Blogs &amp; Guides Published:</span>
                      <span className="text-[#F5941D] font-bold">{blogsCount} posts (+{blogsCount * 250} pts)</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="15"
                      value={blogsCount}
                      onChange={(e) => setBlogsCount(parseInt(e.target.value) || 0)}
                      className="w-full accent-[#F5941D] cursor-pointer"
                    />
                  </div>

                  {/* Forum Doubts Slider */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-[#FAFAF8]">Doubts Solved &amp; Interactions:</span>
                      <span className="text-[#FCD34D] font-bold">{repliesCount} replies (+{repliesCount * 30} pts)</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="60"
                      value={repliesCount}
                      onChange={(e) => setRepliesCount(parseInt(e.target.value) || 0)}
                      className="w-full accent-[#FCD34D] cursor-pointer"
                    />
                  </div>

                  {/* Referrals Slider */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-[#FAFAF8]">Friends &amp; Batchmates Referred:</span>
                      <span className="text-[#F5B429] font-bold">{referralsCount} friends (+{referralsCount * 150} pts)</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="25"
                      value={referralsCount}
                      onChange={(e) => setReferralsCount(parseInt(e.target.value) || 0)}
                      className="w-full accent-[#F5B429] cursor-pointer"
                    />
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-[#0A0806] border border-[#2E2118] flex items-center justify-between">
                  <div>
                    <div className="text-[11px] font-mono text-[#8A8078]">Total Projected Points</div>
                    <div className="text-2xl sm:text-3xl font-extrabold text-[#F5B429]">
                      {calculatedPoints.toLocaleString()} <span className="text-xs text-[#FAFAF8] font-normal">pts</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[11px] font-mono text-[#8A8078]">Estimated Standing</div>
                    <div className="text-xs sm:text-sm font-bold text-white">
                      {calculatedPoints >= 5000 ? (
                        <span className="text-green-400">🏆 Top 1 (MacBook Air Tier)</span>
                      ) : calculatedPoints >= 3800 ? (
                        <span className="text-[#F5B429]">📱 Top 2–3 (iPhone 16 Pro Tier)</span>
                      ) : calculatedPoints >= 2000 ? (
                        <span className="text-[#FCD34D]">🎧 Top 10 (AirPods Tier)</span>
                      ) : (
                        <span className="text-[#A89F91]">Rising Scholar Tier</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Live Leaderboard Snapshot */}
              <div className="lg:col-span-5 rounded-3xl bg-[#150F0B] border border-[#2E2118] p-6 sm:p-8 space-y-5">
                <div className="flex items-center justify-between border-b border-[#2E2118] pb-4">
                  <div className="flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-[#F5B429]" />
                    <h4 className="text-base font-bold text-white">Current All-India Top Rankers</h4>
                  </div>
                  <span className="text-[10px] font-mono text-green-400 bg-green-950/40 px-2 py-0.5 rounded border border-green-800/40">
                    ● Live
                  </span>
                </div>

                <div className="space-y-2.5">
                  {topContributors.map((c) => (
                    <div
                      key={c.rank}
                      className={`flex items-center justify-between p-3 rounded-xl border text-xs ${
                        c.rank === 1
                          ? "bg-[#241811] border-[#F5B429]/40 shadow-[0_0_15px_rgba(245,180,41,0.15)]"
                          : "bg-[#0A0806] border-[#2E2118]"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-6 h-6 rounded-full font-mono font-bold flex items-center justify-center shrink-0 ${
                            c.rank === 1
                              ? "bg-[#F5B429] text-[#150F0B]"
                              : c.rank === 2
                              ? "bg-[#F5941D] text-white"
                              : "bg-[#150F0B] text-[#8A8078] border border-[#2E2118]"
                          }`}
                        >
                          {c.rank}
                        </div>
                        <div>
                          <div className="font-semibold text-white">{c.name}</div>
                          <div className="text-[10px] text-[#8A8078]">{c.college}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono font-bold text-[#F5B429]">{c.pts} pts</div>
                        <div className="text-[10px] text-[#A89F91]">{c.prize}</div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-2">
                  <Link
                    href="/signup"
                    className="w-full py-3 rounded-xl bg-[#241811] hover:bg-[#2E2118] border border-[#F5B429]/30 text-xs font-mono font-bold text-[#F5B429] transition-all flex items-center justify-center gap-2"
                  >
                    <span>Sign Up to Claim Your Rank</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
