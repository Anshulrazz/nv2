import React from "react";
import Link from "next/link";
import { Scale, AlertTriangle, BookOpen, UserCheck, ShieldCheck, Coins, Gavel } from "lucide-react";
import { TrustHeader } from "@/components/public/TrustHeader";
import { TrustFooter } from "@/components/public/TrustFooter";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#16261D] text-[#F3F0E4] font-sans selection:bg-[#F0C93B]/30 flex flex-col antialiased">
      <TrustHeader title="TERMS OF SERVICE" />

      <main className="max-w-4xl w-full mx-auto px-4 sm:px-6 py-12 space-y-10 flex-1">
        {/* Header Hero Section */}
        <div className="space-y-4 border-b border-[#F3F0E4]/15 pb-8">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#F0C93B]/15 border border-[#F0C93B]/30 text-[#F0C93B] text-xs font-mono font-bold uppercase tracking-wider">
            <Scale className="size-3.5" /> USER AGREEMENT
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight font-heading">
            Terms of Service &amp; Platform Guidelines
          </h1>
          <p className="text-[#9FAEA1] text-sm sm:text-base leading-relaxed max-w-3xl font-light">
            Welcome to Notexia. By accessing or creating an account on our platform, web application, or API services, you agree to be bound by these Terms of Service. Please review them carefully to understand your rights, responsibilities, and acceptable academic use.
          </p>
          <div className="text-[11px] font-mono text-[#9FAEA1]/80">
            Last Updated: July 30, 2026 • Effective Date: January 1, 2026
          </div>
        </div>

        {/* Terms Content Cards */}
        <div className="space-y-8 text-sm leading-relaxed">
          {/* Section 1: Account Terms */}
          <section className="rounded-[2rem] bg-[#1A2D23]/90 border border-[#F3F0E4]/15 p-2 shadow-xl">
            <div className="rounded-[calc(2rem-0.5rem)] bg-[#121F18] p-6 sm:p-8 space-y-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2 font-heading">
                <UserCheck className="size-5 text-[#8FC3DE]" /> 1. Account Registration &amp; Eligibility
              </h2>
              <p className="text-[#9FAEA1] font-light">
                To access personalized notes, AI doubt resolution, and study group features, you must register for an account. You must provide accurate registration information and keep your credentials confidential. Notexia reserves the right to suspend or terminate accounts providing fraudulent details or violating platform security.
              </p>
            </div>
          </section>

          {/* Section 2: Acceptable Use */}
          <section className="rounded-[2rem] bg-[#1A2D23]/90 border border-[#F3F0E4]/15 p-2 shadow-xl">
            <div className="rounded-[calc(2rem-0.5rem)] bg-[#121F18] p-6 sm:p-8 space-y-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2 font-heading">
                <ShieldCheck className="size-5 text-[#F0C93B]" /> 2. Acceptable Use &amp; Academic Conduct
              </h2>
              <p className="text-[#9FAEA1] font-light">
                Notexia is designed to foster genuine academic growth and peer learning. Users must refrain from:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-[#F3F0E4] font-light">
                <li>Uploading copyrighted textbook PDFs, leaked exam papers, or unauthorized proprietary material.</li>
                <li>Engaging in harassment, hate speech, or abuse in forums, notes comments, or direct messages.</li>
                <li>Attempting automated database scraping, bot attacks, or rate-limit circumvention.</li>
                <li>Sharing fake or misleading notes intended to deceive students preparing for competitive exams.</li>
              </ul>
            </div>
          </section>

          {/* Section 3: Intellectual Property */}
          <section className="rounded-[2rem] bg-[#1A2D23]/90 border border-[#F3F0E4]/15 p-2 shadow-xl">
            <div className="rounded-[calc(2rem-0.5rem)] bg-[#121F18] p-6 sm:p-8 space-y-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2 font-heading">
                <BookOpen className="size-5 text-[#C9A9E0]" /> 3. Content Ownership &amp; Platform Licensing
              </h2>
              <p className="text-[#9FAEA1] font-light">
                You retain complete ownership of original study notes and research papers you author on Notexia. By publishing content publicly on the blog feed or forums, you grant Notexia a non-exclusive, worldwide, royalty-free license to render, index, and display your work on the platform.
              </p>
            </div>
          </section>

          {/* Section 4: Subscriptions & Activity Coins */}
          <section className="rounded-[2rem] bg-[#1A2D23]/90 border border-[#F3F0E4]/15 p-2 shadow-xl">
            <div className="rounded-[calc(2rem-0.5rem)] bg-[#121F18] p-6 sm:p-8 space-y-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2 font-heading">
                <Coins className="size-5 text-[#F0C93B]" /> 4. Subscriptions, Tokens &amp; Activity Coins
              </h2>
              <p className="text-[#9FAEA1] font-light">
                Notexia offers free features as well as premium AI doubt packages. Activity coins earned through community participation have no cash value and cannot be redeemed for fiat currency. Paid subscriptions renew automatically unless cancelled prior to the billing date as outlined in our{" "}
                <Link href="/refund-policy" className="text-[#8FC3DE] font-bold hover:underline">
                  Refund Policy
                </Link>
                .
              </p>
            </div>
          </section>

          {/* Section 5: Limitation of Liability */}
          <section className="rounded-[2rem] bg-[#1A2D23]/90 border border-[#F3F0E4]/15 p-2 shadow-xl">
            <div className="rounded-[calc(2rem-0.5rem)] bg-[#121F18] p-6 sm:p-8 space-y-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2 font-heading">
                <AlertTriangle className="size-5 text-[#F28B6E]" /> 5. Limitation of Liability &amp; Disclaimers
              </h2>
              <p className="text-[#9FAEA1] font-light">
                Notexia provides study tools, AI copilot responses, and peer notes on an &quot;as is&quot; and &quot;as available&quot; basis. We do not guarantee specific academic results or exam scores. AI generated outputs must be cross-verified with official course syllabi and textbooks.
              </p>
            </div>
          </section>

          {/* Contact Legal Support */}
          <div className="rounded-2xl border border-[#F3F0E4]/15 bg-[#1A2D23] p-6 text-center space-y-2 shadow-lg">
            <h3 className="text-base font-bold text-white font-heading">Questions Regarding Terms?</h3>
            <p className="text-xs text-[#9FAEA1]">
              Contact our Legal Team at{" "}
              <a href="mailto:info@notexia.cloud" className="text-[#F0C93B] font-bold hover:underline">
                info@notexia.cloud
              </a>{" "}
              or via our{" "}
              <Link href="/contact" className="text-[#8FC3DE] font-bold hover:underline">
                Contact Form
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
