import { NextResponse } from "next/server";
import { auth } from "@/auth";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/models/User";
import { Wallet } from "@/models/Wallet";
import { WithdrawalRequest } from "@/models/WithdrawalRequest";
import { CoinTransaction } from "@/models/CoinTransaction";
import { getOrCreateUserWallet } from "@/lib/wallet";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const adminId = session?.user?.id;
    if (!adminId) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { id } = await params;

    await connectToDatabase();

    const adminUser = await User.findById(adminId);
    if (!adminUser || adminUser.role !== "admin") {
      return NextResponse.json(
        { error: "Forbidden. Admin privileges required." },
        { status: 403 }
      );
    }

    const { action, transactionRef, adminNote } = await req.json();

    if (!["approve", "complete", "reject"].includes(action)) {
      return NextResponse.json(
        { error: "Invalid action. Must be 'approve', 'complete', or 'reject'." },
        { status: 400 }
      );
    }

    const withdrawal = await WithdrawalRequest.findById(id);
    if (!withdrawal) {
      return NextResponse.json({ error: "Withdrawal request not found." }, { status: 404 });
    }

    const user = await User.findById(withdrawal.userId);
    if (!user) {
      return NextResponse.json({ error: "Associated user not found." }, { status: 404 });
    }

    const wallet = await getOrCreateUserWallet(user._id);

    const now = new Date();

    if (action === "approve") {
      withdrawal.status = "approved";
      if (adminNote) withdrawal.adminNote = adminNote;
      await withdrawal.save();

      return NextResponse.json({
        message: "Withdrawal request approved successfully.",
        withdrawal,
      });
    }

    if (action === "complete") {
      withdrawal.status = "completed";
      if (transactionRef) withdrawal.transactionRef = transactionRef;
      if (adminNote) withdrawal.adminNote = adminNote;
      withdrawal.processedAt = now;
      await withdrawal.save();

      // Update Ledger Transaction status to completed
      await CoinTransaction.updateOne(
        { "metadata.withdrawalRequestId": withdrawal._id },
        {
          $set: {
            status: "completed",
            "metadata.transactionRef": transactionRef || "",
            "metadata.completedAt": now,
          },
        }
      );

      return NextResponse.json({
        message: `Payout of ₹${withdrawal.amount} completed successfully! UTR/Ref: ${transactionRef || "N/A"}`,
        withdrawal,
      });
    }

    if (action === "reject") {
      // Refund coins back to user
      withdrawal.status = "rejected";
      if (adminNote) withdrawal.adminNote = adminNote;
      withdrawal.processedAt = now;
      await withdrawal.save();

      user.creatorEarnings = (user.creatorEarnings || 0) + withdrawal.amount;
      await user.save();

      // Update Ledger Transaction status to failed/refunded
      await CoinTransaction.updateOne(
        { "metadata.withdrawalRequestId": withdrawal._id },
        {
          $set: {
            status: "failed",
            "metadata.rejectionReason": adminNote || "Rejected by Admin",
            "metadata.refundedAt": now,
          },
        }
      );

      // Record refund transaction
      await CoinTransaction.create({
        fromWalletAddress: "SYSTEM_EARNINGS_PAYOUT_RESERVE",
        toWalletAddress: wallet.address,
        amount: withdrawal.amount,
        type: "admin_adjustment",
        status: "completed",
        metadata: {
          withdrawalRequestId: withdrawal._id,
          note: `Refunded rejected withdrawal of ${withdrawal.amount} coins: ${adminNote || "Rejected by Admin"}`,
        },
      });

      return NextResponse.json({
        message: `Withdrawal request rejected. ${withdrawal.amount} coins refunded to user's creator earnings balance.`,
        withdrawal,
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    console.error("Admin PATCH withdrawal error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to process withdrawal action." },
      { status: 500 }
    );
  }
}
