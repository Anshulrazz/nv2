/* eslint-disable @next/next/no-img-element */
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
  CheckCircle,
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
    <div className="flex-1 flex flex-col h-full bg-[#16261D] text-[#F3F0E4] overflow-y-auto antialiased relative selection:bg-[#F0C93B]/30 selection:text-[#F0C93B] custom-scroll">
      {/* Background Ambient Mesh Glow Orbs */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 right-1/4 w-[500px] h-[350px] bg-[#C9A9E0]/10 rounded-full blur-[140px] animate-float-glow" />
        <div className="absolute bottom-0 left-1/4 w-[450px] h-[350px] bg-[#8FC3DE]/10 rounded-full blur-[140px] animate-float-glow-reverse" />
      </div>

      {/* Header Banner */}
      <div className="p-6 sm:p-10 pb-0">
        <div className="border border-[#F3F0E4]/15 bg-[#1A2D23]/80 p-8 rounded-[2rem] relative z-10 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.3)]">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="size-14 rounded-2xl bg-[#C9A9E0]/15 flex items-center justify-center border border-[#C9A9E0]/30 text-[#C9A9E0]">
                <Calendar className="size-7" />
              </div>
              <div>
                <h1 className="text-3xl font-black tracking-tight text-[#F3F0E4] flex items-center gap-3 font-heading">
                  AI Daily Planner
                  <span className="text-[10px] font-mono font-bold bg-[#F0C93B]/20 text-[#F0C93B] px-3 py-1 rounded-full border border-[#F0C93B]/30 uppercase tracking-widest flex items-center gap-1">
                    <Sparkles className="size-3 text-[#F0C93B] animate-pulse" /> GEMINI AI ENHANCED
                  </span>
                </h1>
                <p className="text-[#9FAEA1] text-xs sm:text-sm font-light mt-1">
                  The AI agent parses your notes and todo items to craft an optimized hourly daily schedule.
                </p>
              </div>
            </div>

            <Button
              onClick={handleGeneratePlan}
              disabled={isPlanning}
              className="group rounded-xl bg-[#F0C93B] hover:bg-[#F0C93B]/90 text-[#2A2118] font-bold text-xs h-11 px-6 flex items-center justify-center gap-2 transition-all duration-300 active:scale-[0.97] shadow-[4px_4px_0_0_#F28B6E] hover:translate-x-0.5 hover:translate-y-0.5"
            >
              {isPlanning ? (
                <>
                  <Loader2 className="size-4 animate-spin text-[#2A2118]" />
                  <span>Analyzing Workspace...</span>
                </>
              ) : (
                <>
                  <Sparkles className="size-4 text-[#2A2118]" />
                  <span>Generate Today&apos;s Plan</span>
                  <ArrowUpRight className="size-4 text-[#2A2118] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Main Workspace Body */}
      <div className="p-6 sm:p-10 max-w-5xl w-full mx-auto space-y-8 relative z-10">
        <AnimatePresence mode="wait">
          {isPlanning ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="py-20 flex flex-col items-center justify-center text-[#9FAEA1] text-xs gap-3 font-semibold"
            >
              <Loader2 className="size-8 animate-spin text-[#F0C93B]" />
              <span className="font-mono text-[#F3F0E4]/80 tracking-widest">COMPILING HOURLY TIMELINE...</span>
            </motion.div>
          ) : !planData ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="rounded-[2.5rem] bg-[#1A2D23]/80 border border-[#F3F0E4]/15 p-2.5 backdrop-blur-3xl max-w-md mx-auto text-center my-12 shadow-[0_15px_40px_rgba(0,0,0,0.3)]"
            >
              <div className="rounded-[calc(2.5rem-0.75rem)] bg-[#121F18] border border-[#F3F0E4]/10 p-8 flex flex-col items-center gap-4">
                <ClipboardList className="size-10 text-[#8FC3DE] animate-pulse" />
                <h3 className="text-lg font-bold text-[#F3F0E4]">Schedule Empty</h3>
                <p className="text-xs text-[#9FAEA1] font-light max-w-xs leading-relaxed">
                  Click &quot;Generate Today&apos;s Plan&quot; above to compile your personalized study timeline based on workspace notes and pending tasks.
                </p>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="content"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="space-y-8"
            >
              {/* Core Focus Header */}
              <div className="rounded-[2.5rem] bg-[#1A2D23]/80 border border-[#F3F0E4]/15 p-2.5 backdrop-blur-3xl shadow-[0_15px_40px_rgba(0,0,0,0.3)]">
                <div className="rounded-[calc(2.5rem-0.75rem)] bg-[#121F18] border border-[#F3F0E4]/10 p-6 space-y-2">
                  <h3 className="text-xs font-mono font-bold text-[#C9A9E0] uppercase tracking-widest flex items-center gap-2">
                    <Sparkles className="size-4 text-[#C9A9E0]" /> Today&apos;s Core Focus
                  </h3>
                  <p className="text-xs text-[#F3F0E4] font-light leading-relaxed">{planData.focus}</p>
                </div>
              </div>

              {/* Timeline Item Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {planData.timeline.map((item, idx) => {
                  let iconElement = <Sun className="size-5 text-[#F0C93B]" />;
                  if (item.timeSlot === "Afternoon") {
                    iconElement = <Sunset className="size-5 text-[#F28B6E]" />;
                  } else if (item.timeSlot === "Evening") {
                    iconElement = <Moon className="size-5 text-[#C9A9E0]" />;
                  }

                  return (
                    <motion.div
                      key={idx}
                      whileHover={{ y: -4, scale: 1.02 }}
                      transition={{ type: "spring", stiffness: 350, damping: 20 }}
                      className="rounded-[2rem] bg-[#1A2D23]/80 border border-[#F3F0E4]/15 p-2 backdrop-blur-xl hover:border-[#F0C93B]/40 transition-all duration-300 flex flex-col h-full shadow-[0_10px_30px_rgba(0,0,0,0.2)]"
                    >
                      <div className="rounded-[calc(2rem-0.5rem)] bg-[#121F18] border border-[#F3F0E4]/10 p-6 space-y-4 flex flex-col justify-between h-full">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {iconElement}
                              <span className="text-xs font-mono font-bold text-[#F3F0E4] uppercase tracking-wider">{item.timeSlot}</span>
                            </div>
                            <span className="text-[10px] font-mono text-[#9FAEA1] flex items-center gap-1">
                              <Clock className="size-3 text-[#8FC3DE]" /> {item.estimatedMinutes}m
                            </span>
                          </div>

                          <h4 className="text-sm font-bold text-[#F3F0E4]">{item.task}</h4>
                          <p className="text-xs text-[#9FAEA1] font-light leading-relaxed">{item.reason}</p>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* Commit to Todo Action */}
              <div className="rounded-[2rem] bg-[#1A2D23]/80 border border-[#F3F0E4]/15 p-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-[0_15px_40px_rgba(0,0,0,0.3)]">
                <div>
                  <h4 className="text-sm font-bold text-[#F3F0E4]">Commit Timeline to Checklist</h4>
                  <p className="text-xs text-[#9FAEA1] font-light mt-0.5">Export these AI scheduled tasks directly into your interactive Todo Checklist.</p>
                </div>

                <Button
                  onClick={handleCommitPlanToTodo}
                  disabled={isCommitting || isCommitted}
                  className={`rounded-xl text-xs font-bold px-6 h-11 transition-all ${
                    isCommitted
                      ? "bg-[#8FC3DE]/20 text-[#8FC3DE] border border-[#8FC3DE]/40"
                      : "bg-[#F0C93B] hover:bg-[#F0C93B]/90 text-[#2A2118] active:scale-[0.97] shadow-[4px_4px_0_0_#F28B6E] hover:translate-x-0.5 hover:translate-y-0.5"
                  }`}
                >
                  {isCommitting ? (
                    <Loader2 className="size-4 animate-spin text-[#2A2118]" />
                  ) : isCommitted ? (
                    <>
                      <CheckCircle className="size-4 mr-2 text-[#8FC3DE]" /> Tasks Committed
                    </>
                  ) : (
                    <>
                      <span>Commit Tasks</span>
                      <ArrowRight className="size-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

