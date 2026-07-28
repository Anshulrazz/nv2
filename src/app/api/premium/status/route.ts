import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/models/User";
import { getOrCreateUserWallet } from "@/lib/wallet";

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
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    // Lazy check: Flip premium status if expired
    const now = new Date();
    if (
      user.isPremium &&
      user.premiumExpiresAt &&
      new Date(user.premiumExpiresAt) < now
    ) {
      user.isPremium = false;
      user.isPremiumUser = false;
      user.premiumPlan = null;
      await user.save();
    }

    const wallet = await getOrCreateUserWallet(user._id);

    return NextResponse.json({
      isPremium: Boolean(user.isPremium || user.isPremiumUser),
      premiumPlan: user.premiumPlan || null,
      premiumSince: user.premiumSince || null,
      premiumExpiresAt: user.premiumExpiresAt || null,
      coins: user.coins || 0,
      walletAddress: wallet.address,
    });
  } catch (error) {
    console.error("Get premium status error:", error);
    return NextResponse.json(
      { error: "Failed to fetch premium status." },
      { status: 500 }
    );
  }
}
