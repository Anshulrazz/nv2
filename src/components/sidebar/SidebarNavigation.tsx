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
  FolderOpen,
  Wallet,
  Flag,
  Monitor,
} from "lucide-react";

interface SidebarNavigationProps {
  userId: string;
  userRole?: string;
  unreadMessagesCount: number;
}

interface NavGroupProps {
  label: string;
  icon: React.ReactNode;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

function NavGroup({ label, icon, expanded, onToggle, children }: NavGroupProps) {
  return (
    <div className="space-y-1">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-left hover:bg-[#150F0B] transition-colors group cursor-pointer"
        aria-expanded={expanded}
      >
        <div className="flex items-center gap-2">
          <span className={`transition-opacity duration-150 ${expanded ? "opacity-100" : "opacity-60"}`}>
            {icon}
          </span>
          <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#8A8078] group-hover:text-[#FAFAF8] transition-colors">
            {label}
          </span>
        </div>
        <ChevronDown
          className={`size-3 text-[#8A8078] group-hover:text-[#FAFAF8] transition-transform duration-200 ${
            expanded ? "rotate-0" : "-rotate-90"
          }`}
        />
      </button>

      {/* CSS grid-based collapse — no JS layout thrash, smooth animation */}
      <div
        className={`grid transition-[grid-template-rows] duration-200 ease-in-out ${
          expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
      >
        <div className="overflow-hidden">
          <div className="pl-2.5 space-y-0.5 border-l border-[#2E2118] ml-4 pb-0.5">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
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
      <NavGroup
        label="Workspace"
        icon={<FolderOpen className="size-3.5 text-[#F5B429]" />}
        expanded={expanded.workspace}
        onToggle={() => toggleGroup("workspace")}
      >
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
      </NavGroup>

      {/* ── GROUP 2: AI STUDY TOOLS ── */}
      <NavGroup
        label="AI Tools"
        icon={<Sparkles className="size-3.5 text-[#F5941D]" />}
        expanded={expanded.aiTools}
        onToggle={() => toggleGroup("aiTools")}
      >
        <NavLink href="/revision" icon={<Sparkles className="size-4" />} label="Smart Revision" accent="violet" />
        <NavLink href="/youtube-summarizer" icon={<Play className="size-4" />} label="YouTube Summarizer" accent="violet" />
        <NavLink href="/planner" icon={<Calendar className="size-4" />} label="AI Daily Planner" accent="violet" />
        <NavLink href="/ppt" icon={<Monitor className="size-4" />} label="AI PPT Maker" accent="violet" />
      </NavGroup>

      {/* ── GROUP 3: COMMUNITY & SOCIAL ── */}
      <NavGroup
        label="Community & Feed"
        icon={<Users className="size-3.5 text-[#F5B429]" />}
        expanded={expanded.social}
        onToggle={() => toggleGroup("social")}
      >
        <NavLink href="/feed" icon={<Rss className="size-4" />} label="Public Feed" accent="violet" />
        <NavLink href="/community" icon={<Users className="size-4" />} label="Community" accent="cyan" />
        <NavLink href="/events" icon={<Flag className="size-4" />} label="Events" accent="amber" />
        <NavLink href="/blogs" icon={<Newspaper className="size-4" />} label="Blogs" accent="violet" />
        <NavLink href="/doubts" icon={<HelpCircle className="size-4" />} label="Doubts" accent="cyan" />
        <NavLink href="/forums" icon={<MessageSquare className="size-4" />} label="Forums" accent="violet" />
      </NavGroup>

      {/* ── GROUP 4: GROWTH & SETTINGS ── */}
      <NavGroup
        label="Growth & Settings"
        icon={<GraduationCap className="size-3.5 text-[#FCD34D]" />}
        expanded={expanded.academics}
        onToggle={() => toggleGroup("academics")}
      >
        <NavLink href="/research" icon={<GraduationCap className="size-4" />} label="Research" accent="violet" />
        <NavLink href="/bookmarks" icon={<Bookmark className="size-4" />} label="Bookmarks" accent="amber" />
        <NavLink href="/leaderboard" icon={<Trophy className="size-4" />} label="Leaderboard" accent="yellow" />
        <NavLink href="/courses" icon={<Presentation className="size-4" />} label="Courses" accent="violet" />
        <NavLink href="/referrals" icon={<Gift className="size-4" />} label="Referrals" accent="yellow" />
        <NavLink href="/settings" icon={<Settings className="size-4" />} label="Settings" accent="cyan" />

        {(userRole === "teacher" || userRole === "admin") && (
          <NavLink href="/teacher/courses" icon={<Presentation className="size-4" />} label="Teacher Dashboard" accent="yellow" />
        )}
        {(userRole === "teacher" || userRole === "admin") && (
          <NavLink href="/host/events" icon={<Trophy className="size-4" />} label="Host Events" accent="amber" />
        )}
        {userRole === "admin" && (
          <NavLink href="/admin" icon={<Settings className="size-4" />} label="Admin Panel" accent="red" />
        )}
      </NavGroup>
    </div>
  );
}
