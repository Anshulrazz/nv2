"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Mail,
  MessageSquare,
  Clock,
  ShieldCheck,
  Send,
  Loader2,
  CheckCircle2,
  AlertCircle,
  MapPin,
  HelpCircle,
} from "lucide-react";
import { TrustHeader } from "@/components/public/TrustHeader";
import { TrustFooter } from "@/components/public/TrustFooter";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    category: "general",
    subject: "",
    message: "",
  });

  const [status, setStatus] = useState<{
    loading: boolean;
    success: boolean;
    error: string | null;
    ticketId?: string;
  }>({
    loading: false,
    success: false,
    error: null,
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus({ loading: true, success: false, error: null });

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to submit inquiry.");
      }

      setStatus({
        loading: false,
        success: true,
        error: null,
        ticketId: data.ticketId,
      });

      setFormData({
        name: "",
        email: "",
        category: "general",
        subject: "",
        message: "",
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "An unexpected error occurred.";
      setStatus({
        loading: false,
        success: false,
        error: message,
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#16261D] text-[#F3F0E4] font-sans selection:bg-[#F0C93B]/30 flex flex-col antialiased">
      <TrustHeader title="CONTACT US" />

      <main className="max-w-5xl w-full mx-auto px-4 sm:px-6 py-12 sm:py-16 space-y-12 flex-1">
        {/* HEADER HERO */}
        <div className="space-y-4 text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#8FC3DE]/15 border border-[#8FC3DE]/30 text-[#8FC3DE] text-xs font-mono font-bold uppercase tracking-wider">
            <Mail className="size-3.5" /> WE ARE HERE TO HELP
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight font-heading">
            Get in Touch with Notexia Support
          </h1>
          <p className="text-[#9FAEA1] text-sm sm:text-base leading-relaxed font-light">
            Have questions about your account, AI doubt solver, note syncing, or subscriptions? Fill out the form below or send us an email directly.
          </p>
        </div>

        {/* TWO-COLUMN GRID: CONTACT CARDS + INTERACTIVE FORM */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT SIDE: DIRECT CONTACT INFO */}
          <div className="lg:col-span-5 space-y-6">
            <div className="rounded-[2rem] bg-[#1A2D23]/90 border border-[#F3F0E4]/15 p-2 shadow-xl">
              <div className="rounded-[calc(2rem-0.5rem)] bg-[#121F18] p-6 sm:p-8 space-y-6">
                <h2 className="text-xl font-bold text-white font-heading">Contact Information</h2>

                <div className="space-y-4 text-sm">
                  <div className="flex items-start gap-4">
                    <div className="size-10 rounded-xl bg-[#8FC3DE]/10 border border-[#8FC3DE]/30 flex items-center justify-center text-[#8FC3DE] shrink-0">
                      <Mail className="size-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-white">Email Inquiries</h4>
                      <p className="text-xs text-[#9FAEA1]">General &amp; Info:</p>
                      <a href="mailto:info@notexia.cloud" className="text-xs font-bold text-[#8FC3DE] hover:underline block">
                        info@notexia.cloud
                      </a>
                      <p className="text-xs text-[#9FAEA1] mt-1.5">Student Support:</p>
                      <a href="mailto:support@notexia.cloud" className="text-xs font-bold text-[#F0C93B] hover:underline block">
                        support@notexia.cloud
                      </a>
                      <p className="text-xs text-[#9FAEA1] mt-1.5">Direct Helpdesk Mail:</p>
                      <a href="mailto:mail@support.notexia.cloud" className="text-xs font-bold text-[#8FC3DE] hover:underline block">
                        mail@support.notexia.cloud
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 pt-4 border-t border-[#F3F0E4]/10">
                    <div className="size-10 rounded-xl bg-[#F0C93B]/10 border border-[#F0C93B]/30 flex items-center justify-center text-[#F0C93B] shrink-0">
                      <Clock className="size-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-white">Response Time SLA</h4>
                      <p className="text-xs text-[#9FAEA1] leading-relaxed">
                        We aim to respond to all student and technical inquiries within <strong className="text-white">24 to 48 hours</strong> (Mon – Sat).
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 pt-4 border-t border-[#F3F0E4]/10">
                    <div className="size-10 rounded-xl bg-[#F28B6E]/10 border border-[#F28B6E]/30 flex items-center justify-center text-[#F28B6E] shrink-0">
                      <MapPin className="size-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-white">Registered Address</h4>
                      <p className="text-xs text-[#9FAEA1] leading-relaxed">
                        Notexia Inc.<br />
                        Tech Park Road, Whitefield<br />
                        Bengaluru, Karnataka 560066, India
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* QUICK FAQ BOX */}
            <div className="rounded-2xl border border-[#F3F0E4]/15 bg-[#1A2D23] p-6 space-y-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2 font-heading">
                <HelpCircle className="size-4 text-[#F0C93B]" /> Looking for Quick Answers?
              </h3>
              <p className="text-xs text-[#9FAEA1] leading-relaxed font-light">
                Check our detailed guidelines and terms for instant clarification on common issues:
              </p>
              <div className="flex flex-wrap gap-2 text-[11px] pt-1">
                <Link href="/privacy" className="px-2.5 py-1 rounded-full bg-[#121F18] border border-[#F3F0E4]/10 hover:border-[#F0C93B]/40 text-[#F3F0E4]">
                  Privacy Policy
                </Link>
                <Link href="/refund-policy" className="px-2.5 py-1 rounded-full bg-[#121F18] border border-[#F3F0E4]/10 hover:border-[#F0C93B]/40 text-[#F3F0E4]">
                  Refund Policy
                </Link>
                <Link href="/community-guidelines" className="px-2.5 py-1 rounded-full bg-[#121F18] border border-[#F3F0E4]/10 hover:border-[#F0C93B]/40 text-[#F3F0E4]">
                  Guidelines
                </Link>
              </div>
            </div>
          </div>

          {/* RIGHT SIDE: INTERACTIVE FORM */}
          <div className="lg:col-span-7">
            <div className="rounded-[2rem] bg-[#1A2D23]/90 border border-[#F3F0E4]/15 p-2 shadow-2xl">
              <div className="rounded-[calc(2rem-0.5rem)] bg-[#121F18] p-6 sm:p-8 space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-white font-heading">Send Us a Message</h2>
                  <p className="text-xs text-[#9FAEA1] mt-1 font-light">
                    Fill out the form details below and our support team will record your inquiry ticket.
                  </p>
                </div>

                {status.success && (
                  <div className="p-4 rounded-xl bg-[#8FC3DE]/10 border border-[#8FC3DE]/30 text-[#8FC3DE] space-y-1 text-xs">
                    <div className="flex items-center gap-2 font-bold text-sm">
                      <CheckCircle2 className="size-4" /> Message Sent Successfully!
                    </div>
                    <p className="text-[#9FAEA1]">
                      Thank you for contacting Notexia. Your support ticket reference ID is:{" "}
                      <span className="font-mono text-white font-bold">{status.ticketId || "N/A"}</span>
                    </p>
                  </div>
                )}

                {status.error && (
                  <div className="p-4 rounded-xl bg-[#F28B6E]/10 border border-[#F28B6E]/30 text-[#F28B6E] flex items-center gap-2 text-xs font-medium">
                    <AlertCircle className="size-4 shrink-0" />
                    <span>{status.error}</span>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="font-bold text-[#F3F0E4] block">Full Name *</label>
                      <input
                        type="text"
                        name="name"
                        required
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="e.g. Ananya Sharma"
                        className="w-full rounded-xl bg-[#16261D] border border-[#F3F0E4]/15 px-4 py-3 text-white placeholder-[#9FAEA1]/50 focus:outline-none focus:border-[#F0C93B] transition-colors"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="font-bold text-[#F3F0E4] block">Email Address *</label>
                      <input
                        type="email"
                        name="email"
                        required
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="student@domain.com"
                        className="w-full rounded-xl bg-[#16261D] border border-[#F3F0E4]/15 px-4 py-3 text-white placeholder-[#9FAEA1]/50 focus:outline-none focus:border-[#F0C93B] transition-colors"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="font-bold text-[#F3F0E4] block">Inquiry Category</label>
                      <select
                        name="category"
                        value={formData.category}
                        onChange={handleChange}
                        className="w-full rounded-xl bg-[#16261D] border border-[#F3F0E4]/15 px-4 py-3 text-white focus:outline-none focus:border-[#F0C93B] transition-colors"
                      >
                        <option value="general">General Inquiry</option>
                        <option value="support">Technical Support</option>
                        <option value="privacy">Privacy &amp; Data Control</option>
                        <option value="billing">Billing &amp; Refunds</option>
                        <option value="bug">Report a Bug</option>
                        <option value="business">Partnership / Business</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="font-bold text-[#F3F0E4] block">Subject *</label>
                      <input
                        type="text"
                        name="subject"
                        required
                        value={formData.subject}
                        onChange={handleChange}
                        placeholder="Brief summary of your request"
                        className="w-full rounded-xl bg-[#16261D] border border-[#F3F0E4]/15 px-4 py-3 text-white placeholder-[#9FAEA1]/50 focus:outline-none focus:border-[#F0C93B] transition-colors"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-bold text-[#F3F0E4] block">Message *</label>
                    <textarea
                      name="message"
                      rows={5}
                      required
                      value={formData.message}
                      onChange={handleChange}
                      placeholder="Please describe your question or issue in detail..."
                      className="w-full rounded-xl bg-[#16261D] border border-[#F3F0E4]/15 p-4 text-white placeholder-[#9FAEA1]/50 focus:outline-none focus:border-[#F0C93B] transition-colors resize-y min-h-[120px]"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={status.loading}
                    className="w-full rounded-full bg-[#F0C93B] hover:bg-[#F0C93B]/90 active:scale-[0.99] text-[#2A2118] font-bold text-sm py-3.5 px-6 inline-flex items-center justify-center gap-2 transition-all shadow-md font-heading disabled:opacity-50"
                  >
                    {status.loading ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        <span>Submitting Ticket...</span>
                      </>
                    ) : (
                      <>
                        <Send className="size-4" />
                        <span>Submit Inquiry</span>
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </main>

      <TrustFooter />
    </div>
  );
}
