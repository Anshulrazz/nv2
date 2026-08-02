/* eslint-disable @next/next/no-img-element */
"use client";

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
import { trackPixelEvent } from "@/lib/pixel";

const loginSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
  password: z.string().min(1, { message: "Password is required." }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  useEffect(() => {
    const message = searchParams.get("message");
    const errorParam = searchParams.get("error");
    if (message) setInfoMessage(message);
    if (errorParam === "CredentialsSignin") {
      setError("Invalid email or password. Please try again.");
    }
  }, [searchParams]);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    setError(null);
    setInfoMessage(null);
    try {
      const result = await signIn("credentials", {
        redirect: false,
        email: data.email,
        password: data.password,
      });
      if (result?.error) {
        setError("Invalid email or password. Please try again.");
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    trackPixelEvent("CompleteRegistration", { method: "google" });
    signIn("google", { callbackUrl: "/notes" });
  };

  return (
    <div className="w-full max-w-md relative z-10">
      <div className="rounded-[2.5rem] bg-zinc-900/40 border border-white/10 p-2.5 backdrop-blur-3xl shadow-[0_0_100px_rgba(0,0,0,0.9)]">
        <div className="rounded-[calc(2.5rem-0.75rem)] bg-[#07070a] border border-white/5 p-5 sm:p-8 space-y-6">
          <div className="text-center space-y-3">
            <div className="flex items-center justify-center gap-2.5 mb-2">
              <img src="/logo.png" className="h-6 w-auto object-contain" alt="Notexia Logo" />
              <span className="text-xl font-extrabold tracking-tight text-white">
                Notexia
              </span>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">
              Welcome back
            </h1>
            <p className="text-zinc-400 text-xs font-light">
              Sign in to access your notes and AI workspace
            </p>
          </div>

          {infoMessage && (
            <div className="p-3.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs font-medium">
              {infoMessage}
            </div>
          )}
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-medium">
              {error}
            </div>
          )}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-widest">
                      Email Address
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="you@example.com"
                        className="bg-zinc-950 border-white/10 focus:border-cyan-400 text-white placeholder-zinc-600 h-11 text-xs rounded-xl transition-[border-color,box-shadow] duration-150 ease-out"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-rose-400 text-xs" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-widest">
                      Password
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="••••••••"
                        className="bg-zinc-950 border-white/10 focus:border-cyan-400 text-white placeholder-zinc-600 h-11 text-xs rounded-xl transition-[border-color,box-shadow] duration-150 ease-out"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-rose-400 text-xs" />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                disabled={isLoading}
                className="group w-full rounded-full bg-white hover:bg-zinc-100 text-zinc-950 font-bold text-xs h-11 mt-2 flex items-center justify-center gap-2 transition-all duration-300 active:scale-[0.97] shadow-[0_0_25px_rgba(255,255,255,0.2)]"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-zinc-950" />
                    <span>Authenticating...</span>
                  </div>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowUpRight className="size-4 text-zinc-950 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </>
                )}
              </Button>
            </form>
          </Form>

          <div className="relative flex items-center justify-center my-4">
            <span className="absolute w-full h-px bg-white/5" />
            <span className="relative px-3 bg-[#07070a] text-zinc-500 text-[10px] font-mono font-bold uppercase tracking-widest">
              Or continue with
            </span>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={handleGoogleSignIn}
            className="w-full rounded-full border-white/10 bg-zinc-950 hover:bg-zinc-900 text-zinc-300 hover:text-white h-11 flex items-center justify-center gap-3 font-medium text-xs transition-colors"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
            </svg>
            Sign in with Google
          </Button>

          <div className="pt-2 text-center">
            <p className="text-zinc-500 text-xs">
              Don&apos;t have an account?{" "}
              <Link href="/signup" className="text-cyan-400 hover:text-cyan-300 font-semibold hover:underline transition-colors">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginClient() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#030305] p-4 relative overflow-hidden selection:bg-cyan-500/30 selection:text-cyan-200 antialiased">
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-gradient-to-b from-cyan-500/15 via-violet-600/10 to-transparent blur-[140px] opacity-70" />
      </div>

      <Suspense
        fallback={
          <div className="flex items-center justify-center text-zinc-100 gap-2 bg-zinc-900/80 p-8 rounded-2xl border border-white/10">
            <Loader2 className="h-6 w-6 animate-spin text-cyan-400" />
            <span className="text-xs font-mono">Loading authentication...</span>
          </div>
        }
      >
        <LoginForm />
      </Suspense>
    </div>
  );
}
