/* eslint-disable @next/next/no-img-element */
"use client";

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
  CheckCircle,
  ArrowRight,
  ClipboardList,
  ArrowUpRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";

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
    <div className="flex-1 flex flex-col h-full bg-[#030305] text-zinc-100 overflow-y-auto antialiased relative selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Background Ambient Mesh Glow Orbs */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 right-1/4 w-[500px] h-[350px] bg-violet-500/10 rounded-full blur-[140px]" />
      </div>

      {/* Header Banner */}
      <div className="border-b border-white/5 bg-zinc-950/40 p-8 rounded-[2rem] border border-white/10 relative z-10 backdrop-blur-2xl m-6 sm:m-10 mb-0">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="size-14 rounded-2xl bg-violet-500/10 flex items-center justify-center border border-violet-500/20 text-violet-400">
              <Calendar className="size-7" />
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tight text-white flex items-center gap-3">
                AI Daily Planner
                <span className="text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 px-3 py-1 rounded-full border border-amber-500/30 uppercase tracking-widest flex items-center gap-1">
                  <Sparkles className="size-3 text-amber-400" /> GEMINI AI ENHANCED
                </span>
              </h1>
              <p className="text-zinc-400 text-xs sm:text-sm font-light mt-1">
                The AI agent parses your notes and todo items to craft an optimized hourly daily schedule.
              </p>
            </div>
          </div>

          <Button
            onClick={handleGeneratePlan}
            disabled={isPlanning}
            className="group rounded-full bg-white hover:bg-zinc-100 text-zinc-950 font-bold text-xs h-11 px-6 flex items-center justify-center gap-2 transition-all duration-300 active:scale-[0.97] shadow-[0_0_20px_rgba(255,255,255,0.15)]"
          >
            {isPlanning ? (
              <>
                <Loader2 className="size-4 animate-spin text-zinc-950" />
                <span>Analyzing Workspace...</span>
              </>
            ) : (
              <>
                <Sparkles className="size-4 text-zinc-950" />
                <span>Generate Today&apos;s Plan</span>
                <ArrowUpRight className="size-4 text-zinc-950 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Main Workspace Body */}
      <div className="p-6 sm:p-10 max-w-5xl w-full mx-auto space-y-8 relative z-10">
        {isPlanning ? (
          <div className="py-20 flex flex-col items-center justify-center text-zinc-500 text-xs gap-3 font-semibold">
            <Loader2 className="size-8 animate-spin text-violet-400" />
            <span className="font-mono text-zinc-400 tracking-widest">COMPILING HOURLY TIMELINE...</span>
          </div>
        ) : !planData ? (
          <div className="rounded-[2.5rem] bg-zinc-900/40 border border-white/10 p-2.5 backdrop-blur-3xl max-w-md mx-auto text-center my-12">
            <div className="rounded-[calc(2.5rem-0.75rem)] bg-[#07070a] border border-white/5 p-8 flex flex-col items-center gap-4">
              <ClipboardList className="size-10 text-zinc-600 animate-pulse" />
              <h3 className="text-lg font-bold text-white">Schedule Empty</h3>
              <p className="text-xs text-zinc-400 font-light max-w-xs leading-relaxed">
                Click &quot;Generate Today&apos;s Plan&quot; above to compile your personalized study timeline based on workspace notes and pending tasks.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Core Focus Header */}
            <div className="rounded-[2.5rem] bg-zinc-900/40 border border-white/10 p-2.5 backdrop-blur-3xl">
              <div className="rounded-[calc(2.5rem-0.75rem)] bg-[#07070a] border border-white/5 p-6 space-y-2">
                <h3 className="text-xs font-mono font-bold text-violet-400 uppercase tracking-widest flex items-center gap-2">
                  <Sparkles className="size-4 text-violet-400" /> Today&apos;s Core Focus
                </h3>
                <p className="text-xs text-zinc-300 font-light leading-relaxed">{planData.focus}</p>
              </div>
            </div>

            {/* Timeline Item Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {planData.timeline.map((item, idx) => {
                let iconElement = <Sun className="size-5 text-amber-400" />;
                if (item.timeSlot === "Afternoon") {
                  iconElement = <Sunset className="size-5 text-yellow-400" />;
                } else if (item.timeSlot === "Evening") {
                  iconElement = <Moon className="size-5 text-violet-400" />;
                }

                return (
                  <div key={idx} className="rounded-[2rem] bg-zinc-900/40 border border-white/10 p-2 backdrop-blur-xl hover:border-violet-500/40 transition-all duration-300 flex flex-col h-full">
                    <div className="rounded-[calc(2rem-0.5rem)] bg-[#07070a] border border-white/5 p-6 space-y-4 flex flex-col justify-between h-full">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {iconElement}
                            <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">{item.timeSlot}</span>
                          </div>
                          <span className="text-[10px] font-mono text-zinc-500 flex items-center gap-1">
                            <Clock className="size-3 text-cyan-400" /> {item.estimatedMinutes}m
                          </span>
                        </div>

                        <h4 className="text-sm font-bold text-white">{item.task}</h4>
                        <p className="text-xs text-zinc-400 font-light leading-relaxed">{item.reason}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Commit to Todo Action */}
            <div className="rounded-[2rem] bg-zinc-900/40 border border-white/10 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h4 className="text-sm font-bold text-white">Commit Timeline to Checklist</h4>
                <p className="text-xs text-zinc-400 font-light mt-0.5">Export these AI scheduled tasks directly into your interactive Todo Checklist.</p>
              </div>

              <Button
                onClick={handleCommitPlanToTodo}
                disabled={isCommitting || isCommitted}
                className={`rounded-full text-xs font-bold px-6 h-11 transition-all ${
                  isCommitted
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                    : "bg-white hover:bg-zinc-100 text-zinc-950 active:scale-[0.97]"
                }`}
              >
                {isCommitting ? (
                  <Loader2 className="size-4 animate-spin text-zinc-950" />
                ) : isCommitted ? (
                  <>
                    <CheckCircle className="size-4 mr-2" /> Tasks Committed
                  </>
                ) : (
                  <>
                    <span>Commit Tasks</span>
                    <ArrowRight className="size-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
