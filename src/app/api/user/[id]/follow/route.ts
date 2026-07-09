import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { Follow } from "@/models/Follow";
import { Notification } from "@/models/Notification";
import { User } from "@/models/User";
import mongoose from "mongoose";

export const GET = auth(async function GET(req, context) {
  try {
    const userId = req.auth?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await (context?.params as Promise<{ id: string }>);

    await connectToDatabase();

    const isFollowing = await Follow.findOne({
      followerId: userId,
      followingId: id,
    });

    return NextResponse.json({ isFollowing: !!isFollowing });
  } catch (error) {
    console.error("Check follow error:", error);
    return NextResponse.json({ error: "Failed to verify follow status." }, { status: 500 });
  }
});

export const POST = auth(async function POST(req, context) {
  try {
    const userId = req.auth?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await (context?.params as Promise<{ id: string }>);

    if (userId === id) {
      return NextResponse.json({ error: "You cannot follow yourself." }, { status: 400 });
    }

    await connectToDatabase();

    const existingFollow = await Follow.findOne({
      followerId: userId,
      followingId: id,
    });

    if (existingFollow) {
      // Unfollow
      await Follow.deleteOne({ _id: existingFollow._id });
      // Delete follow alert
      await Notification.deleteOne({
        recipientId: id,
        senderId: userId,
        type: "follow",
      });

      return NextResponse.json({ isFollowing: false });
    } else {
      // Follow
      await Follow.create({
        followerId: userId,
        followingId: id,
      });

      // Dispatch alert
      const currentUser = await User.findById(userId).select("name image");
      await Notification.create({
        recipientId: new mongoose.Types.ObjectId(id),
        senderId: new mongoose.Types.ObjectId(userId),
        senderName: currentUser?.name || "A User",
        senderImage: currentUser?.image,
        type: "follow",
        targetId: new mongoose.Types.ObjectId(userId),
      });

      return NextResponse.json({ isFollowing: true });
    }
  } catch (error) {
    console.error("Toggle follow error:", error);
    return NextResponse.json({ error: "Failed to toggle follow status." }, { status: 500 });
  }
});
