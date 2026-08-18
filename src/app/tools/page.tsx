import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import {
  Calculator,
  BookOpen,
  Sparkles,
  ArrowRight,
  GraduationCap,
  Layers,
  FileSpreadsheet,
} from "lucide-react";
import { TrustHeader } from "@/components/public/TrustHeader";
import { TrustFooter } from "@/components/public/TrustFooter";
import { constructSeoMetadata } from "@/lib/seo/metadata";
import { buildBreadcrumbSchema, buildSoftwareApplicationSchema } from "@/lib/seo/jsonld";

export const metadata: Metadata = constructSeoMetadata({
  title: "Free Student Tools — Formula Sheets, CGPA Converter & AI Study Tools | Notexia",
  description:
    "Free online academic tools for Indian students. Access interactive JEE/NEET/GATE formula sheets, university CGPA to percentage converters, and AI study assistants.",
  path: "/tools",
  keywords: [
    "free study tools for students",
    "online study tools",
    "formula sheets",
    "JEE formula sheets",
    "NEET formula sheets",
    "GATE formula sheets",
    "engineering formula sheets",
    "CGPA converter",
    "CGPA to percentage converter",
    "college study resources",
    "AI study tools",
  ],
});

const breadcrumbs = [
  { name: "Home", item: "/" },
  { name: "Tools", item: "/tools" },
];

export default function ToolsIndexPage() {
  return (
    <div className="min-h-screen bg-[#16261D] text-[#F3F0E4] font-sans selection:bg-[#F0C93B]/30 flex flex-col antialiased">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildBreadcrumbSchema(breadcrumbs)) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildSoftwareApplicationSchema()) }}
      />

      <TrustHeader title="STUDENT TOOLS" />

      <main className="max-w-5xl w-full mx-auto px-4 sm:px-6 py-12 sm:py-16 space-y-16 flex-1">
        {/* HERO */}
        <section className="rounded-[2.5rem] bg-[#1A2D23]/90 border border-[#F3F0E4]/15 p-2 shadow-2xl">
          <div className="rounded-[calc(2.5rem-0.5rem)] bg-[#121F18] p-8 sm:p-12 space-y-6 shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)] text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#8FC3DE]/15 border border-[#8FC3DE]/30 text-[#8FC3DE] text-xs font-mono font-bold uppercase tracking-wider">
              <Calculator className="size-3.5" /> FREE ACADEMIC CALCULATORS &amp; RESOURCES
            </div>

            <h1 className="text-3xl sm:text-5xl font-black text-[#F3F0E4] tracking-tight font-heading leading-tight">
              Free Study Tools &amp; Calculators for Students
            </h1>

            <p className="text-[#9FAEA1] text-base leading-relaxed font-light">
              Access free interactive formula sheets for Physics, Chemistry, Math &amp; Computer Science, official university CGPA-to-percentage calculators, and AI study assistants.
            </p>
          </div>
        </section>

        {/* TOOLS GRID */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="rounded-[2rem] bg-[#1A2D23]/90 border border-[#F3F0E4]/15 p-2 shadow-xl hover:border-[#F0C93B]/40 transition-colors">
            <div className="rounded-[calc(2rem-0.5rem)] bg-[#121F18] p-8 space-y-4 h-full flex flex-col justify-between">
              <div className="space-y-3">
                <div className="size-12 rounded-2xl bg-[#F0C93B]/15 border border-[#F0C93B]/30 flex items-center justify-center text-[#F0C93B]">
                  <BookOpen className="size-6" />
                </div>
                <h2 className="text-xl font-bold text-white font-heading">Interactive Formula Sheets</h2>
                <p className="text-[#9FAEA1] text-xs leading-relaxed font-light">
                  Quick-reference LaTeX formula sheets for JEE Main/Advanced, NEET, GATE, and Engineering semester revision.
                </p>
              </div>
              <div className="pt-4 border-t border-[#F3F0E4]/10">
                <Link
                  href="/tools/formula-sheets"
                  className="rounded-xl bg-[#F0C93B] text-[#2A2118] text-xs font-bold font-heading px-4 py-2.5 inline-flex items-center justify-between w-full shadow-md"
                >
                  <span>Open Formula Sheets</span>
                  <ArrowRight className="size-4" />
                </Link>
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] bg-[#1A2D23]/90 border border-[#F3F0E4]/15 p-2 shadow-xl hover:border-[#8FC3DE]/40 transition-colors">
            <div className="rounded-[calc(2rem-0.5rem)] bg-[#121F18] p-8 space-y-4 h-full flex flex-col justify-between">
              <div className="space-y-3">
                <div className="size-12 rounded-2xl bg-[#8FC3DE]/15 border border-[#8FC3DE]/30 flex items-center justify-center text-[#8FC3DE]">
                  <Calculator className="size-6" />
                </div>
                <h2 className="text-xl font-bold text-white font-heading">CGPA to Percentage Converter</h2>
                <p className="text-[#9FAEA1] text-xs leading-relaxed font-light">
                  Official grading scale calculators for CBSE Class 10/12, VTU, KTU, Mumbai University, Anna University, and SPPU.
                </p>
              </div>
              <div className="pt-4 border-t border-[#F3F0E4]/10">
                <Link
                  href="/tools/cgpa-converter"
                  className="rounded-xl bg-[#8FC3DE] text-[#121F18] text-xs font-bold font-heading px-4 py-2.5 inline-flex items-center justify-between w-full shadow-md"
                >
                  <span>Calculate CGPA</span>
                  <ArrowRight className="size-4" />
                </Link>
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] bg-[#1A2D23]/90 border border-[#F3F0E4]/15 p-2 shadow-xl hover:border-[#F28B6E]/40 transition-colors">
            <div className="rounded-[calc(2rem-0.5rem)] bg-[#121F18] p-8 space-y-4 h-full flex flex-col justify-between">
              <div className="space-y-3">
                <div className="size-12 rounded-2xl bg-[#F28B6E]/15 border border-[#F28B6E]/30 flex items-center justify-center text-[#F28B6E]">
                  <Sparkles className="size-6" />
                </div>
                <h2 className="text-xl font-bold text-white font-heading">AI Study Suite</h2>
                <p className="text-[#9FAEA1] text-xs leading-relaxed font-light">
                  AI Notes Generator, PDF Summarizer, 24/7 Doubt Solver, and automated Flashcards.
                </p>
              </div>
              <div className="pt-4 border-t border-[#F3F0E4]/10">
                <Link
                  href="/ai-study-tools"
                  className="rounded-xl bg-[#F28B6E] text-[#121F18] text-xs font-bold font-heading px-4 py-2.5 inline-flex items-center justify-between w-full shadow-md"
                >
                  <span>Explore AI Tools</span>
                  <ArrowRight className="size-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <TrustFooter />
    </div>
  );
}
