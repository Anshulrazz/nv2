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
  Flag,
  ArrowLeft,
  Loader2,
  Award,
  Coins,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface ChallengeInput {
  id: string;
  title: string;
  category: string;
  difficulty: "easy" | "medium" | "hard";
  points: number;
  flag: string;
  timeLimitMinutes: number;
  hints: Array<{ text: string; pointsPenalty: number }>;
  attachmentUrls: string;
}

export default function CreateEventPage() {
  const router = useRouter();

  // 1. Basics
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [category, setCategory] = useState("Web Security & AI");
  const [bannerUrl, setBannerUrl] = useState("");
  const [description, setDescription] = useState("");

  // 2. Schedule
  const [registrationStart, setRegistrationStart] = useState("");
  const [registrationEnd, setRegistrationEnd] = useState("");
  const [eventStart, setEventStart] = useState("");
  const [eventEnd, setEventEnd] = useState("");

  // 3. Capacity & Pricing
  const [maxParticipants, setMaxParticipants] = useState<number | "">("");
  const [isPaid, setIsPaid] = useState(false);
  const [entryFeeINR, setEntryFeeINR] = useState(199);

  // 4. Repeatable Challenge Builder
  const [challenges, setChallenges] = useState<ChallengeInput[]>([
    {
      id: "1",
      title: "Neural Vault Cipher #1",
      category: "Web",
      difficulty: "medium",
      points: 100,
      flag: "notexia{ai_cipher_key_2026}",
      timeLimitMinutes: 30,
      hints: [{ text: "Inspect the HTTP authorization payload header.", pointsPenalty: 25 }],
      attachmentUrls: "",
    },
  ]);

  // 5. Certificates
  const [certEnabled, setCertEnabled] = useState(true);
  const [certTopN, setCertTopN] = useState(3);

  // 6. Rules
  const [rules, setRules] = useState("1. Flag format is notexia{...}.\n2. No denial of service or attacking infrastructure.\n3. Keep submissions fair.");

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!slug || slug === title.toLowerCase().replace(/[^a-z0-9]+/g, "-")) {
      setSlug(val.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-"));
    }
  };

  const addChallenge = () => {
    setChallenges((prev) => [
      ...prev,
      {
        id: String(Date.now()),
        title: `Challenge #${prev.length + 1}`,
        category: "Misc",
        difficulty: "easy",
        points: 100,
        flag: "notexia{flag_here}",
        timeLimitMinutes: 30,
        hints: [],
        attachmentUrls: "",
      },
    ]);
  };

  const removeChallenge = (id: string) => {
    setChallenges((prev) => prev.filter((c) => c.id !== id));
  };

  const updateChallenge = (id: string, field: keyof ChallengeInput, value: unknown) => {
    setChallenges((prev) =>
      prev.map((c) => (c.id === id ? { ...c, [field]: value } : c))
    );
  };

  const handleSubmitDraft = async (publishImmediately: boolean = false) => {
    setErrorMsg(null);

    if (!title.trim() || !registrationStart || !registrationEnd || !eventStart || !eventEnd) {
      setErrorMsg("Please fill in all mandatory fields (Title, Schedule dates).");
      return;
    }

    if (new Date(registrationEnd) > new Date(eventStart)) {
      setErrorMsg("Registration End date must be before or equal to Event Start date.");
      return;
    }
    if (new Date(eventStart) >= new Date(eventEnd)) {
      setErrorMsg("Event Start date must be before Event End date.");
      return;
    }

    if (publishImmediately && challenges.length < 1) {
      setErrorMsg("Cannot publish event: Event must contain at least 1 challenge.");
      return;
    }

    setSubmitting(true);

    try {
      // 1. Create Draft Event
      const eventRes = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          bannerUrl: bannerUrl.trim(),
          category: category.trim(),
          registrationStart,
          registrationEnd,
          eventStart,
          eventEnd,
          maxParticipants: maxParticipants ? Number(maxParticipants) : null,
          isPaid,
          entryFeeINR: isPaid ? Number(entryFeeINR) : 0,
          rules: rules.trim(),
          certificate: {
            enabled: certEnabled,
            topN: Number(certTopN),
            templateId: "navy_gold",
          },
        }),
      });

      const eventData = await eventRes.json();
      if (!eventRes.ok) throw new Error(eventData.error || "Failed to create event");

      const createdEventId = eventData.event._id;

      // 2. Add Challenges (Hashes flags server-side with SHA-256)
      for (let i = 0; i < challenges.length; i++) {
        const ch = challenges[i];
        if (!ch.title.trim() || !ch.flag.trim()) continue;

        await fetch(`/api/events/${createdEventId}/challenges`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: ch.title.trim(),
            category: ch.category.trim(),
            difficulty: ch.difficulty,
            points: Number(ch.points) || 100,
            flag: ch.flag.trim(), // Server-side SHA-256 hashing applied
            timeLimitSeconds: Math.max(60, Number(ch.timeLimitMinutes) * 60),
            hints: ch.hints,
            attachmentUrls: ch.attachmentUrls
              ? ch.attachmentUrls.split(",").map((u) => u.trim()).filter(Boolean)
              : [],
            order: i + 1,
          }),
        });
      }

      // 3. Publish if requested
      if (publishImmediately) {
        const pubRes = await fetch(`/api/events/${createdEventId}/publish`, {
          method: "POST",
        });
        const pubData = await pubRes.json();
        if (!pubRes.ok) throw new Error(pubData.error || "Failed to publish event");

        alert("🎉 CTF Event Published Successfully!");
      } else {
        alert("Draft event created successfully!");
      }

      router.push("/events");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error creating event";
      setErrorMsg(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full min-h-screen bg-background text-foreground p-4 sm:p-6 lg:p-10 space-y-8">
      <Link href="/events">
        <Button variant="ghost" size="sm" className="gap-2 text-xs font-bold hover:bg-card">
          <ArrowLeft className="size-4" /> Back to Events Hub
        </Button>
      </Link>

      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 text-amber-400 font-mono text-xs font-bold">
            <Trophy className="size-4" /> Host &amp; Authoring Console
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight" style={{ fontFamily: "var(--font-space-grotesk)" }}>
            Create CTF / Hackathon Event
          </h1>
          <p className="text-xs text-muted-foreground">
            Author flag-based challenges, schedule windows, ticket pricing, and certificate criteria.
          </p>
        </div>

        {errorMsg && (
          <div className="p-4 rounded-2xl bg-destructive/15 border border-destructive/40 text-destructive text-xs font-medium">
            {errorMsg}
          </div>
        )}

        <form onSubmit={(e) => { e.preventDefault(); handleSubmitDraft(false); }} className="space-y-8">
          {/* SECTION 1: BASICS */}
          <div className="bg-card border border-border rounded-3xl p-6 sm:p-8 space-y-6 shadow-lg">
            <h2 className="text-xl font-bold tracking-tight border-b border-border pb-3 flex items-center gap-2" style={{ fontFamily: "var(--font-space-grotesk)" }}>
              <Sparkles className="size-5 text-amber-400" /> 1. Event Basics
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-bold text-foreground">Event Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Notexia Cyber Defense Hackathon 2026"
                  value={title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  className="w-full px-4 py-3 bg-background border border-border rounded-2xl text-xs focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">URL Slug *</label>
                <input
                  type="text"
                  required
                  placeholder="notexia-cyber-defense-2026"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  className="w-full px-4 py-3 bg-background border border-border rounded-2xl text-xs font-mono focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">Category</label>
                <input
                  type="text"
                  placeholder="Web, Crypto, AI, Mixed"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-4 py-3 bg-background border border-border rounded-2xl text-xs focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-bold text-foreground">Banner Header Image URL</label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/photo-..."
                  value={bannerUrl}
                  onChange={(e) => setBannerUrl(e.target.value)}
                  className="w-full px-4 py-3 bg-background border border-border rounded-2xl text-xs focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-bold text-foreground">Event Description (Markdown)</label>
                <textarea
                  rows={4}
                  placeholder="Full event overview, guidelines, and pre-requisites..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-3 bg-background border border-border rounded-2xl text-xs focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>
            </div>
          </div>

          {/* SECTION 2: SCHEDULE */}
          <div className="bg-card border border-border rounded-3xl p-6 sm:p-8 space-y-6 shadow-lg">
            <h2 className="text-xl font-bold tracking-tight border-b border-border pb-3 flex items-center gap-2" style={{ fontFamily: "var(--font-space-grotesk)" }}>
              <Calendar className="size-5 text-cyan-400" /> 2. Schedule Windows
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">Registration Start *</label>
                <input
                  type="datetime-local"
                  required
                  value={registrationStart}
                  onChange={(e) => setRegistrationStart(e.target.value)}
                  className="w-full px-4 py-3 bg-background border border-border rounded-2xl text-xs focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">Registration End *</label>
                <input
                  type="datetime-local"
                  required
                  value={registrationEnd}
                  onChange={(e) => setRegistrationEnd(e.target.value)}
                  className="w-full px-4 py-3 bg-background border border-border rounded-2xl text-xs focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">Event Start (CTF Live) *</label>
                <input
                  type="datetime-local"
                  required
                  value={eventStart}
                  onChange={(e) => setEventStart(e.target.value)}
                  className="w-full px-4 py-3 bg-background border border-border rounded-2xl text-xs focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">Event End *</label>
                <input
                  type="datetime-local"
                  required
                  value={eventEnd}
                  onChange={(e) => setEventEnd(e.target.value)}
                  className="w-full px-4 py-3 bg-background border border-border rounded-2xl text-xs focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>
          </div>

          {/* SECTION 3: CAPACITY & PRICING */}
          <div className="bg-card border border-border rounded-3xl p-6 sm:p-8 space-y-6 shadow-lg">
            <h2 className="text-xl font-bold tracking-tight border-b border-border pb-3 flex items-center gap-2" style={{ fontFamily: "var(--font-space-grotesk)" }}>
              <Coins className="size-5 text-emerald-400" /> 3. Capacity &amp; Ticket Pricing
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">Max Competitors (Blank = Unlimited)</label>
                <input
                  type="number"
                  min={1}
                  placeholder="Unlimited"
                  value={maxParticipants}
                  onChange={(e) => setMaxParticipants(e.target.value ? Number(e.target.value) : "")}
                  className="w-full px-4 py-3 bg-background border border-border rounded-2xl text-xs focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="p-4 bg-muted/40 rounded-2xl border border-border space-y-3 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-foreground">Paid Event Ticket</span>
                    <p className="text-[11px] text-muted-foreground">Charge entry fee via Razorpay in ₹ INR.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={isPaid}
                    onChange={(e) => setIsPaid(e.target.checked)}
                    className="size-5 accent-amber-500 rounded cursor-pointer"
                  />
                </div>

                {isPaid && (
                  <div className="flex items-center gap-2 pt-2">
                    <span className="text-xs font-bold text-amber-400">Entry Fee (₹ INR):</span>
                    <input
                      type="number"
                      min={1}
                      value={entryFeeINR}
                      onChange={(e) => setEntryFeeINR(Number(e.target.value))}
                      className="w-32 px-3 py-1.5 bg-background border border-border rounded-xl text-xs font-mono font-bold"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* SECTION 4: CHALLENGES BUILDER */}
          <div className="bg-card border border-border rounded-3xl p-6 sm:p-8 space-y-6 shadow-lg">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h2 className="text-xl font-bold tracking-tight flex items-center gap-2" style={{ fontFamily: "var(--font-space-grotesk)" }}>
                <Flag className="size-5 text-amber-400" /> 4. Repeatable CTF Challenge Builder
              </h2>

              <Button type="button" onClick={addChallenge} size="sm" className="bg-amber-500 hover:bg-amber-600 text-black font-bold text-xs gap-1.5">
                <Plus className="size-4" /> Add Challenge
              </Button>
            </div>

            <div className="space-y-6">
              {challenges.map((ch, index) => (
                <div key={ch.id} className="p-5 rounded-2xl bg-background border border-border/80 space-y-4 relative">
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
                        className="text-destructive hover:bg-destructive/10 text-xs h-8 px-2"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1 sm:col-span-2">
                      <label className="text-xs font-bold text-foreground">Challenge Title *</label>
                      <input
                        type="text"
                        required
                        placeholder="Title..."
                        value={ch.title}
                        onChange={(e) => updateChallenge(ch.id, "title", e.target.value)}
                        className="w-full px-3 py-2 bg-card border border-border rounded-xl text-xs"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-foreground">Category</label>
                      <input
                        type="text"
                        placeholder="Web / Crypto / Forensics"
                        value={ch.category}
                        onChange={(e) => updateChallenge(ch.id, "category", e.target.value)}
                        className="w-full px-3 py-2 bg-card border border-border rounded-xl text-xs"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-foreground">Difficulty</label>
                      <select
                        value={ch.difficulty}
                        onChange={(e) => updateChallenge(ch.id, "difficulty", e.target.value)}
                        className="w-full px-3 py-2 bg-card border border-border rounded-xl text-xs"
                      >
                        <option value="easy">Easy</option>
                        <option value="medium">Medium</option>
                        <option value="hard">Hard</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-foreground">Points Awarded</label>
                      <input
                        type="number"
                        min={10}
                        value={ch.points}
                        onChange={(e) => updateChallenge(ch.id, "points", Number(e.target.value))}
                        className="w-full px-3 py-2 bg-card border border-border rounded-xl text-xs font-mono font-bold"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-foreground">Time Limit (Mins)</label>
                      <input
                        type="number"
                        min={1}
                        value={ch.timeLimitMinutes}
                        onChange={(e) => updateChallenge(ch.id, "timeLimitMinutes", Number(e.target.value))}
                        className="w-full px-3 py-2 bg-card border border-border rounded-xl text-xs font-mono"
                      />
                    </div>

                    <div className="space-y-1 sm:col-span-3">
                      <label className="text-xs font-bold text-amber-400 font-mono">
                        Secret Flag String (Hashed with SHA-256 Server-Side) *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="notexia{secret_flag_string}"
                        value={ch.flag}
                        onChange={(e) => updateChallenge(ch.id, "flag", e.target.value)}
                        className="w-full px-3 py-2 bg-card border border-amber-500/50 rounded-xl text-xs font-mono text-amber-400"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* SECTION 5 & 6: CERTIFICATES & RULES */}
          <div className="bg-card border border-border rounded-3xl p-6 sm:p-8 space-y-6 shadow-lg">
            <h2 className="text-xl font-bold tracking-tight border-b border-border pb-3 flex items-center gap-2" style={{ fontFamily: "var(--font-space-grotesk)" }}>
              <Award className="size-5 text-amber-400" /> 5. Certificates &amp; Event Rules
            </h2>

            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <input
                  type="checkbox"
                  id="cert-toggle"
                  checked={certEnabled}
                  onChange={(e) => setCertEnabled(e.target.checked)}
                  className="size-5 accent-amber-500 rounded cursor-pointer"
                />
                <label htmlFor="cert-toggle" className="text-xs font-bold text-foreground cursor-pointer select-none">
                  Award Certificates to Top Performers
                </label>

                {certEnabled && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-muted-foreground">Top Ranks Count:</span>
                    <input
                      type="number"
                      min={1}
                      max={10}
                      value={certTopN}
                      onChange={(e) => setCertTopN(Number(e.target.value))}
                      className="w-20 px-2.5 py-1 bg-background border border-border rounded-lg text-xs font-mono font-bold"
                    />
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">Event Rules (Markdown)</label>
                <textarea
                  rows={3}
                  value={rules}
                  onChange={(e) => setRules(e.target.value)}
                  className="w-full px-4 py-3 bg-background border border-border rounded-2xl text-xs font-mono"
                />
              </div>
            </div>
          </div>

          {/* ACTIONS */}
          <div className="flex flex-col sm:flex-row items-center justify-end gap-4">
            <Button
              type="submit"
              disabled={submitting}
              variant="outline"
              className="w-full sm:w-auto font-bold text-xs h-11 px-6 rounded-2xl"
            >
              Save as Draft
            </Button>

            <Button
              type="button"
              disabled={submitting}
              onClick={() => handleSubmitDraft(true)}
              className="w-full sm:w-auto bg-amber-500 hover:bg-amber-600 text-black font-bold text-xs h-11 px-8 rounded-2xl shadow-lg shadow-amber-500/20"
            >
              {submitting ? <Loader2 className="size-4 animate-spin" /> : "Publish CTF Event 🎉"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
