/* eslint-disable */
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { Forum } from "@/models/Forum";
import { User } from "@/models/User";

export const dynamic = "force-dynamic";

export const GET = auth(async function GET(req) {
  try {
    const userId = req.auth?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url || "", "http://localhost");
    const category = searchParams.get("category") || undefined;

    await connectToDatabase();
    const query: { category?: string } = {};
    if (category && category !== "All") {
      query.category = category;
    }

    const posts = await Forum.find(query).sort({ createdAt: -1 });
    return NextResponse.json(posts);
  } catch (error) {
    console.error("Fetch forums error:", error);
    return NextResponse.json({ error: "Failed to fetch forum posts." }, { status: 500 });
  }
});

// POST: create a new forum post and award points
export const POST = auth(async function POST(req) {
  try {
    const userId = req.auth?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { title, content, category, mediaUrl, mediaType } = body;

    if (
      typeof title !== "string" ||
      typeof content !== "string" ||
      typeof category !== "string" ||
      title.trim() === "" ||
      content.trim() === "" ||
      category.trim() === ""
    ) {
      return NextResponse.json({ error: "Title, content, and category are required and must be strings." }, { status: 400 });
    }

    if (mediaUrl !== undefined && mediaUrl !== null && typeof mediaUrl !== "string") {
      return NextResponse.json({ error: "mediaUrl must be a string." }, { status: 400 });
    }

    if (mediaType !== undefined && mediaType !== null && typeof mediaType !== "string") {
      return NextResponse.json({ error: "mediaType must be a string." }, { status: 400 });
    }

    await connectToDatabase();

    // Cache author name for quick access
    const dbUser = await User.findById(userId);
    const userName = dbUser?.name || "Anonymous";

      // Ensure stray 'name' index does not cause duplicate key errors
      try {
        const indexes = await Forum.collection.indexes();
        const nameIdx = indexes.find(idx => idx.key && idx.key.name);
        if (nameIdx && nameIdx.name) {
          await Forum.collection.dropIndex(nameIdx.name);
        }
      } catch (_) {
        // If dropping fails (e.g., index not found), ignore silently
      }

    let post;
    try {
      post = await Forum.create({
        title: title.trim(),
        content: content.trim(),
        category: category.trim(),
        userId,
        userName,
        upvotes: [],
        comments: [],
        mediaUrl: mediaUrl || undefined,
        mediaType: mediaType || undefined,
      });
    } catch (e) {
      const err = e as { code?: number };
      if (err.code === 11000) {
        // Duplicate key error, likely due to stray index or unique constraint
        return NextResponse.json({ error: "Duplicate forum post detected." }, { status: 409 });
      }
      console.error("Forum creation error:", e);
      return NextResponse.json({ error: "Failed to create forum post." }, { status: 500 });
    }


    // Award activity points for creating a forum post
    await User.updateOne({ _id: userId }, { $inc: { points: 15 } });

    return NextResponse.json(post, { status: 201 });
  } catch (error) {
    console.error("Create forum error:", error);
    return NextResponse.json({ error: "Failed to create forum post." }, { status: 500 });
  }
});
