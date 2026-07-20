import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { CommunityPost } from "@/models/CommunityPost";
import { User } from "@/models/User";

export const dynamic = "force-dynamic";

export const GET = auth(async function GET(req) {
  try {
    const userId = req.auth?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();
    const posts = await CommunityPost.find({}).sort({ createdAt: -1 });
    return NextResponse.json(posts);
  } catch (error) {
    console.error("Fetch community posts error:", error);
    return NextResponse.json({ error: "Failed to fetch community posts." }, { status: 500 });
  }
});

export const POST = auth(async function POST(req) {
  try {
    const userId = req.auth?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { content, mediaUrl, mediaType } = body;

    if (typeof content !== "string" || content.trim() === "") {
      return NextResponse.json({ error: "Content is required and must be a string." }, { status: 400 });
    }

    if (mediaUrl !== undefined && mediaUrl !== null && typeof mediaUrl !== "string") {
      return NextResponse.json({ error: "mediaUrl must be a string." }, { status: 400 });
    }

    if (mediaType !== undefined && mediaType !== null && typeof mediaType !== "string") {
      return NextResponse.json({ error: "mediaType must be a string." }, { status: 400 });
    }

    await connectToDatabase();

    const dbUser = await User.findById(userId);
    const userName = dbUser?.name || "Anonymous";
    const userImage = dbUser?.image || "";

    const post = await CommunityPost.create({
      userId,
      userName,
      userImage,
      content: content.trim(),
      mediaUrl: mediaUrl || undefined,
      mediaType: mediaType || undefined,
      likes: [],
      comments: [],
    });

    // Award points to user for community posting contribution
    await User.updateOne({ _id: userId }, { $inc: { points: 10 } });

    return NextResponse.json(post, { status: 201 });
  } catch (error) {
    console.error("Create community post error:", error);
    return NextResponse.json({ error: "Failed to create community post." }, { status: 500 });
  }
});
