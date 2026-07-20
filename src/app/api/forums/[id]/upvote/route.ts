import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { Forum } from "@/models/Forum";
import { User } from "@/models/User";
import mongoose from "mongoose";
import { isValidObjectId } from "@/lib/validation";

export const POST = auth(async function POST(req, context) {
  try {
    const userId = req.auth?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await (context?.params as Promise<{ id: string }>);
    if (!isValidObjectId(id)) {
      return NextResponse.json({ error: "Invalid forum post ID format." }, { status: 400 });
    }

    await connectToDatabase();

    const post = await Forum.findById(id);
    if (!post) {
      return NextResponse.json({ error: "Forum post not found." }, { status: 404 });
    }

    const userObjId = new mongoose.Types.ObjectId(userId);
    const hasUpvoted = post.upvotes.some((uid: mongoose.Types.ObjectId) => uid.toString() === userId);

    if (hasUpvoted) {
      // Remove upvote and deduct author reward points
      post.upvotes = post.upvotes.filter((uid: mongoose.Types.ObjectId) => uid.toString() !== userId);
      await User.updateOne({ _id: post.userId }, { $inc: { points: -5 } });
    } else {
      // Add upvote and award author reward points
      post.upvotes.push(userObjId);
      await User.updateOne({ _id: post.userId }, { $inc: { points: 5 } });
    }

    await post.save();
    return NextResponse.json(post);
  } catch (error) {
    console.error("Upvote error:", error);
    return NextResponse.json({ error: "Failed to process upvote." }, { status: 500 });
  }
});
