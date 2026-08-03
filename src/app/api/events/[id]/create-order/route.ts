import { NextResponse } from "next/server";
import { auth } from "@/auth";
import Razorpay from "razorpay";
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

    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_SECRET;

    if (!keyId || !keySecret) {
      return NextResponse.json(
        { error: "Razorpay credentials are not configured on the server." },
        { status: 500 }
      );
    }

    const { id: identifier } = await params;
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

    const now = new Date();
    if (event.registrationStart && now < new Date(event.registrationStart)) {
      return NextResponse.json({ error: "Registration has not opened yet." }, { status: 400 });
    }
    if (event.registrationEnd && now > new Date(event.registrationEnd)) {
      return NextResponse.json({ error: "Registration for this event has closed." }, { status: 400 });
    }

    if (!event.isPaid || (event.entryFeeINR || 0) <= 0) {
      return NextResponse.json({ error: "This event is free. No Razorpay order required." }, { status: 400 });
    }

    const entryFeeINR = Math.max(1, Math.round(event.entryFeeINR));
    const amountInPaise = entryFeeINR * 100;

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
        entryFeeINR: String(entryFeeINR),
      },
    });

    const body = await req.json().catch(() => ({}));
    const displayName = body.displayName || session.user.name || "Participant";
    const username = body.username || `user_${Date.now().toString().slice(-4)}`;

    // Store registration record in pending status
    await EventRegistration.findOneAndUpdate(
      { eventId: event._id, userId },
      {
        displayName: displayName.trim(),
        username: username.trim().toLowerCase(),
        paymentStatus: "pending",
        razorpayOrderId: razorpayOrder.id,
      },
      { upsert: true, new: true }
    );

    return NextResponse.json({
      orderId: razorpayOrder.id,
      amount: amountInPaise,
      amountINR: entryFeeINR,
      currency: "INR",
      keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || keyId,
      eventTitle: event.title,
    });
  } catch (error: unknown) {
    console.error("POST /api/events/[id]/create-order error:", error);
    const msg = error instanceof Error ? error.message : "Failed to create Razorpay order";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
