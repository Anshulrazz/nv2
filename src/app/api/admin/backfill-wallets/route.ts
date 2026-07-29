import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/models/User";
import { getOrCreateUserWallet, ensureUserReferralCode } from "@/lib/wallet";

export async function POST(req: Request) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    
    // Check secret header fallback for CLI/curl callers
    const secretHeader = req.headers.get("x-admin-secret");
    const validSecret = process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET;
    const isSecretAuthorized = secretHeader && validSecret && secretHeader === validSecret;

    await connectToDatabase();

    if (!isSecretAuthorized) {
      if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      const currentUser = await User.findById(userId);
      if (currentUser?.role !== "admin") {
        return NextResponse.json({ error: "Forbidden. Admin access required." }, { status: 403 });
      }
    }

    const allUsers = await User.find({});
    let backfilledWallets = 0;
    let backfilledCodes = 0;

    for (const user of allUsers) {
      if (!user.referralCode) {
        await ensureUserReferralCode(user);
        backfilledCodes++;
      }

      const wallet = await getOrCreateUserWallet(user._id);
      if (wallet.balance !== (user.coins || 0)) {
        wallet.balance = user.coins || 0;
        await wallet.save();
        backfilledWallets++;
      }
    }

    return NextResponse.json({
      message: `Backfill completed successfully.`,
      processedUsers: allUsers.length,
      backfilledCodes,
      backfilledWallets,
    });
  } catch (error) {
    console.error("Backfill wallets error:", error);
    return NextResponse.json(
      { error: "Migration backfill failed." },
      { status: 500 }
    );
  }
}
