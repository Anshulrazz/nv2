/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useEffect, useState, useCallback } from "react";
import { MessageSquare, Plus, ThumbsUp, Send, FolderHeart, CornerDownRight, Loader2, Upload, ArrowUpRight, X } from "lucide-react";
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
              <MessageSquare className="size-7" />
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tight text-white flex items-center gap-3">
                Student Forums
                <span className="text-[10px] font-mono font-bold bg-violet-500/20 text-violet-300 px-3 py-1 rounded-full border border-violet-500/30 uppercase tracking-widest">
                  DISCUSSION DISPATCH
                </span>
              </h1>
              <p className="text-zinc-400 text-xs sm:text-sm font-light mt-1">
                Ask questions, share tutorials, and join focused topic discussions with fellow engineers.
              </p>
            </div>
          </div>

          <Button
            onClick={() => setIsOpen(true)}
            className="group rounded-full bg-white hover:bg-zinc-100 text-zinc-950 font-bold text-xs h-11 px-6 flex items-center justify-center gap-2 transition-all duration-300 active:scale-[0.97] shadow-[0_0_20px_rgba(255,255,255,0.15)]"
          >
            <Plus className="size-4 text-zinc-950" />
            <span>New Thread</span>
            <ArrowUpRight className="size-4 text-zinc-950 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </Button>
        </div>
      </div>

      {/* Category Pills & Main Feed Container */}
      <div className="p-6 sm:p-10 max-w-5xl w-full mx-auto space-y-8 relative z-10">
        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none select-none">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`text-xs font-mono font-bold px-4 py-2 rounded-full uppercase tracking-widest transition-all ${
                selectedCategory === cat
                  ? "bg-white/10 border border-white/20 text-white shadow-sm"
                  : "text-zinc-500 hover:text-zinc-300 hover:bg-white/5 border border-transparent"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Loading state */}
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center text-zinc-500 text-xs gap-3 font-semibold">
            <Loader2 className="size-8 animate-spin text-violet-400" />
            <span className="font-mono text-zinc-400 tracking-widest">LOADING FORUM THREADS...</span>
          </div>
        ) : posts.length === 0 ? (
          <div className="rounded-[2.5rem] bg-zinc-900/40 border border-white/10 p-2.5 backdrop-blur-3xl max-w-md mx-auto text-center my-12">
            <div className="rounded-[calc(2.5rem-0.75rem)] bg-[#07070a] border border-white/5 p-8 flex flex-col items-center gap-4">
              <FolderHeart className="size-10 text-zinc-600" />
              <h3 className="text-lg font-bold text-white">No discussions found</h3>
              <p className="text-xs text-zinc-400 font-light max-w-xs">
                Be the first scholar to start a topic thread in this category!
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {posts.map((post) => {
              const isUpvoted = currentUserId ? post.upvotes?.includes(currentUserId) : false;
              const isExpanded = expandedPostId === post._id;

              return (
                <div key={post._id} className="rounded-[2rem] bg-zinc-900/40 border border-white/10 p-2 backdrop-blur-xl">
                  <div
                    onClick={() => setExpandedPostId(isExpanded ? null : post._id)}
                    className="rounded-[calc(2rem-0.5rem)] bg-[#07070a] border border-white/5 p-6 space-y-4 cursor-pointer hover:border-white/20 transition-all duration-300"
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between select-none">
                      <div className="flex items-center gap-3">
                        <span className="text-[9px] font-mono bg-violet-500/10 border border-violet-500/20 text-violet-400 font-bold px-3 py-1 rounded-full uppercase tracking-widest">
                          {post.category}
                        </span>
                        <span className="text-xs font-bold text-zinc-400">
                          By <Link href={`/user/${post.userId}`} onClick={(e) => e.stopPropagation()} className="text-white hover:text-cyan-400 transition-colors">{post.userName}</Link>
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-zinc-500">
                        {new Date(post.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    {/* Content */}
                    <div className="space-y-2">
                      <h2 className="text-lg font-bold text-white hover:text-violet-400 transition-colors tracking-tight">
                        {post.title}
                      </h2>
                      <p className={`text-xs text-zinc-300 font-light leading-relaxed whitespace-pre-wrap ${!isExpanded ? "line-clamp-2" : ""}`}>
                        {post.content}
                      </p>
                    </div>

                    {/* Media preview */}
                    {post.mediaUrl && isExpanded && (
                      <div className="pt-2">
                        {post.mediaType === "image" ? (
                          <img src={post.mediaUrl} alt="Post attachment" className="max-h-80 w-auto rounded-2xl border border-white/10 bg-zinc-950 object-contain" />
                        ) : post.mediaType === "video" ? (
                          <video src={post.mediaUrl} controls className="max-h-80 w-auto rounded-2xl border border-white/10 bg-zinc-950" />
                        ) : (
                          <a href={post.mediaUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-xs font-mono text-cyan-400 underline">
                            View attached PDF document
                          </a>
                        )}
                      </div>
                    )}

                    {/* Engagement Actions */}
                    <div className="flex items-center justify-between border-t border-white/5 pt-4 select-none">
                      <div className="flex items-center gap-4 text-xs font-mono">
                        <button
                          onClick={(e) => handleUpvote(post._id, e)}
                          className={`flex items-center gap-1.5 font-bold transition-colors ${
                            isUpvoted ? "text-violet-400" : "text-zinc-500 hover:text-white"
                          }`}
                        >
                          <ThumbsUp className="size-4" />
                          <span>{post.upvotes?.length || 0}</span>
                        </button>
                        <div className="flex items-center gap-1.5 text-zinc-500 font-bold">
                          <MessageSquare className="size-4" />
                          <span>{post.comments?.length || 0} replies</span>
                        </div>
                      </div>

                      {currentUserId === post.userId && (
                        <button
                          onClick={(e) => handleDelete(post._id, e)}
                          className="text-[10px] font-mono text-zinc-500 hover:text-rose-400 transition-colors uppercase font-bold"
                        >
                          Delete
                        </button>
                      )}
                    </div>

                    {/* Comment Thread Drawer */}
                    {isExpanded && (
                      <div className="border-t border-white/5 pt-4 space-y-4 cursor-default" onClick={(e) => e.stopPropagation()}>
                        <div className="flex gap-2">
                          <Input
                            placeholder="Write a response..."
                            value={commentText[post._id] || ""}
                            onChange={(e) => setCommentText({ ...commentText, [post._id]: e.target.value })}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleAddComment(post._id);
                            }}
                            className="bg-zinc-950 border-white/10 focus:border-violet-400 text-white placeholder-zinc-600 h-10 text-xs rounded-xl"
                          />
                          <Button
                            onClick={() => handleAddComment(post._id)}
                            disabled={isCommenting[post._id]}
                            className="rounded-full bg-white hover:bg-zinc-100 text-zinc-950 text-xs h-10 px-5 font-bold cursor-pointer transition-all"
                          >
                            {isCommenting[post._id] ? <Loader2 className="size-4 animate-spin text-zinc-950" /> : <Send className="size-4 text-zinc-950" />}
                          </Button>
                        </div>

                        {/* List Comments */}
                        <div className="space-y-3">
                          {post.comments?.map((comment, index) => (
                            <div key={index} className="flex gap-3 bg-zinc-950 p-3.5 rounded-2xl border border-white/5">
                              <CornerDownRight className="size-4 text-zinc-600 shrink-0 mt-1" />
                              <div className="space-y-1 min-w-0 flex-1">
                                <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500 select-none">
                                  <span className="font-bold text-white">{comment.userName}</span>
                                  <span>{new Date(comment.createdAt).toLocaleDateString()}</span>
                                </div>
                                <p className="text-xs text-zinc-300 font-light leading-relaxed">{comment.content}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* New Post Dialog Modal */}
      {isOpen && (
        <Dialog open={true} onOpenChange={() => setIsOpen(false)}>
          <DialogContent className="bg-zinc-950 border border-white/10 text-white max-w-lg rounded-3xl p-6">
            <DialogHeader className="flex flex-row items-center justify-between">
              <DialogTitle className="text-lg font-bold text-white">Create New Thread</DialogTitle>
              <button onClick={() => setIsOpen(false)} className="text-zinc-500 hover:text-white">
                <X className="size-4" />
              </button>
            </DialogHeader>

            <form onSubmit={handleCreatePost} className="space-y-4 py-2">
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-widest block">Title</label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Thread topic title..."
                  required
                  className="bg-zinc-900 border-white/10 text-white placeholder-zinc-600 h-11 text-xs rounded-xl"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-widest block">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-zinc-900 border border-white/10 rounded-xl h-11 px-3 text-xs text-white outline-none"
                >
                  {CATEGORIES.filter((c) => c !== "All").map((c) => (
                    <option key={c} value={c} className="bg-zinc-950 text-white">
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-widest block">Discussion Details</label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Elaborate your question, idea, or study topic..."
                  rows={5}
                  required
                  className="w-full bg-zinc-900 border border-white/10 rounded-2xl p-3.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-violet-400 resize-none transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-widest block">Media Attachment (Optional)</label>
                <label className="flex items-center justify-center border border-dashed border-white/10 hover:border-violet-400 bg-zinc-900/60 rounded-2xl p-4 cursor-pointer transition-all gap-2 text-xs font-mono text-zinc-400 hover:text-white">
                  {isUploadingMedia ? (
                    <>
                      <Loader2 className="size-4 animate-spin text-violet-400" />
                      <span>Uploading...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="size-4 text-violet-400" />
                      <span>{mediaUrl ? "Media Attached ✓" : "Upload Image, Video, or PDF"}</span>
                    </>
                  )}
                  <input type="file" onChange={handleMediaUpload} disabled={isUploadingMedia} className="hidden" />
                </label>
              </div>

              <DialogFooter className="pt-2">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full rounded-full bg-white hover:bg-zinc-100 text-zinc-950 font-bold text-xs h-11 transition-all"
                >
                  {isSubmitting ? <Loader2 className="size-4 animate-spin text-zinc-950" /> : "Post Discussion Thread"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
