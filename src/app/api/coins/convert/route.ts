import { NextResponse } from "next/server";
import { auth } from "@/auth";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/models/User";
import { Coupon } from "@/models/Coupon";
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
    const { amountINR, coinsRequested, couponCode } = body || {};

    let targetCoins = typeof coinsRequested === "number" && coinsRequested > 0 ? coinsRequested : 0;
    let baseINR = typeof amountINR === "number" && amountINR > 0 ? amountINR : 0;

    if (!targetCoins && !baseINR) {
      return NextResponse.json({ error: "Please specify coins or INR amount to convert." }, { status: 400 });
    }

    // Default rate: 10 coins per 1 INR (or ₹10 = 100 coins)
    if (!targetCoins && baseINR) {
      targetCoins = baseINR * 10;
    } else if (targetCoins && !baseINR) {
      baseINR = Math.ceil(targetCoins / 10);
    }

    let finalINR = baseINR;
    let bonusCoins = 0;
    let appliedCoupon: string | undefined = undefined;

    await connectToDatabase();

    // Process coupon for discount or bonus coins
    if (couponCode && typeof couponCode === "string" && couponCode.trim()) {
      const cleanCode = couponCode.trim().toUpperCase();
      const coupon = await Coupon.findOne({ code: cleanCode, isActive: true });
      if (coupon && new Date() <= new Date(coupon.validUntil) && coupon.usedCount < coupon.maxUses) {
        if (coupon.applicableFor === "coins" || coupon.applicableFor === "all") {
          if (coupon.discountType === "percentage") {
            const discount = Math.round((baseINR * coupon.discountValue) / 100);
            finalINR = Math.max(0, baseINR - discount);
          } else {
            // Fixed discount or bonus coins
            finalINR = Math.max(0, baseINR - coupon.discountValue);
            bonusCoins = coupon.discountValue * 10;
          }
          appliedCoupon = coupon.code;
          coupon.usedCount += 1;
          await coupon.save();
        }
      }
    }

    const totalCoinsToDeliver = targetCoins + bonusCoins;

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const wallet = await getOrCreateUserWallet(user._id);

    const dbSession = await mongoose.startSession();
    try {
      await dbSession.withTransaction(async () => {
        user.coins = (user.coins || 0) + totalCoinsToDeliver;
        await user.save({ session: dbSession });

        wallet.balance += totalCoinsToDeliver;
        await wallet.save({ session: dbSession });

        await CoinTransaction.create(
          [
            {
              fromWalletAddress: "INR_GATEWAY_RESERVE",
              toWalletAddress: wallet.address,
              amount: totalCoinsToDeliver,
              type: "buy_coins",
              status: "completed",
              metadata: {
                inrPaid: finalINR,
                baseCoins: targetCoins,
                bonusCoins,
                couponCode: appliedCoupon,
              },
            },
          ],
          { session: dbSession }
        );
      });
    } catch (txError) {
      console.warn("Transaction fallback for coin conversion:", txError);
      user.coins = (user.coins || 0) + totalCoinsToDeliver;
      await user.save();
      wallet.balance += totalCoinsToDeliver;
      await wallet.save();

      await CoinTransaction.create({
        fromWalletAddress: "INR_GATEWAY_RESERVE",
        toWalletAddress: wallet.address,
        amount: totalCoinsToDeliver,
        type: "buy_coins",
        status: "completed",
        metadata: {
          inrPaid: finalINR,
          baseCoins: targetCoins,
          bonusCoins,
          couponCode: appliedCoupon,
        },
      });
    } finally {
      await dbSession.endSession();
    }

    return NextResponse.json({
      message: `Successfully converted ₹${finalINR} to ${totalCoinsToDeliver} coins!`,
      coinsAdded: totalCoinsToDeliver,
      newCoinBalance: user.coins,
      newWalletBalance: wallet.balance,
      inrPaid: finalINR,
      appliedCoupon,
    });
  } catch (error) {
    console.error("Coin conversion error:", error);
    return NextResponse.json({ error: "Failed to convert coins." }, { status: 500 });
  }
}
