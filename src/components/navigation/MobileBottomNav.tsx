"use client";

import React, { Suspense, useState, useRef } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { LayoutDashboard, BookOpen, Sparkles, Users, Menu } from "lucide-react";
import { useDashboardShell } from "@/components/layout/DashboardShellContext";

function MobileBottomNavContent({
  unreadMessagesCount = 0,
}: {
  userId?: string;
  unreadMessagesCount?: number;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);

  let toggleMobileNav: (() => void) | undefined;
  let isMobileNavOpen = false;
  try {
    const shell = useDashboardShell();
    toggleMobileNav = shell.toggleMobileNav;
    isMobileNavOpen = shell.isMobileNavOpen;
  } catch {
    // Fallback if rendered outside provider
  }

  // 5 High-Value Core Destinations (Dashboard, Notes, Learn, Community, Menu)
  const navItems = [
    {
      href: "/dashboard",
      icon: LayoutDashboard,
      label: "Home",
      isAction: false,
    },
    {
      href: "/notes",
      icon: BookOpen,
      label: "Notes",
      isAction: false,
    },
    {
      href: "/courses",
      icon: Sparkles,
      label: "Learn",
      isAction: false,
    },
    {
      href: "/community",
      icon: Users,
      label: "Community",
      isAction: false,
      badge: unreadMessagesCount > 0 ? unreadMessagesCount : undefined,
    },
    {
      href: "#menu",
      icon: Menu,
      label: "Menu",
      isAction: true,
    },
  ];

  // Hide on deep chat or message conversation views for maximum focus/keyboard space
  if (pathname.startsWith("/chat")) {
    return null;
  }

  if (
    pathname === "/messages" &&
    (searchParams.get("chat") === "open" ||
      searchParams.has("userId") ||
      searchParams.has("chat"))
  ) {
    return null;
  }

  const handleTouchStart = (label: string) => {
    longPressTimer.current = setTimeout(() => {
      setActiveTooltip(label);
      if (typeof window !== "undefined" && "vibrate" in navigator) {
        try {
          navigator.vibrate(20);
        } catch {
          // ignore if vibration blocked
        }
      }
    }, 200);
  };

  const handleTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }
    setTimeout(() => {
      setActiveTooltip(null);
    }, 1000);
  };

  return (
    <nav
      id="mobile-bottom-nav"
      aria-label="Mobile Navigation Bar"
      className="lg:hidden fixed inset-x-3 z-40 bg-bg-surface/95 backdrop-blur-xl border border-border-subtle h-14 rounded-2xl flex items-center justify-around px-2 shadow-[0_8px_32px_rgba(0,0,0,0.7)] selection:bg-none select-none max-w-lg mx-auto"
      style={{
        bottom: "max(0.625rem, calc(env(safe-area-inset-bottom, 0px) + 0.5rem))",
      }}
    >
      {navItems.map((item) => {
        const isActive = item.isAction
          ? isMobileNavOpen
          : pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href + "/"));
        const IconComponent = item.icon;
        const isTooltipOpen = activeTooltip === item.label;

        const content = (
          <>
            {/* Long-Press Tooltip */}
            <div
              aria-hidden="true"
              className={`absolute pointer-events-none z-50 bottom-[calc(100%+8px)] left-1/2 -translate-x-1/2
                bg-bg-surface border border-accent-primary/30 text-accent-primary
                px-2.5 py-1 rounded-full text-[10px] font-mono font-bold tracking-wider uppercase
                shadow-xl whitespace-nowrap flex items-center gap-1.5
                transition-[opacity,transform] duration-150 motion-reduce:transition-none
                ${isTooltipOpen ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1.5"}`}
            >
              <span>{item.label}</span>
              <div className="size-1.5 bg-accent-primary rounded-full animate-pulse" />
            </div>

            {/* Active Item Background Pill */}
            <span
              className={`absolute inset-x-1 inset-y-1.5 rounded-xl border transition-[opacity,background-color] duration-150 motion-reduce:transition-none
                ${isActive
                  ? "opacity-100 bg-bg-elevated border-border-default text-text-primary"
                  : "opacity-0 bg-transparent border-transparent"
                }`}
              aria-hidden="true"
            />

            {/* Icon Container */}
            <div className="relative flex items-center justify-center">
              <div
                className={`transition-[transform,color] duration-150 active:scale-90 motion-reduce:transition-none
                  ${isActive ? "scale-105" : "scale-100"}`}
              >
                <IconComponent
                  className={`size-5 transition-colors duration-150 ${
                    isActive
                      ? "text-accent-primary"
                      : "text-text-muted hover:text-text-primary"
                  }`}
                />
              </div>

              {/* Badge Indicator */}
              {item.badge !== undefined && (
                <span className="absolute -top-2 -right-2 bg-accent-primary text-bg-base text-[9px] font-extrabold flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full border border-bg-surface shadow-md">
                  {item.badge}
                </span>
              )}
            </div>
          </>
        );

        if (item.isAction) {
          return (
            <div key={item.label} className="relative flex-1 h-full flex items-center justify-center">
              <button
                type="button"
                onClick={() => {
                  if (toggleMobileNav) toggleMobileNav();
                }}
                onTouchStart={() => handleTouchStart(item.label)}
                onTouchEnd={handleTouchEnd}
                onTouchCancel={handleTouchEnd}
                className="relative w-full h-full flex items-center justify-center outline-none cursor-pointer"
                aria-label="Open full menu"
                aria-expanded={isMobileNavOpen}
              >
                {content}
              </button>
            </div>
          );
        }

        return (
          <div key={item.href} className="relative flex-1 h-full flex items-center justify-center">
            <Link
              href={item.href}
              onTouchStart={() => handleTouchStart(item.label)}
              onTouchEnd={handleTouchEnd}
              onTouchCancel={handleTouchEnd}
              onMouseEnter={() => setActiveTooltip(item.label)}
              onMouseLeave={() => setActiveTooltip(null)}
              className="relative w-full h-full flex items-center justify-center outline-none"
              aria-label={item.label}
              aria-current={isActive ? "page" : undefined}
            >
              {content}
            </Link>
          </div>
        );
      })}
    </nav>
  );
}

export function MobileBottomNav(props: {
  userId?: string;
  unreadMessagesCount?: number;
}) {
  return (
    <Suspense fallback={null}>
      <MobileBottomNavContent {...props} />
    </Suspense>
  );
}
