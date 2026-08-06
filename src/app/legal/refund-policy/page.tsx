import React from "react";
import Link from "next/link";
import { RefreshCw, CreditCard, CheckCircle2, AlertTriangle, ShieldCheck } from "lucide-react";
import { TrustHeader } from "@/components/public/TrustHeader";
import { TrustFooter } from "@/components/public/TrustFooter";
import { LegalNav } from "@/components/public/LegalNav";

export const metadata = {
  title: "Refund & Cancellation Policy",
  description:
    "Review Notexia's refund guarantee, 7-day subscription cancellation policy, Razorpay billing details, and digital token policies.",
};

export default function RefundPolicyPage() {
  return (
    <div className="min-h-screen bg-[#16261D] text-[#F3F0E4] font-sans selection:bg-[#F0C93B]/30 flex flex-col antialiased">
      <TrustHeader title="REFUND POLICY" />
      <LegalNav />

      <main className="max-w-4xl w-full mx-auto px-4 sm:px-6 py-12 space-y-10 flex-1">
        {/* Header Hero Section */}
        <div className="space-y-4 border-b border-[#F3F0E4]/15 pb-8">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#F0C93B]/15 border border-[#F0C93B]/30 text-[#F0C93B] text-xs font-mono font-bold uppercase tracking-wider">
            <RefreshCw className="size-3.5" /> BILLING &amp; GUARANTEE
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight font-heading">
            Refund, Cancellation &amp; Billing Policy
          </h1>
          <p className="text-[#9FAEA1] text-sm sm:text-base leading-relaxed max-w-3xl font-light">
            We want you to be completely satisfied with Notexia Premium services. This policy outlines subscription cancellation terms, refund eligibility criteria, step-by-step submission instructions, and Razorpay processing guidelines.
          </p>
          <div className="text-[11px] font-mono text-[#9FAEA1]/80">
            Last Updated: August 7, 2026 • Effective Date: January 1, 2026
          </div>
        </div>

        {/* Content Cards */}
        <div className="space-y-8 text-sm leading-relaxed">
          {/* 7-Day Guarantee */}
          <section className="rounded-[2rem] bg-[#1A2D23]/90 border border-[#F3F0E4]/15 p-2 shadow-xl">
            <div className="rounded-[calc(2rem-0.5rem)] bg-[#121F18] p-6 sm:p-8 space-y-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2 font-heading">
                <ShieldCheck className="size-5 text-[#F0C93B]" /> 1. 7-Day Refund Guarantee
              </h2>
              <p className="text-[#9FAEA1] font-light">
                If you purchase a Notexia Premium subscription for the first time and are dissatisfied for any reason, you are eligible for a 100% full refund within 7 calendar days of purchase.
              </p>
              <ul className="list-disc pl-6 space-y-2 text-[#F3F0E4] font-light">
                <li>Refund request must be submitted within 7 days of the initial subscription transaction date.</li>
                <li>Refunds are processed back to the original payment method (UPI, Net Banking, Debit/Credit Card) via Razorpay within 5–7 business days.</li>
              </ul>
            </div>
          </section>

          {/* Cancellation */}
          <section className="rounded-[2rem] bg-[#1A2D23]/90 border border-[#F3F0E4]/15 p-2 shadow-xl">
            <div className="rounded-[calc(2rem-0.5rem)] bg-[#121F18] p-6 sm:p-8 space-y-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2 font-heading">
                <CreditCard className="size-5 text-[#8FC3DE]" /> 2. Subscription Cancellation
              </h2>
              <p className="text-[#9FAEA1] font-light">
                You can cancel your recurring monthly or yearly subscription at any time directly through your Notexia Account Billing settings or by contacting billing support. Upon cancellation, your premium benefits remain active until the end of your current billing period.
              </p>
            </div>
          </section>

          {/* Non-Refundable Items */}
          <section className="rounded-[2rem] bg-[#1A2D23]/90 border border-[#F3F0E4]/15 p-2 shadow-xl">
            <div className="rounded-[calc(2rem-0.5rem)] bg-[#121F18] p-6 sm:p-8 space-y-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2 font-heading">
                <AlertTriangle className="size-5 text-[#F28B6E]" /> 3. Non-Refundable Items
              </h2>
              <ul className="list-disc pl-6 space-y-2 text-[#F3F0E4] font-light">
                <li>Activity coins earned or granted through community participation have no cash value and cannot be refunded or exchanged for money.</li>
                <li>Subscriptions cancelled after the 7-day initial guarantee period will not receive prorated partial refunds for the remainder of the billing cycle.</li>
              </ul>
            </div>
          </section>

          {/* Contact Support */}
          <div className="rounded-2xl border border-[#F3F0E4]/15 bg-[#1A2D23] p-6 text-center space-y-2 shadow-lg">
            <h3 className="text-base font-bold text-white font-heading">Submit a Billing or Refund Request</h3>
            <p className="text-xs text-[#9FAEA1]">
              Contact Billing Support at{" "}
              <a href="mailto:info@notexia.cloud" className="text-[#F0C93B] font-bold hover:underline">
                info@notexia.cloud
              </a>{" "}
              with your transaction ID and registered email address.
            </p>
          </div>
        </div>
      </main>

      <TrustFooter />
    </div>
  );
}
