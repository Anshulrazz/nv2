import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { Event } from "@/models/Event";
import { requireAdminOrHost } from "@/lib/eventAuth";

// ── Slug generation ──────────────────────────────────────────────────────────
function toSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

// GET /api/events — public list (filter status for non-hosts)
export async function GET(req: Request) {
  try {
    await connectToDatabase();
    const session = await auth();
    const role = session?.user?.role ?? "user";

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page") ?? "1", 10);
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "20", 10), 50);
    const skip = (page - 1) * limit;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filter: Record<string, any> = {};

    if (role !== "admin") {
      // Non-admin users only see public-facing events
      filter.status = { $in: ["published", "live", "ended"] };
    } else if (status) {
      filter.status = status;
    }

    if (type) filter.type = type;

    const [events, total] = await Promise.all([
      Event.find(filter)
        .select("-rulesMarkdown")
        .sort({ eventStart: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Event.countDocuments(filter),
    ]);

    return NextResponse.json({ events, total, page, limit });
  } catch (err) {
    console.error("[GET /api/events]", err);
    return NextResponse.json({ error: "Failed to fetch events." }, { status: 500 });
  }
}

// POST /api/events — create (admin/host with event=null means admin-only creation)
export async function POST(req: Request) {
  try {
    const session = await auth();
    const check = requireAdminOrHost(session, null);
    if (!check.ok) {
      return NextResponse.json({ error: check.error }, { status: check.status });
    }
    const userId = check.userId;

    const body = await req.json();
    const {
      name,
      description,
      type,
      isPaid,
      price,
      currency,
      registrationStart,
      registrationEnd,
      eventStart,
      eventEnd,
      rulesMarkdown,
      bannerUrl,
      challengeReleaseMode,
      capacity,
      codeOfConductUrl,
      teamMode,
      maxTeamSize,
    } = body;

    // ── Required field validation ─────────────────────────────────────────
    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: "Event name is required." }, { status: 400 });
    }
    if (!["hackathon", "ctf", "workshop"].includes(type)) {
      return NextResponse.json({ error: "Invalid event type." }, { status: 400 });
    }

    // ── Date validation (server-side — never trust client timestamps) ─────
    const regStart = new Date(registrationStart);
    const regEnd = new Date(registrationEnd);
    const evStart = new Date(eventStart);
    const evEnd = new Date(eventEnd);

    if (
      isNaN(regStart.getTime()) ||
      isNaN(regEnd.getTime()) ||
      isNaN(evStart.getTime()) ||
      isNaN(evEnd.getTime())
    ) {
      return NextResponse.json({ error: "Invalid date values." }, { status: 400 });
    }

    if (regStart >= regEnd) {
      return NextResponse.json(
        { error: "registrationStart must be before registrationEnd." },
        { status: 400 }
      );
    }
    if (regEnd > evStart) {
      return NextResponse.json(
        { error: "registrationEnd must be on or before eventStart." },
        { status: 400 }
      );
    }
    if (evStart >= evEnd) {
      return NextResponse.json(
        { error: "eventStart must be before eventEnd." },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // ── Slug generation with uniqueness check ─────────────────────────────
    let slug = toSlug(name);
    const existingSlug = await Event.findOne({ slug }).lean();
    if (existingSlug) {
      slug = `${slug}-${Date.now()}`;
    }

    const event = await Event.create({
      name: name.trim(),
      slug,
      description: description ?? "",
      type,
      isPaid: !!isPaid,
      price: isPaid ? (price ?? 0) : 0,
      currency: currency ?? "INR",
      registrationStart: regStart,
      registrationEnd: regEnd,
      eventStart: evStart,
      eventEnd: evEnd,
      rulesMarkdown: rulesMarkdown ?? "",
      bannerUrl: bannerUrl ?? "",
      status: "draft",
      challengeReleaseMode: challengeReleaseMode ?? "all_at_once",
      capacity: capacity ?? null,
      codeOfConductUrl: codeOfConductUrl ?? "",
      teamMode: !!teamMode,
      maxTeamSize: maxTeamSize ?? 4,
      createdBy: userId,
      hostIds: [],
    });

    return NextResponse.json({ event }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/events]", err);
    return NextResponse.json({ error: "Failed to create event." }, { status: 500 });
  }
}
