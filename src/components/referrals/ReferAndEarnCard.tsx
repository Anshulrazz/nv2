"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Copy, Check, Gift, Coins, Users, Sparkles, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface ReferralData {
  referralCode: string;
  referralLink: string;
  referralCount: number;
  referralRewardsEarned: number;
  coins: number;
  walletAddress: string;
  referredUsers: Array<{
    id: string;
    name: string;
    email: string;
    createdAt: string;
    coinsEarned: number;
  }>;
}

export function ReferAndEarnCard({ onCoinsUpdated }: { onCoinsUpdated?: () => void }) {
  const [data, setData] = useState<ReferralData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedLink, setCopiedLink] = useState(false);
  const [manualCode, setManualCode] = useState("");
  const [isApplying, setIsApplying] = useState(false);

  const fetchReferralInfo = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/referral/me");
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReferralInfo();
  }, [fetchReferralInfo]);

  const handleCopyLink = () => {
    if (!data?.referralLink) return;
    navigator.clipboard.writeText(data.referralLink);
    setCopiedLink(true);
    toast.success("Referral link copied to clipboard!");
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleApplyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;

    try {
      setIsApplying(true);
      const res = await fetch("/api/referral/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ referralCode: manualCode.trim() }),
      });

      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error || "Failed to apply referral code.");
        return;
      }

      toast.success(json.message || "Referral code applied! +50 coins credited.");
      setManualCode("");
      fetchReferralInfo();
      if (onCoinsUpdated) onCoinsUpdated();
    } catch (err) {
      console.error(err);
      toast.error("An error occurred while applying the code.");
    } finally {
      setIsApplying(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 rounded-2xl bg-[#121F18]/80 border border-[#F3F0E4]/15 flex items-center justify-center gap-2 text-xs text-[#9FAEA1]">
        <Loader2 className="h-4 w-4 animate-spin text-[#F0C93B]" />
        <span>Loading referral data...</span>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="rounded-2xl bg-[#121F18]/90 border border-[#F3F0E4]/15 p-5 sm:p-6 space-y-6 shadow-xl relative overflow-hidden">
      {/* Background ambient glow */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-[#F0C93B]/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#F3F0E4]/10 pb-4 relative z-10">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-[#F0C93B]/10 border border-[#F0C93B]/30 flex items-center justify-center text-[#F0C93B]">
            <Gift className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-[#F3F0E4] font-heading tracking-wide">
              Refer & Earn
            </h3>
            <p className="text-[11px] text-[#9FAEA1]">
              Invite a friend — you get <strong className="text-[#F0C93B]">100 coins</strong>, they get <strong className="text-[#F0C93B]">50 coins</strong> when they join.
            </p>
          </div>
        </div>
        <span className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#F0C93B]/10 border border-[#F0C93B]/20 text-[10px] font-bold text-[#F0C93B] font-mono">
          <Sparkles className="h-3 w-3" /> Unlimited Rewards
        </span>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 gap-3 relative z-10">
        <div className="p-3.5 rounded-xl bg-[#16261D] border border-[#F3F0E4]/10 space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#9FAEA1] font-mono">
            Friends Invited
          </span>
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-[#8FC3DE]" />
            <span className="text-lg font-black text-[#F3F0E4] font-heading">
              {data.referralCount}
            </span>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-[#16261D] border border-[#F3F0E4]/10 space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#9FAEA1] font-mono">
            Total Earned
          </span>
          <div className="flex items-center gap-2">
            <Coins className="h-4 w-4 text-[#F0C93B]" />
            <span className="text-lg font-black text-[#F0C93B] font-heading">
              {data.referralRewardsEarned} <span className="text-[10px] text-[#9FAEA1]">coins</span>
            </span>
          </div>
        </div>
      </div>

      {/* Share Link & Code */}
      <div className="space-y-3 relative z-10">
        <label className="text-[11px] font-bold text-[#F3F0E4] uppercase tracking-wider font-mono">
          Your Referral Link
        </label>
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-[#1A2D23] border border-[#F3F0E4]/15 rounded-xl h-10 px-3 flex items-center text-xs text-[#9FAEA1] truncate font-mono">
            {data.referralLink}
          </div>
          <Button
            onClick={handleCopyLink}
            className="h-10 px-4 bg-[#F0C93B] hover:bg-[#F0C93B]/90 text-[#2A2118] font-bold text-xs rounded-xl shrink-0 gap-1.5 transition-all active:scale-95"
          >
            {copiedLink ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            <span>{copiedLink ? "Copied" : "Copy Link"}</span>
          </Button>
        </div>
      </div>

      {/* Manual Referral Entry (Grace Period) */}
      <div className="pt-2 border-t border-[#F3F0E4]/10 relative z-10">
        <form onSubmit={handleApplyCode} className="space-y-2">
          <label className="text-[10px] font-bold text-[#9FAEA1] uppercase tracking-wider font-mono">
            Have a friend&apos;s referral code?
          </label>
          <div className="flex gap-2">
            <Input
              type="text"
              name="manual_referral_code"
              autoComplete="off"
              data-1p-ignore="true"
              placeholder="Enter code (e.g. REF-ABC123)"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value.toUpperCase())}
              className="bg-[#1A2D23] border-[#F3F0E4]/15 text-[#F3F0E4] placeholder-[#9FAEA1]/50 text-xs h-9 rounded-xl font-mono"
            />
            <Button
              type="submit"
              disabled={isApplying || !manualCode.trim()}
              className="h-9 px-3.5 bg-[#1F362A] hover:bg-[#2A4737] text-[#F0C93B] border border-[#F0C93B]/30 font-bold text-xs rounded-xl shrink-0 gap-1 transition-all disabled:opacity-40"
            >
              {isApplying ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
              <span>Apply</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
