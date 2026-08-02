"use client";

export const dynamic = "force-dynamic";

import React from "react";
import { CourseForm } from "@/components/courses/CourseForm";
import { BookOpen, ArrowLeft, Sparkles } from "lucide-react";
import Link from "next/link";

export default function NewCoursePage() {
  return (
    <div className="flex-1 flex flex-col h-full bg-[#030305] text-zinc-100 overflow-y-auto antialiased relative selection:bg-amber-500/30 selection:text-amber-200">
      {/* Background Ambient Mesh Glow Orbs */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 right-1/4 w-[600px] h-[400px] bg-gradient-to-b from-amber-500/10 via-violet-600/5 to-transparent rounded-full blur-[140px]" />
        <div className="absolute bottom-10 left-10 w-[400px] h-[300px] bg-cyan-500/5 rounded-full blur-[120px]" />
      </div>

      {/* Header Banner */}
      <div className="border-b border-white/5 bg-zinc-950/60 p-6 sm:p-8 rounded-[2.5rem] border border-white/10 relative z-10 backdrop-blur-2xl m-4 sm:m-8 lg:m-10 mb-0 shadow-2xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="size-14 rounded-2xl bg-gradient-to-tr from-amber-500/20 to-amber-500/5 flex items-center justify-center border border-amber-500/30 text-amber-400 shadow-inner shrink-0">
              <BookOpen className="size-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold bg-amber-500/15 text-amber-300 px-3 py-0.5 rounded-full border border-amber-500/30 uppercase tracking-widest flex items-center gap-1">
                  <Sparkles className="size-3 text-amber-400" /> CURRICULUM STUDIO
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white mt-1">
                Create & Publish Course
              </h1>
              <p className="text-zinc-400 text-xs sm:text-sm font-light mt-0.5 max-w-xl">
                Build multi-module courses manually or auto-generate complete 5,000+ word structured curricula with AI. Earn <strong className="text-emerald-400 font-semibold">70% creator share</strong> on every purchase.
              </p>
            </div>
          </div>

          <Link
            href="/teacher/courses"
            className="text-xs font-mono text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 px-4 py-2 rounded-xl border border-amber-500/30 flex items-center gap-2 font-bold uppercase tracking-wider transition-all duration-200 shrink-0"
          >
            <ArrowLeft className="size-4" /> Back to Studio
          </Link>
        </div>
      </div>

      {/* Form Container */}
      <div className="p-4 sm:p-8 lg:p-10 max-w-5xl w-full mx-auto space-y-8 relative z-10">
        <div className="rounded-[2.5rem] bg-zinc-900/30 border border-white/10 p-2 sm:p-3 backdrop-blur-3xl shadow-[0_0_80px_rgba(0,0,0,0.8)]">
          <div className="rounded-[calc(2.5rem-0.75rem)] bg-[#07070a] border border-white/5 p-6 sm:p-10">
            <CourseForm />
          </div>
        </div>
      </div>
    </div>
  );
}
