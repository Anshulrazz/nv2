// changed by ravi - create razorpay monthly recurring subscription endpoint with smart auto-fallback
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import Razorpay from "razorpay";
import { connectToDatabase } from "@/lib/mongodb";
import { PaymentOrder } from "@/models/PaymentOrder";
import { Coupon } from "@/models/Coupon";
import { User } from "@/models/User";

const DEFAULT_PLAN_ID = "plan_TT5V5vOaLSgVtl";
const DEFAULT_SUBSCRIPTION_ID = "sub_TT5Y1breIHPLTs";
const BASE_MONTHLY_PRICE_INR = 149;

export async function POST(req: Request) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized. Please sign in first." }, { status: 401 });
    }

    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_SECRET;
    const planId = process.env.RAZORPAY_MONTHLY_PLAN_ID || DEFAULT_PLAN_ID;

    await connectToDatabase();
    const user = await User.findById(userId);

    const body = await req.json().catch(() => ({}));
    const { couponCode } = body || {};

    let finalINR = BASE_MONTHLY_PRICE_INR;
    let appliedCoupon: string | null = null;

    // Apply coupon if provided
    if (couponCode && typeof couponCode === "string" && couponCode.trim()) {
      const cleanCode = couponCode.trim().toUpperCase();
      const coupon = await Coupon.findOne({ code: cleanCode, isActive: true });
      if (coupon && new Date() <= new Date(coupon.validUntil) && coupon.usedCount < coupon.maxUses) {
        if (coupon.applicableFor === "all" || coupon.applicableFor === "subscription") {
          if (coupon.discountType === "percentage") {
            const discount = Math.round((BASE_MONTHLY_PRICE_INR * coupon.discountValue) / 100);
            finalINR = Math.max(1, BASE_MONTHLY_PRICE_INR - discount);
          } else {
            finalINR = Math.max(1, BASE_MONTHLY_PRICE_INR - coupon.discountValue);
          }
          appliedCoupon = coupon.code;
        }
      }
    }

    if (!keyId || !keySecret) {
      return NextResponse.json(
        { error: "Razorpay credentials are not configured on the server." },
        { status: 500 }
      );
    }

    const razorpay = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });

    let subscriptionId: string | null = null;
    let isSubscriptionCreated = false;

    // Only attempt Razorpay subscription API if no coupon discount altered the recurring base price
    if (finalINR === BASE_MONTHLY_PRICE_INR) {
      try {
        const subscription = await razorpay.subscriptions.create({
          plan_id: planId,
          total_count: 12, // 12 monthly renewal cycles
          quantity: 1,
          customer_notify: 1,
          notes: {
            userId: userId.toString(),
            plan: "monthly",
            email: user?.email || "",
            name: user?.name || "",
          },
        });

        if (subscription && subscription.id) {
          subscriptionId = subscription.id;
          isSubscriptionCreated = true;
        }
      } catch (rzpErr) {
        console.warn(
          "Razorpay subscription API note: plan_id not found on current API key or e-Mandate not enabled. Auto-switching to instant monthly order fallback.",
          rzpErr
        );
      }
    }

    // If subscription succeeded, record subscription order and return subscription_id
    if (isSubscriptionCreated && subscriptionId) {
      await PaymentOrder.create({
        userId,
        razorpayOrderId: `sub_order_${subscriptionId}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        razorpaySubscriptionId: subscriptionId,
        razorpayPlanId: planId,
        amountINR: finalINR,
        coinsDelivered: 500,
        type: "subscription",
        plan: "monthly",
        status: "created",
        appliedCoupon,
        metadata: {
          subscriptionId,
          planId,
          monthlyPriceINR: finalINR,
          mode: "recurring_subscription",
        },
      });

      return NextResponse.json({
        success: true,
        mode: "subscription",
        subscriptionId,
        planId,
        amountINR: finalINR,
        keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || keyId,
        plan: "monthly",
        appliedCoupon,
        user: {
          name: user?.name || "",
          email: user?.email || "",
        },
      });
    }

    // Fallback: Create instant Razorpay Order for monthly plan (149 INR)
    const amountInPaise = Math.round(finalINR * 100);
    const receipt = `sub_m_${Date.now()}_${userId.slice(-6)}`;
    const razorpayOrder = await razorpay.orders.create({
      amount: amountInPaise,
      currency: "INR",
      receipt,
      notes: {
        userId: userId.toString(),
        type: "subscription",
        plan: "monthly",
        coinsToDeliver: "500",
        appliedCoupon: appliedCoupon || "",
      },
    });

    await PaymentOrder.create({
      userId,
      razorpayOrderId: razorpayOrder.id,
      razorpayPlanId: planId,
      amountINR: finalINR,
      coinsDelivered: 500,
      type: "subscription",
      plan: "monthly",
      status: "created",
      appliedCoupon,
      metadata: {
        mode: "monthly_order",
        receipt,
        amountInPaise,
      },
    });

    return NextResponse.json({
      success: true,
      mode: "order",
      orderId: razorpayOrder.id,
      amount: amountInPaise,
      amountINR: finalINR,
      currency: "INR",
      keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || keyId,
      plan: "monthly",
      appliedCoupon,
      user: {
        name: user?.name || "",
        email: user?.email || "",
      },
    });
  } catch (error: unknown) {
    console.error("Error creating Razorpay subscription/order:", error);
    const message = error instanceof Error ? error.message : "Failed to initiate subscription.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
