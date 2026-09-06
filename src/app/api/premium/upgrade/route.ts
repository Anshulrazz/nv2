import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST() {
  return NextResponse.json(
    {
      error: "Profile upgrades must be purchased via INR payment. Coin-based upgrades are no longer supported. Please use Razorpay checkout with available coupons.",
      code: "INR_PAYMENT_REQUIRED",
    },
    { status: 400 }
  );
}
