import React from "react";
import Link from "next/link";
import { Shield, Lock, Eye, Database, UserCheck, Key, Server } from "lucide-react";
import { TrustHeader } from "@/components/public/TrustHeader";
import { TrustFooter } from "@/components/public/TrustFooter";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#16261D] text-[#F3F0E4] font-sans selection:bg-[#F0C93B]/30 flex flex-col antialiased">
      <TrustHeader title="PRIVACY POLICY" />

      <main className="max-w-4xl w-full mx-auto px-4 sm:px-6 py-12 space-y-10 flex-1">
        {/* Header Hero Section */}
        <div className="space-y-4 border-b border-[#F3F0E4]/15 pb-8">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#8FC3DE]/15 border border-[#8FC3DE]/30 text-[#8FC3DE] text-xs font-mono font-bold uppercase tracking-wider">
            <Shield className="size-3.5" /> LEGAL DOCUMENT
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight font-heading">
            Privacy Policy &amp; Data Protection Standards
          </h1>
          <p className="text-[#9FAEA1] text-sm sm:text-base leading-relaxed max-w-3xl font-light">
            Notexia is committed to protecting student privacy, academic research, and personal data. This Privacy Policy details how we collect, store, encrypt, and manage account credentials, study notes, AI query logs, and telemetry in compliance with Indian IT Rules and international privacy frameworks.
          </p>
          <div className="text-[11px] font-mono text-[#9FAEA1]/80">
            Last Updated: July 30, 2026 • Effective Date: January 1, 2026
          </div>
        </div>

        {/* Policy Content Cards */}
        <div className="space-y-8 text-sm leading-relaxed">
          {/* Section 1: Information Collection */}
          <section className="rounded-[2rem] bg-[#1A2D23]/90 border border-[#F3F0E4]/15 p-2 shadow-xl">
            <div className="rounded-[calc(2rem-0.5rem)] bg-[#121F18] p-6 sm:p-8 space-y-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2 font-heading">
                <Database className="size-5 text-[#8FC3DE]" /> 1. Information We Collect
              </h2>
              <p className="text-[#9FAEA1] font-light">
                To deliver collaborative note taking, 24/7 AI copilot answers, and community leaderboards, we collect the following categories of information:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-[#F3F0E4] font-light">
                <li>
                  <strong className="text-white font-bold">Account Credentials:</strong> Full name, email address, password hashes (bcrypt), and optional profile avatars when registering via Credentials or Google OAuth.
                </li>
                <li>
                  <strong className="text-white font-bold">Academic Content:</strong> Study notes, research drafts, published blogs, study group forum posts, and academic doubt queries created within the app.
                </li>
                <li>
                  <strong className="text-white font-bold">Platform Telemetry:</strong> Activity coin balances, read timestamps, IP address logs for security auditing, and system performance metrics used to compute batch rankings.
                </li>
              </ul>
            </div>
          </section>

          {/* Section 2: Data Usage & AI Training Policy */}
          <section className="rounded-[2rem] bg-[#1A2D23]/90 border border-[#F3F0E4]/15 p-2 shadow-xl">
            <div className="rounded-[calc(2rem-0.5rem)] bg-[#121F18] p-6 sm:p-8 space-y-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2 font-heading">
                <Eye className="size-5 text-[#F0C93B]" /> 2. How We Use Your Data &amp; AI Privacy
              </h2>
              <p className="text-[#9FAEA1] font-light">
                We process your data strictly to operate and improve Notexia. We never sell student personal data to third-party advertisers or data brokers.
              </p>
              <ul className="list-disc pl-6 space-y-2 text-[#F3F0E4] font-light">
                <li>Delivering AI study assistance, note synchronization, and real-time messaging.</li>
                <li>Computing community contribution ranks, scholar badges, and activity rewards.</li>
                <li>Detecting platform abuse, automated scraping, spam, and enforcing security controls.</li>
                <li>
                  <strong className="text-white font-bold">AI Query Isolation:</strong> Academic doubts submitted to the AI copilot are processed ephemerally via secure API proxies and are not used to train public LLM models without explicit opt-in.
                </li>
              </ul>
            </div>
          </section>

          {/* Section 3: Data Security & Encryption */}
          <section className="rounded-[2rem] bg-[#1A2D23]/90 border border-[#F3F0E4]/15 p-2 shadow-xl">
            <div className="rounded-[calc(2rem-0.5rem)] bg-[#121F18] p-6 sm:p-8 space-y-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2 font-heading">
                <Lock className="size-5 text-[#F28B6E]" /> 3. Data Security &amp; Storage Encryption
              </h2>
              <p className="text-[#9FAEA1] font-light">
                Notexia employs bank-grade security protocols across all stored records:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="p-4 rounded-xl bg-[#16261D] border border-[#F3F0E4]/10 space-y-1">
                  <div className="flex items-center gap-2 text-white font-bold text-xs">
                    <Server className="size-4 text-[#8FC3DE]" /> Storage at Rest
                  </div>
                  <p className="text-xs text-[#9FAEA1]">
                    MongoDB database collections are encrypted with AES-256 standards.
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-[#16261D] border border-[#F3F0E4]/10 space-y-1">
                  <div className="flex items-center gap-2 text-white font-bold text-xs">
                    <Key className="size-4 text-[#F0C93B]" /> Encryption in Transit
                  </div>
                  <p className="text-xs text-[#9FAEA1]">
                    All network traffic is encrypted using TLS 1.3 protocol.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Section 4: Rights & Deletion */}
          <section className="rounded-[2rem] bg-[#1A2D23]/90 border border-[#F3F0E4]/15 p-2 shadow-xl">
            <div className="rounded-[calc(2rem-0.5rem)] bg-[#121F18] p-6 sm:p-8 space-y-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2 font-heading">
                <UserCheck className="size-5 text-[#C9A9E0]" /> 4. Your Rights &amp; Full Data Control
              </h2>
              <p className="text-[#9FAEA1] font-light">
                You retain complete ownership of your study notes and published research:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-[#F3F0E4] font-light">
                <li>Export your notes and account data at any time.</li>
                <li>Modify or permanently delete any published note, draft, or comment.</li>
                <li>
                  Request full account deletion via settings or by contacting{" "}
                  <a href="mailto:support@notexia.cloud" className="text-[#8FC3DE] font-bold hover:underline">
                    support@notexia.cloud
                  </a>
                  . Account deletion permanently removes associated notes, folders, and message histories.
                </li>
              </ul>
            </div>
          </section>

          {/* Contact Support Card */}
          <div className="rounded-2xl border border-[#F3F0E4]/15 bg-[#1A2D23] p-6 text-center space-y-2 shadow-lg">
            <h3 className="text-base font-bold text-white font-heading">Questions Regarding Data Privacy?</h3>
            <p className="text-xs text-[#9FAEA1]">
              Reach out to our Data Protection Officer at{" "}
              <a href="mailto:support@notexia.cloud" className="text-[#8FC3DE] font-bold hover:underline">
                support@notexia.cloud
              </a>{" "}
              or submit a request via our{" "}
              <Link href="/contact" className="text-[#F0C93B] font-bold hover:underline">
                Contact Page
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
