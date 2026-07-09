"use client";

import Link from "next/link";
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
  const accentMap: Record<Accent, string> = {
    cyan:   "group-hover:text-cyan-400",
    violet: "group-hover:text-violet-400",
    amber:  "group-hover:text-amber-400",
    yellow: "group-hover:text-yellow-400",
    red:    "group-hover:text-red-400",
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
      className="group flex items-center justify-between px-3 py-2 text-sm text-neutral-400 hover:text-foreground rounded-lg hover:bg-sidebar-accent transition-all"
    >
      <div className="flex items-center gap-3">
        <span className={`text-neutral-600 transition-colors ${accentMap[accent]}`}>{icon}</span>
        <span className="font-medium">{label}</span>
      </div>
      {badge !== undefined && (
        <span
          className="text-[9px] bg-amber-500/20 text-amber-400 font-extrabold px-2 py-0.5 rounded-full"
          style={{ fontFamily: "var(--font-jetbrains-mono)" }}
        >
          {badge}
        </span>
      )}
    </Link>
  );
}
