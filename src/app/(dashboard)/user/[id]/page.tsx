/* eslint-disable @next/next/no-img-element */
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
import { EyeOff, ArrowLeft, MessageCircle, Sparkles } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FollowButton } from "@/app/(dashboard)/user/[id]/FollowButton";
import { ProfileClient } from "@/app/(dashboard)/user/[id]/ProfileClient";
import { buildPersonSchema, buildBreadcrumbSchema } from "@/lib/seo/jsonld";
import mongoose from "mongoose";

interface UserProfilePageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: UserProfilePageProps) {
  try {
    const { id } = await params;
    await connectToDatabase();
    const user = await User.findById(id).select("name email isPublic isSuspended").lean();
    if (!user || user.isSuspended) return { title: "Profile Not Found | Notexia" };

    const name = (user.name as string) || "Scholar";
    const title = `${name}'s Academic Profile & Research Notes | Notexia`;
    const description = `Explore research notes, published blogs, and study contributions by ${name} on Notexia.`;
    const url = `https://notexia.in/user/${id}`;

    return {
      title,
      description,
      alternates: { canonical: url },
      openGraph: { title, description, url, type: "profile" },
      twitter: { card: "summary_large_image", title, description },
    };
  } catch {
    return { title: "User Profile | Notexia" };
  }
}

