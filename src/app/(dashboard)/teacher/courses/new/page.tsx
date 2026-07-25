"use client";

import React from "react";
import { CourseForm } from "@/components/courses/CourseForm";
import { BookOpen, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function NewCoursePage() {
  return (
    <div className="flex-1 flex flex-col h-full bg-[#030305] text-zinc-100 overflow-y-auto antialiased relative selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Background Ambient Mesh Glow Orbs */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 right-1/4 w-[500px] h-[350px] bg-amber-500/10 rounded-full blur-[140px]" />
      </div>

      {/* Header Banner */}
      <div className="border-b border-white/5 bg-zinc-950/40 p-8 rounded-[2rem] border border-white/10 relative z-10 backdrop-blur-2xl m-6 sm:m-10 mb-0">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="size-14 rounded-2xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20 text-amber-400">
              <BookOpen className="size-7" />
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tight text-white flex items-center gap-3">
                Create New Course
                <span className="text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 px-3 py-1 rounded-full border border-amber-500/30 uppercase tracking-widest">
                  CURRICULUM BUILDER
                </span>
              </h1>
              <p className="text-zinc-400 text-xs sm:text-sm font-light mt-1">
                Build modules, add video lessons, write text guides, and configure student quizzes.
              </p>
            </div>
          </div>

          <Link href="/teacher/courses" className="text-xs font-mono text-amber-400 hover:text-amber-300 flex items-center gap-2 font-bold uppercase tracking-widest transition-colors">
            <ArrowLeft className="size-4" /> Back to Dashboard
          </Link>
        </div>
      </div>

      {/* Form Container */}
      <div className="p-6 sm:p-10 max-w-5xl w-full mx-auto space-y-8 relative z-10">
        <div className="rounded-[2.5rem] bg-zinc-900/40 border border-white/10 p-2.5 backdrop-blur-3xl">
          <div className="rounded-[calc(2.5rem-0.75rem)] bg-[#07070a] border border-white/5 p-8">
            <CourseForm />
          </div>
        </div>
      </div>
    </div>
  );
}
