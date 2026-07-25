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
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");

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
      <div className="flex-1 flex flex-col h-full bg-[#030305] text-zinc-100 overflow-hidden antialiased">
        <div className="border-b border-white/10 bg-zinc-950/80 px-6 py-4 flex items-center justify-between shrink-0 select-none">
          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                setEditingBlog(null);
                fetchBlogs();
              }}
              className="flex items-center gap-1.5 text-xs font-mono text-zinc-400 hover:text-white transition-colors"
            >
              <ChevronLeft className="size-4" /> Back to Blogs
            </button>
            <div className="h-4 w-px bg-white/10" />
            <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-widest flex items-center gap-2">
              <Edit2 className="size-3.5" /> Blog Editor
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[10px] font-mono font-bold uppercase text-zinc-400">
              {saveState === "saving" ? "Saving..." : saveState === "saved" ? "Saved ✓" : published ? "Published" : "Draft"}
            </span>

            <Button
              onClick={() => setShowPanel(!showPanel)}
              variant="outline"
              size="sm"
              className="bg-zinc-900 border-white/10 text-xs text-white hover:bg-zinc-800"
            >
              <Settings className="size-3.5 mr-1" /> Settings
            </Button>

            <Button
              onClick={() => {
                const nextPub = !published;
                setPublished(nextPub);
                triggerAutosave();
              }}
              className={`rounded-full text-xs font-bold px-5 h-9 transition-all ${
                published ? "bg-emerald-500 hover:bg-emerald-400 text-zinc-950" : "bg-white hover:bg-zinc-100 text-zinc-950"
              }`}
            >
              {published ? "Published ✓" : "Publish Blog"}
            </Button>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          <div className="flex-1 flex flex-col p-6 overflow-y-auto space-y-6 max-w-4xl mx-auto w-full">
            <Input
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                triggerAutosave();
              }}
              placeholder="Blog Title..."
              className="bg-transparent border-none text-2xl sm:text-3xl font-extrabold text-white placeholder-zinc-700 focus-visible:ring-0 px-0 h-auto"
            />

            <div className="flex items-center gap-1 border-y border-white/5 py-2 select-none flex-wrap">
              <button onClick={() => insertMarkdown("**", "**")} className="p-2 rounded-lg hover:bg-white/5 text-zinc-400 hover:text-white" title="Bold">
                <Bold className="size-4" />
              </button>
              <button onClick={() => insertMarkdown("*", "*")} className="p-2 rounded-lg hover:bg-white/5 text-zinc-400 hover:text-white" title="Italic">
                <Italic className="size-4" />
              </button>
              <button onClick={() => insertMarkdown("# ")} className="p-2 rounded-lg hover:bg-white/5 text-zinc-400 hover:text-white" title="Heading 1">
                <Heading1 className="size-4" />
              </button>
              <button onClick={() => insertMarkdown("## ")} className="p-2 rounded-lg hover:bg-white/5 text-zinc-400 hover:text-white" title="Heading 2">
                <Heading2 className="size-4" />
              </button>
              <button onClick={() => insertMarkdown("[", "](url)")} className="p-2 rounded-lg hover:bg-white/5 text-zinc-400 hover:text-white" title="Link">
                <LinkIcon className="size-4" />
              </button>
              <button onClick={() => insertMarkdown("```\n", "\n```")} className="p-2 rounded-lg hover:bg-white/5 text-zinc-400 hover:text-white" title="Code Block">
                <Code className="size-4" />
              </button>
              <button onClick={() => insertMarkdown("> ")} className="p-2 rounded-lg hover:bg-white/5 text-zinc-400 hover:text-white" title="Quote">
                <Quote className="size-4" />
              </button>
              <button onClick={() => insertMarkdown("- ")} className="p-2 rounded-lg hover:bg-white/5 text-zinc-400 hover:text-white" title="Unordered List">
                <List className="size-4" />
              </button>
            </div>

            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => {
                setContent(e.target.value);
                triggerAutosave();
              }}
              placeholder="Write your article in Markdown..."
              className="flex-1 w-full bg-transparent text-sm text-zinc-200 placeholder-zinc-700 resize-none outline-none font-mono leading-relaxed min-h-[400px]"
            />
          </div>

          {showPanel && (
            <div className="w-80 border-l border-white/10 bg-zinc-950/60 p-6 space-y-6 overflow-y-auto">
              <h3 className="text-xs font-mono font-bold text-white uppercase tracking-widest">Article Metadata</h3>

              <div className="space-y-2">
                <label className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-widest block">Summary</label>
                <textarea
                  value={summary}
                  onChange={(e) => {
                    setSummary(e.target.value);
                    triggerAutosave();
                  }}
                  rows={3}
                  className="w-full bg-zinc-900 border border-white/10 rounded-xl p-3 text-xs text-white placeholder-zinc-600 outline-none resize-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-widest block">Cover Image</label>
                {coverImage && <img src={coverImage} alt="Cover" className="w-full h-32 object-cover rounded-xl border border-white/10" />}
                <label className="flex items-center justify-center border border-dashed border-white/10 hover:border-cyan-400 bg-zinc-900 rounded-xl p-3 cursor-pointer text-xs font-mono text-zinc-400 hover:text-white gap-2">
                  {isUploadingImage ? <Loader2 className="size-4 animate-spin text-cyan-400" /> : <ImageIcon className="size-4 text-cyan-400" />}
                  <span>{coverImage ? "Change Cover" : "Upload Image"}</span>
                  <input type="file" accept="image/*" onChange={handleImageUpload} disabled={isUploadingImage} className="hidden" />
                </label>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (selectedBlog) {
    return (
      <div className="flex-1 flex flex-col h-full bg-[#030305] text-zinc-100 overflow-y-auto antialiased relative">
        <div className="border-b border-white/5 bg-zinc-950/40 p-6 sm:p-8 rounded-[2rem] border border-white/10 relative z-10 backdrop-blur-2xl m-6 sm:m-10 mb-0">
          <button
            onClick={() => setSelectedBlog(null)}
            className="flex items-center gap-1.5 text-xs font-mono text-cyan-400 hover:text-cyan-300 font-bold uppercase tracking-widest mb-4"
          >
            <ChevronLeft className="size-4" /> Back to Blog Feed
          </button>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
            {selectedBlog.title}
          </h1>
          <div className="flex items-center gap-3 text-xs font-mono text-zinc-400 mt-3">
            <span>By {selectedBlog.userName}</span>
            <span>•</span>
            <span>{new Date(selectedBlog.createdAt).toLocaleDateString()}</span>
          </div>
        </div>

        <div className="p-6 sm:p-10 max-w-4xl w-full mx-auto space-y-8 relative z-10">
          {selectedBlog.coverImage && (
            <img src={selectedBlog.coverImage} alt={selectedBlog.title} className="w-full max-h-96 object-cover rounded-[2rem] border border-white/10" />
          )}

          <div className="rounded-[2.5rem] bg-zinc-900/40 border border-white/10 p-2.5 backdrop-blur-3xl">
            <div className="rounded-[calc(2.5rem-0.75rem)] bg-[#07070a] border border-white/5 p-8 text-zinc-200">
              <MarkdownRenderer content={selectedBlog.content} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-[#030305] text-zinc-100 overflow-y-auto antialiased relative selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Background Ambient Mesh Glow Orbs */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 right-1/4 w-[500px] h-[350px] bg-violet-500/10 rounded-full blur-[140px]" />
      </div>

      {/* Header Banner */}
      <div className="border-b border-white/5 bg-zinc-950/40 p-8 rounded-[2rem] border border-white/10 relative z-10 backdrop-blur-2xl m-6 sm:m-10 mb-0">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="size-14 rounded-2xl bg-violet-500/10 flex items-center justify-center border border-violet-500/20 text-violet-400">
              <Rss className="size-7" />
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tight text-white flex items-center gap-3">
                Scholar Blogs
                <span className="text-[10px] font-mono font-bold bg-violet-500/20 text-violet-300 px-3 py-1 rounded-full border border-violet-500/30 uppercase tracking-widest">
                  EDITORIAL DISPATCH
                </span>
              </h1>
              <p className="text-zinc-400 text-xs sm:text-sm font-light mt-1">
                Read deep-dive articles, engineering tutorials, and technical research written by student scholars.
              </p>
            </div>
          </div>

          <Button
            onClick={handleCreateBlog}
            className="group rounded-full bg-white hover:bg-zinc-100 text-zinc-950 font-bold text-xs h-11 px-6 flex items-center justify-center gap-2 transition-all duration-300 active:scale-[0.97] shadow-[0_0_20px_rgba(255,255,255,0.15)]"
          >
            <Plus className="size-4 text-zinc-950" />
            <span>Write Blog</span>
            <ArrowUpRight className="size-4 text-zinc-950 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </Button>
        </div>
      </div>

      {/* Content & Tab Filter */}
      <div className="p-6 sm:p-10 max-w-5xl w-full mx-auto space-y-8 relative z-10">
        <div className="flex items-center gap-2 border-b border-white/5 pb-4 select-none">
          <button
            onClick={() => setActiveTab("feed")}
            className={`text-xs font-mono font-bold px-4 py-2 rounded-full uppercase tracking-widest transition-all ${
              activeTab === "feed"
                ? "bg-white/10 border border-white/20 text-white shadow-sm"
                : "text-zinc-500 hover:text-zinc-300 border border-transparent"
            }`}
          >
            Public Feed
          </button>
          <button
            onClick={() => setActiveTab("mine")}
            className={`text-xs font-mono font-bold px-4 py-2 rounded-full uppercase tracking-widest transition-all ${
              activeTab === "mine"
                ? "bg-white/10 border border-white/20 text-white shadow-sm"
                : "text-zinc-500 hover:text-zinc-300 border border-transparent"
            }`}
          >
            My Written Articles
          </button>
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center text-zinc-500 text-xs gap-3 font-semibold">
            <Loader2 className="size-8 animate-spin text-violet-400" />
            <span className="font-mono text-zinc-400 tracking-widest">LOADING ARTICLES...</span>
          </div>
        ) : blogs.length === 0 ? (
          <div className="rounded-[2.5rem] bg-zinc-900/40 border border-white/10 p-2.5 backdrop-blur-3xl max-w-md mx-auto text-center my-12">
            <div className="rounded-[calc(2.5rem-0.75rem)] bg-[#07070a] border border-white/5 p-8 flex flex-col items-center gap-4">
              <Sparkles className="size-10 text-zinc-600" />
              <h3 className="text-lg font-bold text-white">No articles published yet</h3>
              <p className="text-xs text-zinc-400 font-light max-w-xs">
                {activeTab === "mine" ? "You haven't written any blogs yet." : "Be the first scholar to publish a blog article!"}
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {blogs.map((blog) => {
              const isOwner = currentUserId === blog.userId;

              return (
                <div key={blog._id} className="rounded-[2rem] bg-zinc-900/40 border border-white/10 p-2 backdrop-blur-xl hover:border-violet-500/40 transition-all duration-300 flex flex-col h-full">
                  <div
                    onClick={() => setSelectedBlog(blog)}
                    className="rounded-[calc(2rem-0.5rem)] bg-[#07070a] border border-white/5 overflow-hidden flex flex-col h-full cursor-pointer group"
                  >
                    {blog.coverImage && (
                      <div className="h-44 w-full relative overflow-hidden bg-zinc-950">
                        <img src={blog.coverImage} alt={blog.title} className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500" />
                      </div>
                    )}
                    <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500 select-none">
                          <span>By {blog.userName}</span>
                          <span>{new Date(blog.createdAt).toLocaleDateString()}</span>
                        </div>
                        <h3 className="text-lg font-bold text-white group-hover:text-violet-400 transition-colors line-clamp-1">
                          {blog.title}
                        </h3>
                        <p className="text-xs text-zinc-400 font-light line-clamp-2 leading-relaxed">
                          {blog.summary}
                        </p>
                      </div>

                      <div className="flex items-center justify-between border-t border-white/5 pt-4 select-none">
                        <span className="text-xs font-mono text-cyan-400 font-bold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                          Read Article →
                        </span>
                        <div className="flex items-center gap-2">
                          <button onClick={(e) => handleBookmark(blog, e)} className="text-zinc-500 hover:text-amber-400 transition-colors">
                            <Bookmark className="size-4" />
                          </button>
                          {isOwner && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingBlog(blog);
                              }}
                              className="text-zinc-500 hover:text-white transition-colors"
                            >
                              <Edit2 className="size-4" />
                            </button>
                          )}
                          {isOwner && (
                            <button onClick={(e) => handleDeleteBlog(blog._id, e)} className="text-zinc-500 hover:text-rose-400 transition-colors">
                              <Trash2 className="size-4" />
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
