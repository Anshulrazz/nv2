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
    cyan: "group-hover:text-[#F5B429]",
    violet: "group-hover:text-[#F5941D]",
    amber: "group-hover:text-[#F5B429]",
    yellow: "group-hover:text-[#FCD34D]",
    red: "group-hover:text-[#EF4444]",
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
          ? "bg-gradient-to-r from-[#F5B429]/15 to-[#F5941D]/10 border border-[#F5B429]/30 text-[#FAFAF8] font-semibold shadow-[0_0_15px_-3px_rgba(245,180,41,0.15)]"
          : "text-[#B8AFA6] hover:text-[#FAFAF8] hover:bg-[#150F0B] font-medium"
      }`}
    >
      <div className="flex items-center gap-3">
        <span className={`transition-colors ${isActive ? "text-[#F5B429]" : `text-[#8A8078] ${accentMap[accent]}`}`}>
          {icon}
        </span>
        <span>{label}</span>
      </div>
      {badge !== undefined && badge > 0 && (
        <span className="text-[9px] font-mono bg-[#F5B429]/20 text-[#FCD34D] font-extrabold px-2 py-0.5 rounded-full border border-[#F5B429]/30">
          {badge}
        </span>
      )}
    </Link>
  );
}
