"use client";

import React, { useEffect, useState, useCallback } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from "recharts";
import { ShieldAlert, Users, BookOpen, MessageSquare, HelpCircle, Loader2, Ban, Trash2, Settings, Download, ScrollText } from "lucide-react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";

interface ChartItem {
  label: string;
  users: number;
  notes: number;
  forums: number;
  doubts: number;
}

interface StatsData {
  chartData: ChartItem[];
  totals: {
    users: number;
    notes: number;
    forums: number;
    doubts: number;
  };
}

interface UserRecord {
  _id: string;
  name: string;
  email: string;
  role: string;
  points: number;
  isSuspended: boolean;
  createdAt: string;
}

interface FlaggedItem {
  _id: string;
  title?: string;
  content?: string;
  userId: string;
  userName?: string;
  createdAt: string;
}

interface AuditLogRecord {
  _id: string;
  adminName: string;
  action: string;
  details: string;
  createdAt: string;
}

export default function AdminPage() {
  const { data: session, status } = useSession();
  const [activeTab, setActiveTab] = useState<"analytics" | "users" | "moderation" | "settings" | "audit" | "export">("analytics");
  const [interval, setInterval] = useState<"daily" | "monthly" | "yearly">("daily");

  // States data caches
  const [stats, setStats] = useState<StatsData | null>(null);
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [flaggedNotes, setFlaggedNotes] = useState<FlaggedItem[]>([]);
  const [flaggedComments, setFlaggedComments] = useState<FlaggedItem[]>([]);
  const [siteSettings, setSiteSettings] = useState<Record<string, boolean>>({
    maintenanceMode: false,
    enableComments: true,
    enableRegistrations: true,
  });
  const [auditLogs, setAuditLogs] = useState<AuditLogRecord[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (status === "loading") return;
    if (!session || session.user?.role !== "admin") {
      redirect("/notes");
    }
  }, [session, status]);

  const loadAnalytics = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/stats?interval=${interval}`);
      if (res.ok) setStats(await res.json());
    } catch (e) {
      console.error(e);
    }
  }, [interval]);

  const loadUsersList = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/users");
      if (res.ok) setUsers(await res.json());
    } catch (e) {
      console.error(e);
    }
  }, []);

  const loadModerationQueue = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/moderation");
      if (res.ok) {
        const data = await res.json();
        setFlaggedNotes(data.notes || []);
        setFlaggedComments(data.comments || []);
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const loadSiteSettings = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/settings");
      if (res.ok) setSiteSettings(await res.json());
    } catch (e) {
      console.error(e);
    }
  }, []);

  const loadAuditLogsList = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/audit-logs");
      if (res.ok) setAuditLogs(await res.json());
    } catch (e) {
      console.error(e);
    }
  }, []);

  const fetchTabDetails = useCallback(async () => {
    setIsLoading(true);
    if (activeTab === "analytics") await loadAnalytics();
    else if (activeTab === "users") await loadUsersList();
    else if (activeTab === "moderation") await loadModerationQueue();
    else if (activeTab === "settings") await loadSiteSettings();
    else if (activeTab === "audit") await loadAuditLogsList();
    setIsLoading(false);
  }, [activeTab, loadAnalytics, loadUsersList, loadModerationQueue, loadSiteSettings, loadAuditLogsList]);

  useEffect(() => {
    if (session?.user?.role === "admin" && isMounted) {
      fetchTabDetails();
    }
  }, [activeTab, interval, session, isMounted, fetchTabDetails]);

  // Operations actions
  const handleUserModify = async (targetUserId: string, action: string, role?: string) => {
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId, action, role }),
      });
      if (res.ok) {
        loadUsersList();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleUserDelete = async (targetUserId: string) => {
    if (!confirm("Permanently delete user? Dependent folders, notes, and chats will be deleted recursively.")) return;
    try {
      const res = await fetch(`/api/admin/users?targetUserId=${targetUserId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        loadUsersList();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleModerationResolve = async (targetId: string, targetType: "note" | "comment", action: "approve" | "delete") => {
    try {
      const res = await fetch("/api/admin/moderation", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetId, targetType, action }),
      });
      if (res.ok) {
        loadModerationQueue();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleSiteSetting = async (key: string) => {
    const nextVal = !siteSettings[key];
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, value: nextVal }),
      });
      if (res.ok) {
        setSiteSettings((prev) => ({ ...prev, [key]: nextVal }));
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (status === "loading" || !isMounted) {
    return (
      <div className="flex-1 flex items-center justify-center bg-zinc-950 text-zinc-550 select-none font-semibold text-xs gap-2">
        <Loader2 className="h-5 w-5 animate-spin text-cyan-400" />
        <span style={{ fontFamily: "var(--font-jetbrains-mono)" }}>INITIALIZING OPERATIONAL SYSTEM...</span>
      </div>
    );
  }

  if (!session || session.user?.role !== "admin") {
    return (
      <div className="flex items-center justify-center h-full text-neutral-400 select-none font-medium text-lg">
        Access denied: Admins only.
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-neutral-950 overflow-hidden select-none relative">
      {/* Ambient background glows */}
      <div className="absolute top-0 right-1/4 w-[500px] h-[300px] bg-red-500/3 rounded-full blur-[120px] pointer-events-none" />

      {/* Top Banner */}
      <div className="border-b border-neutral-900 bg-neutral-950/80 backdrop-blur-md px-8 py-6 shrink-0 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 z-10">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-red-400 neon-pulse" />
            <h1
              className="text-xl font-bold text-neutral-100 tracking-tight"
              style={{ fontFamily: "var(--font-space-grotesk)" }}
            >
              Operations Center
            </h1>
          </div>
          <p className="text-neutral-500 text-xs">Manage active user permissions, moderate flags queue, and export stats summaries.</p>
        </div>

        {/* Tab triggers */}
        <div className="flex items-center gap-1 border border-neutral-900 bg-neutral-950/40 p-1 rounded-xl max-w-full overflow-x-auto custom-scroll shrink-0 whitespace-nowrap">
          {(["analytics", "users", "moderation", "settings", "audit", "export"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`text-[9px] font-bold px-3 py-1.5 rounded-lg uppercase tracking-widest transition-all ${
                activeTab === tab
                  ? "bg-neutral-900 border border-neutral-800 text-neutral-100 font-extrabold"
                  : "text-neutral-500 hover:text-neutral-300"
              }`}
              style={{ fontFamily: "var(--font-space-grotesk)" }}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Main scrolling viewport content */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-8 max-w-5xl w-full mx-auto custom-scroll z-10 relative">
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center text-neutral-500 text-xs font-semibold gap-2">
            <Loader2 className="h-6 w-6 animate-spin text-cyan-400" />
            <span style={{ fontFamily: "var(--font-jetbrains-mono)" }}>SYNCING OPERATIONAL DATA...</span>
          </div>
        ) : (
          <div className="space-y-8 animate-fade-in">
            {/* TAB: ANALYTICS OVERVIEW */}
            {activeTab === "analytics" && stats && (
              <div className="space-y-8">
                {/* Interval toggle */}
                <div className="flex justify-between items-center border-b border-neutral-900 pb-3">
                  <span
                    className="text-xs font-bold text-neutral-300 uppercase tracking-widest"
                    style={{ fontFamily: "var(--font-space-grotesk)" }}
                  >
                    KPI Growth Aggregations
                  </span>
                  <div className="flex items-center gap-1 border border-neutral-850 bg-neutral-950 p-0.5 rounded-lg">
                    {(["daily", "monthly", "yearly"] as const).map((mode) => (
                      <button
                        key={mode}
                        onClick={() => setInterval(mode)}
                        className={`text-[9px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider transition-all ${
                          interval === mode ? "bg-neutral-800 text-neutral-100" : "text-neutral-500 hover:text-neutral-300"
                        }`}
                        style={{ fontFamily: "var(--font-space-grotesk)" }}
                      >
                        {mode}
                      </button>
                    ))}
                  </div>
                </div>

                {/* KPI Snapshots grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {[
                    { label: "Total Accounts", value: stats.totals.users, icon: Users, color: "text-cyan-400" },
                    { label: "Notes Created", value: stats.totals.notes, icon: BookOpen, color: "text-violet-400" },
                    { label: "Forums Posts", value: stats.totals.forums, icon: MessageSquare, color: "text-indigo-400" },
                    { label: "Active Doubts", value: stats.totals.doubts, icon: HelpCircle, color: "text-amber-400" },
                  ].map(({ label, value, icon: Icon, color }) => (
                    <div key={label} className="bg-neutral-955/30 backdrop-blur-md border border-white/5 hover:border-neutral-800 transition-all duration-300 p-5 rounded-2xl space-y-3 hover:shadow-[0_0_20px_rgba(255,255,255,0.01)]">
                      <div className="flex items-center justify-between text-neutral-500">
                        <span
                          className="text-[9px] font-bold uppercase tracking-widest"
                          style={{ fontFamily: "var(--font-space-grotesk)" }}
                        >
                          {label}
                        </span>
                        <Icon className={`h-4 w-4 ${color} opacity-60`} />
                      </div>
                      <h2
                        className="text-2xl font-extrabold text-neutral-100"
                        style={{ fontFamily: "var(--font-space-grotesk)" }}
                      >
                        {value}
                      </h2>
                    </div>
                  ))}
                </div>

                {/* Charts Area */}
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="bg-neutral-955/30 backdrop-blur-md border border-white/5 p-6 rounded-2xl space-y-4 shadow-lg">
                    <h3
                      className="text-xs font-bold text-neutral-350 uppercase tracking-widest"
                      style={{ fontFamily: "var(--font-space-grotesk)" }}
                    >
                      Account Registrations
                    </h3>
                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={stats.chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <defs>
                            <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.2} />
                              <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1c1c1f" />
                          <XAxis dataKey="label" stroke="#52525b" fontSize={9} tickLine={false} style={{ fontFamily: "var(--font-jetbrains-mono)" }} />
                          <YAxis stroke="#52525b" fontSize={9} tickLine={false} style={{ fontFamily: "var(--font-jetbrains-mono)" }} />
                          <Tooltip
                            contentStyle={{ backgroundColor: "#09090b", border: "1px solid #27272a", borderRadius: "8px", fontSize: "11px", fontFamily: "var(--font-jakarta)" }}
                          />
                          <Area type="monotone" dataKey="users" stroke="#06b6d4" strokeWidth={2} fillOpacity={1} fill="url(#colorUsers)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="bg-neutral-955/30 backdrop-blur-md border border-white/5 p-6 rounded-2xl space-y-4 shadow-lg">
                    <h3
                      className="text-xs font-bold text-neutral-350 uppercase tracking-widest"
                      style={{ fontFamily: "var(--font-space-grotesk)" }}
                    >
                      Content Contributions
                    </h3>
                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={stats.chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1c1c1f" />
                          <XAxis dataKey="label" stroke="#52525b" fontSize={9} tickLine={false} style={{ fontFamily: "var(--font-jetbrains-mono)" }} />
                          <YAxis stroke="#52525b" fontSize={9} tickLine={false} style={{ fontFamily: "var(--font-jetbrains-mono)" }} />
                          <Tooltip
                            contentStyle={{ backgroundColor: "#09090b", border: "1px solid #27272a", borderRadius: "8px", fontSize: "11px", fontFamily: "var(--font-jakarta)" }}
                          />
                          <Legend wrapperStyle={{ fontSize: "9px", paddingTop: "10px", fontFamily: "var(--font-space-grotesk)" }} />
                          <Bar dataKey="notes" fill="#818cf8" radius={[4, 4, 0, 0]} name="Notes" />
                          <Bar dataKey="forums" fill="#a78bfa" radius={[4, 4, 0, 0]} name="Forums" />
                          <Bar dataKey="doubts" fill="#22d3ee" radius={[4, 4, 0, 0]} name="Doubts" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: USER MANAGER */}
            {activeTab === "users" && (
              <div className="bg-neutral-955/30 backdrop-blur-md border border-white/5 rounded-2xl overflow-hidden shadow-lg">
                <div
                  className="hidden md:grid px-5 py-3.5 border-b border-neutral-900 bg-neutral-900/20 text-[9px] font-bold text-neutral-500 uppercase tracking-widest grid-cols-12"
                  style={{ fontFamily: "var(--font-space-grotesk)" }}
                >
                  <div className="col-span-4">User Details</div>
                  <div className="col-span-2">Role</div>
                  <div className="col-span-2">Points</div>
                  <div className="col-span-2">Status</div>
                  <div className="col-span-2 text-right">Actions</div>
                </div>

                <div className="divide-y divide-neutral-900/60">
                  {users.map((u) => (
                    <div key={u._id} className="px-5 py-4 flex flex-col md:grid md:grid-cols-12 gap-3.5 md:gap-0 items-start md:items-center hover:bg-neutral-900/10 transition-all text-xs">
                      <div className="col-span-4 w-full min-w-0">
                        <p className="font-bold text-neutral-200" style={{ fontFamily: "var(--font-space-grotesk)" }}>
                          {u.name || "Scholar User"}
                        </p>
                        <p className="text-[10px] text-neutral-500 truncate">{u.email}</p>
                      </div>

                      <div className="col-span-2 w-full md:w-auto flex items-center justify-between md:block">
                        <span className="text-[9px] font-bold text-neutral-500 uppercase tracking-widest md:hidden">Role</span>
                        <select
                          value={u.role}
                          onChange={(e) => handleUserModify(u._id, "role", e.target.value)}
                          className="bg-neutral-950 border border-neutral-850 rounded-md text-[11px] font-bold text-neutral-350 p-1 focus:outline-none focus:border-cyan-400"
                          style={{ fontFamily: "var(--font-space-grotesk)" }}
                        >
                          <option value="user">User</option>
                          <option value="admin">Admin</option>
                        </select>
                      </div>

                      <div
                        className="col-span-2 w-full md:w-auto flex items-center justify-between md:block font-bold text-cyan-400"
                        style={{ fontFamily: "var(--font-jetbrains-mono)" }}
                      >
                        <span className="text-[9px] font-bold text-neutral-500 uppercase tracking-widest md:hidden font-sans">Points</span>
                        <span>{u.points} pts</span>
                      </div>

                      <div className="col-span-2 w-full md:w-auto flex items-center justify-between md:block select-none">
                        <span className="text-[9px] font-bold text-neutral-500 uppercase tracking-widest md:hidden">Status</span>
                        {u.isSuspended ? (
                          <span
                            className="text-[9px] font-extrabold uppercase bg-red-500/10 border border-red-500/20 text-red-400 px-2 py-0.5 rounded"
                            style={{ fontFamily: "var(--font-space-grotesk)" }}
                          >
                            Suspended
                          </span>
                        ) : (
                          <span
                            className="text-[9px] font-extrabold uppercase bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded"
                            style={{ fontFamily: "var(--font-space-grotesk)" }}
                          >
                            Active
                          </span>
                        )}
                      </div>

                      <div className="col-span-2 w-full md:w-auto flex items-center justify-between md:justify-end gap-2 mt-2 md:mt-0 border-t border-neutral-900/40 pt-3 md:pt-0 md:border-0">
                        <span className="text-[9px] font-bold text-neutral-500 uppercase tracking-widest md:hidden">Actions</span>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleUserModify(u._id, u.isSuspended ? "unsuspend" : "suspend")}
                            className="h-8 w-8 text-neutral-500 hover:text-neutral-250 hover:bg-neutral-900 rounded-lg transition-colors"
                          >
                            <Ban className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleUserDelete(u._id)}
                            className="h-8 w-8 text-neutral-500 hover:text-red-400 hover:bg-neutral-900 rounded-lg transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB: CONTENT MODERATION */}
            {activeTab === "moderation" && (
              <div className="space-y-6">
                <div className="bg-neutral-955/30 backdrop-blur-md border border-white/5 rounded-2xl p-5 space-y-4 shadow-lg">
                  <h3
                    className="text-xs font-bold text-neutral-350 uppercase tracking-widest"
                    style={{ fontFamily: "var(--font-space-grotesk)" }}
                  >
                    Reported Note Posts ({flaggedNotes.length})
                  </h3>
                  {flaggedNotes.length === 0 ? (
                    <p className="text-xs text-neutral-600 italic py-4">No reported posts in queue.</p>
                  ) : (
                    <div className="divide-y divide-neutral-900/60">
                      {flaggedNotes.map((n) => (
                        <div key={n._id} className="py-3.5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-xs border-b border-neutral-900/40 last:border-0">
                          <div className="min-w-0 w-full sm:w-auto">
                            <p className="font-bold text-neutral-250 truncate" style={{ fontFamily: "var(--font-space-grotesk)" }}>
                              {n.title}
                            </p>
                            <p className="text-[10px] text-neutral-500 mt-0.5" style={{ fontFamily: "var(--font-jetbrains-mono)" }}>
                              Reported on {new Date(n.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex gap-2 select-none shrink-0 w-full sm:w-auto justify-end">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleModerationResolve(n._id, "note", "approve")}
                              className="bg-emerald-600/10 hover:bg-emerald-600 text-emerald-400 hover:text-white text-[10px] font-bold h-8 rounded-lg transition-colors"
                              style={{ fontFamily: "var(--font-space-grotesk)" }}
                            >
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleModerationResolve(n._id, "note", "delete")}
                              className="bg-red-600/10 hover:bg-red-600 text-red-400 hover:text-white text-[10px] font-bold h-8 rounded-lg transition-colors"
                              style={{ fontFamily: "var(--font-space-grotesk)" }}
                            >
                              Remove
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="bg-neutral-955/30 backdrop-blur-md border border-white/5 rounded-2xl p-5 space-y-4 shadow-lg">
                  <h3
                    className="text-xs font-bold text-neutral-355 uppercase tracking-widest"
                    style={{ fontFamily: "var(--font-space-grotesk)" }}
                  >
                    Reported Comments ({flaggedComments.length})
                  </h3>
                  {flaggedComments.length === 0 ? (
                    <p className="text-xs text-neutral-600 italic py-4">No reported comments in queue.</p>
                  ) : (
                    <div className="divide-y divide-neutral-900/60">
                      {flaggedComments.map((c) => (
                        <div key={c._id} className="py-3.5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-xs border-b border-neutral-900/40 last:border-0">
                          <div className="min-w-0 w-full sm:w-auto">
                            <p className="text-neutral-300 italic break-words">&quot;{c.content}&quot;</p>
                            <p className="text-[10px] text-neutral-505 mt-0.5">
                              By <strong className="text-neutral-400">{c.userName}</strong> •{" "}
                              <span style={{ fontFamily: "var(--font-jetbrains-mono)" }}>
                                {new Date(c.createdAt).toLocaleDateString()}
                              </span>
                            </p>
                          </div>
                          <div className="flex gap-2 select-none shrink-0 w-full sm:w-auto justify-end">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleModerationResolve(c._id, "comment", "approve")}
                              className="bg-emerald-600/10 hover:bg-emerald-600 text-emerald-400 hover:text-white text-[10px] font-bold h-8 rounded-lg transition-colors"
                              style={{ fontFamily: "var(--font-space-grotesk)" }}
                            >
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleModerationResolve(c._id, "comment", "delete")}
                              className="bg-red-600/10 hover:bg-red-600 text-red-400 hover:text-white text-[10px] font-bold h-8 rounded-lg transition-colors"
                              style={{ fontFamily: "var(--font-space-grotesk)" }}
                            >
                              Remove
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB: SITE SETTINGS */}
            {activeTab === "settings" && (
              <div className="bg-neutral-955/30 backdrop-blur-md border border-white/5 rounded-2xl p-6 space-y-5 shadow-lg">
                <div className="flex items-center gap-2 border-b border-neutral-900/80 pb-3">
                  <Settings className="h-4 w-4 text-cyan-400" />
                  <h2
                    className="text-xs font-bold text-neutral-250 uppercase tracking-widest"
                    style={{ fontFamily: "var(--font-space-grotesk)" }}
                  >
                    Global Configuration Flags
                  </h2>
                </div>

                <div className="space-y-4">
                  {/* Maintenance Mode */}
                  <div className="flex items-center justify-between border-b border-neutral-900 pb-3 select-none">
                    <div className="space-y-0.5">
                      <h4 className="text-xs font-bold text-neutral-100" style={{ fontFamily: "var(--font-space-grotesk)" }}>
                        Maintenance Mode
                      </h4>
                      <p className="text-[10px] text-neutral-500 leading-relaxed">Locks access to non-admin users with a maintenance screen.</p>
                    </div>
                    <button
                      onClick={() => handleToggleSiteSetting("maintenanceMode")}
                      className={`h-5 w-9 rounded-full transition-all relative ${
                        siteSettings.maintenanceMode ? "bg-red-600" : "bg-neutral-800"
                      }`}
                    >
                      <div
                        className={`h-4.5 w-4.5 rounded-full bg-neutral-950 absolute top-0.5 transition-all ${
                          siteSettings.maintenanceMode ? "right-0.5" : "left-0.5"
                        }`}
                      />
                    </button>
                  </div>

                  {/* Enable Comments */}
                  <div className="flex items-center justify-between border-b border-neutral-900 pb-3 select-none">
                    <div className="space-y-0.5">
                      <h4 className="text-xs font-bold text-neutral-100" style={{ fontFamily: "var(--font-space-grotesk)" }}>
                        Enable Social Commenting
                      </h4>
                      <p className="text-[10px] text-neutral-505 leading-relaxed">Allows users to create nested thread comments on public feed notes.</p>
                    </div>
                    <button
                      onClick={() => handleToggleSiteSetting("enableComments")}
                      className={`h-5 w-9 rounded-full transition-all relative ${
                        siteSettings.enableComments ? "bg-cyan-500" : "bg-neutral-805"
                      }`}
                    >
                      <div
                        className={`h-4.5 w-4.5 rounded-full bg-neutral-950 absolute top-0.5 transition-all ${
                          siteSettings.enableComments ? "right-0.5" : "left-0.5"
                        }`}
                      />
                    </button>
                  </div>

                  {/* Enable Registrations */}
                  <div className="flex items-center justify-between select-none">
                    <div className="space-y-0.5">
                      <h4 className="text-xs font-bold text-neutral-100" style={{ fontFamily: "var(--font-space-grotesk)" }}>
                        Public Account Registrations
                      </h4>
                      <p className="text-[10px] text-neutral-505 leading-relaxed">Enables email/password account registrations on the signup screen.</p>
                    </div>
                    <button
                      onClick={() => handleToggleSiteSetting("enableRegistrations")}
                      className={`h-5 w-9 rounded-full transition-all relative ${
                        siteSettings.enableRegistrations ? "bg-cyan-500" : "bg-neutral-805"
                      }`}
                    >
                      <div
                        className={`h-4.5 w-4.5 rounded-full bg-neutral-950 absolute top-0.5 transition-all ${
                          siteSettings.enableRegistrations ? "right-0.5" : "left-0.5"
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: AUDIT LOGS */}
            {activeTab === "audit" && (
              <div className="bg-neutral-955/30 backdrop-blur-md border border-white/5 rounded-2xl p-5 space-y-4 shadow-lg">
                <div className="flex items-center gap-2 border-b border-neutral-900 pb-3">
                  <ScrollText className="h-4 w-4 text-cyan-400" />
                  <h3
                    className="text-xs font-bold text-neutral-350 uppercase tracking-widest"
                    style={{ fontFamily: "var(--font-space-grotesk)" }}
                  >
                    Audit Log Tracker
                  </h3>
                </div>

                {auditLogs.length === 0 ? (
                  <p className="text-xs text-neutral-550 italic py-4">No audit logs recorded.</p>
                ) : (
                  <div className="space-y-3 font-mono text-[10px]">
                    {auditLogs.map((log) => (
                      <div key={log._id} className="p-3 bg-neutral-950 border border-neutral-900/60 rounded-xl space-y-1.5">
                        <div className="flex flex-col sm:flex-row justify-between text-neutral-555 font-bold gap-1">
                          <span>{log.adminName} ({log.action})</span>
                          <span>{new Date(log.createdAt).toLocaleString()}</span>
                        </div>
                        <p className="text-neutral-300">{log.details}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB: EXPORTS CENTER */}
            {activeTab === "export" && (
              <div className="bg-neutral-955/30 backdrop-blur-md border border-white/5 rounded-2xl p-6 space-y-5 shadow-lg">
                <div className="flex items-center gap-2 border-b border-neutral-900 pb-3 select-none">
                  <Download className="h-4 w-4 text-cyan-400" />
                  <h3
                    className="text-xs font-bold text-neutral-350 uppercase tracking-widest"
                    style={{ fontFamily: "var(--font-space-grotesk)" }}
                  >
                    CSV Data Backup Console
                  </h3>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <a
                    href="/api/admin/export?target=users"
                    download="nottexia-users-export.csv"
                    className="flex items-center justify-between p-4 bg-neutral-950 border border-neutral-900 hover:border-cyan-400/35 rounded-2xl text-xs font-bold text-neutral-300 hover:text-neutral-100 transition-all shadow-lg"
                    style={{ fontFamily: "var(--font-space-grotesk)" }}
                  >
                    <span>Export Accounts register (.csv)</span>
                    <Download className="h-4 w-4 text-neutral-500" />
                  </a>

                  <a
                    href="/api/admin/export?target=notes"
                    download="nottexia-posts-export.csv"
                    className="flex items-center justify-between p-4 bg-neutral-950 border border-neutral-900 hover:border-cyan-400/35 rounded-2xl text-xs font-bold text-neutral-300 hover:text-neutral-100 transition-all shadow-lg"
                    style={{ fontFamily: "var(--font-space-grotesk)" }}
                  >
                    <span>Export Published Posts logs (.csv)</span>
                    <Download className="h-4 w-4 text-neutral-500" />
                  </a>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
