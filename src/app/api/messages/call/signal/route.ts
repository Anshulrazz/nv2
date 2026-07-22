import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/models/User";
import { DirectMessage } from "@/models/DirectMessage";
import { pusherServer } from "@/lib/pusher";
import { isValidObjectId } from "@/lib/validation";
import mongoose from "mongoose";

export const dynamic = "force-dynamic";

export const POST = auth(async function POST(req) {
  try {
    const currentUserId = req.auth?.user?.id;
    if (!currentUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { receiverId, action, callId, callType, signalData, saveLog, logContent, logSenderId, logReceiverId } = body;

    if (!receiverId || !action || !callId) {
      return NextResponse.json(
        { error: "receiverId, action, and callId are required." },
        { status: 400 }
      );
    }

    if (!isValidObjectId(receiverId)) {
      return NextResponse.json({ error: "Invalid receiver user ID format." }, { status: 400 });
    }

    if (currentUserId === receiverId) {
      return NextResponse.json({ error: "You cannot call yourself." }, { status: 400 });
    }

    await connectToDatabase();

    // Verify receiver exists
    const receiverExists = await User.findById(receiverId);
    if (!receiverExists) {
      return NextResponse.json({ error: "Recipient user not found." }, { status: 404 });
    }

    // Fetch sender info
    const sender = await User.findById(currentUserId);
    if (!sender) {
      return NextResponse.json({ error: "Sender profile not found." }, { status: 404 });
    }

    const payload = {
      callerId: currentUserId,
      callerName: sender.name || "Someone",
      callerImage: sender.image || "",
      callId,
      callType: callType || "voice",
      signalData,
    };

    // Trigger Pusher event on receiver's channel
    // Action matches: incoming-call, call-accepted, call-rejected, call-ended, webrtc-signal
    await pusherServer.trigger(`user-${receiverId}`, action, payload);

    // Save call history message to database if requested
    if (saveLog && logContent && logSenderId && logReceiverId) {
      if (isValidObjectId(logSenderId) && isValidObjectId(logReceiverId)) {
        const logMsg = await DirectMessage.create({
          senderId: new mongoose.Types.ObjectId(logSenderId),
          receiverId: new mongoose.Types.ObjectId(logReceiverId),
          content: logContent,
          attachments: [],
          isRead: false,
        });

        // Lookup log sender info to enrich the Pusher message
        const logSenderUser = await User.findById(logSenderId);
        const enrichedMessage = {
          ...logMsg.toObject(),
          senderName: logSenderUser?.name || "Someone",
          senderImage: logSenderUser?.image || "",
        };

        // Notify both sides so chat histories refresh instantly
        await pusherServer.trigger(`user-${logReceiverId}`, "new-message", enrichedMessage);
        await pusherServer.trigger(`user-${logSenderId}`, "new-message", enrichedMessage);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Call signaling error:", error);
    return NextResponse.json({ error: "Failed to route calling signal." }, { status: 500 });
  }
});
