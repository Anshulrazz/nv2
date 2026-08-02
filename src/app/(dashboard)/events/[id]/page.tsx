"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Trophy,
  Calendar,
  Sparkles,
  Users,
  MapPin,
  Coins,
  CheckCircle2,
  Lock,
  ExternalLink,
  Award,
  Clock,
  Video,
  Code2,
  Globe,
  Loader2,
  ArrowLeft,
  Send,
  Sliders,
  Flag,
  HelpCircle,
  SkipForward,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface UserProfile {
  _id: string;
  name?: string;
  email?: string;
  image?: string;
  role?: string;
  points?: number;
}

interface ChallengeItem {
  _id: string;
  title: string;
  description: string;
  category?: string;
  points: number;
  timeLimitMinutes?: number;
  flag?: string;
  hints?: string[];
  imageUrl?: string;
}

interface EventData {
  _id: string;
  title: string;
  slug: string;
  description: string;
  shortDescription?: string;
  bannerImage?: string;
  hostId: UserProfile;
  eventType: "hackathon" | "seminar" | "workshop" | "webinar" | "other";
  isPaid: boolean;
  priceINR: number;
  mode: "online" | "offline" | "hybrid";
  location?: string;
  meetingLink?: string;
  startDate: string;
  endDate: string;
  registrationDeadline: string;
  tags: string[];
  problemStatement?: string;
  prizes?: string;
  status: "upcoming" | "live" | "ended" | "cancelled";
  challenges?: ChallengeItem[];
  isResultsPublished: boolean;
  publishedResults?: Array<{
    rank: number;
    participantId: UserProfile | string;
    submissionId?: string;
    prize?: string;
    note?: string;
  }>;
  participantCount: number;
  isJoined: boolean;
  isHost: boolean;
  canManage: boolean;
  userRegistration?: {
    registeredAt: string;
    paymentStatus: string;
    paymentMethod: string;
  } | null;
  userSubmission?: {
    _id: string;
    projectTitle: string;
    description: string;
    githubUrl?: string;
    demoUrl?: string;
    techStack: string[];
    score: number;
    solvedChallenges?: Array<{ challengeId: string; pointsEarned: number }>;
    skippedChallenges?: Array<{ challengeId: string; skippedAt: string }>;
    feedback?: string;
  } | null;
}

interface SubmissionItem {
  _id: string;
  userId: UserProfile;
  projectTitle: string;
  description: string;
  githubUrl?: string;
  demoUrl?: string;
  techStack: string[];
  score: number;
  feedback?: string;
  isShortlisted: boolean;
  submittedAt: string;
  rank: number;
}

interface ParticipantItem {
  _id: string;
  userId: UserProfile;
  paymentStatus: string;
  paymentMethod: string;
  registeredAt: string;
}

