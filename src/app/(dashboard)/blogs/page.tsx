"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  Rss,
  Plus,
  Trash2,
  ChevronLeft,
  Loader2,
  Bookmark,
  Edit2,
  Settings,
  Bold,
  Italic,
  Heading1,
  Heading2,
  Link as LinkIcon,
  Code,
  Quote,
  List,
  Image as ImageIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { MarkdownRenderer } from "@/components/ui/MarkdownRenderer";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { useAlertStore } from "@/stores/alertStore";

interface BlogData {
  _id: string;
  title: string;
  content: string;
  summary: string;
  coverImage?: string;
  published: boolean;
  userId: string;
  userName: string;
  createdAt: string;
}

export default function BlogsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 flex items-center justify-center bg-neutral-950 text-neutral-500 select-none gap-2">
          <Loader2 className="h-5 w-5 animate-spin text-cyan-400" />
          <span
            className="text-xs font-bold uppercase tracking-widest"
            style={{ fontFamily: "var(--font-jetbrains-mono)" }}
          >
            Loading blogs...
          </span>
        </div>
      }
    >
      <BlogsPageContent />
    </Suspense>
  );
}

function BlogsPageContent() {
  const { data: session } = useSession();
  const currentUserId = session?.user?.id;
  const { showAlert, showConfirm } = useAlertStore();

  const [blogs, setBlogs] = useState<BlogData[]>([]);
  const [activeTab, setActiveTab] = useState<"feed" | "mine">("feed");
  const [selectedBlog, setSelectedBlog] = useState<BlogData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Editor states
  const [editingBlog, setEditingBlog] = useState<BlogData | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [summary, setSummary] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [published, setPublished] = useState(false);
  const [showPanel, setShowPanel] = useState(true);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");

  const searchParams = useSearchParams();
  const blogIdParam = searchParams.get("blogId");

  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMountedRef = useRef(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Sync editor fields when editingBlog is loaded
  useEffect(() => {
    if (editingBlog) {
      setTitle(editingBlog.title || "");
      setContent(editingBlog.content || "");
      setSummary(editingBlog.summary || "");
      setCoverImage(editingBlog.coverImage || "");
      setPublished(editingBlog.published || false);
    }
  }, [editingBlog]);

  // Auto-load blog if blogId query parameter is present
  useEffect(() => {
    const loadSpecificBlog = async () => {
      if (!blogIdParam) return;
      try {
        const res = await fetch(`/api/blogs/${blogIdParam}`);
        if (res.ok) {
          const data = await res.json();
          setSelectedBlog(data);
        }
      } catch (e) {
        console.error("load specific blog error:", e);
      }
    };
    loadSpecificBlog();
  }, [blogIdParam]);

  // Track latest state values to prevent stale closures in debounced saves
  const latestTitleRef = useRef(title);
  const latestContentRef = useRef(content);
  const latestSummaryRef = useRef(summary);
  const latestCoverImageRef = useRef(coverImage);
  const latestPublishedRef = useRef(published);

  useEffect(() => { latestTitleRef.current = title; }, [title]);
  useEffect(() => { latestContentRef.current = content; }, [content]);
  useEffect(() => { latestSummaryRef.current = summary; }, [summary]);
  useEffect(() => { latestCoverImageRef.current = coverImage; }, [coverImage]);
  useEffect(() => { latestPublishedRef.current = published; }, [published]);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, []);

  const fetchBlogs = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/blogs?userOnly=${activeTab === "mine"}`);
      if (res.ok) {
        const data = await res.json();
        setBlogs(data);
      }
    } catch (e) {
      console.error("fetch blogs error:", e);
    } finally {
      setIsLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchBlogs();
  }, [fetchBlogs]);

  // Debounced Autosave Handler
  const triggerAutosave = () => {
    if (!editingBlog) return;
    setSaveState("saving");
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

    saveTimeoutRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/blogs/${editingBlog._id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: latestTitleRef.current,
            content: latestContentRef.current,
            summary: latestSummaryRef.current,
            coverImage: latestCoverImageRef.current,
            published: latestPublishedRef.current,
          }),
        });
        if (res.ok) {
          if (isMountedRef.current) setSaveState("saved");
        }
      } catch (err) {
        console.error("Autosave error:", err);
      } finally {
        setTimeout(() => {
          if (isMountedRef.current) setSaveState("idle");
        }, 1500);
      }
    }, 1000);
  };

  const handleCreateBlog = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/blogs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Untitled Blog",
          summary: "A brief summary of your blog post.",
          content: "# Welcome to your new blog\nStart writing here...",
          coverImage: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&q=80",
          published: false,
        }),
      });
      if (res.ok) {
        const newBlog = await res.json();
        setEditingBlog(newBlog);
        fetchBlogs();
      }
    } catch (e) {
      console.error("submit blog error:", e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTogglePublish = async (blogId: string, currentVal: boolean) => {
    try {
      const res = await fetch(`/api/blogs/${blogId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ published: !currentVal }),
      });
      if (res.ok) {
        fetchBlogs();
      }
    } catch (e) {
      console.error("toggle publish error:", e);
    }
  };

  const handleDelete = async (blogId: string) => {
    showConfirm(
      "Delete Blog",
      "Are you sure you want to delete this blog post? This action is permanent.",
      async () => {
        try {
          const res = await fetch(`/api/blogs/${blogId}`, {
            method: "DELETE",
          });
          if (res.ok) {
            if (editingBlog?._id === blogId) {
              setEditingBlog(null);
            }
            setSelectedBlog(null);
            fetchBlogs();
          }
        } catch (e) {
          console.error("delete blog error:", e);
        }
      }
    );
  };

  const handleBookmark = async (blogItem: BlogData) => {
    try {
      const permalink = `${window.location.origin}/blogs?blogId=${blogItem._id}`;
      const res = await fetch("/api/bookmarks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: blogItem.title,
          url: permalink,
          category: "Blogs",
        }),
      });
      if (res.ok) {
        showAlert("Bookmarked", "Blog article added to bookmarks!");
      } else {
        const errData = await res.json();
        showAlert("Bookmark Failed", errData.error || "Failed to bookmark blog article.");
      }
    } catch (e) {
      console.error(e);
      showAlert("Bookmark Error", "Error bookmarking blog article.");
    }
  };

  // Helper to inject Markdown tags at the current cursor selection
  const insertMarkdown = (before: string, after = "") => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;

    const selectedText = text.substring(start, end);
    const replacement = before + selectedText + after;

    const newContent = text.substring(0, start) + replacement + text.substring(end);
    setContent(newContent);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + before.length, start + before.length + selectedText.length);
    }, 0);

    triggerAutosave();
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const { url } = await res.json();
        insertMarkdown(`![${file.name}](${url})`);
      } else {
        showAlert("Upload Failed", "Failed to upload image.");
      }
    } catch (err) {
      console.error(err);
      showAlert("Upload Error", "Error uploading image.");
    } finally {
      setIsUploadingImage(false);
    }
  };

  /* ── VIEW 1: Full-Screen Blog Editor Workspace ── */
  if (editingBlog) {
    const wordCount = content.trim().split(/\s+/).filter(Boolean).length;

    return (
      <div className="flex-1 flex h-full bg-neutral-950 overflow-hidden relative">
        {/* Main Editor Panel */}
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          {/* Editor Header */}
          <div className="h-14 border-b border-neutral-900 bg-neutral-950 px-6 flex items-center justify-between shrink-0 select-none">
            <div className="flex items-center gap-4 text-xs text-neutral-400">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
                  // Quick final save before leaving
                  fetch(`/api/blogs/${editingBlog._id}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      title: latestTitleRef.current,
                      content: latestContentRef.current,
                      summary: latestSummaryRef.current,
                      coverImage: latestCoverImageRef.current,
                      published: latestPublishedRef.current,
                    }),
                  }).then(() => {
                    fetchBlogs();
                    setEditingBlog(null);
                  });
                }}
                className="h-8 text-neutral-400 hover:text-neutral-100 hover:bg-neutral-900 text-[11px] gap-1.5 transition-all"
              >
                <ChevronLeft className="h-3.5 w-3.5" /> Back
              </Button>
              <div className="w-px h-3 bg-neutral-800" />
              <input
                type="text"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  triggerAutosave();
                }}
                placeholder="Untitled Blog"
                className="text-sm font-bold text-neutral-200 bg-transparent focus:outline-none placeholder-neutral-700 min-w-0 max-w-[200px] md:max-w-[400px]"
                style={{ fontFamily: "var(--font-space-grotesk)" }}
              />
              <div className="w-px h-3 bg-neutral-800 hidden sm:block" />
              <span className="hidden sm:inline font-mono" style={{ fontFamily: "var(--font-jetbrains-mono)" }}>
                {wordCount} words
              </span>
              {/* Autosave Status Indicator */}
              <div className="flex items-center gap-1.5">
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
                  className="text-[10px] text-neutral-600 font-bold"
                  style={{ fontFamily: "var(--font-jetbrains-mono)" }}
                >
                  {saveState === "saving" ? "SAVING" : saveState === "saved" ? "SAVED" : "AUTO"}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowPanel(!showPanel)}
                className={`h-8 text-[11px] gap-1.5 transition-all ${
                  showPanel
                    ? "bg-neutral-900 text-neutral-100 border border-neutral-800"
                    : "text-neutral-400 hover:text-neutral-100 hover:bg-neutral-900"
                }`}
              >
                <Settings className="h-3.5 w-3.5" /> Blog Settings
              </Button>
            </div>
          </div>

          {/* Markdown Toolbar */}
          <div className="flex flex-wrap items-center gap-1.5 p-3 border-b border-neutral-900 bg-neutral-900/10 shrink-0 select-none">
            <Button
              size="icon"
              variant="ghost"
              type="button"
              onClick={() => insertMarkdown("**", "**")}
              title="Bold"
              className="h-8 w-8 text-neutral-450 hover:text-white hover:bg-neutral-900"
            >
              <Bold className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              type="button"
              onClick={() => insertMarkdown("*", "*")}
              title="Italic"
              className="h-8 w-8 text-neutral-450 hover:text-white hover:bg-neutral-900"
            >
              <Italic className="h-4 w-4" />
            </Button>
            <div className="w-[1px] h-5 bg-neutral-900 mx-1" />
            <Button
              size="icon"
              variant="ghost"
              type="button"
              onClick={() => insertMarkdown("# ")}
              title="Heading 1"
              className="h-8 w-8 text-neutral-450 hover:text-white hover:bg-neutral-900"
            >
              <Heading1 className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              type="button"
              onClick={() => insertMarkdown("## ")}
              title="Heading 2"
              className="h-8 w-8 text-neutral-450 hover:text-white hover:bg-neutral-900"
            >
              <Heading2 className="h-4 w-4" />
            </Button>
            <div className="w-[1px] h-5 bg-neutral-900 mx-1" />
            <Button
              size="icon"
              variant="ghost"
              type="button"
              onClick={() => insertMarkdown("- ")}
              title="Bullet List"
              className="h-8 w-8 text-neutral-450 hover:text-white hover:bg-neutral-900"
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              type="button"
              onClick={() => insertMarkdown("\n```\n", "\n```\n")}
              title="Code Block"
              className="h-8 w-8 text-neutral-450 hover:text-white hover:bg-neutral-900"
            >
              <Code className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              type="button"
              onClick={() => insertMarkdown("> ")}
              title="Blockquote"
              className="h-8 w-8 text-neutral-455 hover:text-white hover:bg-neutral-900"
            >
              <Quote className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              type="button"
              onClick={() => insertMarkdown("[", "](url)")}
              title="Insert Link"
              className="h-8 w-8 text-neutral-455 hover:text-white hover:bg-neutral-900"
            >
              <LinkIcon className="h-4 w-4" />
            </Button>
            <div className="w-[1px] h-5 bg-neutral-900 mx-1" />
            <label
              className="h-8 w-8 rounded-md flex items-center justify-center cursor-pointer hover:bg-neutral-900 text-neutral-455 hover:text-white transition-colors"
              title="Upload Image"
            >
              {isUploadingImage ? (
                <Loader2 className="h-4 w-4 animate-spin text-cyan-400" />
              ) : (
                <ImageIcon className="h-4 w-4" />
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                disabled={isUploadingImage}
              />
            </label>
          </div>

          {/* Workspaces: Split Screen grid */}
          <div className="flex-1 flex overflow-hidden p-3 sm:p-6 gap-4 sm:gap-6">
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 h-full overflow-hidden">
              {/* Left Column: Markdown editor */}
              <div className="flex flex-col h-full bg-neutral-955/30 backdrop-blur-md border border-white/5 rounded-2xl p-4 focus-within:border-neutral-800 transition-colors overflow-hidden">
                <textarea
                  ref={textareaRef}
                  value={content}
                  onChange={(e) => {
                    setContent(e.target.value);
                    triggerAutosave();
                  }}
                  placeholder="Write your blog article in markdown here..."
                  className="w-full flex-1 bg-transparent text-neutral-100 placeholder-neutral-800 text-xs focus:outline-none resize-none font-mono leading-relaxed overflow-y-auto custom-scroll"
                  style={{ fontFamily: "var(--font-jetbrains-mono)" }}
                />
              </div>

              {/* Right Column: Live Markdown Preview */}
              <div className="h-full bg-neutral-955/30 backdrop-blur-md border border-white/5 rounded-2xl p-6 overflow-y-auto custom-scroll relative">
                <div
                  className="absolute top-3 right-3 text-[9px] font-bold text-neutral-700 select-none uppercase tracking-widest"
                  style={{ fontFamily: "var(--font-jetbrains-mono)" }}
                >
                  Live Preview
                </div>
                <article className="prose prose-invert max-w-none">
                  {content ? (
                    <MarkdownRenderer content={content} />
                  ) : (
                    <p className="text-neutral-600 text-xs italic">Start writing to see the preview here...</p>
                  )}
                </article>
              </div>
            </div>
          </div>
        </div>

        {/* Collapsible settings panel */}
        {showPanel && (
          <aside className="w-80 border-l border-neutral-900 bg-neutral-950 flex flex-col shrink-0 h-full overflow-hidden select-none">
            <div className="h-14 border-b border-neutral-900 px-5 flex items-center shrink-0">
              <span
                className="text-[10px] font-bold text-neutral-200 uppercase tracking-widest"
                style={{ fontFamily: "var(--font-space-grotesk)" }}
              >
                Blog Settings
              </span>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-6 custom-scroll text-xs">
              {/* Published Switch */}
              <div className="flex items-center justify-between border-b border-neutral-900 pb-4">
                <div className="space-y-0.5">
                  <span
                    className="text-[10px] font-bold text-neutral-200 uppercase tracking-wider block"
                    style={{ fontFamily: "var(--font-space-grotesk)" }}
                  >
                    Publish Post
                  </span>
                  <p className="text-[10px] text-neutral-500 leading-normal">
                    Make this blog visible in the public feed.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const next = !published;
                    setPublished(next);
                    triggerAutosave();
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

              {/* Cover Image URL */}
              <div className="space-y-1.5">
                <label
                  className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block"
                  style={{ fontFamily: "var(--font-space-grotesk)" }}
                >
                  Cover Image URL
                </label>
                <Input
                  value={coverImage}
                  onChange={(e) => {
                    setCoverImage(e.target.value);
                    triggerAutosave();
                  }}
                  placeholder="https://example.com/cover.jpg"
                  className="bg-neutral-950 border-neutral-850 focus:border-cyan-400 text-neutral-100 placeholder-neutral-700 h-9 text-[11px]"
                />
                {coverImage && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={coverImage}
                    alt="Cover preview"
                    className="w-full h-24 object-cover rounded-lg border border-neutral-900 mt-2"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = "none";
                    }}
                  />
                )}
              </div>

              {/* Summary Description */}
              <div className="space-y-1.5">
                <label
                  className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block"
                  style={{ fontFamily: "var(--font-space-grotesk)" }}
                >
                  Summary Description
                </label>
                <textarea
                  value={summary}
                  onChange={(e) => {
                    setSummary(e.target.value);
                    triggerAutosave();
                  }}
                  rows={4}
                  placeholder="Short excerpt shown on the cards..."
                  className="w-full bg-neutral-950 border border-neutral-850 focus:border-cyan-400 rounded-xl px-3 py-2 text-neutral-100 text-[11px] placeholder-neutral-700 outline-none resize-none transition-colors"
                />
              </div>

              {/* Danger Zone */}
              <div className="pt-4 border-t border-neutral-900 space-y-3">
                <span
                  className="text-[10px] font-bold text-red-400 uppercase tracking-wider block"
                  style={{ fontFamily: "var(--font-space-grotesk)" }}
                >
                  Danger Zone
                </span>
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => handleDelete(editingBlog._id)}
                  className="w-full bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white border border-red-500/20 hover:border-red-500 h-9 font-bold text-xs rounded-xl transition-all"
                  style={{ fontFamily: "var(--font-space-grotesk)" }}
                >
                  Delete Blog Post
                </Button>
              </div>
            </div>
          </aside>
        )}
      </div>
    );
  }

  /* ── VIEW 2: Blog Reader View (Detail Pane) ── */
  if (selectedBlog) {
    const isOwner = currentUserId === selectedBlog.userId;

    return (
      <div className="flex-1 flex flex-col h-full bg-neutral-950 overflow-y-auto custom-scroll relative">
        <div className="border-b border-neutral-900 bg-neutral-950/80 backdrop-blur-md px-4 sm:px-8 py-3 sm:py-6 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <Button
            variant="ghost"
            onClick={() => setSelectedBlog(null)}
            className="text-neutral-450 hover:text-neutral-100 text-xs font-bold gap-1.5 px-3 h-9 transition-colors"
            style={{ fontFamily: "var(--font-space-grotesk)" }}
          >
            <ChevronLeft className="h-4 w-4" /> Back to Blogs
          </Button>

          <div className="flex items-center gap-2">
            {isOwner && (
              <Button
                variant="outline"
                onClick={() => {
                  setEditingBlog(selectedBlog);
                  setSelectedBlog(null);
                }}
                className="border-neutral-800 text-neutral-350 hover:text-white bg-neutral-900 text-xs font-bold h-9 gap-1.5"
                style={{ fontFamily: "var(--font-space-grotesk)" }}
              >
                <Edit2 className="h-4 w-4" /> Edit Blog
              </Button>
            )}

            <Button
              variant="ghost"
              onClick={() => handleBookmark(selectedBlog)}
              className="text-neutral-450 hover:text-cyan-400 text-xs font-bold gap-1.5 px-3 h-9 transition-colors"
              style={{ fontFamily: "var(--font-space-grotesk)" }}
            >
              <Bookmark className="h-4 w-4" /> Bookmark
            </Button>
          </div>
        </div>

        <div className="max-w-2xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-6 z-10 relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={selectedBlog.coverImage || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&q=80"}
            alt={selectedBlog.title}
            className="w-full h-64 object-cover rounded-2xl border border-neutral-900 shadow-xl"
          />

          <div className="space-y-3">
            <h1
              className="text-3xl font-extrabold text-neutral-100 leading-tight tracking-tight"
              style={{ fontFamily: "var(--font-space-grotesk)" }}
            >
              {selectedBlog.title}
            </h1>
            <div
              className="flex items-center gap-2 text-xs text-neutral-500"
              style={{ fontFamily: "var(--font-jetbrains-mono)" }}
            >
              <span>
                By:{" "}
                <Link
                  href={`/user/${selectedBlog.userId}`}
                  className="text-neutral-350 hover:text-cyan-400 transition-colors"
                >
                  {selectedBlog.userName}
                </Link>
              </span>
              <span>•</span>
              <span>{new Date(selectedBlog.createdAt).toLocaleDateString()}</span>
            </div>
          </div>

          <div className="border-l-2 border-cyan-400 pl-4 py-1 italic text-neutral-400 text-sm leading-relaxed">
            {selectedBlog.summary}
          </div>

          <hr className="border-neutral-900" />

          {/* Render article markdown context safely */}
          <div className="prose prose-invert max-w-none">
            <MarkdownRenderer content={selectedBlog.content} />
          </div>
        </div>
      </div>
    );
  }

  /* ── VIEW 3: Blogs List View ── */
  return (
    <div className="flex-1 flex flex-col h-full bg-neutral-950 overflow-y-auto custom-scroll relative">
      {/* Ambient background glows */}
      <div className="absolute top-0 right-1/4 w-[500px] h-[300px] bg-cyan-500/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Top Banner */}
      <div className="border-b border-neutral-900 bg-neutral-950/80 backdrop-blur-md px-4 sm:px-8 py-4 sm:py-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shrink-0 select-none z-10 relative">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Rss className="h-5 w-5 text-cyan-400" />
            <h1
              className="text-xl font-bold text-neutral-100 tracking-tight"
              style={{ fontFamily: "var(--font-space-grotesk)" }}
            >
              Scholar Blogs
            </h1>
          </div>
          <p className="text-neutral-500 text-xs">
            Publish articles, share study guides, and get upvoted to score Leaderboard points.
          </p>
        </div>

        <Button
          onClick={handleCreateBlog}
          className="bg-cyan-500 hover:bg-cyan-400 text-neutral-955 text-xs font-bold gap-1.5 h-9 px-4 rounded-lg shadow-[0_0_12px_rgba(6,182,212,0.25)] transition-all"
          style={{ fontFamily: "var(--font-space-grotesk)" }}
        >
          <Plus className="h-4 w-4" /> Create Blog
        </Button>
      </div>

      {/* Content wrapper */}
      <div className="p-4 sm:p-8 space-y-6 max-w-5xl w-full mx-auto z-10 relative">
        <div className="flex items-center gap-2 border-b border-neutral-900 pb-2 select-none">
          <button
            onClick={() => setActiveTab("feed")}
            className={`text-xs font-bold px-3 py-1.5 rounded-lg uppercase tracking-wider transition-all ${
              activeTab === "feed"
                ? "bg-neutral-900 border border-neutral-800 text-neutral-100"
                : "text-neutral-500 hover:text-neutral-300"
            }`}
            style={{ fontFamily: "var(--font-space-grotesk)" }}
          >
            Published Feed
          </button>
          <button
            onClick={() => setActiveTab("mine")}
            className={`text-xs font-bold px-3 py-1.5 rounded-lg uppercase tracking-wider transition-all ${
              activeTab === "mine"
                ? "bg-neutral-900 border border-neutral-800 text-neutral-100"
                : "text-neutral-500 hover:text-neutral-300"
            }`}
            style={{ fontFamily: "var(--font-space-grotesk)" }}
          >
            My Drafts &amp; Blogs
          </button>
        </div>

        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center text-neutral-500 text-xs gap-2 select-none font-semibold">
            <Loader2 className="h-6 w-6 animate-spin text-cyan-400" />
            <span style={{ fontFamily: "var(--font-jetbrains-mono)" }}>RETRIEVING ARTICLES...</span>
          </div>
        ) : blogs.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center text-center space-y-4 border border-dashed border-neutral-900 rounded-2xl bg-neutral-900/5 select-none">
            <Rss className="h-10 w-10 text-neutral-700" />
            <div className="space-y-1">
              <h3 className="text-neutral-300 font-bold text-sm" style={{ fontFamily: "var(--font-space-grotesk)" }}>
                No articles found
              </h3>
              <p className="text-neutral-500 text-xs max-w-xs leading-normal">
                {activeTab === "mine"
                  ? "You haven't written any articles yet."
                  : "No published articles available inside the feed."}
              </p>
            </div>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {blogs.map((blogItem) => {
              const isOwner = currentUserId === blogItem.userId;

              return (
                <div
                  key={blogItem._id}
                  onClick={() => {
                    if (isOwner) {
                      setEditingBlog(blogItem);
                    } else {
                      setSelectedBlog(blogItem);
                    }
                  }}
                  className="group bg-neutral-955/30 backdrop-blur-md border border-white/5 hover:border-cyan-500/20 hover:shadow-[0_0_20px_rgba(6,182,212,0.06)] rounded-xl overflow-hidden cursor-pointer transition-all duration-300 flex flex-col"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={blogItem.coverImage || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=500&q=80"}
                    alt={blogItem.title}
                    className="w-full h-40 object-cover border-b border-neutral-900 group-hover:scale-[1.01] transition-transform duration-300"
                  />

                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-2">
                      <h2
                        className="text-sm font-bold text-neutral-100 group-hover:text-cyan-400 transition-colors line-clamp-2"
                        style={{ fontFamily: "var(--font-space-grotesk)" }}
                      >
                        {blogItem.title}
                      </h2>
                      <p className="text-neutral-450 text-[11px] leading-relaxed line-clamp-3">
                        {blogItem.summary}
                      </p>
                    </div>

                    <div className="space-y-3 pt-3 border-t border-neutral-900/60">
                      <div
                        className="flex items-center justify-between text-[10px] text-neutral-500 select-none font-bold"
                        style={{ fontFamily: "var(--font-space-grotesk)" }}
                      >
                        <span>
                          By:{" "}
                          <Link
                            href={`/user/${blogItem.userId}`}
                            className="text-neutral-400 hover:text-cyan-400 transition-colors"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {blogItem.userName}
                          </Link>
                        </span>
                        <span style={{ fontFamily: "var(--font-jetbrains-mono)" }}>
                          {new Date(blogItem.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      <div
                        className="flex items-center justify-between pt-1 select-none"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {isOwner ? (
                          <button
                            onClick={() => handleTogglePublish(blogItem._id, blogItem.published)}
                            className={`text-[9px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider transition-all ${
                              blogItem.published
                                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                                : "bg-neutral-950 border-neutral-850 text-neutral-500"
                            }`}
                            style={{ fontFamily: "var(--font-space-grotesk)" }}
                          >
                            {blogItem.published ? "Published" : "Draft"}
                          </button>
                        ) : (
                          <div />
                        )}
                        <div className="flex items-center gap-2">
                          {isOwner && (
                            <button
                              onClick={() => setEditingBlog(blogItem)}
                              className="p-1 rounded hover:bg-neutral-900 text-neutral-550 hover:text-cyan-400 transition-colors"
                              title="Edit blog"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => handleBookmark(blogItem)}
                            className="p-1 rounded hover:bg-neutral-900 text-neutral-550 hover:text-cyan-400 transition-colors"
                            title="Bookmark article"
                          >
                            <Bookmark className="h-3.5 w-3.5" />
                          </button>
                          {isOwner && (
                            <button
                              onClick={() => handleDelete(blogItem._id)}
                              className="p-1 rounded hover:bg-neutral-900 text-neutral-550 hover:text-red-400 transition-colors"
                              title="Delete blog"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
