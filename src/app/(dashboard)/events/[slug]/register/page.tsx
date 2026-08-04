"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Loader2,
  CheckCircle2,
  AlertCircle,
  User,
  Lock,
  ChevronLeft,
} from "lucide-react";
import Link from "next/link";
import { openRazorpayCheckout } from "@/lib/razorpay";

export default function RegisterEventPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();

  const [event, setEvent] = useState<Record<string, unknown> | null>(null);
  const [loadingEvent, setLoadingEvent] = useState(true);
  const [codename, setCodename] = useState("");
  const [realName, setRealName] = useState("");
  const [acceptedCoC, setAcceptedCoC] = useState(false);
  const [codenameAvailable, setCodenameAvailable] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load event data
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/events/${slug}`);
        if (!res.ok) throw new Error("Event not found.");
        const data = await res.json();
        setEvent(data.event);
      } catch {
        setError("Event not found.");
      } finally {
        setLoadingEvent(false);
      }
    }
    load();
  }, [slug]);

  // Debounced codename availability check
  useEffect(() => {
    if (!event || !codename.trim() || codename.trim().length < 3) {
      setCodenameAvailable(null);
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);
    setChecking(true);

    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/events/${event._id}/codename-check?codename=${encodeURIComponent(codename.trim())}`
        );
        const data = await res.json();
        setCodenameAvailable(data.available);
      } catch {
        setCodenameAvailable(null);
      } finally {
        setChecking(false);
      }
    }, 400);
  }, [codename, event]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!acceptedCoC) {
      setError("You must accept the Code of Conduct.");
      return;
    }
    if (codenameAvailable === false) {
      setError("This codename is taken. Choose another.");
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch(`/api/events/${event?._id}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          codename: codename.trim(),
          realName: realName.trim(),
          acceptedCodeOfConduct: acceptedCoC,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Registration failed.");
        return;
      }

      if (data.requiresPayment && data.order) {
        // Open Razorpay checkout
        await openRazorpayCheckout({
          key: data.order.keyId,
          amount: data.order.amount,
          currency: data.order.currency,
          name: String(event?.name ?? "Event Registration"),
          description: `Registration for ${event?.name}`,
          order_id: data.order.id,
          handler: () => {
            // Payment captured — webhook will flip status server-side
            setSuccess(true);
          },
          modal: {
            ondismiss: () => {
              setError("Payment cancelled. Your registration is pending payment.");
            },
          },
        });
        return;
      }

      setSuccess(true);
    } catch {
      setError("Registration failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingEvent) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="size-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <AlertCircle className="size-8 text-destructive" />
        <p className="text-sm text-muted-foreground">{error || "Event not found."}</p>
        <Link href="/events" className="text-xs text-primary hover:underline">
          Browse events
        </Link>
      </div>
    );
  }

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center px-4">
        <div className="size-16 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
          <CheckCircle2 className="size-8 text-emerald-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground">You&apos;re registered!</h2>
          <p className="text-sm text-muted-foreground mt-2">
            Codename: <span className="font-mono font-bold text-foreground">{codename}</span>
          </p>
          {Boolean(event.isPaid) && (
            <p className="text-xs text-muted-foreground mt-1">
              Payment processing. Your spot is reserved.
            </p>
          )}
        </div>
        <Link
          href={`/events/${slug}`}
          className="px-6 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-bold hover:opacity-90 transition-opacity"
        >
          Back to Event
        </Link>
      </div>
    );
  }

  const inputCls =
    "w-full bg-sidebar border border-sidebar-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/20 transition-all";

  return (
    <div className="min-h-screen bg-background px-4 py-10 max-w-md mx-auto">
      <Link
        href={`/events/${slug}`}
        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ChevronLeft className="size-3.5" />
        Back to event
      </Link>

      <h1 className="text-2xl font-bold text-foreground mb-1">Register</h1>
      <p className="text-sm text-muted-foreground mb-6">
        {event.name as string}
      </p>

      {Boolean(event.isPaid) && (
        <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 rounded-xl px-4 py-3 mb-6 text-xs text-amber-400">
          <Lock className="size-4 shrink-0" />
          Paid event — ₹{event.price as number}. Payment required to confirm your spot.
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Codename */}
        <div>
          <label
            htmlFor="reg-codename"
            className="text-xs font-mono font-bold uppercase tracking-widest text-muted-foreground mb-1.5 block"
          >
            Codename <span className="text-destructive">*</span>
          </label>
          <div className="relative">
            <input
              id="reg-codename"
              type="text"
              required
              minLength={3}
              maxLength={30}
              placeholder="your-hacker-alias"
              value={codename}
              onChange={(e) => setCodename(e.target.value.replace(/\s/g, "-").toLowerCase())}
              className={`${inputCls} pr-10`}
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              {checking ? (
                <Loader2 className="size-4 animate-spin text-muted-foreground" />
              ) : codenameAvailable === true ? (
                <CheckCircle2 className="size-4 text-emerald-400" />
              ) : codenameAvailable === false ? (
                <AlertCircle className="size-4 text-destructive" />
              ) : null}
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground mt-1">
            This is your public alias — your real name stays private.
          </p>
          {codenameAvailable === false && (
            <p className="text-[10px] text-destructive mt-1">
              This codename is taken. Choose another.
            </p>
          )}
          {codenameAvailable === true && (
            <p className="text-[10px] text-emerald-400 mt-1">Available!</p>
          )}
        </div>

        {/* Real Name */}
        <div>
          <label
            htmlFor="reg-realname"
            className="text-xs font-mono font-bold uppercase tracking-widest text-muted-foreground mb-1.5 block"
          >
            <User className="size-3 inline mr-1" />
            Real Name <span className="text-destructive">*</span>
          </label>
          <input
            id="reg-realname"
            type="text"
            required
            placeholder="Your full name"
            value={realName}
            onChange={(e) => setRealName(e.target.value)}
            className={inputCls}
          />
          <p className="text-[10px] text-muted-foreground mt-1">
            Used only for certificates — never shown publicly.
          </p>
        </div>

        {/* Code of Conduct */}
        <div className="flex items-start gap-3 bg-sidebar border border-sidebar-border rounded-xl p-4">
          <button
            type="button"
            onClick={() => setAcceptedCoC((v) => !v)}
            className={`mt-0.5 size-5 rounded border-2 flex items-center justify-center shrink-0 transition-all ${
              acceptedCoC ? "bg-primary border-primary" : "border-sidebar-border"
            }`}
          >
            {acceptedCoC && <CheckCircle2 className="size-3 text-primary-foreground" />}
          </button>
          <div>
            <p className="text-xs text-foreground font-medium">
              I accept the Code of Conduct
            </p>
            {Boolean(event.codeOfConductUrl) && (
              <Link
                href={event.codeOfConductUrl as string}
                target="_blank"
                className="text-[10px] text-primary hover:underline"
              >
                Read the Code of Conduct →
              </Link>
            )}
          </div>
        </div>

        {error && (
          <div className="flex items-start gap-2 bg-destructive/10 border border-destructive/30 rounded-xl px-4 py-3 text-sm text-destructive">
            <AlertCircle className="size-4 mt-0.5 shrink-0" />
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting || codenameAvailable === false || !acceptedCoC}
          className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {submitting ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              {Boolean(event.isPaid) ? "Creating order..." : "Registering..."}
            </>
          ) : Boolean(event.isPaid) ? (
            `Register & Pay ₹${event.price}`
          ) : (
            "Register for Free"
          )}
        </button>
      </form>
    </div>
  );
}
