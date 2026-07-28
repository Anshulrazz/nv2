import React from "react";
import Link from "next/link";
import { FileText, ArrowLeft, Scale, AlertTriangle, BookOpen, UserCheck, ShieldCheck } from "lucide-react";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#16261D] text-[#F3F0E4] font-sans selection:bg-[#F0C93B]/30 flex flex-col antialiased">
      {/* Top Bar Navigation */}
      <header className="border-b border-[#F3F0E4]/15 bg-[#121F18]/90 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/feed" className="text-[#9FAEA1] hover:text-white flex items-center gap-2 text-xs font-semibold transition-colors">
            <ArrowLeft className="size-4 text-[#8FC3DE]" /> Back to Notexia
          </Link>
          <span className="text-sm font-bold tracking-widest text-[#F0C93B]" style={{ fontFamily: "var(--font-space-grotesk)" }}>
            NOTEXIA TERMS
          </span>
        </div>
      </header>

      <main className="max-w-4xl w-full mx-auto px-6 py-12 space-y-10 flex-1">
        {/* Header Hero Section */}
        <div className="space-y-4 border-b border-[#F3F0E4]/15 pb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F0C93B]/15 border border-[#F0C93B]/30 text-[#F0C93B] text-xs font-mono font-bold uppercase tracking-wider">
            <Scale className="size-3.5" /> TERMS OF SERVICE
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight font-heading">
            Terms of Service &amp; User Agreement
          </h1>
          <p className="text-[#9FAEA1] text-sm sm:text-base leading-relaxed max-w-3xl font-light">
            Welcome to Notexia. By accessing or using our platform, mobile application, or study services, you agree to be bound by these Terms of Service. Please read them carefully to understand your rights, responsibilities, and acceptable academic use guidelines.
          </p>
          <div className="text-[11px] font-mono text-[#9FAEA1]/80">
            Last Updated: July 28, 2026 • Effective Date: January 1, 2026
          </div>
        </div>

        {/* Terms Content Cards */}
        <div className="space-y-8 text-sm leading-relaxed">
          {/* Section 1: Account Terms */}
          <section className="rounded-2xl border border-[#F3F0E4]/15 bg-[#121F18] p-6 sm:p-8 space-y-4 shadow-xl">
            <h2 className="text-xl font-bold text-white flex items-center gap-2 font-heading">
              <UserCheck className="size-5 text-[#8FC3DE]" /> 1. Account Eligibility &amp; Registration
            </h2>
            <p className="text-[#9FAEA1] font-light">
              You must provide accurate account information upon registration. You are responsible for maintaining the confidentiality of your password and restricting access to your account. Notexia reserves the right to suspend accounts that violate platform policies.
            </p>
          </section>

          {/* Section 2: Acceptable Use & Academic Integrity */}
          <section className="rounded-2xl border border-[#F3F0E4]/15 bg-[#121F18] p-6 sm:p-8 space-y-4 shadow-xl">
            <h2 className="text-xl font-bold text-white flex items-center gap-2 font-heading">
              <ShieldCheck className="size-5 text-[#F0C93B]" /> 2. Acceptable Use &amp; Community Guidelines
            </h2>
            <p className="text-[#9FAEA1] font-light">
              Notexia is built to foster genuine learning and academic collaboration. Users must adhere to the following rules:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-[#F3F0E4] font-light">
              <li>Do not post copyrighted textbook scans, exam leaks, or non-peer-reviewed spam.</li>
              <li>Do not engage in harassment, hate speech, or abuse in forums, comments, or direct messages.</li>
              <li>Do not attempt automated scraping, database exploitation, or rate-limit circumvention.</li>
            </ul>
          </section>

          {/* Section 3: Intellectual Property */}
          <section className="rounded-2xl border border-[#F3F0E4]/15 bg-[#121F18] p-6 sm:p-8 space-y-4 shadow-xl">
            <h2 className="text-xl font-bold text-white flex items-center gap-2 font-heading">
              <BookOpen className="size-5 text-[#C9A9E0]" /> 3. Content Ownership &amp; Licensing
            </h2>
            <p className="text-[#9FAEA1] font-light">
              You retain all ownership rights to the original study notes and research papers you author on Notexia. By publishing content publicly, you grant Notexia a non-exclusive license to display, render, and index your content across the platform and feed.
            </p>
          </section>

          {/* Section 4: Limitation of Liability */}
          <section className="rounded-2xl border border-[#F3F0E4]/15 bg-[#121F18] p-6 sm:p-8 space-y-4 shadow-xl">
            <h2 className="text-xl font-bold text-white flex items-center gap-2 font-heading">
              <AlertTriangle className="size-5 text-[#F28B6E]" /> 4. Disclaimers &amp; Limitation of Liability
            </h2>
            <p className="text-[#9FAEA1] font-light">
              Notexia provides study tools, AI assistant outputs, and peer notes on an &quot;as is&quot; basis without warranties of any kind. AI-generated revision cheat sheets should be cross-verified with official course syllabi and textbooks.
            </p>
          </section>

          {/* Contact Support */}
          <div className="rounded-2xl border border-[#F3F0E4]/15 bg-[#1A2D23] p-6 text-center space-y-2">
            <h3 className="text-base font-bold text-white">Questions Regarding Our Terms?</h3>
            <p className="text-xs text-[#9FAEA1]">Contact Legal Support at <a href="mailto:terms@notexia.in" className="text-[#F0C93B] font-bold hover:underline">terms@notexia.in</a></p>
          </div>
        </div>
      </main>
    </div>
  );
}
