"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Loader2,
  AlertCircle,
  CheckCircle2,
  Lock,
  Flag,
  Trophy,
  Timer,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Send,
  Megaphone,
  XCircle,
} from "lucide-react";
import Link from "next/link";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Challenge {
  _id: string;
  title: string;
  descriptionMarkdown: string;
  category: string;
  points: number;
  difficulty: "easy" | "medium" | "hard";
  images?: string[];
  attachmentUrl?: string | null;
  isSolved?: boolean;
  order: number;
}

interface LeaderboardEntry {
  userId: string;
  codename: string;
  totalPoints: number;
  lastSolveAt: string;
  solveCount: number;
  isDisqualified: boolean;
  rank: number | null;
}

interface Announcement {
  _id: string;
  title: string;
  body: string;
  createdAt: string;
  pinnedUntil?: string | null;
}

// ── Difficulty badge ──────────────────────────────────────────────────────────
const DIFF_COLOR = {
  easy: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  medium: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  hard: "text-red-400 bg-red-500/10 border-red-500/20",
} as const;

// ── Countdown component (synced from server offset) ───────────────────────────
function Countdown({
  serverEndIso,
  serverNowIso,
  onExpired,
}: {
  serverEndIso: string;
  serverNowIso: string;
  onExpired: () => void;
}) {
  const offsetRef = useRef(0); // serverNow - clientNow in ms
  const [remaining, setRemaining] = useState(0);
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    offsetRef.current = new Date(serverNowIso).getTime() - Date.now();
    const end = new Date(serverEndIso).getTime();

    const tick = () => {
      const diff = end - (Date.now() + offsetRef.current);
      if (diff <= 0) {
        setRemaining(0);
        setExpired(true);
        onExpired();
        return;
      }
      setRemaining(diff);
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [serverEndIso, serverNowIso, onExpired]);

  if (expired) {
    return (
      <div className="flex items-center gap-1.5 text-red-400 font-mono text-sm font-bold">
        <Timer className="size-4" />
        TIME&apos;S UP
      </div>
    );
  }

  const hours = Math.floor(remaining / 3600000);
  const minutes = Math.floor((remaining % 3600000) / 60000);
  const seconds = Math.floor((remaining % 60000) / 1000);

  return (
    <div className="flex items-center gap-1.5 font-mono text-sm font-bold text-foreground">
      <Timer className="size-4 text-primary" />
      {String(hours).padStart(2, "0")}:{String(minutes).padStart(2, "0")}:
      {String(seconds).padStart(2, "0")}
    </div>
  );
}

