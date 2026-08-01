"use client";

import React, { Suspense, useState, useRef } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { HomeIcon, LayoutDashboard, Users, Send, Trophy, User as UserIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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
  
  if (pathname === "/messages" && (searchParams.get("chat") === "open" || searchParams.has("userId") || searchParams.has("chat"))) {
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
      className="lg:hidden fixed bottom-3 left-3 right-3 z-40 bg-[#080E0B]/90 backdrop-blur-2xl border border-[#F0C93B]/25 h-14 rounded-2xl flex items-center justify-around px-2 shadow-[0_12px_40px_rgba(0,0,0,0.6)] selection:bg-none select-none"
    >
      {navItems.map((item) => {
        const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href + "/"));
        const IconComponent = item.icon;
        const isTooltipOpen = activeTooltip === item.label;

        return (
          <div key={item.href} className="relative flex-1 h-full flex items-center justify-center">
            {/* Long-Press Tooltip Floating Badge */}
            <AnimatePresence>
              {isTooltipOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 6, scale: 0.85 }}
                  animate={{ opacity: 1, y: -42, scale: 1 }}
                  exit={{ opacity: 0, y: -34, scale: 0.9 }}
                  transition={{ type: "spring", stiffness: 450, damping: 25 }}
                  className="absolute pointer-events-none z-50 bg-[#0E1B13] border border-[#F0C93B]/40 text-[#F0C93B] px-3 py-1 rounded-full text-[10px] font-mono font-bold tracking-wider uppercase shadow-[0_4px_20px_rgba(0,0,0,0.5)] whitespace-nowrap flex items-center gap-1.5"
                >
                  <span>{item.label}</span>
                  <div className="w-1.5 h-1.5 bg-[#F0C93B] rounded-full animate-pulse" />
                </motion.div>
              )}
            </AnimatePresence>

            <Link
              href={item.href}
              onTouchStart={() => handleTouchStart(item.label)}
              onTouchEnd={handleTouchEnd}
              onTouchCancel={handleTouchEnd}
              onMouseEnter={() => setActiveTooltip(item.label)}
              onMouseLeave={() => setActiveTooltip(null)}
              className="relative w-full h-full flex items-center justify-center"
            >
              {/* Active Item Background Pill */}
              {isActive && (
                <motion.div
                  layoutId="mobile-nav-active-pill"
                  className="absolute inset-x-1 inset-y-1.5 bg-[#F0C93B]/15 border border-[#F0C93B]/40 rounded-xl"
                  transition={{ type: "spring", stiffness: 420, damping: 28 }}
                />
              )}

              {/* Icon Container */}
              <div className="relative flex items-center justify-center">
                <motion.div
                  whileTap={{ scale: 0.75 }}
                  animate={{
                    scale: isActive ? 1.15 : 1,
                    y: isActive ? -1 : 0,
                  }}
                  transition={{ type: "spring", stiffness: 450, damping: 24 }}
                >
                  <IconComponent
                    className={`h-5 w-5 transition-colors duration-200 ${
                      isActive ? "text-[#F0C93B] drop-shadow-[0_0_8px_rgba(240,201,59,0.5)]" : "text-[#9FAEA1] hover:text-[#F3F0E4]"
                    }`}
                  />
                </motion.div>

                {/* Badge Indicator */}
                {item.badge !== undefined && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-2 -right-2 bg-[#F28B6E] text-[#16261D] text-[9px] font-black flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full border border-[#080E0B] shadow-md"
                  >
                    {item.badge}
                  </motion.span>
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
