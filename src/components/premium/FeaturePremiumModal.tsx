"use client";

import React from "react";
import {
  Crown,
  Sparkles,
  X,
  FileText,
  Layers,
  HelpCircle,
  ArrowRight,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export interface FeatureItem {
  title: string;
  desc: string;
  icon?: React.ComponentType<{ className?: string }>;
  badge?: string;
  color?: string;
}

export interface FeaturePremiumModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgrade: () => void;
  title?: string;
  badge?: string;
  errorMessage?: string;
  features?: FeatureItem[];
  pricingHint?: string;
}

const DEFAULT_FEATURES: FeatureItem[] = [
  {
    title: "AI Cheat Sheets",
    desc: "Instant high-yield summaries, formulas, and definitions from your notes.",
    icon: FileText,
    badge: "Fast Revision",
    color: "from-amber-500/20 to-orange-500/10 text-amber-400 border-amber-500/30",
  },
  {
    title: "Spaced Flashcards",
    desc: "Interactive flip-cards optimized for active recall and exam memory retention.",
    icon: Layers,
    badge: "Active Recall",
    color: "from-yellow-500/20 to-amber-500/10 text-yellow-400 border-yellow-500/30",
  },
  {
    title: "Practice Exam Quizzes",
    desc: "Auto-generated MCQ quizzes with instant grading and step-by-step solutions.",
    icon: HelpCircle,
    badge: "Exam Ready",
    color: "from-emerald-500/20 to-teal-500/10 text-emerald-400 border-emerald-500/30",
  },
];

export function FeaturePremiumModal({
  isOpen,
  onClose,
  onUpgrade,
  title = "Unlock Premium AI Features",
  badge = "PREMIUM EXCLUSIVE",
  errorMessage = "This is an exclusive Premium feature. Upgrade to Premium to unlock full AI capabilities!",
  features = DEFAULT_FEATURES,
  pricingHint = "₹149/mo",
}: FeaturePremiumModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      {/* Click outside to close */}
      <div className="fixed inset-0" onClick={onClose} />

      <div className="relative w-full max-w-lg bg-[#140E0A] border border-[#F5B429]/30 rounded-3xl p-6 sm:p-7 shadow-[0_0_50px_rgba(245,180,41,0.15)] text-[#FAFAF8] overflow-hidden z-10 space-y-5">
        {/* Background glow ambient */}
        <div className="absolute -top-24 -right-24 size-56 bg-[#F5B429]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 size-56 bg-[#F5941D]/10 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 size-8 rounded-full bg-[#2E2118]/60 hover:bg-[#2E2118] text-[#8A8078] hover:text-[#FAFAF8] flex items-center justify-center transition-colors cursor-pointer z-10"
          aria-label="Close"
        >
          <X className="size-4" />
        </button>

        {/* Header Badge & Title */}
        <div className="space-y-3 pt-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F5B429]/15 border border-[#F5B429]/30 text-[#F5B429] text-[11px] font-bold tracking-wider uppercase font-mono">
            <Crown className="size-3.5" />
            <span>{badge}</span>
          </div>

          <div className="space-y-1.5">
            <h2 className="text-xl sm:text-2xl font-black text-[#FAFAF8] tracking-tight flex items-center gap-2">
              <span>{title}</span>
              <Sparkles className="size-5 text-[#F5B429] animate-pulse" />
            </h2>
            <p className="text-xs sm:text-sm text-[#A89F91] leading-relaxed">
              {errorMessage}
            </p>
          </div>
        </div>

        {/* Feature Cards Showcase */}
        {features && features.length > 0 && (
          <div className="space-y-2.5">
            <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#8A8078] flex items-center gap-1.5">
              <Zap className="size-3 text-[#F5B429]" />
              <span>What&apos;s Included in Premium</span>
            </div>

            <div className={`grid grid-cols-1 ${features.length === 2 ? "sm:grid-cols-2" : "sm:grid-cols-3"} gap-2.5`}>
              {features.map((item, idx) => {
                const Icon = item.icon || Zap;
                return (
                  <div
                    key={idx}
                    className="rounded-2xl bg-[#1D140F] border border-[#2E2118] p-3.5 space-y-2 flex flex-col justify-between hover:border-[#F5B429]/40 transition-colors"
                  >
                    <div className="space-y-1.5">
                      <div className={`size-8 rounded-xl bg-gradient-to-br ${item.color || "from-amber-500/20 to-orange-500/10 text-amber-400 border-amber-500/30"} border flex items-center justify-center shrink-0`}>
                        <Icon className="size-4" />
                      </div>
                      <h3 className="text-xs font-bold text-[#FAFAF8]">
                        {item.title}
                      </h3>
                      <p className="text-[11px] text-[#8A8078] leading-tight">
                        {item.desc}
                      </p>
                    </div>
                    {item.badge && (
                      <span className="text-[9px] font-mono font-semibold text-[#F5B429]/80 uppercase">
                        {item.badge}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Additional Perks Banner */}
        <div className="rounded-xl bg-[#1D140F]/80 border border-[#2E2118] p-3 flex items-center justify-between gap-3 text-xs text-[#A89F91]">
          <div className="flex items-center gap-2">
            <ShieldCheck className="size-4 text-[#F5B429] shrink-0" />
            <span className="text-[11px] leading-snug">
              Also includes <strong className="text-[#FAFAF8]">250 Project Files</strong>, <strong className="text-[#FAFAF8]">Ad-Free Experience</strong> &amp; <strong className="text-[#FAFAF8]">2× Leaderboard Points</strong>
            </span>
          </div>
          <span className="text-[11px] font-bold text-[#F5B429] whitespace-nowrap">
            {pricingHint}
          </span>
        </div>

        {/* Action Buttons / CTA */}
        <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
          <Button
            onClick={onUpgrade}
            className="flex-1 bg-gradient-to-r from-[#F7C948] via-[#F5B429] to-[#F5941D] hover:from-[#F5B429] hover:to-[#E58312] text-[#150F0B] font-bold h-11 px-5 rounded-xl text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(245,180,41,0.25)] hover:shadow-[0_0_30px_rgba(245,180,41,0.4)] transition-all cursor-pointer"
          >
            <Crown className="size-4 fill-current" />
            <span>Upgrade to Premium</span>
            <ArrowRight className="size-4" />
          </Button>

          <Button
            variant="ghost"
            onClick={onClose}
            className="sm:w-auto h-11 px-4 rounded-xl text-xs font-semibold text-[#8A8078] hover:text-[#FAFAF8] hover:bg-[#2E2118]/50 cursor-pointer"
          >
            Maybe Later
          </Button>
        </div>
      </div>
    </div>
  );
}
