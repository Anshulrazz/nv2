"use client";

import React, { useState } from "react";
import { Bot, Sparkles, Send, CheckCircle2, Cpu } from "lucide-react";

const sampleQueries = [
  {
    topic: "Physics / Quantum",
    query: "Explain Schrodinger time-independent wave equation derivation in 3 steps.",
    response:
      "### Schrödinger Wave Equation\n1. **Wave Function**: \\(\\psi(x) = A e^{i(kx - \\omega t)}\\)\n2. **Hamiltonian Operator**: \\(\\hat{H}\\psi = E\\psi\\) where \\(\\hat{H} = -\\frac{\\hbar^2}{2m}\\nabla^2 + V(x)\\)\n3. **Final Form**: \\(-\\frac{\\hbar^2}{2m}\\frac{d^2\\psi}{dx^2} + V(x)\\psi = E\\psi\\)",
    badge: "GATE / JEE Physics",
  },
  {
    topic: "Computer Science",
    query: "Write a C++ function to invert a Binary Search Tree in O(N) time.",
    response:
      "```cpp\nTreeNode* invertTree(TreeNode* root) {\n    if (!root) return nullptr;\n    swap(root->left, root->right);\n    invertTree(root->left);\n    invertTree(root->right);\n    return root;\n}\n```",
    badge: "Data Structures",
  },
  {
    topic: "Mathematics",
    query: "How to convert VTU CGPA to percentage for 2022 scheme?",
    response:
      "### VTU Official Formula (2022 Scheme)\n$$\\text{Percentage (\\%)} = (\\text{CGPA} - 0.75) \\times 10$$\n\n*Example*: For a **8.5 CGPA**, \\((8.5 - 0.75) \\times 10 = \\mathbf{77.5\\%}\\).",
    badge: "University Tool",
  },
];

