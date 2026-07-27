/* eslint-disable @next/next/no-img-element */
"use client";

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
  ArrowUpRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
    <div className="flex-1 flex flex-col h-full bg-[#16261D] text-[#F3F0E4] overflow-y-auto custom-scroll relative selection:bg-[#F0C93B]/30 selection:text-[#F0C93B]">
      {/* Background Ambient Mesh Glow Orbs */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 right-1/4 w-[500px] h-[350px] bg-[#8FC3DE]/10 rounded-full blur-[140px] animate-float-glow" />
        <div className="absolute bottom-0 left-1/4 w-[450px] h-[350px] bg-[#C9A9E0]/10 rounded-full blur-[140px] animate-float-glow-reverse" />
      </div>

      {/* Header Banner */}
      <div className="p-4 sm:p-8 lg:p-10 pb-0 relative z-10">
        <div className="border border-[#F3F0E4]/15 bg-[#1A2D23]/80 p-6 sm:p-8 rounded-[2rem] relative z-10 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.3)]">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="size-14 rounded-2xl bg-[#F0C93B]/10 flex items-center justify-center border border-[#F0C93B]/30 text-[#F0C93B] shadow-[2px_2px_0_0_#F28B6E] shrink-0">
                <Users className="size-7" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[#F3F0E4] flex items-center gap-2.5 flex-wrap font-heading">
                  Community Hub
                  <span className="text-[10px] font-mono font-bold bg-[#F0C93B]/15 text-[#F0C93B] px-3 py-1 rounded-full border border-[#F0C93B]/30 uppercase tracking-widest">
                    LIVE FEED
                  </span>
                </h1>
                <p className="text-[#9FAEA1] text-xs sm:text-sm font-light mt-1">
                  Connect with student scholars, post updates, and earn activity points across university batches.
                </p>
              </div>
            </div>

            <Button
              onClick={() => setIsCreateOpen(true)}
              className="group rounded-xl bg-[#F0C93B] hover:bg-[#F0C93B]/90 text-[#2A2118] font-bold text-xs h-11 px-6 flex items-center justify-center gap-2 transition-all duration-300 active:scale-[0.97] shadow-[4px_4px_0_0_#F28B6E] font-heading"
            >
              <Plus className="size-4 text-[#2A2118]" />
              <span>Create Post</span>
              <ArrowUpRight className="size-4 text-[#2A2118] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </Button>
          </div>
        </div>
      </div>

      {/* Posts Feed Container */}
      <div className="p-4 sm:p-8 lg:p-10 max-w-3xl w-full mx-auto space-y-8 relative z-10">
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center text-[#9FAEA1] text-xs gap-3 font-semibold">
            <Loader2 className="size-8 animate-spin text-[#F0C93B]" />
            <span className="font-mono text-[#F0C93B] tracking-widest">SYNCING COMMUNITY STREAM...</span>
          </div>
        ) : posts.length === 0 ? (
          <div className="rounded-[2.5rem] bg-[#1A2D23]/80 border border-[#F3F0E4]/15 p-2.5 backdrop-blur-3xl max-w-md mx-auto text-center my-12 shadow-[0_15px_40px_rgba(0,0,0,0.3)]">
            <div className="rounded-[calc(2.5rem-0.75rem)] bg-[#121F18] border border-[#F3F0E4]/10 p-8 flex flex-col items-center gap-4">
              <Users className="size-10 text-[#9FAEA1]" />
              <h3 className="text-lg font-bold text-[#F3F0E4] font-heading">Community feed empty</h3>
              <p className="text-xs text-[#9FAEA1] font-light max-w-xs">
                Share the first post to start conversations with peer engineers!
              </p>
              <Button
                onClick={() => setIsCreateOpen(true)}
                className="rounded-xl bg-[#F0C93B] hover:bg-[#F0C93B]/90 text-[#2A2118] text-xs font-bold h-9 px-5 mt-2 shadow-[2px_2px_0_0_#F28B6E]"
              >
                Create First Post
              </Button>
            </div>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ staggerChildren: 0.08 }}
            className="space-y-6"
          >
            {posts.map((post) => {
              const isLiked = post.likes?.includes(currentUserId || "");
              const isExpanded = !!expandedComments[post._id];

              return (
                <motion.div
                  key={post._id}
                  whileHover={{ y: -3 }}
                  transition={{ type: "spring", stiffness: 350, damping: 22 }}
                  className="rounded-[2rem] bg-[#1A2D23]/80 border border-[#F3F0E4]/15 p-2 backdrop-blur-xl hover:border-[#F0C93B]/40 transition-all duration-300 shadow-[0_10px_30px_rgba(0,0,0,0.25)]"
                >
                  <div className="rounded-[calc(2rem-0.5rem)] bg-[#121F18] border border-[#F3F0E4]/10 p-6 space-y-5">
                    {/* Post Header */}
                    <div className="flex items-center gap-3 select-none">
                      {post.userImage ? (
                        <img src={post.userImage} alt={post.userName} className="size-9 rounded-full object-cover border border-[#F3F0E4]/20 bg-[#16261D]" />
                      ) : (
                        <div className="size-9 rounded-full bg-[#16261D] border border-[#F3F0E4]/20 flex items-center justify-center text-[#F0C93B] text-xs font-bold">
                          {post.userName?.[0]?.toUpperCase()}
                        </div>
                      )}
                      <div>
                        <Link href={`/user/${post.userId}`}>
                          <p className="text-xs font-bold text-[#F3F0E4] hover:text-[#F0C93B] transition-colors leading-tight font-heading">
                            {post.userName}
                          </p>
                        </Link>
                        <p className="text-[10px] font-mono text-[#9FAEA1] mt-0.5">
                          {new Date(post.createdAt).toLocaleString()}
                        </p>
                      </div>
                      {post.userId === currentUserId && (
                        <div className="ml-auto flex items-center gap-2">
                          <button onClick={() => openEditModal(post)} className="text-[#9FAEA1] hover:text-[#F3F0E4] transition-colors">
                            <Edit3 className="size-4" />
                          </button>
                          <button onClick={() => handleDeletePost(post._id)} className="text-[#9FAEA1] hover:text-[#F28B6E] transition-colors">
                            <Trash2 className="size-4" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Post Content */}
                    <p className="text-[#F3F0E4] text-xs sm:text-sm leading-relaxed whitespace-pre-wrap font-light">{post.content}</p>

                    {/* Media Attachment */}
                    {post.mediaUrl && (
                      <div className="flex items-center justify-start w-full">
                        {post.mediaType === "image" ? (
                          <img src={post.mediaUrl} alt="Post content" className="max-h-[300px] object-contain w-auto rounded-2xl border border-[#F3F0E4]/15 bg-[#16261D]" />
                        ) : (
                          <video src={post.mediaUrl} controls className="max-h-[300px] object-contain w-auto rounded-2xl border border-[#F3F0E4]/15 bg-[#16261D]" />
                        )}
                      </div>
                    )}

                    {/* Engagement Actions */}
                    <div className="flex items-center gap-4 pt-3 border-t border-[#F3F0E4]/10 select-none">
                      <button
                        onClick={() => handleLikeToggle(post._id)}
                        className={`flex items-center gap-1.5 text-xs font-mono font-bold py-1 px-3 rounded-full border transition-all ${
                          isLiked
                            ? "bg-[#F0C93B]/15 border-[#F0C93B]/30 text-[#F0C93B]"
                            : "bg-[#16261D] border-[#F3F0E4]/15 text-[#9FAEA1] hover:text-[#F3F0E4]"
                        }`}
                      >
                        <Heart className={`size-3.5 ${isLiked ? "fill-[#F0C93B] text-[#F0C93B]" : ""}`} />
                        <span>{post.likes?.length || 0}</span>
                      </button>

                      <button
                        onClick={() => setExpandedComments((prev) => ({ ...prev, [post._id]: !prev[post._id] }))}
                        className={`flex items-center gap-1.5 text-xs font-mono font-bold py-1 px-3 rounded-full border transition-all ${
                          isExpanded
                            ? "bg-[#8FC3DE]/15 border-[#8FC3DE]/30 text-[#8FC3DE]"
                            : "bg-[#16261D] border-[#F3F0E4]/15 text-[#9FAEA1] hover:text-[#F3F0E4]"
                        }`}
                      >
                        <MessageSquare className="size-3.5 text-[#9FAEA1]" />
                        <span>{post.comments?.length || 0} Comments</span>
                      </button>
                    </div>

                    {/* Comments section */}
                    {isExpanded && (
                      <div className="space-y-3 pt-3 border-t border-[#F3F0E4]/10">
                        {post.comments?.map((comment, index) => (
                          <div key={index} className="bg-[#16261D] border border-[#F3F0E4]/10 p-3.5 rounded-2xl flex gap-3 items-start">
                            <div className="size-6 rounded-full bg-[#121F18] border border-[#F3F0E4]/15 flex items-center justify-center text-[#F0C93B] font-bold text-[9px] mt-0.5 shrink-0">
                              {comment.userName?.[0]?.toUpperCase()}
                            </div>
                            <div className="space-y-0.5 min-w-0">
                              <div className="flex items-center gap-2 text-[10px] font-mono select-none">
                                <span className="font-bold text-[#F3F0E4] font-heading">{comment.userName}</span>
                                <span className="text-[#9FAEA1]">{new Date(comment.createdAt).toLocaleDateString()}</span>
                              </div>
                              <p className="text-[#F3F0E4] text-xs font-light leading-relaxed">{comment.content}</p>
                            </div>
                          </div>
                        ))}

                        <div className="flex items-center gap-2">
                          <Input
                            type="text"
                            autoComplete="off"
                            autoCorrect="off"
                            autoCapitalize="none"
                            spellCheck={false}
                            data-lpignore="true"
                            placeholder="Add a comment..."
                            value={commentInput[post._id] || ""}
                            onChange={(e) => setCommentInput((prev) => ({ ...prev, [post._id]: e.target.value }))}
                            onKeyDown={(e) => { if (e.key === "Enter") handleAddComment(post._id); }}
                            className="flex-1 bg-[#16261D] border-[#F3F0E4]/15 focus:border-[#F0C93B] text-[#F3F0E4] placeholder-[#9FAEA1]/60 h-10 text-xs rounded-xl font-sans"
                          />
                          <Button
                            onClick={() => handleAddComment(post._id)}
                            disabled={!commentInput[post._id]?.trim()}
                            className="rounded-xl bg-[#F0C93B] hover:bg-[#F0C93B]/90 disabled:opacity-40 text-[#2A2118] h-10 px-5 font-bold transition-all shadow-[2px_2px_0_0_#F28B6E]"
                          >
                            <Send className="size-4 text-[#2A2118]" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </div>

      {/* Create Post Modal Overlay */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-[9998] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setIsCreateOpen(false)} />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative z-10 bg-[#1A2D23] border border-[#F3F0E4]/20 rounded-[2rem] w-full max-w-lg p-6 space-y-4 shadow-[0_25px_60px_rgba(0,0,0,0.5)]"
          >
            <div className="flex items-center justify-between border-b border-[#F3F0E4]/15 pb-3">
              <h2 className="text-base font-bold text-[#F3F0E4] font-heading">Create Community Post</h2>
              <button onClick={() => setIsCreateOpen(false)} className="text-[#9FAEA1] hover:text-[#F3F0E4]">
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleCreatePost} className="space-y-4">
              <textarea
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="none"
                spellCheck={false}
                data-lpignore="true"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="What's on your mind? Share knowledge, updates, or engineering insights..."
                rows={4}
                required
                autoFocus
                className="w-full rounded-2xl bg-[#121F18] border border-[#F3F0E4]/15 focus:border-[#F0C93B] text-[#F3F0E4] placeholder-[#9FAEA1]/60 p-3.5 text-xs outline-none resize-none transition-colors font-sans"
              />

              {mediaUrl && (
                <div className="relative inline-flex items-center justify-start max-h-[200px]">
                  {mediaType === "image" ? (
                    <img src={mediaUrl} alt="Attached upload" className="max-h-[200px] object-contain w-auto rounded-xl border border-[#F3F0E4]/15 bg-[#16261D]" />
                  ) : (
                    <video src={mediaUrl} controls className="max-h-[200px] object-contain w-auto rounded-xl border border-[#F3F0E4]/15 bg-[#16261D]" />
                  )}
                  <button
                    type="button"
                    onClick={() => { setMediaUrl(""); setMediaType(""); }}
                    className="absolute top-2 right-2 bg-black/80 text-[#F28B6E] p-1 rounded-lg border border-[#F28B6E]/30 z-10"
                  >
                    <X className="size-3.5" />
                  </button>
                </div>
              )}

              <div className="flex items-center justify-between pt-2">
                <label className="flex items-center gap-2 py-2 px-4 rounded-xl border border-[#F3F0E4]/15 bg-[#121F18] hover:bg-[#1F362A] text-xs font-mono font-bold text-[#9FAEA1] hover:text-[#F3F0E4] cursor-pointer select-none transition-all">
                  {isUploading ? <Loader2 className="size-4 text-[#8FC3DE] animate-spin" /> : <ImageIcon className="size-4 text-[#8FC3DE]" />}
                  <span>{mediaUrl ? "Media Attached ✓" : "Add Photo / Video"}</span>
                  <input type="file" accept="image/*,video/*" onChange={handleMediaUpload} disabled={isUploading} className="hidden" />
                </label>

                <Button
                  type="submit"
                  disabled={isPosting}
                  className="rounded-xl bg-[#F0C93B] hover:bg-[#F0C93B]/90 text-[#2A2118] font-bold text-xs h-10 px-6 transition-all shadow-[2px_2px_0_0_#F28B6E] font-heading"
                >
                  {isPosting ? <Loader2 className="size-4 animate-spin text-[#2A2118]" /> : "Post to Community"}
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
