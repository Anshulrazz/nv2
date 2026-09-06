"use client";

import React, { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { BrainCircuit, BookOpen, Coins, Trophy, ArrowUpRight, Sparkles, CheckCircle2, Code2, Play } from "lucide-react";
import Link from "next/link";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

interface StepItem {
  id: string;
  stepNum: string;
  badge: string;
  title: string;
  desc: string;
  tagline: string;
  bullets: string[];
  ctaText: string;
  ctaLink: string;
  icon: React.ElementType;
}

const stepsData: StepItem[] = [
  {
    id: "step-ai",
    stepNum: "01",
    badge: "AI Study Copilot",
    title: "Instant LaTeX & Code Derivations in Real-Time",
    desc: "Ask complex physics, mathematics, or computer science doubts directly within your study flow. Powered by Anthropic Claude and OpenRouter, your queries turn into verifiable LaTeX steps, algorithmic blueprints, and exam mnemonics.",
    tagline: "24/7 Academic Intelligence for JEE, NEET, GATE & University",
    bullets: [
      "Derive differential equations and quantum transforms in seconds",
      "Inline KaTeX math formulas with clean copyable markdown",
      "Interactive code execution blueprints with time complexities",
    ],
    ctaText: "Try AI Doubt Solver",
    ctaLink: "/tools",
    icon: BrainCircuit,
  },
  {
    id: "step-editor",
    stepNum: "02",
    badge: "TipTap & Research Studio",
    title: "The Ultimate Markdown & Formula Note-Taking Engine",
    desc: "A rich distraction-free workspace built specifically for scholars. Embed live KaTeX equations, mermaid architecture diagrams, code highlights, and interactive flashcards. Export directly to publication-ready PDF or Markdown.",
    tagline: "Built for Engineers, Researchers and Competitive Aspirants",
    bullets: [
      "Full LaTeX block & inline math syntax ($$...$$)",
      "Mermaid.js flowchart & sequence diagram rendering",
      "Automatic table of contents & bidirectional linking",
    ],
    ctaText: "Explore Notes Studio",
    ctaLink: "/study-notes",
    icon: BookOpen,
  },
  {
    id: "step-coins",
    stepNum: "03",
    badge: "Creator Economy & Marketplace",
    title: "Learn, Teach & Monetize: 1 INR = 10 Coins",
    desc: "Every valuable note, project code repository, and masterclass course has real economic value on Notexia. Unlock premium assets using coins earned by contributing, or earn 70% direct royalty on everything you publish with instant bank payouts.",
    tagline: "Transparent 70/30 Creator Revenue Share with Bank Withdrawal",
    bullets: [
      "1 INR = 10 Coins across courses, projects, and notes",
      "Creators retain 70% of total coins with zero platform friction",
      "Direct bank & UPI withdrawal directly from your creator wallet",
    ],
    ctaText: "Explore Courses & Projects",
    ctaLink: "/courses",
    icon: Coins,
  },
  {
    id: "step-leaderboard",
    stepNum: "04",
    badge: "Gamified Academic Network",
    title: "Compete with Peer Batches & Earn Scholar Badges",
    desc: "Learning is no longer solitary. Publish verified lecture notes, solve community doubts, and level up your academic profile. Top student contributors across IITs, NITs, and central universities are ranked on live university leaderboards.",
    tagline: "Earn Activity Coins, Gold Badges & Academic Reputation",
    bullets: [
      "Live verified rankings fetched directly from MongoDB",
      "Gold, Silver, and Bronze scholar tiers with exclusive perks",
      "Custom student portfolio URL indexed directly on Google",
    ],
    ctaText: "View Live Leaderboard",
    ctaLink: "/feed",
    icon: Trophy,
  },
];

export function GsapPinnedShowcase() {
  const containerRef = useRef<HTMLDivElement>(null);
  const leftPinRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);
  const [activeStep, setActiveStep] = useState<number>(0);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const ctx = gsap.context(() => {
      // Setup ScrollTrigger for desktop pinning
      const mm = gsap.matchMedia();

      mm.add("(min-width: 1024px)", () => {
        const cards = gsap.utils.toArray<HTMLElement>(".showcase-card");

        cards.forEach((card, i) => {
          ScrollTrigger.create({
            trigger: card,
            start: "top center",
            end: "bottom center",
            onEnter: () => setActiveStep(i),
            onEnterBack: () => setActiveStep(i),
          });

          // Subtle scale and fade transition on each card
          gsap.fromTo(
            card,
            { opacity: 0.25, scale: 0.95, y: 30 },
            {
              opacity: 1,
              scale: 1,
              y: 0,
              duration: 0.8,
              ease: "power2.out",
              scrollTrigger: {
                trigger: card,
                start: "top 75%",
                end: "top 35%",
                scrub: 0.5,
              },
            }
          );
        });
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={containerRef} className="relative w-full py-24 md:py-36 bg-[#0A0806] border-y border-[#2E2118]/60">
      {/* Subtle background ambient mesh */}
      <div className="absolute top-1/2 left-0 w-96 h-96 -translate-y-1/2 bg-[#F5B429]/5 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-1/3 right-0 w-96 h-96 bg-[#F5941D]/5 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
          {/* Left Column: Pinned sticky info header on desktop */}
          <div className="lg:col-span-5">
            <div ref={leftPinRef} className="lg:sticky lg:top-32 space-y-8">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#F5B429]/10 border border-[#F5B429]/30 text-[#F5B429] text-xs font-mono uppercase tracking-widest">
                  <Sparkles className="w-3.5 h-3.5" />
                  Academic Operating System
                </div>

                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold font-display text-[#FAFAF8] tracking-tight leading-[1.1]">
                  Engineered for <span className="text-[#F5B429]">peak cognitive speed.</span>
                </h2>

                <p className="text-[#B8AFA6] text-base sm:text-lg leading-relaxed max-w-md">
                  A unified platform replacing fragmented tools: AI doubt solver, LaTeX research notes, coin-driven
                  creator economy, and live batch leaderboards.
                </p>
              </div>

              {/* Progress step indicators */}
              <div className="hidden lg:flex flex-col gap-3 pt-4 border-t border-[#2E2118]">
                {stepsData.map((step, idx) => {
                  const Icon = step.icon;
                  const isActive = activeStep === idx;
                  return (
                    <div
                      key={step.id}
                      className={`flex items-center gap-4 p-3 rounded-xl transition-all duration-500 border ${
                        isActive
                          ? "bg-[#150F0B] border-[#F5B429]/40 text-[#FAFAF8] shadow-[0_0_20px_rgba(245,180,41,0.1)]"
                          : "border-transparent text-[#8A8078] hover:text-[#B8AFA6]"
                      }`}
                    >
                      <div
                        className={`w-9 h-9 rounded-lg flex items-center justify-center font-mono text-xs font-bold transition-colors ${
                          isActive
                            ? "bg-[#F5B429] text-[#0A0806]"
                            : "bg-[#150F0B] border border-[#2E2118] text-[#8A8078]"
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-mono tracking-wider uppercase text-[#8A8078]">
                          Stage {step.stepNum}
                        </span>
                        <span className={`text-sm font-semibold ${isActive ? "text-[#FAFAF8]" : "text-[#B8AFA6]"}`}>
                          {step.badge}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column: Scroll-driven cards */}
          <div ref={cardsRef} className="lg:col-span-7 space-y-12 lg:space-y-24">
            {stepsData.map((step, index) => {
              const Icon = step.icon;
              return (
                <div
                  key={step.id}
                  className="showcase-card rounded-3xl bg-[#150F0B] border border-[#2E2118] p-6 sm:p-10 relative overflow-hidden transition-all duration-500 hover:border-[#F5B429]/30 shadow-2xl"
                >
                  {/* Glowing header accent line */}
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#F5B429]/60 to-transparent opacity-75" />

                  <div className="flex items-center justify-between gap-4 mb-6">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0A0806] border border-[#2E2118] text-[#F5B429] font-mono text-xs uppercase tracking-wider">
                      <Icon className="w-3.5 h-3.5" />
                      {step.badge}
                    </div>
                    <span className="font-mono text-2xl font-black text-[#2E2118] select-none">
                      {step.stepNum}
                    </span>
                  </div>

                  <h3 className="text-2xl sm:text-3xl font-bold font-display text-[#FAFAF8] tracking-tight leading-snug mb-3">
                    {step.title}
                  </h3>

                  <p className="text-sm font-mono text-[#F5B429] mb-4">
                    {step.tagline}
                  </p>

                  <p className="text-[#B8AFA6] text-sm sm:text-base leading-relaxed mb-6">
                    {step.desc}
                  </p>

                  {/* Bullet points */}
                  <div className="space-y-2.5 mb-8 border-y border-[#2E2118]/80 py-4">
                    {step.bullets.map((bullet, bIdx) => (
                      <div key={bIdx} className="flex items-start gap-3 text-xs sm:text-sm text-[#FAFAF8]">
                        <CheckCircle2 className="w-4 h-4 text-[#F5B429] shrink-0 mt-0.5" />
                        <span>{bullet}</span>
                      </div>
                    ))}
                  </div>

                  {/* CTA link button */}
                  <Link
                    href={step.ctaLink}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0A0806] border border-[#2E2118] hover:border-[#F5B429] text-[#FAFAF8] hover:text-[#F5B429] text-xs font-mono uppercase tracking-wider font-semibold transition-all duration-300 group"
                  >
                    <span>{step.ctaText}</span>
                    <ArrowUpRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
