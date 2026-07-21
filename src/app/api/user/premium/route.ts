import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/models/User";

export const dynamic = "force-dynamic";

export const GET = auth(async function GET(req) {
  try {
    const userId = req.auth?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    const user = await User.findById(userId).select("isPremiumUser coins");
    if (!user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    return NextResponse.json({
      isPremiumUser: !!user.isPremiumUser,
      coins: user.coins || 0,
    });
  } catch (error) {
    console.error("Get premium status error:", error);
    return NextResponse.json({ error: "Failed to fetch premium status." }, { status: 500 });
  }
});

export const POST = auth(async function POST(req) {
  try {
    const userId = req.auth?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    if (user.isPremiumUser) {
      return NextResponse.json({ error: "You are already a premium user." }, { status: 400 });
    }

    const premiumCost = 500;
    if (user.coins < premiumCost) {
      return NextResponse.json(
        { error: `Insufficient Coins. You need ${premiumCost} coins to upgrade to premium (Your balance: ${user.coins} coins).` },
        { status: 400 }
      );
    }

    // Deduct coins and upgrade to premium
    user.coins -= premiumCost;
    user.isPremiumUser = true;
    await user.save();

    return NextResponse.json({
      message: "Congratulations! You have upgraded to Premium successfully.",
      isPremiumUser: true,
      coins: user.coins,
    });
  } catch (error) {
    console.error("Premium upgrade error:", error);
    return NextResponse.json({ error: "Failed to process premium upgrade." }, { status: 500 });
  }
});
