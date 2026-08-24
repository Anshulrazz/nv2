import React from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { RazorpayPaymentButton } from "@/components/common/RazorpayPaymentButton";
import { NotexiaLogo } from "@/components/common/NotexiaLogo";

export function TrustFooter() {
  return (
    <footer className="border-t border-[#2E2118] bg-[#0A0806] py-12 text-xs text-[#B8AFA6] relative z-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-8 border-b border-[#2E2118]">
          <div className="space-y-3 md:col-span-1">
            <Link href="/" className="inline-block mb-1">
              <NotexiaLogo size="md" />
            </Link>
            <p className="text-xs text-[#8A8078] leading-relaxed">
              Smart study platform for Indian students &amp; engineers. AI doubt resolution, collaborative markdown notes, and peer study groups.
            </p>

            <div className="pt-2">
              <RazorpayPaymentButton buttonId="pl_TKvnrbgY75iRaH" className="flex items-start justify-start" />
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-display uppercase tracking-wider text-[11px] font-bold text-[#FAFAF8]">
              Trust &amp; Legal
            </h4>
            <ul className="space-y-2">
              <li>
                <Link href="/legal/privacy-policy" className="hover:text-[#FAFAF8] transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/legal/terms" className="hover:text-[#FAFAF8] transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/legal/cookie-policy" className="hover:text-[#FAFAF8] transition-colors">
                  Cookie Policy
                </Link>
              </li>
              <li>
                <Link href="/legal/data-retention" className="hover:text-[#FAFAF8] transition-colors">
                  Data Retention
                </Link>
              </li>
              <li>
                <Link href="/legal/ai-usage-policy" className="hover:text-[#FAFAF8] transition-colors">
                  AI Usage Policy
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="font-display uppercase tracking-wider text-[11px] font-bold text-[#FAFAF8]">
              Policies &amp; Governance
            </h4>
            <ul className="space-y-2">
              <li>
                <Link href="/legal/security-policy" className="hover:text-[#FAFAF8] transition-colors">
                  Security Policy
                </Link>
              </li>
              <li>
                <Link href="/legal/refund-policy" className="hover:text-[#FAFAF8] transition-colors">
                  Refund Policy
                </Link>
              </li>
              <li>
                <Link href="/legal/community-guidelines" className="hover:text-[#FAFAF8] transition-colors">
                  Community Guidelines
                </Link>
              </li>
              <li>
                <Link href="/legal/copyright-dmca" className="hover:text-[#FAFAF8] transition-colors">
                  Copyright &amp; DMCA
                </Link>
              </li>
              <li>
                <Link href="/legal/grievance-redressal" className="hover:text-[#FAFAF8] transition-colors">
                  Grievance Redressal
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="font-display uppercase tracking-wider text-[11px] font-bold text-[#FAFAF8]">
              Connect &amp; Social
            </h4>
            <ul className="space-y-2">
              <li>
                <a
                  href="https://www.instagram.com/notexia_edu/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[#F5B429] transition-colors inline-flex items-center gap-1.5"
                >
                  <span>Instagram</span>
                  <ArrowUpRight className="size-3 text-[#F5B429]" />
                </a>
              </li>
              <li>
                <a
                  href="https://www.linkedin.com/in/notexia-technology-ba99b1430/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[#F5B429] transition-colors inline-flex items-center gap-1.5"
                >
                  <span>LinkedIn</span>
                  <ArrowUpRight className="size-3 text-[#F5B429]" />
                </a>
              </li>
              <li>
                <a
                  href="https://x.com/Notexiaay"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[#F5B429] transition-colors inline-flex items-center gap-1.5"
                >
                  <span>Twitter / X</span>
                  <ArrowUpRight className="size-3 text-[#F5B429]" />
                </a>
              </li>
              <li>
                <Link href="/feed" className="hover:text-[#FAFAF8] transition-colors">
                  Public Notes Feed
                </Link>
              </li>
              <li>
                <Link href="/blogs" className="hover:text-[#FAFAF8] transition-colors">
                  Scholar Articles
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
          <div className="flex items-center gap-2.5">
            <div className="size-2 rounded-full bg-[#22C55E] animate-pulse" />
            <span className="font-mono text-[#F5B429] text-[11px]">All Trust &amp; Verification Standards Active</span>
          </div>
          <div className="text-[#8A8078] text-[11px] text-center">
            &copy; {new Date().getFullYear()} Notexia Inc. All rights reserved. Empowering Indian Students &amp; Researchers.
          </div>
        </div>
      </div>
    </footer>
  );
}