export function InteractiveDoubtSimulator() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [customInput, setCustomInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [activeQuery, setActiveQuery] = useState(sampleQueries[0]);
  const [engineName, setEngineName] = useState("OpenRouter AI (GPT-4o-mini)");

  const fetchOpenRouterResponse = async (userQuery: string, fallbackBadge: string) => {
    setIsTyping(true);
    try {
      const res = await fetch("/api/ai/demo-doubt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: userQuery }),
      });
      const data = await res.json();
      if (res.ok && data.response) {
        setActiveQuery({
          topic: "OpenRouter Doubt",
          query: userQuery,
          response: data.response,
          badge: fallbackBadge,
        });
        setEngineName(data.engine || "OpenRouter AI");
      } else {
        throw new Error(data.error || "OpenRouter failed");
      }
    } catch (err) {
      console.warn("Falling back to local preset:", err);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSelectQuery = (index: number) => {
    setActiveIndex(index);
    const selected = sampleQueries[index];
    setActiveQuery(selected);
    fetchOpenRouterResponse(selected.query, selected.badge);
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customInput.trim()) return;
    const queryText = customInput.trim();
    setCustomInput("");
    setActiveQuery({
      topic: "Live Student Doubt",
      query: queryText,
      response: "Synthesizing answer via OpenRouter AI...",
      badge: "Custom Query",
    });
    fetchOpenRouterResponse(queryText, "Custom AI Query");
  };

  return (
    <div className="rounded-[2.5rem] bg-[#150F0B]/85 border border-[#2E2118] p-2 sm:p-3 shadow-[0_0_50px_-10px_rgba(245,148,29,0.2)] backdrop-blur-2xl">
      <div className="rounded-[calc(2.5rem-0.5rem)] bg-[#0A0806] p-6 sm:p-10 space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#2E2118] pb-6">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 text-xs font-mono font-bold text-[#F5B429] bg-[#F5B429]/10 px-3 py-1 rounded-full border border-[#F5B429]/30">
              <Bot className="size-3.5 animate-pulse text-[#F5B429]" /> LIVE DEMO — OPENROUTER AI
            </div>
            <h3 className="text-2xl font-bold text-[#FAFAF8] font-display">
              Test Notexia AI Copilot in Real-Time
            </h3>
            <p className="text-xs text-[#8A8078] font-light">
              Click a sample student doubt prompt below or type your own question to see instant OpenRouter AI resolution:
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {sampleQueries.map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleSelectQuery(idx)}
                className={`text-xs px-3.5 py-1.5 rounded-full font-medium transition-all cursor-pointer ${
                  activeIndex === idx
                    ? "bg-gradient-to-r from-[#F5B429] to-[#F5941D] text-[#150F0B] font-bold shadow-[0_0_15px_rgba(245,180,41,0.3)]"
                    : "bg-[#150F0B] text-[#8A8078] hover:text-[#FAFAF8] border border-[#2E2118]"
                }`}
              >
                {q.topic}
              </button>
            ))}
          </div>
        </div>

        {/* QUERY & ANSWER DISPLAY BOX */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
          {/* LEFT: STUDENT PROMPT */}
          <div className="md:col-span-5 rounded-2xl bg-[#150F0B] border border-[#2E2118] p-5 space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-[#FCD34D] font-bold uppercase tracking-wider bg-[#FCD34D]/10 px-2.5 py-1 rounded-full border border-[#FCD34D]/20">
                  {activeQuery.badge}
                </span>
                <span className="text-[10px] font-mono text-[#8A8078]">STUDENT DOUBT PROMPT</span>
              </div>
              <div className="text-sm font-semibold text-[#FAFAF8] leading-relaxed bg-[#0A0806] p-4 rounded-xl border border-[#2E2118] min-h-[90px]">
                &quot;{activeQuery.query}&quot;
              </div>
            </div>

            <form onSubmit={handleCustomSubmit} className="pt-2">
              <div className="relative">
                <input
                  type="text"
                  value={customInput}
                  onChange={(e) => setCustomInput(e.target.value)}
                  placeholder="Ask any physics, math, or CS doubt..."
                  className="w-full rounded-full bg-[#0A0806] border border-[#2E2118] pl-4 pr-10 py-2.5 text-xs text-[#FAFAF8] placeholder-[#8A8078]/60 focus:outline-none focus:border-[#F5B429] transition-colors"
                />
                <button
                  type="submit"
                  disabled={isTyping}
                  className="absolute right-1.5 top-1.5 size-7 rounded-full bg-gradient-to-br from-[#F7C948] to-[#F5941D] text-[#150F0B] font-bold flex items-center justify-center transition-transform active:scale-90 disabled:opacity-50 shadow-[0_0_10px_rgba(245,180,41,0.3)] cursor-pointer"
                >
                  <Send className="size-3.5" />
                </button>
              </div>
            </form>
          </div>

          {/* RIGHT: AI COPILOT ANSWER OUTPUT */}
          <div className="md:col-span-7 rounded-2xl bg-[#150F0B] border border-[#F5B429]/30 p-5 space-y-4 flex flex-col justify-between shadow-[0_0_30px_-5px_rgba(245,148,29,0.15)] relative overflow-hidden">
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-[#2E2118] pb-3">
                <div className="flex items-center gap-2 text-xs font-bold text-[#FAFAF8] font-display">
                  <Sparkles className="size-4 text-[#F5B429]" /> Notexia AI Copilot
                </div>
                <span className="text-[10px] font-mono text-[#F5B429] bg-[#F5B429]/10 px-2.5 py-0.5 rounded-full border border-[#F5B429]/30">
                  OPENROUTER AI ACTIVE
                </span>
              </div>

              {isTyping ? (
                <div className="min-h-[120px] flex items-center justify-center space-x-2 text-xs font-mono text-[#FCD34D]">
                  <Cpu className="size-4 animate-spin text-[#F5B429]" />
                  <span>OpenRouter AI synthesizing resolution...</span>
                </div>
              ) : (
                <div className="font-mono text-xs text-[#FAFAF8] leading-relaxed bg-[#0A0806] p-4 rounded-xl border border-[#2E2118] whitespace-pre-wrap min-h-[120px]">
                  {activeQuery.response}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between text-[11px] text-[#8A8078] pt-2 border-t border-[#2E2118]">
              <span className="flex items-center gap-1.5 text-[#FCD34D]">
                <CheckCircle2 className="size-3.5" /> {engineName}
              </span>
              <span className="font-mono text-[#F5B429]">Live OpenRouter Model</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
