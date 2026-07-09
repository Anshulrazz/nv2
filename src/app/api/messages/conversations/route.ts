import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { DirectMessage } from "@/models/DirectMessage";
import { User } from "@/models/User";
import mongoose from "mongoose";

export const GET = auth(async function GET(req) {
  try {
    const currentUserId = req.auth?.user?.id;
    if (!currentUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    const currentUserObjId = new mongoose.Types.ObjectId(currentUserId);

    // Aggregate to group messages by conversation and find the last message
    const conversationsAgg = await DirectMessage.aggregate([
      {
        $match: {
          $or: [
            { senderId: currentUserObjId },
            { receiverId: currentUserObjId },
          ],
        },
      },
      {
        $sort: { createdAt: -1 },
      },
      {
        $group: {
          _id: {
            $cond: [
              { $eq: ["$senderId", currentUserObjId] },
              "$receiverId",
              "$senderId",
            ],
          },
          lastMessage: { $first: "$$ROOT" },
        },
      },
      {
        $sort: { "lastMessage.createdAt": -1 },
      },
    ]);

    const results = [];

    for (const entry of conversationsAgg) {
      const otherUserId = entry._id;
      const otherUser = await User.findById(otherUserId).select("name email image");
      if (!otherUser) continue;

      const unreadCount = await DirectMessage.countDocuments({
        senderId: otherUserId,
        receiverId: currentUserObjId,
        isRead: false,
      });

      results.push({
        otherUser: {
          _id: otherUser._id.toString(),
          name: otherUser.name || "Scholar Scholar",
          image: otherUser.image,
          email: otherUser.email,
        },
        lastMessage: entry.lastMessage,
        unreadCount,
      });
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error("Fetch conversations error:", error);
    return NextResponse.json({ error: "Failed to fetch conversations." }, { status: 500 });
  }
});
