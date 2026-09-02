"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Lock,
  ArrowRight,
  Loader2,
  KeyRound,
  CheckCircle2,
  Eye,
  EyeOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NotexiaLogo } from "@/components/common/NotexiaLogo";

export default function ResetPasswordClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const token = searchParams.get("token") || "";
  const emailParam = searchParams.get("email") || "";

  const [email, setEmail] = useState(emailParam);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  React.useEffect(() => {
    if (emailParam) {
      setEmail(emailParam);
    }
  }, [emailParam]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token) {
      setError("Invalid or missing reset token. Please request a new password reset link.");
      return;
    }
    if (!email || !email.includes("@")) {
      setError("Please provide a valid email address.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }
    if (password !== confirmPassword) {
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
          resetToken: token,
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to reset password.");
      }

      setIsSuccess(true);
    } catch (err: any) {
      setError(err.message || "Failed to update password.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0A0806] p-4 relative overflow-hidden selection:bg-[#F5B429]/30 selection:text-[#FAFAF8] antialiased">
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden="true">
        <div className="ambient-glow-orb-1" />
        <div className="ambient-glow-orb-2" />
        <div className="ambient-glow-orb-3" />
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="rounded-[2.5rem] bg-[#150F0B]/80 border border-[#2E2118] p-2.5 backdrop-blur-3xl shadow-[0_0_100px_rgba(0,0,0,0.9)]">
          <div className="rounded-[calc(2.5rem-0.75rem)] bg-[#0A0806] border border-[#2E2118] p-6 sm:p-8 space-y-6">
            
            <div className="text-center space-y-3">
              <div className="flex items-center justify-center mb-2">
                <Link href="/">
                  <NotexiaLogo size="md" />
                </Link>
              </div>

              <h1 className="text-2xl font-bold text-[#FAFAF8] tracking-tight font-display">
                {isSuccess ? "Password Reset Complete" : "Set New Password"}
              </h1>

              <p className="text-[#8A8078] text-xs font-light max-w-xs mx-auto">
                {isSuccess
                  ? "Your account credentials have been successfully updated."
                  : "Choose a strong password to protect your Notexia workspace."}
              </p>
            </div>

            {error && (
              <div className="p-3.5 rounded-xl bg-[#EF4444]/10 border border-[#EF4444]/20 text-[#EF4444] text-xs font-medium">
                {error}
              </div>
            )}

            {!isSuccess ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                {!emailParam && (
                  <div className="space-y-2">
                    <label className="text-[10px] font-mono font-bold text-[#8A8078] uppercase tracking-widest block">
                      Account Email
                    </label>
                    <Input
                      type="email"
                      required
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="bg-[#150F0B] border-[#2E2118] focus:border-[#F5B429] text-[#FAFAF8] placeholder-[#8A8078] h-11 text-xs rounded-xl"
                    />
                  </div>
                )}

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
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
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
                      <span>Save New Password</span>
                      <ArrowRight className="size-4 group-hover:translate-x-0.5 transition-transform" />
                    </>
                  )}
                </Button>

                <div className="pt-2 text-center">
                  <Link
                    href="/login"
                    className="text-xs text-[#8A8078] hover:text-[#FAFAF8] transition-colors"
                  >
                    Back to Sign In
                  </Link>
                </div>
              </form>
            ) : (
              <div className="space-y-5 text-center py-2">
                <div className="w-16 h-16 rounded-full bg-[#22C55E]/10 border border-[#22C55E]/20 flex items-center justify-center mx-auto text-[#22C55E] shadow-[0_0_30px_rgba(34,197,94,0.2)]">
                  <CheckCircle2 className="size-8" />
                </div>

                <div className="space-y-1">
                  <p className="text-sm font-semibold text-[#FAFAF8]">
                    Password updated successfully!
                  </p>
                  <p className="text-xs text-[#8A8078]">
                    You can now log in to your account with your new password.
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
