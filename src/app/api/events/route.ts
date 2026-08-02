import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { Event } from "@/models/Event";
import { EventRegistration } from "@/models/EventRegistration";
import { User } from "@/models/User";
import { escapeRegex } from "@/lib/validation";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const type = searchParams.get("type") || "all"; // all | hackathon | seminar | workshop | webinar | other
    const pricing = searchParams.get("pricing") || "all"; // all | free | paid
    const status = searchParams.get("status") || "all"; // all | upcoming | live | ended | cancelled
    const hostedByMe = searchParams.get("hostedByMe") === "true";
    const joinedByMe = searchParams.get("joinedByMe") === "true";

    const session = await auth();
    const currentUserId = session?.user?.id;

    await connectToDatabase();

    const query: Record<string, unknown> = {};

    if (search.trim()) {
      const cleanSearch = escapeRegex(search.trim());
      query.$or = [
        { title: { $regex: cleanSearch, $options: "i" } },
        { description: { $regex: cleanSearch, $options: "i" } },
        { tags: { $regex: cleanSearch, $options: "i" } },
      ];
    }

    if (type !== "all") {
      query.eventType = type;
    }

    if (pricing === "free") {
      query.isPaid = false;
    } else if (pricing === "paid") {
      query.isPaid = true;
    }

    if (status !== "all") {
      query.status = status;
    }

    if (hostedByMe && currentUserId) {
      query.hostId = currentUserId;
    }

    if (joinedByMe && currentUserId) {
      const registrations = await EventRegistration.find({ userId: currentUserId }).select("eventId");
      const eventIds = registrations.map((r) => r.eventId);
      query._id = { $in: eventIds };
    }

    const events = await Event.find(query)
      .populate("hostId", "name email image role")
      .sort({ startDate: 1, createdAt: -1 })
      .lean();

    // Attach registration count and current user joined status
    const eventIds = events.map((e) => e._id);
    const counts = await EventRegistration.aggregate([
      { $match: { eventId: { $in: eventIds } } },
      { $group: { _id: "$eventId", count: { $sum: 1 } } },
    ]);

    const countsMap = new Map(counts.map((c) => [c._id.toString(), c.count]));

    let userJoinedSet = new Set<string>();
    if (currentUserId) {
      const userRegs = await EventRegistration.find({
        eventId: { $in: eventIds },
        userId: currentUserId,
      }).select("eventId");
      userJoinedSet = new Set(userRegs.map((r) => r.eventId.toString()));
    }

    const enrichedEvents = events.map((event) => {
      const idStr = event._id.toString();
      return {
        ...event,
        participantCount: countsMap.get(idStr) || 0,
        isJoined: userJoinedSet.has(idStr),
        isHost: currentUserId ? (event.hostId as unknown as { _id?: string })?._id?.toString() === currentUserId || (event.hostId as unknown as string)?.toString() === currentUserId : false,
      };
    });

    return NextResponse.json({ events: enrichedEvents });
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

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = await req.json();
    const {
      title,
      description,
      shortDescription,
      bannerImage,
      eventType = "hackathon",
      isPaid = false,
      priceINR = 0,
      mode = "online",
      location = "",
      meetingLink = "",
      startDate,
      endDate,
      registrationDeadline,
      maxParticipants,
      tags = [],
      problemStatement = "",
      prizes = "",
      challenges = [],
    } = body;

    if (!title || !description || !startDate || !endDate || !registrationDeadline) {
      return NextResponse.json(
        { error: "Title, description, start date, end date, and registration deadline are required." },
        { status: 400 }
      );
    }

    // Generate unique slug
    let baseSlug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");
    if (!baseSlug) baseSlug = "event";

    let slug = baseSlug;
    let counter = 1;
    while (await Event.exists({ slug })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    const price = isPaid ? Math.max(0, Number(priceINR) || 0) : 0;

    const start = new Date(startDate);
    const end = new Date(endDate);
    const deadline = new Date(registrationDeadline);
    const now = new Date();

    let computedStatus: "upcoming" | "live" | "ended" = "upcoming";
    if (now >= start && now <= end) {
      computedStatus = "live";
    } else if (now > end) {
      computedStatus = "ended";
    }

    const formattedChallenges = Array.isArray(challenges)
      ? challenges.map((c: { title: string; description: string; category?: string; points?: number; flag?: string; hints?: string[]; imageUrl?: string }) => ({
          title: c.title ? c.title.trim() : "Challenge",
          description: c.description || "",
          category: c.category || "General",
          points: Number(c.points) || 100,
          flag: c.flag ? c.flag.trim() : "",
          hints: Array.isArray(c.hints) ? c.hints : String(c.hints || "").split(",").map((h) => h.trim()).filter(Boolean),
          imageUrl: c.imageUrl || "",
        }))
      : [];

    const newEvent = await Event.create({
      title: title.trim(),
      slug,
      description,
      shortDescription: shortDescription || title.slice(0, 140),
      bannerImage,
      hostId: userId,
      eventType,
      isPaid: price > 0,
      priceINR: price,
      mode,
      location,
      meetingLink,
      startDate: start,
      endDate: end,
      registrationDeadline: deadline,
      maxParticipants: maxParticipants ? Number(maxParticipants) : null,
      tags: Array.isArray(tags) ? tags : String(tags).split(",").map((t) => t.trim()).filter(Boolean),
      problemStatement,
      prizes,
      status: computedStatus,
      challenges: formattedChallenges,
    });

    // Auto register the host for free
    await EventRegistration.create({
      eventId: newEvent._id,
      userId,
      paymentStatus: "free",
      amountPaid: 0,
      paymentMethod: "free",
    });

    return NextResponse.json({
      message: "Event created successfully!",
      event: newEvent,
    });
  } catch (error) {
    console.error("POST /api/events error:", error);
    return NextResponse.json({ error: "Failed to create event" }, { status: 500 });
  }
}
