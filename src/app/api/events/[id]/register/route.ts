import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { Event } from "@/models/Event";
import { EventRegistration } from "@/models/EventRegistration";
import { requireEventParticipant } from "@/lib/eventAuth";
import Razorpay from "razorpay";

// POST /api/events/[id]/register
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();

    // ── Auth check ────────────────────────────────────────────────────────
    const auth_check = requireEventParticipant(session);
    if (!auth_check.ok) {
      return NextResponse.json({ error: auth_check.error }, { status: auth_check.status });
    }
    const userId = auth_check.userId;

    const body = await req.json();
    const { codename, realName, acceptedCodeOfConduct } = body;

    // ── Required fields ───────────────────────────────────────────────────
    if (!codename || typeof codename !== "string" || !codename.trim()) {
      return NextResponse.json({ error: "Codename is required." }, { status: 400 });
    }
    if (!realName || typeof realName !== "string" || !realName.trim()) {
      return NextResponse.json({ error: "Real name is required." }, { status: 400 });
    }
    if (!acceptedCodeOfConduct) {
      return NextResponse.json(
        { error: "You must accept the Code of Conduct to register." },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const event = await Event.findById(id);
    if (!event) {
      return NextResponse.json({ error: "Event not found." }, { status: 404 });
    }

    // ── Server-side timing check (never trust client) ─────────────────────
    const now = new Date();
    if (now < event.registrationStart) {
      return NextResponse.json(
        { error: "Registration has not opened yet." },
        { status: 400 }
      );
    }
    if (now > event.registrationEnd) {
      return NextResponse.json({ error: "Registration has closed." }, { status: 400 });
    }
    if (!["published", "live"].includes(event.status)) {
      return NextResponse.json({ error: "Event is not accepting registrations." }, { status: 400 });
    }

    // ── Duplicate registration check ──────────────────────────────────────
    const existing = await EventRegistration.findOne({ eventId: id, userId });
    if (existing) {
      return NextResponse.json(
        { error: "You are already registered for this event." },
        { status: 409 }
      );
    }

    // ── Codename uniqueness check (case-insensitive) ───────────────────────
    const codenameNormalized = codename.trim().toLowerCase();
    const codenameExists = await EventRegistration.findOne({
      eventId: id,
      codename: { $regex: `^${codenameNormalized}$`, $options: "i" },
    });
    if (codenameExists) {
      return NextResponse.json(
        { error: "This codename is already taken. Choose another." },
        { status: 409 }
      );
    }

    // ── Capacity check ────────────────────────────────────────────────────
    let isWaitlisted = false;
    if (event.capacity) {
      const activeCount = await EventRegistration.countDocuments({
        eventId: id,
        paymentStatus: { $in: ["not_required", "paid"] },
        isDisqualified: false,
      });
      if (activeCount >= event.capacity) {
        isWaitlisted = true;
      }
    }

    // ── Payment handling ──────────────────────────────────────────────────
    if (event.isPaid && !isWaitlisted) {
      const keyId = process.env.RAZORPAY_KEY_ID;
      const keySecret = process.env.RAZORPAY_SECRET;

      if (!keyId || !keySecret) {
        return NextResponse.json(
          { error: "Payment gateway not configured." },
          { status: 500 }
        );
      }

      const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });
      const amountPaise = Math.round((event.price ?? 0) * 100);

      const order = await razorpay.orders.create({
        amount: amountPaise,
        currency: event.currency || "INR",
        receipt: `ev_${id.slice(-6)}_${userId.slice(-6)}_${Date.now()}`,
        notes: { eventId: id, userId, type: "event_registration" },
      });

      const registration = await EventRegistration.create({
        eventId: id,
        userId,
        codename: codename.trim(),
        realName: realName.trim(),
        paymentStatus: "pending",
        razorpayOrderId: order.id,
        acceptedCodeOfConduct: true,
      });

      return NextResponse.json(
        {
          registration,
          requiresPayment: true,
          order: {
            id: order.id,
            amount: amountPaise,
            currency: event.currency || "INR",
            keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || keyId,
          },
        },
        { status: 201 }
      );
    }

    // Free event (or waitlisted)
    const registration = await EventRegistration.create({
      eventId: id,
      userId,
      codename: codename.trim(),
      realName: realName.trim(),
      paymentStatus: isWaitlisted ? "waitlisted" : "not_required",
      acceptedCodeOfConduct: true,
    });

    return NextResponse.json({ registration, requiresPayment: false }, { status: 201 });
  } catch (err: unknown) {
    console.error("[POST /api/events/[id]/register]", err);
    // Catch Mongo duplicate key (race condition on codename)
    if (
      typeof err === "object" &&
      err !== null &&
      "code" in err &&
      (err as { code: number }).code === 11000
    ) {
      return NextResponse.json(
        { error: "Registration conflict. Please try a different codename." },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: "Registration failed. Please try again." }, { status: 500 });
  }
}

// GET /api/events/[id]/register — check registration status
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();

    const auth_check = requireEventParticipant(session);
    if (!auth_check.ok) {
      return NextResponse.json({ registered: false });
    }

    await connectToDatabase();
    const reg = await EventRegistration.findOne({
      eventId: id,
      userId: auth_check.userId,
    })
      .select("paymentStatus codename isDisqualified finalScore finalRank")
      .lean();

    return NextResponse.json({ registered: !!reg, registration: reg });
  } catch (err) {
    console.error("[GET /api/events/[id]/register]", err);
    return NextResponse.json({ error: "Failed to check registration." }, { status: 500 });
  }
}
