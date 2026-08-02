"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  Trophy,
  CheckCircle2,
  XCircle,
  Loader2,
  ArrowLeft,
  Coins,
  ShieldCheck,
  User,
  AtSign,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface EventInfo {
  _id: string;
  title: string;
  slug: string;
  description: string;
  category: string;
  isPaid: boolean;
  entryFeeINR: number;
  registrationStart: string;
  registrationEnd: string;
  eventStart: string;
  eventEnd: string;
  rules?: string;
}

export default function EventRegisterPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [event, setEvent] = useState<EventInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [agreeRules, setAgreeRules] = useState(false);

  // Username Availability State
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [isUsernameAvailable, setIsUsernameAvailable] = useState<boolean | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  // Submitting / Razorpay
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function fetchEvent() {
      try {
        const res = await fetch(`/api/events/${slug}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Event not found");
        setEvent(data.event);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Error loading event";
        setError(msg);
      } finally {
        setLoading(false);
      }
    }
    if (slug) fetchEvent();
  }, [slug]);

  // Debounced username availability check (400ms)
  const checkUsername = useCallback(
    async (uname: string) => {
      if (!event || !uname.trim()) {
        setIsUsernameAvailable(null);
        setSuggestions([]);
        return;
      }
      setCheckingUsername(true);
      try {
        const res = await fetch(
          `/api/events/${event._id}/username-check?u=${encodeURIComponent(uname)}&displayName=${encodeURIComponent(displayName)}`
        );
        const data = await res.json();
        setIsUsernameAvailable(data.available);
        setSuggestions(data.suggestions || []);
      } catch (err) {
        console.error("Username check error:", err);
      } finally {
        setCheckingUsername(false);
      }
    },
    [event, displayName]
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      if (username) {
        checkUsername(username);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [username, checkUsername]);

  const loadRazorpaySDK = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if (typeof window === "undefined") return resolve(false);
      if ((window as unknown as { Razorpay?: unknown }).Razorpay) return resolve(true);
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!event || submitting) return;

    if (!displayName.trim() || !username.trim()) {
      alert("Display Name and Username are required.");
      return;
    }
    if (isUsernameAvailable === false) {
      alert("Please choose an available username.");
      return;
    }
    if (!agreeRules) {
      alert("Please agree to the event rules to proceed.");
      return;
    }

    setSubmitting(true);

    try {
      if (!event.isPaid || (event.entryFeeINR || 0) <= 0) {
        // Free Registration
        const res = await fetch(`/api/events/${event._id}/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ displayName, username }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to register");

        alert(data.message || "Registered successfully!");
        router.push(`/events/${event.slug}/challenges`);
      } else {
        // Paid Registration via Razorpay INR Gateway
        const loaded = await loadRazorpaySDK();
        if (!loaded) throw new Error("Razorpay SDK failed to load. Check your connection.");

        const res = await fetch(`/api/events/${event._id}/create-order`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ displayName, username }),
        });
        const orderData = await res.json();
        if (!res.ok) throw new Error(orderData.error || "Failed to create Razorpay order.");

        const options = {
          key: orderData.keyId,
          amount: orderData.amount,
          currency: "INR",
          name: "Notexia CTF",
          description: `Entry Ticket for ${event.title}`,
          order_id: orderData.orderId,
          handler: async function (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) {
            try {
              const verifyRes = await fetch(`/api/events/${event._id}/verify-payment`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                  displayName,
                  username,
                }),
              });
              const verifyData = await verifyRes.json();
              if (!verifyRes.ok) throw new Error(verifyData.error || "Payment verification failed.");

              alert(verifyData.message || "Payment successful!");
              router.push(`/events/${event.slug}/challenges`);
            } catch (vErr: unknown) {
              const msg = vErr instanceof Error ? vErr.message : "Payment verification failed.";
              alert(msg);
            }
          },
          theme: { color: "#F59E0B" },
        };

        const RazorpayClass = (window as unknown as { Razorpay: new (opts: unknown) => { open: () => void } }).Razorpay;
        const razorpayWindow = new RazorpayClass(options);
        razorpayWindow.open();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error registering";
      alert(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-8 space-y-4">
        <Loader2 className="size-8 text-amber-500 animate-spin" />
        <p className="text-xs text-muted-foreground font-mono">Loading event registration...</p>
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

  return (
    <div className="w-full min-h-screen bg-background text-foreground p-4 sm:p-6 lg:p-10 space-y-8">
      <Link href="/events">
        <Button variant="ghost" size="sm" className="gap-2 text-xs font-bold hover:bg-card">
          <ArrowLeft className="size-4" /> Back to Events Hub
        </Button>
      </Link>

      <div className="max-w-2xl mx-auto bg-card border border-border rounded-3xl p-6 sm:p-10 space-y-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 rounded-full filter blur-3xl pointer-events-none" />

        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 text-amber-400 font-mono text-xs font-bold">
            <Trophy className="size-4" /> CTF Competitor Registration
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight" style={{ fontFamily: "var(--font-space-grotesk)" }}>
            Register for {event.title}
          </h1>
          <p className="text-xs text-muted-foreground">
            {event.isPaid ? `Entry Fee: ₹${event.entryFeeINR} INR` : "Free Registration"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Display Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <User className="size-3.5 text-amber-400" /> Competitor Display Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Alex Rivera"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-4 py-3 bg-background border border-border rounded-2xl text-xs font-medium focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Username with debounced check & chips */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <AtSign className="size-3.5 text-cyan-400" /> Event Username (Unique Handle) *
              </label>
              {checkingUsername ? (
                <span className="text-[11px] font-mono text-amber-400 flex items-center gap-1">
                  <Loader2 className="size-3 animate-spin" /> Checking...
                </span>
              ) : isUsernameAvailable === true ? (
                <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="size-3" /> Available
                </span>
              ) : isUsernameAvailable === false ? (
                <span className="text-[11px] font-mono text-destructive flex items-center gap-1">
                  <XCircle className="size-3" /> Username Taken
                </span>
              ) : null}
            </div>

            <input
              type="text"
              required
              placeholder="e.g. alex_cipher"
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_.]/g, ""))}
              className={`w-full px-4 py-3 bg-background border rounded-2xl text-xs font-mono focus:outline-none transition-colors ${
                isUsernameAvailable === false
                  ? "border-destructive focus:border-destructive"
                  : isUsernameAvailable === true
                  ? "border-emerald-500 focus:border-emerald-500"
                  : "border-border focus:border-amber-500"
              }`}
            />

            {/* Auto-suggestions chips */}
            {isUsernameAvailable === false && suggestions.length > 0 && (
              <div className="pt-2 space-y-1.5 animate-in fade-in duration-200">
                <p className="text-[11px] text-muted-foreground font-mono">Suggested available handles:</p>
                <div className="flex flex-wrap gap-2">
                  {suggestions.map((sug) => (
                    <button
                      key={sug}
                      type="button"
                      onClick={() => setUsername(sug)}
                      className="px-3 py-1 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 text-xs font-mono font-bold hover:bg-amber-500/30 transition-colors cursor-pointer"
                    >
                      @{sug}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Rules agreement */}
          {event.rules && (
            <div className="p-4 rounded-2xl bg-muted/40 border border-border space-y-2 text-xs">
              <span className="font-bold text-amber-400 flex items-center gap-1.5">
                <ShieldCheck className="size-4" /> Event Rules &amp; Code of Conduct
              </span>
              <p className="text-muted-foreground whitespace-pre-line text-[11px] leading-relaxed">
                {event.rules}
              </p>
            </div>
          )}

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="rules-check"
              checked={agreeRules}
              onChange={(e) => setAgreeRules(e.target.checked)}
              className="size-4 accent-amber-500 rounded cursor-pointer"
            />
            <label htmlFor="rules-check" className="text-xs text-foreground cursor-pointer select-none">
              I agree to the CTF event rules and fair competition policy.
            </label>
          </div>

          <Button
            type="submit"
            disabled={submitting || isUsernameAvailable === false}
            className="w-full bg-amber-500 hover:bg-amber-600 text-black font-bold text-xs h-11 rounded-2xl shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2"
          >
            {submitting ? (
              <Loader2 className="size-4 animate-spin" />
            ) : event.isPaid ? (
              <>
                <Coins className="size-4" /> Pay ₹{event.entryFeeINR} via Razorpay &amp; Register
              </>
            ) : (
              "Complete Free Registration 🎉"
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
