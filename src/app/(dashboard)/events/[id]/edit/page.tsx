"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  Calendar,
  Sparkles,
  Plus,
  Trash2,
  Flag,
  ArrowLeft,
  Loader2,
  Edit,
  Save,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface ChallengeItem {
  _id: string;
  title: string;
  category: string;
  difficulty: "easy" | "medium" | "hard";
  points: number;
  timeLimitSeconds: number;
  hints?: Array<{ text: string; pointsPenalty: number }>;
  attachmentUrls?: string[];
  order: number;
  flag?: string; // Plaintext flag for editing, hashed server-side
}

export default function EditEventPage() {
  const params = useParams();
  const router = useRouter();
  const eventIdentifier = (params.id || params.slug) as string;

  const [eventId, setEventId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // 1. Basics
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [category, setCategory] = useState("Web Security");
  const [bannerUrl, setBannerUrl] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<"draft" | "published" | "live" | "ended">("draft");

  // 2. Schedule
  const [registrationStart, setRegistrationStart] = useState("");
  const [registrationEnd, setRegistrationEnd] = useState("");
  const [eventStart, setEventStart] = useState("");
  const [eventEnd, setEventEnd] = useState("");

  // 3. Capacity & Pricing
  const [maxParticipants, setMaxParticipants] = useState<number | "">("");
  const [isPaid, setIsPaid] = useState(false);
  const [entryFeeINR, setEntryFeeINR] = useState(0);

  // 4. Challenges CRUD
  const [challenges, setChallenges] = useState<ChallengeItem[]>([]);
  const [editingChallengeId, setEditingChallengeId] = useState<string | null>(null);

  // 5. Certificates & Rules
  const [certEnabled, setCertEnabled] = useState(true);
  const [certTopN, setCertTopN] = useState(3);
  const [rules, setRules] = useState("");

  const fetchEventDetails = useCallback(async () => {
    try {
      const res = await fetch(`/api/events/${eventIdentifier}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Event not found");

      const ev = data.event;
      setEventId(ev._id);
      setTitle(ev.title);
      setSlug(ev.slug);
      setCategory(ev.category);
      setBannerUrl(ev.bannerUrl || "");
      setDescription(ev.description || "");
      setStatus(ev.status);

      setRegistrationStart(ev.registrationStart ? new Date(ev.registrationStart).toISOString().slice(0, 16) : "");
      setRegistrationEnd(ev.registrationEnd ? new Date(ev.registrationEnd).toISOString().slice(0, 16) : "");
      setEventStart(ev.eventStart ? new Date(ev.eventStart).toISOString().slice(0, 16) : "");
      setEventEnd(ev.eventEnd ? new Date(ev.eventEnd).toISOString().slice(0, 16) : "");

      setMaxParticipants(ev.maxParticipants || "");
      setIsPaid(Boolean(ev.isPaid));
      setEntryFeeINR(ev.entryFeeINR || 0);

      setCertEnabled(ev.certificate?.enabled ?? true);
      setCertTopN(ev.certificate?.topN || 3);
      setRules(ev.rules || "");

      // Fetch Challenges
      const chRes = await fetch(`/api/events/${ev._id}/challenges`);
      const chData = await chRes.json();
      if (chRes.ok) {
        setChallenges(chData.challenges || []);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error loading event";
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  }, [eventIdentifier]);

  useEffect(() => {
    if (eventIdentifier) fetchEventDetails();
  }, [eventIdentifier, fetchEventDetails]);

  // Save Event Details (PATCH)
  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventId || saving) return;

    setSaving(true);
    setErrorMsg(null);

    try {
      const res = await fetch(`/api/events/${eventId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          bannerUrl: bannerUrl.trim(),
          category: category.trim(),
          status,
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

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update event");

      alert("🎉 Event details updated successfully!");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error updating event";
      setErrorMsg(msg);
    } finally {
      setSaving(false);
    }
  };

  // Add New Challenge (POST)
  const handleAddChallenge = async () => {
    if (!eventId) return;

    const newTitle = prompt("Enter Challenge Title:");
    if (!newTitle) return;

    const rawFlag = prompt("Enter Secret Flag String (e.g. notexia{...}):");
    if (!rawFlag) return;

    try {
      const res = await fetch(`/api/events/${eventId}/challenges`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle.trim(),
          category: "Web Security",
          difficulty: "medium",
          points: 100,
          flag: rawFlag.trim(), // Server-side SHA-256 hashing applied
          timeLimitSeconds: 1800,
          order: challenges.length + 1,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add challenge");

      alert("Challenge added successfully!");
      fetchEventDetails();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error adding challenge";
      alert(msg);
    }
  };

  // Delete Challenge (DELETE)
  const handleDeleteChallenge = async (challengeId: string) => {
    if (!eventId) return;
    if (!confirm("Are you sure you want to delete this challenge?")) return;

    try {
      const res = await fetch(`/api/events/${eventId}/challenges/${challengeId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete challenge");

      alert("Challenge deleted!");
      fetchEventDetails();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error deleting challenge";
      alert(msg);
    }
  };

  // Delete Entire Event (DELETE)
  const handleDeleteEvent = async () => {
    if (!eventId) return;
    if (!confirm("⚠️ WARNING: Are you sure you want to delete this entire event? All challenges, registrations, attempts, runs, and certificates will be permanently deleted!")) {
      return;
    }

    setDeleting(true);
    try {
      const res = await fetch(`/api/events/${eventId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete event");

      alert("🗑️ Event and all associated records deleted.");
      router.push("/events");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error deleting event";
      alert(msg);
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-8 space-y-4 font-mono">
        <Loader2 className="size-8 text-amber-500 animate-spin" />
        <p className="text-xs text-muted-foreground">Loading Event Editing Console...</p>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-background text-foreground p-4 sm:p-6 lg:p-10 space-y-8">
      <Link href="/events">
        <Button variant="ghost" size="sm" className="gap-2 text-xs font-bold hover:bg-card">
          <ArrowLeft className="size-4" /> Back to Events Hub
        </Button>
      </Link>

      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 text-amber-400 font-mono text-xs font-bold">
              <Edit className="size-4" /> Host Editing &amp; CRUD Console
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight" style={{ fontFamily: "var(--font-space-grotesk)" }}>
              Edit Event: {title}
            </h1>
          </div>

          <Button
            onClick={handleDeleteEvent}
            disabled={deleting}
            variant="destructive"
            size="sm"
            className="font-bold text-xs h-10 px-4 rounded-xl flex items-center gap-2"
          >
            {deleting ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
            Delete Event
          </Button>
        </div>

        {errorMsg && (
          <div className="p-4 rounded-2xl bg-destructive/15 border border-destructive/40 text-destructive text-xs font-medium font-mono">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSaveEvent} className="space-y-8">
          {/* SECTION 1: BASICS & STATUS */}
          <div className="bg-card border border-border rounded-3xl p-6 sm:p-8 space-y-6 shadow-lg">
            <h2 className="text-xl font-bold tracking-tight border-b border-border pb-3 flex items-center gap-2" style={{ fontFamily: "var(--font-space-grotesk)" }}>
              <Sparkles className="size-5 text-amber-400" /> 1. Event Basics &amp; Status
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-bold text-foreground">Event Title *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-3 bg-background border border-border rounded-2xl text-xs focus:outline-none focus:border-amber-500 font-medium"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">URL Slug *</label>
                <input
                  type="text"
                  required
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  className="w-full px-4 py-3 bg-background border border-border rounded-2xl text-xs font-mono focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">Status State</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as "draft" | "published" | "live" | "ended")}
                  className="w-full px-4 py-3 bg-background border border-border rounded-2xl text-xs font-bold focus:outline-none focus:border-amber-500"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="live">Live CTF ⚡</option>
                  <option value="ended">Ended 🏁</option>
                </select>
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-bold text-foreground">Category</label>
                <input
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-4 py-3 bg-background border border-border rounded-2xl text-xs focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-bold text-foreground">Description (Markdown)</label>
                <textarea
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-3 bg-background border border-border rounded-2xl text-xs font-mono focus:outline-none focus:border-amber-500"
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
                <label className="text-xs font-bold text-foreground">Registration Start</label>
                <input
                  type="datetime-local"
                  value={registrationStart}
                  onChange={(e) => setRegistrationStart(e.target.value)}
                  className="w-full px-4 py-3 bg-background border border-border rounded-2xl text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">Registration End</label>
                <input
                  type="datetime-local"
                  value={registrationEnd}
                  onChange={(e) => setRegistrationEnd(e.target.value)}
                  className="w-full px-4 py-3 bg-background border border-border rounded-2xl text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">Event Start (CTF Live)</label>
                <input
                  type="datetime-local"
                  value={eventStart}
                  onChange={(e) => setEventStart(e.target.value)}
                  className="w-full px-4 py-3 bg-background border border-border rounded-2xl text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">Event End</label>
                <input
                  type="datetime-local"
                  value={eventEnd}
                  onChange={(e) => setEventEnd(e.target.value)}
                  className="w-full px-4 py-3 bg-background border border-border rounded-2xl text-xs"
                />
              </div>
            </div>
          </div>

          {/* SECTION 3: CHALLENGE CRUD LIST */}
          <div className="bg-card border border-border rounded-3xl p-6 sm:p-8 space-y-6 shadow-lg">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h2 className="text-xl font-bold tracking-tight flex items-center gap-2" style={{ fontFamily: "var(--font-space-grotesk)" }}>
                <Flag className="size-5 text-amber-400" /> 3. Challenges Roster ({challenges.length})
              </h2>

              <Button type="button" onClick={handleAddChallenge} size="sm" className="bg-amber-500 hover:bg-amber-600 text-black font-bold text-xs gap-1.5">
                <Plus className="size-4" /> Add Challenge
              </Button>
            </div>

            <div className="space-y-4">
              {challenges.length === 0 ? (
                <div className="p-6 text-center text-xs text-muted-foreground font-mono">
                  No challenges added yet. Click "Add Challenge" to create one.
                </div>
              ) : (
                challenges.map((ch, idx) => (
                  <div key={ch._id} className="p-4 rounded-2xl bg-background border border-border flex items-center justify-between gap-4 font-mono">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded bg-amber-500/15 text-amber-400 font-bold text-[11px]">
                          #{idx + 1}
                        </span>
                        <span className="font-bold text-sm text-foreground">{ch.title}</span>
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        {ch.category} • {ch.difficulty} • +{ch.points} PTS • {Math.round(ch.timeLimitSeconds / 60)} mins
                      </div>
                    </div>

                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteChallenge(ch._id)}
                      className="text-destructive hover:bg-destructive/10 text-xs h-8 px-2.5"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* SAVE ACTIONS */}
          <div className="flex items-center justify-end gap-4">
            <Button
              type="submit"
              disabled={saving}
              className="bg-amber-500 hover:bg-amber-600 text-black font-extrabold text-xs h-11 px-8 rounded-2xl shadow-lg shadow-amber-500/20 flex items-center gap-2"
            >
              {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
              Save Changes
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
