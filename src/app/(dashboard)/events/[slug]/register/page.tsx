"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import {
  Loader2,
  CheckCircle2,
  AlertCircle,
  User,
  Lock,
  ChevronLeft,
  Users,
  Plus,
  Trash2,
  ShieldCheck,
  Mail,
} from "lucide-react";
import Link from "next/link";
import { openRazorpayCheckout } from "@/lib/razorpay";

interface VerifiedMember {
  email: string;
  user?: {
    _id: string;
    name?: string;
    username?: string;
    email: string;
    image?: string;
  };
  checking: boolean;
  exists: boolean | null;
  alreadyRegistered: boolean;
  error?: string;
}

interface TeamMemberResponse {
  _id: string;
  name?: string;
  username?: string;
  email?: string;
  image?: string;
}

interface TeamData {
  _id: string;
  teamName: string;
  leaderUserId: TeamMemberResponse;
  memberUserIds: TeamMemberResponse[];
}

export default function RegisterEventPage() {
  const { slug } = useParams<{ slug: string }>();

  const [event, setEvent] = useState<Record<string, unknown> | null>(null);
  const [loadingEvent, setLoadingEvent] = useState(true);
  const [codename, setCodename] = useState("");
  const [realName, setRealName] = useState("");
  const [acceptedCoC, setAcceptedCoC] = useState(false);
  const [codenameAvailable, setCodenameAvailable] = useState<boolean | null>(null);
  const [checkingCodename, setCheckingCodename] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [registeredTeam, setRegisteredTeam] = useState<TeamData | null>(null);

  // Team Registration State
  const [isTeamMode, setIsTeamMode] = useState(false);
  const [teamName, setTeamName] = useState("");
  const [memberRows, setMemberRows] = useState<VerifiedMember[]>([]);

  const debounceCodenameRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const memberDebounceMap = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());

  // Load event data
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/events/${slug}`);
        if (!res.ok) throw new Error("Event not found.");
        const data = await res.json();
        setEvent(data.event);
        setIsTeamMode(Boolean(data.event.teamMode));
      } catch {
        setError("Event not found.");
      } finally {
        setLoadingEvent(false);
      }
    }
    load();
  }, [slug]);

  // Debounced codename check
  useEffect(() => {
    if (!event || !codename.trim() || codename.trim().length < 3) {
      setCodenameAvailable(null);
      return;
    }

    if (debounceCodenameRef.current) clearTimeout(debounceCodenameRef.current);
    setCheckingCodename(true);

    debounceCodenameRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/events/${event._id}/codename-check?codename=${encodeURIComponent(codename.trim())}`
        );
        const data = await res.json();
        setCodenameAvailable(data.available);
      } catch {
        setCodenameAvailable(null);
      } finally {
        setCheckingCodename(false);
      }
    }, 400);
  }, [codename, event]);

  // Verify member email
  const verifyMemberEmail = useCallback(
    async (index: number, emailToVerify: string) => {
      const email = emailToVerify.trim().toLowerCase();
      if (!email || !event) {
        setMemberRows((prev) =>
          prev.map((row, i) =>
            i === index
              ? { ...row, checking: false, exists: null, user: undefined, error: undefined }
              : row
          )
        );
        return;
      }

      setMemberRows((prev) =>
        prev.map((row, i) => (i === index ? { ...row, checking: true, error: undefined } : row))
      );

      try {
        const res = await fetch(
          `/api/events/${event._id}/register/check-member?email=${encodeURIComponent(email)}`
        );
        const data = await res.json();

        setMemberRows((prev) =>
          prev.map((row, i) => {
            if (i !== index) return row;
            if (!res.ok || !data.exists) {
              return {
                ...row,
                checking: false,
                exists: false,
                alreadyRegistered: false,
                user: undefined,
                error: data.error || "Not registered on Notexia.",
              };
            }
            if (data.isSelf) {
              return {
                ...row,
                checking: false,
                exists: true,
                alreadyRegistered: false,
                user: undefined,
                error: "You are registering as the team leader.",
              };
            }
            if (data.alreadyRegistered) {
              return {
                ...row,
                checking: false,
                exists: true,
                alreadyRegistered: true,
                user: data.user,
                error: data.error || "Already registered for this event.",
              };
            }
            return {
              ...row,
              checking: false,
              exists: true,
              alreadyRegistered: false,
              user: data.user,
              error: undefined,
            };
          })
        );
      } catch {
        setMemberRows((prev) =>
          prev.map((row, i) =>
            i === index
              ? {
                  ...row,
                  checking: false,
                  exists: false,
                  user: undefined,
                  error: "Failed to verify email.",
                }
              : row
          )
        );
      }
    },
    [event]
  );

  const handleMemberEmailChange = (index: number, val: string) => {
    setMemberRows((prev) =>
      prev.map((row, i) => (i === index ? { ...row, email: val, error: undefined } : row))
    );

    const existingTimeout = memberDebounceMap.current.get(index);
    if (existingTimeout) clearTimeout(existingTimeout);

    const timeout = setTimeout(() => {
      verifyMemberEmail(index, val);
    }, 450);

    memberDebounceMap.current.set(index, timeout);
  };

  const handleAddMemberRow = () => {
    const maxMembers = ((event?.maxTeamSize as number) || 4) - 1;
    if (memberRows.length >= maxMembers) return;
    setMemberRows((prev) => [
      ...prev,
      { email: "", checking: false, exists: null, alreadyRegistered: false },
    ]);
  };

  const handleRemoveMemberRow = (index: number) => {
    const existingTimeout = memberDebounceMap.current.get(index);
    if (existingTimeout) clearTimeout(existingTimeout);
    memberDebounceMap.current.delete(index);
    setMemberRows((prev) => prev.filter((_, i) => i !== index));
  };

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

    if (isTeamMode) {
      if (!teamName.trim()) {
        setError("Team Name is required for team registration.");
        return;
      }

      // Validate member rows
      for (const row of memberRows) {
        if (!row.email.trim()) continue;
        if (row.checking) {
          setError("Please wait for member email verifications to complete.");
          return;
        }
        if (row.exists === false || row.error) {
          setError(`Invalid member: ${row.email}. ${row.error || "Must be a registered Notexia user."}`);
          return;
        }
        if (row.alreadyRegistered) {
          setError(`Member ${row.email} is already registered for this event.`);
          return;
        }
      }
    }

    setSubmitting(true);

    try {
      const memberEmails = isTeamMode
        ? memberRows
            .map((r) => r.email.trim().toLowerCase())
            .filter((e) => Boolean(e))
        : [];

      const res = await fetch(`/api/events/${event?._id}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          codename: codename.trim(),
          realName: realName.trim(),
          acceptedCodeOfConduct: acceptedCoC,
          isTeamRegistration: isTeamMode,
          teamName: isTeamMode ? teamName.trim() : undefined,
          memberEmails,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Registration failed.");
        return;
      }

      if (data.team) {
        setRegisteredTeam(data.team);
      }

      if (data.requiresPayment && data.order) {
        await openRazorpayCheckout({
          key: data.order.keyId,
          amount: data.order.amount,
          currency: data.order.currency,
          name: String(event?.name ?? "Event Registration"),
          description: `Registration for ${event?.name}`,
          order_id: data.order.id,
          handler: () => {
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

  // ── Success State ──
  if (success) {
    return (
      <div className="min-h-screen bg-background px-4 py-12 max-w-lg mx-auto">
        <div className="flex flex-col items-center gap-4 text-center mb-8">
          <div className="size-16 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shadow-lg shadow-emerald-500/10">
            <CheckCircle2 className="size-8 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground">You&apos;re registered!</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Your alias: <span className="font-mono font-bold text-primary">{codename}</span>
            </p>
            {Boolean(event.isPaid) && (
              <p className="text-xs text-emerald-400/90 mt-1">
                Payment confirmed. Spot secured!
              </p>
            )}
          </div>
        </div>

        {/* Team Card if registered as team */}
        {registeredTeam && (
          <div className="border border-sidebar-border bg-sidebar rounded-2xl p-5 mb-8 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-sidebar-border pb-3">
              <div className="flex items-center gap-2">
                <Users className="size-4 text-primary" />
                <h3 className="text-sm font-bold text-foreground">{registeredTeam.teamName}</h3>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 bg-primary/10 border border-primary/20 text-primary rounded-full font-bold">
                Team Registered
              </span>
            </div>

            <div>
              <p className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground mb-2">
                Team Roster ({registeredTeam.memberUserIds?.length || 1} members)
              </p>
              <div className="space-y-2">
                {registeredTeam.memberUserIds?.map((m) => {
                  const isLeader =
                    (typeof registeredTeam.leaderUserId === "object"
                      ? registeredTeam.leaderUserId._id
                      : registeredTeam.leaderUserId) === m._id;
                  return (
                    <div
                      key={m._id}
                      className="flex items-center justify-between bg-background border border-sidebar-border rounded-xl px-3 py-2 text-xs"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        {m.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={m.image}
                            alt=""
                            className="size-6 rounded-full object-cover border border-sidebar-border"
                          />
                        ) : (
                          <div className="size-6 rounded-full bg-primary/20 flex items-center justify-center text-[11px] font-bold text-primary">
                            {(m.name || m.username || "U")[0].toUpperCase()}
                          </div>
                        )}
                        <div className="truncate">
                          <p className="font-semibold text-foreground truncate">
                            {m.name || m.username || m.email}
                          </p>
                          {m.email && (
                            <p className="text-[10px] text-muted-foreground truncate">{m.email}</p>
                          )}
                        </div>
                      </div>
                      {isLeader && (
                        <span className="text-[9px] bg-amber-500/15 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded font-mono font-bold shrink-0">
                          Leader
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <Link
            href={`/events/${slug}`}
            className="flex-1 py-3 bg-sidebar border border-sidebar-border text-foreground rounded-xl text-sm font-bold text-center hover:border-primary/40 transition-all"
          >
            Back to Event
          </Link>
          <Link
            href={`/events/${slug}/arena`}
            className="flex-1 py-3 bg-primary text-primary-foreground rounded-xl text-sm font-bold text-center hover:opacity-90 transition-opacity"
          >
            Enter Arena →
          </Link>
        </div>
      </div>
    );
  }

  const inputCls =
    "w-full bg-sidebar border border-sidebar-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/20 transition-all";
  const maxAllowedMembers = ((event?.maxTeamSize as number) || 4) - 1;

  return (
    <div className="min-h-screen bg-background px-4 py-10 max-w-lg mx-auto">
      <Link
        href={`/events/${slug}`}
        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ChevronLeft className="size-3.5" />
        Back to event
      </Link>

      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[10px] font-mono uppercase tracking-widest text-primary font-bold">
            {event.type as string} Registration
          </span>
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">{event.name as string}</h1>
        <p className="text-xs text-muted-foreground mt-1">
          Complete the details below to secure your spot.
        </p>
      </div>

      {/* Info Badges */}
      <div className="space-y-2 mb-6">
        {Boolean(event.teamMode) && (
          <div className="flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-xl px-4 py-3 text-xs text-primary">
            <Users className="size-4 shrink-0" />
            <span>
              <strong>Team Event</strong>: Register your entire team at once. Add members by their Notexia email (Max {event.maxTeamSize as number} members per team).
            </span>
          </div>
        )}

        {Boolean(event.isPaid) && (
          <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 rounded-xl px-4 py-3 text-xs text-amber-400">
            <Lock className="size-4 shrink-0" />
            <span>
              <strong>Paid Entry</strong>: ₹{event.price as number}. Payment will be required to confirm your spot.
            </span>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Team Details Section (for Team Events) */}
        {isTeamMode && (
          <div className="border border-sidebar-border bg-sidebar/50 rounded-2xl p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Users className="size-4 text-primary" />
              <h2 className="text-sm font-bold text-foreground">Team Details</h2>
            </div>

            {/* Team Name */}
            <div>
              <label
                htmlFor="reg-teamname"
                className="text-xs font-mono font-bold uppercase tracking-widest text-muted-foreground mb-1.5 block"
              >
                Team Name <span className="text-destructive">*</span>
              </label>
              <input
                id="reg-teamname"
                type="text"
                required={isTeamMode}
                placeholder="e.g. CyberVanguard"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                className={inputCls}
              />
            </div>

            {/* Team Members Section */}
            <div className="pt-2 border-t border-sidebar-border">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <label className="text-xs font-mono font-bold uppercase tracking-widest text-muted-foreground block">
                    Team Members (By Email)
                  </label>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    Members must have a registered Notexia account.
                  </p>
                </div>
                <span className="text-[10px] font-mono text-muted-foreground">
                  {memberRows.length + 1} / {event.maxTeamSize as number}
                </span>
              </div>

              {/* Dynamic Member Rows */}
              <div className="space-y-2.5 mt-3">
                {memberRows.map((member, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-background border border-sidebar-border rounded-xl space-y-2"
                  >
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <input
                          type="email"
                          required
                          placeholder="member@notexia.com"
                          value={member.email}
                          onChange={(e) => handleMemberEmailChange(idx, e.target.value)}
                          className={`${inputCls} pr-9 text-xs`}
                        />
                        <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
                          {member.checking ? (
                            <Loader2 className="size-3.5 animate-spin text-muted-foreground" />
                          ) : member.exists === true && !member.alreadyRegistered && !member.error ? (
                            <CheckCircle2 className="size-3.5 text-emerald-400" />
                          ) : member.exists === false || member.alreadyRegistered || member.error ? (
                            <AlertCircle className="size-3.5 text-destructive" />
                          ) : (
                            <Mail className="size-3.5 text-muted-foreground/50" />
                          )}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveMemberRow(idx)}
                        className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                        title="Remove member"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>

                    {/* Member Verified Card */}
                    {member.user && !member.alreadyRegistered && !member.error && (
                      <div className="flex items-center gap-2 px-2.5 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-xs">
                        {member.user.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={member.user.image}
                            alt=""
                            className="size-5 rounded-full object-cover"
                          />
                        ) : (
                          <div className="size-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-[10px]">
                            {(member.user.name || member.user.username || "U")[0].toUpperCase()}
                          </div>
                        )}
                        <span className="font-semibold text-foreground truncate">
                          {member.user.name || member.user.username}
                        </span>
                        <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1 ml-auto shrink-0">
                          <ShieldCheck className="size-3" /> Notexia Verified
                        </span>
                      </div>
                    )}

                    {/* Member Error / Unregistered Notice */}
                    {member.error && (
                      <p className="text-[10px] text-destructive flex items-center gap-1 px-1">
                        <AlertCircle className="size-3 shrink-0" />
                        {member.error}
                      </p>
                    )}
                  </div>
                ))}

                {memberRows.length < maxAllowedMembers && (
                  <button
                    type="button"
                    onClick={handleAddMemberRow}
                    className="w-full py-2 bg-sidebar border border-dashed border-sidebar-border hover:border-primary/50 text-xs font-semibold text-muted-foreground hover:text-foreground rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Plus className="size-3.5 text-primary" /> Add Team Member by Email
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Leader Profile Details Section */}
        <div className="border border-sidebar-border bg-sidebar/50 rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2">
            <User className="size-4 text-primary" />
            <h2 className="text-sm font-bold text-foreground">
              {isTeamMode ? "Team Leader Details (You)" : "Participant Details"}
            </h2>
          </div>

          {/* Codename */}
          <div>
            <label
              htmlFor="reg-codename"
              className="text-xs font-mono font-bold uppercase tracking-widest text-muted-foreground mb-1.5 block"
            >
              Public Codename / Alias <span className="text-destructive">*</span>
            </label>
            <div className="relative">
              <input
                id="reg-codename"
                type="text"
                required
                minLength={3}
                maxLength={30}
                placeholder="e.g. shadow_runner"
                value={codename}
                onChange={(e) => setCodename(e.target.value.replace(/\s/g, "-").toLowerCase())}
                className={`${inputCls} pr-10`}
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {checkingCodename ? (
                  <Loader2 className="size-4 animate-spin text-muted-foreground" />
                ) : codenameAvailable === true ? (
                  <CheckCircle2 className="size-4 text-emerald-400" />
                ) : codenameAvailable === false ? (
                  <AlertCircle className="size-4 text-destructive" />
                ) : null}
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">
              Your public handle on the event leaderboard.
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
              Used strictly for verification & certificate generation.
            </p>
          </div>
        </div>

        {/* Code of Conduct Acceptance */}
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
              I accept the Code of Conduct and event rules
            </p>
            {Boolean(event.codeOfConductUrl) && (
              <Link
                href={event.codeOfConductUrl as string}
                target="_blank"
                className="text-[10px] text-primary hover:underline block mt-0.5"
              >
                Read the Code of Conduct →
              </Link>
            )}
          </div>
        </div>

        {error && (
          <div className="flex items-start gap-2 bg-destructive/10 border border-destructive/30 rounded-xl px-4 py-3 text-sm text-destructive">
            <AlertCircle className="size-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={submitting || codenameAvailable === false || !acceptedCoC}
          className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
        >
          {submitting ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              {Boolean(event.isPaid) ? "Creating order..." : "Registering Team..."}
            </>
          ) : Boolean(event.isPaid) ? (
            `Register & Pay ₹${event.price}`
          ) : isTeamMode ? (
            "Complete Team Registration"
          ) : (
            "Register for Free"
          )}
        </button>
      </form>
    </div>
  );
}
