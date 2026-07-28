import { NextResponse } from "next/server";
import { auth } from "@/auth";
import bcrypt from "bcryptjs";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/models/User";
import { getOrCreateUserWallet } from "@/lib/wallet";

export async function POST(req: Request) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { newWalletPassword, oldWalletPassword } = await req.json();

    if (
      !newWalletPassword ||
      typeof newWalletPassword !== "string" ||
      newWalletPassword.trim().length < 4
    ) {
      return NextResponse.json(
        {
          error: "INVALID_NEW_PASSWORD",
          message: "Wallet password must be at least 4 characters/digits long.",
        },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    const wallet = await getOrCreateUserWallet(user._id);

    // If wallet password already set, require and verify old password
    if (wallet.walletPasswordHash) {
      if (!oldWalletPassword || typeof oldWalletPassword !== "string") {
        return NextResponse.json(
          {
            error: "OLD_PASSWORD_REQUIRED",
            message: "Current wallet password is required to change to a new one.",
          },
          { status: 400 }
        );
      }

      const isMatch = await bcrypt.compare(
        oldWalletPassword,
        wallet.walletPasswordHash
      );
      if (!isMatch) {
        return NextResponse.json(
          {
            error: "INVALID_OLD_PASSWORD",
            message: "Incorrect current wallet password.",
          },
          { status: 401 }
        );
      }
    }

    // Hash and save new wallet password
    const hashedPassword = await bcrypt.hash(newWalletPassword.trim(), 10);
    wallet.walletPasswordHash = hashedPassword;
    await wallet.save();

    return NextResponse.json({
      message: wallet.walletPasswordHash
        ? "Wallet security password updated successfully!"
        : "Wallet security password set up successfully!",
      hasWalletPassword: true,
    });
  } catch (error) {
    console.error("Set wallet password error:", error);
    return NextResponse.json(
      { error: "Failed to set wallet password." },
      { status: 500 }
    );
  }
}
