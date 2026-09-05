"use client";

import React, { useState } from "react";
import { Crown, Check, Sparkles, Loader2, X, AlertCircle, Coins, Tag, TicketCheck, CreditCard, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { openRazorpayCheckout } from "@/lib/razorpay";

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
  const [paymentMethod, setPaymentMethod] = useState<"razorpay" | "coins">("razorpay");
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

  // changed by ravi - monthly plan starting from 149 INR
  const basePlanCoins = selectedPlan === "monthly" ? 500 : 5000;
  const basePlanInr = selectedPlan === "monthly" ? 149 : 399;

  const discountAmount = appliedCoupon ? appliedCoupon.discountAmount : 0;
  const finalPlanCostCoins = Math.max(0, basePlanCoins - discountAmount);
  const finalPlanCostInr = Math.max(1, basePlanInr - (appliedCoupon ? Math.round(discountAmount / 10) : 0));

  const isInsufficientCoins = currentBalance < finalPlanCostCoins;

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setIsValidatingCoupon(true);
    try {
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: couponCode.trim(),
          amount: paymentMethod === "coins" ? basePlanCoins : basePlanInr,
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
      toast.success(`Coupon '${data.code}' applied!`);
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

  // changed by ravi - support monthly recurring subscription & order fallback for 100% reliable checkout
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
          description: "Annual Premium Subscription",
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

  const handleCoinsUpgrade = async () => {
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
      <div className="w-full max-w-lg bg-bg-surface border border-border-default rounded-2xl p-6 sm:p-7 space-y-5 shadow-2xl relative overflow-hidden max-h-[90vh] overflow-y-auto text-text-primary">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border-subtle pb-4">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-accent-primary/10 border border-accent-primary/20 flex items-center justify-center text-accent-primary shrink-0">
              <Crown className="size-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-text-primary tracking-tight flex items-center gap-2">
                Notexia Premium <Sparkles className="size-4 text-accent-primary" />
              </h2>
              <p className="text-xs text-text-secondary">
                Unlock unlimited learning tools & exclusive perks.
              </p>
            </div>
          </div>
          <Button
            size="icon"
            variant="ghost"
            onClick={onClose}
            className="size-8 text-text-muted hover:text-text-primary rounded-xl"
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
            className={`p-4 rounded-xl border text-left transition-colors cursor-pointer relative ${
              selectedPlan === "monthly"
                ? "bg-bg-elevated border-accent-primary"
                : "bg-bg-elevated/40 border-border-subtle hover:border-border-default"
            }`}
          >
            {selectedPlan === "monthly" && (
              <span className="absolute top-2.5 right-2.5 size-2 rounded-full bg-accent-primary" />
            )}
            <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted font-mono block">
              Monthly Pass
            </span>
            <div className="mt-1.5 flex items-baseline gap-1">
              <span className="text-2xl font-bold font-mono text-accent-primary">500</span>
              <span className="text-xs text-text-muted font-mono">coins</span>
            </div>
            <span className="text-[10px] text-text-muted block mt-1">30 days validity</span>
          </button>

          {/* Yearly */}
          <button
            type="button"
            onClick={() => {
              setSelectedPlan("yearly");
              if (appliedCoupon) setAppliedCoupon(null);
            }}
            className={`p-4 rounded-xl border text-left transition-colors cursor-pointer relative ${
              selectedPlan === "yearly"
                ? "bg-bg-elevated border-accent-primary"
                : "bg-bg-elevated/40 border-border-subtle hover:border-border-default"
            }`}
          >
            <span className="absolute -top-2.5 right-3 bg-accent-primary text-bg-base text-[9px] font-bold px-2 py-0.5 rounded-full font-mono uppercase">
              Save 16%
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted font-mono block">
              Annual Pass
            </span>
            <div className="mt-1.5 flex items-baseline gap-1">
              <span className="text-2xl font-bold font-mono text-accent-primary">5,000</span>
              <span className="text-xs text-text-muted font-mono">coins</span>
            </div>
            <span className="text-[10px] text-text-muted block mt-1">365 days validity</span>
          </button>
        </div>

        {/* Premium Perks */}
        <div className="space-y-2 bg-bg-elevated/40 border border-border-subtle rounded-xl p-4">
          <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted font-mono block">
            What&apos;s Included with Premium:
          </span>
          <div className="space-y-2">
            {perks.map((perk, i) => (
              <div key={i} className="flex items-center gap-2.5 text-xs text-text-secondary">
                <div className="size-4 rounded-full bg-accent-primary/15 flex items-center justify-center shrink-0 text-accent-primary">
                  <Check className="size-3 stroke-[2.5]" />
                </div>
                <span>{perk}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Coupon Code Section */}
        <div className="space-y-2 bg-bg-elevated/40 border border-border-subtle rounded-xl p-3">
          <div className="flex items-center justify-between text-xs font-mono text-text-muted">
            <span className="flex items-center gap-1.5 font-semibold text-text-primary">
              <Tag className="size-3.5 text-accent-primary" /> Have a Coupon Code?
            </span>
            {appliedCoupon && (
              <button
                type="button"
                onClick={handleRemoveCoupon}
                className="text-destructive hover:underline text-[11px]"
              >
                Remove
              </button>
            )}
          </div>

          {appliedCoupon ? (
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-accent-primary/10 border border-accent-primary/25 text-xs font-mono">
              <div className="flex items-center gap-2 text-accent-primary">
                <TicketCheck className="size-4 shrink-0" />
                <span>
                  <strong>{appliedCoupon.code}</strong> applied (-{appliedCoupon.discountAmount} coins)
                </span>
              </div>
              <span className="text-emerald-400 font-semibold">Saved!</span>
            </div>
          ) : (
            <div className="flex gap-2">
              <Input
                type="text"
                placeholder="Enter coupon code (e.g. NOTEXIA50)"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                className="bg-bg-elevated border-border-subtle text-text-primary placeholder:text-text-muted/60 text-xs h-9 font-mono"
              />
              <Button
                type="button"
                onClick={handleApplyCoupon}
                disabled={isValidatingCoupon || !couponCode.trim()}
                className="bg-bg-elevated hover:bg-bg-elevated/80 text-accent-primary border border-border-default hover:border-accent-primary/40 text-xs h-9 font-bold px-3 shrink-0"
              >
                {isValidatingCoupon ? <Loader2 className="size-3.5 animate-spin" /> : "Apply"}
              </Button>
            </div>
          )}
        </div>

        {/* Payment Method Selector */}
        <div className="space-y-1.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted font-mono block">
            Select Payment Method:
          </span>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setPaymentMethod("razorpay")}
              className={`p-3 rounded-xl border text-left transition-colors flex items-center gap-2.5 cursor-pointer ${
                paymentMethod === "razorpay"
                  ? "bg-bg-elevated border-accent-primary text-text-primary"
                  : "bg-bg-elevated/40 border-border-subtle hover:border-border-default text-text-muted"
              }`}
            >
              <div className="size-7 rounded-lg bg-accent-primary/15 text-accent-primary flex items-center justify-center shrink-0">
                <CreditCard className="size-4" />
              </div>
              <div>
                <div className="text-xs font-semibold text-text-primary">Razorpay</div>
                <div className="text-[10px] font-mono text-text-muted">UPI / Cards / NetBanking</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setPaymentMethod("coins")}
              className={`p-3 rounded-xl border text-left transition-colors flex items-center gap-2.5 cursor-pointer ${
                paymentMethod === "coins"
                  ? "bg-bg-elevated border-accent-primary text-text-primary"
                  : "bg-bg-elevated/40 border-border-subtle hover:border-border-default text-text-muted"
              }`}
            >
              <div className="size-7 rounded-lg bg-accent-primary/15 text-accent-primary flex items-center justify-center shrink-0">
                <Coins className="size-4" />
              </div>
              <div>
                <div className="text-xs font-semibold text-text-primary">Coins</div>
                <div className="text-[10px] font-mono text-text-muted">Use Coin Balance</div>
              </div>
            </button>
          </div>
        </div>

        {/* Balance Status & Action */}
        <div className="space-y-3">
          <div className="flex justify-between items-center text-xs p-3 rounded-xl bg-bg-elevated/60 border border-border-subtle font-mono">
            <span className="text-text-muted">Total Amount:</span>
            <div className="flex items-center gap-2">
              {paymentMethod === "razorpay" ? (
                <span className="font-bold text-accent-primary text-sm font-mono">₹{finalPlanCostInr}</span>
              ) : (
                <span className="font-bold text-accent-primary flex items-center gap-1 font-mono">
                  <Coins className="size-3.5" /> {finalPlanCostCoins.toLocaleString()} coins
                </span>
              )}
            </div>
          </div>

          {paymentMethod === "coins" && (
            <div className="flex justify-between items-center text-xs px-3 font-mono text-text-muted">
              <span>Your Coin Balance:</span>
              <span className="text-text-primary font-bold">{currentBalance.toLocaleString()} coins</span>
            </div>
          )}

          {paymentMethod === "coins" && isInsufficientCoins && (
            <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-xs flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <AlertCircle className="size-4 shrink-0" />
                <span>Need <strong>{finalPlanCostCoins - currentBalance}</strong> more coins.</span>
              </div>
              {onOpenCoinConverter && (
                <Button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenCoinConverter();
                  }}
                  className="bg-accent-primary hover:bg-accent-primary-hover text-bg-base text-[10px] font-bold h-7 px-2.5 rounded-lg shrink-0 cursor-pointer"
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
              className="flex-1 bg-bg-elevated hover:bg-bg-elevated/80 border border-border-subtle text-text-secondary text-xs h-10 rounded-xl"
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={isUpgrading || (paymentMethod === "coins" && isInsufficientCoins)}
              onClick={paymentMethod === "razorpay" ? handleRazorpayUpgrade : handleCoinsUpgrade}
              className="flex-1 btn-premium-primary text-xs h-10 rounded-xl flex items-center justify-center gap-2 disabled:opacity-40"
            >
              {isUpgrading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : paymentMethod === "razorpay" ? (
                <>
                  <CreditCard className="size-4" />
                  <span>Pay ₹{finalPlanCostInr} via Razorpay</span>
                </>
              ) : isInsufficientCoins ? (
                <span>Not Enough Coins</span>
              ) : (
                <>
                  <Crown className="size-4" />
                  <span>Upgrade ({finalPlanCostCoins} Coins)</span>
                </>
              )}
            </Button>
          </div>

          {paymentMethod === "razorpay" && (
            <div className="flex items-center justify-center gap-2 text-[10px] font-mono text-text-muted text-center pt-1">
              <ShieldCheck className="size-3.5 text-emerald-400 shrink-0" />
              <span>Instant Premium Activation via Razorpay (UPI, Credit/Debit Cards, NetBanking)</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
