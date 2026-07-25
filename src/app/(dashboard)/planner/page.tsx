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

  // Auto-generate on load if data is empty (or have user click)
  const handleGeneratePlan = async () => {
    setIsPlanning(true);
    setPlanData(null);
    setIsCommitted(false);

    try {
      const res = await fetch("/api/planner/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to generate schedule.");
      }

      setPlanData(data);
      toast.success("AI Daily Plan compiled! Review your timeline.");
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Error generating plan.");
    } finally {
      setIsPlanning(false);
    }
  };

  // Push AI planner items directly into MongoDB via /api/todos POST API
  const handleCommitPlanToTodo = async () => {
    if (!planData) return;
    setIsCommitting(true);

    try {
      // Execute serial POST fetches to register each timeline item into the database Todo list
      for (const item of planData.timeline) {
        const titleText = `[AI Planner] ${item.task} (${item.timeSlot})`;
        const res = await fetch("/api/todos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: titleText,
            reminderAt: null, // Default to null, can be customized
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
    <div className="flex-1 flex flex-col h-full bg-neutral-950 overflow-y-auto custom-scroll p-4 sm:p-6 lg:p-8 select-none relative">
      
      {/* Decorative gradients */}
      <div className="absolute top-[-10%] right-[-10%] w-[350px] h-[350px] bg-violet-600/5 rounded-full filter blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-15%] left-[-10%] w-[400px] h-[400px] bg-cyan-600/4 rounded-full filter blur-[120px] pointer-events-none" />

      {/* Page Header */}
      <header className="mb-6 sm:mb-8 shrink-0 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 relative z-10">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Calendar className="h-6 w-6 text-violet-400 animate-pulse" />
            <h1 className="text-xl sm:text-2xl font-bold text-neutral-100 uppercase tracking-widest" style={{ fontFamily: "var(--font-space-grotesk)" }}>
              AI Daily Planner
            </h1>
            <span className="text-[9px] bg-gradient-to-r from-amber-500/20 to-purple-500/20 text-amber-300 font-bold px-2 py-0.5 rounded border border-amber-500/30 font-mono flex items-center gap-1">
              <Sparkles className="h-3 w-3 text-amber-400" /> GEMINI AI PREMIUM
            </span>
          </div>
          <p className="text-xs text-neutral-550 max-w-xl leading-relaxed">
            Consolidate your studies. The agent parses active Notes documents and outstanding Todo items to generate a customized hourly timeline planner.
          </p>
        </div>
        
        <Button
          onClick={handleGeneratePlan}
          disabled={isPlanning}
          className="btn-premium-primary text-xs font-bold uppercase tracking-wider h-11 px-6 rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-lg sm:w-auto"
          style={{ fontFamily: "var(--font-space-grotesk)" }}
        >
          {isPlanning ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Analyzing Workspace...</span>
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              <span>Generate Today&apos;s Plan</span>
            </>
          )}
        </Button>
      </header>

      {/* Main Workspace Body */}
      <main className="flex-1 bg-neutral-900/40 border border-neutral-850 rounded-2xl overflow-hidden flex flex-col shadow-2xl relative z-10 min-h-[450px]">
        
        {/* Output Header Panel */}
        <div className="px-5 py-3.5 border-b border-neutral-850 bg-neutral-900/70 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-violet-400 animate-pulse" />
            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest font-space">
              Timeline Desk
            </span>
          </div>

          {planData && (
            <span className="text-[10px] text-neutral-500 font-mono">
              Date Context: {planData.date}
            </span>
          )}
        </div>

        {/* Output Body Content */}
        <div className="flex-1 p-5 sm:p-6 overflow-y-auto custom-scroll flex flex-col">
          {isPlanning ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-20 gap-4">
              <Loader2 className="h-10 w-10 animate-spin text-violet-400" />
              <div>
                <p className="text-sm font-bold text-neutral-200 uppercase tracking-widest font-space">AI Planner Agent Running</p>
                <p className="text-[11px] text-neutral-555 italic mt-1.5">Scanning files structure, fetching checklists, building timeline schedule...</p>
              </div>
            </div>
          ) : !planData ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-28 select-none">
              <ClipboardList className="h-12 w-12 text-neutral-800 mb-3 animate-pulse opacity-55" />
              <p className="text-sm font-bold text-neutral-300 uppercase tracking-wider font-space">Today&apos;s Schedule Empty</p>
              <p className="text-[11px] text-neutral-550 max-w-sm mt-1 leading-relaxed">
                Click &quot;Generate Today&apos;s Plan&quot; at the top right to start compiling a timeline based on your notes and outstanding checklists.
              </p>
            </div>
          ) : (
            <div className="flex-1 flex flex-col gap-6 animate-fade-in">
              
              {/* Daily Focus block */}
              <div className="bg-neutral-950/60 border border-neutral-855 rounded-2xl p-5 shadow-inner">
                <h3 className="text-xs font-bold text-violet-400 uppercase tracking-wider font-space mb-2.5 flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 text-violet-400" /> Today&apos;s Core Focus
                </h3>
                <p className="text-xs text-neutral-300 leading-relaxed font-sans select-text">
                  {planData.focus}
                </p>
              </div>

              {/* Timeline list section */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {planData.timeline.map((item, idx) => {
                  let iconElement = <Sun className="h-5 w-5 text-amber-500" />;
                  
                  if (item.timeSlot === "Afternoon") {
                    iconElement = <Sunset className="h-5 w-5 text-yellow-500" />;
                  } else if (item.timeSlot === "Evening") {
                    iconElement = <Moon className="h-5 w-5 text-indigo-400" />;
                  }

                  return (
                    <div 
                      key={idx} 
                      className="bg-neutral-950/20 border border-neutral-850 p-5 rounded-2xl flex flex-col justify-between gap-5 relative hover:border-violet-500/20 transition-all shadow-md group"
                    >
                      {/* Slots Header */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-lg bg-neutral-900 border border-neutral-800 flex items-center justify-center flex-shrink-0">
                            {iconElement}
                          </div>
                          <span className="text-[10px] font-bold text-neutral-200 uppercase tracking-widest font-space">
                            {item.timeSlot}
                          </span>
                        </div>
                        <span className="text-[9px] bg-neutral-900 border border-neutral-800 text-neutral-450 font-bold px-2 py-0.5 rounded font-mono">
                          {item.estimatedMinutes} mins
                        </span>
                      </div>

                      {/* Info section */}
                      <div className="space-y-2 select-text flex-1">
                        <h4 className="text-xs sm:text-sm font-bold text-neutral-205 leading-snug group-hover:text-violet-400 transition-colors">
                          {item.task}
                        </h4>
                        <p className="text-[11px] text-neutral-450 leading-relaxed font-sans">
                          {item.reason}
                        </p>
                      </div>

                      {/* Time slot metadata info */}
                      <div className="flex items-center gap-1.5 text-[9px] font-mono text-neutral-600 border-t border-neutral-900/60 pt-2.5 select-none">
                        <Clock className="h-3 w-3" />
                        <span>Recommended target duration</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Commit Synchronizer footer block */}
              <div className="mt-auto pt-6 border-t border-neutral-850/60 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-start gap-2.5">
                  <div className="h-9 w-9 rounded-full bg-violet-500/10 border border-violet-500/30 flex items-center justify-center text-violet-400 shrink-0">
                    <ClipboardList className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-neutral-200 font-space uppercase">Checklist database sync</p>
                    <p className="text-[10px] text-neutral-550 max-w-sm leading-relaxed mt-0.5">Commit these generated plan items directly to your Todo checklist database as actionable checklist tasks.</p>
                  </div>
                </div>

                <Button
                  onClick={handleCommitPlanToTodo}
                  disabled={isCommitting || isCommitted}
                  className={`w-full sm:w-auto h-10 px-6 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer shadow-lg transition-all ${
                    isCommitted 
                      ? "bg-green-500/10 border border-green-500/30 text-green-400 cursor-default" 
                      : "btn-premium-primary"
                  }`}
                  style={{ fontFamily: "var(--font-space-grotesk)" }}
                >
                  {isCommitting ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Syncing tasks...</span>
                    </>
                  ) : isCommitted ? (
                    <>
                      <CheckCircle className="h-3.5 w-3.5" />
                      <span>Committed to Todos</span>
                    </>
                  ) : (
                    <>
                      <span>Commit Plan to Todo List</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </>
                  )}
                </Button>
              </div>

            </div>
          )}
        </div>
      </main>

    </div>
  );
}
