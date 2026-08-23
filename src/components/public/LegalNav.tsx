"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { LEGAL_PAGES } from "@/lib/legal-data";

export function LegalNav() {
  const pathname = usePathname();

  return (
    <div className="w-full bg-[#0A0806]/85 border-b border-[#2E2118] backdrop-blur-md sticky top-16 z-40">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center overflow-x-auto no-scrollbar py-2.5 gap-2 scroll-smooth">
          <span className="text-[11px] font-mono font-bold text-[#F5B429] uppercase tracking-wider shrink-0 mr-2 hidden sm:inline-flex items-center gap-1">
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
                    ? "bg-gradient-to-r from-[#F7C948] to-[#F5941D] text-[#150F0B] font-bold shadow-[0_0_15px_rgba(245,180,41,0.35)]"
                    : "text-[#B8AFA6] hover:text-[#FAFAF8] hover:bg-[#241811] bg-[#150F0B] border border-[#2E2118]"
                }`}
              >
                <Icon className={`size-3.5 ${isActive ? "text-[#150F0B]" : "text-[#FCD34D]"}`} />
                <span>{page.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
