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
    <div className="rounded-[2.5rem] bg-[#1A2D23]/90 border border-[#F3F0E4]/15 p-2 sm:p-3 shadow-2xl">
      <div className="rounded-[calc(2.5rem-0.5rem)] bg-[#121F18] p-6 sm:p-10 space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#F3F0E4]/10 pb-6">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 text-xs font-mono font-bold text-[#F0C93B] bg-[#F0C93B]/10 px-3 py-1 rounded-full border border-[#F0C93B]/30">
              <Bot className="size-3.5 animate-pulse" /> LIVE DEMO — OPENROUTER AI
            </div>
            <h3 className="text-2xl font-bold text-white font-heading">
              Test Notexia AI Copilot in Real-Time
            </h3>
            <p className="text-xs text-[#9FAEA1] font-light">
              Click a sample student doubt prompt below or type your own question to see instant OpenRouter AI resolution:
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {sampleQueries.map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleSelectQuery(idx)}
                className={`text-xs px-3.5 py-1.5 rounded-full font-heading font-medium transition-all ${
                  activeIndex === idx
                    ? "bg-[#F0C93B] text-[#2A2118] font-bold shadow-md"
                    : "bg-[#16261D] text-[#9FAEA1] hover:text-white border border-[#F3F0E4]/10"
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
          <div className="md:col-span-5 rounded-2xl bg-[#16261D] border border-[#F3F0E4]/15 p-5 space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-[#8FC3DE] font-bold uppercase tracking-wider bg-[#8FC3DE]/10 px-2.5 py-1 rounded-full border border-[#8FC3DE]/20">
                  {activeQuery.badge}
                </span>
                <span className="text-[10px] font-mono text-[#9FAEA1]">STUDENT DOUBT PROMPT</span>
              </div>
              <div className="text-sm font-semibold text-[#F3F0E4] leading-relaxed bg-[#121F18] p-4 rounded-xl border border-[#F3F0E4]/10 min-h-[90px]">
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
                  className="w-full rounded-full bg-[#121F18] border border-[#F3F0E4]/20 pl-4 pr-10 py-2.5 text-xs text-white placeholder-[#9FAEA1]/50 focus:outline-none focus:border-[#F0C93B] transition-colors"
                />
                <button
                  type="submit"
                  disabled={isTyping}
                  className="absolute right-1.5 top-1.5 size-7 rounded-full bg-[#F0C93B] hover:bg-[#F0C93B]/90 text-[#2A2118] flex items-center justify-center transition-transform active:scale-90 disabled:opacity-50"
                >
                  <Send className="size-3.5" />
                </button>
              </div>
            </form>
          </div>

          {/* RIGHT: AI COPILOT ANSWER OUTPUT */}
          <div className="md:col-span-7 rounded-2xl bg-[#16261D] border border-[#F0C93B]/30 p-5 space-y-4 flex flex-col justify-between shadow-xl relative overflow-hidden">
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-[#F3F0E4]/10 pb-3">
                <div className="flex items-center gap-2 text-xs font-bold text-white font-heading">
                  <Sparkles className="size-4 text-[#F0C93B]" /> Notexia AI Copilot
                </div>
                <span className="text-[10px] font-mono text-[#F0C93B] bg-[#F0C93B]/10 px-2.5 py-0.5 rounded-full border border-[#F0C93B]/30">
                  OPENROUTER AI ACTIVE
                </span>
              </div>

              {isTyping ? (
                <div className="min-h-[120px] flex items-center justify-center space-x-2 text-xs font-mono text-[#8FC3DE]">
                  <Cpu className="size-4 animate-spin text-[#F0C93B]" />
                  <span>OpenRouter AI synthesizing resolution...</span>
                </div>
              ) : (
                <div className="font-mono text-xs text-[#F3F0E4] leading-relaxed bg-[#121F18] p-4 rounded-xl border border-[#F3F0E4]/10 whitespace-pre-wrap min-h-[120px]">
                  {activeQuery.response}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between text-[11px] text-[#9FAEA1] pt-2 border-t border-[#F3F0E4]/10">
              <span className="flex items-center gap-1.5 text-[#8FC3DE]">
                <CheckCircle2 className="size-3.5" /> {engineName}
              </span>
              <span className="font-mono text-[#F0C93B]">Live OpenRouter Model</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
