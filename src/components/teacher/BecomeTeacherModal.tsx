"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  GraduationCap,
  Sparkles,
  CheckCircle2,
  X,
  FileText,
  DollarSign,
  ShieldCheck,
  Send,
  Loader2,
  Clock,
  Award,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface BecomeTeacherModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function BecomeTeacherModal({
  isOpen,
  onClose,
  onSuccess,
}: BecomeTeacherModalProps) {
  const [activeTab, setActiveTab] = useState<"requirements" | "form">("requirements");

  // Form State
  const [qualification, setQualification] = useState("");
  const [subjectExpertise, setSubjectExpertise] = useState("");
  const [experienceYears, setExperienceYears] = useState<number | "">(2);
  const [bio, setBio] = useState("");
  const [portfolioUrl, setPortfolioUrl] = useState("");
  const [payoutUpi, setPayoutUpi] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  // Status & Submit state
  const [isLoadingStatus, setIsLoadingStatus] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [existingApp, setExistingApp] = useState<{
    status: "pending" | "approved" | "rejected";
    adminNote?: string;
    createdAt: string;
  } | null>(null);

  const fetchApplicationStatus = useCallback(async () => {
    try {
      setIsLoadingStatus(true);
      const res = await fetch("/api/teacher-application");
      if (res.ok) {
        const data = await res.json();
        setExistingApp(data.application || null);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoadingStatus(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchApplicationStatus();
    }
  }, [isOpen, fetchApplicationStatus]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!qualification.trim()) {
      toast.error("Please enter your academic qualification.");
      return;
    }
    if (!subjectExpertise.trim()) {
      toast.error("Please specify your subject domain expertise.");
      return;
    }
    if (!bio.trim() || bio.trim().length < 20) {
      toast.error("Please provide a detailed bio (at least 20 characters).");
      return;
    }
    if (!agreedToTerms) {
      toast.error("You must agree to Notexia's 70/30 Creator Terms.");
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await fetch("/api/teacher-application", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          qualification: qualification.trim(),
          subjectExpertise: subjectExpertise.trim(),
          experienceYears: Number(experienceYears) || 0,
          bio: bio.trim(),
          portfolioUrl: portfolioUrl.trim(),
          payoutUpi: payoutUpi.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to submit teacher application.");
      }

      toast.success("Application Submitted! Admin will review your profile shortly.");
      fetchApplicationStatus();
      if (onSuccess) onSuccess();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to submit application.";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-xl max-h-[92vh] overflow-y-auto custom-scroll bg-[#121F18] border border-[#F0C93B]/30 rounded-[2rem] sm:rounded-3xl p-5 sm:p-7 space-y-5 text-[#F3F0E4] shadow-2xl relative">
        {/* CLOSE BUTTON */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 p-2 rounded-full bg-[#16261D] text-[#9FAEA1] hover:text-white border border-[#F3F0E4]/10 transition-all"
        >
          <X className="size-4" />
        </button>

        {/* MODAL HEADER */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 text-xs font-mono font-bold text-[#F0C93B] bg-[#F0C93B]/10 px-3 py-1 rounded-full border border-[#F0C93B]/30">
            <GraduationCap className="size-3.5" /> BECOME A NOTEXIA TEACHER
          </div>
          <h2 className="text-xl sm:text-2xl font-bold font-heading text-white flex items-center gap-2">
            Teach on Notexia &amp; Earn 70% Share <Sparkles className="size-4 text-[#F0C93B]" />
          </h2>
          <p className="text-xs text-[#9FAEA1] font-light leading-relaxed">
            Publish premium courses, verified notes, and research blueprints. Receive 70% direct cash payouts into your Bank/UPI.
          </p>
        </div>

        {/* EXISTING APPLICATION BANNER */}
        {isLoadingStatus ? (
          <div className="py-6 flex items-center justify-center text-xs text-[#9FAEA1] gap-2">
            <Loader2 className="size-4 animate-spin text-[#F0C93B]" /> Loading application status...
          </div>
        ) : existingApp ? (
          <div className="p-4 rounded-2xl bg-[#16261D] border border-[#F3F0E4]/15 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#F3F0E4] uppercase tracking-wider font-mono">
                Application Status
              </span>
              {existingApp.status === "pending" && (
                <span className="text-[10px] font-mono font-bold bg-[#F0C93B]/15 text-[#F0C93B] px-3 py-1 rounded-full border border-[#F0C93B]/30 flex items-center gap-1">
                  <Clock className="size-3" /> PENDING ADMIN REVIEW
                </span>
              )}
              {existingApp.status === "approved" && (
                <span className="text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-400 px-3 py-1 rounded-full border border-emerald-500/30 flex items-center gap-1">
                  <Award className="size-3" /> VERIFIED TEACHER
                </span>
              )}
              {existingApp.status === "rejected" && (
                <span className="text-[10px] font-mono font-bold bg-rose-500/15 text-rose-400 px-3 py-1 rounded-full border border-rose-500/30">
                  REJECTED
                </span>
              )}
            </div>

            <p className="text-xs text-[#9FAEA1] leading-relaxed">
              {existingApp.status === "pending" &&
                "Your Teacher Application is currently being evaluated by the Admin panel. Once approved, your account will be upgraded to Teacher role immediately."}
              {existingApp.status === "approved" &&
                "Congratulations! You are a verified Teacher on Notexia. You can publish paid courses and view your 70% Creator Earnings in your Wallet."}
              {existingApp.status === "rejected" &&
                `Your previous application was not approved. Admin note: ${existingApp.adminNote || "Please improve your profile credentials and re-apply."}`}
            </p>
          </div>
        ) : null}

        {/* TAB NAVIGATION */}
        {!existingApp || existingApp.status === "rejected" ? (
          <>
            <div className="flex border-b border-[#F3F0E4]/10 pb-2 gap-4">
              <button
                type="button"
                onClick={() => setActiveTab("requirements")}
                className={`text-xs font-bold font-mono uppercase tracking-wider pb-2 border-b-2 transition-all ${
                  activeTab === "requirements"
                    ? "border-[#F0C93B] text-[#F0C93B]"
                    : "border-transparent text-[#9FAEA1] hover:text-white"
                }`}
              >
                1. Requirements Checklist
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("form")}
                className={`text-xs font-bold font-mono uppercase tracking-wider pb-2 border-b-2 transition-all ${
                  activeTab === "form"
                    ? "border-[#F0C93B] text-[#F0C93B]"
                    : "border-transparent text-[#9FAEA1] hover:text-white"
                }`}
              >
                2. Application Form
              </button>
            </div>

            {/* TAB 1: REQUIREMENTS CHECKLIST */}
            {activeTab === "requirements" && (
              <div className="space-y-4">
                <div className="space-y-3">
                  <div className="p-3.5 rounded-2xl bg-[#16261D] border border-[#F3F0E4]/10 flex items-start gap-3">
                    <div className="p-2 rounded-xl bg-[#F0C93B]/10 text-[#F0C93B] border border-[#F0C93B]/30 shrink-0">
                      <GraduationCap className="size-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white font-heading">Domain Expertise &amp; Credentials</h4>
                      <p className="text-[11px] text-[#9FAEA1] mt-0.5 leading-relaxed">
                        Hold a degree, competitive exam rank (JEE, NEET, GATE), or verified expertise in your subject area.
                      </p>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-[#16261D] border border-[#F3F0E4]/10 flex items-start gap-3">
                    <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shrink-0">
                      <DollarSign className="size-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white font-heading">70% Creator Revenue Share</h4>
                      <p className="text-[11px] text-[#9FAEA1] mt-0.5 leading-relaxed">
                        You keep 70% of every course sale. 30% goes to Notexia platform hosting, bandwidth &amp; payment processing.
                      </p>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-[#16261D] border border-[#F3F0E4]/10 flex items-start gap-3">
                    <div className="p-2 rounded-xl bg-[#8FC3DE]/10 text-[#8FC3DE] border border-[#8FC3DE]/30 shrink-0">
                      <FileText className="size-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white font-heading">High Quality Study Material</h4>
                      <p className="text-[11px] text-[#9FAEA1] mt-0.5 leading-relaxed">
                        Commit to publishing clear, high-yield notes, formula sheets, or video lessons without plagiarism.
                      </p>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-[#16261D] border border-[#F3F0E4]/10 flex items-start gap-3">
                    <div className="p-2 rounded-xl bg-[#C9A9E0]/10 text-[#C9A9E0] border border-[#C9A9E0]/30 shrink-0">
                      <ShieldCheck className="size-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white font-heading">Direct Bank/UPI Payouts</h4>
                      <p className="text-[11px] text-[#9FAEA1] mt-0.5 leading-relaxed">
                        Withdraw your creator earnings directly to your UPI ID or Bank Account whenever you like.
                      </p>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={() => setActiveTab("form")}
                  className="w-full h-11 bg-[#F0C93B] hover:bg-[#F0C93B]/90 text-[#2A2118] font-bold text-xs rounded-2xl transition-all font-heading shadow-md flex items-center justify-center gap-2"
                >
                  <span>Proceed to Teacher Application Form</span>
                  <CheckCircle2 className="size-4 text-[#2A2118]" />
                </Button>
              </div>
            )}

            {/* TAB 2: APPLICATION FORM */}
            {activeTab === "form" && (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-3">
                  <div>
                    <label className="text-[11px] font-mono font-bold text-[#F3F0E4] uppercase tracking-wider block mb-1">
                      Academic Qualification / Degree *
                    </label>
                    <Input
                      type="text"
                      value={qualification}
                      onChange={(e) => setQualification(e.target.value)}
                      placeholder="e.g. B.Tech Computer Science (IIT Bombay), M.Sc Physics"
                      className="bg-[#16261D] border-[#F3F0E4]/15 focus:border-[#F0C93B] text-[#F3F0E4] placeholder-[#9FAEA1]/50 h-10 text-xs rounded-xl"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-mono font-bold text-[#F3F0E4] uppercase tracking-wider block mb-1">
                      Primary Subject / Exam Domain Expertise *
                    </label>
                    <Input
                      type="text"
                      value={subjectExpertise}
                      onChange={(e) => setSubjectExpertise(e.target.value)}
                      placeholder="e.g. Organic Chemistry, JEE Mathematics, GATE CS"
                      className="bg-[#16261D] border-[#F3F0E4]/15 focus:border-[#F0C93B] text-[#F3F0E4] placeholder-[#9FAEA1]/50 h-10 text-xs rounded-xl"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-mono font-bold text-[#F3F0E4] uppercase tracking-wider block mb-1">
                        Teaching Experience (Years)
                      </label>
                      <Input
                        type="number"
                        min="0"
                        max="50"
                        value={experienceYears}
                        onChange={(e) => setExperienceYears(e.target.value ? Number(e.target.value) : "")}
                        placeholder="Years of experience"
                        className="bg-[#16261D] border-[#F3F0E4]/15 focus:border-[#F0C93B] text-[#F3F0E4] placeholder-[#9FAEA1]/50 h-10 text-xs rounded-xl"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-mono font-bold text-[#F3F0E4] uppercase tracking-wider block mb-1">
                        UPI ID for Payouts (Optional)
                      </label>
                      <Input
                        type="text"
                        value={payoutUpi}
                        onChange={(e) => setPayoutUpi(e.target.value)}
                        placeholder="e.g. yourname@upi"
                        className="bg-[#16261D] border-[#F3F0E4]/15 focus:border-[#F0C93B] text-[#F3F0E4] placeholder-[#9FAEA1]/50 h-10 text-xs rounded-xl"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-mono font-bold text-[#F3F0E4] uppercase tracking-wider block mb-1">
                      Educator Bio &amp; Teaching Philosophy *
                    </label>
                    <textarea
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      rows={3}
                      placeholder="Briefly describe your teaching background, achievements, and why you want to teach on Notexia..."
                      className="w-full bg-[#16261D] border border-[#F3F0E4]/15 focus:border-[#F0C93B] text-[#F3F0E4] placeholder-[#9FAEA1]/50 p-3 text-xs rounded-xl focus:outline-none resize-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-mono font-bold text-[#F3F0E4] uppercase tracking-wider block mb-1">
                      Portfolio / Demo / Resume Link (Optional)
                    </label>
                    <Input
                      type="url"
                      value={portfolioUrl}
                      onChange={(e) => setPortfolioUrl(e.target.value)}
                      placeholder="e.g. https://youtube.com/@yourchannel or Drive link"
                      className="bg-[#16261D] border-[#F3F0E4]/15 focus:border-[#F0C93B] text-[#F3F0E4] placeholder-[#9FAEA1]/50 h-10 text-xs rounded-xl"
                    />
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="checkbox"
                      id="agree-terms"
                      checked={agreedToTerms}
                      onChange={(e) => setAgreedToTerms(e.target.checked)}
                      className="rounded border-[#F3F0E4]/20 bg-[#16261D] text-[#F0C93B] focus:ring-0 size-4 cursor-pointer"
                    />
                    <label htmlFor="agree-terms" className="text-xs text-[#9FAEA1] cursor-pointer">
                      I agree to Notexia&apos;s 70% Creator Revenue Share &amp; 30% Platform terms.
                    </label>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-11 bg-[#F0C93B] hover:bg-[#F0C93B]/90 text-[#2A2118] font-bold text-xs rounded-2xl transition-all font-heading shadow-md flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="size-4 animate-spin text-[#2A2118]" />
                      <span>Submitting Application...</span>
                    </>
                  ) : (
                    <>
                      <Send className="size-4" />
                      <span>Submit Teacher Application</span>
                    </>
                  )}
                </Button>
              </form>
            )}
          </>
        ) : null}
      </div>
    </div>
  );
}
