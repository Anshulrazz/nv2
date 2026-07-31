import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/models/User";
import { Coupon } from "@/models/Coupon";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();
    const dbUser = await User.findById(session.user.id);
    if (!dbUser || dbUser.role !== "admin") {
      return NextResponse.json({ error: "Admin access required." }, { status: 403 });
    }

    const coupons = await Coupon.find({}).sort({ createdAt: -1 }).lean();
    const totalCount = coupons.length;
    const activeCount = coupons.filter((c) => c.isActive).length;
    const totalRedemptions = coupons.reduce((sum, c) => sum + (c.usedCount || 0), 0);

    return NextResponse.json({
      success: true,
      coupons,
      stats: {
        totalCount,
        activeCount,
        totalRedemptions,
      },
    });
  } catch (error) {
    console.error("Failed to fetch admin coupons:", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();
    const dbUser = await User.findById(session.user.id);
    if (!dbUser || dbUser.role !== "admin") {
      return NextResponse.json({ error: "Admin access required." }, { status: 403 });
    }

    const body = await req.json();
    const {
      code,
      description,
      discountType,
      discountValue,
      minPurchaseAmount,
      maxUses,
      validUntil,
      applicableFor,
      isActive,
    } = body || {};

    if (!code || typeof code !== "string" || !code.trim()) {
      return NextResponse.json({ error: "Coupon code is required." }, { status: 400 });
    }

    if (!description || typeof description !== "string") {
      return NextResponse.json({ error: "Description is required." }, { status: 400 });
    }

    if (typeof discountValue !== "number" || discountValue <= 0) {
      return NextResponse.json({ error: "Discount value must be greater than 0." }, { status: 400 });
    }

    const uppercaseCode = code.trim().toUpperCase();

    const existing = await Coupon.findOne({ code: uppercaseCode });
    if (existing) {
      return NextResponse.json({ error: `Coupon code '${uppercaseCode}' already exists.` }, { status: 400 });
    }

    const newCoupon = await Coupon.create({
      code: uppercaseCode,
      description: description.trim(),
      discountType: discountType === "fixed" ? "fixed" : "percentage",
      discountValue,
      minPurchaseAmount: typeof minPurchaseAmount === "number" ? minPurchaseAmount : 0,
      maxUses: typeof maxUses === "number" ? maxUses : 1000,
      usedCount: 0,
      isActive: isActive !== false,
      validUntil: validUntil ? new Date(validUntil) : new Date("2026-12-31"),
      applicableFor: applicableFor || "all",
    });

    return NextResponse.json({ success: true, coupon: newCoupon }, { status: 201 });
  } catch (error) {
    console.error("Failed to create admin coupon:", error);
    return NextResponse.json({ error: "Internal server error creating coupon." }, { status: 500 });
  }
}
