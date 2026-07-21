import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { Note } from "@/models/Note";
import { Bookmark } from "@/models/Bookmark";
import { Doubt } from "@/models/Doubt";
import { User } from "@/models/User";
import { Blog } from "@/models/Blog";

export const GET = auth(async function GET(req) {
  try {
    const userId = req.auth?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    const [notesCount, bookmarksCount, doubtsCount, dbUser, referralsCount] = await Promise.all([
      Note.countDocuments({ userId, isTrashed: false }),
      Bookmark.countDocuments({ userId }),
      Doubt.countDocuments({ userId }),
      User.findById(userId).select("points coins"),
      User.countDocuments({ referredBy: userId }),
    ]);

    const recentNotes = await Note.find({ userId, isTrashed: false })
      .select("title updatedAt")
      .sort({ updatedAt: -1 })
      .limit(5);

    const recentBlogs = await Blog.find({ published: true })
      .select("title summary userName createdAt")
      .sort({ createdAt: -1 })
      .limit(3);

    return NextResponse.json({
      notesCount,
      bookmarksCount,
      doubtsCount,
      points: dbUser?.points || 0,
      coins: dbUser?.coins || 0,
      referralsCount: referralsCount || 0,
      recentNotes,
      recentBlogs,
    });
  } catch (error) {
    console.error("Dashboard stats error:", error);
    return NextResponse.json({ error: "Failed to fetch dashboard metrics." }, { status: 500 });
  }
});
