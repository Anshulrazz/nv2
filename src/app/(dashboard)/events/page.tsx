import { Metadata } from "next";
import Link from "next/link";
import { connectToDatabase } from "@/lib/mongodb";
import { Event } from "@/models/Event";
import { auth } from "@/auth";
import { Calendar, Trophy, Code2, GraduationCap, Clock, Users, Lock } from "lucide-react";

export const metadata: Metadata = {
  title: "Events — Notexia",
  description:
    "Participate in hackathons, CTFs, and workshops on Notexia. Compete, learn, and earn certificates.",
};

export const dynamic = "force-dynamic";

const TYPE_CONFIG = {
  hackathon: { icon: Trophy, label: "Hackathon", color: "text-amber-400" },
  ctf: { icon: Code2, label: "CTF", color: "text-cyan-400" },
  workshop: { icon: GraduationCap, label: "Workshop", color: "text-violet-400" },
} as const;

const STATUS_BADGE: Record<string, { label: string; variant: string }> = {
  published: { label: "Registration Open", variant: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" },
  live: { label: "Live Now", variant: "bg-red-500/15 text-red-400 border-red-500/30 animate-pulse" },
  ended: { label: "Ended", variant: "bg-zinc-500/15 text-zinc-400 border-zinc-500/30" },
};

function EventCard({ event }: { event: Record<string, unknown> }) {
  const type = (event.type as keyof typeof TYPE_CONFIG) || "hackathon";
  const { icon: Icon, label: typeLabel, color } = TYPE_CONFIG[type] ?? TYPE_CONFIG.hackathon;
  const status = (event.status as string) ?? "published";
  const badge = STATUS_BADGE[status] ?? STATUS_BADGE.published;
  const evStart = new Date(event.eventStart as string);
  const regEnd = new Date(event.registrationEnd as string);
  const now = new Date();
  const isRegOpen = status === "published" && now < regEnd;

  return (
    <Link
      href={`/events/${event.slug as string}`}
      className="group relative flex flex-col bg-sidebar border border-sidebar-border rounded-2xl overflow-hidden hover:border-primary/40 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5"
    >
      {/* Banner */}
      <div className="relative h-40 bg-gradient-to-br from-primary/10 via-sidebar to-sidebar-accent overflow-hidden">
        {event.bannerUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={event.bannerUrl as string}
            alt={event.name as string}
            className="absolute inset-0 w-full h-full object-cover opacity-60"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Icon className={`size-16 ${color} opacity-20`} />
          </div>
        )}
        <div className="absolute top-3 left-3 flex gap-2">
          <span
            className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${badge.variant}`}
          >
            {badge.label}
          </span>
        </div>
        {Boolean(event.isPaid) && (
          <div className="absolute top-3 right-3">
            <Lock className="size-4 text-amber-400" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-5 gap-3">
        <div className="flex items-center gap-2">
          <Icon className={`size-4 ${color}`} />
          <span className={`text-[11px] font-mono font-bold uppercase tracking-widest ${color}`}>
            {typeLabel}
          </span>
        </div>

        <h3 className="text-sm font-bold text-foreground line-clamp-2 leading-snug group-hover:text-primary transition-colors">
          {event.name as string}
        </h3>

        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
          {(event.description as string) || "Join this event to compete and learn."}
        </p>

        <div className="mt-auto pt-3 border-t border-sidebar-border flex items-center justify-between text-[11px] text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Calendar className="size-3.5" />
            <span>{evStart.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" })}</span>
          </div>
          <div className="flex items-center gap-1.5">
            {isRegOpen ? (
              <>
                <Clock className="size-3.5 text-emerald-400" />
                <span className="text-emerald-400">
                  Reg closes {regEnd.toLocaleDateString("en-IN", { day: "numeric", month: "short", timeZone: "Asia/Kolkata" })}
                </span>
              </>
            ) : (
              <>
                <Users className="size-3.5" />
                <span>{event.capacity ? `Cap: ${event.capacity}` : "Open"}</span>
              </>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

export default async function EventsPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; status?: string; page?: string }>;
}) {
  const { type, status, page: pageStr } = await searchParams;
  const session = await auth();
  const role = session?.user?.role ?? "user";

  await connectToDatabase();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const filter: Record<string, any> = {};
  if (role !== "admin") {
    filter.status = { $in: ["published", "live", "ended"] };
  } else if (status) {
    filter.status = status;
  }
  if (type) filter.type = type;

  const page = parseInt(pageStr ?? "1", 10);
  const limit = 12;
  const skip = (page - 1) * limit;

  const [events, total] = await Promise.all([
    Event.find(filter)
      .select("-rulesMarkdown -flagHash")
      .sort({ eventStart: 1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Event.countDocuments(filter),
  ]);

  const totalPages = Math.ceil(total / limit);

  const TYPES = [
    { value: "", label: "All Types" },
    { value: "hackathon", label: "Hackathon" },
    { value: "ctf", label: "CTF" },
    { value: "workshop", label: "Workshop" },
  ];

  return (
    <div className="min-h-screen bg-background px-4 py-10 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-foreground mb-2">Events</h1>
        <p className="text-muted-foreground text-sm">
          Hackathons, CTFs, and workshops. Compete, learn, and earn certificates.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-8">
        {TYPES.map((t) => (
          <Link
            key={t.value}
            href={t.value ? `/events?type=${t.value}` : "/events"}
            className={`px-4 py-1.5 rounded-full text-xs font-mono font-bold uppercase tracking-wider border transition-all ${
              type === t.value || (!type && !t.value)
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-sidebar border-sidebar-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {/* Grid */}
      {events.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
          <Trophy className="size-12 text-muted-foreground/40" />
          <p className="text-muted-foreground">No events found. Check back soon!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {events.map((event) => (
            <EventCard key={String(event._id)} event={event as Record<string, unknown>} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-10">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={`/events?page=${p}${type ? `&type=${type}` : ""}`}
              className={`w-9 h-9 flex items-center justify-center rounded-lg text-xs font-mono border transition-all ${
                p === page
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-sidebar border-sidebar-border text-muted-foreground hover:border-primary/40"
              }`}
            >
              {p}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
