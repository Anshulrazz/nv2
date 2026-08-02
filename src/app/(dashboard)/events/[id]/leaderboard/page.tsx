"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Pusher from "pusher-js";
import {
  Trophy,
  Clock,
  ArrowLeft,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface LeaderboardEntry {
  userId: string;
  displayName: string;
  username: string;
  totalPoints: number;
  totalTimeSeconds: number;
  lastSolveAt?: string;
}

export default function CTFLeaderboardPage() {
  const params = useParams();
  const eventIdentifier = (params.id || params.slug) as string;

  const [eventId, setEventId] = useState<string | null>(null);
  const [eventTitle, setEventTitle] = useState("");
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchLeaderboard = useCallback(async () => {
    try {
      const res = await fetch(`/api/events/${eventIdentifier}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Event not found");

      setEventId(data.event._id);
      setEventTitle(data.event.title);

      const lbRes = await fetch(`/api/events/${data.event._id}/leaderboard`);
      const lbData = await lbRes.json();
      if (lbRes.ok) {
        setEntries(lbData.entries || []);
        if (lbData.updatedAt) setLastUpdated(new Date(lbData.updatedAt));
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load leaderboard";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [eventIdentifier]);

  useEffect(() => {
    if (eventIdentifier) fetchLeaderboard();
  }, [eventIdentifier, fetchLeaderboard]);

  // Subscribe to Pusher channel `event-{eventId}-leaderboard`
  useEffect(() => {
    if (!eventId) return;

    const pusherKey = process.env.NEXT_PUBLIC_PUSHER_KEY || "";
    const pusherCluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER || "ap2";
    if (!pusherKey) return;

    const pusher = new Pusher(pusherKey, { cluster: pusherCluster });
    const channel = pusher.subscribe(`event-${eventId}-leaderboard`);

    channel.bind("leaderboard:update", (data: { entries: LeaderboardEntry[]; updatedAt: string }) => {
      if (data.entries) {
        setEntries(data.entries);
        setLastUpdated(new Date(data.updatedAt || Date.now()));
      }
    });

    return () => {
      pusher.unsubscribe(`event-${eventId}-leaderboard`);
      pusher.disconnect();
    };
  }, [eventId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0E12] text-[#E0E6ED] flex flex-col items-center justify-center p-8 space-y-4 font-mono">
        <Loader2 className="size-8 text-amber-400 animate-spin" />
        <p className="text-xs text-amber-400">Connecting to CTF Live Score Stream...</p>
      </div>
    );
  }

  if (error || !eventId) {
    return (
      <div className="w-full min-h-screen bg-[#0A0E12] text-[#E0E6ED] p-8 max-w-xl mx-auto space-y-6 font-mono">
        <Link href="/events">
          <Button variant="ghost" size="sm" className="gap-2 text-xs text-amber-400 hover:bg-amber-500/10">
            <ArrowLeft className="size-4" /> Back to Events
          </Button>
        </Link>
        <div className="p-8 text-center bg-[#121820] border border-red-500/30 rounded-3xl space-y-3">
          <h2 className="text-xl font-bold text-red-400">Leaderboard Error</h2>
          <p className="text-xs text-zinc-400">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-[#0A0E12] text-[#E0E6ED] p-4 sm:p-6 lg:p-10 space-y-8 font-sans">
      {/* CTF Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-6 font-mono">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Link href={`/events/${eventIdentifier}/challenges`}>
              <Button variant="ghost" size="sm" className="gap-2 text-xs text-emerald-400 hover:bg-emerald-500/10 p-0 h-auto">
                <ArrowLeft className="size-3.5" /> Challenges
              </Button>
            </Link>
            <span className="text-zinc-600">/</span>
            <span className="px-2.5 py-0.5 rounded bg-amber-500/10 text-amber-400 text-[11px] font-bold border border-amber-500/20">
              LIVE SCOREBOARD
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2" style={{ fontFamily: "var(--font-space-grotesk)" }}>
            <Trophy className="size-6 text-amber-400" /> {eventTitle} Leaderboard
          </h1>
        </div>

        {lastUpdated && (
          <div className="text-xs text-zinc-400 flex items-center gap-1.5 font-mono bg-zinc-900 px-3 py-1.5 rounded-xl border border-zinc-800">
            <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
            Live Stream Synced: {lastUpdated.toLocaleTimeString()}
          </div>
        )}
      </div>

      {/* Top 3 Champions Podium */}
      {entries.length >= 1 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
          {entries.slice(0, 3).map((entry, idx) => {
            const rank = idx + 1;

            return (
              <motion.div
                key={entry.userId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`relative p-6 rounded-3xl border bg-[#121820] flex flex-col items-center text-center space-y-3 shadow-xl ${
                  rank === 1
                    ? "border-amber-500/80 bg-gradient-to-b from-amber-500/10 to-[#121820] shadow-amber-500/20 md:-translate-y-3"
                    : rank === 2
                    ? "border-zinc-400/60"
                    : "border-amber-700/60"
                }`}
              >
                <div
                  className={`size-12 rounded-full flex items-center justify-center font-extrabold text-lg shadow-lg font-mono ${
                    rank === 1
                      ? "bg-amber-500 text-black"
                      : rank === 2
                      ? "bg-zinc-300 text-black"
                      : "bg-amber-700 text-white"
                  }`}
                >
                  #{rank}
                </div>

                <div className="space-y-0.5">
                  <h3 className="text-lg font-bold text-white">{entry.displayName}</h3>
                  <p className="text-xs text-amber-400 font-mono font-bold">@{entry.username}</p>
                </div>

                <div className="pt-2 flex items-center gap-4 text-xs font-mono">
                  <div className="text-amber-400 font-extrabold text-base">
                    {entry.totalPoints} <span className="text-[10px] text-zinc-400 font-normal">PTS</span>
                  </div>
                  <div className="text-zinc-400 text-[11px] flex items-center gap-1">
                    <Clock className="size-3 text-cyan-400" /> {Math.round(entry.totalTimeSeconds / 60)}m solve time
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Complete Animated Leaderboard Table */}
      <div className="bg-[#121820] border border-zinc-800 rounded-3xl p-6 space-y-4 shadow-xl font-mono">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3 text-xs text-zinc-400 uppercase font-bold">
          <span>Rank &amp; Competitor</span>
          <span>Score &amp; Solve Time</span>
        </div>

        {entries.length === 0 ? (
          <div className="p-8 text-center space-y-2">
            <Trophy className="size-8 text-zinc-600 mx-auto" />
            <p className="text-xs text-zinc-400">No flags solved yet. Be the first on the scoreboard!</p>
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {entries.map((entry, index) => {
                const rank = index + 1;

                return (
                  <motion.div
                    key={entry.userId}
                    layout
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className={`p-4 rounded-2xl border transition-colors flex items-center justify-between gap-4 ${
                      rank === 1
                        ? "bg-amber-500/10 border-amber-500/50"
                        : rank === 2
                        ? "bg-zinc-800/40 border-zinc-500/30"
                        : rank === 3
                        ? "bg-amber-900/10 border-amber-700/40"
                        : "bg-black/40 border-zinc-800/80"
                    }`}
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div
                        className={`size-8 rounded-xl flex items-center justify-center font-extrabold text-xs shrink-0 ${
                          rank === 1
                            ? "bg-amber-500 text-black"
                            : rank === 2
                            ? "bg-zinc-300 text-black"
                            : rank === 3
                            ? "bg-amber-700 text-white"
                            : "bg-zinc-800 text-zinc-400"
                        }`}
                      >
                        #{rank}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-white truncate">{entry.displayName}</span>
                          <span className="text-xs text-zinc-400 font-normal">(@{entry.username})</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-6 shrink-0 font-mono text-right">
                      <div>
                        <div className="text-base font-extrabold text-amber-400">{entry.totalPoints} PTS</div>
                        <div className="text-[10px] text-zinc-500">{Math.round(entry.totalTimeSeconds / 60)}m total time</div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
