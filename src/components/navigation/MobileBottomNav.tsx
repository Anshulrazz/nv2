"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { HomeIcon, Users, Send, Trophy, User as UserIcon } from "lucide-react";
import { motion } from "framer-motion";

export function MobileBottomNav({
  userId,
  unreadMessagesCount,
}: {
  userId: string;
  unreadMessagesCount: number;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const navItems = [
    {
      href: "/feed",
      icon: HomeIcon,
      label: "Home",
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
      href: `/user/${userId}`,
      icon: UserIcon,
      label: "Profile",
    },
  ];

  if (pathname.startsWith("/chat")) {
    return null;
  }
  
  if (pathname === "/messages" && (searchParams.get("chat") === "open" || searchParams.has("userId"))) {
    return null;
  }

  return (
    <div id="mobile-bottom-nav" className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-[#121F18]/90 backdrop-blur-2xl border-t border-[#F3F0E4]/15 h-16 flex items-center justify-around px-3 pb-safe shadow-[0_-10px_30px_rgba(0,0,0,0.4)]">
      {navItems.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
        const IconComponent = item.icon;
        
        return (
          <Link
            key={item.href}
            href={item.href}
            className="relative flex flex-col items-center justify-center w-full h-full space-y-1 group"
          >
            {isActive && (
              <motion.div
                layoutId="mobile-nav-active-pill"
                className="absolute inset-x-1 inset-y-1.5 bg-[#F0C93B]/15 border border-[#F0C93B]/30 rounded-xl -z-10"
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
              />
            )}
            
            <div className="relative">
              <motion.div
                whileTap={{ scale: 0.85 }}
                animate={{ scale: isActive ? 1.1 : 1 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
              >
                <IconComponent className={`h-5 w-5 transition-colors duration-200 ${isActive ? "text-[#F0C93B]" : "text-[#9FAEA1] group-hover:text-[#F3F0E4]"}`} />
              </motion.div>

              {item.badge !== undefined && (
                <span className="absolute -top-1.5 -right-1.5 bg-[#F28B6E] text-[#16261D] text-[9px] font-black flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full border border-[#121F18] shadow-md animate-pulse">
                  {item.badge}
                </span>
              )}
            </div>

            <span className={`text-[10px] font-bold tracking-tight transition-colors duration-200 ${isActive ? "text-[#F0C93B]" : "text-[#9FAEA1]"}`}>
              {item.label}
            </span>
          </Link>
        );
      })}
    </div>
  );
}

