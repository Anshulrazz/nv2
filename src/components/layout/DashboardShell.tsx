"use client";

import React from "react";
import Link from "next/link";
import { useDashboardShell } from "@/components/layout/DashboardShellContext";
import { NotexiaLogo } from "@/components/common/NotexiaLogo";
import { MobileNavToggle } from "@/components/layout/MobileNavControls";
import { SidebarNavigation } from "@/components/sidebar/SidebarNavigation";
import { SidebarTree } from "@/components/sidebar/SidebarTree";
import { UserNavMenu } from "@/components/sidebar/UserNavMenu";
import { Bell, Coins, MessageSquare } from "lucide-react";

interface DashboardShellProps {
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role?: string;
  };
  unreadCount: number;
  unreadMessagesCount: number;
  coins: number;
  onSignOut: () => Promise<void>;
  children: React.ReactNode;
}

export function DashboardShell({
  user,
  unreadCount,
  unreadMessagesCount,
  coins,
  onSignOut,
  children,
}: DashboardShellProps) {
  const { isMobileNavOpen } = useDashboardShell();

  return (
    <div className="relative h-[100dvh] w-full bg-bg-base text-foreground flex overflow-hidden">
      {/* ── Ambient warm lighting (subtle 3-orb, no heavy neon blurs) ── */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden="true">
        <div className="ambient-glow-orb-1 opacity-20" />
        <div className="ambient-glow-orb-2 opacity-15" />
        <div className="ambient-glow-orb-3 opacity-15" />
      </div>

      {/* ── Mobile backdrop (clicking it closes the sidebar) ── */}
      <div
        className={`fixed inset-0 bg-black/70 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-200 ${
          isMobileNavOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
        aria-hidden="true"
      />

      {/* ── Sidebar (Desktop: 256px pinned; Mobile: 280px drawer) ── */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50
          w-72 sm:w-64
          flex flex-col
          border-r border-border-subtle bg-bg-surface shadow-[0_20px_50px_rgba(0,0,0,0.6)]
          select-none
          transition-transform duration-200 ease-out motion-reduce:transition-none
          ${isMobileNavOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0 lg:fixed lg:inset-y-0 lg:left-0 lg:h-full lg:w-64 lg:shrink-0 lg:z-30
        `}
      >
        {/* Brand header */}
        <div className="h-16 px-4 border-b border-border-subtle flex items-center justify-between shrink-0">
          <Link
            href="/dashboard"
            className="flex items-center hover:opacity-90 transition-opacity outline-none focus-visible:ring-1 focus-visible:ring-accent-primary rounded-lg p-1"
          >
            <NotexiaLogo size="sm" />
          </Link>

          <div className="flex items-center gap-2">
            <span className="text-[9px] bg-accent-primary/10 text-accent-primary px-2 py-0.5 rounded border border-accent-primary/20 font-bold uppercase tracking-wider font-mono">
              MVP
            </span>

            {/* Desktop Notification Bell */}
            <Link
              href="/notifications"
              className="hidden lg:flex relative items-center justify-center size-8 rounded-lg hover:bg-bg-elevated text-text-muted hover:text-accent-primary border border-transparent hover:border-border-subtle transition-colors group outline-none focus-visible:ring-1 focus-visible:ring-accent-primary"
              aria-label={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ""}`}
            >
              <Bell className="size-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 h-4 min-w-[16px] px-1 bg-destructive text-text-primary text-[9px] font-extrabold flex items-center justify-center rounded-full border border-bg-surface shadow-sm">
                  {unreadCount}
                </span>
              )}
            </Link>

            {/* Close button – mobile only */}
            <div className="lg:hidden">
              <MobileNavToggle variant="close" />
            </div>
          </div>
        </div>

        {/* Scrollable navigation body: only this part scrolls */}
        <div className="flex-1 min-h-0 overflow-y-auto custom-scroll p-4 space-y-4">
          <nav aria-label="Main Navigation">
            <SidebarNavigation
              userId={user.id}
              userRole={user.role}
              unreadMessagesCount={unreadMessagesCount}
            />
          </nav>

          <div className="h-px bg-border-subtle w-full my-2" />

          {/* Folder & Notes Tree */}
          <SidebarTree />
        </div>

        {/* Pinned user account area at bottom */}
        <div className="p-3 border-t border-border-subtle bg-bg-surface/90 backdrop-blur-md shrink-0">
          <UserNavMenu user={user} coins={coins} onSignOut={onSignOut} />
        </div>
      </aside>

      {/* ── Main Content Area ── */}
      <div className="flex-1 flex flex-col min-w-0 h-full w-full overflow-hidden relative z-10 lg:pl-64">
        {/* Top Header – Mobile visible */}
        <header className="lg:hidden sticky top-0 z-30 h-14 flex items-center justify-between px-4 border-b border-border-subtle bg-bg-surface/90 backdrop-blur-md shrink-0">
          <div className="flex items-center gap-2.5">
            <MobileNavToggle variant="open" />
            <Link href="/dashboard" className="flex items-center gap-2">
              <span className="text-xs sm:text-sm font-bold tracking-widest text-text-primary font-display">
                NOTEXIA
              </span>
            </Link>
          </div>

          <div className="flex items-center gap-2">
            {/* Mobile Coins Indicator */}
            <Link
              href={`/user/${user.id}`}
              className="flex items-center gap-1.5 bg-bg-elevated border border-accent-primary/25 rounded-full pl-2.5 pr-1 py-0.5 text-xs font-mono hover:border-accent-primary/50 transition-colors"
            >
              <Coins className="size-3.5 text-accent-primary" />
              <span className="text-accent-primary font-bold text-[11px]">
                {coins.toLocaleString()}
              </span>
              <span className="size-5 rounded-full bg-accent-primary text-bg-base font-bold flex items-center justify-center text-[10px] shrink-0 font-display">
                +
              </span>
            </Link>

            {/* Mobile Messages Trigger with Unread Counter */}
            <Link
              href="/messages"
              className="relative p-2 rounded-xl bg-bg-surface border border-border-subtle hover:bg-bg-elevated text-text-muted hover:text-accent-primary transition-colors group outline-none focus-visible:ring-1 focus-visible:ring-accent-primary"
              aria-label={`Messages ${unreadMessagesCount > 0 ? `(${unreadMessagesCount} unread)` : ""}`}
            >
              <MessageSquare className="size-4" />
              {unreadMessagesCount > 0 && (
                <span className="absolute -top-1 -right-1 h-3.5 min-w-[14px] px-1 bg-accent-primary text-bg-base text-[8px] font-extrabold flex items-center justify-center rounded-full border border-bg-surface shadow-sm font-mono leading-none">
                  {unreadMessagesCount > 99 ? "99+" : unreadMessagesCount}
                </span>
              )}
            </Link>

            {/* Mobile Notification Trigger */}
            <Link
              href="/notifications"
              className="relative p-2 rounded-xl bg-bg-surface border border-border-subtle hover:bg-bg-elevated text-text-muted hover:text-accent-primary transition-colors group"
              aria-label={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ""}`}
            >
              <Bell className="size-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 h-3.5 min-w-[14px] px-1 bg-destructive text-text-primary text-[8px] font-extrabold flex items-center justify-center rounded-full border border-bg-surface">
                  {unreadCount}
                </span>
              )}
            </Link>
          </div>
        </header>

        {/* Main scrollable view */}
        <main
          className="flex-1 flex flex-col h-full w-full overflow-y-auto bg-transparent custom-scroll pb-[max(4.5rem,calc(env(safe-area-inset-bottom)+3.5rem))] lg:pb-0 [&:has(.notes-page-root)]:pb-0 [&:has(.notes-page-root)]:overflow-hidden [&:has(.messages-page-root)]:pb-0 [&:has(.messages-page-root)]:overflow-hidden"
        >
          {children}
        </main>
      </div>
    </div>
  );
}
