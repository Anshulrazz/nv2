import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { Note } from "@/models/Note";

export const GET = auth(async function GET(req) {
  try {
    const userId = req.auth?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url || "");
    const folderId = searchParams.get("folderId");
    const isFavorite = searchParams.get("isFavorite");
    const isTrashed = searchParams.get("isTrashed");

    await connectToDatabase();

    const query: { userId: string; folderId?: string | null; isFavorite?: boolean; isTrashed?: boolean } = { userId };

    if (folderId) {
      query.folderId = folderId === "null" ? null : folderId;
    }
    if (isFavorite !== null) {
      query.isFavorite = isFavorite === "true";
    }
    if (isTrashed !== null) {
      query.isTrashed = isTrashed === "true";
    } else {
      // By default, do not return trashed notes unless requested
      query.isTrashed = false;
    }

    const notes = await Note.find(query).sort({ updatedAt: -1 });
    return NextResponse.json(notes);
  } catch (error) {
    console.error("Fetch notes error:", error);
    return NextResponse.json({ error: "Failed to fetch notes." }, { status: 500 });
  }
});

export const POST = auth(async function POST(req) {
  try {
    const userId = req.auth?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { title, folderId } = body;

    if (!title || title.trim() === "") {
      return NextResponse.json({ error: "Note title is required." }, { status: 400 });
    }

    await connectToDatabase();

    // Default structure for TipTap rich editor documents
    const defaultContent = {
      type: "doc",
      content: [
        {
          type: "heading",
          attrs: { level: 2 },
          content: [{ type: "text", text: title.trim() }],
        },
        {
          type: "paragraph",
          content: [{ type: "text", text: "Start writing here..." }],
        },
      ],
    };

    const note = await Note.create({
      title: title.trim(),
      content: defaultContent,
      folderId: folderId || null,
      userId,
      isFavorite: false,
      isTrashed: false,
    });

    return NextResponse.json(note, { status: 201 });
  } catch (error) {
    console.error("Create note error:", error);
    return NextResponse.json({ error: "Failed to create note." }, { status: 500 });
  }
});
