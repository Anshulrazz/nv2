import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { Note } from "@/models/Note";
import { Blog } from "@/models/Blog";
import { Follow } from "@/models/Follow";
import { PipelineStage } from "mongoose";
import { escapeRegex } from "@/lib/validation";

export const GET = auth(async function GET(req) {
  try {
    const userId = req.auth?.user?.id;
    const { searchParams } = new URL(req.url || "");
    const sort = searchParams.get("sort") || "new"; // new | top | trending | following
    const search = searchParams.get("search") || "";
    const tag = searchParams.get("tag") || "";
    const category = searchParams.get("category") || "";

    const parsedPage = parseInt(searchParams.get("page") || "1", 10);
    const parsedLimit = parseInt(searchParams.get("limit") || "10", 10);

    const page = (isNaN(parsedPage) || parsedPage < 1) ? 1 : parsedPage;
    const limit = (isNaN(parsedLimit) || parsedLimit < 1) ? 10 : (parsedLimit > 100 ? 100 : parsedLimit);
    const skip = (page - 1) * limit;

    await connectToDatabase();

    // Match criteria for Notes
    const noteMatchCriteria: Record<string, unknown> = {
      published: true,
      isTrashed: false,
    };

    // Match criteria for Blogs
    const blogMatchCriteria: Record<string, unknown> = {
      published: true,
    };

    if (search && typeof search === "string") {
      const escapedSearch = escapeRegex(search.trim());
      noteMatchCriteria.$or = [
        { title: { $regex: escapedSearch, $options: "i" } },
        { tags: { $regex: escapedSearch, $options: "i" } },
      ];
      blogMatchCriteria.$or = [
        { title: { $regex: escapedSearch, $options: "i" } },
        { summary: { $regex: escapedSearch, $options: "i" } },
      ];
    }

    if (tag) {
      noteMatchCriteria.tags = tag;
    }

    if (category) {
      if (category.toLowerCase() !== "blog") {
        noteMatchCriteria.category = category;
      }
    }

    if (sort === "following") {
      if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      const follows = await Follow.find({ followerId: userId }).select("followingId");
      const followingIds = follows.map((f) => f.followingId);
      noteMatchCriteria.userId = { $in: followingIds };
      blogMatchCriteria.userId = { $in: followingIds };
    }

    // Build aggregation pipeline for Notes
    const notePipeline: PipelineStage[] = [
      { $match: noteMatchCriteria },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "author",
        },
      },
      { $unwind: { path: "$author", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "comments",
          localField: "_id",
          foreignField: "noteId",
          as: "comments",
        },
      },
      {
        $addFields: {
          upvotesCount: { $size: { $ifNull: ["$upvotes", []] } },
          commentsCount: { $size: "$comments" },
          itemType: "note",
        },
      },
      {
        $project: {
          title: 1,
          slug: 1,
          tags: 1,
          category: 1,
          coverImage: 1,
          readingTime: 1,
          wordCount: 1,
          upvotes: 1,
          isPinned: 1,
          createdAt: 1,
          updatedAt: 1,
          upvotesCount: 1,
          commentsCount: 1,
          itemType: 1,
          "author._id": 1,
          "author.name": 1,
          "author.image": 1,
        },
      },
    ];

    // Build aggregation pipeline for Blogs
    const blogPipeline: PipelineStage[] = [
      { $match: blogMatchCriteria },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "author",
        },
      },
      { $unwind: { path: "$author", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "comments",
          localField: "_id",
          foreignField: "noteId",
          as: "comments",
        },
      },
      {
        $addFields: {
          upvotesCount: { $size: { $ifNull: ["$upvotes", []] } },
          commentsCount: { $size: "$comments" },
          itemType: "blog",
          category: "Blog",
          tags: ["blog"],
        },
      },
      {
        $project: {
          title: 1,
          slug: 1,
          summary: 1,
          category: 1,
          tags: 1,
          coverImage: 1,
          upvotes: 1,
          createdAt: 1,
          updatedAt: 1,
          upvotesCount: 1,
          commentsCount: 1,
          itemType: 1,
          userId: 1,
          userName: 1,
          "author._id": 1,
          "author.name": 1,
          "author.image": 1,
        },
      },
    ];

    const [notePosts, blogPosts] = await Promise.all([
      Note.aggregate(notePipeline),
      Blog.aggregate(blogPipeline),
    ]);

    // Normalize blog posts author fallback if user doc wasn't unwound
    const normalizedBlogPosts = blogPosts.map((b) => ({
      ...b,
      author: b.author?._id
        ? b.author
        : { _id: b.userId, name: b.userName || "Blog Author", image: "" },
    }));

    // Merge notes & blogs
    let combined = [...notePosts, ...normalizedBlogPosts];

    // Sort combined feed
    if (sort === "top") {
      combined.sort((a, b) => (b.upvotesCount || 0) - (a.upvotesCount || 0));
    } else if (sort === "trending") {
      combined.sort(
        (a, b) =>
          ((b.upvotesCount || 0) + (b.commentsCount || 0)) -
          ((a.upvotesCount || 0) + (a.commentsCount || 0))
      );
    } else {
      // Default: new
      combined.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    // Paginate
    const paginated = combined.slice(skip, skip + limit);

    return NextResponse.json(paginated);
  } catch (error) {
    console.error("Feed error:", error);
    return NextResponse.json({ error: "Failed to load feed." }, { status: 500 });
  }
});
