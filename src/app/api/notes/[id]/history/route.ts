import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { Note, INoteVersion } from "@/models/Note";

export const GET = auth(async function GET(req, context) {
  try {
    const userId = req.auth?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await (context?.params as Promise<{ id: string }>);

    await connectToDatabase();

    const note = await Note.findOne({ _id: id, userId }).select("versionHistory");
    if (!note) {
      return NextResponse.json({ error: "Note not found." }, { status: 404 });
    }

    return NextResponse.json(note.versionHistory || []);
  } catch (error) {
    console.error("Fetch history error:", error);
    return NextResponse.json({ error: "Failed to load version history." }, { status: 500 });
  }
});

export const POST = auth(async function POST(req, context) {
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

    // Capture snapshot
    note.versionHistory.push({
      title: note.title,
      content: note.content,
      updatedAt: new Date(),
    });

    await note.save();
    return NextResponse.json({ message: "Version snapshot created successfully.", history: note.versionHistory });
  } catch (error) {
    console.error("Save history snapshot error:", error);
    return NextResponse.json({ error: "Failed to create version snapshot." }, { status: 500 });
  }
});

export const PATCH = auth(async function PATCH(req, context) {
  try {
    const userId = req.auth?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await (context?.params as Promise<{ id: string }>);
    const { versionId } = await req.json();

    if (!versionId) {
      return NextResponse.json({ error: "Version ID is required for rollback." }, { status: 400 });
    }

    await connectToDatabase();

    const note = await Note.findOne({ _id: id, userId });
    if (!note) {
      return NextResponse.json({ error: "Note not found." }, { status: 404 });
    }

    // Find target version subdocument by _id
    const targetVersion = note.versionHistory.find(
      (v: INoteVersion) => v._id?.toString() === versionId
    );
    if (!targetVersion) {
      return NextResponse.json({ error: "Specified version snapshot not found." }, { status: 404 });
    }

    // Save current state into versionHistory before rolling back
    note.versionHistory.push({
      title: note.title,
      content: note.content,
      updatedAt: new Date(),
    });

    // Revert properties
    note.title = targetVersion.title;
    note.content = targetVersion.content;

    await note.save();
    return NextResponse.json(note);
  } catch (error) {
    console.error("Rollback version error:", error);
    return NextResponse.json({ error: "Failed to perform version rollback." }, { status: 500 });
  }
});
