import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { Blog } from "@/models/Blog";
import { User } from "@/models/User";

export const GET = auth(async function GET(req) {
  try {
    const userId = req.auth?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url || "");
    const userOnly = searchParams.get("userOnly");

    await connectToDatabase();
    const query: { userId?: string; published?: boolean } = {};
    if (userOnly === "true") {
      query.userId = userId;
    } else {
      query.published = true;
    }

    const blogs = await Blog.find(query).sort({ createdAt: -1 });
    return NextResponse.json(blogs);
  } catch (error) {
    console.error("Fetch blogs error:", error);
    return NextResponse.json({ error: "Failed to fetch blogs." }, { status: 500 });
  }
});

export const POST = auth(async function POST(req) {
  try {
    const userId = req.auth?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { title, content, summary, coverImage, published } = body;

    if (!title || !content || !summary || title.trim() === "" || content.trim() === "" || summary.trim() === "") {
      return NextResponse.json({ error: "Title, content, and summary are required." }, { status: 400 });
    }

    await connectToDatabase();

    const dbUser = await User.findById(userId);
    const userName = dbUser?.name || "Anonymous";

    const blog = await Blog.create({
      title: title.trim(),
      content: content.trim(),
      summary: summary.trim(),
      coverImage: coverImage || null,
      published: published || false,
      userId,
      userName,
    });

    // Award significant points for blog posting contributions
    await User.updateOne({ _id: userId }, { $inc: { points: 30 } });

    return NextResponse.json(blog, { status: 201 });
  } catch (error) {
    console.error("Create blog error:", error);
    return NextResponse.json({ error: "Failed to create blog." }, { status: 500 });
  }
});
