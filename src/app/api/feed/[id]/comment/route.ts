import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { Comment } from "@/models/Comment";
import { Notification } from "@/models/Notification";
import { User } from "@/models/User";
import { Note } from "@/models/Note";
import mongoose from "mongoose";

export const GET = auth(async function GET(req, context) {
  try {
    const { id } = await (context?.params as Promise<{ id: string }>);

    await connectToDatabase();

    const comments = await Comment.find({ noteId: id }).sort({ createdAt: 1 });

    return NextResponse.json(comments);
  } catch (error) {
    console.error("Fetch comments error:", error);
    return NextResponse.json({ error: "Failed to fetch comments." }, { status: 500 });
  }
});

export const POST = auth(async function POST(req, context) {
  try {
    const userId = req.auth?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await (context?.params as Promise<{ id: string }>);
    const { content, parentId } = await req.json();

    if (!content?.trim()) {
      return NextResponse.json({ error: "Content is required." }, { status: 400 });
    }

    await connectToDatabase();

    const user = await User.findById(userId).select("name image");
    const newComment = await Comment.create({
      noteId: new mongoose.Types.ObjectId(id),
      userId: new mongoose.Types.ObjectId(userId),
      userName: user?.name || "Anonymous",
      userImage: user?.image,
      content: content.trim(),
      parentId: parentId ? new mongoose.Types.ObjectId(parentId) : null,
    });

    // Notify author of original note
    const note = await Note.findById(id);
    if (note && note.userId.toString() !== userId) {
      await Notification.create({
        recipientId: note.userId,
        senderId: new mongoose.Types.ObjectId(userId),
        senderName: user?.name || "A User",
        senderImage: user?.image,
        type: "comment",
        targetId: newComment._id,
      });
    }

    // Award +5 activity points to the commenter
    await User.updateOne({ _id: userId }, { $inc: { points: 5 } });

    return NextResponse.json(newComment);
  } catch (error) {
    console.error("Create comment error:", error);
    return NextResponse.json({ error: "Failed to post comment." }, { status: 500 });
  }
});

export const PATCH = auth(async function PATCH(req) {
  try {
    const userId = req.auth?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { commentId, action } = await req.json(); // action: "upvote" | "downvote"

    if (!commentId || !action) {
      return NextResponse.json({ error: "commentId and action are required." }, { status: 400 });
    }

    await connectToDatabase();

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return NextResponse.json({ error: "Comment not found." }, { status: 404 });
    }

    const userObjId = new mongoose.Types.ObjectId(userId);

    if (action === "upvote") {
      const hasUpvoted = comment.upvotes.some((uid: mongoose.Types.ObjectId) => uid.toString() === userId);
      if (hasUpvoted) {
        comment.upvotes = comment.upvotes.filter((uid: mongoose.Types.ObjectId) => uid.toString() !== userId);
      } else {
        comment.upvotes.push(userObjId);
        // Remove downvote if present
        comment.downvotes = comment.downvotes.filter((uid: mongoose.Types.ObjectId) => uid.toString() !== userId);
      }
    } else if (action === "downvote") {
      const hasDownvoted = comment.downvotes.some((uid: mongoose.Types.ObjectId) => uid.toString() === userId);
      if (hasDownvoted) {
        comment.downvotes = comment.downvotes.filter((uid: mongoose.Types.ObjectId) => uid.toString() !== userId);
      } else {
        comment.downvotes.push(userObjId);
        // Remove upvote if present
        comment.upvotes = comment.upvotes.filter((uid: mongoose.Types.ObjectId) => uid.toString() !== userId);
      }
    }

    await comment.save();
    return NextResponse.json(comment);
  } catch (error) {
    console.error("Comment vote error:", error);
    return NextResponse.json({ error: "Failed to process vote." }, { status: 500 });
  }
});
