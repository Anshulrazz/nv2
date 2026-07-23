import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { Todo } from "@/models/Todo";
import { isValidObjectId } from "@/lib/validation";

export const PATCH = auth(async function PATCH(req, context) {
  try {
    const userId = req.auth?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await (context?.params as Promise<{ id: string }>);
    if (!isValidObjectId(id)) {
      return NextResponse.json({ error: "Invalid todo ID format." }, { status: 400 });
    }

    const body = await req.json();
    const { isCompleted, reminderSent } = body;

    await connectToDatabase();

    const todo = await Todo.findOne({ _id: id, userId });
    if (!todo) {
      return NextResponse.json({ error: "Todo not found." }, { status: 404 });
    }

    if (isCompleted !== undefined) todo.isCompleted = isCompleted;
    if (reminderSent !== undefined) todo.reminderSent = reminderSent;

    await todo.save();
    return NextResponse.json(todo);
  } catch (error) {
    console.error("Update todo error:", error);
    return NextResponse.json({ error: "Failed to update todo." }, { status: 500 });
  }
});

export const DELETE = auth(async function DELETE(req, context) {
  try {
    const userId = req.auth?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await (context?.params as Promise<{ id: string }>);
    if (!isValidObjectId(id)) {
      return NextResponse.json({ error: "Invalid todo ID format." }, { status: 400 });
    }

    await connectToDatabase();

    const result = await Todo.deleteOne({ _id: id, userId });
    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Todo not found." }, { status: 404 });
    }

    return NextResponse.json({ message: "Todo deleted successfully." });
  } catch (error) {
    console.error("Delete todo error:", error);
    return NextResponse.json({ error: "Failed to delete todo." }, { status: 500 });
  }
});
