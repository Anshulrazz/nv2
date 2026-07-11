import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { Chat } from "@/models/Chat";

export const dynamic = "force-dynamic";

export const PATCH = auth(async function PATCH(req, context) {
  try {
    const userId = req.auth?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await (context?.params as Promise<{ id: string }>);
    const body = await req.json();
    const { title } = body;

    await connectToDatabase();

    const chat = await Chat.findOne({ _id: id, userId });
    if (!chat) {
      return NextResponse.json({ error: "Chat session not found." }, { status: 404 });
    }

    if (title !== undefined) {
      chat.title = title.trim();
    }

    await chat.save();
    return NextResponse.json(chat);
  } catch (error) {
    console.error("Update chat error:", error);
    return NextResponse.json({ error: "Failed to update chat." }, { status: 500 });
  }
});

export const DELETE = auth(async function DELETE(req, context) {
  try {
    const userId = req.auth?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await (context?.params as Promise<{ id: string }>);

    await connectToDatabase();

    const isAdmin = req.auth?.user?.role === "admin";
    const query = isAdmin ? { _id: id } : { _id: id, userId };
    const result = await Chat.deleteOne(query);
    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Chat session not found." }, { status: 404 });
    }

    return NextResponse.json({ message: "Chat session deleted successfully." });
  } catch (error) {
    console.error("Delete chat error:", error);
    return NextResponse.json({ error: "Failed to delete chat." }, { status: 500 });
  }
});
