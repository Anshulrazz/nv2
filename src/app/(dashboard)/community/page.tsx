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
  Sparkles,
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
    <div className="flex-1 flex flex-col h-full bg-[#030305] text-zinc-100 overflow-y-auto antialiased relative selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Background Ambient Mesh Glow Orbs */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 right-1/4 w-[500px] h-[350px] bg-cyan-500/10 rounded-full blur-[140px]" />
      </div>

      {/* Header Banner */}
      <div className="border-b border-white/5 bg-zinc-950/40 p-8 rounded-[2rem] border border-white/10 relative z-10 backdrop-blur-2xl m-6 sm:m-10 mb-0">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="size-14 rounded-2xl bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20 text-cyan-400">
              <Users className="size-7" />
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tight text-white flex items-center gap-3">
                Community Hub
                <span className="text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 px-3 py-1 rounded-full border border-cyan-500/30 uppercase tracking-widest">
                  LIVE FEED
                </span>
              </h1>
              <p className="text-zinc-400 text-xs sm:text-sm font-light mt-1">
                Connect with student scholars, post updates, and earn activity points across university batches.
              </p>
            </div>
          </div>

          <Button
            onClick={() => setIsCreateOpen(true)}
            className="group rounded-full bg-white hover:bg-zinc-100 text-zinc-950 font-bold text-xs h-11 px-6 flex items-center justify-center gap-2 transition-all duration-300 active:scale-[0.97] shadow-[0_0_20px_rgba(255,255,255,0.15)]"
          >
            <Plus className="size-4 text-zinc-950" />
            <span>Create Post</span>
            <ArrowUpRight className="size-4 text-zinc-950 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </Button>
        </div>
      </div>

      {/* Posts Feed Container */}
      <div className="p-6 sm:p-10 max-w-3xl w-full mx-auto space-y-8 relative z-10">
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center text-zinc-500 text-xs gap-3 font-semibold">
            <Loader2 className="size-8 animate-spin text-cyan-400" />
            <span className="font-mono text-zinc-400 tracking-widest">SYNCING COMMUNITY STREAM...</span>
          </div>
        ) : posts.length === 0 ? (
          <div className="rounded-[2.5rem] bg-zinc-900/40 border border-white/10 p-2.5 backdrop-blur-3xl max-w-md mx-auto text-center my-12">
            <div className="rounded-[calc(2.5rem-0.75rem)] bg-[#07070a] border border-white/5 p-8 flex flex-col items-center gap-4">
              <Users className="size-10 text-zinc-600" />
              <h3 className="text-lg font-bold text-white">Community feed empty</h3>
              <p className="text-xs text-zinc-400 font-light max-w-xs">
                Share the first post to start conversations with peer engineers!
              </p>
              <Button
                onClick={() => setIsCreateOpen(true)}
                className="rounded-full bg-white hover:bg-zinc-100 text-zinc-950 text-xs font-bold h-9 px-5 mt-2"
              >
                Create First Post
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {posts.map((post) => {
              const isLiked = post.likes?.includes(currentUserId || "");
              const isExpanded = !!expandedComments[post._id];

              return (
                <div key={post._id} className="rounded-[2rem] bg-zinc-900/40 border border-white/10 p-2 backdrop-blur-xl hover:border-cyan-500/40 transition-all duration-300">
                  <div className="rounded-[calc(2rem-0.5rem)] bg-[#07070a] border border-white/5 p-6 space-y-5">
                    {/* Post Header */}
                    <div className="flex items-center gap-3 select-none">
                      {post.userImage ? (
                        <img src={post.userImage} alt={post.userName} className="size-9 rounded-full object-cover border border-white/10 bg-zinc-900" />
                      ) : (
                        <div className="size-9 rounded-full bg-zinc-950 border border-white/10 flex items-center justify-center text-zinc-400 text-xs font-bold">
                          {post.userName?.[0]?.toUpperCase()}
                        </div>
                      )}
                      <div>
                        <Link href={`/user/${post.userId}`}>
                          <p className="text-xs font-bold text-white hover:text-cyan-400 transition-colors leading-tight">
                            {post.userName}
                          </p>
                        </Link>
                        <p className="text-[10px] font-mono text-zinc-500 mt-0.5">
                          {new Date(post.createdAt).toLocaleString()}
                        </p>
                      </div>
                      {post.userId === currentUserId && (
                        <div className="ml-auto flex items-center gap-2">
                          <button onClick={() => openEditModal(post)} className="text-zinc-500 hover:text-white transition-colors">
                            <Edit3 className="size-4" />
                          </button>
                          <button onClick={() => handleDeletePost(post._id)} className="text-zinc-500 hover:text-rose-400 transition-colors">
                            <Trash2 className="size-4" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Post Content */}
                    <p className="text-zinc-300 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap font-light">{post.content}</p>

                    {/* Media Attachment */}
                    {post.mediaUrl && (
                      <div className="flex items-center justify-start w-full">
                        {post.mediaType === "image" ? (
                          <img src={post.mediaUrl} alt="Post content" className="max-h-[300px] object-contain w-auto rounded-2xl border border-white/10 bg-zinc-950" />
                        ) : (
                          <video src={post.mediaUrl} controls className="max-h-[300px] object-contain w-auto rounded-2xl border border-white/10 bg-zinc-950" />
                        )}
                      </div>
                    )}

                    {/* Engagement Actions */}
                    <div className="flex items-center gap-4 pt-3 border-t border-white/5 select-none">
                      <button
                        onClick={() => handleLikeToggle(post._id)}
                        className={`flex items-center gap-1.5 text-xs font-mono font-bold py-1 px-3 rounded-full border transition-all ${
                          isLiked
                            ? "bg-cyan-500/10 border-cyan-500/20 text-cyan-400"
                            : "bg-zinc-950 border-white/10 text-zinc-400 hover:text-white"
                        }`}
                      >
                        <Heart className={`size-3.5 ${isLiked ? "fill-cyan-400 text-cyan-400" : ""}`} />
                        <span>{post.likes?.length || 0}</span>
                      </button>

                      <button
                        onClick={() => setExpandedComments((prev) => ({ ...prev, [post._id]: !prev[post._id] }))}
                        className={`flex items-center gap-1.5 text-xs font-mono font-bold py-1 px-3 rounded-full border transition-all ${
                          isExpanded
                            ? "bg-white/10 border-white/20 text-white"
                            : "bg-zinc-950 border-white/10 text-zinc-400 hover:text-white"
                        }`}
                      >
                        <MessageSquare className="size-3.5 text-zinc-500" />
                        <span>{post.comments?.length || 0} Comments</span>
                      </button>
                    </div>

                    {/* Comments section */}
                    {isExpanded && (
                      <div className="space-y-3 pt-3 border-t border-white/5">
                        {post.comments?.map((comment, index) => (
                          <div key={index} className="bg-zinc-950 border border-white/5 p-3.5 rounded-2xl flex gap-3 items-start">
                            <div className="size-6 rounded-full bg-zinc-900 border border-white/10 flex items-center justify-center text-zinc-400 font-bold text-[9px] mt-0.5 shrink-0">
                              {comment.userName?.[0]?.toUpperCase()}
                            </div>
                            <div className="space-y-0.5 min-w-0">
                              <div className="flex items-center gap-2 text-[10px] font-mono select-none">
                                <span className="font-bold text-white">{comment.userName}</span>
                                <span className="text-zinc-500">{new Date(comment.createdAt).toLocaleDateString()}</span>
                              </div>
                              <p className="text-zinc-300 text-xs font-light leading-relaxed">{comment.content}</p>
                            </div>
                          </div>
                        ))}

                        <div className="flex items-center gap-2">
                          <Input
                            placeholder="Add a comment..."
                            value={commentInput[post._id] || ""}
                            onChange={(e) => setCommentInput((prev) => ({ ...prev, [post._id]: e.target.value }))}
                            onKeyDown={(e) => { if (e.key === "Enter") handleAddComment(post._id); }}
                            className="flex-1 bg-zinc-950 border-white/10 focus:border-cyan-400 text-white placeholder-zinc-600 h-10 text-xs rounded-xl"
                          />
                          <Button
                            onClick={() => handleAddComment(post._id)}
                            disabled={!commentInput[post._id]?.trim()}
                            className="rounded-full bg-white hover:bg-zinc-100 disabled:opacity-40 text-zinc-950 h-10 px-5 font-bold transition-all"
                          >
                            <Send className="size-4 text-zinc-950" />
                          </Button>
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

      {/* Create Post Modal Overlay */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-[9998] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setIsCreateOpen(false)} />
          <div className="relative z-10 bg-zinc-950 border border-white/10 rounded-3xl w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <h2 className="text-base font-bold text-white">Create Community Post</h2>
              <button onClick={() => setIsCreateOpen(false)} className="text-zinc-500 hover:text-white">
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleCreatePost} className="space-y-4">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="What's on your mind? Share knowledge, updates, or engineering insights..."
                rows={4}
                required
                autoFocus
                className="w-full rounded-2xl bg-zinc-900 border border-white/10 focus:border-cyan-400 text-white placeholder-zinc-600 p-3.5 text-xs outline-none resize-none transition-colors"
              />

              {mediaUrl && (
                <div className="relative inline-flex items-center justify-start max-h-[200px]">
                  {mediaType === "image" ? (
                    <img src={mediaUrl} alt="Attached upload" className="max-h-[200px] object-contain w-auto rounded-xl border border-white/10 bg-zinc-900" />
                  ) : (
                    <video src={mediaUrl} controls className="max-h-[200px] object-contain w-auto rounded-xl border border-white/10 bg-zinc-900" />
                  )}
                  <button
                    type="button"
                    onClick={() => { setMediaUrl(""); setMediaType(""); }}
                    className="absolute top-2 right-2 bg-black/80 text-rose-400 p-1 rounded-lg border border-rose-500/20 z-10"
                  >
                    <X className="size-3.5" />
                  </button>
                </div>
              )}

              <div className="flex items-center justify-between pt-2">
                <label className="flex items-center gap-2 py-2 px-4 rounded-full border border-white/10 bg-zinc-900 hover:bg-zinc-800 text-xs font-mono font-bold text-zinc-300 hover:text-white cursor-pointer select-none transition-all">
                  {isUploading ? <Loader2 className="size-4 text-cyan-400 animate-spin" /> : <ImageIcon className="size-4 text-cyan-400" />}
                  <span>{mediaUrl ? "Media Attached ✓" : "Add Photo / Video"}</span>
                  <input type="file" accept="image/*,video/*" onChange={handleMediaUpload} disabled={isUploading} className="hidden" />
                </label>

                <Button
                  type="submit"
                  disabled={isPosting}
                  className="rounded-full bg-white hover:bg-zinc-100 text-zinc-950 font-bold text-xs h-10 px-6 transition-all"
                >
                  {isPosting ? <Loader2 className="size-4 animate-spin text-zinc-950" /> : "Post to Community"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
