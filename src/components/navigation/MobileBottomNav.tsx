"use client";

import React, { Suspense, useState, useRef } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { HomeIcon, LayoutDashboard, Users, Send, Trophy, User as UserIcon } from "lucide-react";

function MobileBottomNavContent({
  userId,
  unreadMessagesCount = 0,
}: {
  userId?: string;
  unreadMessagesCount?: number;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);

  const navItems = [
    {
      href: "/feed",
      icon: HomeIcon,
      label: "Home",
    },
    {
      href: "/dashboard",
      icon: LayoutDashboard,
      label: "Dashboard",
    },
    {
      href: "/community",
      icon: Users,
      label: "Community",
    },
    {
      href: "/messages",
      icon: Send,
      label: "Messages",
      badge: unreadMessagesCount > 0 ? unreadMessagesCount : undefined,
    },
    {
      href: "/leaderboard",
      icon: Trophy,
      label: "Leaderboard",
    },
    {
      href: userId ? `/user/${userId}` : "/login",
      icon: UserIcon,
      label: "Profile",
    },
  ];

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
    <div
      id="mobile-bottom-nav"
      className="lg:hidden fixed bottom-3 left-3 right-3 z-40 bg-[#080E0B]/90 backdrop-blur-xl border border-[#F0C93B]/25 h-14 rounded-2xl flex items-center justify-around px-2 shadow-[0_12px_40px_rgba(0,0,0,0.6)] selection:bg-none select-none"
    >
      {navItems.map((item) => {
        const isActive =
          pathname === item.href ||
          (item.href !== "/" && pathname.startsWith(item.href + "/"));
        const IconComponent = item.icon;
        const isTooltipOpen = activeTooltip === item.label;

        return (
          <div key={item.href} className="relative flex-1 h-full flex items-center justify-center">
            {/* Long-Press Tooltip — CSS-only */}
            <div
              aria-hidden="true"
              className={`absolute pointer-events-none z-50 bottom-[calc(100%+8px)] left-1/2 -translate-x-1/2
                bg-[#0E1B13] border border-[#F0C93B]/40 text-[#F0C93B]
                px-3 py-1 rounded-full text-[10px] font-mono font-bold tracking-wider uppercase
                shadow-[0_4px_20px_rgba(0,0,0,0.5)] whitespace-nowrap flex items-center gap-1.5
                transition-[opacity,transform] duration-150
                ${isTooltipOpen ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1.5"}`}
            >
              <span>{item.label}</span>
              <div className="w-1.5 h-1.5 bg-[#F0C93B] rounded-full animate-pulse" />
            </div>

            <Link
              href={item.href}
              onTouchStart={() => handleTouchStart(item.label)}
              onTouchEnd={handleTouchEnd}
              onTouchCancel={handleTouchEnd}
              onMouseEnter={() => setActiveTooltip(item.label)}
              onMouseLeave={() => setActiveTooltip(null)}
              className="relative w-full h-full flex items-center justify-center"
              aria-label={item.label}
            >
              {/* Active Item Background Pill — CSS-only, no framer-motion */}
              <span
                className={`absolute inset-x-1 inset-y-1.5 rounded-xl border transition-[opacity,background-color] duration-150
                  ${isActive
                    ? "opacity-100 bg-[#F0C93B]/15 border-[#F0C93B]/40"
                    : "opacity-0 bg-transparent border-transparent"
                  }`}
                aria-hidden="true"
              />

              {/* Icon Container */}
              <div className="relative flex items-center justify-center">
                <div
                  className={`transition-[transform,color] duration-150 active:scale-75
                    ${isActive ? "scale-[1.15] -translate-y-px" : "scale-100 translate-y-0"}`}
                >
                  <IconComponent
                    className={`h-5 w-5 transition-colors duration-150 ${
                      isActive
                        ? "text-[#F0C93B] drop-shadow-[0_0_8px_rgba(240,201,59,0.5)]"
                        : "text-[#9FAEA1] hover:text-[#F3F0E4]"
                    }`}
                  />
                </div>

                {/* Badge Indicator */}
                {item.badge !== undefined && (
                  <span className="absolute -top-2 -right-2 bg-[#F28B6E] text-[#16261D] text-[9px] font-black flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full border border-[#080E0B] shadow-md">
                    {item.badge}
                  </span>
                )}
              </div>
            </Link>
          </div>
        );
      })}
    </div>
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
