import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Coupon } from "@/models/Coupon";

const defaultPromotionalCoupons = [
  {
    code: "STUDENT50",
    description: "50% OFF Notexia Premium Monthly & Annual Subscriptions",
    discountType: "percentage",
    discountValue: 50,
    minPurchaseAmount: 0,
    maxUses: 5000,
    usedCount: 142,
    isActive: true,
    applicableFor: "subscription",
    validUntil: new Date("2026-12-31"),
  },
  {
    code: "WELCOME100",
    description: "Get 100 Free Activity Coins & AI Tokens on First Upgrade",
    discountType: "fixed",
    discountValue: 100,
    minPurchaseAmount: 0,
    maxUses: 10000,
    usedCount: 890,
    isActive: true,
    applicableFor: "coins",
    validUntil: new Date("2026-12-31"),
  },
  {
    code: "JEE2026",
    description: "40% Flat Discount for JEE & NEET Competitive Exam Scholars",
    discountType: "percentage",
    discountValue: 40,
    minPurchaseAmount: 0,
    maxUses: 2500,
    usedCount: 68,
    isActive: true,
    applicableFor: "all",
    validUntil: new Date("2026-12-31"),
  },
  {
    code: "VTUPRO",
    description: "35% OFF Annual Engineering Research & Formula Blueprint Pass",
    discountType: "percentage",
    discountValue: 35,
    minPurchaseAmount: 0,
    maxUses: 3000,
    usedCount: 215,
    isActive: true,
    applicableFor: "subscription",
    validUntil: new Date("2026-12-31"),
  },
];

export async function GET() {
  try {
    await connectToDatabase();

    let coupons = await Coupon.find({ isActive: true }).sort({ createdAt: -1 }).lean();

    if (!coupons || coupons.length === 0) {
      await Coupon.insertMany(defaultPromotionalCoupons);
      coupons = await Coupon.find({ isActive: true }).sort({ createdAt: -1 }).lean();
    }

    return NextResponse.json({ success: true, coupons });
  } catch (error) {
    console.error("Failed to fetch coupons:", error);
    return NextResponse.json({ success: false, coupons: defaultPromotionalCoupons });
  }
}
