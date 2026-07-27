/* eslint-disable @next/next/no-img-element */
"use client";

export const dynamic = "force-dynamic";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { useAlertStore } from "@/stores/alertStore";
import { Heart, MessageSquare, Share2, Loader2, ArrowUpRight, Search, Compass, Bookmark, TrendingUp, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GoogleAdBanner } from "@/components/ads/GoogleAdBanner";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { motion } from "framer-motion";

interface Author {
  _id: string;
  name: string;
  image?: string;
}

interface PostData {
  _id: string;
  type?: "note" | "community";
  title?: string;
  slug?: string;
  tags?: string[];
  category?: string;
  coverImage?: string;
  readingTime?: string;
  wordCount?: number;
  upvotes?: string[];
  isPinned?: boolean;
  upvotesCount?: number;
  commentsCount?: number;
  author?: Author;
  userId?: string;
  userName?: string;
  userImage?: string;
  content?: string;
  mediaUrl?: string;
  mediaType?: string;
  likes?: string[];
  comments?: Record<string, unknown>[];
  createdAt: string;
}

interface CommentNode {
  _id: string;
  noteId: string;
  userId: string;
  userName: string;
  userImage?: string;
  content: string;
  parentId: string | null;
  upvotes: string[];
  downvotes: string[];
  createdAt: string;
}

