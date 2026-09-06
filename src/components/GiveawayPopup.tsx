"use client";

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { X, Crown, Gift, Sparkles, Trophy, ArrowRight, Star, Target, Medal } from "lucide-react";

const STORAGE_KEY = "notexia_giveaway_seen";

export function GiveawayPopup() {
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [isPremium, setIsPremium] = useState<boolean | null>(null);
  const [showPremiumModal, setShowPremiumModal] = useState(false);

  useEffect(() => {
    // Only show on first-ever visit
    const hasSeen = localStorage.getItem(STORAGE_KEY);
    if (hasSeen) return;

    // Small delay so page renders first
    const timer = setTimeout(() => {
      setIsVisible(true);
      // Mark as seen
      localStorage.setItem(STORAGE_KEY, Date.now().toString());
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  // Fetch premium status when popup becomes visible
  useEffect(() => {
    if (!isVisible) return;

    const checkPremium = async () => {
      try {
        const res = await fetch("/api/premium/status");
        if (res.ok) {
          const data = await res.json();
          setIsPremium(Boolean(data.isPremium));
        } else {
          // Not logged in or error — treat as non-premium
          setIsPremium(false);
        }
      } catch {
        setIsPremium(false);
      }
    };

    checkPremium();
  }, [isVisible]);

  const handleClose = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => setIsVisible(false), 400);
  }, []);

  const handleUpgrade = useCallback(() => {
    handleClose();
    // Short delay to let popup close, then open premium modal
    setTimeout(() => setShowPremiumModal(true), 500);
  }, [handleClose]);

  const handleViewLeaderboard = useCallback(() => {
    handleClose();
    setTimeout(() => router.push("/leaderboard"), 450);
  }, [handleClose, router]);

  // Lazy-load the PremiumUpgradeModal only when needed
  useEffect(() => {
    if (!showPremiumModal) return;

    // Dynamic import to avoid loading the modal on every page
    import("@/components/premium/PremiumUpgradeModal").then(
      ({ PremiumUpgradeModal }) => {
        setPremiumModalComponent(() => PremiumUpgradeModal);
      }
    );
  }, [showPremiumModal]);

  const [PremiumModalComponent, setPremiumModalComponent] = useState<React.ComponentType<{
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
  }> | null>(null);

  if (!isVisible && !showPremiumModal) return null;

  return (
    <>
      {/* Giveaway Popup */}
      {isVisible && (
        <div
          className={`fixed inset-0 z-[100] flex items-center justify-center p-4 ${
            isClosing ? "giveaway-overlay-exit" : "giveaway-overlay-enter"
          }`}
          onClick={handleClose}
          role="dialog"
          aria-modal="true"
          aria-label="Giveaway announcement"
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/85 backdrop-blur-md" />

          {/* Floating particles */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
            {[...Array(20)].map((_, i) => (
              <div
                key={i}
                className="giveaway-particle"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 3}s`,
                  animationDuration: `${3 + Math.random() * 4}s`,
                  width: `${3 + Math.random() * 5}px`,
                  height: `${3 + Math.random() * 5}px`,
                }}
              />
            ))}
          </div>

          {/* Popup Card */}
          <div
            className={`relative w-full max-w-[420px] overflow-hidden rounded-3xl border border-[#F5B429]/30 bg-gradient-to-b from-[#1A1208] via-[#150F0B] to-[#0E0A06] shadow-[0_0_80px_rgba(245,180,41,0.15)] ${
              isClosing ? "giveaway-card-exit" : "giveaway-card-enter"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 z-20 size-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-all duration-200 cursor-pointer"
              aria-label="Close giveaway popup"
            >
              <X className="size-4" />
            </button>

            {/* Top Glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[200%] h-40 bg-gradient-radial from-[#F5B429]/20 via-transparent to-transparent pointer-events-none" />

            {/* Badge */}
            <div className="relative z-10 flex justify-center pt-6">
              <div className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#F5B429]/10 border border-[#F5B429]/25 text-[#F5B429]">
                <Gift className="size-3.5" />
                <span className="text-[11px] font-bold uppercase tracking-widest font-mono">
                  Top Contributors Giveaway
                </span>
                <Sparkles className="size-3.5" />
              </div>
            </div>

            {/* iPhone Image */}
            <div className="relative z-10 flex justify-center py-4 px-6">
              <div className="relative giveaway-phone-float">
                {/* Glow ring behind phone */}
                <div className="absolute inset-0 -m-4 rounded-3xl bg-[#F5B429]/5 blur-2xl" />
                <Image
                  src="/giveaway-iphone17.png"
                  alt="iPhone 17 Pro Max"
                  width={240}
                  height={240}
                  className="relative z-10 mix-blend-screen drop-shadow-[0_20px_60px_rgba(245,180,41,0.25)]"
                  priority
                />
              </div>
            </div>

            {/* Content */}
            <div className="relative z-10 px-6 pb-2 text-center space-y-2">
              <h2 className="text-xl sm:text-2xl font-bold text-[#FAFAF8] tracking-tight leading-tight">
                Win an{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#F5B429] via-[#FFD700] to-[#F5B429] giveaway-shimmer">
                  iPhone 17 Pro Max
                </span>
              </h2>
              <p className="text-[13px] text-[#8A8078] leading-relaxed max-w-[320px] mx-auto">
                Or a <strong className="text-[#B8AFA6]">MacBook Air</strong> — your choice!
                Exclusive for <strong className="text-[#FAFAF8]">top contributors</strong> on the leaderboard.
              </p>
            </div>

            {/* How to win steps */}
            <div className="relative z-10 px-6 py-1">
              <div className="grid grid-cols-3 gap-2">
                <div className="flex flex-col items-center gap-1.5 p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                  <div className="size-7 rounded-lg bg-[#F5B429]/10 flex items-center justify-center">
                    <Target className="size-3.5 text-[#F5B429]" />
                  </div>
                  <span className="text-[10px] text-[#8A8078] text-center font-mono leading-tight">Earn Points</span>
                </div>
                <div className="flex flex-col items-center gap-1.5 p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                  <div className="size-7 rounded-lg bg-[#F5B429]/10 flex items-center justify-center">
                    <Medal className="size-3.5 text-[#F5B429]" />
                  </div>
                  <span className="text-[10px] text-[#8A8078] text-center font-mono leading-tight">Climb Ranks</span>
                </div>
                <div className="flex flex-col items-center gap-1.5 p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                  <div className="size-7 rounded-lg bg-[#F5B429]/10 flex items-center justify-center">
                    <Trophy className="size-3.5 text-[#F5B429]" />
                  </div>
                  <span className="text-[10px] text-[#8A8078] text-center font-mono leading-tight">Win Prizes</span>
                </div>
              </div>
            </div>

            {/* Prize Chips */}
            <div className="relative z-10 flex justify-center gap-2 px-6 py-3">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#F5B429]/8 border border-[#F5B429]/15 text-[11px] text-[#B8AFA6] font-mono">
                <Trophy className="size-3 text-[#F5B429]" />
                iPhone 17 Pro Max
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-[11px] text-[#8A8078] font-mono">
                <Star className="size-3 text-[#8A8078]" />
                MacBook Air
              </div>
            </div>

            {/* CTA Section */}
            <div className="relative z-10 px-6 pb-6 pt-2 space-y-3">
              {isPremium === null ? (
                /* Loading state */
                <div className="h-12 rounded-2xl bg-white/5 animate-pulse" />
              ) : isPremium ? (
                /* Premium user — start contributing */
                <div className="space-y-3">
                  <button
                    onClick={handleViewLeaderboard}
                    className="group w-full relative overflow-hidden rounded-2xl p-[1px] cursor-pointer"
                  >
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-[#F5B429] via-[#FFD700] to-[#F5B429] giveaway-border-spin" />
                    <div className="relative flex items-center justify-center gap-2.5 rounded-[15px] bg-gradient-to-r from-[#1A1208] to-[#241811] px-6 py-3.5 transition-all duration-300 group-hover:from-[#241811] group-hover:to-[#2E2118]">
                      <Trophy className="size-4 text-[#F5B429] group-hover:scale-110 transition-transform duration-300" />
                      <span className="text-sm font-bold text-[#F5B429] tracking-wide">
                        View Leaderboard
                      </span>
                      <ArrowRight className="size-4 text-[#F5B429] group-hover:translate-x-1 transition-transform duration-300" />
                    </div>
                  </button>
                  <p className="text-[11px] text-[#8A8078] text-center font-mono leading-relaxed">
                    Contribute notes, blogs &amp; help others to climb the leaderboard. Top contributors win!
                  </p>
                </div>
              ) : (
                /* Non-premium — Upgrade CTA + leaderboard link */
                <div className="space-y-3">
                  <button
                    onClick={handleUpgrade}
                    className="group w-full relative overflow-hidden rounded-2xl p-[1px] cursor-pointer"
                  >
                    {/* Animated border gradient */}
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-[#F5B429] via-[#FFD700] to-[#F5B429] giveaway-border-spin" />
                    <div className="relative flex items-center justify-center gap-2.5 rounded-[15px] bg-gradient-to-r from-[#1A1208] to-[#241811] px-6 py-3.5 transition-all duration-300 group-hover:from-[#241811] group-hover:to-[#2E2118]">
                      <Crown className="size-4.5 text-[#F5B429] group-hover:scale-110 transition-transform duration-300" />
                      <span className="text-sm font-bold text-[#F5B429] tracking-wide">
                        Upgrade to Premium
                      </span>
                      <ArrowRight className="size-4 text-[#F5B429] group-hover:translate-x-1 transition-transform duration-300" />
                    </div>
                  </button>
                  <button
                    onClick={handleViewLeaderboard}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-[12px] font-mono text-[#8A8078] hover:text-[#FAFAF8] transition-colors cursor-pointer"
                  >
                    <Trophy className="size-3.5" />
                    <span>View Leaderboard Rankings</span>
                    <ArrowRight className="size-3" />
                  </button>
                  <p className="text-[11px] text-[#8A8078] text-center font-mono leading-relaxed">
                    Premium members get <strong className="text-[#F5B429]">2× points</strong> on every contribution.
                    Plans start at just <strong className="text-[#F5B429]">₹149/mo</strong>.
                  </p>
                </div>
              )}
            </div>

            {/* Bottom decorative line */}
            <div className="h-[2px] bg-gradient-to-r from-transparent via-[#F5B429]/30 to-transparent" />
          </div>
        </div>
      )}

      {/* Premium Upgrade Modal (lazy loaded) */}
      {showPremiumModal && PremiumModalComponent && (
        <PremiumModalComponent
          isOpen={showPremiumModal}
          onClose={() => setShowPremiumModal(false)}
          onSuccess={() => setShowPremiumModal(false)}
        />
      )}
    </>
  );
}
