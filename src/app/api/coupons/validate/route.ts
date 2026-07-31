import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Coupon } from "@/models/Coupon";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { code, amount } = body || {};

    if (!code || typeof code !== "string" || !code.trim()) {
      return NextResponse.json(
        { error: "Coupon code is required." },
        { status: 400 }
      );
    }

    const cleanCode = code.trim().toUpperCase();
    await connectToDatabase();

    const coupon = await Coupon.findOne({ code: cleanCode, isActive: true });

    if (!coupon) {
      return NextResponse.json(
        { error: "Invalid or expired coupon code." },
        { status: 404 }
      );
    }

    if (new Date() > new Date(coupon.validUntil)) {
      return NextResponse.json(
        { error: "This coupon code has expired." },
        { status: 400 }
      );
    }

    if (coupon.usedCount >= coupon.maxUses) {
      return NextResponse.json(
        { error: "This coupon code usage limit has been reached." },
        { status: 400 }
      );
    }

    const originalAmount = typeof amount === "number" && amount > 0 ? amount : 0;
    if (originalAmount > 0 && originalAmount < coupon.minPurchaseAmount) {
      return NextResponse.json(
        { error: `Minimum purchase amount of ₹${coupon.minPurchaseAmount} required for this coupon.` },
        { status: 400 }
      );
    }

    let discountAmount = 0;
    if (coupon.discountType === "percentage") {
      discountAmount = (originalAmount * coupon.discountValue) / 100;
    } else {
      discountAmount = Math.min(originalAmount || coupon.discountValue, coupon.discountValue);
    }

    const finalAmount = Math.max(0, originalAmount - discountAmount);

    return NextResponse.json({
      success: true,
      code: coupon.code,
      description: coupon.description,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      discountAmount,
      finalAmount,
      message: `Coupon '${coupon.code}' applied successfully!`,
    });
  } catch (error) {
    console.error("Failed to validate coupon:", error);
    return NextResponse.json(
      { error: "Internal server error validating coupon." },
      { status: 500 }
    );
  }
}
