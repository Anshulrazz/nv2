"use client";

import React, { useState } from "react";
import {
  Coins,
  X,
  Building2,
  QrCode,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  DollarSign,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface WithdrawEarningsModalProps {
  isOpen: boolean;
  onClose: () => void;
  creatorEarnings: number;
  userCoins?: number;
  userRole?: "user" | "teacher" | "admin";
  existingPayoutDetails?: {
    upiId?: string;
    bankAccount?: string;
    ifscCode?: string;
    accountHolderName?: string;
  };
  onSuccess?: () => void;
}

export function WithdrawEarningsModal({
  isOpen,
  onClose,
  creatorEarnings,
  userCoins = 0,
  userRole = "user",
  existingPayoutDetails,
  onSuccess,
}: WithdrawEarningsModalProps) {
  const [payoutMethod, setPayoutMethod] = useState<"upi" | "bank_transfer">("upi");
  const [amount, setAmount] = useState<string>("");
  const [upiId, setUpiId] = useState<string>(existingPayoutDetails?.upiId || "");
  const [bankAccount, setBankAccount] = useState<string>(existingPayoutDetails?.bankAccount || "");
  const [ifscCode, setIfscCode] = useState<string>(existingPayoutDetails?.ifscCode || "");
  const [accountHolderName, setAccountHolderName] = useState<string>(
    existingPayoutDetails?.accountHolderName || ""
  );

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const isTeacherOrAdmin = userRole === "teacher" || userRole === "admin";
  const availableBalance = isTeacherOrAdmin ? creatorEarnings + userCoins : creatorEarnings;

  const handleWithdrawSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const withdrawNum = Number(amount);
    if (isNaN(withdrawNum) || withdrawNum < 1) {
      setErrorMsg("Please enter a valid withdrawal amount of at least 1 coin.");
      return;
    }

    if (withdrawNum > availableBalance) {
      setErrorMsg(
        `Withdrawal amount exceeds your available balance of ${availableBalance} coins.`
      );
      return;
    }

    if (payoutMethod === "upi" && !upiId.trim()) {
      setErrorMsg("Please enter a valid UPI ID (e.g. name@upi or 9876543210@paytm).");
      return;
    }

    if (
      payoutMethod === "bank_transfer" &&
      (!bankAccount.trim() || !ifscCode.trim() || !accountHolderName.trim())
    ) {
      setErrorMsg("Please fill out all bank account transfer details.");
      return;
    }

    try {
      setIsLoading(true);
      const res = await fetch("/api/wallet/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: withdrawNum,
          payoutMethod,
          payoutDetails: {
            upiId: upiId.trim(),
            bankAccount: bankAccount.trim(),
            ifscCode: ifscCode.trim().toUpperCase(),
            accountHolderName: accountHolderName.trim(),
          },
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || data.message || "Failed to submit withdrawal request.");
      }

      setIsSuccess(true);
      toast.success(data.message || "Withdrawal request submitted successfully!");
      if (onSuccess) onSuccess();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg max-h-[92vh] overflow-y-auto custom-scroll rounded-[2rem] sm:rounded-[2.5rem] bg-[#150F0B] border border-[#2E2118] shadow-2xl p-5 sm:p-8 space-y-5 text-[#FAFAF8]">
        {/* CLOSE BUTTON */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-2 rounded-full bg-[#0A0806] text-[#8A8078] hover:text-[#FAFAF8] border border-[#2E2118] transition-all"
        >
          <X className="size-4" />
        </button>

        {/* MODAL HEADER */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 text-xs font-mono font-bold text-[#F5B429] bg-[#F5B429]/10 px-3 py-1 rounded-full border border-[#F5B429]/30">
            <DollarSign className="size-3.5" />{" "}
            {isTeacherOrAdmin ? `${userRole.toUpperCase()} CASH PAYOUT` : "WITHDRAWABLE EARNINGS"}
          </div>
          <h2 className="text-xl sm:text-2xl font-bold font-display text-[#FAFAF8]">
            {isTeacherOrAdmin ? "Request Cash Payout" : "Withdraw Creator Earnings"}
          </h2>
          <p className="text-xs text-[#8A8078] font-light leading-relaxed">
            {isTeacherOrAdmin
              ? "Withdraw your project and course sales, platform earnings, or teacher revenue directly to UPI or Bank Account."
              : "Convert your 70% Project & Course Sales revenue into direct cash payout via UPI or Bank Transfer (1 INR = 10 Coins)."}
          </p>
        </div>

        {/* BALANCE BANNER */}
        <div className="rounded-2xl bg-[#0A0806] border border-[#F5B429]/30 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-inner">
          <div className="space-y-0.5">
            <span className="text-[11px] font-mono text-[#8A8078] uppercase tracking-wider">
              {isTeacherOrAdmin ? "Total Withdrawable Balance" : "Withdrawable Earnings Balance"}
            </span>
            <div className="text-2xl font-black text-[#F5B429] font-mono flex items-center gap-1.5">
              <Coins className="size-5" />
              <span>{availableBalance.toLocaleString()}</span>
              <span className="text-xs text-[#8A8078] font-normal">Coins (₹{(availableBalance / 10).toFixed(2)})</span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] font-mono text-[#22C55E] bg-[#22C55E]/10 px-2.5 py-1 rounded-full border border-[#22C55E]/30 font-bold">
              WITHDRAWABLE CASH
            </span>
          </div>
        </div>

        {/* IMPORTANT DISCLOSURE ALERT */}
        <div className="p-3 rounded-xl bg-[#241811] border border-[#F5941D]/30 text-[#FCD34D] text-xs font-light space-y-1">
          <div className="font-bold flex items-center gap-1.5 text-[#F5941D] font-mono">
            <ShieldCheck className="size-3.5" /> Earnings &amp; Rate Policy
          </div>
          <p className="text-[11px] text-[#B8AFA6] leading-relaxed">
            Exchange rate: <strong>1 INR = 10 Coins</strong> (1 Coin = ₹0.10). Only 70% Creator Project and Course Sales revenue can be withdrawn. Activity, promotional, and referral bonus coins are non-withdrawable.
          </p>
        </div>

        {isSuccess ? (
          <div className="space-y-5 text-center py-6">
            <div className="size-14 rounded-full bg-[#22C55E]/20 border border-[#22C55E]/40 text-[#22C55E] flex items-center justify-center mx-auto">
              <CheckCircle2 className="size-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-xl font-bold text-[#FAFAF8] font-display">Withdrawal Requested!</h3>
              <p className="text-xs text-[#8A8078] max-w-sm mx-auto">
                Your payout request of ₹{(Number(amount || 0) / 10).toFixed(2)} ({amount} coins) has been queued for verification. Funds will be transferred to your account within 24–48 hours.
              </p>
            </div>
            <Button
              onClick={onClose}
              className="w-full btn-premium-primary text-xs py-3 font-display"
            >
              Done
            </Button>
          </div>
        ) : (
          <form onSubmit={handleWithdrawSubmit} className="space-y-5">
            {errorMsg && (
              <div className="p-3 rounded-xl bg-[#EF4444]/10 border border-[#EF4444]/30 text-[#EF4444] text-xs font-medium flex items-center gap-2">
                <AlertCircle className="size-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* WITHDRAW AMOUNT INPUT */}
            <div className="space-y-1.5">
              <label className="text-xs font-mono font-bold text-[#FAFAF8] flex items-center justify-between">
                <span>WITHDRAWAL AMOUNT (COINS)</span>
                <button
                  type="button"
                  onClick={() => setAmount(String(availableBalance))}
                  className="text-[10px] text-[#F5B429] hover:underline font-mono"
                >
                  Withdraw Max ({availableBalance} Coins)
                </button>
              </label>
              <div className="relative">
                <Input
                  type="number"
                  min="1"
                  max={availableBalance}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Enter coin amount (e.g. 500)..."
                  className="w-full bg-[#16261D] border-[#F3F0E4]/20 rounded-xl px-4 py-2.5 text-sm text-white focus:border-[#F0C93B] font-mono"
                />
              </div>
              {Number(amount) > 0 && (
                <div className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-[#F5B429]/10 border border-[#F5B429]/20 text-xs font-mono text-[#F5B429]">
                  <span>Payout Value:</span>
                  <span className="font-bold text-[#FAFAF8]">₹{(Number(amount) / 10).toFixed(2)} (at 1 INR = 10 Coins)</span>
                </div>
              )}
            </div>

            {/* PAYOUT METHOD TABS */}
            <div className="space-y-2">
              <label className="text-xs font-mono font-bold text-[#F3F0E4]">SELECT PAYOUT METHOD</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setPayoutMethod("upi")}
                  className={`p-3 rounded-xl border text-xs font-heading font-bold flex items-center justify-center gap-2 transition-all ${
                    payoutMethod === "upi"
                      ? "bg-[#F0C93B] text-[#2A2118] border-[#F0C93B]"
                      : "bg-[#16261D] text-[#9FAEA1] border-[#F3F0E4]/15 hover:text-white"
                  }`}
                >
                  <QrCode className="size-4" />
                  <span>UPI Payout</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPayoutMethod("bank_transfer")}
                  className={`p-3 rounded-xl border text-xs font-heading font-bold flex items-center justify-center gap-2 transition-all ${
                    payoutMethod === "bank_transfer"
                      ? "bg-[#F0C93B] text-[#2A2118] border-[#F0C93B]"
                      : "bg-[#16261D] text-[#9FAEA1] border-[#F3F0E4]/15 hover:text-white"
                  }`}
                >
                  <Building2 className="size-4" />
                  <span>Bank Account</span>
                </button>
              </div>
            </div>

            {/* PAYOUT DETAILS FORM */}
            {payoutMethod === "upi" ? (
              <div className="space-y-1.5">
                <label className="text-xs font-mono font-bold text-[#F3F0E4]">UPI ID</label>
                <Input
                  type="text"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  placeholder="e.g. 9876543210@paytm or user@okaxis"
                  className="w-full bg-[#16261D] border-[#F3F0E4]/20 rounded-xl px-4 py-2.5 text-xs text-white focus:border-[#F0C93B]"
                />
              </div>
            ) : (
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-mono font-bold text-[#F3F0E4]">ACCOUNT HOLDER NAME</label>
                  <Input
                    type="text"
                    value={accountHolderName}
                    onChange={(e) => setAccountHolderName(e.target.value)}
                    placeholder="Full name on bank account"
                    className="w-full bg-[#16261D] border-[#F3F0E4]/20 rounded-xl px-4 py-2.5 text-xs text-white focus:border-[#F0C93B]"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-mono font-bold text-[#F3F0E4]">ACCOUNT NUMBER</label>
                    <Input
                      type="text"
                      value={bankAccount}
                      onChange={(e) => setBankAccount(e.target.value)}
                      placeholder="Bank account number"
                      className="w-full bg-[#16261D] border-[#F3F0E4]/20 rounded-xl px-4 py-2.5 text-xs text-white focus:border-[#F0C93B] font-mono"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-mono font-bold text-[#F3F0E4]">IFSC CODE</label>
                    <Input
                      type="text"
                      value={ifscCode}
                      onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
                      placeholder="e.g. SBIN0001234"
                      className="w-full bg-[#16261D] border-[#F3F0E4]/20 rounded-xl px-4 py-2.5 text-xs text-white uppercase focus:border-[#F0C93B] font-mono"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* SUBMIT BUTTON */}
            <Button
              type="submit"
              disabled={isLoading || creatorEarnings < 1}
              className="w-full rounded-full bg-[#F0C93B] hover:bg-[#F0C93B]/90 text-[#2A2118] font-bold text-xs py-3.5 flex items-center justify-center gap-2 font-heading transition-all disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <>
                  <span>Request Cash Payout</span>
                  <ArrowRight className="size-4" />
                </>
              )}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
