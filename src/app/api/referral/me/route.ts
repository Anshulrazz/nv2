import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/models/User";
import { getOrCreateUserWallet, ensureUserReferralCode } from "@/lib/wallet";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const referralCode = await ensureUserReferralCode(user);
    const wallet = await getOrCreateUserWallet(user._id);

    const referredUsers = await User.find({ referredBy: user._id })
      .select("name email createdAt")
      .sort({ createdAt: -1 });

    const baseUrl = process.env.NEXTAUTH_URL || "https://nottexia.in";
    const referralLink = `${baseUrl}/signup?ref=${referralCode}`;

    return NextResponse.json({
      referralCode,
      referralLink,
      referralCount: user.referralCount || referredUsers.length,
      referralRewardsEarned: user.referralRewardsEarned || referredUsers.length * 100,
      coins: user.coins || 0,
      walletAddress: wallet.address,
      referredUsers: referredUsers.map((u) => ({
        id: u._id.toString(),
        name: u.name || "Anonymous User",
        email: u.email,
        createdAt: u.createdAt,
        coinsEarned: 100,
      })),
    });
  } catch (error) {
    console.error("Get referral info error:", error);
    return NextResponse.json(
      { error: "Failed to fetch referral details." },
      { status: 500 }
    );
  }
}
