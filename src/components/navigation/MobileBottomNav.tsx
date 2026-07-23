"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { HomeIcon, Users, Send, Trophy, User as UserIcon } from "lucide-react";

export function MobileBottomNav({
  userId,
  unreadMessagesCount,
}: {
  userId: string;
  unreadMessagesCount: number;
}) {
  const pathname = usePathname();

  const navItems = [
    {
      href: "/feed",
      icon: <HomeIcon className="h-5 w-5" />,
      label: "Home",
    },
    {
      href: "/community",
      icon: <Users className="h-5 w-5" />,
      label: "Community",
    },
    {
      href: "/messages",
      icon: <Send className="h-5 w-5" />,
      label: "Messages",
      badge: unreadMessagesCount > 0 ? unreadMessagesCount : undefined,
    },
    {
      href: "/leaderboard",
      icon: <Trophy className="h-5 w-5" />,
      label: "Leaderboard",
    },
    {
      href: `/user/${userId}`,
      icon: <UserIcon className="h-5 w-5" />,
      label: "Profile",
    },
  ];

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-sidebar border-t border-sidebar-border h-16 flex items-center justify-around px-2 pb-safe">
      {navItems.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center justify-center w-full h-full space-y-1 relative group ${
              isActive ? "text-primary" : "text-neutral-500 hover:text-neutral-300"
            }`}
          >
            <div className="relative">
              {item.icon}
              {item.badge !== undefined && (
                <span className="absolute -top-1.5 -right-1.5 bg-destructive text-neutral-100 text-[9px] font-extrabold flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full border border-background shadow-md">
                  {item.badge}
                </span>
              )}
            </div>
            <span className="text-[10px] font-medium">{item.label}</span>
          </Link>
        );
      })}
    </div>
  );
}
