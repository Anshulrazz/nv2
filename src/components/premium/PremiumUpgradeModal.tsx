"use client";

import React, { useState } from "react";
import { Crown, Check, Sparkles, Loader2, X, AlertCircle, Coins, Tag, TicketCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface PremiumUpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentBalance: number;
  onSuccess?: () => void;
  onOpenCoinConverter?: () => void;
}

export function PremiumUpgradeModal({
  isOpen,
  onClose,
  currentBalance,
  onSuccess,
  onOpenCoinConverter,
}: PremiumUpgradeModalProps) {
  const [selectedPlan, setSelectedPlan] = useState<"monthly" | "yearly">("monthly");
  const [isUpgrading, setIsUpgrading] = useState(false);

  // Coupon State
  const [couponCode, setCouponCode] = useState("");
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discountAmount: number;
    description: string;
  } | null>(null);

  if (!isOpen) return null;

  const basePlanCost = selectedPlan === "monthly" ? 500 : 5000;
  const discountAmount = appliedCoupon ? appliedCoupon.discountAmount : 0;
  const finalPlanCost = Math.max(0, basePlanCost - discountAmount);
  const isInsufficientCoins = currentBalance < finalPlanCost;

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setIsValidatingCoupon(true);
    try {
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: couponCode.trim(), amount: basePlanCost }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Invalid coupon code.");
        setAppliedCoupon(null);
        return;
      }

      setAppliedCoupon({
        code: data.code,
        discountAmount: data.discountAmount,
        description: data.description,
      });
      toast.success(`Coupon '${data.code}' applied! Saved ${data.discountAmount} coins.`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to validate coupon.");
    } finally {
      setIsValidatingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode("");
    toast.info("Coupon removed.");
  };

  const handleUpgrade = async () => {
    if (isInsufficientCoins) return;

    try {
      setIsUpgrading(true);
      const res = await fetch("/api/premium/upgrade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan: selectedPlan,
          couponCode: appliedCoupon ? appliedCoupon.code : undefined,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        toast.error(json.message || json.error || "Failed to upgrade.");
        return;
      }

      toast.success(json.message || "Upgraded to Premium successfully! ✨");
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      toast.error("An unexpected error occurred during upgrade.");
    } finally {
      setIsUpgrading(false);
    }
  };

  const perks = [
    "Ad-free learning experience across all courses & notes",
    "Priority AI doubt resolution & unlimited note chats",
    "Exclusive premium formula sheets & verified notes",
    "Gold Leaderboard badge & custom profile wallpapers",
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-lg bg-[#121F18] border border-[#F0C93B]/30 rounded-3xl p-6 sm:p-7 space-y-5 shadow-[0_0_50px_rgba(240,201,59,0.15)] relative overflow-hidden max-h-[90vh] overflow-y-auto">
        {/* Glow ambient background */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#F0C93B]/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#F3F0E4]/10 pb-4 relative z-10">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-[#F0C93B]/15 border border-[#F0C93B]/40 flex items-center justify-center text-[#F0C93B] shadow-inner">
              <Crown className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-[#F3F0E4] font-heading tracking-wide flex items-center gap-2">
                Notexia Premium <Sparkles className="h-4 w-4 text-[#F0C93B]" />
              </h2>
              <p className="text-xs text-[#9FAEA1]">
                Unlock unlimited learning tools & exclusive perks.
              </p>
            </div>
          </div>
          <Button
            size="icon"
            variant="ghost"
            onClick={onClose}
            className="h-8 w-8 text-[#9FAEA1] hover:text-[#F3F0E4] rounded-xl"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Plan Selector Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 relative z-10">
          {/* Monthly */}
          <button
            type="button"
            onClick={() => {
              setSelectedPlan("monthly");
              if (appliedCoupon) setAppliedCoupon(null);
            }}
            className={`p-4 rounded-2xl border text-left transition-all relative ${
              selectedPlan === "monthly"
                ? "bg-[#1A2D23] border-[#F0C93B] shadow-[0_0_20px_rgba(240,201,59,0.2)]"
                : "bg-[#16261D]/60 border-[#F3F0E4]/15 hover:border-[#F3F0E4]/30"
            }`}
          >
            {selectedPlan === "monthly" && (
              <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-[#F0C93B] animate-pulse" />
            )}
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#9FAEA1] font-mono block">
              Monthly Pass
            </span>
            <div className="mt-1.5 flex items-baseline gap-1">
              <span className="text-2xl font-black text-[#F0C93B] font-heading">500</span>
              <span className="text-xs font-bold text-[#F3F0E4]">coins</span>
            </div>
            <span className="text-[10px] text-[#9FAEA1] block mt-1">30 days validity</span>
          </button>

          {/* Yearly */}
          <button
            type="button"
            onClick={() => {
              setSelectedPlan("yearly");
              if (appliedCoupon) setAppliedCoupon(null);
            }}
            className={`p-4 rounded-2xl border text-left transition-all relative ${
              selectedPlan === "yearly"
                ? "bg-[#1A2D23] border-[#F0C93B] shadow-[0_0_20px_rgba(240,201,59,0.2)]"
                : "bg-[#16261D]/60 border-[#F3F0E4]/15 hover:border-[#F3F0E4]/30"
            }`}
          >
            <span className="absolute -top-2.5 right-3 bg-[#F0C93B] text-[#2A2118] text-[9px] font-extrabold px-2 py-0.5 rounded-full font-mono uppercase shadow-md">
              Save 16%
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#9FAEA1] font-mono block">
              Annual Pass
            </span>
            <div className="mt-1.5 flex items-baseline gap-1">
              <span className="text-2xl font-black text-[#F0C93B] font-heading">5,000</span>
              <span className="text-xs font-bold text-[#F3F0E4]">coins</span>
            </div>
            <span className="text-[10px] text-[#9FAEA1] block mt-1">365 days validity</span>
          </button>
        </div>

        {/* Premium Perks */}
        <div className="space-y-2 bg-[#16261D]/50 border border-[#F3F0E4]/10 rounded-2xl p-4 relative z-10">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#9FAEA1] font-mono block">
            What&apos;s Included with Premium:
          </span>
          <div className="space-y-2">
            {perks.map((perk, i) => (
              <div key={i} className="flex items-center gap-2.5 text-xs text-[#F3F0E4]">
                <div className="h-4 w-4 rounded-full bg-[#F0C93B]/20 flex items-center justify-center shrink-0 text-[#F0C93B]">
                  <Check className="h-3 w-3" />
                </div>
                <span>{perk}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Coupon Code Section */}
        <div className="space-y-2 bg-[#16261D]/80 border border-[#F3F0E4]/10 rounded-2xl p-3.5 relative z-10">
          <div className="flex items-center justify-between text-xs font-mono text-[#9FAEA1]">
            <span className="flex items-center gap-1.5 font-bold text-[#F3F0E4]">
              <Tag className="h-3.5 w-3.5 text-[#F0C93B]" /> Have a Coupon Code?
            </span>
            {appliedCoupon && (
              <button
                type="button"
                onClick={handleRemoveCoupon}
                className="text-red-400 hover:underline text-[11px]"
              >
                Remove
              </button>
            )}
          </div>

          {appliedCoupon ? (
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#F0C93B]/10 border border-[#F0C93B]/30 text-xs font-mono">
              <div className="flex items-center gap-2 text-[#F0C93B]">
                <TicketCheck className="h-4 w-4 shrink-0" />
                <span>
                  <strong>{appliedCoupon.code}</strong> applied (-{appliedCoupon.discountAmount} coins)
                </span>
              </div>
              <span className="text-emerald-400 font-bold">Saved!</span>
            </div>
          ) : (
            <div className="flex gap-2">
              <Input
                type="text"
                placeholder="Enter coupon code (e.g. NOTEXIA50)"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                className="bg-[#121F18] border-[#F3F0E4]/15 text-[#F3F0E4] placeholder:text-[#9FAEA1]/60 text-xs h-9 font-mono"
              />
              <Button
                type="button"
                onClick={handleApplyCoupon}
                disabled={isValidatingCoupon || !couponCode.trim()}
                className="bg-[#F0C93B]/20 hover:bg-[#F0C93B]/30 text-[#F0C93B] border border-[#F0C93B]/40 text-xs h-9 font-bold px-3 shrink-0"
              >
                {isValidatingCoupon ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Apply"}
              </Button>
            </div>
          )}
        </div>

        {/* Balance Status & Action */}
        <div className="space-y-3 relative z-10">
          <div className="flex justify-between items-center text-xs p-3 rounded-xl bg-[#16261D] border border-[#F3F0E4]/10 font-mono">
            <span className="text-[#9FAEA1]">Payable Coins:</span>
            <div className="flex items-center gap-2">
              {appliedCoupon && (
                <span className="text-[#9FAEA1] line-through text-[11px]">{basePlanCost}</span>
              )}
              <span className="font-bold text-[#F0C93B] flex items-center gap-1">
                <Coins className="h-3.5 w-3.5" /> {finalPlanCost.toLocaleString()} coins
              </span>
            </div>
          </div>

          <div className="flex justify-between items-center text-xs px-3 font-mono text-[#9FAEA1]">
            <span>Your Coin Balance:</span>
            <span className="text-[#F3F0E4] font-bold">{currentBalance.toLocaleString()} coins</span>
          </div>

          {isInsufficientCoins && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>Need <strong>{finalPlanCost - currentBalance}</strong> more coins.</span>
              </div>
              {onOpenCoinConverter && (
                <Button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenCoinConverter();
                  }}
                  className="bg-[#F0C93B] hover:bg-[#F0C93B]/90 text-[#2A2118] text-[10px] font-bold h-7 px-2.5 rounded-lg shrink-0"
                >
                  Buy Coins
                </Button>
              )}
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              className="flex-1 bg-[#16261D] hover:bg-[#1F362A] text-[#9FAEA1] text-xs h-11 rounded-xl"
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={isUpgrading || isInsufficientCoins}
              onClick={handleUpgrade}
              className="flex-1 bg-[#F0C93B] hover:bg-[#F0C93B]/90 text-[#2A2118] font-bold text-xs h-11 rounded-xl flex items-center justify-center gap-2 disabled:opacity-40 shadow-[0_0_20px_rgba(240,201,59,0.3)]"
            >
              {isUpgrading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-[#2A2118]" />
                  <span>Upgrading...</span>
                </>
              ) : isInsufficientCoins ? (
                <span>Not Enough Coins</span>
              ) : (
                <>
                  <Crown className="h-4 w-4" />
                  <span>Confirm & Upgrade ({finalPlanCost} Coins)</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
