import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { Forum } from "@/models/Forum";

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
    const result = await Forum.deleteOne(query);
    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Forum post not found or unauthorized." }, { status: 404 });
    }

    return NextResponse.json({ message: "Forum post deleted successfully." });
  } catch (error) {
    console.error("Delete forum post error:", error);
    return NextResponse.json({ error: "Failed to delete forum post." }, { status: 500 });
  }
});
