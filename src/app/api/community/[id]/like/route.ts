import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { CommunityPost } from "@/models/CommunityPost";
import mongoose from "mongoose";

export const POST = auth(async function POST(req, context) {
  try {
    const userId = req.auth?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await (context?.params as Promise<{ id: string }>);

    await connectToDatabase();

    const post = await CommunityPost.findById(id);
    if (!post) {
      return NextResponse.json({ error: "Post not found." }, { status: 404 });
    }

    const userObjectId = new mongoose.Types.ObjectId(userId);
    const likeIndex = post.likes.findIndex((uid: mongoose.Types.ObjectId) => uid.toString() === userId);

    if (likeIndex > -1) {
      // Unlike
      post.likes.splice(likeIndex, 1);
    } else {
      // Like
      post.likes.push(userObjectId);
    }

    await post.save();
    return NextResponse.json(post);
  } catch (error) {
    console.error("Toggle community like error:", error);
    return NextResponse.json({ error: "Failed to toggle like." }, { status: 500 });
  }
});
