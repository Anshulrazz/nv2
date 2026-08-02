"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Calendar,
  CheckCircle2,
  ArrowRight,
  Shield,
  Loader2,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { MarkdownRenderer } from "@/components/ui/MarkdownRenderer";

interface EventDetail {
  _id: string;
  title: string;
  slug: string;
  description: string;
  bannerUrl?: string;
  category: string;
  status: "draft" | "published" | "live" | "ended" | "archived";
  registrationStart: string;
  registrationEnd: string;
  eventStart: string;
  eventEnd: string;
  isPaid: boolean;
  entryFeeINR: number;
  rules?: string;
  createdBy: { _id: string; name?: string; email?: string };
}

interface RegistrationStatus {
  isRegistered: boolean;
  paymentStatus?: "not_required" | "pending" | "paid" | "failed";
  runStatus?: "not_started" | "in_progress" | "completed";
}

export default function EventLandingPage() {
  const params = useParams();
  const { data: session, status: authStatus } = useSession();
  const eventIdentifier = (params.id || params.slug) as string;

  const [event, setEvent] = useState<EventDetail | null>(null);
  const [regInfo, setRegInfo] = useState<RegistrationStatus>({ isRegistered: false });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<string>("");

  const fetchEventAndReg = useCallback(async () => {
    try {
      const res = await fetch(`/api/events/${eventIdentifier}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Event not found");

      setEvent(data.event);

      // Check current user registration status
      if (session?.user?.id && data.event?._id) {
        const pRes = await fetch(`/api/events/${data.event._id}/participants`);
        if (pRes.ok) {
          const pData = await pRes.json();
          const myReg = (pData.participants || []).find(
            (p: { user?: { _id?: string } }) => p.user?._id === session.user.id
          );
          if (myReg) {
            setRegInfo({
              isRegistered: true,
              paymentStatus: myReg.paymentStatus,
            });
          }
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error loading event";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [eventIdentifier, session]);

  useEffect(() => {
    if (eventIdentifier) fetchEventAndReg();
  }, [eventIdentifier, fetchEventAndReg]);

  // Live Countdown timer
  useEffect(() => {
    if (!event) return;

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const startTime = new Date(event.eventStart).getTime();
      const diff = startTime - now;

      if (diff <= 0) {
        setCountdown("LIVE NOW!");
      } else {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const secs = Math.floor((diff % (1000 * 60)) / 1000);
        setCountdown(`${hours}h ${mins}m ${secs}s`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [event]);

  if (loading || authStatus === "loading") {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-8 space-y-4 font-mono">
        <Loader2 className="size-8 text-amber-500 animate-spin" />
        <p className="text-xs text-muted-foreground">Loading event landing page...</p>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="w-full min-h-screen bg-background p-8 max-w-xl mx-auto space-y-6">
        <Link href="/events">
          <Button variant="ghost" size="sm" className="gap-2 text-xs">
            <ArrowLeft className="size-4" /> Back to Events
          </Button>
        </Link>
        <div className="p-8 text-center bg-card border border-border rounded-3xl space-y-3">
          <h2 className="text-xl font-bold text-destructive">Event Not Found</h2>
          <p className="text-xs text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  const isLive = event.status === "live" || new Date() >= new Date(event.eventStart);
  const isEnded = event.status === "ended" || new Date() >= new Date(event.eventEnd);
  const isRegisteredAndPaid =
    regInfo.isRegistered && (regInfo.paymentStatus === "paid" || regInfo.paymentStatus === "not_required");

  return (
    <div className="w-full min-h-screen bg-background text-foreground p-4 sm:p-6 lg:p-10 space-y-8">
      <Link href="/events">
        <Button variant="ghost" size="sm" className="gap-2 text-xs font-bold hover:bg-card">
          <ArrowLeft className="size-4" /> Back to Events Hub
        </Button>
      </Link>

      {/* Main Event Landing Card */}
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="relative rounded-3xl bg-card border border-border overflow-hidden p-6 sm:p-10 shadow-2xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="px-3.5 py-1 rounded-full bg-amber-500/15 text-amber-400 font-mono text-xs font-bold">
                  {event.category}
                </span>
                {isLive && !isEnded && (
                  <span className="px-3.5 py-1 rounded-full bg-emerald-500 text-black font-mono text-xs font-bold animate-pulse">
                    ⚡ LIVE NOW
                  </span>
                )}
              </div>

              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight" style={{ fontFamily: "var(--font-space-grotesk)" }}>
                {event.title}
              </h1>

              <div className="flex items-center gap-4 text-xs font-mono text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Calendar className="size-4 text-amber-400" />
                  {new Date(event.eventStart).toLocaleDateString()} - {new Date(event.eventEnd).toLocaleDateString()}
                </span>
                <span>•</span>
                <span className="font-bold text-foreground">
                  {event.isPaid ? `₹${event.entryFeeINR} INR` : "FREE ENTRY"}
                </span>
              </div>
            </div>
          </div>

          {/* Section 4 Strict CTA Gating Table Logic */}
          <div className="p-6 rounded-2xl bg-muted/40 border border-border flex flex-col sm:flex-row items-center justify-between gap-4 font-mono">
            <div>
              <div className="text-xs text-muted-foreground uppercase font-bold">Registration &amp; Arena Status</div>
              <div className="text-sm font-bold text-foreground mt-0.5">
                {isEnded
                  ? "Event Ended"
                  : isLive
                  ? "CTF Arena Open ⚡"
                  : `Starts in: ${countdown || "Upcoming"}`}
              </div>
            </div>

            {/* STRICT COMPUTED CTA BUTTON */}
            {authStatus === "unauthenticated" ? (
              <Link href={`/login?callbackUrl=/events/${event.slug || event._id}`}>
                <Button className="bg-amber-500 hover:bg-amber-600 text-black font-bold text-xs h-11 px-6 rounded-xl">
                  Login to Register
                </Button>
              </Link>
            ) : !regInfo.isRegistered ? (
              <Link href={`/events/${event.slug || event._id}/register`}>
                <Button className="bg-amber-500 hover:bg-amber-600 text-black font-bold text-xs h-11 px-6 rounded-xl">
                  {event.isPaid ? `Register for ₹${event.entryFeeINR}` : "Register Free"}
                </Button>
              </Link>
            ) : regInfo.paymentStatus === "pending" || regInfo.paymentStatus === "failed" ? (
              <Link href={`/events/${event.slug || event._id}/register`}>
                <Button className="bg-amber-500 hover:bg-amber-600 text-black font-bold text-xs h-11 px-6 rounded-xl">
                  Complete Payment (Resumes Razorpay)
                </Button>
              </Link>
            ) : isEnded || regInfo.runStatus === "completed" ? (
              <Link href={`/events/${event.slug || event._id}/results`}>
                <Button className="bg-emerald-500 hover:bg-emerald-600 text-black font-bold text-xs h-11 px-6 rounded-xl">
                  View Results &amp; Standings
                </Button>
              </Link>
            ) : isRegisteredAndPaid && isLive ? (
              /* ENTER ARENA BUTTON - ONLY ACTIVATED HERE FOR REGISTERED USERS WHEN LIVE */
              <Link href={`/events/${event.slug || event._id}/arena`}>
                <Button className="bg-amber-500 hover:bg-amber-600 text-black font-extrabold text-xs h-11 px-8 rounded-xl shadow-lg shadow-amber-500/20 flex items-center gap-2">
                  Enter Arena <ArrowRight className="size-4" />
                </Button>
              </Link>
            ) : (
              /* Registered but Event Not Yet Live */
              <Button disabled className="bg-muted text-muted-foreground font-bold text-xs h-11 px-6 rounded-xl cursor-not-allowed">
                <CheckCircle2 className="size-4 text-emerald-400 mr-1.5" /> Registered ✓ — Starts in {countdown}
              </Button>
            )}
          </div>

          {/* Description Markdown */}
          <div className="space-y-3 border-t border-border pt-6">
            <h3 className="text-base font-bold text-foreground">Event Overview</h3>
            <div className="text-xs text-muted-foreground leading-relaxed">
              <MarkdownRenderer content={event.description} />
            </div>
          </div>

          {/* Rules */}
          {event.rules && (
            <div className="p-5 rounded-2xl bg-background border border-border space-y-2">
              <h3 className="text-xs font-bold text-amber-400 flex items-center gap-1.5 font-mono">
                <Shield className="size-4" /> Code of Conduct &amp; Rules
              </h3>
              <div className="text-xs text-muted-foreground leading-relaxed whitespace-pre-line font-mono">
                {event.rules}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
