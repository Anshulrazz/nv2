"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import {
  Loader2, Plus, Trash2, Pencil, ChevronDown, ChevronUp,
  Flag, CheckCircle2, AlertCircle, Save, X, GripVertical,
} from "lucide-react";
import Link from "next/link";

interface Challenge {
  _id: string;
  title: string;
  descriptionMarkdown: string;
  category: string;
  points: number;
  difficulty: "easy" | "medium" | "hard";
  order: number;
  attachmentUrl?: string | null;
  releaseAt?: string | null;
  images?: string[];
}

const DIFF_COLOR = {
  easy: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  medium: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  hard: "text-red-400 bg-red-500/10 border-red-500/20",
} as const;

const EMPTY_FORM = {
  title: "",
  descriptionMarkdown: "",
  category: "Web Security",
  points: 100,
  difficulty: "medium" as "easy" | "medium" | "hard",
  flag: "",
  order: 0,
  attachmentUrl: "",
  releaseAt: "",
};

function ChallengeForm({
  initial,
  onSave,
  onCancel,
  saving,
}: {
  initial?: typeof EMPTY_FORM & { _id?: string };
  onSave: (data: typeof EMPTY_FORM) => Promise<void>;
  onCancel: () => void;
  saving: boolean;
}) {
  const [form, setForm] = useState(initial ?? EMPTY_FORM);

  const set = (field: string, value: string | number) =>
    setForm((f) => ({ ...f, [field]: value }));

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSave(form);
      }}
      className="space-y-4 p-5 bg-background border border-sidebar-border rounded-2xl"
    >
      {/* Title + Category Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground block mb-1">
            Title *
          </label>
          <input
            required
            value={form.title}
            onChange={(e) => set("title", e.target.value)}
            placeholder="e.g. SQL Injection Basics"
            className="w-full bg-sidebar border border-sidebar-border rounded-xl px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/20"
          />
        </div>
        <div>
          <label className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground block mb-1">
            Category *
          </label>
          <input
            required
            value={form.category}
            onChange={(e) => set("category", e.target.value)}
            placeholder="Web Security, Crypto, Forensics…"
            className="w-full bg-sidebar border border-sidebar-border rounded-xl px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/20"
          />
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground block mb-1">
          Description (Markdown)
        </label>
        <textarea
          rows={4}
          value={form.descriptionMarkdown}
          onChange={(e) => set("descriptionMarkdown", e.target.value)}
          placeholder="Describe the challenge. Markdown is supported."
          className="w-full bg-sidebar border border-sidebar-border rounded-xl px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/20 resize-y font-mono"
        />
      </div>

      {/* Points + Difficulty + Order row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground block mb-1">
            Points *
          </label>
          <input
            required
            type="number"
            min={1}
            value={form.points}
            onChange={(e) => set("points", parseInt(e.target.value))}
            className="w-full bg-sidebar border border-sidebar-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/20"
          />
        </div>
        <div>
          <label className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground block mb-1">
            Difficulty *
          </label>
          <select
            value={form.difficulty}
            onChange={(e) => set("difficulty", e.target.value)}
            className="w-full bg-sidebar border border-sidebar-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/20"
          >
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>
        <div>
          <label className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground block mb-1">
            Order
          </label>
          <input
            type="number"
            min={0}
            value={form.order}
            onChange={(e) => set("order", parseInt(e.target.value))}
            className="w-full bg-sidebar border border-sidebar-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/20"
          />
        </div>
      </div>

      {/* Flag */}
      <div>
        <label className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground block mb-1">
          Flag * {initial?._id && <span className="text-xs text-muted-foreground/60 normal-case">(leave blank to keep existing)</span>}
        </label>
        <input
          required={!initial?._id}
          value={form.flag}
          onChange={(e) => set("flag", e.target.value)}
          placeholder="NOTEXIA{your_secret_flag_here}"
          className="w-full bg-sidebar border border-sidebar-border rounded-xl px-3 py-2 text-sm text-foreground font-mono placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/20"
        />
        <p className="text-[10px] text-muted-foreground mt-1">
          Stored as SHA-256 hash — plaintext is never saved.
        </p>
      </div>

      {/* Attachment URL */}
      <div>
        <label className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground block mb-1">
          Attachment URL <span className="normal-case text-muted-foreground/60">(optional)</span>
        </label>
        <input
          type="url"
          value={form.attachmentUrl}
          onChange={(e) => set("attachmentUrl", e.target.value)}
          placeholder="https://cdn.example.com/file.zip"
          className="w-full bg-sidebar border border-sidebar-border rounded-xl px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/20"
        />
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-1">
        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-60"
        >
          {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
          {initial?._id ? "Save Changes" : "Add Challenge"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex items-center gap-2 px-5 py-2.5 bg-sidebar border border-sidebar-border rounded-xl text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="size-4" />
          Cancel
        </button>
      </div>
    </form>
  );
}

