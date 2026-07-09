import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { Forum } from "@/models/Forum";
import { User } from "@/models/User";
import mongoose from "mongoose";

export const POST = auth(async function POST(req, context) {
  try {
    const userId = req.auth?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await (context?.params as Promise<{ id: string }>);
    const body = await req.json();
    const { content } = body;

    if (!content || content.trim() === "") {
      return NextResponse.json({ error: "Comment content is required." }, { status: 400 });
    }

    await connectToDatabase();

    const post = await Forum.findById(id);
    if (!post) {
      return NextResponse.json({ error: "Forum post not found." }, { status: 404 });
    }

    const dbUser = await User.findById(userId);
    const userName = dbUser?.name || "Anonymous";
    const userImage = dbUser?.image;

    // Append comment subdocument
    const newComment = {
      userId: new mongoose.Types.ObjectId(userId),
      userName,
      userImage,
      content: content.trim(),
      createdAt: new Date(),
    };

    post.comments.push(newComment as unknown as import("@/models/Forum").IForumComment);
    await post.save();

    // Award activity points to commenter
    await User.updateOne({ _id: userId }, { $inc: { points: 5 } });

    return NextResponse.json(post);
  } catch (error) {
    console.error("Add comment error:", error);
    return NextResponse.json({ error: "Failed to post comment." }, { status: 500 });
  }
});
