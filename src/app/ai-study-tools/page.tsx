import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import {
  Sparkles,
  Bot,
  FileText,
  HelpCircle,
  Calendar,
  Layers,
  ArrowRight,
  CheckCircle2,
  Zap,
} from "lucide-react";
import { TrustHeader } from "@/components/public/TrustHeader";
import { TrustFooter } from "@/components/public/TrustFooter";
import { constructSeoMetadata } from "@/lib/seo/metadata";
import {
  buildSoftwareApplicationSchema,
  buildBreadcrumbSchema,
  buildFAQSchema,
} from "@/lib/seo/jsonld";

export const metadata: Metadata = constructSeoMetadata({
  title: "AI Study Tools for Students — Notes Generator, PDF Summarizer & Doubt Solver | Notexia",
  description:
    "Explore Notexia's suite of AI study tools for students. Generate AI notes, summarize PDFs in seconds, solve homework doubts 24/7, build smart revision plans, and create AI flashcards.",
  path: "/ai-study-tools",
  keywords: [
    "AI study tools",
    "AI study assistant",
    "AI notes generator",
    "AI note taking app",
    "AI PDF summarizer for students",
    "AI doubt solver",
    "AI question solver",
    "AI study planner",
    "AI revision planner",
    "AI flashcard generator",
    "smart study planner",
    "convert PDF to study notes with AI",
    "AI lecture notes",
    "AI learning assistant",
    "best AI study app for students in India",
  ],
});

const faqs = [
  {
    question: "What AI study tools does Notexia offer?",
    answer:
      "Notexia provides an all-in-one AI study toolkit including an AI Notes Generator, AI PDF Textbook Summarizer, 24/7 Step-by-Step Doubt Solver, AI Revision Planner, and AI Flashcard Generator built specifically for students and competitive exam aspirants.",
  },
  {
    question: "How does the AI PDF Summarizer for students work?",
    answer:
      "You can upload textbook chapters or research PDFs directly into Notexia. The AI parses complex equations, diagrams, and lengthy prose to generate concise bullet summaries, key formula sheets, and key concept checklists.",
  },
  {
    question: "Can I use Notexia's AI Doubt Solver for engineering and JEE questions?",
    answer:
      "Yes! Notexia's AI doubt solver handles complex physics, chemistry, mathematics, and computer science problems, generating step-by-step solutions with block LaTeX math notation.",
  },
  {
    question: "Are Notexia's AI study tools free for students?",
    answer:
      "Notexia offers free access to core AI note generation, doubt resolution threads, formula sheets, and study planning tools for all registered students.",
  },
];

const breadcrumbs = [
  { name: "Home", item: "/" },
  { name: "AI Study Tools", item: "/ai-study-tools" },
];

