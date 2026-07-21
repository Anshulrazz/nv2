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

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Ensure referral code and coins are generated and stored in DB if missing
    let hasUpdates = false;
    if (!user.referralCode) {
      let uniqueCode = "";
      let isUnique = false;
      let attempts = 0;
      while (!isUnique && attempts < 10) {
        uniqueCode = `REF-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
        const existing = await User.findOne({ referralCode: uniqueCode });
        if (!existing) isUnique = true;
        attempts++;
      }
      user.referralCode = uniqueCode;
      hasUpdates = true;
    }
    if (user.coins === undefined || user.coins === null) {
      user.coins = 0;
      hasUpdates = true;
    }
    if (hasUpdates) {
      await user.save();
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
    ).select("name email image role points coins referralCode isPremiumUser isPublic");

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("Profile update error:", error);
    return NextResponse.json({ error: "Failed to update profile." }, { status: 500 });
  }
});
