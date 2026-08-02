import { NextResponse } from "next/server";
import { auth } from "@/auth";
import crypto from "crypto";
import { connectToDatabase } from "@/lib/mongodb";
import { Event } from "@/models/Event";
import { EventRegistration } from "@/models/EventRegistration";
import { PaymentOrder } from "@/models/PaymentOrder";
import { User } from "@/models/User";
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

    const { id: eventId } = await params;
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = await req.json();

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        { error: "Missing required payment verification parameters." },
        { status: 400 }
      );
    }

    // Verify HMAC SHA256 Signature
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
    if (isValidObjectId(eventId)) {
      event = await Event.findById(eventId);
    } else {
      event = await Event.findOne({ slug: eventId });
    }

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const paymentOrder = await PaymentOrder.findOne({ razorpayOrderId: razorpay_order_id });
    if (paymentOrder) {
      paymentOrder.status = "paid";
      paymentOrder.razorpayPaymentId = razorpay_payment_id;
      paymentOrder.razorpaySignature = razorpay_signature;
      await paymentOrder.save();
    }

    // Credit host earnings directly (70% host payout)
    const hostEarnings = Math.floor((event.priceINR || 0) * 0.7);
    if (hostEarnings > 0) {
      const host = await User.findById(event.hostId);
      if (host) {
        host.creatorEarnings = (host.creatorEarnings || 0) + hostEarnings;
        await host.save();
      }
    }

    // Register user in EventRegistration
    let registration = await EventRegistration.findOne({ eventId: event._id, userId });
    if (!registration) {
      registration = await EventRegistration.create({
        eventId: event._id,
        userId,
        paymentStatus: "paid",
        amountPaid: event.priceINR,
        paymentMethod: "razorpay",
        paymentOrderId: paymentOrder?._id,
      });
    } else {
      registration.paymentStatus = "paid";
      registration.amountPaid = event.priceINR;
      registration.paymentMethod = "razorpay";
      await registration.save();
    }

    return NextResponse.json({
      success: true,
      isRegistered: true,
      message: `🎉 Payment verified! Successfully registered for "${event.title}".`,
      registration,
    });
  } catch (error: unknown) {
    console.error("Error verifying Razorpay event payment:", error);
    const message = error instanceof Error ? error.message : "Failed to verify payment.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
