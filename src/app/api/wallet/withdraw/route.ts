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
      return NextResponse.json({ error: "Unauthorized. Please sign in first." }, { status: 401 });
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

    // 1 INR = 10 Coins canonical exchange rate
    const amountINR = Number((withdrawAmount / 10).toFixed(2));

    if (payoutMethod !== "upi" && payoutMethod !== "bank_transfer") {
      return NextResponse.json(
        { error: "Please select a valid payout method ('upi' or 'bank_transfer')." },
        { status: 400 }
      );
    }

    if (!payoutDetails || typeof payoutDetails !== "object") {
      return NextResponse.json(
        { error: "Payout details (UPI ID or Bank Account Details) are required." },
        { status: 400 }
      );
    }

    if (payoutMethod === "upi" && (!payoutDetails.upiId || !payoutDetails.upiId.trim())) {
      return NextResponse.json(
        { error: "Valid UPI ID is required (e.g. name@upi or 9876543210@paytm)." },
        { status: 400 }
      );
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

    const isTeacherOrAdmin = user.role === "teacher" || user.role === "admin";
    const creatorEarnings = user.creatorEarnings || 0;
    const coinBalance = user.coins || 0;

    // Total available withdrawable balance
    const availableWithdrawable = isTeacherOrAdmin
      ? creatorEarnings + coinBalance
      : creatorEarnings;

    if (withdrawAmount > availableWithdrawable) {
      return NextResponse.json(
        {
          error: "INSUFFICIENT_EARNINGS",
          message: isTeacherOrAdmin
            ? `Withdrawal amount exceeds your total available balance of ${availableWithdrawable} coins (Creator Earnings: ${creatorEarnings}, Wallet Coins: ${coinBalance}).`
            : `Insufficient withdrawable creator earnings. You have ${creatorEarnings} withdrawable coins (₹${(creatorEarnings / 10).toFixed(2)}) from project and course sales. Regular promotional/activity coins cannot be withdrawn to cash.`,
          creatorEarnings,
          coinBalance,
          availableWithdrawable,
          requestedAmount: withdrawAmount,
          requestedINR: amountINR,
        },
        { status: 400 }
      );
    }

    const wallet = await getOrCreateUserWallet(user._id);

    // Compute balance deduction split
    const deductFromEarnings = Math.min(creatorEarnings, withdrawAmount);
    const deductFromCoins = withdrawAmount - deductFromEarnings;

    const dbSession = await mongoose.startSession();
    let withdrawalReq;

    try {
      await dbSession.withTransaction(async () => {
        user.creatorEarnings = Math.max(0, user.creatorEarnings - deductFromEarnings);
        if (deductFromCoins > 0) {
          user.coins = Math.max(0, user.coins - deductFromCoins);
          wallet.balance = Math.max(0, wallet.balance - deductFromCoins);
          await wallet.save({ session: dbSession });
        }

        user.payoutDetails = {
          ...(user.payoutDetails || {}),
          ...payoutDetails,
        };
        await user.save({ session: dbSession });

        // Record Withdrawal Request with amount (coins) and amountINR (rupees)
        const [reqDoc] = await WithdrawalRequest.create(
          [
            {
              userId: user._id,
              userRole: user.role || "user",
              amount: withdrawAmount,
              amountINR,
              payoutMethod,
              payoutDetails: {
                upiId: payoutDetails.upiId?.trim() || "",
                bankAccount: payoutDetails.bankAccount?.trim() || "",
                ifscCode: payoutDetails.ifscCode?.trim()?.toUpperCase() || "",
                accountHolderName: payoutDetails.accountHolderName?.trim() || "",
              },
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
                userRole: user.role,
                withdrawalRequestId: reqDoc._id,
                deductFromEarnings,
                deductFromCoins,
                amountINR,
                exchangeRate: "1 INR = 10 Coins",
                note: `Withdrawal request of ₹${amountINR} (${withdrawAmount} coins) via ${payoutMethod === "upi" ? "UPI" : "Bank Transfer"} (${user.role.toUpperCase()})`,
              },
            },
          ],
          { session: dbSession }
        );
      });
    } catch (txError) {
      console.warn("MongoDB transaction fallback for withdrawal request:", txError);

      user.creatorEarnings = Math.max(0, user.creatorEarnings - deductFromEarnings);
      if (deductFromCoins > 0) {
        user.coins = Math.max(0, user.coins - deductFromCoins);
        wallet.balance = Math.max(0, wallet.balance - deductFromCoins);
        await wallet.save();
      }

      user.payoutDetails = {
        ...(user.payoutDetails || {}),
        ...payoutDetails,
      };
      await user.save();

      withdrawalReq = await WithdrawalRequest.create({
        userId: user._id,
        userRole: user.role || "user",
        amount: withdrawAmount,
        amountINR,
        payoutMethod,
        payoutDetails: {
          upiId: payoutDetails.upiId?.trim() || "",
          bankAccount: payoutDetails.bankAccount?.trim() || "",
          ifscCode: payoutDetails.ifscCode?.trim()?.toUpperCase() || "",
          accountHolderName: payoutDetails.accountHolderName?.trim() || "",
        },
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
          userRole: user.role,
          withdrawalRequestId: withdrawalReq._id,
          deductFromEarnings,
          deductFromCoins,
          amountINR,
          exchangeRate: "1 INR = 10 Coins",
          note: `Withdrawal request of ₹${amountINR} (${withdrawAmount} coins) via ${payoutMethod === "upi" ? "UPI" : "Bank Transfer"} (${user.role.toUpperCase()})`,
        },
      });
    } finally {
      await dbSession.endSession();
    }

    return NextResponse.json({
      message: `Withdrawal request of ₹${amountINR} (${withdrawAmount} coins) submitted successfully via ${payoutMethod === "upi" ? "UPI" : "Bank Transfer"}! Funds will be transferred to your account within 24–48 hours.`,
      withdrawalRequest: withdrawalReq,
      amountINR,
      remainingCreatorEarnings: user.creatorEarnings,
      remainingCoins: user.coins,
      walletBalance: wallet.balance,
    });
  } catch (error) {
    console.error("Withdrawal API error:", error);
    return NextResponse.json({ error: "Failed to process withdrawal request." }, { status: 500 });
  }
}
