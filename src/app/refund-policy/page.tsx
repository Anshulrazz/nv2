import React from "react";
import Link from "next/link";
import { CreditCard, RefreshCw, AlertCircle, CheckCircle2, Clock } from "lucide-react";
import { TrustHeader } from "@/components/public/TrustHeader";
import { TrustFooter } from "@/components/public/TrustFooter";

export default function RefundPolicyPage() {
  return (
    <div className="min-h-screen bg-[#16261D] text-[#F3F0E4] font-sans selection:bg-[#F0C93B]/30 flex flex-col antialiased">
      <TrustHeader title="REFUND POLICY" />

      <main className="max-w-4xl w-full mx-auto px-4 sm:px-6 py-12 space-y-10 flex-1">
        {/* Header Hero Section */}
        <div className="space-y-4 border-b border-[#F3F0E4]/15 pb-8">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#F0C93B]/15 border border-[#F0C93B]/30 text-[#F0C93B] text-xs font-mono font-bold uppercase tracking-wider">
            <CreditCard className="size-3.5" /> BILLING GUARANTEE
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight font-heading">
            Refund &amp; Cancellation Policy
          </h1>
          <p className="text-[#9FAEA1] text-sm sm:text-base leading-relaxed max-w-3xl font-light">
            We want you to be completely satisfied with Notexia Premium services. This policy outlines subscription cancellation terms, refund eligibility criteria, and step-by-step instructions for submitting billing requests.
          </p>
          <div className="text-[11px] font-mono text-[#9FAEA1]/80">
            Last Updated: July 30, 2026 • Effective Date: January 1, 2026
          </div>
        </div>

        {/* Policy Content Cards */}
        <div className="space-y-8 text-sm leading-relaxed">
          {/* Section 1: 7-Day Money-Back Guarantee */}
          <section className="rounded-[2rem] bg-[#1A2D23]/90 border border-[#F3F0E4]/15 p-2 shadow-xl">
            <div className="rounded-[calc(2rem-0.5rem)] bg-[#121F18] p-6 sm:p-8 space-y-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2 font-heading">
                <CheckCircle2 className="size-5 text-[#8FC3DE]" /> 1. 7-Day Money-Back Guarantee
              </h2>
              <p className="text-[#9FAEA1] font-light">
                All new <strong className="text-white">Notexia Premium &amp; Pro Plan</strong> monthly or annual subscriptions are backed by our <strong className="text-[#F0C93B]">7-Day Full Refund Guarantee</strong>. If you are not satisfied with your subscription for any reason:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-[#F3F0E4] font-light">
                <li>Submit a refund request within 7 calendar days of your initial subscription purchase.</li>
                <li>Your request will be processed with a 100% full refund returned to your original payment method.</li>
                <li>No questions asked for initial 7-day requests.</li>
              </ul>
            </div>
          </section>

          {/* Section 2: Non-Refundable Digital Items */}
          <section className="rounded-[2rem] bg-[#1A2D23]/90 border border-[#F3F0E4]/15 p-2 shadow-xl">
            <div className="rounded-[calc(2rem-0.5rem)] bg-[#121F18] p-6 sm:p-8 space-y-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2 font-heading">
                <AlertCircle className="size-5 text-[#F28B6E]" /> 2. Non-Refundable Purchases
              </h2>
              <p className="text-[#9FAEA1] font-light">
                The following digital products are non-refundable once consumed or activated:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-[#F3F0E4] font-light">
                <li>
                  <strong className="text-white font-bold">Activity Coin Packs &amp; AI Tokens:</strong> Coin packages or AI token top-ups that have already been used for AI doubt queries or feature unlocks cannot be refunded.
                </li>
                <li>
                  <strong className="text-white font-bold">Renewal Billings Past 7 Days:</strong> Recurring subscription renewals requested past the 7-day window are non-refundable, but cancellation will stop future recurring charges immediately.
                </li>
              </ul>
            </div>
          </section>

          {/* Section 3: Subscription Cancellation Steps */}
          <section className="rounded-[2rem] bg-[#1A2D23]/90 border border-[#F3F0E4]/15 p-2 shadow-xl">
            <div className="rounded-[calc(2rem-0.5rem)] bg-[#121F18] p-6 sm:p-8 space-y-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2 font-heading">
                <RefreshCw className="size-5 text-[#F0C93B]" /> 3. How to Cancel Recurring Subscriptions
              </h2>
              <p className="text-[#9FAEA1] font-light">
                You can cancel your Notexia Premium subscription at any time without penalty:
              </p>
              <ol className="list-decimal pl-6 space-y-2 text-[#F3F0E4] font-light">
                <li>Log in to your account and open your <strong className="text-white">Account Settings</strong> panel.</li>
                <li>Navigate to the <strong className="text-white">Billing &amp; Subscriptions</strong> tab.</li>
                <li>Click <strong className="text-[#F28B6E]">Cancel Subscription</strong>.</li>
              </ol>
              <p className="text-xs text-[#9FAEA1] pt-1">
                Upon cancellation, you will retain Premium benefits until the end of your current paid billing period. You will not be charged again.
              </p>
            </div>
          </section>

          {/* Section 4: Refund Request Process & Timeline */}
          <section className="rounded-[2rem] bg-[#1A2D23]/90 border border-[#F3F0E4]/15 p-2 shadow-xl">
            <div className="rounded-[calc(2rem-0.5rem)] bg-[#121F18] p-6 sm:p-8 space-y-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2 font-heading">
                <Clock className="size-5 text-[#C9A9E0]" /> 4. How to Request a Refund &amp; Processing Window
              </h2>
              <p className="text-[#9FAEA1] font-light">
                To request a refund within the 7-day guarantee window:
              </p>
              <div className="p-4 rounded-xl bg-[#16261D] border border-[#F3F0E4]/10 space-y-3">
                <p className="text-xs text-[#F3F0E4]">
                  Send an email to <a href="mailto:support@notexia.cloud" className="text-[#8FC3DE] font-bold hover:underline">support@notexia.cloud</a> or use our <Link href="/contact" className="text-[#F0C93B] font-bold hover:underline">Contact Form</Link> with:
                </p>
                <ul className="list-disc pl-5 text-xs text-[#9FAEA1] space-y-1">
                  <li>Your registered Notexia account email address</li>
                  <li>Transaction reference number or invoice ID</li>
                  <li>Reason for refund request (optional)</li>
                </ul>
              </div>
              <p className="text-xs text-[#9FAEA1]">
                Approved refunds are credited back to your original payment method (UPI, credit/debit card, or net banking) within <strong className="text-white">5 to 7 business days</strong> depending on your banking provider.
              </p>
            </div>
          </section>

          {/* Contact Support */}
          <div className="rounded-2xl border border-[#F3F0E4]/15 bg-[#1A2D23] p-6 text-center space-y-2 shadow-lg">
            <h3 className="text-base font-bold text-white font-heading">Need Help With Your Subscription?</h3>
            <p className="text-xs text-[#9FAEA1]">
              Contact our Billing Desk at{" "}
              <a href="mailto:support@notexia.cloud" className="text-[#F0C93B] font-bold hover:underline">
                support@notexia.cloud
              </a>{" "}
              or message us via our{" "}
              <Link href="/contact" className="text-[#8FC3DE] font-bold hover:underline">
                Support Form
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
