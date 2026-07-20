import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { Repost } from "@/models/Repost";
import { Note } from "@/models/Note";
import { Notification } from "@/models/Notification";
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
      return NextResponse.json({ error: "Invalid original post ID format." }, { status: 400 });
    }

    const { commentary } = await req.json();
    if (commentary !== undefined && commentary !== null && typeof commentary !== "string") {
      return NextResponse.json({ error: "commentary must be a string." }, { status: 400 });
    }

    await connectToDatabase();

    const note = await Note.findById(id);
    if (!note) {
      return NextResponse.json({ error: "Original note post not found." }, { status: 404 });
    }

    const user = await User.findById(userId).select("name image");

    const newRepost = await Repost.create({
      originalNoteId: new mongoose.Types.ObjectId(id),
      userId: new mongoose.Types.ObjectId(userId),
      userName: user?.name || "Anonymous",
      userImage: user?.image,
      commentary: (commentary || "").trim(),
    });

    // Notify original author
    if (note.userId.toString() !== userId) {
      await Notification.create({
        recipientId: note.userId,
        senderId: new mongoose.Types.ObjectId(userId),
        senderName: user?.name || "A User",
        senderImage: user?.image,
        type: "mention",
        targetId: newRepost._id,
      });
    }

    // Award +10 activity points for sharing
    await User.updateOne({ _id: userId }, { $inc: { points: 10 } });

    return NextResponse.json(newRepost);
  } catch (error) {
    console.error("Create reshare error:", error);
    return NextResponse.json({ error: "Failed to reshare post." }, { status: 500 });
  }
});
