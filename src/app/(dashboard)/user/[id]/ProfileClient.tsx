"use client";

import React, { useState } from "react";
import { formatDate } from "@/lib/format-date";
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
  Wallet as WalletIcon,
  Gift,
  ArrowUpRight,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { ReferAndEarnCard } from "@/components/referrals/ReferAndEarnCard";

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
  const isOwnProfile = currentUserId === targetUser._id;
  const [activeTab, setActiveTab] = useState<
    "notes" | "blogs" | "social" | "forums" | "referrals"
  >("notes");

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
      {/* 1. Stats Bento Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 w-full">
        {/* Followers Stat Card */}
        <button
          onClick={() => canViewProfile && setActiveListModal("followers")}
          className="bg-[#150F0B] border border-[#2E2118] hover:border-[#F5B429]/40 transition-all p-4 rounded-xl text-center group cursor-pointer"
          disabled={!canViewProfile}
        >
          <span className="text-[9px] text-[#8A8078] uppercase tracking-widest font-mono block">Followers</span>
          <span className="text-xl font-black text-[#FAFAF8] mt-1 block group-hover:text-[#F5B429] transition-colors">
            {followers.length}
          </span>
        </button>

        {/* Following Stat Card */}
        <button
          onClick={() => canViewProfile && setActiveListModal("following")}
          className="bg-[#150F0B] border border-[#2E2118] hover:border-[#F5B429]/40 transition-all p-4 rounded-xl text-center group cursor-pointer"
          disabled={!canViewProfile}
        >
          <span className="text-[9px] text-[#8A8078] uppercase tracking-widest font-mono block">Following</span>
          <span className="text-xl font-black text-[#FAFAF8] mt-1 block group-hover:text-[#F5B429] transition-colors">
            {following.length}
          </span>
        </button>

        {/* Rank Tier Card */}
        <div className="bg-[#150F0B] border border-[#2E2118] p-4 rounded-xl flex flex-col justify-between items-center text-center">
          <span className="text-[9px] text-[#8A8078] uppercase tracking-widest font-mono block">Scholar Rank</span>
          <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${targetUser.scholarRankColor || "text-[#8A8078] bg-[#241811] border-[#2E2118]"}`}>
            {targetUser.scholarRank || "Novice Scholar"}
          </span>
        </div>

        {/* Leaderboard Rank points */}
        <div className="bg-[#150F0B] border border-[#2E2118] p-4 rounded-xl text-center flex flex-col justify-between items-center">
          <span className="text-[9px] text-[#8A8078] uppercase tracking-widest font-mono block">Activity Points</span>
          <span className="text-xl font-black text-[#F5B429] mt-1 flex items-center justify-center gap-1.5 font-mono">
            <Trophy className="size-4 text-[#F5B429] shrink-0" />
            {targetUser.points}
          </span>
        </div>
      </div>

      {/* 2. Wallet Direct Access Banner (Own Profile) */}
      {isOwnProfile && (
        <div className="rounded-xl bg-[#150F0B] border border-[#2E2118] p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="h-11 w-11 rounded-xl bg-[#F5B429]/10 border border-[#F5B429]/20 flex items-center justify-center text-[#F5B429] shrink-0">
              <WalletIcon className="size-5" />
            </div>
            <div className="space-y-0.5">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm font-bold text-[#FAFAF8] tracking-wide" style={{ fontFamily: "var(--font-space-grotesk)" }}>
                  Digital Wallet &amp; P2P Coins
                </h3>
                <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-[#F5B429] bg-[#F5B429]/10 px-2 py-0.5 rounded border border-[#F5B429]/30">
                  Dedicated Page
                </span>
              </div>
              <p className="text-xs text-[#8A8078]">
                Manage platform activity coins, educator cash payouts, wallet PIN &amp; peer-to-peer transfers.
              </p>
            </div>
          </div>

          <Link href="/wallet" className="shrink-0 w-full sm:w-auto">
            <Button className="w-full sm:w-auto bg-[#F5B429] hover:bg-[#FCD34D] text-[#0A0806] font-bold text-xs h-9 px-4 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer">
              <span>Open Wallet</span>
              <ArrowUpRight className="size-4" />
            </Button>
          </Link>
        </div>
      )}

      {/* 3. Interactive Contributions Section */}
      {canViewProfile && (
        <div className="space-y-6">
          {/* Tab Switcher Toolbar */}
          <div className="flex border-b border-[#2E2118] overflow-x-auto shrink-0 scrollbar-none gap-2">
            {[
              { id: "notes", label: "Notes", count: notes.length, icon: BookOpen },
              { id: "blogs", label: "Blogs", count: blogs.length, icon: Rss },
              { id: "social", label: "Social", count: socialPosts.length, icon: UserIcon },
              { id: "forums", label: "Forums & Doubts", count: forums.length + doubts.length, icon: HelpCircle },
              ...(isOwnProfile
                ? [
                    { id: "referrals", label: "Refer & Earn", count: null, icon: Gift },
                  ]
                : []),
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() =>
                    setActiveTab(
                      tab.id as "notes" | "blogs" | "social" | "forums" | "referrals"
                    )
                  }
                  className={`flex items-center gap-2 py-3 px-4 border-b-2 text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
                    isActive
                      ? "border-[#F5B429] text-[#F5B429] bg-[#F5B429]/5"
                      : "border-transparent text-[#8A8078] hover:text-[#FAFAF8]"
                  }`}
                  style={{ fontFamily: "var(--font-space-grotesk)" }}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                  {tab.count !== null && (
                    <span className="text-[10px] bg-[#0A0806] border border-[#2E2118] text-[#8A8078] px-2 py-0.5 rounded-full font-mono">
                      {tab.count}
                    </span>
                  )}
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
                  <div className="text-center py-12 border border-dashed border-[#2E2118] rounded-xl bg-[#150F0B]/50 text-[#8A8078] text-xs italic">
                    No public notes published.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {notes.map((note) => (
                      <div
                        key={note._id}
                        className="bg-[#150F0B] border border-[#2E2118] hover:border-[#F5B429]/40 p-5 rounded-xl flex flex-col justify-between h-36 transition-all duration-300 relative group"
                      >
                        <div className="space-y-2">
                          <span className="text-[9px] text-[#F5B429] bg-[#F5B429]/10 border border-[#F5B429]/20 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider font-mono">
                            {note.category || "General"}
                          </span>
                          <Link href={`/blog/${encodeURIComponent(targetUser.name || "user")}/${encodeURIComponent(note.slug || note._id)}`}>
                            <h3
                              className="text-xs font-bold text-[#FAFAF8] hover:text-[#F5B429] transition-colors pt-1.5 cursor-pointer line-clamp-2"
                              style={{ fontFamily: "var(--font-space-grotesk)" }}
                            >
                              {note.title}
                            </h3>
                          </Link>
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-[#8A8078] font-mono">
                          <span>{note.wordCount || 0} words</span>
                          <span>{formatDate(note.createdAt)}</span>
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
                  <div className="text-center py-12 border border-dashed border-[#2E2118] rounded-xl bg-[#150F0B]/50 text-[#8A8078] text-xs italic">
                    No blogs published.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {blogs.map((blog) => (
                      <div
                        key={blog._id}
                        className="bg-[#150F0B] border border-[#2E2118] hover:border-[#F5B429]/40 p-5 rounded-xl flex flex-col justify-between min-h-[144px] transition-all duration-300 group"
                      >
                        <div className="space-y-2">
                          <Link href={`/blogs?blogId=${blog._id}`}>
                            <h3
                              className="text-xs font-bold text-[#FAFAF8] hover:text-[#F5B429] transition-colors cursor-pointer line-clamp-1"
                              style={{ fontFamily: "var(--font-space-grotesk)" }}
                            >
                              {blog.title}
                            </h3>
                          </Link>
                          <p className="text-[11px] text-[#8A8078] leading-relaxed line-clamp-2">
                            {blog.summary}
                          </p>
                        </div>
                        <div className="text-[10px] text-[#8A8078] font-mono mt-2">
                          {formatDate(blog.createdAt)}
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
                  <div className="text-center py-12 border border-dashed border-[#2E2118] rounded-xl bg-[#150F0B]/50 text-[#8A8078] text-xs italic">
                    No social posts published.
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-2 sm:gap-4">
                    {socialPosts.map((post) => (
                      <div
                        key={post._id}
                        onClick={() => openSocialPost(post)}
                        className="aspect-square bg-[#150F0B] border border-[#2E2118] rounded-xl overflow-hidden hover:scale-[1.02] hover:border-[#F5B429]/40 transition-all duration-300 relative group cursor-pointer shadow-md"
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
                          <div className="bg-gradient-to-br from-[#150F0B] via-[#0A0806] to-[#241811] p-4 flex items-center justify-center text-center text-[10px] text-[#8A8078] italic w-full h-full line-clamp-4 font-mono select-none">
                            {post.content}
                          </div>
                        )}

                        {/* Hover Overlay */}
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 text-xs font-bold text-white select-none">
                          <span className="flex items-center gap-1.5 hover:text-red-400 transition-colors">
                            <Heart className="h-4 w-4 fill-white" />
                            {post.likes.length}
                          </span>
                          <span className="flex items-center gap-1.5 hover:text-[#F5B429] transition-colors">
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
                  <div className="flex items-center gap-2 border-b border-[#2E2118] pb-2.5">
                    <MessageSquare className="h-4 w-4 text-[#F5B429]" />
                    <h4 className="text-[10px] font-bold text-[#FAFAF8] uppercase tracking-wider" style={{ fontFamily: "var(--font-space-grotesk)" }}>
                      Forum Threads ({forums.length})
                    </h4>
                  </div>
                  {forums.length === 0 ? (
                    <div className="text-center py-8 border border-[#2E2118] rounded-xl bg-[#150F0B]/50 text-[#8A8078] text-xs italic">
                      No forum threads created.
                    </div>
                  ) : (
                    forums.map((forum) => (
                      <div key={forum._id} className="bg-[#150F0B] border border-[#2E2118] hover:border-[#F5B429]/40 p-4 rounded-xl space-y-1.5 transition-all">
                        <span className="text-[8px] text-[#F5B429] bg-[#F5B429]/10 border border-[#F5B429]/20 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider font-mono">
                          {forum.category}
                        </span>
                        <Link href={`/forums?forumId=${forum._id}`}>
                          <h5 className="text-xs font-bold text-[#FAFAF8] hover:text-[#F5B429] transition-colors pt-1 cursor-pointer" style={{ fontFamily: "var(--font-space-grotesk)" }}>
                            {forum.title}
                          </h5>
                        </Link>
                        <div className="flex items-center justify-between text-[10px] text-[#8A8078] font-mono mt-1">
                          <span>{forum.commentsCount || 0} comments</span>
                          <span>{formatDate(forum.createdAt)}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Doubts Column */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 border-b border-[#2E2118] pb-2.5">
                    <HelpCircle className="h-4 w-4 text-[#F5B429]" />
                    <h4 className="text-[10px] font-bold text-[#FAFAF8] uppercase tracking-wider" style={{ fontFamily: "var(--font-space-grotesk)" }}>
                      Academic Doubts ({doubts.length})
                    </h4>
                  </div>
                  {doubts.length === 0 ? (
                    <div className="text-center py-8 border border-[#2E2118] rounded-xl bg-[#150F0B]/50 text-[#8A8078] text-xs italic">
                      No doubt tickets posted.
                    </div>
                  ) : (
                    doubts.map((doubt) => (
                      <div key={doubt._id} className="bg-[#150F0B] border border-[#2E2118] hover:border-[#F5B429]/40 p-4 rounded-xl space-y-1.5 transition-all">
                        <span className={`text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                          doubt.status === "resolved"
                            ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
                            : "text-amber-400 bg-amber-500/10 border-amber-500/20"
                        }`} style={{ fontFamily: "var(--font-jetbrains-mono)" }}>
                          {doubt.status}
                        </span>
                        <Link href={`/doubts?doubtId=${doubt._id}`}>
                          <h5 className="text-xs font-bold text-[#FAFAF8] hover:text-[#F5B429] transition-colors pt-1 cursor-pointer" style={{ fontFamily: "var(--font-space-grotesk)" }}>
                            {doubt.title}
                          </h5>
                        </Link>
                        <div className="text-[10px] text-[#8A8078] font-mono mt-1">
                          {formatDate(doubt.createdAt)}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* REFERRALS TAB */}
            {activeTab === "referrals" && isOwnProfile && (
              <div className="pt-2">
                <ReferAndEarnCard />
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. Clickable Followers & Following Lists Dialog */}
      <Dialog open={activeListModal !== null} onOpenChange={() => setActiveListModal(null)}>
        <DialogContent className="bg-[#150F0B] border-[#2E2118] text-[#FAFAF8] max-w-sm rounded-2xl max-h-[80vh] flex flex-col overflow-hidden">
          <DialogHeader className="shrink-0 select-none border-b border-[#2E2118] pb-3">
            <DialogTitle
              className="text-sm font-bold text-[#FAFAF8] uppercase tracking-widest text-center"
              style={{ fontFamily: "var(--font-space-grotesk)" }}
            >
              {activeListModal === "followers" ? "Followers" : "Following"}
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto custom-scroll py-3 space-y-3.5 pr-1">
            {listUsers.length === 0 ? (
              <p className="text-center py-8 text-[#8A8078] text-xs italic">
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
                        className="h-8 w-8 rounded-full object-cover border border-[#2E2118]"
                      />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-[#241811] flex items-center justify-center text-[#8A8078] border border-[#2E2118] font-bold uppercase text-[10px]">
                        {usr.name.substring(0, 2)}
                      </div>
                    )}
                    <div className="min-w-0">
                      <Link
                        href={`/user/${usr._id}`}
                        onClick={() => setActiveListModal(null)}
                        className="font-semibold text-[#FAFAF8] hover:text-[#F5B429] transition-colors truncate block"
                        style={{ fontFamily: "var(--font-space-grotesk)" }}
                      >
                        {usr.name}
                      </Link>
                      <span className="text-[10px] text-[#8A8078] truncate block">{usr.email}</span>
                    </div>
                  </div>

                  <Link href={`/user/${usr._id}`} onClick={() => setActiveListModal(null)}>
                    <Button variant="ghost" className="h-7 text-[10px] border border-[#2E2118] text-[#8A8078] hover:text-[#FAFAF8] hover:bg-[#241811]">
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
        <DialogContent className="bg-[#150F0B] border-[#2E2118] text-[#FAFAF8] max-w-xl rounded-2xl max-h-[85vh] flex flex-col md:flex-row p-0 overflow-hidden">
          {selectedSocialPost && (
            <>
              {/* Media Content Left Side */}
              <div className="flex-1 max-h-[40vh] md:max-h-none md:w-1/2 bg-[#0A0806] flex items-center justify-center border-b md:border-b-0 md:border-r border-[#2E2118] relative">
                {selectedSocialPost.mediaUrl ? (
                  selectedSocialPost.mediaType === "video" ? (
                    <video src={selectedSocialPost.mediaUrl} controls className="max-h-full max-w-full object-contain" />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={selectedSocialPost.mediaUrl} alt="Post Attachment" className="max-h-full max-w-full object-contain" />
                  )
                ) : (
                  <div className="p-6 text-center text-xs text-[#8A8078] italic max-w-xs font-mono leading-relaxed select-text">
                    {selectedSocialPost.content}
                  </div>
                )}
              </div>

              {/* Likes & Comments Right Side */}
              <div className="flex flex-col h-[45vh] md:h-auto md:w-1/2 overflow-hidden bg-[#150F0B]">
                {/* Header */}
                <div className="p-4 border-b border-[#2E2118] shrink-0 select-none flex items-center gap-2">
                  {selectedSocialPost.userImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={selectedSocialPost.userImage} alt="" className="h-7 w-7 rounded-full object-cover border border-[#2E2118]" />
                  ) : (
                    <div className="h-7 w-7 rounded-full bg-[#241811] flex items-center justify-center text-[#8A8078] font-bold uppercase text-[9px]">
                      {selectedSocialPost.userName.substring(0, 2)}
                    </div>
                  )}
                  <div>
                    <h4 className="text-xs font-bold text-[#FAFAF8]" style={{ fontFamily: "var(--font-space-grotesk)" }}>
                      {selectedSocialPost.userName}
                    </h4>
                    <span className="text-[8px] text-[#8A8078] font-mono">
                      {formatDate(selectedSocialPost.createdAt)}
                    </span>
                  </div>
                </div>

                {/* Text Content for Media Posts */}
                {selectedSocialPost.mediaUrl && selectedSocialPost.content && (
                  <div className="p-4 border-b border-[#2E2118] shrink-0 text-xs text-[#B8AFA6] leading-relaxed max-h-24 overflow-y-auto custom-scroll select-text">
                    {selectedSocialPost.content}
                  </div>
                )}

                {/* Scrollable Comments List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3.5 custom-scroll text-xs">
                  <div className="flex items-center justify-between border-b border-[#2E2118] pb-2 select-none">
                    <span className="text-[10px] text-[#8A8078] font-bold uppercase tracking-wider font-mono">Comments</span>
                  </div>

                  {commentsList.length === 0 ? (
                    <p className="text-center py-6 text-[#8A8078] italic text-[11px] select-none">
                      No comments yet
                    </p>
                  ) : (
                    commentsList.map((c, index) => (
                      <div key={c._id || index} className="space-y-1">
                        <div className="flex items-baseline gap-2">
                          <span className="font-semibold text-[#FAFAF8] font-mono text-[11px]">{c.userName}</span>
                          <span className="text-[8px] text-[#8A8078] font-mono">
                            {formatDate(c.createdAt)}
                          </span>
                        </div>
                        <p className="text-[#B8AFA6] select-text leading-relaxed">{c.content}</p>
                      </div>
                    ))
                  )}
                </div>

                {/* Likes Action Bar */}
                <div className="p-4 border-t border-[#2E2118] shrink-0 select-none flex items-center justify-between">
                  <button
                    onClick={() => handleLikeToggle(selectedSocialPost._id)}
                    className="flex items-center gap-1.5 text-xs text-[#8A8078] hover:text-red-400 transition-colors group"
                  >
                    <Heart className={`h-4 w-4 transition-all ${
                      likesList.includes(currentUserId)
                        ? "fill-red-500 text-red-500 scale-110"
                        : "text-[#8A8078] group-hover:scale-110"
                    }`} />
                    <span className="font-semibold text-[#B8AFA6]">{likesList.length} likes</span>
                  </button>
                </div>

                {/* Comment Input form */}
                <form
                  onSubmit={(e) => handlePostComment(e, selectedSocialPost._id)}
                  className="p-3 border-t border-[#2E2118] bg-[#0A0806] shrink-0 flex items-center gap-2"
                >
                  <Input
                    placeholder="Add a comment..."
                    value={commentInput}
                    onChange={(e) => setCommentInput(e.target.value)}
                    className="bg-[#150F0B] border-[#2E2118] focus:border-[#F5B429] text-[#FAFAF8] placeholder-[#8A8078] h-8 text-xs flex-1 rounded-lg"
                  />
                  <Button
                    type="submit"
                    size="icon"
                    disabled={isCommenting}
                    className="h-8 w-8 bg-[#F5B429] hover:bg-[#FCD34D] text-[#0A0806] rounded-lg"
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
