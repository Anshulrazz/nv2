import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { Chat } from "@/models/Chat";

export const GET = auth(async function GET(req) {
  try {
    const userId = req.auth?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();
    const chats = await Chat.find({ userId }).sort({ updatedAt: -1 });
    return NextResponse.json(chats);
  } catch (error) {
    console.error("Fetch chats error:", error);
    return NextResponse.json({ error: "Failed to fetch chats." }, { status: 500 });
  }
});

export const POST = auth(async function POST(req) {
  try {
    const userId = req.auth?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { title } = body;

    if (title !== undefined && title !== null && typeof title !== "string") {
      return NextResponse.json({ error: "Title must be a string." }, { status: 400 });
    }

    await connectToDatabase();
    const chat = await Chat.create({
      title: title?.trim() || "New chat",
      userId,
      messages: [],
    });

    return NextResponse.json(chat, { status: 201 });
  } catch (error) {
    console.error("Create chat error:", error);
    return NextResponse.json({ error: "Failed to create chat." }, { status: 500 });
  }
});
