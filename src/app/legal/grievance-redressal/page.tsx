import React from "react";
import Link from "next/link";
import { AlertCircle, Shield, Mail, Phone, MapPin, Clock, FileCheck } from "lucide-react";
import { TrustHeader } from "@/components/public/TrustHeader";
import { TrustFooter } from "@/components/public/TrustFooter";
import { LegalNav } from "@/components/public/LegalNav";

export const metadata = {
  title: "Grievance Redressal Officer & Mechanism",
  description:
    "Designated Grievance Redressal Officer details under Indian IT Intermediary Rules 2021 and DPDP Act 2023. Submit formal legal, privacy, or content complaints.",
};

export default function GrievanceRedressalPage() {
  return (
    <div className="min-h-screen bg-[#16261D] text-[#F3F0E4] font-sans selection:bg-[#F0C93B]/30 flex flex-col antialiased">
      <TrustHeader title="GRIEVANCE REDRESSAL" />
      <LegalNav />

      <main className="max-w-4xl w-full mx-auto px-4 sm:px-6 py-12 space-y-10 flex-1">
        {/* Header Hero Section */}
        <div className="space-y-4 border-b border-[#F3F0E4]/15 pb-8">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#F0C93B]/15 border border-[#F0C93B]/30 text-[#F0C93B] text-xs font-mono font-bold uppercase tracking-wider">
            <AlertCircle className="size-3.5" /> STATUTORY COMPLIANCE
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight font-heading">
            Grievance Redressal Officer &amp; Mechanism
          </h1>
          <p className="text-[#9FAEA1] text-sm sm:text-base leading-relaxed max-w-3xl font-light">
            In accordance with Rule 3(2) of the Information Technology (Intermediary Guidelines and Digital Media Ethics Code) Rules, 2021 and the Digital Personal Data Protection (DPDP) Act 2023, the details of the Grievance Redressal Officer for Notexia are published below.
          </p>
          <div className="text-[11px] font-mono text-[#9FAEA1]/80">
            Last Updated: August 7, 2026 • Effective Date: January 1, 2026
          </div>
        </div>

        {/* Content Cards */}
        <div className="space-y-8 text-sm leading-relaxed">
          {/* Officer Details Card */}
          <section className="rounded-[2rem] bg-[#1A2D23]/90 border border-[#F0C93B]/30 p-2 shadow-2xl">
            <div className="rounded-[calc(2rem-0.5rem)] bg-[#121F18] p-6 sm:p-8 space-y-6">
              <div className="flex items-center justify-between border-b border-[#F3F0E4]/10 pb-4">
                <div>
                  <h2 className="text-xl font-bold text-white font-heading">Designated Grievance Officer</h2>
                  <p className="text-xs text-[#F0C93B] font-mono font-bold uppercase">Notexia Digital Platforms</p>
                </div>
                <div className="px-3 py-1 rounded-full bg-[#F0C93B]/15 border border-[#F0C93B]/30 text-[#F0C93B] text-xs font-mono">
                  NODAL OFFICER
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-xl bg-[#16261D] border border-[#F3F0E4]/10 space-y-1">
                  <span className="text-[#9FAEA1] font-mono uppercase text-[10px] block">Officer Name</span>
                  <span className="text-white font-bold text-sm block">Legal &amp; Compliance Cell</span>
                </div>
                <div className="p-4 rounded-xl bg-[#16261D] border border-[#F3F0E4]/10 space-y-1">
                  <span className="text-[#9FAEA1] font-mono uppercase text-[10px] block">Direct Email</span>
                  <a href="mailto:info@notexia.cloud" className="text-[#F0C93B] font-bold text-sm block hover:underline">
                    info@notexia.cloud
                  </a>
                </div>
                <div className="p-4 rounded-xl bg-[#16261D] border border-[#F3F0E4]/10 space-y-1 sm:col-span-2">
                  <span className="text-[#9FAEA1] font-mono uppercase text-[10px] block">Official Address</span>
                  <span className="text-white font-medium block">
                    Notexia Digital Technologies, Legal Department, New Delhi, India – 110001
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* Workflow & SLAs */}
          <section className="rounded-[2rem] bg-[#1A2D23]/90 border border-[#F3F0E4]/15 p-2 shadow-xl">
            <div className="rounded-[calc(2rem-0.5rem)] bg-[#121F18] p-6 sm:p-8 space-y-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2 font-heading">
                <Clock className="size-5 text-[#8FC3DE]" /> Resolution Timelines &amp; Response SLAs
              </h2>
              <ul className="space-y-3 text-[#F3F0E4] font-light">
                <li className="p-4 rounded-xl bg-[#16261D] border border-[#F3F0E4]/10 flex items-start gap-3">
                  <FileCheck className="size-5 text-[#F0C93B] shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white font-bold block">36-Hour Acknowledgement:</strong> Every formal grievance submission receives an official ticket reference ID within 36 hours of receipt.
                  </div>
                </li>
                <li className="p-4 rounded-xl bg-[#16261D] border border-[#F3F0E4]/10 flex items-start gap-3">
                  <Shield className="size-5 text-[#8FC3DE] shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white font-bold block">15-Day Resolution Guarantee:</strong> All valid grievances, privacy data requests, or content removal appeals are thoroughly investigated and resolved within 15 days.
                  </div>
                </li>
              </ul>
            </div>
          </section>

          {/* How to file */}
          <section className="rounded-[2rem] bg-[#1A2D23]/90 border border-[#F3F0E4]/15 p-2 shadow-xl">
            <div className="rounded-[calc(2rem-0.5rem)] bg-[#121F18] p-6 sm:p-8 space-y-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2 font-heading">
                <Mail className="size-5 text-[#C9A9E0]" /> How to File a Grievance
              </h2>
              <p className="text-[#9FAEA1] font-light">
                To help us resolve your concern quickly, please include the following details in your email:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-[#F3F0E4] font-light">
                <li>Your full legal name, phone number, and registered Notexia email address.</li>
                <li>Specific description of the grievance (Content violation, privacy issue, account access, or legal notice).</li>
                <li>Exact URLs or content identifiers on Notexia associated with the complaint.</li>
                <li>Supporting proof or documentation where applicable.</li>
              </ul>
            </div>
          </section>

          {/* Contact Support */}
          <div className="rounded-2xl border border-[#F3F0E4]/15 bg-[#1A2D23] p-6 text-center space-y-2 shadow-lg">
            <h3 className="text-base font-bold text-white font-heading">Need Assistance?</h3>
            <p className="text-xs text-[#9FAEA1]">
              Email our Nodal Grievance Team directly at{" "}
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
