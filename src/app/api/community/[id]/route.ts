import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { CommunityPost } from "@/models/CommunityPost";

export const dynamic = "force-dynamic";

export const PUT = auth(async function PUT(req, { params }) {
  try {
    const userId = req.auth?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { content, mediaUrl, mediaType } = body;

    if (!content || content.trim() === "") {
      return NextResponse.json({ error: "Content is required." }, { status: 400 });
    }

    await connectToDatabase();

    const post = await CommunityPost.findById(id);
    if (!post) {
      return NextResponse.json({ error: "Post not found." }, { status: 404 });
    }

    if (post.userId.toString() !== userId) {
      return NextResponse.json({ error: "Forbidden: You can only edit your own posts." }, { status: 403 });
    }

    post.content = content.trim();
    if (mediaUrl !== undefined) post.mediaUrl = mediaUrl;
    if (mediaType !== undefined) post.mediaType = mediaType;
    await post.save();

    return NextResponse.json(post);
  } catch (error) {
    console.error("Update community post error:", error);
    return NextResponse.json({ error: "Failed to update community post." }, { status: 500 });
  }
});

export const DELETE = auth(async function DELETE(req, { params }) {
  try {
    const userId = req.auth?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    await connectToDatabase();

    const post = await CommunityPost.findById(id);
    if (!post) {
      return NextResponse.json({ error: "Post not found." }, { status: 404 });
    }

    const isAdmin = req.auth?.user?.role === "admin";
    if (post.userId.toString() !== userId && !isAdmin) {
      return NextResponse.json({ error: "Forbidden: You can only delete your own posts." }, { status: 403 });
    }

    await CommunityPost.findByIdAndDelete(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete community post error:", error);
    return NextResponse.json({ error: "Failed to delete community post." }, { status: 500 });
  }
});
