import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { DirectMessage } from "@/models/DirectMessage";
import { User } from "@/models/User";
import { Notification } from "@/models/Notification";
import mongoose from "mongoose";
import { pusherServer } from "@/lib/pusher";
import { sendPushToUser } from "@/lib/push";
import { isValidObjectId } from "@/lib/validation";

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

    if (!isValidObjectId(targetUserId)) {
      return NextResponse.json({ error: "Invalid target user ID format." }, { status: 400 });
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
    const updateResult = await DirectMessage.updateMany(
      { senderId: targetUserId, receiverId: currentUserId, isRead: false },
      { $set: { isRead: true } }
    );

    if (updateResult.modifiedCount > 0) {
      // Notify target user that their messages were read
      await pusherServer.trigger(`user-${targetUserId}`, "messages-read", {
        readerId: currentUserId,
      });
    }

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
    const { receiverId, content, attachments } = body;

    if (!receiverId) {
      return NextResponse.json({ error: "receiverId is required." }, { status: 400 });
    }

    if (!isValidObjectId(receiverId)) {
      return NextResponse.json({ error: "Invalid receiver user ID format." }, { status: 400 });
    }

    if (currentUserId === receiverId) {
      return NextResponse.json({ error: "You cannot message yourself." }, { status: 400 });
    }

    if (content !== undefined && typeof content !== "string") {
      return NextResponse.json({ error: "content must be a string." }, { status: 400 });
    }

    if (attachments !== undefined && !Array.isArray(attachments)) {
      return NextResponse.json({ error: "attachments must be an array." }, { status: 400 });
    }

    // Ensure either content or attachments has content
    const hasContent = content && content.trim() !== "";
    const hasAttachments = attachments && attachments.length > 0;
    if (!hasContent && !hasAttachments) {
      return NextResponse.json({ error: "Message content or attachments are required." }, { status: 400 });
    }

    await connectToDatabase();

    // Verify receiver exists
    const receiverExists = await User.findById(receiverId);
    if (!receiverExists) {
      return NextResponse.json({ error: "Recipient user not found." }, { status: 404 });
    }

    const newMessage = await DirectMessage.create({
      senderId: new mongoose.Types.ObjectId(currentUserId),
      receiverId: new mongoose.Types.ObjectId(receiverId),
      content: content || "",
      attachments: attachments || [],
      isRead: false,
    });

    // Look up sender info to enrich the Pusher payload
    const senderUser = await User.findById(currentUserId);
    const senderName = senderUser?.name || "Someone";
    const senderImage = senderUser?.image || "";

    // Build the enriched payload that PusherListener expects
    const enrichedMessage = {
      ...newMessage.toObject(),
      senderName,
      senderImage,
    };

    // Notify receiver in real-time (with sender info for toast)
    await pusherServer.trigger(`user-${receiverId}`, "new-message", enrichedMessage);
    // Notify sender in real-time (to update their UI if open in multiple tabs)
    await pusherServer.trigger(`user-${currentUserId}`, "new-message", enrichedMessage);

    // Create a new Notification record for this message
    try {
      const notification = await Notification.create({
        recipientId: new mongoose.Types.ObjectId(receiverId),
        senderId: new mongoose.Types.ObjectId(currentUserId),
        senderName,
        senderImage,
        type: "message",
        targetId: newMessage._id,
        isRead: false,
      });
      // Notify receiver about new notification in real-time
      await pusherServer.trigger(`user-${receiverId}`, "new-notification", notification);
    } catch (notifError) {
      console.error("Failed to create message notification:", notifError);
    }

    // Fire background web-push for closed-tab delivery
    sendPushToUser(receiverId, {
      title: `New message from ${senderName}`,
      body: content || "You have a new direct message.",
      icon: senderImage || undefined,
      link: `/messages?userId=${currentUserId}`,
    }).catch((err) => console.error("Push send error:", err));

    return NextResponse.json(newMessage);
  } catch (error) {
    console.error("Send message error:", error);
    return NextResponse.json({ error: "Failed to send message." }, { status: 500 });
  }
});
