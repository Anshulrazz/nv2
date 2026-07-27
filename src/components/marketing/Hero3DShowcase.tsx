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
        className="rounded-[2.5rem] bg-[#1A2D23]/90 border border-[#F3F0E4]/20 p-3.5 backdrop-blur-3xl shadow-[0_30px_70px_rgba(0,0,0,0.5)] relative overflow-hidden"
      >
        {/* Ambient Glass Highlight */}
        <div
          className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent pointer-events-none rounded-[2.5rem]"
          style={{ transform: "translateZ(10px)" }}
        />

        {/* Outer Hardware Enclosure */}
        <div
          className="rounded-[calc(2.5rem-0.75rem)] bg-[#121F18] border border-[#F3F0E4]/10 p-6 sm:p-8 space-y-6 relative"
          style={{ transform: "translateZ(20px)" }}
        >
          {/* Top Bar Window Chrome */}
          <div className="flex items-center justify-between border-b border-[#F3F0E4]/10 pb-4">
            <div className="flex items-center gap-2">
              <div className="size-3 rounded-full bg-[#F28B6E]" />
              <div className="size-3 rounded-full bg-[#F0C93B]" />
              <div className="size-3 rounded-full bg-[#8FC3DE]" />
              <span className="ml-2 text-xs font-mono text-[#9FAEA1]">workspace.notexia.app</span>
            </div>
            <div className="flex items-center gap-2 font-mono text-[10px] bg-[#16261D] text-[#8FC3DE] px-3 py-1 rounded-full border border-[#8FC3DE]/30">
              <Zap className="size-3 text-[#F0C93B] animate-pulse" />
              <span>LIVE WORKSPACE</span>
            </div>
          </div>

          {/* 3D Stacked Content Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
            {/* Main Code & Note Editor Frame */}
            <div
              className="md:col-span-8 rounded-2xl bg-[#16261D] border border-[#F3F0E4]/15 p-5 space-y-4 shadow-xl transition-all duration-300"
              style={{ transform: "translateZ(35px)" }}
            >
              <div className="flex items-center justify-between text-xs font-mono text-[#9FAEA1]">
                <span className="flex items-center gap-1.5 text-[#F3F0E4] font-bold">
                  <FileText className="size-4 text-[#F0C93B]" /> Quantum_Algorithms.md
                </span>
                <span className="text-[10px] text-[#8FC3DE] font-semibold bg-[#8FC3DE]/10 px-2 py-0.5 rounded">
                  AUTO-SAVED
                </span>
              </div>

              <div className="space-y-2 font-mono text-xs text-[#F3F0E4] bg-[#121F18] p-4 rounded-xl border border-[#F3F0E4]/10">
                <p className="text-[#9FAEA1]">{"# Quantum Fourier Transform Note"}</p>
                <p className="text-[#8FC3DE]">
                  <span className="text-[#F0C93B]">const</span> qft = (state) =&gt; {"{"}
                </p>
                <p className="pl-4 text-[#C9A9E0]">
                  return state.applyGate(<span className="text-[#F28B6E]">&quot;Hadamard&quot;</span>);
                </p>
                <p className="text-[#8FC3DE]">{"}"};</p>
              </div>

              <div className="flex items-center justify-between text-[11px] text-[#9FAEA1]">
                <span className="flex items-center gap-1 text-[#8FC3DE]">
                  <CheckCircle2 className="size-3.5" /> 45 Peers Editing Live
                </span>
                <span className="font-mono text-[#F0C93B]">LaTeX + Markdown</span>
              </div>
            </div>

            {/* Floating Side Widget Cards */}
            <div className="md:col-span-4 space-y-4 flex flex-col justify-between">
              {/* Scholar Streak Badge */}
              <div
                className="rounded-2xl bg-[#16261D] border border-[#F0C93B]/30 p-4 space-y-2 shadow-lg"
                style={{ transform: "translateZ(50px)" }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-[#F0C93B] uppercase tracking-widest font-bold">
                    STUDY STREAK
                  </span>
                  <Award className="size-4 text-[#F0C93B]" />
                </div>
                <div className="text-2xl font-black text-[#F3F0E4] font-heading flex items-baseline gap-1">
                  45 <span className="text-xs font-normal text-[#9FAEA1]">Days Active</span>
                </div>
                <div className="w-full bg-[#121F18] h-2 rounded-full overflow-hidden border border-[#F3F0E4]/10">
                  <div className="bg-[#F0C93B] h-full w-[85%] rounded-full shadow-[0_0_10px_#F0C93B]" />
                </div>
              </div>

              {/* AI Research Pill */}
              <div
                className="rounded-2xl bg-[#C9A9E0]/10 border border-[#C9A9E0]/30 p-4 space-y-2 text-[#F3F0E4] shadow-lg"
                style={{ transform: "translateZ(40px)" }}
              >
                <div className="flex items-center gap-2 text-xs font-bold text-[#C9A9E0] font-heading">
                  <Sparkles className="size-4" /> AI Copilot Synthesis
                </div>
                <p className="text-[11px] text-[#9FAEA1] font-light leading-snug">
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
