"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldCheck,
  Mail,
  Lock,
  ArrowRight,
  ArrowLeft,
  Loader2,
  KeyRound,
  CheckCircle2,
  Eye,
  EyeOff,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NotexiaLogo } from "@/components/common/NotexiaLogo";

type Step = "email" | "otp" | "password" | "success";

export default function ForgotPasswordClient() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState<string[]>(["", "", "", "", "", ""]);
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  const otpInputsRef = useRef<(HTMLInputElement | null)[]>([]);

  // Handle resend countdown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => {
        setResendCooldown((prev) => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  // ── Step 1: Send OTP ────────────────────────────────────────────────────────
  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!email || !email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/forgot-password/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to send verification code.");
      }

      setResendCooldown(60);
      setOtp(["", "", "", "", "", ""]);
      setStep("otp");
      // Auto focus first OTP input after switching step
      setTimeout(() => {
        otpInputsRef.current[0]?.focus();
      }, 150);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  // ── Step 2: Handle OTP input & Paste ────────────────────────────────────────
  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text/plain").replace(/\D/g, "").slice(0, 6);
    if (!pastedData) return;

    const newOtp = [...otp];
    pastedData.split("").forEach((digit, i) => {
      newOtp[i] = digit;
    });
    setOtp(newOtp);
    setError(null);

    const nextIndex = Math.min(pastedData.length, 5);
    otpInputsRef.current[nextIndex]?.focus();

    if (pastedData.length === 6) {
      verifyOtpCode(pastedData);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    const clean = value.replace(/\D/g, "");
    setError(null);

    if (!clean) {
      const newOtp = [...otp];
      newOtp[index] = "";
      setOtp(newOtp);
      return;
    }

    if (clean.length > 1) {
      const chars = clean.slice(0, 6).split("");
      const newOtp = [...otp];
      chars.forEach((d, i) => {
        if (index + i < 6) newOtp[index + i] = d;
      });
      setOtp(newOtp);
      const nextFocus = Math.min(index + chars.length, 5);
      otpInputsRef.current[nextFocus]?.focus();
      if (newOtp.join("").length === 6) {
        verifyOtpCode(newOtp.join(""));
      }
      return;
    }

    const newOtp = [...otp];
    newOtp[index] = clean;
    setOtp(newOtp);

    // Auto advance focus to next input
    if (index < 5) {
      otpInputsRef.current[index + 1]?.focus();
    }

    // Auto verify if 6th digit entered
    if (index === 5 && newOtp.join("").length === 6) {
      verifyOtpCode(newOtp.join(""));
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (!otp[index] && index > 0) {
        e.preventDefault();
        const newOtp = [...otp];
        newOtp[index - 1] = "";
        setOtp(newOtp);
        otpInputsRef.current[index - 1]?.focus();
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      e.preventDefault();
      otpInputsRef.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < 5) {
      e.preventDefault();
      otpInputsRef.current[index + 1]?.focus();
    }
  };

  // ── Step 2: Verify OTP ─────────────────────────────────────────────────────
  const verifyOtpCode = async (codeToVerify: string) => {
    if (codeToVerify.length !== 6) {
      setError("Please enter the complete 6-digit verification code.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/forgot-password/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          otp: codeToVerify,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to verify code.");
      }

      setResetToken(data.resetToken);
      setStep("password");
    } catch (err: any) {
      setError(err.message || "Invalid or expired code.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    verifyOtpCode(otp.join(""));
  };

  // ── Step 3: Reset Password ─────────────────────────────────────────────────
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/forgot-password/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          resetToken,
          password: newPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to reset password.");
      }

      setStep("success");
    } catch (err: any) {
      setError(err.message || "Failed to update password.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0A0806] p-4 relative overflow-hidden selection:bg-[#F5B429]/30 selection:text-[#FAFAF8] antialiased">
      {/* Background Ambient Glows */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden="true">
        <div className="ambient-glow-orb-1" />
        <div className="ambient-glow-orb-2" />
        <div className="ambient-glow-orb-3" />
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="rounded-[2.5rem] bg-[#150F0B]/80 border border-[#2E2118] p-2.5 backdrop-blur-3xl shadow-[0_0_100px_rgba(0,0,0,0.9)]">
          <div className="rounded-[calc(2.5rem-0.75rem)] bg-[#0A0806] border border-[#2E2118] p-6 sm:p-8 space-y-6">
            
            {/* Header / Logo */}
            <div className="text-center space-y-3">
              <div className="flex items-center justify-center mb-2">
                <Link href="/">
                  <NotexiaLogo size="md" />
                </Link>
              </div>

              {/* Step indicator badges */}
              <div className="flex items-center justify-center gap-1.5 pt-1">
                <span
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    step === "email" ? "w-6 bg-[#F5B429]" : "w-2 bg-[#2E2118]"
                  }`}
                />
                <span
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    step === "otp" ? "w-6 bg-[#F5B429]" : "w-2 bg-[#2E2118]"
                  }`}
                />
                <span
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    step === "password" ? "w-6 bg-[#F5B429]" : "w-2 bg-[#2E2118]"
                  }`}
                />
                <span
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    step === "success" ? "w-6 bg-[#22C55E]" : "w-2 bg-[#2E2118]"
                  }`}
                />
              </div>

              <h1 className="text-2xl font-bold text-[#FAFAF8] tracking-tight font-display">
                {step === "email" && "Reset Password"}
                {step === "otp" && "2FA Verification"}
                {step === "password" && "Create New Password"}
                {step === "success" && "Password Reset Complete"}
              </h1>

              <p className="text-[#8A8078] text-xs font-light max-w-xs mx-auto">
                {step === "email" && "Enter your email to receive a 2FA verification code."}
                {step === "otp" && (
                  <span>
                    We sent a 6-digit code to <strong className="text-[#FAFAF8]">{email}</strong>
                  </span>
                )}
                {step === "password" && "Enter and confirm your new secure password."}
                {step === "success" && "Your account security has been updated successfully."}
              </p>
            </div>

            {/* Error Message Box */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="p-3.5 rounded-xl bg-[#EF4444]/10 border border-[#EF4444]/20 text-[#EF4444] text-xs font-medium"
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            {/* ─── STEP 1: EMAIL ENTRY ─── */}
            {step === "email" && (
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-mono font-bold text-[#8A8078] uppercase tracking-widest block">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-[#8A8078]" />
                    <Input
                      type="email"
                      required
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="bg-[#150F0B] border-[#2E2118] focus:border-[#F5B429] text-[#FAFAF8] placeholder-[#8A8078] h-11 text-xs rounded-xl pl-10"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="btn-premium-primary group w-full text-xs h-11 mt-2 flex items-center justify-center gap-2 font-display"
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin text-[#150F0B]" />
                      <span>Sending 2FA Code...</span>
                    </div>
                  ) : (
                    <>
                      <span>Send 2FA Code</span>
                      <ArrowRight className="size-4 group-hover:translate-x-0.5 transition-transform" />
                    </>
                  )}
                </Button>

                <div className="pt-2 text-center">
                  <Link
                    href="/login"
                    className="inline-flex items-center gap-1.5 text-xs text-[#8A8078] hover:text-[#FAFAF8] transition-colors"
                  >
                    <ArrowLeft className="size-3.5" />
                    <span>Back to Sign In</span>
                  </Link>
                </div>
              </form>
            )}

            {/* ─── STEP 2: 2FA OTP ENTRY ─── */}
            {step === "otp" && (
              <form onSubmit={handleVerifyOtp} className="space-y-5">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-mono font-bold text-[#8A8078] uppercase tracking-widest block">
                      6-Digit 2FA Code
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setStep("email");
                        setError(null);
                      }}
                      className="text-[11px] text-[#F5B429] hover:underline"
                    >
                      Change email
                    </button>
                  </div>

                  {/* 6 OTP Boxes */}
                  <div className="flex justify-between gap-2">
                    {otp.map((digit, index) => (
                      <input
                        key={index}
                        ref={(el) => {
                          otpInputsRef.current[index] = el;
                        }}
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={6}
                        value={digit}
                        aria-label={`Digit ${index + 1} of verification code`}
                        onPaste={handleOtpPaste}
                        onChange={(e) => handleOtpChange(index, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(index, e)}
                        className="w-12 h-13 text-center text-xl font-bold bg-[#150F0B] border border-[#2E2118] rounded-xl text-[#FAFAF8] focus:border-[#F5B429] focus:outline-none focus:ring-2 focus:ring-[#F5B429]/20 transition-all font-mono"
                      />
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-[#8A8078] px-1">
                  <span>Didn&apos;t get the code?</span>
                  {resendCooldown > 0 ? (
                    <span className="font-mono text-[#F5B429]">
                      Resend in {resendCooldown}s
                    </span>
                  ) : (
                    <button
                      type="button"
                      disabled={isLoading}
                      onClick={() => handleSendOtp()}
                      className="text-[#F5B429] hover:underline flex items-center gap-1 font-medium"
                    >
                      <RefreshCw className="size-3" />
                      Resend Code
                    </button>
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={isLoading || otp.join("").length !== 6}
                  className="btn-premium-primary group w-full text-xs h-11 mt-2 flex items-center justify-center gap-2 font-display"
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin text-[#150F0B]" />
                      <span>Verifying 2FA...</span>
                    </div>
                  ) : (
                    <>
                      <ShieldCheck className="size-4" />
                      <span>Verify Code</span>
                    </>
                  )}
                </Button>

                <div className="pt-1 text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setStep("email");
                      setError(null);
                    }}
                    className="inline-flex items-center gap-1.5 text-xs text-[#8A8078] hover:text-[#FAFAF8] transition-colors"
                  >
                    <ArrowLeft className="size-3.5" />
                    <span>Back to Email</span>
                  </button>
                </div>
              </form>
            )}

            {/* ─── STEP 3: CREATE NEW PASSWORD ─── */}
            {step === "password" && (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-mono font-bold text-[#8A8078] uppercase tracking-widest block">
                    New Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-[#8A8078]" />
                    <Input
                      type={showPassword ? "text" : "password"}
                      required
                      placeholder="••••••••"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="bg-[#150F0B] border-[#2E2118] focus:border-[#F5B429] text-[#FAFAF8] placeholder-[#8A8078] h-11 text-xs rounded-xl pl-10 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#8A8078] hover:text-[#FAFAF8]"
                    >
                      {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-mono font-bold text-[#8A8078] uppercase tracking-widest block">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-[#8A8078]" />
                    <Input
                      type={showConfirmPassword ? "text" : "password"}
                      required
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="bg-[#150F0B] border-[#2E2118] focus:border-[#F5B429] text-[#FAFAF8] placeholder-[#8A8078] h-11 text-xs rounded-xl pl-10 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#8A8078] hover:text-[#FAFAF8]"
                    >
                      {showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="btn-premium-primary group w-full text-xs h-11 mt-2 flex items-center justify-center gap-2 font-display"
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin text-[#150F0B]" />
                      <span>Updating Password...</span>
                    </div>
                  ) : (
                    <>
                      <span>Reset Password</span>
                      <ArrowRight className="size-4 group-hover:translate-x-0.5 transition-transform" />
                    </>
                  )}
                </Button>
              </form>
            )}

            {/* ─── STEP 4: SUCCESS CONFIRMATION ─── */}
            {step === "success" && (
              <div className="space-y-5 text-center py-2">
                <div className="w-16 h-16 rounded-full bg-[#22C55E]/10 border border-[#22C55E]/20 flex items-center justify-center mx-auto text-[#22C55E] shadow-[0_0_30px_rgba(34,197,94,0.2)]">
                  <CheckCircle2 className="size-8" />
                </div>

                <div className="space-y-1">
                  <p className="text-sm font-semibold text-[#FAFAF8]">
                    Your password has been changed!
                  </p>
                  <p className="text-xs text-[#8A8078]">
                    A confirmation email has been sent to your inbox. You can now log in securely with your new credentials.
                  </p>
                </div>

                <Button
                  onClick={() => router.push("/login?message=Password+updated+successfully.+Please+sign+in.")}
                  className="btn-premium-primary group w-full text-xs h-11 flex items-center justify-center gap-2 font-display"
                >
                  <span>Proceed to Sign In</span>
                  <ArrowRight className="size-4 group-hover:translate-x-0.5 transition-transform" />
                </Button>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
