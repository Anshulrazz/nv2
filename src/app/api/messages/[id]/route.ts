import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { DirectMessage } from "@/models/DirectMessage";
import { pusherServer } from "@/lib/pusher";
import { isValidObjectId } from "@/lib/validation";

export const dynamic = "force-dynamic";

export const PATCH = auth(async function PATCH(req, context) {
  try {
    const currentUserId = req.auth?.user?.id;
    if (!currentUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await (context?.params as Promise<{ id: string }>);
    if (!isValidObjectId(id)) {
      return NextResponse.json({ error: "Invalid message ID format." }, { status: 400 });
    }

    const body = await req.json();
    const { content } = body;

    if (typeof content !== "string" || content.trim() === "") {
      return NextResponse.json({ error: "Message content cannot be empty." }, { status: 400 });
    }

    await connectToDatabase();

    const message = await DirectMessage.findOne({ _id: id, senderId: currentUserId });
    if (!message) {
      return NextResponse.json(
        { error: "Message not found or you do not have permission to edit it." },
        { status: 404 }
      );
    }

    if (message.isDeleted) {
      return NextResponse.json({ error: "Cannot edit a deleted message." }, { status: 400 });
    }

    message.content = content.trim();
    message.isEdited = true;
    await message.save();

    // Build standard JSON payload matching client interface
    const payload = {
      _id: message._id.toString(),
      senderId: message.senderId.toString(),
      receiverId: message.receiverId.toString(),
      content: message.content,
      attachments: message.attachments || [],
      isRead: message.isRead,
      isDeleted: message.isDeleted || false,
      isEdited: message.isEdited || false,
      repliedTo: message.repliedTo || undefined,
      createdAt: message.createdAt.toISOString(),
      updatedAt: message.updatedAt.toISOString(),
    };

    await pusherServer.trigger(`user-${message.receiverId}`, "message-updated", payload);
    await pusherServer.trigger(`user-${message.senderId}`, "message-updated", payload);

    return NextResponse.json(message);
  } catch (error) {
    console.error("Edit message error:", error);
    return NextResponse.json({ error: "Failed to edit message." }, { status: 500 });
  }
});

export const DELETE = auth(async function DELETE(req, context) {
  try {
    const currentUserId = req.auth?.user?.id;
    if (!currentUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await (context?.params as Promise<{ id: string }>);
    if (!isValidObjectId(id)) {
      return NextResponse.json({ error: "Invalid message ID format." }, { status: 400 });
    }

    await connectToDatabase();

    const message = await DirectMessage.findOne({ _id: id, senderId: currentUserId });
    if (!message) {
      return NextResponse.json(
        { error: "Message not found or you do not have permission to delete it." },
        { status: 404 }
      );
    }

    message.isDeleted = true;
    message.content = "This message was deleted";
    message.attachments = [];
    await message.save();

    // Build standard JSON payload matching client interface
    const payload = {
      _id: message._id.toString(),
      senderId: message.senderId.toString(),
      receiverId: message.receiverId.toString(),
      content: message.content,
      attachments: [],
      isRead: message.isRead,
      isDeleted: true,
      isEdited: message.isEdited || false,
      repliedTo: message.repliedTo || undefined,
      createdAt: message.createdAt.toISOString(),
      updatedAt: message.updatedAt.toISOString(),
    };

    await pusherServer.trigger(`user-${message.receiverId}`, "message-updated", payload);
    await pusherServer.trigger(`user-${message.senderId}`, "message-updated", payload);

    return NextResponse.json(message);
  } catch (error) {
    console.error("Delete message error:", error);
    return NextResponse.json({ error: "Failed to delete message." }, { status: 500 });
  }
});
