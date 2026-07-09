"use client";

import React, { useState } from "react";
import {
  BookOpen,
  Rss,
  Heart,
  MessageSquare,
  Trophy,
  Loader2,
  Send,
  User as UserIcon,
  HelpCircle,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";

interface UserProfile {
  _id: string;
  name: string;
  image?: string;
  email: string;
  joiningDate?: string;
  role: string;
  bio?: string;
  points: number;
  scholarRank?: string;
  scholarRankColor?: string;
}

interface FollowerNode {
  _id: string;
  name: string;
  image?: string;
  email: string;
}

interface NoteNode {
  _id: string;
  title: string;
  category: string;
  slug?: string;
  wordCount?: number;
  createdAt: string;
}

interface BlogNode {
  _id: string;
  title: string;
  summary: string;
  createdAt: string;
}

interface CommentData {
  _id?: string;
  userId: string;
  userName: string;
  userImage?: string;
  content: string;
  createdAt: string;
}

interface SocialPostNode {
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

interface ForumNode {
  _id: string;
  title: string;
  category: string;
  commentsCount: number;
  createdAt: string;
}

interface DoubtNode {
  _id: string;
  title: string;
  status: "open" | "resolved";
  createdAt: string;
}

interface ProfileClientProps {
  targetUser: UserProfile;
  followers: FollowerNode[];
  following: FollowerNode[];
  notes: NoteNode[];
  blogs: BlogNode[];
  socialPosts: SocialPostNode[];
  forums: ForumNode[];
  doubts: DoubtNode[];
  currentUserId: string;
  canViewProfile: boolean;
}

export function ProfileClient({
  targetUser,
  followers,
  following,
  notes,
  blogs,
  socialPosts,
  forums,
  doubts,
  currentUserId,
  canViewProfile,
}: ProfileClientProps) {
  // Modal toggles
  const [activeListModal, setActiveListModal] = useState<"followers" | "following" | null>(null);
  const [selectedSocialPost, setSelectedSocialPost] = useState<SocialPostNode | null>(null);
  
  // Interactive social comments
  const [commentsList, setCommentsList] = useState<CommentData[]>([]);
  const [likesList, setLikesList] = useState<string[]>([]);
  const [commentInput, setCommentInput] = useState("");
  const [isCommenting, setIsCommenting] = useState(false);

  // Active profile tab
  const [activeTab, setActiveTab] = useState<"notes" | "blogs" | "social" | "forums">("notes");

  const openSocialPost = async (post: SocialPostNode) => {
    setSelectedSocialPost(post);
    setCommentsList(post.comments || []);
    setLikesList(post.likes || []);
  };

  const handleLikeToggle = async (postId: string) => {
    try {
      const res = await fetch(`/api/community/${postId}/like`, { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setLikesList(data.likes);
        // Sync local socialPosts state
        socialPosts.forEach((p) => {
          if (p._id === postId) p.likes = data.likes;
        });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handlePostComment = async (e: React.FormEvent, postId: string) => {
    e.preventDefault();
    if (!commentInput.trim() || isCommenting) return;

    setIsCommenting(true);
    try {
      const res = await fetch(`/api/community/${postId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: commentInput.trim() }),
      });

      if (res.ok) {
        const addedComment = await res.json();
        setCommentsList((prev) => [...prev, addedComment]);
        setCommentInput("");
        // Sync local socialPosts state
        socialPosts.forEach((p) => {
          if (p._id === postId) p.comments = [...p.comments, addedComment];
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsCommenting(false);
    }
  };

  const listUsers = activeListModal === "followers" ? followers : following;

  return (
    <div className="w-full space-y-6 sm:space-y-8 select-none">
      {/* 1. Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full">
        {/* Followers Stat Card */}
        <button
          onClick={() => canViewProfile && setActiveListModal("followers")}
          className="bg-neutral-950/40 backdrop-blur-md border border-white/5 hover:border-white/10 hover:shadow-[0_0_20px_rgba(255,255,255,0.02)] transition-all p-4 rounded-xl text-center group cursor-pointer"
          disabled={!canViewProfile}
        >
          <span className="text-[9px] text-neutral-500 uppercase tracking-widest font-mono block">Followers</span>
          <span className="text-lg font-bold text-neutral-100 mt-1 block group-hover:text-cyan-400 transition-colors">
            {followers.length}
          </span>
        </button>

        {/* Following Stat Card */}
        <button
          onClick={() => canViewProfile && setActiveListModal("following")}
          className="bg-neutral-950/40 backdrop-blur-md border border-white/5 hover:border-white/10 hover:shadow-[0_0_20px_rgba(255,255,255,0.02)] transition-all p-4 rounded-xl text-center group cursor-pointer"
          disabled={!canViewProfile}
        >
          <span className="text-[9px] text-neutral-500 uppercase tracking-widest font-mono block">Following</span>
          <span className="text-lg font-bold text-neutral-100 mt-1 block group-hover:text-cyan-400 transition-colors">
            {following.length}
          </span>
        </button>

        {/* Rank Tier Card */}
        <div className="bg-neutral-955/40 backdrop-blur-md border border-white/5 p-4 rounded-xl flex flex-col justify-between items-center min-h-[76px]">
          <span className="text-[9px] text-neutral-500 uppercase tracking-widest font-mono block">Rank Tier</span>
          <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${targetUser.scholarRankColor || ""}`}>
            {targetUser.scholarRank || "Novice Scholar"}
          </span>
        </div>

        {/* Leaderboard Rank points */}
        <div className="bg-neutral-955/40 backdrop-blur-md border border-white/5 p-4 rounded-xl text-center">
          <span className="text-[9px] text-neutral-500 uppercase tracking-widest font-mono block">Activity Points</span>
          <span className="text-lg font-bold text-yellow-400 mt-1 block flex items-center justify-center gap-1 font-mono">
            <Trophy className="h-4 w-4 text-yellow-400" />
            {targetUser.points}
          </span>
        </div>
      </div>

      {/* 2. Interactive Contributions Section */}
      {canViewProfile && (
        <div className="space-y-6">
          {/* Tab Switcher Toolbar */}
          <div className="flex border-b border-neutral-900 overflow-x-auto shrink-0 scrollbar-none gap-2">
            {[
              { id: "notes", label: "Notes", count: notes.length, icon: BookOpen },
              { id: "blogs", label: "Blogs", count: blogs.length, icon: Rss },
              { id: "social", label: "Social", count: socialPosts.length, icon: UserIcon },
              { id: "forums", label: "Forums & Doubts", count: forums.length + doubts.length, icon: HelpCircle },
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as "notes" | "blogs" | "social" | "forums")}
                  className={`flex items-center gap-2 py-3 px-4 border-b-2 text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
                    isActive
                      ? "border-cyan-400 text-cyan-400 bg-cyan-500/[0.02]"
                      : "border-transparent text-neutral-500 hover:text-neutral-300"
                  }`}
                  style={{ fontFamily: "var(--font-space-grotesk)" }}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                  <span className="text-[10px] bg-neutral-900 border border-neutral-800 text-neutral-400 px-2 py-0.5 rounded-full font-mono">
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Tab Contents */}
          <div className="w-full">
            {/* NOTES TAB */}
            {activeTab === "notes" && (
              <div className="space-y-4">
                {notes.length === 0 ? (
                  <div className="text-center py-12 border border-dashed border-neutral-900 rounded-2xl bg-neutral-950/20 text-neutral-500 text-xs italic">
                    No public notes published.
                  </div>
                ) : (
                  <div className="grid sm:grid-cols-2 gap-4">
                    {notes.map((note) => (
                      <div
                        key={note._id}
                        className="bg-neutral-955/40 backdrop-blur-md border border-white/5 hover:border-cyan-500/20 hover:shadow-[0_0_20px_rgba(6,182,212,0.06)] p-5 rounded-2xl flex flex-col justify-between h-36 transition-all duration-300 relative group"
                      >
                        <div className="space-y-2">
                          <span className="text-[9px] text-cyan-400 bg-cyan-400/5 border border-cyan-400/10 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider font-mono">
                            {note.category || "General"}
                          </span>
                          <Link href={`/blog/${targetUser.name}/${note.slug}`}>
                            <h3
                              className="text-xs font-bold text-neutral-200 hover:text-cyan-400 transition-colors pt-1.5 cursor-pointer line-clamp-2"
                              style={{ fontFamily: "var(--font-space-grotesk)" }}
                            >
                              {note.title}
                            </h3>
                          </Link>
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-neutral-500 font-mono">
                          <span>{note.wordCount || 0} words</span>
                          <span>{new Date(note.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* BLOGS TAB */}
            {activeTab === "blogs" && (
              <div className="space-y-4">
                {blogs.length === 0 ? (
                  <div className="text-center py-12 border border-dashed border-neutral-900 rounded-2xl bg-neutral-950/20 text-neutral-500 text-xs italic">
                    No blogs published.
                  </div>
                ) : (
                  <div className="grid sm:grid-cols-2 gap-4">
                    {blogs.map((blog) => (
                      <div
                        key={blog._id}
                        className="bg-neutral-955/40 backdrop-blur-md border border-white/5 hover:border-violet-500/20 hover:shadow-[0_0_20px_rgba(167,139,250,0.06)] p-5 rounded-2xl flex flex-col justify-between min-h-[144px] transition-all duration-300 group"
                      >
                        <div className="space-y-2">
                          <Link href={`/blogs?blogId=${blog._id}`}>
                            <h3
                              className="text-xs font-bold text-neutral-200 hover:text-cyan-400 transition-colors cursor-pointer line-clamp-1"
                              style={{ fontFamily: "var(--font-space-grotesk)" }}
                            >
                              {blog.title}
                            </h3>
                          </Link>
                          <p className="text-[11px] text-neutral-450 leading-relaxed line-clamp-2">
                            {blog.summary}
                          </p>
                        </div>
                        <div className="text-[10px] text-neutral-550 font-mono mt-2">
                          {new Date(blog.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* SOCIAL TAB (Instagram-style Post Grid) */}
            {activeTab === "social" && (
              <div>
                {socialPosts.length === 0 ? (
                  <div className="text-center py-12 border border-dashed border-neutral-900 rounded-2xl bg-neutral-950/20 text-neutral-500 text-xs italic">
                    No social posts published.
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-2 sm:gap-4">
                    {socialPosts.map((post) => (
                      <div
                        key={post._id}
                        onClick={() => openSocialPost(post)}
                        className="aspect-square bg-neutral-900 border border-white/5 rounded-2xl overflow-hidden hover:scale-[1.02] hover:border-cyan-500/30 transition-all duration-300 relative group cursor-pointer shadow-md"
                      >
                        {/* Media display */}
                        {post.mediaUrl ? (
                          post.mediaType === "video" ? (
                            <video src={post.mediaUrl} muted className="object-cover w-full h-full" />
                          ) : (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={post.mediaUrl} alt="Post Attachment" className="object-cover w-full h-full" />
                          )
                        ) : (
                          <div className="bg-gradient-to-br from-indigo-950/30 via-neutral-900 to-cyan-950/30 p-4 flex items-center justify-center text-center text-[10px] text-neutral-450 italic w-full h-full line-clamp-4 font-mono select-none">
                            {post.content}
                          </div>
                        )}

                        {/* Hover Overlay */}
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 text-xs font-bold text-white select-none">
                          <span className="flex items-center gap-1.5 hover:text-red-400 transition-colors">
                            <Heart className="h-4 w-4 fill-white" />
                            {post.likes.length}
                          </span>
                          <span className="flex items-center gap-1.5 hover:text-cyan-400 transition-colors">
                            <MessageSquare className="h-4 w-4 fill-white" />
                            {post.comments.length}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* FORUMS & DOUBTS TAB */}
            {activeTab === "forums" && (
              <div className="grid md:grid-cols-2 gap-6">
                {/* Forums Column */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 border-b border-neutral-900 pb-2.5">
                    <MessageSquare className="h-4 w-4 text-violet-400" />
                    <h4 className="text-[10px] font-bold text-neutral-350 uppercase tracking-wider" style={{ fontFamily: "var(--font-space-grotesk)" }}>
                      Forum Threads ({forums.length})
                    </h4>
                  </div>
                  {forums.length === 0 ? (
                    <div className="text-center py-8 border border-white/5 rounded-xl bg-neutral-950/20 text-neutral-550 text-xs italic">
                      No forum threads created.
                    </div>
                  ) : (
                    forums.map((forum) => (
                      <div key={forum._id} className="bg-neutral-955/40 backdrop-blur-md border border-white/5 hover:border-violet-500/20 p-4 rounded-xl space-y-1.5 transition-all">
                        <span className="text-[8px] text-violet-400 bg-violet-400/5 border border-violet-400/10 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider font-mono">
                          {forum.category}
                        </span>
                        <Link href={`/forums?forumId=${forum._id}`}>
                          <h5 className="text-xs font-bold text-neutral-200 hover:text-cyan-400 transition-colors pt-1 cursor-pointer" style={{ fontFamily: "var(--font-space-grotesk)" }}>
                            {forum.title}
                          </h5>
                        </Link>
                        <div className="flex items-center justify-between text-[10px] text-neutral-500 font-mono mt-1">
                          <span>{forum.commentsCount || 0} comments</span>
                          <span>{new Date(forum.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Doubts Column */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 border-b border-neutral-900 pb-2.5">
                    <HelpCircle className="h-4 w-4 text-cyan-400" />
                    <h4 className="text-[10px] font-bold text-neutral-350 uppercase tracking-wider" style={{ fontFamily: "var(--font-space-grotesk)" }}>
                      Academic Doubts ({doubts.length})
                    </h4>
                  </div>
                  {doubts.length === 0 ? (
                    <div className="text-center py-8 border border-white/5 rounded-xl bg-neutral-950/20 text-neutral-550 text-xs italic">
                      No doubt tickets posted.
                    </div>
                  ) : (
                    doubts.map((doubt) => (
                      <div key={doubt._id} className="bg-neutral-955/40 backdrop-blur-md border border-white/5 hover:border-cyan-500/20 p-4 rounded-xl space-y-1.5 transition-all">
                        <span className={`text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                          doubt.status === "resolved"
                            ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
                            : "text-amber-400 bg-amber-500/10 border-amber-500/20"
                        }`} style={{ fontFamily: "var(--font-jetbrains-mono)" }}>
                          {doubt.status}
                        </span>
                        <Link href={`/doubts?doubtId=${doubt._id}`}>
                          <h5 className="text-xs font-bold text-neutral-200 hover:text-cyan-400 transition-colors pt-1 cursor-pointer" style={{ fontFamily: "var(--font-space-grotesk)" }}>
                            {doubt.title}
                          </h5>
                        </Link>
                        <div className="text-[10px] text-neutral-500 font-mono mt-1">
                          {new Date(doubt.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. Clickable Followers & Following Lists Dialog */}
      <Dialog open={activeListModal !== null} onOpenChange={() => setActiveListModal(null)}>
        <DialogContent className="bg-neutral-900 border-neutral-800 text-neutral-100 max-w-sm cyber-panel max-h-[80vh] flex flex-col overflow-hidden">
          <DialogHeader className="shrink-0 select-none border-b border-neutral-800 pb-3">
            <DialogTitle
              className="text-sm font-bold text-neutral-100 uppercase tracking-widest text-center"
              style={{ fontFamily: "var(--font-space-grotesk)" }}
            >
              {activeListModal === "followers" ? "Followers" : "Following"}
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto custom-scroll py-3 space-y-3.5 pr-1">
            {listUsers.length === 0 ? (
              <p className="text-center py-8 text-neutral-500 text-xs italic">
                No users found
              </p>
            ) : (
              listUsers.map((usr) => (
                <div key={usr._id} className="flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-3 min-w-0">
                    {usr.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={usr.image}
                        alt={usr.name}
                        className="h-8 w-8 rounded-full object-cover border border-neutral-850"
                      />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-neutral-800 flex items-center justify-center text-neutral-500 border border-neutral-750 font-bold uppercase text-[10px]">
                        {usr.name.substring(0, 2)}
                      </div>
                    )}
                    <div className="min-w-0">
                      <Link
                        href={`/user/${usr._id}`}
                        onClick={() => setActiveListModal(null)}
                        className="font-semibold text-neutral-200 hover:text-cyan-400 transition-colors truncate block"
                        style={{ fontFamily: "var(--font-space-grotesk)" }}
                      >
                        {usr.name}
                      </Link>
                      <span className="text-[10px] text-neutral-500 truncate block">{usr.email}</span>
                    </div>
                  </div>

                  <Link href={`/user/${usr._id}`} onClick={() => setActiveListModal(null)}>
                    <Button variant="ghost" className="h-7 text-[10px] border border-neutral-800 text-neutral-450 hover:text-neutral-200">
                      Profile
                    </Button>
                  </Link>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* 4. Social Post Details Dialog */}
      <Dialog open={selectedSocialPost !== null} onOpenChange={() => setSelectedSocialPost(null)}>
        <DialogContent className="bg-neutral-900 border-neutral-800 text-neutral-100 max-w-xl cyber-panel max-h-[85vh] flex flex-col md:flex-row p-0 overflow-hidden">
          {selectedSocialPost && (
            <>
              {/* Media Content Left Side */}
              <div className="flex-1 max-h-[40vh] md:max-h-none md:w-1/2 bg-neutral-950 flex items-center justify-center border-b md:border-b-0 md:border-r border-neutral-800 relative">
                {selectedSocialPost.mediaUrl ? (
                  selectedSocialPost.mediaType === "video" ? (
                    <video src={selectedSocialPost.mediaUrl} controls className="max-h-full max-w-full object-contain" />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={selectedSocialPost.mediaUrl} alt="Post Attachment" className="max-h-full max-w-full object-contain" />
                  )
                ) : (
                  <div className="p-6 text-center text-xs text-neutral-400 italic max-w-xs font-mono leading-relaxed select-text">
                    {selectedSocialPost.content}
                  </div>
                )}
              </div>

              {/* Likes & Comments Right Side */}
              <div className="flex flex-col h-[45vh] md:h-auto md:w-1/2 overflow-hidden bg-neutral-900/40">
                {/* Header */}
                <div className="p-4 border-b border-neutral-850 shrink-0 select-none flex items-center gap-2">
                  {selectedSocialPost.userImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={selectedSocialPost.userImage} alt="" className="h-7 w-7 rounded-full object-cover border border-neutral-800" />
                  ) : (
                    <div className="h-7 w-7 rounded-full bg-neutral-800 flex items-center justify-center text-neutral-500 font-bold uppercase text-[9px]">
                      {selectedSocialPost.userName.substring(0, 2)}
                    </div>
                  )}
                  <div>
                    <h4 className="text-xs font-bold text-neutral-200" style={{ fontFamily: "var(--font-space-grotesk)" }}>
                      {selectedSocialPost.userName}
                    </h4>
                    <span className="text-[8px] text-neutral-550 font-mono">
                      {new Date(selectedSocialPost.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {/* Text Content for Media Posts */}
                {selectedSocialPost.mediaUrl && selectedSocialPost.content && (
                  <div className="p-4 border-b border-neutral-850 shrink-0 text-xs text-neutral-300 leading-relaxed max-h-24 overflow-y-auto custom-scroll select-text">
                    {selectedSocialPost.content}
                  </div>
                )}

                {/* Scrollable Comments List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3.5 custom-scroll text-xs">
                  <div className="flex items-center justify-between border-b border-neutral-850 pb-2 select-none">
                    <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider font-mono">Comments</span>
                  </div>

                  {commentsList.length === 0 ? (
                    <p className="text-center py-6 text-neutral-500 italic text-[11px] select-none">
                      No comments yet
                    </p>
                  ) : (
                    commentsList.map((c, index) => (
                      <div key={c._id || index} className="space-y-1">
                        <div className="flex items-baseline gap-2">
                          <span className="font-semibold text-neutral-200 font-mono text-[11px]">{c.userName}</span>
                          <span className="text-[8px] text-neutral-600 font-mono">
                            {new Date(c.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-neutral-400 select-text leading-relaxed">{c.content}</p>
                      </div>
                    ))
                  )}
                </div>

                {/* Likes Action Bar */}
                <div className="p-4 border-t border-neutral-850 shrink-0 select-none flex items-center justify-between">
                  <button
                    onClick={() => handleLikeToggle(selectedSocialPost._id)}
                    className="flex items-center gap-1.5 text-xs text-neutral-400 hover:text-red-400 transition-colors group"
                  >
                    <Heart className={`h-4 w-4 transition-all ${
                      likesList.includes(currentUserId)
                        ? "fill-red-500 text-red-500 scale-110"
                        : "text-neutral-500 group-hover:scale-110"
                    }`} />
                    <span className="font-semibold text-neutral-350">{likesList.length} likes</span>
                  </button>
                </div>

                {/* Comment Input form */}
                <form
                  onSubmit={(e) => handlePostComment(e, selectedSocialPost._id)}
                  className="p-3 border-t border-neutral-850 bg-neutral-950/20 shrink-0 flex items-center gap-2"
                >
                  <Input
                    placeholder="Add a comment..."
                    value={commentInput}
                    onChange={(e) => setCommentInput(e.target.value)}
                    className="bg-neutral-950 border-neutral-850 focus:border-cyan-400 text-neutral-100 placeholder-neutral-600 h-8 text-xs flex-1 rounded-lg"
                  />
                  <Button
                    type="submit"
                    size="icon"
                    disabled={isCommenting}
                    className="h-8 w-8 bg-cyan-500 hover:bg-cyan-400 text-neutral-950 rounded-lg"
                  >
                    {isCommenting ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Send className="h-3.5 w-3.5" />
                    )}
                  </Button>
                </form>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
