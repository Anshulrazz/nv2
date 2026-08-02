import { NextResponse } from "next/server";
import { auth } from "@/auth";
import crypto from "crypto";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/mongodb";
import { PaymentOrder } from "@/models/PaymentOrder";
import { User } from "@/models/User";
import { Coupon } from "@/models/Coupon";
import { CoinTransaction } from "@/models/CoinTransaction";
import { getOrCreateUserWallet } from "@/lib/wallet";

export async function POST(req: Request) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized. Please sign in first." }, { status: 401 });
    }

    const secret = process.env.RAZORPAY_SECRET;
    if (!secret) {
      return NextResponse.json(
        { error: "Razorpay secret is not configured on the server." },
        { status: 500 }
      );
    }

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = await req.json();

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        { error: "Missing required payment verification parameters." },
        { status: 400 }
      );
    }

    // Verify Razorpay HMAC-SHA256 signature
    const bodyToSign = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(bodyToSign)
      .digest("hex");

    const isSignatureValid = expectedSignature === razorpay_signature;

    await connectToDatabase();

    const paymentOrder = await PaymentOrder.findOne({ razorpayOrderId: razorpay_order_id });

    if (!paymentOrder) {
      return NextResponse.json(
        { error: "Payment order record not found." },
        { status: 404 }
      );
    }

    if (!isSignatureValid) {
      paymentOrder.status = "failed";
      await paymentOrder.save();
      return NextResponse.json(
        { error: "Payment signature verification failed. Invalid transaction." },
        { status: 400 }
      );
    }

    // Idempotency: check if already processed
    if (paymentOrder.status === "paid") {
      const user = await User.findById(userId);
      const wallet = user ? await getOrCreateUserWallet(user._id) : null;

      return NextResponse.json({
        success: true,
        message: "Payment verified successfully (Already processed).",
        isPremium: Boolean(user?.isPremium),
        coins: user?.coins ?? 0,
        walletBalance: wallet?.balance ?? 0,
      });
    }

    const user = await User.findById(paymentOrder.userId);
    if (!user) {
      return NextResponse.json({ error: "Associated user not found." }, { status: 404 });
    }

    const wallet = await getOrCreateUserWallet(user._id);

    const now = new Date();
    const coinsToDeliver = paymentOrder.coinsDelivered || 0;

    const dbSession = await mongoose.startSession();
    try {
      await dbSession.withTransaction(async () => {
        paymentOrder.status = "paid";
        paymentOrder.razorpayPaymentId = razorpay_payment_id;
        paymentOrder.razorpaySignature = razorpay_signature;
        await paymentOrder.save({ session: dbSession });

        if (paymentOrder.type === "subscription") {
          const expiryDate = new Date(now);
          if (paymentOrder.plan === "yearly") {
            expiryDate.setDate(expiryDate.getDate() + 365);
          } else {
            expiryDate.setDate(expiryDate.getDate() + 30);
          }

          user.isPremium = true;
          user.isPremiumUser = true;
          user.premiumSince = now;
          user.premiumPlan = paymentOrder.plan || "monthly";
          user.premiumExpiresAt = expiryDate;

          if (coinsToDeliver > 0) {
            user.coins = (user.coins || 0) + coinsToDeliver;
            wallet.balance += coinsToDeliver;
          }

          await user.save({ session: dbSession });
          await wallet.save({ session: dbSession });

          await CoinTransaction.create(
            [
              {
                fromWalletAddress: "RAZORPAY_INR_GATEWAY",
                toWalletAddress: wallet.address,
                amount: coinsToDeliver,
                type: "premium_purchase",
                status: "completed",
                metadata: {
                  razorpayOrderId: razorpay_order_id,
                  razorpayPaymentId: razorpay_payment_id,
                  amountINR: paymentOrder.amountINR,
                  plan: paymentOrder.plan,
                  premiumExpiresAt: expiryDate,
                  couponCode: paymentOrder.appliedCoupon,
                  note: `Paid ₹${paymentOrder.amountINR} via Razorpay for ${paymentOrder.plan} premium subscription`,
                },
              },
            ],
            { session: dbSession }
          );
        } else {
          // type === "buy_coins"
          user.coins = (user.coins || 0) + coinsToDeliver;
          wallet.balance += coinsToDeliver;

          await user.save({ session: dbSession });
          await wallet.save({ session: dbSession });

          await CoinTransaction.create(
            [
              {
                fromWalletAddress: "RAZORPAY_INR_GATEWAY",
                toWalletAddress: wallet.address,
                amount: coinsToDeliver,
                type: "buy_coins",
                status: "completed",
                metadata: {
                  razorpayOrderId: razorpay_order_id,
                  razorpayPaymentId: razorpay_payment_id,
                  amountINR: paymentOrder.amountINR,
                  couponCode: paymentOrder.appliedCoupon,
                  note: `Paid ₹${paymentOrder.amountINR} via Razorpay to buy ${coinsToDeliver} coins`,
                },
              },
            ],
            { session: dbSession }
          );
        }

        // Increment coupon count if coupon was used
        if (paymentOrder.appliedCoupon) {
          const coupon = await Coupon.findOne({ code: paymentOrder.appliedCoupon });
          if (coupon) {
            coupon.usedCount += 1;
            await coupon.save({ session: dbSession });
          }
        }
      });
    } catch (txError) {
      console.warn("MongoDB transaction fallback for Razorpay payment verification:", txError);

      paymentOrder.status = "paid";
      paymentOrder.razorpayPaymentId = razorpay_payment_id;
      paymentOrder.razorpaySignature = razorpay_signature;
      await paymentOrder.save();

      if (paymentOrder.type === "subscription") {
        const expiryDate = new Date(now);
        if (paymentOrder.plan === "yearly") {
          expiryDate.setDate(expiryDate.getDate() + 365);
        } else {
          expiryDate.setDate(expiryDate.getDate() + 30);
        }

        user.isPremium = true;
        user.isPremiumUser = true;
        user.premiumSince = now;
        user.premiumPlan = paymentOrder.plan || "monthly";
        user.premiumExpiresAt = expiryDate;

        if (coinsToDeliver > 0) {
          user.coins = (user.coins || 0) + coinsToDeliver;
          wallet.balance += coinsToDeliver;
        }

        await user.save();
        await wallet.save();

        await CoinTransaction.create({
          fromWalletAddress: "RAZORPAY_INR_GATEWAY",
          toWalletAddress: wallet.address,
          amount: coinsToDeliver,
          type: "premium_purchase",
          status: "completed",
          metadata: {
            razorpayOrderId: razorpay_order_id,
            razorpayPaymentId: razorpay_payment_id,
            amountINR: paymentOrder.amountINR,
            plan: paymentOrder.plan,
            premiumExpiresAt: expiryDate,
            couponCode: paymentOrder.appliedCoupon,
            note: `Paid ₹${paymentOrder.amountINR} via Razorpay for ${paymentOrder.plan} premium subscription`,
          },
        });
      } else {
        user.coins = (user.coins || 0) + coinsToDeliver;
        wallet.balance += coinsToDeliver;

        await user.save();
        await wallet.save();

        await CoinTransaction.create({
          fromWalletAddress: "RAZORPAY_INR_GATEWAY",
          toWalletAddress: wallet.address,
          amount: coinsToDeliver,
          type: "buy_coins",
          status: "completed",
          metadata: {
            razorpayOrderId: razorpay_order_id,
            razorpayPaymentId: razorpay_payment_id,
            amountINR: paymentOrder.amountINR,
            couponCode: paymentOrder.appliedCoupon,
            note: `Paid ₹${paymentOrder.amountINR} via Razorpay to buy ${coinsToDeliver} coins`,
          },
        });
      }

      if (paymentOrder.appliedCoupon) {
        const coupon = await Coupon.findOne({ code: paymentOrder.appliedCoupon });
        if (coupon) {
          coupon.usedCount += 1;
          await coupon.save();
        }
      }
    } finally {
      await dbSession.endSession();
    }

    return NextResponse.json({
      success: true,
      message:
        paymentOrder.type === "subscription"
          ? `Payment successful! Welcome to Notexia Premium (${paymentOrder.plan} plan) ✨`
          : `Payment successful! Added ${coinsToDeliver} coins to your balance. 🎉`,
      type: paymentOrder.type,
      plan: paymentOrder.plan,
      isPremium: user.isPremium,
      premiumExpiresAt: user.premiumExpiresAt,
      coins: user.coins,
      walletBalance: wallet.balance,
    });
  } catch (error: unknown) {
    console.error("Error verifying Razorpay payment:", error);
    const message = error instanceof Error ? error.message : "Failed to verify payment.";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
