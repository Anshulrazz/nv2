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
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "An unexpected error occurred during payment.");
      setIsConverting(false);
    }
  };

  const finalInr = Math.max(0, Number(inrAmount) - (appliedCoupon ? appliedCoupon.discountAmount : 0));


  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-lg max-h-[92vh] overflow-y-auto custom-scroll bg-[#121F18] border border-[#F0C93B]/30 rounded-[2rem] sm:rounded-3xl p-5 sm:p-7 space-y-5 shadow-[0_0_50px_rgba(240,201,59,0.15)] relative">
        {/* Ambient Glow */}
        <div className="absolute top-0 left-0 w-72 h-72 bg-[#F0C93B]/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#F3F0E4]/10 pb-4 relative z-10">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-[#F0C93B]/15 border border-[#F0C93B]/40 flex items-center justify-center text-[#F0C93B] shadow-inner">
              <Coins className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-[#F3F0E4] font-heading tracking-wide flex items-center gap-2">
                Coin Converter <Sparkles className="h-4 w-4 text-[#F0C93B]" />
              </h2>
              <p className="text-xs text-[#9FAEA1]">Convert INR (₹) to Notexia Coins instantly.</p>
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

        {/* Current Balance */}
        <div className="flex justify-between items-center text-xs p-3 rounded-xl bg-[#16261D] border border-[#F3F0E4]/10 font-mono relative z-10">
          <span className="text-[#9FAEA1]">Current Balance:</span>
          <span className="font-bold text-[#F0C93B] flex items-center gap-1">
            <Coins className="h-3.5 w-3.5" /> {currentBalance.toLocaleString()} coins
          </span>
        </div>

        {/* Quick Packs */}
        <div className="space-y-2 relative z-10">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#9FAEA1] font-mono block">
            Popular Coin Packs:
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleSelectPack(100, 10)}
              className={`p-3 rounded-xl border text-center transition-all ${coinsRequested === 100
                  ? "bg-[#1A2D23] border-[#F0C93B] shadow-[0_0_15px_rgba(240,201,59,0.2)] text-[#F0C93B]"
                  : "bg-[#16261D]/60 border-[#F3F0E4]/10 hover:border-[#F3F0E4]/25 text-[#F3F0E4]"
                }`}
            >
              <div className="text-sm font-black font-heading">100 Coins</div>
              <div className="text-[10px] font-mono text-[#9FAEA1]">₹10</div>
            </button>

            <button
              type="button"
              onClick={() => handleSelectPack(500, 50)}
              className={`p-3 rounded-xl border text-center transition-all relative ${coinsRequested === 500
                  ? "bg-[#1A2D23] border-[#F0C93B] shadow-[0_0_15px_rgba(240,201,59,0.2)] text-[#F0C93B]"
                  : "bg-[#16261D]/60 border-[#F3F0E4]/10 hover:border-[#F3F0E4]/25 text-[#F3F0E4]"
                }`}
            >
              <span className="absolute -top-2 left-1/2 -translate-x-1/2 bg-[#F0C93B] text-[#2A2118] text-[8px] font-extrabold px-1.5 py-0.2 rounded-full font-mono uppercase">
                Popular
              </span>
              <div className="text-sm font-black font-heading">500 Coins</div>
              <div className="text-[10px] font-mono text-[#9FAEA1]">₹50</div>
            </button>

            <button
              type="button"
              onClick={() => handleSelectPack(5000, 400)}
              className={`p-3 rounded-xl border text-center transition-all relative ${coinsRequested === 5000
                  ? "bg-[#1A2D23] border-[#F0C93B] shadow-[0_0_15px_rgba(240,201,59,0.2)] text-[#F0C93B]"
                  : "bg-[#16261D]/60 border-[#F3F0E4]/10 hover:border-[#F3F0E4]/25 text-[#F3F0E4]"
                }`}
            >
              <span className="absolute -top-2 left-1/2 -translate-x-1/2 bg-[#F0C93B] text-[#2A2118] text-[8px] font-extrabold px-1.5 py-0.2 rounded-full font-mono uppercase">
                Save 20%
              </span>
              <div className="text-sm font-black font-heading">5,000 Coins</div>
              <div className="text-[10px] font-mono text-[#9FAEA1]">₹400</div>
            </button>
          </div>
        </div>

        {/* Custom Converter Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 relative z-10 items-center">
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-[#9FAEA1] font-mono block">
              Rupees (₹)
            </label>
            <Input
              type="number"
              min={1}
              value={inrAmount}
              onChange={(e) => handleInrChange(e.target.value)}
              placeholder="e.g. 50"
              className="bg-[#121F18] border-[#F3F0E4]/15 text-[#F3F0E4] font-mono text-sm h-10"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-[#9FAEA1] font-mono block flex items-center justify-between">
              <span>Notexia Coins</span>
              <span className="text-[9px] text-[#F0C93B]">₹1 = 10 Coins</span>
            </label>
            <Input
              type="number"
              min={10}
              value={coinsRequested}
              onChange={(e) => handleCoinsChange(e.target.value)}
              placeholder="e.g. 500"
              className="bg-[#121F18] border-[#F3F0E4]/15 text-[#F0C93B] font-mono font-bold text-sm h-10"
            />
          </div>
        </div>

        {/* Coupon Code Section */}
        <div className="space-y-2 bg-[#16261D]/80 border border-[#F3F0E4]/10 rounded-2xl p-3.5 relative z-10">
          <div className="flex items-center justify-between text-xs font-mono text-[#9FAEA1]">
            <span className="flex items-center gap-1.5 font-bold text-[#F3F0E4]">
              <Tag className="h-3.5 w-3.5 text-[#F0C93B]" /> Apply Coupon
            </span>
            {appliedCoupon && (
              <button
                type="button"
                onClick={() => setAppliedCoupon(null)}
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
                  <strong>{appliedCoupon.code}</strong> applied (-₹{appliedCoupon.discountAmount})
                </span>
              </div>
              <span className="text-emerald-400 font-bold">Applied!</span>
            </div>
          ) : (
            <div className="flex gap-2">
              <Input
                type="text"
                placeholder="Coupon code (optional)"
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

        {/* Total Summary & Action */}
        <div className="space-y-3 relative z-10 pt-1">
          <div className="flex justify-between items-center text-xs p-3.5 rounded-xl bg-[#16261D] border border-[#F3F0E4]/10 font-mono">
            <div>
              <span className="text-[#9FAEA1] block text-[10px]">Total Payable:</span>
              <span className="text-base font-bold text-[#F3F0E4]">₹{finalInr}</span>
            </div>
            <div className="text-right">
              <span className="text-[#9FAEA1] block text-[10px]">Coins Added:</span>
              <span className="text-base font-bold text-[#F0C93B] flex items-center justify-end gap-1">
                +{Number(coinsRequested || 0).toLocaleString()} <Coins className="h-4 w-4" />
              </span>
            </div>
          </div>

          <div className="flex gap-2">
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
              disabled={isConverting || !coinsRequested}
              onClick={handleConvert}
              className="flex-1 bg-[#F0C93B] hover:bg-[#F0C93B]/90 text-[#2A2118] font-bold text-xs h-11 rounded-xl flex items-center justify-center gap-2 disabled:opacity-40 shadow-[0_0_20px_rgba(240,201,59,0.3)]"
            >
              {isConverting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-[#2A2118]" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <CreditCard className="h-4 w-4" />
                  <span>Pay ₹{finalInr} via Razorpay</span>
                </>
              )}
            </Button>
          </div>

          <div className="flex items-center justify-center gap-2 text-[10px] font-mono text-[#9FAEA1]/80 text-center pt-1">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
            <span>Secure 256-Bit SSL Payment via Razorpay (UPI, Cards, NetBanking)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
