import { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { Event } from "@/models/Event";
import { Plus, Trophy, Code2, GraduationCap, Edit, Eye, BarChart2 } from "lucide-react";

export const metadata: Metadata = {
  title: "Host Dashboard — Events | Notexia",
  description: "Manage your events, hackathons, and CTFs on Notexia.",
};

export const dynamic = "force-dynamic";

const TYPE_ICON = {
  hackathon: Trophy,
  ctf: Code2,
  workshop: GraduationCap,
} as const;

const STATUS_COLOR: Record<string, string> = {
  draft: "text-zinc-400",
  published: "text-emerald-400",
  live: "text-red-400",
  ended: "text-zinc-500",
  archived: "text-zinc-600",
};

export default async function HostEventsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const userId = session.user.id;
  const role = session.user.role ?? "user";

  // Only admins and teachers can access host dashboard
  if (role !== "admin" && role !== "teacher") {
    redirect("/dashboard");
  }

  await connectToDatabase();

  // Show events created by or hosted by this user (admin sees all)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const filter: Record<string, any> =
    role === "admin"
      ? {}
      : { $or: [{ createdBy: userId }, { hostIds: userId }] };

  const events = await Event.find(filter)
    .select("-rulesMarkdown")
    .sort({ createdAt: -1 })
    .lean();

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Host Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your events, hackathons, and CTFs.
          </p>
        </div>
        <Link
          href="/host/events/create"
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-bold rounded-xl hover:opacity-90 transition-opacity"
        >
          <Plus className="size-4" />
          Create Event
        </Link>
      </div>

      {/* Events List */}
      {events.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4 text-center border border-dashed border-sidebar-border rounded-2xl">
          <Trophy className="size-12 text-muted-foreground/40" />
          <p className="text-muted-foreground text-sm">No events yet.</p>
          <Link
            href="/host/events/create"
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-xs font-bold rounded-xl hover:opacity-90 transition-opacity"
          >
            <Plus className="size-3.5" />
            Create your first event
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {events.map((event) => {
            const type = (event.type as keyof typeof TYPE_ICON) || "hackathon";
            const Icon = TYPE_ICON[type] ?? Trophy;
            return (
              <div
                key={event._id?.toString()}
                className="flex items-center gap-4 bg-sidebar border border-sidebar-border rounded-xl p-4 hover:border-primary/30 transition-colors"
              >
                <div className="size-10 rounded-xl bg-sidebar-accent border border-sidebar-border flex items-center justify-center shrink-0">
                  <Icon className="size-5 text-primary" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-foreground truncate">
                      {event.name as string}
                    </span>
                    <span
                      className={`text-[10px] font-mono font-bold uppercase tracking-widest ${STATUS_COLOR[event.status as string] ?? "text-zinc-400"}`}
                    >
                      {event.status as string}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 font-mono">
                    /{event.slug as string}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Link
                    href={`/events/${event.slug}`}
                    className="p-2 rounded-lg hover:bg-sidebar-accent transition-colors text-muted-foreground hover:text-foreground"
                    title="View public page"
                  >
                    <Eye className="size-4" />
                  </Link>
                  <Link
                    href={`/host/events/${event._id}/edit`}
                    className="p-2 rounded-lg hover:bg-sidebar-accent transition-colors text-muted-foreground hover:text-foreground"
                    title="Edit event"
                  >
                    <Edit className="size-4" />
                  </Link>
                  <Link
                    href={`/host/events/${event._id}/monitor`}
                    className="p-2 rounded-lg hover:bg-sidebar-accent transition-colors text-muted-foreground hover:text-foreground"
                    title="Monitor participants"
                  >
                    <BarChart2 className="size-4" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
