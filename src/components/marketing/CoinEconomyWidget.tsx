"use client";

import React, { useState, useEffect, useRef } from "react";
import gsap from "gsap";
import { Coins, Sparkles, ArrowRight, Wallet, CheckCircle2, TrendingUp } from "lucide-react";
import Link from "next/link";

export function CoinEconomyWidget() {
  const [inrAmount, setInrAmount] = useState<number>(100);
  const coinsDisplayRef = useRef<HTMLSpanElement>(null);
  const creatorDisplayRef = useRef<HTMLSpanElement>(null);
  const prevInrRef = useRef<number>(100);

  // Math: 1 INR = 10 Coins. Creator receives 70% of the coin value in INR
  const totalCoins = inrAmount * 10;
  const creatorEarnCoins = Math.round(totalCoins * 0.7);
  const creatorEarnInr = (creatorEarnCoins / 10).toFixed(2);

  useEffect(() => {
    // GSAP Counter Animation
    const targetObj = {
      coins: prevInrRef.current * 10,
      creatorCoins: Math.round(prevInrRef.current * 10 * 0.7),
    };

    gsap.to(targetObj, {
      coins: totalCoins,
      creatorCoins: creatorEarnCoins,
      duration: 0.5,
      ease: "power2.out",
      onUpdate: () => {
        if (coinsDisplayRef.current) {
          coinsDisplayRef.current.textContent = Math.round(targetObj.coins).toLocaleString();
        }
        if (creatorDisplayRef.current) {
          creatorDisplayRef.current.textContent = Math.round(targetObj.creatorCoins).toLocaleString();
        }
      },
    });

    prevInrRef.current = inrAmount;
  }, [inrAmount, totalCoins, creatorEarnCoins]);

  const presetAmounts = [29, 99, 249, 499, 999];

  return (
    <div className="relative w-full rounded-3xl bg-[#150F0B]/90 border border-[#2E2118] p-6 sm:p-8 backdrop-blur-xl shadow-[0_10px_40px_-15px_rgba(245,180,41,0.12)] overflow-hidden">
      {/* Decorative background glow */}
      <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-[#F5B429]/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-[#F5941D]/10 blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#2E2118]">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F5B429]/10 border border-[#F5B429]/25 text-[#F5B429] text-xs font-mono uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            Transparent Economy
          </div>
          <h3 className="text-xl sm:text-2xl font-bold font-display text-[#FAFAF8] tracking-tight">
            1 INR = 10 Coins Architecture
          </h3>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs text-[#8A8078] bg-[#0A0806] px-3 py-1.5 rounded-lg border border-[#2E2118]">
          <span className="w-2 h-2 rounded-full bg-[#22C55E] animate-pulse" />
          <span>Real-time Coin Valuation</span>
        </div>
      </div>

      {/* Interactive Controls */}
      <div className="py-6 space-y-6">
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-[#8A8078]">Select Course or Project Price:</span>
            <span className="font-mono font-bold text-lg text-[#F5B429]">₹{inrAmount}</span>
          </div>

          {/* Slider */}
          <input
            type="range"
            min="10"
            max="1500"
            step="10"
            value={inrAmount}
            onChange={(e) => setInrAmount(Number(e.target.value))}
            className="w-full h-2 bg-[#241811] rounded-lg appearance-none cursor-pointer accent-[#F5B429]"
          />

          {/* Quick Preset Buttons */}
          <div className="flex flex-wrap gap-2 pt-2">
            {presetAmounts.map((amt) => (
              <button
                key={amt}
                type="button"
                onClick={() => setInrAmount(amt)}
                className={`px-3 py-1.5 text-xs font-mono rounded-lg transition-all border ${
                  inrAmount === amt
                    ? "bg-[#F5B429] text-[#0A0806] border-[#F5B429] font-bold shadow-[0_0_15px_rgba(245,180,41,0.3)]"
                    : "bg-[#0A0806] text-[#B8AFA6] border-[#2E2118] hover:border-[#F5B429]/40"
                }`}
              >
                ₹{amt}
              </button>
            ))}
          </div>
        </div>

        {/* Calculation Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Card 1: Student Unlock Value */}
          <div className="p-4 rounded-2xl bg-[#0A0806] border border-[#2E2118] relative overflow-hidden group hover:border-[#F5B429]/30 transition-colors">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono text-[#8A8078] uppercase">Student Unlocks For</span>
              <Coins className="w-4 h-4 text-[#F5B429]" />
            </div>
            <div className="flex items-baseline gap-2">
              <span ref={coinsDisplayRef} className="text-3xl font-black font-display text-[#FAFAF8]">
                {totalCoins.toLocaleString()}
              </span>
              <span className="text-xs font-mono text-[#F5B429]">Coins</span>
            </div>
            <div className="text-xs text-[#8A8078] mt-1 font-mono">
              Equivalent to ₹{inrAmount} (Instant wallet deduction)
            </div>
          </div>

          {/* Card 2: Creator Revenue Share (70%) */}
          <div className="p-4 rounded-2xl bg-[#0A0806] border border-[#2E2118] relative overflow-hidden group hover:border-[#F5B429]/30 transition-colors">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono text-[#8A8078] uppercase">Creator Earns (70% Split)</span>
              <Wallet className="w-4 h-4 text-[#22C55E]" />
            </div>
            <div className="flex items-baseline gap-2">
              <span ref={creatorDisplayRef} className="text-3xl font-black font-display text-[#22C55E]">
                {creatorEarnCoins.toLocaleString()}
              </span>
              <span className="text-xs font-mono text-[#22C55E]">Coins</span>
            </div>
            <div className="text-xs text-[#8A8078] mt-1 font-mono">
              = <strong className="text-[#FAFAF8]">₹{creatorEarnInr}</strong> net withdrawable to bank
            </div>
          </div>
        </div>

        {/* Monetization Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs text-[#B8AFA6]">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#F5B429] shrink-0" />
            <span>Direct UPI & Bank payouts</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#F5B429] shrink-0" />
            <span>Zero hidden platform cuts</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#F5B429] shrink-0" />
            <span>Coins unlock courses & projects</span>
          </div>
        </div>
      </div>

      {/* Footer CTA */}
      <div className="pt-4 border-t border-[#2E2118] flex flex-col sm:flex-row items-center justify-between gap-4">
        <span className="text-xs text-[#8A8078]">
          Earn verified coins by publishing engineering notes, solving doubts, or teaching courses.
        </span>
        <Link
          href="/courses"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#F5B429] text-[#0A0806] font-bold text-xs font-mono hover:bg-[#F5941D] transition-all duration-300 shadow-[0_0_20px_rgba(245,180,41,0.25)] shrink-0"
        >
          <span>Explore Marketplace</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
