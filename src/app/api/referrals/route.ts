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

    // Get referral history (users who were referred by this user)
    const referredUsers = await User.find({ referredBy: userId })
      .select("name email createdAt")
      .sort({ createdAt: -1 });

    return NextResponse.json({
      referralCode: user.referralCode,
      coins: user.coins,
      referredUsers: referredUsers.map((u) => ({
        id: u._id.toString(),
        name: u.name || "Anonymous",
        email: u.email,
        createdAt: u.createdAt,
        coinsEarned: 200,
      })),
    });
  } catch (error) {
    console.error("Get referrals error:", error);
    return NextResponse.json({ error: "Failed to fetch referral data." }, { status: 500 });
  }
});
