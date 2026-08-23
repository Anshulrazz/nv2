"use client";

import React, { useState } from "react";
import {
  FileText,
  Sparkles,
  Bot,
  Calculator,
  Trophy,
  CheckCircle2,
  Flame,
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
      <div className="rounded-[2.5rem] bg-[#150F0B]/80 border border-[#2E2118] p-2.5 sm:p-3.5 backdrop-blur-3xl shadow-[0_35px_90px_rgba(0,0,0,0.95)] relative overflow-hidden group">
        {/* Ambient Corner Glow Highlight */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#F5B429]/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#F5941D]/10 rounded-full blur-[100px] pointer-events-none" />

        {/* ── INNER HARDWARE CORE ── */}
        <div className="rounded-[calc(2.5rem-0.625rem)] bg-[#0A0806] border border-[#2E2118] p-5 sm:p-8 space-y-6 relative shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]">
          {/* WINDOW TOP CHROME BAR */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#2E2118] pb-5">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <div className="size-3 rounded-full bg-[#EF4444] shadow-[0_0_8px_#EF4444]" />
                <div className="size-3 rounded-full bg-[#F5B429] shadow-[0_0_8px_#F5B429]" />
                <div className="size-3 rounded-full bg-[#22C55E] shadow-[0_0_8px_#22C55E]" />
              </div>
              <span className="text-xs font-mono text-[#8A8078] hidden sm:inline tracking-wider">
                quantum-slate.notexia.in
              </span>
            </div>

            {/* HIGH-END PILL TAB SELECTOR BUTTONS */}
            <div className="flex flex-wrap items-center gap-1 bg-[#150F0B] p-1.5 rounded-full border border-[#2E2118]">
              {[
                { id: "editor", label: "LaTeX & Notes", icon: FileText, color: "bg-gradient-to-br from-[#F7C948] to-[#F5941D] text-[#150F0B]" },
                { id: "ai", label: "AI Copilot", icon: Bot, color: "bg-[#241811] text-[#F5B429] border border-[#F5B429]/40" },
                { id: "leaderboard", label: "Ranks & Coins", icon: Trophy, color: "bg-[#241811] text-[#F5941D] border border-[#F5941D]/40" },
                { id: "cgpa", label: "CGPA Tool", icon: Calculator, color: "bg-[#241811] text-[#FCD34D] border border-[#FCD34D]/40" },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setActiveTab(t.id as "editor" | "ai" | "leaderboard" | "cgpa")}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-mono font-bold transition-all duration-300 flex items-center gap-2 active:scale-95 ${
                    activeTab === t.id
                      ? `${t.color} shadow-[0_0_15px_rgba(245,180,41,0.25)]`
                      : "text-[#8A8078] hover:text-[#FAFAF8] hover:bg-[#241811]"
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
              <div className="md:col-span-8 rounded-2xl bg-[#150F0B] border border-[#2E2118] p-5 space-y-4 shadow-[0_0_30px_-10px_rgba(245,148,29,0.15)] relative overflow-hidden">
                <div className="flex items-center justify-between text-xs font-mono text-[#8A8078]">
                  <span className="flex items-center gap-2 text-[#FAFAF8] font-bold">
                    <FileText className="size-4 text-[#F5B429]" /> Quantum_Field_Theory_Ch3.md
                  </span>
                  <span className="text-[10px] font-mono text-[#F5B429] bg-[#F5B429]/10 px-2.5 py-0.5 rounded-full border border-[#F5B429]/30 uppercase font-bold">
                    LIVE KATEX RENDER
                  </span>
                </div>

                <div className="space-y-3 font-mono text-xs text-[#FAFAF8] bg-[#0A0806] p-4 rounded-xl border border-[#2E2118]">
                  <p className="text-[#8A8078]">{"// Schrödinger Time-Independent Wave Equation"}</p>
                  <p className="text-[#B8AFA6]">
                    <span className="text-[#F5B429]">\\hat&#123;H&#125; \\psi</span> = E \\psi \\implies -\\frac&#123;\\hbar^2&#125;&#123;2m&#125; \\nabla^2 \\psi + V(r)\\psi = E\\psi
                  </p>
                  <div className="pt-2 border-t border-[#2E2118] text-[#FCD34D] space-y-1">
                    <p className="text-[#F5B429] font-bold">{"$$\\psi(x,t) = A e^{i(kx - \\omega t)}$$"}</p>
                    <p className="font-sans italic text-xs text-[#8A8078] font-light">
                      &quot;Derivation validated for GATE Physics 2026 syllabus.&quot;
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] font-mono text-[#8A8078]">
                  <span className="flex items-center gap-1.5 text-[#22C55E]">
                    <CheckCircle2 className="size-3.5 text-[#22C55E]" /> TipTap Cloud Auto-Synced
                  </span>
                  <span className="text-[#F5B429] font-bold">KaTeX 0.16 Active</span>
                </div>
              </div>

              <div className="md:col-span-4 space-y-4 flex flex-col justify-between">
                <div className="rounded-2xl bg-[#150F0B] border border-[#2E2118] p-4 space-y-2 shadow-xl">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-[#F5B429] uppercase tracking-widest font-bold">
                      STUDY STREAK
                    </span>
                    <Flame className="size-4 text-[#F5941D] animate-pulse" />
                  </div>
                  <div className="text-2xl font-black text-[#FAFAF8] font-display flex items-baseline gap-1.5">
                    48 <span className="text-xs font-normal text-[#8A8078]">Days Active</span>
                  </div>
                  <div className="w-full bg-[#0A0806] h-2 rounded-full overflow-hidden border border-[#2E2118]">
                    <div className="bg-gradient-to-r from-[#F7C948] to-[#F5941D] h-full w-[90%] rounded-full shadow-[0_0_10px_#F5B429]" />
                  </div>
                </div>

                <div className="rounded-2xl bg-[#241811] border border-[#2E2118] p-4 space-y-2 text-[#FAFAF8] shadow-xl">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#FCD34D] font-display">
                    <Sparkles className="size-4 text-[#F5B429]" /> AI Equation Auto-Complete
                  </div>
                  <p className="text-[11px] text-[#B8AFA6] font-light leading-snug">
                    Type <code className="bg-[#0A0806] px-1.5 py-0.5 rounded text-[#F5B429] font-mono border border-[#2E2118]">$$</code> inside any line to complete complex math derivations instantly.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: AI COPILOT SIMULATOR */}
          {activeTab === "ai" && (
            <div className="rounded-2xl bg-[#150F0B] border border-[#2E2118] p-5 space-y-4 animate-in fade-in duration-300">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-mono text-[#F5B429]">
                  <Bot className="size-4 text-[#F5941D]" /> Notexia AI Copilot (Claude 3.5 Sonnet / GPT-4o-mini)
                </div>
                <span className="text-[10px] font-mono text-[#F5B429] bg-[#F5B429]/10 px-2.5 py-0.5 rounded-full border border-[#F5B429]/30 font-bold">
                  LATENCY: 310ms
                </span>
              </div>

              <div className="space-y-3 font-mono text-xs">
                <div className="bg-[#0A0806] p-3.5 rounded-xl border border-[#2E2118] text-[#FAFAF8] flex items-start gap-2">
                  <CornerDownRight className="size-4 text-[#F5941D] shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[#F5B429] font-bold">Student Prompt:</span> &quot;Explain Special Relativity time dilation formula step-by-step.&quot;
                  </div>
                </div>
                <div className="bg-[#0A0806] p-4 rounded-xl border border-[#2E2118] text-[#B8AFA6] space-y-2 leading-relaxed">
                  <p className="text-[#F5B429] font-bold">AI Resolution:</p>
                  <p>1. Rest frame light clock period: \\(\\Delta t_0 = \\frac&#123;2L_0&#125;&#123;c&#125;\\)</p>
                  <p>2. Moving frame path length: \\(\\Delta t = \\frac&#123;2\\sqrt&#123;L_0^2 + (v\\Delta t / 2)^2&#125;&#125;&#123;c&#125;\\)</p>
                  <p className="text-[#FCD34D] font-bold">3. Final Relation: \\(\\Delta t = \\frac&#123;\\Delta t_0&#125;&#123;\\sqrt&#123;1 - v^2/c^2&#125;&#125; = \\gamma \\Delta t_0\\)</p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: BATCH LEADERBOARD */}
          {activeTab === "leaderboard" && (
            <div className="rounded-2xl bg-[#150F0B] border border-[#2E2118] p-5 space-y-4 animate-in fade-in duration-300">
              <div className="flex items-center justify-between text-xs font-mono text-[#F5B429]">
                <span className="flex items-center gap-2 font-bold text-[#FAFAF8]">
                  <Trophy className="size-4 text-[#F5941D]" /> University Batch Scholar Ranks (2026)
                </span>
                <span className="text-[10px] text-[#F5B429] bg-[#F5B429]/10 px-2.5 py-0.5 rounded-full border border-[#F5B429]/30 font-bold">
                  SEASON 4 LIVE
                </span>
              </div>

              <div className="space-y-2.5 font-mono text-xs">
                {[
                  { rank: "#1", name: "Aarav Sharma", batch: "IIT Bombay Physics", points: "1,420 Coins", badge: "Gold Scholar" },
                  { rank: "#2", name: "Sneha Nair", batch: "VTU CS Semester 4", points: "1,180 Coins", badge: "Silver Scholar" },
                  { rank: "#3", name: "Rohan Kulkarni", batch: "GATE Scholar Batch", points: "950 Coins", badge: "Bronze Scholar" },
                ].map((s) => (
                  <div key={s.rank} className="flex items-center justify-between p-3.5 rounded-xl bg-[#0A0806] border border-[#2E2118]">
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-[#F5B429] w-6">{s.rank}</span>
                      <div>
                        <p className="text-[#FAFAF8] font-bold font-sans">{s.name}</p>
                        <p className="text-[10px] text-[#8A8078]">{s.batch}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[#FCD34D] font-bold">{s.points}</p>
                      <span className="text-[9px] text-[#F5B429] bg-[#F5B429]/10 px-2 py-0.5 rounded-full border border-[#F5B429]/30 font-semibold">
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
            <div className="rounded-2xl bg-[#150F0B] border border-[#2E2118] p-5 space-y-4 animate-in fade-in duration-300">
              <div className="flex items-center justify-between text-xs font-mono text-[#F5941D]">
                <span className="flex items-center gap-2 font-bold text-[#FAFAF8]">
                  <Calculator className="size-4 text-[#F5B429]" /> Official VTU / CBSE CGPA Converter
                </span>
                <span className="text-[10px] text-[#F5B429] bg-[#F5B429]/10 px-2.5 py-0.5 rounded-full border border-[#F5B429]/30 font-bold">
                  FORMULA: (CGPA - 0.75) * 10
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs text-[#8A8078] font-mono">Enter CGPA (0.0 to 10.0):</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="10"
                    value={cgpaInput}
                    onChange={(e) => setCgpaInput(e.target.value)}
                    className="w-full bg-[#0A0806] border border-[#2E2118] rounded-xl px-4 py-3 text-lg font-mono font-bold text-[#F5B429] focus:outline-none focus:border-[#F5B429]"
                  />
                </div>
                <div className="rounded-xl bg-[#0A0806] border border-[#2E2118] p-4 flex flex-col justify-center text-center space-y-1 shadow-inner">
                  <span className="text-[10px] font-mono text-[#8A8078] uppercase tracking-wider">
                    Official Equivalent Percentage
                  </span>
                  <span className="text-3xl font-black text-[#F5B429] font-display">
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
