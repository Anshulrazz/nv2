"use client";

import React, { useEffect, useState } from "react";
import { Loader2, Copy, Check, Gift, Coins, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ReferredUser {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  coinsEarned: number;
}

interface ReferralData {
  referralCode: string;
  coins: number;
  referredUsers: ReferredUser[];
}

export default function ReferralsPage() {
  const [data, setData] = useState<ReferralData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const fetchReferralData = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/referrals");
      if (!res.ok) {
        throw new Error("Failed to fetch referral data");
      }
      const json = await res.json();
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReferralData();
  }, []);

  const getReferralLink = () => {
    if (!data?.referralCode) return "";
    if (typeof window !== "undefined") {
      return `${window.location.origin}/signup?ref=${data.referralCode}`;
    }
    return `/signup?ref=${data.referralCode}`;
  };

  const handleCopyCode = () => {
    if (!data?.referralCode) return;
    navigator.clipboard.writeText(data.referralCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyLink = () => {
    const link = getReferralLink();
    if (!link) return;
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-neutral-950 text-neutral-500 select-none gap-2">
        <Loader2 className="h-5 w-5 animate-spin text-cyan-400" />
        <span
          className="text-xs font-bold uppercase tracking-widest"
          style={{ fontFamily: "var(--font-jetbrains-mono)" }}
        >
          Accessing Referral Node...
        </span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-neutral-950 text-neutral-400 p-6 select-none space-y-4">
        <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm font-medium">
          {error || "Unable to retrieve referral system status."}
        </div>
        <Button onClick={fetchReferralData} variant="outline" className="text-xs h-9 font-bold border-neutral-800">
          Retry Connection
        </Button>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-neutral-950 overflow-y-auto custom-scroll">
      {/* Welcome Banner */}
      <div className="border-b border-neutral-900 bg-neutral-900/10 px-4 py-5 sm:px-8 sm:py-8 shrink-0 select-none relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[200px] bg-yellow-500/5 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[150px] bg-violet-500/5 rounded-full blur-[80px] pointer-events-none" />
        <div className="space-y-1.5 relative z-10">
          <div className="flex items-center gap-2 mb-1">
            <span className="h-1 w-6 rounded-full bg-gradient-to-r from-yellow-400 to-amber-500" />
            <span
              className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest"
              style={{ fontFamily: "var(--font-jetbrains-mono)" }}
            >
              Referral Protocol
            </span>
          </div>
          <h1
            className="text-2xl font-bold text-neutral-100 tracking-tight"
            style={{ fontFamily: "var(--font-space-grotesk)" }}
          >
            Referral Program & Coins
          </h1>
          <p className="text-neutral-500 text-xs">
            Invite your friends to Notexia. Get +200 Coins for every signup, and they get +100 Coins welcome balance.
          </p>
        </div>
      </div>

      <div className="p-4 sm:p-8 max-w-5xl w-full mx-auto space-y-6 sm:space-y-8">
        {/* Metric stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Card 1: Balance */}
          <div className="group relative glass glass-card-hover p-5 flex items-center justify-between border border-neutral-900 shadow-lg hover:border-yellow-500/30 transition-all duration-300 hover:shadow-[0_0_22px_rgba(234,179,8,0.15)]">
            <div className="space-y-1">
              <span
                className="text-[9px] font-bold text-neutral-500 uppercase tracking-widest"
                style={{ fontFamily: "var(--font-space-grotesk)" }}
              >
                Available Coins
              </span>
              <h2
                className="text-3xl font-extrabold text-yellow-500"
                style={{ fontFamily: "var(--font-space-grotesk)" }}
              >
                {data.coins} <span className="text-xs font-semibold text-neutral-500">Coins</span>
              </h2>
            </div>
            <Coins className="h-10 w-10 text-yellow-500 opacity-60 group-hover:opacity-100 transition-opacity" />
          </div>

          {/* Card 2: Reffered Count */}
          <div className="group relative glass glass-card-hover p-5 flex items-center justify-between border border-neutral-900 shadow-lg hover:border-violet-500/30 transition-all duration-300 hover:shadow-[0_0_22px_rgba(168,85,247,0.15)]">
            <div className="space-y-1">
              <span
                className="text-[9px] font-bold text-neutral-500 uppercase tracking-widest"
                style={{ fontFamily: "var(--font-space-grotesk)" }}
              >
                Total Referrals
              </span>
              <h2
                className="text-3xl font-extrabold text-violet-500"
                style={{ fontFamily: "var(--font-space-grotesk)" }}
              >
                {data.referredUsers.length} <span className="text-xs font-semibold text-neutral-500">Joined</span>
              </h2>
            </div>
            <Users className="h-10 w-10 text-violet-500 opacity-60 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>

        {/* Share actions */}
        <div className="glass border border-neutral-900 p-6 space-y-6">
          <h3
            className="text-[10px] font-bold text-neutral-300 uppercase tracking-widest border-b border-white/[0.12] pb-3"
            style={{ fontFamily: "var(--font-space-grotesk)" }}
          >
            Invite Friends & Earn
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Copy code */}
            <div className="space-y-2">
              <label
                className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider font-space"
                style={{ fontFamily: "var(--font-space-grotesk)" }}
              >
                Your Referral Code
              </label>
              <div className="flex gap-2">
                <div
                  className="flex-1 bg-neutral-950 border border-neutral-800 rounded-xl h-11 px-4 flex items-center text-sm font-semibold tracking-wider text-neutral-200 select-all"
                  style={{ fontFamily: "var(--font-jetbrains-mono)" }}
                >
                  {data.referralCode}
                </div>
                <Button
                  onClick={handleCopyCode}
                  className="h-11 px-4 bg-neutral-900 border border-neutral-800 hover:bg-neutral-850 hover:border-neutral-700 text-neutral-300 transition-all gap-1.5"
                >
                  {copiedCode ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
                  <span className="text-xs font-bold font-space">{copiedCode ? "Copied" : "Copy"}</span>
                </Button>
              </div>
            </div>

            {/* Copy link */}
            <div className="space-y-2">
              <label
                className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider font-space"
                style={{ fontFamily: "var(--font-space-grotesk)" }}
              >
                Your Unique Signup Link
              </label>
              <div className="flex gap-2">
                <div
                  className="flex-1 bg-neutral-950 border border-neutral-800 rounded-xl h-11 px-4 flex items-center text-xs text-neutral-450 truncate"
                  style={{ fontFamily: "var(--font-jetbrains-mono)" }}
                >
                  {getReferralLink()}
                </div>
                <Button
                  onClick={handleCopyLink}
                  className="h-11 px-4 bg-cyan-500 hover:bg-cyan-400 text-neutral-950 shadow-[0_0_15px_rgba(6,182,212,0.25)] hover:shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all gap-1.5"
                >
                  {copiedLink ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  <span className="text-xs font-bold font-space">{copiedLink ? "Copied" : "Copy"}</span>
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* History table */}
        <div className="glass border border-neutral-900 p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-white/[0.12] pb-3">
            <h3
              className="text-[10px] font-bold text-neutral-300 uppercase tracking-widest"
              style={{ fontFamily: "var(--font-space-grotesk)" }}
            >
              Referral History
            </h3>
            <span
              className="text-[10px] font-bold text-neutral-500 uppercase font-mono"
            >
              Logs ({data.referredUsers.length})
            </span>
          </div>

          <div className="overflow-x-auto">
            {data.referredUsers.length === 0 ? (
              <div className="py-12 text-center select-none border border-dashed border-neutral-900 rounded-2xl bg-neutral-900/10">
                <Gift className="h-8 w-8 text-neutral-700 mx-auto mb-2.5 opacity-60" />
                <p className="text-xs text-neutral-500 italic">No referrals recorded yet. Share your code to earn coins!</p>
              </div>
            ) : (
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-neutral-900 text-neutral-500">
                    <th className="pb-3 font-semibold uppercase tracking-wider">Name</th>
                    <th className="pb-3 font-semibold uppercase tracking-wider">Email</th>
                    <th className="pb-3 font-semibold uppercase tracking-wider">Date Joined</th>
                    <th className="pb-3 font-semibold text-right uppercase tracking-wider">Bonus</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-900/40 text-neutral-300">
                  {data.referredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-neutral-900/10 transition-colors">
                      <td className="py-3.5 font-bold text-neutral-200">{user.name}</td>
                      <td className="py-3.5 text-neutral-450 font-mono">{user.email}</td>
                      <td className="py-3.5 text-neutral-450">
                        {new Date(user.createdAt).toLocaleDateString(undefined, {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </td>
                      <td className="py-3.5 text-right font-bold text-yellow-500">+{user.coinsEarned} Coins</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
