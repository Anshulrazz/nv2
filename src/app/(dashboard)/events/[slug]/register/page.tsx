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
  Users,
  Plus,
  UserPlus,
  Send,
} from "lucide-react";
import Link from "next/link";
import { openRazorpayCheckout } from "@/lib/razorpay";

interface TeamMember {
  _id: string;
  name?: string;
  username?: string;
  image?: string;
}

interface Team {
  _id: string;
  teamName: string;
  leaderUserId: TeamMember;
  memberUserIds: TeamMember[];
  lookingForMembers: boolean;
}

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
  const [registrationId, setRegistrationId] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Team state (post-registration, for teamMode events)
  const [teamTab, setTeamTab] = useState<"create" | "join">("create");
  const [myTeam, setMyTeam] = useState<Team | null>(null);
  const [openTeams, setOpenTeams] = useState<Team[]>([]);
  const [loadingTeams, setLoadingTeams] = useState(false);
  const [teamName, setTeamName] = useState("");
  const [lookingForMembers, setLookingForMembers] = useState(true);
  const [creatingTeam, setCreatingTeam] = useState(false);
  const [teamError, setTeamError] = useState("");
  const [teamSuccess, setTeamSuccess] = useState("");
  const [sentRequestIds, setSentRequestIds] = useState<Set<string>>(new Set());
  const [sendingRequestId, setSendingRequestId] = useState<string | null>(null);

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

  // Load teams when success + teamMode
  useEffect(() => {
    if (!success || !event || !event.teamMode) return;

    async function loadTeams() {
      setLoadingTeams(true);
      try {
        // Check if already in a team
        const myRegRes = await fetch(`/api/events/${event!._id}/register`);
        if (myRegRes.ok) {
          const myRegData = await myRegRes.json();
          if (myRegData.registration?.teamId) {
            // Load team details
            const teamRes = await fetch(`/api/events/${event!._id}/teams`);
            if (teamRes.ok) {
              const teamData = await teamRes.json();
              const myT = (teamData.teams as Team[]).find(
                (t) => t._id === myRegData.registration.teamId
              );
              if (myT) setMyTeam(myT);
            }
          }
        }
        // Load open teams
        const openRes = await fetch(`/api/events/${event!._id}/teams?lookingForMembers=true`);
        if (openRes.ok) {
          const openData = await openRes.json();
          setOpenTeams(openData.teams ?? []);
        }
      } catch {
        /* silent */
      } finally {
        setLoadingTeams(false);
      }
    }
    loadTeams();
  }, [success, event]);

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

      setRegistrationId(data.registration?._id ?? null);

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

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    setTeamError("");
    setTeamSuccess("");
    if (!teamName.trim()) return;
    setCreatingTeam(true);
    try {
      const res = await fetch(`/api/events/${event!._id}/teams`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamName: teamName.trim(), lookingForMembers }),
      });
      const data = await res.json();
      if (!res.ok) {
        setTeamError(data.error || "Failed to create team.");
        return;
      }
      setMyTeam(data.team);
      setTeamSuccess(`Team "${data.team.teamName}" created!`);
      setTeamName("");
    } catch {
      setTeamError("Failed to create team.");
    } finally {
      setCreatingTeam(false);
    }
  };

  const handleJoinRequest = async (teamId: string) => {
    setSendingRequestId(teamId);
    try {
      const res = await fetch(`/api/events/${event!._id}/teams/${teamId}/join-request`, {
        method: "POST",
      });
      if (res.ok) {
        setSentRequestIds((prev) => new Set([...prev, teamId]));
      } else {
        const data = await res.json();
        setTeamError(data.error || "Failed to send join request.");
      }
    } catch {
      setTeamError("Failed to send join request.");
    } finally {
      setSendingRequestId(null);
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

  const isTeamMode = Boolean(event.teamMode);

  // ── Success state ──
  if (success) {
    return (
      <div className="min-h-screen bg-background px-4 py-10 max-w-lg mx-auto">
        {/* Success banner */}
        <div className="flex flex-col items-center gap-4 text-center mb-8">
          <div className="size-16 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
            <CheckCircle2 className="size-8 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">You&apos;re registered!</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Codename:{" "}
              <span className="font-mono font-bold text-foreground">{codename}</span>
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

        {/* Team panel — only for hackathon team mode */}
        {isTeamMode && (
          <div className="border border-sidebar-border rounded-2xl overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-4 border-b border-sidebar-border bg-sidebar">
              <Users className="size-4 text-primary" />
              <h3 className="text-sm font-bold text-foreground">Team Registration</h3>
              <span className="text-[10px] font-mono text-muted-foreground ml-auto">
                Max {event.maxTeamSize as number} members
              </span>
            </div>

            {loadingTeams ? (
              <div className="flex items-center justify-center py-10 gap-2">
                <Loader2 className="size-4 animate-spin text-primary" />
                <span className="text-xs text-muted-foreground">Loading teams…</span>
              </div>
            ) : myTeam ? (
              /* Already in a team */
              <div className="p-5 space-y-3">
                <div className="flex items-center gap-2 text-emerald-400 text-sm font-semibold">
                  <CheckCircle2 className="size-4" />
                  You&apos;re in a team!
                </div>
                <div className="bg-sidebar border border-sidebar-border rounded-xl p-4">
                  <p className="text-sm font-bold text-foreground mb-2">{myTeam.teamName}</p>
                  <div className="space-y-1.5">
                    {myTeam.memberUserIds.map((m) => (
                      <div key={m._id} className="flex items-center gap-2 text-xs text-muted-foreground">
                        <div className="size-5 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                          <User className="size-3 text-primary" />
                        </div>
                        {m.name ?? m.username ?? "Member"}
                        {m._id === myTeam.leaderUserId._id && (
                          <span className="text-[9px] bg-amber-500/20 text-amber-400 border border-amber-500/30 px-1.5 py-0.5 rounded font-mono">
                            Leader
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              /* Create / Join tabs */
              <div>
                {/* Tabs */}
                <div className="flex border-b border-sidebar-border">
                  <button
                    onClick={() => setTeamTab("create")}
                    className={`flex-1 py-2.5 text-xs font-semibold transition-colors ${
                      teamTab === "create"
                        ? "text-foreground border-b-2 border-primary bg-primary/5"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Plus className="size-3.5 inline mr-1" />
                    Create Team
                  </button>
                  <button
                    onClick={() => setTeamTab("join")}
                    className={`flex-1 py-2.5 text-xs font-semibold transition-colors ${
                      teamTab === "join"
                        ? "text-foreground border-b-2 border-primary bg-primary/5"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <UserPlus className="size-3.5 inline mr-1" />
                    Join a Team ({openTeams.length})
                  </button>
                </div>

                {/* Create Team tab */}
                {teamTab === "create" && (
                  <form onSubmit={handleCreateTeam} className="p-5 space-y-4">
                    <div>
                      <label className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground block mb-1.5">
                        Team Name *
                      </label>
                      <input
                        required
                        value={teamName}
                        onChange={(e) => setTeamName(e.target.value)}
                        placeholder="awesome-hackers"
                        className="w-full bg-sidebar border border-sidebar-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/20 transition-all"
                      />
                    </div>

                    {/* Looking for members toggle */}
                    <div className="flex items-center justify-between bg-sidebar border border-sidebar-border rounded-xl px-4 py-3">
                      <div>
                        <p className="text-xs font-semibold text-foreground">Looking for members</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          Others can request to join your team
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setLookingForMembers((v) => !v)}
                        className={`size-6 rounded border-2 flex items-center justify-center transition-all ${
                          lookingForMembers ? "bg-primary border-primary" : "border-sidebar-border"
                        }`}
                      >
                        {lookingForMembers && <CheckCircle2 className="size-3.5 text-primary-foreground" />}
                      </button>
                    </div>

                    {teamError && (
                      <p className="text-xs text-destructive flex items-center gap-1.5">
                        <AlertCircle className="size-3.5 shrink-0" />
                        {teamError}
                      </p>
                    )}
                    {teamSuccess && (
                      <p className="text-xs text-emerald-400 flex items-center gap-1.5">
                        <CheckCircle2 className="size-3.5 shrink-0" />
                        {teamSuccess}
                      </p>
                    )}

                    <button
                      type="submit"
                      disabled={creatingTeam || !teamName.trim()}
                      className="w-full py-2.5 bg-primary text-primary-foreground rounded-xl font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center justify-center gap-2"
                    >
                      {creatingTeam ? (
                        <><Loader2 className="size-4 animate-spin" /> Creating…</>
                      ) : (
                        <><Plus className="size-4" /> Create Team</>
                      )}
                    </button>
                  </form>
                )}

                {/* Join Team tab */}
                {teamTab === "join" && (
                  <div className="p-5 space-y-3">
                    {openTeams.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground text-xs">
                        No open teams yet. Create one!
                      </div>
                    ) : (
                      openTeams.map((team) => (
                        <div
                          key={team._id}
                          className="flex items-center justify-between gap-3 bg-sidebar border border-sidebar-border rounded-xl px-4 py-3"
                        >
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-foreground truncate">
                              {team.teamName}
                            </p>
                            <p className="text-[10px] text-muted-foreground font-mono mt-0.5">
                              {team.memberUserIds.length} / {event.maxTeamSize as number} members
                            </p>
                          </div>
                          {sentRequestIds.has(team._id) ? (
                            <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1 shrink-0">
                              <CheckCircle2 className="size-3.5" /> Requested
                            </span>
                          ) : (
                            <button
                              onClick={() => handleJoinRequest(team._id)}
                              disabled={sendingRequestId === team._id}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-bold hover:opacity-90 transition-opacity disabled:opacity-50 shrink-0"
                            >
                              {sendingRequestId === team._id ? (
                                <Loader2 className="size-3.5 animate-spin" />
                              ) : (
                                <Send className="size-3.5" />
                              )}
                              Request
                            </button>
                          )}
                        </div>
                      ))
                    )}
                    {teamError && (
                      <p className="text-xs text-destructive flex items-center gap-1.5">
                        <AlertCircle className="size-3.5 shrink-0" />
                        {teamError}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
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

      {isTeamMode && (
        <div className="flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-xl px-4 py-3 mb-6 text-xs text-primary">
          <Users className="size-4 shrink-0" />
          Team event — after registering you can create or join a team (up to {event.maxTeamSize as number} members).
        </div>
      )}

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
      {/* suppress unused var warning */}
      {registrationId && null}
    </div>
  );
}
