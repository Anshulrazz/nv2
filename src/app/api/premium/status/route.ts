import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/models/User";
import { getOrCreateUserWallet } from "@/lib/wallet";
import { memoryCache, getCacheHeaders } from "@/lib/cache";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fast memoryCache lookup (15s TTL)
    const cacheKey = `user:premium:${userId}`;
    const cachedData = memoryCache.get<Record<string, unknown>>(cacheKey);
    if (cachedData) {
      return NextResponse.json(cachedData, {
        headers: getCacheHeaders({ public: false, maxAge: 10, staleWhileRevalidate: 30 }),
      });
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

    const result = {
      isPremium: Boolean(user.isPremium || user.isPremiumUser),
      premiumPlan: user.premiumPlan || null,
      premiumSince: user.premiumSince || null,
      premiumExpiresAt: user.premiumExpiresAt || null,
      coins: user.coins || 0,
      walletAddress: wallet.address,
    };

    memoryCache.set(cacheKey, result, 15000);

    return NextResponse.json(result, {
      headers: getCacheHeaders({ public: false, maxAge: 10, staleWhileRevalidate: 30 }),
    });
  } catch (error) {
    console.error("Get premium status error:", error);
    return NextResponse.json(
      { error: "Failed to fetch premium status." },
      { status: 500 }
    );
  }
}
