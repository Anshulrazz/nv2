"use client";

export const dynamic = "force-dynamic";

import React, { useEffect, useState, useCallback } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  ShieldAlert,
  Users,
  BookOpen,
  MessageSquare,
  HelpCircle,
  Loader2,
  Ban,
  Trash2,
  Download,
  Search,
  Send,
  Wallet,
  RefreshCw,
  BarChart3,
  Settings as SettingsIcon,
  FileText,
  Database,
  CheckCircle2,
  AlertTriangle,
  Activity,
  Sparkles,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { redirect, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

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
  const [activeTab, setActiveTab] = useState<
    "analytics" | "users" | "moderation" | "settings" | "audit" | "export"
  >("analytics");
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
  const [isBackfillingWallets, setIsBackfillingWallets] = useState(false);

  const [, setIsLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  const handleBackfillWallets = async () => {
    setIsBackfillingWallets(true);
    try {
      const res = await fetch("/api/admin/backfill-wallets", {
        method: "POST",
      });
      if (res.ok) {
        const data = await res.json();
        toast.success(
          `Backfill complete! Processed ${data.processedUsers} users, backfilled ${data.backfilledWallets} wallets.`
        );
      } else {
        const err = await res.json();
        toast.error(err.error || "Backfill migration failed.");
      }
    } catch (e) {
      console.error(e);
      toast.error("Failed to execute wallet backfill.");
    } finally {
      setIsBackfillingWallets(false);
    }
  };

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
    if (
      !confirm(
        "Permanently delete user? Dependent folders, notes, and chats will be deleted recursively."
      )
    )
      return;
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

  const handleModerationResolve = async (
    targetId: string,
    targetType: "note" | "comment",
    action: "approve" | "delete"
  ) => {
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

  const navTabs: Array<{
    id: "analytics" | "users" | "moderation" | "settings" | "audit" | "export";
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number;
  }> = [
    { id: "analytics", label: "Telemetry & Growth", icon: BarChart3 },
    { id: "users", label: "Scholars & Messages", icon: Users },
    { id: "moderation", label: "Content Queue", icon: ShieldAlert, badge: flaggedNotes.length },
    { id: "settings", label: "System Control", icon: SettingsIcon },
    { id: "audit", label: "Audit Logs", icon: FileText },
    { id: "export", label: "Database Export", icon: Database },
  ];

  return (
    <div className="flex-1 flex flex-col h-full bg-[#040406] text-zinc-100 overflow-y-auto antialiased relative selection:bg-rose-500/30 selection:text-rose-200">
      {/* Background Ambient Mesh Glow Orbs */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 right-1/4 w-[600px] h-[400px] bg-rose-500/10 rounded-full blur-[150px]" />
        <div className="absolute bottom-1/3 left-1/4 w-[500px] h-[350px] bg-cyan-500/5 rounded-full blur-[140px]" />
      </div>

      {/* Header Banner - Double-Bezel Architecture */}
      <motion.div
        initial={{ opacity: 0, y: -15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="rounded-[2.5rem] bg-zinc-950/80 border border-white/10 ring-1 ring-white/5 shadow-2xl backdrop-blur-2xl p-2.5 relative z-10 m-6 sm:m-10 mb-0"
      >
        <div className="rounded-[calc(2.5rem-0.5rem)] bg-[#08080c] border border-white/5 p-6 sm:p-8">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="size-14 rounded-2xl bg-rose-500/10 flex items-center justify-center border border-rose-500/20 text-rose-400 shadow-inner">
                <ShieldAlert className="size-7" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-3 font-heading">
                    Admin Command
                  </h1>
                  <span className="text-[10px] font-mono font-bold bg-rose-500/20 text-rose-300 px-3 py-1 rounded-full border border-rose-500/30 uppercase tracking-[0.2em] shadow-sm flex items-center gap-1.5">
                    <Activity className="size-3 text-rose-400 animate-pulse" /> LIVE TELEMETRY
                  </span>
                </div>
                <p className="text-zinc-400 text-xs sm:text-sm font-light max-w-2xl">
                  Central authority for platform telemetry, scholar roles, automated wallet migration, and audit records.
                </p>
              </div>
            </div>

            <Button
              onClick={handleBackfillWallets}
              disabled={isBackfillingWallets}
              className="rounded-2xl bg-gradient-to-r from-amber-500 via-rose-500 to-amber-500 hover:from-amber-600 hover:to-rose-600 text-zinc-950 font-black text-xs h-12 px-6 flex items-center gap-2.5 shadow-[0_0_25px_rgba(245,158,11,0.2)] transition-all active:scale-[0.98] shrink-0 border border-amber-400/30"
            >
              {isBackfillingWallets ? (
                <>
                  <Loader2 className="size-4 animate-spin text-zinc-950" />
                  <span className="font-mono uppercase tracking-wider">Backfilling Wallets...</span>
                </>
              ) : (
                <>
                  <Wallet className="size-4 text-zinc-950" />
                  <span className="font-mono uppercase tracking-wider">Backfill All User Wallets</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Main Content Area */}
      <div className="p-6 sm:p-10 max-w-6xl w-full mx-auto space-y-8 relative z-10">
        {/* Navigation Sub-Tabs with Animated Layout Indicator */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none select-none border-b border-white/5 px-1">
          {navTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`relative text-xs font-mono font-bold px-4 py-2.5 rounded-full uppercase tracking-wider transition-colors whitespace-nowrap flex items-center gap-2 ${
                  isActive ? "text-white" : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                {isActive && (
                  <motion.span
                    layoutId="activeAdminTab"
                    className="absolute inset-0 bg-white/10 border border-white/20 rounded-full shadow-sm"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <Icon className={`size-3.5 relative z-10 ${isActive ? "text-rose-400" : "text-zinc-500"}`} />
                <span className="relative z-10">{tab.label}</span>
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span className="relative z-10 px-2 py-0.5 text-[9px] rounded-full bg-rose-500 text-white font-bold font-mono">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Tab Content with AnimatePresence Smooth Fade */}
        <AnimatePresence mode="wait">
          {/* Tab 1: Analytics & Telemetry */}
          {activeTab === "analytics" && (
            <motion.div
              key="analytics"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
              className="space-y-6"
            >
              <div className="flex justify-between items-center select-none">
                <span className="text-[11px] font-mono uppercase tracking-widest text-zinc-500 flex items-center gap-1.5">
                  <Sparkles className="size-3 text-rose-400" /> Real-time System Metrics
                </span>

                <div className="flex items-center gap-1.5 bg-zinc-950 p-1 rounded-full border border-white/10">
                  {(["daily", "monthly", "yearly"] as const).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => setInterval(mode)}
                      className={`text-[10px] font-mono font-bold px-3 py-1.5 rounded-full uppercase tracking-wider transition-all ${
                        interval === mode
                          ? "bg-white text-zinc-950 shadow-sm"
                          : "text-zinc-500 hover:text-white"
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>

              {/* Totals Metric Doppelrand Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-5">
                {[
                  { label: "Total Scholars", val: stats?.totals?.users || 0, icon: Users, color: "text-cyan-400", border: "border-cyan-500/20" },
                  { label: "Published Notes", val: stats?.totals?.notes || 0, icon: BookOpen, color: "text-violet-400", border: "border-violet-500/20" },
                  { label: "Forum Discussions", val: stats?.totals?.forums || 0, icon: MessageSquare, color: "text-amber-400", border: "border-amber-500/20" },
                  { label: "Doubt Tickets", val: stats?.totals?.doubts || 0, icon: HelpCircle, color: "text-rose-400", border: "border-rose-500/20" },
                ].map((card, idx) => (
                  <motion.div
                    key={idx}
                    whileHover={{ y: -3 }}
                    transition={{ duration: 0.15 }}
                    className="rounded-[2rem] bg-zinc-950/80 border border-white/10 p-2 shadow-xl backdrop-blur-xl"
                  >
                    <div className="rounded-[calc(2rem-0.5rem)] bg-[#08080c] border border-white/5 p-6 space-y-2 text-center">
                      <div className={`size-10 rounded-2xl bg-white/5 ${card.border} border flex items-center justify-center mx-auto mb-2`}>
                        <card.icon className={`size-5 ${card.color}`} />
                      </div>
                      <p className="text-3xl font-black text-white font-mono tracking-tight tabular-nums">
                        {card.val.toLocaleString()}
                      </p>
                      <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">{card.label}</p>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Charts Panel */}
              <div className="rounded-[2.5rem] bg-zinc-950/80 border border-white/10 ring-1 ring-white/5 p-2.5 shadow-2xl backdrop-blur-3xl">
                <div className="rounded-[calc(2.5rem-0.75rem)] bg-[#08080c] border border-white/5 p-8 space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-mono font-bold text-white uppercase tracking-[0.2em] flex items-center gap-2">
                      <BarChart3 className="size-4 text-cyan-400" /> Platform Growth Telemetry ({interval})
                    </h3>
                  </div>

                  {stats?.chartData && isMounted ? (
                    <div className="h-80 w-full pt-4">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={stats.chartData}>
                          <defs>
                            <linearGradient id="gradUsers" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.3} />
                              <stop offset="95%" stopColor="#22d3ee" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="gradNotes" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#a78bfa" stopOpacity={0.3} />
                              <stop offset="95%" stopColor="#a78bfa" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="gradForums" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#fbbf24" stopOpacity={0.3} />
                              <stop offset="95%" stopColor="#fbbf24" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1f1f23" />
                          <XAxis dataKey="label" stroke="#71717a" fontSize={10} fontFamily="monospace" />
                          <YAxis stroke="#71717a" fontSize={10} fontFamily="monospace" />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "#09090b",
                              borderColor: "#27272a",
                              borderRadius: "1rem",
                              boxShadow: "0 10px 25px rgba(0,0,0,0.5)",
                              fontSize: "12px",
                              fontFamily: "monospace",
                            }}
                          />
                          <Area type="monotone" dataKey="users" stroke="#22d3ee" strokeWidth={2} fill="url(#gradUsers)" name="Scholars" />
                          <Area type="monotone" dataKey="notes" stroke="#a78bfa" strokeWidth={2} fill="url(#gradNotes)" name="Notes" />
                          <Area type="monotone" dataKey="forums" stroke="#fbbf24" strokeWidth={2} fill="url(#gradForums)" name="Forums" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="py-20 flex flex-col items-center justify-center gap-3">
                      <Loader2 className="size-8 animate-spin text-rose-400" />
                      <span className="text-xs font-mono text-zinc-500">Loading Telemetry Stream...</span>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* Tab 2: User Management & Direct Messaging */}
          {activeTab === "users" && (
            <motion.div
              key="users"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
              className="space-y-6"
            >
              {/* User Search & Role Filter Header */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-zinc-950/80 p-4 rounded-3xl border border-white/10 shadow-lg backdrop-blur-xl">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-zinc-500" />
                  <input
                    type="text"
                    value={userSearchQuery}
                    onChange={(e) => setUserSearchQuery(e.target.value)}
                    placeholder="Search scholar by name or email address..."
                    className="w-full bg-zinc-900/80 border border-white/10 rounded-2xl pl-11 pr-4 py-2.5 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-cyan-500/50 transition-colors font-sans"
                  />
                  {userSearchQuery && (
                    <button
                      onClick={() => setUserSearchQuery("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-zinc-400 hover:text-white px-2 py-1 bg-zinc-800 rounded-md"
                    >
                      Clear
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 select-none">
                  {(["all", "user", "teacher", "admin"] as const).map((r) => (
                    <button
                      key={r}
                      onClick={() => setRoleFilter(r)}
                      className={`text-[10px] font-mono font-bold px-3.5 py-2 rounded-xl uppercase tracking-wider transition-all whitespace-nowrap ${
                        roleFilter === r
                          ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm"
                          : "text-zinc-400 hover:text-white border border-transparent hover:bg-white/5"
                      }`}
                    >
                      {r === "all" ? "All Roles" : r === "user" ? "Students" : r}
                    </button>
                  ))}
                </div>
              </div>

              {/* Users Table */}
              <div className="rounded-[2.5rem] bg-zinc-950/80 border border-white/10 ring-1 ring-white/5 p-2.5 shadow-2xl backdrop-blur-3xl">
                <div className="rounded-[calc(2.5rem-0.75rem)] bg-[#08080c] border border-white/5 overflow-hidden">
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
                        <div className="p-16 text-center space-y-3">
                          <Users className="size-10 text-zinc-600 mx-auto" />
                          <p className="text-xs text-zinc-400 font-mono">
                            {userSearchQuery || roleFilter !== "all"
                              ? `No scholars found matching "${userSearchQuery}" ${
                                  roleFilter !== "all" ? `with role "${roleFilter}"` : ""
                                }`
                              : "No registered scholars found."}
                          </p>
                        </div>
                      );
                    }

                    return (
                      <div className="overflow-x-auto">
                        <div className="px-6 py-3 border-b border-white/5 flex items-center justify-between text-[11px] font-mono text-zinc-400 bg-zinc-950/60">
                          <span>
                            Showing <strong className="text-white">{filteredUsers.length}</strong> of {users.length} Scholars
                          </span>
                          <span className="text-zinc-500">Instant Direct Messaging active</span>
                        </div>
                        <table className="w-full text-left text-xs whitespace-nowrap">
                          <thead className="bg-zinc-950/90 text-zinc-400 font-mono text-[10px] uppercase tracking-[0.2em] border-b border-white/5">
                            <tr>
                              <th className="px-6 py-4 font-bold">Scholar</th>
                              <th className="px-6 py-4 font-bold">Role</th>
                              <th className="px-6 py-4 font-bold">Points</th>
                              <th className="px-6 py-4 font-bold">Status</th>
                              <th className="px-6 py-4 font-bold text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/5">
                            {filteredUsers.map((u) => (
                              <tr key={u._id} className="hover:bg-white/[0.03] transition-colors">
                                <td className="px-6 py-4 font-bold text-white">
                                  <div className="flex items-center gap-3">
                                    <div className="size-8 rounded-full bg-zinc-800 border border-white/10 flex items-center justify-center text-xs font-mono font-bold text-rose-400 uppercase">
                                      {(u.name || u.email || "U").charAt(0)}
                                    </div>
                                    <div>
                                      <p className="truncate max-w-[180px] text-white font-medium">{u.name || "Scholar"}</p>
                                      <p className="text-[10px] font-mono text-zinc-500 font-normal">{u.email}</p>
                                    </div>
                                  </div>
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
                                    <option value="user" className="bg-zinc-950 text-cyan-400 font-mono">
                                      User (Student)
                                    </option>
                                    <option value="teacher" className="bg-zinc-950 text-amber-400 font-mono">
                                      Teacher (Instructor)
                                    </option>
                                    <option value="admin" className="bg-zinc-950 text-rose-400 font-mono">
                                      Admin
                                    </option>
                                  </select>
                                </td>
                                <td className="px-6 py-4 font-mono font-bold text-amber-400 tabular-nums">
                                  {u.points} pts
                                </td>
                                <td className="px-6 py-4">
                                  {u.isSuspended ? (
                                    <span className="px-3 py-1 rounded-full text-[10px] font-mono font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20 uppercase tracking-wider">
                                      Suspended
                                    </span>
                                  ) : (
                                    <span className="px-3 py-1 rounded-full text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase tracking-wider flex items-center gap-1.5 w-fit">
                                      <CheckCircle2 className="size-3" /> Active
                                    </span>
                                  )}
                                </td>
                                <td className="px-6 py-4 text-right space-x-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => router.push(`/messages?userId=${u._id}`)}
                                    className="bg-cyan-500/10 border-cyan-500/30 hover:bg-cyan-500/20 text-cyan-300 text-xs font-bold font-mono rounded-xl h-8"
                                    title={`Direct Message ${u.name}`}
                                  >
                                    <Send className="size-3.5 mr-1 text-cyan-400" /> Message
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                      handleUserModify(u._id, u.isSuspended ? "unsuspend" : "suspend")
                                    }
                                    className="bg-zinc-900 border-white/10 hover:bg-zinc-800 text-xs text-zinc-300 rounded-xl h-8"
                                  >
                                    <Ban className="size-3.5 mr-1" /> {u.isSuspended ? "Unsuspend" : "Suspend"}
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleUserDelete(u._id)}
                                    className="bg-zinc-900 border-white/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 text-xs rounded-xl h-8 px-2.5"
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
            </motion.div>
          )}

          {/* Tab 3: Content Moderation Queue */}
          {activeTab === "moderation" && (
            <motion.div
              key="moderation"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
              className="space-y-6"
            >
              <div className="rounded-[2.5rem] bg-zinc-950/80 border border-white/10 ring-1 ring-white/5 p-2.5 shadow-2xl backdrop-blur-3xl">
                <div className="rounded-[calc(2.5rem-0.75rem)] bg-[#08080c] border border-white/5 p-8 space-y-6">
                  <h3 className="text-xs font-mono font-bold text-white uppercase tracking-[0.2em] flex items-center gap-2">
                    <AlertTriangle className="size-4 text-amber-400" /> Flagged Content Queue ({flaggedNotes.length})
                  </h3>
                  {flaggedNotes.length === 0 ? (
                    <div className="py-12 text-center space-y-2">
                      <CheckCircle2 className="size-10 text-emerald-500/50 mx-auto" />
                      <p className="text-xs text-zinc-400 font-mono">No flagged content currently requiring moderation review.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {flaggedNotes.map((item) => (
                        <div
                          key={item._id}
                          className="p-5 bg-zinc-950 rounded-2xl border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                        >
                          <div className="space-y-1">
                            <p className="text-sm font-bold text-white">{item.title || "Untitled Note"}</p>
                            <p className="text-[11px] font-mono text-zinc-500">Submitted by: {item.userName}</p>
                          </div>
                          <div className="flex gap-2 shrink-0">
                            <Button
                              size="sm"
                              onClick={() => handleModerationResolve(item._id, "note", "approve")}
                              className="rounded-full bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-bold px-5 h-9"
                            >
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleModerationResolve(item._id, "note", "delete")}
                              className="rounded-full bg-rose-500 hover:bg-rose-400 text-white text-xs font-bold px-5 h-9"
                            >
                              Delete
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* Tab 4: System Settings */}
          {activeTab === "settings" && (
            <motion.div
              key="settings"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
              className="space-y-6"
            >
              <div className="rounded-[2.5rem] bg-zinc-950/80 border border-white/10 ring-1 ring-white/5 p-2.5 shadow-2xl backdrop-blur-3xl">
                <div className="rounded-[calc(2.5rem-0.75rem)] bg-[#08080c] border border-white/5 p-8 space-y-6">
                  <h3 className="text-xs font-mono font-bold text-white uppercase tracking-[0.2em] flex items-center gap-2">
                    <SettingsIcon className="size-4 text-rose-400" /> Platform Operations Toggles
                  </h3>

                  {[
                    { key: "maintenanceMode", label: "Maintenance Mode", desc: "Restrict scholar traffic to read-only mode across platform." },
                    { key: "enableComments", label: "Public Comments", desc: "Allow discussion threads on shared notes and blogs." },
                    { key: "enableRegistrations", label: "Scholar Registrations", desc: "Allow new student and instructor account signups." },
                  ].map((setting) => (
                    <div key={setting.key} className="flex items-center justify-between border-b border-white/5 pb-5">
                      <div className="space-y-0.5">
                        <p className="text-xs font-bold text-white">{setting.label}</p>
                        <p className="text-[11px] font-mono text-zinc-500">{setting.desc}</p>
                      </div>
                      <button
                        onClick={() => handleToggleSiteSetting(setting.key)}
                        className={`h-7 w-12 rounded-full transition-all relative p-1 ${
                          siteSettings[setting.key] ? "bg-emerald-500" : "bg-zinc-800"
                        }`}
                      >
                        <motion.div
                          layout
                          transition={{ type: "spring", stiffness: 500, damping: 30 }}
                          className={`size-5 bg-zinc-950 rounded-full shadow-md ${
                            siteSettings[setting.key] ? "ml-auto" : "mr-auto"
                          }`}
                        />
                      </button>
                    </div>
                  ))}

                  <div className="pt-4 border-t border-white/10">
                    <div className="p-6 rounded-2xl bg-zinc-950 border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Wallet className="size-4 text-amber-400" />
                          <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                            Backfill User Wallets &amp; Referral Codes
                          </h4>
                        </div>
                        <p className="text-[11px] font-mono text-zinc-400 max-w-xl">
                          Scan database and automatically generate wallet addresses &amp; referral codes for legacy users missing them.
                        </p>
                      </div>
                      <Button
                        onClick={handleBackfillWallets}
                        disabled={isBackfillingWallets}
                        className="rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs h-11 px-5 flex items-center gap-2 transition-all active:scale-[0.98] shrink-0 shadow-lg"
                      >
                        {isBackfillingWallets ? (
                          <>
                            <Loader2 className="size-4 animate-spin text-zinc-950" />
                            <span>Processing...</span>
                          </>
                        ) : (
                          <>
                            <RefreshCw className="size-3.5 text-zinc-950" />
                            <span>Run Migration Backfill</span>
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Tab 5: Audit Log Records */}
          {activeTab === "audit" && (
            <motion.div
              key="audit"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
              className="space-y-6"
            >
              <div className="rounded-[2.5rem] bg-zinc-950/80 border border-white/10 ring-1 ring-white/5 p-2.5 shadow-2xl backdrop-blur-3xl">
                <div className="rounded-[calc(2.5rem-0.75rem)] bg-[#08080c] border border-white/5 p-8 space-y-4">
                  <h3 className="text-xs font-mono font-bold text-white uppercase tracking-[0.2em] flex items-center gap-2">
                    <FileText className="size-4 text-cyan-400" /> System Audit Log History
                  </h3>
                  {auditLogs.length === 0 ? (
                    <p className="text-xs text-zinc-500 font-mono py-8 text-center">No system audit logs recorded yet.</p>
                  ) : (
                    <div className="space-y-3">
                      {auditLogs.map((log) => (
                        <div
                          key={log._id}
                          className="p-4 bg-zinc-950 rounded-2xl border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                        >
                          <div className="space-y-0.5">
                            <p className="font-bold text-white font-mono">{log.action}</p>
                            <p className="text-[11px] font-mono text-zinc-400">{log.details}</p>
                          </div>
                          <span className="text-[10px] font-mono text-zinc-500 shrink-0">
                            {new Date(log.createdAt).toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* Tab 6: Database Export */}
          {activeTab === "export" && (
            <motion.div
              key="export"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
              className="rounded-[2.5rem] bg-zinc-950/80 border border-white/10 ring-1 ring-white/5 p-2.5 shadow-2xl backdrop-blur-3xl max-w-md mx-auto text-center"
            >
              <div className="rounded-[calc(2.5rem-0.75rem)] bg-[#08080c] border border-white/5 p-8 space-y-6">
                <div className="size-16 rounded-3xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mx-auto text-cyan-400">
                  <Download className="size-8" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-xl font-black text-white font-heading">Database Backup &amp; Export</h3>
                  <p className="text-xs text-zinc-400 font-light">
                    Export complete system database state in structured CSV or raw JSON format.
                  </p>
                </div>
                <div className="flex gap-3 justify-center pt-2">
                  <Button
                    onClick={() => handleExportData("csv")}
                    className="rounded-full bg-white hover:bg-zinc-100 text-zinc-950 font-bold text-xs h-11 px-6 shadow-md transition-transform active:scale-[0.98]"
                  >
                    Export CSV
                  </Button>
                  <Button
                    onClick={() => handleExportData("json")}
                    className="rounded-full bg-zinc-900 hover:bg-zinc-800 text-white border border-white/10 font-bold text-xs h-11 px-6 shadow-md transition-transform active:scale-[0.98]"
                  >
                    Export JSON
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
