import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { Note } from "@/models/Note";
import { Folder } from "@/models/Folder";
import { isValidObjectId } from "@/lib/validation";

export const GET = auth(async function GET(req, context) {
  try {
    const userId = req.auth?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await (context?.params as Promise<{ id: string }>);
    if (!isValidObjectId(id)) {
      return NextResponse.json({ error: "Invalid note ID format." }, { status: 400 });
    }

    await connectToDatabase();

    const note = await Note.findOne({ _id: id, userId });
    if (!note) {
      return NextResponse.json({ error: "Note not found." }, { status: 404 });
    }

    return NextResponse.json(note);
  } catch (error) {
    console.error("Get note error:", error);
    return NextResponse.json({ error: "Failed to get note." }, { status: 500 });
  }
});

export const PATCH = auth(async function PATCH(req, context) {
  try {
    const userId = req.auth?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await (context?.params as Promise<{ id: string }>);
    if (!isValidObjectId(id)) {
      return NextResponse.json({ error: "Invalid note ID format." }, { status: 400 });
    }

    const body = await req.json();
    const { title, content, folderId, isFavorite, isTrashed, assetUrl, assetName } = body;

    // Validate request body updates
    if (title !== undefined && (typeof title !== "string" || title.trim() === "")) {
      return NextResponse.json({ error: "Note title cannot be empty and must be a string." }, { status: 400 });
    }
    if (isFavorite !== undefined && typeof isFavorite !== "boolean") {
      return NextResponse.json({ error: "isFavorite must be a boolean." }, { status: 400 });
    }
    if (isTrashed !== undefined && typeof isTrashed !== "boolean") {
      return NextResponse.json({ error: "isTrashed must be a boolean." }, { status: 400 });
    }
    if (assetUrl !== undefined && assetUrl !== null && typeof assetUrl !== "string") {
      return NextResponse.json({ error: "assetUrl must be a string or null." }, { status: 400 });
    }
    if (assetName !== undefined && assetName !== null && typeof assetName !== "string") {
      return NextResponse.json({ error: "assetName must be a string or null." }, { status: 400 });
    }

    await connectToDatabase();

    if (folderId !== undefined && folderId !== null) {
      if (!isValidObjectId(folderId)) {
        return NextResponse.json({ error: "Invalid folder ID format." }, { status: 400 });
      }
      const folder = await Folder.findOne({ _id: folderId, userId });
      if (!folder) {
        return NextResponse.json({ error: "Folder not found or unauthorized." }, { status: 404 });
      }
    }

    const note = await Note.findOne({ _id: id, userId });
    if (!note) {
      return NextResponse.json({ error: "Note not found." }, { status: 404 });
    }

    if (title !== undefined) note.title = title.trim();
    if (content !== undefined) note.content = content;
    if (folderId !== undefined) note.folderId = folderId || null;
    if (isFavorite !== undefined) note.isFavorite = isFavorite;
    if (isTrashed !== undefined) note.isTrashed = isTrashed;
    if (assetUrl !== undefined) note.assetUrl = assetUrl || "";
    if (assetName !== undefined) note.assetName = assetName || "";

    await note.save();
    return NextResponse.json(note);
  } catch (error) {
    console.error("Update note error:", error);
    return NextResponse.json({ error: "Failed to update note." }, { status: 500 });
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
      return NextResponse.json({ error: "Invalid note ID format." }, { status: 400 });
    }

    await connectToDatabase();

    const isAdmin = req.auth?.user?.role === "admin";
    const query = isAdmin ? { _id: id } : { _id: id, userId };
    const result = await Note.deleteOne(query);
    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Note not found." }, { status: 404 });
    }

    return NextResponse.json({ message: "Note deleted successfully." });
  } catch (error) {
    console.error("Delete note error:", error);
    return NextResponse.json({ error: "Failed to delete note." }, { status: 500 });
  }
});
