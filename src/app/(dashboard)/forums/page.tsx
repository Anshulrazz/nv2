/* eslint-disable @next/next/no-img-element */
"use client";

export const dynamic = "force-dynamic";

import React, { useEffect, useState, useCallback } from "react";
import {
  MessageSquare,
  Plus,
  ThumbsUp,
  Send,
  CornerDownRight,
  Loader2,
  Upload,
  X,
  FileText,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useAlertStore } from "@/stores/alertStore";
import { motion } from "framer-motion";

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

  const handleUpvote = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentUserId) return;
    try {
      const res = await fetch(`/api/forums/${id}/upvote`, { method: "POST" });
      if (res.ok) {
        const updated = await res.json();
        setPosts((prev) => prev.map((p) => (p._id === id ? updated : p)));
      }
    } catch (e) {
      console.error("upvote error:", e);
    }
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    showConfirm(
      "Delete Discussion Thread",
      "Are you sure you want to delete this thread? This action cannot be undone.",
      async () => {
        try {
          const res = await fetch(`/api/forums/${id}`, { method: "DELETE" });
          if (res.ok) {
            setPosts((prev) => prev.filter((p) => p._id !== id));
            showAlert("Thread Deleted", "The discussion thread has been removed.");
          }
        } catch (e) {
          console.error("delete post error:", e);
        }
      }
    );
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
        const updated = await res.json();
        setPosts((prev) => prev.map((p) => (p._id === postId ? updated : p)));
        setCommentText((prev) => ({ ...prev, [postId]: "" }));
      }
    } catch (e) {
      console.error("comment error:", e);
    } finally {
      setIsCommenting((prev) => ({ ...prev, [postId]: false }));
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-transparent text-[#FAFAF8] overflow-y-auto custom-scroll relative selection:bg-[#F5B429]/30 selection:text-[#FAFAF8]">
      {/* Header Banner */}
      <div className="p-4 sm:p-6 lg:p-8 pb-0 relative z-10 max-w-5xl w-full mx-auto">
        <div className="border border-[#2E2118] bg-[#150F0B] p-6 sm:p-8 rounded-2xl relative z-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="size-12 rounded-xl bg-[#F5B429]/10 flex items-center justify-center border border-[#F5B429]/25 text-[#F5B429] shrink-0">
                <MessageSquare className="size-6" />
              </div>
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#FAFAF8] font-display">
                    Academic Forums
                  </h1>
                  <span className="text-[10px] font-mono font-bold bg-[#F5B429]/10 text-[#F5B429] px-2.5 py-0.5 rounded-full border border-[#F5B429]/25 uppercase tracking-wider">
                    DISCUSSIONS
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-[#8A8078] font-light mt-1">
                  Peer-to-peer engineering Q&A, tutorials, concept clarifications, and academic study groups.
                </p>
              </div>
            </div>

            <Button
              onClick={() => setIsOpen(true)}
              className="btn-premium-primary text-xs h-10 px-5 rounded-xl flex items-center gap-1.5 shrink-0"
            >
              <Plus className="size-4" />
              <span>New Thread</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Category Pills & Main Feed Container */}
      <div className="p-4 sm:p-6 lg:p-8 max-w-5xl w-full mx-auto space-y-6 relative z-10">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 select-none">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`text-xs font-mono font-semibold px-3.5 py-1.5 rounded-xl transition-all shrink-0 ${
                selectedCategory === cat
                  ? "bg-[#F5B429]/15 text-[#F5B429] border border-[#F5B429]/30"
                  : "bg-[#150F0B] text-[#8A8078] border border-[#2E2118] hover:text-[#FAFAF8] hover:bg-[#241811]"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Loading state */}
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="rounded-2xl bg-[#150F0B] border border-[#2E2118] p-5 space-y-3">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-4 w-20 bg-[#241811] rounded-full" />
                  <Skeleton className="h-3 w-32 bg-[#241811]" />
                </div>
                <Skeleton className="h-5 w-3/4 bg-[#241811]" />
                <Skeleton className="h-3 w-full bg-[#241811]" />
              </div>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="rounded-2xl bg-[#150F0B] border border-[#2E2118] p-10 max-w-md mx-auto text-center space-y-4 my-8">
            <div className="size-12 rounded-xl bg-[#241811] flex items-center justify-center text-[#8A8078] mx-auto">
              <MessageSquare className="size-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#FAFAF8] font-display">No discussions found</h3>
              <p className="text-xs text-[#8A8078] font-light max-w-xs mx-auto mt-1">
                Be the first scholar to start a discussion thread in the {selectedCategory} category!
              </p>
            </div>
            <Button
              onClick={() => setIsOpen(true)}
              className="btn-premium-primary text-xs h-9 px-4 rounded-xl"
            >
              Start First Thread
            </Button>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ staggerChildren: 0.05 }}
            className="space-y-4"
          >
            {posts.map((post) => {
              const isUpvoted = currentUserId ? post.upvotes?.includes(currentUserId) : false;
              const isExpanded = expandedPostId === post._id;

              return (
                <motion.div
                  key={post._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-2xl bg-[#150F0B] border border-[#2E2118] hover:border-[#F5B429]/30 transition-all p-5 sm:p-6 space-y-4"
                >
                  <div
                    onClick={() => setExpandedPostId(isExpanded ? null : post._id)}
                    className="space-y-3 cursor-pointer"
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between select-none">
                      <div className="flex items-center gap-2.5">
                        <span className="text-[10px] font-mono bg-[#F5B429]/10 border border-[#F5B429]/25 text-[#F5B429] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                          {post.category}
                        </span>
                        <span className="text-xs text-[#8A8078]">
                          By{" "}
                          <Link
                            href={`/user/${post.userId}`}
                            onClick={(e) => e.stopPropagation()}
                            className="text-[#FAFAF8] hover:text-[#F5B429] transition-colors font-semibold"
                          >
                            {post.userName}
                          </Link>
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-[#8A8078]">
                        {new Date(post.createdAt).toLocaleDateString([], {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>

                    {/* Title & Body */}
                    <div className="space-y-1.5">
                      <h2 className="text-base sm:text-lg font-bold text-[#FAFAF8] hover:text-[#F5B429] transition-colors font-display">
                        {post.title}
                      </h2>
                      <p className={`text-xs text-[#B8AFA6] font-light leading-relaxed whitespace-pre-wrap ${!isExpanded ? "line-clamp-2" : ""}`}>
                        {post.content}
                      </p>
                    </div>

                    {/* Media preview */}
                    {post.mediaUrl && isExpanded && (
                      <div className="pt-2">
                        {post.mediaType === "image" ? (
                          <img
                            src={post.mediaUrl}
                            alt="Discussion attachment"
                            className="max-h-80 w-auto rounded-xl border border-[#241811] bg-[#0A0806] object-contain"
                          />
                        ) : post.mediaType === "video" ? (
                          <video
                            src={post.mediaUrl}
                            controls
                            className="max-h-80 w-auto rounded-xl border border-[#241811] bg-[#0A0806]"
                          />
                        ) : (
                          <a
                            href={post.mediaUrl}
                            target="_blank"
                            rel="noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-2 text-xs font-mono text-[#F5B429] bg-[#F5B429]/10 border border-[#F5B429]/25 px-3 py-1.5 rounded-lg hover:bg-[#F5B429]/20 transition-colors"
                          >
                            <FileText className="size-3.5" />
                            <span>View attached PDF document</span>
                          </a>
                        )}
                      </div>
                    )}

                    {/* Engagement Actions */}
                    <div className="flex items-center justify-between border-t border-[#241811] pt-3 select-none">
                      <div className="flex items-center gap-3 text-xs font-mono">
                        <button
                          onClick={(e) => handleUpvote(post._id, e)}
                          className={`flex items-center gap-1.5 font-semibold px-2.5 py-1 rounded-lg border transition-colors ${
                            isUpvoted
                              ? "bg-[#F5B429]/15 border-[#F5B429]/30 text-[#F5B429]"
                              : "bg-[#0A0806] border-[#2E2118] text-[#8A8078] hover:text-[#FAFAF8]"
                          }`}
                        >
                          <ThumbsUp className="size-3.5" />
                          <span>{post.upvotes?.length || 0}</span>
                        </button>

                        <div className="flex items-center gap-1.5 text-[#8A8078] font-semibold px-2.5 py-1 rounded-lg border border-transparent">
                          <MessageSquare className="size-3.5" />
                          <span>{post.comments?.length || 0} replies</span>
                        </div>
                      </div>

                      {currentUserId === post.userId && (
                        <button
                          onClick={(e) => handleDelete(post._id, e)}
                          className="text-xs font-mono text-[#8A8078] hover:text-[#EF4444] transition-colors flex items-center gap-1"
                        >
                          <Trash2 className="size-3" />
                          <span>Delete</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Comment / Reply Drawer */}
                  {isExpanded && (
                    <div className="border-t border-[#241811] pt-4 space-y-4">
                      {/* Reply Input */}
                      <div className="flex gap-2">
                        <Input
                          type="text"
                          placeholder="Write a reply to this thread..."
                          value={commentText[post._id] || ""}
                          onChange={(e) => setCommentText({ ...commentText, [post._id]: e.target.value })}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleAddComment(post._id);
                          }}
                          className="bg-[#0A0806] border-[#2E2118] focus:border-[#F5B429]/50 text-[#FAFAF8] placeholder:text-[#8A8078] h-9 text-xs rounded-xl"
                        />
                        <Button
                          onClick={() => handleAddComment(post._id)}
                          disabled={!commentText[post._id]?.trim() || isCommenting[post._id]}
                          className="btn-premium-primary text-xs h-9 px-4 rounded-xl shrink-0"
                        >
                          {isCommenting[post._id] ? (
                            <Loader2 className="size-3.5 animate-spin" />
                          ) : (
                            <Send className="size-3.5" />
                          )}
                        </Button>
                      </div>

                      {/* Reply List */}
                      {post.comments && post.comments.length > 0 && (
                        <div className="max-h-72 overflow-y-auto space-y-2.5 custom-scroll pr-1">
                          {post.comments.map((comment, index) => (
                            <div
                              key={index}
                              className="flex gap-2.5 bg-[#0A0806] p-3 rounded-xl border border-[#241811] text-xs"
                            >
                              <CornerDownRight className="size-3.5 text-[#F5B429] shrink-0 mt-0.5" />
                              <div className="space-y-0.5 min-w-0 flex-1">
                                <div className="flex items-center justify-between text-[10px] font-mono text-[#8A8078] select-none">
                                  <span className="font-bold text-[#FAFAF8] font-display">{comment.userName}</span>
                                  <span>{new Date(comment.createdAt).toLocaleDateString()}</span>
                                </div>
                                <p className="text-[#B8AFA6] leading-relaxed font-light">{comment.content}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </div>

      {/* New Thread Dialog Modal */}
      {isOpen && (
        <Dialog open={true} onOpenChange={() => setIsOpen(false)}>
          <DialogContent className="bg-[#150F0B] border border-[#2E2118] text-[#FAFAF8] max-w-lg rounded-2xl p-6 shadow-2xl">
            <DialogHeader className="flex flex-row items-center justify-between border-b border-[#241811] pb-3">
              <DialogTitle className="text-base font-bold text-[#FAFAF8] font-display">
                Create New Thread
              </DialogTitle>
              <button
                onClick={() => setIsOpen(false)}
                className="size-7 rounded-lg text-[#8A8078] hover:text-[#FAFAF8] hover:bg-[#241811] flex items-center justify-center"
              >
                <X className="size-4" />
              </button>
            </DialogHeader>

            <form onSubmit={handleCreatePost} className="space-y-4 py-2">
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono font-bold text-[#8A8078] uppercase tracking-wider block">
                  Thread Title
                </label>
                <Input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Solving Laplace Transforms for Circuit Analysis..."
                  required
                  className="bg-[#0A0806] border-[#2E2118] focus:border-[#F5B429]/50 text-[#FAFAF8] placeholder:text-[#8A8078] h-10 text-xs rounded-xl"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-mono font-bold text-[#8A8078] uppercase tracking-wider block">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-[#0A0806] border border-[#2E2118] rounded-xl h-10 px-3 text-xs text-[#FAFAF8] outline-none focus:border-[#F5B429]/50"
                >
                  {CATEGORIES.filter((c) => c !== "All").map((c) => (
                    <option key={c} value={c} className="bg-[#150F0B] text-[#FAFAF8]">
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-mono font-bold text-[#8A8078] uppercase tracking-wider block">
                  Discussion Details
                </label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Elaborate your question, derivation, or study notes..."
                  rows={4}
                  required
                  className="w-full bg-[#0A0806] border border-[#2E2118] rounded-xl p-3 text-xs text-[#FAFAF8] placeholder:text-[#8A8078] focus:outline-none focus:border-[#F5B429]/50 resize-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-mono font-bold text-[#8A8078] uppercase tracking-wider block">
                  Media Attachment (Optional)
                </label>
                <label className="flex items-center justify-center border border-dashed border-[#2E2118] hover:border-[#F5B429]/50 bg-[#0A0806] rounded-xl p-3.5 cursor-pointer transition-all gap-2 text-xs font-mono text-[#8A8078] hover:text-[#FAFAF8]">
                  {isUploadingMedia ? (
                    <>
                      <Loader2 className="size-4 animate-spin text-[#F5B429]" />
                      <span>Uploading media...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="size-4 text-[#F5B429]" />
                      <span>{mediaUrl ? "Attachment Ready ✓" : "Upload Image, Video, or PDF"}</span>
                    </>
                  )}
                  <input type="file" onChange={handleMediaUpload} disabled={isUploadingMedia} className="hidden" />
                </label>
              </div>

              <DialogFooter className="pt-2 border-t border-[#241811]">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-premium-primary w-full text-xs h-10 rounded-xl"
                >
                  {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : "Post Discussion Thread"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
