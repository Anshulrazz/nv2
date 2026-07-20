import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { Note } from "@/models/Note";
import { User } from "@/models/User";
import { Notification } from "@/models/Notification";
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
      return NextResponse.json({ error: "Invalid note ID format." }, { status: 400 });
    }

    await connectToDatabase();

    const note = await Note.findById(id);
    if (!note) {
      return NextResponse.json({ error: "Note not found." }, { status: 404 });
    }

    const userObjId = new mongoose.Types.ObjectId(userId);
    const hasUpvoted = note.upvotes.some((uid: mongoose.Types.ObjectId) => uid.toString() === userId);

    if (hasUpvoted) {
      // Remove upvote
      note.upvotes = note.upvotes.filter((uid: mongoose.Types.ObjectId) => uid.toString() !== userId);
      // Deduct points from post author
      await User.updateOne({ _id: note.userId }, { $inc: { points: -5 } });
    } else {
      // Add upvote
      note.upvotes.push(userObjId);
      // Award points to post author
      await User.updateOne({ _id: note.userId }, { $inc: { points: 5 } });

      // Notify post author
      if (note.userId.toString() !== userId) {
        const currentUser = await User.findById(userId).select("name image");
        await Notification.create({
          recipientId: note.userId,
          senderId: userObjId,
          senderName: currentUser?.name || "A User",
          senderImage: currentUser?.image,
          type: "like",
          targetId: note._id,
        });
      }
    }

    await note.save();
    return NextResponse.json(note);
  } catch (error) {
    console.error("Note upvote error:", error);
    return NextResponse.json({ error: "Failed to process upvote." }, { status: 500 });
  }
});
