import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { Note } from "@/models/Note";

export const GET = auth(async function GET(req, context) {
  try {
    const userId = req.auth?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await (context?.params as Promise<{ id: string }>);

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
    const body = await req.json();
    const { title, content, folderId, isFavorite, isTrashed, assetUrl, assetName } = body;

    await connectToDatabase();

    const note = await Note.findOne({ _id: id, userId });
    if (!note) {
      return NextResponse.json({ error: "Note not found." }, { status: 404 });
    }

    if (title !== undefined) note.title = title.trim();
    if (content !== undefined) note.content = content;
    if (folderId !== undefined) note.folderId = folderId || null;
    if (isFavorite !== undefined) note.isFavorite = isFavorite;
    if (isTrashed !== undefined) note.isTrashed = isTrashed;
    if (assetUrl !== undefined) note.assetUrl = assetUrl;
    if (assetName !== undefined) note.assetName = assetName;

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

    await connectToDatabase();

    const result = await Note.deleteOne({ _id: id, userId });
    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Note not found." }, { status: 404 });
    }

    return NextResponse.json({ message: "Note deleted successfully." });
  } catch (error) {
    console.error("Delete note error:", error);
    return NextResponse.json({ error: "Failed to delete note." }, { status: 500 });
  }
});
