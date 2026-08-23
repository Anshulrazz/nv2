/* eslint-disable @next/next/no-img-element */
"use client";

export const dynamic = "force-dynamic";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Loader2, ArrowUpRight } from "lucide-react";
import { trackMetaEvent } from "@/lib/metaPixel";

import { Checkbox } from "@/components/ui/checkbox";

const signupSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "Please enter a valid email address." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
  referralCode: z.string().optional(),
  acceptTerms: z.boolean().refine((val) => val === true, {
    message: "You must agree to the Terms of Use, Privacy Policy, and Data Compliance to continue.",
  }),
});

type SignupFormValues = z.infer<typeof signupSchema>;

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialReferralCode = (searchParams.get("ref") || "").trim().toUpperCase();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    trackMetaEvent("Lead");
  }, []);

  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      referralCode: initialReferralCode,
      acceptTerms: false,
    },
  });

  const onSubmit = async (data: SignupFormValues) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Something went wrong during sign up.");
      }
      trackMetaEvent("CompleteRegistration", { method: "email" });
      const signInResult = await signIn("credentials", {
        redirect: false,
        email: data.email,
        password: data.password,
      });
      if (signInResult?.error) {
        router.push("/login?message=Account created. Please log in.");
      } else {
        router.push("/dashboard");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "An unexpected error occurred.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    const isAccepted = await form.trigger("acceptTerms");
    if (!isAccepted) {
      setError("You must agree to the Terms of Use, Privacy Policy, and Data Compliance to continue.");
      return;
    }
    signIn("google", { callbackUrl: "/dashboard?is_new_user=true" });
  };

  return (
    <div className="w-full max-w-md relative z-10">
      {/* Doppelrand (Double-Bezel) Hardware Shell */}
      <div className="rounded-[2.5rem] bg-[#150F0B]/80 border border-[#2E2118] p-2.5 backdrop-blur-3xl shadow-[0_0_100px_rgba(0,0,0,0.9)]">
        <div className="rounded-[calc(2.5rem-0.75rem)] bg-[#0A0806] border border-[#2E2118] p-5 sm:p-8 space-y-6">
          {/* Header */}
          <div className="text-center space-y-3">
            <div className="flex items-center justify-center gap-2.5 mb-2">
              <img src="/logo.png" className="h-6 w-auto object-contain" alt="Notexia Logo" />
              <span className="text-xl font-extrabold tracking-tight text-[#FAFAF8] font-display">
                Notexia
              </span>
            </div>
            <h1 className="text-2xl font-bold text-[#FAFAF8] tracking-tight font-display">
              Create your account
            </h1>
            <p className="text-[#8A8078] text-xs font-light">
              Start organizing your ideas with AI-powered notes
            </p>
          </div>

          {/* Error message */}
          {error && (
            <div className="p-3.5 rounded-xl bg-[#EF4444]/10 border border-[#EF4444]/20 text-[#EF4444] text-xs font-medium">
              {error}
            </div>
          )}

          {/* Form */}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] font-mono font-bold text-[#8A8078] uppercase tracking-widest">
                      Display Name
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="John Doe"
                        className="bg-[#150F0B] border-[#2E2118] focus:border-[#F5B429] text-[#FAFAF8] placeholder-[#8A8078] h-11 text-xs rounded-xl transition-[border-color,box-shadow] duration-150 ease-out"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-[#EF4444] text-xs" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] font-mono font-bold text-[#8A8078] uppercase tracking-widest">
                      Email Address
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="you@example.com"
                        className="bg-[#150F0B] border-[#2E2118] focus:border-[#F5B429] text-[#FAFAF8] placeholder-[#8A8078] h-11 text-xs rounded-xl transition-[border-color,box-shadow] duration-150 ease-out"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-[#EF4444] text-xs" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] font-mono font-bold text-[#8A8078] uppercase tracking-widest">
                      Password
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="••••••••"
                        className="bg-[#150F0B] border-[#2E2118] focus:border-[#F5B429] text-[#FAFAF8] placeholder-[#8A8078] h-11 text-xs rounded-xl transition-[border-color,box-shadow] duration-150 ease-out"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-[#EF4444] text-xs" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="referralCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] font-mono font-bold text-[#8A8078] uppercase tracking-widest">
                      Referral Code (Optional)
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g. JOIN2026"
                        className="bg-[#150F0B] border-[#2E2118] focus:border-[#F5B429] text-[#FAFAF8] placeholder-[#8A8078] h-11 text-xs rounded-xl transition-[border-color,box-shadow] duration-150 ease-out uppercase"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-[#EF4444] text-xs" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="acceptTerms"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-xl bg-[#150F0B]/60 p-3 border border-[#2E2118]">
                    <FormControl>
                      <Checkbox
                        id="signup-accept-terms"
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-tight">
                      <label
                        htmlFor="signup-accept-terms"
                        className="text-xs text-[#8A8078] font-light leading-relaxed cursor-pointer select-none"
                      >
                        I agree to Notexia&apos;s{" "}
                        <Link
                          href="/terms"
                          target="_blank"
                          className="text-[#F5B429] hover:text-[#FCD34D] font-semibold underline underline-offset-2 transition-colors"
                        >
                          Terms of Use
                        </Link>
                        ,{" "}
                        <Link
                          href="/privacy"
                          target="_blank"
                          className="text-[#F5B429] hover:text-[#FCD34D] font-semibold underline underline-offset-2 transition-colors"
                        >
                          Privacy Policy
                        </Link>{" "}
                        and{" "}
                        <Link
                          href="/privacy#data-compliance"
                          target="_blank"
                          className="text-[#F5B429] hover:text-[#FCD34D] font-semibold underline underline-offset-2 transition-colors"
                        >
                          Data Compliance
                        </Link>
                      </label>
                      <FormMessage className="text-[#EF4444] text-[11px]" />
                    </div>
                  </FormItem>
                )}
              />

              {/* Primary CTA Button */}
              <Button
                type="submit"
                disabled={isLoading}
                className="btn-premium-primary group w-full text-xs h-11 mt-2 flex items-center justify-center gap-2 font-display"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-[#150F0B]" />
                    <span>Initializing node...</span>
                  </div>
                ) : (
                  <>
                    <span>Create Account</span>
                    <ArrowUpRight className="size-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </>
                )}
              </Button>
            </form>
          </Form>

          {/* Separator */}
          <div className="relative flex items-center justify-center my-4">
            <span className="absolute w-full h-px bg-[#2E2118]" />
            <span className="relative px-3 bg-[#0A0806] text-[#8A8078] text-[10px] font-mono font-bold uppercase tracking-widest">
              Or continue with
            </span>
          </div>

          {/* Google Signup */}
          <Button
            type="button"
            variant="outline"
            onClick={handleGoogleSignIn}
            className="w-full rounded-full border-[#2E2118] bg-[#150F0B] hover:bg-[#241811] text-[#FAFAF8] h-11 flex items-center justify-center gap-3 font-medium text-xs transition-colors"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
            </svg>
            Sign up with Google
          </Button>

          {/* Footer */}
          <div className="pt-2 text-center">
            <p className="text-[#8A8078] text-xs">
              Already have an account?{" "}
              <Link href="/login" className="text-[#F5B429] hover:text-[#FCD34D] font-semibold hover:underline transition-colors">
                Log in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SignupClient() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-transparent p-4 relative overflow-hidden selection:bg-[#F5B429]/30 selection:text-[#FAFAF8] antialiased">
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden="true">
        <div className="ambient-glow-orb-1" />
        <div className="ambient-glow-orb-2" />
        <div className="ambient-glow-orb-3" />
      </div>

      <Suspense
        fallback={
          <div className="flex items-center justify-center text-[#FAFAF8] gap-2 bg-[#150F0B] p-8 rounded-2xl border border-[#2E2118]">
            <Loader2 className="h-6 w-6 animate-spin text-[#F5B429]" />
            <span className="text-xs font-mono">Loading signup form...</span>
          </div>
        }
      >
        <SignupForm />
      </Suspense>
    </div>
  );
}
