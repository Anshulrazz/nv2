import React from "react";
import Link from "next/link";
import { Users, HeartHandshake, ShieldAlert, Award, MessageSquare } from "lucide-react";
import { TrustHeader } from "@/components/public/TrustHeader";
import { TrustFooter } from "@/components/public/TrustFooter";
import { LegalNav } from "@/components/public/LegalNav";

export const metadata = {
  title: "Community Guidelines",
  description:
    "Explore Notexia's community guidelines, academic honor code, peer behavior rules, forum conduct, and scholar badge moderation principles.",
};

export default function CommunityGuidelinesPage() {
  return (
    <div className="min-h-screen bg-[#16261D] text-[#F3F0E4] font-sans selection:bg-[#F0C93B]/30 flex flex-col antialiased">
      <TrustHeader title="COMMUNITY GUIDELINES" />
      <LegalNav />

      <main className="max-w-4xl w-full mx-auto px-4 sm:px-6 py-12 space-y-10 flex-1">
        {/* Header Hero Section */}
        <div className="space-y-4 border-b border-[#F3F0E4]/15 pb-8">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#8FC3DE]/15 border border-[#8FC3DE]/30 text-[#8FC3DE] text-xs font-mono font-bold uppercase tracking-wider">
            <Users className="size-3.5" /> ACADEMIC HONOR CODE
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight font-heading">
            Community Guidelines &amp; Code of Conduct
          </h1>
          <p className="text-[#9FAEA1] text-sm sm:text-base leading-relaxed max-w-3xl font-light">
            Notexia is built for Indian students, competitive exam aspirants, and software engineers to collaborate respectfully. These guidelines ensure our forums, blogs, study groups, and notes comments remain helpful, safe, and academically rigorous.
          </p>
          <div className="text-[11px] font-mono text-[#9FAEA1]/80">
            Last Updated: August 7, 2026 • Effective Date: January 1, 2026
          </div>
        </div>

        {/* Content Cards */}
        <div className="space-y-8 text-sm leading-relaxed">
          {/* Core Values */}
          <section className="rounded-[2rem] bg-[#1A2D23]/90 border border-[#F3F0E4]/15 p-2 shadow-xl">
            <div className="rounded-[calc(2rem-0.5rem)] bg-[#121F18] p-6 sm:p-8 space-y-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2 font-heading">
                <HeartHandshake className="size-5 text-[#F0C93B]" /> 1. Core Principles of Peer Learning
              </h2>
              <ul className="space-y-3 text-[#F3F0E4] font-light">
                <li className="p-4 rounded-xl bg-[#16261D] border border-[#F3F0E4]/10">
                  <strong className="text-white font-bold block mb-1">Collaborative Generosity:</strong> Share high-quality notes, clear solutions, and verified formulas to lift fellow scholars.
                </li>
                <li className="p-4 rounded-xl bg-[#16261D] border border-[#F3F0E4]/10">
                  <strong className="text-white font-bold block mb-1">Respectful Dialogue:</strong> Maintain civil discussion in forum threads, direct messages, and peer note reviews. Toxic behavior is not tolerated.
                </li>
                <li className="p-4 rounded-xl bg-[#16261D] border border-[#F3F0E4]/10">
                  <strong className="text-white font-bold block mb-1">Authentic Scholarship:</strong> Avoid sharing deceptive, misleading, or intentionally wrong study materials prior to exams.
                </li>
              </ul>
            </div>
          </section>

          {/* Prohibited Behavior */}
          <section className="rounded-[2rem] bg-[#1A2D23]/90 border border-[#F3F0E4]/15 p-2 shadow-xl">
            <div className="rounded-[calc(2rem-0.5rem)] bg-[#121F18] p-6 sm:p-8 space-y-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2 font-heading">
                <ShieldAlert className="size-5 text-[#F28B6E]" /> 2. Prohibited Behavior &amp; Penalties
              </h2>
              <ul className="list-disc pl-6 space-y-2 text-[#F3F0E4] font-light">
                <li>Harassment, discrimination, hate speech, or personal attacks targeting any student or instructor.</li>
                <li>Spamming referral links, commercial advertisements, or unauthorized paid study groups.</li>
                <li>Leaking private personal data, contact numbers, or offline identity details (doxxing).</li>
                <li>Coin farming, automated bot voting, or creating multiple accounts to manipulate leaderboard ranks.</li>
              </ul>
            </div>
          </section>

          {/* Enforcement & Moderation */}
          <section className="rounded-[2rem] bg-[#1A2D23]/90 border border-[#F3F0E4]/15 p-2 shadow-xl">
            <div className="rounded-[calc(2rem-0.5rem)] bg-[#121F18] p-6 sm:p-8 space-y-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2 font-heading">
                <Award className="size-5 text-[#8FC3DE]" /> 3. Moderation &amp; Badge Revocation
              </h2>
              <p className="text-[#9FAEA1] font-light">
                Violating community guidelines results in tiered warnings, content removal, activity coin deduction, top scholar badge revocation, or immediate permanent ban.
              </p>
            </div>
          </section>

          {/* Contact Support */}
          <div className="rounded-2xl border border-[#F3F0E4]/15 bg-[#1A2D23] p-6 text-center space-y-2 shadow-lg">
            <h3 className="text-base font-bold text-white font-heading">Report Community Violations</h3>
            <p className="text-xs text-[#9FAEA1]">
              Report abusive posts or users to{" "}
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
