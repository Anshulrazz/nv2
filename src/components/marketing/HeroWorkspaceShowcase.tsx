"use client";

import React, { useState } from "react";
import {
  FileText,
  Award,
  Zap,
  Sparkles,
  Bot,
  Calculator,
  Trophy,
  CheckCircle2,
  Cpu,
  Flame,
  Globe,
  CornerDownRight,
} from "lucide-react";

export function HeroWorkspaceShowcase() {
  const [activeTab, setActiveTab] = useState<"editor" | "ai" | "leaderboard" | "cgpa">("editor");
  const [cgpaInput, setCgpaInput] = useState<string>("8.8");

  const computedPercentage = (() => {
    const val = parseFloat(cgpaInput);
    if (isNaN(val) || val < 0 || val > 10) return "Invalid";
    return ((val - 0.75) * 10).toFixed(1) + "%";
  })();

  return (
    <div className="w-full max-w-5xl mx-auto my-6 select-none">
      {/* ── DOUBLE-BEZEL OUTER HARDWARE ENCLOSURE ── */}
      <div className="rounded-[2.5rem] bg-white/[0.04] border border-white/15 p-2.5 sm:p-3.5 backdrop-blur-3xl shadow-[0_35px_90px_rgba(0,0,0,0.85)] relative overflow-hidden group">
        {/* Ambient Corner Glow Highlight */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#F0C93B]/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#8FC3DE]/10 rounded-full blur-[100px] pointer-events-none" />

        {/* ── INNER HARDWARE CORE ── */}
        <div className="rounded-[calc(2.5rem-0.625rem)] bg-[#09130E] border border-white/10 p-5 sm:p-8 space-y-6 relative shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)]">
          {/* WINDOW TOP CHROME BAR */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <div className="size-3 rounded-full bg-[#F28B6E] shadow-[0_0_8px_#F28B6E]" />
                <div className="size-3 rounded-full bg-[#F0C93B] shadow-[0_0_8px_#F0C93B]" />
                <div className="size-3 rounded-full bg-[#8FC3DE] shadow-[0_0_8px_#8FC3DE]" />
              </div>
              <span className="text-xs font-mono text-[#9FAEA1] hidden sm:inline tracking-wider">
                quantum-slate.notexia.in
              </span>
            </div>

            {/* HIGH-END PILL TAB SELECTOR BUTTONS */}
            <div className="flex flex-wrap items-center gap-1 bg-[#121F18] p-1.5 rounded-full border border-white/10 shadow-inner">
              {[
                { id: "editor", label: "LaTeX & Notes", icon: FileText, color: "bg-[#F0C93B] text-[#121F18]" },
                { id: "ai", label: "AI Copilot", icon: Bot, color: "bg-[#8FC3DE] text-[#121F18]" },
                { id: "leaderboard", label: "Ranks & Coins", icon: Trophy, color: "bg-[#C9A9E0] text-[#121F18]" },
                { id: "cgpa", label: "CGPA Tool", icon: Calculator, color: "bg-[#F28B6E] text-[#121F18]" },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setActiveTab(t.id as any)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-mono font-bold transition-all duration-300 flex items-center gap-2 active:scale-95 ${
                    activeTab === t.id
                      ? `${t.color} shadow-[0_0_15px_rgba(255,255,255,0.2)]`
                      : "text-[#9FAEA1] hover:text-[#F3F0E4] hover:bg-white/5"
                  }`}
                >
                  <t.icon className="size-3.5" />
                  <span>{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* TAB 1: TIPTAP MARKDOWN & LATEX PREVIEW */}
          {activeTab === "editor" && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5 animate-in fade-in duration-300">
              <div className="md:col-span-8 rounded-2xl bg-[#121F18] border border-white/10 p-5 space-y-4 shadow-2xl relative overflow-hidden">
                <div className="flex items-center justify-between text-xs font-mono text-[#9FAEA1]">
                  <span className="flex items-center gap-2 text-[#F3F0E4] font-bold">
                    <FileText className="size-4 text-[#F0C93B]" /> Quantum_Field_Theory_Ch3.md
                  </span>
                  <span className="text-[10px] font-mono text-[#8FC3DE] bg-[#8FC3DE]/10 px-2.5 py-0.5 rounded-full border border-[#8FC3DE]/30 uppercase font-bold">
                    LIVE KATEX RENDER
                  </span>
                </div>

                <div className="space-y-3 font-mono text-xs text-[#F3F0E4] bg-[#0A140F] p-4 rounded-xl border border-white/10 shadow-inner">
                  <p className="text-[#9FAEA1]">{"// Schrödinger Time-Independent Wave Equation"}</p>
                  <p className="text-[#8FC3DE]">
                    <span className="text-[#F0C93B]">\\hat&#123;H&#125; \\psi</span> = E \\psi \\implies -\\frac&#123;\\hbar^2&#125;&#123;2m&#125; \\nabla^2 \\psi + V(r)\\psi = E\\psi
                  </p>
                  <div className="pt-2 border-t border-white/10 text-[#C9A9E0] space-y-1">
                    <p className="text-[#F0C93B] font-bold">{"$$\\psi(x,t) = A e^{i(kx - \\omega t)}$$"}</p>
                    <p className="font-sans italic text-xs text-[#9FAEA1] font-light">
                      &quot;Derivation validated for GATE Physics 2026 syllabus.&quot;
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] font-mono text-[#9FAEA1]">
                  <span className="flex items-center gap-1.5 text-[#8FC3DE]">
                    <CheckCircle2 className="size-3.5 text-[#8FC3DE]" /> TipTap Cloud Auto-Synced
                  </span>
                  <span className="text-[#F0C93B] font-bold">KaTeX 0.16 Active</span>
                </div>
              </div>

              <div className="md:col-span-4 space-y-4 flex flex-col justify-between">
                <div className="rounded-2xl bg-[#121F18] border border-[#F0C93B]/30 p-4 space-y-2 shadow-xl">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-[#F0C93B] uppercase tracking-widest font-bold">
                      STUDY STREAK
                    </span>
                    <Flame className="size-4 text-[#F0C93B] animate-pulse" />
                  </div>
                  <div className="text-2xl font-black text-[#F3F0E4] font-heading flex items-baseline gap-1.5">
                    48 <span className="text-xs font-normal text-[#9FAEA1]">Days Active</span>
                  </div>
                  <div className="w-full bg-[#0A140F] h-2 rounded-full overflow-hidden border border-white/10">
                    <div className="bg-[#F0C93B] h-full w-[90%] rounded-full shadow-[0_0_10px_#F0C93B]" />
                  </div>
                </div>

                <div className="rounded-2xl bg-[#C9A9E0]/10 border border-[#C9A9E0]/30 p-4 space-y-2 text-[#F3F0E4] shadow-xl">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#C9A9E0] font-heading">
                    <Sparkles className="size-4" /> AI Equation Auto-Complete
                  </div>
                  <p className="text-[11px] text-[#9FAEA1] font-light leading-snug">
                    Type <code className="bg-[#0A140F] px-1.5 py-0.5 rounded text-[#F0C93B] font-mono">$$</code> inside any line to complete complex math derivations instantly.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: AI COPILOT SIMULATOR */}
          {activeTab === "ai" && (
            <div className="rounded-2xl bg-[#121F18] border border-[#8FC3DE]/30 p-5 space-y-4 animate-in fade-in duration-300">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-mono text-[#8FC3DE]">
                  <Bot className="size-4 text-[#F0C93B]" /> Notexia AI Copilot (OpenRouter GPT-4o-mini)
                </div>
                <span className="text-[10px] font-mono text-[#F0C93B] bg-[#F0C93B]/10 px-2.5 py-0.5 rounded-full border border-[#F0C93B]/30 font-bold">
                  LATENCY: 310ms
                </span>
              </div>

              <div className="space-y-3 font-mono text-xs">
                <div className="bg-[#0A140F] p-3.5 rounded-xl border border-white/10 text-[#F3F0E4] flex items-start gap-2">
                  <CornerDownRight className="size-4 text-[#8FC3DE] shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[#8FC3DE] font-bold">Student Prompt:</span> &quot;Explain Special Relativity time dilation formula step-by-step.&quot;
                  </div>
                </div>
                <div className="bg-[#0A140F] p-4 rounded-xl border border-[#8FC3DE]/30 text-[#9FAEA1] space-y-2 leading-relaxed">
                  <p className="text-[#F0C93B] font-bold">AI Resolution:</p>
                  <p>1. Rest frame light clock period: \\(\\Delta t_0 = \\frac&#123;2L_0&#125;&#123;c&#125;\\)</p>
                  <p>2. Moving frame path length: \\(\\Delta t = \\frac&#123;2\\sqrt&#123;L_0^2 + (v\\Delta t / 2)^2&#125;&#125;&#123;c&#125;\\)</p>
                  <p className="text-[#8FC3DE] font-bold">3. Final Relation: \\(\\Delta t = \\frac&#123;\\Delta t_0&#125;&#123;\\sqrt&#123;1 - v^2/c^2&#125;&#125; = \\gamma \\Delta t_0\\)</p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: BATCH LEADERBOARD */}
          {activeTab === "leaderboard" && (
            <div className="rounded-2xl bg-[#121F18] border border-[#C9A9E0]/30 p-5 space-y-4 animate-in fade-in duration-300">
              <div className="flex items-center justify-between text-xs font-mono text-[#C9A9E0]">
                <span className="flex items-center gap-2 font-bold text-[#F3F0E4]">
                  <Trophy className="size-4 text-[#F0C93B]" /> University Batch Scholar Ranks (2026)
                </span>
                <span className="text-[10px] text-[#F0C93B] bg-[#F0C93B]/10 px-2.5 py-0.5 rounded-full border border-[#F0C93B]/30 font-bold">
                  SEASON 4 LIVE
                </span>
              </div>

              <div className="space-y-2.5 font-mono text-xs">
                {[
                  { rank: "#1", name: "Aarav Sharma", batch: "IIT Bombay Physics", points: "1,420 Coins", badge: "Gold Scholar" },
                  { rank: "#2", name: "Sneha Nair", batch: "VTU CS Semester 4", points: "1,180 Coins", badge: "Silver Scholar" },
                  { rank: "#3", name: "Rohan Kulkarni", batch: "GATE Scholar Batch", points: "950 Coins", badge: "Bronze Scholar" },
                ].map((s) => (
                  <div key={s.rank} className="flex items-center justify-between p-3.5 rounded-xl bg-[#0A140F] border border-white/10">
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-[#F0C93B] w-6">{s.rank}</span>
                      <div>
                        <p className="text-[#F3F0E4] font-bold font-sans">{s.name}</p>
                        <p className="text-[10px] text-[#9FAEA1]">{s.batch}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[#C9A9E0] font-bold">{s.points}</p>
                      <span className="text-[9px] text-[#8FC3DE] bg-[#8FC3DE]/10 px-2 py-0.5 rounded-full border border-[#8FC3DE]/30 font-semibold">
                        {s.badge}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: CGPA QUICK CALCULATOR */}
          {activeTab === "cgpa" && (
            <div className="rounded-2xl bg-[#121F18] border border-[#F28B6E]/30 p-5 space-y-4 animate-in fade-in duration-300">
              <div className="flex items-center justify-between text-xs font-mono text-[#F28B6E]">
                <span className="flex items-center gap-2 font-bold text-[#F3F0E4]">
                  <Calculator className="size-4 text-[#F0C93B]" /> Official VTU / CBSE CGPA Converter
                </span>
                <span className="text-[10px] text-[#8FC3DE] bg-[#8FC3DE]/10 px-2.5 py-0.5 rounded-full border border-[#8FC3DE]/30 font-bold">
                  FORMULA: (CGPA - 0.75) * 10
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs text-[#9FAEA1] font-mono">Enter CGPA (0.0 to 10.0):</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="10"
                    value={cgpaInput}
                    onChange={(e) => setCgpaInput(e.target.value)}
                    className="w-full bg-[#0A140F] border border-white/20 rounded-xl px-4 py-3 text-lg font-mono font-bold text-[#F0C93B] focus:outline-none focus:border-[#F0C93B]"
                  />
                </div>
                <div className="rounded-xl bg-[#0A140F] border border-[#F0C93B]/30 p-4 flex flex-col justify-center text-center space-y-1 shadow-inner">
                  <span className="text-[10px] font-mono text-[#9FAEA1] uppercase tracking-wider">
                    Official Equivalent Percentage
                  </span>
                  <span className="text-3xl font-black text-[#F0C93B] font-heading">
                    {computedPercentage}
                  </span>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
