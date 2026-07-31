import { NextResponse } from "next/server";
import { auth } from "@/auth";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/models/User";
import { Coupon } from "@/models/Coupon";
import { CoinTransaction } from "@/models/CoinTransaction";
import { getOrCreateUserWallet } from "@/lib/wallet";

const PLAN_PRICING = {
  monthly: 500, // 500 coins for 30 days
  yearly: 5000, // 5000 coins for 365 days
} as const;

export async function POST(req: Request) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { plan, couponCode } = await req.json();
    if (plan !== "monthly" && plan !== "yearly") {
      return NextResponse.json(
        { error: "Invalid plan selected. Please choose 'monthly' or 'yearly'." },
        { status: 400 }
      );
    }

    const baseCost: number = PLAN_PRICING[plan as keyof typeof PLAN_PRICING];
    let finalCost: number = baseCost;
    let appliedCoupon: string | undefined = undefined;

    await connectToDatabase();

    // Process coupon code
    if (couponCode && typeof couponCode === "string" && couponCode.trim()) {
      const cleanCode = couponCode.trim().toUpperCase();
      const coupon = await Coupon.findOne({ code: cleanCode, isActive: true });
      if (coupon && new Date() <= new Date(coupon.validUntil) && coupon.usedCount < coupon.maxUses) {
        if (coupon.applicableFor === "subscription" || coupon.applicableFor === "all") {
          if (coupon.discountType === "percentage") {
            const discount = Math.round((baseCost * coupon.discountValue) / 100);
            finalCost = Math.max(0, baseCost - discount);
          } else {
            finalCost = Math.max(0, baseCost - coupon.discountValue);
          }
          appliedCoupon = coupon.code;
          coupon.usedCount += 1;
          await coupon.save();
        }
      }
    }

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    const wallet = await getOrCreateUserWallet(user._id);

    // Balance check
    if (wallet.balance < finalCost || (user.coins || 0) < finalCost) {
      return NextResponse.json(
        {
          error: "INSUFFICIENT_BALANCE",
          message: `Insufficient coins balance. ${finalCost} coins required for ${plan} premium.`,
          requiredCoins: finalCost,
          currentBalance: wallet.balance,
        },
        { status: 400 }
      );
    }

    const now = new Date();
    const expiryDate = new Date(now);
    if (plan === "monthly") {
      expiryDate.setDate(expiryDate.getDate() + 30);
    } else {
      expiryDate.setDate(expiryDate.getDate() + 365);
    }

    const dbSession = await mongoose.startSession();
    try {
      await dbSession.withTransaction(async () => {
        // Deduct coins from user & wallet
        user.coins -= finalCost;
        user.isPremium = true;
        user.isPremiumUser = true;
        user.premiumSince = now;
        user.premiumPlan = plan;
        user.premiumExpiresAt = expiryDate;
        await user.save({ session: dbSession });

        wallet.balance -= finalCost;
        await wallet.save({ session: dbSession });

        // Record transaction ledger
        await CoinTransaction.create(
          [
            {
              fromWalletAddress: wallet.address,
              toWalletAddress: "SYSTEM_PREMIUM_VAULT",
              amount: finalCost,
              type: "premium_purchase",
              status: "completed",
              metadata: {
                plan,
                baseCost,
                finalCost,
                appliedCoupon,
                premiumExpiresAt: expiryDate,
                note: `Purchased ${plan} premium subscription`,
              },
            },
          ],
          { session: dbSession }
        );
      });
    } catch (txError) {
      console.warn("MongoDB transaction fallback for premium upgrade:", txError);
      // Fallback for standalone Mongo instances without replica set
      user.coins -= finalCost;
      user.isPremium = true;
      user.isPremiumUser = true;
      user.premiumSince = now;
      user.premiumPlan = plan;
      user.premiumExpiresAt = expiryDate;
      await user.save();

      wallet.balance -= finalCost;
      await wallet.save();

      await CoinTransaction.create({
        fromWalletAddress: wallet.address,
        toWalletAddress: "SYSTEM_PREMIUM_VAULT",
        amount: finalCost,
        type: "premium_purchase",
        status: "completed",
        metadata: {
          plan,
          baseCost,
          finalCost,
          appliedCoupon,
          premiumExpiresAt: expiryDate,
          note: `Purchased ${plan} premium subscription`,
        },
      });
    } finally {
      await dbSession.endSession();
    }

    return NextResponse.json({
      message: `Congratulations! You are now a Premium member (${plan} plan).`,
      isPremium: true,
      premiumPlan: plan,
      premiumExpiresAt: expiryDate,
      coins: user.coins,
      walletBalance: wallet.balance,
    });
  } catch (error) {
    console.error("Premium upgrade error:", error);
    return NextResponse.json(
      { error: "Failed to upgrade to premium." },
      { status: 500 }
    );
  }
}
