/* eslint-disable @next/next/no-img-element */
"use client";

export const dynamic = "force-dynamic";

import React, { useEffect, useState, useCallback, useRef, Suspense } from "react";
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
  ArrowUpRight,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSession } from "next-auth/react";
import { BlogContentRenderer } from "@/components/blog/BlogContentRenderer";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAlertStore } from "@/stores/alertStore";
import { motion } from "framer-motion";
import { TopicGeneratorModal } from "@/components/notes/TopicGeneratorModal";
import { NoteSideChat } from "@/components/notes/NoteSideChat";

interface BlogData {
  _id: string;
  title: string;
  slug?: string;
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
        <div className="flex-1 flex items-center justify-center bg-transparent text-[#8A8078] select-none gap-2">
          <Loader2 className="size-5 animate-spin text-[#F5B429]" />
          <span className="text-xs font-mono font-bold uppercase tracking-widest text-[#8A8078]">
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
  const [editorPanelTab, setEditorPanelTab] = useState<"chat" | "settings">("chat");
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");
  const [showTopicModal, setShowTopicModal] = useState(false);

  const searchParams = useSearchParams();
  const blogIdParam = searchParams.get("blogId");

  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMountedRef = useRef(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (editingBlog) {
      setTitle(editingBlog.title || "");
      setContent(editingBlog.content || "");
      setSummary(editingBlog.summary || "");
      setCoverImage(editingBlog.coverImage || "");
      setPublished(editingBlog.published || false);
    }
  }, [editingBlog]);

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
          content: "# Welcome to your new blog post\n\nStart writing markdown content here...",
        }),
      });
      if (res.ok) {
        const newBlog = await res.json();
        setEditingBlog(newBlog);
      }
    } catch (e) {
      console.error("create blog error:", e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteBlog = async (blogId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    showConfirm(
      "Delete Blog",
      "Are you sure you want to delete this blog post? This action cannot be undone.",
      async () => {
        try {
          const res = await fetch(`/api/blogs/${blogId}`, { method: "DELETE" });
          if (res.ok) {
            setBlogs((prev) => prev.filter((b) => b._id !== blogId));
            if (selectedBlog?._id === blogId) setSelectedBlog(null);
            if (editingBlog?._id === blogId) setEditingBlog(null);
          }
        } catch (e) {
          console.error("delete blog error:", e);
        }
      }
    );
  };

  const handleBookmark = async (blog: BlogData, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const permalink = `${window.location.origin}/blogs?blogId=${blog._id}`;
      const res = await fetch("/api/bookmarks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: blog.title,
          url: permalink,
          category: "Blog",
        }),
      });
      if (res.ok) {
        showAlert("Bookmarked", "Blog post saved to your bookmarks!");
      } else {
        const errData = await res.json();
        showAlert("Bookmark Failed", errData.error || "Failed to bookmark blog post.");
      }
    } catch (e) {
      console.error(e);
      showAlert("Bookmark Error", "An error occurred while saving bookmark.");
    }
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
        const data = await res.json();
        setCoverImage(data.url);
        triggerAutosave();
      } else {
        showAlert("Upload Failed", "Could not upload cover image. Please try again.");
      }
    } catch (err) {
      console.error(err);
      showAlert("Upload Error", "An error occurred while uploading cover image.");
    } finally {
      setIsUploadingImage(false);
    }
  };

  const insertMarkdown = (prefix: string, suffix = "") => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const previousText = textarea.value;
    const selectedText = previousText.substring(start, end);

    const replacement = `${prefix}${selectedText || "text"}${suffix}`;
    const newText = previousText.substring(0, start) + replacement + previousText.substring(end);

    setContent(newText);
    triggerAutosave();

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length + (selectedText.length || 4));
    }, 0);
  };

  if (editingBlog) {
    return (
      <div className="flex-1 flex flex-col h-full bg-transparent text-[#FAFAF8] overflow-hidden antialiased relative">
        <div className="border-b border-[#2E2118] bg-[#0A0806]/85 px-6 py-4 flex items-center justify-between shrink-0 select-none backdrop-blur-xl">
          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                setEditingBlog(null);
                fetchBlogs();
              }}
              className="flex items-center gap-1.5 text-xs font-mono text-[#8A8078] hover:text-[#FAFAF8] transition-colors font-display cursor-pointer"
            >
              <ChevronLeft className="size-4" /> Back to Blogs
            </button>
            <div className="h-4 w-px bg-[#2E2118]" />
            <span className="text-xs font-mono font-bold text-[#F5B429] uppercase tracking-widest flex items-center gap-2">
              <Edit2 className="size-3.5" /> Blog Editor
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[10px] font-mono font-bold uppercase text-[#8A8078]">
              {saveState === "saving" ? "Saving..." : saveState === "saved" ? "Saved ✓" : published ? "Published" : "Draft"}
            </span>

            <div className="flex items-center gap-1 bg-[#150F0B] border border-[#2E2118] p-1 rounded-xl">
              <Button
                onClick={() => {
                  if (showPanel && editorPanelTab === "chat") {
                    setShowPanel(false);
                  } else {
                    setEditorPanelTab("chat");
                    setShowPanel(true);
                  }
                }}
                variant="ghost"
                size="sm"
                className={`text-xs font-mono font-bold h-7 px-3 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                  showPanel && editorPanelTab === "chat"
                    ? "bg-[#F5B429]/20 text-[#FCD34D] border border-[#F5B429]/30"
                    : "text-[#8A8078] hover:text-[#FAFAF8]"
                }`}
              >
                <Sparkles className="size-3 text-[#F5B429]" />
                <span>AI Chat</span>
              </Button>

              <Button
                onClick={() => {
                  if (showPanel && editorPanelTab === "settings") {
                    setShowPanel(false);
                  } else {
                    setEditorPanelTab("settings");
                    setShowPanel(true);
                  }
                }}
                variant="ghost"
                size="sm"
                className={`text-xs font-mono font-bold h-7 px-3 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                  showPanel && editorPanelTab === "settings"
                    ? "bg-[#241811] text-[#FAFAF8] border border-[#2E2118]"
                    : "text-[#8A8078] hover:text-[#FAFAF8]"
                }`}
              >
                <Settings className="size-3.5" />
                <span>Settings</span>
              </Button>
            </div>

            <Button
              onClick={() => {
                const nextPub = !published;
                setPublished(nextPub);
                triggerAutosave();
              }}
              className={`rounded-xl text-xs font-bold px-5 h-9 transition-all font-display cursor-pointer ${
                published
                  ? "bg-[#150F0B] border border-[#2E2118] text-[#FAFAF8] hover:bg-[#241811]"
                  : "bg-gradient-to-r from-[#F7C948] to-[#F5941D] text-[#150F0B] shadow-[0_0_15px_rgba(245,180,41,0.25)]"
              }`}
            >
              {published ? "Published ✓" : "Publish Blog"}
            </Button>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          <div className="flex-1 flex flex-col p-6 overflow-y-auto space-y-6 max-w-4xl mx-auto w-full custom-scroll">
            <Input
              type="text"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="none"
              spellCheck={false}
              data-lpignore="true"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                triggerAutosave();
              }}
              placeholder="Blog Title..."
              className="bg-transparent border-none text-2xl sm:text-3xl font-bold text-[#FAFAF8] placeholder-[#8A8078]/50 focus-visible:ring-0 px-0 h-auto font-display"
            />

            <div className="flex items-center gap-1 border-y border-[#2E2118] py-2 select-none flex-wrap">
              <Button
                type="button"
                onClick={() => setShowTopicModal(true)}
                className="bg-gradient-to-r from-[#F5B429]/20 to-[#F5941D]/20 hover:from-[#F5B429]/30 hover:to-[#F5941D]/30 text-[#FCD34D] border border-[#F5B429]/30 text-xs font-bold px-3 py-1.5 h-8 rounded-full flex items-center gap-1.5 transition-all mr-2 cursor-pointer font-display"
              >
                <Sparkles className="size-3.5 text-[#F5B429]" />
                <span>AI Topic Writer (2000+ words)</span>
              </Button>

              <button onClick={() => insertMarkdown("**", "**")} className="p-2 rounded-lg hover:bg-[#150F0B] text-[#8A8078] hover:text-[#FAFAF8] cursor-pointer" title="Bold">
                <Bold className="size-4" />
              </button>
              <button onClick={() => insertMarkdown("*", "*")} className="p-2 rounded-lg hover:bg-[#150F0B] text-[#8A8078] hover:text-[#FAFAF8] cursor-pointer" title="Italic">
                <Italic className="size-4" />
              </button>
              <button onClick={() => insertMarkdown("# ")} className="p-2 rounded-lg hover:bg-[#150F0B] text-[#8A8078] hover:text-[#FAFAF8] cursor-pointer" title="Heading 1">
                <Heading1 className="size-4" />
              </button>
              <button onClick={() => insertMarkdown("## ")} className="p-2 rounded-lg hover:bg-[#150F0B] text-[#8A8078] hover:text-[#FAFAF8] cursor-pointer" title="Heading 2">
                <Heading2 className="size-4" />
              </button>
              <button onClick={() => insertMarkdown("[", "](url)")} className="p-2 rounded-lg hover:bg-[#150F0B] text-[#8A8078] hover:text-[#FAFAF8] cursor-pointer" title="Link">
                <LinkIcon className="size-4" />
              </button>
              <button onClick={() => insertMarkdown("```\n", "\n```")} className="p-2 rounded-lg hover:bg-[#150F0B] text-[#8A8078] hover:text-[#FAFAF8] cursor-pointer" title="Code Block">
                <Code className="size-4" />
              </button>
              <button onClick={() => insertMarkdown("> ")} className="p-2 rounded-lg hover:bg-[#150F0B] text-[#8A8078] hover:text-[#FAFAF8] cursor-pointer" title="Quote">
                <Quote className="size-4" />
              </button>
              <button onClick={() => insertMarkdown("- ")} className="p-2 rounded-lg hover:bg-[#150F0B] text-[#8A8078] hover:text-[#FAFAF8] cursor-pointer" title="Unordered List">
                <List className="size-4" />
              </button>
            </div>

            <textarea
              ref={textareaRef}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="none"
              spellCheck={false}
              data-lpignore="true"
              value={content}
              onChange={(e) => {
                setContent(e.target.value);
                triggerAutosave();
              }}
              placeholder="Write your article in Markdown..."
              className="flex-1 w-full bg-transparent text-sm text-[#FAFAF8] placeholder-[#8A8078]/50 resize-none outline-none font-mono leading-relaxed min-h-[400px]"
            />
          </div>

          {showPanel && (
            <div className="w-80 md:w-96 border-l border-[#2E2118] bg-[#0A0806]/95 overflow-hidden flex flex-col shrink-0">
              {editorPanelTab === "chat" ? (
                <NoteSideChat
                  noteTitle={title || "Untitled Blog"}
                  noteContentText={content}
                  onInsertText={(insertedText) => {
                    setContent((prev) => (prev ? `${prev}\n\n${insertedText}` : insertedText));
                    triggerAutosave();
                  }}
                />
              ) : (
                <div className="p-6 space-y-6 overflow-y-auto custom-scroll flex-1">
                  <h3 className="text-xs font-mono font-bold text-[#FAFAF8] uppercase tracking-widest font-display">Article Metadata</h3>

                  <div className="space-y-2">
                    <label className="text-[10px] font-mono font-bold text-[#8A8078] uppercase tracking-widest block">Summary</label>
                    <textarea
                      autoComplete="off"
                      autoCorrect="off"
                      autoCapitalize="none"
                      spellCheck={false}
                      data-lpignore="true"
                      value={summary}
                      onChange={(e) => {
                        setSummary(e.target.value);
                        triggerAutosave();
                      }}
                      rows={3}
                      className="w-full bg-[#150F0B] border border-[#2E2118] rounded-xl p-3 text-xs text-[#FAFAF8] placeholder-[#8A8078]/60 outline-none resize-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-mono font-bold text-[#8A8078] uppercase tracking-widest block">Cover Image</label>
                    {coverImage && <img src={coverImage} alt="Cover" className="w-full h-32 object-cover rounded-xl border border-[#2E2118]" />}
                    <label className="flex items-center justify-center border border-dashed border-[#2E2118] hover:border-[#F5B429] bg-[#150F0B] rounded-xl p-3 cursor-pointer text-xs font-mono text-[#8A8078] hover:text-[#FAFAF8] gap-2 transition-colors">
                      {isUploadingImage ? <Loader2 className="size-4 animate-spin text-[#F5B429]" /> : <ImageIcon className="size-4 text-[#F5B429]" />}
                      <span>{coverImage ? "Change Cover" : "Upload Image"}</span>
                      <input type="file" accept="image/*" onChange={handleImageUpload} disabled={isUploadingImage} className="hidden" />
                    </label>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (selectedBlog) {
    return (
      <div className="flex-1 flex flex-col h-full bg-transparent text-[#FAFAF8] overflow-y-auto custom-scroll relative selection:bg-[#F5B429]/30 selection:text-[#FAFAF8]">
        {/* Background Ambient Glow Orbs */}
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden="true">
          <div className="ambient-glow-orb-1" />
          <div className="ambient-glow-orb-2" />
          <div className="ambient-glow-orb-3" />
        </div>

        <div className="p-4 sm:p-8 lg:p-10 pb-0 relative z-10">
          <div className="border border-[#2E2118] bg-[#150F0B]/85 p-6 sm:p-8 rounded-[2rem] relative z-10 backdrop-blur-2xl shadow-[0_0_35px_-5px_rgba(245,148,29,0.12)]">
            <button
              onClick={() => setSelectedBlog(null)}
              className="flex items-center gap-1.5 text-xs font-mono text-[#F5B429] hover:text-[#FCD34D] font-bold uppercase tracking-widest mb-4 font-display cursor-pointer"
            >
              <ChevronLeft className="size-4" /> Back to Blog Feed
            </button>
            <h1 className="text-2xl sm:text-4xl font-bold text-[#FAFAF8] tracking-tight leading-tight font-display">
              {selectedBlog.title}
            </h1>
            <div className="flex items-center gap-3 text-xs font-mono text-[#8A8078] mt-3">
              <span>By {selectedBlog.userName}</span>
              <span>•</span>
              <span>{new Date(selectedBlog.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-8 lg:p-10 w-full mx-auto max-w-5xl space-y-8 relative z-10">
          {selectedBlog.coverImage && (
            <img src={selectedBlog.coverImage} alt={selectedBlog.title} className="w-full max-h-96 object-cover rounded-[2rem] border border-[#2E2118] shadow-[0_15px_40px_rgba(0,0,0,0.5)]" />
          )}

          <div className="w-full">
            <BlogContentRenderer content={selectedBlog.content} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-transparent text-[#FAFAF8] overflow-y-auto custom-scroll relative selection:bg-[#F5B429]/30 selection:text-[#FAFAF8]">
      {/* Background Ambient Glow Orbs */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden="true">
        <div className="ambient-glow-orb-1" />
        <div className="ambient-glow-orb-2" />
        <div className="ambient-glow-orb-3" />
      </div>

      {/* Header Banner */}
      <div className="p-4 sm:p-8 lg:p-10 pb-0 relative z-10">
        <div className="border border-[#2E2118] bg-[#150F0B]/85 p-6 sm:p-8 rounded-[2rem] relative z-10 backdrop-blur-2xl shadow-[0_0_35px_-5px_rgba(245,148,29,0.12)]">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="size-14 rounded-2xl bg-[#F5B429]/10 flex items-center justify-center border border-[#F5B429]/30 text-[#F5B429] shadow-[0_0_15px_rgba(245,180,41,0.15)] shrink-0">
                <Rss className="size-7 text-[#F5B429]" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#FAFAF8] flex items-center gap-2.5 flex-wrap font-display">
                  Scholar Blogs
                  <span className="text-[10px] font-mono font-bold bg-[#F5B429]/15 text-[#F5B429] px-3 py-1 rounded-full border border-[#F5B429]/30 uppercase tracking-widest">
                    EDITORIAL DISPATCH
                  </span>
                </h1>
                <p className="text-[#8A8078] text-xs sm:text-sm font-light mt-1">
                  Read deep-dive articles, engineering tutorials, and technical research written by student scholars.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
              <Button
                onClick={async () => {
                  setIsLoading(true);
                  try {
                    const res = await fetch("/api/blogs", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        title: "Untitled AI Blog",
                        summary: "AI generated research article.",
                        content: "Generating content...",
                      }),
                    });
                    if (res.ok) {
                      const newBlog = await res.json();
                      setEditingBlog(newBlog);
                      setShowTopicModal(true);
                    }
                  } catch (e) {
                    console.error("create ai blog error:", e);
                  } finally {
                    setIsLoading(false);
                  }
                }}
                className="group rounded-full bg-gradient-to-r from-[#F5B429]/20 to-[#F5941D]/20 hover:from-[#F5B429]/30 hover:to-[#F5941D]/30 text-[#FCD34D] font-bold text-xs h-11 px-5 flex items-center justify-center gap-2 border border-[#F5B429]/30 transition-all duration-300 active:scale-[0.97] shadow-[0_0_15px_rgba(245,180,41,0.15)] font-display cursor-pointer"
              >
                <Sparkles className="size-4 text-[#F5B429]" />
                <span>AI Blog Writer (2000+ words)</span>
              </Button>

              <Button
                onClick={handleCreateBlog}
                className="btn-premium-primary h-11 px-6 text-xs gap-2 font-display cursor-pointer"
              >
                <Plus className="size-4" />
                <span>Write Blog</span>
                <ArrowUpRight className="size-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content & Tab Filter */}
      <div className="p-4 sm:p-8 lg:p-10 max-w-5xl w-full mx-auto space-y-8 relative z-10">
        <div className="flex items-center gap-2 border-b border-[#2E2118] pb-4 select-none">
          <button
            onClick={() => setActiveTab("feed")}
            className={`text-xs font-mono font-bold px-4 py-2 rounded-full uppercase tracking-widest transition-all cursor-pointer ${
              activeTab === "feed"
                ? "bg-gradient-to-r from-[#F7C948] to-[#F5941D] text-[#150F0B] font-bold shadow-[0_0_15px_rgba(245,180,41,0.3)]"
                : "text-[#8A8078] hover:text-[#FAFAF8] hover:bg-[#150F0B] border border-transparent"
            }`}
          >
            Public Feed
          </button>
          <button
            onClick={() => setActiveTab("mine")}
            className={`text-xs font-mono font-bold px-4 py-2 rounded-full uppercase tracking-widest transition-all cursor-pointer ${
              activeTab === "mine"
                ? "bg-gradient-to-r from-[#F7C948] to-[#F5941D] text-[#150F0B] font-bold shadow-[0_0_15px_rgba(245,180,41,0.3)]"
                : "text-[#8A8078] hover:text-[#FAFAF8] hover:bg-[#150F0B] border border-transparent"
            }`}
          >
            My Written Articles
          </button>
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center text-[#8A8078] text-xs gap-3 font-semibold">
            <Loader2 className="size-8 animate-spin text-[#F5B429]" />
            <span className="font-mono text-[#F5B429] tracking-widest">LOADING ARTICLES...</span>
          </div>
        ) : blogs.length === 0 ? (
          <div className="rounded-[2.5rem] bg-[#150F0B]/85 border border-[#2E2118] p-2.5 backdrop-blur-3xl max-w-md mx-auto text-center my-12 shadow-[0_0_30px_-5px_rgba(245,148,29,0.12)]">
            <div className="rounded-[calc(2.5rem-0.75rem)] bg-[#0A0806] border border-[#2E2118] p-8 flex flex-col items-center gap-4">
              <Sparkles className="size-10 text-[#8A8078]" />
              <h3 className="text-lg font-bold text-[#FAFAF8] font-display">No articles published yet</h3>
              <p className="text-xs text-[#8A8078] font-light max-w-xs">
                {activeTab === "mine" ? "You haven't written any blogs yet." : "Be the first scholar to publish a blog article!"}
              </p>
            </div>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ staggerChildren: 0.08 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            {blogs.map((blog) => {
              const isOwner = currentUserId === blog.userId;

              return (
                <motion.div
                  key={blog._id}
                  whileHover={{ y: -4, scale: 1.01 }}
                  transition={{ type: "spring", stiffness: 350, damping: 20 }}
                  className="rounded-[2rem] bg-[#150F0B]/85 border border-[#2E2118] p-2 backdrop-blur-xl hover:border-[#F5B429]/50 transition-all duration-300 flex flex-col h-full shadow-[0_0_30px_-5px_rgba(245,148,29,0.1)]"
                >
                  <div
                    onClick={() => setSelectedBlog(blog)}
                    className="rounded-[calc(2rem-0.5rem)] bg-[#0A0806] border border-[#2E2118] overflow-hidden flex flex-col h-full cursor-pointer group"
                  >
                    {blog.coverImage && (
                      <div className="h-44 w-full relative overflow-hidden bg-[#150F0B]">
                        <img src={blog.coverImage} alt={blog.title} className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500" />
                      </div>
                    )}
                    <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-[10px] font-mono text-[#8A8078] select-none">
                          <span>By {blog.userName}</span>
                          <span>{new Date(blog.createdAt).toLocaleDateString()}</span>
                        </div>
                        <h3 className="text-lg font-bold text-[#FAFAF8] group-hover:text-[#F5B429] transition-colors line-clamp-1 font-display">
                          {blog.title}
                        </h3>
                        <p className="text-xs text-[#8A8078] font-light line-clamp-2 leading-relaxed">
                          {blog.summary}
                        </p>
                      </div>

                      <div className="flex items-center justify-between border-t border-[#2E2118] pt-4 select-none">
                        <Link
                          href={`/blog/${encodeURIComponent(blog.userName || "author")}/${blog.slug || blog._id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="text-xs font-mono text-[#F5B429] font-bold flex items-center gap-1 hover:text-[#FCD34D] transition-colors"
                        >
                          Read Article <ArrowUpRight className="size-3.5" />
                        </Link>
                        <div className="flex items-center gap-2">
                          <button onClick={(e) => handleBookmark(blog, e)} className="text-[#8A8078] hover:text-[#F5B429] transition-colors cursor-pointer">
                            <Bookmark className="size-4" />
                          </button>
                          {isOwner && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingBlog(blog);
                              }}
                              className="text-[#8A8078] hover:text-[#FAFAF8] transition-colors cursor-pointer"
                            >
                              <Edit2 className="size-4" />
                            </button>
                          )}
                          {isOwner && (
                            <button onClick={(e) => handleDeleteBlog(blog._id, e)} className="text-[#8A8078] hover:text-[#EF4444] transition-colors cursor-pointer">
                              <Trash2 className="size-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </div>

      {/* AI Topic Generator Modal */}
      <TopicGeneratorModal
        isOpen={showTopicModal}
        onClose={() => setShowTopicModal(false)}
        onGenerate={async (newTopic, contentHtml) => {
          setTitle(newTopic);
          setContent(contentHtml);
          const plainText = contentHtml.replace(/<[^>]*>?/gm, " ").replace(/\s+/g, " ").trim();
          const generatedSummary = plainText.slice(0, 180) + (plainText.length > 180 ? "..." : "");
          setSummary(generatedSummary);

          // Save directly if currently editing
          const targetBlogId = editingBlog ? (editingBlog as BlogData)._id : null;
          if (targetBlogId) {
            try {
              await fetch(`/api/blogs/${targetBlogId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  title: newTopic,
                  content: contentHtml,
                  summary: generatedSummary,
                }),
              });
            } catch (e) {
              console.error("Save AI blog error:", e);
            }
          }
        }}
      />
    </div>
  );
}
