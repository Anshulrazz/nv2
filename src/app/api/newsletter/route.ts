import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Newsletter } from "@/models/Newsletter";
import { auth } from "@/auth";
import { User } from "@/models/User";

// POST /api/newsletter - Public subscription endpoint
export async function POST(req: Request) {
  try {
    const { email, source = "footer" } = await req.json().catch(() => ({}));

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json({ error: "Valid email address is required." }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    await connectToDatabase();

    const existing = await Newsletter.findOne({ email: cleanEmail });
    if (existing) {
      if (existing.status === "unsubscribed") {
        existing.status = "active";
        await existing.save();
        return NextResponse.json({
          message: "Welcome back! Your subscription has been reactivated.",
          subscription: existing,
        });
      }
      return NextResponse.json({
        message: "You are already subscribed to Notexia study updates!",
        subscription: existing,
      });
    }

    const subscriber = await Newsletter.create({
      email: cleanEmail,
      source: source || "footer",
      status: "active",
      subscribedAt: new Date(),
    });

    return NextResponse.json({
      message: "Successfully subscribed to Notexia study updates!",
      subscription: subscriber,
    });
  } catch (error: any) {
    console.error("Newsletter subscription error:", error);
    if (error.code === 11000) {
      return NextResponse.json({ message: "You are already subscribed!" });
    }
    return NextResponse.json({ error: "Failed to process subscription." }, { status: 500 });
  }
}

// GET /api/newsletter - Admin endpoint to list all subscribers
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();
    const currentUser = await User.findById(session.user.id);
    if (currentUser?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden. Admin access required." }, { status: 403 });
    }

    const subscribers = await Newsletter.find({}).sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      count: subscribers.length,
      subscribers,
    });
  } catch (error) {
    console.error("Error fetching newsletter subscribers:", error);
    return NextResponse.json({ error: "Failed to fetch subscribers." }, { status: 500 });
  }
}

// DELETE /api/newsletter - Admin endpoint to delete a subscriber
export async function DELETE(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();
    const currentUser = await User.findById(session.user.id);
    if (currentUser?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden. Admin access required." }, { status: 403 });
    }

    const { id } = await req.json().catch(() => ({}));
    if (!id) {
      return NextResponse.json({ error: "Subscriber ID is required." }, { status: 400 });
    }

    await Newsletter.findByIdAndDelete(id);
    return NextResponse.json({ success: true, message: "Subscriber deleted successfully." });
  } catch (error) {
    console.error("Error deleting newsletter subscriber:", error);
    return NextResponse.json({ error: "Failed to delete subscriber." }, { status: 500 });
  }
}
