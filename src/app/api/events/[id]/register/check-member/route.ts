import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/models/User";
import { EventRegistration } from "@/models/EventRegistration";
import { Event } from "@/models/Event";
import mongoose from "mongoose";

// GET /api/events/[id]/register/check-member?email=foo@bar.com
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email")?.trim().toLowerCase();

    if (!email) {
      return NextResponse.json({ error: "Email is required." }, { status: 400 });
    }

    // Do not allow checking oneself as a team member
    if (session.user.email && session.user.email.toLowerCase() === email) {
      return NextResponse.json({
        exists: true,
        isSelf: true,
        error: "You are the team leader. Do not add yourself as a member.",
      });
    }

    await connectToDatabase();

    // Look up event (by ObjectId or slug)
    const isObjectId = mongoose.Types.ObjectId.isValid(id);
    const event = isObjectId
      ? await Event.findById(id).select("_id").lean()
      : await Event.findOne({ slug: id }).select("_id").lean();

    if (!event) {
      return NextResponse.json({ error: "Event not found." }, { status: 404 });
    }

    const user = await User.findOne({ email })
      .select("_id name username email image")
      .lean();

    if (!user) {
      return NextResponse.json({
        exists: false,
        error: "No Notexia user found with this email. Member must register on Notexia first.",
      });
    }

    // Check if already registered for this event
    const existingRegistration = await EventRegistration.findOne({
      eventId: event._id,
      userId: user._id,
    })
      .select("codename teamId paymentStatus isDisqualified")
      .lean();

    if (existingRegistration) {
      return NextResponse.json({
        exists: true,
        user: {
          _id: user._id,
          name: user.name,
          username: user.username,
          email: user.email,
          image: user.image,
        },
        alreadyRegistered: true,
        error: `${user.name || user.username || email} is already registered for this event.`,
      });
    }

    return NextResponse.json({
      exists: true,
      alreadyRegistered: false,
      user: {
        _id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        image: user.image,
      },
    });
  } catch (err) {
    console.error("[GET /api/events/[id]/register/check-member]", err);
    return NextResponse.json({ error: "Failed to verify member email." }, { status: 500 });
  }
}
