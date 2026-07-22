import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/models/User";
import { isValidObjectId } from "@/lib/validation";

export const dynamic = "force-dynamic";

export const GET = auth(async function GET(req) {
  try {
    const userId = req.auth?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      directMessageWallpaper: user.directMessageWallpaper || "",
      directMessageWallpapers: user.directMessageWallpapers 
        ? Object.fromEntries(user.directMessageWallpapers) 
        : {},
    });
  } catch (error) {
    console.error("Get user wallpaper error:", error);
    return NextResponse.json({ error: "Failed to fetch wallpaper settings." }, { status: 500 });
  }
});

export const PATCH = auth(async function PATCH(req) {
  try {
    const userId = req.auth?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { wallpaper, otherUserId } = body;

    if (typeof wallpaper !== "string") {
      return NextResponse.json({ error: "Wallpaper must be a string." }, { status: 400 });
    }

    await connectToDatabase();

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (otherUserId) {
      if (!isValidObjectId(otherUserId)) {
        return NextResponse.json({ error: "Invalid recipient user ID format." }, { status: 400 });
      }

      if (!user.directMessageWallpapers) {
        user.directMessageWallpapers = new Map();
      }

      if (wallpaper === "") {
        user.directMessageWallpapers.delete(otherUserId);
      } else {
        user.directMessageWallpapers.set(otherUserId, wallpaper);
      }
    } else {
      user.directMessageWallpaper = wallpaper;
    }

    // Force Mongoose to recognize changes in nested Maps
    user.markModified("directMessageWallpapers");
    await user.save();

    return NextResponse.json({
      directMessageWallpaper: user.directMessageWallpaper || "",
      directMessageWallpapers: user.directMessageWallpapers 
        ? Object.fromEntries(user.directMessageWallpapers) 
        : {},
    });
  } catch (error) {
    console.error("Update user wallpaper error:", error);
    return NextResponse.json({ error: "Failed to update wallpaper settings." }, { status: 500 });
  }
});
