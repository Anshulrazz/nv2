"use client";

export const dynamic = "force-dynamic";

import React, { useEffect, useState } from "react";
import {
  BookOpen,
  Trophy,
  Coins,
  Sparkles,
  Plus,
  ArrowRight,
  ArrowUpRight,
  GraduationCap,
  Calendar,
  Newspaper,
  Crown,
  Flame,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useWorkspaceStore } from "@/stores/workspaceStore";
import { useRouter } from "next/navigation";
import { SimpleTodo } from "@/components/notes/SimpleTodo";
import { GoogleAdBanner } from "@/components/ads/GoogleAdBanner";
import { ReferAndEarnCard } from "@/components/referrals/ReferAndEarnCard";
import { WalletSection } from "@/components/wallet/WalletSection";
import { PremiumUpgradeModal } from "@/components/premium/PremiumUpgradeModal";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { DashboardSkeleton } from "@/components/ui/skeleton";

interface RecentStats {
  notesCount: number;
  bookmarksCount: number;
  doubtsCount: number;
  points: number;
  coins: number;
  referralsCount: number;
  recentNotes: { _id: string; title: string; updatedAt: string }[];
  recentBlogs: { _id: string; title: string; summary: string; userName: string }[];
}

export default function DashboardOverviewPage() {
  const { data: session } = useSession();
  const { setActiveNoteId } = useWorkspaceStore();
  const router = useRouter();
  const [stats, setStats] = useState<RecentStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [premiumInfo, setPremiumInfo] = useState<{
    isPremium: boolean;
    premiumPlan: string | null;
    premiumExpiresAt: string | null;
    coins: number;
  } | null>(null);

  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);

  const fetchDashboardStats = async () => {
    try {
      const res = await fetch("/api/dashboard/stats");
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (e) {
      console.error("fetch dashboard stats error:", e);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPremiumStatus = async () => {
    try {
      const res = await fetch("/api/premium/status");
      if (res.ok) {
        const data = await res.json();
        setPremiumInfo(data);
      }
    } catch (e) {
      console.error("fetch premium status error:", e);
    }
  };

  useEffect(() => {
    fetchDashboardStats();
    fetchPremiumStatus();
  }, []);

  if (isLoading || !stats) {
    return <DashboardSkeleton />;
  }

  const mostRecentNote = stats.recentNotes && stats.recentNotes.length > 0 ? stats.recentNotes[0] : null;

  return (
    <div className="flex-1 flex flex-col h-full bg-bg-base text-text-primary overflow-y-auto overflow-x-hidden antialiased relative selection:bg-accent-primary/25 selection:text-text-primary custom-scroll animate-in fade-in duration-150">
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">

        {/* ── SECTION A: WELCOME & PRIMARY RESUME BANNER ── */}
        <div className="rounded-2xl border border-border-subtle bg-bg-surface p-5 sm:p-7 relative overflow-hidden shadow-sm">
          {/* Subtle warm glow landmark (calm, non-distracting) */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-accent-primary/5 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
            <div className="space-y-1.5 max-w-2xl">
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-accent-primary animate-pulse" />
                <span className="text-[10px] font-mono font-bold text-accent-primary uppercase tracking-widest">
                  Academic Workspace
                </span>
                {premiumInfo?.isPremium && (
                  <span className="px-2 py-0.5 rounded-full bg-accent-primary/10 border border-accent-primary/30 text-accent-primary text-[10px] font-mono font-bold flex items-center gap-1">
                    <Crown className="size-3" />
                    <span>Premium Scholar</span>
                  </span>
                )}
              </div>

              <h1 className="text-2xl sm:text-3xl font-black text-text-primary tracking-tight font-display">
                Welcome back, {session?.user?.name || "Scholar"}
              </h1>

              <p className="text-text-secondary text-xs sm:text-sm font-normal leading-relaxed">
                Continue your learning goals, review recent study notes, and master academic concepts.
              </p>
            </div>

            {/* Primary Action Buttons */}
            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              {!premiumInfo?.isPremium ? (
                <Button
                  onClick={() => setIsUpgradeModalOpen(true)}
                  className="rounded-xl bg-bg-elevated hover:bg-bg-elevated/80 border border-accent-primary/30 text-accent-primary font-bold text-xs h-10 px-4 flex items-center gap-2 transition-all cursor-pointer"
                >
                  <Crown className="size-4 text-accent-primary" />
                  <span>Upgrade</span>
                </Button>
              ) : (
                <div className="px-3 py-1.5 rounded-xl bg-bg-elevated border border-accent-primary/20 text-xs text-accent-primary font-mono font-medium flex items-center gap-1.5">
                  <Crown className="size-3.5" />
                  <span>{premiumInfo.premiumPlan === "yearly" ? "Annual" : "Monthly"} Pass</span>
                </div>
              )}

              <Link href="/notes?action=new">
                <Button className="btn-premium-primary text-xs h-10 px-4 flex items-center gap-2">
                  <Plus className="size-4 stroke-[2.5]" />
                  <span>Create Note</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* ── SECTION B: CONTINUE STUDYING / RECENT NOTE HERO CARD ── */}
        {mostRecentNote && (
          <div className="rounded-2xl border border-border-default bg-bg-elevated/50 p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-colors hover:border-accent-primary/40">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="size-10 rounded-xl bg-accent-primary/10 border border-accent-primary/20 flex items-center justify-center text-accent-primary shrink-0">
                <BookOpen className="size-5" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-mono font-bold text-accent-primary uppercase tracking-wider block">
                  Jump back into
                </span>
                <h3 className="text-sm sm:text-base font-semibold text-text-primary truncate">
                  {mostRecentNote.title}
                </h3>
                <span className="text-[11px] text-text-muted font-mono">
                  Last edited {new Date(mostRecentNote.updatedAt).toLocaleDateString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            </div>

            <Button
              onClick={() => {
                setActiveNoteId(mostRecentNote._id);
                router.push("/notes");
              }}
              className="w-full sm:w-auto h-9 px-4 text-xs font-semibold bg-accent-primary text-bg-base hover:bg-accent-primary-hover flex items-center gap-1.5 rounded-xl shrink-0 cursor-pointer"
            >
              <span>Resume Note</span>
              <ArrowRight className="size-3.5" />
            </Button>
          </div>
        )}

        {/* ── SECTION C: METRIC CARDS GRID ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 select-none">
          {[
            { label: "Total Notes", value: stats.notesCount, icon: BookOpen, accent: "text-accent-primary", highlight: false },
            { label: "Study Points", value: stats.points, icon: Trophy, accent: "text-accent-secondary", highlight: true },
            { label: "Coins Balance", value: (premiumInfo?.coins ?? stats.coins ?? 0).toLocaleString(), icon: Coins, accent: "text-accent-primary", highlight: false },
            { label: "Referred Friends", value: stats.referralsCount ?? 0, icon: GraduationCap, accent: "text-text-primary", highlight: false },
          ].map(({ label, value, icon: Icon, accent, highlight }) => (
            <Card
              key={label}
              className="p-4 sm:p-5 border-border-subtle bg-bg-surface hover:border-border-default transition-colors flex items-center justify-between gap-3"
            >
              <div className="space-y-1 min-w-0">
                <span className="block text-[10px] font-mono font-bold text-text-muted uppercase tracking-wider truncate">
                  {label}
                </span>
                <p className={`text-xl sm:text-2xl font-bold font-mono truncate ${highlight ? accent : "text-text-primary"}`}>
                  {value}
                </p>
              </div>
              <div className="size-10 rounded-xl bg-bg-elevated border border-border-subtle flex items-center justify-center text-text-muted shrink-0">
                <Icon className={`size-4.5 ${accent}`} />
              </div>
            </Card>
          ))}
        </div>

        {/* ── SECTION D: HIGH-VALUE CURATED ACTIONS ── */}
        <div className="space-y-2.5 select-none">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs font-mono font-bold text-text-muted uppercase tracking-widest flex items-center gap-2">
              <span>High-Value Workspaces</span>
            </h2>
            <span className="text-[10px] font-mono text-text-muted">Direct Access</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3">
            {[
              { href: "/notes", label: "Notes Board", icon: BookOpen, desc: "Personal study notes" },
              { href: "/revision", label: "Smart Revision", icon: Sparkles, desc: "AI flashcards & quiz" },
              { href: "/courses", label: "Courses", icon: GraduationCap, desc: "Enrolled curricula" },
              { href: "/planner", label: "AI Planner", icon: Calendar, desc: "Study schedule" },
              { href: "/research", label: "Research", icon: Trophy, desc: "Academic papers" },
              { href: "/community", label: "Community", icon: Flame, desc: "Peer discussions" },
            ].map(({ href, label, icon: Icon, desc }) => (
              <Link key={href} href={href} className="group">
                <Card className="p-3.5 sm:p-4 border-border-subtle bg-bg-surface hover:bg-bg-elevated hover:border-border-default transition-all duration-150 h-full flex flex-col justify-between cursor-pointer">
                  <div className="space-y-2">
                    <div className="size-8 rounded-lg bg-bg-elevated border border-border-subtle flex items-center justify-center text-accent-primary group-hover:text-accent-primary-hover group-hover:border-accent-primary/30 transition-colors">
                      <Icon className="size-4" />
                    </div>
                    <div>
                      <h3 className="text-xs font-semibold text-text-primary group-hover:text-accent-primary transition-colors truncate">
                        {label}
                      </h3>
                      <p className="text-[10px] text-text-muted leading-tight line-clamp-1 mt-0.5">
                        {desc}
                      </p>
                    </div>
                  </div>
                  <div className="pt-2 flex justify-end">
                    <ArrowUpRight className="size-3 text-text-muted group-hover:text-text-primary group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        {/* ── SECTION E: 2-COLUMN LEARNING OVERVIEW ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column (8 Cols): Recent Notes & Published Feed */}
          <div className="lg:col-span-8 space-y-6 w-full">

            {/* Smart Revision Quick Launcher */}
            <div className="rounded-2xl border border-border-subtle bg-bg-surface p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
              <div className="space-y-1.5 max-w-md">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-accent-primary/10 border border-accent-primary/20 text-accent-primary text-[10px] font-mono font-bold uppercase tracking-widest">
                  <Sparkles className="size-3 text-accent-primary" /> Active Copilot
                </span>
                <h3 className="text-base sm:text-lg font-bold text-text-primary font-display">
                  Prepare for exams with Smart Revision
                </h3>
                <p className="text-xs text-text-secondary leading-relaxed font-normal">
                  Convert study notes into automated quizzes, summaries, flashcards, and conceptual reviews.
                </p>
              </div>
              <Link href="/revision" className="shrink-0 w-full sm:w-auto">
                <Button className="w-full sm:w-auto text-xs h-10 px-4 bg-bg-elevated hover:bg-bg-elevated/80 text-text-primary border border-border-default hover:border-border-muted flex items-center justify-center gap-1.5 rounded-xl font-medium">
                  <span>Smart Revision</span>
                  <ArrowRight className="size-3.5 text-accent-primary" />
                </Button>
              </Link>
            </div>

            {/* Side-by-side: Recent Notes & Recent Community Posts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Recent Notes Card */}
              <Card className="border-border-subtle bg-bg-surface flex flex-col">
                <CardHeader className="p-4 sm:p-5 pb-3 flex flex-row items-center justify-between border-b border-border-subtle">
                  <CardTitle className="text-xs font-mono font-bold text-text-primary uppercase tracking-wider flex items-center gap-2">
                    <BookOpen className="size-3.5 text-accent-primary" />
                    <span>Recent Notes</span>
                  </CardTitle>
                  <Link
                    href="/notes"
                    className="text-[11px] font-mono font-semibold text-accent-primary hover:text-accent-primary-hover flex items-center gap-1 transition-colors"
                  >
                    <span>View all</span>
                    <ArrowUpRight className="size-3" />
                  </Link>
                </CardHeader>

                <CardContent className="p-4 sm:p-5 space-y-2 flex-1">
                  {stats.recentNotes.length === 0 ? (
                    <p className="text-xs text-text-muted italic py-6 text-center border border-dashed border-border-subtle rounded-xl">
                      No notes created yet.
                    </p>
                  ) : (
                    stats.recentNotes.slice(0, 4).map((note) => (
                      <div
                        key={note._id}
                        onClick={() => {
                          setActiveNoteId(note._id);
                          router.push("/notes");
                        }}
                        className="p-2.5 bg-bg-elevated/40 border border-border-subtle hover:border-border-default rounded-xl flex items-center justify-between gap-3 text-xs transition-colors group cursor-pointer hover:bg-bg-elevated"
                      >
                        <span className="font-medium text-text-primary group-hover:text-accent-primary truncate flex-1 transition-colors">
                          {note.title}
                        </span>
                        <span className="text-[10px] font-mono text-text-muted shrink-0">
                          {new Date(note.updatedAt).toLocaleDateString([], { month: "short", day: "numeric" })}
                        </span>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              {/* Published Community Blogs Card */}
              <Card className="border-border-subtle bg-bg-surface flex flex-col">
                <CardHeader className="p-4 sm:p-5 pb-3 flex flex-row items-center justify-between border-b border-border-subtle">
                  <CardTitle className="text-xs font-mono font-bold text-text-primary uppercase tracking-wider flex items-center gap-2">
                    <Newspaper className="size-3.5 text-accent-secondary" />
                    <span>Published Blogs</span>
                  </CardTitle>
                  <Link
                    href="/blogs"
                    className="text-[11px] font-mono font-semibold text-accent-primary hover:text-accent-primary-hover flex items-center gap-1 transition-colors"
                  >
                    <span>Feed</span>
                    <ArrowUpRight className="size-3" />
                  </Link>
                </CardHeader>

                <CardContent className="p-4 sm:p-5 space-y-2 flex-1">
                  {stats.recentBlogs.length === 0 ? (
                    <p className="text-xs text-text-muted italic py-6 text-center border border-dashed border-border-subtle rounded-xl">
                      No published blogs found.
                    </p>
                  ) : (
                    stats.recentBlogs.slice(0, 4).map((blog) => (
                      <div
                        key={blog._id}
                        onClick={() => router.push(`/blogs?blogId=${blog._id}`)}
                        className="p-2.5 bg-bg-elevated/40 border border-border-subtle hover:border-border-default rounded-xl space-y-0.5 transition-colors cursor-pointer group hover:bg-bg-elevated"
                      >
                        <h4 className="text-xs font-medium text-text-primary group-hover:text-accent-secondary truncate transition-colors">
                          {blog.title}
                        </h4>
                        <p className="text-[10px] text-text-muted line-clamp-1">
                          {blog.summary || "Read community article..."}
                        </p>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Right Column (4 Cols): Study Planner, Referral Rewards & Clean Ads */}
          <div className="lg:col-span-4 space-y-6 w-full">
            <SimpleTodo />
            <ReferAndEarnCard
              onCoinsUpdated={() => {
                fetchDashboardStats();
                fetchPremiumStatus();
              }}
            />
            <GoogleAdBanner adSlot="1001" />
          </div>
        </div>

        {/* ── SECTION F: WALLET & COIN LEDGER ── */}
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs font-mono font-bold text-text-muted uppercase tracking-widest flex items-center gap-2">
              <Wallet className="size-3.5 text-accent-primary" />
              <span>Wallet & Financial Ledger</span>
            </h2>
            <Link
              href="/wallet"
              className="text-[11px] font-mono text-accent-primary hover:text-accent-primary-hover flex items-center gap-1 font-semibold transition-colors"
            >
              <span>Full Wallet</span>
              <ArrowUpRight className="size-3" />
            </Link>
          </div>

          <WalletSection
            onCoinsUpdated={() => {
              fetchDashboardStats();
              fetchPremiumStatus();
            }}
          />
        </div>

        {/* Upgrade Modal */}
        <PremiumUpgradeModal
          isOpen={isUpgradeModalOpen}
          onClose={() => setIsUpgradeModalOpen(false)}
          currentBalance={premiumInfo?.coins ?? 0}
          onSuccess={() => {
            fetchDashboardStats();
            fetchPremiumStatus();
          }}
        />
      </div>
    </div>
  );
}