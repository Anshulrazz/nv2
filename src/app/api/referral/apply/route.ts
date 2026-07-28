import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/models/User";
import { CoinTransaction } from "@/models/CoinTransaction";
import { getOrCreateUserWallet } from "@/lib/wallet";

export async function POST(req: Request) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { referralCode } = await req.json();
    if (!referralCode || typeof referralCode !== "string" || !referralCode.trim()) {
      return NextResponse.json(
        { error: "Please enter a valid referral code." },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    if (user.referredBy) {
      return NextResponse.json(
        { error: "You have already used a referral code." },
        { status: 400 }
      );
    }

    const searchCode = referralCode.trim().toUpperCase();
    const referrer = await User.findOne({ referralCode: searchCode });

    if (!referrer) {
      return NextResponse.json(
        { error: "Invalid referral code." },
        { status: 400 }
      );
    }

    if (referrer._id.toString() === user._id.toString()) {
      return NextResponse.json(
        { error: "You cannot use your own referral code." },
        { status: 400 }
      );
    }

    // Set referredBy and award 50 coins to user
    user.referredBy = referrer._id;
    user.coins = (user.coins || 0) + 50;
    await user.save();

    const userWallet = await getOrCreateUserWallet(user._id);
    userWallet.balance = user.coins;
    await userWallet.save();

    // Award referrer +100 coins
    referrer.coins = (referrer.coins || 0) + 100;
    referrer.referralCount = (referrer.referralCount || 0) + 1;
    referrer.referralRewardsEarned = (referrer.referralRewardsEarned || 0) + 100;
    await referrer.save();

    const referrerWallet = await getOrCreateUserWallet(referrer._id);
    referrerWallet.balance = referrer.coins;
    await referrerWallet.save();

    // Write ledger entries
    await CoinTransaction.create({
      fromWalletAddress: null,
      toWalletAddress: userWallet.address,
      amount: 50,
      type: "referral_bonus",
      status: "completed",
      metadata: {
        referralCode: referrer.referralCode,
        relatedUserId: referrer._id.toString(),
        note: "Applied referral code bonus",
      },
    });

    await CoinTransaction.create({
      fromWalletAddress: null,
      toWalletAddress: referrerWallet.address,
      amount: 100,
      type: "referral_bonus",
      status: "completed",
      metadata: {
        referralCode: referrer.referralCode,
        relatedUserId: user._id.toString(),
        note: `Referral reward for inviting ${user.name || user.email}`,
      },
    });

    return NextResponse.json({
      message: "Referral code applied successfully! You received 50 coins.",
      coins: user.coins,
      walletAddress: userWallet.address,
    });
  } catch (error) {
    console.error("Apply referral code error:", error);
    return NextResponse.json(
      { error: "Failed to apply referral code." },
      { status: 500 }
    );
  }
}
