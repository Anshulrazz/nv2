"use client";

import React, { useState, useEffect, useRef } from "react";
import { useWorkspaceStore } from "@/stores/workspaceStore";
import { Editor } from "@/components/editor/Editor";
import { PDFViewer } from "@/components/PDFViewer";
import { SimpleTodo } from "@/components/notes/SimpleTodo";
import {
  BookOpen,
  Plus,
  FileUp,
  Loader2,
  Settings,
  Save,
  Paperclip,
  Upload,
  ExternalLink,
  Trash2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { JSONContent } from "@tiptap/react";

interface VersionHistoryItem {
  _id: string;
  title: string;
  content: JSONContent;
  updatedAt: string;
}

export default function NotesPage() {
  const { activeNoteId, notes, updateNote, createNote } = useWorkspaceStore();
  const activeNote = notes.find((n) => n._id === activeNoteId);
  const [isImporting, setIsImporting] = useState(false);
  const [isUploadingAsset, setIsUploadingAsset] = useState(false);

  const [showPanel, setShowPanel] = useState(false);
  const [panelTab, setPanelTab] = useState<"publish" | "history">("publish");
  const [history, setHistory] = useState<VersionHistoryItem[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  const [published, setPublished] = useState(false);
  const [tagsInput, setTagsInput] = useState("");
  const [category, setCategory] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDescription, setSeoDescription] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [isPinned, setIsPinned] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [readingTime, setReadingTime] = useState("");

  // Autosave state for glow indicator
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");
  const [mode, setMode] = useState<"editor" | "pdf">("editor");
  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (activeNote) {
      setPublished(activeNote.published || false);
      setTagsInput((activeNote.tags || []).join(", "));
      setCategory(activeNote.category || "");
      setCoverImage(activeNote.coverImage || "");
      setSeoTitle(activeNote.seoTitle || "");
      setSeoDescription(activeNote.seoDescription || "");
      setScheduledAt(activeNote.scheduledAt ? new Date(activeNote.scheduledAt).toISOString().split("T")[0] : "");
      setIsPinned(activeNote.isPinned || false);
      setWordCount(activeNote.wordCount || 0);
      setReadingTime(activeNote.readingTime || "");
    }
  }, [activeNoteId, activeNote]);

  const handleSave = async (updates: { title?: string; content?: JSONContent }) => {
    if (activeNote) {
      setSaveState("saving");
      await updateNote(activeNote._id, updates);
      setSaveState("saved");
      if (saveTimeout.current) clearTimeout(saveTimeout.current);
      saveTimeout.current = setTimeout(() => setSaveState("idle"), 2000);
    }
  };

  interface PublishSettingsUpdates {
    published?: boolean;
    tags?: string[];
    category?: string;
    coverImage?: string;
    seoTitle?: string;
    seoDescription?: string;
    scheduledAt?: string | null;
    isPinned?: boolean;
  }

  const updatePublishSettings = async (fieldUpdates: PublishSettingsUpdates) => {
    if (!activeNote) return;
    try {
      const res = await fetch(`/api/notes/${activeNote._id}/publish`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fieldUpdates),
      });
      if (res.ok) {
        const updated = await res.json();
        updateNote(activeNote._id, {
          published: updated.published,
          slug: updated.slug,
          tags: updated.tags,
          category: updated.category,
          coverImage: updated.coverImage,
          seoTitle: updated.seoTitle,
          seoDescription: updated.seoDescription,
          scheduledAt: updated.scheduledAt,
          isPinned: updated.isPinned,
          wordCount: updated.wordCount,
          readingTime: updated.readingTime,
        });
      }
    } catch (e) {
      console.error("Publish update error:", e);
    }
  };

  const handleAssetUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeNote) return;

    setIsUploadingAsset(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        await updateNote(activeNote._id, {
          assetUrl: data.url,
          assetName: file.name,
        });
      } else {
        alert("Failed to upload asset file.");
      }
    } catch (err) {
      console.error(err);
      alert("Error uploading asset.");
    } finally {
      setIsUploadingAsset(false);
    }
  };

  const handleRemoveAsset = async () => {
    if (!activeNote) return;
    if (confirm("Are you sure you want to remove the attached asset?")) {
      await updateNote(activeNote._id, {
        assetUrl: "",
        assetName: "",
      });
    }
  };

  const loadHistory = async () => {
    if (!activeNote) return;
    setIsLoadingHistory(true);
    try {
      const res = await fetch(`/api/notes/${activeNote._id}/history`);
      if (res.ok) {
        const data = await res.json();
        setHistory(data);
      }
    } catch (e) {
      console.error("Load history error:", e);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const createSnapshot = async () => {
    if (!activeNote) return;
    try {
      const res = await fetch(`/api/notes/${activeNote._id}/history`, { method: "POST" });
      if (res.ok) await loadHistory();
    } catch (e) {
      console.error("Create snapshot error:", e);
    }
  };

  const rollbackVersion = async (versionId: string) => {
    if (!activeNote) return;
    if (!confirm("Rollback to this version? Current state will be saved as a new snapshot.")) return;
    try {
      const res = await fetch(`/api/notes/${activeNote._id}/history`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ versionId }),
      });
      if (res.ok) {
        const reverted = await res.json();
        updateNote(activeNote._id, { title: reverted.title, content: reverted.content });
        await loadHistory();
      }
    } catch (e) {
      console.error("Rollback version error:", e);
    }
  };

  useEffect(() => {
    if (showPanel && panelTab === "history" && activeNote) {
      loadHistory();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showPanel, panelTab, activeNoteId]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsImporting(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      const title = file.name.replace(/\.[^/.]+$/, "");
      const paragraphs = text.split("\n").map((line) => ({
        type: "paragraph",
        content: line.trim() ? [{ type: "text", text: line }] : [],
      }));
      const content = {
        type: "doc",
        content: [
          { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: title }] },
          ...paragraphs,
        ],
      };
      const newNote = await createNote(title, null);
      if (newNote) await updateNote(newNote._id, { content });
      setIsImporting(false);
    };
    reader.readAsText(file);
  };

  /* ── Loading state ── */
  if (activeNoteId && !activeNote) {
    return (
      <div className="flex-1 flex items-center justify-center bg-neutral-950 text-neutral-500 select-none gap-2">
        <Loader2 className="h-5 w-5 animate-spin text-cyan-400" />
        <span
          className="text-xs font-bold uppercase tracking-widest"
          style={{ fontFamily: "var(--font-jetbrains-mono)" }}
        >
          Loading note content...
        </span>
      </div>
    );
  }

  /* ── Active note: editor view ── */
  if (activeNote) {
    return (
      <div className="flex-1 flex h-full bg-transparent overflow-hidden relative">
        {/* Main editor area */}
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          {/* Editor toolbar */}
          <div className="h-14 border-b border-white/[0.12] bg-white/[0.04] backdrop-blur-[30px] px-4 sm:px-6 flex items-center justify-between shrink-0 select-none">
            <div className="flex items-center gap-2 sm:gap-4 text-xs text-neutral-400 min-w-0">
              <span
                className="font-bold text-neutral-200 truncate max-w-[100px] sm:max-w-[200px]"
                style={{ fontFamily: "var(--font-space-grotesk)" }}
              >
                {activeNote.title}
              </span>
              <div className="w-px h-3 bg-neutral-800 hidden sm:block" />
              <span className="hidden sm:inline" style={{ fontFamily: "var(--font-jetbrains-mono)" }}>{wordCount} words</span>
              <span className="hidden sm:inline" style={{ fontFamily: "var(--font-jetbrains-mono)" }}>{readingTime || "1 min read"}</span>
              {/* Autosave dot indicator */}
              <div className="flex items-center gap-1.5 shrink-0">
                <div
                  className={`h-1.5 w-1.5 rounded-full transition-colors ${
                    saveState === "saving"
                      ? "bg-amber-400 animate-pulse"
                      : saveState === "saved"
                      ? "bg-emerald-400"
                      : "bg-neutral-700"
                  }`}
                />
                <span
                  className="text-[10px] text-neutral-600 hidden sm:inline"
                  style={{ fontFamily: "var(--font-jetbrains-mono)" }}
                >
                  {saveState === "saving" ? "SAVING" : saveState === "saved" ? "SAVED" : "AUTO"}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              <div className="flex items-center gap-1 bg-white/[0.04] p-0.5 sm:p-1 border border-white/5 rounded-full select-none mr-1">
                <button
                  onClick={() => setMode("editor")}
                  className={`px-2.5 sm:px-3 py-1 rounded-full text-[9px] sm:text-[10px] font-bold uppercase transition-all cursor-pointer ${
                    mode === "editor"
                      ? "bg-[#8B5CF6] text-white shadow-sm"
                      : "text-neutral-450 hover:text-neutral-200"
                  }`}
                  style={{ fontFamily: "var(--font-space-grotesk)" }}
                >
                  Editor
                </button>
                <button
                  onClick={() => setMode("pdf")}
                  className={`px-2.5 sm:px-3 py-1 rounded-full text-[9px] sm:text-[10px] font-bold uppercase transition-all cursor-pointer ${
                    mode === "pdf"
                      ? "bg-[#8B5CF6] text-white shadow-sm"
                      : "text-neutral-455 hover:text-neutral-200"
                  }`}
                  style={{ fontFamily: "var(--font-space-grotesk)" }}
                >
                  PDF<span className="hidden sm:inline"> Viewer</span>
                </button>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={createSnapshot}
                className="h-8 text-neutral-300 hover:text-neutral-100 hover:bg-white/[0.08] text-[11px] gap-1 px-2 sm:px-3 transition-all"
              >
                <Save className="h-3.5 w-3.5" />
                <span className="hidden md:inline">Snapshot</span>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowPanel(!showPanel)}
                className={`h-8 text-[11px] gap-1 px-2 sm:px-3 transition-all ${
                  showPanel
                    ? "bg-white/[0.08] text-neutral-100 border border-white/[0.15]"
                    : "text-neutral-350 hover:text-neutral-100 hover:bg-white/[0.08]"
                }`}
              >
                <Settings className="h-3.5 w-3.5" />
                <span className="hidden md:inline">Publish &amp; Versions</span>
              </Button>
            </div>
          </div>

          {/* Editor canvas */}
          <div className="flex-1 overflow-hidden">
            {mode === "editor" ? (
              <Editor
                key={activeNote._id}
                noteId={activeNote._id}
                initialTitle={activeNote.title}
                initialContent={activeNote.content}
                onSave={handleSave}
              />
            ) : (
              <PDFViewer
                note={activeNote}
                onUpdate={async (updates) => {
                  await updateNote(activeNote._id, updates);
                }}
              />
            )}
          </div>
        </div>

        {/* Right config panel */}
        {showPanel && (
          <>
            {/* Mobile backdrop overlay */}
            <div
              className="fixed inset-0 bg-black/60 z-35 md:hidden transition-opacity"
              onClick={() => setShowPanel(false)}
            />

            <aside className="fixed inset-y-0 right-0 z-40 w-80 border-l border-white/[0.12] bg-[#05070F] flex flex-col shrink-0 h-full overflow-hidden shadow-2xl md:relative md:inset-auto md:z-0 md:bg-white/[0.06] md:shadow-none animate-[slideInRight_0.2s_ease-out]">
              {/* Tab switcher */}
              <div className="h-14 border-b border-white/[0.12] flex items-center bg-white/[0.02] p-1 shrink-0 select-none gap-1 pr-3">
                <button
                  onClick={() => setPanelTab("publish")}
                  className={`flex-1 text-[10px] font-bold py-2 rounded-md uppercase tracking-wider transition-all ${
                    panelTab === "publish"
                      ? "bg-white/[0.08] text-neutral-100 border border-white/[0.15]"
                      : "text-neutral-500 hover:text-neutral-300"
                  }`}
                  style={{ fontFamily: "var(--font-space-grotesk)" }}
                >
                  Publish &amp; SEO
                </button>
                <button
                  onClick={() => setPanelTab("history")}
                  className={`flex-1 text-[10px] font-bold py-2 rounded-md uppercase tracking-wider transition-all ${
                    panelTab === "history"
                      ? "bg-white/[0.08] text-neutral-100 border border-white/[0.15]"
                      : "text-neutral-500 hover:text-neutral-300"
                  }`}
                  style={{ fontFamily: "var(--font-space-grotesk)" }}
                >
                  Versions
                </button>

                {/* Mobile Close Button */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowPanel(false)}
                  className="md:hidden h-8 w-8 text-neutral-455 hover:text-neutral-200"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

            {/* Panel content */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5 custom-scroll">
              {panelTab === "publish" ? (
                <div className="space-y-5 text-xs">
                  {/* Asset Attachment */}
                  <div className="bg-neutral-900/40 border border-neutral-900 hover:border-neutral-850 p-4 rounded-xl space-y-3 transition-colors">
                    <div className="flex items-center gap-1.5 select-none">
                      <Paperclip className="h-3.5 w-3.5 text-cyan-400" />
                      <span
                        className="text-[10px] font-bold text-neutral-200 uppercase tracking-widest"
                        style={{ fontFamily: "var(--font-space-grotesk)" }}
                      >
                        Note Asset Attachment
                      </span>
                    </div>

                    {activeNote.assetUrl ? (
                      <div className="space-y-2">
                        <div className="flex items-center gap-1.5 p-2 bg-neutral-950 border border-neutral-850 rounded-lg select-none">
                          <Paperclip className="h-3 w-3 text-neutral-550 shrink-0" />
                          <span className="text-[10px] text-neutral-350 truncate flex-1 font-mono">
                            {activeNote.assetName || "Attached asset"}
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            type="button"
                            onClick={() => window.open(activeNote.assetUrl, "_blank")}
                            className="flex-1 bg-cyan-500 hover:bg-cyan-400 text-neutral-955 text-[10px] font-bold h-7 gap-1"
                            style={{ fontFamily: "var(--font-space-grotesk)" }}
                          >
                            <ExternalLink className="h-3 w-3" /> View Asset
                          </Button>
                          <Button
                            size="sm"
                            type="button"
                            variant="ghost"
                            onClick={handleRemoveAsset}
                            className="text-neutral-500 hover:text-red-405 hover:bg-neutral-950 h-7 px-2"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <p className="text-[10px] text-neutral-500 leading-normal select-none">
                          Upload a file (PDF, image, document) to attach it to this note. Clicking the note title will open this asset.
                        </p>
                        <label className="flex items-center justify-center border border-dashed border-neutral-800 hover:border-neutral-700 bg-neutral-955/40 rounded-xl p-3.5 cursor-pointer transition-all gap-1.5 text-[10px] font-bold text-neutral-450 hover:text-neutral-200">
                          {isUploadingAsset ? (
                            <>
                              <Loader2 className="h-3.5 w-3.5 animate-spin text-cyan-400" />
                              <span>Uploading...</span>
                            </>
                          ) : (
                            <>
                              <Upload className="h-3.5 w-3.5" />
                              <span>Upload Asset File</span>
                            </>
                          )}
                          <input
                            type="file"
                            onChange={handleAssetUpload}
                            disabled={isUploadingAsset}
                            className="hidden"
                          />
                        </label>
                      </div>
                    )}
                  </div>

                  {/* Pin toggle */}
                  <div className="flex items-center justify-between border-b border-neutral-900 pb-3 select-none">
                    <div className="space-y-0.5">
                      <span
                        className="text-[10px] font-bold text-neutral-200 uppercase tracking-wider block"
                        style={{ fontFamily: "var(--font-space-grotesk)" }}
                      >
                        Pin Note
                      </span>
                      <p className="text-[10px] text-neutral-500 leading-normal">
                        Keep note pinned on dashboard home.
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        const next = !isPinned;
                        setIsPinned(next);
                        updatePublishSettings({ isPinned: next });
                      }}
                      className={`h-5 w-9 rounded-full transition-all relative ${
                        isPinned ? "bg-cyan-500" : "bg-neutral-800"
                      }`}
                    >
                      <div
                        className={`h-3 w-3 bg-neutral-950 rounded-full absolute top-1 transition-all ${
                          isPinned ? "right-1" : "left-1"
                        }`}
                      />
                    </button>
                  </div>

                  {/* Published toggle */}
                  <div className="flex items-center justify-between border-b border-neutral-900 pb-3 select-none">
                    <div className="space-y-0.5">
                      <span
                        className="text-[10px] font-bold text-neutral-200 uppercase tracking-wider block"
                        style={{ fontFamily: "var(--font-space-grotesk)" }}
                      >
                        Publish to Public Feed
                      </span>
                      <p className="text-[10px] text-neutral-500 leading-normal">
                        Make this note visible as a public blog post.
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        const next = !published;
                        setPublished(next);
                        updatePublishSettings({ published: next });
                      }}
                      className={`h-5 w-9 rounded-full transition-all relative ${
                        published ? "bg-cyan-500" : "bg-neutral-800"
                      }`}
                    >
                      <div
                        className={`h-3 w-3 bg-neutral-950 rounded-full absolute top-1 transition-all ${
                          published ? "right-1" : "left-1"
                        }`}
                      />
                    </button>
                  </div>

                  {/* Tags */}
                  <div className="space-y-1.5">
                    <label
                      className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block"
                      style={{ fontFamily: "var(--font-space-grotesk)" }}
                    >
                      Tags
                    </label>
                    <Input
                      value={tagsInput}
                      onChange={(e) => setTagsInput(e.target.value)}
                      onBlur={() =>
                        updatePublishSettings({
                          tags: tagsInput.split(",").map((t) => t.trim()).filter(Boolean),
                        })
                      }
                      placeholder="e.g. ai, research, notes"
                      className="bg-neutral-950 border-neutral-850 focus:border-cyan-400 text-neutral-100 placeholder-neutral-700 h-9 text-[11px]"
                    />
                  </div>

                  {/* Category */}
                  <div className="space-y-1.5">
                    <label
                      className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block"
                      style={{ fontFamily: "var(--font-space-grotesk)" }}
                    >
                      Category
                    </label>
                    <Input
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      onBlur={() => updatePublishSettings({ category })}
                      placeholder="e.g. Engineering"
                      className="bg-neutral-950 border-neutral-850 focus:border-cyan-400 text-neutral-100 placeholder-neutral-700 h-9 text-[11px]"
                    />
                  </div>

                  {/* Cover Image */}
                  <div className="space-y-1.5">
                    <label
                      className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block"
                      style={{ fontFamily: "var(--font-space-grotesk)" }}
                    >
                      Cover Image URL
                    </label>
                    <Input
                      value={coverImage}
                      onChange={(e) => setCoverImage(e.target.value)}
                      onBlur={() => updatePublishSettings({ coverImage })}
                      placeholder="https://example.com/cover.jpg"
                      className="bg-neutral-950 border-neutral-850 focus:border-cyan-400 text-neutral-100 placeholder-neutral-700 h-9 text-[11px]"
                    />
                  </div>

                  {/* SEO Title */}
                  <div className="space-y-1.5">
                    <label
                      className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block"
                      style={{ fontFamily: "var(--font-space-grotesk)" }}
                    >
                      SEO Title
                    </label>
                    <Input
                      value={seoTitle}
                      onChange={(e) => setSeoTitle(e.target.value)}
                      onBlur={() => updatePublishSettings({ seoTitle })}
                      placeholder="Overrides title in search results"
                      className="bg-neutral-950 border-neutral-850 focus:border-cyan-400 text-neutral-100 placeholder-neutral-700 h-9 text-[11px]"
                    />
                  </div>

                  {/* SEO Description */}
                  <div className="space-y-1.5">
                    <label
                      className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block"
                      style={{ fontFamily: "var(--font-space-grotesk)" }}
                    >
                      SEO Description
                    </label>
                    <textarea
                      value={seoDescription}
                      onChange={(e) => setSeoDescription(e.target.value)}
                      onBlur={() => updatePublishSettings({ seoDescription })}
                      rows={2}
                      placeholder="Brief description for search engines..."
                      className="w-full bg-neutral-950 border border-neutral-850 focus:border-cyan-400 rounded-xl px-3 py-2 text-neutral-100 text-[11px] placeholder-neutral-700 outline-none resize-none transition-colors"
                    />
                  </div>

                  {/* Scheduled Date */}
                  <div className="space-y-1.5">
                    <label
                      className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block"
                      style={{ fontFamily: "var(--font-space-grotesk)" }}
                    >
                      Schedule Publish Date
                    </label>
                    <Input
                      type="date"
                      value={scheduledAt}
                      onChange={(e) => setScheduledAt(e.target.value)}
                      onBlur={() =>
                        updatePublishSettings({
                          scheduledAt: scheduledAt || null,
                        })
                      }
                      className="bg-neutral-950 border-neutral-850 focus:border-cyan-400 text-neutral-100 h-9 text-[11px]"
                    />
                  </div>
                </div>
              ) : (
                /* History tab */
                <div className="space-y-3">
                  {isLoadingHistory ? (
                    <div className="flex items-center justify-center py-8 text-neutral-600 gap-2">
                      <Loader2 className="h-4 w-4 animate-spin text-cyan-400" />
                      <span className="text-xs" style={{ fontFamily: "var(--font-jetbrains-mono)" }}>
                        Loading history...
                      </span>
                    </div>
                  ) : history.length === 0 ? (
                    <p className="text-xs text-neutral-600 italic text-center py-8 border border-dashed border-neutral-900 rounded-xl">
                      No snapshots yet. Click Snapshot to save a version.
                    </p>
                  ) : (
                    history.map((v) => (
                      <div
                        key={v._id}
                        className="p-3 bg-neutral-900/30 border border-neutral-900 hover:border-neutral-800 rounded-xl space-y-2 text-xs transition-all group"
                      >
                        <div className="flex items-center justify-between">
                          <span
                            className="font-semibold text-neutral-200"
                            style={{ fontFamily: "var(--font-space-grotesk)" }}
                          >
                            {v.title}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span
                            className="text-[10px] text-neutral-500"
                            style={{ fontFamily: "var(--font-jetbrains-mono)" }}
                          >
                            {new Date(v.updatedAt).toLocaleString()}
                          </span>
                          <button
                            onClick={() => rollbackVersion(v._id)}
                            className="text-[9px] bg-neutral-900 border border-neutral-800 hover:border-cyan-400 text-neutral-400 hover:text-cyan-400 px-2 py-0.5 rounded transition-all opacity-0 group-hover:opacity-100"
                            style={{ fontFamily: "var(--font-jetbrains-mono)" }}
                          >
                            Rollback
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </aside>
          </>
        )}
      </div>
    );
  }

  /* ── Empty state: no active note ── */
  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-neutral-950 text-center px-8 select-none">
      {/* Decorative glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-cyan-500/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative z-10 w-full flex flex-col items-center gap-6 mt-8">
        <div className="space-y-6 max-w-sm">
          <div className="h-16 w-16 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-center mx-auto">
            <BookOpen className="h-8 w-8 text-neutral-600" />
          </div>

          <div className="space-y-2">
            <h2
              className="text-xl font-bold text-neutral-300 tracking-tight"
              style={{ fontFamily: "var(--font-space-grotesk)" }}
            >
              No note selected
            </h2>
            <p className="text-neutral-600 text-sm leading-relaxed">
              Select a note from the sidebar or create a new one to start writing.
            </p>
          </div>

          <div className="flex flex-col gap-3 items-center">
            <Button
              onClick={() => createNote("Untitled Note", null)}
              className="bg-cyan-500 hover:bg-cyan-400 text-neutral-950 font-bold text-sm px-6 h-10 rounded-xl shadow-[0_0_15px_rgba(6,182,212,0.25)] hover:shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all gap-2"
              style={{ fontFamily: "var(--font-space-grotesk)" }}
            >
              <Plus className="h-4 w-4" />
              New Note
            </Button>

            <label className="cursor-pointer text-neutral-500 hover:text-neutral-300 text-xs flex items-center gap-1.5 transition-colors">
              <FileUp className="h-3.5 w-3.5" />
              <span>{isImporting ? "Importing..." : "Import .txt / .md file"}</span>
              <input
                type="file"
                accept=".txt,.md"
                onChange={handleFileUpload}
                className="sr-only"
                disabled={isImporting}
              />
            </label>
          </div>
        </div>

        {/* Local Storage Todo Component placed in empty state */}
        <SimpleTodo />
      </div>
    </div>
  );
}
