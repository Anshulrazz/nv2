// changed by ravi - verify Razorpay payment: signature-first, premium only on confirmed payment
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
import { memoryCache } from "@/lib/cache";

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

    const body = await req.json();
    const { razorpay_order_id, razorpay_subscription_id, razorpay_payment_id, razorpay_signature } = body || {};

    if (!razorpay_payment_id || !razorpay_signature || (!razorpay_order_id && !razorpay_subscription_id)) {
      return NextResponse.json(
        { error: "Missing required payment verification parameters." },
        { status: 400 }
      );
    }

    // changed by ravi - STEP 1: Verify HMAC-SHA256 signature FIRST before any DB writes
    // Subscription uses: payment_id|subscription_id
    // Order uses:        order_id|payment_id
    const bodyToSign = razorpay_subscription_id
      ? `${razorpay_payment_id}|${razorpay_subscription_id}`
      : `${razorpay_order_id}|${razorpay_payment_id}`;

    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(bodyToSign)
      .digest("hex");

    // Reject immediately if signature is invalid - never activate premium without valid signature
    if (expectedSignature !== razorpay_signature) {
      console.warn(
        `[verify-payment] Invalid Razorpay signature. payment_id=${razorpay_payment_id} subscription_id=${razorpay_subscription_id} order_id=${razorpay_order_id}`
      );
      return NextResponse.json(
        { error: "Payment signature verification failed. This transaction is invalid and has been rejected." },
        { status: 400 }
      );
    }

    // changed by ravi - STEP 2: Signature is valid. Now look up the payment order.
    await connectToDatabase();

    let paymentOrder = razorpay_subscription_id
      ? await PaymentOrder.findOne({ razorpaySubscriptionId: razorpay_subscription_id })
      : await PaymentOrder.findOne({ razorpayOrderId: razorpay_order_id });

    // If paymentOrder not found (edge case: subscription initiated without DB record), create it now
    // This is safe because signature is already verified above.
    if (!paymentOrder && razorpay_subscription_id) {
      paymentOrder = await PaymentOrder.create({
        userId,
        razorpayOrderId: `sub_order_${razorpay_subscription_id}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        razorpaySubscriptionId: razorpay_subscription_id,
        razorpayPlanId: process.env.RAZORPAY_MONTHLY_PLAN_ID || "plan_TT5V5vOaLSgVtl",
        amountINR: 149,
        coinsDelivered: 500,
        type: "subscription",
        plan: "monthly",
        status: "created",
      });
    }

    if (!paymentOrder) {
      return NextResponse.json(
        { error: "Payment order record not found. Cannot activate premium without a valid order." },
        { status: 404 }
      );
    }

    // Idempotency: if already processed, return success without re-processing
    if (paymentOrder.status === "paid" || paymentOrder.status === "active") {
      const user = await User.findById(userId);
      const wallet = user ? await getOrCreateUserWallet(user._id) : null;
      return NextResponse.json({
        success: true,
        message: "Payment already verified and processed.",
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

    // changed by ravi - STEP 3: Activate premium / deliver coins inside transaction
    const dbSession = await mongoose.startSession();
    try {
      await dbSession.withTransaction(async () => {
        paymentOrder.status = "paid";
        paymentOrder.razorpayPaymentId = razorpay_payment_id;
        paymentOrder.razorpaySignature = razorpay_signature;
        await paymentOrder.save({ session: dbSession });

        if (paymentOrder.type === "subscription") {
          // Calculate expiry: extend from current expiry if already active (autopay renewal)
          const expiryBase = user.premiumExpiresAt && new Date(user.premiumExpiresAt) > now
            ? new Date(user.premiumExpiresAt)
            : new Date(now);

          const expiryDate = new Date(expiryBase);
          if (paymentOrder.plan === "yearly") {
            expiryDate.setDate(expiryDate.getDate() + 365);
          } else {
            expiryDate.setDate(expiryDate.getDate() + 30);
          }

          user.isPremium = true;
          user.isPremiumUser = true;
          user.premiumSince = user.premiumSince || now;
          user.premiumPlan = paymentOrder.plan || "monthly";
          user.premiumExpiresAt = expiryDate;

          // Record subscription tracking on user for autopay identification
          if (paymentOrder.razorpaySubscriptionId || razorpay_subscription_id) {
            user.subscriptionId = paymentOrder.razorpaySubscriptionId || razorpay_subscription_id;
            user.razorpayPlanId = paymentOrder.razorpayPlanId || process.env.RAZORPAY_MONTHLY_PLAN_ID || "plan_TT5V5vOaLSgVtl";
            user.subscriptionStatus = "active";
          }

          if (coinsToDeliver > 0) {
            user.coins = (user.coins || 0) + coinsToDeliver;
            wallet.balance += coinsToDeliver;
          }

          await user.save({ session: dbSession });
          await wallet.save({ session: dbSession });

          await CoinTransaction.create(
            [{
              fromWalletAddress: "RAZORPAY_INR_GATEWAY",
              toWalletAddress: wallet.address,
              amount: coinsToDeliver,
              type: "premium_purchase",
              status: "completed",
              metadata: {
                razorpayOrderId: razorpay_order_id || paymentOrder.razorpayOrderId,
                razorpayPaymentId: razorpay_payment_id,
                razorpaySubscriptionId: razorpay_subscription_id || paymentOrder.razorpaySubscriptionId,
                amountINR: paymentOrder.amountINR,
                plan: paymentOrder.plan,
                premiumExpiresAt: expiryDate,
                couponCode: paymentOrder.appliedCoupon,
                note: `Signature-verified payment ₹${paymentOrder.amountINR} via Razorpay for ${paymentOrder.plan} premium subscription`,
              },
            }],
            { session: dbSession }
          );
        } else {
          // type === "buy_coins"
          user.coins = (user.coins || 0) + coinsToDeliver;
          wallet.balance += coinsToDeliver;

          await user.save({ session: dbSession });
          await wallet.save({ session: dbSession });

          await CoinTransaction.create(
            [{
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
                note: `Signature-verified payment ₹${paymentOrder.amountINR} via Razorpay to buy ${coinsToDeliver} coins`,
              },
            }],
            { session: dbSession }
          );
        }

        if (paymentOrder.appliedCoupon) {
          const coupon = await Coupon.findOne({ code: paymentOrder.appliedCoupon });
          if (coupon) {
            coupon.usedCount += 1;
            await coupon.save({ session: dbSession });
          }
        }
      });
    } catch (txError) {
      // Fallback: transaction failed (e.g. replica set not available) — execute sequentially
      console.warn("[verify-payment] MongoDB transaction fallback:", txError);

      paymentOrder.status = "paid";
      paymentOrder.razorpayPaymentId = razorpay_payment_id;
      paymentOrder.razorpaySignature = razorpay_signature;
      await paymentOrder.save();

      if (paymentOrder.type === "subscription") {
        const expiryBase = user.premiumExpiresAt && new Date(user.premiumExpiresAt) > now
          ? new Date(user.premiumExpiresAt)
          : new Date(now);

        const expiryDate = new Date(expiryBase);
        if (paymentOrder.plan === "yearly") {
          expiryDate.setDate(expiryDate.getDate() + 365);
        } else {
          expiryDate.setDate(expiryDate.getDate() + 30);
        }

        user.isPremium = true;
        user.isPremiumUser = true;
        user.premiumSince = user.premiumSince || now;
        user.premiumPlan = paymentOrder.plan || "monthly";
        user.premiumExpiresAt = expiryDate;

        if (paymentOrder.razorpaySubscriptionId || razorpay_subscription_id) {
          user.subscriptionId = paymentOrder.razorpaySubscriptionId || razorpay_subscription_id;
          user.razorpayPlanId = paymentOrder.razorpayPlanId || process.env.RAZORPAY_MONTHLY_PLAN_ID || "plan_TT5V5vOaLSgVtl";
          user.subscriptionStatus = "active";
        }

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
            razorpayOrderId: razorpay_order_id || paymentOrder.razorpayOrderId,
            razorpayPaymentId: razorpay_payment_id,
            razorpaySubscriptionId: razorpay_subscription_id || paymentOrder.razorpaySubscriptionId,
            amountINR: paymentOrder.amountINR,
            plan: paymentOrder.plan,
            note: `Signature-verified payment ₹${paymentOrder.amountINR} via Razorpay (fallback tx) for ${paymentOrder.plan} subscription`,
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
            note: `Signature-verified payment ₹${paymentOrder.amountINR} via Razorpay to buy ${coinsToDeliver} coins`,
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

    // Invalidate premium status memory cache so UI reflects premium instantly
    memoryCache.delete(`user:premium:${userId}`);

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
    console.error("[verify-payment] Error:", error);
    const message = error instanceof Error ? error.message : "Failed to verify payment.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