export default async function UserProfilePage({ params }: UserProfilePageProps) {
  const { id: targetUserId } = await params;
  const session = await auth();
  
  if (!session?.user) {
    redirect("/login");        
  }

  await connectToDatabase();

  const targetUser = await User.findById(targetUserId);
  if (!targetUser || targetUser.isSuspended) {
    notFound();
  }

  const isOwnProfile = session.user.id === targetUserId;
  const isAdmin = session.user.role === "admin";
  const canViewProfile = targetUser.isPublic || isOwnProfile || isAdmin;

  let isFollowing = false;
  if (!isOwnProfile) {
    const followRecord = await Follow.findOne({
      followerId: session.user.id,
      followingId: targetUserId,
    });
    isFollowing = !!followRecord;
  }

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

  const points = targetUser.points || 0;
  let scholarRank = "Novice Scholar";
  let scholarRankColor = "text-[#8A8078] bg-[#150F0B] border-[#2E2118]";
  
  if (points >= 2000) {
    scholarRank = "Grandmaster Scholar";
    scholarRankColor = "text-[#F5B429] bg-[#F5B429]/10 border-[#F5B429]/30";
  } else if (points >= 500) {
    scholarRank = "Academic Specialist";
    scholarRankColor = "text-amber-400 bg-amber-500/10 border-amber-500/30";
  } else if (points >= 100) {
    scholarRank = "Research Associate";
    scholarRankColor = "text-[#B8AFA6] bg-[#241811] border-[#2E2118]";
  }

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

  const personSchema = buildPersonSchema({
    id: String(targetUser._id),
    name: targetUser.name || "Scholar",
    image: targetUser.image || undefined,
    bio: targetUser.bio || undefined,
  });

  const breadcrumbs = buildBreadcrumbSchema([
    { name: "Home", item: "/" },
    { name: "Community", item: "/community" },
    { name: targetUser.name || "Scholar Profile", item: `/user/${targetUserId}` },
  ]);

  return (
    <div className="flex-1 flex flex-col h-full bg-transparent text-[#FAFAF8] overflow-y-auto antialiased relative selection:bg-[#F5B429]/30 selection:text-[#FAFAF8]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(personSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs) }}
      />
      {/* Background Ambient Mesh Glow Orbs */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 right-1/4 w-[500px] h-[350px] bg-[#F5B429]/5 rounded-full blur-[140px]" />
      </div>

      {/* Header */}
      <div className="bg-[#150F0B] p-4 sm:p-5 rounded-2xl border border-[#2E2118] relative z-10 m-4 sm:m-8 lg:m-10 mb-0 flex flex-wrap items-center justify-between gap-3">
        <Link href="/dashboard" className="text-xs font-mono text-[#F5B429] hover:text-[#FCD34D] flex items-center gap-2 font-bold uppercase tracking-widest transition-colors">
          <ArrowLeft className="size-4" /> Back to Dashboard
        </Link>
        
        {isOwnProfile && (
          <div className="flex items-center gap-2">
            <Link href="/wallet">
              <Button variant="outline" className="rounded-xl bg-[#F5B429]/10 border-[#F5B429]/30 text-[#F5B429] hover:bg-[#F5B429]/20 text-xs font-bold h-9 px-4 flex items-center gap-1.5 cursor-pointer">
                <Sparkles className="size-3.5" />
                <span>My Wallet</span>
              </Button>
            </Link>
            <Link href="/settings">
              <Button className="rounded-xl bg-[#FAFAF8] hover:bg-neutral-200 text-[#0A0806] text-xs font-bold h-9 px-4 sm:px-5">
                Edit Profile Settings
              </Button>
            </Link>
          </div>
        )}
      </div>

      <div className="p-4 sm:p-8 lg:p-10 max-w-5xl w-full mx-auto space-y-6 sm:space-y-8 z-10 relative">
        {/* User Card */}
        <div className="rounded-2xl bg-[#150F0B] border border-[#2E2118] p-6 sm:p-8">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6 sm:gap-8">
            {/* Avatar */}
            <div className="relative shrink-0 select-none">
              <img
                src={targetUser.image || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&q=80"}
                alt={targetUser.name || "User Profile"}
                className="size-20 md:size-24 rounded-2xl object-cover border border-[#2E2118] bg-[#0A0806]"
              />
              {targetUser.role === "admin" && (
                <span className="absolute -bottom-1 -right-1 bg-rose-500/20 border border-rose-500/30 text-rose-300 text-[8px] font-mono font-bold uppercase tracking-widest px-2 py-0.5 rounded-full select-none">
                  Admin
                </span>
              )}
            </div>

            {/* Details */}
            <div className="flex-1 text-center md:text-left space-y-3">
              <div className="space-y-1.5">
                <div className="flex flex-col md:flex-row md:items-center gap-3">
                  <h1 className="text-2xl md:text-3xl font-black text-[#FAFAF8] tracking-tight">
                    {targetUser.name || "Scholar"}
                  </h1>
                  
                  {!targetUser.isPublic && (
                    <span className="inline-flex items-center gap-1 mx-auto md:mx-0 px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-mono font-bold uppercase tracking-widest select-none">
                      <EyeOff className="size-3" /> Private Profile
                    </span>
                  )}
                </div>
                
                <div className="flex flex-wrap justify-center md:justify-start gap-x-3 gap-y-1 text-[#8A8078] text-xs font-mono select-none">
                  <span>{targetUser.email}</span>
                  <span>•</span>
                  <span>Joined {joinDate}</span>
                </div>
              </div>

              {/* Scholar Rank Badge */}
              <div className="pt-2 flex flex-wrap justify-center md:justify-start gap-3 items-center">
                <div className={`px-3 py-1 rounded-full border text-xs font-mono font-bold tracking-widest uppercase flex items-center gap-2 ${scholarRankColor}`}>
                  <Sparkles className="size-3.5" />
                  <span>{scholarRank}</span>
                  <span>({points} pts)</span>
                </div>

                {!isOwnProfile && canViewProfile && (
                  <Link href={`/messages?userId=${targetUser._id}`}>
                    <Button variant="outline" className="rounded-xl bg-[#241811] border-[#2E2118] text-xs text-[#FAFAF8] hover:bg-[#2E2118] h-9 px-4 flex items-center gap-2">
                      <MessageCircle className="size-4 text-[#F5B429]" />
                      <span>Message</span>
                    </Button>
                  </Link>
                )}

                {!isOwnProfile && (
                  <FollowButton targetUserId={targetUserId} initialFollowing={isFollowing} />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Tabbed Contributions */}
        <ProfileClient
          targetUser={JSON.parse(JSON.stringify(targetUser))}
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
      </div>
    </div>
  );
}
