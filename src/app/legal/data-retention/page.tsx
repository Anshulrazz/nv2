import React from "react";
import Link from "next/link";
import { HardDrive, Clock, Trash2, Database, ShieldAlert } from "lucide-react";
import { TrustHeader } from "@/components/public/TrustHeader";
import { TrustFooter } from "@/components/public/TrustFooter";
import { LegalNav } from "@/components/public/LegalNav";

export const metadata = {
  title: "Data Retention Policy",
  description:
    "Review Notexia's data retention schedules, note version history backups, AI prompt log deletion timelines, and 30-day account erasure workflows.",
};

export default function DataRetentionPage() {
  return (
    <div className="min-h-screen bg-[#16261D] text-[#F3F0E4] font-sans selection:bg-[#F0C93B]/30 flex flex-col antialiased">
      <TrustHeader title="DATA RETENTION" />
      <LegalNav />

      <main className="max-w-4xl w-full mx-auto px-4 sm:px-6 py-12 space-y-10 flex-1">
        {/* Header Hero Section */}
        <div className="space-y-4 border-b border-[#F3F0E4]/15 pb-8">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#8FC3DE]/15 border border-[#8FC3DE]/30 text-[#8FC3DE] text-xs font-mono font-bold uppercase tracking-wider">
            <HardDrive className="size-3.5" /> GOVERNANCE &amp; LIFECYCLE
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight font-heading">
            Data Retention &amp; Erasure Policy
          </h1>
          <p className="text-[#9FAEA1] text-sm sm:text-base leading-relaxed max-w-3xl font-light">
            This policy outlines how long Notexia stores account information, user notes, AI interaction logs, and system backups, as well as the procedure for permanent account data deletion under the DPDP Act 2023.
          </p>
          <div className="text-[11px] font-mono text-[#9FAEA1]/80">
            Last Updated: August 7, 2026 • Effective Date: January 1, 2026
          </div>
        </div>

        {/* Content Cards */}
        <div className="space-y-8 text-sm leading-relaxed">
          {/* Schedule Table */}
          <section className="rounded-[2rem] bg-[#1A2D23]/90 border border-[#F3F0E4]/15 p-2 shadow-xl">
            <div className="rounded-[calc(2rem-0.5rem)] bg-[#121F18] p-6 sm:p-8 space-y-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2 font-heading">
                <Clock className="size-5 text-[#F0C93B]" /> 1. Data Retention Schedules
              </h2>
              <div className="overflow-x-auto pt-2">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-[#F3F0E4]/15 text-[#F0C93B] font-mono">
                      <th className="py-2.5 px-3">Data Category</th>
                      <th className="py-2.5 px-3">Retention Period</th>
                      <th className="py-2.5 px-3">Lifecycle Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F3F0E4]/10 text-[#9FAEA1]">
                    <tr>
                      <td className="py-3 px-3 font-bold text-white">Active User Account Data</td>
                      <td className="py-3 px-3">Duration of active account + 30 days</td>
                      <td className="py-3 px-3">Permanently purged upon deletion request</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-3 font-bold text-white">Private Study Notes &amp; Drafts</td>
                      <td className="py-3 px-3">Until user manual deletion or account closure</td>
                      <td className="py-3 px-3">Cascading delete from storage &amp; MongoDB</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-3 font-bold text-white">AI Doubt Queries &amp; Summaries</td>
                      <td className="py-3 px-3">30 days ephemeral caching</td>
                      <td className="py-3 px-3">Automatically scrubbed from active logs</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-3 font-bold text-white">Billing &amp; Razorpay Transactions</td>
                      <td className="py-3 px-3">7 years (Mandatory tax/accounting compliance)</td>
                      <td className="py-3 px-3">Archived securely per Indian financial law</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          {/* Erasure Process */}
          <section className="rounded-[2rem] bg-[#1A2D23]/90 border border-[#F3F0E4]/15 p-2 shadow-xl">
            <div className="rounded-[calc(2rem-0.5rem)] bg-[#121F18] p-6 sm:p-8 space-y-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2 font-heading">
                <Trash2 className="size-5 text-[#F28B6E]" /> 2. Permanent Account &amp; Data Erasure
              </h2>
              <p className="text-[#9FAEA1] font-light">
                When you initiate an account deletion request through user settings or via our Grievance Officer:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-[#F3F0E4] font-light">
                <li>Your profile credentials, saved notes, folders, and message history are immediately soft-deleted and queued for hard purge.</li>
                <li>All user-generated data across production databases is permanently deleted within 30 calendar days.</li>
                <li>Encrypted database backup snapshots rotate and overwrite within 60 days.</li>
              </ul>
            </div>
          </section>

          {/* Contact Support */}
          <div className="rounded-2xl border border-[#F3F0E4]/15 bg-[#1A2D23] p-6 text-center space-y-2 shadow-lg">
            <h3 className="text-base font-bold text-white font-heading">Need to Request Account Data Purge?</h3>
            <p className="text-xs text-[#9FAEA1]">
              Submit your request to our{" "}
              <Link href="/legal/grievance-redressal" className="text-[#F0C93B] font-bold hover:underline">
                Grievance Officer
              </Link>{" "}
              or email{" "}
              <a href="mailto:info@notexia.cloud" className="text-[#8FC3DE] font-bold hover:underline">
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
