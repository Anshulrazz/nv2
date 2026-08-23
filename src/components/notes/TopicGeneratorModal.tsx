"use client";

import React, { useState } from "react";
import { Sparkles, Loader2, Wand2, X, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface TopicGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (topic: string, contentHtml: string) => Promise<void>;
}

const SAMPLE_TOPICS = [
  "Quantum Computing & Qubits Mechanics",
  "Transformer Models & Attention Mechanisms",
  "Biochemistry: ATP Synthesis & Cellular Respiration",
  "Distributed Systems & Consensus Protocols (Raft / Paxos)",
  "Macroeconomics: Monetary Policy & Inflation Dynamics",
];

export function TopicGeneratorModal({ isOpen, onClose, onGenerate }: TopicGeneratorModalProps) {
  const [topic, setTopic] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [progressStep, setProgressStep] = useState<string>("");

  if (!isOpen) return null;

  const handleGenerate = async (selectedTopic?: string) => {
    const targetTopic = selectedTopic || topic;
    if (!targetTopic || targetTopic.trim() === "") {
      toast.error("Please enter a topic for AI note generation.");
      return;
    }

    setIsGenerating(true);
    setProgressStep("Initializing AI Deep Writer engine...");

    const stepInterval = setInterval(() => {
      const steps = [
        "Analyzing topic & domain literature...",
        "Drafting comprehensive 2,000+ word outline (2+ pages)...",
        "Formulating theoretical frameworks & equations...",
        "Writing code blueprints & detailed examples...",
        "Finalizing study checklist & formatting HTML...",
      ];
      setProgressStep((prev) => {
        const idx = steps.indexOf(prev);
        if (idx >= 0 && idx < steps.length - 1) return steps[idx + 1];
        return steps[0];
      });
    }, 2200);

    const toastId = toast.loading("Generating 2,000+ word deep-dive note...");

    try {
      const res = await fetch("/api/notes/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "generate_topic", topic: targetTopic }),
      });

      const data = await res.json();
      clearInterval(stepInterval);

      if (!res.ok) {
        toast.error(data.error || "Failed to generate note.", { id: toastId });
        return;
      }

      if (data.result) {
        toast.success("2,000+ word note generated successfully!", { id: toastId });
        await onGenerate(targetTopic, data.result);
        onClose();
        setTopic("");
      }
    } catch (err) {
      clearInterval(stepInterval);
      console.error(err);
      toast.error("An error occurred while generating note.", { id: toastId });
    } finally {
      setIsGenerating(false);
      setProgressStep("");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-[#150F0B] border border-[#2E2118] rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden">
        {/* Glow orb background decoration */}
        <div className="absolute -top-24 -right-24 size-60 bg-[#F5B429]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 size-60 bg-[#F5941D]/10 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={isGenerating}
          className="absolute top-5 right-5 text-[#8A8078] hover:text-[#FAFAF8] p-2 rounded-full hover:bg-[#241811] transition-colors disabled:opacity-50"
        >
          <X className="size-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="size-12 rounded-2xl bg-[#F5B429]/15 border border-[#F5B429]/30 flex items-center justify-center text-[#F5B429] shrink-0">
            <Sparkles className="size-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-[#FAFAF8] font-display">AI Note Topic Writer</h2>
              <span className="bg-[#F5B429]/10 border border-[#F5B429]/20 text-[#FCD34D] text-[10px] font-mono font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                <Zap className="size-3" /> 2,000+ Words (2 Pages)
              </span>
            </div>
            <p className="text-[#8A8078] text-xs mt-0.5">
              Enter any topic and AI will write an exhaustive, multi-chapter academic study note.
            </p>
          </div>
        </div>

        {/* Input area */}
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-mono font-bold text-[#8A8078] uppercase tracking-wider block">
              Topic or Research Subject
            </label>
            <Input
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              disabled={isGenerating}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !isGenerating) handleGenerate();
              }}
              placeholder="e.g. Quantum Supremacy, Cell Division, Macroeconomics, React 19..."
              className="bg-[#0A0806] border-[#2E2118] focus:border-[#F5B429] text-[#FAFAF8] placeholder-[#8A8078] h-11 text-sm rounded-xl"
            />
          </div>

          {/* Quick suggestions */}
          <div className="space-y-2">
            <span className="text-[10px] font-mono text-[#8A8078] uppercase tracking-wider block">
              Or pick a sample topic:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {SAMPLE_TOPICS.map((sample) => (
                <button
                  key={sample}
                  type="button"
                  disabled={isGenerating}
                  onClick={() => {
                    setTopic(sample);
                    handleGenerate(sample);
                  }}
                  className="text-[11px] bg-[#0A0806] border border-[#2E2118] hover:border-[#F5B429]/40 text-[#B8AFA6] hover:text-[#FAFAF8] px-2.5 py-1 rounded-lg transition-all text-left truncate max-w-full disabled:opacity-50"
                >
                  ✨ {sample}
                </button>
              ))}
            </div>
          </div>

          {/* Progress / Loading UI */}
          {isGenerating && (
            <div className="p-4 bg-[#150F0B] border border-[#F5B429]/30 rounded-2xl space-y-2 animate-in fade-in">
              <div className="flex items-center gap-2 text-[#FCD34D] text-xs font-bold font-mono">
                <Loader2 className="size-4 animate-spin text-[#F5B429]" />
                <span>Generating Deep Note...</span>
              </div>
              <p className="text-[11px] font-mono text-[#8A8078] animate-pulse">{progressStep}</p>
            </div>
          )}

          {/* Action buttons */}
          <div className="pt-3 flex items-center justify-end gap-3 border-t border-[#2E2118]">
            <Button
              type="button"
              variant="ghost"
              disabled={isGenerating}
              onClick={onClose}
              className="text-xs text-[#8A8078] hover:text-[#FAFAF8]"
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={isGenerating || !topic.trim()}
              onClick={() => handleGenerate()}
              className="btn-premium-primary text-xs h-10 px-5 gap-2"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  <span>Writing Note...</span>
                </>
              ) : (
                <>
                  <Wand2 className="size-4" />
                  <span>Generate 2,000+ Word Note</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
