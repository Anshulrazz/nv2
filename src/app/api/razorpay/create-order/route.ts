import { NextResponse } from "next/server";
import { auth } from "@/auth";
import Razorpay from "razorpay";
import { connectToDatabase } from "@/lib/mongodb";
import { Coupon } from "@/models/Coupon";
import { PaymentOrder } from "@/models/PaymentOrder";

const PLAN_PRICING_INR = {
  monthly: 49,
  yearly: 399,
} as const;

export async function POST(req: Request) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized. Please sign in first." }, { status: 401 });
    }

    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_SECRET;

    if (!keyId || !keySecret) {
      return NextResponse.json(
        { error: "Razorpay credentials are not configured on the server." },
        { status: 500 }
      );
    }

    const body = await req.json();
    const { type, plan, coinsRequested, amountINR, couponCode } = body || {};

    if (type !== "buy_coins" && type !== "subscription") {
      return NextResponse.json(
        { error: "Invalid payment type. Must be 'buy_coins' or 'subscription'." },
        { status: 400 }
      );
    }

    await connectToDatabase();

    let baseINR = 0;
    let coinsToDeliver = 0;
    let selectedPlan: "monthly" | "yearly" | undefined = undefined;

    if (type === "subscription") {
      if (plan !== "monthly" && plan !== "yearly") {
        return NextResponse.json(
          { error: "Invalid subscription plan. Choose 'monthly' or 'yearly'." },
          { status: 400 }
        );
      }
      selectedPlan = plan;
      baseINR = PLAN_PRICING_INR[plan as keyof typeof PLAN_PRICING_INR];
      coinsToDeliver = plan === "monthly" ? 500 : 5000;
    } else {
      // type === "buy_coins"
      const reqCoins = typeof coinsRequested === "number" && coinsRequested > 0 ? coinsRequested : 0;
      const reqINR = typeof amountINR === "number" && amountINR > 0 ? amountINR : 0;

      if (!reqCoins && !reqINR) {
        return NextResponse.json(
          { error: "Please enter an amount or select a coin package." },
          { status: 400 }
        );
      }

      if (reqCoins === 5000 || reqINR === 400) {
        baseINR = 400;
        coinsToDeliver = 5000;
      } else if (reqCoins === 500 || reqINR === 50) {
        baseINR = 50;
        coinsToDeliver = 500;
      } else if (reqCoins === 100 || reqINR === 10) {
        baseINR = 10;
        coinsToDeliver = 100;
      } else if (reqINR > 0) {
        baseINR = reqINR;
        coinsToDeliver = reqCoins || reqINR * 10;
      } else {
        coinsToDeliver = reqCoins;
        baseINR = Math.ceil(reqCoins / 10);
      }
    }

    let finalINR = baseINR;
    let appliedCoupon: string | null = null;

    // Apply Coupon Code if provided
    if (couponCode && typeof couponCode === "string" && couponCode.trim()) {
      const cleanCode = couponCode.trim().toUpperCase();
      const coupon = await Coupon.findOne({ code: cleanCode, isActive: true });

      if (coupon && new Date() <= new Date(coupon.validUntil) && coupon.usedCount < coupon.maxUses) {
        const isApplicable =
          coupon.applicableFor === "all" ||
          (type === "subscription" && coupon.applicableFor === "subscription") ||
          (type === "buy_coins" && coupon.applicableFor === "coins");

        if (isApplicable) {
          if (coupon.discountType === "percentage") {
            const discount = Math.round((baseINR * coupon.discountValue) / 100);
            finalINR = Math.max(1, baseINR - discount);
          } else {
            finalINR = Math.max(1, baseINR - coupon.discountValue);
          }
          appliedCoupon = coupon.code;
        }
      }
    }

    // Razorpay minimum amount is 1 INR (100 paise)
    if (finalINR < 1) {
      finalINR = 1;
    }

    const amountInPaise = Math.round(finalINR * 100);

    const razorpay = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });

    const receipt = `rcpt_${Date.now()}_${userId.slice(-6)}`;
    const razorpayOrder = await razorpay.orders.create({
      amount: amountInPaise,
      currency: "INR",
      receipt,
      notes: {
        userId,
        type,
        plan: selectedPlan || "",
        coinsToDeliver: String(coinsToDeliver),
        appliedCoupon: appliedCoupon || "",
      },
    });

    // Save order in database
    await PaymentOrder.create({
      userId,
      razorpayOrderId: razorpayOrder.id,
      amountINR: finalINR,
      coinsDelivered: coinsToDeliver,
      type,
      plan: selectedPlan || null,
      status: "created",
      appliedCoupon,
      metadata: {
        baseINR,
        amountInPaise,
        receipt,
        currency: "INR",
      },
    });

    return NextResponse.json({
      orderId: razorpayOrder.id,
      amount: amountInPaise,
      amountINR: finalINR,
      currency: "INR",
      keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || keyId,
      type,
      plan: selectedPlan,
      coinsToDeliver,
      appliedCoupon,
    });
  } catch (error: unknown) {
    console.error("Error creating Razorpay order:", error);
    const message = error instanceof Error ? error.message : "Failed to create payment order.";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
