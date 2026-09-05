/* eslint-disable @next/next/no-img-element */
"use client";

export const dynamic = "force-dynamic";

import React, { useEffect, useState, useCallback } from "react";
import {
  Users,
  Plus,
  Heart,
  MessageSquare,
  Send,
  Loader2,
  Image as ImageIcon,
  X,
  Trash2,
  Edit3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useSession } from "next-auth/react";
import { useAlertStore } from "@/stores/alertStore";
import Link from "next/link";
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
  userId: string;
  userName: string;
  userImage?: string;
  content: string;
  mediaUrl?: string;
  mediaType?: string;
  likes: string[];
  comments: CommentData[];
  createdAt: string;
}

export default function CommunityPage() {
  const { data: session } = useSession();
  const currentUserId = session?.user?.id;

  const [posts, setPosts] = useState<PostData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // New Post modal states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [content, setContent] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [mediaType, setMediaType] = useState<"image" | "video" | "">("");
  const [isUploading, setIsUploading] = useState(false);
  const [isPosting, setIsPosting] = useState(false);

  // Edit Post modal states
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editPostId, setEditPostId] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editMediaUrl, setEditMediaUrl] = useState("");
  const [editMediaType, setEditMediaType] = useState<"image" | "video" | "">("");
  const [isUpdating, setIsUpdating] = useState(false);

  // Expanded comments and text inputs
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});
  const [commentInput, setCommentInput] = useState<Record<string, string>>({});
  const [isCommenting, setIsCommenting] = useState<Record<string, boolean>>({});

  const { showAlert } = useAlertStore();

  const fetchPosts = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/community");
      if (res.ok) {
        const data = await res.json();
        setPosts(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (res.ok) {
        const data = await res.json();
        setMediaUrl(data.url);
        const lower = file.name.toLowerCase();
        if (lower.endsWith(".mp4") || lower.endsWith(".webm") || lower.endsWith(".mov") || lower.endsWith(".ogg")) {
          setMediaType("video");
        } else {
          setMediaType("image");
        }
      } else {
        showAlert("Upload Failed", "Could not upload media file.");
      }
    } catch (err) {
      console.error(err);
      showAlert("Upload Error", "An error occurred while uploading media.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || isPosting) return;

    setIsPosting(true);
    try {
      const res = await fetch("/api/community", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: content.trim(),
          mediaUrl: mediaUrl || undefined,
          mediaType: mediaType || undefined,
        }),
      });

      if (res.ok) {
        setContent("");
        setMediaUrl("");
        setMediaType("");
        setIsCreateOpen(false);
        fetchPosts();
        showAlert("Posted!", "Your post is live! You earned +10 Leaderboard points.");
      } else {
        const err = await res.json();
        showAlert("Post Failed", err.error || "Could not publish community post.");
      }
    } catch (err) {
      console.error(err);
      showAlert("Post Error", "An error occurred while creating post.");
    } finally {
      setIsPosting(false);
    }
  };

  const handleUpdatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editContent.trim() || isUpdating) return;

    setIsUpdating(true);
    try {
      const res = await fetch(`/api/community/${editPostId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: editContent.trim(),
          mediaUrl: editMediaUrl || undefined,
          mediaType: editMediaType || undefined,
        }),
      });

      if (res.ok) {
        setIsEditOpen(false);
        fetchPosts();
        showAlert("Updated!", "Your post has been updated successfully.");
      } else {
        const err = await res.json();
        showAlert("Update Failed", err.error || "Could not update post.");
      }
    } catch (err) {
      console.error(err);
      showAlert("Update Error", "An error occurred while updating post.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm("Are you sure you want to delete this post?")) return;
    try {
      const res = await fetch(`/api/community/${postId}`, { method: "DELETE" });
      if (res.ok) {
        setPosts((prev) => prev.filter((p) => p._id !== postId));
        showAlert("Deleted!", "Your post was deleted.");
      } else {
        const err = await res.json();
        showAlert("Delete Failed", err.error || "Could not delete post.");
      }
    } catch (e) {
      console.error(e);
      showAlert("Delete Error", "An error occurred while deleting post.");
    }
  };

  const openEditModal = (post: PostData) => {
    setEditPostId(post._id);
    setEditContent(post.content);
    setEditMediaUrl(post.mediaUrl || "");
    setEditMediaType((post.mediaType as "image" | "video" | "") || "");
    setIsEditOpen(true);
  };

  const handleLikeToggle = async (postId: string) => {
    try {
      const res = await fetch(`/api/community/${postId}/like`, { method: "POST" });
      if (res.ok) {
        const updated = await res.json();
        setPosts((prev) => prev.map((p) => (p._id === postId ? updated : p)));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddComment = async (postId: string) => {
    const text = commentInput[postId]?.trim();
    if (!text || isCommenting[postId]) return;

    setIsCommenting((prev) => ({ ...prev, [postId]: true }));
    try {
      const res = await fetch(`/api/community/${postId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: text }),
      });
      if (res.ok) {
        const updated = await res.json();
        setPosts((prev) => prev.map((p) => (p._id === postId ? updated : p)));
        setCommentInput((prev) => ({ ...prev, [postId]: "" }));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsCommenting((prev) => ({ ...prev, [postId]: false }));
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-transparent text-[#FAFAF8] overflow-y-auto custom-scroll relative selection:bg-[#F5B429]/30 selection:text-[#FAFAF8]">
      {/* Header Banner */}
      <div className="p-4 sm:p-6 lg:p-8 pb-0 relative z-10 max-w-3xl w-full mx-auto">
        <div className="border border-[#2E2118] bg-[#150F0B] p-6 sm:p-8 rounded-2xl relative z-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="size-12 rounded-xl bg-[#F5B429]/10 flex items-center justify-center border border-[#F5B429]/25 text-[#F5B429] shrink-0">
                <Users className="size-6" />
              </div>
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#FAFAF8] font-display">
                    Community Hub
                  </h1>
                  <span className="text-[10px] font-mono font-bold bg-[#F5B429]/10 text-[#F5B429] px-2.5 py-0.5 rounded-full border border-[#F5B429]/25 uppercase tracking-wider">
                    LIVE FEED
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-[#8A8078] font-light mt-1">
                  Connect with peer scholars, share learning milestones, and discuss university coursework.
                </p>
              </div>
            </div>

            <Button
              onClick={() => setIsCreateOpen(true)}
              className="btn-premium-primary text-xs h-10 px-5 rounded-xl flex items-center gap-1.5 shrink-0"
            >
              <Plus className="size-4" />
              <span>Create Post</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Posts Feed Container */}
      <div className="p-4 sm:p-6 lg:p-8 max-w-3xl w-full mx-auto space-y-6 relative z-10">
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="rounded-2xl bg-[#150F0B] border border-[#2E2118] p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <Skeleton className="size-9 rounded-full bg-[#241811]" />
                  <div className="space-y-1.5 flex-1">
                    <Skeleton className="h-4 w-32 bg-[#241811]" />
                    <Skeleton className="h-3 w-20 bg-[#241811]" />
                  </div>
                </div>
                <Skeleton className="h-14 w-full bg-[#241811]" />
                <Skeleton className="h-8 w-40 bg-[#241811]" />
              </div>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="rounded-2xl bg-[#150F0B] border border-[#2E2118] p-10 max-w-md mx-auto text-center space-y-4 my-8">
            <div className="size-12 rounded-xl bg-[#241811] flex items-center justify-center text-[#8A8078] mx-auto">
              <Users className="size-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#FAFAF8] font-display">Community feed is quiet</h3>
              <p className="text-xs text-[#8A8078] font-light max-w-xs mx-auto mt-1">
                Be the first scholar to share an update, study question, or engineering breakthrough!
              </p>
            </div>
            <Button
              onClick={() => setIsCreateOpen(true)}
              className="btn-premium-primary text-xs h-9 px-4 rounded-xl"
            >
              Create First Post
            </Button>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ staggerChildren: 0.05 }}
            className="space-y-5"
          >
            {posts.map((post) => {
              const isLiked = post.likes?.includes(currentUserId || "");
              const isExpanded = !!expandedComments[post._id];

              return (
                <motion.div
                  key={post._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-2xl bg-[#150F0B] border border-[#2E2118] hover:border-[#F5B429]/30 transition-all p-5 sm:p-6 space-y-4"
                >
                  {/* Post Author Header */}
                  <div className="flex items-center gap-3 select-none">
                    {post.userImage ? (
                      <img
                        src={post.userImage}
                        alt={post.userName}
                        className="size-9 rounded-full object-cover border border-[#2E2118] bg-[#0A0806]"
                      />
                    ) : (
                      <div className="size-9 rounded-full bg-[#241811] border border-[#2E2118] flex items-center justify-center text-[#F5B429] text-xs font-bold font-mono">
                        {post.userName?.[0]?.toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <Link href={`/user/${post.userId}`}>
                        <p className="text-xs font-bold text-[#FAFAF8] hover:text-[#F5B429] transition-colors leading-tight font-display truncate">
                          {post.userName}
                        </p>
                      </Link>
                      <p className="text-[10px] font-mono text-[#8A8078] mt-0.5">
                        {new Date(post.createdAt).toLocaleString([], {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    {post.userId === currentUserId && (
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => openEditModal(post)}
                          className="size-7 rounded-lg flex items-center justify-center text-[#8A8078] hover:text-[#FAFAF8] hover:bg-[#241811] transition-colors"
                          title="Edit Post"
                        >
                          <Edit3 className="size-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeletePost(post._id)}
                          className="size-7 rounded-lg flex items-center justify-center text-[#8A8078] hover:text-[#EF4444] hover:bg-[#241811] transition-colors"
                          title="Delete Post"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Post Content */}
                  <p className="text-[#FAFAF8] text-xs sm:text-sm leading-relaxed whitespace-pre-wrap font-light">
                    {post.content}
                  </p>

                  {/* Media Attachment */}
                  {post.mediaUrl && (
                    <div className="rounded-xl overflow-hidden border border-[#241811] bg-[#0A0806]">
                      {post.mediaType === "image" ? (
                        <img
                          src={post.mediaUrl}
                          alt="Post attachment"
                          className="max-h-80 w-full object-contain bg-[#0A0806]"
                        />
                      ) : (
                        <video
                          src={post.mediaUrl}
                          controls
                          className="max-h-80 w-full object-contain bg-[#0A0806]"
                        />
                      )}
                    </div>
                  )}

                  {/* Engagement Action Bar */}
                  <div className="flex items-center gap-3 pt-3 border-t border-[#241811] select-none">
                    <button
                      onClick={() => handleLikeToggle(post._id)}
                      className={`flex items-center gap-1.5 text-xs font-mono font-semibold py-1 px-3 rounded-lg border transition-all ${
                        isLiked
                          ? "bg-[#F5B429]/15 border-[#F5B429]/30 text-[#F5B429]"
                          : "bg-[#0A0806] border-[#2E2118] text-[#8A8078] hover:text-[#FAFAF8] hover:bg-[#241811]"
                      }`}
                    >
                      <Heart className={`size-3.5 ${isLiked ? "fill-[#F5B429] text-[#F5B429]" : ""}`} />
                      <span>{post.likes?.length || 0}</span>
                    </button>

                    <button
                      onClick={() => setExpandedComments((prev) => ({ ...prev, [post._id]: !prev[post._id] }))}
                      className={`flex items-center gap-1.5 text-xs font-mono font-semibold py-1 px-3 rounded-lg border transition-all ${
                        isExpanded
                          ? "bg-[#241811] border-[#2E2118] text-[#FAFAF8]"
                          : "bg-[#0A0806] border-[#2E2118] text-[#8A8078] hover:text-[#FAFAF8] hover:bg-[#241811]"
                      }`}
                    >
                      <MessageSquare className="size-3.5 text-[#8A8078]" />
                      <span>{post.comments?.length || 0} Comments</span>
                    </button>
                  </div>

                  {/* Compact Comment Thread Drawer */}
                  {isExpanded && (
                    <div className="space-y-3 pt-3 border-t border-[#241811]">
                      {post.comments && post.comments.length > 0 && (
                        <div className="max-h-72 overflow-y-auto space-y-2 custom-scroll pr-1">
                          {post.comments.map((comment, index) => (
                            <div
                              key={index}
                              className="bg-[#0A0806] border border-[#241811] p-3 rounded-xl flex gap-2.5 items-start text-xs"
                            >
                              <div className="size-6 rounded-full bg-[#241811] border border-[#2E2118] flex items-center justify-center text-[#F5B429] font-bold text-[9px] mt-0.5 shrink-0">
                                {comment.userName?.[0]?.toUpperCase()}
                              </div>
                              <div className="space-y-0.5 min-w-0 flex-1">
                                <div className="flex items-center gap-2 text-[10px] font-mono select-none">
                                  <span className="font-bold text-[#FAFAF8] font-display">{comment.userName}</span>
                                  <span className="text-[#8A8078]">{new Date(comment.createdAt).toLocaleDateString()}</span>
                                </div>
                                <p className="text-[#B8AFA6] leading-relaxed font-light">{comment.content}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Comment Input */}
                      <div className="flex items-center gap-2">
                        <Input
                          type="text"
                          placeholder="Write a comment..."
                          value={commentInput[post._id] || ""}
                          onChange={(e) => setCommentInput((prev) => ({ ...prev, [post._id]: e.target.value }))}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleAddComment(post._id);
                          }}
                          className="flex-1 bg-[#0A0806] border-[#2E2118] focus:border-[#F5B429]/50 text-[#FAFAF8] placeholder:text-[#8A8078] h-9 text-xs rounded-xl"
                        />
                        <Button
                          onClick={() => handleAddComment(post._id)}
                          disabled={!commentInput[post._id]?.trim() || isCommenting[post._id]}
                          className="btn-premium-primary h-9 px-4 rounded-xl text-xs shrink-0"
                        >
                          {isCommenting[post._id] ? (
                            <Loader2 className="size-3.5 animate-spin" />
                          ) : (
                            <Send className="size-3.5" />
                          )}
                        </Button>
                      </div>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </div>

      {/* Create / Edit Post Modal */}
      {(isCreateOpen || isEditOpen) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-lg bg-[#150F0B] border border-[#2E2118] rounded-2xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#241811] pb-3">
              <h2 className="text-base font-bold text-[#FAFAF8] font-display">
                {isEditOpen ? "Edit Community Post" : "Create Community Post"}
              </h2>
              <button
                onClick={() => {
                  setIsCreateOpen(false);
                  setIsEditOpen(false);
                }}
                className="size-7 rounded-lg text-[#8A8078] hover:text-[#FAFAF8] hover:bg-[#241811] flex items-center justify-center"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={isEditOpen ? handleUpdatePost : handleCreatePost} className="space-y-4">
              <textarea
                value={isEditOpen ? editContent : content}
                onChange={(e) => (isEditOpen ? setEditContent(e.target.value) : setContent(e.target.value))}
                placeholder="What's on your mind? Share knowledge, engineering concepts, or questions..."
                rows={4}
                required
                autoFocus
                className="w-full rounded-xl bg-[#0A0806] border border-[#2E2118] focus:border-[#F5B429]/50 text-[#FAFAF8] placeholder:text-[#8A8078] p-3.5 text-xs outline-none resize-none transition-colors"
              />

              {(isEditOpen ? editMediaUrl : mediaUrl) && (
                <div className="relative inline-flex items-center justify-start max-h-48 rounded-xl overflow-hidden border border-[#241811] bg-[#0A0806]">
                  {(isEditOpen ? editMediaType : mediaType) === "image" ? (
                    <img
                      src={isEditOpen ? editMediaUrl : mediaUrl}
                      alt="Upload preview"
                      className="max-h-48 object-contain w-auto bg-[#0A0806]"
                    />
                  ) : (
                    <video
                      src={isEditOpen ? editMediaUrl : mediaUrl}
                      controls
                      className="max-h-48 object-contain w-auto bg-[#0A0806]"
                    />
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      if (isEditOpen) {
                        setEditMediaUrl("");
                        setEditMediaType("");
                      } else {
                        setMediaUrl("");
                        setMediaType("");
                      }
                    }}
                    className="absolute top-2 right-2 bg-[#0A0806]/90 text-[#EF4444] p-1 rounded-lg border border-[#EF4444]/30"
                  >
                    <X className="size-3.5" />
                  </button>
                </div>
              )}

              <div className="flex items-center justify-between pt-2 border-t border-[#241811]">
                <label className="flex items-center gap-2 py-2 px-3.5 rounded-xl border border-[#2E2118] bg-[#0A0806] hover:bg-[#241811] text-xs font-mono text-[#8A8078] hover:text-[#FAFAF8] cursor-pointer transition-all">
                  {isUploading ? (
                    <Loader2 className="size-4 text-[#F5B429] animate-spin" />
                  ) : (
                    <ImageIcon className="size-4 text-[#F5B429]" />
                  )}
                  <span>
                    {(isEditOpen ? editMediaUrl : mediaUrl) ? "Media Attached ✓" : "Add Photo / Video"}
                  </span>
                  <input
                    type="file"
                    accept="image/*,video/*"
                    onChange={handleMediaUpload}
                    disabled={isUploading}
                    className="hidden"
                  />
                </label>

                <Button
                  type="submit"
                  disabled={isPosting || isUpdating}
                  className="btn-premium-primary text-xs h-10 px-6 rounded-xl"
                >
                  {isPosting || isUpdating ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : isEditOpen ? (
                    "Save Changes"
                  ) : (
                    "Publish Post"
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
