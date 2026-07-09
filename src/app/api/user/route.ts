import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/models/User";

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
      const user = await User.findOne({ _id: targetUserId, isSuspended: false })
        .select("name email image");
      return NextResponse.json(user ? [user] : []);
    }

    // Otherwise, search users by name or email, excluding current user
    const users = await User.find({
      _id: { $ne: currentUserId },
      isSuspended: false,
      $or: [
        { name: { $regex: query, $options: "i" } },
        { email: { $regex: query, $options: "i" } },
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
