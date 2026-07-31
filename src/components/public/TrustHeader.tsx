"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft, BookOpen } from "lucide-react";

export function TrustHeader({ title }: { title: string }) {
  const pathname = usePathname();

  const trustLinks = [
    { href: "/about", label: "About" },
    { href: "/contact", label: "Contact" },
    { href: "/privacy", label: "Privacy" },
    { href: "/terms", label: "Terms" },
    { href: "/disclaimer", label: "Disclaimer" },
    { href: "/refund-policy", label: "Refunds" },
    { href: "/community-guidelines", label: "Guidelines" },
  ];

  return (
    <header className="border-b border-[#F3F0E4]/15 bg-[#121F18]/90 backdrop-blur-md sticky top-0 z-50 transition-all duration-300">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 shrink-0">
          <Link
            href="/"
            className="text-[#9FAEA1] hover:text-[#F3F0E4] flex items-center gap-2 text-xs font-semibold transition-colors py-1.5 px-3 rounded-full hover:bg-white/5 border border-transparent hover:border-[#F3F0E4]/10"
          >
            <ArrowLeft className="size-4 text-[#8FC3DE]" />
            <span className="hidden sm:inline">Back to Notexia</span>
          </Link>
          <div className="h-4 w-px bg-[#F3F0E4]/15 hidden sm:block" />
          <Link href="/" className="flex items-center gap-2 font-bold text-white tracking-wider text-sm">
            <span className="size-6 rounded-lg bg-[#F0C93B]/20 border border-[#F0C93B]/40 flex items-center justify-center text-[#F0C93B] font-mono text-xs">
              N
            </span>
            <span className="font-heading hidden md:inline text-[#F3F0E4]">NOTEXIA</span>
          </Link>
        </div>

        {/* Navigation items for desktop */}
        <nav className="hidden lg:flex items-center gap-1 bg-[#1A2D23]/60 p-1 rounded-full border border-[#F3F0E4]/10 text-xs font-heading">
          {trustLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-1.5 rounded-full transition-all duration-200 ${
                  isActive
                    ? "bg-[#F0C93B] text-[#2A2118] font-bold shadow-sm"
                    : "text-[#9FAEA1] hover:text-[#F3F0E4] hover:bg-white/5"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold tracking-widest text-[#F0C93B] uppercase font-mono bg-[#F0C93B]/10 px-3 py-1 rounded-full border border-[#F0C93B]/30">
            {title}
          </span>
        </div>
      </div>

      {/* Secondary horizontal scrolling tab strip for mobile/tablet */}
      <div className="flex lg:hidden overflow-x-auto no-scrollbar border-t border-[#F3F0E4]/10 px-4 py-2 gap-2 bg-[#0E1A14]">
        {trustLinks.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`shrink-0 text-xs px-3 py-1 rounded-full font-medium transition-all ${
                isActive
                  ? "bg-[#F0C93B] text-[#2A2118] font-bold"
                  : "text-[#9FAEA1] hover:text-white bg-[#1A2D23]/40 border border-[#F3F0E4]/5"
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
