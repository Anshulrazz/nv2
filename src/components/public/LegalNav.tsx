"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { LEGAL_PAGES } from "@/lib/legal-data";

export function LegalNav() {
  const pathname = usePathname();

  return (
    <div className="w-full bg-[#121F18]/80 border-b border-[#F3F0E4]/10 backdrop-blur-md sticky top-16 z-40">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center overflow-x-auto no-scrollbar py-2.5 gap-2 scroll-smooth">
          <span className="text-[11px] font-mono font-bold text-[#F0C93B] uppercase tracking-wider shrink-0 mr-2 hidden sm:inline-flex items-center gap-1">
            Legal Hub <ChevronRight className="size-3" />
          </span>
          {LEGAL_PAGES.map((page) => {
            const Icon = page.icon;
            const isActive = pathname === page.href;
            return (
              <Link
                key={page.href}
                href={page.href}
                className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
                  isActive
                    ? "bg-[#F0C93B] text-[#121F18] font-bold shadow-md shadow-[#F0C93B]/20"
                    : "text-[#9FAEA1] hover:text-[#F3F0E4] hover:bg-white/5 bg-[#1A2D23]/40 border border-[#F3F0E4]/5"
                }`}
              >
                <Icon className={`size-3.5 ${isActive ? "text-[#121F18]" : "text-[#8FC3DE]"}`} />
                <span>{page.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
