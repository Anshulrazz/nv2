"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Trophy,
  Calendar,
  Sparkles,
  Plus,
  Trash2,
  Image as ImageIcon,
  Flag,
  ArrowLeft,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface ChallengeInput {
  id: string;
  title: string;
  category: string;
  points: number;
  flag: string;
  imageUrl: string;
  description: string;
  hints: string;
}

export default function CreateEventPage() {
  const router = useRouter();

  // Form State
  const [title, setTitle] = useState("");
  const [eventType, setEventType] = useState<"hackathon" | "seminar" | "workshop" | "webinar" | "other">("hackathon");
  const [shortDescription, setShortDescription] = useState("");
  const [description, setDescription] = useState("");
  const [bannerImage, setBannerImage] = useState("");
  const [mode, setMode] = useState<"online" | "offline" | "hybrid">("online");
  const [location, setLocation] = useState("");
  const [meetingLink, setMeetingLink] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [registrationDeadline, setRegistrationDeadline] = useState("");
  const [isPaid, setIsPaid] = useState(false);
  const [priceINR, setPriceINR] = useState(0);
  const [tags, setTags] = useState("hackathon, ai, web3");
  const [problemStatement, setProblemStatement] = useState("");
  const [prizes, setPrizes] = useState("");

  // Hackathon Challenges & Flags state
  const [challenges, setChallenges] = useState<ChallengeInput[]>([
    {
      id: "1",
      title: "Challenge #1: Decode the Secret",
      category: "Web & AI",
      points: 100,
      flag: "NOTEXIA{ai_master_key_2026}",
      imageUrl: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&auto=format&fit=crop&q=60",
      description: "Analyze the prompt and retrieve the hidden flag embedded in the neural output.",
      hints: "Inspect HTTP response headers, Check system prompt",
    },
  ]);

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const addChallenge = () => {
    setChallenges((prev) => [
      ...prev,
      {
        id: String(Date.now()),
        title: `Challenge #${prev.length + 1}`,
        category: "General",
        points: 100,
        flag: `NOTEXIA{flag_${Math.random().toString(36).substring(2, 8)}}`,
        imageUrl: "",
        description: "",
        hints: "",
      },
    ]);
  };

  const removeChallenge = (id: string) => {
    setChallenges((prev) => prev.filter((c) => c.id !== id));
  };

  const updateChallenge = (id: string, field: keyof ChallengeInput, value: string | number) => {
    setChallenges((prev) =>
      prev.map((c) => (c.id === id ? { ...c, [field]: value } : c))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!title.trim() || !description.trim() || !startDate || !endDate || !registrationDeadline) {
      setErrorMsg("Please fill in all mandatory fields (Title, Description, Start & End dates, Deadline).");
      return;
    }

    setSubmitting(true);
    try {
      const formattedChallenges = eventType === "hackathon"
        ? challenges.map((c) => ({
            title: c.title.trim(),
            description: c.description,
            category: c.category.trim(),
            points: Number(c.points) || 100,
            flag: c.flag.trim(),
            imageUrl: c.imageUrl.trim(),
            hints: c.hints ? c.hints.split(",").map((h) => h.trim()).filter(Boolean) : [],
          }))
        : [];

      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          eventType,
          shortDescription: shortDescription.trim(),
          description: description.trim(),
          bannerImage: bannerImage.trim(),
          mode,
          location: location.trim(),
          meetingLink: meetingLink.trim(),
          startDate,
          endDate,
          registrationDeadline,
          isPaid,
          priceINR: isPaid ? Number(priceINR) : 0,
          tags: tags ? tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
          problemStatement: problemStatement.trim(),
          prizes: prizes.trim(),
          challenges: formattedChallenges,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create event");
      }

      router.push(`/events/${data.event.slug || data.event._id}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error publishing event";
      setErrorMsg(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full min-h-screen bg-background text-foreground p-4 sm:p-6 lg:p-10 space-y-8">
      {/* ── HEADER ── */}
      <div className="max-w-5xl mx-auto space-y-4">
        <Link href="/events">
          <Button variant="ghost" size="sm" className="gap-2 text-xs font-bold hover:bg-card">
            <ArrowLeft className="size-4" /> Back to Events Hub
          </Button>
        </Link>

        <div className="relative rounded-3xl bg-gradient-to-r from-amber-500/10 via-violet-500/10 to-cyan-500/10 border border-border p-6 sm:p-8 shadow-xl overflow-hidden">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 text-xs font-mono font-bold uppercase">
              <Trophy className="size-3.5" />
              Event &amp; Hackathon Creator
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight" style={{ fontFamily: "var(--font-space-grotesk)" }}>
              Host an Event or Challenge Hackathon
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Create seminars, webinars, or hackathons with flags, challenges, relative images, and real-time leaderboards.
            </p>
          </div>
        </div>
      </div>

      {/* ── FORM CONTENT ── */}
      <form onSubmit={handleSubmit} className="max-w-5xl mx-auto space-y-8">
        {errorMsg && (
          <div className="p-4 rounded-2xl bg-destructive/15 border border-destructive/30 text-destructive text-xs font-medium">
            {errorMsg}
          </div>
        )}

        {/* SECTION 1: BASIC DETAILS */}
        <div className="bg-card border border-border rounded-3xl p-6 sm:p-8 space-y-6 shadow-lg">
          <h2 className="text-xl font-bold tracking-tight border-b border-border pb-3 flex items-center gap-2" style={{ fontFamily: "var(--font-space-grotesk)" }}>
            <Sparkles className="size-5 text-amber-400" /> 1. Event Information
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-bold text-foreground">Event Title *</label>
              <input
                type="text"
                required
                placeholder="e.g. Notexia AI Code Hackathon 2026"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-3 bg-background border border-border rounded-2xl text-xs focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">Event Format / Type</label>
              <select
                value={eventType}
                onChange={(e) => setEventType(e.target.value as "hackathon" | "seminar" | "workshop" | "webinar" | "other")}
                className="w-full px-4 py-3 bg-background border border-border rounded-2xl text-xs focus:outline-none focus:border-amber-500 cursor-pointer"
              >
                <option value="hackathon">🏆 Hackathon (With Flag Challenges)</option>
                <option value="seminar">🎤 Seminar / Webinar</option>
                <option value="workshop">💻 Technical Workshop</option>
                <option value="other">🎉 Community Meetup</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">Mode</label>
              <select
                value={mode}
                onChange={(e) => setMode(e.target.value as "online" | "offline" | "hybrid")}
                className="w-full px-4 py-3 bg-background border border-border rounded-2xl text-xs focus:outline-none focus:border-amber-500 cursor-pointer"
              >
                <option value="online">🌐 Online</option>
                <option value="offline">🏢 Offline Venue</option>
                <option value="hybrid">🔀 Hybrid</option>
              </select>
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-bold text-foreground">Short Tagline</label>
              <input
                type="text"
                placeholder="A one-line description of your event (max 140 chars)"
                value={shortDescription}
                onChange={(e) => setShortDescription(e.target.value)}
                className="w-full px-4 py-3 bg-background border border-border rounded-2xl text-xs focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-bold text-foreground">Full Description &amp; Agenda *</label>
              <textarea
                required
                rows={4}
                placeholder="Full event details, schedule, prerequisites, and rules..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-3 bg-background border border-border rounded-2xl text-xs focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-bold text-foreground">Banner Header Image URL</label>
              <input
                type="url"
                placeholder="https://images.unsplash.com/photo-..."
                value={bannerImage}
                onChange={(e) => setBannerImage(e.target.value)}
                className="w-full px-4 py-3 bg-background border border-border rounded-2xl text-xs focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">Online Meeting Link</label>
              <input
                type="url"
                placeholder="https://zoom.us/j/... or Google Meet"
                value={meetingLink}
                onChange={(e) => setMeetingLink(e.target.value)}
                className="w-full px-4 py-3 bg-background border border-border rounded-2xl text-xs focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">Physical Location / Address</label>
              <input
                type="text"
                placeholder="Building / City / Address"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-4 py-3 bg-background border border-border rounded-2xl text-xs focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>
        </div>

        {/* SECTION 2: SCHEDULE & PRICING */}
        <div className="bg-card border border-border rounded-3xl p-6 sm:p-8 space-y-6 shadow-lg">
          <h2 className="text-xl font-bold tracking-tight border-b border-border pb-3 flex items-center gap-2" style={{ fontFamily: "var(--font-space-grotesk)" }}>
            <Calendar className="size-5 text-cyan-400" /> 2. Schedule &amp; Ticket Pricing
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">Start Date &amp; Time *</label>
              <input
                type="datetime-local"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-4 py-3 bg-background border border-border rounded-2xl text-xs focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">End Date &amp; Time *</label>
              <input
                type="datetime-local"
                required
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-4 py-3 bg-background border border-border rounded-2xl text-xs focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">Registration Deadline *</label>
              <input
                type="datetime-local"
                required
                value={registrationDeadline}
                onChange={(e) => setRegistrationDeadline(e.target.value)}
                className="w-full px-4 py-3 bg-background border border-border rounded-2xl text-xs focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div className="p-4 bg-muted/40 rounded-2xl border border-border space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-foreground">Entry Ticket Pricing</span>
                <p className="text-[11px] text-muted-foreground">Set entry fee in Coins/INR or offer free registration.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={isPaid}
                  onChange={(e) => setIsPaid(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-muted-foreground/30 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500" />
              </label>
            </div>

            {isPaid && (
              <div className="pt-2 flex items-center gap-3">
                <span className="text-xs font-bold text-amber-400">Fee Amount (₹ / Coins):</span>
                <input
                  type="number"
                  min={1}
                  value={priceINR}
                  onChange={(e) => setPriceINR(Number(e.target.value))}
                  className="w-32 px-3 py-1.5 bg-background border border-border rounded-xl text-xs font-mono font-bold focus:outline-none focus:border-amber-500"
                />
              </div>
            )}
          </div>
        </div>

        {/* SECTION 3: HACKATHON CHALLENGES & FLAGS BUILDER */}
        {eventType === "hackathon" && (
          <div className="bg-card border border-amber-500/30 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl relative overflow-hidden">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h2 className="text-xl font-bold tracking-tight flex items-center gap-2 text-amber-400" style={{ fontFamily: "var(--font-space-grotesk)" }}>
                  <Flag className="size-5" /> 3. Hackathon Challenges &amp; Secret Flags
                </h2>
                <p className="text-xs text-muted-foreground">
                  Add challenges with flags and relative images. Participants submit flags to earn points on the live leaderboard.
                </p>
              </div>

              <Button
                type="button"
                onClick={addChallenge}
                className="bg-amber-500 hover:bg-amber-600 text-black font-bold text-xs h-9 px-4 rounded-xl flex items-center gap-1.5 shrink-0"
              >
                <Plus className="size-4" /> Add Challenge
              </Button>
            </div>

            {/* Challenges List */}
            <div className="space-y-6">
              {challenges.map((ch, index) => (
                <div key={ch.id} className="p-5 rounded-2xl bg-background border border-border/80 space-y-4 shadow-md relative">
                  <div className="flex items-center justify-between">
                    <span className="px-3 py-1 rounded-full bg-amber-500/15 text-amber-400 font-mono text-xs font-bold">
                      Challenge #{index + 1}
                    </span>

                    {challenges.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeChallenge(ch.id)}
                        className="text-destructive hover:bg-destructive/10 h-8 px-2 rounded-lg"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-foreground">Challenge Title *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Web Security: Decode Neural Payload"
                        value={ch.title}
                        onChange={(e) => updateChallenge(ch.id, "title", e.target.value)}
                        className="w-full px-3.5 py-2 bg-card border border-border rounded-xl text-xs focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-foreground">Category</label>
                        <input
                          type="text"
                          placeholder="e.g. Web, AI, Cryptography"
                          value={ch.category}
                          onChange={(e) => updateChallenge(ch.id, "category", e.target.value)}
                          className="w-full px-3.5 py-2 bg-card border border-border rounded-xl text-xs focus:outline-none focus:border-amber-500"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-foreground">Points</label>
                        <input
                          type="number"
                          min={10}
                          value={ch.points}
                          onChange={(e) => updateChallenge(ch.id, "points", Number(e.target.value))}
                          className="w-full px-3.5 py-2 bg-card border border-border rounded-xl text-xs font-mono font-bold focus:outline-none focus:border-amber-500"
                        />
                      </div>
                    </div>

                    {/* Flag input */}
                    <div className="space-y-1 sm:col-span-2">
                      <label className="text-[11px] font-bold text-amber-400 flex items-center gap-1.5">
                        <Flag className="size-3.5" /> Secret Flag String (Hidden from Participants) *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="NOTEXIA{secret_flag_string_here}"
                        value={ch.flag}
                        onChange={(e) => updateChallenge(ch.id, "flag", e.target.value)}
                        className="w-full px-3.5 py-2 bg-card border border-amber-500/40 rounded-xl text-xs font-mono font-bold text-amber-400 focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    {/* Relative Image URL */}
                    <div className="space-y-1 sm:col-span-2">
                      <label className="text-[11px] font-bold text-foreground flex items-center gap-1.5">
                        <ImageIcon className="size-3.5 text-cyan-400" /> Challenge Relative / Diagram Image URL
                      </label>
                      <input
                        type="url"
                        placeholder="https://images.unsplash.com/photo-... or diagram URL"
                        value={ch.imageUrl}
                        onChange={(e) => updateChallenge(ch.id, "imageUrl", e.target.value)}
                        className="w-full px-3.5 py-2 bg-card border border-border rounded-xl text-xs focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    <div className="space-y-1 sm:col-span-2">
                      <label className="text-[11px] font-bold text-foreground">Challenge Description &amp; Instructions</label>
                      <textarea
                        rows={2}
                        placeholder="Instructions for participants on how to solve this challenge..."
                        value={ch.description}
                        onChange={(e) => updateChallenge(ch.id, "description", e.target.value)}
                        className="w-full px-3.5 py-2 bg-card border border-border rounded-xl text-xs focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    <div className="space-y-1 sm:col-span-2">
                      <label className="text-[11px] font-bold text-foreground">Hints (comma separated)</label>
                      <input
                        type="text"
                        placeholder="Inspect DOM, Check headers"
                        value={ch.hints}
                        onChange={(e) => updateChallenge(ch.id, "hints", e.target.value)}
                        className="w-full px-3.5 py-2 bg-card border border-border rounded-xl text-xs focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ACTIONS */}
        <div className="flex items-center justify-end gap-4 pt-4 border-t border-border">
          <Link href="/events">
            <Button type="button" variant="outline" className="text-xs font-bold">
              Cancel
            </Button>
          </Link>
          <Button
            type="submit"
            disabled={submitting}
            className="bg-amber-500 hover:bg-amber-600 text-black font-bold text-xs h-11 px-8 rounded-2xl shadow-lg shadow-amber-500/20 flex items-center gap-2"
          >
            {submitting ? <Loader2 className="size-4 animate-spin" /> : "Publish Event"}
          </Button>
        </div>
      </form>
    </div>
  );
}
