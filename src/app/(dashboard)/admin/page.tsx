"use client";

export const dynamic = "force-dynamic";

import React, { useEffect, useState, useCallback } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { ShieldAlert, Users, BookOpen, MessageSquare, HelpCircle, Loader2, Ban, Trash2, Download, Search, Send } from "lucide-react";
import { useSession } from "next-auth/react";
import { redirect, useRouter } from "next/navigation";
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
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"analytics" | "users" | "moderation" | "settings" | "audit" | "export">("analytics");
  const [interval, setInterval] = useState<"daily" | "monthly" | "yearly">("daily");

  const [stats, setStats] = useState<StatsData | null>(null);
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "user" | "teacher" | "admin">("all");
  const [flaggedNotes, setFlaggedNotes] = useState<FlaggedItem[]>([]);
  const [, setFlaggedComments] = useState<FlaggedItem[]>([]);
  const [siteSettings, setSiteSettings] = useState<Record<string, boolean>>({
    maintenanceMode: false,
    enableComments: true,
    enableRegistrations: true,
  });
  const [auditLogs, setAuditLogs] = useState<AuditLogRecord[]>([]);

  const [, setIsLoading] = useState(true);
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
        body: JSON.stringify({ [key]: nextVal }),
      });
      if (res.ok) {
        setSiteSettings((prev) => ({ ...prev, [key]: nextVal }));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleExportData = async (format: "csv" | "json") => {
    try {
      const res = await fetch(`/api/admin/export?format=${format}`);
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `nottexia-db-export-${Date.now()}.${format}`;
        a.click();
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#030305] text-zinc-100 overflow-y-auto antialiased relative selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Background Ambient Mesh Glow Orbs */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 right-1/4 w-[500px] h-[350px] bg-rose-500/10 rounded-full blur-[140px]" />
      </div>

      {/* Header Banner */}
      <div className="border-b border-white/5 bg-zinc-950/40 p-8 rounded-[2rem] border border-white/10 relative z-10 backdrop-blur-2xl m-6 sm:m-10 mb-0">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="size-14 rounded-2xl bg-rose-500/10 flex items-center justify-center border border-rose-500/20 text-rose-400">
              <ShieldAlert className="size-7" />
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tight text-white flex items-center gap-3">
                Admin Panel
                <span className="text-[10px] font-mono font-bold bg-rose-500/20 text-rose-300 px-3 py-1 rounded-full border border-rose-500/30 uppercase tracking-widest">
                  COMMAND CENTER
                </span>
              </h1>
              <p className="text-zinc-400 text-xs sm:text-sm font-light mt-1">
                Oversee platform telemetry, manage user permissions, moderate flagged content, and review audit logs.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="p-6 sm:p-10 max-w-6xl w-full mx-auto space-y-8 relative z-10">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none select-none">
          {[
            { id: "analytics", label: "Analytics & Telemetry" },
            { id: "users", label: "Users & Direct Messages" },
            { id: "moderation", label: "Content Moderation" },
            { id: "settings", label: "System Settings" },
            { id: "audit", label: "Audit Log Records" },
            { id: "export", label: "Database Export" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`text-xs font-mono font-bold px-4 py-2 rounded-full uppercase tracking-widest transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? "bg-white/10 border border-white/20 text-white shadow-sm"
                  : "text-zinc-500 hover:text-zinc-300 border border-transparent"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab 1: Analytics & Telemetry */}
        {activeTab === "analytics" && (
          <div className="space-y-6">
            <div className="flex justify-end select-none">
              <div className="flex items-center gap-1.5 bg-zinc-950 p-1 rounded-full border border-white/10">
                {(["daily", "monthly", "yearly"] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setInterval(mode)}
                    className={`text-[10px] font-mono font-bold px-3 py-1 rounded-full uppercase tracking-wider transition-all ${
                      interval === mode ? "bg-white text-zinc-950" : "text-zinc-500 hover:text-white"
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>

            {/* Totals Metric Doppelrand Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
              {[
                { label: "Total Scholars", val: stats?.totals?.users || 0, icon: Users, color: "text-cyan-400" },
                { label: "Published Notes", val: stats?.totals?.notes || 0, icon: BookOpen, color: "text-violet-400" },
                { label: "Forum Discussions", val: stats?.totals?.forums || 0, icon: MessageSquare, color: "text-amber-400" },
                { label: "Doubt Tickets", val: stats?.totals?.doubts || 0, icon: HelpCircle, color: "text-rose-400" },
              ].map((card, idx) => (
                <div key={idx} className="rounded-[2rem] bg-zinc-900/40 border border-white/10 p-2 backdrop-blur-xl">
                  <div className="rounded-[calc(2rem-0.5rem)] bg-[#07070a] border border-white/5 p-6 space-y-2 text-center">
                    <card.icon className={`size-6 ${card.color} mx-auto mb-1`} />
                    <p className="text-2xl font-black text-white font-mono">{card.val}</p>
                    <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">{card.label}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Charts Panel */}
            <div className="rounded-[2.5rem] bg-zinc-900/40 border border-white/10 p-2.5 backdrop-blur-3xl">
              <div className="rounded-[calc(2.5rem-0.75rem)] bg-[#07070a] border border-white/5 p-8 space-y-6">
                <h3 className="text-xs font-mono font-bold text-white uppercase tracking-widest">
                  Platform Growth Telemetry ({interval})
                </h3>
                {stats?.chartData && isMounted ? (
                  <div className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={stats.chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                        <XAxis dataKey="label" stroke="#71717a" fontSize={10} />
                        <YAxis stroke="#71717a" fontSize={10} />
                        <Tooltip contentStyle={{ backgroundColor: "#09090b", borderColor: "#27272a", borderRadius: "1rem" }} />
                        <Area type="monotone" dataKey="users" stroke="#22d3ee" fill="#22d3ee" fillOpacity={0.15} name="Scholars" />
                        <Area type="monotone" dataKey="notes" stroke="#a78bfa" fill="#a78bfa" fillOpacity={0.15} name="Notes" />
                        <Area type="monotone" dataKey="forums" stroke="#fbbf24" fill="#fbbf24" fillOpacity={0.15} name="Forums" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="py-20 flex justify-center">
                    <Loader2 className="size-8 animate-spin text-rose-400" />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: User Management & Direct Messaging */}
        {activeTab === "users" && (
          <div className="space-y-6">
            {/* User Search & Role Filter Header */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-zinc-950/60 p-4 rounded-3xl border border-white/10">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-zinc-500" />
                <input
                  type="text"
                  value={userSearchQuery}
                  onChange={(e) => setUserSearchQuery(e.target.value)}
                  placeholder="Search user by name or email..."
                  className="w-full bg-zinc-900 border border-white/10 rounded-2xl pl-11 pr-4 py-2.5 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-cyan-500/50 transition-colors"
                />
                {userSearchQuery && (
                  <button
                    onClick={() => setUserSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-mono text-zinc-500 hover:text-white px-2 py-1"
                  >
                    Clear
                  </button>
                )}
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                {(["all", "user", "teacher", "admin"] as const).map((r) => (
                  <button
                    key={r}
                    onClick={() => setRoleFilter(r)}
                    className={`text-[10px] font-mono font-bold px-3 py-1.5 rounded-xl uppercase tracking-wider transition-all whitespace-nowrap ${
                      roleFilter === r
                        ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                        : "text-zinc-400 hover:text-white border border-transparent hover:bg-white/5"
                    }`}
                  >
                    {r === "all" ? "All Roles" : r === "user" ? "Students" : r}
                  </button>
                ))}
              </div>
            </div>

            {/* Users Table */}
            <div className="rounded-[2.5rem] bg-zinc-900/40 border border-white/10 p-2.5 backdrop-blur-3xl">
              <div className="rounded-[calc(2.5rem-0.75rem)] bg-[#07070a] border border-white/5 overflow-hidden">
                {(() => {
                  const filteredUsers = users.filter((u) => {
                    const matchesSearch =
                      !userSearchQuery ||
                      (u.name || "").toLowerCase().includes(userSearchQuery.toLowerCase()) ||
                      (u.email || "").toLowerCase().includes(userSearchQuery.toLowerCase());
                    const matchesRole = roleFilter === "all" || u.role === roleFilter;
                    return matchesSearch && matchesRole;
                  });

                  if (filteredUsers.length === 0) {
                    return (
                      <div className="p-12 text-center space-y-3">
                        <Users className="size-10 text-zinc-600 mx-auto" />
                        <p className="text-xs text-zinc-400 font-mono">
                          {userSearchQuery || roleFilter !== "all"
                            ? `No users found matching "${userSearchQuery}" ${roleFilter !== "all" ? `with role "${roleFilter}"` : ""}`
                            : "No registered users found."}
                        </p>
                      </div>
                    );
                  }

                  return (
                    <div className="overflow-x-auto">
                      <div className="px-6 py-3 border-b border-white/5 flex items-center justify-between text-[11px] font-mono text-zinc-400 bg-zinc-950/40">
                        <span>Showing {filteredUsers.length} of {users.length} Users</span>
                        <span>Click Direct Message to chat instantly</span>
                      </div>
                      <table className="w-full text-left text-xs whitespace-nowrap">
                        <thead className="bg-zinc-950/80 text-zinc-400 font-mono text-[10px] uppercase tracking-widest border-b border-white/5">
                          <tr>
                            <th className="px-6 py-4 font-bold">User</th>
                            <th className="px-6 py-4 font-bold">Role</th>
                            <th className="px-6 py-4 font-bold">Points</th>
                            <th className="px-6 py-4 font-bold">Status</th>
                            <th className="px-6 py-4 font-bold text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {filteredUsers.map((u) => (
                            <tr key={u._id} className="hover:bg-white/5 transition-colors">
                              <td className="px-6 py-4 font-bold text-white">
                                <p className="truncate max-w-[180px]">{u.name || "User"}</p>
                                <p className="text-[10px] font-mono text-zinc-500 font-normal">{u.email}</p>
                              </td>
                              <td className="px-6 py-4">
                                <select
                                  value={u.role}
                                  onChange={(e) => handleUserModify(u._id, "role", e.target.value)}
                                  className={`px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider border focus:outline-none cursor-pointer transition-all ${
                                    u.role === "admin"
                                      ? "text-rose-400 border-rose-500/30 bg-rose-500/10"
                                      : u.role === "teacher"
                                      ? "text-amber-400 border-amber-500/30 bg-amber-500/10"
                                      : "text-cyan-400 border-cyan-500/30 bg-cyan-500/10"
                                  }`}
                                >
                                  <option value="user" className="bg-zinc-950 text-cyan-400 font-mono">User (Student)</option>
                                  <option value="teacher" className="bg-zinc-950 text-amber-400 font-mono">Teacher (Instructor)</option>
                                  <option value="admin" className="bg-zinc-950 text-rose-400 font-mono">Admin</option>
                                </select>
                              </td>
                              <td className="px-6 py-4 font-mono font-bold text-amber-400">{u.points} pts</td>
                              <td className="px-6 py-4">
                                {u.isSuspended ? (
                                  <span className="px-3 py-1 rounded-full text-[10px] font-mono font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20 uppercase">
                                    Suspended
                                  </span>
                                ) : (
                                  <span className="px-3 py-1 rounded-full text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase">
                                    Active
                                  </span>
                                )}
                              </td>
                              <td className="px-6 py-4 text-right space-x-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => router.push(`/messages?userId=${u._id}`)}
                                  className="bg-cyan-500/10 border-cyan-500/30 hover:bg-cyan-500/20 text-cyan-300 text-xs font-bold font-mono"
                                  title={`Direct Message ${u.name}`}
                                >
                                  <Send className="size-3.5 mr-1 text-cyan-400" /> Direct Message
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleUserModify(u._id, u.isSuspended ? "unsuspend" : "suspend")}
                                  className="bg-zinc-900 border-white/10 hover:bg-zinc-800 text-xs text-zinc-300"
                                >
                                  <Ban className="size-3.5 mr-1" /> {u.isSuspended ? "Unsuspend" : "Suspend"}
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleUserDelete(u._id)}
                                  className="bg-zinc-900 border-white/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 text-xs"
                                >
                                  <Trash2 className="size-3.5" />
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Content Moderation Queue */}
        {activeTab === "moderation" && (
          <div className="space-y-6">
            <div className="rounded-[2.5rem] bg-zinc-900/40 border border-white/10 p-2.5 backdrop-blur-3xl space-y-4">
              <div className="rounded-[calc(2.5rem-0.75rem)] bg-[#07070a] border border-white/5 p-8 space-y-4">
                <h3 className="text-xs font-mono font-bold text-white uppercase tracking-widest">
                  Flagged Notes Queue ({flaggedNotes.length})
                </h3>
                {flaggedNotes.length === 0 ? (
                  <p className="text-xs text-zinc-500 italic">No flagged notes currently in queue.</p>
                ) : (
                  <div className="space-y-3">
                    {flaggedNotes.map((item) => (
                      <div key={item._id} className="p-4 bg-zinc-950 rounded-2xl border border-white/5 flex items-center justify-between">
                        <div>
                          <p className="text-xs font-bold text-white">{item.title || "Untitled Note"}</p>
                          <p className="text-[10px] font-mono text-zinc-500">By {item.userName}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => handleModerationResolve(item._id, "note", "approve")} className="rounded-full bg-emerald-500 text-zinc-950 text-xs font-bold px-4">
                            Approve
                          </Button>
                          <Button size="sm" onClick={() => handleModerationResolve(item._id, "note", "delete")} className="rounded-full bg-rose-500 text-white text-xs font-bold px-4">
                            Delete
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: System Settings */}
        {activeTab === "settings" && (
          <div className="rounded-[2.5rem] bg-zinc-900/40 border border-white/10 p-2.5 backdrop-blur-3xl">
            <div className="rounded-[calc(2.5rem-0.75rem)] bg-[#07070a] border border-white/5 p-8 space-y-6">
              <h3 className="text-xs font-mono font-bold text-white uppercase tracking-widest">Platform Operations Toggles</h3>

              {[
                { key: "maintenanceMode", label: "Maintenance Mode", desc: "Restrict student traffic to read-only mode." },
                { key: "enableComments", label: "Public Comments", desc: "Allow discussions on notes and blogs." },
                { key: "enableRegistrations", label: "Student Registrations", desc: "Allow new student account signups." },
              ].map((setting) => (
                <div key={setting.key} className="flex items-center justify-between border-b border-white/5 pb-4">
                  <div>
                    <p className="text-xs font-bold text-white">{setting.label}</p>
                    <p className="text-[10px] font-mono text-zinc-500">{setting.desc}</p>
                  </div>
                  <button
                    onClick={() => handleToggleSiteSetting(setting.key)}
                    className={`h-6 w-11 rounded-full transition-all relative ${siteSettings[setting.key] ? "bg-emerald-500" : "bg-zinc-800"}`}
                  >
                    <div className={`size-4 bg-zinc-950 rounded-full absolute top-1 transition-all ${siteSettings[setting.key] ? "right-1" : "left-1"}`} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 5: Audit Log Records */}
        {activeTab === "audit" && (
          <div className="rounded-[2.5rem] bg-zinc-900/40 border border-white/10 p-2.5 backdrop-blur-3xl">
            <div className="rounded-[calc(2.5rem-0.75rem)] bg-[#07070a] border border-white/5 p-8 space-y-4">
              <h3 className="text-xs font-mono font-bold text-white uppercase tracking-widest">System Audit Log History</h3>
              <div className="space-y-3">
                {auditLogs.map((log) => (
                  <div key={log._id} className="p-4 bg-zinc-950 rounded-2xl border border-white/5 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-white">{log.action}</p>
                      <p className="text-[10px] font-mono text-zinc-500">{log.details}</p>
                    </div>
                    <span className="text-[10px] font-mono text-zinc-500">{new Date(log.createdAt).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 6: Database Export */}
        {activeTab === "export" && (
          <div className="rounded-[2.5rem] bg-zinc-900/40 border border-white/10 p-2.5 backdrop-blur-3xl max-w-md mx-auto text-center">
            <div className="rounded-[calc(2.5rem-0.75rem)] bg-[#07070a] border border-white/5 p-8 space-y-6">
              <Download className="size-10 text-cyan-400 mx-auto" />
              <div>
                <h3 className="text-lg font-bold text-white">Database Backup &amp; Export</h3>
                <p className="text-xs text-zinc-400 font-light mt-1">Export full database records in CSV or JSON format.</p>
              </div>
              <div className="flex gap-3 justify-center">
                <Button onClick={() => handleExportData("csv")} className="rounded-full bg-white hover:bg-zinc-100 text-zinc-950 font-bold text-xs h-10 px-5">
                  Export CSV
                </Button>
                <Button onClick={() => handleExportData("json")} className="rounded-full bg-zinc-900 hover:bg-zinc-800 text-white border border-white/10 font-bold text-xs h-10 px-5">
                  Export JSON
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
