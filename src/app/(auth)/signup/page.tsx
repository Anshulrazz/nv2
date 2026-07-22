"use client";

import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Loader2 } from "lucide-react";

const signupSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "Please enter a valid email address." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
  referralCode: z.string().optional(),
});

type SignupFormValues = z.infer<typeof signupSchema>;

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialReferralCode = (searchParams.get("ref") || "").trim().toUpperCase();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: { name: "", email: "", password: "", referralCode: initialReferralCode },
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

  const handleGoogleSignIn = () => {
    signIn("google", { callbackUrl: "/dashboard" });
  };

  return (
    <div className="w-full max-w-md relative">
      {/* Cyber corner-cut card */}
      <div className="bg-neutral-900/60 border border-neutral-800 backdrop-blur-xl shadow-2xl cyber-panel overflow-hidden">
        {/* Top accent line */}
        <div className="h-px bg-gradient-to-r from-violet-500 via-indigo-500 to-cyan-500 w-full" />

        {/* Header */}
        <div className="px-8 pt-8 pb-4 text-center space-y-2">
          <div className="flex items-center justify-center gap-2.5 mb-3">
            <img src="/logo.png" className="h-6 w-auto object-contain" alt="Notexia Logo" />
            <span
              className="text-xl font-bold tracking-widest bg-gradient-to-r from-cyan-400 via-indigo-400 to-violet-400 bg-clip-text text-transparent"
              style={{ fontFamily: "var(--font-space-grotesk)" }}
            >
              NOTEXIA
            </span>
          </div>
          <h1
            className="text-2xl font-bold text-neutral-100 tracking-tight"
            style={{ fontFamily: "var(--font-space-grotesk)" }}
          >
            Create your account
          </h1>
          <p className="text-neutral-500 text-sm">
            Start organizing your ideas with AI-powered notes
          </p>
        </div>

        {/* Form body */}
        <div className="px-8 pb-6 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium">
              {error}
            </div>
          )}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel
                      className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider"
                      style={{ fontFamily: "var(--font-space-grotesk)" }}
                    >
                      Display Name
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="John Doe"
                        className="bg-neutral-950/80 border-neutral-800 focus:border-cyan-400 text-neutral-100 placeholder-neutral-600 h-10 text-sm"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-red-400 text-xs" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel
                      className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider"
                      style={{ fontFamily: "var(--font-space-grotesk)" }}
                    >
                      Email Address
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="you@example.com"
                        className="bg-neutral-950/80 border-neutral-800 focus:border-cyan-400 text-neutral-100 placeholder-neutral-600 h-10 text-sm"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-red-400 text-xs" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel
                      className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider"
                      style={{ fontFamily: "var(--font-space-grotesk)" }}
                    >
                      Password
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="••••••••"
                        className="bg-neutral-950/80 border-neutral-800 focus:border-cyan-400 text-neutral-100 placeholder-neutral-600 h-10 text-sm"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-red-400 text-xs" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="referralCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel
                      className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider"
                      style={{ fontFamily: "var(--font-space-grotesk)" }}
                    >
                      Referral Code (Optional)
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="REF-XXXXXX"
                        className="bg-neutral-950/80 border-neutral-800 focus:border-cyan-400 text-neutral-100 placeholder-neutral-600 h-10 text-sm"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-red-400 text-xs" />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-cyan-500 hover:bg-cyan-400 text-neutral-950 font-bold shadow-[0_0_15px_rgba(6,182,212,0.3)] hover:shadow-[0_0_20px_rgba(6,182,212,0.5)] transition-all duration-200 mt-2 h-10"
                style={{ fontFamily: "var(--font-space-grotesk)" }}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Initializing node...</span>
                  </div>
                ) : (
                  "Create Account"
                )}
              </Button>
            </form>
          </Form>

          <div className="relative flex items-center justify-center my-4">
            <span className="absolute w-full h-px bg-neutral-800" />
            <span
              className="relative px-3 bg-neutral-900 text-neutral-600 text-[10px] font-bold uppercase tracking-wider"
              style={{ fontFamily: "var(--font-space-grotesk)" }}
            >
              Or continue with
            </span>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={handleGoogleSignIn}
            className="w-full border-neutral-800 hover:border-neutral-700 bg-neutral-950 hover:bg-neutral-900 text-neutral-300 hover:text-neutral-100 transition-all h-10 flex items-center justify-center gap-3 font-medium text-sm"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
            </svg>
            Sign up with Google
          </Button>
        </div>

        {/* Footer */}
        <div className="px-8 pb-8 text-center">
          <p className="text-neutral-500 text-sm">
            Already have an account?{" "}
            <Link href="/login" className="text-cyan-400 hover:text-cyan-300 font-semibold hover:underline transition-colors">
              Log in
            </Link>
          </p>
        </div>
      </div>

      {/* Decorative glow */}
      <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-64 h-64 bg-violet-500/8 rounded-full blur-[80px] pointer-events-none" />
    </div>
  );
}

export default function SignupPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-950 p-4 relative overflow-hidden">
      {/* Cyber grid background */}
      <div className="absolute inset-0 cyber-grid opacity-60 pointer-events-none" />
      {/* Ambient glow blobs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-violet-500/6 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-cyan-500/6 rounded-full blur-[100px] pointer-events-none" />

      <Suspense fallback={
        <div className="flex-1 flex items-center justify-center text-neutral-500 select-none gap-2">
          <Loader2 className="h-5 w-5 animate-spin text-cyan-400" />
          <span className="text-xs font-bold uppercase tracking-widest">Loading signup form...</span>
        </div>
      }>
        <SignupForm />
      </Suspense>
    </div>
  );
}
