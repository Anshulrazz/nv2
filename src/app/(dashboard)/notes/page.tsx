"use client";

export const dynamic = "force-dynamic";

import React, { useState, useEffect, useRef } from "react";
import { useWorkspaceStore } from "@/stores/workspaceStore";
import { Editor } from "@/components/editor/Editor";
import { PDFViewer } from "@/components/PDFViewer";
import { TopicGeneratorModal } from "@/components/notes/TopicGeneratorModal";
import { NoteSideChat } from "@/components/notes/NoteSideChat";
import {
  BookOpen,
  Plus,
  FileUp,
  Loader2,
  Settings,
  Save,
  X,
  Sparkles,
  Wand2,
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

function extractNoteText(content: unknown): string {
  if (!content) return "";
  if (typeof content === "string") return content;
  if (typeof content === "object" && content !== null) {
    const obj = content as Record<string, unknown>;
    if (obj.text && typeof obj.text === "string") return obj.text;
    if (Array.isArray(obj.content)) return obj.content.map(extractNoteText).join("\n");
  }
  if (Array.isArray(content)) return content.map(extractNoteText).join(" ");
  return "";
}

export default function NotesPage() {
  const { activeNoteId, notes, updateNote, createNote, setActiveNoteId } = useWorkspaceStore();
  const activeNote = notes.find((n) => n._id === activeNoteId);
  const [isImporting, setIsImporting] = useState(false);

  const [showPanel, setShowPanel] = useState(false);
  const [panelTab, setPanelTab] = useState<"chat" | "publish" | "history">("chat");
  const [showTopicModal, setShowTopicModal] = useState(false);
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

      const hasPdf =
        !!activeNote.assetUrl &&
        (activeNote.assetUrl.toLowerCase().includes(".pdf") ||
          activeNote.assetName?.toLowerCase().endsWith(".pdf"));
      setMode(hasPdf ? "pdf" : "editor");
    }
  }, [activeNoteId, activeNote]);

  const handleSave = async (updates: { title?: string; content?: JSONContent }) => {
    if (!activeNote) return;

    setSaveState("saving");
    if (saveTimeout.current) clearTimeout(saveTimeout.current);

    let derivedWordCount = wordCount;
    let derivedReadingTime = readingTime;

    if (updates.content) {
      const text = extractNoteText(updates.content);
      derivedWordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
      const minutes = Math.max(1, Math.ceil(derivedWordCount / 200));
      derivedReadingTime = `${minutes} min read`;
      setWordCount(derivedWordCount);
      setReadingTime(derivedReadingTime);
    }

    try {
      await updateNote(activeNote._id, {
        ...updates,
        wordCount: derivedWordCount,
        readingTime: derivedReadingTime,
      });

      setSaveState("saved");
      saveTimeout.current = setTimeout(() => {
        setSaveState("idle");
      }, 2000);
    } catch {
      setSaveState("idle");
    }
  };

  const updatePublishSettings = async (patch: {
    published?: boolean;
    tags?: string[];
    category?: string;
    coverImage?: string;
    seoTitle?: string;
    seoDescription?: string;
    scheduledAt?: string;
    isPinned?: boolean;
  }) => {
    if (!activeNote) return;
    try {
      await updateNote(activeNote._id, patch);
    } catch (err) {
      console.error(err);
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

    const isPdf =
      file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");

    if (isPdf) {
      try {
        const formData = new FormData();
        formData.append("file", file);

        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (!uploadRes.ok) throw new Error("PDF upload failed");
        const uploadData = await uploadRes.json();

        const baseTitle = file.name.replace(/\.[^/.]+$/, "");
        const newNote = await createNote(baseTitle, null);

        if (newNote?._id) {
          await updateNote(newNote._id, {
            assetUrl: uploadData.url,
            assetName: file.name,
            content: {
              type: "doc",
              content: [
                {
                  type: "paragraph",
                  content: [
                    {
                      type: "text",
                      text: `Attached PDF: ${file.name}`,
                    },
                  ],
                },
              ],
            },
          });
          setActiveNoteId(newNote._id);
        }
      } catch (err) {
        console.error(err);
        alert("Failed to upload PDF file.");
      } finally {
        setIsImporting(false);
      }
      return;
    }

    // Text / Markdown parsing
    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = (event.target?.result as string) || "";
      const baseTitle = file.name.replace(/\.[^/.]+$/, "");
      const newNote = await createNote(baseTitle, null);

      if (newNote?._id) {
        const paragraphs = text
          .split("\n\n")
          .map((p) => p.trim())
          .filter(Boolean)
          .map((p) => ({
            type: "paragraph",
            content: [{ type: "text", text: p }],
          }));

        await updateNote(newNote._id, {
          content: {
            type: "doc",
            content: paragraphs.length
              ? paragraphs
              : [{ type: "paragraph", content: [{ type: "text", text }] }],
          },
        });
        setActiveNoteId(newNote._id);
      }
      setIsImporting(false);
    };

    reader.onerror = () => {
      alert("Failed to read file.");
      setIsImporting(false);
    };

    reader.readAsText(file);
  };

  /* Active Note Workspace View */
  if (activeNote) {
    return (
      <div className="notes-page-root flex-1 flex h-full bg-bg-base text-text-primary overflow-hidden relative antialiased selection:bg-accent-primary/25 selection:text-text-primary">
        {/* Main Editor / PDF view */}
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          {/* Note Top Toolbar */}
          <div className="h-14 border-b border-border-subtle bg-bg-surface px-4 sm:px-6 flex items-center justify-between shrink-0 select-none z-10">
            <div className="flex items-center gap-2 sm:gap-3 text-xs text-text-muted min-w-0">
              <span className="font-semibold text-text-primary truncate max-w-[120px] sm:max-w-[220px]">
                {activeNote.title}
              </span>
              <div className="w-px h-3 bg-border-subtle hidden sm:block" />
              <span className="hidden sm:inline font-mono">{wordCount} words</span>
              <span className="hidden sm:inline font-mono">{readingTime || "1 min read"}</span>

              {/* Autosave Indicator */}
              <div className="flex items-center gap-1.5 shrink-0">
                <div
                  className={`size-1.5 rounded-full transition-colors ${
                    saveState === "saving"
                      ? "bg-accent-primary animate-pulse"
                      : saveState === "saved"
                      ? "bg-success"
                      : "bg-text-muted/40"
                  }`}
                />
                <span className="text-[10px] font-mono text-text-muted hidden sm:inline">
                  {saveState === "saving" ? "SAVING" : saveState === "saved" ? "SAVED" : "AUTO"}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {/* Mode Toggle (Editor vs PDF) */}
              <div className="flex items-center gap-1 bg-bg-elevated p-1 border border-border-subtle rounded-xl select-none mr-1">
                <button
                  onClick={() => setMode("editor")}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold uppercase transition-colors cursor-pointer ${
                    mode === "editor"
                      ? "bg-accent-primary text-bg-base"
                      : "text-text-secondary hover:text-text-primary"
                  }`}
                >
                  Editor
                </button>
                <button
                  onClick={() => setMode("pdf")}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold uppercase transition-colors cursor-pointer ${
                    mode === "pdf"
                      ? "bg-accent-primary text-bg-base"
                      : "text-text-secondary hover:text-text-primary"
                  }`}
                >
                  PDF<span className="hidden sm:inline"> Viewer</span>
                </button>
              </div>

              {/* Snapshot Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={createSnapshot}
                className="h-8 text-text-secondary hover:text-text-primary hover:bg-bg-elevated text-[11px] font-mono gap-1 px-2.5 rounded-xl border border-border-subtle transition-colors cursor-pointer"
              >
                <Save className="size-3.5" />
                <span className="hidden md:inline">Snapshot</span>
              </Button>

              {/* AI Side Chat Toggle */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (showPanel && panelTab === "chat") {
                    setShowPanel(false);
                  } else {
                    setPanelTab("chat");
                    setShowPanel(true);
                  }
                }}
                className={`h-8 text-[11px] font-mono gap-1.5 px-3 rounded-xl transition-colors cursor-pointer ${
                  showPanel && panelTab === "chat"
                    ? "bg-accent-primary text-bg-base font-bold shadow-sm"
                    : "bg-accent-primary/10 text-accent-primary hover:bg-accent-primary/20 border border-accent-primary/20"
                }`}
              >
                <Sparkles className="size-3.5 text-accent-primary" />
                <span>AI Chat</span>
              </Button>

              {/* Publish & Settings Toggle */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (showPanel && panelTab !== "chat") {
                    setShowPanel(false);
                  } else {
                    setPanelTab("publish");
                    setShowPanel(true);
                  }
                }}
                className={`h-8 text-[11px] font-mono gap-1 px-2.5 rounded-xl transition-colors cursor-pointer ${
                  showPanel && panelTab !== "chat"
                    ? "bg-bg-elevated text-text-primary border border-border-default"
                    : "text-text-secondary hover:text-text-primary hover:bg-bg-elevated border border-border-subtle"
                }`}
                aria-label="Publish & Settings"
              >
                <Settings className="size-3.5" />
                <span className="hidden md:inline">Publish</span>
              </Button>
            </div>
          </div>

          {/* Editor Content Area */}
          <div className="flex-1 min-h-0 overflow-hidden">
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

        {/* Contextual Side Panel (AI Chat / Publish / History) */}
        {showPanel && (
          <>
            <div
              className="fixed inset-0 bg-black/60 z-30 md:hidden transition-opacity"
              onClick={() => setShowPanel(false)}
            />

            <aside className="fixed inset-y-0 right-0 z-40 w-80 md:w-96 border-l border-border-subtle bg-bg-surface flex flex-col shrink-0 h-full overflow-hidden shadow-2xl md:sticky md:top-0 md:inset-auto md:z-0">
              {/* Tab Switcher */}
              <div className="h-14 border-b border-border-subtle flex items-center bg-bg-surface p-1.5 shrink-0 select-none gap-1 pr-3">
                <button
                  onClick={() => setPanelTab("chat")}
                  className={`flex-1 text-[10px] font-mono font-bold py-2 rounded-lg uppercase tracking-wider transition-colors flex items-center justify-center gap-1 cursor-pointer ${
                    panelTab === "chat"
                      ? "bg-accent-primary/15 text-accent-primary border border-accent-primary/30"
                      : "text-text-muted hover:text-text-primary hover:bg-bg-elevated"
                  }`}
                >
                  <Sparkles className="size-3 text-accent-primary" />
                  <span>AI Chat</span>
                </button>
                <button
                  onClick={() => setPanelTab("publish")}
                  className={`flex-1 text-[10px] font-mono font-bold py-2 rounded-lg uppercase tracking-wider transition-colors cursor-pointer ${
                    panelTab === "publish"
                      ? "bg-bg-elevated text-text-primary border border-border-default"
                      : "text-text-muted hover:text-text-primary hover:bg-bg-elevated"
                  }`}
                >
                  <span>Publish</span>
                </button>
                <button
                  onClick={() => setPanelTab("history")}
                  className={`flex-1 text-[10px] font-mono font-bold py-2 rounded-lg uppercase tracking-wider transition-colors cursor-pointer ${
                    panelTab === "history"
                      ? "bg-bg-elevated text-text-primary border border-border-default"
                      : "text-text-muted hover:text-text-primary hover:bg-bg-elevated"
                  }`}
                >
                  <span>Versions</span>
                </button>

                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => setShowPanel(false)}
                  className="size-7 text-text-muted hover:text-text-primary rounded-lg ml-1 cursor-pointer"
                  aria-label="Close side panel"
                >
                  <X className="size-4" />
                </Button>
              </div>

              {/* Panel Content Body */}
              <div className="flex-1 overflow-y-auto custom-scroll">
                {panelTab === "chat" ? (
                  <NoteSideChat
                    noteTitle={activeNote.title}
                    noteContentText={extractNoteText(activeNote.content)}
                  />
                ) : panelTab === "publish" ? (
                  /* Publish tab */
                  <div className="p-5 space-y-4 text-xs">
                    {/* Pinned toggle */}
                    <div className="flex items-center justify-between border-b border-border-subtle pb-3 select-none">
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-mono font-bold text-text-primary uppercase tracking-wider block">
                          Pin to Top
                        </span>
                        <p className="text-[10px] text-text-muted">
                          Keep this note at the top of your workspace list.
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          const next = !isPinned;
                          setIsPinned(next);
                          updatePublishSettings({ isPinned: next });
                        }}
                        className={`h-5 w-9 rounded-full transition-colors relative cursor-pointer ${
                          isPinned ? "bg-accent-primary" : "bg-bg-elevated border border-border-subtle"
                        }`}
                        aria-label="Toggle pin note"
                      >
                        <div
                          className={`size-3.5 bg-bg-base rounded-full absolute top-0.5 transition-transform ${
                            isPinned ? "right-1" : "left-1"
                          }`}
                        />
                      </button>
                    </div>

                    {/* Published toggle */}
                    <div className="flex items-center justify-between border-b border-border-subtle pb-3 select-none">
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-mono font-bold text-text-primary uppercase tracking-wider block">
                          Publish to Public Feed
                        </span>
                        <p className="text-[10px] text-text-muted">
                          Share this note as a public article in community blogs.
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          const next = !published;
                          setPublished(next);
                          updatePublishSettings({ published: next });
                        }}
                        className={`h-5 w-9 rounded-full transition-colors relative cursor-pointer ${
                          published ? "bg-accent-primary" : "bg-bg-elevated border border-border-subtle"
                        }`}
                        aria-label="Toggle publish note"
                      >
                        <div
                          className={`size-3.5 bg-bg-base rounded-full absolute top-0.5 transition-transform ${
                            published ? "right-1" : "left-1"
                          }`}
                        />
                      </button>
                    </div>

                    {/* Tags */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-mono font-bold text-text-muted uppercase tracking-wider block">
                        Tags (comma separated)
                      </label>
                      <Input
                        value={tagsInput}
                        onChange={(e) => setTagsInput(e.target.value)}
                        onBlur={() =>
                          updatePublishSettings({
                            tags: tagsInput.split(",").map((t) => t.trim()).filter(Boolean),
                          })
                        }
                        placeholder="e.g. physics, calculus, revision"
                        className="bg-bg-base border-border-subtle focus-visible:ring-accent-primary text-text-primary placeholder:text-text-muted h-9 text-xs rounded-xl"
                      />
                    </div>

                    {/* Category */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-mono font-bold text-text-muted uppercase tracking-wider block">
                        Category
                      </label>
                      <Input
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        onBlur={() => updatePublishSettings({ category })}
                        placeholder="e.g. Computer Science"
                        className="bg-bg-base border-border-subtle focus-visible:ring-accent-primary text-text-primary placeholder:text-text-muted h-9 text-xs rounded-xl"
                      />
                    </div>

                    {/* Cover Image */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-mono font-bold text-text-muted uppercase tracking-wider block">
                        Cover Image URL
                      </label>
                      <Input
                        value={coverImage}
                        onChange={(e) => setCoverImage(e.target.value)}
                        onBlur={() => updatePublishSettings({ coverImage })}
                        placeholder="https://..."
                        className="bg-bg-base border-border-subtle focus-visible:ring-accent-primary text-text-primary placeholder:text-text-muted h-9 text-xs rounded-xl"
                      />
                    </div>

                    {/* SEO Title */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-mono font-bold text-text-muted uppercase tracking-wider block">
                        SEO Meta Title
                      </label>
                      <Input
                        value={seoTitle}
                        onChange={(e) => setSeoTitle(e.target.value)}
                        onBlur={() => updatePublishSettings({ seoTitle })}
                        placeholder="Title for search indexing"
                        className="bg-bg-base border-border-subtle focus-visible:ring-accent-primary text-text-primary placeholder:text-text-muted h-9 text-xs rounded-xl"
                      />
                    </div>

                    {/* SEO Description */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-mono font-bold text-text-muted uppercase tracking-wider block">
                        SEO Description
                      </label>
                      <textarea
                        value={seoDescription}
                        onChange={(e) => setSeoDescription(e.target.value)}
                        onBlur={() => updatePublishSettings({ seoDescription })}
                        rows={3}
                        placeholder="Brief summary for search engines"
                        className="w-full bg-bg-base border border-border-subtle rounded-xl p-2.5 text-xs text-text-primary placeholder:text-text-muted focus:border-accent-primary focus:outline-none resize-none"
                      />
                    </div>

                    {/* Schedule Date */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-mono font-bold text-text-muted uppercase tracking-wider block">
                        Scheduled Publication Date
                      </label>
                      <Input
                        type="date"
                        value={scheduledAt}
                        onChange={(e) => setScheduledAt(e.target.value)}
                        onBlur={() =>
                          updatePublishSettings({
                            scheduledAt: scheduledAt || undefined,
                          })
                        }
                        className="bg-bg-base border-border-subtle focus-visible:ring-accent-primary text-text-primary h-9 text-xs rounded-xl"
                      />
                    </div>
                  </div>
                ) : (
                  /* History tab */
                  <div className="p-4 space-y-3">
                    {isLoadingHistory ? (
                      <div className="flex items-center justify-center py-8 text-text-muted gap-2">
                        <Loader2 className="size-4 animate-spin text-accent-primary" />
                        <span className="text-xs font-mono">Loading version history...</span>
                      </div>
                    ) : history.length === 0 ? (
                      <p className="text-xs text-text-muted italic text-center py-8 border border-dashed border-border-subtle rounded-xl">
                        No snapshots yet. Click Snapshot in the top bar to save a version.
                      </p>
                    ) : (
                      history.map((v) => (
                        <div
                          key={v._id}
                          className="p-3 bg-bg-elevated/40 border border-border-subtle hover:border-border-default rounded-xl space-y-2 text-xs transition-colors group"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-text-primary truncate">
                              {v.title}
                            </span>
                            <span className="text-[10px] font-mono text-text-muted shrink-0">
                              {new Date(v.updatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </span>
                          </div>
                          <div className="flex items-center justify-between pt-1 border-t border-border-subtle/50">
                            <span className="text-[10px] text-text-muted font-mono">
                              {new Date(v.updatedAt).toLocaleDateString()}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => rollbackVersion(v._id)}
                              className="h-6 text-[10px] font-mono text-accent-primary hover:text-accent-primary-hover px-2 rounded-md hover:bg-accent-primary/10 cursor-pointer"
                            >
                              Restore
                            </Button>
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

  /* Empty state: No note selected */
  return (
    <div className="notes-page-root flex-1 flex flex-col items-center justify-center bg-bg-base text-center px-6 pb-20 lg:pb-0 select-none relative overflow-hidden antialiased">
      {/* Subtle ambient lighting */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-accent-primary/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 w-full max-w-sm rounded-2xl bg-bg-surface border border-border-subtle p-6 sm:p-8 flex flex-col items-center gap-5 shadow-xl">
        <div className="size-12 rounded-xl bg-accent-primary/10 border border-accent-primary/20 flex items-center justify-center text-accent-primary">
          <BookOpen className="size-6" />
        </div>

        <div className="space-y-1.5">
          <h2 className="text-base sm:text-lg font-bold text-text-primary font-display">
            No note selected
          </h2>
          <p className="text-text-muted text-xs leading-relaxed">
            Select an existing note from the sidebar tree or generate an in-depth academic study note.
          </p>
        </div>

        <div className="flex flex-col gap-2.5 items-center w-full">
          <Button
            onClick={() => setShowTopicModal(true)}
            className="btn-premium-primary w-full text-xs h-10 flex items-center justify-center gap-2 cursor-pointer"
          >
            <Wand2 className="size-3.5" />
            <span>AI Generate Note (2,000+ Words)</span>
          </Button>

          <Button
            onClick={() => createNote("Untitled Note", null)}
            className="w-full rounded-xl bg-bg-elevated border border-border-subtle hover:bg-bg-elevated/80 text-text-primary font-medium text-xs h-9 flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <Plus className="size-3.5 text-text-muted" />
            <span>New Blank Note</span>
          </Button>

          <label className="cursor-pointer text-text-muted hover:text-text-primary text-xs flex items-center gap-1.5 transition-colors pt-1 font-mono">
            <FileUp className="size-3.5 text-accent-primary" />
            <span>{isImporting ? "Importing..." : "Import .txt / .md / .pdf"}</span>
            <input
              type="file"
              accept=".txt,.md,.pdf,application/pdf"
              onChange={handleFileUpload}
              className="sr-only"
              disabled={isImporting}
            />
          </label>
        </div>
      </div>

      <TopicGeneratorModal
        isOpen={showTopicModal}
        onClose={() => setShowTopicModal(false)}
        onGenerate={async (newTopic, contentHtml) => {
          const paragraphs = contentHtml.split("</p>").map((p) => ({
            type: "paragraph",
            content: [{ type: "text", text: p.replace(/<[^>]*>?/gm, "").trim() }],
          })).filter((p) => p.content[0].text);

          const newNote = await createNote(newTopic, null);
          if (newNote) {
            await updateNote(newNote._id, {
              title: newTopic,
              content: {
                type: "doc",
                content: [
                  { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: newTopic }] },
                  ...paragraphs,
                ],
              },
            });
            setActiveNoteId(newNote._id);
          }
        }}
      />
    </div>
  );
}
