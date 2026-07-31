import React from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

export function TrustFooter() {
  return (
    <footer className="border-t border-[#F3F0E4]/10 bg-[#121F18] py-12 text-xs text-[#9FAEA1] relative z-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-8 border-b border-[#F3F0E4]/10">
          <div className="space-y-3 md:col-span-1">
            <div className="flex items-center gap-2 font-bold text-white tracking-wider text-base">
              <span className="size-7 rounded-lg bg-[#F0C93B]/20 border border-[#F0C93B]/40 flex items-center justify-center text-[#F0C93B] font-mono text-xs">
                N
              </span>
              <span className="font-heading text-[#F3F0E4]">NOTEXIA</span>
            </div>
            <p className="text-xs text-[#9FAEA1] leading-relaxed font-light">
              Smart study platform for Indian students &amp; engineers. AI doubt resolution, collaborative markdown notes, and peer study groups.
            </p>
          </div>

          <div className="space-y-3">
            <h4 className="font-heading uppercase tracking-wider text-[11px] font-bold text-[#F3F0E4]">
              Trust &amp; Legal
            </h4>
            <ul className="space-y-2">
              <li>
                <Link href="/about" className="hover:text-[#F3F0E4] transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-[#F3F0E4] transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-[#F3F0E4] transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/disclaimer" className="hover:text-[#F3F0E4] transition-colors">
                  Disclaimer
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="font-heading uppercase tracking-wider text-[11px] font-bold text-[#F3F0E4]">
              Policies &amp; Support
            </h4>
            <ul className="space-y-2">
              <li>
                <Link href="/contact" className="hover:text-[#F3F0E4] transition-colors">
                  Contact Support
                </Link>
              </li>
              <li>
                <Link href="/refund-policy" className="hover:text-[#F3F0E4] transition-colors">
                  Refund &amp; Cancellation
                </Link>
              </li>
              <li>
                <Link href="/community-guidelines" className="hover:text-[#F3F0E4] transition-colors">
                  Community Guidelines
                </Link>
              </li>
              <li>
                <Link href="/security" className="hover:text-[#F3F0E4] transition-colors">
                  Security Overview
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="font-heading uppercase tracking-wider text-[11px] font-bold text-[#F3F0E4]">
              Student Tools
            </h4>
            <ul className="space-y-2">
              <li>
                <Link href="/tools/cgpa-converter" className="hover:text-[#F3F0E4] transition-colors inline-flex items-center gap-1">
                  CGPA Converter <ArrowUpRight className="size-3 text-[#F0C93B]" />
                </Link>
              </li>
              <li>
                <Link href="/tools/formula-sheets" className="hover:text-[#F3F0E4] transition-colors inline-flex items-center gap-1">
                  Formula Sheets <ArrowUpRight className="size-3 text-[#8FC3DE]" />
                </Link>
              </li>
              <li>
                <Link href="/blogs" className="hover:text-[#F3F0E4] transition-colors">
                  Student Blogs
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="size-2 rounded-full bg-[#8FC3DE] animate-pulse" />
            <span className="font-mono text-[#8FC3DE] text-[11px]">All Trust &amp; Verification Standards Active</span>
          </div>
          <div className="text-[#9FAEA1] text-[11px] text-center">
            &copy; {new Date().getFullYear()} Notexia Inc. All rights reserved. Empowering Indian Students &amp; Researchers.
          </div>
        </div>
      </div>
    </footer>
  );
}
