import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { DirectMessage } from "@/models/DirectMessage";

export const DELETE = auth(async function DELETE(req) {
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

    // Delete messages between current user and target user
    await DirectMessage.deleteMany({
      $or: [
        { senderId: currentUserId, receiverId: targetUserId },
        { senderId: targetUserId, receiverId: currentUserId },
      ],
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Clear conversation error:", error);
    return NextResponse.json({ error: "Failed to clear conversation." }, { status: 500 });
  }
});
