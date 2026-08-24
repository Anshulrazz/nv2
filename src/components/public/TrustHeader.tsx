"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export function TrustHeader({ title }: { title: string }) {
  const pathname = usePathname();

  const trustLinks = [
    { href: "/about", label: "About" },
    { href: "/contact", label: "Contact" },
    { href: "/legal/privacy-policy", label: "Privacy" },
    { href: "/legal/terms", label: "Terms" },
    { href: "/legal/security-policy", label: "Security" },
    { href: "/legal/refund-policy", label: "Refunds" },
    { href: "/legal/community-guidelines", label: "Guidelines" },
    { href: "/legal/grievance-redressal", label: "Grievance" },
  ];

  return (
    <header className="border-b border-[#2E2118] bg-[#0A0806]/85 backdrop-blur-md sticky top-0 z-50 transition-all duration-300">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 shrink-0">
          <Link
            href="/"
            className="text-[#B8AFA6] hover:text-[#FAFAF8] flex items-center gap-2 text-xs font-semibold transition-colors py-1.5 px-3 rounded-full hover:bg-[#150F0B] border border-transparent hover:border-[#2E2118]"
          >
            <ArrowLeft className="size-4 text-[#F5941D]" />
            <span className="hidden sm:inline">Back to Notexia</span>
          </Link>
          <div className="h-4 w-px bg-[#2E2118] hidden sm:block" />
          <Link href="/" className="flex items-center gap-2 font-bold text-white tracking-wider text-sm">
            <span className="size-6 rounded-lg bg-gradient-to-br from-[#F7C948] to-[#F5941D] flex items-center justify-center text-[#150F0B] font-mono text-xs font-black shadow-[0_0_12px_rgba(245,180,41,0.3)]">
              N
            </span>
            <span className="font-display hidden md:inline text-[#FAFAF8] font-bold tracking-widest">NOTEXIA</span>
          </Link>
        </div>

        {/* Navigation items for desktop */}
        <nav className="hidden lg:flex items-center gap-1 bg-[#150F0B] p-1 rounded-full border border-[#2E2118] text-xs font-medium">
          {trustLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3.5 py-1.5 rounded-full uppercase tracking-wider text-[11px] transition-all duration-200 ${
                  isActive
                    ? "bg-gradient-to-br from-[#F7C948] to-[#F5941D] text-[#150F0B] font-bold shadow-[0_2px_12px_rgba(245,148,29,0.3)]"
                    : "text-[#B8AFA6] hover:text-[#FAFAF8] hover:bg-[#241811]"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2 shrink-0 min-w-0">
          <span className="text-xs font-bold tracking-widest text-[#F5B429] uppercase font-mono bg-[#241811] px-2.5 sm:px-3 py-1 rounded-full border border-[#2E2118] truncate max-w-[110px] sm:max-w-none">
            {title}
          </span>
        </div>
      </div>

      {/* Secondary horizontal scrolling tab strip for mobile/tablet */}
      <div className="flex lg:hidden overflow-x-auto no-scrollbar border-t border-[#2E2118] px-4 py-2 gap-2 bg-[#150F0B]">
        {trustLinks.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`shrink-0 text-xs px-3.5 py-1.5 min-h-[36px] flex items-center justify-center rounded-full uppercase tracking-wider text-[11px] font-medium transition-all ${
                isActive
                  ? "bg-gradient-to-br from-[#F7C948] to-[#F5941D] text-[#150F0B] font-bold"
                  : "text-[#B8AFA6] hover:text-[#FAFAF8] bg-[#241811] border border-[#2E2118]"
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </div>
    </header>
  );
}
