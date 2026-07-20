import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/models/User";
import { isValidObjectId, escapeRegex } from "@/lib/validation";

export const GET = auth(async function GET(req) {
  try {
    const currentUserId = req.auth?.user?.id;
    if (!currentUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const query = searchParams.get("query") || "";
    const targetUserId = searchParams.get("userId");

    await connectToDatabase();

    // If userId parameter is provided, fetch details for that specific user
    if (targetUserId) {
      if (!isValidObjectId(targetUserId)) {
        return NextResponse.json({ error: "Invalid user ID format." }, { status: 400 });
      }
      const user = await User.findOne({ _id: targetUserId, isSuspended: false })
        .select("name email image");
      return NextResponse.json(user ? [user] : []);
    }

    const escapedQuery = escapeRegex(query.trim());

    // Otherwise, search users by name or email, excluding current user
    const users = await User.find({
      _id: { $ne: currentUserId },
      isSuspended: false,
      $or: [
        { name: { $regex: escapedQuery, $options: "i" } },
        { email: { $regex: escapedQuery, $options: "i" } },
      ],
    })
      .select("name email image")
      .limit(15);

    return NextResponse.json(users);
  } catch (error) {
    console.error("Search/Get users error:", error);
    return NextResponse.json({ error: "Failed to search/get users." }, { status: 500 });
  }
});
