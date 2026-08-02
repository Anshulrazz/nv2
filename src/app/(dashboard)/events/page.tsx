"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Trophy,
  Calendar,
  Search,
  Plus,
  Loader2,
  ArrowRight,
  Award,
  Download,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface EventItem {
  _id: string;
  title: string;
  slug: string;
  description: string;
  bannerUrl?: string;
  category: string;
  createdBy: { name?: string; email?: string; image?: string };
  status: "draft" | "published" | "live" | "ended" | "archived";
  registrationStart: string;
  registrationEnd: string;
  eventStart: string;
  eventEnd: string;
  isPaid: boolean;
  entryFeeINR: number;
}

interface UserCertificate {
  _id: string;
  rank: number;
  displayName: string;
  issuedAt: string;
  certificateUrl: string;
  eventId: {
    _id: string;
    title: string;
    slug: string;
    category: string;
  };
}

export default function EventsHubPage() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [certificates, setCertificates] = useState<UserCertificate[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "live" | "certificates">("all");

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      if (statusFilter === "certificates") {
        const certRes = await fetch("/api/events/my-certificates");
        const certData = await certRes.json();
        if (certRes.ok) {
          setCertificates(certData.certificates || []);
        }
      } else {
        const res = await fetch(`/api/events?status=${statusFilter}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to load events");
        setEvents(data.events || []);
      }
    } catch (err: unknown) {
      console.error("Error loading events:", err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const filteredEvents = events.filter((ev) => {
    const matchesSearch =
      ev.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ev.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="w-full min-h-screen bg-background text-foreground p-4 sm:p-6 lg:p-10 space-y-8">
      {/* Header Banner */}
      <div className="relative rounded-3xl bg-card border border-border overflow-hidden p-6 sm:p-10 shadow-2xl space-y-4">
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full filter blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500/15 text-amber-400 font-mono text-xs font-bold uppercase tracking-wider">
              <Trophy className="size-4" /> Notexia CTF &amp; Hackathon Hub
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight" style={{ fontFamily: "var(--font-space-grotesk)" }}>
              CTF Challenges &amp; Hackathons
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl">
              Compete in flag-based security challenges, climb live real-time scoreboards, and earn top-performer certificates.
            </p>
          </div>

          <Link href="/events/create">
            <Button className="bg-amber-500 hover:bg-amber-600 text-black font-bold text-xs h-11 px-6 rounded-2xl shadow-lg shadow-amber-500/20 flex items-center gap-2 shrink-0">
              <Plus className="size-4" /> Host CTF Event
            </Button>
          </Link>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search events or categories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-card border border-border rounded-2xl text-xs focus:outline-none focus:border-amber-500"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto custom-scroll pb-1 md:pb-0">
          <div className="flex items-center gap-1.5 bg-card p-1 rounded-2xl border border-border shrink-0 font-mono">
            <button
              onClick={() => setStatusFilter("all")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                statusFilter === "all" ? "bg-amber-500 text-black shadow" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              All Events
            </button>
            <button
              onClick={() => setStatusFilter("live")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                statusFilter === "live" ? "bg-emerald-500 text-black shadow" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Live CTFs ⚡
            </button>
            <button
              onClick={() => setStatusFilter("certificates")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                statusFilter === "certificates" ? "bg-amber-500 text-black shadow" : "text-amber-400 hover:text-amber-300"
              }`}
            >
              <Award className="size-3.5" /> My Certificates 📜
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid View */}
      {loading ? (
        <div className="min-h-64 flex flex-col items-center justify-center space-y-3 p-12 bg-card border border-border rounded-3xl">
          <Loader2 className="size-8 text-amber-500 animate-spin" />
          <p className="text-xs text-muted-foreground font-mono">Loading data...</p>
        </div>
      ) : statusFilter === "certificates" ? (
        /* Certificates Tab Content */
        certificates.length === 0 ? (
          <div className="p-12 text-center bg-card border border-border rounded-3xl space-y-3">
            <Award className="size-10 text-amber-500/60 mx-auto" />
            <h3 className="text-base font-bold">No Certificates Earned Yet</h3>
            <p className="text-xs text-muted-foreground">
              Participate in live CTFs and rank in the top performers to earn official certificates!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {certificates.map((cert) => (
              <div
                key={cert._id}
                className="p-6 rounded-3xl bg-amber-500/10 border border-amber-500/40 flex flex-col space-y-4 shadow-xl relative overflow-hidden"
              >
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 rounded-full bg-amber-500 text-black font-mono text-xs font-extrabold shadow">
                    Rank #{cert.rank} Winner 🏆
                  </span>
                  <span className="text-[11px] font-mono text-muted-foreground">
                    {new Date(cert.issuedAt).toLocaleDateString()}
                  </span>
                </div>

                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-foreground">{cert.eventId?.title || "Notexia CTF Event"}</h3>
                  <p className="text-xs text-amber-400 font-mono font-bold">Awarded to {cert.displayName}</p>
                </div>

                <div className="pt-3 mt-auto">
                  <a href={`/certificates/${cert.eventId?._id || cert._id}_${cert.displayName}`} target="_blank" rel="noopener noreferrer">
                    <Button size="sm" className="w-full bg-amber-500 hover:bg-amber-600 text-black font-bold text-xs h-10 rounded-xl flex items-center justify-center gap-2 shadow">
                      <Download className="size-4" /> View &amp; Print Certificate
                    </Button>
                  </a>
                </div>
              </div>
            ))}
          </div>
        )
      ) : filteredEvents.length === 0 ? (
        <div className="p-12 text-center bg-card border border-border rounded-3xl space-y-3">
          <Trophy className="size-10 text-muted-foreground mx-auto" />
          <h3 className="text-base font-bold">No Events Found</h3>
          <p className="text-xs text-muted-foreground">Check back soon or create your own CTF event!</p>
        </div>
      ) : (
        /* Events Cards Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map((ev) => {
            const isLive = ev.status === "live";

            return (
              <div
                key={ev._id}
                className="p-6 rounded-3xl bg-card border border-border flex flex-col space-y-4 shadow-xl hover:border-amber-500/50 transition-all group relative overflow-hidden"
              >
                {/* Category & Status badges */}
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 rounded-full bg-amber-500/15 text-amber-400 font-mono text-xs font-bold">
                    {ev.category}
                  </span>

                  {isLive ? (
                    <span className="px-3 py-1 rounded-full bg-emerald-500 text-black font-mono text-xs font-bold flex items-center gap-1.5 animate-pulse">
                      <span className="size-2 rounded-full bg-black" /> Live CTF
                    </span>
                  ) : (
                    <span className="px-3 py-1 rounded-full bg-muted text-muted-foreground font-mono text-xs font-bold capitalize">
                      {ev.status}
                    </span>
                  )}
                </div>

                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-foreground group-hover:text-amber-400 transition-colors line-clamp-1">
                    {ev.title}
                  </h3>
                  <p className="text-xs text-muted-foreground line-clamp-2">{ev.description}</p>
                </div>

                <div className="space-y-2 pt-2 text-xs font-mono text-muted-foreground border-t border-border/50">
                  <div className="flex items-center gap-2">
                    <Calendar className="size-3.5 text-amber-400" />
                    <span>
                      {new Date(ev.eventStart).toLocaleDateString()} - {new Date(ev.eventEnd).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="font-bold text-foreground">
                      {ev.isPaid ? `₹${ev.entryFeeINR} INR` : "FREE ENTRY"}
                    </span>
                    <span className="text-[11px] text-muted-foreground">By {ev.createdBy?.name || "Host"}</span>
                  </div>
                </div>

                <div className="pt-2 mt-auto flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <Link href={`/events/${ev.slug || ev._id}/register`} className="flex-1">
                      <Button size="sm" variant="outline" className="w-full font-bold text-xs h-9 rounded-xl">
                        Register
                      </Button>
                    </Link>

                    <Link href={`/events/${ev.slug || ev._id}/challenges`} className="flex-1">
                      <Button size="sm" className="w-full bg-amber-500 hover:bg-amber-600 text-black font-bold text-xs h-9 rounded-xl flex items-center justify-center gap-1">
                        Enter Arena <ArrowRight className="size-3.5" />
                      </Button>
                    </Link>
                  </div>

                  <Link href={`/events/${ev.slug || ev._id}/host`} className="w-full">
                    <Button size="sm" variant="ghost" className="w-full text-amber-400 hover:bg-amber-500/10 font-bold text-xs h-8 rounded-xl flex items-center justify-center gap-1 font-mono">
                      Host Panel &amp; Certificates 🛡️
                    </Button>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
