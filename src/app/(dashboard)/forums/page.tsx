"use client";

import React, { useEffect, useState, useCallback } from "react";
import { MessageSquare, Plus, ThumbsUp, Send, Trash2, FolderHeart, CornerDownRight, Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useAlertStore } from "@/stores/alertStore";

interface CommentData {
  _id?: string;
  userId: string;
  userName: string;
  userImage?: string;
  content: string;
  createdAt: string;
}

interface PostData {
  _id: string;
  title: string;
  content: string;
  category: string;
  userId: string;
  userName: string;
  upvotes: string[];
  comments: CommentData[];
  mediaUrl?: string;
  mediaType?: "image" | "video" | "pdf";
  createdAt: string;
}

const CATEGORIES = ["All", "General", "Q&A", "Tutorials", "Study Groups"];

export default function ForumsPage() {
  const { data: session } = useSession();
  const currentUserId = session?.user?.id;

  const [posts, setPosts] = useState<PostData[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [expandedPostId, setExpandedPostId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // New Post Form states
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("General");
  const [mediaUrl, setMediaUrl] = useState("");
  const [mediaType, setMediaType] = useState<"image" | "video" | "pdf" | "">("");
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // New Comment state maps
  const [commentText, setCommentText] = useState<Record<string, string>>({});
  const [isCommenting, setIsCommenting] = useState<Record<string, boolean>>({});
  const { showAlert, showConfirm } = useAlertStore();

  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingMedia(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setMediaUrl(data.url);

        const lowerName = file.name.toLowerCase();
        if (lowerName.endsWith(".pdf")) {
          setMediaType("pdf");
        } else if (
          lowerName.endsWith(".mp4") ||
          lowerName.endsWith(".webm") ||
          lowerName.endsWith(".ogg") ||
          lowerName.endsWith(".mov")
        ) {
          setMediaType("video");
        } else {
          setMediaType("image");
        }
      } else {
        showAlert("Upload Failed", "Could not upload file. Please try again.");
      }
    } catch (err) {
      console.error(err);
      showAlert("Upload Error", "An error occurred during file upload.");
    } finally {
      setIsUploadingMedia(false);
    }
  };

  const fetchPosts = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/forums?category=${selectedCategory}`);
      if (res.ok) {
        const data = await res.json();
        setPosts(data);
      }
    } catch (e) {
      console.error("fetch posts error:", e);
    } finally {
      setIsLoading(false);
    }
  }, [selectedCategory]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/forums", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content, category, mediaUrl, mediaType: mediaType || undefined }),
      });
      if (res.ok) {
        setTitle("");
        setContent("");
        setCategory("General");
        setMediaUrl("");
        setMediaType("");
        setIsOpen(false);
        fetchPosts();
      }
    } catch (e) {
      console.error("create post error:", e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpvote = async (postId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await fetch(`/api/forums/${postId}/upvote`, {
        method: "POST",
      });
      if (res.ok) {
        const updatedPost = await res.json();
        setPosts((prev) => prev.map((p) => (p._id === postId ? updatedPost : p)));
      }
    } catch (e) {
      console.error("upvote error:", e);
    }
  };

  const handleAddComment = async (postId: string) => {
    const text = commentText[postId]?.trim();
    if (!text || isCommenting[postId]) return;

    setIsCommenting((prev) => ({ ...prev, [postId]: true }));
    try {
      const res = await fetch(`/api/forums/${postId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: text }),
      });
      if (res.ok) {
        const updatedPost = await res.json();
        setPosts((prev) => prev.map((p) => (p._id === postId ? updatedPost : p)));
        setCommentText((prev) => ({ ...prev, [postId]: "" }));
      }
    } catch (e) {
      console.error("add comment error:", e);
    } finally {
      setIsCommenting((prev) => ({ ...prev, [postId]: false }));
    }
  };

  const handleDelete = async (postId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    showConfirm(
      "Delete Post",
      "Are you sure you want to delete this thread? This is permanent.",
      async () => {
        try {
          const res = await fetch(`/api/forums/${postId}`, { method: "DELETE" });
          if (res.ok) {
            setPosts((prev) => prev.filter((p) => p._id !== postId));
            if (expandedPostId === postId) setExpandedPostId(null);
          }
        } catch (e) {
          console.error("delete post error:", e);
        }
      }
    );
  };

  return (
    <div className="flex-1 flex h-full bg-neutral-950 overflow-hidden relative">
      {/* Ambient background glows */}
      <div className="absolute top-0 right-1/4 w-[400px] h-[300px] bg-cyan-500/5 rounded-full blur-[100px] pointer-events-none" />

      {/* ── Mobile forums-sidebar checkbox toggle ── */}
      <input type="checkbox" id="forums-sidebar-toggle" className="peer hidden" />

      {/* ── Mobile backdrop ── */}
      <label
        htmlFor="forums-sidebar-toggle"
        className="fixed inset-0 bg-black/60 z-40 md:hidden
                   opacity-0 pointer-events-none
                   peer-checked:opacity-100 peer-checked:pointer-events-auto
                   transition-opacity duration-300"
        aria-hidden="true"
      />

      {/* Categories Sidebar */}
      <div className="
        fixed md:static inset-y-0 left-0 z-50
        w-56 shrink-0
        border-r border-neutral-900 bg-neutral-950/98 md:bg-neutral-950/60 backdrop-blur-md
        flex flex-col justify-between
        select-none
        -translate-x-full peer-checked:translate-x-0
        md:translate-x-0
        transition-transform duration-300 ease-in-out
      ">
        <div className="p-4 flex flex-col space-y-4 h-full">
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setIsOpen(true)}
              className="flex-1 bg-cyan-500 hover:bg-cyan-400 text-neutral-950 text-xs font-bold gap-1.5 h-9 rounded-lg transition-all shadow-[0_0_12px_rgba(6,182,212,0.25)]"
              style={{ fontFamily: "var(--font-space-grotesk)" }}
            >
              <Plus className="h-4 w-4" /> New Post
            </Button>
            {/* Close button — mobile only */}
            <label
              htmlFor="forums-sidebar-toggle"
              className="md:hidden p-1.5 rounded-md text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800 cursor-pointer transition-colors"
              aria-label="Close categories"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </label>
          </div>

          <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 custom-scroll">
            <div
              className="text-[9px] font-bold text-neutral-500 uppercase tracking-widest mb-2 px-2"
              style={{ fontFamily: "var(--font-space-grotesk)" }}
            >
              Categories
            </div>
            {CATEGORIES.map((cat) => {
              const isActive = selectedCategory === cat;
              return (
                <div
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`flex items-center gap-2 py-1.5 px-3 rounded-lg cursor-pointer transition-all duration-155 text-xs ${
                    isActive
                      ? "bg-neutral-900 border border-neutral-800 text-neutral-100 font-medium"
                      : "text-neutral-500 hover:text-neutral-300 hover:bg-neutral-900/45"
                  }`}
                >
                  <FolderHeart className={`h-3.5 w-3.5 shrink-0 ${isActive ? "text-cyan-400" : "text-neutral-700"}`} />
                  <span>{cat}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Posts List Grid */}
      <div className="flex-1 flex flex-col h-full bg-neutral-950 overflow-y-auto custom-scroll z-10 relative">
        <div className="border-b border-neutral-900 bg-neutral-950/80 backdrop-blur-md px-4 sm:px-8 py-4 sm:py-6 flex items-center justify-between shrink-0 select-none">
          <div className="space-y-1">
            {/* Mobile hamburger for forums sidebar */}
            <div className="flex items-center gap-3">
              <label
                htmlFor="forums-sidebar-toggle"
                className="md:hidden p-1.5 rounded-md bg-neutral-800 hover:bg-neutral-700 cursor-pointer transition-colors"
                aria-label="Open categories"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-neutral-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </svg>
              </label>
              <MessageSquare className="h-5 w-5 text-cyan-400" />
              <h1
                className="text-xl font-bold text-neutral-100 tracking-tight"
                style={{ fontFamily: "var(--font-space-grotesk)" }}
              >
                Forums
              </h1>
            </div>
            <p className="text-neutral-500 text-xs">Join study threads, post tutorials, ask questions, and share insights.</p>
          </div>
        </div>

        <div className="p-4 sm:p-8 space-y-6 max-w-3xl w-full mx-auto">
          {isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center text-neutral-500 text-xs gap-2 select-none font-semibold">
              <Loader2 className="h-6 w-6 animate-spin text-cyan-400" />
              <span style={{ fontFamily: "var(--font-jetbrains-mono)" }}>SYNCING DISCUSSIONS...</span>
            </div>
          ) : posts.length === 0 ? (
            <div className="py-20 flex flex-col items-center justify-center text-center space-y-4 border border-dashed border-neutral-900 rounded-2xl bg-neutral-900/5 select-none">
              <MessageSquare className="h-10 w-10 text-neutral-700" />
              <div className="space-y-1">
                <h3 className="text-neutral-350 font-bold text-sm" style={{ fontFamily: "var(--font-space-grotesk)" }}>
                  No discussions yet
                </h3>
                <p className="text-neutral-550 text-xs max-w-xs leading-normal">
                  Be the first to post inside the &quot;{selectedCategory}&quot; category!
                </p>
              </div>
            </div>
          ) : (
            <div className="grid gap-4">
              {posts.map((post) => {
                const isExpanded = expandedPostId === post._id;
                const userHasUpvoted = post.upvotes?.some((uid) => uid.toString() === currentUserId);
                const isOwner = currentUserId === post.userId;

                return (
                  <div
                    key={post._id}
                    onClick={() => setExpandedPostId(isExpanded ? null : post._id)}
                    className="bg-neutral-955/40 backdrop-blur-md border border-white/5 hover:border-cyan-500/20 hover:shadow-[0_0_20px_rgba(6,182,212,0.04)] rounded-xl p-5 transition-all duration-300 space-y-4 cursor-pointer"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                          <span
                            className="text-[9px] bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-1.5 py-0.5 rounded font-bold uppercase tracking-widest shrink-0"
                            style={{ fontFamily: "var(--font-jetbrains-mono)" }}
                          >
                            {post.category}
                          </span>
                          <h2
                            className="text-sm font-bold text-neutral-105 leading-snug"
                            style={{ fontFamily: "var(--font-space-grotesk)" }}
                          >
                            {post.title}
                          </h2>
                        </div>
                        <div
                          className="flex items-center gap-2 text-[10px] text-neutral-500 pt-1"
                          style={{ fontFamily: "var(--font-jetbrains-mono)" }}
                        >
                          <span>By: <Link href={`/user/${post.userId}`} className="text-neutral-400 hover:text-cyan-400 transition-colors font-bold" onClick={(e) => e.stopPropagation()}>{post.userName}</Link></span>
                          <span>•</span>
                          <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>

                      {isOwner && (
                        <button
                          onClick={(e) => handleDelete(post._id, e)}
                          className="p-1 rounded hover:bg-neutral-805 text-neutral-500 hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>

                    <p className={`text-neutral-400 text-xs leading-relaxed ${isExpanded ? "" : "line-clamp-2"}`}>
                      {post.content}
                    </p>

                    {post.mediaUrl && (
                      <div className="mt-3 select-none" onClick={(e) => e.stopPropagation()}>
                        {post.mediaType === "image" && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={post.mediaUrl}
                            alt="Forum attachment"
                            className="max-h-[300px] w-full rounded-xl border border-neutral-900 object-contain bg-neutral-950/40"
                          />
                        )}
                        {post.mediaType === "video" && (
                          <video
                            src={post.mediaUrl}
                            controls
                            className="max-h-[300px] w-full rounded-xl border border-neutral-900 object-contain bg-neutral-950/40"
                          />
                        )}
                        {post.mediaType === "pdf" && (
                          <div className="flex items-center gap-3 p-3 bg-neutral-950 border border-neutral-850 rounded-xl max-w-sm">
                            <span className="h-2 w-2 rounded-full bg-red-400 animate-pulse" />
                            <span className="text-[11px] text-neutral-350 font-mono truncate flex-1">
                              {post.mediaUrl.split("/").pop()}
                            </span>
                            <a
                              href={post.mediaUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[10px] bg-neutral-900 border border-neutral-800 hover:border-cyan-400 text-neutral-400 hover:text-cyan-400 font-bold px-2 py-1 rounded transition-colors"
                            >
                              Download PDF
                            </a>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex items-center gap-4 pt-2 border-t border-neutral-900/60 select-none">
                      <button
                        onClick={(e) => handleUpvote(post._id, e)}
                        className={`flex items-center gap-1.5 text-[11px] font-bold py-1 px-2.5 rounded border transition-all ${
                          userHasUpvoted
                            ? "bg-cyan-500/10 border-cyan-500/20 text-cyan-400"
                            : "bg-neutral-900 border-neutral-800 text-neutral-500 hover:text-neutral-350"
                        }`}
                        style={{ fontFamily: "var(--font-space-grotesk)" }}
                      >
                        <ThumbsUp className="h-3 w-3" />
                        <span>{post.upvotes?.length || 0}</span>
                      </button>

                      <div
                        className="flex items-center gap-1.5 text-[11px] text-neutral-500 font-bold"
                        style={{ fontFamily: "var(--font-space-grotesk)" }}
                      >
                        <MessageSquare className="h-3.5 w-3.5 text-neutral-600" />
                        <span>{post.comments?.length || 0} Comments</span>
                      </div>
                    </div>

                    {isExpanded && (
                      <div
                        className="space-y-4 pt-4 border-t border-neutral-900/80 cursor-default"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="space-y-3">
                          {post.comments?.map((comment, index) => (
                            <div key={index} className="flex gap-2 bg-neutral-950 border border-neutral-900/40 p-3 rounded-lg">
                              <CornerDownRight className="h-3.5 w-3.5 text-neutral-700 shrink-0 mt-0.5" />
                              <div className="space-y-1">
                                <div
                                  className="flex items-center gap-2 text-[10px] text-neutral-500 font-bold"
                                  style={{ fontFamily: "var(--font-space-grotesk)" }}
                                >
                                  <span className="text-neutral-300">{comment.userName}</span>
                                  <span>•</span>
                                  <span style={{ fontFamily: "var(--font-jetbrains-mono)" }}>
                                    {new Date(comment.createdAt).toLocaleDateString()}
                                  </span>
                                </div>
                                <p className="text-neutral-400 text-[11px] leading-relaxed">{comment.content}</p>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Comment input form fields */}
                        <div className="flex items-center gap-2 mt-2">
                          <Input
                            placeholder="Add a comment..."
                            value={commentText[post._id] || ""}
                            onChange={(e) => setCommentText((prev) => ({ ...prev, [post._id]: e.target.value }))}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleAddComment(post._id);
                            }}
                            className="flex-1 bg-neutral-950 border-neutral-850 focus:border-cyan-400 text-neutral-100 placeholder-neutral-700 h-8 text-[11px]"
                          />
                          <Button
                            size="icon"
                            onClick={() => handleAddComment(post._id)}
                            disabled={!commentText[post._id]?.trim()}
                            className="bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 text-neutral-950 h-8 w-8 shrink-0 rounded-lg transition-all"
                          >
                            <Send className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Add post dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="bg-neutral-955/80 backdrop-blur-lg border border-white/10 text-neutral-100 max-w-md cyber-panel">
          <form onSubmit={handleCreatePost} className="space-y-4">
            <DialogHeader>
              <DialogTitle
                className="text-neutral-100 text-sm font-bold"
                style={{ fontFamily: "var(--font-space-grotesk)" }}
              >
                Create a Discussion Thread
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3 py-2">
              <Input
                placeholder="Thread Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="input-premium h-10 text-xs placeholder-neutral-600 font-sans"
              />
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full input-premium p-2 text-xs font-space-grotesk"
                style={{ fontFamily: "var(--font-space-grotesk)" }}
              >
                {CATEGORIES.slice(1).map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
              <textarea
                placeholder="Post content details..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
                rows={5}
                className="w-full input-premium placeholder-neutral-700 p-3 text-xs resize-none transition-all"
              />
              
              {/* Media Attachment */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block font-space-grotesk">
                  Media Attachment (Optional)
                </label>
                {mediaUrl ? (
                  <div className="flex items-center justify-between p-2.5 bg-white/[0.02] border border-white/[0.12] rounded-xl text-xs">
                    <span className="text-neutral-450 truncate max-w-[200px] font-mono text-[10px]">
                      {mediaUrl.split("/").pop()} ({mediaType})
                    </span>
                    <button
                      type="button"
                      onClick={() => { setMediaUrl(""); setMediaType(""); }}
                      className="text-[10px] text-red-400 hover:underline font-bold font-space-grotesk"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <label className="flex items-center justify-center border border-dashed border-white/[0.12] hover:border-white/[0.2] bg-white/[0.02] rounded-xl p-3 cursor-pointer transition-all gap-1.5 text-xs text-neutral-400 hover:text-neutral-200">
                    {isUploadingMedia ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin text-cyan-400" />
                        <span className="font-space-grotesk text-[10px] font-bold">Uploading Media...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 text-cyan-400" />
                        <span className="font-space-grotesk text-[10px] font-bold">Upload Image / Video / PDF</span>
                      </>
                    )}
                    <input
                      type="file"
                      accept="image/*,video/*,application/pdf"
                      onChange={handleMediaUpload}
                      disabled={isUploadingMedia}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                type="button"
                onClick={() => setIsOpen(false)}
                className="btn-premium-secondary text-xs h-9 px-4 cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="btn-premium-primary text-xs h-9 px-4 font-bold cursor-pointer"
                style={{ fontFamily: "var(--font-space-grotesk)" }}
              >
                {isSubmitting ? "Posting..." : "Create Post"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
