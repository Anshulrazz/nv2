"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  Trophy,
  Clock,
  CheckCircle2,
  HelpCircle,
  Loader2,
  ArrowLeft,
  Terminal,
  ExternalLink,
  FastForward,
  CheckSquare,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { MarkdownRenderer } from "@/components/ui/MarkdownRenderer";

interface CurrentChallenge {
  _id: string;
  title: string;
  description: string;
  category: string;
  difficulty: "easy" | "medium" | "hard";
  points: number;
  timeLimitSeconds: number;
  hints?: Array<{ text: string; pointsPenalty: number }>;
  attachmentUrls?: string[];
}

interface CurrentAttempt {
  _id: string;
  status: "in_progress" | "solved" | "skipped" | "expired";
  startedAt?: string;
  wrongAttemptCount: number;
  hintsUsed: number[];
}

export default function CTFSequentialArenaPage() {
  const params = useParams();
  const router = useRouter();
  const eventIdentifier = (params.id || params.slug) as string;

  const [challenge, setChallenge] = useState<CurrentChallenge | null>(null);
  const [attempt, setAttempt] = useState<CurrentAttempt | null>(null);
  const [progress, setProgress] = useState<{ current: number; total: number }>({ current: 1, total: 1 });
  const [isLastChallenge, setIsLastChallenge] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Timer State
  const [timeLeftSeconds, setTimeLeftSeconds] = useState<number>(0);
  const [totalTimeLimit, setTotalTimeLimit] = useState<number>(1800);

  // Submission State
  const [flagInput, setFlagInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [skipping, setSkipping] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [shaking, setShaking] = useState(false);
  const [flagMsg, setFlagMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Hint State
  const [revealedHints, setRevealedHints] = useState<Record<number, string>>({});
  const [loadingHintIdx, setLoadingHintIdx] = useState<number | null>(null);

  // Fetch current sequence challenge from server
  const fetchCurrentChallenge = useCallback(async () => {
    setLoading(true);
    setFlagMsg(null);
    setFlagInput("");
    try {
      const res = await fetch(`/api/events/${eventIdentifier}/arena/current`);
      const data = await res.json();

      if (!res.ok) {
        if (res.status === 403) {
          // Unregistered or event not live — redirect to event landing page
          alert(data.error || "Access denied.");
          router.push(`/events/${eventIdentifier}`);
          return;
        }
        throw new Error(data.error || "Failed to load current challenge");
      }

      if (data.runStatus === "completed") {
        alert(data.message || "Run completed!");
        router.push(`/events/${eventIdentifier}/results`);
        return;
      }

      setChallenge(data.challenge);
      setAttempt(data.attempt);
      setProgress(data.progress || { current: 1, total: 1 });
      setIsLastChallenge(data.isLastChallenge || false);

      // Server-authoritative timer setup
      const startedTime = new Date(data.startedAt || Date.now()).getTime();
      const limit = data.timeLimitSeconds || 1800;
      setTotalTimeLimit(limit);

      const elapsedSec = Math.floor((Date.now() - startedTime) / 1000);
      const remaining = Math.max(0, limit - elapsedSec);
      setTimeLeftSeconds(remaining);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error loading arena";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [eventIdentifier, router]);

  useEffect(() => {
    if (eventIdentifier) fetchCurrentChallenge();
  }, [eventIdentifier, fetchCurrentChallenge]);

  // Server-Authoritative Countdown Interval
  useEffect(() => {
    if (timeLeftSeconds <= 0 || !challenge) return;

    const interval = setInterval(() => {
      setTimeLeftSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          alert("Time's up for this challenge! Locking and advancing...");
          fetchCurrentChallenge();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timeLeftSeconds, challenge, fetchCurrentChallenge]);

  // Submit Flag
  const handleSubmitFlag = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!flagInput.trim() || submitting || !challenge) return;

    setSubmitting(true);
    setFlagMsg(null);

    try {
      const res = await fetch(`/api/events/${eventIdentifier}/arena/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ flag: flagInput.trim() }),
      });
      const data = await res.json();

      if (!res.ok) {
        // Shake animation on wrong flag
        setShaking(true);
        setTimeout(() => setShaking(false), 600);

        setFlagMsg({ type: "error", text: data.error || "Flag is not right — try again." });
        if (data.status === "expired") {
          setTimeout(() => fetchCurrentChallenge(), 1500);
        }
        return;
      }

      setFlagMsg({ type: "success", text: data.message });
      setAttempt((prev) => (prev ? { ...prev, status: "solved" } : null));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Flag verification failed";
      setFlagMsg({ type: "error", text: msg });
    } finally {
      setSubmitting(false);
    }
  };

  // Skip Challenge
  const handleSkip = async () => {
    if (!confirm("Skip this challenge? You won't be able to return to it.")) return;

    setSkipping(true);
    try {
      const res = await fetch(`/api/events/${eventIdentifier}/arena/skip`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to skip challenge");

      fetchCurrentChallenge();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error skipping challenge";
      alert(msg);
    } finally {
      setSkipping(false);
    }
  };

  // Reveal Hint
  const handleRevealHint = async (hintIndex: number, penalty: number) => {
    if (!confirm(`Reveal hint #${hintIndex + 1}? Deducts -${penalty} pts from award.`)) return;

    setLoadingHintIdx(hintIndex);
    try {
      const res = await fetch(`/api/events/${eventIdentifier}/arena/hint/${hintIndex}`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to reveal hint");

      setRevealedHints((prev) => ({ ...prev, [hintIndex]: data.hintText }));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error revealing hint";
      alert(msg);
    } finally {
      setLoadingHintIdx(null);
    }
  };

  // Submit & Finish (Final Challenge)
  const handleFinishRun = async () => {
    if (!confirm("Finish your CTF run? You won't be able to return to any challenge.")) return;

    setFinishing(true);
    try {
      const res = await fetch(`/api/events/${eventIdentifier}/arena/finish`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to finish run");

      alert(data.message || "Run completed!");
      router.push(`/events/${eventIdentifier}/results`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error completing run";
      alert(msg);
    } finally {
      setFinishing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0E12] text-[#E0E6ED] flex flex-col items-center justify-center p-8 space-y-4 font-mono">
        <Loader2 className="size-8 text-emerald-400 animate-spin" />
        <p className="text-xs text-emerald-500">Loading current sequence challenge...</p>
      </div>
    );
  }

  if (error || !challenge) {
    return (
      <div className="w-full min-h-screen bg-[#0A0E12] text-[#E0E6ED] p-8 max-w-xl mx-auto space-y-6 font-mono">
        <Link href={`/events/${eventIdentifier}`}>
          <Button variant="ghost" size="sm" className="gap-2 text-xs text-emerald-400">
            <ArrowLeft className="size-4" /> Back to Event Landing
          </Button>
        </Link>
        <div className="p-8 text-center bg-[#121820] border border-red-500/30 rounded-3xl space-y-3">
          <h2 className="text-xl font-bold text-red-400">Arena Error</h2>
          <p className="text-xs text-zinc-400">{error}</p>
        </div>
      </div>
    );
  }

  // Timer Color Grading (Calm green -> Amber @ 25% -> Red pulse @ 10%)
  const timerRatio = timeLeftSeconds / totalTimeLimit;
  const timerColor =
    timerRatio <= 0.1
      ? "text-red-400 border-red-500 animate-pulse bg-red-950/20"
      : timerRatio <= 0.25
      ? "text-amber-400 border-amber-500 bg-amber-950/20"
      : "text-emerald-400 border-emerald-500/50 bg-emerald-950/20";

  const mins = Math.floor(timeLeftSeconds / 60);
  const secs = timeLeftSeconds % 60;
  const isSolved = attempt?.status === "solved";

  return (
    <div className="w-full min-h-screen bg-[#0A0E12] text-[#E0E6ED] p-4 sm:p-6 lg:p-10 space-y-8 font-sans selection:bg-emerald-500/30">
      {/* Top Header & Sequential Progress Stepper */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-6 font-mono">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Link href={`/events/${eventIdentifier}`}>
              <Button variant="ghost" size="sm" className="gap-2 text-xs text-emerald-400 hover:bg-emerald-500/10 p-0 h-auto">
                <ArrowLeft className="size-3.5" /> Event Hub
              </Button>
            </Link>
            <span className="text-zinc-600">/</span>
            <span className="px-2.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[11px] font-bold border border-emerald-500/20">
              SEQUENTIAL ARENA
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white flex items-center gap-2" style={{ fontFamily: "var(--font-space-grotesk)" }}>
            <Terminal className="size-5 text-emerald-400" /> Sequential Mission
          </h1>
        </div>

        {/* Progress Stepper ("Challenge 4 of 10") */}
        <div className="flex items-center gap-4">
          <div className="text-xs font-bold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-3.5 py-1.5 rounded-xl flex items-center gap-2">
            <Sparkles className="size-4" /> Challenge {progress.current} of {progress.total}
          </div>

          <Link href={`/events/${eventIdentifier}/leaderboard`}>
            <Button size="sm" className="bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-bold text-xs border border-emerald-500/40 rounded-xl flex items-center gap-1.5">
              <Trophy className="size-4 text-amber-400" /> Live Scoreboard
            </Button>
          </Link>
        </div>
      </div>

      {/* Main Single-Challenge Focused View */}
      <div className="max-w-4xl mx-auto space-y-6">
        <div
          className={`p-6 sm:p-10 rounded-3xl bg-[#121820] border transition-all space-y-6 shadow-2xl relative overflow-hidden ${
            isSolved
              ? "border-emerald-500/70 bg-emerald-950/10"
              : shaking
              ? "border-red-500 animate-bounce"
              : "border-zinc-800"
          }`}
        >
          {/* Header Bar: Category, Difficulty, Timer */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-mono">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 rounded-full bg-cyan-500/15 text-cyan-400 text-xs font-bold border border-cyan-500/30">
                {challenge.category}
              </span>
              <span className="px-3 py-1 rounded-full bg-amber-500/15 text-amber-400 text-xs font-bold capitalize">
                {challenge.difficulty}
              </span>
              <span className="px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-400 text-xs font-bold">
                +{challenge.points} PTS
              </span>
            </div>

            {/* DOMINANT VISUAL COUNTDOWN TIMER */}
            <div className={`px-4 py-2 rounded-2xl border font-mono font-extrabold text-sm flex items-center gap-2 ${timerColor}`}>
              <Clock className="size-4" />
              <span>
                {mins.toString().padStart(2, "0")}:{secs.toString().padStart(2, "0")}
              </span>
            </div>
          </div>

          {/* Title & Description */}
          <div className="space-y-3">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight" style={{ fontFamily: "var(--font-space-grotesk)" }}>
              {challenge.title}
            </h2>
            <div className="text-xs sm:text-sm text-zinc-300 leading-relaxed font-mono whitespace-pre-line">
              <MarkdownRenderer content={challenge.description} />
            </div>
          </div>

          {/* Attachments */}
          {challenge.attachmentUrls && challenge.attachmentUrls.length > 0 && (
            <div className="p-4 rounded-2xl bg-black/40 border border-zinc-800 space-y-2 font-mono text-xs">
              <span className="text-zinc-400 font-bold uppercase text-[10px]">Challenge Attachments:</span>
              <div className="flex flex-wrap gap-3">
                {challenge.attachmentUrls.map((url, i) => (
                  <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline flex items-center gap-1.5">
                    <ExternalLink className="size-3.5" /> File #{i + 1}
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Hints Drawer */}
          {challenge.hints && challenge.hints.length > 0 && (
            <div className="p-4 rounded-2xl bg-black/50 border border-zinc-800 space-y-2 font-mono text-xs">
              <span className="text-amber-400 font-bold flex items-center gap-1.5">
                <HelpCircle className="size-4" /> Optional Hints ({challenge.hints.length}):
              </span>
              <div className="space-y-2">
                {challenge.hints.map((h, hintIdx) => {
                  const revealed = revealedHints[hintIdx];

                  return (
                    <div key={hintIdx}>
                      {revealed ? (
                        <p className="text-zinc-200 bg-zinc-900 p-2.5 rounded-xl border border-zinc-800">
                          💡 {revealed} <span className="text-red-400 text-[10px]">(-{h.pointsPenalty} pts)</span>
                        </p>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleRevealHint(hintIdx, h.pointsPenalty)}
                          disabled={loadingHintIdx === hintIdx}
                          className="text-amber-400/90 hover:text-amber-300 underline flex items-center gap-1 cursor-pointer"
                        >
                          {loadingHintIdx === hintIdx ? (
                            <Loader2 className="size-3.5 animate-spin" />
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

          {/* Flag Submission & Controls Area */}
          <div className="pt-4 border-t border-zinc-800 space-y-4 font-mono">
            {isSolved ? (
              <div className="p-5 rounded-2xl bg-emerald-500/20 border border-emerald-500/60 text-emerald-300 space-y-3 text-center">
                <div className="flex items-center justify-center gap-2 text-base font-bold">
                  <CheckCircle2 className="size-5 text-emerald-400" /> Correct Flag Solved! ✓
                </div>
                <p className="text-xs text-zinc-300">Click below to continue to the next challenge in sequence.</p>

                <Button
                  onClick={fetchCurrentChallenge}
                  className="bg-emerald-500 hover:bg-emerald-600 text-black font-extrabold text-xs h-11 px-8 rounded-xl"
                >
                  Continue to Next Challenge →
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmitFlag} className="space-y-4">
                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <input
                    type="text"
                    required
                    placeholder="notexia{secret_flag_string}"
                    value={flagInput}
                    onChange={(e) => setFlagInput(e.target.value)}
                    className="w-full flex-1 px-4 py-3 bg-black border border-zinc-700 rounded-2xl text-xs font-mono text-emerald-400 focus:outline-none focus:border-emerald-500"
                  />

                  <Button
                    type="submit"
                    disabled={submitting}
                    className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-600 text-black font-extrabold text-xs h-11 px-6 rounded-2xl shrink-0 flex items-center justify-center gap-2"
                  >
                    {submitting ? <Loader2 className="size-4 animate-spin" /> : "Submit Flag"}
                  </Button>
                </div>

                {flagMsg && (
                  <p
                    className={`text-xs font-bold ${
                      flagMsg.type === "success" ? "text-emerald-400" : "text-red-400"
                    }`}
                  >
                    {flagMsg.text}
                  </p>
                )}

                {/* Secondary Skip & Final Finish Controls */}
                <div className="flex items-center justify-between pt-2">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={handleSkip}
                    disabled={skipping}
                    className="text-zinc-400 hover:text-red-400 font-bold text-xs gap-1.5"
                  >
                    {skipping ? <Loader2 className="size-3.5 animate-spin" /> : <FastForward className="size-3.5" />}
                    Skip Challenge (0 Pts)
                  </Button>

                  {/* Render Final Submit & Finish Button if on Last Challenge */}
                  {isLastChallenge && (
                    <Button
                      type="button"
                      onClick={handleFinishRun}
                      disabled={finishing}
                      className="bg-amber-500 hover:bg-amber-600 text-black font-extrabold text-xs h-10 px-6 rounded-xl flex items-center gap-2 shadow-lg shadow-amber-500/20"
                    >
                      {finishing ? <Loader2 className="size-4 animate-spin" /> : <CheckSquare className="size-4" />}
                      Submit &amp; Finish CTF Run 🎉
                    </Button>
                  )}
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
