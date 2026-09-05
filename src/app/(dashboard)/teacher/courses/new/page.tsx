"use client";

export const dynamic = "force-dynamic";

import React from "react";
import { CourseForm } from "@/components/courses/CourseForm";
import { BookOpen, ArrowLeft, Sparkles } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NewCoursePage() {
  return (
    <div className="flex-1 flex flex-col h-full bg-bg-base text-text-primary overflow-y-auto antialiased relative selection:bg-accent-primary/25 selection:text-text-primary custom-scroll">
      <div className="p-6 sm:p-8 lg:p-10 max-w-7xl w-full mx-auto space-y-8 relative z-10">
        {/* Studio Header Banner */}
        <div className="rounded-2xl bg-bg-surface border border-border-subtle p-6 sm:p-8 shadow-xl relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
            <div className="flex items-start gap-4">
              <div className="size-12 sm:size-14 rounded-xl bg-accent-primary/10 flex items-center justify-center border border-accent-primary/20 text-accent-primary shrink-0">
                <BookOpen className="size-6 sm:size-7" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-bold bg-accent-primary/15 text-accent-primary px-2.5 py-0.5 rounded-full border border-accent-primary/25 uppercase tracking-widest flex items-center gap-1">
                    <Sparkles className="size-3" /> Curriculum Studio
                  </span>
                  <span className="text-[10px] font-mono font-bold bg-success/15 text-success px-2.5 py-0.5 rounded-full border border-success/25 uppercase tracking-widest">
                    70% Creator Share
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-text-primary font-display">
                  Create New Course
                </h1>
                <p className="text-text-muted text-xs sm:text-sm font-light max-w-2xl leading-relaxed">
                  Build multi-module courses manually or auto-generate complete 5,000+ word structured curricula with AI.
                </p>
              </div>
            </div>

            <Link href="/teacher/courses" className="shrink-0">
              <Button
                variant="outline"
                className="rounded-xl border-border-subtle hover:bg-bg-elevated text-text-secondary hover:text-text-primary text-xs font-mono h-10 px-4 flex items-center gap-2 transition-colors cursor-pointer"
              >
                <ArrowLeft className="size-3.5" />
                <span>Back to Studio</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Course Form Wrapper */}
        <CourseForm />
      </div>
    </div>
  );
}

