import { NextResponse } from "next/server";
import { auth } from "@/auth";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/models/User";
import { WithdrawalRequest } from "@/models/WithdrawalRequest";
import { CoinTransaction } from "@/models/CoinTransaction";
import { getOrCreateUserWallet } from "@/lib/wallet";

export async function POST(req: Request) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { amount, payoutMethod, payoutDetails } = body || {};

    const withdrawAmount = Number(amount);
    if (isNaN(withdrawAmount) || withdrawAmount < 1) {
      return NextResponse.json(
        { error: "Please enter a valid withdrawal amount of at least 1 coin." },
        { status: 400 }
      );
    }

    if (payoutMethod !== "upi" && payoutMethod !== "bank_transfer") {
      return NextResponse.json(
        { error: "Please select a valid payout method ('upi' or 'bank_transfer')." },
        { status: 400 }
      );
    }

    if (!payoutDetails || typeof payoutDetails !== "object") {
      return NextResponse.json(
        { error: "Payout details (UPI ID or Bank Details) are required." },
        { status: 400 }
      );
    }

    if (payoutMethod === "upi" && (!payoutDetails.upiId || !payoutDetails.upiId.trim())) {
      return NextResponse.json({ error: "Valid UPI ID is required for UPI payout." }, { status: 400 });
    }

    if (
      payoutMethod === "bank_transfer" &&
      (!payoutDetails.bankAccount || !payoutDetails.ifscCode || !payoutDetails.accountHolderName)
    ) {
      return NextResponse.json(
        { error: "Bank account number, IFSC code, and account holder name are required for bank transfer." },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    const creatorEarnings = user.creatorEarnings || 0;

    // Strict validation: Only creatorEarnings can be withdrawn! Regular promotional activity coins cannot be withdrawn to cash.
    if (withdrawAmount > creatorEarnings) {
      return NextResponse.json(
        {
          error: "INSUFFICIENT_EARNINGS",
          message: `Insufficient withdrawable creator earnings. You have ${creatorEarnings} withdrawable coins from course sales. Regular promotional/activity coins cannot be withdrawn to cash.`,
          creatorEarnings,
          requestedAmount: withdrawAmount,
        },
        { status: 400 }
      );
    }

    const wallet = await getOrCreateUserWallet(user._id);

    const dbSession = await mongoose.startSession();
    let withdrawalReq;

    try {
      await dbSession.withTransaction(async () => {
        // Deduct from creatorEarnings & update stored payout details
        user.creatorEarnings -= withdrawAmount;
        user.payoutDetails = {
          ...(user.payoutDetails || {}),
          ...payoutDetails,
        };
        await user.save({ session: dbSession });

        // Record Withdrawal Request
        const [reqDoc] = await WithdrawalRequest.create(
          [
            {
              userId: user._id,
              amount: withdrawAmount,
              payoutMethod,
              payoutDetails,
              status: "pending",
            },
          ],
          { session: dbSession }
        );
        withdrawalReq = reqDoc;

        // Record Ledger Transaction
        await CoinTransaction.create(
          [
            {
              fromWalletAddress: wallet.address,
              toWalletAddress: "SYSTEM_EARNINGS_PAYOUT_RESERVE",
              amount: withdrawAmount,
              type: "creator_withdrawal",
              status: "pending",
              metadata: {
                payoutMethod,
                withdrawalRequestId: reqDoc._id,
                note: `Withdrawal request of ${withdrawAmount} coins via ${payoutMethod}`,
              },
            },
          ],
          { session: dbSession }
        );
      });
    } catch (txError) {
      console.warn("MongoDB transaction fallback for withdrawal request:", txError);

      user.creatorEarnings -= withdrawAmount;
      user.payoutDetails = {
        ...(user.payoutDetails || {}),
        ...payoutDetails,
      };
      await user.save();

      withdrawalReq = await WithdrawalRequest.create({
        userId: user._id,
        amount: withdrawAmount,
        payoutMethod,
        payoutDetails,
        status: "pending",
      });

      await CoinTransaction.create({
        fromWalletAddress: wallet.address,
        toWalletAddress: "SYSTEM_EARNINGS_PAYOUT_RESERVE",
        amount: withdrawAmount,
        type: "creator_withdrawal",
        status: "pending",
        metadata: {
          payoutMethod,
          withdrawalRequestId: withdrawalReq._id,
          note: `Withdrawal request of ${withdrawAmount} coins via ${payoutMethod}`,
        },
      });
    } finally {
      await dbSession.endSession();
    }

    return NextResponse.json({
      message: `Withdrawal request of ${withdrawAmount} coins submitted successfully!`,
      withdrawalRequest: withdrawalReq,
      remainingCreatorEarnings: user.creatorEarnings,
    });
  } catch (error) {
    console.error("Withdrawal API error:", error);
    return NextResponse.json({ error: "Failed to process withdrawal request." }, { status: 500 });
  }
}
