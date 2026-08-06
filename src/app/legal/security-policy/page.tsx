import React from "react";
import Link from "next/link";
import { Lock, Shield, Server, Key, AlertOctagon, Terminal } from "lucide-react";
import { TrustHeader } from "@/components/public/TrustHeader";
import { TrustFooter } from "@/components/public/TrustFooter";
import { LegalNav } from "@/components/public/LegalNav";

export const metadata = {
  title: "Security & Vulnerability Policy",
  description:
    "Explore Notexia's enterprise security architecture, AES-256 database encryption, TLS 1.3 in transit, and vulnerability disclosure guidelines.",
};

export default function SecurityPolicyPage() {
  return (
    <div className="min-h-screen bg-[#16261D] text-[#F3F0E4] font-sans selection:bg-[#F0C93B]/30 flex flex-col antialiased">
      <TrustHeader title="SECURITY POLICY" />
      <LegalNav />

      <main className="max-w-4xl w-full mx-auto px-4 sm:px-6 py-12 space-y-10 flex-1">
        {/* Header Hero Section */}
        <div className="space-y-4 border-b border-[#F3F0E4]/15 pb-8">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#8FC3DE]/15 border border-[#8FC3DE]/30 text-[#8FC3DE] text-xs font-mono font-bold uppercase tracking-wider">
            <Lock className="size-3.5" /> BANK-GRADE INFRASTRUCTURE
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight font-heading">
            Platform Security &amp; Vulnerability Policy
          </h1>
          <p className="text-[#9FAEA1] text-sm sm:text-base leading-relaxed max-w-3xl font-light">
            Notexia prioritizes student data safety and academic research confidentiality. We implement strict defense-in-depth security standards to protect users against unauthorized access, data leaks, and cyber threats.
          </p>
          <div className="text-[11px] font-mono text-[#9FAEA1]/80">
            Last Updated: August 7, 2026 • Effective Date: January 1, 2026
          </div>
        </div>

        {/* Content Cards */}
        <div className="space-y-8 text-sm leading-relaxed">
          {/* Controls */}
          <section className="rounded-[2rem] bg-[#1A2D23]/90 border border-[#F3F0E4]/15 p-2 shadow-xl">
            <div className="rounded-[calc(2rem-0.5rem)] bg-[#121F18] p-6 sm:p-8 space-y-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2 font-heading">
                <Shield className="size-5 text-[#F0C93B]" /> 1. Core Security Controls
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="p-4 rounded-xl bg-[#16261D] border border-[#F3F0E4]/10 space-y-1">
                  <div className="flex items-center gap-2 text-white font-bold text-xs">
                    <Server className="size-4 text-[#8FC3DE]" /> Encryption at Rest
                  </div>
                  <p className="text-xs text-[#9FAEA1]">
                    MongoDB clusters and backups are encrypted with AES-256 standards. User passwords are salted and hashed using bcrypt (10 rounds).
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-[#16261D] border border-[#F3F0E4]/10 space-y-1">
                  <div className="flex items-center gap-2 text-white font-bold text-xs">
                    <Key className="size-4 text-[#F0C93B]" /> Transport Encryption
                  </div>
                  <p className="text-xs text-[#9FAEA1]">
                    Strict HTTPS enforcement with TLS 1.3 encryption across all website routes, websocket instances, and API endpoints.
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-[#16261D] border border-[#F3F0E4]/10 space-y-1">
                  <div className="flex items-center gap-2 text-white font-bold text-xs">
                    <AlertOctagon className="size-4 text-[#F28B6E]" /> Rate Limiting &amp; DDoS Protection
                  </div>
                  <p className="text-xs text-[#9FAEA1]">
                    Cloudflare edge firewall filtering, automated IP rate limits, and brute-force mitigation on authentication routes.
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-[#16261D] border border-[#F3F0E4]/10 space-y-1">
                  <div className="flex items-center gap-2 text-white font-bold text-xs">
                    <Terminal className="size-4 text-[#C9A9E0]" /> Continuous Monitoring
                  </div>
                  <p className="text-xs text-[#9FAEA1]">
                    Real-time error logging, anomalous traffic detection, and security audit telemetry.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Vulnerability Disclosure */}
          <section className="rounded-[2rem] bg-[#1A2D23]/90 border border-[#F3F0E4]/15 p-2 shadow-xl">
            <div className="rounded-[calc(2rem-0.5rem)] bg-[#121F18] p-6 sm:p-8 space-y-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2 font-heading">
                <Terminal className="size-5 text-[#8FC3DE]" /> 2. Responsible Vulnerability Disclosure
              </h2>
              <p className="text-[#9FAEA1] font-light">
                We welcome ethical security researchers to test and report vulnerabilities responsibly. If you discover a security vulnerability on Notexia, please email us directly before public disclosure.
              </p>
              <ul className="list-disc pl-6 space-y-2 text-[#F3F0E4] font-light">
                <li>Email details to: <a href="mailto:info@notexia.cloud" className="text-[#F0C93B] font-bold hover:underline">info@notexia.cloud</a></li>
                <li>Provide reproduction steps, proof-of-concept, and affected endpoint URLs.</li>
                <li>Do not access or alter user data without permission during security testing.</li>
              </ul>
            </div>
          </section>

          {/* Contact Support */}
          <div className="rounded-2xl border border-[#F3F0E4]/15 bg-[#1A2D23] p-6 text-center space-y-2 shadow-lg">
            <h3 className="text-base font-bold text-white font-heading">Report a Security Emergency?</h3>
            <p className="text-xs text-[#9FAEA1]">
              Contact Security Engineering immediately at{" "}
              <a href="mailto:info@notexia.cloud" className="text-[#F0C93B] font-bold hover:underline">
                info@notexia.cloud
              </a>
              .
            </p>
          </div>
        </div>
      </main>

      <TrustFooter />
    </div>
  );
}
