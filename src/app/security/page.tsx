import React from "react";
import Link from "next/link";
import { ShieldCheck, ArrowLeft, Lock, Server, Key, AlertOctagon, Cpu } from "lucide-react";

export default function SecurityPage() {
  return (
    <div className="min-h-screen bg-[#16261D] text-[#F3F0E4] font-sans selection:bg-[#F0C93B]/30 flex flex-col antialiased">
      {/* Top Bar Navigation */}
      <header className="border-b border-[#F3F0E4]/15 bg-[#121F18]/90 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/feed" className="text-[#9FAEA1] hover:text-white flex items-center gap-2 text-xs font-semibold transition-colors">
            <ArrowLeft className="size-4 text-[#8FC3DE]" /> Back to Notexia
          </Link>
          <span className="text-sm font-bold tracking-widest text-[#F0C93B]" style={{ fontFamily: "var(--font-space-grotesk)" }}>
            NOTEXIA SECURITY
          </span>
        </div>
      </header>

      <main className="max-w-4xl w-full mx-auto px-6 py-12 space-y-10 flex-1">
        {/* Header Hero Section */}
        <div className="space-y-4 border-b border-[#F3F0E4]/15 pb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#3fb950]/15 border border-[#3fb950]/30 text-[#3fb950] text-xs font-mono font-bold uppercase tracking-wider">
            <ShieldCheck className="size-3.5" /> SYSTEM SECURITY
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight font-heading">
            Security Infrastructure &amp; Safeguards
          </h1>
          <p className="text-[#9FAEA1] text-sm sm:text-base leading-relaxed max-w-3xl font-light">
            Notexia prioritizes platform integrity, data encryption, and account protection. We engineer multi-layered security controls across our Next.js App Router infrastructure, MongoDB clusters, and Anthropic/Gemini AI integrations.
          </p>
          <div className="text-[11px] font-mono text-[#9FAEA1]/80">
            System Status: <span className="text-[#3fb950] font-bold">All Systems Operational</span> • Last Security Audit: July 2026
          </div>
        </div>

        {/* Security Feature Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {[
            {
              title: "TLS 1.3 & AES-256 Encryption",
              desc: "All traffic between your browser and Notexia servers is encrypted over TLS 1.3. Database storage on MongoDB Enterprise is protected with AES-256 encryption at rest.",
              icon: Lock,
              accent: "text-[#8FC3DE]",
              border: "border-[#8FC3DE]/30",
            },
            {
              title: "Auth.js & Secure OAuth 2.0",
              desc: "Authentication uses Auth.js with salted bcrypt password hashing and OAuth 2.0 Google sign-in. Session tokens are protected via HTTPS-only, same-site cookies.",
              icon: Key,
              accent: "text-[#F0C93B]",
              border: "border-[#F0C93B]/30",
            },
            {
              title: "Role-Based Access Control (RBAC)",
              desc: "Strict server-side permission checks enforce User, Teacher, and Admin access boundaries. Protected API endpoints enforce session gate validation on every request.",
              icon: Server,
              accent: "text-[#C9A9E0]",
              border: "border-[#C9A9E0]/30",
            },
            {
              title: "Automated Threat & Bot Protection",
              desc: "Next.js middleware enforces suspension checks, maintenance mode routing, and DDoS mitigation to prevent brute-force attacks and malicious content injection.",
              icon: AlertOctagon,
              accent: "text-[#F28B6E]",
              border: "border-[#F28B6E]/30",
            },
          ].map((item) => (
            <div key={item.title} className="rounded-2xl border border-[#F3F0E4]/15 bg-[#121F18] p-6 space-y-3 shadow-xl">
              <div className={`size-10 rounded-xl bg-[#0d1117] border ${item.border} flex items-center justify-center ${item.accent}`}>
                <item.icon className="size-5" />
              </div>
              <h2 className="text-base font-bold text-white">{item.title}</h2>
              <p className="text-xs text-[#9FAEA1] leading-relaxed font-light">{item.desc}</p>
            </div>
          ))}
        </div>

        {/* Responsible Vulnerability Disclosure */}
        <div className="rounded-2xl border border-[#F3F0E4]/15 bg-[#1A2D23] p-6 sm:p-8 space-y-4 shadow-xl">
          <h2 className="text-xl font-bold text-white flex items-center gap-2 font-heading">
            <Cpu className="size-5 text-[#8FC3DE]" /> Responsible Vulnerability Disclosure
          </h2>
          <p className="text-xs sm:text-sm text-[#9FAEA1] leading-relaxed font-light">
            We welcome independent security researchers to audit Notexia. If you discover a security flaw, vulnerability, or potential exploit in our API routes or authentication flows, please disclose it responsibly to our security team.
          </p>
          <div className="pt-2 flex items-center gap-2 text-xs font-mono">
            <span className="text-[#9FAEA1]">Report Vulnerabilities To:</span>
            <a href="mailto:security@notexia.in" className="text-[#3fb950] font-bold hover:underline">security@notexia.in</a>
          </div>
        </div>
      </main>
    </div>
  );
}