export default function FeedPage() {
  const { data: session } = useSession();
  const currentUserId = session?.user?.id || "";
  const { showAlert } = useAlertStore();

  const [posts, setPosts] = useState<PostData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const pageRef = useRef(1);
  const [hasMore, setHasMore] = useState(true);

  // Filters
  const [sort, setSort] = useState<"new" | "top" | "trending" | "following">("new");
  const [search, setSearch] = useState("");
  const [tag, setTag] = useState("");
  const [category, setCategory] = useState("");

  // Comments state
  const [activeCommentsPostId, setActiveCommentsPostId] = useState<string | null>(null);
  const [comments, setComments] = useState<CommentNode[]>([]);
  const [isCommentsLoading, setIsCommentsLoading] = useState(false);
  const [newCommentText, setNewCommentText] = useState("");

  // Reshare dialog
  const [resharePost, setResharePost] = useState<PostData | null>(null);
  const [reshareCommentary, setReshareCommentary] = useState("");
  const [isResharing, setIsResharing] = useState(false);

  // Follow states cache
  const [followingMap, setFollowingMap] = useState<Record<string, boolean>>({});

  const fetchPosts = useCallback(async (reset = false) => {
    setIsLoading(true);
    const currentPage = reset ? 1 : pageRef.current;
    try {
      const queryParams = new URLSearchParams({
        sort,
        search,
        tag,
        category,
        page: currentPage.toString(),
        limit: "10",
      });

      const res = await fetch(`/api/feed?${queryParams.toString()}`);
      let fetchedNotes = [];
      if (res.ok) {
        const data = await res.json();
        fetchedNotes = data.map((n: Record<string, unknown>) => ({ ...n, type: "note" }));
      }
      
      let fetchedCommunity = [];
      if (reset && (category === "" || category === "Community" || category === "Forum")) {
        const cRes = await fetch(`/api/community`);
        if (cRes.ok) {
          const cData = await cRes.json();
          fetchedCommunity = cData.map((c: Record<string, unknown>) => ({ ...c, type: "community" }));
        }
      }

      const merged = [...fetchedNotes, ...fetchedCommunity].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      if (reset) {
        setPosts(merged);
        pageRef.current = 2;
      } else {
        setPosts((prev) => [...prev, ...merged].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
        pageRef.current = pageRef.current + 1;
      }
      
      if (fetchedNotes.length < 10) {
        setHasMore(false);
      } else {
        setHasMore(true);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, [sort, search, tag, category]);

  useEffect(() => {
    fetchPosts(true);
  }, [fetchPosts]);

  const handleUpvote = async (postId: string) => {
    try {
      const res = await fetch(`/api/notes/${postId}/upvote`, {
        method: "POST",
      });
      if (res.ok) {
        const updatedPost = await res.json();
        setPosts((prev) =>
          prev.map((p) =>
            p._id === postId
              ? {
                  ...p,
                  upvotes: updatedPost.upvotes,
                  upvotesCount: updatedPost.upvotes.length,
                }
              : p
          )
        );
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleShare = (post: PostData) => {
    const postSlug = post.slug || post._id;
    const authorName = encodeURIComponent(post.author?.name || post.userName || "user");
    const permalink = `${window.location.origin}/blog/${authorName}/${encodeURIComponent(postSlug)}`;
    navigator.clipboard.writeText(permalink);
    showAlert("Link Copied", "Post permalink copied to clipboard!");
  };

  const handleBookmark = async (post: PostData) => {
    try {
      const postSlug = post.slug || post._id;
      const authorName = encodeURIComponent(post.author?.name || post.userName || "user");
      const permalink = `${window.location.origin}/blog/${authorName}/${encodeURIComponent(postSlug)}`;
      const res = await fetch("/api/bookmarks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: post.title,
          url: permalink,
          category: "Feed",
        }),
      });
      if (res.ok) {
        showAlert("Bookmarked", "Post added to bookmarks!");
      } else {
        const errData = await res.json();
        showAlert("Bookmark Failed", errData.error || "Failed to bookmark post.");
      }
    } catch (e) {
      console.error(e);
      showAlert("Bookmark Error", "Error bookmarking post.");
    }
  };

  const handleFlagPost = async (postId: string) => {
    try {
      const res = await fetch(`/api/feed/${postId}/flag`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (res.ok) {
        showAlert("Reported", "Post reported successfully.");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const checkFollowStatus = useCallback(async (authorId: string) => {
    try {
      const res = await fetch(`/api/user/${authorId}/follow`);
      if (res.ok) {
        const data = await res.json();
        setFollowingMap((prev) => ({ ...prev, [authorId]: data.isFollowing }));
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const handleFollowToggle = async (authorId: string) => {
    try {
      const res = await fetch(`/api/user/${authorId}/follow`, {
        method: "POST",
      });
      if (res.ok) {
        const data = await res.json();
        setFollowingMap((prev) => ({ ...prev, [authorId]: data.isFollowing }));
        if (sort === "following" && !data.isFollowing) {
          setPosts((prev) => prev.filter((p) => p.author?._id !== authorId));
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleReshareSubmit = async () => {
    if (!resharePost || isResharing) return;
    setIsResharing(true);
    try {
      const res = await fetch(`/api/feed/${resharePost._id}/repost`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ commentary: reshareCommentary }),
      });
      if (res.ok) {
        showAlert("Shared", "Shared to feed successfully!");
        setResharePost(null);
        setReshareCommentary("");
        fetchPosts(true);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsResharing(false);
    }
  };

  const loadComments = async (postId: string) => {
    setIsCommentsLoading(true);
    try {
      const res = await fetch(`/api/feed/${postId}/comment`);
      if (res.ok) {
        const data = await res.json();
        setComments(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsCommentsLoading(false);
    }
  };

  const handleToggleComments = (postId: string) => {
    if (activeCommentsPostId === postId) {
      setActiveCommentsPostId(null);
      setComments([]);
    } else {
      setActiveCommentsPostId(postId);
      loadComments(postId);
    }
  };

  const handleAddComment = async (parentId: string | null = null, text = "") => {
    if (!activeCommentsPostId) return;
    const bodyText = parentId ? text : newCommentText;
    if (!bodyText.trim()) return;

    try {
      const res = await fetch(`/api/feed/${activeCommentsPostId}/comment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: bodyText, parentId }),
      });
      if (res.ok) {
        if (!parentId) setNewCommentText("");
        loadComments(activeCommentsPostId);
        setPosts((prev) =>
          prev.map((p) =>
            p._id === activeCommentsPostId ? { ...p, commentsCount: (p.commentsCount || 0) + 1 } : p
          )
        );
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleVoteComment = async (commentId: string, action: "upvote" | "downvote") => {
    if (!activeCommentsPostId) return;
    try {
      const res = await fetch(`/api/feed/${activeCommentsPostId}/comment`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ commentId, action }),
      });
      if (res.ok) {
        loadComments(activeCommentsPostId);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleFlagComment = async (commentId: string) => {
    if (!activeCommentsPostId) return;
    try {
      const res = await fetch(`/api/feed/${activeCommentsPostId}/flag`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ commentId }),
      });
      if (res.ok) {
        showAlert("Reported", "Comment reported successfully.");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const renderCommentNodes = (parentId: string | null = null, depth = 0) => {
    const list = comments.filter((c) => c.parentId === parentId);
    if (list.length === 0) return null;

    return (
      <div className="space-y-3">
        {list.map((comment) => {
          const hasUpvoted = comment.upvotes.includes(currentUserId);
          const hasDownvoted = comment.downvotes.includes(currentUserId);
          return (
            <div key={comment._id} className="space-y-2" style={{ marginLeft: `${depth > 0 ? Math.min(depth * 14, 28) : 0}px` }}>
              <div className="bg-zinc-950 border border-white/5 rounded-2xl p-4 space-y-2">
                <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500 select-none font-bold">
                  <div className="flex items-center gap-2 min-w-0">
                    {comment.userImage ? (
                      <img src={comment.userImage} alt={comment.userName} className="size-5 rounded-full object-cover border border-white/10 shrink-0" />
                    ) : (
                      <div className="size-5 rounded-full bg-zinc-900 border border-white/10 flex items-center justify-center text-zinc-400 font-bold shrink-0">
                        {comment.userName?.[0]?.toUpperCase()}
                      </div>
                    )}
                    <span className="font-bold text-white truncate">{comment.userName}</span>
                    <span className="hidden sm:inline">{new Date(comment.createdAt).toLocaleDateString()}</span>
                  </div>
                  <button onClick={() => handleFlagComment(comment._id)} className="hover:text-rose-400 transition-colors uppercase shrink-0">
                    Report
                  </button>
                </div>

                <p className="text-xs text-zinc-300 leading-relaxed font-light">{comment.content}</p>

                <div className="flex items-center gap-4 text-[10px] font-mono text-zinc-500 font-bold select-none pt-1">
                  <button
                    onClick={() => handleVoteComment(comment._id, "upvote")}
                    className={`hover:text-zinc-300 flex items-center gap-1 transition-colors ${hasUpvoted ? "text-cyan-400" : ""}`}
                  >
                    Upvote ({comment.upvotes.length})
                  </button>
                  <button
                    onClick={() => handleVoteComment(comment._id, "downvote")}
                    className={`hover:text-zinc-300 flex items-center gap-1 transition-colors ${hasDownvoted ? "text-rose-400" : ""}`}
                  >
                    Downvote ({comment.downvotes.length})
                  </button>
                  <button
                    onClick={() => {
                      const text = prompt("Write your reply:") || "";
                      if (text.trim()) handleAddComment(comment._id, text.trim());
                    }}
                    className="hover:text-white transition-colors"
                  >
                    Reply
                  </button>
                </div>
              </div>

              {renderCommentNodes(comment._id, depth + 1)}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#16261D] text-[#F3F0E4] overflow-y-auto custom-scroll relative selection:bg-[#F0C93B]/30 selection:text-[#F0C93B]">
      {/* Background Ambient Mesh Glow Orbs */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 right-1/4 w-[500px] h-[350px] bg-[#8FC3DE]/10 rounded-full blur-[140px] animate-float-glow" />
        <div className="absolute bottom-0 left-1/4 w-[450px] h-[350px] bg-[#C9A9E0]/10 rounded-full blur-[140px] animate-float-glow-reverse" />
      </div>

      {/* Responsive Header Banner */}
      <div className="p-4 sm:p-8 lg:p-10 pb-0 relative z-10">
        <div className="border border-[#F3F0E4]/15 bg-[#1A2D23]/80 p-6 sm:p-8 rounded-[2rem] relative z-10 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.3)]">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="size-12 sm:size-14 rounded-2xl bg-[#F0C93B]/10 flex items-center justify-center border border-[#F0C93B]/30 text-[#F0C93B] shrink-0 shadow-[2px_2px_0_0_#F28B6E]">
                <Compass className="size-6 sm:size-7" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[#F3F0E4] flex items-center gap-2.5 flex-wrap font-heading">
                  Public Study Notes, Research Papers &amp; Academic Articles
                  <span className="text-[10px] font-mono font-bold bg-[#F0C93B]/15 text-[#F0C93B] px-3 py-1 rounded-full border border-[#F0C93B]/30 uppercase tracking-widest">
                    LIVE STREAM
                  </span>
                </h1>
                <p className="text-[#9FAEA1] text-xs sm:text-sm font-light mt-0.5 sm:mt-1 max-w-2xl leading-relaxed">
                  Discover free student study notes, research papers, and technical articles published on Notexia. Explore formula sheets, step-by-step code blueprints, and peer discussions.
                </p>
              </div>
            </div>

            <div className="relative w-full md:w-72">
              <Search className="absolute left-3.5 top-3 size-4 text-[#9FAEA1]" />
              <Input
                type="text"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="none"
                spellCheck={false}
                data-lpignore="true"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search feed topics..."
                className="bg-[#121F18] border-[#F3F0E4]/15 focus:border-[#F0C93B] text-[#F3F0E4] placeholder-[#9FAEA1]/60 h-10 text-xs pl-10 rounded-xl w-full"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Responsive Grid Layout */}
      <div className="p-4 sm:p-8 lg:p-10 max-w-7xl w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start relative z-10">
        
        {/* Left Main Feed Area */}
        <div className="col-span-1 lg:col-span-8 space-y-6 w-full min-w-0">
          
          {/* Responsive Sort Tabs */}
          <div className="flex items-center gap-2 border-b border-[#F3F0E4]/10 pb-4 select-none overflow-x-auto scrollbar-none w-full">
            <Filter className="size-4 text-[#9FAEA1] shrink-0 mr-1 hidden sm:block" />
            {(["new", "top", "trending", "following"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setSort(mode)}
                className={`text-[10px] font-mono font-bold px-3.5 py-1.5 rounded-full uppercase tracking-widest transition-all whitespace-nowrap ${
                  sort === mode
                    ? "bg-[#F0C93B] text-[#2A2118] font-extrabold shadow-[2px_2px_0_0_#F28B6E]"
                    : "text-[#9FAEA1] hover:text-[#F3F0E4] hover:bg-[#121F18]"
                }`}
              >
                {mode}
              </button>
            ))}
          </div>

          {posts.length === 0 && !isLoading ? (
            <div className="rounded-[2rem] bg-[#1A2D23]/80 border border-[#F3F0E4]/15 p-10 text-center text-[#9FAEA1] italic select-none">
              No feed posts matching active filters found.
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ staggerChildren: 0.08 }}
              className="space-y-6 w-full"
            >
              {posts.map((post) => {
                if (post.type === "community") {
                  return (
                    <motion.div
                      key={post._id}
                      whileHover={{ y: -3 }}
                      transition={{ type: "spring", stiffness: 350, damping: 22 }}
                      className="rounded-[2rem] bg-[#1A2D23]/80 border border-[#F3F0E4]/15 p-2 backdrop-blur-xl w-full shadow-[0_10px_30px_rgba(0,0,0,0.25)]"
                    >
                      <div className="rounded-[calc(2rem-0.5rem)] bg-[#121F18] border border-[#F3F0E4]/10 p-5 sm:p-6 space-y-4 sm:space-y-5">
                        <div className="flex items-center gap-3 select-none">
                          {post.userImage ? (
                            <img src={post.userImage} alt={post.userName} className="size-9 rounded-full object-cover border border-[#F3F0E4]/20 bg-[#16261D] shrink-0" />
                          ) : (
                            <div className="size-9 rounded-full bg-[#16261D] border border-[#F3F0E4]/20 flex items-center justify-center text-[#F0C93B] text-xs font-bold shrink-0">
                              {post.userName?.[0]?.toUpperCase()}
                            </div>
                          )}
                          <div className="min-w-0">
                            <Link href={`/user/${post.userId}`}>
                              <p className="text-xs font-bold text-[#F3F0E4] hover:text-[#F0C93B] transition-colors leading-tight truncate font-heading">
                                {post.userName}
                              </p>
                            </Link>
                            <p className="text-[10px] font-mono text-[#9FAEA1] mt-0.5">
                              {new Date(post.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="ml-auto shrink-0">
                            <span className="text-[9px] font-mono bg-[#8FC3DE]/15 border border-[#8FC3DE]/30 text-[#8FC3DE] font-bold px-2.5 py-0.5 rounded-full uppercase">
                              #Community
                            </span>
                          </div>
                        </div>
                        
                        <p className="text-[#F3F0E4] text-xs sm:text-sm leading-relaxed whitespace-pre-wrap font-light">{post.content}</p>

                        {post.mediaUrl && (
                          <div className="flex items-center justify-start w-full overflow-hidden">
                            {post.mediaType === "image" ? (
                              <img src={post.mediaUrl} alt="Post content" className="max-h-[320px] object-contain w-auto rounded-2xl border border-[#F3F0E4]/15 bg-[#16261D]" />
                            ) : (
                              <video src={post.mediaUrl} controls className="max-h-[320px] object-contain w-auto rounded-2xl border border-[#F3F0E4]/15 bg-[#16261D]" />
                            )}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                }

                const userHasUpvoted = post.upvotes?.includes(currentUserId);
                const following = followingMap[post.author?._id || ""];

                if (following === undefined && post.author?._id !== currentUserId && post.author) {
                  checkFollowStatus(post.author?._id);
                }

                const postSlug = post.slug || post._id;
                const authorName = encodeURIComponent(post.author?.name || post.userName || "user");
                const viewUrl = `/blog/${authorName}/${encodeURIComponent(postSlug)}`;

                return (
                  <motion.div
                    key={post._id}
                    whileHover={{ y: -3 }}
                    transition={{ type: "spring", stiffness: 350, damping: 22 }}
                    className="rounded-[2rem] bg-[#1A2D23]/80 border border-[#F3F0E4]/15 p-2 backdrop-blur-xl w-full shadow-[0_10px_30px_rgba(0,0,0,0.25)]"
                  >
                    <div className="rounded-[calc(2rem-0.5rem)] bg-[#121F18] border border-[#F3F0E4]/10 p-5 sm:p-6 space-y-4 sm:space-y-5">
                      {/* Card Header */}
                      <div className="flex items-center justify-between select-none">
                        <Link href={`/user/${post.author?._id || post.userId}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity min-w-0">
                          {post.author?.image || post.userImage ? (
                            <img src={post.author?.image || post.userImage} alt={post.author?.name || post.userName} className="size-9 rounded-full object-cover border border-[#F3F0E4]/20 bg-[#16261D] shrink-0" />
                          ) : (
                            <div className="size-9 rounded-full bg-[#16261D] border border-[#F3F0E4]/20 flex items-center justify-center text-[#F0C93B] text-xs font-bold shrink-0">
                              {(post.author?.name || post.userName || "U")?.[0]?.toUpperCase()}
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-[#F3F0E4] leading-tight truncate font-heading">
                              {post.author?.name || post.userName}
                            </p>
                            <p className="text-[10px] font-mono text-[#9FAEA1] mt-0.5">
                              {new Date(post.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </Link>

                        {post.author?._id !== currentUserId && (
                          <button
                            onClick={() => handleFollowToggle(post.author?._id || post.userId || "")}
                            className={`text-[10px] font-mono font-bold px-3 py-1 rounded-full transition-all border uppercase tracking-wider shrink-0 ml-2 ${
                              following
                                ? "bg-[#16261D] border-[#F3F0E4]/15 text-[#9FAEA1]"
                                : "bg-[#F0C93B] border-[#F0C93B] text-[#2A2118] font-extrabold hover:bg-[#F0C93B]/90 shadow-[2px_2px_0_0_#F28B6E]"
                            }`}
                          >
                            {following ? "Following" : "Follow"}
                          </button>
                        )}
                      </div>

                      {/* Card Body */}
                      <div className="space-y-3">
                        <Link href={viewUrl}>
                          <h2 className="text-base sm:text-lg font-bold text-white hover:text-cyan-400 tracking-tight leading-snug cursor-pointer transition-colors">
                            {post.title}
                          </h2>
                        </Link>
                        {post.coverImage && (
                          <Link href={viewUrl}>
                            <img src={post.coverImage} alt={post.title} className="w-full h-44 sm:h-52 object-cover rounded-2xl border border-white/10 shadow-md hover:opacity-90 transition-opacity cursor-pointer" />
                          </Link>
                        )}
                        <div className="flex flex-wrap gap-1.5 select-none pt-1">
                          {(post.tags || []).map((t) => (
                            <span
                              key={t}
                              onClick={() => setTag(t)}
                              className="text-[9px] font-mono bg-cyan-500/10 border border-cyan-500/20 hover:border-cyan-400 text-cyan-400 font-bold px-2.5 py-0.5 rounded-full cursor-pointer transition-colors"
                            >
                              #{t}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Engagement Actions */}
                      <div className="flex items-center justify-between border-t border-white/5 pt-4 select-none">
                        <div className="flex items-center gap-3 sm:gap-5 text-[11px] text-zinc-400 font-medium flex-wrap">
                          <button
                            onClick={() => handleUpvote(post._id)}
                            className={`hover:text-white flex items-center gap-1.5 transition-colors ${
                              userHasUpvoted ? "text-cyan-400 font-bold" : ""
                            }`}
                          >
                            <Heart className="size-4" />
                            <span>{post.upvotesCount}</span>
                          </button>

                          <button
                            onClick={() => handleToggleComments(post._id)}
                            className={`hover:text-white flex items-center gap-1.5 transition-colors ${
                              activeCommentsPostId === post._id ? "text-cyan-400 font-bold" : ""
                            }`}
                          >
                            <MessageSquare className="size-4" />
                            <span>{post.commentsCount}</span>
                          </button>

                          <button onClick={() => setResharePost(post)} className="hover:text-white flex items-center gap-1.5 transition-colors">
                            <Share2 className="size-4" />
                            <span className="hidden sm:inline">Reshare</span>
                          </button>

                          <button onClick={() => handleShare(post)} className="hover:text-white flex items-center gap-1.5 transition-colors">
                            <ArrowUpRight className="size-4" />
                            <span className="hidden sm:inline">Share</span>
                          </button>

                          <button onClick={() => handleBookmark(post)} className="hover:text-white flex items-center gap-1.5 transition-colors text-cyan-400">
                            <Bookmark className="size-4" />
                            <span className="hidden sm:inline">Save</span>
                          </button>
                        </div>

                        <button
                          onClick={() => handleFlagPost(post._id)}
                          className="text-[9px] font-mono text-zinc-500 hover:text-rose-400 font-bold uppercase transition-colors shrink-0"
                        >
                          Report
                        </button>
                      </div>

                      {/* Expandable comments drawer */}
                      {activeCommentsPostId === post._id && (
                        <div className="border-t border-[#F3F0E4]/10 pt-4 space-y-4">
                          <div className="flex gap-2">
                            <Input
                              type="text"
                              autoComplete="off"
                              autoCorrect="off"
                              autoCapitalize="none"
                              spellCheck={false}
                              data-lpignore="true"
                              value={newCommentText}
                              onChange={(e) => setNewCommentText(e.target.value)}
                              placeholder="Add your public comment..."
                              className="bg-[#16261D] border-[#F3F0E4]/15 focus:border-[#F0C93B] text-[#F3F0E4] placeholder-[#9FAEA1]/60 h-10 text-xs rounded-xl"
                            />
                            <Button
                              onClick={() => handleAddComment(null)}
                              className="rounded-xl bg-[#F0C93B] hover:bg-[#F0C93B]/90 text-[#2A2118] text-xs h-10 px-5 font-bold cursor-pointer transition-all shrink-0 shadow-[2px_2px_0_0_#F28B6E]"
                            >
                              Comment
                            </Button>
                          </div>

                          {isCommentsLoading ? (
                            <div className="py-6 flex justify-center select-none">
                              <Loader2 className="size-5 animate-spin text-[#8FC3DE]" />
                            </div>
                          ) : (
                            renderCommentNodes(null)
                          )}
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}

          {hasMore && (
            <Button
              onClick={() => fetchPosts()}
              className="w-full rounded-2xl bg-[#1A2D23] hover:bg-[#1F362A] border border-[#F3F0E4]/15 text-[#F3F0E4] hover:text-[#F0C93B] font-mono text-xs h-11 uppercase tracking-widest cursor-pointer transition-all font-heading"
            >
              {isLoading ? <Loader2 className="size-4 animate-spin text-[#F0C93B]" /> : "LOAD MORE POSTS"}
            </Button>
          )}
        </div>

        {/* Right Responsive Sidebar */}
        <div className="col-span-1 lg:col-span-4 space-y-6 select-none w-full">
          <div className="rounded-[2rem] bg-[#1A2D23]/80 border border-[#F3F0E4]/15 p-2 backdrop-blur-xl shadow-[0_10px_30px_rgba(0,0,0,0.25)]">
            <div className="rounded-[calc(2rem-0.5rem)] bg-[#121F18] border border-[#F3F0E4]/10 p-6 space-y-4">
              <h3 className="text-xs font-mono font-bold text-[#F3F0E4] uppercase tracking-widest flex items-center gap-2 font-heading">
                <TrendingUp className="size-4 text-[#F0C93B]" /> Trending Topics
              </h3>
              <div className="flex flex-wrap lg:flex-col gap-2">
                {["Forum", "Community", "Blog", "Note", "Education", "Technology"].map((tagItem) => (
                  <button
                    key={tagItem}
                    onClick={() => setCategory(category === tagItem ? "" : tagItem)}
                    className={`text-left text-xs font-semibold px-4 py-2.5 rounded-xl border transition-all ${
                      category === tagItem
                        ? "bg-[#F0C93B]/15 border-[#F0C93B]/40 text-[#F0C93B]"
                        : "bg-[#16261D] border-[#F3F0E4]/10 text-[#9FAEA1] hover:text-[#F3F0E4] hover:border-[#F3F0E4]/20"
                    }`}
                  >
                    {tagItem}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <GoogleAdBanner adSlot="1002" adFormat="rectangle" />
        </div>
      </div>

      {/* Reshare commentary dialog */}
      {resharePost && (
        <Dialog open={true} onOpenChange={() => setResharePost(null)}>
          <DialogContent className="bg-zinc-950 border border-white/10 text-white max-w-md rounded-3xl p-6">
            <DialogHeader>
              <DialogTitle className="text-base font-bold tracking-tight text-white">
                Reshare Post
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div className="p-4 bg-zinc-900 border border-white/5 rounded-2xl space-y-1 select-none">
                <span className="text-[9px] font-mono font-bold text-zinc-500 uppercase tracking-widest block">
                  Resharing:
                </span>
                <h4 className="text-xs font-bold text-white truncate">{resharePost.title}</h4>
              </div>

              <textarea
                value={reshareCommentary}
                onChange={(e) => setReshareCommentary(e.target.value)}
                placeholder="Write your custom reshare commentary..."
                rows={4}
                className="w-full bg-zinc-900 border border-white/10 rounded-2xl p-3.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-cyan-400 resize-none transition-colors"
              />
            </div>

            <DialogFooter className="gap-2">
              <Button
                variant="ghost"
                onClick={() => setResharePost(null)}
                className="text-xs text-zinc-400 hover:text-white rounded-full px-4"
              >
                Cancel
              </Button>
              <Button
                onClick={handleReshareSubmit}
                disabled={isResharing}
                className="rounded-full bg-white hover:bg-zinc-100 text-zinc-950 text-xs font-bold h-9 px-5 transition-all"
              >
                {isResharing ? <Loader2 className="size-4 animate-spin text-zinc-950" /> : "Post to Feed"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
