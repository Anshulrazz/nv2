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
      <div className="p-6 rounded-2xl bg-bg-surface border border-border-subtle flex items-center justify-center gap-2 text-xs text-text-muted">
        <Loader2 className="h-4 w-4 animate-spin text-accent-primary" />
        <span>Loading referral data...</span>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="rounded-2xl bg-bg-surface border border-border-subtle p-5 sm:p-6 space-y-5 shadow-sm relative overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border-subtle pb-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-accent-primary/10 border border-accent-primary/20 flex items-center justify-center text-accent-primary shrink-0">
            <Gift className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-text-primary tracking-tight">
              Refer & Earn
            </h3>
            <p className="text-xs text-text-secondary">
              Invite friends — get <strong className="text-accent-primary font-semibold">100 coins</strong>, they get <strong className="text-accent-primary font-semibold">50 coins</strong>.
            </p>
          </div>
        </div>
        <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-accent-primary/10 border border-accent-primary/20 text-[10px] font-bold text-accent-primary font-mono shrink-0">
          <Sparkles className="h-3 w-3" /> Rewards
        </span>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3.5 rounded-xl bg-bg-elevated/60 border border-border-subtle space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted font-mono block">
            Friends Invited
          </span>
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-text-muted" />
            <span className="text-lg font-bold text-text-primary font-mono">
              {data.referralCount}
            </span>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-bg-elevated/60 border border-border-subtle space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted font-mono block">
            Total Earned
          </span>
          <div className="flex items-center gap-2">
            <Coins className="h-4 w-4 text-accent-primary" />
            <span className="text-lg font-bold text-accent-primary font-mono">
              {data.referralRewardsEarned} <span className="text-[10px] text-text-muted font-normal">coins</span>
            </span>
          </div>
        </div>
      </div>

      {/* Share Link & Code */}
      <div className="space-y-2">
        <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider font-mono block">
          Your Referral Link
        </label>
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-bg-elevated border border-border-subtle rounded-xl h-10 px-3 flex items-center text-xs text-text-secondary truncate font-mono select-all">
            {data.referralLink}
          </div>
          <Button
            onClick={handleCopyLink}
            className="h-10 px-3.5 btn-premium-primary text-xs shrink-0 flex items-center gap-1.5"
          >
            {copiedLink ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            <span>{copiedLink ? "Copied" : "Copy"}</span>
          </Button>
        </div>
      </div>

      {/* Manual Referral Entry */}
      <div className="pt-3 border-t border-border-subtle">
        <form onSubmit={handleApplyCode} className="space-y-2">
          <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider font-mono block">
            Have a friend&apos;s referral code?
          </label>
          <div className="flex gap-2">
            <Input
              type="text"
              name="manual_referral_code"
              autoComplete="off"
              data-1p-ignore="true"
              placeholder="e.g. REF-ABC123"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value.toUpperCase())}
              className="bg-bg-elevated border-border-subtle text-text-primary placeholder:text-text-muted/60 text-xs h-9 rounded-xl font-mono"
            />
            <Button
              type="submit"
              disabled={isApplying || !manualCode.trim()}
              className="h-9 px-3.5 bg-bg-elevated hover:bg-bg-elevated/80 text-accent-primary border border-border-default hover:border-accent-primary/40 font-bold text-xs rounded-xl shrink-0 flex items-center gap-1.5 transition-all disabled:opacity-40 cursor-pointer"
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

