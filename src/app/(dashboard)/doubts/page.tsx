/* eslint-disable @next/next/no-img-element */
"use client";

export const dynamic = "force-dynamic";

import React, { useEffect, useState, useCallback } from "react";
import { HelpCircle, Plus, CheckCircle2, Clock, Trash2, ShieldQuestion, Loader2, ArrowUpRight, X } from "lucide-react";
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
  replies?: {
    _id: string;
    userId: {
      _id: string;
      name: string;
      image?: string;
    };
    content: string;
    createdAt: string;
  }[];
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

  // Reply states
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);

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

  const handleReplySubmit = async (doubtId: string) => {
    if (!replyContent.trim() || isSubmittingReply) return;

    setIsSubmittingReply(true);
    try {
      const res = await fetch(`/api/doubts/${doubtId}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: replyContent }),
      });
      if (res.ok) {
        setReplyContent("");
        setReplyingTo(null);
        fetchDoubts();
      }
    } catch (e) {
      console.error("submit reply error:", e);
    } finally {
      setIsSubmittingReply(false);
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
    <div className="flex-1 flex flex-col h-full bg-transparent text-[#FAFAF8] overflow-y-auto antialiased relative selection:bg-[#F5B429]/30 selection:text-[#FAFAF8]">
      {/* Background Ambient Mesh Glow Orbs */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 right-1/4 w-[500px] h-[350px] bg-[#F5B429]/10 rounded-full blur-[140px]" />
      </div>

      {/* Header Banner */}
      <div className="border-b border-[#2E2118] bg-[#150F0B]/80 p-8 rounded-[2rem] border border-[#2E2118] relative z-10 backdrop-blur-2xl m-6 sm:m-10 mb-0 shadow-[0_0_30px_-10px_rgba(245,148,29,0.15)]">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="size-14 rounded-2xl bg-[#F5B429]/10 flex items-center justify-center border border-[#F5B429]/20 text-[#F5B429]">
              <HelpCircle className="size-7" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#FAFAF8] flex flex-wrap items-center gap-3 font-display">
                Online Student Doubt Solver &amp; Academic Q&amp;A Hub
                <span className="text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 px-3 py-1 rounded-full border border-cyan-500/30 uppercase tracking-widest">
                  TICKET RESOLUTION
                </span>
              </h1>
              <p className="text-zinc-300 text-xs sm:text-sm font-normal mt-2 leading-relaxed max-w-2xl">
                Notexia&apos;s Instant Academic Doubt Solver connects students with peer scholars and AI study assistants to solve Physics, Chemistry, Mathematics, and Coding questions. Submit any query to receive step-by-step verified solutions and formula breakdowns.
              </p>
            </div>
          </div>

          <Button
            onClick={() => setIsOpen(true)}
            className="group rounded-full bg-white hover:bg-zinc-100 text-zinc-950 font-bold text-xs h-11 px-6 flex items-center justify-center gap-2 transition-all duration-300 active:scale-[0.97] shadow-[0_0_20px_rgba(255,255,255,0.15)]"
          >
            <Plus className="size-4 text-zinc-950" />
            <span>Ask a Doubt</span>
            <ArrowUpRight className="size-4 text-zinc-950 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </Button>
        </div>
      </div>

      {/* Filter Tabs & Doubt Tickets */}
      <div className="p-6 sm:p-10 max-w-4xl w-full mx-auto space-y-8 relative z-10">
        <div className="flex items-center gap-2 border-b border-white/5 pb-4 select-none">
          <button
            onClick={() => setActiveTab("all")}
            className={`text-xs font-mono font-bold px-4 py-2 rounded-full uppercase tracking-widest transition-all ${
              activeTab === "all"
                ? "bg-white/10 border border-white/20 text-white shadow-sm"
                : "text-zinc-500 hover:text-zinc-300 border border-transparent"
            }`}
          >
            All Doubts
          </button>
          <button
            onClick={() => setActiveTab("mine")}
            className={`text-xs font-mono font-bold px-4 py-2 rounded-full uppercase tracking-widest transition-all ${
              activeTab === "mine"
                ? "bg-white/10 border border-white/20 text-white shadow-sm"
                : "text-zinc-500 hover:text-zinc-300 border border-transparent"
            }`}
          >
            My Submitted Tickets
          </button>
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center text-zinc-500 text-xs gap-3 font-semibold">
            <Loader2 className="size-8 animate-spin text-cyan-400" />
            <span className="font-mono text-zinc-400 tracking-widest">LOADING DOUBT TICKETS...</span>
          </div>
        ) : doubts.length === 0 ? (
          <div className="rounded-[2.5rem] bg-zinc-900/40 border border-white/10 p-2.5 backdrop-blur-3xl max-w-md mx-auto text-center my-12">
            <div className="rounded-[calc(2.5rem-0.75rem)] bg-[#07070a] border border-white/5 p-8 flex flex-col items-center gap-4">
              <ShieldQuestion className="size-10 text-zinc-600" />
              <h3 className="text-lg font-bold text-white">No doubt tickets found</h3>
              <p className="text-xs text-zinc-400 font-light max-w-xs">
                {activeTab === "mine" ? "You haven't submitted any doubts yet." : "No open doubts currently logged."}
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {doubts.map((doubt) => {
              const isOwner = currentUserId === doubt.userId._id;

              return (
                <div key={doubt._id} className="rounded-[2rem] bg-zinc-900/40 border border-white/10 p-2 backdrop-blur-xl">
                  <div className="rounded-[calc(2rem-0.5rem)] bg-[#07070a] border border-white/5 p-6 space-y-5">
                    {/* Ticket Header */}
                    <div className="flex items-center justify-between select-none">
                      <div className="flex items-center gap-3">
                        {doubt.userId?.image ? (
                          <img src={doubt.userId.image} alt={doubt.userId.name} className="size-9 rounded-full object-cover border border-white/10 bg-zinc-900" />
                        ) : (
                          <div className="size-9 rounded-full bg-zinc-950 border border-white/10 flex items-center justify-center text-zinc-400 text-xs font-bold">
                            {doubt.userId?.name?.[0]?.toUpperCase()}
                          </div>
                        )}
                        <div>
                          <Link href={`/user/${doubt.userId._id}`}>
                            <p className="text-xs font-bold text-white hover:text-cyan-400 transition-colors">
                              {doubt.userId?.name}
                            </p>
                          </Link>
                          <p className="text-[10px] font-mono text-zinc-500 mt-0.5">
                            {new Date(doubt.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span
                          className={`text-[9px] font-mono font-bold px-3 py-1 rounded-full uppercase tracking-widest flex items-center gap-1.5 border ${
                            doubt.status === "resolved"
                              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                              : "bg-amber-500/10 border-amber-500/20 text-amber-400"
                          }`}
                        >
                          {doubt.status === "resolved" ? (
                            <>
                              <CheckCircle2 className="size-3" /> Resolved
                            </>
                          ) : (
                            <>
                              <Clock className="size-3 animate-pulse" /> Open
                            </>
                          )}
                        </span>

                        {isOwner && (
                          <button
                            onClick={() => handleToggleStatus(doubt._id, doubt.status)}
                            className="text-[10px] font-mono text-zinc-400 hover:text-white transition-colors underline"
                          >
                            Mark {doubt.status === "open" ? "Resolved" : "Open"}
                          </button>
                        )}
                        {isOwner && (
                          <button onClick={() => handleDelete(doubt._id)} className="text-zinc-500 hover:text-rose-400 transition-colors">
                            <Trash2 className="size-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="space-y-2">
                      <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                        {doubt.title}
                      </h3>
                      <p className="text-xs text-zinc-300 font-light leading-relaxed whitespace-pre-wrap">
                        {doubt.content}
                      </p>
                    </div>

                    {/* Reply Form */}
                    <div className="border-t border-white/5 pt-4 space-y-4">
                      {replyingTo === doubt._id ? (
                        <div className="space-y-3">
                          <textarea
                            value={replyContent}
                            onChange={(e) => setReplyContent(e.target.value)}
                            placeholder="Write your explanation or solution steps..."
                            rows={3}
                            className="w-full bg-zinc-950 border border-white/10 rounded-2xl p-3.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-cyan-400 resize-none transition-colors"
                          />
                          <div className="flex gap-2 justify-end">
                            <Button
                              variant="ghost"
                              onClick={() => setReplyingTo(null)}
                              className="text-xs text-zinc-400 hover:text-white rounded-full px-4"
                            >
                              Cancel
                            </Button>
                            <Button
                              onClick={() => handleReplySubmit(doubt._id)}
                              disabled={isSubmittingReply}
                              className="rounded-full bg-white hover:bg-zinc-100 text-zinc-950 text-xs font-bold h-9 px-5 transition-all"
                            >
                              {isSubmittingReply ? <Loader2 className="size-4 animate-spin text-zinc-950" /> : "Post Answer"}
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => setReplyingTo(doubt._id)}
                          className="text-xs font-mono text-cyan-400 hover:text-cyan-300 font-bold tracking-wider uppercase transition-colors"
                        >
                          + Write Solution Answer
                        </button>
                      )}

                      {/* Solutions list */}
                      {doubt.replies && doubt.replies.length > 0 && (
                        <div className="space-y-3 pt-2">
                          <h4 className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-widest">
                            Peer Solutions ({doubt.replies.length})
                          </h4>
                          {doubt.replies.map((reply) => (
                            <div key={reply._id} className="bg-zinc-950 p-4 rounded-2xl border border-white/5 space-y-2">
                              <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500">
                                <span className="font-bold text-white">{reply.userId?.name || "Peer Scholar"}</span>
                                <span>{new Date(reply.createdAt).toLocaleDateString()}</span>
                              </div>
                              <p className="text-xs text-zinc-300 font-light leading-relaxed">{reply.content}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* New Doubt Modal */}
      {isOpen && (
        <Dialog open={true} onOpenChange={() => setIsOpen(false)}>
          <DialogContent className="bg-zinc-950 border border-white/10 text-white max-w-md rounded-3xl p-6">
            <DialogHeader className="flex flex-row items-center justify-between">
              <DialogTitle className="text-lg font-bold text-white">Ask an Academic Doubt</DialogTitle>
              <button onClick={() => setIsOpen(false)} className="text-zinc-500 hover:text-white">
                <X className="size-4" />
              </button>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4 py-2">
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-widest block">Doubt Headline</label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Why does DFS use stack while BFS uses queue?"
                  required
                  className="bg-zinc-900 border-white/10 text-white placeholder-zinc-600 h-11 text-xs rounded-xl"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-widest block">Detailed Explanation</label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Describe your exact doubt context, code snippet, or formula..."
                  rows={5}
                  required
                  className="w-full bg-zinc-900 border border-white/10 rounded-2xl p-3.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-cyan-400 resize-none transition-colors"
                />
              </div>

              <DialogFooter className="pt-2">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full rounded-full bg-white hover:bg-zinc-100 text-zinc-950 font-bold text-xs h-11 transition-all"
                >
                  {isSubmitting ? <Loader2 className="size-4 animate-spin text-zinc-950" /> : "Log Doubt Ticket"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
