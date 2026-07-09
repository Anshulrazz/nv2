import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { Notification } from "@/models/Notification";

export const GET = auth(async function GET(req) {
  try {
    const userId = req.auth?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    const list = await Notification.find({ recipientId: userId }).sort({ createdAt: -1 });

    return NextResponse.json(list);
  } catch (error) {
    console.error("Notifications list error:", error);
    return NextResponse.json({ error: "Failed to gather notifications." }, { status: 500 });
  }
});

export const PATCH = auth(async function PATCH(req) {
  try {
    const userId = req.auth?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    await Notification.updateMany({ recipientId: userId, isRead: false }, { $set: { isRead: true } });

    return NextResponse.json({ message: "Notifications marked as read." });
  } catch (error) {
    console.error("Mark notifications read error:", error);
    return NextResponse.json({ error: "Failed to update notifications." }, { status: 500 });
  }
});
