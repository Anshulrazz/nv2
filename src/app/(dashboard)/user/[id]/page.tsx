import React from "react";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/models/User";
import { Note, INote } from "@/models/Note";
import { Blog, IBlog } from "@/models/Blog";
import { Follow } from "@/models/Follow";
import { CommunityPost, ICommunityPost } from "@/models/CommunityPost";
import { Forum, IForum } from "@/models/Forum";
import { Doubt, IDoubt } from "@/models/Doubt";
import { EyeOff, ArrowLeft, MessageCircle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FollowButton } from "@/app/(dashboard)/user/[id]/FollowButton";
import { ProfileClient } from "@/app/(dashboard)/user/[id]/ProfileClient";
import mongoose from "mongoose";

interface UserProfilePageProps {
  params: Promise<{ id: string }>;
}

export default async function UserProfilePage({ params }: UserProfilePageProps) {
  const { id: targetUserId } = await params;
  const session = await auth();
  
  if (!session?.user) {
    redirect("/login");        
  }

  await connectToDatabase();

  // Load target user
  const targetUser = await User.findById(targetUserId);
  if (!targetUser || targetUser.isSuspended) {
    notFound();
  }

  const isOwnProfile = session.user.id === targetUserId;
  const isAdmin = session.user.role === "admin";
  const canViewProfile = targetUser.isPublic || isOwnProfile || isAdmin;

  // Check follow status
  let isFollowing = false;
  if (!isOwnProfile) {
    const followRecord = await Follow.findOne({
      followerId: session.user.id,
      followingId: targetUserId,
    });
    isFollowing = !!followRecord;
  }

  // Load followers & following populated lists
  const followers = (await Follow.find({ followingId: targetUserId })
    .populate({ path: "followerId", model: User, select: "_id name email image" })) as unknown as Array<{
      followerId?: {
        _id: mongoose.Types.ObjectId;
        name?: string;
        image?: string;
        email?: string;
      };
    }>;

  const following = (await Follow.find({ followerId: targetUserId })
    .populate({ path: "followingId", model: User, select: "_id name email image" })) as unknown as Array<{
      followingId?: {
        _id: mongoose.Types.ObjectId;
        name?: string;
        image?: string;
        email?: string;
      };
    }>;

  const followersList = followers.map((f) => {
    const follower = f.followerId;
    return {
      _id: follower?._id?.toString() || "",
      name: follower?.name || "Scholar Scholar",
      image: follower?.image,
      email: follower?.email || "",
    };
  }).filter(u => u._id);

  const followingList = following.map((f) => {
    const followed = f.followingId;
    return {
      _id: followed?._id?.toString() || "",
      name: followed?.name || "Scholar Scholar",
      image: followed?.image,
      email: followed?.email || "",
    };
  }).filter(u => u._id);

  const joinDate = new Date(targetUser.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long' });

  // Scholar Rank Tier based on points
  const points = targetUser.points || 0;
  let scholarRank = "Novice Scholar";
  let scholarRankColor = "text-neutral-400 bg-neutral-400/5 border-neutral-500/20 shadow-[0_0_15px_rgba(163,163,163,0.05)]";
  
  if (points >= 2000) {
    scholarRank = "Grandmaster Scholar";
    scholarRankColor = "text-cyan-400 bg-cyan-500/10 border-cyan-500/25 shadow-[0_0_20px_rgba(34,211,238,0.25)]";
  } else if (points >= 500) {
    scholarRank = "Academic Specialist";
    scholarRankColor = "text-violet-400 bg-violet-500/10 border-violet-500/25 shadow-[0_0_15px_rgba(167,139,250,0.2)]";
  } else if (points >= 100) {
    scholarRank = "Research Associate";
    scholarRankColor = "text-amber-400 bg-amber-500/10 border-amber-500/25 shadow-[0_0_15px_rgba(245,158,11,0.2)]";
  }

  // Load user's public contributions
  let publicNotes: INote[] = [];
  let publicBlogs: IBlog[] = [];
  let communityPosts: ICommunityPost[] = [];
  let forums: IForum[] = [];
  let doubts: IDoubt[] = [];

  if (canViewProfile) {
    publicNotes = await Note.find({
      userId: targetUserId,
      published: true,
      isTrashed: false,
    }).sort({ createdAt: -1 });

    publicBlogs = await Blog.find({
      userId: targetUserId,
      published: true,
    }).sort({ createdAt: -1 });

    communityPosts = await CommunityPost.find({
      userId: targetUserId,
    }).sort({ createdAt: -1 });

    forums = await Forum.find({
      userId: targetUserId,
    }).sort({ createdAt: -1 });

    doubts = await Doubt.find({
      userId: targetUserId,
    }).sort({ createdAt: -1 });
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-neutral-955 overflow-y-auto custom-scroll">
      {/* Header */}
      <div className="border-b border-neutral-900 bg-neutral-950/40 backdrop-blur-md px-4 sm:px-8 py-4 sm:py-5 shrink-0 select-none relative overflow-hidden flex items-center justify-between">
        <div className="absolute top-0 right-0 w-64 h-32 bg-cyan-500/5 rounded-full blur-[80px] pointer-events-none" />
        
        <Link href="/dashboard" className="text-xs text-neutral-450 hover:text-neutral-250 flex items-center gap-1.5 font-bold transition-colors">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Dashboard
        </Link>
        
        {isOwnProfile && (
          <Link href="/settings">
            <Button variant="ghost" className="h-8 border border-neutral-850 hover:bg-neutral-900 text-xs text-neutral-300 font-bold">
              Edit Settings
            </Button>
          </Link>
        )}
      </div>

      <div className="p-4 sm:p-8 max-w-4xl w-full mx-auto space-y-6 sm:space-y-8 z-10 relative">
        {/* User Card */}
        <div className="bg-neutral-955/40 backdrop-blur-lg border border-white/5 hover:border-neutral-800/80 hover:shadow-[0_0_35px_rgba(6,182,212,0.08)] rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-center md:items-start gap-6 transition-all duration-300 cyber-panel">
          {/* Avatar */}
          <div className="relative shrink-0 select-none">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={targetUser.image || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&q=80"}
              alt={targetUser.name || "User Profile"}
              className="w-20 h-20 md:w-24 md:h-24 rounded-2xl object-cover border border-neutral-800 shadow-lg bg-neutral-955"
            />
            {targetUser.role === "admin" && (
              <span className="absolute -bottom-1 -right-1 bg-red-500/10 border border-red-500/30 text-red-400 text-[8px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-md font-mono select-none">
                Admin
              </span>
            )}
          </div>

          {/* Details */}
          <div className="flex-1 text-center md:text-left space-y-4">
            <div className="space-y-1.5">
              <div className="flex flex-col md:flex-row md:items-center gap-2.5">
                <h1 className="text-xl font-bold text-neutral-100 tracking-tight" style={{ fontFamily: "var(--font-space-grotesk)" }}>
                  {targetUser.name || "Scholar Scholar"}
                </h1>
                
                {/* Privacy Badge */}
                {!targetUser.isPublic && (
                  <span className="inline-flex items-center gap-1 mx-auto md:mx-0 px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[8.5px] font-bold uppercase tracking-wider select-none font-mono">
                    <EyeOff className="h-2.5 w-2.5" /> Private Profile
                  </span>
                )}
              </div>
              
              <div className="flex flex-wrap justify-center md:justify-start gap-x-3 gap-y-1 text-neutral-500 text-xs font-mono select-none">
                <span>{targetUser.email}</span>
                <span>•</span>
                <span>Joined {joinDate}</span>
              </div>
            </div>

            {targetUser.bio && (
              <p className="text-neutral-400 text-xs leading-relaxed max-w-xl mx-auto md:mx-0">
                {targetUser.bio}
              </p>
            )}

            {/* Follow/CTA/Message Buttons */}
            {!isOwnProfile && canViewProfile && (
              <div className="flex justify-center md:justify-start gap-3 pt-1 select-none">
                <FollowButton targetUserId={targetUserId} initialFollowing={isFollowing} />
                <Link href={`/messages?userId=${targetUserId}`}>
                  <Button variant="outline" className="h-8 border border-neutral-800 hover:bg-neutral-900 hover:text-cyan-400 text-xs text-neutral-300 font-bold gap-1.5 transition-all">
                    <MessageCircle className="h-3.5 w-3.5" />
                    Message
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Interactive Stats & Contributions Client Wrapper */}
        {!canViewProfile ? (
          <div className="text-center py-16 border border-dashed border-neutral-900 rounded-2xl bg-neutral-955/20 backdrop-blur-md space-y-3">
            <EyeOff className="h-10 w-10 text-neutral-700 mx-auto" />
            <h3 className="text-sm font-bold text-neutral-300" style={{ fontFamily: "var(--font-space-grotesk)" }}>
              This Profile is Private
            </h3>
            <p className="text-xs text-neutral-500 max-w-xs mx-auto leading-normal">
              You cannot view notes, blogs, community posts, or lists from this user because they have set their visibility settings to Private.
            </p>
          </div>
        ) : (
          <ProfileClient
            targetUser={{
              ...JSON.parse(JSON.stringify(targetUser)),
              scholarRank,
              scholarRankColor,
            }}
            followers={followersList}
            following={followingList}
            notes={JSON.parse(JSON.stringify(publicNotes))}
            blogs={JSON.parse(JSON.stringify(publicBlogs))}
            socialPosts={JSON.parse(JSON.stringify(communityPosts))}
            forums={JSON.parse(JSON.stringify(forums))}
            doubts={JSON.parse(JSON.stringify(doubts))}
            currentUserId={session.user.id}
            canViewProfile={canViewProfile}
          />
        )}
      </div>
    </div>
  );
}
