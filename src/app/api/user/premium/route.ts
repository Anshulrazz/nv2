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

    const user = await User.findById(userId).select("isPremium isPremiumUser coins premiumExpiresAt");
    if (!user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    const hasUpgraded = Boolean(
      user.isPremium ||
      user.isPremiumUser ||
      (user.premiumExpiresAt && new Date(user.premiumExpiresAt) > new Date())
    );

    return NextResponse.json({
      isPremium: hasUpgraded,
      isPremiumUser: hasUpgraded,
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

    return NextResponse.json(
      {
        error: "Profile upgrades must be purchased via INR payment. Coin-based upgrades are no longer supported. Please upgrade using Razorpay with available coupon codes.",
        code: "INR_PAYMENT_REQUIRED",
      },
      { status: 400 }
    );
  } catch (error) {
    console.error("Premium upgrade error:", error);
    return NextResponse.json({ error: "Failed to process premium upgrade." }, { status: 500 });
  }
});
