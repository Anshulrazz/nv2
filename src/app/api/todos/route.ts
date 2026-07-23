import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { Todo } from "@/models/Todo";

export const GET = auth(async function GET(req) {
  try {
    const userId = req.auth?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();
    const todos = await Todo.find({ userId }).sort({ isCompleted: 1, createdAt: -1 });

    return NextResponse.json(todos);
  } catch (error) {
    console.error("Get todos error:", error);
    return NextResponse.json({ error: "Failed to get todos." }, { status: 500 });
  }
});

export const POST = auth(async function POST(req) {
  try {
    const userId = req.auth?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { title, reminderAt } = body;

    if (!title || typeof title !== "string" || title.trim() === "") {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    await connectToDatabase();

    const todo = await Todo.create({
      title: title.trim(),
      userId,
      reminderAt: reminderAt ? new Date(reminderAt) : null,
      reminderSent: false,
    });

    return NextResponse.json(todo, { status: 201 });
  } catch (error) {
    console.error("Create todo error:", error);
    return NextResponse.json({ error: "Failed to create todo." }, { status: 500 });
  }
});
