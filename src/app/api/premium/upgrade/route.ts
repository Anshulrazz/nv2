// changed by ravi - updated coin-based premium upgrade endpoint
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/models/User";
import { Coupon } from "@/models/Coupon";
import { CoinTransaction } from "@/models/CoinTransaction";
import { PaymentOrder } from "@/models/PaymentOrder";
import { getOrCreateUserWallet } from "@/lib/wallet";
import { memoryCache } from "@/lib/cache";

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
    // changed by ravi - extend active expiry if already premium instead of resetting
    const currentExpiry =
      user.isPremium && user.premiumExpiresAt && new Date(user.premiumExpiresAt) > now
        ? new Date(user.premiumExpiresAt)
        : new Date(now);

    const expiryDate = new Date(currentExpiry);
    if (plan === "monthly") {
      expiryDate.setDate(expiryDate.getDate() + 30);
    } else {
      expiryDate.setDate(expiryDate.getDate() + 365);
    }

    const dbSession = await mongoose.startSession();
    try {
      await dbSession.withTransaction(async () => {
        // Deduct coins from user & wallet
        user.coins = Math.max(0, (user.coins || 0) - finalCost);
        user.isPremium = true;
        user.isPremiumUser = true;
        user.premiumSince = user.premiumSince || now;
        user.premiumPlan = plan;
        user.premiumExpiresAt = expiryDate;
        await user.save({ session: dbSession });

        wallet.balance = Math.max(0, wallet.balance - finalCost);
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
                note: `Purchased ${plan} premium subscription using ${finalCost} coins`,
              },
            },
          ],
          { session: dbSession }
        );

        // Record unified payment order (changed by ravi - unique razorpayOrderId to avoid legacy index collisions)
        await PaymentOrder.create(
          [
            {
              userId: user._id,
              razorpayOrderId: `coins_order_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
              amountINR: 0,
              coinsDelivered: 0,
              type: "subscription",
              plan,
              status: "paid",
              appliedCoupon: appliedCoupon || null,
              metadata: {
                paymentMethod: "coins",
                coinsCost: finalCost,
                premiumExpiresAt: expiryDate,
              },
            },
          ],
          { session: dbSession }
        );
      });
    } catch (txError) {
      console.warn("MongoDB transaction fallback for premium upgrade:", txError);
      // Fallback for standalone Mongo instances without replica set
      user.coins = Math.max(0, (user.coins || 0) - finalCost);
      user.isPremium = true;
      user.isPremiumUser = true;
      user.premiumSince = user.premiumSince || now;
      user.premiumPlan = plan;
      user.premiumExpiresAt = expiryDate;
      await user.save();

      wallet.balance = Math.max(0, wallet.balance - finalCost);
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
          note: `Purchased ${plan} premium subscription using ${finalCost} coins`,
        },
      });

      await PaymentOrder.create({
        userId: user._id,
        razorpayOrderId: `coins_order_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
        amountINR: 0,
        coinsDelivered: 0,
        type: "subscription",
        plan,
        status: "paid",
        appliedCoupon: appliedCoupon || null,
        metadata: {
          paymentMethod: "coins",
          coinsCost: finalCost,
          premiumExpiresAt: expiryDate,
        },
      });
    } finally {
      await dbSession.endSession();
    }

    // Invalidate premium status cache
    memoryCache.delete(`user:premium:${userId}`);

    return NextResponse.json({
      success: true,
      message: `Congratulations! You are now a Premium member (${plan} plan). ✨`,
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
