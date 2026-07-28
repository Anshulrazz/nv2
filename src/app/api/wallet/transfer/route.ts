import { NextResponse } from "next/server";
import { auth } from "@/auth";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/models/User";
import { Wallet } from "@/models/Wallet";
import { CoinTransaction } from "@/models/CoinTransaction";
import { getOrCreateUserWallet } from "@/lib/wallet";

export async function POST(req: Request) {
  try {
    const session = await auth();
    const senderUserId = session?.user?.id;
    if (!senderUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { toAddress, amount, note, password } = body;

    // Wallet password presence check
    if (!password || typeof password !== "string" || !password.trim()) {
      return NextResponse.json(
        {
          error: "WALLET_PASSWORD_REQUIRED",
          message: "Wallet security password is required to authorize coin transfers.",
        },
        { status: 400 }
      );
    }

    // Validate inputs
    if (!toAddress || typeof toAddress !== "string" || !toAddress.trim()) {
      return NextResponse.json(
        { error: "Recipient wallet address is required." },
        { status: 400 }
      );
    }

    const parsedAmount = Number(amount);
    if (
      isNaN(parsedAmount) ||
      parsedAmount <= 0 ||
      !Number.isInteger(parsedAmount)
    ) {
      return NextResponse.json(
        { error: "Amount must be a positive whole integer." },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const cleanToAddress = toAddress.trim().toUpperCase();

    // Fetch sender user & wallet
    const senderUser = await User.findById(senderUserId);
    if (!senderUser) {
      return NextResponse.json({ error: "Sender user not found." }, { status: 404 });
    }

    const senderWallet = await getOrCreateUserWallet(senderUser._id);

    // Verify wallet password setup
    if (!senderWallet.walletPasswordHash) {
      return NextResponse.json(
        {
          error: "WALLET_PASSWORD_NOT_SET",
          message:
            "You have not set up a Wallet Security Password yet. Please create a Wallet Password before sending coins.",
        },
        { status: 400 }
      );
    }

    // Verify wallet password correctness
    const isPasswordValid = await bcrypt.compare(
      password.trim(),
      senderWallet.walletPasswordHash
    );
    if (!isPasswordValid) {
      return NextResponse.json(
        {
          error: "INVALID_WALLET_PASSWORD",
          message: "Incorrect Wallet Security Password. Coin transfer unauthorized.",
        },
        { status: 401 }
      );
    }

    // Self transfer check
    if (senderWallet.address === cleanToAddress) {
      return NextResponse.json(
        { error: "You cannot transfer coins to your own wallet address." },
        { status: 400 }
      );
    }

    // Balance check
    if (senderWallet.balance < parsedAmount || (senderUser.coins || 0) < parsedAmount) {
      return NextResponse.json(
        { error: "INSUFFICIENT_BALANCE", message: "Insufficient coin balance for this transfer." },
        { status: 400 }
      );
    }

    // Fetch recipient wallet & user
    const recipientWallet = await Wallet.findOne({ address: cleanToAddress });
    if (!recipientWallet) {
      return NextResponse.json(
        { error: "Recipient wallet address does not exist." },
        { status: 404 }
      );
    }

    const recipientUser = await User.findById(recipientWallet.userId);
    if (!recipientUser) {
      return NextResponse.json(
        { error: "Recipient user account not found." },
        { status: 404 }
      );
    }

    // Execute atomic transfer with MongoDB session transaction fallback
    const dbSession = await mongoose.startSession();
    try {
      await dbSession.withTransaction(async () => {
        // Decrement sender
        senderWallet.balance -= parsedAmount;
        senderUser.coins -= parsedAmount;
        await senderWallet.save({ session: dbSession });
        await senderUser.save({ session: dbSession });

        // Increment recipient
        recipientWallet.balance += parsedAmount;
        recipientUser.coins = (recipientUser.coins || 0) + parsedAmount;
        await recipientWallet.save({ session: dbSession });
        await recipientUser.save({ session: dbSession });

        // Create transaction record
        await CoinTransaction.create(
          [
            {
              fromWalletAddress: senderWallet.address,
              toWalletAddress: recipientWallet.address,
              amount: parsedAmount,
              type: "transfer",
              status: "completed",
              metadata: {
                note: note ? note.trim() : "Peer-to-peer coin transfer",
                senderName: senderUser.name || "Anonymous",
                recipientName: recipientUser.name || "Anonymous",
              },
            },
          ],
          { session: dbSession }
        );
      });
    } catch (txError) {
      console.warn("MongoDB transaction fallback execution:", txError);
      // Fallback for standalone Mongo instances without replica set
      senderWallet.balance -= parsedAmount;
      senderUser.coins -= parsedAmount;
      await senderWallet.save();
      await senderUser.save();

      recipientWallet.balance += parsedAmount;
      recipientUser.coins = (recipientUser.coins || 0) + parsedAmount;
      await recipientWallet.save();
      await recipientUser.save();

      await CoinTransaction.create({
        fromWalletAddress: senderWallet.address,
        toWalletAddress: recipientWallet.address,
        amount: parsedAmount,
        type: "transfer",
        status: "completed",
        metadata: {
          note: note ? note.trim() : "Peer-to-peer coin transfer",
          senderName: senderUser.name || "Anonymous",
          recipientName: recipientUser.name || "Anonymous",
        },
      });
    } finally {
      await dbSession.endSession();
    }

    return NextResponse.json({
      message: `Successfully transferred ${parsedAmount} coins to ${recipientUser.name || "recipient"}.`,
      balance: senderWallet.balance,
      address: senderWallet.address,
    });
  } catch (error) {
    console.error("Transfer error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred during coin transfer." },
      { status: 500 }
    );
  }
}
