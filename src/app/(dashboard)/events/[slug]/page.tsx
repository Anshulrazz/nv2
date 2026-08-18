import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Suspense } from "react";
import { connectToDatabase } from "@/lib/mongodb";
import { Event } from "@/models/Event";
import { EventRegistration } from "@/models/EventRegistration";
import { User } from "@/models/User";
import { auth } from "@/auth";
import {
  Calendar,
  Trophy,
  Code2,
  GraduationCap,
  Clock,
  Users,
  Lock,
  CheckCircle2,
  ChevronRight,
  FileText,
  Sparkles,
  Award,
  ShieldCheck,
} from "lucide-react";
import { MarkdownRenderer } from "@/components/ui/MarkdownRenderer";
import { EventCountdown } from "@/components/events/EventCountdown";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  await connectToDatabase();
  const event = await Event.findOne({ slug }).select("name description bannerUrl").lean();
  if (!event) return { title: "Event Not Found — Notexia" };
  return {
    title: `${event.name} — Notexia Events`,
    description: (event.description as string) || "Join this event on Notexia.",
    openGraph: {
      images: event.bannerUrl ? [event.bannerUrl as string] : [],
    },
  };
}



const TYPE_CONFIG = {
  hackathon: { icon: Trophy, label: "Hackathon", color: "text-amber-400" },
  ctf: { icon: Code2, label: "CTF", color: "text-cyan-400" },
  workshop: { icon: GraduationCap, label: "Workshop", color: "text-violet-400" },
} as const;

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  await connectToDatabase();

  const event = await Event.findOne({ slug }).lean();
  if (!event || !["published", "live", "ended"].includes(event.status as string)) {
    notFound();
  }

  const session = await auth();
  const userId = session?.user?.id;

  let registration = null;
  if (userId) {
    registration = await EventRegistration.findOne({
      eventId: event._id,
      userId,
    })
      .select("paymentStatus isDisqualified codename")
      .lean();
  }

  const now = new Date();
  const regStart = new Date(event.registrationStart as Date);
  const regEnd = new Date(event.registrationEnd as Date);
  const evStart = new Date(event.eventStart as Date);
  const evEnd = new Date(event.eventEnd as Date);

  const isActiveRegistration =
    registration &&
    ["not_required", "paid"].includes(registration.paymentStatus as string) &&
    !registration.isDisqualified;

  // Event is ended if status is "ended" OR wall-clock time is past evEnd
  const isEnded = event.status === "ended" || now > evEnd;

  // Event is live if status is explicitly "live", OR status is "published" and we are between evStart and evEnd
  const isLive =
    event.status === "live" ||
    (event.status === "published" && now >= evStart && !isEnded);

  // Registration is open when within the registration window AND event is published or live
  const isRegOpen =
    now >= regStart &&
    now < regEnd &&
    ["published", "live"].includes(event.status as string);

  // Arena opens for registered users if the event has started, is live, or is ended
  const isArenaOpen =
    isActiveRegistration &&
    (isLive || now >= evStart || isEnded);

  const type = (event.type as keyof typeof TYPE_CONFIG) || "hackathon";
  const { icon: Icon, label: typeLabel, color } = TYPE_CONFIG[type] ?? TYPE_CONFIG.hackathon;

  // Registration count
  const registeredCount = await EventRegistration.countDocuments({
    eventId: event._id,
    paymentStatus: { $in: ["not_required", "paid"] },
    isDisqualified: false,
  });

  // Fetch judges
  const judges = event.judgeIds?.length
    ? await User.find({ _id: { $in: event.judgeIds } })
        .select("_id name username image email")
        .lean()
    : [];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Banner */}
      <div className="relative h-56 md:h-72 bg-gradient-to-br from-primary/10 via-sidebar to-sidebar-accent overflow-hidden">
        {event.bannerUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={event.bannerUrl as string}
            alt={event.name as string}
            className="absolute inset-0 w-full h-full object-cover opacity-50"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Icon className={`size-32 ${color} opacity-10`} />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
      </div>

      <div className="max-w-5xl mx-auto px-4 -mt-20 relative z-10 pb-20">
        {/* Event Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <Icon className={`size-4 ${color}`} />
            <span className={`text-xs font-mono font-bold uppercase tracking-widest ${color}`}>
              {typeLabel}
            </span>
            {isLive && (
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded border bg-red-500/15 text-red-400 border-red-500/30 animate-pulse ml-2">
                Live Now
              </span>
            )}
            {isEnded && (
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded border bg-zinc-500/15 text-zinc-400 border-zinc-500/30 ml-2">
                Ended
              </span>
            )}
          </div>
          <h1 className="text-2xl md:text-4xl font-bold text-foreground mb-3">
            {event.name as string}
          </h1>
          <p className="text-muted-foreground text-sm md:text-base leading-relaxed max-w-2xl">
            {event.description as string}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Stats Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-sidebar border border-sidebar-border rounded-xl p-4">
                <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-1">
                  Participants
                </p>
                <p className="text-xl font-bold text-foreground font-mono">
                  {registeredCount}
                  {event.capacity ? `/${event.capacity}` : ""}
                </p>
              </div>
              <div className="bg-sidebar border border-sidebar-border rounded-xl p-4">
                <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-1">
                  Entry
                </p>
                <p className="text-xl font-bold text-foreground font-mono">
                  {event.isPaid
                    ? `₹${event.price}`
                    : "Free"}
                </p>
              </div>
              <div className="bg-sidebar border border-sidebar-border rounded-xl p-4">
                <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-1">
                  Event Start
                </p>
                <p className="text-sm font-bold text-foreground">
                  {evStart.toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                    timeZone: "Asia/Kolkata",
                  })}
                </p>
              </div>
              <div className="bg-sidebar border border-sidebar-border rounded-xl p-4">
                <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-1">
                  Event End
                </p>
                <p className="text-sm font-bold text-foreground">
                  {evEnd.toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                    timeZone: "Asia/Kolkata",
                  })}
                </p>
              </div>
            </div>

            {/* Prize Pool & Rewards Showcase */}
            {(Boolean(event.prizePool) || (event.prizes && event.prizes.length > 0)) && (
              <div className="bg-gradient-to-br from-amber-500/10 via-sidebar to-sidebar border border-amber-500/30 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Trophy className="size-5 text-amber-400" />
                    <h2 className="text-sm font-bold text-foreground uppercase tracking-widest font-mono">
                      Prizes & Rewards
                    </h2>
                  </div>
                  {event.isPrizeRevealed ? (
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border bg-amber-500/20 text-amber-400 border-amber-500/40 flex items-center gap-1">
                      <Sparkles className="size-3" /> Revealed
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border bg-sidebar border-sidebar-border text-muted-foreground flex items-center gap-1">
                      <Lock className="size-3" /> Mystery Pool
                    </span>
                  )}
                </div>

                {event.isPrizeRevealed ? (
                  <div className="space-y-4">
                    {Boolean(event.prizePool) && (
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-sidebar/80 border border-amber-500/20 rounded-xl p-4">
                        <div>
                          <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                            Total Reward Pool
                          </p>
                          <p className="text-3xl font-black text-amber-400 font-mono tracking-tight">
                            ₹{Number(event.prizePool).toLocaleString("en-IN")}
                          </p>
                        </div>
                        <div className="text-xs text-muted-foreground flex items-center gap-1.5 bg-amber-500/10 px-3 py-1.5 rounded-lg border border-amber-500/20">
                          <Award className="size-4 text-amber-400" />
                          <span>Cash prizes + Badges & Certificates</span>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-4 bg-sidebar/60 border border-sidebar-border rounded-xl p-4">
                    <div className="size-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                      <Lock className="size-6 text-amber-400" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground">
                        Prize Pool To Be Announced!
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Organizers will reveal full cash prize breakdown during the event. Stay tuned!
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Judges Showcase Section */}
            {judges.length > 0 && (
              <div className="bg-sidebar border border-sidebar-border rounded-2xl p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <Award className="size-4 text-primary" />
                  <h2 className="text-sm font-bold text-foreground uppercase tracking-widest font-mono">
                    Judges & Evaluation Panel ({judges.length})
                  </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {judges.map((judge: { _id: string; name?: string; username?: string; image?: string; email?: string }) => (
                    <div
                      key={judge._id}
                      className="flex items-center gap-3 bg-background border border-sidebar-border rounded-xl p-3.5 hover:border-primary/40 transition-colors"
                    >
                      {judge.image ? (
                        <Image
                          src={judge.image}
                          alt={judge.name || "Judge"}
                          width={44}
                          height={44}
                          className="size-11 rounded-full object-cover border border-sidebar-border shrink-0"
                          unoptimized
                        />
                      ) : (
                        <div className="size-11 rounded-full bg-primary/15 text-primary flex items-center justify-center font-bold text-sm border border-primary/20 shrink-0">
                          {(judge.name || judge.username || "J")[0].toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <p className="text-sm font-bold text-foreground truncate">
                            {judge.name || judge.username || "Event Judge"}
                          </p>
                          <ShieldCheck className="size-3.5 text-primary shrink-0" />
                        </div>
                        {judge.username && (
                          <p className="text-xs text-muted-foreground truncate font-mono">
                            @{judge.username}
                          </p>
                        )}
                        <span className="inline-block text-[9px] font-mono font-bold uppercase tracking-wider text-primary bg-primary/10 px-1.5 py-0.5 rounded mt-1">
                          Official Judge
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Rules */}
            {event.rulesMarkdown && (
              <div className="bg-sidebar border border-sidebar-border rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <FileText className="size-4 text-primary" />
                  <h2 className="text-sm font-bold text-foreground uppercase tracking-widest font-mono">
                    Rules & Guidelines
                  </h2>
                </div>
                <div className="max-w-none">
                  <Suspense fallback={
                    <div className="space-y-2 animate-pulse">
                      <div className="h-4 bg-muted/50 rounded w-full" />
                      <div className="h-4 bg-muted/50 rounded w-4/5" />
                      <div className="h-4 bg-muted/50 rounded w-3/5" />
                    </div>
                  }>
                    <MarkdownRenderer content={event.rulesMarkdown as string} className="text-sm" />
                  </Suspense>
                </div>
              </div>
            )}

            {event.codeOfConductUrl && (
              <Link
                href={event.codeOfConductUrl as string}
                target="_blank"
                className="inline-flex items-center gap-2 text-xs text-primary hover:underline"
              >
                <CheckCircle2 className="size-4" />
                View Code of Conduct
                <ChevronRight className="size-3" />
              </Link>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Countdown timers */}
            <div className="bg-sidebar border border-sidebar-border rounded-2xl p-5 space-y-4">
              {isRegOpen && (
                <EventCountdown
                  targetIso={regEnd.toISOString()}
                  label="Registration closes in"
                />
              )}
              {!isLive && !isEnded && now < evStart && (
                <EventCountdown targetIso={evStart.toISOString()} label="Event starts in" />
              )}
              {isLive && <EventCountdown targetIso={evEnd.toISOString()} label="Event ends in" />}

              <div className="flex flex-col gap-2 text-xs text-muted-foreground pt-2 border-t border-sidebar-border">
                <div className="flex items-center gap-2">
                  <Calendar className="size-3.5" />
                  <span>
                    Reg:{" "}
                    {regStart.toLocaleDateString("en-IN", { day: "numeric", month: "short", timeZone: "Asia/Kolkata" })} →{" "}
                    {regEnd.toLocaleDateString("en-IN", { day: "numeric", month: "short", timeZone: "Asia/Kolkata" })}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="size-3.5" />
                  <span>
                    Event:{" "}
                    {evStart.toLocaleDateString("en-IN", { day: "numeric", month: "short", timeZone: "Asia/Kolkata" })} →{" "}
                    {evEnd.toLocaleDateString("en-IN", { day: "numeric", month: "short", timeZone: "Asia/Kolkata" })}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="size-3.5" />
                  <span>
                    {event.capacity
                      ? `${registeredCount} / ${event.capacity} spots`
                      : `${registeredCount} registered`}
                  </span>
                </div>
                {event.isPaid && (
                  <div className="flex items-center gap-2">
                    <Lock className="size-3.5" />
                    <span>Paid event — ₹{event.price}</span>
                  </div>
                )}
              </div>
            </div>

            {/* CTA */}
            <div className="bg-sidebar border border-sidebar-border rounded-2xl p-5">
              {isActiveRegistration ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-emerald-400 text-sm font-semibold">
                    <CheckCircle2 className="size-4" />
                    You&apos;re registered!
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Codename:{" "}
                    <span className="font-mono font-bold text-foreground">
                      {registration?.codename}
                    </span>
                  </p>
                  {isEnded ? (
                    <Link
                      href={`/events/${slug}/arena`}
                      className="block w-full text-center py-2.5 rounded-xl bg-sidebar border border-sidebar-border text-muted-foreground text-sm font-bold hover:border-primary/40 transition-all"
                    >
                      View Results
                    </Link>
                  ) : isArenaOpen ? (
                    <Link
                      href={`/events/${slug}/arena`}
                      className="block w-full text-center py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:opacity-90 transition-opacity animate-pulse"
                    >
                      🏟️ Enter Arena →
                    </Link>
                  ) : (
                    <p className="text-xs text-muted-foreground text-center">
                      Arena opens when event starts.
                    </p>
                  )}
                </div>
              ) : isEnded ? (
                <p className="text-xs text-muted-foreground text-center">This event has ended.</p>
              ) : isRegOpen ? (
                <div className="space-y-3">
                  <p className="text-xs text-muted-foreground">
                    Registration is open. Join now to participate.
                  </p>
                  {userId ? (
                    <Link
                      href={`/events/${slug}/register`}
                      className="block w-full text-center py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:opacity-90 transition-opacity"
                    >
                      Register Now →
                    </Link>
                  ) : (
                    <Link
                      href="/login"
                      className="block w-full text-center py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:opacity-90 transition-opacity"
                    >
                      Sign in to Register →
                    </Link>
                  )}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground text-center">
                  Registration is not open yet.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
