import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { Bookmark } from "@/models/Bookmark";

export const dynamic = "force-dynamic";

export const GET = auth(async function GET(req) {
  try {
    const userId = req.auth?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();
    const bookmarks = await Bookmark.find({ userId }).sort({ createdAt: -1 });
    return NextResponse.json(bookmarks);
  } catch (error) {
    console.error("Fetch bookmarks error:", error);
    return NextResponse.json({ error: "Failed to fetch bookmarks." }, { status: 500 });
  }
});

export const POST = auth(async function POST(req) {
  try {
    const userId = req.auth?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { title, url, category } = body;

    if (!title || !url || title.trim() === "" || url.trim() === "") {
      return NextResponse.json({ error: "Title and URL are required." }, { status: 400 });
    }

    await connectToDatabase();

    // Check for duplicate bookmark for this user
    const existing = await Bookmark.findOne({ userId, url: url.trim() });
    if (existing) {
      return NextResponse.json({ error: "Bookmark already exists for this URL." }, { status: 409 });
    }

    // Ensure no stray unique index on url causing duplicate errors
    try {
      const indexes = await Bookmark.collection.indexes();
      const urlIdx = indexes.find(idx => idx.key && idx.key.url);
      if (urlIdx && urlIdx.name) {
        await Bookmark.collection.dropIndex(urlIdx.name);
      }
    } catch (_) {
      // ignore
    }

    let bookmark;
    try {
      bookmark = await Bookmark.create({
        title: title.trim(),
        url: url.trim(),
        category: category?.trim() || "General",
        userId,
      });
    } catch (e) {
      const err = e as { code?: number };
      if (err.code === 11000) {
        return NextResponse.json({ error: "Duplicate bookmark detected." }, { status: 409 });
      }
      console.error("Create bookmark error:", e);
      return NextResponse.json({ error: "Failed to create bookmark." }, { status: 500 });
    }

    return NextResponse.json(bookmark, { status: 201 });
  } catch (error) {
    console.error("Create bookmark error:", error);
    return NextResponse.json({ error: "Failed to create bookmark." }, { status: 500 });
  }
});
