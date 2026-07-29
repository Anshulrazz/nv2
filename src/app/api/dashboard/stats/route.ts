import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { Note } from "@/models/Note";
import { Bookmark } from "@/models/Bookmark";
import { Doubt } from "@/models/Doubt";
import { User } from "@/models/User";
import { Blog } from "@/models/Blog";
import { memoryCache, getCacheHeaders } from "@/lib/cache";

export const dynamic = "force-dynamic";

export const GET = auth(async function GET(req) {
  try {
    const userId = req.auth?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check fast server-side in-memory cache (15s TTL)
    const cacheKey = `dashboard:stats:${userId}`;
    const cachedStats = memoryCache.get<Record<string, unknown>>(cacheKey);
    if (cachedStats) {
      return NextResponse.json(cachedStats, {
        headers: getCacheHeaders({ public: false, maxAge: 10, staleWhileRevalidate: 30 }),
      });
    }

    await connectToDatabase();

    // Ensure current user's wallet exists and trigger background backfill
    const { getOrCreateUserWallet, autoEnsureAllUsersHaveWallets } = await import("@/lib/wallet");
    getOrCreateUserWallet(userId).catch(() => null);
    autoEnsureAllUsersHaveWallets().catch(() => null);

    // Execute queries in parallel using lean() for zero overhead
    const [notesCount, bookmarksCount, doubtsCount, dbUser, referralsCount, recentNotes, recentBlogs] =
      await Promise.all([
        Note.countDocuments({ userId, isTrashed: false }),
        Bookmark.countDocuments({ userId }),
        Doubt.countDocuments({ userId }),
        User.findById(userId).select("points coins").lean(),
        User.countDocuments({ referredBy: userId }),
        Note.find({ userId, isTrashed: false })
          .select("title updatedAt")
          .sort({ updatedAt: -1 })
          .limit(5)
          .lean(),
        Blog.find({ published: true })
          .select("title summary userName createdAt")
          .sort({ createdAt: -1 })
          .limit(3)
          .lean(),
      ]);

    const result = {
      notesCount,
      bookmarksCount,
      doubtsCount,
      points: dbUser?.points || 0,
      coins: dbUser?.coins || 0,
      referralsCount: referralsCount || 0,
      recentNotes,
      recentBlogs,
    };

    // Store in memoryCache for 15 seconds
    memoryCache.set(cacheKey, result, 15000);

    return NextResponse.json(result, {
      headers: getCacheHeaders({ public: false, maxAge: 10, staleWhileRevalidate: 30 }),
    });
  } catch (error) {
    console.error("Dashboard stats error:", error);
    return NextResponse.json({ error: "Failed to fetch dashboard metrics." }, { status: 500 });
  }
});
