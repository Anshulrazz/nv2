import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { CommunityPost } from "@/models/CommunityPost";
import { User } from "@/models/User";

export const POST = auth(async function POST(req, context) {
  try {
    const userId = req.auth?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await (context?.params as Promise<{ id: string }>);
    const body = await req.json();
    const { content } = body;

    if (!content || content.trim() === "") {
      return NextResponse.json({ error: "Comment content is required." }, { status: 400 });
    }

    await connectToDatabase();

    const dbUser = await User.findById(userId);
    const userName = dbUser?.name || "Anonymous";
    const userImage = dbUser?.image || "";

    const post = await CommunityPost.findById(id);
    if (!post) {
      return NextResponse.json({ error: "Post not found." }, { status: 404 });
    }

    post.comments.push({
      userId,
      userName,
      userImage,
      content: content.trim(),
      createdAt: new Date(),
    });

    await post.save();
    return NextResponse.json(post);
  } catch (error) {
    console.error("Add community comment error:", error);
    return NextResponse.json({ error: "Failed to add comment." }, { status: 500 });
  }
});
