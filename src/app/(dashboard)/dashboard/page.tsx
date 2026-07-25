"use client";

import React, { useEffect, useState } from "react";
import { BookOpen, Trophy, ArrowUpRight, Loader2, Coins, Gift, Sparkles, Plus, Compass, Send, Flame, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useWorkspaceStore } from "@/stores/workspaceStore";
import { useRouter } from "next/navigation";
import { SimpleTodo } from "@/components/notes/SimpleTodo";
import { GoogleAdBanner } from "@/components/ads/GoogleAdBanner";
import { Button } from "@/components/ui/button";

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

  useEffect(() => {
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
    fetchDashboardStats();
  }, []);

  if (isLoading || !stats) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#030305] text-zinc-500 select-none gap-3 px-4 text-center">
        <Loader2 className="size-8 animate-spin text-cyan-400 shrink-0" />
        <span className="text-xs font-mono font-bold uppercase tracking-widest text-zinc-400">
          Syncing workspace telemetry...
        </span>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-[#030305] text-zinc-100 overflow-y-auto overflow-x-hidden antialiased relative selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Background Ambient Mesh Glow Orbs */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 right-1/4 w-[500px] h-[350px] bg-cyan-500/10 rounded-full blur-[140px]" />
        <div className="absolute bottom-0 left-1/4 w-[450px] h-[350px] bg-violet-500/10 rounded-full blur-[140px]" />
      </div>

      {/* Header Banner */}
      <div className="border-b border-white/5 bg-zinc-950/40 p-6 sm:p-10 rounded-[2rem] border border-white/10 relative z-10 backdrop-blur-2xl m-4 sm:m-8 lg:m-10 mb-0">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-cyan-400 animate-pulse" />
              <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase tracking-[0.25em]">
                COMMAND CENTER OVERVIEW
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              Welcome back, {session?.user?.name || "Scholar"}!
            </h1>
            <p className="text-zinc-400 text-xs sm:text-sm font-light max-w-xl">
              Track academic metrics, jump to recent study notes, coordinate team tasks, and publish research.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            <Link href="/notes?action=new" className="flex-1 lg:flex-none">
              <Button className="w-full lg:w-auto rounded-full bg-white hover:bg-zinc-100 text-zinc-950 font-bold text-xs h-10 px-5 flex items-center justify-center gap-2 transition-all active:scale-[0.97]">
                <Plus className="size-4" />
                <span>New Note</span>
              </Button>
            </Link>
            <Link href="/feed" className="flex-1 lg:flex-none">
              <Button variant="outline" className="w-full lg:w-auto rounded-full bg-zinc-900 border-white/10 hover:bg-zinc-800 text-white font-bold text-xs h-10 px-5 flex items-center justify-center gap-2 transition-all">
                <Compass className="size-4 text-cyan-400" />
                <span>Public Feed</span>
              </Button>
            </Link>
            <Link href="/messages" className="flex-1 lg:flex-none">
              <Button variant="outline" className="w-full lg:w-auto rounded-full bg-violet-500/10 border-violet-500/30 text-violet-300 hover:bg-violet-500/20 font-bold text-xs h-10 px-5 flex items-center justify-center gap-2 transition-all">
                <Send className="size-4 text-violet-400" />
                <span>Messages</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Grid Content */}
      <div className="p-4 sm:p-8 lg:p-10 max-w-7xl w-full mx-auto space-y-8 relative z-10">
        {/* Doppelrand Metric Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 select-none">
          {[
            { label: "My Notes", value: stats.notesCount, icon: BookOpen, accent: "text-cyan-400", bg: "bg-cyan-500/10" },
            { label: "Activity Points", value: stats.points, icon: Trophy, accent: "text-rose-400", bg: "bg-rose-500/10", highlight: true },
            { label: "Coins Balance", value: stats.coins ?? 0, icon: Coins, accent: "text-amber-400", bg: "bg-amber-500/10" },
            { label: "Referred Friends", value: stats.referralsCount ?? 0, icon: Gift, accent: "text-violet-400", bg: "bg-violet-500/10" },
          ].map(({ label, value, icon: Icon, accent, bg, highlight }) => (
            <div key={label} className="rounded-[2rem] bg-zinc-900/40 border border-white/10 p-2 backdrop-blur-xl group hover:border-white/20 transition-all duration-300">
              <div className="rounded-[calc(2rem-0.5rem)] bg-[#07070a] border border-white/5 p-5 flex items-center justify-between gap-3 h-full">
                <div className="space-y-1.5 min-w-0">
                  <span className="block text-[9px] font-mono font-bold text-zinc-500 uppercase tracking-widest truncate">
                    {label}
                  </span>
                  <h2 className={`text-2xl sm:text-3xl font-black font-mono truncate ${highlight ? accent : "text-white"}`}>
                    {value}
                  </h2>
                </div>
                <div className={`size-11 rounded-2xl ${bg} border border-white/10 flex items-center justify-center ${accent} shrink-0 group-hover:scale-110 transition-transform duration-300`}>
                  <Icon className="size-5" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Asymmetric 2-Column Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column (8 Cols): Recent Workspaces & Blogs */}
          <div className="col-span-1 lg:col-span-8 space-y-8 w-full">

            {/* Quick Action Copilot Banner */}
            <div className="rounded-[2.5rem] bg-gradient-to-r from-violet-950/40 via-zinc-900/40 to-cyan-950/40 border border-white/10 p-2.5 backdrop-blur-3xl relative overflow-hidden">
              <div className="rounded-[calc(2.5rem-0.75rem)] bg-[#07070a]/90 border border-white/5 p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                <div className="space-y-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300 text-[10px] font-mono font-bold uppercase tracking-widest">
                    <Sparkles className="size-3 text-violet-400" /> CLAUDE 3.7 SONNET INTEGRATION
                  </span>
                  <h3 className="text-xl font-bold text-white tracking-tight">Need help with study notes or revision?</h3>
                  <p className="text-xs text-zinc-400 font-light max-w-md leading-relaxed">
                    Generate instant cheat sheets, flashcards, YouTube digests, or ask questions directly to your personal AI study copilot.
                  </p>
                </div>
                <Link href="/revision">
                  <Button className="rounded-full bg-white hover:bg-zinc-100 text-zinc-950 font-bold text-xs h-11 px-6 flex items-center gap-2 shrink-0 transition-all active:scale-[0.97]">
                    <span>Smart Revision</span>
                    <ArrowRight className="size-4" />
                  </Button>
                </Link>
              </div>
            </div>

            {/* Side by Side Lists: Recent Notes & Latest Blogs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Recent Notes */}
              <div className="rounded-[2rem] bg-zinc-900/40 border border-white/10 p-2 backdrop-blur-xl">
                <div className="rounded-[calc(2rem-0.5rem)] bg-[#07070a] border border-white/5 p-6 space-y-4">
                  <div className="flex items-center justify-between border-b border-white/5 pb-4 select-none">
                    <h3 className="text-xs font-mono font-bold text-white uppercase tracking-widest flex items-center gap-2">
                      <BookOpen className="size-4 text-cyan-400" /> Recent Notes
                    </h3>
                    <Link
                      href="/notes"
                      className="group text-xs font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors"
                    >
                      <span>Notes Board</span>
                      <ArrowUpRight className="size-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                    </Link>
                  </div>

                  <div className="space-y-2.5">
                    {stats.recentNotes.length === 0 ? (
                      <p className="text-xs text-zinc-500 italic py-8 text-center border border-dashed border-white/5 rounded-2xl bg-zinc-950">
                        No notes created yet.
                      </p>
                    ) : (
                      stats.recentNotes.map((note) => (
                        <div
                          key={note._id}
                          onClick={() => {
                            setActiveNoteId(note._id);
                            router.push("/notes");
                          }}
                          className="p-3.5 bg-zinc-950/80 border border-white/5 hover:border-cyan-500/30 rounded-2xl flex items-center justify-between gap-3 text-xs transition-all hover:bg-zinc-900/40 group cursor-pointer active:scale-[0.98]"
                        >
                          <span className="font-semibold text-zinc-300 group-hover:text-cyan-400 truncate flex-1 transition-colors">
                            {note.title}
                          </span>
                          <span className="text-[10px] font-mono text-zinc-500 shrink-0">
                            {new Date(note.updatedAt).toLocaleDateString()}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Recent Published Blogs */}
              <div className="rounded-[2rem] bg-zinc-900/40 border border-white/10 p-2 backdrop-blur-xl">
                <div className="rounded-[calc(2rem-0.5rem)] bg-[#07070a] border border-white/5 p-6 space-y-4">
                  <div className="flex items-center justify-between border-b border-white/5 pb-4 select-none">
                    <h3 className="text-xs font-mono font-bold text-white uppercase tracking-widest flex items-center gap-2">
                      <Flame className="size-4 text-amber-400" /> Published Blogs
                    </h3>
                    <Link
                      href="/blogs"
                      className="group text-xs font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors"
                    >
                      <span>View Feed</span>
                      <ArrowUpRight className="size-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                    </Link>
                  </div>

                  <div className="space-y-2.5">
                    {stats.recentBlogs.length === 0 ? (
                      <p className="text-xs text-zinc-500 italic py-8 text-center border border-dashed border-white/5 rounded-2xl bg-zinc-950">
                        No published blogs found.
                      </p>
                    ) : (
                      stats.recentBlogs.map((blog) => (
                        <div
                          key={blog._id}
                          onClick={() => {
                            router.push(`/blogs?blogId=${blog._id}`);
                          }}
                          className="p-3.5 bg-zinc-950/80 border border-white/5 hover:border-amber-500/30 rounded-2xl space-y-1 transition-all hover:bg-zinc-900/40 cursor-pointer group active:scale-[0.98]"
                        >
                          <h4 className="text-xs font-semibold text-zinc-300 group-hover:text-amber-400 truncate transition-colors">
                            {blog.title}
                          </h4>
                          <p className="text-[10px] text-zinc-400 line-clamp-1 font-light">{blog.summary}</p>
                          <div className="text-[9px] font-mono text-zinc-500 flex justify-between select-none pt-1">
                            <span className="truncate">By {blog.userName}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column (4 Cols): Quick Tasks & Sidebar Tools */}
          <div className="col-span-1 lg:col-span-4 space-y-6 w-full">
            {/* Quick Tasks Todo Component */}
            <SimpleTodo />

            {/* Ad Banner */}
            <GoogleAdBanner adSlot="1001" />
          </div>
        </div>
      </div>
    </div>
  );
}