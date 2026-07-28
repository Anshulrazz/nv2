import React from "react";
import Link from "next/link";
import { Shield, ArrowLeft, Lock, Eye, FileText, Database, UserCheck } from "lucide-react";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#16261D] text-[#F3F0E4] font-sans selection:bg-[#F0C93B]/30 flex flex-col antialiased">
      {/* Top Bar Navigation */}
      <header className="border-b border-[#F3F0E4]/15 bg-[#121F18]/90 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/feed" className="text-[#9FAEA1] hover:text-white flex items-center gap-2 text-xs font-semibold transition-colors">
            <ArrowLeft className="size-4 text-[#8FC3DE]" /> Back to Notexia
          </Link>
          <span className="text-sm font-bold tracking-widest text-[#F0C93B]" style={{ fontFamily: "var(--font-space-grotesk)" }}>
            NOTEXIA PRIVACY
          </span>
        </div>
      </header>

      <main className="max-w-4xl w-full mx-auto px-6 py-12 space-y-10 flex-1">
        {/* Header Hero Section */}
        <div className="space-y-4 border-b border-[#F3F0E4]/15 pb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#8FC3DE]/15 border border-[#8FC3DE]/30 text-[#8FC3DE] text-xs font-mono font-bold uppercase tracking-wider">
            <Shield className="size-3.5" /> LEGAL DOCUMENT
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight font-heading">
            Privacy Policy &amp; Data Protection Standards
          </h1>
          <p className="text-[#9FAEA1] text-sm sm:text-base leading-relaxed max-w-3xl font-light">
            Notexia is committed to protecting student privacy and personal data. This Privacy Policy details how we collect, store, encrypt, and manage account credentials, study notes, and platform analytics in compliance with global data privacy regulations.
          </p>
          <div className="text-[11px] font-mono text-[#9FAEA1]/80">
            Last Updated: July 28, 2026 • Effective Date: January 1, 2026
          </div>
        </div>

        {/* Policy Content Cards */}
        <div className="space-y-8 text-sm leading-relaxed">
          {/* Section 1: Information Collection */}
          <section className="rounded-2xl border border-[#F3F0E4]/15 bg-[#121F18] p-6 sm:p-8 space-y-4 shadow-xl">
            <h2 className="text-xl font-bold text-white flex items-center gap-2 font-heading">
              <Database className="size-5 text-[#8FC3DE]" /> 1. Information We Collect
            </h2>
            <p className="text-[#9FAEA1] font-light">
              To provide collaborative study features, AI copilot answers, and community rankings, we collect the following categories of information:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-[#F3F0E4] font-light">
              <li><strong className="text-white font-bold">Account Credentials:</strong> Name, email address, password hashes, and optional profile image when you sign up via Credentials or Google OAuth.</li>
              <li><strong className="text-white font-bold">Academic Content:</strong> Study notes, research drafts, published blogs, forum posts, and academic doubt queries you explicitly create.</li>
              <li><strong className="text-white font-bold">Platform Analytics:</strong> Activity points, coin balances, read timestamps, and system telemetry used to compute batch leaderboards and recommendations.</li>
            </ul>
          </section>

          {/* Section 2: Data Usage */}
          <section className="rounded-2xl border border-[#F3F0E4]/15 bg-[#121F18] p-6 sm:p-8 space-y-4 shadow-xl">
            <h2 className="text-xl font-bold text-white flex items-center gap-2 font-heading">
              <Eye className="size-5 text-[#F0C93B]" /> 2. How We Use Your Data
            </h2>
            <p className="text-[#9FAEA1] font-light">
              We process your data strictly to operate and improve Notexia. We never sell student personal data to third parties or data brokers.
            </p>
            <ul className="list-disc pl-6 space-y-2 text-[#F3F0E4] font-light">
              <li>Delivering AI study assistance, notes syncing, and real-time messaging via Pusher.</li>
              <li>Calculating community contribution ranks and activity rewards.</li>
              <li>Detecting platform abuse, spam, and enforcing account suspension gates.</li>
            </ul>
          </section>

          {/* Section 3: Data Security & Encryption */}
          <section className="rounded-2xl border border-[#F3F0E4]/15 bg-[#121F18] p-6 sm:p-8 space-y-4 shadow-xl">
            <h2 className="text-xl font-bold text-white flex items-center gap-2 font-heading">
              <Lock className="size-5 text-[#F28B6E]" /> 3. Data Security &amp; Encryption
            </h2>
            <p className="text-[#9FAEA1] font-light">
              Notexia employs industry-standard encryption protocols (TLS 1.3 in transit and AES-256 at rest) for all stored notes, credentials, and database records hosted on MongoDB clusters. Access to production data is restricted to authorized personnel only.
            </p>
          </section>

          {/* Section 4: Your Rights */}
          <section className="rounded-2xl border border-[#F3F0E4]/15 bg-[#121F18] p-6 sm:p-8 space-y-4 shadow-xl">
            <h2 className="text-xl font-bold text-white flex items-center gap-2 font-heading">
              <UserCheck className="size-5 text-[#C9A9E0]" /> 4. Your Rights &amp; Data Control
            </h2>
            <p className="text-[#9FAEA1] font-light">
              You retain complete ownership of your study notes and published research. You have the right to:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-[#F3F0E4] font-light">
              <li>Export your complete notes and account data in CSV or JSON format.</li>
              <li>Modify or permanently delete any published note, draft, or comment.</li>
              <li>Request full account deletion via your settings panel or privacy support.</li>
            </ul>
          </section>

          {/* Contact Support */}
          <div className="rounded-2xl border border-[#F3F0E4]/15 bg-[#1A2D23] p-6 text-center space-y-2">
            <h3 className="text-base font-bold text-white">Questions About Our Privacy Policy?</h3>
            <p className="text-xs text-[#9FAEA1]">Contact our Data Privacy team at <a href="mailto:privacy@notexia.in" className="text-[#8FC3DE] font-bold hover:underline">privacy@notexia.in</a></p>
          </div>
        </div>
      </main>
    </div>
  );
}
