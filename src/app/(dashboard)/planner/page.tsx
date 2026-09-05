"use client";

export const dynamic = "force-dynamic";

import React, { useState } from "react";
import { toast } from "sonner";
import {
  Calendar,
  Loader2,
  Sparkles,
  Sun,
  Sunset,
  Moon,
  Clock,
  CheckCircle2,
  ArrowRight,
  ClipboardList,
  ArrowUpRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

interface TimelineItem {
  timeSlot: "Morning" | "Afternoon" | "Evening";
  task: string;
  reason: string;
  estimatedMinutes: number;
}

interface PlannerData {
  date: string;
  focus: string;
  timeline: TimelineItem[];
}

export default function PlannerPage() {
  const [isPlanning, setIsPlanning] = useState<boolean>(false);
  const [planData, setPlanData] = useState<PlannerData | null>(null);

  // Database commit actions
  const [isCommitting, setIsCommitting] = useState<boolean>(false);
  const [isCommitted, setIsCommitted] = useState<boolean>(false);

  const handleGeneratePlan = async () => {
    setIsPlanning(true);
    setPlanData(null);
    setIsCommitted(false);

    try {
      const res = await fetch("/api/planner/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) {
        let errMessage = "Failed to generate schedule.";
        try {
          const errData = await res.json();
          if (errData.error) errMessage = errData.error;
        } catch {
          // ignore non-JSON body
        }
        throw new Error(errMessage);
      }

      const data = await res.json();

      setPlanData(data);
      toast.success("AI Daily Plan compiled! Review your timeline.");
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Error generating plan.");
    } finally {
      setIsPlanning(false);
    }
  };

  const handleCommitPlanToTodo = async () => {
    if (!planData) return;
    setIsCommitting(true);

    try {
      for (const item of planData.timeline) {
        const titleText = `[AI Planner] ${item.task} (${item.timeSlot})`;
        const res = await fetch("/api/todos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: titleText,
            reminderAt: null,
          }),
        });
        if (!res.ok) {
          throw new Error(`Failed to commit task: ${item.task}`);
        }
      }

      setIsCommitted(true);
      toast.success("Timeline tasks successfully committed to your Todo Checklist!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to commit generated tasks to database.");
    } finally {
      setIsCommitting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-transparent text-text-primary overflow-y-auto antialiased relative selection:bg-accent-primary/30 selection:text-text-primary custom-scroll p-4 sm:p-6 lg:p-8 space-y-8 max-w-6xl mx-auto w-full">
      {/* Header Banner */}
      <header className="rounded-2xl bg-bg-surface border border-border-subtle p-6 sm:p-8 backdrop-blur-xl shadow-lg relative z-10">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
          <div className="flex items-start sm:items-center gap-4">
            <div className="size-12 sm:size-14 rounded-2xl bg-accent-primary/10 border border-accent-primary/20 flex items-center justify-center text-accent-primary shrink-0 shadow-sm">
              <Calendar className="size-6 sm:size-7" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="text-[10px] font-mono font-bold text-accent-primary tracking-widest uppercase">
                  PLANNER WORKSPACE
                </span>
                <span className="text-[10px] font-mono font-bold bg-accent-primary/10 text-accent-primary px-2.5 py-0.5 rounded-full border border-accent-primary/20 uppercase tracking-widest flex items-center gap-1">
                  <Sparkles className="size-3" /> GEMINI AI ENHANCED
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-text-primary font-display">
                AI Daily Planner
              </h1>
              <p className="text-xs sm:text-sm text-text-muted max-w-xl leading-relaxed">
                Analyze your workspace notes and todo items to synthesize an optimized hourly study schedule.
              </p>
            </div>
          </div>

          <Button
            onClick={handleGeneratePlan}
            disabled={isPlanning}
            className="btn-premium-primary rounded-xl text-xs font-bold h-11 px-5 flex items-center justify-center gap-2 shrink-0 transition-transform active:scale-[0.98] cursor-pointer"
          >
            {isPlanning ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                <span>Analyzing Workspace...</span>
              </>
            ) : (
              <>
                <Sparkles className="size-4" />
                <span>Generate Today&apos;s Plan</span>
                <ArrowUpRight className="size-4" />
              </>
            )}
          </Button>
        </div>
      </header>

      {/* Main Workspace Body */}
      <main className="space-y-6 relative z-10">
        <AnimatePresence mode="wait">
          {isPlanning ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="rounded-2xl bg-bg-card border border-border-subtle p-16 flex flex-col items-center justify-center text-center space-y-4"
            >
              <div className="size-14 rounded-2xl bg-accent-primary/10 border border-accent-primary/20 flex items-center justify-center text-accent-primary">
                <Loader2 className="size-7 animate-spin" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-mono font-bold text-text-primary tracking-widest uppercase">
                  Compiling Study Timeline
                </h3>
                <p className="text-xs text-text-muted">
                  Cross-referencing active notes, topics, and deadlines...
                </p>
              </div>
            </motion.div>
          ) : !planData ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="rounded-2xl bg-bg-card border border-border-subtle p-8 sm:p-12 max-w-md mx-auto text-center space-y-4 shadow-sm"
            >
              <div className="size-14 rounded-2xl bg-bg-elevated border border-border-subtle flex items-center justify-center text-text-muted mx-auto">
                <ClipboardList className="size-7 text-accent-primary" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-base font-bold text-text-primary font-display">Schedule Empty</h3>
                <p className="text-xs text-text-muted leading-relaxed">
                  Click &quot;Generate Today&apos;s Plan&quot; above to synthesize a personalized timeline based on workspace notes and pending tasks.
                </p>
              </div>
              <Button
                onClick={handleGeneratePlan}
                variant="outline"
                className="rounded-xl border-border-subtle bg-bg-surface hover:bg-bg-elevated text-xs font-semibold h-9 px-4 text-text-secondary hover:text-text-primary cursor-pointer"
              >
                Start Scheduling
              </Button>
            </motion.div>
          ) : (
            <motion.div
              key="content"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              {/* Core Focus Header Card */}
              <div className="rounded-2xl bg-bg-card border border-border-subtle p-6 space-y-2 shadow-sm">
                <div className="flex items-center gap-2">
                  <Sparkles className="size-4 text-accent-primary" />
                  <h3 className="text-xs font-mono font-bold text-accent-primary uppercase tracking-widest">
                    Today&apos;s Core Focus
                  </h3>
                </div>
                <p className="text-sm text-text-primary leading-relaxed pl-6">
                  {planData.focus}
                </p>
              </div>

              {/* Timeline Item Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {planData.timeline.map((item, idx) => {
                  let iconElement = <Sun className="size-5 text-accent-primary" />;
                  if (item.timeSlot === "Afternoon") {
                    iconElement = <Sunset className="size-5 text-accent-secondary" />;
                  } else if (item.timeSlot === "Evening") {
                    iconElement = <Moon className="size-5 text-accent-primary/80" />;
                  }

                  return (
                    <div
                      key={idx}
                      className="rounded-2xl bg-bg-card border border-border-subtle hover:border-accent-primary/30 p-5 flex flex-col justify-between h-full transition-all duration-200 shadow-sm space-y-4"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {iconElement}
                            <span className="text-xs font-mono font-bold text-text-primary uppercase tracking-wider">
                              {item.timeSlot}
                            </span>
                          </div>
                          <span className="text-[10px] font-mono text-text-muted bg-bg-elevated border border-border-subtle px-2 py-0.5 rounded-md flex items-center gap-1">
                            <Clock className="size-3 text-text-muted" /> {item.estimatedMinutes}m
                          </span>
                        </div>

                        <h4 className="text-sm font-bold text-text-primary font-display leading-snug">
                          {item.task}
                        </h4>
                        <p className="text-xs text-text-muted leading-relaxed">
                          {item.reason}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Commit to Todo Action Card */}
              <div className="rounded-2xl bg-bg-surface border border-border-subtle p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-text-primary font-display">
                    Commit Timeline to Checklist
                  </h4>
                  <p className="text-xs text-text-muted">
                    Export these scheduled blocks directly into your interactive Todo Checklist.
                  </p>
                </div>

                <Button
                  onClick={handleCommitPlanToTodo}
                  disabled={isCommitting || isCommitted}
                  className={`rounded-xl text-xs font-bold px-5 h-10 transition-all shrink-0 cursor-pointer ${
                    isCommitted
                      ? "bg-success/15 text-success border border-success/30 hover:bg-success/20"
                      : "btn-premium-primary"
                  }`}
                >
                  {isCommitting ? (
                    <>
                      <Loader2 className="size-3.5 animate-spin" />
                      <span>Saving to Checklist...</span>
                    </>
                  ) : isCommitted ? (
                    <>
                      <CheckCircle2 className="size-4 mr-1.5" />
                      <span>Tasks Committed</span>
                    </>
                  ) : (
                    <>
                      <span>Commit Tasks</span>
                      <ArrowRight className="size-3.5 ml-1.5" />
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
