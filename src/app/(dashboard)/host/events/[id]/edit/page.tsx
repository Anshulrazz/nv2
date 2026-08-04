"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Loader2,
  Check,
  AlertCircle,
  Calendar,
  FileText,
  ChevronLeft,
  Eye,
  Users,
  Monitor,
  Award,
} from "lucide-react";
import Link from "next/link";

type EventType = "hackathon" | "ctf" | "workshop";
type ReleaseMode = "sequential" | "scheduled" | "all_at_once";

interface EventData {
  _id: string;
  name: string;
  slug: string;
  description: string;
  type: EventType;
  isPaid: boolean;
  price: number;
  currency: string;
  registrationStart: string;
  registrationEnd: string;
  eventStart: string;
  eventEnd: string;
  rulesMarkdown: string;
  bannerUrl: string;
  status: string;
  challengeReleaseMode: ReleaseMode;
  capacity: number | null;
  codeOfConductUrl: string;
  teamMode: boolean;
  maxTeamSize: number;
  scoreFreezeAt: string | null;
}

function toDatetimeLocal(iso?: string | null): string {
  if (!iso) return "";
  // Convert UTC to IST (UTC+5:30) for datetime-local input display
  const utcMs = new Date(iso).getTime();
  const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000; // +05:30
  const istMs = utcMs + IST_OFFSET_MS;
  return new Date(istMs).toISOString().slice(0, 16);
}

function fromDatetimeLocalIST(dtLocal?: string | null): string | null {
  if (!dtLocal) return null;
  const istDate = new Date(`${dtLocal}:00+05:30`);
  return isNaN(istDate.getTime()) ? null : istDate.toISOString();
}

