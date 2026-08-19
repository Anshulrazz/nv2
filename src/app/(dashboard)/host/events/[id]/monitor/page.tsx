"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import {
  Loader2,
  Snowflake,
  Trophy,
  AlertCircle,
  ChevronLeft,
  Search,
  Megaphone,
  Sparkles,
  Users,
  UserCheck,
  ShieldAlert,
} from "lucide-react";
import Link from "next/link";

interface Participant {
  userId: string;
  codename: string;
  realName: string;
  paymentStatus: string;
  isDisqualified: boolean;
  disqualifiedReason: string | null;
  registeredAt: string;
  totalPoints: number;
  solveCount: number;
  totalAttempts: number;
  wrongAttempts: number;
  teamId?: string | null;
  teamName?: string | null;
  isTeamLeader?: boolean;
}

interface EventTeamItem {
  _id: string;
  teamName: string;
  leaderUserId: string;
  memberUserIds: string[];
}

export default function HostMonitorPage() {
  const { id } = useParams<{ id: string }>();

  const [participants, setParticipants] = useState<Participant[]>([]);
  const [teams, setTeams] = useState<EventTeamItem[]>([]);
  const [eventType, setEventType] = useState<string>("ctf");
  const [teamMode, setTeamMode] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"participants" | "teams">("participants");

  const [isFrozen, setIsFrozen] = useState(false);
  const [freezing, setFreezing] = useState(false);

  const [isPrizeRevealed, setIsPrizeRevealed] = useState(false);
  const [revealingPrize, setRevealingPrize] = useState(false);

  const [publishing, setPublishing] = useState(false);
  const [published, setPublished] = useState(false);

  const [selectedUser, setSelectedUser] = useState<Participant | null>(null);
  const [dqReason, setDqReason] = useState("");
  const [actioning, setActioning] = useState(false);

  // Announcement modal state
  const [showAnnModal, setShowAnnModal] = useState(false);
  const [annTitle, setAnnTitle] = useState("");
  const [annBody, setAnnBody] = useState("");
  const [sendPush, setSendPush] = useState(false);
  const [annSubmitting, setAnnSubmitting] = useState(false);

  const loadData = async () => {
    try {
      // 1. Event status
      const evRes = await fetch(`/api/events/${id}`);
      if (!evRes.ok) throw new Error("Event not found.");
      const evData = await evRes.json();
      setIsFrozen(!!evData.event.scoreFreezeAt);
      setPublished(!!evData.event.resultsRevealedAt);
      setIsPrizeRevealed(!!evData.event.isPrizeRevealed);
      setEventType(evData.event.type || "ctf");
      setTeamMode(!!evData.event.teamMode);

      // 2. Participants list & Teams
      const pRes = await fetch(`/api/events/${id}/participants`);
      if (!pRes.ok) throw new Error("Failed to load participants.");
      const pData = await pRes.json();
      setParticipants(pData.participants ?? []);
      setTeams(pData.teams ?? []);
      if (pData.eventType) setEventType(pData.eventType);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load monitor data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleToggleFreeze = async () => {
    setFreezing(true);
    try {
      const res = await fetch(`/api/events/${id}/freeze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ freeze: !isFrozen }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Freeze toggle failed.");
      setIsFrozen(!!data.event.scoreFreezeAt);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed.");
    } finally {
      setFreezing(false);
    }
  };

  const handleTogglePrizeReveal = async () => {
    setRevealingPrize(true);
    try {
      const res = await fetch(`/api/events/${id}/price-reveal`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reveal: !isPrizeRevealed }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Prize reveal toggle failed.");
      setIsPrizeRevealed(data.isPrizeRevealed);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to toggle prize reveal.");
    } finally {
      setRevealingPrize(false);
    }
  };

  const handlePublishResults = async () => {
    if (!confirm("Are you sure you want to publish final results? This will set final ranks and reveal the leaderboard to all participants.")) {
      return;
    }
    setPublishing(true);
    try {
      const res = await fetch(`/api/events/${id}/publish-results`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Publish failed.");
      setPublished(true);
      alert(`Results published! Ranked ${data.totalRanked} participants.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Publishing failed.");
    } finally {
      setPublishing(false);
    }
  };

  const handleDisqualify = async () => {
    if (!selectedUser) return;
    setActioning(true);
    try {
      const res = await fetch(`/api/events/${id}/participants/${selectedUser.userId}/disqualify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: dqReason || "Disqualified by host." }),
      });
      if (!res.ok) throw new Error("Disqualification failed.");
      setSelectedUser(null);
      setDqReason("");
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Disqualification failed.");
    } finally {
      setActioning(false);
    }
  };

  const handleReinstate = async (userId: string) => {
    setActioning(true);
    try {
      const res = await fetch(`/api/events/${id}/participants/${userId}/reinstate`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Reinstatement failed.");
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Reinstatement failed.");
    } finally {
      setActioning(false);
    }
  };

  const handleSendAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!annTitle.trim()) return;
    setAnnSubmitting(true);
    try {
      const res = await fetch(`/api/events/${id}/announcements`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: annTitle, body: annBody, sendPush }),
      });
      if (!res.ok) throw new Error("Failed to post announcement.");
      setShowAnnModal(false);
      setAnnTitle("");
      setAnnBody("");
      setSendPush(false);
      alert("Announcement posted!");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Announcement failed.");
    } finally {
      setAnnSubmitting(false);
    }
  };

  const isHackathon = eventType === "hackathon";

  const filteredParticipants = participants.filter(
    (p) =>
      p.codename.toLowerCase().includes(search.toLowerCase()) ||
      p.realName.toLowerCase().includes(search.toLowerCase()) ||
      (isHackathon && p.teamName && p.teamName.toLowerCase().includes(search.toLowerCase()))
  );

  const filteredTeams = teams.filter((t) =>
    t.teamName.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="size-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Top Bar */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href={`/host/events/${id}/edit`}
            className="p-2 rounded-xl hover:bg-sidebar-accent text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="size-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-foreground">Event Operations &amp; Monitor</h1>
              <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase font-mono bg-primary/10 text-primary border border-primary/20">
                {eventType}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Live participant tracking, disqualifications, leaderboard freeze, and result publishing.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAnnModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-sidebar border border-sidebar-border text-xs font-bold rounded-xl hover:border-primary/40 text-foreground transition-colors cursor-pointer"
          >
            <Megaphone className="size-4 text-primary" />
            Post Broadcast
          </button>
          
          <button
            onClick={handleTogglePrizeReveal}
            disabled={revealingPrize}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
              isPrizeRevealed
                ? "bg-amber-500/15 border-amber-500/30 text-amber-400 shadow-sm shadow-amber-500/10"
                : "bg-sidebar border-sidebar-border text-muted-foreground hover:text-foreground"
            }`}
          >
            <Sparkles className={`size-4 ${isPrizeRevealed ? "text-amber-400 animate-pulse" : ""}`} />
            {isPrizeRevealed ? "Prize Pool Revealed" : "Reveal Prize Pool"}
          </button>

          <button
            onClick={handleToggleFreeze}
            disabled={freezing}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl border transition-colors cursor-pointer ${
              isFrozen
                ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-400"
                : "bg-sidebar border-sidebar-border text-muted-foreground hover:text-foreground"
            }`}
          >
            <Snowflake className="size-4" />
            {isFrozen ? "Leaderboard Frozen" : "Freeze Leaderboard"}
          </button>

          <button
            onClick={handlePublishResults}
            disabled={publishing || published}
            className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              published
                ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-400"
                : "bg-primary text-primary-foreground hover:opacity-90"
            }`}
          >
            <Trophy className="size-4" />
            {published ? "Results Published" : "Publish Final Results"}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm flex items-center gap-2">
          <AlertCircle className="size-4" />
          {error}
        </div>
      )}

      {/* Stats Cards Grid */}
      <div className={`grid grid-cols-2 ${isHackathon ? "md:grid-cols-6" : "md:grid-cols-5"} gap-4`}>
        <div className="bg-sidebar border border-sidebar-border rounded-xl p-4">
          <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Total Participants</p>
          <p className="text-2xl font-bold text-foreground font-mono mt-1">{participants.length}</p>
        </div>

        {isHackathon && (
          <div className="bg-sidebar border border-sidebar-border rounded-xl p-4">
            <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Total Teams</p>
            <p className="text-2xl font-bold text-cyan-400 font-mono mt-1">{teams.length}</p>
          </div>
        )}

        <div className="bg-sidebar border border-sidebar-border rounded-xl p-4">
          <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Active (Paid/Free)</p>
          <p className="text-2xl font-bold text-emerald-400 font-mono mt-1">
            {participants.filter((p) => !p.isDisqualified).length}
          </p>
        </div>

        <div className="bg-sidebar border border-sidebar-border rounded-xl p-4">
          <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Disqualified</p>
          <p className="text-2xl font-bold text-red-400 font-mono mt-1">
            {participants.filter((p) => p.isDisqualified).length}
          </p>
        </div>

        <div className="bg-sidebar border border-sidebar-border rounded-xl p-4">
          <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Freeze Status</p>
          <p className="text-sm font-bold font-mono mt-2">
            {isFrozen ? <span className="text-cyan-400">FROZEN</span> : <span className="text-zinc-400">LIVE</span>}
          </p>
        </div>

        <div className="bg-sidebar border border-sidebar-border rounded-xl p-4">
          <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Prize Reveal</p>
          <p className="text-sm font-bold font-mono mt-2">
            {isPrizeRevealed ? (
              <span className="text-amber-400 flex items-center gap-1 font-bold">
                <Sparkles className="size-3.5" /> REVEALED
              </span>
            ) : (
              <span className="text-zinc-400">HIDDEN</span>
            )}
          </p>
        </div>
      </div>

      {/* Mode Switcher Tabs for Hackathon */}
      {isHackathon && (
        <div className="flex items-center gap-2 border-b border-sidebar-border pb-2">
          <button
            onClick={() => setActiveTab("participants")}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "participants"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-sidebar text-muted-foreground hover:text-foreground"
            }`}
          >
            <UserCheck className="size-3.5" /> Participants ({participants.length})
          </button>

          <button
            onClick={() => setActiveTab("teams")}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "teams"
                ? "bg-cyan-500 text-black font-bold shadow-sm"
                : "bg-sidebar text-muted-foreground hover:text-foreground"
            }`}
          >
            <Users className="size-3.5" /> Hackathon Teams ({teams.length})
          </button>
        </div>
      )}

      {/* MAIN VIEW AREA */}
      {activeTab === "participants" || !isHackathon ? (
        <div className="bg-sidebar border border-sidebar-border rounded-2xl p-4 space-y-4">
          <div className="flex items-center gap-2 bg-background border border-sidebar-border rounded-xl px-3 py-2 text-xs">
            <Search className="size-4 text-muted-foreground" />
            <input
              type="text"
              placeholder={isHackathon ? "Search by codename, real name, or team name..." : "Search by codename or real name..."}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-transparent text-foreground focus:outline-none placeholder:text-muted-foreground"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-sidebar-border font-mono text-[10px] uppercase text-muted-foreground">
                <tr>
                  <th className="p-3">Codename</th>
                  {isHackathon && <th className="p-3">Team Name</th>}
                  <th className="p-3">Real Name (Private)</th>
                  <th className="p-3">Payment</th>
                  <th className="p-3">Score</th>
                  <th className="p-3">Solves</th>
                  <th className="p-3">Attempts (Wrong)</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sidebar-border">
                {filteredParticipants.map((p) => (
                  <tr key={p.userId} className={p.isDisqualified ? "opacity-40 bg-red-500/5" : ""}>
                    <td className="p-3 font-mono font-bold text-foreground">
                      <div className="flex items-center gap-1.5">
                        <span>{p.codename}</span>
                        {isHackathon && p.isTeamLeader && (
                          <span className="px-1.5 py-0.2 text-[9px] bg-amber-500/20 text-amber-400 rounded font-mono font-bold">
                            LEADER
                          </span>
                        )}
                      </div>
                    </td>

                    {/* ONLY DISPLAY TEAM COLUMN FOR HACKATHONS */}
                    {isHackathon && (
                      <td className="p-3 font-mono text-cyan-400 font-bold">
                        {p.teamName ? p.teamName : <span className="text-muted-foreground italic font-normal">Individual</span>}
                      </td>
                    )}

                    <td className="p-3 text-muted-foreground">{p.realName}</td>
                    <td className="p-3">
                      <span className="font-mono text-[10px] uppercase px-2 py-0.5 rounded bg-sidebar-accent border border-sidebar-border">
                        {p.paymentStatus}
                      </span>
                    </td>
                    <td className="p-3 font-mono font-bold text-primary">{p.totalPoints}pts</td>
                    <td className="p-3 font-mono">{p.solveCount}</td>
                    <td className="p-3 font-mono text-muted-foreground">
                      {p.totalAttempts} ({p.wrongAttempts} wrong)
                    </td>
                    <td className="p-3">
                      {p.isDisqualified ? (
                        <span className="text-[10px] font-mono text-red-400 font-bold">DQ</span>
                      ) : (
                        <span className="text-[10px] font-mono text-emerald-400">ACTIVE</span>
                      )}
                    </td>
                    <td className="p-3 text-right">
                      {p.isDisqualified ? (
                        <button
                          onClick={() => handleReinstate(p.userId)}
                          disabled={actioning}
                          className="px-2 py-1 text-[11px] font-bold text-emerald-400 border border-emerald-500/30 rounded-lg hover:bg-emerald-500/10 cursor-pointer"
                        >
                          Reinstate
                        </button>
                      ) : (
                        <button
                          onClick={() => setSelectedUser(p)}
                          disabled={actioning}
                          className="px-2 py-1 text-[11px] font-bold text-red-400 border border-red-500/30 rounded-lg hover:bg-red-500/10 cursor-pointer"
                        >
                          Disqualify
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* HACKATHON TEAMS MATRIX VIEW */
        <div className="space-y-4">
          <div className="flex items-center gap-2 bg-background border border-sidebar-border rounded-xl px-3 py-2 text-xs">
            <Search className="size-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search hackathon team names..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-transparent text-foreground focus:outline-none placeholder:text-muted-foreground"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredTeams.map((team) => {
              const teamMembers = participants.filter((p) => p.teamId === team._id);
              const leader = teamMembers.find((m) => m.isTeamLeader) || teamMembers[0];

              return (
                <div key={team._id} className="p-5 rounded-2xl bg-sidebar border border-sidebar-border space-y-3">
                  <div className="flex items-center justify-between border-b border-sidebar-border pb-2">
                    <div>
                      <h3 className="text-sm font-bold text-foreground font-mono flex items-center gap-2">
                        <Users className="size-4 text-cyan-400" /> {team.teamName}
                      </h3>
                      <p className="text-[10px] text-muted-foreground font-mono">
                        Leader: {leader?.codename || "Leader"} ({leader?.realName || "Private"})
                      </p>
                    </div>

                    <span className="px-2.5 py-1 rounded bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 font-mono text-[10px] font-bold">
                      {teamMembers.length} Members
                    </span>
                  </div>

                  <div className="space-y-2">
                    <p className="text-[10px] font-mono uppercase text-muted-foreground font-bold">Roster</p>
                    <div className="space-y-1.5">
                      {teamMembers.map((m) => (
                        <div key={m.userId} className="flex items-center justify-between p-2 rounded-xl bg-background border border-sidebar-border text-xs">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-foreground">{m.codename}</span>
                            <span className="text-muted-foreground text-[10px]">({m.realName})</span>
                            {m.isTeamLeader && (
                              <span className="px-1.5 py-0.2 text-[9px] bg-amber-500/20 text-amber-400 rounded font-mono font-bold">
                                LEADER
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="font-mono text-primary font-bold">{m.totalPoints}pts</span>
                            {m.isDisqualified && <span className="text-red-400 font-bold text-[9px]">DQ</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Disqualify Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-sidebar border border-sidebar-border rounded-2xl p-6 max-w-md w-full space-y-4">
            <h3 className="text-lg font-bold text-foreground">Disqualify {selectedUser.codename}</h3>
            <p className="text-xs text-muted-foreground">
              This will lock their arena session and remove them from eligible ranks immediately.
            </p>

            <div>
              <label className="text-xs font-mono font-bold uppercase tracking-widest text-muted-foreground mb-1 block">
                Reason for Disqualification
              </label>
              <input
                type="text"
                placeholder="e.g. Flag sharing / Plagiarism"
                value={dqReason}
                onChange={(e) => setDqReason(e.target.value)}
                className="w-full bg-background border border-sidebar-border rounded-xl px-4 py-2 text-sm text-foreground focus:outline-none"
              />
            </div>

            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setSelectedUser(null)}
                className="px-4 py-2 text-xs font-bold text-muted-foreground hover:text-foreground cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDisqualify}
                disabled={actioning}
                className="px-4 py-2 bg-red-600 text-white text-xs font-bold rounded-xl hover:bg-red-700 disabled:opacity-60 cursor-pointer"
              >
                Confirm Disqualification
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Broadcast Announcement Modal */}
      {showAnnModal && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleSendAnnouncement} className="bg-sidebar border border-sidebar-border rounded-2xl p-6 max-w-md w-full space-y-4">
            <h3 className="text-lg font-bold text-foreground">Post Event Announcement</h3>

            <div>
              <label className="text-xs font-mono font-bold uppercase tracking-widest text-muted-foreground mb-1 block">
                Title
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Challenge 3 Hint Released!"
                value={annTitle}
                onChange={(e) => setAnnTitle(e.target.value)}
                className="w-full bg-background border border-sidebar-border rounded-xl px-4 py-2 text-sm text-foreground focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-mono font-bold uppercase tracking-widest text-muted-foreground mb-1 block">
                Body / Message
              </label>
              <textarea
                rows={3}
                placeholder="Details of the announcement..."
                value={annBody}
                onChange={(e) => setAnnBody(e.target.value)}
                className="w-full bg-background border border-sidebar-border rounded-xl px-4 py-2 text-sm text-foreground focus:outline-none resize-none"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="send-push"
                checked={sendPush}
                onChange={(e) => setSendPush(e.target.checked)}
                className="rounded border-sidebar-border"
              />
              <label htmlFor="send-push" className="text-xs text-muted-foreground">
                Send Web Push Notification to participants
              </label>
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowAnnModal(false)}
                className="px-4 py-2 text-xs font-bold text-muted-foreground hover:text-foreground cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={annSubmitting}
                className="px-4 py-2 bg-primary text-primary-foreground text-xs font-bold rounded-xl hover:opacity-90 disabled:opacity-60 cursor-pointer"
              >
                {annSubmitting ? "Posting..." : "Post Announcement"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
