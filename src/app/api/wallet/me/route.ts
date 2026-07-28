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
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const wallet = await getOrCreateUserWallet(user._id);

    // Sync wallet balance with user.coins if mismatched
    if (wallet.balance !== user.coins) {
      wallet.balance = user.coins || 0;
      await wallet.save();
    }

    return NextResponse.json({
      address: wallet.address,
      balance: wallet.balance,
      coins: user.coins || 0,
      hasWalletPassword: Boolean(wallet.walletPasswordHash),
    });
  } catch (error) {
    console.error("Get wallet info error:", error);
    return NextResponse.json(
      { error: "Failed to fetch wallet info." },
      { status: 500 }
    );
  }
}
