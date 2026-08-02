"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Trophy,
  Calendar,
  Sparkles,
  Users,
  Search,
  Plus,
  Clock,
  MapPin,
  Coins,
  CheckCircle2,
  Filter,
  Loader2,
  X,
  Award,
  Video,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface EventHost {
  _id: string;
  name?: string;
  email?: string;
  image?: string;
  role?: string;
}

interface EventItem {
  _id: string;
  title: string;
  slug: string;
  description: string;
  shortDescription?: string;
  bannerImage?: string;
  hostId: EventHost;
  eventType: "hackathon" | "seminar" | "workshop" | "webinar" | "other";
  isPaid: boolean;
  priceINR: number;
  mode: "online" | "offline" | "hybrid";
  location?: string;
  startDate: string;
  endDate: string;
  registrationDeadline: string;
  tags: string[];
  prizes?: string;
  status: "upcoming" | "live" | "ended" | "cancelled";
  participantCount: number;
  isJoined: boolean;
  isHost: boolean;
}

export default function EventsPage() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters state
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "hackathon" | "seminar" | "joined" | "hosted">("all");
  const [pricingFilter, setPricingFilter] = useState<"all" | "free" | "paid">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "upcoming" | "live" | "ended">("all");

  // Create Event Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Join Event processing state
  const [joiningId, setJoiningId] = useState<string | null>(null);

  // New Event Form State
  const [formTitle, setFormTitle] = useState("");
  const [formType, setFormType] = useState<"hackathon" | "seminar" | "workshop" | "webinar" | "other">("hackathon");
  const [formDescription, setFormDescription] = useState("");
  const [formShortDescription, setFormShortDescription] = useState("");
  const [formBannerImage, setFormBannerImage] = useState("");
  const [formIsPaid, setFormIsPaid] = useState(false);
  const [formPriceINR, setFormPriceINR] = useState(0);
  const [formMode, setFormMode] = useState<"online" | "offline" | "hybrid">("online");
  const [formLocation, setFormLocation] = useState("");
  const [formMeetingLink, setFormMeetingLink] = useState("");
  const [formStartDate, setFormStartDate] = useState("");
  const [formEndDate, setFormEndDate] = useState("");
  const [formDeadline, setFormDeadline] = useState("");
  const [formTags, setFormTags] = useState("");
  const [formProblemStatement, setFormProblemStatement] = useState("");
  const [formPrizes, setFormPrizes] = useState("");

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.set("search", searchQuery.trim());
      if (pricingFilter !== "all") params.set("pricing", pricingFilter);
      if (statusFilter !== "all") params.set("status", statusFilter);

      if (activeTab === "joined") {
        params.set("joinedByMe", "true");
      } else if (activeTab === "hosted") {
        params.set("hostedByMe", "true");
      } else if (activeTab !== "all") {
        params.set("type", activeTab);
      }

      const res = await fetch(`/api/events?${params.toString()}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to load events");
      }

      setEvents(data.events || []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error fetching events";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, activeTab, pricingFilter, statusFilter]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);

    if (!formTitle.trim() || !formDescription.trim() || !formStartDate || !formEndDate || !formDeadline) {
      setModalError("Please fill in all required fields (Title, Description, Start & End dates, Deadline).");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formTitle.trim(),
          eventType: formType,
          description: formDescription,
          shortDescription: formShortDescription,
          bannerImage: formBannerImage,
          isPaid: formIsPaid,
          priceINR: formIsPaid ? Number(formPriceINR) : 0,
          mode: formMode,
          location: formLocation,
          meetingLink: formMeetingLink,
          startDate: formStartDate,
          endDate: formEndDate,
          registrationDeadline: formDeadline,
          tags: formTags ? formTags.split(",").map((t) => t.trim()) : [],
          problemStatement: formProblemStatement,
          prizes: formPrizes,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create event");
      }

      setIsModalOpen(false);
      // Reset form
      setFormTitle("");
      setFormDescription("");
      setFormShortDescription("");
      setFormBannerImage("");
      setFormIsPaid(false);
      setFormPriceINR(0);
      setFormProblemStatement("");
      setFormPrizes("");
      fetchEvents();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to create event";
      setModalError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleJoinEvent = async (eventId: string) => {
    if (joiningId) return;
    setJoiningId(eventId);

    try {
      const res = await fetch(`/api/events/${eventId}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || data.message || "Failed to join event");
      }

      // Refresh events list
      setEvents((prev) =>
        prev.map((ev) =>
          ev._id === eventId
            ? { ...ev, isJoined: true, participantCount: ev.participantCount + 1 }
            : ev
        )
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Could not join event";
      alert(msg);
    } finally {
      setJoiningId(null);
    }
  };

  return (
    <div className="w-full min-h-screen bg-background text-foreground p-4 sm:p-6 lg:p-10 space-y-8">
      {/* ── HERO HEADER ── */}
      <div className="relative rounded-3xl bg-gradient-to-r from-amber-500/10 via-violet-500/10 to-cyan-500/10 border border-white/10 p-6 sm:p-10 overflow-hidden shadow-2xl">
        <div className="absolute -right-10 -bottom-10 size-72 bg-amber-500/10 rounded-full filter blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 text-xs font-mono font-bold tracking-wider uppercase">
              <Trophy className="size-3.5" />
              Notexia Events &amp; Hackathons
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight" style={{ fontFamily: "var(--font-space-grotesk)" }}>
              Host &amp; Participate in Top Events
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
              Join online hackathons, technical seminars, and workshops. Compete on live leaderboards, submit flags, win prizes, or host your own event.
            </p>
          </div>

          <Link href="/events/create">
            <Button className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black font-bold h-12 px-6 rounded-2xl shadow-lg shadow-amber-500/20 flex items-center gap-2 shrink-0 transition-transform active:scale-95">
              <Plus className="size-5" />
              Host an Event
            </Button>
          </Link>
        </div>
      </div>

      {/* ── TABS & SEARCH BAR ── */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/50 pb-4">
          <div className="flex items-center gap-2 overflow-x-auto custom-scroll pb-2 sm:pb-0">
            <button
              onClick={() => setActiveTab("all")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === "all"
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted"
              }`}
            >
              All Events
            </button>
            <button
              onClick={() => setActiveTab("hackathon")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                activeTab === "hackathon"
                  ? "bg-amber-500 text-black shadow-md shadow-amber-500/20"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted"
              }`}
            >
              <Trophy className="size-3.5" />
              Hackathons
            </button>
            <button
              onClick={() => setActiveTab("seminar")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                activeTab === "seminar"
                  ? "bg-cyan-500 text-black shadow-md shadow-cyan-500/20"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted"
              }`}
            >
              <Video className="size-3.5" />
              Seminars &amp; Workshops
            </button>
            <button
              onClick={() => setActiveTab("joined")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === "joined"
                  ? "bg-violet-500 text-white shadow-md shadow-violet-500/20"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted"
              }`}
            >
              My Joined Events
            </button>
            <button
              onClick={() => setActiveTab("hosted")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === "hosted"
                  ? "bg-emerald-500 text-black shadow-md shadow-emerald-500/20"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted"
              }`}
            >
              My Hosted Events
            </button>
          </div>
        </div>

        {/* ── SECONDARY FILTERS ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search events by title, tag..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-card/60 border border-border/60 rounded-xl text-xs focus:outline-none focus:border-amber-500/50 transition-colors"
            />
          </div>

          <div className="flex items-center gap-2 bg-card/60 border border-border/60 rounded-xl px-3 py-1.5">
            <Filter className="size-3.5 text-muted-foreground shrink-0" />
            <span className="text-[11px] text-muted-foreground font-medium shrink-0">Pricing:</span>
            <select
              value={pricingFilter}
              onChange={(e) => setPricingFilter(e.target.value as "all" | "free" | "paid")}
              className="bg-transparent text-xs text-foreground focus:outline-none w-full cursor-pointer"
            >
              <option value="all" className="bg-card">All Prices</option>
              <option value="free" className="bg-card">Free Only</option>
              <option value="paid" className="bg-card">Paid Only</option>
            </select>
          </div>

          <div className="flex items-center gap-2 bg-card/60 border border-border/60 rounded-xl px-3 py-1.5">
            <Clock className="size-3.5 text-muted-foreground shrink-0" />
            <span className="text-[11px] text-muted-foreground font-medium shrink-0">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as "all" | "upcoming" | "live" | "ended")}
              className="bg-transparent text-xs text-foreground focus:outline-none w-full cursor-pointer"
            >
              <option value="all" className="bg-card">All Statuses</option>
              <option value="live" className="bg-card">🔴 Live Now</option>
              <option value="upcoming" className="bg-card">📅 Upcoming</option>
              <option value="ended" className="bg-card">🏁 Ended</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── EVENTS LIST / GRID ── */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-64 rounded-2xl bg-card/40 border border-border/40 animate-pulse p-5 space-y-4">
              <div className="h-6 w-24 bg-muted/60 rounded-lg" />
              <div className="h-5 w-3/4 bg-muted/60 rounded-lg" />
              <div className="h-12 w-full bg-muted/40 rounded-lg" />
              <div className="h-8 w-full bg-muted/60 rounded-xl mt-auto" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="p-8 text-center bg-destructive/10 border border-destructive/20 rounded-2xl space-y-3">
          <p className="text-sm text-destructive font-medium">{error}</p>
          <Button onClick={fetchEvents} variant="outline" size="sm">
            Try Again
          </Button>
        </div>
      ) : events.length === 0 ? (
        <div className="p-12 text-center bg-card/40 border border-border/50 rounded-3xl space-y-4">
          <div className="size-12 rounded-full bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto">
            <Trophy className="size-6" />
          </div>
          <h3 className="text-lg font-bold">No Events Found</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            We couldn&apos;t find any events matching your filters. Try adjusting your search query or host a new event!
          </p>
          <Button onClick={() => setIsModalOpen(true)} className="bg-amber-500 text-black hover:bg-amber-600 font-bold text-xs">
            Host First Event
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => {
            const isLive = event.status === "live";
            const isEnded = event.status === "ended";

            return (
              <div
                key={event._id}
                className="group relative flex flex-col bg-card/70 border border-border/60 hover:border-amber-500/40 rounded-2xl overflow-hidden shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl"
              >
                {/* Banner & Badges */}
                <div className="relative h-40 w-full bg-muted/40 overflow-hidden">
                  {event.bannerImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={event.bannerImage}
                      alt={event.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-amber-500/20 via-violet-500/20 to-cyan-500/20 flex items-center justify-center p-4">
                      <Trophy className="size-12 text-amber-400/40" />
                    </div>
                  )}

                  {/* Top Overlay Badges */}
                  <div className="absolute top-3 left-3 flex items-center gap-2">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider shadow-md ${
                        event.eventType === "hackathon"
                          ? "bg-amber-500 text-black"
                          : event.eventType === "seminar"
                          ? "bg-cyan-500 text-black"
                          : "bg-violet-500 text-white"
                      }`}
                    >
                      {event.eventType}
                    </span>

                    {isLive && (
                      <span className="px-2.5 py-1 rounded-full bg-emerald-500 text-black text-[10px] font-mono font-bold uppercase flex items-center gap-1 shadow-md animate-pulse">
                        <span className="size-1.5 rounded-full bg-black" />
                        Live Now
                      </span>
                    )}

                    {isEnded && (
                      <span className="px-2.5 py-1 rounded-full bg-zinc-700 text-zinc-300 text-[10px] font-mono font-bold uppercase shadow-md">
                        Ended
                      </span>
                    )}
                  </div>

                  {/* Price Tag */}
                  <div className="absolute top-3 right-3">
                    {event.isPaid ? (
                      <span className="px-2.5 py-1 rounded-full bg-amber-500/90 text-black font-mono font-extrabold text-[11px] flex items-center gap-1 shadow-lg backdrop-blur-md">
                        <Coins className="size-3" />
                        ₹{event.priceINR} ({event.priceINR} Coins)
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full bg-emerald-500/90 text-black font-mono font-extrabold text-[11px] shadow-lg backdrop-blur-md">
                        FREE
                      </span>
                    )}
                  </div>
                </div>

                {/* Content */}
                <div className="p-5 flex-1 flex flex-col space-y-4">
                  <div>
                    <h3
                      className="text-base font-bold tracking-tight text-foreground line-clamp-1 group-hover:text-amber-400 transition-colors"
                      style={{ fontFamily: "var(--font-space-grotesk)" }}
                    >
                      {event.title}
                    </h3>
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                      {event.shortDescription || event.description}
                    </p>
                  </div>

                  {/* Dates & Location info */}
                  <div className="space-y-1.5 text-[11px] text-muted-foreground font-mono">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="size-3.5 text-amber-400 shrink-0" />
                      <span>
                        {new Date(event.startDate).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}{" "}
                        -{" "}
                        {new Date(event.endDate).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <MapPin className="size-3.5 text-cyan-400 shrink-0" />
                      <span className="capitalize">{event.mode} Event</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Users className="size-3.5 text-violet-400 shrink-0" />
                      <span>{event.participantCount} Participants Joined</span>
                    </div>
                  </div>

                  {/* Tags */}
                  {event.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {event.tags.slice(0, 3).map((tag, idx) => (
                        <span key={idx} className="px-2 py-0.5 rounded bg-muted/60 text-[10px] text-zinc-400 font-mono">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Host Info & Action Button */}
                  <div className="pt-3 border-t border-border/40 flex items-center justify-between gap-3 mt-auto">
                    <div className="flex items-center gap-2 min-w-0">
                      {event.hostId?.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={event.hostId.image}
                          alt={event.hostId.name || "Host"}
                          className="size-7 rounded-full object-cover shrink-0"
                        />
                      ) : (
                        <div className="size-7 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-[10px] shrink-0">
                          {event.hostId?.name?.[0] || "H"}
                        </div>
                      )}
                      <span className="text-[11px] font-medium text-muted-foreground truncate">
                        {event.hostId?.name || "Event Host"}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {event.isHost ? (
                        <Link href={`/events/${event.slug || event._id}`}>
                          <Button size="sm" className="bg-emerald-500 hover:bg-emerald-600 text-black font-bold text-xs h-8 px-3 rounded-xl">
                            Host Panel
                          </Button>
                        </Link>
                      ) : event.isJoined ? (
                        <Link href={`/events/${event.slug || event._id}`}>
                          <Button size="sm" variant="outline" className="text-emerald-400 border-emerald-500/40 hover:bg-emerald-500/10 font-bold text-xs h-8 px-3 rounded-xl flex items-center gap-1">
                            <CheckCircle2 className="size-3.5" />
                            Joined
                          </Button>
                        </Link>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => handleJoinEvent(event._id)}
                          disabled={joiningId === event._id || isEnded}
                          className="bg-amber-500 hover:bg-amber-600 text-black font-bold text-xs h-8 px-3 rounded-xl flex items-center gap-1"
                        >
                          {joiningId === event._id ? (
                            <Loader2 className="size-3.5 animate-spin" />
                          ) : event.isPaid ? (
                            `Join (₹${event.priceINR})`
                          ) : (
                            "Join Free"
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── CREATE / HOST EVENT MODAL ── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 overflow-y-auto custom-scroll backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl bg-card border border-border/80 rounded-3xl shadow-2xl p-6 sm:p-8 space-y-6 my-8">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-5 right-5 p-2 text-muted-foreground hover:text-foreground rounded-full hover:bg-muted/50 transition-colors"
            >
              <X className="size-5" />
            </button>

            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 text-[11px] font-mono font-bold uppercase">
                <Trophy className="size-3.5" />
                Host New Event
              </div>
              <h2 className="text-2xl font-bold tracking-tight" style={{ fontFamily: "var(--font-space-grotesk)" }}>
                Create Hackathon or Seminar
              </h2>
              <p className="text-xs text-muted-foreground">
                Set up an event for Notexia users to join, compete on live leaderboards, or attend workshops.
              </p>
            </div>

            {modalError && (
              <div className="p-3.5 rounded-xl bg-destructive/15 border border-destructive/30 text-destructive text-xs font-medium">
                {modalError}
              </div>
            )}

            <form onSubmit={handleCreateEvent} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-bold text-foreground">Event Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Notexia AI Code Hackathon 2026"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-background border border-border rounded-xl text-xs focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">Event Type</label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value as "hackathon" | "seminar" | "workshop" | "webinar" | "other")}
                    className="w-full px-3.5 py-2.5 bg-background border border-border rounded-xl text-xs focus:outline-none focus:border-amber-500"
                  >
                    <option value="hackathon">🏆 Hackathon</option>
                    <option value="seminar">🎤 Seminar / Webinar</option>
                    <option value="workshop">💻 Technical Workshop</option>
                    <option value="other">🎉 Community Meetup</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">Mode</label>
                  <select
                    value={formMode}
                    onChange={(e) => setFormMode(e.target.value as "online" | "offline" | "hybrid")}
                    className="w-full px-3.5 py-2.5 bg-background border border-border rounded-xl text-xs focus:outline-none focus:border-amber-500"
                  >
                    <option value="online">🌐 Online</option>
                    <option value="offline">🏢 Offline</option>
                    <option value="hybrid">🔀 Hybrid</option>
                  </select>
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-bold text-foreground">Short Description</label>
                  <input
                    type="text"
                    placeholder="Brief tagline (max 140 chars)"
                    value={formShortDescription}
                    onChange={(e) => setFormShortDescription(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-background border border-border rounded-xl text-xs focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-bold text-foreground">Full Description *</label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Provide full agenda, prerequisites, rules, and details..."
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-background border border-border rounded-xl text-xs focus:outline-none focus:border-amber-500"
                  />
                </div>

                {/* Hackathon Specific: Problem Statement & Prizes */}
                {formType === "hackathon" && (
                  <>
                    <div className="space-y-1.5 sm:col-span-2">
                      <label className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                        <Sparkles className="size-3.5" />
                        Hackathon Problem Statement / Challenge
                      </label>
                      <textarea
                        rows={2}
                        placeholder="Describe the challenge or problem participants need to solve..."
                        value={formProblemStatement}
                        onChange={(e) => setFormProblemStatement(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-background border border-amber-500/40 rounded-xl text-xs focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    <div className="space-y-1.5 sm:col-span-2">
                      <label className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                        <Award className="size-3.5" />
                        Prizes &amp; Rewards
                      </label>
                      <input
                        type="text"
                        placeholder="e.g., 1st Prize: ₹5,000 + Certificate | 2nd Prize: ₹2,000"
                        value={formPrizes}
                        onChange={(e) => setFormPrizes(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-background border border-amber-500/40 rounded-xl text-xs focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </>
                )}

                {/* Dates */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">Start Date &amp; Time *</label>
                  <input
                    type="datetime-local"
                    required
                    value={formStartDate}
                    onChange={(e) => setFormStartDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-background border border-border rounded-xl text-xs focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">End Date &amp; Time *</label>
                  <input
                    type="datetime-local"
                    required
                    value={formEndDate}
                    onChange={(e) => setFormEndDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-background border border-border rounded-xl text-xs focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-bold text-foreground">Registration Deadline *</label>
                  <input
                    type="datetime-local"
                    required
                    value={formDeadline}
                    onChange={(e) => setFormDeadline(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-background border border-border rounded-xl text-xs focus:outline-none focus:border-amber-500"
                  />
                </div>

                {/* Meeting Link & Location */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">Meeting / Video Link (Online)</label>
                  <input
                    type="url"
                    placeholder="https://zoom.us/j/... or Google Meet"
                    value={formMeetingLink}
                    onChange={(e) => setFormMeetingLink(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-background border border-border rounded-xl text-xs focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">Venue / Location (Offline)</label>
                  <input
                    type="text"
                    placeholder="Building / City / Address"
                    value={formLocation}
                    onChange={(e) => setFormLocation(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-background border border-border rounded-xl text-xs focus:outline-none focus:border-amber-500"
                  />
                </div>

                {/* Banner & Tags */}
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-bold text-foreground">Banner Image URL</label>
                  <input
                    type="url"
                    placeholder="https://images.unsplash.com/..."
                    value={formBannerImage}
                    onChange={(e) => setFormBannerImage(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-background border border-border rounded-xl text-xs focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-bold text-foreground">Tags (comma separated)</label>
                  <input
                    type="text"
                    placeholder="ai, react, nextjs, web3, python"
                    value={formTags}
                    onChange={(e) => setFormTags(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-background border border-border rounded-xl text-xs focus:outline-none focus:border-amber-500"
                  />
                </div>

                {/* Pricing: Free vs Paid */}
                <div className="space-y-3 sm:col-span-2 p-4 bg-muted/40 rounded-2xl border border-border">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-foreground">Event Ticket Pricing</span>
                      <p className="text-[11px] text-muted-foreground">Charge participants an entrance fee in Coins/INR or keep it free.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formIsPaid}
                        onChange={(e) => setFormIsPaid(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-muted-foreground/30 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500" />
                    </label>
                  </div>

                  {formIsPaid && (
                    <div className="pt-2 flex items-center gap-3">
                      <span className="text-xs font-bold text-amber-400">Entry Fee (₹ / Coins):</span>
                      <input
                        type="number"
                        min={1}
                        value={formPriceINR}
                        onChange={(e) => setFormPriceINR(Number(e.target.value))}
                        className="w-32 px-3 py-1.5 bg-background border border-border rounded-xl text-xs font-mono font-bold focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsModalOpen(false)}
                  className="text-xs font-bold"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="bg-amber-500 hover:bg-amber-600 text-black font-bold text-xs h-10 px-6 rounded-xl flex items-center gap-2"
                >
                  {submitting ? <Loader2 className="size-4 animate-spin" /> : "Publish Event"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