export default function HostChallengesPage() {
  const { id } = useParams<{ id: string }>();

  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const showToast = (type: "success" | "error", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  };

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/events/${id}/challenges`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load.");
      setChallenges(
        (data.challenges ?? []).sort((a: Challenge, b: Challenge) => a.order - b.order)
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load challenges.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const handleAdd = async (form: typeof EMPTY_FORM) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/events/${id}/challenges`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          descriptionMarkdown: form.descriptionMarkdown,
          category: form.category,
          points: form.points,
          difficulty: form.difficulty,
          flag: form.flag,
          order: form.order,
          attachmentUrl: form.attachmentUrl || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create.");
      setChallenges((prev) =>
        [...prev, data.challenge].sort((a, b) => a.order - b.order)
      );
      setShowAddForm(false);
      showToast("success", `Challenge "${data.challenge.title}" added.`);
    } catch (e) {
      showToast("error", e instanceof Error ? e.message : "Failed to add challenge.");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async (form: typeof EMPTY_FORM, cid: string) => {
    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        title: form.title,
        descriptionMarkdown: form.descriptionMarkdown,
        category: form.category,
        points: form.points,
        difficulty: form.difficulty,
        order: form.order,
        attachmentUrl: form.attachmentUrl || null,
      };
      if (form.flag.trim()) body.flag = form.flag;

      const res = await fetch(`/api/events/${id}/challenges/${cid}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update.");
      setChallenges((prev) =>
        prev
          .map((c) => (c._id === cid ? { ...c, ...data.challenge } : c))
          .sort((a, b) => a.order - b.order)
      );
      setEditingId(null);
      showToast("success", `Challenge updated.`);
    } catch (e) {
      showToast("error", e instanceof Error ? e.message : "Failed to update.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (cid: string) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/events/${id}/challenges/${cid}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete.");
      }
      setChallenges((prev) => prev.filter((c) => c._id !== cid));
      setConfirmDeleteId(null);
      showToast("success", "Challenge deleted.");
    } catch (e) {
      showToast("error", e instanceof Error ? e.message : "Failed to delete.");
    } finally {
      setSaving(false);
    }
  };

  const moveChallenge = (index: number, dir: -1 | 1) => {
    const next = [...challenges];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    // Update order values to match visual position
    const reordered = next.map((c, i) => ({ ...c, order: i }));
    setChallenges(reordered);
    // Persist new orders in background
    reordered.forEach((c) =>
      fetch(`/api/events/${id}/challenges/${c._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order: c.order }),
      })
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="size-6 animate-spin text-primary" />
        <span className="text-sm text-muted-foreground">Loading challenges…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
        <AlertCircle className="size-8 text-destructive" />
        <p className="text-sm text-muted-foreground">{error}</p>
        <Link href="/host/events" className="text-xs text-primary hover:underline">
          Back to events
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold shadow-lg border transition-all ${
            toast.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
              : "bg-red-500/10 border-red-500/30 text-red-400"
          }`}
        >
          {toast.type === "success" ? <CheckCircle2 className="size-4" /> : <AlertCircle className="size-4" />}
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
            <Link href="/host/events" className="hover:text-foreground transition-colors">
              Events
            </Link>
            <span>/</span>
            <Link href={`/host/events/${id}/edit`} className="hover:text-foreground transition-colors">
              Edit
            </Link>
            <span>/</span>
            <span className="text-foreground">Challenges</span>
          </div>
          <h1 className="text-xl font-bold text-foreground">Manage Challenges</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {challenges.length} challenge{challenges.length !== 1 ? "s" : ""} · Flags are stored as SHA-256 hashes only.
          </p>
        </div>

        {!showAddForm && (
          <button
            onClick={() => { setShowAddForm(true); setEditingId(null); }}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground text-sm font-bold rounded-xl hover:opacity-90 transition-opacity"
          >
            <Plus className="size-4" />
            Add Challenge
          </button>
        )}
      </div>

      {/* Add Form */}
      {showAddForm && (
        <div className="mb-6">
          <h2 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
            <Plus className="size-4 text-primary" /> New Challenge
          </h2>
          <ChallengeForm
            onSave={handleAdd}
            onCancel={() => setShowAddForm(false)}
            saving={saving}
          />
        </div>
      )}

      {/* Empty state */}
      {challenges.length === 0 && !showAddForm && (
        <div className="flex flex-col items-center justify-center py-24 gap-4 text-center border border-dashed border-sidebar-border rounded-2xl">
          <Flag className="size-10 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">No challenges yet.</p>
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-xs font-bold rounded-xl hover:opacity-90 transition-opacity"
          >
            <Plus className="size-3.5" />
            Add your first challenge
          </button>
        </div>
      )}

      {/* Challenge List */}
      {challenges.length > 0 && (
        <div className="space-y-3">
          {challenges.map((challenge, idx) => (
            <div key={challenge._id}>
              {editingId === challenge._id ? (
                <div>
                  <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                    <Pencil className="size-4 text-primary" /> Editing: {challenge.title}
                  </h3>
                  <ChallengeForm
                    initial={{
                      title: challenge.title,
                      descriptionMarkdown: challenge.descriptionMarkdown,
                      category: challenge.category,
                      points: challenge.points,
                      difficulty: challenge.difficulty,
                      flag: "",
                      order: challenge.order,
                      attachmentUrl: challenge.attachmentUrl ?? "",
                      releaseAt: challenge.releaseAt ?? "",
                      _id: challenge._id,
                    }}
                    onSave={(form) => handleEdit(form, challenge._id)}
                    onCancel={() => setEditingId(null)}
                    saving={saving}
                  />
                </div>
              ) : (
                <div className="flex items-center gap-3 bg-sidebar border border-sidebar-border rounded-2xl p-4 hover:border-primary/20 transition-colors group">
                  {/* Reorder buttons */}
                  <div className="flex flex-col gap-0.5 shrink-0">
                    <button
                      onClick={() => moveChallenge(idx, -1)}
                      disabled={idx === 0}
                      className="p-0.5 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-20"
                    >
                      <ChevronUp className="size-3.5" />
                    </button>
                    <GripVertical className="size-4 text-muted-foreground/30 mx-auto" />
                    <button
                      onClick={() => moveChallenge(idx, 1)}
                      disabled={idx === challenges.length - 1}
                      className="p-0.5 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-20"
                    >
                      <ChevronDown className="size-3.5" />
                    </button>
                  </div>

                  {/* Challenge info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs text-muted-foreground font-mono shrink-0">#{idx + 1}</span>
                      <span className="text-sm font-semibold text-foreground truncate">{challenge.title}</span>
                      <span
                        className={`text-[10px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${DIFF_COLOR[challenge.difficulty]}`}
                      >
                        {challenge.difficulty}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-[11px] text-muted-foreground font-mono">
                      <span className="bg-sidebar-accent border border-sidebar-border px-2 py-0.5 rounded">{challenge.category}</span>
                      <span className="text-primary font-bold">{challenge.points} pts</span>
                      {challenge.attachmentUrl && <span>📎 Attachment</span>}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    {confirmDeleteId === challenge._id ? (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-red-400 font-semibold">Delete?</span>
                        <button
                          onClick={() => handleDelete(challenge._id)}
                          disabled={saving}
                          className="px-3 py-1.5 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg text-xs font-bold hover:bg-red-500/20 transition-colors"
                        >
                          {saving ? <Loader2 className="size-3.5 animate-spin" /> : "Yes, delete"}
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(null)}
                          className="px-3 py-1.5 bg-sidebar border border-sidebar-border rounded-lg text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <>
                        <button
                          onClick={() => { setEditingId(challenge._id); setShowAddForm(false); }}
                          className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-sidebar-accent transition-colors"
                          title="Edit"
                        >
                          <Pencil className="size-4" />
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(challenge._id)}
                          className="p-2 rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
