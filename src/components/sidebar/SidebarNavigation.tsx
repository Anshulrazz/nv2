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
  Shield,
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
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between min-h-[36px] px-3 py-1.5 rounded-xl text-left hover:bg-bg-surface transition-colors duration-150 group cursor-pointer outline-none focus-visible:ring-1 focus-visible:ring-accent-primary"
        aria-expanded={expanded}
      >
        <div className="flex items-center gap-2.5">
          <span className={`transition-opacity duration-150 ${expanded ? "opacity-100" : "opacity-60"}`}>
            {icon}
          </span>
          <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-text-muted group-hover:text-text-primary transition-colors">
            {label}
          </span>
        </div>
        <ChevronDown
          className={`size-3 text-text-muted group-hover:text-text-primary transition-transform duration-150 motion-reduce:transition-none ${
            expanded ? "rotate-0" : "-rotate-90"
          }`}
        />
      </button>

      {/* Controlled collapsible panel */}
      <div
        className={`grid transition-[grid-template-rows] duration-150 ease-out motion-reduce:transition-none ${
          expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
      >
        <div className="overflow-hidden">
          <div className="pl-2 space-y-1 border-l border-border-subtle ml-4 pb-1 pt-0.5">
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
  // Sensible defaults: Workspace and Learning open, Secondary collapsible
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    workspace: true,
    aiTools: true,
    community: false,
    growth: false,
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
        icon={<FolderOpen className="size-3.5 text-accent-primary" />}
        expanded={expanded.workspace}
        onToggle={() => toggleGroup("workspace")}
      >
        <NavLink href="/dashboard" icon={<LayoutDashboard className="size-4" />} label="Dashboard" />
        <NavLink href="/notes" icon={<BookOpen className="size-4" />} label="Notes" />
        <NavLink href="/projects" icon={<Briefcase className="size-4" />} label="Projects" />
        <NavLink
          href="/messages"
          icon={<MessageCircle className="size-4" />}
          label="Messages"
          badge={unreadMessagesCount > 0 ? unreadMessagesCount : undefined}
        />
        <NavLink href="/wallet" icon={<Wallet className="size-4" />} label="Wallet" />
      </NavGroup>

      {/* ── GROUP 2: LEARNING & AI TOOLS ── */}
      <NavGroup
        label="Learning & AI"
        icon={<Sparkles className="size-3.5 text-accent-secondary" />}
        expanded={expanded.aiTools}
        onToggle={() => toggleGroup("aiTools")}
      >
        <NavLink href="/courses" icon={<Presentation className="size-4" />} label="Courses" />
        <NavLink href="/revision" icon={<Sparkles className="size-4" />} label="Smart Revision" />
        <NavLink href="/planner" icon={<Calendar className="size-4" />} label="AI Daily Planner" />
        <NavLink href="/youtube-summarizer" icon={<Play className="size-4" />} label="YouTube Summarizer" />
        <NavLink href="/ppt" icon={<Monitor className="size-4" />} label="AI PPT Maker" />
      </NavGroup>

      {/* ── GROUP 3: COMMUNITY & SOCIAL ── */}
      <NavGroup
        label="Community"
        icon={<Users className="size-3.5 text-accent-primary" />}
        expanded={expanded.community}
        onToggle={() => toggleGroup("community")}
      >
        <NavLink href="/feed" icon={<Rss className="size-4" />} label="Public Feed" />
        <NavLink href="/community" icon={<Users className="size-4" />} label="Community Hub" />
        <NavLink href="/doubts" icon={<HelpCircle className="size-4" />} label="Doubts" />
        <NavLink href="/forums" icon={<MessageSquare className="size-4" />} label="Forums" />
        <NavLink href="/events" icon={<Flag className="size-4" />} label="Events" />
        <NavLink href="/blogs" icon={<Newspaper className="size-4" />} label="Blogs" />
      </NavGroup>

      {/* ── GROUP 4: SCHOLARS & SETTINGS ── */}
      <NavGroup
        label="Growth & Settings"
        icon={<GraduationCap className="size-3.5 text-accent-gold-light" />}
        expanded={expanded.growth}
        onToggle={() => toggleGroup("growth")}
      >
        <NavLink href="/research" icon={<GraduationCap className="size-4" />} label="Research" />
        <NavLink href="/bookmarks" icon={<Bookmark className="size-4" />} label="Bookmarks" />
        <NavLink href="/leaderboard" icon={<Trophy className="size-4" />} label="Leaderboard" />
        <NavLink href="/referrals" icon={<Gift className="size-4" />} label="Referrals" />
        <NavLink href="/settings" icon={<Settings className="size-4" />} label="Settings" />

        {(userRole === "teacher" || userRole === "admin") && (
          <NavLink href="/teacher/courses" icon={<Presentation className="size-4" />} label="Teacher Dashboard" />
        )}
        {(userRole === "teacher" || userRole === "admin") && (
          <NavLink href="/host/events" icon={<Flag className="size-4" />} label="Host Events" />
        )}
        {userRole === "admin" && (
          <NavLink href="/admin" icon={<Shield className="size-4" />} label="Admin Panel" />
        )}
      </NavGroup>
    </div>
  );
}