export default function AiStudyToolsPage() {
  return (
    <div className="min-h-screen bg-[#16261D] text-[#F3F0E4] font-sans selection:bg-[#F0C93B]/30 flex flex-col antialiased">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildSoftwareApplicationSchema()) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildBreadcrumbSchema(breadcrumbs)) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildFAQSchema(faqs)) }}
      />

      <TrustHeader title="AI STUDY TOOLS" />

      <main className="max-w-5xl w-full mx-auto px-4 sm:px-6 py-12 sm:py-16 space-y-16 flex-1">
        {/* HERO SECTION */}
        <section className="rounded-[2.5rem] bg-[#1A2D23]/90 border border-[#F3F0E4]/15 p-2 shadow-2xl">
          <div className="rounded-[calc(2.5rem-0.5rem)] bg-[#121F18] p-8 sm:p-12 space-y-6 shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)] relative overflow-hidden">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#F0C93B]/15 border border-[#F0C93B]/30 text-[#F0C93B] text-xs font-mono font-bold uppercase tracking-wider">
              <Sparkles className="size-3.5" /> AI-POWERED ACADEMIC SUITE
            </div>

            <h1 className="text-3xl sm:text-5xl font-black text-[#F3F0E4] tracking-tight font-heading leading-tight max-w-3xl">
              AI Study Assistant &amp; Notes Suite for Students
            </h1>

            {/* AEO Direct Answer Block */}
            <div className="p-5 rounded-2xl bg-[#16261D]/90 border border-[#F0C93B]/30 space-y-2">
              <p className="text-xs font-mono text-[#F0C93B] font-bold uppercase tracking-widest">
                DIRECT ANSWER / OVERVIEW
              </p>
              <p className="text-sm text-[#F3F0E4] leading-relaxed font-normal">
                Notexia&apos;s AI study suite equips students with intelligent note generation, instant step-by-step doubt resolution, PDF textbook summarization, automated flashcards, and smart revision scheduling aligned with Indian school and university syllabi (JEE, NEET, GATE, CBSE, and BTech).
              </p>
            </div>

            <div className="pt-2 flex flex-wrap items-center gap-4">
              <Link
                href="/signup"
                className="group rounded-full bg-[#F0C93B] hover:bg-[#F0C93B]/90 text-[#2A2118] font-bold text-sm px-7 py-3.5 inline-flex items-center gap-3 transition-all shadow-[0_0_20px_rgba(240,201,59,0.3)] font-heading"
              >
                <span>Try AI Tools Free</span>
                <ArrowRight className="size-4 text-[#2A2118] group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/tools/formula-sheets"
                className="rounded-full bg-[#1A2D23] hover:bg-[#1A2D23]/80 border border-[#F3F0E4]/20 text-[#F3F0E4] font-semibold text-sm px-6 py-3.5 inline-flex items-center gap-2 transition-all"
              >
                <span>Formula Sheets</span>
              </Link>
            </div>
          </div>
        </section>

        {/* AI CAPABILITIES GRID */}
        <section className="space-y-8">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-[#8FC3DE] bg-[#8FC3DE]/10 px-3.5 py-1.5 rounded-full border border-[#8FC3DE]/30">
              CORE AI FEATURES
            </span>
            <h2 className="text-3xl font-black text-white font-heading">
              Smart Tools Built for High-Performance Learning
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              {
                icon: FileText,
                title: "AI Notes & PDF Summarizer",
                desc: "Convert lengthy textbook PDFs, lecture slides, and YouTube study videos into structured markdown notes with LaTeX formulas and bullet points.",
                color: "#8FC3DE",
              },
              {
                icon: HelpCircle,
                title: "24/7 AI Doubt Solver",
                desc: "Ask tricky numericals or conceptual questions in Physics, Math, Chemistry, and Computer Science for instant step-by-step explanations.",
                color: "#F0C93B",
              },
              {
                icon: Calendar,
                title: "Smart AI Revision Planner",
                desc: "Generate personalized study schedules and spaced-repetition revision checklists aligned with exam deadlines (JEE, NEET, GATE, Semester Exams).",
                color: "#F28B6E",
              },
              {
                icon: Layers,
                title: "AI Flashcards & Summaries",
                desc: "Extract key terms, definitions, and active-recall flashcard decks directly from your study notes for fast exam revision.",
                color: "#C9A9E0",
              },
            ].map((tool, idx) => (
              <div
                key={idx}
                className="rounded-[2rem] bg-[#1A2D23]/90 border border-[#F3F0E4]/15 p-2 shadow-xl"
              >
                <div className="rounded-[calc(2rem-0.5rem)] bg-[#121F18] p-8 space-y-4 h-full flex flex-col justify-between">
                  <div className="space-y-3">
                    <div
                      className="size-12 rounded-2xl flex items-center justify-center"
                      style={{ backgroundColor: `${tool.color}15`, borderColor: `${tool.color}30`, borderWidth: 1 }}
                    >
                      <tool.icon className="size-6" style={{ color: tool.color }} />
                    </div>
                    <h3 className="text-xl font-bold text-white font-heading">{tool.title}</h3>
                    <p className="text-[#9FAEA1] text-sm leading-relaxed font-light">{tool.desc}</p>
                  </div>
                  <div className="pt-4 border-t border-[#F3F0E4]/10">
                    <Link
                      href="/signup"
                      className="text-xs font-mono font-bold uppercase tracking-wider text-[#F0C93B] hover:underline inline-flex items-center gap-1.5"
                    >
                      <span>Explore Feature</span> &rarr;
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* FREQUENTLY ASKED QUESTIONS */}
        <section className="space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl font-black text-white font-heading">
              Frequently Asked Questions
            </h2>
            <p className="text-xs text-[#9FAEA1] font-light">
              Common questions about Notexia&apos;s AI study suite.
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <div
                key={idx}
                className="rounded-2xl bg-[#1A2D23]/80 border border-[#F3F0E4]/15 p-6 space-y-2 shadow-lg"
              >
                <h3 className="text-base font-bold text-white font-heading flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-[#F0C93B] shrink-0" />
                  {faq.question}
                </h3>
                <p className="text-xs sm:text-sm text-[#9FAEA1] leading-relaxed font-light pl-6">
                  {faq.answer}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA BANNER */}
        <section className="rounded-2xl border border-[#F3F0E4]/15 bg-[#1A2D23] p-8 text-center space-y-4 shadow-2xl">
          <h2 className="text-2xl font-bold text-white font-heading">Start Studying Smarter with AI</h2>
          <p className="text-sm text-[#9FAEA1] max-w-xl mx-auto font-light">
            Join thousands of Indian scholars using Notexia for AI note generation, doubt solving, and revision.
          </p>
          <div>
            <Link
              href="/signup"
              className="rounded-full bg-[#F0C93B] hover:bg-[#F0C93B]/90 text-[#2A2118] font-bold text-sm px-8 py-3.5 inline-flex items-center gap-2 shadow-lg transition-all font-heading"
            >
              Get Started Free
            </Link>
          </div>
        </section>
      </main>

      <TrustFooter />
    </div>
  );
}
