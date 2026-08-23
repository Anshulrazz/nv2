import React from "react";
import Link from "next/link";
import { TrustHeader } from "@/components/public/TrustHeader";
import { TrustFooter } from "@/components/public/TrustFooter";
import { LegalNav } from "@/components/public/LegalNav";
import { LEGAL_PAGES } from "@/lib/legal-data";
import { Scale, ArrowRight, ShieldCheck, FileCheck } from "lucide-react";

export default function LegalHubPage() {
  return (
    <div className="min-h-screen bg-transparent text-[#FAFAF8] font-sans selection:bg-[#F5B429]/30 flex flex-col antialiased">
      <TrustHeader title="LEGAL HUB" />
      <LegalNav />

      <main className="max-w-5xl w-full mx-auto px-4 sm:px-6 py-12 space-y-12 flex-1">
        {/* Hero Section */}
        <div className="space-y-4 border-b border-[#F3F0E4]/15 pb-8 text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#F0C93B]/15 border border-[#F0C93B]/30 text-[#F0C93B] text-xs font-mono font-bold uppercase tracking-wider">
            <Scale className="size-3.5" /> OFFICIAL COMPLIANCE CENTER
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight font-heading">
            Legal &amp; Regulatory Policies
          </h1>
          <p className="text-[#9FAEA1] text-sm sm:text-base leading-relaxed font-light">
            Welcome to the Notexia Legal Hub. We are committed to transparency, user data privacy, academic integrity, bank-grade platform security, and Indian IT &amp; DPDP compliance.
          </p>
        </div>

        {/* Legal Policy Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {LEGAL_PAGES.map((policy) => {
            const Icon = policy.icon;
            return (
              <Link
                key={policy.href}
                href={policy.href}
                className="group rounded-[2rem] bg-[#1A2D23]/90 border border-[#F3F0E4]/15 p-2 shadow-xl hover:border-[#F0C93B]/40 transition-all duration-300"
              >
                <div className="rounded-[calc(2rem-0.5rem)] bg-[#121F18] p-6 space-y-3 h-full flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="size-10 rounded-xl bg-[#8FC3DE]/15 border border-[#8FC3DE]/30 flex items-center justify-center text-[#8FC3DE] group-hover:bg-[#F0C93B]/20 group-hover:text-[#F0C93B] group-hover:border-[#F0C93B]/40 transition-colors">
                        <Icon className="size-5" />
                      </div>
                      <ArrowRight className="size-4 text-[#9FAEA1] group-hover:text-[#F0C93B] group-hover:translate-x-1 transition-all" />
                    </div>
                    <h2 className="text-xl font-bold text-white group-hover:text-[#F0C93B] transition-colors font-heading">
                      {policy.label}
                    </h2>
                  </div>
                  <p className="text-xs text-[#9FAEA1] font-light leading-relaxed">
                    {policy.description}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Trust & Transparency Banner */}
        <div className="rounded-[2.5rem] bg-[#1A2D23] border border-[#F3F0E4]/15 p-8 text-center space-y-4 shadow-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#8FC3DE]/15 border border-[#8FC3DE]/30 text-[#8FC3DE] text-xs font-mono font-bold">
            <ShieldCheck className="size-4 text-[#F0C93B]" /> INDIAN IT RULES 2021 &amp; DPDP ACT 2023 COMPLIANT
          </div>
          <h3 className="text-2xl font-bold text-white font-heading">Need Legal Clarification or Support?</h3>
          <p className="text-sm text-[#9FAEA1] max-w-xl mx-auto font-light">
            Our legal compliance team and designated Grievance Officer respond to legal inquiries within 36 hours.
          </p>
          <div className="pt-2 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/legal/grievance-redressal"
              className="px-6 py-2.5 rounded-full bg-[#F0C93B] text-[#121F18] font-bold text-xs hover:bg-[#e0bb34] transition-colors inline-flex items-center gap-2 shadow-lg"
            >
              <FileCheck className="size-4" /> Grievance Officer Details
            </Link>
            <Link
              href="/contact"
              className="px-6 py-2.5 rounded-full bg-[#121F18] border border-[#F3F0E4]/20 text-white font-medium text-xs hover:bg-white/5 transition-colors"
            >
              Contact Legal Support
            </Link>
          </div>
        </div>
      </main>

      <TrustFooter />
    </div>
  );
}