export default function EditEventPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [event, setEvent] = useState<EventData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState<Partial<EventData>>({});

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/events/${id}`);
        if (!res.ok) throw new Error("Event not found.");
        const data = await res.json();
        setEvent(data.event);
        setForm({
          ...data.event,
          registrationStart: toDatetimeLocal(data.event.registrationStart),
          registrationEnd: toDatetimeLocal(data.event.registrationEnd),
          eventStart: toDatetimeLocal(data.event.eventStart),
          eventEnd: toDatetimeLocal(data.event.eventEnd),
          scoreFreezeAt: toDatetimeLocal(data.event.scoreFreezeAt),
        });
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load event.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSaving(true);

    try {
      const res = await fetch(`/api/events/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
          ...form,
          // datetime-local values are in IST; convert back to UTC before saving
          registrationStart: form.registrationStart ? fromDatetimeLocalIST(form.registrationStart) : undefined,
          registrationEnd: form.registrationEnd ? fromDatetimeLocalIST(form.registrationEnd) : undefined,
          eventStart: form.eventStart ? fromDatetimeLocalIST(form.eventStart) : undefined,
          eventEnd: form.eventEnd ? fromDatetimeLocalIST(form.eventEnd) : undefined,
          scoreFreezeAt: form.scoreFreezeAt ? fromDatetimeLocalIST(form.scoreFreezeAt) : null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to save.");
        return;
      }

      setEvent(data.event);
      setSuccess("Event saved successfully.");
    } catch {
      setError("Failed to save event.");
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    setError("");
    setPublishing(true);

    try {
      const res = await fetch(`/api/events/${id}/publish`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to publish.");
        return;
      }
      setEvent(data.event);
      setSuccess("Event published!");
    } catch {
      setError("Failed to publish.");
    } finally {
      setPublishing(false);
    }
  };

  const inputCls =
    "w-full bg-sidebar border border-sidebar-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/20 transition-all";
  const labelCls =
    "text-xs font-mono font-bold uppercase tracking-widest text-muted-foreground mb-1.5 block";

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="size-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <AlertCircle className="size-8 text-destructive" />
        <p className="text-sm text-muted-foreground">{error || "Event not found."}</p>
        <button
          onClick={() => router.push("/host/events")}
          className="text-xs text-primary hover:underline"
        >
          Back to events
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/host/events"
          className="p-2 rounded-xl hover:bg-sidebar-accent transition-colors text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="size-4" />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-foreground truncate">{event.name}</h1>
          <p className="text-xs text-muted-foreground font-mono mt-0.5">
            Status:{" "}
            <span
              className={
                event.status === "published"
                  ? "text-emerald-400"
                  : event.status === "live"
                  ? "text-red-400"
                  : "text-zinc-400"
              }
            >
              {event.status}
            </span>
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Link
            href={`/events/${event.slug}`}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-sidebar-border text-xs text-muted-foreground hover:text-foreground hover:border-primary/40 transition-all"
          >
            <Eye className="size-3.5" />
            Preview
          </Link>
          <Link
            href={`/host/events/${id}/challenges`}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-sidebar-border text-xs text-muted-foreground hover:text-foreground hover:border-primary/40 transition-all"
          >
            <FileText className="size-3.5" />
            Challenges
          </Link>
          <Link
            href={`/host/events/${id}/monitor`}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-sidebar-border text-xs text-muted-foreground hover:text-foreground hover:border-primary/40 transition-all"
          >
            <Monitor className="size-3.5" />
            Monitor
          </Link>
          <Link
            href={`/host/events/${id}/certificates`}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-sidebar-border text-xs text-muted-foreground hover:text-foreground hover:border-primary/40 transition-all"
          >
            <Award className="size-3.5" />
            Certs
          </Link>
          {event.status === "draft" && (
            <button
              onClick={handlePublish}
              disabled={publishing}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-colors disabled:opacity-60"
            >
              {publishing ? <Loader2 className="size-3.5 animate-spin" /> : <Eye className="size-3.5" />}
              Publish
            </button>
          )}
        </div>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        <Link
          href={`/host/events/${id}/challenges`}
          className="flex items-center gap-3 bg-sidebar border border-sidebar-border rounded-xl p-4 hover:border-primary/40 transition-colors"
        >
          <FileText className="size-5 text-primary" />
          <div>
            <p className="text-xs font-bold text-foreground">Challenges</p>
            <p className="text-[10px] text-muted-foreground">Manage CTF challenges</p>
          </div>
        </Link>
        <Link
          href={`/host/events/${id}/monitor`}
          className="flex items-center gap-3 bg-sidebar border border-sidebar-border rounded-xl p-4 hover:border-primary/40 transition-colors"
        >
          <Users className="size-5 text-primary" />
          <div>
            <p className="text-xs font-bold text-foreground">Participants</p>
            <p className="text-[10px] text-muted-foreground">Monitor & DQ users</p>
          </div>
        </Link>
        <Link
          href={`/host/events/${id}/certificates`}
          className="flex items-center gap-3 bg-sidebar border border-sidebar-border rounded-xl p-4 hover:border-primary/40 transition-colors"
        >
          <Award className="size-5 text-primary" />
          <div>
            <p className="text-xs font-bold text-foreground">Certificates</p>
            <p className="text-[10px] text-muted-foreground">Generate & revoke</p>
          </div>
        </Link>
      </div>

      {/* Edit Form */}
      <form onSubmit={handleSave} className="space-y-6">
        <div>
          <label className={labelCls} htmlFor="edit-event-name">Event Name</label>
          <input
            id="edit-event-name"
            type="text"
            required
            value={form.name ?? ""}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            className={inputCls}
          />
        </div>

        <div>
          <label className={labelCls} htmlFor="edit-event-desc">Description</label>
          <textarea
            id="edit-event-desc"
            rows={3}
            value={form.description ?? ""}
            onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
            className={`${inputCls} resize-none`}
          />
        </div>

        {/* Dates */}
        <div className="space-y-1">
          <label className={labelCls}>
            <Calendar className="size-3.5 inline mr-1" />
            Registration Window
          </label>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-muted-foreground mb-1 block">Opens</label>
              <input
                type="datetime-local"
                value={form.registrationStart ?? ""}
                onChange={(e) => setForm((p) => ({ ...p, registrationStart: e.target.value }))}
                className={inputCls}
              />
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground mb-1 block">Closes</label>
              <input
                type="datetime-local"
                value={form.registrationEnd ?? ""}
                onChange={(e) => setForm((p) => ({ ...p, registrationEnd: e.target.value }))}
                className={inputCls}
              />
            </div>
          </div>
        </div>

        <div className="space-y-1">
          <label className={labelCls}>Event Window</label>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-muted-foreground mb-1 block">Starts</label>
              <input
                type="datetime-local"
                value={form.eventStart ?? ""}
                onChange={(e) => setForm((p) => ({ ...p, eventStart: e.target.value }))}
                className={inputCls}
              />
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground mb-1 block">Ends</label>
              <input
                type="datetime-local"
                value={form.eventEnd ?? ""}
                onChange={(e) => setForm((p) => ({ ...p, eventEnd: e.target.value }))}
                className={inputCls}
              />
            </div>
          </div>
        </div>

        {/* Score Freeze */}
        <div>
          <label className={labelCls} htmlFor="edit-score-freeze">Score Freeze At (optional)</label>
          <input
            id="edit-score-freeze"
            type="datetime-local"
            value={form.scoreFreezeAt ?? ""}
            onChange={(e) =>
              setForm((p) => ({ ...p, scoreFreezeAt: e.target.value || null }))
            }
            className={inputCls}
          />
          <p className="text-[10px] text-muted-foreground mt-1">
            Freeze leaderboard at this time (separate from results reveal).
          </p>
        </div>

        {/* Paid */}
        <div className="flex items-center justify-between bg-sidebar border border-sidebar-border rounded-xl p-4">
          <div>
            <p className="text-sm font-semibold text-foreground">Paid Event</p>
          </div>
          <button
            type="button"
            onClick={() => setForm((p) => ({ ...p, isPaid: !p.isPaid }))}
            className={`size-6 rounded border-2 flex items-center justify-center transition-all ${
              form.isPaid ? "bg-primary border-primary" : "border-sidebar-border"
            }`}
          >
            {form.isPaid && <Check className="size-3.5 text-primary-foreground" />}
          </button>
        </div>

        {form.isPaid && (
          <div>
            <label className={labelCls}>Price (INR)</label>
            <input
              type="number"
              min="1"
              value={form.price ?? 0}
              onChange={(e) => setForm((p) => ({ ...p, price: parseInt(e.target.value, 10) || 0 }))}
              className={inputCls}
            />
          </div>
        )}

        {/* Capacity */}
        <div>
          <label className={labelCls} htmlFor="edit-capacity">Capacity (blank = unlimited)</label>
          <input
            id="edit-capacity"
            type="number"
            min="1"
            value={form.capacity ?? ""}
            onChange={(e) =>
              setForm((p) => ({ ...p, capacity: e.target.value ? parseInt(e.target.value, 10) : null }))
            }
            className={inputCls}
          />
        </div>

        {/* Rules */}
        <div>
          <label className={labelCls}>Rules (Markdown)</label>
          <textarea
            rows={8}
            value={form.rulesMarkdown ?? ""}
            onChange={(e) => setForm((p) => ({ ...p, rulesMarkdown: e.target.value }))}
            className={`${inputCls} resize-none font-mono text-xs`}
          />
        </div>

        {/* Banner */}
        <div>
          <label className={labelCls} htmlFor="edit-banner">Banner Image URL</label>
          <input
            id="edit-banner"
            type="url"
            placeholder="https://..."
            value={form.bannerUrl ?? ""}
            onChange={(e) => setForm((p) => ({ ...p, bannerUrl: e.target.value }))}
            className={inputCls}
          />
        </div>

        {/* CoC URL */}
        <div>
          <label className={labelCls} htmlFor="edit-coc">Code of Conduct URL</label>
          <input
            id="edit-coc"
            type="url"
            placeholder="https://..."
            value={form.codeOfConductUrl ?? ""}
            onChange={(e) => setForm((p) => ({ ...p, codeOfConductUrl: e.target.value }))}
            className={inputCls}
          />
        </div>

        {error && (
          <div className="flex items-start gap-2 bg-destructive/10 border border-destructive/30 rounded-xl px-4 py-3 text-sm text-destructive">
            <AlertCircle className="size-4 mt-0.5 shrink-0" />
            {error}
          </div>
        )}

        {success && (
          <div className="flex items-start gap-2 bg-emerald-500/10 border border-emerald-500/30 rounded-xl px-4 py-3 text-sm text-emerald-400">
            <Check className="size-4 mt-0.5 shrink-0" />
            {success}
          </div>
        )}

        <button
          type="submit"
          disabled={saving}
          className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {saving ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Saving...
            </>
          ) : (
            "Save Changes"
          )}
        </button>
      </form>
    </div>
  );
}
