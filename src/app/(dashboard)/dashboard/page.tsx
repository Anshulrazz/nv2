"use client";

export const dynamic = "force-dynamic";

import React, { useEffect, useState } from "react";
import {
  BookOpen,
  Trophy,
  ArrowUpRight,
  Loader2,
  Coins,
  Gift,
  Sparkles,
  Plus,
  Compass,
  Send,
  Flame,
  ArrowRight,
  GraduationCap,
  Rss,
  Play,
  Calendar,
  Briefcase,
  Newspaper,
  HelpCircle,
  MessageSquare,
  Presentation,
  Bookmark,
  Settings,
  Zap,
  Grid,
} from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useWorkspaceStore } from "@/stores/workspaceStore";
import { useRouter } from "next/navigation";
import { SimpleTodo } from "@/components/notes/SimpleTodo";
import { GoogleAdBanner } from "@/components/ads/GoogleAdBanner";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

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

const quickLinks = [
  { href: "/notes", label: "Notes", icon: BookOpen, accent: "text-[#8FC3DE]", bg: "bg-[#8FC3DE]/15 border-[#8FC3DE]/30" },
  { href: "/research", label: "Research", icon: GraduationCap, accent: "text-[#C9A9E0]", bg: "bg-[#C9A9E0]/15 border-[#C9A9E0]/30", badge: "AI" },
  { href: "/revision", label: "Revision", icon: Sparkles, accent: "text-[#F0C93B]", bg: "bg-[#F0C93B]/15 border-[#F0C93B]/30", badge: "AI" },
  { href: "/feed", label: "Public Feed", icon: Rss, accent: "text-[#F28B6E]", bg: "bg-[#F28B6E]/15 border-[#F28B6E]/30" },
  { href: "/messages", label: "Messages", icon: Send, accent: "text-[#8FC3DE]", bg: "bg-[#8FC3DE]/15 border-[#8FC3DE]/30" },
  { href: "/youtube", label: "YouTube AI", icon: Play, accent: "text-[#F28B6E]", bg: "bg-[#F28B6E]/15 border-[#F28B6E]/30", badge: "AI" },
  { href: "/planner", label: "Planner", icon: Calendar, accent: "text-[#C9A9E0]", bg: "bg-[#C9A9E0]/15 border-[#C9A9E0]/30" },
  { href: "/projects", label: "Projects", icon: Briefcase, accent: "text-[#8FC3DE]", bg: "bg-[#8FC3DE]/15 border-[#8FC3DE]/30" },
  { href: "/blogs", label: "Blogs", icon: Newspaper, accent: "text-[#C9A9E0]", bg: "bg-[#C9A9E0]/15 border-[#C9A9E0]/30" },
  { href: "/doubts", label: "Doubts", icon: HelpCircle, accent: "text-[#F0C93B]", bg: "bg-[#F0C93B]/15 border-[#F0C93B]/30" },
  { href: "/forums", label: "Forums", icon: MessageSquare, accent: "text-[#F28B6E]", bg: "bg-[#F28B6E]/15 border-[#F28B6E]/30" },
  { href: "/courses", label: "Courses", icon: Presentation, accent: "text-[#8FC3DE]", bg: "bg-[#8FC3DE]/15 border-[#8FC3DE]/30" },
  { href: "/bookmarks", label: "Bookmarks", icon: Bookmark, accent: "text-[#F0C93B]", bg: "bg-[#F0C93B]/15 border-[#F0C93B]/30" },
  { href: "/leaderboard", label: "Leaderboard", icon: Trophy, accent: "text-[#F28B6E]", bg: "bg-[#F28B6E]/15 border-[#F28B6E]/30" },
  { href: "/referrals", label: "Referrals", icon: Gift, accent: "text-[#C9A9E0]", bg: "bg-[#C9A9E0]/15 border-[#C9A9E0]/30" },
  { href: "/settings", label: "Settings", icon: Settings, accent: "text-[#9FAEA1]", bg: "bg-[#9FAEA1]/15 border-[#9FAEA1]/30" },
];

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring" as const,
      stiffness: 300,
      damping: 24,
    },
  },
};

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
      <div className="flex-1 flex items-center justify-center bg-[#16261D] text-[#9FAEA1] select-none gap-3 px-4 text-center min-h-[600px]">
        <Loader2 className="size-8 animate-spin text-[#F0C93B] shrink-0" />
        <span className="text-xs font-mono font-bold uppercase tracking-widest text-[#F3F0E4]/80">
          Syncing workspace telemetry...
        </span>
      </div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="flex-1 flex flex-col h-full bg-[#16261D] text-[#F3F0E4] overflow-y-auto overflow-x-hidden antialiased relative selection:bg-[#F0C93B]/30 selection:text-[#F0C93B] custom-scroll"
    >
      {/* Background Ambient Mesh Glow Orbs */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 right-1/4 w-[500px] h-[350px] bg-[#8FC3DE]/10 rounded-full blur-[140px] animate-float-glow" />
        <div className="absolute bottom-0 left-1/4 w-[450px] h-[350px] bg-[#C9A9E0]/10 rounded-full blur-[140px] animate-float-glow-reverse" />
        <div className="absolute top-1/3 left-1/3 w-[400px] h-[300px] bg-[#F28B6E]/8 rounded-full blur-[150px]" />
      </div>

      {/* Header Banner */}
      <motion.div variants={itemVariants} className="p-4 sm:p-8 lg:p-10 pb-0">
        <div className="border border-[#F3F0E4]/15 bg-[#1A2D23]/80 p-6 sm:p-10 rounded-[2rem] relative z-10 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] overflow-hidden group">
          <div className="absolute -top-24 -right-24 size-64 bg-[#F0C93B]/10 rounded-full blur-3xl group-hover:bg-[#F0C93B]/20 transition-all duration-700 pointer-events-none" />
          
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="size-2.5 rounded-full bg-[#F0C93B] animate-pulse shadow-[0_0_10px_#F0C93B]" />
                <span className="text-[10px] font-mono font-bold text-[#F0C93B] uppercase tracking-[0.25em]">
                  COMMAND CENTER OVERVIEW
                </span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-black text-[#F3F0E4] tracking-tight font-heading">
                Welcome back, {session?.user?.name || "Scholar"}!
              </h1>
              <p className="text-[#9FAEA1] text-xs sm:text-sm font-light max-w-xl leading-relaxed">
                Track academic metrics, jump to recent study notes, coordinate team tasks, and publish research seamlessly.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
              <Link href="/notes?action=new" className="flex-1 lg:flex-none">
                <Button className="w-full lg:w-auto rounded-xl bg-[#F0C93B] hover:bg-[#F0C93B]/90 text-[#2A2118] font-bold text-xs h-11 px-5 flex items-center justify-center gap-2 transition-all active:scale-[0.97] shadow-[4px_4px_0_0_#F28B6E] hover:translate-x-0.5 hover:translate-y-0.5">
                  <Plus className="size-4" />
                  <span>New Note</span>
                </Button>
              </Link>
              <Link href="/feed" className="flex-1 lg:flex-none">
                <Button variant="outline" className="w-full lg:w-auto rounded-xl bg-[#121F18] border-[#F3F0E4]/20 hover:border-[#8FC3DE]/50 text-[#F3F0E4] hover:bg-[#1F362A] font-bold text-xs h-11 px-5 flex items-center justify-center gap-2 transition-all">
                  <Compass className="size-4 text-[#8FC3DE]" />
                  <span>Public Feed</span>
                </Button>
              </Link>
              <Link href="/messages" className="flex-1 lg:flex-none">
                <Button variant="outline" className="w-full lg:w-auto rounded-xl bg-[#C9A9E0]/15 border-[#C9A9E0]/30 text-[#C9A9E0] hover:bg-[#C9A9E0]/25 font-bold text-xs h-11 px-5 flex items-center justify-center gap-2 transition-all">
                  <Send className="size-4 text-[#C9A9E0]" />
                  <span>Messages</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Main Grid Content */}
      <div className="p-4 sm:p-8 lg:p-10 max-w-7xl w-full mx-auto space-y-8 relative z-10">
        {/* Doppelrand Metric Cards Grid */}
        <motion.div variants={itemVariants} className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 select-none">
          {[
            { label: "My Notes", value: stats.notesCount, icon: BookOpen, accent: "text-[#8FC3DE]", bg: "bg-[#8FC3DE]/15", border: "border-[#8FC3DE]/30" },
            { label: "Activity Points", value: stats.points, icon: Trophy, accent: "text-[#F28B6E]", bg: "bg-[#F28B6E]/15", border: "border-[#F28B6E]/30", highlight: true },
            { label: "Coins Balance", value: stats.coins ?? 0, icon: Coins, accent: "text-[#F0C93B]", bg: "bg-[#F0C93B]/15", border: "border-[#F0C93B]/30" },
            { label: "Referred Friends", value: stats.referralsCount ?? 0, icon: Gift, accent: "text-[#C9A9E0]", bg: "bg-[#C9A9E0]/15", border: "border-[#C9A9E0]/30" },
          ].map(({ label, value, icon: Icon, accent, bg, border, highlight }) => (
            <motion.div
              key={label}
              whileHover={{ y: -4, scale: 1.02 }}
              transition={{ type: "spring", stiffness: 350, damping: 20 }}
              className="rounded-[2rem] bg-[#1A2D23]/80 border border-[#F3F0E4]/15 p-2 backdrop-blur-xl group shadow-[0_10px_30px_rgba(0,0,0,0.2)] hover:border-[#F0C93B]/40 transition-all duration-300"
            >
              <div className="rounded-[calc(2rem-0.5rem)] bg-[#121F18] border border-[#F3F0E4]/10 p-5 flex items-center justify-between gap-3 h-full">
                <div className="space-y-1.5 min-w-0">
                  <span className="block text-[9px] font-mono font-bold text-[#9FAEA1] uppercase tracking-widest truncate">
                    {label}
                  </span>
                  <h2 className={`text-2xl sm:text-3xl font-black font-mono truncate ${highlight ? accent : "text-[#F3F0E4]"}`}>
                    {value}
                  </h2>
                </div>
                <div className={`size-11 rounded-2xl ${bg} border ${border} flex items-center justify-center ${accent} shrink-0 group-hover:rotate-6 transition-transform duration-300`}>
                  <Icon className="size-5" />
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Quick Links & Shortcuts Grid (Phone view app launcher style) */}
        <motion.div variants={itemVariants} className="space-y-3 select-none">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <Zap className="size-4 text-[#F0C93B]" />
              <h2 className="text-xs font-mono font-bold text-[#F3F0E4] uppercase tracking-widest">
                Quick Links & Shortcuts
              </h2>
            </div>
            <span className="text-[10px] font-mono text-[#9FAEA1]">16 Tools</span>
          </div>

          <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-2.5 sm:gap-3">
            {quickLinks.map(({ href, label, icon: Icon, accent, bg, badge }) => (
              <Link key={href} href={href}>
                <motion.div
                  whileHover={{ y: -3, scale: 1.04 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 400, damping: 22 }}
                  className="rounded-2xl bg-[#1A2D23]/80 border border-[#F3F0E4]/15 p-2 sm:p-2.5 text-center flex flex-col items-center justify-center gap-1.5 hover:border-[#F0C93B]/40 hover:bg-[#1F362A] transition-all cursor-pointer relative group h-20 sm:h-22 shadow-md"
                >
                  {badge && (
                    <span className="absolute top-1 right-1 text-[8px] font-mono font-extrabold bg-[#F0C93B] text-[#2A2118] px-1 rounded-md leading-tight shadow-sm">
                      {badge}
                    </span>
                  )}
                  <div className={`size-8 sm:size-9 rounded-xl ${bg} flex items-center justify-center ${accent} group-hover:scale-110 transition-transform`}>
                    <Icon className="size-4 sm:size-4.5" />
                  </div>
                  <span className="text-[10px] sm:text-[11px] font-bold text-[#F3F0E4] group-hover:text-[#F0C93B] tracking-tight truncate max-w-full font-heading transition-colors">
                    {label}
                  </span>
                </motion.div>
              </Link>
            ))}
          </div>
        </motion.div>

        {/* Asymmetric 2-Column Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column (8 Cols): Recent Workspaces & Blogs */}
          <div className="col-span-1 lg:col-span-8 space-y-8 w-full">

            {/* Quick Action Copilot Banner */}
            <motion.div variants={itemVariants} className="rounded-[2.5rem] bg-gradient-to-r from-[#1A2D23] via-[#121F18] to-[#1F362A] border border-[#F3F0E4]/15 p-2.5 backdrop-blur-3xl relative overflow-hidden shadow-[0_15px_40px_rgba(0,0,0,0.3)]">
              <div className="rounded-[calc(2.5rem-0.75rem)] bg-[#121F18]/90 border border-[#F3F0E4]/10 p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                <div className="space-y-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#C9A9E0]/15 border border-[#C9A9E0]/30 text-[#C9A9E0] text-[10px] font-mono font-bold uppercase tracking-widest">
                    <Sparkles className="size-3 text-[#C9A9E0] animate-pulse" /> CLAUDE 3.7 SONNET CO-PILOT
                  </span>
                  <h3 className="text-xl font-bold text-[#F3F0E4] tracking-tight font-heading">Need help with study notes or revision?</h3>
                  <p className="text-xs text-[#9FAEA1] font-light max-w-md leading-relaxed">
                    Generate instant cheat sheets, flashcards, YouTube digests, or ask questions directly to your personal AI study copilot.
                  </p>
                </div>
                <Link href="/revision">
                  <Button className="rounded-xl bg-[#F0C93B] hover:bg-[#F0C93B]/90 text-[#2A2118] font-bold text-xs h-11 px-6 flex items-center gap-2 shrink-0 transition-all active:scale-[0.97] shadow-[4px_4px_0_0_#F28B6E] hover:translate-x-0.5 hover:translate-y-0.5">
                    <span>Smart Revision</span>
                    <ArrowRight className="size-4" />
                  </Button>
                </Link>
              </div>
            </motion.div>

            {/* Side by Side Lists: Recent Notes & Latest Blogs */}
            <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Recent Notes */}
              <div className="rounded-[2rem] bg-[#1A2D23]/80 border border-[#F3F0E4]/15 p-2 backdrop-blur-xl shadow-[0_10px_30px_rgba(0,0,0,0.2)]">
                <div className="rounded-[calc(2rem-0.5rem)] bg-[#121F18] border border-[#F3F0E4]/10 p-6 space-y-4">
                  <div className="flex items-center justify-between border-b border-[#F3F0E4]/10 pb-4 select-none">
                    <h3 className="text-xs font-mono font-bold text-[#F3F0E4] uppercase tracking-widest flex items-center gap-2">
                      <BookOpen className="size-4 text-[#8FC3DE]" /> Recent Notes
                    </h3>
                    <Link
                      href="/notes"
                      className="group text-xs font-bold text-[#8FC3DE] hover:text-[#8FC3DE]/80 flex items-center gap-1 transition-colors"
                    >
                      <span>Notes Board</span>
                      <ArrowUpRight className="size-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                    </Link>
                  </div>

                  <div className="space-y-2.5">
                    {stats.recentNotes.length === 0 ? (
                      <p className="text-xs text-[#9FAEA1] italic py-8 text-center border border-dashed border-[#F3F0E4]/15 rounded-2xl bg-[#121F18]/50">
                        No notes created yet.
                      </p>
                    ) : (
                      stats.recentNotes.map((note) => (
                        <motion.div
                          key={note._id}
                          whileHover={{ x: 3, backgroundColor: "rgba(243, 240, 228, 0.05)" }}
                          onClick={() => {
                            setActiveNoteId(note._id);
                            router.push("/notes");
                          }}
                          className="p-3.5 bg-[#16261D]/80 border border-[#F3F0E4]/10 hover:border-[#8FC3DE]/40 rounded-2xl flex items-center justify-between gap-3 text-xs transition-all group cursor-pointer active:scale-[0.98]"
                        >
                          <span className="font-semibold text-[#F3F0E4] group-hover:text-[#8FC3DE] truncate flex-1 transition-colors">
                            {note.title}
                          </span>
                          <span className="text-[10px] font-mono text-[#9FAEA1] shrink-0">
                            {new Date(note.updatedAt).toLocaleDateString()}
                          </span>
                        </motion.div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Recent Published Blogs */}
              <div className="rounded-[2rem] bg-[#1A2D23]/80 border border-[#F3F0E4]/15 p-2 backdrop-blur-xl shadow-[0_10px_30px_rgba(0,0,0,0.2)]">
                <div className="rounded-[calc(2rem-0.5rem)] bg-[#121F18] border border-[#F3F0E4]/10 p-6 space-y-4">
                  <div className="flex items-center justify-between border-b border-[#F3F0E4]/10 pb-4 select-none">
                    <h3 className="text-xs font-mono font-bold text-[#F3F0E4] uppercase tracking-widest flex items-center gap-2">
                      <Flame className="size-4 text-[#F28B6E]" /> Published Blogs
                    </h3>
                    <Link
                      href="/blogs"
                      className="group text-xs font-bold text-[#8FC3DE] hover:text-[#8FC3DE]/80 flex items-center gap-1 transition-colors"
                    >
                      <span>View Feed</span>
                      <ArrowUpRight className="size-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                    </Link>
                  </div>

                  <div className="space-y-2.5">
                    {stats.recentBlogs.length === 0 ? (
                      <p className="text-xs text-[#9FAEA1] italic py-8 text-center border border-dashed border-[#F3F0E4]/15 rounded-2xl bg-[#121F18]/50">
                        No published blogs found.
                      </p>
                    ) : (
                      stats.recentBlogs.map((blog) => (
                        <motion.div
                          key={blog._id}
                          whileHover={{ x: 3, backgroundColor: "rgba(243, 240, 228, 0.05)" }}
                          onClick={() => {
                            router.push(`/blogs?blogId=${blog._id}`);
                          }}
                          className="p-3.5 bg-[#16261D]/80 border border-[#F3F0E4]/10 hover:border-[#F28B6E]/40 rounded-2xl space-y-1 transition-all cursor-pointer group active:scale-[0.98]"
                        >
                          <h4 className="text-xs font-semibold text-[#F3F0E4] group-hover:text-[#F28B6E] truncate transition-colors">
                            {blog.title}
                          </h4>
                          <p className="text-[10px] text-[#9FAEA1] line-clamp-1 font-light">{blog.summary}</p>
                          <div className="text-[9px] font-mono text-[#9FAEA1]/80 flex justify-between select-none pt-1">
                            <span className="truncate">By {blog.userName}</span>
                          </div>
                        </motion.div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Right Column (4 Cols): Quick Tasks & Sidebar Tools */}
          <motion.div variants={itemVariants} className="col-span-1 lg:col-span-4 space-y-6 w-full">
            {/* Quick Tasks Todo Component */}
            <SimpleTodo />

            {/* Ad Banner */}
            <GoogleAdBanner adSlot="1001" />
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}