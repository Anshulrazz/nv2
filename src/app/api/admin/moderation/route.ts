import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { Note } from "@/models/Note";
import { Comment } from "@/models/Comment";
import { AuditLog } from "@/models/AuditLog";
import mongoose from "mongoose";

export const GET = auth(async function GET(req) {
  try {
    const session = req.auth;
    if (session?.user?.role !== "admin") {
      return NextResponse.json({ error: "Access denied. Admin required." }, { status: 403 });
    }

    await connectToDatabase();

    const [flaggedNotes, flaggedComments] = await Promise.all([
      Note.find({ isFlagged: true }).select("title userId createdAt"),
      Comment.find({ isFlagged: true }).select("content userId userName createdAt"),
    ]);

    return NextResponse.json({
      notes: flaggedNotes,
      comments: flaggedComments,
    });
  } catch (error) {
    console.error("Admin fetch flagged items error:", error);
    return NextResponse.json({ error: "Failed to fetch moderation queue." }, { status: 500 });
  }
});

export const PATCH = auth(async function PATCH(req) {
  try {
    const session = req.auth;
    if (session?.user?.role !== "admin") {
      return NextResponse.json({ error: "Access denied. Admin required." }, { status: 403 });
    }

    const { targetId, targetType, action } = await req.json(); // targetType: "note" | "comment", action: "approve" | "delete"

    if (!targetId || !targetType || !action) {
      return NextResponse.json({ error: "targetId, targetType, and action are required." }, { status: 400 });
    }

    await connectToDatabase();

    let details = "";

    if (targetType === "note") {
      const note = await Note.findById(targetId);
      if (!note) return NextResponse.json({ error: "Note not found." }, { status: 404 });

      if (action === "approve") {
        note.isFlagged = false;
        await note.save();
        details = `Approved flagged note post: ${note.title}`;
      } else if (action === "delete") {
        await Note.deleteOne({ _id: targetId });
        details = `Permanently deleted flagged note post: ${note.title}`;
      }
    } else if (targetType === "comment") {
      const comment = await Comment.findById(targetId);
      if (!comment) return NextResponse.json({ error: "Comment not found." }, { status: 404 });

      if (action === "approve") {
        comment.isFlagged = false;
        await comment.save();
        details = `Approved flagged comment: ${comment.content}`;
      } else if (action === "delete") {
        await Comment.deleteOne({ _id: targetId });
        details = `Permanently deleted flagged comment: ${comment.content}`;
      }
    }

    // Log admin moderation action
    await AuditLog.create({
      adminId: new mongoose.Types.ObjectId(session.user.id),
      adminName: session.user.name || "Admin",
      action: `moderation_${action}`,
      targetId: new mongoose.Types.ObjectId(targetId),
      details,
    });

    return NextResponse.json({ message: "Moderation action completed successfully." });
  } catch (error) {
    console.error("Moderation action error:", error);
    return NextResponse.json({ error: "Failed to perform moderation action." }, { status: 500 });
  }
});
