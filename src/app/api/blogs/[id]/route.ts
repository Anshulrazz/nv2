import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { Blog } from "@/models/Blog";

export const GET = auth(async function GET(req, context) {
  try {
    const userId = req.auth?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await (context?.params as Promise<{ id: string }>);

    await connectToDatabase();

    const blog = await Blog.findById(id);
    if (!blog) {
      return NextResponse.json({ error: "Blog not found." }, { status: 404 });
    }

    // If it's a draft, only the author can see it
    if (!blog.published && blog.userId.toString() !== userId) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 403 });
    }

    return NextResponse.json(blog);
  } catch (error) {
    console.error("Get blog error:", error);
    return NextResponse.json({ error: "Failed to fetch blog." }, { status: 500 });
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
    const { title, content, summary, coverImage, published } = body;

    await connectToDatabase();

    const blog = await Blog.findOne({ _id: id, userId });
    if (!blog) {
      return NextResponse.json({ error: "Blog not found or unauthorized." }, { status: 404 });
    }

    if (title !== undefined) blog.title = title.trim();
    if (content !== undefined) blog.content = content.trim();
    if (summary !== undefined) blog.summary = summary.trim();
    if (coverImage !== undefined) blog.coverImage = coverImage;
    if (published !== undefined) blog.published = published;

    await blog.save();
    return NextResponse.json(blog);
  } catch (error) {
    console.error("Update blog error:", error);
    return NextResponse.json({ error: "Failed to update blog." }, { status: 500 });
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

    const result = await Blog.deleteOne({ _id: id, userId });
    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Blog not found or unauthorized." }, { status: 404 });
    }

    return NextResponse.json({ message: "Blog deleted successfully." });
  } catch (error) {
    console.error("Delete blog error:", error);
    return NextResponse.json({ error: "Failed to delete blog." }, { status: 500 });
  }
});
