import { NextResponse } from "next/server";
import crypto from "crypto";
import { connectToDatabase } from "@/lib/mongodb";
import { PaymentOrder } from "@/models/PaymentOrder";
import { User } from "@/models/User";
import { Coupon } from "@/models/Coupon";
import { CoinTransaction } from "@/models/CoinTransaction";
import { getOrCreateUserWallet } from "@/lib/wallet";

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const razorpaySignature = req.headers.get("x-razorpay-signature");

    const secret = process.env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_SECRET;

    if (secret && razorpaySignature) {
      const expectedSignature = crypto
        .createHmac("sha256", secret)
        .update(rawBody)
        .digest("hex");

      if (expectedSignature !== razorpaySignature) {
        return NextResponse.json({ error: "Invalid webhook signature" }, { status: 400 });
      }
    }

    const payload = JSON.parse(rawBody);
    const event = payload?.event;

    if (event === "payment.captured" || event === "order.paid") {
      const entity = payload?.payload?.payment?.entity || payload?.payload?.order?.entity;
      const razorpayOrderId = entity?.order_id || entity?.id;
      const razorpayPaymentId = entity?.id;

      if (razorpayOrderId) {
        await connectToDatabase();
        const paymentOrder = await PaymentOrder.findOne({ razorpayOrderId });

        if (paymentOrder && paymentOrder.status !== "paid") {
          const user = await User.findById(paymentOrder.userId);
          if (user) {
            const wallet = await getOrCreateUserWallet(user._id);
            const now = new Date();
            const coinsToDeliver = paymentOrder.coinsDelivered || 0;

            paymentOrder.status = "paid";
            if (razorpayPaymentId) paymentOrder.razorpayPaymentId = razorpayPaymentId;
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
                  razorpayOrderId,
                  razorpayPaymentId,
                  amountINR: paymentOrder.amountINR,
                  plan: paymentOrder.plan,
                  note: "Webhook verified payment capture for premium subscription",
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
                  razorpayOrderId,
                  razorpayPaymentId,
                  amountINR: paymentOrder.amountINR,
                  note: "Webhook verified payment capture for buying coins",
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
          }
        }
      }
    }

    return NextResponse.json({ status: "ok" });
  } catch (error: unknown) {
    console.error("Razorpay webhook error:", error);
    const message = error instanceof Error ? error.message : "Webhook error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
