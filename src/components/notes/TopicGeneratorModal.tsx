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
  "Quantum Computing & Qubit Mechanics",
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
        "Analyzing topic & academic literature...",
        "Drafting comprehensive 2,000+ word study chapters...",
        "Formulating theoretical frameworks & equations...",
        "Writing code blueprints & detailed examples...",
        "Finalizing study checklist & formatting content...",
      ];
      setProgressStep((prev) => {
        const idx = steps.indexOf(prev);
        if (idx >= 0 && idx < steps.length - 1) return steps[idx + 1];
        return steps[0];
      });
    }, 2200);

    const toastId = toast.loading("Generating 2,000+ word deep study note...");

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
      toast.error("An error occurred during generation.", { id: toastId });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg bg-bg-surface border border-border-subtle rounded-2xl p-6 sm:p-7 shadow-2xl space-y-6">
        {/* Close button */}
        <button
          onClick={onClose}
          disabled={isGenerating}
          className="absolute top-4 right-4 text-text-muted hover:text-text-primary p-1 rounded-lg hover:bg-bg-elevated transition-colors disabled:opacity-50 cursor-pointer"
          aria-label="Close modal"
        >
          <X className="size-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3">
          <div className="size-11 rounded-xl bg-accent-primary/10 border border-accent-primary/20 flex items-center justify-center text-accent-primary shrink-0">
            <Sparkles className="size-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-text-primary font-display">
                AI Note Topic Writer
              </h2>
              <span className="bg-accent-primary/10 border border-accent-primary/20 text-accent-primary text-[10px] font-mono font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                <Zap className="size-3" /> 2,000+ Words
              </span>
            </div>
            <p className="text-text-muted text-xs mt-0.5">
              Enter any topic and AI will write an exhaustive study note.
            </p>
          </div>
        </div>

        {/* Input Area */}
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-mono font-bold text-text-muted uppercase tracking-wider block">
              Topic or Research Subject
            </label>
            <Input
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              disabled={isGenerating}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !isGenerating) handleGenerate();
              }}
              placeholder="e.g. Quantum Computing, Photosynthesis, Monetary Policy..."
              className="bg-bg-base border-border-subtle focus-visible:ring-accent-primary text-text-primary placeholder:text-text-muted h-10 text-xs rounded-xl"
            />
          </div>

          {/* Quick Suggestions */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-mono text-text-muted uppercase tracking-wider block">
              Sample Topics:
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
                  className="text-[11px] bg-bg-base border border-border-subtle hover:border-border-default text-text-secondary hover:text-text-primary px-2.5 py-1 rounded-lg transition-colors text-left truncate max-w-full disabled:opacity-50 cursor-pointer"
                >
                  ✨ {sample}
                </button>
              ))}
            </div>
          </div>

          {/* Progress / Loading UI */}
          {isGenerating && (
            <div className="p-3.5 bg-bg-elevated border border-accent-primary/30 rounded-xl space-y-1.5 animate-in fade-in duration-150">
              <div className="flex items-center gap-2 text-accent-primary text-xs font-semibold font-mono">
                <Loader2 className="size-3.5 animate-spin text-accent-primary" />
                <span>Writing comprehensive study note...</span>
              </div>
              <p className="text-[11px] font-mono text-text-muted animate-pulse">{progressStep}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-border-subtle">
            <Button
              type="button"
              variant="outline"
              disabled={isGenerating}
              onClick={onClose}
              className="h-9 px-4 text-xs border-border-subtle bg-bg-surface hover:bg-bg-elevated text-text-secondary hover:text-text-primary rounded-xl"
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={isGenerating || !topic.trim()}
              onClick={() => handleGenerate()}
              className="btn-premium-primary text-xs h-9 px-4 flex items-center gap-2"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <Wand2 className="size-3.5" />
                  <span>Generate Note</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
