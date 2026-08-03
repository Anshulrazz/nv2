import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { Event } from "@/models/Event";
import { EventRegistration } from "@/models/EventRegistration";
import { isValidObjectId } from "@/lib/validation";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized. Please sign in." }, { status: 401 });
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

    if (event.maxParticipants) {
      const currentCount = await EventRegistration.countDocuments({ eventId: event._id });
      if (currentCount >= event.maxParticipants) {
        return NextResponse.json({ error: "Event has reached maximum capacity." }, { status: 400 });
      }
    }

    if (event.isPaid && (event.entryFeeINR || 0) > 0) {
      return NextResponse.json(
        { error: "This is a paid event. Please complete Razorpay payment to register." },
        { status: 400 }
      );
    }

    const body = await req.json();
    const displayName = (body.displayName || session.user.name || "Participant").trim();
    const username = (body.username || `user_${Date.now().toString().slice(-4)}`).trim().toLowerCase();

    if (!displayName || !username) {
      return NextResponse.json({ error: "Display Name and Username are required." }, { status: 400 });
    }

    // Check if user is already registered
    const existingUserReg = await EventRegistration.findOne({ eventId: event._id, userId });
    if (existingUserReg) {
      return NextResponse.json({ message: "You are already registered for this event!", registration: existingUserReg });
    }

    // Unique index check for username
    const usernameTaken = await EventRegistration.exists({ eventId: event._id, username });
    if (usernameTaken) {
      return NextResponse.json({ error: `Username "${username}" is already taken for this event.` }, { status: 400 });
    }

    const registration = await EventRegistration.create({
      eventId: event._id,
      userId,
      displayName,
      username,
      paymentStatus: "not_required",
      registeredAt: new Date(),
    });

    return NextResponse.json({
      message: `🎉 Successfully registered for "${event.title}"!`,
      registration,
    });
  } catch (error: unknown) {
    console.error("POST /api/events/[id]/register error:", error);
    const msg = error instanceof Error ? error.message : "Failed to register for event";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
