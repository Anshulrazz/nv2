/* eslint-disable @next/next/no-img-element */
"use client";

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
import { MarkdownRenderer } from "@/components/ui/MarkdownRenderer";
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
        <div className="flex-1 flex items-center justify-center bg-[#030305] text-zinc-500 select-none gap-2">
          <Loader2 className="size-5 animate-spin text-cyan-400" />
          <span className="text-xs font-mono font-bold uppercase tracking-widest text-zinc-400">
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
      <div className="flex-1 flex flex-col h-full bg-[#16261D] text-[#F3F0E4] overflow-hidden antialiased relative">
        <div className="border-b border-[#F3F0E4]/15 bg-[#1A2D23]/90 px-6 py-4 flex items-center justify-between shrink-0 select-none backdrop-blur-xl">
          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                setEditingBlog(null);
                fetchBlogs();
              }}
              className="flex items-center gap-1.5 text-xs font-mono text-[#9FAEA1] hover:text-[#F3F0E4] transition-colors font-heading"
            >
              <ChevronLeft className="size-4" /> Back to Blogs
            </button>
            <div className="h-4 w-px bg-[#F3F0E4]/15" />
            <span className="text-xs font-mono font-bold text-[#F0C93B] uppercase tracking-widest flex items-center gap-2">
              <Edit2 className="size-3.5" /> Blog Editor
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[10px] font-mono font-bold uppercase text-[#9FAEA1]">
              {saveState === "saving" ? "Saving..." : saveState === "saved" ? "Saved ✓" : published ? "Published" : "Draft"}
            </span>

            <div className="flex items-center gap-1 bg-[#121F18] border border-[#F3F0E4]/15 p-1 rounded-xl">
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
                className={`text-xs font-mono font-bold h-7 px-3 rounded-lg transition-all flex items-center gap-1.5 ${
                  showPanel && editorPanelTab === "chat"
                    ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                    : "text-[#9FAEA1] hover:text-[#F3F0E4]"
                }`}
              >
                <Sparkles className="size-3 text-cyan-400" />
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
                className={`text-xs font-mono font-bold h-7 px-3 rounded-lg transition-all flex items-center gap-1.5 ${
                  showPanel && editorPanelTab === "settings"
                    ? "bg-white/10 text-white border border-white/10"
                    : "text-[#9FAEA1] hover:text-[#F3F0E4]"
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
              className={`rounded-xl text-xs font-bold px-5 h-9 transition-all shadow-[2px_2px_0_0_#F28B6E] font-heading ${
                published ? "bg-[#8FC3DE] text-[#2A2118]" : "bg-[#F0C93B] text-[#2A2118]"
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
              className="bg-transparent border-none text-2xl sm:text-3xl font-extrabold text-[#F3F0E4] placeholder-[#9FAEA1]/50 focus-visible:ring-0 px-0 h-auto font-heading"
            />

            <div className="flex items-center gap-1 border-y border-[#F3F0E4]/10 py-2 select-none flex-wrap">
              <Button
                type="button"
                onClick={() => setShowTopicModal(true)}
                className="bg-gradient-to-r from-cyan-500/20 via-indigo-500/20 to-violet-500/20 hover:from-cyan-500/30 hover:to-violet-500/30 text-cyan-300 border border-cyan-500/30 text-xs font-bold px-3 py-1.5 h-8 rounded-lg flex items-center gap-1.5 transition-all mr-2"
              >
                <Sparkles className="size-3.5 text-cyan-400" />
                <span>AI Topic Writer (2000+ words)</span>
              </Button>

              <button onClick={() => insertMarkdown("**", "**")} className="p-2 rounded-lg hover:bg-[#1A2D23] text-[#9FAEA1] hover:text-[#F3F0E4]" title="Bold">
                <Bold className="size-4" />
              </button>
              <button onClick={() => insertMarkdown("*", "*")} className="p-2 rounded-lg hover:bg-[#1A2D23] text-[#9FAEA1] hover:text-[#F3F0E4]" title="Italic">
                <Italic className="size-4" />
              </button>
              <button onClick={() => insertMarkdown("# ")} className="p-2 rounded-lg hover:bg-[#1A2D23] text-[#9FAEA1] hover:text-[#F3F0E4]" title="Heading 1">
                <Heading1 className="size-4" />
              </button>
              <button onClick={() => insertMarkdown("## ")} className="p-2 rounded-lg hover:bg-[#1A2D23] text-[#9FAEA1] hover:text-[#F3F0E4]" title="Heading 2">
                <Heading2 className="size-4" />
              </button>
              <button onClick={() => insertMarkdown("[", "](url)")} className="p-2 rounded-lg hover:bg-[#1A2D23] text-[#9FAEA1] hover:text-[#F3F0E4]" title="Link">
                <LinkIcon className="size-4" />
              </button>
              <button onClick={() => insertMarkdown("```\n", "\n```")} className="p-2 rounded-lg hover:bg-[#1A2D23] text-[#9FAEA1] hover:text-[#F3F0E4]" title="Code Block">
                <Code className="size-4" />
              </button>
              <button onClick={() => insertMarkdown("> ")} className="p-2 rounded-lg hover:bg-[#1A2D23] text-[#9FAEA1] hover:text-[#F3F0E4]" title="Quote">
                <Quote className="size-4" />
              </button>
              <button onClick={() => insertMarkdown("- ")} className="p-2 rounded-lg hover:bg-[#1A2D23] text-[#9FAEA1] hover:text-[#F3F0E4]" title="Unordered List">
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
              className="flex-1 w-full bg-transparent text-sm text-[#F3F0E4] placeholder-[#9FAEA1]/50 resize-none outline-none font-mono leading-relaxed min-h-[400px]"
            />
          </div>

          {showPanel && (
            <div className="w-80 md:w-96 border-l border-[#F3F0E4]/15 bg-[#121F18]/90 overflow-hidden flex flex-col shrink-0">
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
                  <h3 className="text-xs font-mono font-bold text-[#F3F0E4] uppercase tracking-widest font-heading">Article Metadata</h3>

                  <div className="space-y-2">
                    <label className="text-[10px] font-mono font-bold text-[#9FAEA1] uppercase tracking-widest block">Summary</label>
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
                      className="w-full bg-[#16261D] border border-[#F3F0E4]/15 rounded-xl p-3 text-xs text-[#F3F0E4] placeholder-[#9FAEA1]/60 outline-none resize-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-mono font-bold text-[#9FAEA1] uppercase tracking-widest block">Cover Image</label>
                    {coverImage && <img src={coverImage} alt="Cover" className="w-full h-32 object-cover rounded-xl border border-[#F3F0E4]/15" />}
                    <label className="flex items-center justify-center border border-dashed border-[#F3F0E4]/15 hover:border-[#F0C93B] bg-[#16261D] rounded-xl p-3 cursor-pointer text-xs font-mono text-[#9FAEA1] hover:text-[#F3F0E4] gap-2">
                      {isUploadingImage ? <Loader2 className="size-4 animate-spin text-[#8FC3DE]" /> : <ImageIcon className="size-4 text-[#8FC3DE]" />}
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
      <div className="flex-1 flex flex-col h-full bg-[#16261D] text-[#F3F0E4] overflow-y-auto custom-scroll relative selection:bg-[#F0C93B]/30 selection:text-[#F0C93B]">
        {/* Ambient Glow */}
        <div className="fixed inset-0 pointer-events-none z-0">
          <div className="absolute top-0 right-1/4 w-[500px] h-[350px] bg-[#C9A9E0]/10 rounded-full blur-[140px] animate-float-glow" />
        </div>

        <div className="p-4 sm:p-8 lg:p-10 pb-0 relative z-10">
          <div className="border border-[#F3F0E4]/15 bg-[#1A2D23]/80 p-6 sm:p-8 rounded-[2rem] relative z-10 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.3)]">
            <button
              onClick={() => setSelectedBlog(null)}
              className="flex items-center gap-1.5 text-xs font-mono text-[#F0C93B] hover:text-[#F0C93B]/80 font-bold uppercase tracking-widest mb-4 font-heading"
            >
              <ChevronLeft className="size-4" /> Back to Blog Feed
            </button>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-[#F3F0E4] tracking-tight leading-tight font-heading">
              {selectedBlog.title}
            </h1>
            <div className="flex items-center gap-3 text-xs font-mono text-[#9FAEA1] mt-3">
              <span>By {selectedBlog.userName}</span>
              <span>•</span>
              <span>{new Date(selectedBlog.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-8 lg:p-10 max-w-4xl w-full mx-auto space-y-8 relative z-10">
          {selectedBlog.coverImage && (
            <img src={selectedBlog.coverImage} alt={selectedBlog.title} className="w-full max-h-96 object-cover rounded-[2rem] border border-[#F3F0E4]/15 shadow-[0_15px_40px_rgba(0,0,0,0.3)]" />
          )}

          <div className="rounded-[2.5rem] bg-[#1A2D23]/80 border border-[#F3F0E4]/15 p-2 backdrop-blur-3xl shadow-[0_20px_50px_rgba(0,0,0,0.3)]">
            <div className="rounded-[calc(2.5rem-0.5rem)] bg-[#121F18] border border-[#F3F0E4]/10 p-8 text-[#F3F0E4]">
              <MarkdownRenderer content={selectedBlog.content} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-[#16261D] text-[#F3F0E4] overflow-y-auto custom-scroll relative selection:bg-[#F0C93B]/30 selection:text-[#F0C93B]">
      {/* Background Ambient Mesh Glow Orbs */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 right-1/4 w-[500px] h-[350px] bg-[#C9A9E0]/10 rounded-full blur-[140px] animate-float-glow" />
        <div className="absolute bottom-0 left-1/4 w-[450px] h-[350px] bg-[#8FC3DE]/10 rounded-full blur-[140px] animate-float-glow-reverse" />
      </div>

      {/* Header Banner */}
      <div className="p-4 sm:p-8 lg:p-10 pb-0 relative z-10">
        <div className="border border-[#F3F0E4]/15 bg-[#1A2D23]/80 p-6 sm:p-8 rounded-[2rem] relative z-10 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.3)]">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="size-14 rounded-2xl bg-[#C9A9E0]/10 flex items-center justify-center border border-[#C9A9E0]/30 text-[#C9A9E0] shadow-[2px_2px_0_0_#F28B6E] shrink-0">
                <Rss className="size-7" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[#F3F0E4] flex items-center gap-2.5 flex-wrap font-heading">
                  Scholar Blogs
                  <span className="text-[10px] font-mono font-bold bg-[#C9A9E0]/15 text-[#C9A9E0] px-3 py-1 rounded-full border border-[#C9A9E0]/30 uppercase tracking-widest">
                    EDITORIAL DISPATCH
                  </span>
                </h1>
                <p className="text-[#9FAEA1] text-xs sm:text-sm font-light mt-1">
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
                className="group rounded-xl bg-gradient-to-r from-purple-500/20 via-cyan-500/20 to-indigo-500/20 hover:from-purple-500/30 hover:to-indigo-500/30 text-cyan-300 font-bold text-xs h-11 px-5 flex items-center justify-center gap-2 border border-cyan-500/30 transition-all duration-300 active:scale-[0.97] shadow-[2px_2px_0_0_#C9A9E0] font-heading"
              >
                <Sparkles className="size-4 text-cyan-400" />
                <span>AI Blog Writer (2000+ words)</span>
              </Button>

              <Button
                onClick={handleCreateBlog}
                className="group rounded-xl bg-[#F0C93B] hover:bg-[#F0C93B]/90 text-[#2A2118] font-bold text-xs h-11 px-6 flex items-center justify-center gap-2 transition-all duration-300 active:scale-[0.97] shadow-[4px_4px_0_0_#F28B6E] font-heading"
              >
                <Plus className="size-4 text-[#2A2118]" />
                <span>Write Blog</span>
                <ArrowUpRight className="size-4 text-[#2A2118] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content & Tab Filter */}
      <div className="p-4 sm:p-8 lg:p-10 max-w-5xl w-full mx-auto space-y-8 relative z-10">
        <div className="flex items-center gap-2 border-b border-[#F3F0E4]/10 pb-4 select-none">
          <button
            onClick={() => setActiveTab("feed")}
            className={`text-xs font-mono font-bold px-4 py-2 rounded-full uppercase tracking-widest transition-all ${
              activeTab === "feed"
                ? "bg-[#F0C93B] text-[#2A2118] font-extrabold shadow-[2px_2px_0_0_#F28B6E]"
                : "text-[#9FAEA1] hover:text-[#F3F0E4] hover:bg-[#121F18] border border-transparent"
            }`}
          >
            Public Feed
          </button>
          <button
            onClick={() => setActiveTab("mine")}
            className={`text-xs font-mono font-bold px-4 py-2 rounded-full uppercase tracking-widest transition-all ${
              activeTab === "mine"
                ? "bg-[#F0C93B] text-[#2A2118] font-extrabold shadow-[2px_2px_0_0_#F28B6E]"
                : "text-[#9FAEA1] hover:text-[#F3F0E4] hover:bg-[#121F18] border border-transparent"
            }`}
          >
            My Written Articles
          </button>
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center text-[#9FAEA1] text-xs gap-3 font-semibold">
            <Loader2 className="size-8 animate-spin text-[#C9A9E0]" />
            <span className="font-mono text-[#C9A9E0] tracking-widest">LOADING ARTICLES...</span>
          </div>
        ) : blogs.length === 0 ? (
          <div className="rounded-[2.5rem] bg-[#1A2D23]/80 border border-[#F3F0E4]/15 p-2.5 backdrop-blur-3xl max-w-md mx-auto text-center my-12 shadow-[0_15px_40px_rgba(0,0,0,0.3)]">
            <div className="rounded-[calc(2.5rem-0.75rem)] bg-[#121F18] border border-[#F3F0E4]/10 p-8 flex flex-col items-center gap-4">
              <Sparkles className="size-10 text-[#9FAEA1]" />
              <h3 className="text-lg font-bold text-[#F3F0E4] font-heading">No articles published yet</h3>
              <p className="text-xs text-[#9FAEA1] font-light max-w-xs">
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
                  className="rounded-[2rem] bg-[#1A2D23]/80 border border-[#F3F0E4]/15 p-2 backdrop-blur-xl hover:border-[#F0C93B]/40 transition-all duration-300 flex flex-col h-full shadow-[0_10px_30px_rgba(0,0,0,0.25)]"
                >
                  <div
                    onClick={() => setSelectedBlog(blog)}
                    className="rounded-[calc(2rem-0.5rem)] bg-[#121F18] border border-[#F3F0E4]/10 overflow-hidden flex flex-col h-full cursor-pointer group"
                  >
                    {blog.coverImage && (
                      <div className="h-44 w-full relative overflow-hidden bg-[#16261D]">
                        <img src={blog.coverImage} alt={blog.title} className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500" />
                      </div>
                    )}
                    <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-[10px] font-mono text-[#9FAEA1] select-none">
                          <span>By {blog.userName}</span>
                          <span>{new Date(blog.createdAt).toLocaleDateString()}</span>
                        </div>
                        <h3 className="text-lg font-bold text-[#F3F0E4] group-hover:text-[#F0C93B] transition-colors line-clamp-1 font-heading">
                          {blog.title}
                        </h3>
                        <p className="text-xs text-[#9FAEA1] font-light line-clamp-2 leading-relaxed">
                          {blog.summary}
                        </p>
                      </div>

                      <div className="flex items-center justify-between border-t border-[#F3F0E4]/10 pt-4 select-none">
                        <Link
                          href={`/blog/${encodeURIComponent(blog.userName || "author")}/${blog.slug || blog._id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="text-xs font-mono text-[#8FC3DE] font-bold flex items-center gap-1 hover:text-cyan-300 transition-colors"
                        >
                          Read Article <ArrowUpRight className="size-3.5" />
                        </Link>
                        <div className="flex items-center gap-2">
                          <button onClick={(e) => handleBookmark(blog, e)} className="text-[#9FAEA1] hover:text-[#F0C93B] transition-colors">
                            <Bookmark className="size-4" />
                          </button>
                          {isOwner && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingBlog(blog);
                              }}
                              className="text-[#9FAEA1] hover:text-[#F3F0E4] transition-colors"
                            >
                              <Edit2 className="size-4" />
                            </button>
                          )}
                          {isOwner && (
                            <button onClick={(e) => handleDeleteBlog(blog._id, e)} className="text-[#9FAEA1] hover:text-[#F28B6E] transition-colors">
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
