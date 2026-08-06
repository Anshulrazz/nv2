import React from "react";
import Link from "next/link";
import { FileText, ShieldAlert, Scale, Send, CheckCircle2 } from "lucide-react";
import { TrustHeader } from "@/components/public/TrustHeader";
import { TrustFooter } from "@/components/public/TrustFooter";
import { LegalNav } from "@/components/public/LegalNav";

export const metadata = {
  title: "Copyright & DMCA Policy",
  description:
    "Review Notexia's Copyright, DMCA Takedown, and Intellectual Property Policy. Learn how to submit copyright infringement notices and counter-notifications.",
};

export default function CopyrightDMCAPage() {
  return (
    <div className="min-h-screen bg-[#16261D] text-[#F3F0E4] font-sans selection:bg-[#F0C93B]/30 flex flex-col antialiased">
      <TrustHeader title="COPYRIGHT &amp; DMCA" />
      <LegalNav />

      <main className="max-w-4xl w-full mx-auto px-4 sm:px-6 py-12 space-y-10 flex-1">
        {/* Header Hero Section */}
        <div className="space-y-4 border-b border-[#F3F0E4]/15 pb-8">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#F0C93B]/15 border border-[#F0C93B]/30 text-[#F0C93B] text-xs font-mono font-bold uppercase tracking-wider">
            <FileText className="size-3.5" /> INTELLECTUAL PROPERTY
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight font-heading">
            Copyright &amp; DMCA Takedown Policy
          </h1>
          <p className="text-[#9FAEA1] text-sm sm:text-base leading-relaxed max-w-3xl font-light">
            Notexia respects intellectual property rights and expects its users to do the same. In compliance with the Digital Millennium Copyright Act (DMCA) and Indian Copyright Act 1957, we respond promptly to notices of alleged copyright infringement.
          </p>
          <div className="text-[11px] font-mono text-[#9FAEA1]/80">
            Last Updated: August 7, 2026 • Effective Date: January 1, 2026
          </div>
        </div>

        {/* Content Cards */}
        <div className="space-y-8 text-sm leading-relaxed">
          {/* DMCA Notice Requirements */}
          <section className="rounded-[2rem] bg-[#1A2D23]/90 border border-[#F3F0E4]/15 p-2 shadow-xl">
            <div className="rounded-[calc(2rem-0.5rem)] bg-[#121F18] p-6 sm:p-8 space-y-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2 font-heading">
                <Send className="size-5 text-[#8FC3DE]" /> 1. Submitting a DMCA Takedown Notice
              </h2>
              <p className="text-[#9FAEA1] font-light">
                If you believe your copyrighted work (e.g. textbook, original paper, lecture slides) has been uploaded to Notexia without authorization, please send a written notice containing:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-[#F3F0E4] font-light">
                <li>Physical or electronic signature of the copyright owner or authorized representative.</li>
                <li>Identification of the copyrighted work claimed to have been infringed.</li>
                <li>Exact URLs or note links where the infringing material is located on Notexia.</li>
                <li>Your contact details: full legal name, email address, telephone number, and physical mailing address.</li>
                <li>A statement that you have a good faith belief that use of the material is not authorized by the copyright owner.</li>
                <li>A statement under penalty of perjury that the information in the notification is accurate.</li>
              </ul>
            </div>
          </section>

          {/* Repeat Infringer Policy */}
          <section className="rounded-[2rem] bg-[#1A2D23]/90 border border-[#F3F0E4]/15 p-2 shadow-xl">
            <div className="rounded-[calc(2rem-0.5rem)] bg-[#121F18] p-6 sm:p-8 space-y-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2 font-heading">
                <ShieldAlert className="size-5 text-[#F28B6E]" /> 2. Repeat Infringer Account Termination
              </h2>
              <p className="text-[#9FAEA1] font-light">
                Notexia enforces a strict repeat infringer policy. Accounts receiving multiple verified copyright infringement notices will suffer immediate note publishing revocation, coin forfeiture, and permanent account termination.
              </p>
            </div>
          </section>

          {/* Designated Agent */}
          <div className="rounded-2xl border border-[#F3F0E4]/15 bg-[#1A2D23] p-6 text-center space-y-2 shadow-lg">
            <h3 className="text-base font-bold text-white font-heading">Designated Copyright Agent</h3>
            <p className="text-xs text-[#9FAEA1]">
              Submit DMCA Takedown notices to:{" "}
              <a href="mailto:info@notexia.cloud" className="text-[#F0C93B] font-bold hover:underline">
                info@notexia.cloud
              </a>{" "}
              (Attn: Copyright Compliance Agent).
            </p>
          </div>
        </div>
      </main>

      <TrustFooter />
    </div>
  );
}
