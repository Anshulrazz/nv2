"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";

type Accent = "cyan" | "violet" | "amber" | "yellow" | "red";

export function NavLink({
  href,
  icon,
  label,
  accent,
  badge,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  accent: Accent;
  badge?: number;
}) {
  const pathname = usePathname();
  const isActive =
    pathname === href ||
    (href !== "/" && pathname?.startsWith(href)) ||
    (href === "/blogs" && pathname?.startsWith("/blog"));

  const accentMap: Record<Accent, string> = {
    cyan: "group-hover:text-cyan-400",
    violet: "group-hover:text-violet-400",
    amber: "group-hover:text-amber-400",
    yellow: "group-hover:text-yellow-400",
    red: "group-hover:text-rose-400",
  };

  const handleLinkClick = () => {
    const checkbox = document.getElementById("sidebar-toggle") as HTMLInputElement | null;
    if (checkbox) {
      checkbox.checked = false;
    }
  };

  return (
    <Link
      href={href}
      onClick={handleLinkClick}
      className={`group flex items-center justify-between px-3 py-2 text-xs rounded-xl transition-all duration-200 active:scale-[0.98] ${
        isActive
          ? "bg-white/10 border border-white/10 text-white font-bold shadow-sm"
          : "text-zinc-400 hover:text-white hover:bg-white/5 font-medium"
      }`}
    >
      <div className="flex items-center gap-3">
        <span className={`transition-colors ${isActive ? "text-cyan-400" : `text-zinc-500 ${accentMap[accent]}`}`}>
          {icon}
        </span>
        <span>{label}</span>
      </div>
      {badge !== undefined && badge > 0 && (
        <span className="text-[9px] font-mono bg-cyan-500/20 text-cyan-300 font-extrabold px-2 py-0.5 rounded-full border border-cyan-500/30">
          {badge}
        </span>
      )}
    </Link>
  );
}
