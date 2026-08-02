import { NextResponse } from "next/server";
import { auth } from "@/auth";
import crypto from "crypto";
import { connectToDatabase } from "@/lib/mongodb";
import { Event } from "@/models/Event";
import { EventRegistration } from "@/models/EventRegistration";
import { isValidObjectId } from "@/lib/validation";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
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

    const { id: identifier } = await params;
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, displayName, username } = await req.json();

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        { error: "Missing required payment verification parameters." },
        { status: 400 }
      );
    }

    // SECURITY MANDATE: HMAC SHA256 Signature Verification
    const bodyToSign = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(bodyToSign)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return NextResponse.json({ error: "Invalid payment signature verification." }, { status: 400 });
    }

    await connectToDatabase();

    let event = null;
    if (isValidObjectId(identifier)) {
      event = await Event.findById(identifier);
    } else {
      event = await Event.findOne({ slug: identifier });
    }

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const finalDisplayName = (displayName || session.user.name || "Participant").trim();
    const finalUsername = (username || `user_${Date.now().toString().slice(-4)}`).trim().toLowerCase();

    let registration = await EventRegistration.findOne({ eventId: event._id, userId });
    if (!registration) {
      registration = await EventRegistration.create({
        eventId: event._id,
        userId,
        displayName: finalDisplayName,
        username: finalUsername,
        paymentStatus: "paid",
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature,
        registeredAt: new Date(),
      });
    } else {
      registration.paymentStatus = "paid";
      registration.razorpayOrderId = razorpay_order_id;
      registration.razorpayPaymentId = razorpay_payment_id;
      registration.razorpaySignature = razorpay_signature;
      if (displayName) registration.displayName = finalDisplayName;
      if (username) registration.username = finalUsername;
      await registration.save();
    }

    return NextResponse.json({
      success: true,
      message: `🎉 Payment verified! Successfully registered for "${event.title}".`,
      registration,
    });
  } catch (error: unknown) {
    console.error("POST /api/events/[id]/verify-payment error:", error);
    const msg = error instanceof Error ? error.message : "Failed to verify payment";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
