/* eslint-disable */
"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { useAlertStore } from "@/stores/alertStore";
import { Heart, MessageSquare, Share2, Loader2, ArrowUpRight, Search, Compass, Bookmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useSession } from "next-auth/react";
import Link from "next/link";

interface Author {
  _id: string;
  name: string;
  image?: string;
}

interface PostData {
  _id: string;
  type?: "note" | "community";
  // Note specific
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
  // Community specific
  userId?: string;
  userName?: string;
  userImage?: string;
  content?: string;
  mediaUrl?: string;
  mediaType?: string;
  likes?: string[];
  // Common
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
    const permalink = `${window.location.origin}/blog/${post.author?.name || "user"}/${post.slug}`;
    navigator.clipboard.writeText(permalink);
    showAlert("Link Copied", "Post permalink copied to clipboard!");
  };

  const handleBookmark = async (post: PostData) => {
    try {
      const permalink = `${window.location.origin}/blog/${post.author?.name || "user"}/${post.slug}`;
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
          // Remove unfollowed user's posts from active feed
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

  // Comments handlers
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
        // Increment commentsCount locally
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

  // Render threaded comments recursively
  const renderCommentNodes = (parentId: string | null = null, depth = 0) => {
    const list = comments.filter((c) => c.parentId === parentId);
    if (list.length === 0) return null;

    return (
      <div className="space-y-4">
        {list.map((comment) => {
          const hasUpvoted = comment.upvotes.includes(currentUserId);
          const hasDownvoted = comment.downvotes.includes(currentUserId);
          return (
            <div key={comment._id} className="space-y-2" style={{ marginLeft: `${depth > 0 ? 20 : 0}px` }}>
              <div className="bg-neutral-900/10 border border-neutral-900 rounded-xl p-3.5 space-y-2">
                <div
                  className="flex items-center justify-between text-[10px] text-neutral-500 select-none font-bold"
                  style={{ fontFamily: "var(--font-space-grotesk)" }}
                >
                  <div className="flex items-center gap-2">
                    {comment.userImage ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      /* eslint-disable-next-line @next/next/no-img-element */
<img src={comment.userImage} alt={comment.userName} className="h-5 w-5 rounded-full object-cover border border-neutral-800" />
                    ) : (
                      <div className="h-5 w-5 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-400 font-bold">
                        {comment.userName?.[0]?.toUpperCase()}
                      </div>
                    )}
                    <span className="font-bold text-neutral-300">{comment.userName}</span>
                    <span style={{ fontFamily: "var(--font-jetbrains-mono)" }}>
                      {new Date(comment.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <button onClick={() => handleFlagComment(comment._id)} className="hover:text-red-400 transition-colors uppercase">
                    Report
                  </button>
                </div>

                <p className="text-xs text-neutral-300 leading-normal">{comment.content}</p>

                <div
                  className="flex items-center gap-4 text-[10px] text-neutral-500 font-bold select-none pt-1"
                  style={{ fontFamily: "var(--font-space-grotesk)" }}
                >
                  <button
                    onClick={() => handleVoteComment(comment._id, "upvote")}
                    className={`hover:text-neutral-300 flex items-center gap-1 transition-colors ${hasUpvoted ? "text-cyan-400" : ""}`}
                  >
                    Upvote ({comment.upvotes.length})
                  </button>
                  <button
                    onClick={() => handleVoteComment(comment._id, "downvote")}
                    className={`hover:text-neutral-300 flex items-center gap-1 transition-colors ${hasDownvoted ? "text-red-400" : ""}`}
                  >
                    Downvote ({comment.downvotes.length})
                  </button>
                  <button
                    onClick={() => {
                      const text = prompt("Write your reply:") || "";
                      if (text.trim()) handleAddComment(comment._id, text.trim());
                    }}
                    className="hover:text-neutral-200 transition-colors"
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
    <div className="flex-1 flex flex-col h-full bg-transparent overflow-y-auto custom-scroll relative">
      {/* Background ambient light overlay */}
      <div className="absolute top-0 right-1/4 w-[500px] h-[300px] bg-cyan-500/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Search Header Overlay */}
      <div className="border-b border-white/[0.12] bg-white/[0.04] backdrop-blur-[30px] px-4 sm:px-8 py-4 sm:py-6 shrink-0 select-none relative z-10">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Compass className="h-5 w-5 text-cyan-400 neon-pulse" />
            <h1
              className="text-xl font-bold text-neutral-100 tracking-tight"
              style={{ fontFamily: "var(--font-space-grotesk)" }}
            >
              Public Feed
            </h1>
          </div>

          {/* Global search — hidden on mobile */}
          <div className="relative hidden sm:block w-64">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-600" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search feed topics..."
              className="input-premium text-xs pl-9 placeholder-neutral-750 h-9 font-sans"
            />
          </div>
        </div>

        {/* Mobile search row */}
        <div className="sm:hidden mt-3 relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-600" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search feed topics..."
            className="w-full input-premium text-xs pl-9 placeholder-neutral-750 h-9 font-sans"
          />
        </div>
      </div>

      {/* Main split containers */}
      <div className="p-4 sm:p-8 max-w-5xl w-full mx-auto grid grid-cols-1 md:grid-cols-12 gap-6 sm:gap-8 items-start relative z-10">
        {/* Left main feed posts */}
        <div className="col-span-1 md:col-span-8 space-y-6">
          {/* Feed Filter Sort Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2 border-b border-white/[0.12] pb-3 select-none flex-wrap">
            {(["new", "top", "trending", "following"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setSort(mode)}
                className={`text-[9px] font-bold px-3 py-1.5 rounded-lg uppercase tracking-widest transition-all ${
                  sort === mode
                    ? "bg-white/[0.08] border border-white/[0.15] text-neutral-100 font-extrabold"
                    : "text-neutral-500 hover:text-neutral-300"
                }`}
                style={{ fontFamily: "var(--font-space-grotesk)" }}
              >
                {mode}
              </button>
            ))}
          </div>

          {posts.length === 0 && !isLoading ? (
            <div className="py-20 text-center text-neutral-600 italic select-none">
              No feed posts matching filters found.
            </div>
          ) : (
            <div className="space-y-6">
              {posts.map((post) => {
                if (post.type === "community") {
                   // eslint-disable-next-line @typescript-eslint/no-unused-vars
const isLiked = post.likes?.includes(currentUserId || "");
                   return (
                    <div key={post._id} className="glass glass-card-hover overflow-hidden p-6 space-y-5 transition-all duration-300">
                      <div className="flex items-center gap-3 select-none">
                        {post.userImage ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
<img src={post.userImage} alt={post.userName} className="h-9 w-9 rounded-full object-cover border border-neutral-800" />
                        ) : (
                          <div className="h-9 w-9 rounded-full bg-neutral-950 border border-neutral-850 flex items-center justify-center text-neutral-500 text-sm font-bold">
                            {post.userName?.[0]?.toUpperCase()}
                          </div>
                        )}
                        <div>
                          <Link href={`/user/${post.userId}`}>
                            <p className="text-xs font-bold text-neutral-200 hover:text-cyan-400 transition-colors leading-tight" style={{ fontFamily: "var(--font-space-grotesk)" }}>
                              {post.userName}
                            </p>
                          </Link>
                          <p className="text-[10px] text-neutral-605 mt-0.5" style={{ fontFamily: "var(--font-jetbrains-mono)" }}>
                            {new Date(post.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="ml-auto flex items-center gap-2">
                           <span className="text-[9px] bg-neutral-950 border border-cyan-400/30 text-cyan-400 font-bold px-2 py-0.5 rounded" style={{ fontFamily: "var(--font-jetbrains-mono)" }}>#Community</span>
                        </div>
                      </div>
                      
                      <p className="text-neutral-300 text-sm leading-relaxed whitespace-pre-wrap">{post.content}</p>

                      {post.mediaUrl && (
                        <div className="flex items-center justify-start w-full">
                          {post.mediaType === "image" ? (
                            /* eslint-disable-next-line @next/next/no-img-element */
<img src={post.mediaUrl} alt="Post content" className="max-h-[300px] object-contain w-auto rounded-xl border border-neutral-900 bg-neutral-950/40" />
                          ) : (
                            <video src={post.mediaUrl} controls className="max-h-[300px] object-contain w-auto rounded-xl border border-neutral-900 bg-neutral-950/40" />
                          )}
                        </div>
                      )}
                    </div>
                   );
                }

                const userHasUpvoted = post.upvotes?.includes(currentUserId);
                const following = followingMap[post.author?._id || ""];

                // Lazy-fetch follow statuses
                if (following === undefined && post.author?._id !== currentUserId && post.author) {
                  checkFollowStatus(post.author?._id);
                }

                return (
                  <div key={post._id} className="glass glass-card-hover overflow-hidden p-6 space-y-5 transition-all duration-300">
                    {/* Card Header metadata */}
                    <div className="flex items-center justify-between select-none">
                      <Link href={`/user/${post.author?._id}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                        {post.author?.image ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          /* eslint-disable-next-line @next/next/no-img-element */
<img src={post.author?.image} alt={post.author?.name} className="h-9 w-9 rounded-full object-cover border border-neutral-800" />
                        ) : (
                          <div className="h-9 w-9 rounded-full bg-neutral-950 border border-neutral-850 flex items-center justify-center text-neutral-500 text-sm font-bold">
                            {post.author?.name?.[0]?.toUpperCase()}
                          </div>
                        )}
                        <div>
                          <p className="text-xs font-bold text-neutral-200 leading-tight" style={{ fontFamily: "var(--font-space-grotesk)" }}>
                            {post.author?.name}
                          </p>
                          <p className="text-[10px] text-neutral-605 mt-0.5" style={{ fontFamily: "var(--font-jetbrains-mono)" }}>
                            {new Date(post.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </Link>

                      {post.author?._id !== currentUserId && (
                        <button
                          onClick={() => handleFollowToggle(post.author?._id || "")}
                          className={`text-[9px] font-bold px-3 py-1 rounded-md transition-all border uppercase tracking-wider ${
                            following
                              ? "bg-neutral-950 border-neutral-850 text-neutral-500"
                              : "bg-cyan-500 border-cyan-500 text-neutral-950 font-extrabold"
                          }`}
                          style={{ fontFamily: "var(--font-space-grotesk)" }}
                        >
                          {following ? "Following" : "Follow"}
                        </button>
                      )}
                    </div>

                    {/* Card Body */}
                    <div className="space-y-2">
                      <Link href={`/blog/${post.author?.name || "user"}/${post.slug}`}>
                        <h2
                          className="text-sm font-bold text-neutral-100 hover:text-cyan-400 tracking-wide leading-snug cursor-pointer transition-colors"
                          style={{ fontFamily: "var(--font-space-grotesk)" }}
                        >
                          {post.title}
                        </h2>
                      </Link>
                      {post.coverImage && (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        /* eslint-disable-next-line @next/next/no-img-element */
<img src={post.coverImage} alt={post.title} className="w-full h-40 object-cover rounded-xl border border-neutral-900 shadow-md" />
                      )}
                      <div className="flex flex-wrap gap-1.5 select-none pt-1">
                        {(post.tags || []).map((t) => (
                          <span
                            key={t}
                            onClick={() => setTag(t)}
                            className="text-[9px] bg-neutral-950 border border-neutral-850 hover:border-cyan-400 text-cyan-400 font-bold px-2 py-0.5 rounded cursor-pointer transition-colors"
                            style={{ fontFamily: "var(--font-jetbrains-mono)" }}
                          >
                            #{t}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Engagement Actions */}
                    <div className="flex items-center justify-between border-t border-neutral-900 pt-3.5 select-none">
                      <div
                        className="flex items-center gap-2 sm:gap-4 text-[10px] text-neutral-500 font-bold flex-wrap"
                        style={{ fontFamily: "var(--font-space-grotesk)" }}
                      >
                        <button
                          onClick={() => handleUpvote(post._id)}
                          className={`hover:text-neutral-200 flex items-center gap-1.5 transition-colors ${
                            userHasUpvoted ? "text-cyan-400" : ""
                          }`}
                        >
                          <Heart className="h-4 w-4" />
                          <span>{post.upvotesCount}</span>
                        </button>

                        <button
                          onClick={() => handleToggleComments(post._id)}
                          className={`hover:text-neutral-200 flex items-center gap-1.5 transition-colors ${
                            activeCommentsPostId === post._id ? "text-cyan-400" : ""
                          }`}
                        >
                          <MessageSquare className="h-4 w-4" />
                          <span>{post.commentsCount}</span>
                        </button>

                        <button onClick={() => setResharePost(post)} className="hover:text-neutral-200 flex items-center gap-1.5 transition-colors">
                          <Share2 className="h-4 w-4" />
                          <span>Reshare</span>
                        </button>

                        <button onClick={() => handleShare(post)} className="hover:text-neutral-200 flex items-center gap-1.5 transition-colors">
                          <ArrowUpRight className="h-4 w-4" />
                          <span>Share</span>
                        </button>

                        <button onClick={() => handleBookmark(post)} className="hover:text-neutral-200 flex items-center gap-1.5 transition-colors text-cyan-400">
                          <Bookmark className="h-4 w-4" />
                          <span>Bookmark</span>
                        </button>
                      </div>

                      <button
                        onClick={() => handleFlagPost(post._id)}
                        className="text-[9px] text-neutral-600 hover:text-red-400 font-bold uppercase transition-colors"
                        style={{ fontFamily: "var(--font-space-grotesk)" }}
                      >
                        Report
                      </button>
                    </div>

                    {/* Expandable comments drawer */}
                    {activeCommentsPostId === post._id && (
                      <div className="border-t border-white/[0.12] pt-4 space-y-4">
                        {/* comment input form */}
                        <div className="flex gap-2">
                          <Input
                            value={newCommentText}
                            onChange={(e) => setNewCommentText(e.target.value)}
                            placeholder="Add your public comment..."
                            className="input-premium text-xs placeholder-neutral-705 h-9 font-sans"
                          />
                          <Button
                            onClick={() => handleAddComment(null)}
                            className="btn-premium-primary text-xs h-9 px-4 font-bold cursor-pointer"
                            style={{ fontFamily: "var(--font-space-grotesk)" }}
                          >
                            Comment
                          </Button>
                        </div>

                        {/* threaded listing */}
                        {isCommentsLoading ? (
                          <div className="py-6 flex justify-center select-none">
                            <Loader2 className="h-5 w-5 animate-spin text-cyan-400" />
                          </div>
                        ) : (
                          renderCommentNodes(null)
                        )}
                      </div>
                    )}
                  </div>
                );
              })}

              {hasMore && (
                <Button
                  onClick={() => fetchPosts()}
                  className="w-full btn-premium-secondary h-10 font-bold text-xs cursor-pointer"
                  style={{ fontFamily: "var(--font-space-grotesk)" }}
                >
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin text-cyan-400" /> : "LOAD MORE POSTS"}
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Right sidebar — stacks below feed on mobile */}
        <div className="col-span-1 md:col-span-4 space-y-6 select-none">
          {/* Trending categories/tags */}
          <div className="bg-neutral-955/40 backdrop-blur-md border border-white/5 hover:border-neutral-800 transition-all rounded-xl p-5 space-y-4 hover:shadow-[0_0_20px_rgba(255,255,255,0.01)]">
            <h3
              className="text-[10px] font-bold text-neutral-350 uppercase tracking-widest"
              style={{ fontFamily: "var(--font-space-grotesk)" }}
            >
              Trending Topics
            </h3>
            <div className="flex flex-col gap-2.5">
              {["Forum", "Community", "Blog", "Note", "Education", "Technology"].map((tagItem) => (
                <button
                  key={tagItem}
                  onClick={() => setCategory(category === tagItem ? "" : tagItem)}
                  className={`text-left text-xs font-semibold px-3 py-2 rounded-xl border transition-all ${
                    category === tagItem
                      ? "bg-cyan-500/10 border-cyan-400/30 text-cyan-400"
                      : "bg-neutral-950 border-neutral-850 text-neutral-450 hover:text-white"
                  }`}
                  style={{ fontFamily: "var(--font-space-grotesk)" }}
                >
                  {tagItem}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Reshare commentary dialog */}
      {resharePost && (
        <Dialog open={true} onOpenChange={() => setResharePost(null)}>
          <DialogContent className="bg-neutral-955/80 backdrop-blur-lg border border-white/10 text-neutral-100 max-w-md cyber-panel">
            <DialogHeader>
              <DialogTitle
                className="text-sm font-bold tracking-tight text-neutral-100"
                style={{ fontFamily: "var(--font-space-grotesk)" }}
              >
                Reshare Post
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div className="p-3.5 bg-white/[0.02] border border-white/[0.12] rounded-xl space-y-1 select-none">
                <span className="text-[9px] font-bold text-neutral-500 uppercase tracking-widest block" style={{ fontFamily: "var(--font-jetbrains-mono)" }}>
                  Resharing:
                </span>
                <h4 className="text-xs font-bold text-neutral-300 truncate">{resharePost.title}</h4>
              </div>

              <textarea
                value={reshareCommentary}
                onChange={(e) => setReshareCommentary(e.target.value)}
                placeholder="Write your custom reshare commentary..."
                rows={4}
                className="w-full input-premium placeholder-neutral-700 text-xs p-3 resize-none transition-all"
              />
            </div>

            <DialogFooter className="gap-2">
              <Button
                variant="ghost"
                onClick={() => setResharePost(null)}
                className="btn-premium-secondary text-xs h-9 px-4 cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                onClick={handleReshareSubmit}
                disabled={isResharing}
                className="btn-premium-primary text-xs h-9 px-4 font-bold cursor-pointer"
                style={{ fontFamily: "var(--font-space-grotesk)" }}
              >
                {isResharing ? <Loader2 className="h-4 w-4 animate-spin" /> : "Post to Feed"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
