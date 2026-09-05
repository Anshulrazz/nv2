"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";
import { useDashboardShell } from "@/components/layout/DashboardShellContext";

export function NavLink({
  href,
  icon,
  label,
  badge,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  badge?: number;
}) {
  const pathname = usePathname();
  let closeMobileNav: (() => void) | undefined;
  try {
    const shell = useDashboardShell();
    closeMobileNav = shell.closeMobileNav;
  } catch {
    // Fallback if rendered outside provider
  }

  const isActive =
    pathname === href ||
    (href !== "/" && pathname?.startsWith(href + "/")) ||
    (href === "/blogs" && pathname?.startsWith("/blog"));

  const handleLinkClick = () => {
    if (closeMobileNav) {
      closeMobileNav();
    }
  };

  return (
    <Link
      href={href}
      onClick={handleLinkClick}
      aria-current={isActive ? "page" : undefined}
      className={`group relative flex items-center justify-between min-h-[40px] px-3 py-2 text-xs rounded-xl transition-all duration-150 active:scale-[0.99] outline-none focus-visible:ring-1 focus-visible:ring-accent-primary ${
        isActive
          ? "bg-bg-elevated border border-border-default text-text-primary font-semibold"
          : "text-text-secondary hover:text-text-primary hover:bg-bg-surface font-medium border border-transparent"
      }`}
    >
      {/* 2px Left Accent Landmark for active state */}
      {isActive && (
        <span
          className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r bg-accent-primary"
          aria-hidden="true"
        />
      )}

      <div className="flex items-center gap-3 min-w-0">
        <span
          className={`shrink-0 transition-colors duration-150 ${
            isActive ? "text-accent-primary" : "text-text-muted group-hover:text-text-primary"
          }`}
        >
          {icon}
        </span>
        <span className="truncate">{label}</span>
      </div>

      {badge !== undefined && badge > 0 && (
        <span className="shrink-0 text-[10px] font-mono bg-accent-primary/15 text-accent-primary font-bold px-2 py-0.5 rounded-full border border-accent-primary/25">
          {badge}
        </span>
      )}
    </Link>
  );
}
