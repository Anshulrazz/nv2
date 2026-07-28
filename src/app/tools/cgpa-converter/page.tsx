"use client";

import React, { useState } from "react";
import { Calculator, Copy, Check, Sparkles, BookOpen, GraduationCap, ArrowLeft, Code, Info, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function CGPAConverterPage() {
  const [cgpa, setCgpa] = useState<string>("8.5");
  const [board, setBoard] = useState<"cbse" | "vtu" | "ktu" | "mumbai" | "standard">("cbse");
  const [copiedEmbed, setCopiedEmbed] = useState(false);

  const numericCgpa = Math.min(10, Math.max(0, parseFloat(cgpa) || 0));

  // Formula calculations
  let percentage = 0;
  let formulaStr = "";

  switch (board) {
    case "cbse":
      percentage = numericCgpa * 9.5;
      formulaStr = `${numericCgpa} × 9.5 = ${percentage.toFixed(2)}%`;
      break;
    case "vtu":
      percentage = Math.max(0, (numericCgpa - 0.75) * 10);
      formulaStr = `(${numericCgpa} - 0.75) × 10 = ${percentage.toFixed(2)}%`;
      break;
    case "ktu":
      percentage = Math.max(0, (numericCgpa - 0.5) * 10);
      formulaStr = `(${numericCgpa} - 0.5) × 10 = ${percentage.toFixed(2)}%`;
      break;
    case "mumbai":
      percentage = Math.min(100, numericCgpa * 7.25 + 11);
      formulaStr = `(7.25 × ${numericCgpa}) + 11 = ${percentage.toFixed(2)}%`;
      break;
    case "standard":
      percentage = numericCgpa * 9.5;
      formulaStr = `${numericCgpa} × 9.5 = ${percentage.toFixed(2)}%`;
      break;
  }

  // Grade classification
  let gradeLetter = "A";
  let gradeClass = "First Class with Distinction";
  if (percentage >= 90) { gradeLetter = "A+"; gradeClass = "Outstanding / First Class with Distinction"; }
  else if (percentage >= 75) { gradeLetter = "A"; gradeClass = "First Class with Distinction"; }
  else if (percentage >= 60) { gradeLetter = "B+"; gradeClass = "First Class"; }
  else if (percentage >= 50) { gradeLetter = "B"; gradeClass = "Second Class"; }
  else if (percentage >= 40) { gradeLetter = "C"; gradeClass = "Pass Class"; }
  else { gradeLetter = "F"; gradeClass = "Needs Improvement"; }

  const embedSnippet = `<iframe src="https://notexia.in/tools/cgpa-converter" width="100%" height="500" frameborder="0" style="border:1px solid #30363d;border-radius:12px;"></iframe>\n<p style="font-size:11px;font-family:sans-serif;color:#8b949e;">Powered by <a href="https://notexia.in/tools/cgpa-converter" target="_blank" style="color:#58a6ff;">Notexia CGPA Calculator</a></p>`;

  const copyEmbedCode = () => {
    navigator.clipboard.writeText(embedSnippet);
    setCopiedEmbed(true);
    setTimeout(() => setCopiedEmbed(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#0d1117] text-[#c9d1d9] font-sans selection:bg-[#58a6ff]/30 flex flex-col">
      {/* Top Header Navigation */}
      <header className="border-b border-[#21262d] bg-[#161b22]/90 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/feed" className="text-[#8b949e] hover:text-white flex items-center gap-2 text-xs font-semibold transition-colors">
            <ArrowLeft className="h-4 w-4 text-[#58a6ff]" /> Back to Notexia
          </Link>
          <span
            className="text-sm font-bold tracking-widest text-[#58a6ff]"
            style={{ fontFamily: "var(--font-space-grotesk, monospace)" }}
          >
            NOTEXIA TOOLS
          </span>
        </div>
      </header>

      <main className="max-w-4xl w-full mx-auto px-6 py-10 space-y-10 flex-1">
        {/* Header Hero Section */}
        <div className="space-y-4 text-center sm:text-left border-b border-[#21262d] pb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#388bfd]/10 border border-[#388bfd]/30 text-[#58a6ff] text-xs font-mono font-bold uppercase tracking-wider">
            <Calculator className="size-3.5" /> FREE ACADEMIC TOOL
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
            CGPA to Percentage Converter — CBSE, VTU, KTU &amp; University Calculator
          </h1>
          <p className="text-[#8b949e] text-sm sm:text-base leading-relaxed max-w-3xl">
            Notexia&apos;s free CGPA to Percentage Calculator instantly converts Grade Point Averages (CGPA) into exact percentage marks using official conversion formulas for CBSE 10th/12th, VTU, KTU, Mumbai University, Anna University, and standard 10-point grading scales.
          </p>
        </div>

        {/* Interactive Calculator Section */}
        <div className="rounded-2xl border border-[#30363d] bg-[#161b22] p-6 sm:p-8 space-y-6 shadow-2xl">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#21262d] pb-6">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Sparkles className="size-4 text-[#58a6ff]" /> Select Your Board / University Formula
              </h2>
              <p className="text-xs text-[#8b949e] mt-1">Choose your academic system to apply the official grading formula.</p>
            </div>
          </div>

          {/* Board Selector Tabs */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {[
              { id: "cbse", label: "CBSE (x 9.5)" },
              { id: "vtu", label: "VTU (-0.75 x10)" },
              { id: "ktu", label: "KTU (-0.5 x10)" },
              { id: "mumbai", label: "Mumbai Univ" },
              { id: "standard", label: "Standard 10-Pt" },
            ].map((b) => (
              <button
                key={b.id}
                onClick={() => setBoard(b.id as typeof board)}
                className={`text-xs font-mono font-bold py-3 px-3 rounded-xl border transition-all ${
                  board === b.id
                    ? "bg-[#1f6beb]/20 text-[#58a6ff] border-[#388bfd]"
                    : "bg-[#0d1117] text-[#8b949e] border-[#30363d] hover:text-white hover:border-[#8b949e]"
                }`}
              >
                {b.label}
              </button>
            ))}
          </div>

          {/* Input & Live Results Display */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center pt-4">
            {/* Input Column */}
            <div className="md:col-span-6 space-y-3">
              <label className="block text-xs font-mono font-bold text-[#8b949e] uppercase tracking-wider">
                Enter Your CGPA (0.0 to 10.0)
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="10"
                  value={cgpa}
                  onChange={(e) => setCgpa(e.target.value)}
                  className="w-full bg-[#0d1117] border-2 border-[#30363d] focus:border-[#58a6ff] rounded-xl px-4 py-3.5 text-2xl font-mono font-black text-white outline-none transition-colors"
                  placeholder="8.5"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-mono text-[#8b949e]">
                  / 10.0
                </span>
              </div>
              <p className="text-[11px] text-[#8b949e] font-mono">
                Applied Formula: <span className="text-[#3fb950] font-bold">{formulaStr}</span>
              </p>
            </div>

            {/* Result Badge Column */}
            <div className="md:col-span-6 rounded-xl bg-[#0d1117] border border-[#30363d] p-6 text-center space-y-2">
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#8b949e] block font-bold">
                Calculated Percentage
              </span>
              <div className="text-4xl sm:text-5xl font-black font-mono text-[#3fb950]">
                {percentage.toFixed(2)}%
              </div>
              <div className="pt-2 flex items-center justify-center gap-2 text-xs font-semibold text-[#c9d1d9]">
                <span className="px-2.5 py-0.5 rounded-full bg-[#388bfd]/15 text-[#58a6ff] border border-[#388bfd]/30 font-mono font-bold">
                  Grade {gradeLetter}
                </span>
                <span className="text-[#8b949e]">•</span>
                <span className="text-[#8b949e]">{gradeClass}</span>
              </div>
            </div>
          </div>

          {/* Visual Percentage Progress Bar */}
          <div className="space-y-1.5 pt-2">
            <div className="flex justify-between text-[11px] font-mono text-[#8b949e]">
              <span>0%</span>
              <span>50%</span>
              <span>100%</span>
            </div>
            <div className="h-3 w-full bg-[#0d1117] border border-[#30363d] rounded-full overflow-hidden p-0.5">
              <div
                className="h-full bg-gradient-to-r from-[#388bfd] via-[#a371f7] to-[#3fb950] rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(0, percentage))}%` }}
              />
            </div>
          </div>
        </div>

        {/* Embed Widget Generator (Linkable Asset Mechanism) */}
        <div className="rounded-2xl border border-[#30363d] bg-[#161b22] p-6 sm:p-8 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Code className="size-4 text-[#a371f7]" />
              <h2 className="text-base font-bold text-white">Embed This Calculator on Your Website</h2>
            </div>
            <Button
              onClick={copyEmbedCode}
              className="rounded-lg bg-[#238636] hover:bg-[#2ea043] text-white font-bold text-xs h-9 px-4 flex items-center gap-2 transition-all"
            >
              {copiedEmbed ? <Check className="size-4" /> : <Copy className="size-4" />}
              <span>{copiedEmbed ? "Copied HTML!" : "Copy Embed Code"}</span>
            </Button>
          </div>
          <p className="text-xs text-[#8b949e]">
            Add this free CGPA calculator to your blog or educational site with automatic Notexia attribution:
          </p>
          <pre className="bg-[#0d1117] border border-[#30363d] rounded-xl p-4 text-xs font-mono text-[#3fb950] overflow-x-auto">
            <code>{embedSnippet}</code>
          </pre>
        </div>

        {/* Informational FAQ Section */}
        <div className="space-y-6 pt-4 border-t border-[#21262d]">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Info className="size-5 text-[#58a6ff]" /> Frequently Asked Questions on CGPA Conversion
          </h2>

          <div className="space-y-4">
            {[
              {
                q: "How to convert CBSE 10th CGPA to Percentage?",
                a: "To convert CBSE Class 10 CGPA to percentage, multiply your cumulative grade point average by 9.5. Formula: Percentage = CGPA × 9.5. Example: 8.4 CGPA × 9.5 = 79.8%.",
              },
              {
                q: "What is the VTU CGPA to percentage conversion formula?",
                a: "Visvesvaraya Technological University (VTU) uses the formula: Percentage = (CGPA - 0.75) × 10. Example: A CGPA of 8.25 equals (8.25 - 0.75) × 10 = 75%.",
              },
              {
                q: "How to convert KTU B.Tech CGPA to Percentage?",
                a: "APJ Abdul Kalam Technological University (KTU) uses the official formula: Percentage = (CGPA - 0.5) × 10.",
              },
              {
                q: "Why is CGPA multiplied by 9.5 for CBSE?",
                a: "CBSE calculated the average marks of students scoring 91-100 (grade point 10) across historical board examination data, which averaged out to 95%. Dividing 95 by 10 yields the conversion factor of 9.5.",
              },
            ].map((faq, idx) => (
              <div key={idx} className="rounded-xl border border-[#30363d] bg-[#161b22] p-5 space-y-2">
                <h3 className="text-sm font-bold text-white">{faq.q}</h3>
                <p className="text-xs text-[#8b949e] leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Internal Hub Links */}
        <div className="rounded-2xl border border-[#30363d] bg-[#161b22] p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-white">Explore Notexia Study Resources</h3>
            <p className="text-xs text-[#8b949e] mt-0.5">Read verified research papers, published notes, and student doubt solutions.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link href="/feed">
              <Button variant="outline" className="rounded-xl bg-[#0d1117] border-[#30363d] hover:border-[#58a6ff] text-[#c9d1d9] text-xs h-9 px-3.5">
                <BookOpen className="size-3.5 mr-1 text-[#58a6ff]" /> Public Feed
              </Button>
            </Link>
            <Link href="/research">
              <Button variant="outline" className="rounded-xl bg-[#0d1117] border-[#30363d] hover:border-[#a371f7] text-[#c9d1d9] text-xs h-9 px-3.5">
                <GraduationCap className="size-3.5 mr-1 text-[#a371f7]" /> AI Research
              </Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
