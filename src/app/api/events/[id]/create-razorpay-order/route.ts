import { NextResponse } from "next/server";
import { auth } from "@/auth";
import Razorpay from "razorpay";
import { connectToDatabase } from "@/lib/mongodb";
import { Event } from "@/models/Event";
import { PaymentOrder } from "@/models/PaymentOrder";
import { isValidObjectId } from "@/lib/validation";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
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

    const { id: eventId } = await params;
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

    if (!event.isPaid || (event.priceINR || 0) <= 0) {
      return NextResponse.json({ error: "This event is free. No payment required." }, { status: 400 });
    }

    const priceINR = Math.max(1, Math.round(event.priceINR));
    const amountInPaise = priceINR * 100;

    const razorpay = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });

    const receipt = `evt_${Date.now()}_${userId.slice(-6)}`;
    const razorpayOrder = await razorpay.orders.create({
      amount: amountInPaise,
      currency: "INR",
      receipt,
      notes: {
        userId,
        eventId: event._id.toString(),
        eventTitle: event.title,
        priceINR: String(priceINR),
      },
    });

    // Save payment order record in database
    await PaymentOrder.create({
      userId,
      razorpayOrderId: razorpayOrder.id,
      amountINR: priceINR,
      coinsDelivered: 0,
      type: "buy_coins", // Using existing type enum compatibility or metadata
      status: "created",
      metadata: {
        eventId: event._id,
        eventTitle: event.title,
        receipt,
        currency: "INR",
        paymentPurpose: "event_registration",
      },
    });

    return NextResponse.json({
      orderId: razorpayOrder.id,
      amount: amountInPaise,
      amountINR: priceINR,
      currency: "INR",
      keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || keyId,
      eventTitle: event.title,
    });
  } catch (error: unknown) {
    console.error("Error creating Razorpay order for event:", error);
    const message = error instanceof Error ? error.message : "Failed to create payment order.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
