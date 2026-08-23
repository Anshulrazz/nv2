"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Calendar, FileText, Trophy, Code2, GraduationCap, Loader2, Check } from "lucide-react";

export default function CreateEventPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: "",
    description: "",
    type: "ctf" as "hackathon" | "ctf" | "workshop",
    isPaid: false,
    price: 0,
    currency: "INR",
    registrationStart: "",
    registrationEnd: "",
    eventStart: "",
    eventEnd: "",
    rulesMarkdown: "",
    bannerUrl: "",
    challengeReleaseMode: "all_at_once" as "sequential" | "scheduled" | "all_at_once",
    capacity: "",
    codeOfConductUrl: "",
    prizePool: 0,
    isPrizeRevealed: false,
    teamMode: false,
    maxTeamSize: 4,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const payload = {
        ...form,
        price: form.isPaid ? form.price : 0,
        capacity: form.capacity ? parseInt(form.capacity, 10) : null,
      };

      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to create event.");
        return;
      }

      router.push(`/host/events/${data.event._id}/edit`);
    } catch {
      setError("Failed to create event. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const inputCls =
    "w-full bg-sidebar border border-sidebar-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/20 transition-all";
  const labelCls = "text-xs font-mono font-bold uppercase tracking-widest text-muted-foreground mb-1.5 block";

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Create Event</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Set up a new hackathon, CTF, or workshop.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Event Name */}
        <div>
          <label className={labelCls} htmlFor="create-event-name">Event Name</label>
          <input
            id="create-event-name"
            type="text"
            required
            placeholder="e.g. Notexia Hack 2026"
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            className={inputCls}
          />
        </div>

        {/* Description */}
        <div>
          <label className={labelCls} htmlFor="create-event-desc">Description</label>
          <textarea
            id="create-event-desc"
            rows={3}
            placeholder="Brief description of the event..."
            value={form.description}
            onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
            className={`${inputCls} resize-none`}
          />
        </div>

        {/* Type */}
        <div>
          <label className={labelCls}>Event Type</label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
            {(
              [
                { value: "ctf", label: "CTF", icon: Code2, color: "text-cyan-400" },
                { value: "hackathon", label: "Hackathon", icon: Trophy, color: "text-amber-400" },
                { value: "workshop", label: "Workshop", icon: GraduationCap, color: "text-violet-400" },
              ] as const
            ).map(({ value, label, icon: Icon, color }) => (
              <button
                key={value}
                type="button"
                onClick={() => setForm((p) => ({ ...p, type: value }))}
                className={`flex sm:flex-col items-center justify-center gap-2.5 p-3.5 sm:p-4 min-h-[48px] rounded-xl border transition-all ${
                  form.type === value
                    ? "border-primary bg-primary/10"
                    : "border-sidebar-border bg-sidebar hover:border-primary/40"
                }`}
              >
                <Icon className={`size-5 sm:size-6 shrink-0 ${color}`} />
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-foreground">
                  {label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Challenge Release Mode (CTF only) */}
        {form.type === "ctf" && (
          <div>
            <label className={labelCls}>Challenge Release Mode</label>
            <select
              value={form.challengeReleaseMode}
              onChange={(e) =>
                setForm((p) => ({ ...p, challengeReleaseMode: e.target.value as typeof form.challengeReleaseMode }))
              }
              className={inputCls}
            >
              <option value="all_at_once">All at once (release all on start)</option>
              <option value="scheduled">Scheduled (per-challenge release time)</option>
              <option value="sequential">Sequential (unlock after previous solved)</option>
            </select>
          </div>
        )}

        {/* Team Mode (hackathon only) */}
        {form.type === "hackathon" && (
          <div className="flex items-center justify-between bg-sidebar border border-sidebar-border rounded-xl p-4">
            <div>
              <p className="text-sm font-semibold text-foreground">Team Mode</p>
              <p className="text-xs text-muted-foreground">Allow participants to form teams</p>
            </div>
            <button
              type="button"
              onClick={() => setForm((p) => ({ ...p, teamMode: !p.teamMode }))}
              className={`size-6 rounded border-2 flex items-center justify-center transition-all ${
                form.teamMode ? "bg-primary border-primary" : "border-sidebar-border"
              }`}
            >
              {form.teamMode && <Check className="size-3.5 text-primary-foreground" />}
            </button>
          </div>
        )}

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
                required
                value={form.registrationStart}
                onChange={(e) => setForm((p) => ({ ...p, registrationStart: e.target.value }))}
                className={inputCls}
              />
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground mb-1 block">Closes</label>
              <input
                type="datetime-local"
                required
                value={form.registrationEnd}
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
                required
                value={form.eventStart}
                onChange={(e) => setForm((p) => ({ ...p, eventStart: e.target.value }))}
                className={inputCls}
              />
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground mb-1 block">Ends</label>
              <input
                type="datetime-local"
                required
                value={form.eventEnd}
                onChange={(e) => setForm((p) => ({ ...p, eventEnd: e.target.value }))}
                className={inputCls}
              />
            </div>
          </div>
        </div>

        {/* Paid */}
        <div className="flex items-center justify-between bg-sidebar border border-sidebar-border rounded-xl p-4">
          <div>
            <p className="text-sm font-semibold text-foreground">Paid Event</p>
            <p className="text-xs text-muted-foreground">Charge an entry fee</p>
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
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Price (INR)</label>
              <input
                type="number"
                min="1"
                value={form.price}
                onChange={(e) => setForm((p) => ({ ...p, price: parseInt(e.target.value, 10) || 0 }))}
                className={inputCls}
              />
            </div>
          </div>
        )}

        {/* Prize Pool & Reveal */}
        <div className="border border-sidebar-border bg-sidebar/50 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-foreground">Prize Pool & Rewards</p>
              <p className="text-[10px] text-muted-foreground">Total reward pool for winners.</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-muted-foreground">Reveal Now</span>
              <button
                type="button"
                onClick={() => setForm((p) => ({ ...p, isPrizeRevealed: !p.isPrizeRevealed }))}
                className={`size-5 rounded border-2 flex items-center justify-center transition-all ${
                  form.isPrizeRevealed ? "bg-amber-500 border-amber-500" : "border-sidebar-border"
                }`}
              >
                {form.isPrizeRevealed && <Check className="size-3 text-black font-bold" />}
              </button>
            </div>
          </div>
          <div>
            <label className={labelCls}>Total Prize Pool (INR ₹)</label>
            <input
              type="number"
              min="0"
              placeholder="e.g. 50000"
              value={form.prizePool || ""}
              onChange={(e) =>
                setForm((p) => ({ ...p, prizePool: parseInt(e.target.value, 10) || 0 }))
              }
              className={inputCls}
            />
          </div>
        </div>

        {/* Capacity */}
        <div>
          <label className={labelCls} htmlFor="create-capacity">
            Capacity (leave blank for unlimited)
          </label>
          <input
            id="create-capacity"
            type="number"
            min="1"
            placeholder="e.g. 500"
            value={form.capacity}
            onChange={(e) => setForm((p) => ({ ...p, capacity: e.target.value }))}
            className={inputCls}
          />
        </div>

        {/* Rules */}
        <div>
          <label className={labelCls}>
            <FileText className="size-3.5 inline mr-1" />
            Rules (Markdown)
          </label>
          <textarea
            rows={6}
            placeholder="# Rules&#10;1. No cheating&#10;2. ..."
            value={form.rulesMarkdown}
            onChange={(e) => setForm((p) => ({ ...p, rulesMarkdown: e.target.value }))}
            className={`${inputCls} resize-none font-mono text-xs`}
          />
        </div>

        {/* Banner URL */}
        <div>
          <label className={labelCls} htmlFor="create-banner">Banner Image URL</label>
          <input
            id="create-banner"
            type="url"
            placeholder="https://..."
            value={form.bannerUrl}
            onChange={(e) => setForm((p) => ({ ...p, bannerUrl: e.target.value }))}
            className={inputCls}
          />
        </div>

        {/* Code of Conduct URL */}
        <div>
          <label className={labelCls} htmlFor="create-coc">Code of Conduct URL (optional)</label>
          <input
            id="create-coc"
            type="url"
            placeholder="https://..."
            value={form.codeOfConductUrl}
            onChange={(e) => setForm((p) => ({ ...p, codeOfConductUrl: e.target.value }))}
            className={inputCls}
          />
        </div>

        {error && (
          <div className="bg-destructive/10 border border-destructive/30 rounded-xl px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Creating...
            </>
          ) : (
            "Create Event"
          )}
        </button>
      </form>
    </div>
  );
}
