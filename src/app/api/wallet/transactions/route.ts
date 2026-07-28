import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/models/User";
import { Wallet } from "@/models/Wallet";
import { CoinTransaction } from "@/models/CoinTransaction";
import { getOrCreateUserWallet } from "@/lib/wallet";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
    const skip = (page - 1) * limit;

    await connectToDatabase();

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    const wallet = await getOrCreateUserWallet(user._id);

    const query = {
      $or: [
        { fromWalletAddress: wallet.address },
        { toWalletAddress: wallet.address },
      ],
    };

    const total = await CoinTransaction.countDocuments(query);
    const rawTransactions = await CoinTransaction.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Collect counterparty addresses for resolution
    const counterpartyAddresses = new Set<string>();
    rawTransactions.forEach((tx) => {
      if (tx.fromWalletAddress && tx.fromWalletAddress !== wallet.address) {
        counterpartyAddresses.add(tx.fromWalletAddress);
      }
      if (tx.toWalletAddress && tx.toWalletAddress !== wallet.address) {
        counterpartyAddresses.add(tx.toWalletAddress);
      }
    });

    const counterpartyWallets = await Wallet.find({
      address: { $in: Array.from(counterpartyAddresses) },
    });

    const counterpartyUserIds = counterpartyWallets.map((w) => w.userId);
    const counterpartyUsers = await User.find({
      _id: { $in: counterpartyUserIds },
    }).select("name image email");

    const walletToUserMap: Record<string, { name: string; image?: string }> = {};
    counterpartyWallets.forEach((w) => {
      const u = counterpartyUsers.find(
        (usr) => usr._id.toString() === w.userId.toString()
      );
      if (u) {
        walletToUserMap[w.address] = {
          name: u.name || "Notexia Member",
          image: u.image || undefined,
        };
      }
    });

    const formattedTransactions = rawTransactions.map((tx) => {
      const isSender = tx.fromWalletAddress === wallet.address;
      const counterpartyAddr = isSender
        ? tx.toWalletAddress
        : tx.fromWalletAddress;
      const counterpartyInfo = counterpartyAddr
        ? walletToUserMap[counterpartyAddr]
        : null;

      return {
        id: tx._id.toString(),
        type: tx.type,
        amount: tx.amount,
        isDebit: isSender,
        fromWalletAddress: tx.fromWalletAddress,
        toWalletAddress: tx.toWalletAddress,
        counterpartyName:
          counterpartyInfo?.name ||
          tx.metadata?.senderName ||
          tx.metadata?.recipientName ||
          (isSender ? "Recipient" : "System Credit"),
        counterpartyImage: counterpartyInfo?.image || null,
        status: tx.status,
        metadata: tx.metadata || {},
        createdAt: tx.createdAt,
      };
    });

    return NextResponse.json({
      transactions: formattedTransactions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get transactions error:", error);
    return NextResponse.json(
      { error: "Failed to fetch wallet transactions." },
      { status: 500 }
    );
  }
}
