import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { Event } from "@/models/Event";
import { User } from "@/models/User";

export async function GET(req: Request) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const status = searchParams.get("status") || "published";

    const filter: Record<string, unknown> = {};
    if (status !== "all") {
      filter.status = status === "live" ? "live" : { $in: ["published", "live"] };
    }
    if (category && category !== "all") {
      filter.category = category;
    }

    const events = await Event.find(filter)
      .populate("createdBy", "name email image role")
      .sort({ eventStart: 1 })
      .lean();

    return NextResponse.json({ events });
  } catch (error) {
    console.error("GET /api/events error:", error);
    return NextResponse.json({ error: "Failed to fetch events" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();
    const user = await User.findById(userId).select("role").lean();
    if (user?.role !== "teacher" && user?.role !== "admin") {
      return NextResponse.json(
        { error: "Forbidden: Only Teachers or Admins can create events." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const {
      title,
      description = "",
      bannerUrl = "",
      category = "Mixed",
      registrationStart,
      registrationEnd,
      eventStart,
      eventEnd,
      maxParticipants = null,
      isPaid = false,
      entryFeeINR = 0,
      rules = "",
      certificate = { enabled: true, topN: 3, templateId: "navy_gold" },
    } = body;

    if (!title || !registrationStart || !registrationEnd || !eventStart || !eventEnd) {
      return NextResponse.json(
        { error: "Missing required fields (title, schedule dates)." },
        { status: 400 }
      );
    }

    const baseSlug = title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    const uniqueSlug = `${baseSlug}-${Date.now().toString().slice(-6)}`;

    const event = await Event.create({
      title: title.trim(),
      slug: uniqueSlug,
      description,
      bannerUrl,
      category,
      createdBy: userId,
      status: "draft",
      registrationStart: new Date(registrationStart),
      registrationEnd: new Date(registrationEnd),
      eventStart: new Date(eventStart),
      eventEnd: new Date(eventEnd),
      maxParticipants: maxParticipants ? Number(maxParticipants) : null,
      isPaid: Boolean(isPaid),
      entryFeeINR: isPaid ? Math.max(1, Number(entryFeeINR)) : 0,
      rules,
      certificate,
    });

    return NextResponse.json({ message: "Draft event created!", event });
  } catch (error: unknown) {
    console.error("POST /api/events error:", error);
    const msg = error instanceof Error ? error.message : "Failed to create event";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
