import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/models/User";

export const GET = auth(async function GET(req) {
  try {
    const userId = req.auth?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    const user = await User.findById(userId).select("name email image role points bio bannerImage isPublic");
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("Get user profile error:", error);
    return NextResponse.json({ error: "Failed to fetch user profile." }, { status: 500 });
  }
});

export const PATCH = auth(async function PATCH(req) {
  try {
    const userId = req.auth?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, image, isPublic } = body;

    await connectToDatabase();

    const updates: { name?: string; image?: string; isPublic?: boolean } = {};
    if (name !== undefined && name.trim() !== "") {
      updates.name = name.trim();
    }
    if (image !== undefined) {
      updates.image = image.trim();
    }
    if (isPublic !== undefined) {
      updates.isPublic = !!isPublic;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No valid changes provided." }, { status: 400 });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updates },
      { new: true }
    ).select("name email image role points isPublic");

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("Profile update error:", error);
    return NextResponse.json({ error: "Failed to update profile." }, { status: 500 });
  }
});
