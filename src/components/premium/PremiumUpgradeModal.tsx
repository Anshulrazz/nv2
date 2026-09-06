"use client";

import React, { useState } from "react";
import { Crown, Check, Sparkles, Loader2, X, Tag, TicketCheck, CreditCard, ShieldCheck, FolderGit2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { openRazorpayCheckout } from "@/lib/razorpay";

interface PremiumUpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentBalance?: number;
  onSuccess?: () => void;
  onOpenCoinConverter?: () => void;
}

export function PremiumUpgradeModal({
  isOpen,
  onClose,
  onSuccess,
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

  // Monthly plan starting from 149 INR, Yearly pass 399 INR
  const basePlanInr = selectedPlan === "monthly" ? 149 : 399;
  const discountAmount = appliedCoupon ? appliedCoupon.discountAmount : 0;
  const finalPlanCostInr = Math.max(1, basePlanInr - discountAmount);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setIsValidatingCoupon(true);
    try {
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: couponCode.trim(),
          amount: basePlanInr,
        }),
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
      toast.success(`Coupon '${data.code}' applied! ₹${data.discountAmount} discount.`);
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

  const handleRazorpayUpgrade = async () => {
    try {
      setIsUpgrading(true);

      if (selectedPlan === "monthly") {
        const res = await fetch("/api/razorpay/create-subscription", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            planId: "plan_TT5V5vOaLSgVtl",
            couponCode: appliedCoupon ? appliedCoupon.code : undefined,
          }),
        });

        const json = await res.json();
        if (!res.ok) {
          toast.error(json.error || "Failed to initiate subscription.");
          setIsUpgrading(false);
          return;
        }

        const isSubscriptionMode = json.mode === "subscription" && json.subscriptionId;

        await openRazorpayCheckout({
          key: json.keyId || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_test_fallback",
          name: "Notexia Premium Subscription",
          description: "Monthly Premium Plan (₹149/mo)",
          amount: isSubscriptionMode ? undefined : json.amount,
          currency: isSubscriptionMode ? undefined : json.currency || "INR",
          order_id: isSubscriptionMode ? undefined : json.orderId,
          subscription_id: isSubscriptionMode ? json.subscriptionId : undefined,
          theme: { color: "#F0C93B" },
          prefill: {
            name: json.user?.name,
            email: json.user?.email,
          },
          handler: async (response) => {
            try {
              const verifyRes = await fetch("/api/razorpay/verify-payment", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(response),
              });
              const verifyData = await verifyRes.json();
              if (verifyRes.ok && verifyData.success) {
                toast.success(verifyData.message || "Monthly subscription activated successfully! ✨");
                if (onSuccess) onSuccess();
                onClose();
              } else {
                toast.error(verifyData.error || "Subscription verification failed.");
              }
            } catch (verifyErr) {
              console.error(verifyErr);
              toast.error("Subscription verification error.");
            } finally {
              setIsUpgrading(false);
            }
          },
          modal: {
            ondismiss: () => {
              setIsUpgrading(false);
              toast.info("Payment cancelled.");
            },
          },
        });
      } else {
        // Yearly Pass order
        const res = await fetch("/api/razorpay/create-order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "subscription",
            plan: selectedPlan,
            couponCode: appliedCoupon ? appliedCoupon.code : undefined,
          }),
        });

        const json = await res.json();
        if (!res.ok) {
          toast.error(json.error || "Failed to create payment order.");
          setIsUpgrading(false);
          return;
        }

        await openRazorpayCheckout({
          key: json.keyId,
          amount: json.amount,
          currency: json.currency || "INR",
          name: "Notexia Premium Pass",
          description: "Annual Premium Subscription (₹399/yr)",
          order_id: json.orderId,
          theme: { color: "#F0C93B" },
          handler: async (response) => {
            try {
              const verifyRes = await fetch("/api/razorpay/verify-payment", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(response),
              });
              const verifyData = await verifyRes.json();
              if (verifyRes.ok && verifyData.success) {
                toast.success(verifyData.message || "Upgraded to Premium successfully! ✨");
                if (onSuccess) onSuccess();
                onClose();
              } else {
                toast.error(verifyData.error || "Payment verification failed.");
              }
            } catch (verifyErr) {
              console.error(verifyErr);
              toast.error("Payment verification error.");
            } finally {
              setIsUpgrading(false);
            }
          },
          modal: {
            ondismiss: () => {
              setIsUpgrading(false);
              toast.info("Payment cancelled.");
            },
          },
        });
      }
    } catch (err: unknown) {
      console.error(err);
      const message = err instanceof Error ? err.message : "Payment initiation failed.";
      toast.error(message);
      setIsUpgrading(false);
    }
  };

  const perks = [
    { text: "250 Project Files Capacity (No separate storage plan needed)", icon: FolderGit2, highlight: true },
    { text: "Ad-free learning experience across all courses & notes", icon: Check },
    { text: "Priority AI doubt resolution & unlimited note chats", icon: Check },
    { text: "Monetize projects & courses with 70% direct creator revenue", icon: Check, highlight: true },
    { text: "Exclusive premium formula sheets & verified notes", icon: Check },
    { text: "Gold Leaderboard badge & custom profile wallpapers", icon: Check },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-lg bg-[#150F0B] border border-[#2E2118] rounded-2xl p-6 sm:p-7 space-y-5 shadow-2xl relative overflow-hidden max-h-[92vh] overflow-y-auto text-[#FAFAF8]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#2E2118] pb-4">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-[#F5B429]/15 border border-[#F5B429]/30 flex items-center justify-center text-[#F5B429] shrink-0">
              <Crown className="size-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-[#FAFAF8] tracking-tight flex items-center gap-2">
                Upgrade Profile <Sparkles className="size-4 text-[#F5B429]" />
              </h2>
              <p className="text-xs text-[#8A8078]">
                One plan for all perks: 250 project files, monetization &amp; AI tools.
              </p>
            </div>
          </div>
          <Button
            size="icon"
            variant="ghost"
            onClick={onClose}
            className="size-8 text-[#8A8078] hover:text-[#FAFAF8] rounded-xl hover:bg-[#2E2118]/50"
          >
            <X className="size-4" />
          </Button>
        </div>

        {/* Plan Selector Cards */}
        <div className="grid grid-cols-2 gap-3">
          {/* Monthly */}
          <button
            type="button"
            onClick={() => {
              setSelectedPlan("monthly");
              if (appliedCoupon) setAppliedCoupon(null);
            }}
            className={`p-4 rounded-xl border text-left transition-all cursor-pointer relative ${
              selectedPlan === "monthly"
                ? "bg-[#241811] border-[#F5B429] shadow-lg shadow-[#F5B429]/10"
                : "bg-[#0A0806] border-[#2E2118] hover:border-[#8A8078]"
            }`}
          >
            {selectedPlan === "monthly" && (
              <span className="absolute top-2.5 right-2.5 size-2 rounded-full bg-[#F5B429]" />
            )}
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8A8078] font-mono block">
              Monthly Pass
            </span>
            <div className="mt-1.5 flex items-baseline gap-1">
              <span className="text-2xl font-bold font-mono text-[#F5B429]">₹149</span>
              <span className="text-xs text-[#8A8078] font-mono">/ mo</span>
            </div>
            <span className="text-[10px] text-[#8A8078] block mt-1">30 days validity</span>
          </button>

          {/* Yearly */}
          <button
            type="button"
            onClick={() => {
              setSelectedPlan("yearly");
              if (appliedCoupon) setAppliedCoupon(null);
            }}
            className={`p-4 rounded-xl border text-left transition-all cursor-pointer relative ${
              selectedPlan === "yearly"
                ? "bg-[#241811] border-[#F5B429] shadow-lg shadow-[#F5B429]/10"
                : "bg-[#0A0806] border-[#2E2118] hover:border-[#8A8078]"
            }`}
          >
            <span className="absolute -top-2.5 right-3 bg-[#F5B429] text-[#150F0B] text-[9px] font-bold px-2 py-0.5 rounded-full font-mono uppercase">
              Best Value
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8A8078] font-mono block">
              Annual Pass
            </span>
            <div className="mt-1.5 flex items-baseline gap-1">
              <span className="text-2xl font-bold font-mono text-[#F5B429]">₹399</span>
              <span className="text-xs text-[#8A8078] font-mono">/ yr</span>
            </div>
            <span className="text-[10px] text-[#8A8078] block mt-1">365 days validity</span>
          </button>
        </div>

        {/* Premium Perks */}
        <div className="space-y-2.5 bg-[#0A0806] border border-[#2E2118] rounded-xl p-4">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#8A8078] font-mono block">
            What&apos;s Included with Upgraded Profile:
          </span>
          <div className="space-y-2">
            {perks.map((perk, i) => {
              const IconComp = perk.icon;
              return (
                <div key={i} className={`flex items-center gap-2.5 text-xs ${perk.highlight ? "text-[#FAFAF8] font-semibold" : "text-[#B8AFA6]"}`}>
                  <div className={`size-4 rounded-full flex items-center justify-center shrink-0 ${perk.highlight ? "bg-[#F5B429]/20 text-[#F5B429]" : "bg-white/10 text-[#8A8078]"}`}>
                    <IconComp className="size-3 stroke-[2.5]" />
                  </div>
                  <span>{perk.text}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Coupon Code Section */}
        <div className="space-y-2 bg-[#0A0806] border border-[#2E2118] rounded-xl p-3">
          <div className="flex items-center justify-between text-xs font-mono text-[#8A8078]">
            <span className="flex items-center gap-1.5 font-semibold text-[#FAFAF8]">
              <Tag className="size-3.5 text-[#F5B429]" /> Have a Coupon Code?
            </span>
            {appliedCoupon && (
              <button
                type="button"
                onClick={handleRemoveCoupon}
                className="text-rose-400 hover:underline text-[11px]"
              >
                Remove
              </button>
            )}
          </div>

          {appliedCoupon ? (
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#F5B429]/10 border border-[#F5B429]/25 text-xs font-mono">
              <div className="flex items-center gap-2 text-[#F5B429]">
                <TicketCheck className="size-4 shrink-0" />
                <span>
                  <strong>{appliedCoupon.code}</strong> applied (-₹{appliedCoupon.discountAmount})
                </span>
              </div>
              <span className="text-emerald-400 font-semibold">Saved!</span>
            </div>
          ) : (
            <div className="flex gap-2">
              <Input
                type="text"
                placeholder="Enter coupon code (e.g. DISCOUNT20)"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                className="bg-[#150F0B] border-[#2E2118] text-[#FAFAF8] placeholder:text-[#8A8078]/60 text-xs h-9 font-mono"
              />
              <Button
                type="button"
                onClick={handleApplyCoupon}
                disabled={isValidatingCoupon || !couponCode.trim()}
                className="bg-[#241811] hover:bg-[#2E2118] text-[#F5B429] border border-[#F5B429]/30 text-xs h-9 font-bold px-3 shrink-0"
              >
                {isValidatingCoupon ? <Loader2 className="size-3.5 animate-spin" /> : "Apply"}
              </Button>
            </div>
          )}
        </div>

        {/* Amount & Checkout CTA */}
        <div className="space-y-3">
          <div className="flex justify-between items-center text-xs p-3 rounded-xl bg-[#0A0806] border border-[#2E2118] font-mono">
            <span className="text-[#8A8078]">Total Amount Payable:</span>
            <div className="flex items-center gap-2">
              {appliedCoupon && (
                <span className="line-through text-[#8A8078] text-xs">₹{basePlanInr}</span>
              )}
              <span className="font-bold text-[#F5B429] text-base font-mono">₹{finalPlanCostInr} INR</span>
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              className="flex-1 bg-[#0A0806] hover:bg-[#241811] border border-[#2E2118] text-[#8A8078] text-xs h-10 rounded-xl"
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={isUpgrading}
              onClick={handleRazorpayUpgrade}
              className="flex-1 btn-premium-primary text-xs h-10 rounded-xl flex items-center justify-center gap-2"
            >
              {isUpgrading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  <span>Connecting Razorpay...</span>
                </>
              ) : (
                <>
                  <CreditCard className="size-4" />
                  <span>Pay ₹{finalPlanCostInr} via Razorpay</span>
                </>
              )}
            </Button>
          </div>

          <div className="flex items-center justify-center gap-2 text-[10px] font-mono text-[#8A8078] text-center pt-1">
            <ShieldCheck className="size-3.5 text-emerald-400 shrink-0" />
            <span>Secure INR checkout via Razorpay (UPI, Credit/Debit Cards, NetBanking)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
