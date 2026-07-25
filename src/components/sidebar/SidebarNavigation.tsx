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
  FolderClosed,
} from "lucide-react";

interface SidebarNavigationProps {
  userId: string;
  userRole?: string;
  unreadMessagesCount: number;
}

export function SidebarNavigation({
  userId,
  userRole,
  unreadMessagesCount,
}: SidebarNavigationProps) {
  // Manage expand/collapse state per group
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    workspace: true,
    aiTools: true,
    social: false,
    academics: false,
  });

  const toggleGroup = (group: string) => {
    setExpanded((prev) => ({
      ...prev,
      [group]: !prev[group],
    }));
  };

  return (
    <div className="space-y-4">
      {/* ── GROUP 1: WORKSPACE ── */}
      <div className="space-y-1">
        <button
          onClick={() => toggleGroup("workspace")}
          className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-left hover:bg-neutral-850 transition-colors select-none group cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <FolderOpen className={`h-3.5 w-3.5 text-cyan-400/80 transition-transform ${expanded.workspace ? "scale-100" : "scale-90 opacity-70"}`} />
            <span className="text-[10px] font-extrabold font-space uppercase tracking-wider text-neutral-450 group-hover:text-neutral-200 transition-colors">
              Workspace
            </span>
          </div>
          {expanded.workspace ? (
            <ChevronDown className="h-3 w-3 text-neutral-600 group-hover:text-neutral-450" />
          ) : (
            <ChevronRight className="h-3 w-3 text-neutral-600 group-hover:text-neutral-450" />
          )}
        </button>

        {expanded.workspace && (
          <div className="pl-2.5 space-y-0.5 border-l border-neutral-900 ml-4 animate-in fade-in slide-in-from-top-1 duration-200">
            <NavLink href="/dashboard" icon={<LayoutDashboard className="h-4 w-4" />} label="Dashboard" accent="cyan" />
            <NavLink
              href="/messages"
              icon={<MessageCircle className="h-4 w-4" />}
              label="Messages"
              accent="cyan"
              badge={unreadMessagesCount > 0 ? unreadMessagesCount : undefined}
            />
            <NavLink href="/notes" icon={<BookOpen className="h-4 w-4" />} label="Notes" accent="cyan" />
            <NavLink href="/projects" icon={<Briefcase className="h-4 w-4" />} label="Projects" accent="cyan" />
          </div>
        )}
      </div>

      {/* ── GROUP 2: AI STUDY TOOLS ── */}
      <div className="space-y-1">
        <button
          onClick={() => toggleGroup("aiTools")}
          className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-left hover:bg-neutral-855 transition-colors select-none group cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Sparkles className={`h-3.5 w-3.5 text-violet-400/80 transition-transform ${expanded.aiTools ? "scale-100" : "scale-90 opacity-70"}`} />
            <span className="text-[10px] font-extrabold font-space uppercase tracking-wider text-neutral-450 group-hover:text-neutral-200 transition-colors">
              AI Tools
            </span>
          </div>
          {expanded.aiTools ? (
            <ChevronDown className="h-3 w-3 text-neutral-600 group-hover:text-neutral-450" />
          ) : (
            <ChevronRight className="h-3 w-3 text-neutral-600 group-hover:text-neutral-450" />
          )}
        </button>

        {expanded.aiTools && (
          <div className="pl-2.5 space-y-0.5 border-l border-neutral-900 ml-4 animate-in fade-in slide-in-from-top-1 duration-200">
            <NavLink href="/revision" icon={<Sparkles className="h-4 w-4" />} label="Smart Revision" accent="violet" />
            <NavLink href="/youtube" icon={<Play className="h-4 w-4" />} label="YouTube Learning" accent="violet" />
            <NavLink href="/planner" icon={<Calendar className="h-4 w-4" />} label="AI Daily Planner" accent="violet" />
          </div>
        )}
      </div>

      {/* ── GROUP 3: COMMUNITY & SOCIAL ── */}
      <div className="space-y-1">
        <button
          onClick={() => toggleGroup("social")}
          className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-left hover:bg-neutral-855 transition-colors select-none group cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Users className={`h-3.5 w-3.5 text-cyan-500/70 transition-transform ${expanded.social ? "scale-100" : "scale-90 opacity-70"}`} />
            <span className="text-[10px] font-extrabold font-space uppercase tracking-wider text-neutral-450 group-hover:text-neutral-200 transition-colors">
              Community & Feed
            </span>
          </div>
          {expanded.social ? (
            <ChevronDown className="h-3 w-3 text-neutral-600 group-hover:text-neutral-450" />
          ) : (
            <ChevronRight className="h-3 w-3 text-neutral-600 group-hover:text-neutral-450" />
          )}
        </button>

        {expanded.social && (
          <div className="pl-2.5 space-y-0.5 border-l border-neutral-900 ml-4 animate-in fade-in slide-in-from-top-1 duration-200">
            <NavLink href="/feed" icon={<Rss className="h-4 w-4" />} label="Public Feed" accent="violet" />
            <NavLink href="/community" icon={<Users className="h-4 w-4" />} label="Community" accent="cyan" />
            <NavLink href="/blogs" icon={<Newspaper className="h-4 w-4" />} label="Blogs" accent="violet" />
            <NavLink href="/doubts" icon={<HelpCircle className="h-4 w-4" />} label="Doubts" accent="cyan" />
            <NavLink href="/forums" icon={<MessageSquare className="h-4 w-4" />} label="Forums" accent="violet" />
          </div>
        )}
      </div>

      {/* ── GROUP 4: ACADEMICS & SETTINGS ── */}
      <div className="space-y-1">
        <button
          onClick={() => toggleGroup("academics")}
          className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-left hover:bg-neutral-855 transition-colors select-none group cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <GraduationCap className={`h-3.5 w-3.5 text-amber-500/70 transition-transform ${expanded.academics ? "scale-100" : "scale-90 opacity-70"}`} />
            <span className="text-[10px] font-extrabold font-space uppercase tracking-wider text-neutral-450 group-hover:text-neutral-200 transition-colors">
              Growth & Settings
            </span>
          </div>
          {expanded.academics ? (
            <ChevronDown className="h-3 w-3 text-neutral-600 group-hover:text-neutral-450" />
          ) : (
            <ChevronRight className="h-3 w-3 text-neutral-600 group-hover:text-neutral-450" />
          )}
        </button>

        {expanded.academics && (
          <div className="pl-2.5 space-y-0.5 border-l border-neutral-900 ml-4 animate-in fade-in slide-in-from-top-1 duration-200">
            <NavLink href="/research" icon={<GraduationCap className="h-4 w-4" />} label="Research" accent="violet" />
            <NavLink href="/bookmarks" icon={<Bookmark className="h-4 w-4" />} label="Bookmarks" accent="amber" />
            <NavLink href="/leaderboard" icon={<Trophy className="h-4 w-4" />} label="Leaderboard" accent="yellow" />
            <NavLink href="/courses" icon={<Presentation className="h-4 w-4" />} label="Courses" accent="violet" />
            <NavLink href="/referrals" icon={<Gift className="h-4 w-4" />} label="Referrals" accent="yellow" />
            <NavLink href="/settings" icon={<Settings className="h-4 w-4" />} label="Settings" accent="cyan" />
            
            {(userRole === "teacher" || userRole === "admin") && (
              <NavLink href="/teacher/courses" icon={<Presentation className="h-4 w-4" />} label="Teacher Dashboard" accent="yellow" />
            )}
            {userRole === "admin" && (
              <NavLink href="/admin" icon={<Settings className="h-4 w-4" />} label="Admin Panel" accent="red" />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
