// changed by ravi - create razorpay monthly recurring subscription endpoint
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import Razorpay from "razorpay";
import { connectToDatabase } from "@/lib/mongodb";
import { PaymentOrder } from "@/models/PaymentOrder";
import { User } from "@/models/User";

const DEFAULT_PLAN_ID = "plan_TT5V5vOaLSgVtl";
const DEFAULT_SUBSCRIPTION_ID = "sub_TT5Y1breIHPLTs";
const MONTHLY_PRICE_INR = 149;

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

    let subscriptionId = process.env.RAZORPAY_DEFAULT_SUBSCRIPTION_ID || DEFAULT_SUBSCRIPTION_ID;

    // If Razorpay API credentials exist, attempt creating subscription directly via Razorpay SDK
    if (keyId && keySecret) {
      try {
        const razorpay = new Razorpay({
          key_id: keyId,
          key_secret: keySecret,
        });

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
        }
      } catch (rzpErr) {
        console.warn("Razorpay subscription creation fallback (using default configured ID):", rzpErr);
        subscriptionId = DEFAULT_SUBSCRIPTION_ID;
      }
    }

    // Save pending subscription order in database (changed by ravi - unique razorpayOrderId)
    await PaymentOrder.create({
      userId,
      razorpayOrderId: `sub_order_${subscriptionId}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      razorpaySubscriptionId: subscriptionId,
      razorpayPlanId: planId,
      amountINR: MONTHLY_PRICE_INR,
      coinsDelivered: 500,
      type: "subscription",
      plan: "monthly",
      status: "created",
      metadata: {
        subscriptionId,
        planId,
        monthlyPriceINR: MONTHLY_PRICE_INR,
        period: "monthly",
      },
    });

    return NextResponse.json({
      success: true,
      subscriptionId,
      planId,
      amountINR: MONTHLY_PRICE_INR,
      keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || keyId || "rzp_test_fallback",
      plan: "monthly",
      user: {
        name: user?.name || "",
        email: user?.email || "",
      },
    });
  } catch (error: unknown) {
    console.error("Error creating Razorpay subscription:", error);
    const message = error instanceof Error ? error.message : "Failed to create subscription.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
