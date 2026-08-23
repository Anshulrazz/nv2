"use client";

import React, { useRef, useState } from "react";
import { Sparkles, FileText, CheckCircle2, Award, Zap } from "lucide-react";

export function Hero3DShowcase() {
  const cardRef = useRef<HTMLDivElement>(null);
  const [rotX, setRotX] = useState(0);
  const [rotY, setRotY] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = ((y - centerY) / centerY) * -12; // tilt max 12deg
    const rotateY = ((x - centerX) / centerX) * 12;

    setRotX(rotateX);
    setRotY(rotateY);
  };

  const handleMouseEnter = () => setIsHovered(true);
  const handleMouseLeave = () => {
    setIsHovered(false);
    setRotX(0);
    setRotY(0);
  };

  return (
    <div
      className="perspective-1000 w-full max-w-4xl mx-auto my-8 select-none"
      style={{ perspective: "1200px" }}
    >
      <div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{
          transform: `rotateX(${rotX}deg) rotateY(${rotY}deg) scale3d(${isHovered ? 1.02 : 1}, ${isHovered ? 1.02 : 1}, 1)`,
          transition: isHovered ? "transform 100ms ease-out" : "transform 500ms cubic-bezier(0.23, 1, 0.32, 1)",
          transformStyle: "preserve-3d",
        }}
        className="rounded-[2.5rem] bg-[#150F0B]/85 border border-[#2E2118] p-3.5 backdrop-blur-3xl shadow-[0_30px_70px_rgba(0,0,0,0.8),0_0_50px_-10px_rgba(245,148,29,0.2)] relative overflow-hidden"
      >
        {/* Ambient Glass Highlight */}
        <div
          className="absolute inset-0 bg-gradient-to-tr from-transparent via-[#F5B429]/5 to-transparent pointer-events-none rounded-[2.5rem]"
          style={{ transform: "translateZ(10px)" }}
        />

        {/* Outer Hardware Enclosure */}
        <div
          className="rounded-[calc(2.5rem-0.75rem)] bg-[#0A0806] border border-[#2E2118] p-6 sm:p-8 space-y-6 relative"
          style={{ transform: "translateZ(20px)" }}
        >
          {/* Top Bar Window Chrome */}
          <div className="flex items-center justify-between border-b border-[#2E2118] pb-4">
            <div className="flex items-center gap-2">
              <div className="size-3 rounded-full bg-[#EF4444]" />
              <div className="size-3 rounded-full bg-[#F5B429]" />
              <div className="size-3 rounded-full bg-[#10B981]" />
              <span className="ml-2 text-xs font-mono text-[#8A8078]">workspace.notexia.app</span>
            </div>
            <div className="flex items-center gap-2 font-mono text-[10px] bg-[#150F0B] text-[#F5B429] px-3 py-1 rounded-full border border-[#F5B429]/30">
              <Zap className="size-3 text-[#F5B429] animate-pulse" />
              <span>LIVE WORKSPACE</span>
            </div>
          </div>

          {/* 3D Stacked Content Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
            {/* Main Code & Note Editor Frame */}
            <div
              className="md:col-span-8 rounded-2xl bg-[#150F0B] border border-[#2E2118] p-5 space-y-4 shadow-xl transition-all duration-300"
              style={{ transform: "translateZ(35px)" }}
            >
              <div className="flex items-center justify-between text-xs font-mono text-[#8A8078]">
                <span className="flex items-center gap-1.5 text-[#FAFAF8] font-bold">
                  <FileText className="size-4 text-[#F5B429]" /> Quantum_Algorithms.md
                </span>
                <span className="text-[10px] text-[#FCD34D] font-semibold bg-[#FCD34D]/10 px-2 py-0.5 rounded border border-[#FCD34D]/20">
                  AUTO-SAVED
                </span>
              </div>

              <div className="space-y-2 font-mono text-xs text-[#FAFAF8] bg-[#0A0806] p-4 rounded-xl border border-[#2E2118]">
                <p className="text-[#8A8078]">{"# Quantum Fourier Transform Note"}</p>
                <p className="text-[#FCD34D]">
                  <span className="text-[#F5B429]">const</span> qft = (state) =&gt; {"{"}
                </p>
                <p className="pl-4 text-[#F5941D]">
                  return state.applyGate(<span className="text-[#FCD34D]">&quot;Hadamard&quot;</span>);
                </p>
                <p className="text-[#FCD34D]">{"}"};</p>
              </div>

              <div className="flex items-center justify-between text-[11px] text-[#8A8078]">
                <span className="flex items-center gap-1 text-[#FCD34D]">
                  <CheckCircle2 className="size-3.5" /> 45 Peers Editing Live
                </span>
                <span className="font-mono text-[#F5B429]">LaTeX + Markdown</span>
              </div>
            </div>

            {/* Floating Side Widget Cards */}
            <div className="md:col-span-4 space-y-4 flex flex-col justify-between">
              {/* Scholar Streak Badge */}
              <div
                className="rounded-2xl bg-[#150F0B] border border-[#F5B429]/30 p-4 space-y-2 shadow-[0_0_20px_rgba(245,180,41,0.1)]"
                style={{ transform: "translateZ(50px)" }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-[#F5B429] uppercase tracking-widest font-bold">
                    STUDY STREAK
                  </span>
                  <Award className="size-4 text-[#F5B429]" />
                </div>
                <div className="text-2xl font-bold text-[#FAFAF8] font-display flex items-baseline gap-1">
                  45 <span className="text-xs font-normal text-[#8A8078]">Days Active</span>
                </div>
                <div className="w-full bg-[#0A0806] h-2 rounded-full overflow-hidden border border-[#2E2118]">
                  <div className="bg-gradient-to-r from-[#F7C948] to-[#F5941D] h-full w-[85%] rounded-full shadow-[0_0_10px_#F5B429]" />
                </div>
              </div>

              {/* AI Research Pill */}
              <div
                className="rounded-2xl bg-[#F5941D]/10 border border-[#F5941D]/30 p-4 space-y-2 text-[#FAFAF8] shadow-lg"
                style={{ transform: "translateZ(40px)" }}
              >
                <div className="flex items-center gap-2 text-xs font-bold text-[#F5B429] font-display">
                  <Sparkles className="size-4" /> AI Copilot Synthesis
                </div>
                <p className="text-[11px] text-[#8A8078] font-light leading-snug">
                  Generated 12 flashcards from &quot;Distributed Systems&quot; in 420ms.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
