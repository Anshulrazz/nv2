import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { Note } from "@/models/Note";
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

    // Base match criteria
    const matchCriteria: Record<string, unknown> = {
      published: true,
      isTrashed: false,
    };

    if (search && typeof search === "string") {
      const escapedSearch = escapeRegex(search.trim());
      matchCriteria.$or = [
        { title: { $regex: escapedSearch, $options: "i" } },
        { tags: { $regex: escapedSearch, $options: "i" } },
      ];
    }

    if (tag) {
      matchCriteria.tags = tag;
    }

    if (category) {
      matchCriteria.category = category;
    }

    if (sort === "following") {
      if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      const follows = await Follow.find({ followerId: userId }).select("followingId");
      const followingIds = follows.map((f) => f.followingId);
      matchCriteria.userId = { $in: followingIds };
    }

    // Build aggregation pipeline to populate user and compute counts
    const pipeline: PipelineStage[] = [
      { $match: matchCriteria },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "author",
        },
      },
      { $unwind: "$author" },
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
        },
      },
      // Project fields
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
          "author._id": 1,
          "author.name": 1,
          "author.image": 1,
        },
      },
    ];

    // Handle dynamic sorting modes
    if (sort === "top") {
      pipeline.push({ $sort: { upvotesCount: -1, createdAt: -1 } });
    } else if (sort === "trending") {
      pipeline.push({
        $addFields: {
          trendingScore: { $add: ["$upvotesCount", "$commentsCount"] },
        },
      });
      pipeline.push({ $sort: { trendingScore: -1, createdAt: -1 } });
    } else {
      // Default: new
      pipeline.push({ $sort: { createdAt: -1 } });
    }

    // Pagination stages
    pipeline.push({ $skip: skip });
    pipeline.push({ $limit: limit });

    const posts = await Note.aggregate(pipeline);

    return NextResponse.json(posts);
  } catch (error) {
    console.error("Feed error:", error);
    return NextResponse.json({ error: "Failed to load feed." }, { status: 500 });
  }
});
