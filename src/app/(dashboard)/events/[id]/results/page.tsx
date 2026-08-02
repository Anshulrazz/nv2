"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Award,
  Download,
  ArrowLeft,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface CertificateInfo {
  rank: number;
  displayName: string;
  issuedAt: string;
  certificateUrl: string;
}

interface LeaderboardEntry {
  userId: string;
  displayName: string;
  username: string;
  totalPoints: number;
  totalTimeSeconds: number;
}

export default function CTFResultsPage() {
  const params = useParams();
  const eventIdentifier = (params.id || params.slug) as string;

  const [eventId, setEventId] = useState<string | null>(null);
  const [eventTitle, setEventTitle] = useState("");
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [userCert, setUserCert] = useState<CertificateInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchResults = useCallback(async () => {
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
      }

      // Check if current user has a certificate
      const certRes = await fetch(`/api/events/${data.event._id}/certificate`);
      const certData = await certRes.json();
      if (certRes.ok && certData.certificate) {
        setUserCert(certData.certificate);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load results";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [eventIdentifier]);

  useEffect(() => {
    if (eventIdentifier) fetchResults();
  }, [eventIdentifier, fetchResults]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-8 space-y-4">
        <Loader2 className="size-8 text-amber-500 animate-spin" />
        <p className="text-xs text-muted-foreground font-mono">Loading official event results...</p>
      </div>
    );
  }

  if (error || !eventId) {
    return (
      <div className="w-full min-h-screen bg-background p-8 max-w-xl mx-auto space-y-6">
        <Link href="/events">
          <Button variant="ghost" size="sm" className="gap-2 text-xs">
            <ArrowLeft className="size-4" /> Back to Events
          </Button>
        </Link>
        <div className="p-8 text-center bg-card border border-border rounded-3xl space-y-3">
          <h2 className="text-xl font-bold text-destructive">Results Not Available</h2>
          <p className="text-xs text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-background text-foreground p-4 sm:p-6 lg:p-10 space-y-10">
      <Link href="/events">
        <Button variant="ghost" size="sm" className="gap-2 text-xs font-bold hover:bg-card">
          <ArrowLeft className="size-4" /> Back to Events Hub
        </Button>
      </Link>

      <div className="text-center space-y-3 max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-emerald-500/15 text-emerald-400 font-mono text-xs font-bold uppercase border border-emerald-500/30">
          <Award className="size-4 text-emerald-400" /> Official Final Results &amp; Champions
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight" style={{ fontFamily: "var(--font-space-grotesk)" }}>
          {eventTitle} Results
        </h1>
      </div>

      {/* User Certificate Download Alert (If Winner) */}
      {userCert && (
        <div className="max-w-2xl mx-auto p-6 bg-amber-500/10 border border-amber-500/40 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
          <div className="flex items-center gap-4">
            <div className="size-12 rounded-2xl bg-amber-500 text-black flex items-center justify-center font-extrabold text-lg font-mono shrink-0 shadow-lg">
              #{userCert.rank}
            </div>
            <div className="space-y-0.5">
              <h3 className="text-base font-bold text-foreground">Congratulations, {userCert.displayName}!</h3>
              <p className="text-xs text-amber-400 font-mono">You placed #{userCert.rank} in the official standings.</p>
            </div>
          </div>

          <a href={userCert.certificateUrl} target="_blank" rel="noopener noreferrer">
            <Button size="sm" className="bg-amber-500 hover:bg-amber-600 text-black font-bold text-xs h-10 px-5 rounded-xl flex items-center gap-2">
              <Download className="size-4" /> Download Certificate
            </Button>
          </a>
        </div>
      )}

      {/* Top 3 Winner Podium */}
      <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
        {entries.slice(0, 3).map((entry, idx) => {
          const rank = idx + 1;

          return (
            <div
              key={entry.userId}
              className={`p-6 rounded-3xl border bg-card flex flex-col items-center text-center space-y-4 shadow-xl ${
                rank === 1
                  ? "border-amber-500/80 bg-gradient-to-b from-amber-500/10 to-card shadow-amber-500/20 md:-translate-y-4"
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

              <div className="space-y-1">
                <h3 className="text-lg font-bold text-foreground">{entry.displayName}</h3>
                <p className="text-xs text-amber-400 font-mono font-bold">@{entry.username}</p>
              </div>

              <div className="pt-2 text-xs font-mono">
                <span className="text-amber-400 font-extrabold text-base">{entry.totalPoints} PTS</span>
                <p className="text-muted-foreground text-[10px]">{Math.round(entry.totalTimeSeconds / 60)} mins total time</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
