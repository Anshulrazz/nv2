"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Trophy,
  Users,
  Award,
  Loader2,
  ArrowLeft,
  Search,
  ExternalLink,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface ParticipantItem {
  _id: string;
  user: { _id: string; name?: string; email?: string; image?: string };
  displayName: string;
  username: string;
  paymentStatus: string;
  registeredAt: string;
  totalPoints: number;
  solvedCount: number;
  certificate?: {
    _id: string;
    rank: number;
    displayName: string;
    issuedAt: string;
    certificateUrl: string;
  } | null;
}

interface EventMeta {
  _id: string;
  title: string;
  slug: string;
  status: string;
  maxParticipants?: number | null;
  isPaid: boolean;
  entryFeeINR: number;
}

export default function EventHostDashboardPage() {
  const params = useParams();
  const eventIdentifier = (params.id || params.slug) as string;

  const [event, setEvent] = useState<EventMeta | null>(null);
  const [participants, setParticipants] = useState<ParticipantItem[]>([]);
  const [issuedCertificateCount, setIssuedCertificateCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState("");
  const [generatingUserId, setGeneratingUserId] = useState<string | null>(null);
  const [bulkGenerating, setBulkGenerating] = useState(false);

  const fetchHostData = useCallback(async () => {
    try {
      const res = await fetch(`/api/events/${eventIdentifier}/participants`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load host dashboard");

      setEvent(data.event);
      setParticipants(data.participants || []);
      setIssuedCertificateCount(data.issuedCertificateCount || 0);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error loading host dashboard";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [eventIdentifier]);

  useEffect(() => {
    if (eventIdentifier) fetchHostData();
  }, [eventIdentifier, fetchHostData]);

  // Generate single certificate
  const handleGenerateCertificate = async (targetUserId: string, rank: number) => {
    if (!event) return;
    setGeneratingUserId(targetUserId);

    try {
      const res = await fetch(`/api/events/${event._id}/certificates/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId, rank, mode: "single" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate certificate");

      alert(data.message || "Certificate generated!");
      fetchHostData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error generating certificate";
      alert(msg);
    } finally {
      setGeneratingUserId(null);
    }
  };

  // Bulk certificate generation
  const handleBulkGenerate = async (mode: "bulk_top3" | "bulk_all") => {
    if (!event) return;
    const confirmMsg =
      mode === "bulk_top3"
        ? "Generate Certificates for the Top 3 Winners on the Leaderboard?"
        : "Generate Certificates for ALL registered participants?";
    if (!confirm(confirmMsg)) return;

    setBulkGenerating(true);

    try {
      const res = await fetch(`/api/events/${event._id}/certificates/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to bulk generate certificates");

      alert(data.message || "Certificates generated successfully!");
      fetchHostData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error generating certificates";
      alert(msg);
    } finally {
      setBulkGenerating(false);
    }
  };

  const filteredParticipants = participants.filter((p) => {
    const term = searchQuery.toLowerCase();
    return (
      p.displayName.toLowerCase().includes(term) ||
      p.username.toLowerCase().includes(term) ||
      (p.user?.email || "").toLowerCase().includes(term)
    );
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-8 space-y-4">
        <Loader2 className="size-8 text-amber-500 animate-spin" />
        <p className="text-xs text-muted-foreground font-mono">Loading Host Console...</p>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="w-full min-h-screen bg-background p-8 max-w-xl mx-auto space-y-6">
        <Link href="/events">
          <Button variant="ghost" size="sm" className="gap-2 text-xs">
            <ArrowLeft className="size-4" /> Back to Events
          </Button>
        </Link>
        <div className="p-8 text-center bg-card border border-border rounded-3xl space-y-3">
          <h2 className="text-xl font-bold text-destructive">Host Access Denied</h2>
          <p className="text-xs text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-background text-foreground p-4 sm:p-6 lg:p-10 space-y-8">
      {/* Navigation Header */}
      <div className="flex items-center justify-between">
        <Link href="/events">
          <Button variant="ghost" size="sm" className="gap-2 text-xs font-bold hover:bg-card">
            <ArrowLeft className="size-4" /> Back to Events Hub
          </Button>
        </Link>

        <div className="flex items-center gap-2">
          <Link href={`/events/${event.slug || event._id}/edit`}>
            <Button size="sm" className="bg-amber-500 hover:bg-amber-600 text-black font-bold text-xs rounded-xl">
              Edit Event ✏️
            </Button>
          </Link>
          <Link href={`/events/${event.slug || event._id}/challenges`}>
            <Button variant="outline" size="sm" className="text-xs font-bold rounded-xl">
              CTF Arena
            </Button>
          </Link>
          <Link href={`/events/${event.slug || event._id}/leaderboard`}>
            <Button variant="outline" size="sm" className="text-xs font-bold rounded-xl">
              Live Scoreboard
            </Button>
          </Link>
        </div>
      </div>

      {/* Host Console Banner */}
      <div className="relative rounded-3xl bg-card border border-border p-6 sm:p-8 shadow-2xl space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 text-amber-400 font-mono text-xs font-bold">
              <Shield className="size-4" /> Organizer &amp; Host Management Panel
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight" style={{ fontFamily: "var(--font-space-grotesk)" }}>
              {event.title}
            </h1>
            <p className="text-xs text-muted-foreground font-mono">
              Status: <span className="text-amber-400 uppercase font-bold">{event.status}</span> | Ticket: {event.isPaid ? `₹${event.entryFeeINR} INR` : "FREE"}
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-4 font-mono">
            <div className="p-4 rounded-2xl bg-background border border-border text-center space-y-1">
              <span className="text-xs text-muted-foreground">Registered</span>
              <div className="text-xl font-extrabold text-amber-400">
                {participants.length} {event.maxParticipants ? `/ ${event.maxParticipants}` : ""}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-background border border-border text-center space-y-1">
              <span className="text-xs text-muted-foreground">Certificates Issued</span>
              <div className="text-xl font-extrabold text-emerald-400">{issuedCertificateCount}</div>
            </div>
          </div>
        </div>

        {/* Bulk Certificate Generation Actions */}
        <div className="pt-4 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-xs font-bold text-foreground flex items-center gap-1.5 font-mono">
            <Award className="size-4 text-amber-400" /> Certificate Authorization Actions:
          </span>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Button
              onClick={() => handleBulkGenerate("bulk_top3")}
              disabled={bulkGenerating}
              size="sm"
              className="bg-amber-500 hover:bg-amber-600 text-black font-bold text-xs h-10 px-4 rounded-xl flex items-center gap-2"
            >
              {bulkGenerating ? <Loader2 className="size-4 animate-spin" /> : <Trophy className="size-4" />}
              Auto-Issue Top 3 Winners
            </Button>

            <Button
              onClick={() => handleBulkGenerate("bulk_all")}
              disabled={bulkGenerating}
              size="sm"
              variant="outline"
              className="font-bold text-xs h-10 px-4 rounded-xl flex items-center gap-2"
            >
              Issue for All Participants
            </Button>
          </div>
        </div>
      </div>

      {/* Participants Roster Table */}
      <div className="bg-card border border-border rounded-3xl p-6 space-y-6 shadow-xl font-mono">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2" style={{ fontFamily: "var(--font-space-grotesk)" }}>
            <Users className="size-5 text-cyan-400" /> Participants Roster ({filteredParticipants.length})
          </h2>

          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search competitor name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-background border border-border rounded-xl text-xs focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>

        {filteredParticipants.length === 0 ? (
          <div className="p-8 text-center text-xs text-muted-foreground">No participants matching query.</div>
        ) : (
          <div className="overflow-x-auto custom-scroll">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border text-muted-foreground uppercase text-[10px]">
                  <th className="pb-3">Competitor</th>
                  <th className="pb-3">Payment</th>
                  <th className="pb-3">CTF Score</th>
                  <th className="pb-3">Certificate Status</th>
                  <th className="pb-3 text-right">Host Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredParticipants.map((part) => {
                  const cert = part.certificate;
                  const isProcessing = generatingUserId === (part.user?._id || part._id);

                  return (
                    <tr key={part._id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3.5 pr-4">
                        <div>
                          <div className="font-bold text-foreground">{part.displayName}</div>
                          <div className="text-[11px] text-muted-foreground">@{part.username} • {part.user?.email || "N/A"}</div>
                        </div>
                      </td>

                      <td className="py-3.5 pr-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                            part.paymentStatus === "paid"
                              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                              : part.paymentStatus === "not_required"
                              ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                              : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                          }`}
                        >
                          {part.paymentStatus}
                        </span>
                      </td>

                      <td className="py-3.5 pr-4">
                        <div className="font-bold text-amber-400">{part.totalPoints} PTS</div>
                        <div className="text-[10px] text-muted-foreground">{part.solvedCount} Solved</div>
                      </td>

                      <td className="py-3.5 pr-4">
                        {part.hasCertificate ? (
                          <a href={`/events/certificates/${part.userId || part._id}`} target="_blank" rel="noopener noreferrer">
                            <Button variant="ghost" size="sm" className="text-amber-400 font-bold text-xs h-8 px-2.5">
                              View CTF Cert 📜
                            </Button>
                          </a>
                        ) : (
                          <span className="text-[11px] text-muted-foreground">Not Issued</span>
                        )}
                      </td>

                      <td className="py-3.5 text-right space-x-2">
                        <Button
                          size="sm"
                          disabled={isProcessing}
                          onClick={() => handleGenerateCertificate(part.user?._id || part._id, 1)}
                          className="bg-amber-500/15 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-[11px] h-8 px-2.5 rounded-lg"
                        >
                          {isProcessing ? <Loader2 className="size-3 animate-spin" /> : "Award #1 Gold"}
                        </Button>

                        <Button
                          size="sm"
                          disabled={isProcessing}
                          onClick={() => handleGenerateCertificate(part.user?._id || part._id, 2)}
                          variant="outline"
                          className="text-[11px] h-8 px-2.5 rounded-lg"
                        >
                          Award #2
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