// ── Single Challenge View ──────────────────────────────────────────────────────
function SingleChallengeCard({
  challenge,
  onSolve,
  eventId,
  locked,
}: {
  challenge: Challenge;
  onSolve: (id: string) => void;
  eventId: string;
  locked: boolean;
}) {
  const [flag, setFlag] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ correct: boolean; message: string } | null>(null);

  useEffect(() => {
    setFlag("");
    setResult(null);
  }, [challenge._id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!flag.trim() || submitting || locked) return;

    setSubmitting(true);
    setResult(null);

    try {
      const res = await fetch(`/api/events/${eventId}/challenges/${challenge._id}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ flag: flag.trim() }),
      });
      const data = await res.json();

      if (!res.ok) {
        setResult({ correct: false, message: data.error || "Submission failed." });
        return;
      }

      setResult({ correct: data.correct, message: data.message });
      if (data.correct) {
        onSolve(challenge._id);
        setFlag("");
      }
    } catch {
      setResult({ correct: false, message: "Network error. Try again." });
    } finally {
      setSubmitting(false);
    }
  };

  const isSolved = challenge.isSolved;

  return (
    <div
      className={`border rounded-2xl p-6 space-y-6 transition-all duration-200 ${
        isSolved
          ? "border-emerald-500/40 bg-emerald-500/5 shadow-sm"
          : "border-sidebar-border bg-sidebar"
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-4 border-b border-sidebar-border pb-4">
        <div className="flex items-start gap-3 min-w-0">
          {isSolved ? (
            <CheckCircle2 className="size-6 text-emerald-400 shrink-0 mt-0.5" />
          ) : locked ? (
            <Lock className="size-6 text-muted-foreground/50 shrink-0 mt-0.5" />
          ) : (
            <Flag className="size-6 text-primary shrink-0 mt-0.5" />
          )}
          <div>
            <h2 className="text-lg font-bold text-foreground">{challenge.title}</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-muted-foreground font-mono bg-sidebar-accent px-2 py-0.5 rounded border border-sidebar-border">
                {challenge.category}
              </span>
              <span
                className={`text-xs font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${DIFF_COLOR[challenge.difficulty]}`}
              >
                {challenge.difficulty}
              </span>
            </div>
          </div>
        </div>

        <div className="text-right shrink-0">
          <span className="text-lg font-extrabold text-primary font-mono">{challenge.points} pts</span>
          {isSolved && (
            <p className="text-xs text-emerald-400 font-semibold flex items-center justify-end gap-1 mt-0.5">
              <CheckCircle2 className="size-3.5" /> Solved
            </p>
          )}
        </div>
      </div>

      {/* Description */}
      <div className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap font-sans bg-background/50 p-4 rounded-xl border border-sidebar-border/50">
        {challenge.descriptionMarkdown}
      </div>

      {/* Images */}
      {challenge.images && challenge.images.length > 0 && (
        <div className="flex flex-wrap gap-3 pt-2">
          {challenge.images.map((img, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={i}
              src={img}
              alt={`Challenge image ${i + 1}`}
              className="max-h-64 rounded-xl border border-sidebar-border object-contain bg-background"
            />
          ))}
        </div>
      )}

      {/* Attachment */}
      {challenge.attachmentUrl && (
        <div className="pt-1">
          <a
            href={challenge.attachmentUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20 text-xs font-semibold text-primary hover:bg-primary/20 transition-colors"
          >
            📎 Download Attachment →
          </a>
        </div>
      )}

      {/* Flag submission form */}
      <div className="border-t border-sidebar-border pt-4">
        {!isSolved ? (
          <form onSubmit={handleSubmit} className="space-y-3">
            <label className="text-xs font-mono font-bold uppercase tracking-widest text-muted-foreground block">
              Flag Submission
            </label>
            <div className="flex gap-3">
              <input
                type="text"
                placeholder="NOTEXIA{flag_here}"
                value={flag}
                onChange={(e) => setFlag(e.target.value)}
                disabled={locked || submitting}
                className="flex-1 bg-background border border-sidebar-border rounded-xl px-4 py-2.5 text-sm text-foreground font-mono placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/20 transition-all disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={submitting || !flag.trim() || locked}
                className="px-6 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2 shrink-0 shadow-sm"
              >
                {submitting ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <>
                    <Send className="size-4" />
                    Submit Flag
                  </>
                )}
              </button>
            </div>
          </form>
        ) : (
          <div className="flex items-center gap-2 text-emerald-400 text-sm font-bold bg-emerald-500/10 border border-emerald-500/20 px-4 py-3 rounded-xl">
            <CheckCircle2 className="size-5" />
            You have successfully solved this challenge!
          </div>
        )}

        {result && (
          <div
            className={`mt-3 text-xs px-4 py-3 rounded-xl border font-mono font-semibold flex items-center gap-2 ${
              result.correct
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                : "bg-red-500/10 border-red-500/30 text-red-400"
            }`}
          >
            {result.correct ? <CheckCircle2 className="size-4 shrink-0" /> : <AlertCircle className="size-4 shrink-0" />}
            {result.message}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main Arena Page ───────────────────────────────────────────────────────────
export default function ArenaPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();

  const [eventId, setEventId] = useState<string | null>(null);
  const [eventName, setEventName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [currentChallengeIndex, setCurrentChallengeIndex] = useState(0);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  const [progress, setProgress] = useState<{
    registered: boolean;
    codename: string;
    isDisqualified: boolean;
    totalScore: number;
    solvedChallengeIds: string[];
    now: string;
    eventEnd: string;
    eventStatus: string;
  } | null>(null);

  const [eventEnded, setEventEnded] = useState(false);
  const [finalizing, setFinalizing] = useState(false);

  const handleTimerExpired = useCallback(async () => {
    setEventEnded(true);
    if (!eventId) return;
    setFinalizing(true);
    try {
      await fetch(`/api/events/${eventId}/finalize-participation`, { method: "POST" });
    } catch (e) {
      console.error("Finalize error:", e);
    } finally {
      setFinalizing(false);
    }
  }, [eventId]);

  // Load everything on mount (reconnect pattern)
  useEffect(() => {
    async function load() {
      try {
        // 1. Load event by slug
        const evRes = await fetch(`/api/events/${slug}`);
        if (!evRes.ok) throw new Error("Event not found.");
        const evData = await evRes.json();
        const ev = evData.event;
        setEventId(ev._id);
        setEventName(ev.name);

        // 2. Load server-authoritative progress (reconnect)
        const progressRes = await fetch(`/api/events/${ev._id}/my-progress`);
        const progressData = await progressRes.json();

        if (!progressData.registered) {
          router.replace(`/events/${slug}`);
          return;
        }
        if (progressData.isDisqualified) {
          setError("You have been disqualified from this event.");
          setLoading(false);
          return;
        }

        setProgress(progressData);

        // If event is already ended (server-authoritative), mark it now
        if (
          progressData.eventStatus === "ended" ||
          (progressData.eventEnd && progressData.now &&
            new Date(progressData.now) >= new Date(progressData.eventEnd))
        ) {
          setEventEnded(true);
        }

        // 3. Load challenges (filtered by visibility)
        const cRes = await fetch(`/api/events/${ev._id}/challenges`);
        const cData = await cRes.json();
        const fetchedChallenges: Challenge[] = cData.challenges ?? [];

        // Mark solved from progress
        const solvedSet = new Set(progressData.solvedChallengeIds ?? []);
        setChallenges(
          fetchedChallenges.map((c) => ({ ...c, isSolved: solvedSet.has(c._id) }))
        );

        // 4. Load leaderboard
        const lbRes = await fetch(`/api/events/${ev._id}/leaderboard`);
        const lbData = await lbRes.json();
        setLeaderboard(lbData.leaderboard ?? []);

        // 5. Load announcements
        const anRes = await fetch(`/api/events/${ev._id}/announcements`);
        if (anRes.ok) {
          const anData = await anRes.json();
          setAnnouncements(anData.announcements ?? []);
        }

        // 6. Pusher subscription for leaderboard
        if (typeof window !== "undefined") {
          const { default: Pusher } = await import("pusher-js");
          const pusherKey = process.env.NEXT_PUBLIC_PUSHER_KEY;
          const pusherCluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;

          if (pusherKey && pusherCluster) {
            const pusherClient = new Pusher(pusherKey, { cluster: pusherCluster });
            const lbChannel = pusherClient.subscribe(`event-${ev._id}-leaderboard`);
            lbChannel.bind("new-solve", async () => {
              // Refresh leaderboard on any solve
              const refresh = await fetch(`/api/events/${ev._id}/leaderboard`);
              if (refresh.ok) {
                const data = await refresh.json();
                setLeaderboard(data.leaderboard ?? []);
              }
            });

            // Announcement channel
            const anChannel = pusherClient.subscribe(`event-${ev._id}-announcements`);
            anChannel.bind("new-announcement", (data: Announcement) => {
              setAnnouncements((prev) => [data, ...prev]);
            });

            return () => {
              pusherClient.unsubscribe(`event-${ev._id}-leaderboard`);
              pusherClient.unsubscribe(`event-${ev._id}-announcements`);
              pusherClient.disconnect();
            };
          }
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load arena.");
      } finally {
        setLoading(false);
      }
    }

    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  const handleSolve = (challengeId: string) => {
    setChallenges((prev) =>
      prev.map((c) => (c._id === challengeId ? { ...c, isSolved: true } : c))
    );
    setProgress((prev) =>
      prev
        ? {
            ...prev,
            solvedChallengeIds: [...prev.solvedChallengeIds, challengeId],
            totalScore: prev.totalScore, // will be refreshed from Pusher
          }
        : prev
    );
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="size-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading arena...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center px-4">
        <AlertCircle className="size-8 text-destructive" />
        <p className="text-sm text-muted-foreground">{error}</p>
        <Link href={`/events/${slug}`} className="text-xs text-primary hover:underline">
          Back to event
        </Link>
      </div>
    );
  }

  // Group challenges by category
  const categories = [...new Set(challenges.map((c) => c.category))].sort();
  const solvedCount = challenges.filter((c) => c.isSolved).length;

  return (
    <div className="min-h-screen bg-background">
      {/* ── Top Bar ──────────────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-30 border-b border-sidebar-border bg-sidebar/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <Link href={`/events/${slug}`} className="text-muted-foreground hover:text-foreground transition-colors shrink-0">
              ←
            </Link>
            <h1 className="text-sm font-bold text-foreground truncate">{eventName}</h1>
            <span className="hidden sm:inline text-xs font-mono text-muted-foreground">
              {solvedCount}/{challenges.length} solved
            </span>
          </div>

          <div className="flex items-center gap-4 shrink-0">
            {/* Score */}
            <div className="flex items-center gap-1.5 bg-sidebar-accent border border-sidebar-border rounded-lg px-3 py-1.5">
              <Trophy className="size-3.5 text-amber-400" />
              <span className="text-xs font-mono font-bold text-foreground">
                {progress?.totalScore ?? 0}pts
              </span>
            </div>

            {/* Countdown */}
            {progress?.eventEnd && progress.now && !eventEnded && (
              <Countdown
                serverEndIso={progress.eventEnd}
                serverNowIso={progress.now}
                onExpired={handleTimerExpired}
              />
            )}

            {eventEnded && (
              <div className="flex items-center gap-1.5 text-red-400 font-mono text-xs font-bold">
                <Timer className="size-4" />
                {finalizing ? "Saving..." : "EVENT ENDED"}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Disqualified Banner ───────────────────────────────────────────────── */}
      {progress?.isDisqualified && (
        <div className="bg-red-500/10 border-b border-red-500/30 px-4 py-3 text-center text-sm text-red-400 font-semibold flex items-center justify-center gap-2">
          <XCircle className="size-4" />
          You have been disqualified. Contact the host if you think this is an error.
        </div>
      )}

      {/* ── Ended Banner ─────────────────────────────────────────────────────── */}
      {eventEnded && (
        <div className="bg-red-500/10 border-b border-red-500/30 px-4 py-3 text-center text-sm text-red-400 font-semibold">
          ⏰ Event has ended. No more submissions accepted.
        </div>
      )}

      {/* ── Announcements ────────────────────────────────────────────────────── */}
      {announcements.length > 0 && (
        <div className="border-b border-sidebar-border bg-sidebar/50">
          <div className="max-w-7xl mx-auto px-4 py-3">
            <div className="flex items-center gap-2 mb-2">
              <Megaphone className="size-4 text-primary" />
              <span className="text-xs font-mono font-bold uppercase tracking-widest text-muted-foreground">
                Announcements
              </span>
            </div>
            <div className="space-y-2">
              {announcements.slice(0, 3).map((ann) => (
                <div
                  key={ann._id}
                  className="text-sm text-foreground bg-primary/5 border border-primary/20 rounded-xl px-4 py-2.5"
                >
                  <span className="font-semibold">{ann.title}</span>
                  {ann.body && (
                    <span className="text-muted-foreground ml-2 text-xs">— {ann.body}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Main layout ──────────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 py-6 flex gap-6">
        {/* Challenges Column */}
        <div className="flex-1 min-w-0 space-y-6">
          {challenges.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4 text-center border border-dashed border-sidebar-border rounded-2xl">
              <Flag className="size-10 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">No challenges available yet.</p>
            </div>
          ) : (
            <>
              {/* Challenge Selector Pills */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                {challenges.map((c, idx) => {
                  const isCurrent = idx === currentChallengeIndex;
                  return (
                    <button
                      key={c._id}
                      onClick={() => setCurrentChallengeIndex(idx)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all shrink-0 border ${
                        isCurrent
                          ? "bg-primary text-primary-foreground border-primary shadow-sm"
                          : c.isSolved
                          ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20"
                          : "bg-sidebar border-sidebar-border text-muted-foreground hover:text-foreground hover:border-primary/40"
                      }`}
                    >
                      {c.isSolved && <CheckCircle2 className="size-3.5 text-emerald-400" />}
                      <span>#{idx + 1}</span>
                      <span className="text-[10px] opacity-80">({c.points}p)</span>
                    </button>
                  );
                })}
              </div>

              {/* Single Active Challenge Card */}
              {challenges[currentChallengeIndex] && (
                <SingleChallengeCard
                  key={challenges[currentChallengeIndex]._id}
                  challenge={challenges[currentChallengeIndex]}
                  onSolve={handleSolve}
                  eventId={eventId!}
                  locked={eventEnded || !!progress?.isDisqualified}
                />
              )}

              {/* Navigation Footer */}
              <div className="flex items-center justify-between gap-4 pt-2">
                <button
                  onClick={() => setCurrentChallengeIndex((prev) => Math.max(0, prev - 1))}
                  disabled={currentChallengeIndex === 0}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-sidebar border border-sidebar-border text-sm font-semibold text-foreground hover:bg-sidebar-accent transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="size-4" />
                  Previous
                </button>

                <span className="text-xs font-mono text-muted-foreground">
                  Challenge <strong className="text-foreground">{currentChallengeIndex + 1}</strong> of <strong className="text-foreground">{challenges.length}</strong>
                </span>

                <button
                  onClick={() => setCurrentChallengeIndex((prev) => Math.min(challenges.length - 1, prev + 1))}
                  disabled={currentChallengeIndex === challenges.length - 1}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Next
                  <ChevronRight className="size-4" />
                </button>
              </div>
            </>
          )}
        </div>

        {/* Leaderboard Sidebar */}
        <div className="w-72 shrink-0 hidden lg:block">
          <div className="sticky top-20">
            <div className="bg-sidebar border border-sidebar-border rounded-2xl overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-sidebar-border">
                <Trophy className="size-4 text-amber-400" />
                <span className="text-xs font-mono font-bold uppercase tracking-widest text-muted-foreground">
                  Leaderboard
                </span>
              </div>

              {leaderboard.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 gap-2 text-center">
                  <p className="text-xs text-muted-foreground">No solves yet.</p>
                </div>
              ) : (
                <div className="divide-y divide-sidebar-border max-h-[calc(100vh-200px)] overflow-y-auto">
                  {leaderboard.slice(0, 30).map((entry, i) => (
                    <div
                      key={entry.userId}
                      className={`flex items-center justify-between px-4 py-2.5 ${
                        entry.isDisqualified ? "opacity-40" : ""
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className={`text-[10px] font-mono font-bold w-6 text-center shrink-0 ${
                            i === 0
                              ? "text-amber-400"
                              : i === 1
                              ? "text-zinc-300"
                              : i === 2
                              ? "text-amber-700"
                              : "text-muted-foreground"
                          }`}
                        >
                          {entry.isDisqualified ? "DQ" : entry.rank ?? "—"}
                        </span>
                        <span className="text-xs font-mono text-foreground truncate">
                          {entry.codename}
                        </span>
                        {entry.isDisqualified && (
                          <span className="text-[9px] bg-red-500/15 text-red-400 border border-red-500/30 rounded px-1 font-mono shrink-0">
                            DQ
                          </span>
                        )}
                      </div>
                      <span className="text-xs font-mono font-bold text-primary shrink-0 ml-2">
                        {entry.totalPoints}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
