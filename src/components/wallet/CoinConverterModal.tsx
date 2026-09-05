"use client";

import React, { useState } from "react";
import { Coins, Sparkles, X, Tag, TicketCheck, Loader2, CreditCard, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { openRazorpayCheckout } from "@/lib/razorpay";

interface CoinConverterModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentBalance?: number;
  onSuccess?: () => void;
}

export function CoinConverterModal({
  isOpen,
  onClose,
  currentBalance = 0,
  onSuccess,
}: CoinConverterModalProps) {
  const [inrAmount, setInrAmount] = useState<number | "">(50);
  const [coinsRequested, setCoinsRequested] = useState<number | "">(500);
  const [isConverting, setIsConverting] = useState(false);

  // Coupon state
  const [couponCode, setCouponCode] = useState("");
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discountAmount: number;
    description: string;
  } | null>(null);

  if (!isOpen) return null;

  const handleInrChange = (val: string) => {
    const num = parseFloat(val);
    if (isNaN(num) || num < 0) {
      setInrAmount("");
      setCoinsRequested("");
      return;
    }
    setInrAmount(num);
    setCoinsRequested(num * 10);
  };

  const handleCoinsChange = (val: string) => {
    const num = parseFloat(val);
    if (isNaN(num) || num < 0) {
      setCoinsRequested("");
      setInrAmount("");
      return;
    }
    setCoinsRequested(num);
    setInrAmount(Math.ceil(num / 10));
  };

  const handleSelectPack = (coins: number, rupees: number) => {
    setCoinsRequested(coins);
    setInrAmount(rupees);
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setIsValidatingCoupon(true);
    try {
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: couponCode.trim(), amount: Number(inrAmount) || 50 }),
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

  const handleConvert = async () => {
    const coinsNum = Number(coinsRequested);
    const inrNum = Number(inrAmount);

    if (!coinsNum || coinsNum <= 0) {
      toast.error("Please enter a valid coin amount.");
      return;
    }

    try {
      setIsConverting(true);
      const res = await fetch("/api/razorpay/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "buy_coins",
          amountINR: inrNum,
          coinsRequested: coinsNum,
          couponCode: appliedCoupon ? appliedCoupon.code : undefined,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error || "Failed to create payment order.");
        setIsConverting(false);
        return;
      }

      await openRazorpayCheckout({
        key: json.keyId,
        amount: json.amount,
        currency: json.currency || "INR",
        name: "Notexia Coins",
        description: `Purchase ${json.coinsToDeliver} Notexia Coins`,
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
              toast.success(verifyData.message || `Added ${json.coinsToDeliver} coins to your balance! ✨`);
              if (onSuccess) onSuccess();
              onClose();
            } else {
              toast.error(verifyData.error || "Payment verification failed.");
            }
          } catch (verifyErr) {
            console.error(verifyErr);
            toast.error("Payment verification error.");
          } finally {
            setIsConverting(false);
          }
        },
        modal: {
          ondismiss: () => {
            setIsConverting(false);
            toast.info("Payment cancelled.");
          },
        },
      });
    } catch (err: unknown) {
      console.error(err);
      const msg = err instanceof Error ? err.message : "An unexpected error occurred during payment.";
      toast.error(msg);
      setIsConverting(false);
    }
  };

  const finalInr = Math.max(0, Number(inrAmount) - (appliedCoupon ? appliedCoupon.discountAmount : 0));


  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-lg max-h-[92vh] overflow-y-auto custom-scroll bg-bg-surface border border-border-default rounded-2xl p-5 sm:p-6 space-y-5 shadow-2xl relative text-text-primary">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border-subtle pb-4">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-accent-primary/10 border border-accent-primary/20 flex items-center justify-center text-accent-primary shrink-0">
              <Coins className="size-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-text-primary tracking-tight flex items-center gap-2">
                Coin Converter <Sparkles className="size-4 text-accent-primary" />
              </h2>
              <p className="text-xs text-text-secondary">Convert INR (₹) to Notexia Coins instantly.</p>
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

        {/* Current Balance */}
        <div className="flex justify-between items-center text-xs p-3 rounded-xl bg-bg-elevated/60 border border-border-subtle font-mono">
          <span className="text-text-muted">Current Balance:</span>
          <span className="font-bold text-accent-primary flex items-center gap-1">
            <Coins className="size-3.5" /> {currentBalance.toLocaleString()} coins
          </span>
        </div>

        {/* Quick Packs */}
        <div className="space-y-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted font-mono block">
            Popular Coin Packs:
          </span>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleSelectPack(100, 10)}
              className={`p-3 rounded-xl border text-center transition-colors cursor-pointer ${
                coinsRequested === 100
                  ? "bg-bg-elevated border-accent-primary text-accent-primary font-bold"
                  : "bg-bg-elevated/50 border-border-subtle hover:border-border-default text-text-primary"
              }`}
            >
              <div className="text-sm font-bold font-mono">100 Coins</div>
              <div className="text-[10px] font-mono text-text-muted">₹10</div>
            </button>

            <button
              type="button"
              onClick={() => handleSelectPack(500, 50)}
              className={`p-3 rounded-xl border text-center transition-colors cursor-pointer relative ${
                coinsRequested === 500
                  ? "bg-bg-elevated border-accent-primary text-accent-primary font-bold"
                  : "bg-bg-elevated/50 border-border-subtle hover:border-border-default text-text-primary"
              }`}
            >
              <span className="absolute -top-2 left-1/2 -translate-x-1/2 bg-accent-primary text-bg-base text-[8px] font-bold px-1.5 py-0.2 rounded-full font-mono uppercase">
                Popular
              </span>
              <div className="text-sm font-bold font-mono">500 Coins</div>
              <div className="text-[10px] font-mono text-text-muted">₹50</div>
            </button>

            <button
              type="button"
              onClick={() => handleSelectPack(5000, 400)}
              className={`p-3 rounded-xl border text-center transition-colors cursor-pointer relative ${
                coinsRequested === 5000
                  ? "bg-bg-elevated border-accent-primary text-accent-primary font-bold"
                  : "bg-bg-elevated/50 border-border-subtle hover:border-border-default text-text-primary"
              }`}
            >
              <span className="absolute -top-2 left-1/2 -translate-x-1/2 bg-accent-primary text-bg-base text-[8px] font-bold px-1.5 py-0.2 rounded-full font-mono uppercase">
                Save 20%
              </span>
              <div className="text-sm font-bold font-mono">5,000 Coins</div>
              <div className="text-[10px] font-mono text-text-muted">₹400</div>
            </button>
          </div>
        </div>

        {/* Custom Converter Inputs */}
        <div className="grid grid-cols-2 gap-3 items-center">
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-text-muted font-mono block">
              Rupees (₹)
            </label>
            <Input
              type="number"
              min={1}
              value={inrAmount}
              onChange={(e) => handleInrChange(e.target.value)}
              placeholder="e.g. 50"
              className="bg-bg-elevated border-border-subtle text-text-primary font-mono text-sm h-10"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-text-muted font-mono block flex items-center justify-between">
              <span>Coins</span>
              <span className="text-[9px] text-accent-primary font-mono">₹1 = 10</span>
            </label>
            <Input
              type="number"
              min={10}
              value={coinsRequested}
              onChange={(e) => handleCoinsChange(e.target.value)}
              placeholder="e.g. 500"
              className="bg-bg-elevated border-border-subtle text-accent-primary font-mono font-bold text-sm h-10"
            />
          </div>
        </div>

        {/* Coupon Code Section */}
        <div className="space-y-2 bg-bg-elevated/40 border border-border-subtle rounded-xl p-3">
          <div className="flex items-center justify-between text-xs font-mono text-text-muted">
            <span className="flex items-center gap-1.5 font-semibold text-text-primary">
              <Tag className="size-3.5 text-accent-primary" /> Apply Coupon
            </span>
            {appliedCoupon && (
              <button
                type="button"
                onClick={() => setAppliedCoupon(null)}
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
                  <strong>{appliedCoupon.code}</strong> applied (-₹{appliedCoupon.discountAmount})
                </span>
              </div>
              <span className="text-emerald-400 font-semibold">Applied!</span>
            </div>
          ) : (
            <div className="flex gap-2">
              <Input
                type="text"
                placeholder="Coupon code (optional)"
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

        {/* Total Summary & Action */}
        <div className="space-y-3 pt-1">
          <div className="flex justify-between items-center text-xs p-3.5 rounded-xl bg-bg-elevated/60 border border-border-subtle font-mono">
            <div>
              <span className="text-text-muted block text-[10px]">Total Payable:</span>
              <span className="text-base font-bold text-text-primary">₹{finalInr}</span>
            </div>
            <div className="text-right">
              <span className="text-text-muted block text-[10px]">Coins Added:</span>
              <span className="text-base font-bold text-accent-primary flex items-center justify-end gap-1">
                +{Number(coinsRequested || 0).toLocaleString()} <Coins className="size-4" />
              </span>
            </div>
          </div>

          <div className="flex gap-2">
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
              disabled={isConverting || !coinsRequested}
              onClick={handleConvert}
              className="flex-1 btn-premium-primary text-xs h-10 rounded-xl flex items-center justify-center gap-2 disabled:opacity-40"
            >
              {isConverting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <CreditCard className="size-4" />
                  <span>Pay ₹{finalInr} via Razorpay</span>
                </>
              )}
            </Button>
          </div>

          <div className="flex items-center justify-center gap-2 text-[10px] font-mono text-text-muted text-center pt-1">
            <ShieldCheck className="size-3.5 text-emerald-400 shrink-0" />
            <span>Secure 256-Bit SSL Payment via Razorpay (UPI, Cards, NetBanking)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
