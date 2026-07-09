"use client";

import React, { useEffect, useState } from "react";
import { BookOpen, Bookmark, HelpCircle, Trophy, ArrowUpRight, Loader2 } from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useWorkspaceStore } from "@/stores/workspaceStore";
import { useRouter } from "next/navigation";

interface RecentStats {
  notesCount: number;
  bookmarksCount: number;
  doubtsCount: number;
  points: number;
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
      <div className="flex-1 flex items-center justify-center bg-neutral-950 text-neutral-500 select-none gap-2">
        <Loader2 className="h-5 w-5 animate-spin text-cyan-400" />
        <span
          className="text-xs font-bold uppercase tracking-widest"
          style={{ fontFamily: "var(--font-jetbrains-mono)" }}
        >
          Loading workspace...
        </span>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-neutral-950 overflow-y-auto custom-scroll">
      {/* Welcome Banner */}
      <div className="border-b border-neutral-900 bg-neutral-900/10 px-4 py-5 sm:px-8 sm:py-8 shrink-0 select-none relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[200px] bg-cyan-500/5 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[150px] bg-violet-500/5 rounded-full blur-[80px] pointer-events-none" />
        <div className="space-y-1.5 relative z-10">
          <div className="flex items-center gap-2 mb-1">
            <span
              className="h-1 w-6 rounded-full bg-gradient-to-r from-cyan-400 to-indigo-500"
            />
            <span
              className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest"
              style={{ fontFamily: "var(--font-jetbrains-mono)" }}
            >
              Workspace Overview
            </span>
          </div>
          <h1
            className="text-2xl font-bold text-neutral-100 tracking-tight"
            style={{ fontFamily: "var(--font-space-grotesk)" }}
          >
            Welcome back, {session?.user?.name || "Scholar"}!
          </h1>
          <p className="text-neutral-500 text-xs">
            Your academic workspace summary and latest peer publications.
          </p>
        </div>
      </div>

      <div className="p-4 sm:p-8 max-w-5xl w-full mx-auto space-y-6 sm:space-y-8">
        {/* Metric cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 select-none">
          {[
            { label: "My Notes",       value: stats.notesCount,     icon: BookOpen,  accent: "text-[#06B6D4]",   glow: "hover:border-[#06B6D4]/30 hover:shadow-[0_0_22px_rgba(6,182,212,0.15)] hover:bg-[#06B6D4]/[0.02]" },
            { label: "Activity Points",value: stats.points,         icon: Trophy,    accent: "text-[#EC4899]",   glow: "hover:border-[#EC4899]/35 hover:shadow-[0_0_22px_rgba(236,72,153,0.18)] hover:bg-[#EC4899]/[0.03]", highlight: true },
          ].map(({ label, value, icon: Icon, accent, glow, highlight }) => (
            <div
              key={label}
              className={`group relative glass glass-card-hover p-3 sm:p-5 flex items-center justify-between shadow-lg transition-all duration-300 ${glow}`}
            >
              <div className="space-y-1">
                <span
                  className="text-[9px] font-bold text-neutral-500 uppercase tracking-widest"
                  style={{ fontFamily: "var(--font-space-grotesk)" }}
                >
                  {label}
                </span>
                <h2
                  className={`text-xl sm:text-2xl font-extrabold ${highlight ? accent : "text-neutral-100"}`}
                  style={{ fontFamily: "var(--font-space-grotesk)" }}
                >
                  {value}
                </h2>
              </div>
              <Icon className={`h-6 w-6 ${accent} opacity-50 group-hover:opacity-80 transition-opacity`} />
            </div>
          ))}
        </div>

        {/* Recent lists grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-8">
          {/* Recent Notes */}
          <div className="glass glass-card-hover p-4 sm:p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-white/[0.12] pb-3 select-none">
              <h3
                className="text-[10px] font-bold text-neutral-300 uppercase tracking-widest"
                style={{ fontFamily: "var(--font-space-grotesk)" }}
              >
                Recent Notes
              </h3>
              <Link
                href="/notes"
                className="text-[10px] font-bold text-cyan-400 hover:text-cyan-300 hover:underline flex items-center gap-0.5 transition-colors"
              >
                <span>Notes Board</span>
                <ArrowUpRight className="h-3 w-3" />
              </Link>
            </div>
            <div className="space-y-2">
              {stats.recentNotes.length === 0 ? (
                <p className="text-xs text-neutral-600 italic py-4 text-center border border-dashed border-neutral-900 rounded-lg">
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
                    className="p-3 bg-neutral-950/40 border border-neutral-900 hover:border-neutral-800 rounded-xl flex items-center justify-between text-xs transition-all hover:bg-neutral-900/20 group cursor-pointer"
                  >
                    <span className="font-semibold text-neutral-300 group-hover:text-cyan-400 truncate max-w-[200px] transition-colors">
                      {note.title}
                    </span>
                    <span
                      className="text-[10px] text-neutral-600"
                      style={{ fontFamily: "var(--font-jetbrains-mono)" }}
                    >
                      {new Date(note.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Recent Blogs */}
          <div className="glass glass-card-hover p-4 sm:p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-white/[0.12] pb-3 select-none">
              <h3
                className="text-[10px] font-bold text-neutral-300 uppercase tracking-widest"
                style={{ fontFamily: "var(--font-space-grotesk)" }}
              >
                Latest Published Blogs
              </h3>
              <Link
                href="/blogs"
                className="text-[10px] font-bold text-cyan-400 hover:text-cyan-300 hover:underline flex items-center gap-0.5 transition-colors"
              >
                <span>View Feed</span>
                <ArrowUpRight className="h-3 w-3" />
              </Link>
            </div>
            <div className="space-y-2">
              {stats.recentBlogs.length === 0 ? (
                <p className="text-xs text-neutral-600 italic py-4 text-center border border-dashed border-neutral-900 rounded-lg">
                  No published blogs found.
                </p>
              ) : (
                stats.recentBlogs.map((blog) => (
                  <div
                    key={blog._id}
                    onClick={() => {
                      router.push(`/blogs?blogId=${blog._id}`);
                    }}
                    className="p-3 bg-neutral-955/40 border border-neutral-900 hover:border-neutral-800 rounded-xl space-y-1 transition-all hover:bg-neutral-900/20 cursor-pointer group"
                  >
                    <h4 className="text-xs font-semibold text-neutral-300 group-hover:text-cyan-400 truncate transition-colors">{blog.title}</h4>
                    <p className="text-[10px] text-neutral-500 line-clamp-1">{blog.summary}</p>
                    <div
                      className="text-[9px] text-neutral-600 flex justify-between select-none"
                      style={{ fontFamily: "var(--font-jetbrains-mono)" }}
                    >
                      <span>By {blog.userName}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