export default function EventDetailPage() {
  const [eventId, setEventId] = useState<string | null>(null);
  const [eventData, setEventData] = useState<EventData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Active view tab
  const [activeTab, setActiveTab] = useState<"overview" | "challenges" | "submit" | "leaderboard" | "results" | "host">("overview");

  // Joining state
  const [joining, setJoining] = useState(false);

  // Flag Submission State
  const [flagInputs, setFlagInputs] = useState<Record<string, string>>({});
  const [submittingFlagId, setSubmittingFlagId] = useState<string | null>(null);
  const [flagMessages, setFlagMessages] = useState<Record<string, { type: "success" | "error"; text: string }>>({});

  // Participant Project Submission Form
  const [projTitle, setProjTitle] = useState("");
  const [projDesc, setProjDesc] = useState("");
  const [projGithub, setProjGithub] = useState("");
  const [projDemo, setProjDemo] = useState("");
  const [projTech, setProjTech] = useState("");
  const [submittingProject, setSubmittingProject] = useState(false);
  const [submitMsg, setSubmitMsg] = useState<string | null>(null);

  // Submissions & Leaderboard Data
  const [submissions, setSubmissions] = useState<SubmissionItem[]>([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);

  // Host Data: Participants List
  const [participants, setParticipants] = useState<ParticipantItem[]>([]);
  const [loadingParticipants, setLoadingParticipants] = useState(false);

  // Grading Form State (Host)
  const [gradingScores, setGradingScores] = useState<Record<string, number>>({});
  const [gradingNotes, setGradingNotes] = useState<Record<string, string>>({});
  const [savingGradeId, setSavingGradeId] = useState<string | null>(null);

  // Winners Selection State (Host)
  const [winner1, setWinner1] = useState("");
  const [winner2, setWinner2] = useState("");
  const [winner3, setWinner3] = useState("");
  const [prize1Note, setPrize1Note] = useState("");
  const [prize2Note, setPrize2Note] = useState("");
  const [prize3Note, setPrize3Note] = useState("");
  const [publishingResults, setPublishingResults] = useState(false);

  useEffect(() => {
    // Get event id from path
    const pathSegments = window.location.pathname.split("/");
    const id = pathSegments[pathSegments.length - 1];
    if (id) {
      setEventId(id);
    }
  }, []);

  const fetchEventDetails = useCallback(async () => {
    if (!eventId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/events/${eventId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Event not found");

      setEventData(data.event);

      // Pre-fill user submission form if already submitted
      if (data.event.userSubmission) {
        setProjTitle(data.event.userSubmission.projectTitle || "");
        setProjDesc(data.event.userSubmission.description || "");
        setProjGithub(data.event.userSubmission.githubUrl || "");
        setProjDemo(data.event.userSubmission.demoUrl || "");
        setProjTech((data.event.userSubmission.techStack || []).join(", "));
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error loading event";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  const fetchSubmissions = useCallback(async () => {
    if (!eventId) return;
    setLoadingSubmissions(true);
    try {
      const res = await fetch(`/api/events/${eventId}/submissions`);
      const data = await res.json();
      if (res.ok) {
        setSubmissions(data.submissions || []);
        // Init grading scores & notes
        const scores: Record<string, number> = {};
        const notes: Record<string, string> = {};
        (data.submissions || []).forEach((sub: SubmissionItem) => {
          scores[sub._id] = sub.score || 0;
          notes[sub._id] = sub.feedback || "";
        });
        setGradingScores(scores);
        setGradingNotes(notes);
      }
    } catch (err) {
      console.error("Failed to load submissions:", err);
    } finally {
      setLoadingSubmissions(false);
    }
  }, [eventId]);

  const fetchParticipants = useCallback(async () => {
    if (!eventId) return;
    setLoadingParticipants(true);
    try {
      const res = await fetch(`/api/events/${eventId}/participants`);
      const data = await res.json();
      if (res.ok) {
        setParticipants(data.participants || []);
      }
    } catch (err) {
      console.error("Failed to load participants:", err);
    } finally {
      setLoadingParticipants(false);
    }
  }, [eventId]);

  useEffect(() => {
    if (eventId) {
      fetchEventDetails();
      fetchSubmissions();
    }
  }, [eventId, fetchEventDetails, fetchSubmissions]);

  useEffect(() => {
    if (activeTab === "host" && eventData?.canManage) {
      fetchParticipants();
      fetchSubmissions();
    }
  }, [activeTab, eventData?.canManage, fetchParticipants, fetchSubmissions]);

  const loadRazorpayScript = (): Promise<boolean> => {
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

  const handleJoin = async () => {
    if (!eventData || joining) return;
    setJoining(true);

    try {
      if (!eventData.isPaid || (eventData.priceINR || 0) <= 0) {
        // Free Event Registration
        const res = await fetch(`/api/events/${eventData._id}/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || data.message || "Failed to join event");

        alert(`Successfully joined ${eventData.title}! 🎉`);
        fetchEventDetails();
      } else {
        // Direct INR Payment via Razorpay Gateway (No Coins)
        const loaded = await loadRazorpayScript();
        if (!loaded) {
          throw new Error("Razorpay SDK failed to load. Please check your internet connection.");
        }

        const res = await fetch(`/api/events/${eventData._id}/create-razorpay-order`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });
        const orderData = await res.json();
        if (!res.ok) throw new Error(orderData.error || "Failed to create Razorpay payment order.");

        const options = {
          key: orderData.keyId,
          amount: orderData.amount,
          currency: orderData.currency || "INR",
          name: "Notexia Events",
          description: `Direct INR Ticket for ${eventData.title}`,
          order_id: orderData.orderId,
          handler: async function (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) {
            try {
              const verifyRes = await fetch(`/api/events/${eventData._id}/verify-razorpay-payment`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                }),
              });
              const verifyData = await verifyRes.json();
              if (!verifyRes.ok) throw new Error(verifyData.error || "Payment verification failed.");

              alert(verifyData.message || "🎉 Payment successful! You are registered for the event.");
              fetchEventDetails();
            } catch (vErr: unknown) {
              const msg = vErr instanceof Error ? vErr.message : "Payment verification failed.";
              alert(msg);
            }
          },
          theme: {
            color: "#F59E0B",
          },
        };

        const RazorpayClass = (window as unknown as { Razorpay: new (opts: unknown) => { open: () => void } }).Razorpay;
        const razorpayWindow = new RazorpayClass(options);
        razorpayWindow.open();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error joining event";
      alert(msg);
    } finally {
      setJoining(false);
    }
  };

  const handleFlagSubmit = async (challengeId: string) => {
    const inputVal = flagInputs[challengeId];
    if (!eventData || !inputVal || submittingFlagId) return;

    setSubmittingFlagId(challengeId);
    setFlagMessages((prev) => ({ ...prev, [challengeId]: { type: "error", text: "" } }));

    try {
      const res = await fetch(`/api/events/${eventData._id}/submit-flag`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ challengeId, submittedFlag: inputVal }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Incorrect flag. Try again!");
      }

      setFlagMessages((prev) => ({
        ...prev,
        [challengeId]: { type: "success", text: data.message || `🎉 Correct Flag! +${data.pointsEarned} pts` },
      }));

      fetchEventDetails();
      fetchSubmissions();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to verify flag";
      setFlagMessages((prev) => ({
        ...prev,
        [challengeId]: { type: "error", text: msg },
      }));
    } finally {
      setSubmittingFlagId(null);
    }
  };

  const handleSkipChallenge = async (challengeId: string) => {
    if (!eventData) return;
    if (!confirm("Are you sure you want to skip this challenge? Skipping will LOCK this challenge permanently.")) {
      return;
    }

    try {
      const res = await fetch(`/api/events/${eventData._id}/skip-challenge`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ challengeId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to skip challenge");

      alert("🔒 Challenge skipped and locked.");
      fetchEventDetails();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error skipping challenge";
      alert(msg);
    }
  };

  const handleSubmitProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventData || submittingProject) return;
    if (!projTitle.trim() || !projDesc.trim()) {
      setSubmitMsg("Project title and description are required.");
      return;
    }

    setSubmittingProject(true);
    setSubmitMsg(null);
    try {
      const res = await fetch(`/api/events/${eventData._id}/submissions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectTitle: projTitle.trim(),
          description: projDesc.trim(),
          githubUrl: projGithub.trim(),
          demoUrl: projDemo.trim(),
          techStack: projTech ? projTech.split(",").map((t) => t.trim()) : [],
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit project");

      setSubmitMsg("✓ Project submitted successfully!");
      fetchEventDetails();
      fetchSubmissions();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error submitting project";
      setSubmitMsg(`Error: ${msg}`);
    } finally {
      setSubmittingProject(false);
    }
  };

  const handleSaveGrade = async (submissionId: string) => {
    if (!eventData) return;
    setSavingGradeId(submissionId);
    try {
      const res = await fetch(`/api/events/${eventData._id}/grade`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          submissionId,
          score: gradingScores[submissionId] || 0,
          feedback: gradingNotes[submissionId] || "",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save score");

      fetchSubmissions();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error saving score";
      alert(msg);
    } finally {
      setSavingGradeId(null);
    }
  };

  const handlePublishResults = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventData || publishingResults) return;

    if (!winner1) {
      alert("Please select at least 1st Place winner!");
      return;
    }

    setPublishingResults(true);
    try {
      const winnersList = [
        { rank: 1, participantId: winner1, prize: prize1Note || "1st Place Winner" },
      ];
      if (winner2) {
        winnersList.push({ rank: 2, participantId: winner2, prize: prize2Note || "2nd Place Winner" });
      }
      if (winner3) {
        winnersList.push({ rank: 3, participantId: winner3, prize: prize3Note || "3rd Place Winner" });
      }

      const res = await fetch(`/api/events/${eventData._id}/publish-results`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ winners: winnersList }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to publish results");

      alert("🎉 Official results published successfully!");
      fetchEventDetails();
      setActiveTab("results");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to publish results";
      alert(msg);
    } finally {
      setPublishingResults(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-8 space-y-4">
        <Loader2 className="size-8 text-amber-500 animate-spin" />
        <p className="text-xs text-muted-foreground font-mono">Loading event details...</p>
      </div>
    );
  }

  if (error || !eventData) {
    return (
      <div className="w-full min-h-screen bg-background p-8 max-w-2xl mx-auto space-y-6">
        <Link href="/events">
          <Button variant="ghost" size="sm" className="gap-2 text-xs">
            <ArrowLeft className="size-4" /> Back to Events Hub
          </Button>
        </Link>
        <div className="p-8 text-center bg-card border border-border rounded-3xl space-y-3">
          <h2 className="text-xl font-bold text-destructive">Event Not Found</h2>
          <p className="text-xs text-muted-foreground">{error || "This event does not exist or has been removed."}</p>
        </div>
      </div>
    );
  }

  const isHackathon = eventData.eventType === "hackathon";
  const isLive = eventData.status === "live";
  const isEnded = eventData.status === "ended";

  const solvedChallengeIds = new Set(
    (eventData.userSubmission?.solvedChallenges || []).map((sc) => sc.challengeId)
  );

  const skippedChallengeIds = new Set(
    (eventData.userSubmission?.skippedChallenges || []).map((sc) => sc.challengeId)
  );

  return (
    <div className="w-full min-h-screen bg-background text-foreground p-4 sm:p-6 lg:p-10 space-y-8">
      {/* Back button */}
      <div className="flex items-center justify-between">
        <Link href="/events">
          <Button variant="ghost" size="sm" className="gap-2 text-xs font-bold hover:bg-card">
            <ArrowLeft className="size-4" /> Back to Events Hub
          </Button>
        </Link>

        {eventData.canManage && (
          <span className="px-3.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-mono font-bold">
            👑 You are the Host
          </span>
        )}
      </div>

      {/* ── BANNER HEADER CARD ── */}
      <div className="relative rounded-3xl bg-card border border-border overflow-hidden shadow-2xl">
        <div className="relative h-48 sm:h-80 w-full bg-muted/40 overflow-hidden">
          {eventData.bannerImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={eventData.bannerImage} alt={eventData.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-amber-500/20 via-violet-500/20 to-cyan-500/20 flex items-center justify-center">
              <Trophy className="size-24 text-amber-400/40" />
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent" />

          {/* Top Badges */}
          <div className="absolute top-4 left-4 flex items-center gap-2">
            <span
              className={`px-3 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-wider shadow-lg ${
                isHackathon ? "bg-amber-500 text-black" : "bg-cyan-500 text-black"
              }`}
            >
              {eventData.eventType}
            </span>

            {isLive && (
              <span className="px-3 py-1 rounded-full bg-emerald-500 text-black text-xs font-mono font-bold uppercase flex items-center gap-1.5 shadow-lg animate-pulse">
                <span className="size-2 rounded-full bg-black" />
                Live Now
              </span>
            )}
          </div>

          <div className="absolute top-4 right-4">
            {eventData.isPaid ? (
              <span className="px-3 py-1.5 rounded-full bg-amber-500 text-black font-mono font-extrabold text-xs flex items-center gap-1 shadow-lg">
                <Coins className="size-3.5" />
                Direct INR ₹{eventData.priceINR} (Razorpay)
              </span>
            ) : (
              <span className="px-3 py-1.5 rounded-full bg-emerald-500 text-black font-mono font-extrabold text-xs shadow-lg">
                FREE ENTRY
              </span>
            )}
          </div>

          {/* Title & Host info overlay */}
          <div className="absolute bottom-6 left-6 right-6 space-y-2">
            <h1
              className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight drop-shadow-md"
              style={{ fontFamily: "var(--font-space-grotesk)" }}
            >
              {eventData.title}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-300 font-mono">
              <div className="flex items-center gap-1.5">
                <Calendar className="size-4 text-amber-400" />
                <span>
                  {new Date(eventData.startDate).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}{" "}
                  -{" "}
                  {new Date(eventData.endDate).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <MapPin className="size-4 text-cyan-400" />
                <span className="capitalize">{eventData.mode}</span>
              </div>

              <div className="flex items-center gap-1.5">
                <Users className="size-4 text-violet-400" />
                <span>{eventData.participantCount} Joined</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Bar */}
        <div className="p-6 bg-card/90 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-border/50">
          <div className="flex items-center gap-3">
            {eventData.hostId?.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={eventData.hostId.image}
                alt={eventData.hostId.name || "Host"}
                className="size-10 rounded-full object-cover border border-border"
              />
            ) : (
              <div className="size-10 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs">
                {eventData.hostId?.name?.[0] || "H"}
              </div>
            )}
            <div>
              <p className="text-xs text-muted-foreground font-mono">Hosted by</p>
              <p className="text-sm font-bold text-foreground">{eventData.hostId?.name || "Event Host"}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {eventData.isJoined ? (
              <div className="flex items-center gap-2">
                <span className="px-4 py-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-bold text-xs flex items-center gap-2">
                  <CheckCircle2 className="size-4" /> You are Registered
                </span>
                {eventData.meetingLink && (
                  <a href={eventData.meetingLink} target="_blank" rel="noopener noreferrer">
                    <Button size="sm" className="bg-cyan-500 hover:bg-cyan-600 text-black font-bold text-xs h-9 px-4 rounded-xl flex items-center gap-1.5">
                      <Video className="size-3.5" /> Join Link <ExternalLink className="size-3" />
                    </Button>
                  </a>
                )}
              </div>
            ) : (
              <Button
                onClick={handleJoin}
                disabled={joining || isEnded}
                className="bg-amber-500 hover:bg-amber-600 text-black font-bold text-xs h-10 px-6 rounded-xl shadow-lg shadow-amber-500/20 flex items-center gap-2"
              >
                {joining ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : eventData.isPaid ? (
                  `Pay ₹${eventData.priceINR} via Razorpay`
                ) : (
                  "Join Event (Free)"
                )}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* ── NAVIGATION TABS ── */}
      <div className="flex items-center gap-2 border-b border-border/60 pb-3 overflow-x-auto custom-scroll">
        <button
          onClick={() => setActiveTab("overview")}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === "overview"
              ? "bg-primary text-primary-foreground shadow"
              : "bg-muted/40 text-muted-foreground hover:bg-muted"
          }`}
        >
          Overview &amp; Details
        </button>

        {isHackathon && (eventData.challenges || []).length > 0 && (
          <button
            onClick={() => setActiveTab("challenges")}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
              activeTab === "challenges"
                ? "bg-amber-500 text-black shadow-md shadow-amber-500/20"
                : "bg-muted/40 text-muted-foreground hover:bg-muted"
            }`}
          >
            <Flag className="size-3.5" />
            Challenges &amp; Flags ({eventData.challenges?.length || 0})
          </button>
        )}

        {isHackathon && eventData.isJoined && (
          <button
            onClick={() => setActiveTab("submit")}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
              activeTab === "submit"
                ? "bg-amber-500 text-black shadow-md shadow-amber-500/20"
                : "bg-muted/40 text-muted-foreground hover:bg-muted"
            }`}
          >
            <Send className="size-3.5" />
            Project Submission
          </button>
        )}

        {isHackathon && (
          <button
            onClick={() => setActiveTab("leaderboard")}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
              activeTab === "leaderboard"
                ? "bg-amber-500 text-black shadow-md shadow-amber-500/20"
                : "bg-muted/40 text-muted-foreground hover:bg-muted"
            }`}
          >
            <Trophy className="size-3.5" />
            Live Leaderboard ({submissions.length})
          </button>
        )}

        {eventData.isResultsPublished && (
          <button
            onClick={() => setActiveTab("results")}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
              activeTab === "results"
                ? "bg-emerald-500 text-black shadow-md shadow-emerald-500/20"
                : "bg-muted/40 text-muted-foreground hover:bg-muted"
            }`}
          >
            <Award className="size-3.5" />
            Official Results
          </button>
        )}

        {eventData.canManage && (
          <button
            onClick={() => setActiveTab("host")}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
              activeTab === "host"
                ? "bg-violet-500 text-white shadow-md shadow-violet-500/20"
                : "bg-muted/40 text-muted-foreground hover:bg-muted"
            }`}
          >
            <Sliders className="size-3.5" />
            Host Dashboard
          </button>
        )}
      </div>

      {/* ── TAB CONTENT ── */}
      {/* 1. OVERVIEW & SCHEDULE */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-card border border-border rounded-3xl p-6 sm:p-8 space-y-4 shadow-lg">
              <h2 className="text-xl font-bold tracking-tight" style={{ fontFamily: "var(--font-space-grotesk)" }}>
                About the Event
              </h2>
              <div className="text-sm leading-relaxed text-muted-foreground whitespace-pre-line">
                {eventData.description}
              </div>
            </div>

            {/* Hackathon Problem Statement */}
            {isHackathon && eventData.problemStatement && (
              <div className="bg-card/80 border border-amber-500/30 rounded-3xl p-6 sm:p-8 space-y-4 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full filter blur-2xl pointer-events-none" />
                <div className="flex items-center gap-2 text-amber-400 font-bold text-base">
                  <Sparkles className="size-5" />
                  Hackathon Challenge &amp; Problem Statement
                </div>
                <div className="text-xs sm:text-sm leading-relaxed text-foreground whitespace-pre-line bg-background/50 p-4 rounded-2xl border border-border">
                  {eventData.problemStatement}
                </div>
              </div>
            )}

            {/* Prizes details */}
            {eventData.prizes && (
              <div className="bg-card border border-border rounded-3xl p-6 sm:p-8 space-y-4 shadow-lg">
                <div className="flex items-center gap-2 text-amber-400 font-bold text-base">
                  <Award className="size-5" />
                  Prizes &amp; Rewards
                </div>
                <p className="text-xs sm:text-sm text-foreground leading-relaxed whitespace-pre-line">
                  {eventData.prizes}
                </p>
              </div>
            )}
          </div>

          {/* Sidebar Info */}
          <div className="space-y-6">
            <div className="bg-card border border-border rounded-3xl p-6 space-y-5 shadow-lg">
              <h3 className="text-base font-bold tracking-tight" style={{ fontFamily: "var(--font-space-grotesk)" }}>
                Event Details
              </h3>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between items-center py-2 border-b border-border/40">
                  <span className="text-muted-foreground font-mono">Registration Deadline</span>
                  <span className="font-bold text-foreground">
                    {new Date(eventData.registrationDeadline).toLocaleDateString()}
                  </span>
                </div>

                <div className="flex justify-between items-center py-2 border-b border-border/40">
                  <span className="text-muted-foreground font-mono">Start Date</span>
                  <span className="font-bold text-foreground">
                    {new Date(eventData.startDate).toLocaleString([], { dateStyle: "short", timeStyle: "short" })}
                  </span>
                </div>

                <div className="flex justify-between items-center py-2 border-b border-border/40">
                  <span className="text-muted-foreground font-mono">End Date</span>
                  <span className="font-bold text-foreground">
                    {new Date(eventData.endDate).toLocaleString([], { dateStyle: "short", timeStyle: "short" })}
                  </span>
                </div>

                <div className="flex justify-between items-center py-2 border-b border-border/40">
                  <span className="text-muted-foreground font-mono">Location / Venue</span>
                  <span className="font-bold text-foreground capitalize">
                    {eventData.location || eventData.mode}
                  </span>
                </div>
              </div>

              {eventData.tags.length > 0 && (
                <div className="pt-2 space-y-2">
                  <span className="text-xs font-mono text-muted-foreground">Category Tags:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {eventData.tags.map((tag, i) => (
                      <span key={i} className="px-2.5 py-1 rounded-lg bg-muted text-[10px] font-mono text-zinc-300">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 2. CHALLENGES & FLAGS TAB */}
      {activeTab === "challenges" && isHackathon && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight" style={{ fontFamily: "var(--font-space-grotesk)" }}>
                Hackathon Challenges &amp; Flags
              </h2>
              <p className="text-xs text-muted-foreground">
                Solve challenges, inspect relative diagrams, observe challenge timings, or skip to lock.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {(eventData.challenges || []).map((ch) => {
              const isSolved = solvedChallengeIds.has(ch._id);
              const isSkipped = skippedChallengeIds.has(ch._id);
              const msg = flagMessages[ch._id];

              return (
                <div
                  key={ch._id}
                  className={`p-6 rounded-3xl border bg-card flex flex-col space-y-4 shadow-xl relative overflow-hidden ${
                    isSolved
                      ? "border-emerald-500/50 bg-emerald-500/5"
                      : isSkipped
                      ? "border-destructive/40 opacity-75"
                      : "border-border"
                  }`}
                >
                  {/* Category & Points & Timing Badge */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 rounded-full bg-amber-500/15 text-amber-400 font-mono text-xs font-bold">
                        {ch.category || "General"}
                      </span>
                      {ch.timeLimitMinutes && (
                        <span className="px-2.5 py-1 rounded-full bg-muted text-muted-foreground font-mono text-[10px] flex items-center gap-1">
                          <Clock className="size-3 text-cyan-400" /> {ch.timeLimitMinutes} Mins Limit
                        </span>
                      )}
                    </div>

                    <span className="px-3 py-1 rounded-full bg-cyan-500/15 text-cyan-400 font-mono font-extrabold text-xs">
                      +{ch.points} PTS
                    </span>
                  </div>

                  {/* Challenge Relative Image */}
                  {ch.imageUrl && (
                    <div className="w-full h-48 rounded-2xl bg-muted/40 overflow-hidden border border-border relative group">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={ch.imageUrl} alt={ch.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    </div>
                  )}

                  <div className="space-y-1">
                    <h3 className="text-lg font-bold text-foreground">{ch.title}</h3>
                    <p className="text-xs text-muted-foreground whitespace-pre-line">{ch.description}</p>
                  </div>

                  {/* Hints */}
                  {ch.hints && ch.hints.length > 0 && (
                    <div className="p-3 rounded-xl bg-background border border-border/60 text-[11px] space-y-1">
                      <span className="font-bold text-amber-400 flex items-center gap-1">
                        <HelpCircle className="size-3.5" /> Hints:
                      </span>
                      <ul className="list-disc list-inside text-muted-foreground space-y-0.5">
                        {ch.hints.map((h, i) => (
                          <li key={i}>{h}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Host Secret Flag Display (Only for Host) */}
                  {eventData.canManage && ch.flag && (
                    <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-[11px] font-mono text-amber-400 font-bold">
                      🔑 Host Secret Flag: <span className="underline">{ch.flag}</span>
                    </div>
                  )}

                  {/* Flag Submission or Lock Status */}
                  <div className="pt-2 mt-auto space-y-2">
                    {isSolved ? (
                      <div className="p-3 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-xs font-bold flex items-center gap-2 font-mono">
                        <CheckCircle2 className="size-4" /> SOLVED (+{ch.points} Points Earned)
                      </div>
                    ) : isSkipped ? (
                      <div className="p-3 rounded-2xl bg-destructive/15 border border-destructive/30 text-destructive text-xs font-bold flex items-center gap-2 font-mono">
                        <Lock className="size-4" /> CHALLENGE LOCKED (Skipped)
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            placeholder="NOTEXIA{secret_flag}"
                            value={flagInputs[ch._id] || ""}
                            onChange={(e) =>
                              setFlagInputs((prev) => ({ ...prev, [ch._id]: e.target.value }))
                            }
                            className="flex-1 px-3.5 py-2.5 bg-background border border-border rounded-xl text-xs font-mono focus:outline-none focus:border-amber-500"
                          />
                          <Button
                            size="sm"
                            onClick={() => handleFlagSubmit(ch._id)}
                            disabled={submittingFlagId === ch._id || !eventData.isJoined}
                            className="bg-amber-500 hover:bg-amber-600 text-black font-bold text-xs h-9 px-4 rounded-xl shrink-0"
                          >
                            {submittingFlagId === ch._id ? (
                              <Loader2 className="size-3.5 animate-spin" />
                            ) : (
                              "Submit Flag"
                            )}
                          </Button>
                        </div>

                        <div className="flex items-center justify-between pt-1">
                          {msg ? (
                            <p
                              className={`text-[11px] font-medium font-mono ${
                                msg.type === "success" ? "text-emerald-400" : "text-destructive"
                              }`}
                            >
                              {msg.text}
                            </p>
                          ) : (
                            <div />
                          )}

                          {eventData.isJoined && (
                            <button
                              type="button"
                              onClick={() => handleSkipChallenge(ch._id)}
                              className="text-[10px] text-muted-foreground hover:text-destructive flex items-center gap-1 font-mono hover:underline cursor-pointer"
                            >
                              <SkipForward className="size-3" /> Skip &amp; Lock
                            </button>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. PROJECT SUBMISSION (For Registered Participants) */}
      {activeTab === "submit" && isHackathon && eventData.isJoined && (
        <div className="bg-card border border-border rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl max-w-3xl mx-auto">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 text-amber-400 text-[11px] font-mono font-bold uppercase">
              <Send className="size-3.5" /> Hackathon Submission Form
            </div>
            <h2 className="text-2xl font-bold tracking-tight" style={{ fontFamily: "var(--font-space-grotesk)" }}>
              {eventData.userSubmission ? "Update Your Submission" : "Submit Your Hackathon Project"}
            </h2>
            <p className="text-xs text-muted-foreground">
              Provide your project details, GitHub repository link, live demo URL, and tech stack.
            </p>
          </div>

          {submitMsg && (
            <div
              className={`p-3.5 rounded-xl text-xs font-medium ${
                submitMsg.startsWith("✓")
                  ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-400"
                  : "bg-destructive/15 border border-destructive/30 text-destructive"
              }`}
            >
              {submitMsg}
            </div>
          )}

          <form onSubmit={handleSubmitProject} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">Project Title *</label>
              <input
                type="text"
                required
                placeholder="e.g., Notexia AI Tutor Assistant"
                value={projTitle}
                onChange={(e) => setProjTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-background border border-border rounded-xl text-xs focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">Project Description *</label>
              <textarea
                required
                rows={4}
                placeholder="Describe your project, key features, architecture, and what makes it innovative..."
                value={projDesc}
                onChange={(e) => setProjDesc(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-background border border-border rounded-xl text-xs focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <Code2 className="size-3.5" /> GitHub Code Repository URL
                </label>
                <input
                  type="url"
                  placeholder="https://github.com/username/project"
                  value={projGithub}
                  onChange={(e) => setProjGithub(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-background border border-border rounded-xl text-xs focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <Globe className="size-3.5" /> Live Demo / Video URL
                </label>
                <input
                  type="url"
                  placeholder="https://my-demo-app.vercel.app"
                  value={projDemo}
                  onChange={(e) => setProjDemo(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-background border border-border rounded-xl text-xs focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">Tech Stack Used (comma separated)</label>
              <input
                type="text"
                placeholder="Next.js, TypeScript, Tailwind, MongoDB, Anthropic API"
                value={projTech}
                onChange={(e) => setProjTech(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-background border border-border rounded-xl text-xs focus:outline-none focus:border-amber-500"
              />
            </div>

            <Button
              type="submit"
              disabled={submittingProject}
              className="bg-amber-500 hover:bg-amber-600 text-black font-bold text-xs h-10 px-6 rounded-xl flex items-center gap-2"
            >
              {submittingProject ? <Loader2 className="size-4 animate-spin" /> : "Submit Project"}
            </Button>
          </form>
        </div>
      )}

      {/* 4. LIVE LEADERBOARD */}
      {activeTab === "leaderboard" && isHackathon && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight" style={{ fontFamily: "var(--font-space-grotesk)" }}>
                Live Leaderboard &amp; Submissions
              </h2>
              <p className="text-xs text-muted-foreground">
                Participant scores earned from solved challenge flags and host project evaluations.
              </p>
            </div>
          </div>

          {loadingSubmissions ? (
            <div className="p-8 text-center bg-card border border-border rounded-2xl">
              <Loader2 className="size-6 text-amber-500 animate-spin mx-auto" />
            </div>
          ) : submissions.length === 0 ? (
            <div className="p-12 text-center bg-card border border-border rounded-3xl space-y-3">
              <Trophy className="size-10 text-muted-foreground mx-auto" />
              <h3 className="text-base font-bold">No Submissions Yet</h3>
              <p className="text-xs text-muted-foreground">Be the first to submit a project or flag for this hackathon!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {submissions.map((sub) => {
                const isTop3 = sub.rank <= 3;

                return (
                  <div
                    key={sub._id}
                    className={`p-5 rounded-2xl border bg-card/80 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                      sub.rank === 1
                        ? "border-amber-500/60 shadow-lg shadow-amber-500/10"
                        : sub.rank === 2
                        ? "border-zinc-400/50"
                        : sub.rank === 3
                        ? "border-amber-700/50"
                        : "border-border/60"
                    }`}
                  >
                    <div className="flex items-start gap-4 min-w-0">
                      <div
                        className={`size-10 rounded-2xl flex items-center justify-center font-extrabold text-sm shrink-0 font-mono ${
                          sub.rank === 1
                            ? "bg-amber-500 text-black"
                            : sub.rank === 2
                            ? "bg-zinc-300 text-black"
                            : sub.rank === 3
                            ? "bg-amber-700 text-white"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        #{sub.rank}
                      </div>

                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-base font-bold text-foreground line-clamp-1">{sub.projectTitle}</h4>
                          {isTop3 && (
                            <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 text-[10px] font-bold">
                              Top Performers
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-muted-foreground line-clamp-2">{sub.description}</p>

                        <div className="flex items-center gap-3 pt-1 text-[11px] text-muted-foreground font-mono">
                          <span>By {sub.userId?.name || "Participant"}</span>
                          {sub.techStack.length > 0 && (
                            <div className="flex items-center gap-1">
                              {sub.techStack.slice(0, 3).map((t, idx) => (
                                <span key={idx} className="px-1.5 py-0.5 rounded bg-muted text-[9px]">
                                  {t}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 shrink-0 justify-between md:justify-end border-t md:border-t-0 border-border/40 pt-3 md:pt-0">
                      {/* Score Badge */}
                      <div className="text-right">
                        <div className="text-xl font-extrabold font-mono text-amber-400">
                          {sub.score} <span className="text-xs text-muted-foreground">PTS</span>
                        </div>
                        <span className="text-[10px] text-muted-foreground font-mono">Total Earned Points</span>
                      </div>

                      {/* External links */}
                      <div className="flex items-center gap-2">
                        {sub.githubUrl && (
                          <a href={sub.githubUrl} target="_blank" rel="noopener noreferrer">
                            <Button size="sm" variant="outline" className="size-8 p-0 rounded-xl">
                              <Code2 className="size-4" />
                            </Button>
                          </a>
                        )}
                        {sub.demoUrl && (
                          <a href={sub.demoUrl} target="_blank" rel="noopener noreferrer">
                            <Button size="sm" variant="outline" className="size-8 p-0 rounded-xl">
                              <Globe className="size-4" />
                            </Button>
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 5. OFFICIAL RESULTS PODIUM */}
      {activeTab === "results" && eventData.isResultsPublished && (
        <div className="space-y-8">
          <div className="text-center space-y-2 max-w-xl mx-auto">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400 text-xs font-mono font-bold uppercase">
              <Award className="size-4" /> Official Winners Announced
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight" style={{ fontFamily: "var(--font-space-grotesk)" }}>
              Hackathon Champions &amp; Results
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
            {(eventData.publishedResults || []).map((winner) => {
              const participant = typeof winner.participantId === "object" ? winner.participantId : null;

              return (
                <div
                  key={winner.rank}
                  className={`relative p-6 rounded-3xl border bg-card flex flex-col items-center text-center space-y-4 shadow-xl ${
                    winner.rank === 1
                      ? "border-amber-500/80 bg-gradient-to-b from-amber-500/10 to-card shadow-amber-500/20 md:-translate-y-4"
                      : winner.rank === 2
                      ? "border-zinc-400/60"
                      : "border-amber-700/60"
                  }`}
                >
                  <div
                    className={`size-12 rounded-full flex items-center justify-center font-extrabold text-lg shadow-lg font-mono ${
                      winner.rank === 1
                        ? "bg-amber-500 text-black"
                        : winner.rank === 2
                        ? "bg-zinc-300 text-black"
                        : "bg-amber-700 text-white"
                    }`}
                  >
                    #{winner.rank}
                  </div>

                  <div className="space-y-1">
                    <h3 className="text-lg font-bold text-foreground">
                      {participant?.name || "Participant Winner"}
                    </h3>
                    <p className="text-xs text-amber-400 font-mono font-bold">{winner.prize || "Prize Winner"}</p>
                  </div>

                  {winner.note && (
                    <p className="text-xs text-muted-foreground bg-background/50 p-3 rounded-xl border border-border/40 w-full">
                      &quot;{winner.note}&quot;
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 6. HOST CONTROL CENTER */}
      {activeTab === "host" && eventData.canManage && (
        <div className="space-y-8">
          <div className="bg-card border border-border rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
            <div className="space-y-1">
              <h2 className="text-2xl font-bold tracking-tight" style={{ fontFamily: "var(--font-space-grotesk)" }}>
                Host Management Dashboard
              </h2>
              <p className="text-xs text-muted-foreground">
                Grade participant submissions, manage joinees, and publish official results.
              </p>
            </div>

            {/* Sub-tabs for Host */}
            <div className="space-y-6">
              {/* Section A: Registered Joinees */}
              <div className="space-y-4">
                <h3 className="text-base font-bold flex items-center gap-2 border-b border-border pb-2">
                  <Users className="size-4 text-cyan-400" /> Joined Participants ({participants.length})
                </h3>

                {loadingParticipants ? (
                  <Loader2 className="size-5 text-amber-500 animate-spin" />
                ) : participants.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No participants registered yet.</p>
                ) : (
                  <div className="overflow-x-auto border border-border/60 rounded-2xl">
                    <table className="w-full text-left text-xs font-mono">
                      <thead className="bg-muted/60 text-muted-foreground uppercase">
                        <tr>
                          <th className="p-3">User</th>
                          <th className="p-3">Email</th>
                          <th className="p-3">Payment Status</th>
                          <th className="p-3">Payment Method</th>
                          <th className="p-3">Registered At</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/40">
                        {participants.map((p) => (
                          <tr key={p._id} className="hover:bg-muted/20">
                            <td className="p-3 font-bold text-foreground">{p.userId?.name || "User"}</td>
                            <td className="p-3 text-muted-foreground">{p.userId?.email}</td>
                            <td className="p-3">
                              <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 font-bold uppercase text-[10px]">
                                {p.paymentStatus}
                              </span>
                            </td>
                            <td className="p-3 font-bold uppercase text-amber-400 text-[10px]">
                              {p.paymentMethod}
                            </td>
                            <td className="p-3 text-muted-foreground">
                              {new Date(p.registeredAt).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Section B: Grade Hackathon Submissions */}
              {isHackathon && (
                <div className="space-y-4 pt-4 border-t border-border">
                  <h3 className="text-base font-bold flex items-center gap-2 border-b border-border pb-2">
                    <Trophy className="size-4 text-amber-400" /> Grade &amp; Score Submissions ({submissions.length})
                  </h3>

                  {submissions.length === 0 ? (
                    <p className="text-xs text-muted-foreground">No project submissions to grade.</p>
                  ) : (
                    <div className="space-y-4">
                      {submissions.map((sub) => (
                        <div key={sub._id} className="p-4 bg-muted/30 border border-border rounded-2xl space-y-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="text-sm font-bold text-foreground">{sub.projectTitle}</h4>
                              <p className="text-xs text-muted-foreground font-mono">By {sub.userId?.name} ({sub.userId?.email})</p>
                            </div>
                            <div className="flex gap-2">
                              {sub.githubUrl && (
                                <a href={sub.githubUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-cyan-400 flex items-center gap-1">
                                  <Code2 className="size-3.5" /> Repo
                                </a>
                              )}
                              {sub.demoUrl && (
                                <a href={sub.demoUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-amber-400 flex items-center gap-1">
                                  <Globe className="size-3.5" /> Demo
                                </a>
                              )}
                            </div>
                          </div>

                          <p className="text-xs text-zinc-300">{sub.description}</p>

                          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-amber-400 font-mono">Score:</span>
                              <input
                                type="number"
                                min={0}
                                value={gradingScores[sub._id] ?? 0}
                                onChange={(e) =>
                                  setGradingScores((prev) => ({ ...prev, [sub._id]: Number(e.target.value) }))
                                }
                                className="w-20 px-2 py-1 bg-background border border-border rounded-lg text-xs font-mono font-bold"
                              />
                            </div>

                            <input
                              type="text"
                              placeholder="Feedback / Judge notes..."
                              value={gradingNotes[sub._id] ?? ""}
                              onChange={(e) =>
                                setGradingNotes((prev) => ({ ...prev, [sub._id]: e.target.value }))
                              }
                              className="flex-1 w-full px-3 py-1 bg-background border border-border rounded-lg text-xs"
                            />

                            <Button
                              size="sm"
                              onClick={() => handleSaveGrade(sub._id)}
                              disabled={savingGradeId === sub._id}
                              className="bg-amber-500 hover:bg-amber-600 text-black font-bold text-xs h-8 px-3 rounded-lg shrink-0"
                            >
                              {savingGradeId === sub._id ? <Loader2 className="size-3.5 animate-spin" /> : "Save Score"}
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Section C: Publish Winners / Results */}
              <div className="space-y-4 pt-4 border-t border-border">
                <h3 className="text-base font-bold flex items-center gap-2 border-b border-border pb-2">
                  <Award className="size-4 text-emerald-400" /> Publish Official Final Results
                </h3>

                <form onSubmit={handlePublishResults} className="space-y-4 max-w-xl">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-amber-400">1st Place Winner *</label>
                    <select
                      required
                      value={winner1}
                      onChange={(e) => setWinner1(e.target.value)}
                      className="w-full px-3 py-2 bg-background border border-border rounded-xl text-xs"
                    >
                      <option value="">-- Select Winner --</option>
                      {participants.map((p) => (
                        <option key={p.userId._id} value={p.userId._id}>
                          {p.userId.name} ({p.userId.email})
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      placeholder="Prize note (e.g. ₹5,000 Cash Prize + Certificate)"
                      value={prize1Note}
                      onChange={(e) => setPrize1Note(e.target.value)}
                      className="w-full px-3 py-1.5 bg-background border border-border rounded-xl text-xs mt-1"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-zinc-300">2nd Place Winner (Optional)</label>
                    <select
                      value={winner2}
                      onChange={(e) => setWinner2(e.target.value)}
                      className="w-full px-3 py-2 bg-background border border-border rounded-xl text-xs"
                    >
                      <option value="">-- Select 2nd Place --</option>
                      {participants.map((p) => (
                        <option key={p.userId._id} value={p.userId._id}>
                          {p.userId.name} ({p.userId.email})
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      placeholder="Prize note (e.g. ₹2,000 Cash Prize)"
                      value={prize2Note}
                      onChange={(e) => setPrize2Note(e.target.value)}
                      className="w-full px-3 py-1.5 bg-background border border-border rounded-xl text-xs mt-1"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-amber-700">3rd Place Winner (Optional)</label>
                    <select
                      value={winner3}
                      onChange={(e) => setWinner3(e.target.value)}
                      className="w-full px-3 py-2 bg-background border border-border rounded-xl text-xs"
                    >
                      <option value="">-- Select 3rd Place --</option>
                      {participants.map((p) => (
                        <option key={p.userId._id} value={p.userId._id}>
                          {p.userId.name} ({p.userId.email})
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      placeholder="Prize note (e.g. ₹1,000 Cash Prize)"
                      value={prize3Note}
                      onChange={(e) => setPrize3Note(e.target.value)}
                      className="w-full px-3 py-1.5 bg-background border border-border rounded-xl text-xs mt-1"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={publishingResults}
                    className="bg-emerald-500 hover:bg-emerald-600 text-black font-bold text-xs h-10 px-6 rounded-xl flex items-center gap-2"
                  >
                    {publishingResults ? <Loader2 className="size-4 animate-spin" /> : "Publish Final Results"}
                  </Button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
