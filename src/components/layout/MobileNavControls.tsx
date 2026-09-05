"use client";

import React from "react";
import { useDashboardShell } from "./DashboardShellContext";
import { Menu, X } from "lucide-react";

export function MobileNavToggle({
  className = "",
  variant = "open",
  ariaLabel,
}: {
  className?: string;
  variant?: "open" | "close" | "toggle";
  ariaLabel?: string;
}) {
  const { isMobileNavOpen, openMobileNav, closeMobileNav, toggleMobileNav } = useDashboardShell();

  const handleClick = () => {
    if (variant === "open") openMobileNav();
    else if (variant === "close") closeMobileNav();
    else toggleMobileNav();
  };

  if (variant === "close") {
    return (
      <button
        type="button"
        onClick={handleClick}
        className={className || "p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-elevated transition-colors cursor-pointer"}
        aria-label={ariaLabel || "Close menu"}
      >
        <X className="size-4" />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-expanded={isMobileNavOpen}
      aria-label={ariaLabel || (isMobileNavOpen ? "Close menu" : "Open menu")}
      className={className || "p-2 rounded-xl bg-bg-surface border border-border-subtle hover:bg-bg-elevated text-text-secondary hover:text-text-primary transition-colors cursor-pointer"}
    >
      {isMobileNavOpen ? <X className="size-5" /> : <Menu className="size-5" />}
    </button>
  );
}

export function MobileNavBackdrop() {
  const { isMobileNavOpen, closeMobileNav } = useDashboardShell();

  if (!isMobileNavOpen) return null;

  return (
    <div
      onClick={closeMobileNav}
      className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden transition-opacity duration-200 animate-in fade-in"
      aria-hidden="true"
    />
  );
}
