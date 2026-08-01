"use client";

import React, { useState } from "react";
import { NavLink } from "./NavLink";
import {
  LayoutDashboard,
  MessageCircle,
  BookOpen,
  Briefcase,
  Sparkles,
  Play,
  Calendar,
  Rss,
  Users,
  Newspaper,
  HelpCircle,
  MessageSquare,
  GraduationCap,
  Bookmark,
  Trophy,
  Presentation,
  Gift,
  Settings,
  ChevronDown,
  ChevronRight,
  FolderOpen,
  Wallet,
} from "lucide-react";

interface SidebarNavigationProps {
  userId: string;
  userRole?: string;
  unreadMessagesCount: number;
}

export function SidebarNavigation({
  userRole,
  unreadMessagesCount,
}: SidebarNavigationProps) {
  // All groups expanded by default for instant navigation
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    workspace: true,
    aiTools: true,
    social: true,
    academics: true,
  });

  const toggleGroup = (group: string) => {
    setExpanded((prev) => ({
      ...prev,
      [group]: !prev[group],
    }));
  };

  return (
    <div className="space-y-4 select-none">
      {/* ── GROUP 1: WORKSPACE ── */}
      <div className="space-y-1">
        <button
          onClick={() => toggleGroup("workspace")}
          className="w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-left hover:bg-white/5 transition-colors group cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <FolderOpen className={`size-3.5 text-cyan-400 transition-transform duration-200 ${expanded.workspace ? "scale-100" : "scale-90 opacity-60"}`} />
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-zinc-400 group-hover:text-white transition-colors">
              Workspace
            </span>
          </div>
          {expanded.workspace ? (
            <ChevronDown className="size-3 text-zinc-500 group-hover:text-zinc-300" />
          ) : (
            <ChevronRight className="size-3 text-zinc-500 group-hover:text-zinc-300" />
          )}
        </button>

        {expanded.workspace && (
          <div className="pl-2.5 space-y-0.5 border-l border-white/5 ml-4 animate-in fade-in slide-in-from-top-1 duration-200">
            <NavLink href="/dashboard" icon={<LayoutDashboard className="size-4" />} label="Dashboard" accent="cyan" />
            <NavLink
              href="/messages"
              icon={<MessageCircle className="size-4" />}
              label="Messages"
              accent="cyan"
              badge={unreadMessagesCount > 0 ? unreadMessagesCount : undefined}
            />
            <NavLink href="/notes" icon={<BookOpen className="size-4" />} label="Notes" accent="cyan" />
            <NavLink href="/projects" icon={<Briefcase className="size-4" />} label="Projects" accent="cyan" />
            <NavLink href="/wallet" icon={<Wallet className="size-4" />} label="Wallet" accent="amber" />
          </div>
        )}
      </div>

      {/* ── GROUP 2: AI STUDY TOOLS ── */}
      <div className="space-y-1">
        <button
          onClick={() => toggleGroup("aiTools")}
          className="w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-left hover:bg-white/5 transition-colors group cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Sparkles className={`size-3.5 text-violet-400 transition-transform duration-200 ${expanded.aiTools ? "scale-100" : "scale-90 opacity-60"}`} />
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-zinc-400 group-hover:text-white transition-colors">
              AI Tools
            </span>
          </div>
          {expanded.aiTools ? (
            <ChevronDown className="size-3 text-zinc-500 group-hover:text-zinc-300" />
          ) : (
            <ChevronRight className="size-3 text-zinc-500 group-hover:text-zinc-300" />
          )}
        </button>

        {expanded.aiTools && (
          <div className="pl-2.5 space-y-0.5 border-l border-white/5 ml-4 animate-in fade-in slide-in-from-top-1 duration-200">
            <NavLink href="/revision" icon={<Sparkles className="size-4" />} label="Smart Revision" accent="violet" />
            <NavLink href="/youtube-summarizer" icon={<Play className="size-4" />} label="YouTube Summarizer" accent="violet" />
            <NavLink href="/youtube" icon={<Play className="size-4" />} label="YouTube Learning" accent="violet" />
            <NavLink href="/planner" icon={<Calendar className="size-4" />} label="AI Daily Planner" accent="violet" />
          </div>
        )}
      </div>

      {/* ── GROUP 3: COMMUNITY & SOCIAL ── */}
      <div className="space-y-1">
        <button
          onClick={() => toggleGroup("social")}
          className="w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-left hover:bg-white/5 transition-colors group cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Users className={`size-3.5 text-cyan-400 transition-transform duration-200 ${expanded.social ? "scale-100" : "scale-90 opacity-60"}`} />
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-zinc-400 group-hover:text-white transition-colors">
              Community &amp; Feed
            </span>
          </div>
          {expanded.social ? (
            <ChevronDown className="size-3 text-zinc-500 group-hover:text-zinc-300" />
          ) : (
            <ChevronRight className="size-3 text-zinc-500 group-hover:text-zinc-300" />
          )}
        </button>

        {expanded.social && (
          <div className="pl-2.5 space-y-0.5 border-l border-white/5 ml-4 animate-in fade-in slide-in-from-top-1 duration-200">
            <NavLink href="/feed" icon={<Rss className="size-4" />} label="Public Feed" accent="violet" />
            <NavLink href="/community" icon={<Users className="size-4" />} label="Community" accent="cyan" />
            <NavLink href="/blogs" icon={<Newspaper className="size-4" />} label="Blogs" accent="violet" />
            <NavLink href="/doubts" icon={<HelpCircle className="size-4" />} label="Doubts" accent="cyan" />
            <NavLink href="/forums" icon={<MessageSquare className="size-4" />} label="Forums" accent="violet" />
          </div>
        )}
      </div>

      {/* ── GROUP 4: ACADEMICS & SETTINGS ── */}
      <div className="space-y-1">
        <button
          onClick={() => toggleGroup("academics")}
          className="w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-left hover:bg-white/5 transition-colors group cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <GraduationCap className={`size-3.5 text-amber-400 transition-transform duration-200 ${expanded.academics ? "scale-100" : "scale-90 opacity-60"}`} />
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-zinc-400 group-hover:text-white transition-colors">
              Growth &amp; Settings
            </span>
          </div>
          {expanded.academics ? (
            <ChevronDown className="size-3 text-zinc-500 group-hover:text-zinc-300" />
          ) : (
            <ChevronRight className="size-3 text-zinc-500 group-hover:text-zinc-300" />
          )}
        </button>

        {expanded.academics && (
          <div className="pl-2.5 space-y-0.5 border-l border-white/5 ml-4 animate-in fade-in slide-in-from-top-1 duration-200">
            <NavLink href="/research" icon={<GraduationCap className="size-4" />} label="Research" accent="violet" />
            <NavLink href="/bookmarks" icon={<Bookmark className="size-4" />} label="Bookmarks" accent="amber" />
            <NavLink href="/leaderboard" icon={<Trophy className="size-4" />} label="Leaderboard" accent="yellow" />
            <NavLink href="/courses" icon={<Presentation className="size-4" />} label="Courses" accent="violet" />
            <NavLink href="/referrals" icon={<Gift className="size-4" />} label="Referrals" accent="yellow" />
            <NavLink href="/settings" icon={<Settings className="size-4" />} label="Settings" accent="cyan" />
            
            {(userRole === "teacher" || userRole === "admin") && (
              <NavLink href="/teacher/courses" icon={<Presentation className="size-4" />} label="Teacher Dashboard" accent="yellow" />
            )}
            {userRole === "admin" && (
              <NavLink href="/admin" icon={<Settings className="size-4" />} label="Admin Panel" accent="red" />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
