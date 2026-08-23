import React from "react";
import Link from "next/link";
import { Cpu, ShieldCheck, AlertTriangle, BookOpen, Bot } from "lucide-react";
import { TrustHeader } from "@/components/public/TrustHeader";
import { TrustFooter } from "@/components/public/TrustFooter";
import { LegalNav } from "@/components/public/LegalNav";

export const metadata = {
  title: "AI Copilot & Academic Integrity Policy",
  description:
    "Review Notexia's AI usage guidelines, academic honor code, LLM isolation protocols, and responsible AI study assistance principles.",
};

export default function AIUsagePolicyPage() {
  return (
    <div className="min-h-screen bg-transparent text-[#FAFAF8] font-sans selection:bg-[#F5B429]/30 flex flex-col antialiased">
      <TrustHeader title="AI USAGE POLICY" />
      <LegalNav />

      <main className="max-w-4xl w-full mx-auto px-4 sm:px-6 py-12 space-y-10 flex-1">
        {/* Header Hero Section */}
        <div className="space-y-4 border-b border-[#F3F0E4]/15 pb-8">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#F0C93B]/15 border border-[#F0C93B]/30 text-[#F0C93B] text-xs font-mono font-bold uppercase tracking-wider">
            <Cpu className="size-3.5" /> RESPONSIBLE AI ASSISTANCE
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight font-heading">
            AI Usage &amp; Academic Integrity Policy
          </h1>
          <p className="text-[#9FAEA1] text-sm sm:text-base leading-relaxed max-w-3xl font-light">
            Notexia integrates artificial intelligence to augment student learning, solve complex STEM doubts, and organize notes. This policy outlines acceptable AI copilot usage, data isolation guarantees, and academic honesty expectations.
          </p>
          <div className="text-[11px] font-mono text-[#9FAEA1]/80">
            Last Updated: August 7, 2026 • Effective Date: January 1, 2026
          </div>
        </div>

        {/* Content Cards */}
        <div className="space-y-8 text-sm leading-relaxed">
          {/* Approved Uses */}
          <section className="rounded-[2rem] bg-[#1A2D23]/90 border border-[#F3F0E4]/15 p-2 shadow-xl">
            <div className="rounded-[calc(2rem-0.5rem)] bg-[#121F18] p-6 sm:p-8 space-y-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2 font-heading">
                <Bot className="size-5 text-[#8FC3DE]" /> 1. Approved AI Study Use Cases
              </h2>
              <p className="text-[#9FAEA1] font-light">
                Notexia AI copilot tools are designed for supplemental study assistance. Recommended uses include:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-[#F3F0E4] font-light">
                <li>Generating step-by-step mathematical breakdowns and physics equation explanations.</li>
                <li>Summarizing lengthy academic lecture transcripts and creating flashcard revisions.</li>
                <li>Drafting study schedules, formulas cheatsheets, and concept analogies.</li>
                <li>Explaining complex code snippets, debugging syntax, and translating technical terms.</li>
              </ul>
            </div>
          </section>

          {/* Academic Integrity */}
          <section className="rounded-[2rem] bg-[#1A2D23]/90 border border-[#F3F0E4]/15 p-2 shadow-xl">
            <div className="rounded-[calc(2rem-0.5rem)] bg-[#121F18] p-6 sm:p-8 space-y-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2 font-heading">
                <ShieldCheck className="size-5 text-[#F0C93B]" /> 2. Academic Honor Code &amp; Prohibited Conduct
              </h2>
              <p className="text-[#9FAEA1] font-light">
                Notexia strictly prohibits using AI features for dishonest academic practices:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-[#F3F0E4] font-light">
                <li>Submitting AI copilot answers as uncredited original work in university exams, tests, or graded assignments.</li>
                <li>Using automated AI solvers during live proctored examinations or competitive entrance tests (e.g. JEE, NEET, GATE).</li>
                <li>Generating harmful, deceptive, or abusive academic material using the copilot.</li>
              </ul>
            </div>
          </section>

          {/* AI Data Isolation */}
          <section className="rounded-[2rem] bg-[#1A2D23]/90 border border-[#F3F0E4]/15 p-2 shadow-xl">
            <div className="rounded-[calc(2rem-0.5rem)] bg-[#121F18] p-6 sm:p-8 space-y-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2 font-heading">
                <BookOpen className="size-5 text-[#C9A9E0]" /> 3. Data Privacy &amp; LLM Isolation
              </h2>
              <p className="text-[#9FAEA1] font-light">
                Your private study notes, personal academic queries, and uploaded documents are processed ephemerally via enterprise Anthropic API endpoints. They are never sold to external third parties or used to train public generative models.
              </p>
            </div>
          </section>

          {/* Disclaimer */}
          <section className="rounded-[2rem] bg-[#1A2D23]/90 border border-[#F3F0E4]/15 p-2 shadow-xl">
            <div className="rounded-[calc(2rem-0.5rem)] bg-[#121F18] p-6 sm:p-8 space-y-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2 font-heading">
                <AlertTriangle className="size-5 text-[#F28B6E]" /> 4. AI Output Verification Disclaimer
              </h2>
              <p className="text-[#9FAEA1] font-light">
                Artificial intelligence models may occasionally produce inaccurate, incomplete, or outdated information (&quot;hallucinations&quot;). Students must always cross-reference AI-generated responses with accredited course syllabi, textbooks, and official professor guidance.
              </p>
            </div>
          </section>

          {/* Contact Support */}
          <div className="rounded-2xl border border-[#F3F0E4]/15 bg-[#1A2D23] p-6 text-center space-y-2 shadow-lg">
            <h3 className="text-base font-bold text-white font-heading">Questions Regarding AI Usage?</h3>
            <p className="text-xs text-[#9FAEA1]">
              Reach our academic safety team at{" "}
              <a href="mailto:info@notexia.cloud" className="text-[#F0C93B] font-bold hover:underline">
                info@notexia.cloud
              </a>
              .
            </p>
          </div>
        </div>
      </main>

      <TrustFooter />
    </div>
  );
}
