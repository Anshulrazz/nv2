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
    <div className="flex-1 flex flex-col h-full bg-neutral-950 overflow-y-auto custom-scroll relative">
      {/* Ambient glows */}
      <div className="absolute top-0 right-1/4 w-[400px] h-[300px] bg-cyan-500/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Header */}
      <div className="border-b border-neutral-900 bg-neutral-950/80 backdrop-blur-md px-4 sm:px-8 py-4 sm:py-6 flex items-center justify-between shrink-0 select-none z-10 relative">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-cyan-400" />
            <h1 className="text-xl font-bold text-neutral-100 tracking-tight" style={{ fontFamily: "var(--font-space-grotesk)" }}>
              Community Feed
            </h1>
          </div>
          <p className="text-neutral-500 text-xs">
            Connect with scholars · Share posts · Earn activity points
          </p>
        </div>
        <Button
          onClick={() => setIsCreateOpen(true)}
          className="bg-cyan-500 hover:bg-cyan-400 text-neutral-950 text-xs font-bold gap-1.5 h-9 px-4 rounded-lg shadow-[0_0_12px_rgba(6,182,212,0.25)] transition-all"
          style={{ fontFamily: "var(--font-space-grotesk)" }}
        >
          <Plus className="h-4 w-4" /> Create Post
        </Button>
      </div>

      {/* Posts Feed */}
      <div className="p-4 sm:p-8 max-w-2xl w-full mx-auto space-y-6 z-10 relative">
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center text-neutral-500 text-xs gap-2 select-none font-semibold">
            <Loader2 className="h-6 w-6 animate-spin text-cyan-400" />
            <span style={{ fontFamily: "var(--font-jetbrains-mono)" }}>SYNCING FEED...</span>
          </div>
        ) : posts.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center text-center space-y-4 border border-dashed border-neutral-900 rounded-2xl bg-neutral-900/5 select-none">
            <Users className="h-10 w-10 text-neutral-700" />
            <div className="space-y-1">
              <h3 className="text-neutral-300 font-bold text-sm" style={{ fontFamily: "var(--font-space-grotesk)" }}>Feed is empty</h3>
              <p className="text-neutral-550 text-xs max-w-xs leading-normal">Share the first post to start conversations!</p>
            </div>
            <Button
              onClick={() => setIsCreateOpen(true)}
              className="bg-cyan-500 hover:bg-cyan-400 text-neutral-950 text-xs font-bold gap-1.5 h-8 px-4 rounded-lg mt-2"
            >
              <Plus className="h-3.5 w-3.5" /> Create First Post
            </Button>
          </div>
        ) : (
          <div className="space-y-5">
            {posts.map((post) => {
              const isLiked = post.likes?.includes(currentUserId || "");
              const isExpanded = !!expandedComments[post._id];

              return (
                <div key={post._id} className="bg-neutral-955/40 backdrop-blur-md border border-white/5 hover:border-cyan-500/20 hover:shadow-[0_0_20px_rgba(6,182,212,0.06)] rounded-2xl p-5 space-y-4 transition-all duration-300">
                  {/* Post Header */}
                  <div className="flex items-center gap-3 select-none">
                    {post.userImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={post.userImage} alt={post.userName} className="h-8 w-8 rounded-xl object-cover border border-neutral-800" />
                    ) : (
                      <div className="h-8 w-8 rounded-xl bg-neutral-950 border border-neutral-850 flex items-center justify-center text-neutral-400 font-bold text-[10px]">
                        {post.userName?.[0]?.toUpperCase()}
                      </div>
                    )}
                    <div>
                      <Link href={`/user/${post.userId}`}>
                        <p className="text-xs font-bold text-neutral-200 hover:text-cyan-400 transition-colors leading-tight" style={{ fontFamily: "var(--font-space-grotesk)" }}>
                          {post.userName}
                        </p>
                      </Link>
                      <p className="text-[9px] text-neutral-550 font-mono mt-0.5">
                        {new Date(post.createdAt).toLocaleString()}
                      </p>
                    </div>
                    {post.userId === currentUserId && (
                      <div className="ml-auto flex items-center gap-2">
                        <button
                          onClick={() => openEditModal(post)}
                          className="p-1.5 text-neutral-500 hover:text-cyan-400 hover:bg-neutral-900 rounded-lg transition-colors"
                          title="Edit Post"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeletePost(post._id)}
                          className="p-1.5 text-neutral-500 hover:text-red-400 hover:bg-neutral-900 rounded-lg transition-colors"
                          title="Delete Post"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Post Content */}
                  <p className="text-neutral-300 text-xs leading-relaxed whitespace-pre-wrap">{post.content}</p>

                  {/* Media Attachment */}
                  {post.mediaUrl && (
                    <div className="flex items-center justify-start w-full">
                      {post.mediaType === "image" ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={post.mediaUrl} alt="Post content" className="max-h-[300px] object-contain w-auto rounded-xl border border-neutral-900 bg-neutral-950/40" />
                      ) : (
                        <video src={post.mediaUrl} controls className="max-h-[300px] object-contain w-auto rounded-xl border border-neutral-900 bg-neutral-950/40" />
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-4 pt-2.5 border-t border-neutral-900/60 select-none">
                    <button
                      onClick={() => handleLikeToggle(post._id)}
                      className={`flex items-center gap-1.5 text-[11px] font-bold py-1 px-2.5 rounded border transition-all ${
                        isLiked
                          ? "bg-cyan-500/10 border-cyan-500/20 text-cyan-400"
                          : "bg-neutral-950 border-neutral-850 text-neutral-500 hover:text-neutral-300"
                      }`}
                      style={{ fontFamily: "var(--font-space-grotesk)" }}
                    >
                      <Heart className={`h-3.5 w-3.5 ${isLiked ? "fill-cyan-400" : ""}`} />
                      <span>{post.likes?.length || 0}</span>
                    </button>

                    <button
                      onClick={() => setExpandedComments((prev) => ({ ...prev, [post._id]: !prev[post._id] }))}
                      className={`flex items-center gap-1.5 text-[11px] font-bold py-1 px-2.5 rounded border transition-all ${
                        isExpanded
                          ? "bg-neutral-900 border-neutral-800 text-neutral-200"
                          : "bg-neutral-950 border-neutral-850 text-neutral-500 hover:text-neutral-300"
                      }`}
                      style={{ fontFamily: "var(--font-space-grotesk)" }}
                    >
                      <MessageSquare className="h-3.5 w-3.5 text-neutral-600" />
                      <span>{post.comments?.length || 0} Comments</span>
                    </button>
                  </div>

                  {/* Comments section */}
                  {isExpanded && (
                    <div className="space-y-3 pt-3 border-t border-neutral-900/60">
                      {post.comments?.map((comment, index) => (
                        <div key={index} className="bg-neutral-950 border border-neutral-900/40 p-3 rounded-xl flex gap-3 items-start">
                          <div className="h-6 w-6 rounded-lg bg-neutral-900 border border-neutral-850 flex items-center justify-center text-neutral-450 font-bold text-[9px] mt-0.5 select-none shrink-0">
                            {comment.userName?.[0]?.toUpperCase()}
                          </div>
                          <div className="space-y-0.5 min-w-0">
                            <div className="flex items-center gap-2 text-[10px] font-bold select-none">
                              <span className="text-neutral-300" style={{ fontFamily: "var(--font-space-grotesk)" }}>{comment.userName}</span>
                              <span className="text-neutral-600 font-mono text-[9px]">{new Date(comment.createdAt).toLocaleDateString()}</span>
                            </div>
                            <p className="text-neutral-400 text-[11px] leading-relaxed">{comment.content}</p>
                          </div>
                        </div>
                      ))}

                      <div className="flex items-center gap-2">
                        <Input
                          placeholder="Add a comment..."
                          value={commentInput[post._id] || ""}
                          onChange={(e) => setCommentInput((prev) => ({ ...prev, [post._id]: e.target.value }))}
                          onKeyDown={(e) => { if (e.key === "Enter") handleAddComment(post._id); }}
                          className="flex-1 bg-neutral-950 border-neutral-850 focus:border-cyan-400 text-neutral-100 placeholder-neutral-700 h-8 text-[11px]"
                        />
                        <Button
                          size="icon"
                          onClick={() => handleAddComment(post._id)}
                          disabled={!commentInput[post._id]?.trim()}
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

      {/* Create Post Modal Overlay */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-[9998] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsCreateOpen(false)} />
          <div className="relative z-10 bg-neutral-950/80 backdrop-blur-lg border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl shadow-black/50">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-cyan-400" />
                <h2 className="text-sm font-bold text-neutral-100" style={{ fontFamily: "var(--font-space-grotesk)" }}>
                  Create Community Post
                </h2>
              </div>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="p-1 rounded-lg text-neutral-500 hover:text-neutral-200 hover:bg-neutral-800 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleCreatePost} className="p-6 space-y-4">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="What's on your mind? Share knowledge, updates, or insights..."
                rows={4}
                required
                autoFocus
                className="w-full rounded-xl bg-neutral-950 border border-neutral-850 focus:border-cyan-400 text-neutral-100 placeholder-neutral-600 p-3.5 text-xs focus:outline-none resize-none transition-colors"
              />

              {/* Media preview */}
              {mediaUrl && (
                <div className="relative inline-flex items-center justify-start max-h-[200px]">
                  {mediaType === "image" ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={mediaUrl} alt="Attached upload" className="max-h-[200px] object-contain w-auto rounded-xl border border-neutral-900 bg-neutral-950/40" />
                  ) : (
                    <video src={mediaUrl} controls className="max-h-[200px] object-contain w-auto rounded-xl border border-neutral-900 bg-neutral-950/40" />
                  )}
                  <button
                    type="button"
                    onClick={() => { setMediaUrl(""); setMediaType(""); }}
                    className="absolute top-2 right-2 bg-black/70 hover:bg-black text-red-400 p-1 rounded-lg border border-red-500/20 z-10"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}

              {/* Footer actions */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pt-1 gap-3">
                <label className="flex items-center gap-1.5 py-1.5 px-3 rounded-lg border border-neutral-850 bg-neutral-950 hover:bg-neutral-900 text-[10px] font-bold text-neutral-450 hover:text-white cursor-pointer select-none transition-all">
                  {isUploading ? (
                    <><Loader2 className="h-3.5 w-3.5 text-cyan-400 animate-spin" /><span>Uploading...</span></>
                  ) : (
                    <><ImageIcon className="h-3.5 w-3.5 text-cyan-400" /><span>Add Photo / Video</span></>
                  )}
                  <input type="file" accept="image/*,video/*" onChange={handleMediaUpload} disabled={isUploading} className="hidden" />
                </label>

                <div className="flex gap-2 w-full sm:w-auto justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsCreateOpen(false)}
                    className="border-neutral-800 text-neutral-400 hover:text-white bg-neutral-950 hover:bg-neutral-900 text-xs h-9"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isPosting || isUploading || !content.trim()}
                    className="bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-neutral-950 font-bold text-xs h-9 px-4 gap-1.5 shadow-[0_0_12px_rgba(6,182,212,0.25)] transition-all"
                    style={{ fontFamily: "var(--font-space-grotesk)" }}
                  >
                    {isPosting ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <><Sparkles className="h-3.5 w-3.5" /><span>Post (+10 pts)</span></>
                    )}
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Post Modal Overlay */}
      {isEditOpen && (
        <div className="fixed inset-0 z-[9998] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsEditOpen(false)} />
          <div className="relative z-10 bg-neutral-950/80 backdrop-blur-lg border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl shadow-black/50">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800">
              <div className="flex items-center gap-2">
                <Edit3 className="h-4 w-4 text-cyan-400" />
                <h2 className="text-sm font-bold text-neutral-100" style={{ fontFamily: "var(--font-space-grotesk)" }}>
                  Edit Community Post
                </h2>
              </div>
              <button
                onClick={() => setIsEditOpen(false)}
                className="p-1 rounded-lg text-neutral-500 hover:text-neutral-200 hover:bg-neutral-800 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleUpdatePost} className="p-6 space-y-4">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                placeholder="What's on your mind? Share knowledge, updates, or insights..."
                rows={4}
                required
                autoFocus
                className="w-full rounded-xl bg-neutral-950 border border-neutral-850 focus:border-cyan-400 text-neutral-100 placeholder-neutral-600 p-3.5 text-xs focus:outline-none resize-none transition-colors"
              />

              {/* Media preview */}
              {editMediaUrl && (
                <div className="relative inline-flex items-center justify-start max-h-[200px]">
                  {editMediaType === "image" ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={editMediaUrl} alt="Attached upload" className="max-h-[200px] object-contain w-auto rounded-xl border border-neutral-900 bg-neutral-950/40" />
                  ) : (
                    <video src={editMediaUrl} controls className="max-h-[200px] object-contain w-auto rounded-xl border border-neutral-900 bg-neutral-950/40" />
                  )}
                  <button
                    type="button"
                    onClick={() => { setEditMediaUrl(""); setEditMediaType(""); }}
                    className="absolute top-2 right-2 bg-black/70 hover:bg-black text-red-400 p-1 rounded-lg border border-red-500/20 z-10"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}

              {/* Footer actions */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pt-1 gap-3">
                <label className="flex items-center gap-1.5 py-1.5 px-3 rounded-lg border border-neutral-850 bg-neutral-950 hover:bg-neutral-900 text-[10px] font-bold text-neutral-450 hover:text-white cursor-pointer select-none transition-all">
                  {isUploading ? (
                    <><Loader2 className="h-3.5 w-3.5 text-cyan-400 animate-spin" /><span>Uploading...</span></>
                  ) : (
                    <><ImageIcon className="h-3.5 w-3.5 text-cyan-400" /><span>Change Photo / Video</span></>
                  )}
                  <input
                    type="file"
                    accept="image/*,video/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setIsUploading(true);
                      try {
                        const formData = new FormData();
                        formData.append("file", file);
                        const res = await fetch("/api/upload", { method: "POST", body: formData });
                        if (res.ok) {
                          const data = await res.json();
                          setEditMediaUrl(data.url);
                          const lower = file.name.toLowerCase();
                          if (lower.endsWith(".mp4") || lower.endsWith(".webm") || lower.endsWith(".mov") || lower.endsWith(".ogg")) {
                            setEditMediaType("video");
                          } else {
                            setEditMediaType("image");
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
                    }}
                    disabled={isUploading}
                    className="hidden"
                  />
                </label>

                <div className="flex gap-2 w-full sm:w-auto justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsEditOpen(false)}
                    className="border-neutral-800 text-neutral-400 hover:text-white bg-neutral-950 hover:bg-neutral-900 text-xs h-9"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isUpdating || isUploading || !editContent.trim()}
                    className="bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-neutral-950 font-bold text-xs h-9 px-4 gap-1.5 shadow-[0_0_12px_rgba(6,182,212,0.25)] transition-all"
                    style={{ fontFamily: "var(--font-space-grotesk)" }}
                  >
                    {isUpdating ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <><Sparkles className="h-3.5 w-3.5" /><span>Update Post</span></>
                    )}
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
