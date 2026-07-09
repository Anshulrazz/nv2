import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { DirectMessage } from "@/models/DirectMessage";
import { User } from "@/models/User";
import { Notification } from "@/models/Notification";
import mongoose from "mongoose";

export const GET = auth(async function GET(req) {
  try {
    const currentUserId = req.auth?.user?.id;
    if (!currentUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const targetUserId = searchParams.get("userId");

    if (!targetUserId) {
      return NextResponse.json({ error: "userId is required." }, { status: 400 });
    }

    await connectToDatabase();

    // Fetch messages between current user and target user
    const messages = await DirectMessage.find({
      $or: [
        { senderId: currentUserId, receiverId: targetUserId },
        { senderId: targetUserId, receiverId: currentUserId },
      ],
    }).sort({ createdAt: 1 });

    // Mark target user's messages as read
    await DirectMessage.updateMany(
      { senderId: targetUserId, receiverId: currentUserId, isRead: false },
      { $set: { isRead: true } }
    );

    // Check if target user is typing to current user
    const globalWithTyping = global as typeof globalThis & {
      typingStatuses?: Record<string, { recipientId: string; timestamp: number }>;
    };
    const isTyping = !!globalWithTyping.typingStatuses?.[targetUserId] &&
      globalWithTyping.typingStatuses[targetUserId].recipientId === currentUserId &&
      (Date.now() - globalWithTyping.typingStatuses[targetUserId].timestamp < 3000);

    return NextResponse.json({
      messages,
      isTyping,
    });
  } catch (error) {
    console.error("Fetch messages error:", error);
    return NextResponse.json({ error: "Failed to fetch messages." }, { status: 500 });
  }
});

export const POST = auth(async function POST(req) {
  try {
    const currentUserId = req.auth?.user?.id;
    if (!currentUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { receiverId, content, mediaUrl, mediaType } = body;

    if (!receiverId) {
      return NextResponse.json({ error: "receiverId is required." }, { status: 400 });
    }

    if (currentUserId === receiverId) {
      return NextResponse.json({ error: "You cannot message yourself." }, { status: 400 });
    }

    await connectToDatabase();

    const newMessage = await DirectMessage.create({
      senderId: new mongoose.Types.ObjectId(currentUserId),
      receiverId: new mongoose.Types.ObjectId(receiverId),
      content: content || "",
      mediaUrl: mediaUrl || "",
      mediaType: mediaType || "",
      isRead: false,
    });

    // Create a new Notification record for this message
    try {
      const senderUser = await User.findById(currentUserId);
      await Notification.create({
        recipientId: new mongoose.Types.ObjectId(receiverId),
        senderId: new mongoose.Types.ObjectId(currentUserId),
        senderName: senderUser?.name || "Someone",
        senderImage: senderUser?.image || "",
        type: "message",
        targetId: newMessage._id,
        isRead: false,
      });
    } catch (notifError) {
      console.error("Failed to create message notification:", notifError);
    }

    return NextResponse.json(newMessage);
  } catch (error) {
    console.error("Send message error:", error);
    return NextResponse.json({ error: "Failed to send message." }, { status: 500 });
  }
});
