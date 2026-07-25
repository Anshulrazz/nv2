"use client";

import React, { useState, useEffect, useRef } from "react";
import { useWorkspaceStore } from "@/stores/workspaceStore";
import { Editor } from "@/components/editor/Editor";
import { PDFViewer } from "@/components/PDFViewer";
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
  ArrowUpRight,
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

  // Autosave state for indicator
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

  /* Loading state */
  if (activeNoteId && !activeNote) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#030305] text-zinc-500 select-none gap-2">
        <Loader2 className="h-5 w-5 animate-spin text-cyan-400" />
        <span className="text-xs font-mono font-bold uppercase tracking-widest text-zinc-400">
          Loading note content...
        </span>
      </div>
    );
  }

  /* Active note: editor view */
  if (activeNote) {
    return (
      <div className="flex-1 flex h-full bg-[#030305] text-zinc-100 overflow-hidden relative antialiased selection:bg-cyan-500/30 selection:text-cyan-200">
        {/* Main editor area */}
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          {/* Editor toolbar */}
          <div className="h-14 border-b border-white/5 bg-zinc-950/60 backdrop-blur-2xl px-4 sm:px-6 flex items-center justify-between shrink-0 select-none z-10">
            <div className="flex items-center gap-2 sm:gap-4 text-xs text-zinc-400 min-w-0">
              <span className="font-bold text-white truncate max-w-[100px] sm:max-w-[200px]">
                {activeNote.title}
              </span>
              <div className="w-px h-3 bg-white/10 hidden sm:block" />
              <span className="hidden sm:inline font-mono">{wordCount} words</span>
              <span className="hidden sm:inline font-mono">{readingTime || "1 min read"}</span>
              
              {/* Autosave indicator */}
              <div className="flex items-center gap-1.5 shrink-0">
                <div
                  className={`size-1.5 rounded-full transition-colors ${
                    saveState === "saving"
                      ? "bg-amber-400 animate-pulse"
                      : saveState === "saved"
                      ? "bg-emerald-400"
                      : "bg-zinc-700"
                  }`}
                />
                <span className="text-[10px] font-mono text-zinc-500 hidden sm:inline">
                  {saveState === "saving" ? "SAVING" : saveState === "saved" ? "SAVED" : "AUTO"}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <div className="flex items-center gap-1 bg-zinc-900/60 p-1 border border-white/10 rounded-full select-none mr-1">
                <button
                  onClick={() => setMode("editor")}
                  className={`px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase transition-all cursor-pointer ${
                    mode === "editor"
                      ? "bg-cyan-500 text-zinc-950 shadow-sm"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  Editor
                </button>
                <button
                  onClick={() => setMode("pdf")}
                  className={`px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase transition-all cursor-pointer ${
                    mode === "pdf"
                      ? "bg-cyan-500 text-zinc-950 shadow-sm"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  PDF<span className="hidden sm:inline"> Viewer</span>
                </button>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={createSnapshot}
                className="h-8 text-zinc-300 hover:text-white hover:bg-white/5 text-[11px] font-mono gap-1 px-3 rounded-full border border-white/5 transition-all"
              >
                <Save className="h-3.5 w-3.5" />
                <span className="hidden md:inline">Snapshot</span>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowPanel(!showPanel)}
                className={`h-8 text-[11px] font-mono gap-1 px-3 rounded-full transition-all ${
                  showPanel
                    ? "bg-white/10 text-white border border-white/20"
                    : "text-zinc-400 hover:text-white hover:bg-white/5 border border-white/5"
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
            <div
              className="fixed inset-0 bg-black/60 z-35 md:hidden transition-opacity"
              onClick={() => setShowPanel(false)}
            />

            <aside className="fixed inset-y-0 right-0 z-40 w-80 border-l border-white/10 bg-[#07070a] flex flex-col shrink-0 h-full overflow-hidden shadow-2xl md:relative md:inset-auto md:z-0">
              {/* Tab switcher */}
              <div className="h-14 border-b border-white/5 flex items-center bg-zinc-950/60 p-1 shrink-0 select-none gap-1 pr-3">
                <button
                  onClick={() => setPanelTab("publish")}
                  className={`flex-1 text-[10px] font-mono font-bold py-2 rounded-lg uppercase tracking-wider transition-all ${
                    panelTab === "publish"
                      ? "bg-white/10 text-white border border-white/10"
                      : "text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  Publish &amp; SEO
                </button>
                <button
                  onClick={() => setPanelTab("history")}
                  className={`flex-1 text-[10px] font-mono font-bold py-2 rounded-lg uppercase tracking-wider transition-all ${
                    panelTab === "history"
                      ? "bg-white/10 text-white border border-white/10"
                      : "text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  Versions
                </button>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowPanel(false)}
                  className="md:hidden h-8 w-8 text-zinc-400 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Panel content */}
              <div className="flex-1 overflow-y-auto p-5 space-y-5 custom-scroll">
                {panelTab === "publish" ? (
                  <div className="space-y-5 text-xs">
                    {/* Asset Attachment */}
                    <div className="rounded-2xl bg-zinc-900/40 border border-white/10 p-4 space-y-3">
                      <div className="flex items-center gap-1.5 select-none">
                        <Paperclip className="h-3.5 w-3.5 text-cyan-400" />
                        <span className="text-[10px] font-mono font-bold text-white uppercase tracking-widest">
                          Note Asset Attachment
                        </span>
                      </div>

                      {activeNote.assetUrl ? (
                        <div className="space-y-2">
                          <div className="flex items-center gap-1.5 p-2 bg-zinc-950 border border-white/5 rounded-xl">
                            <Paperclip className="h-3 w-3 text-zinc-500 shrink-0" />
                            <span className="text-[10px] text-zinc-300 truncate flex-1 font-mono">
                              {activeNote.assetName || "Attached asset"}
                            </span>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              type="button"
                              onClick={() => window.open(activeNote.assetUrl, "_blank")}
                              className="flex-1 bg-white hover:bg-zinc-100 text-zinc-950 text-[10px] font-bold h-7 gap-1 rounded-full"
                            >
                              <ExternalLink className="h-3 w-3" /> View Asset
                            </Button>
                            <Button
                              size="sm"
                              type="button"
                              variant="ghost"
                              onClick={handleRemoveAsset}
                              className="text-zinc-400 hover:text-rose-400 hover:bg-zinc-950 h-7 px-2 rounded-full"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <p className="text-[10px] text-zinc-400 leading-normal select-none">
                            Upload a file (PDF, image, document) to attach it to this note.
                          </p>
                          <label className="flex items-center justify-center border border-dashed border-white/10 hover:border-cyan-500/40 bg-zinc-950/60 rounded-xl p-3.5 cursor-pointer transition-all gap-1.5 text-[10px] font-mono font-bold text-zinc-400 hover:text-white">
                            {isUploadingAsset ? (
                              <>
                                <Loader2 className="h-3.5 w-3.5 animate-spin text-cyan-400" />
                                <span>Uploading...</span>
                              </>
                            ) : (
                              <>
                                <Upload className="h-3.5 w-3.5 text-cyan-400" />
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
                    <div className="flex items-center justify-between border-b border-white/5 pb-3 select-none">
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-mono font-bold text-white uppercase tracking-wider block">
                          Pin Note
                        </span>
                        <p className="text-[10px] text-zinc-500">
                          Keep note pinned on dashboard.
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          const next = !isPinned;
                          setIsPinned(next);
                          updatePublishSettings({ isPinned: next });
                        }}
                        className={`h-5 w-9 rounded-full transition-all relative ${
                          isPinned ? "bg-cyan-500" : "bg-zinc-800"
                        }`}
                      >
                        <div
                          className={`h-3 w-3 bg-zinc-950 rounded-full absolute top-1 transition-all ${
                            isPinned ? "right-1" : "left-1"
                          }`}
                        />
                      </button>
                    </div>

                    {/* Published toggle */}
                    <div className="flex items-center justify-between border-b border-white/5 pb-3 select-none">
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-mono font-bold text-white uppercase tracking-wider block">
                          Publish to Public Feed
                        </span>
                        <p className="text-[10px] text-zinc-500">
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
                          published ? "bg-cyan-500" : "bg-zinc-800"
                        }`}
                      >
                        <div
                          className={`h-3 w-3 bg-zinc-950 rounded-full absolute top-1 transition-all ${
                            published ? "right-1" : "left-1"
                          }`}
                        />
                      </button>
                    </div>

                    {/* Tags */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-wider block">
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
                        className="bg-zinc-950 border-white/10 focus:border-cyan-400 text-white placeholder-zinc-700 h-9 text-[11px] rounded-xl"
                      />
                    </div>

                    {/* Category */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-wider block">
                        Category
                      </label>
                      <Input
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        onBlur={() => updatePublishSettings({ category })}
                        placeholder="e.g. Engineering"
                        className="bg-zinc-950 border-white/10 focus:border-cyan-400 text-white placeholder-zinc-700 h-9 text-[11px] rounded-xl"
                      />
                    </div>

                    {/* Cover Image */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-wider block">
                        Cover Image URL
                      </label>
                      <Input
                        value={coverImage}
                        onChange={(e) => setCoverImage(e.target.value)}
                        onBlur={() => updatePublishSettings({ coverImage })}
                        placeholder="https://example.com/cover.jpg"
                        className="bg-zinc-950 border-white/10 focus:border-cyan-400 text-white placeholder-zinc-700 h-9 text-[11px] rounded-xl"
                      />
                    </div>

                    {/* SEO Title */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-wider block">
                        SEO Title
                      </label>
                      <Input
                        value={seoTitle}
                        onChange={(e) => setSeoTitle(e.target.value)}
                        onBlur={() => updatePublishSettings({ seoTitle })}
                        placeholder="Overrides title in search results"
                        className="bg-zinc-950 border-white/10 focus:border-cyan-400 text-white placeholder-zinc-700 h-9 text-[11px] rounded-xl"
                      />
                    </div>

                    {/* SEO Description */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-wider block">
                        SEO Description
                      </label>
                      <textarea
                        value={seoDescription}
                        onChange={(e) => setSeoDescription(e.target.value)}
                        onBlur={() => updatePublishSettings({ seoDescription })}
                        rows={2}
                        placeholder="Brief description for search engines..."
                        className="w-full bg-zinc-950 border border-white/10 focus:border-cyan-400 rounded-xl px-3 py-2 text-white text-[11px] placeholder-zinc-700 outline-none resize-none transition-colors"
                      />
                    </div>

                    {/* Scheduled Date */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-wider block">
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
                        className="bg-zinc-950 border-white/10 focus:border-cyan-400 text-white h-9 text-[11px] rounded-xl"
                      />
                    </div>
                  </div>
                ) : (
                  /* History tab */
                  <div className="space-y-3">
                    {isLoadingHistory ? (
                      <div className="flex items-center justify-center py-8 text-zinc-500 gap-2">
                        <Loader2 className="h-4 w-4 animate-spin text-cyan-400" />
                        <span className="text-xs font-mono">Loading history...</span>
                      </div>
                    ) : history.length === 0 ? (
                      <p className="text-xs text-zinc-500 italic text-center py-8 border border-dashed border-white/10 rounded-xl">
                        No snapshots yet. Click Snapshot to save a version.
                      </p>
                    ) : (
                      history.map((v) => (
                        <div
                          key={v._id}
                          className="p-3 bg-zinc-950 border border-white/5 hover:border-white/20 rounded-xl space-y-2 text-xs transition-all group"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-white">{v.title}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-mono text-zinc-500">
                              {new Date(v.updatedAt).toLocaleString()}
                            </span>
                            <button
                              onClick={() => rollbackVersion(v._id)}
                              className="text-[9px] font-mono bg-zinc-900 border border-white/10 hover:border-cyan-400 text-zinc-400 hover:text-cyan-400 px-2 py-0.5 rounded-full transition-all opacity-0 group-hover:opacity-100"
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

  /* Empty state: no active note */
  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-[#030305] text-center px-8 select-none relative overflow-hidden antialiased">
      {/* Background Ambient Mesh Glow Orbs */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Doppelrand Hardware Empty State Box */}
      <div className="relative z-10 w-full max-w-md rounded-[2.5rem] bg-zinc-900/40 border border-white/10 p-2.5 backdrop-blur-3xl shadow-[0_0_80px_rgba(0,0,0,0.8)]">
        <div className="rounded-[calc(2.5rem-0.75rem)] bg-[#07070a] border border-white/5 p-8 flex flex-col items-center gap-6">
          <div className="size-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
            <BookOpen className="size-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-extrabold text-white tracking-tight">
              No note selected
            </h2>
            <p className="text-zinc-400 text-xs font-light leading-relaxed">
              Select a note from the sidebar tree or create a new one to start writing.
            </p>
          </div>

          <div className="flex flex-col gap-3 items-center w-full">
            <Button
              onClick={() => createNote("Untitled Note", null)}
              className="group w-full rounded-full bg-white hover:bg-zinc-100 text-zinc-950 font-bold text-xs h-11 flex items-center justify-center gap-2 transition-all duration-300 active:scale-[0.97] shadow-[0_0_25px_rgba(255,255,255,0.2)]"
            >
              <Plus className="size-4 text-zinc-950" />
              <span>New Note</span>
              <ArrowUpRight className="size-4 text-zinc-950 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </Button>

            <label className="cursor-pointer text-zinc-400 hover:text-white text-xs flex items-center gap-1.5 transition-colors pt-2 font-mono">
              <FileUp className="size-3.5 text-cyan-400" />
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
      </div>
    </div>
  );
}
