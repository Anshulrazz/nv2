import { NextResponse } from "next/server";
import crypto from "crypto";
import { connectToDatabase } from "@/lib/mongodb";
import { EventRegistration } from "@/models/EventRegistration";

// POST /api/events/[id]/register/payment-webhook
// Razorpay webhook: verifies signature, flips paymentStatus from pending → paid
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const rawBody = await req.text();
    const razorpaySignature = req.headers.get("x-razorpay-signature");

    const secret = process.env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_SECRET;

    // ── Signature verification ────────────────────────────────────────────
    if (secret && razorpaySignature) {
      const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
      if (expected !== razorpaySignature) {
        return NextResponse.json({ error: "Invalid webhook signature." }, { status: 400 });
      }
    }

    const payload = JSON.parse(rawBody);
    const event = payload?.event;

    if (event === "payment.captured" || event === "order.paid") {
      const entity = payload?.payload?.payment?.entity || payload?.payload?.order?.entity;
      const razorpayOrderId = entity?.order_id || entity?.id;

      if (razorpayOrderId) {
        await connectToDatabase();

        const registration = await EventRegistration.findOne({
          eventId: id,
          razorpayOrderId,
          paymentStatus: "pending",
        });

        if (registration) {
          registration.paymentStatus = "paid";
          registration.paymentRef = entity?.id ?? null;
          await registration.save();
        }
      }
    }

    return NextResponse.json({ status: "ok" });
  } catch (err) {
    console.error("[POST /api/events/[id]/register/payment-webhook]", err);
    return NextResponse.json({ error: "Webhook error." }, { status: 500 });
  }
}
