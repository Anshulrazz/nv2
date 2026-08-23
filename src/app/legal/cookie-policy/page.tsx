import React from "react";
import Link from "next/link";
import { Cookie, Shield, CheckCircle, Info, Settings } from "lucide-react";
import { TrustHeader } from "@/components/public/TrustHeader";
import { TrustFooter } from "@/components/public/TrustFooter";
import { LegalNav } from "@/components/public/LegalNav";

export const metadata = {
  title: "Cookie & Tracking Policy",
  description:
    "Learn how Notexia uses essential session cookies and local storage to secure accounts and maintain user preferences without selling third-party tracking data.",
};

export default function CookiePolicyPage() {
  return (
    <div className="min-h-screen bg-transparent text-[#FAFAF8] font-sans selection:bg-[#F5B429]/30 flex flex-col antialiased">
      <TrustHeader title="COOKIE POLICY" />
      <LegalNav />

      <main className="max-w-4xl w-full mx-auto px-4 sm:px-6 py-12 space-y-10 flex-1">
        {/* Header Hero Section */}
        <div className="space-y-4 border-b border-[#F3F0E4]/15 pb-8">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#F0C93B]/15 border border-[#F0C93B]/30 text-[#F0C93B] text-xs font-mono font-bold uppercase tracking-wider">
            <Cookie className="size-3.5" /> TRACKING &amp; STORAGE
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight font-heading">
            Cookie &amp; Local Storage Policy
          </h1>
          <p className="text-[#9FAEA1] text-sm sm:text-base leading-relaxed max-w-3xl font-light">
            This Cookie Policy explains how Notexia uses cookies, local browser storage, and session tokens to provide secure account authentication, remember theme preferences, and optimize web app performance.
          </p>
          <div className="text-[11px] font-mono text-[#9FAEA1]/80">
            Last Updated: August 7, 2026 • Effective Date: January 1, 2026
          </div>
        </div>

        {/* Content Cards */}
        <div className="space-y-8 text-sm leading-relaxed">
          {/* Section 1: What Are Cookies */}
          <section className="rounded-[2rem] bg-[#1A2D23]/90 border border-[#F3F0E4]/15 p-2 shadow-xl">
            <div className="rounded-[calc(2rem-0.5rem)] bg-[#121F18] p-6 sm:p-8 space-y-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2 font-heading">
                <Info className="size-5 text-[#8FC3DE]" /> 1. What Are Cookies &amp; Local Storage?
              </h2>
              <p className="text-[#9FAEA1] font-light">
                Cookies are small data files placed on your computer or mobile device when you visit a website. Local storage allows web applications to store key-value data directly in your browser securely to prevent unnecessary server requests.
              </p>
            </div>
          </section>

          {/* Section 2: Categories of Cookies Used */}
          <section className="rounded-[2rem] bg-[#1A2D23]/90 border border-[#F3F0E4]/15 p-2 shadow-xl">
            <div className="rounded-[calc(2rem-0.5rem)] bg-[#121F18] p-6 sm:p-8 space-y-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2 font-heading">
                <Shield className="size-5 text-[#F0C93B]" /> 2. Types of Cookies We Use
              </h2>
              <ul className="space-y-4 text-[#F3F0E4] font-light">
                <li className="p-4 rounded-xl bg-[#16261D] border border-[#F3F0E4]/10 space-y-1">
                  <strong className="text-white font-bold flex items-center gap-2">
                    <CheckCircle className="size-4 text-[#F0C93B]" /> Essential Authentication Cookies (Strictly Necessary)
                  </strong>
                  <p className="text-xs text-[#9FAEA1]">
                    Auth.js session tokens and CSRF protection cookies enable secure login states, prevent unauthorized API access, and maintain your session across pages.
                  </p>
                </li>
                <li className="p-4 rounded-xl bg-[#16261D] border border-[#F3F0E4]/10 space-y-1">
                  <strong className="text-white font-bold flex items-center gap-2">
                    <CheckCircle className="size-4 text-[#8FC3DE]" /> Functional &amp; Preference Local Storage
                  </strong>
                  <p className="text-xs text-[#9FAEA1]">
                    Stores layout choices, active note editor state, dark mode preferences, and sidebar collapse states locally in your browser.
                  </p>
                </li>
                <li className="p-4 rounded-xl bg-[#16261D] border border-[#F3F0E4]/10 space-y-1">
                  <strong className="text-white font-bold flex items-center gap-2">
                    <CheckCircle className="size-4 text-[#C9A9E0]" /> Security &amp; Fraud Prevention
                  </strong>
                  <p className="text-xs text-[#9FAEA1]">
                    Used to detect rapid login brute-force attempts, malicious bot traffic, and automated API scraping.
                  </p>
                </li>
              </ul>
            </div>
          </section>

          {/* Section 3: Third Party & No Tracking Guarantee */}
          <section className="rounded-[2rem] bg-[#1A2D23]/90 border border-[#F3F0E4]/15 p-2 shadow-xl">
            <div className="rounded-[calc(2rem-0.5rem)] bg-[#121F18] p-6 sm:p-8 space-y-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2 font-heading">
                <Settings className="size-5 text-[#C9A9E0]" /> 3. Managing Your Cookie Preferences
              </h2>
              <p className="text-[#9FAEA1] font-light">
                Notexia does not use cross-site tracking cookies or sell browser profiles to ad networks. You can clear or disable cookies at any time through your web browser settings. Note that disabling essential session cookies will require you to log back in.
              </p>
            </div>
          </section>

          {/* Contact Support */}
          <div className="rounded-2xl border border-[#F3F0E4]/15 bg-[#1A2D23] p-6 text-center space-y-2 shadow-lg">
            <h3 className="text-base font-bold text-white font-heading">Questions About Cookie Storage?</h3>
            <p className="text-xs text-[#9FAEA1]">
              Contact our technical team at{" "}
              <a href="mailto:info@notexia.cloud" className="text-[#F0C93B] font-bold hover:underline">
                info@notexia.cloud
              </a>{" "}
              or review our{" "}
              <Link href="/legal/privacy-policy" className="text-[#8FC3DE] font-bold hover:underline">
                Privacy Policy
              </Link>
              .
            </p>
          </div>
        </div>
      </main>

      <TrustFooter />
    </div>
  );
}
