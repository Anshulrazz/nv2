import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { Note } from "@/models/Note";
import { Comment } from "@/models/Comment";

export const POST = auth(async function POST(req, context) {
  try {
    const userId = req.auth?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await (context?.params as Promise<{ id: string }>);
    const { commentId } = await req.json();

    await connectToDatabase();

    if (commentId) {
      const comment = await Comment.findById(commentId);
      if (!comment) return NextResponse.json({ error: "Comment not found." }, { status: 404 });
      comment.isFlagged = true;
      await comment.save();
    } else {
      const note = await Note.findById(id);
      if (!note) return NextResponse.json({ error: "Note not found." }, { status: 404 });
      note.isFlagged = true;
      await note.save();
    }

    return NextResponse.json({ message: "Content reported to moderators." });
  } catch (error) {
    console.error("Report content error:", error);
    return NextResponse.json({ error: "Failed to report content." }, { status: 500 });
  }
});
