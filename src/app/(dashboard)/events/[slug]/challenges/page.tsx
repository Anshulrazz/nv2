"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Trophy,
  CheckCircle2,
  Lock,
  HelpCircle,
  Loader2,
  ArrowLeft,
  Terminal,
  ExternalLink,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface ChallengeItem {
  _id: string;
  title: string;
  description: string;
  category: string;
  difficulty: "easy" | "medium" | "hard";
  points: number;
  timeLimitSeconds: number;
  hints?: Array<{ text: string; pointsPenalty: number }>;
  attachmentUrls?: string[];
  order: number;
}

interface AttemptData {
  challengeId: string;
  status: "not_started" | "in_progress" | "solved" | "expired" | "locked";
  startedAt?: string;
  timeTakenSeconds?: number;
  pointsAwarded?: number;
  hintsUsed?: number[];
  wrongAttemptCount?: number;
}

export default function CTFChallengesPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [eventId, setEventId] = useState<string | null>(null);
  const [eventTitle, setEventTitle] = useState("");
  const [challenges, setChallenges] = useState<ChallengeItem[]>([]);
  const [attempts, setAttempts] = useState<Record<string, AttemptData>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Challenge Input State
  const [flagInputs, setFlagInputs] = useState<Record<string, string>>({});
  const [submittingFlagId, setSubmittingFlagId] = useState<string | null>(null);
  const [shakingId, setShakingId] = useState<string | null>(null);
  const [flagMessages, setFlagMessages] = useState<Record<string, { type: "success" | "error"; text: string }>>({});

  // Hint Drawer State
  const [revealedHints, setRevealedHints] = useState<Record<string, Record<number, string>>>({});
  const [loadingHintKey, setLoadingHintKey] = useState<string | null>(null);

  const fetchEventData = useCallback(async () => {
    try {
      const res = await fetch(`/api/events/${slug}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Event not found");

      setEventId(data.event._id);
      setEventTitle(data.event.title);

      // Fetch challenges (flags never exposed)
      const chRes = await fetch(`/api/events/${data.event._id}/challenges`);
      const chData = await chRes.json();
      if (chRes.ok) {
        setChallenges(chData.challenges || []);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load CTF challenges";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    if (slug) fetchEventData();
  }, [slug, fetchEventData]);

  // Start Challenge Attempt Timer
  const handleStartChallenge = async (challengeId: string) => {
    if (!eventId) return;
    try {
      const res = await fetch(`/api/events/${eventId}/challenges/${challengeId}/start`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to start challenge");

      setAttempts((prev) => ({
        ...prev,
        [challengeId]: {
          challengeId,
          status: data.status,
          startedAt: data.startedAt,
          hintsUsed: data.hintsUsed || [],
          wrongAttemptCount: data.wrongAttemptCount || 0,
        },
      }));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error starting challenge";
      alert(msg);
    }
  };

  // Flag Submission Engine
  const handleFlagSubmit = async (challengeId: string) => {
    const inputVal = flagInputs[challengeId];
    if (!eventId || !inputVal || submittingFlagId) return;

    setSubmittingFlagId(challengeId);
    setFlagMessages((prev) => ({ ...prev, [challengeId]: { type: "error", text: "" } }));

    try {
      const res = await fetch(`/api/events/${eventId}/challenges/${challengeId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ flag: inputVal }),
      });
      const data = await res.json();

      if (!res.ok) {
        // Trigger Shake animation on wrong flag
        setShakingId(challengeId);
        setTimeout(() => setShakingId(null), 600);

        throw new Error(data.error || "Incorrect flag. Try again!");
      }

      // Success
      setFlagMessages((prev) => ({
        ...prev,
        [challengeId]: { type: "success", text: data.message },
      }));

      setAttempts((prev) => ({
        ...prev,
        [challengeId]: {
          challengeId,
          status: "solved",
          pointsAwarded: data.pointsAwarded,
          timeTakenSeconds: data.timeTakenSeconds,
        },
      }));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Flag verification failed";
      setFlagMessages((prev) => ({
        ...prev,
        [challengeId]: { type: "error", text: msg },
      }));
    } finally {
      setSubmittingFlagId(null);
    }
  };

  // Reveal Hint with Point Penalty
  const handleRevealHint = async (challengeId: string, hintIndex: number, penalty: number) => {
    if (!eventId) return;
    if (!confirm(`Reveal hint #${hintIndex + 1}? This will deduct -${penalty} points from your final award.`)) {
      return;
    }

    const key = `${challengeId}_${hintIndex}`;
    setLoadingHintKey(key);

    try {
      const res = await fetch(`/api/events/${eventId}/challenges/${challengeId}/hint/${hintIndex}`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to reveal hint");

      setRevealedHints((prev) => ({
        ...prev,
        [challengeId]: {
          ...(prev[challengeId] || {}),
          [hintIndex]: data.hintText,
        },
      }));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error revealing hint";
      alert(msg);
    } finally {
      setLoadingHintKey(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0E12] text-[#E0E6ED] flex flex-col items-center justify-center p-8 space-y-4 font-mono">
        <Loader2 className="size-8 text-emerald-400 animate-spin" />
        <p className="text-xs text-emerald-500">Initializing CTF Terminal Sandbox...</p>
      </div>
    );
  }

  if (error || !eventId) {
    return (
      <div className="w-full min-h-screen bg-[#0A0E12] text-[#E0E6ED] p-8 max-w-xl mx-auto space-y-6 font-mono">
        <Link href="/events">
          <Button variant="ghost" size="sm" className="gap-2 text-xs text-emerald-400 hover:bg-emerald-500/10">
            <ArrowLeft className="size-4" /> Back to Events
          </Button>
        </Link>
        <div className="p-8 text-center bg-[#121820] border border-red-500/30 rounded-3xl space-y-3">
          <h2 className="text-xl font-bold text-red-400">CTF Access Error</h2>
          <p className="text-xs text-zinc-400">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-[#0A0E12] text-[#E0E6ED] p-4 sm:p-6 lg:p-10 space-y-8 font-sans selection:bg-emerald-500/30">
      {/* CTF Terminal Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Link href="/events">
              <Button variant="ghost" size="sm" className="gap-2 text-xs font-mono text-emerald-400 hover:bg-emerald-500/10 p-0 h-auto">
                <ArrowLeft className="size-3.5" /> Hub
              </Button>
            </Link>
            <span className="text-zinc-600 font-mono">/</span>
            <span className="px-2.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-mono text-[11px] font-bold border border-emerald-500/20">
              CTF ARENA
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2" style={{ fontFamily: "var(--font-space-grotesk)" }}>
            <Terminal className="size-6 text-emerald-400" /> {eventTitle}
          </h1>
        </div>

        {/* Quick Nav to Leaderboard & Results */}
        <div className="flex items-center gap-3 font-mono">
          <Link href={`/events/${slug}/leaderboard`}>
            <Button size="sm" className="bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-bold text-xs border border-emerald-500/40 rounded-xl flex items-center gap-1.5">
              <Trophy className="size-4 text-amber-400" /> Live Leaderboard
            </Button>
          </Link>
        </div>
      </div>

      {/* Challenge Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {challenges.map((ch) => {
          const attempt = attempts[ch._id];
          const isSolved = attempt?.status === "solved";
          const isExpired = attempt?.status === "expired" || attempt?.status === "locked";
          const isInProgress = attempt?.status === "in_progress";
          const msg = flagMessages[ch._id];
          const isShaking = shakingId === ch._id;

          // Category Colors
          const categoryColor =
            ch.category.toLowerCase() === "web"
              ? "border-cyan-500 text-cyan-400"
              : ch.category.toLowerCase() === "crypto"
              ? "border-violet-500 text-violet-400"
              : ch.category.toLowerCase() === "forensics"
              ? "border-amber-500 text-amber-400"
              : "border-emerald-500 text-emerald-400";

          return (
            <div
              key={ch._id}
              className={`p-6 rounded-3xl bg-[#121820] border transition-all flex flex-col space-y-4 shadow-xl relative overflow-hidden ${
                isSolved
                  ? "border-emerald-500/60 bg-emerald-950/10 opacity-90"
                  : isExpired
                  ? "border-red-500/40 bg-red-950/10 opacity-60"
                  : isInProgress
                  ? "border-amber-500/60 shadow-amber-500/5"
                  : "border-zinc-800 hover:border-zinc-700"
              } ${isShaking ? "animate-bounce" : ""}`}
            >
              {/* Top Header: Category & Difficulty Cluster */}
              <div className="flex items-center justify-between">
                <span className={`px-3 py-1 rounded-full text-xs font-mono font-bold border bg-black/40 ${categoryColor}`}>
                  {ch.category}
                </span>

                {/* Difficulty Dot Cluster */}
                <div className="flex items-center gap-1">
                  <span
                    className={`size-2 rounded-full ${
                      ch.difficulty === "easy"
                        ? "bg-emerald-400"
                        : ch.difficulty === "medium"
                        ? "bg-amber-400"
                        : "bg-red-400"
                    }`}
                  />
                  <span className="text-[10px] font-mono capitalize text-zinc-400">{ch.difficulty}</span>
                </div>
              </div>

              {/* Title & Points */}
              <div className="flex justify-between items-start">
                <h3 className="text-base font-bold text-white tracking-tight">{ch.title}</h3>
                <span className="px-2.5 py-1 rounded-xl bg-emerald-500/10 text-emerald-400 font-mono font-extrabold text-xs border border-emerald-500/20 shrink-0">
                  +{ch.points} PTS
                </span>
              </div>

              <p className="text-xs text-zinc-400 leading-relaxed whitespace-pre-line">{ch.description}</p>

              {/* Attachments */}
              {ch.attachmentUrls && ch.attachmentUrls.length > 0 && (
                <div className="space-y-1">
                  <span className="text-[10px] font-mono text-zinc-500 uppercase">Attachments:</span>
                  <div className="flex flex-wrap gap-2">
                    {ch.attachmentUrls.map((url, i) => (
                      <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="text-xs text-cyan-400 flex items-center gap-1 font-mono hover:underline">
                        <ExternalLink className="size-3" /> File #{i + 1}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Hints Drawer */}
              {ch.hints && ch.hints.length > 0 && (
                <div className="p-3 rounded-2xl bg-black/50 border border-zinc-800 space-y-2 text-xs font-mono">
                  <span className="text-[11px] font-bold text-amber-400 flex items-center gap-1">
                    <HelpCircle className="size-3.5" /> Hints ({ch.hints.length}):
                  </span>
                  <div className="space-y-2">
                    {ch.hints.map((h, hintIdx) => {
                      const revealedText = revealedHints[ch._id]?.[hintIdx];
                      const hintKey = `${ch._id}_${hintIdx}`;

                      return (
                        <div key={hintIdx} className="text-[11px]">
                          {revealedText ? (
                            <p className="text-zinc-300 bg-zinc-900/90 p-2 rounded-xl border border-zinc-800">
                              💡 {revealedText} <span className="text-red-400 text-[10px]">(-{h.pointsPenalty} pts)</span>
                            </p>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleRevealHint(ch._id, hintIdx, h.pointsPenalty)}
                              disabled={loadingHintKey === hintKey}
                              className="text-[11px] text-amber-400/90 hover:text-amber-300 underline flex items-center gap-1 cursor-pointer"
                            >
                              {loadingHintKey === hintKey ? (
                                <Loader2 className="size-3 animate-spin" />
                              ) : (
                                `Reveal Hint #${hintIdx + 1} (-${h.pointsPenalty} pts penalty)`
                              )}
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Challenge Attempt Engine Footer */}
              <div className="pt-2 mt-auto space-y-3 font-mono">
                {isSolved ? (
                  <div className="p-3.5 rounded-2xl bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 text-xs font-bold flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 className="size-4 text-emerald-400" /> Solved ✓
                    </span>
                    <span>+{attempt.pointsAwarded} PTS</span>
                  </div>
                ) : isExpired ? (
                  <div className="p-3.5 rounded-2xl bg-red-500/15 border border-red-500/40 text-red-400 text-xs font-bold flex items-center gap-2">
                    <Lock className="size-4" /> Time&apos;s Up — Challenge Locked
                  </div>
                ) : isInProgress ? (
                  <div className="space-y-2">
                    {/* Live Flag Submission Input */}
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="notexia{secret_flag}"
                        value={flagInputs[ch._id] || ""}
                        onChange={(e) =>
                          setFlagInputs((prev) => ({ ...prev, [ch._id]: e.target.value }))
                        }
                        className="flex-1 px-3.5 py-2.5 bg-black border border-zinc-700 rounded-xl text-xs font-mono text-emerald-400 focus:outline-none focus:border-emerald-500"
                      />
                      <Button
                        size="sm"
                        onClick={() => handleFlagSubmit(ch._id)}
                        disabled={submittingFlagId === ch._id}
                        className="bg-emerald-500 hover:bg-emerald-600 text-black font-bold text-xs h-9 px-4 rounded-xl shrink-0"
                      >
                        {submittingFlagId === ch._id ? (
                          <Loader2 className="size-3.5 animate-spin" />
                        ) : (
                          "Submit"
                        )}
                      </Button>
                    </div>

                    {msg && (
                      <p
                        className={`text-[11px] font-medium ${
                          msg.type === "success" ? "text-emerald-400" : "text-red-400"
                        }`}
                      >
                        {msg.text}
                      </p>
                    )}
                  </div>
                ) : (
                  <Button
                    onClick={() => handleStartChallenge(ch._id)}
                    className="w-full bg-emerald-500/15 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 font-bold text-xs h-10 rounded-2xl flex items-center justify-center gap-2"
                  >
                    <Zap className="size-4 text-amber-400" /> Start Challenge ({Math.round(ch.timeLimitSeconds / 60)} mins)
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
