"use client";

import React, { useEffect, useState, useCallback } from "react";
import { HelpCircle, Plus, CheckCircle2, Clock, Trash2, ShieldQuestion, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useSession } from "next-auth/react";
import Link from "next/link";

interface DoubtData {
  _id: string;
  title: string;
  content: string;
  status: "open" | "resolved";
  userId: {
    _id: string;
    name: string;
    email: string;
    image?: string;
  };
  createdAt: string;
}

export default function DoubtsPage() {
  const { data: session } = useSession();
  const currentUserId = session?.user?.id;

  const [doubts, setDoubts] = useState<DoubtData[]>([]);
  const [activeTab, setActiveTab] = useState<"all" | "mine">("all");
  const [isLoading, setIsLoading] = useState(true);

  // Form states
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchDoubts = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/doubts?userOnly=${activeTab === "mine"}`);
      if (res.ok) {
        const data = await res.json();
        setDoubts(data);
      }
    } catch (e) {
      console.error("fetch doubts error:", e);
    } finally {
      setIsLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchDoubts();
  }, [fetchDoubts]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/doubts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content }),
      });
      if (res.ok) {
        setTitle("");
        setContent("");
        setIsOpen(false);
        fetchDoubts();
      }
    } catch (e) {
      console.error("submit doubt error:", e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (doubtId: string, currentStatus: string) => {
    const nextStatus = currentStatus === "open" ? "resolved" : "open";
    try {
      const res = await fetch(`/api/doubts/${doubtId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (res.ok) {
        fetchDoubts();
      }
    } catch (e) {
      console.error("toggle status error:", e);
    }
  };

  const handleDelete = async (doubtId: string) => {
    if (!confirm("Are you sure you want to delete this doubt?")) return;
    try {
      const res = await fetch(`/api/doubts/${doubtId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchDoubts();
      }
    } catch (e) {
      console.error("delete doubt error:", e);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-neutral-950 overflow-y-auto custom-scroll relative">
      {/* Top ambient glows */}
      <div className="absolute top-0 right-1/4 w-[500px] h-[200px] bg-cyan-500/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Top Header Banner */}
      <div className="border-b border-neutral-900 bg-neutral-900/10 px-4 sm:px-8 py-4 sm:py-6 flex items-center justify-between shrink-0 select-none relative z-10">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-cyan-400" />
            <h1
              className="text-xl font-bold text-neutral-100 tracking-tight"
              style={{ fontFamily: "var(--font-space-grotesk)" }}
            >
              Doubts Q&amp;A
            </h1>
          </div>
          <p className="text-neutral-500 text-xs">
            Submit doubts, collaborate, and close tickets to earn activity points.
          </p>
        </div>

        <Button
          onClick={() => setIsOpen(true)}
          className="bg-cyan-500 hover:bg-cyan-400 text-neutral-950 text-xs font-bold gap-1.5 h-9 px-4 rounded-lg shadow-[0_0_12px_rgba(6,182,212,0.25)] transition-all"
          style={{ fontFamily: "var(--font-space-grotesk)" }}
        >
          <Plus className="h-4 w-4" /> Ask a Doubt
        </Button>
      </div>

      {/* Content wrapper */}
      <div className="p-4 sm:p-8 space-y-6 max-w-4xl w-full mx-auto relative z-10">
        <div className="flex items-center gap-2 border-b border-neutral-900 pb-2 select-none">
          <button
            onClick={() => setActiveTab("all")}
            className={`text-xs font-bold px-3 py-1.5 rounded-lg uppercase tracking-wider transition-all ${
              activeTab === "all"
                ? "bg-neutral-900 border border-neutral-800 text-neutral-100"
                : "text-neutral-500 hover:text-neutral-300"
            }`}
            style={{ fontFamily: "var(--font-space-grotesk)" }}
          >
            All Doubts
          </button>
          <button
            onClick={() => setActiveTab("mine")}
            className={`text-xs font-bold px-3 py-1.5 rounded-lg uppercase tracking-wider transition-all ${
              activeTab === "mine"
                ? "bg-neutral-900 border border-neutral-800 text-neutral-100"
                : "text-neutral-500 hover:text-neutral-300"
            }`}
            style={{ fontFamily: "var(--font-space-grotesk)" }}
          >
            My Doubts
          </button>
        </div>

        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center text-neutral-500 text-xs gap-2 select-none font-semibold">
            <Loader2 className="h-6 w-6 animate-spin text-cyan-400" />
            <span style={{ fontFamily: "var(--font-jetbrains-mono)" }}>SYNCING DOUBTS QUEUE...</span>
          </div>
        ) : doubts.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center text-center space-y-4 border border-dashed border-neutral-900 rounded-2xl bg-neutral-900/5">
            <ShieldQuestion className="h-10 w-10 text-neutral-700" />
            <div className="space-y-1">
              <h3 className="text-neutral-300 font-bold text-sm" style={{ fontFamily: "var(--font-space-grotesk)" }}>
                No doubts recorded
              </h3>
              <p className="text-neutral-500 text-xs max-w-xs leading-normal">
                {activeTab === "mine" ? "You haven't submitted any doubts yet." : "No active doubts submitted by users."}
              </p>
            </div>
          </div>
        ) : (
          <div className="grid gap-4">
            {doubts.map((doubt) => {
              const isOwner = currentUserId === doubt.userId?._id;
              const isResolved = doubt.status === "resolved";

              return (
                <div
                  key={doubt._id}
                  className="bg-neutral-955/40 backdrop-blur-md border border-white/5 hover:border-cyan-500/20 hover:shadow-[0_0_20px_rgba(6,182,212,0.04)] rounded-xl p-5 transition-all duration-300 space-y-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <h2
                        className="text-sm font-bold text-neutral-100 leading-snug"
                        style={{ fontFamily: "var(--font-space-grotesk)" }}
                      >
                        {doubt.title}
                      </h2>
                      <div
                        className="flex items-center gap-2 text-[10px] text-neutral-500"
                        style={{ fontFamily: "var(--font-jetbrains-mono)" }}
                      >
                        <span>Asked by: <Link href={`/user/${doubt.userId?._id}`} className="text-neutral-400 hover:text-cyan-400 transition-colors font-bold">{doubt.userId?.name || "Deleted User"}</Link></span>
                        <span>•</span>
                        <span>{new Date(doubt.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 select-none">
                      <span
                        className={`text-[9px] px-2.5 py-0.5 rounded border font-bold flex items-center gap-1 ${
                          isResolved
                            ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                            : "bg-amber-500/10 border-amber-500/20 text-amber-400"
                        }`}
                        style={{ fontFamily: "var(--font-space-grotesk)" }}
                      >
                        {isResolved ? <CheckCircle2 className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                        {isResolved ? "Resolved" : "Open"}
                      </span>
                    </div>
                  </div>

                  <p className="text-neutral-405 text-xs leading-relaxed whitespace-pre-wrap">{doubt.content}</p>

                  {(isOwner || isResolved) && (
                    <div className="flex items-center justify-between border-t border-neutral-900/60 pt-3 select-none">
                      {isOwner ? (
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleToggleStatus(doubt._id, doubt.status)}
                            className={`h-7 px-2.5 text-[10px] font-bold transition-colors ${
                              isResolved ? "text-amber-450 hover:text-amber-300" : "text-emerald-450 hover:text-emerald-300"
                            }`}
                            style={{ fontFamily: "var(--font-space-grotesk)" }}
                          >
                            {isResolved ? "Reopen Doubt" : "Mark as Resolved"}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDelete(doubt._id)}
                            className="h-7 px-2.5 text-[10px] text-neutral-500 hover:text-red-400 hover:bg-neutral-900 transition-colors"
                            style={{ fontFamily: "var(--font-space-grotesk)" }}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      ) : (
                        <div />
                      )}
                      {isResolved && (
                        <span
                          className="text-[10px] text-emerald-400/80 italic flex items-center gap-1 font-bold"
                          style={{ fontFamily: "var(--font-space-grotesk)" }}
                        >
                          🎉 Resolved successfully! (+15 pts)
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Ask Doubt modal */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="bg-neutral-955/80 backdrop-blur-lg border border-white/10 text-neutral-100 max-w-md cyber-panel">
          <form onSubmit={handleSubmit} className="space-y-4">
            <DialogHeader>
              <DialogTitle
                className="text-neutral-105 text-sm font-bold"
                style={{ fontFamily: "var(--font-space-grotesk)" }}
              >
                Ask a New Doubt
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3 py-2">
              <Input
                placeholder="Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="input-premium h-10 text-xs placeholder-neutral-600 font-sans"
              />
              <textarea
                placeholder="Describe your query in detail..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
                rows={4}
                className="w-full input-premium placeholder-neutral-600 p-3 text-xs resize-none transition-all"
              />
            </div>
            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                type="button"
                onClick={() => setIsOpen(false)}
                className="btn-premium-secondary text-xs h-9 px-4 cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="btn-premium-primary text-xs h-9 px-4 font-bold cursor-pointer"
                style={{ fontFamily: "var(--font-space-grotesk)" }}
              >
                {isSubmitting ? "Submitting..." : "Submit Doubt"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
