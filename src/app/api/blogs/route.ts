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

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export const POST = auth(async function POST(req) {
  try {
    const userId = req.auth?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { title, content, summary, coverImage, published } = body;

    const safeTitle = (title || "Untitled Blog").toString().trim();
    const safeContent = (content || "Start writing markdown content here...").toString();
    const safeSummary = (summary || "A brief summary of your blog post.").toString();

    await connectToDatabase();

    const dbUser = await User.findById(userId);
    const userName = dbUser?.name || "Anonymous";

    const baseSlug = slugify(safeTitle) || "untitled-blog";
    let uniqueSlug = baseSlug;
    let counter = 1;
    while (await Blog.findOne({ slug: uniqueSlug })) {
      uniqueSlug = `${baseSlug}-${counter}`;
      counter++;
    }

    const blog = await Blog.create({
      title: safeTitle,
      slug: uniqueSlug,
      content: safeContent,
      summary: safeSummary,
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
