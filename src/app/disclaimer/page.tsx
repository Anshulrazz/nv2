import React from "react";
import Link from "next/link";
import { Bot, BookOpen, Calculator, ExternalLink, ShieldAlert } from "lucide-react";
import { TrustHeader } from "@/components/public/TrustHeader";
import { TrustFooter } from "@/components/public/TrustFooter";

export default function DisclaimerPage() {
  return (
    <div className="min-h-screen bg-[#16261D] text-[#F3F0E4] font-sans selection:bg-[#F0C93B]/30 flex flex-col antialiased">
      <TrustHeader title="DISCLAIMER" />

      <main className="max-w-4xl w-full mx-auto px-4 sm:px-6 py-12 space-y-10 flex-1">
        {/* Header Hero Section */}
        <div className="space-y-4 border-b border-[#F3F0E4]/15 pb-8">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#F28B6E]/15 border border-[#F28B6E]/30 text-[#F28B6E] text-xs font-mono font-bold uppercase tracking-wider">
            <ShieldAlert className="size-3.5" /> LEGAL NOTICE
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight font-heading">
            Academic &amp; Platform Disclaimer
          </h1>
          <p className="text-[#9FAEA1] text-sm sm:text-base leading-relaxed max-w-3xl font-light">
            This Disclaimer governs your use of Notexia&apos;s study platform, AI doubt resolution assistant, peer notes repository, and academic conversion calculators. Please read this document to understand the limitations of our services.
          </p>
          <div className="text-[11px] font-mono text-[#9FAEA1]/80">
            Last Updated: July 30, 2026 • Effective Date: January 1, 2026
          </div>
        </div>

        {/* Disclaimer Cards */}
        <div className="space-y-8 text-sm leading-relaxed">
          {/* Section 1: Non-Affiliation Disclaimer */}
          <section className="rounded-[2rem] bg-[#1A2D23]/90 border border-[#F3F0E4]/15 p-2 shadow-xl">
            <div className="rounded-[calc(2rem-0.5rem)] bg-[#121F18] p-6 sm:p-8 space-y-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2 font-heading">
                <BookOpen className="size-5 text-[#8FC3DE]" /> 1. Academic Board &amp; University Non-Affiliation
              </h2>
              <p className="text-[#9FAEA1] font-light">
                Notexia is an independent ed-tech study platform developed to help students organize notes and collaborate. Notexia is <strong className="text-white">NOT affiliated, endorsed by, or connected to</strong> any government testing bodies or universities, including but not limited to:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-[#F3F0E4] font-light">
                <li>National Testing Agency (NTA - JEE / NEET / CUET)</li>
                <li>Central Board of Secondary Education (CBSE)</li>
                <li>Visvesvaraya Technological University (VTU), APJ Abdul Kalam Technological University (KTU), or Mumbai University</li>
                <li>Union Public Service Commission (UPSC) or State Public Service Commissions</li>
              </ul>
              <p className="text-[#9FAEA1] text-xs pt-1 font-light">
                All exam names, syllabi titles, and university names are trademarks of their respective official organizations and are used here solely for descriptive and educational identification.
              </p>
            </div>
          </section>

          {/* Section 2: AI Doubt Solver Output Disclaimer */}
          <section className="rounded-[2rem] bg-[#1A2D23]/90 border border-[#F3F0E4]/15 p-2 shadow-xl">
            <div className="rounded-[calc(2rem-0.5rem)] bg-[#121F18] p-6 sm:p-8 space-y-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2 font-heading">
                <Bot className="size-5 text-[#F0C93B]" /> 2. Artificial Intelligence (AI) Copilot Disclaimer
              </h2>
              <p className="text-[#9FAEA1] font-light">
                Notexia utilizes automated artificial intelligence models to assist students with homework doubts and step-by-step formula derivations. While we continuously refine our system:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-[#F3F0E4] font-light">
                <li>AI copilot answers are generated for supplementary study support only.</li>
                <li>AI models may occasionally produce incorrect calculations or inaccurate conceptual answers (&quot;hallucinations&quot;).</li>
                <li>Students must independently cross-verify all AI derivations and answers with official prescribed textbooks, teacher notes, and exam answer keys.</li>
              </ul>
            </div>
          </section>

          {/* Section 3: Utility Tools & CGPA Calculator Disclaimer */}
          <section className="rounded-[2rem] bg-[#1A2D23]/90 border border-[#F3F0E4]/15 p-2 shadow-xl">
            <div className="rounded-[calc(2rem-0.5rem)] bg-[#121F18] p-6 sm:p-8 space-y-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2 font-heading">
                <Calculator className="size-5 text-[#F28B6E]" /> 3. CGPA Converter &amp; Formula Sheet Disclaimer
              </h2>
              <p className="text-[#9FAEA1] font-light">
                Our free academic tools (such as CGPA-to-Percentage converters for CBSE, VTU, KTU, and Mumbai University) apply official conversion formulas published in public university circulars. However:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-[#F3F0E4] font-light">
                <li>Conversion results are provided for general reference only and do not constitute official university transcripts.</li>
                <li>University regulations and grading multipliers may change over time. Always confirm current conversion rules with your institution&apos;s examination branch.</li>
              </ul>
            </div>
          </section>

          {/* Section 4: External Links & User Content */}
          <section className="rounded-[2rem] bg-[#1A2D23]/90 border border-[#F3F0E4]/15 p-2 shadow-xl">
            <div className="rounded-[calc(2rem-0.5rem)] bg-[#121F18] p-6 sm:p-8 space-y-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2 font-heading">
                <ExternalLink className="size-5 text-[#C9A9E0]" /> 4. External Links &amp; Peer Contributions
              </h2>
              <p className="text-[#9FAEA1] font-light">
                Notexia allows students to publish public blog posts and forum discussions. We do not endorse third-party external links or peer opinions expressed in community posts. Notexia is not liable for content hosted on external websites linked by users.
              </p>
            </div>
          </section>

          {/* Contact Notice */}
          <div className="rounded-2xl border border-[#F3F0E4]/15 bg-[#1A2D23] p-6 text-center space-y-2 shadow-lg">
            <h3 className="text-base font-bold text-white font-heading">Have Questions Regarding Our Disclaimer?</h3>
            <p className="text-xs text-[#9FAEA1]">
              Reach out to our support desk via our{" "}
              <Link href="/contact" className="text-[#F0C93B] font-bold hover:underline">
                Contact Page
              </Link>{" "}
              or email{" "}
              <a href="mailto:support@notexia.cloud" className="text-[#8FC3DE] font-bold hover:underline">
                support@notexia.cloud
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
