"use client";

export const dynamic = "force-dynamic";

import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Legend,
} from "recharts";
import {
  ShieldAlert,
  Users,
  BookOpen,
  MessageSquare,
  HelpCircle,
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
  Activity,
  Tag,
  GraduationCap,
  Terminal,
  Cpu,
  Zap,
  Volume2,
  Flame,
  Layers,
  PieChart as PieIcon,
  TrendingUp,
  Radio,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Filter,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface ChartItem {
  label: string;
  users: number;
  notes: number;
  forums: number;
  doubts: number;
  blogs?: number;
}

interface CategoryItem {
  category: string;
  count: number;
}

interface RoleItem {
  name: string;
  value: number;
}

interface EcosystemItem {
  name: string;
  value: number;
  color: string;
}

interface TelemetryMetrics {
  dbLatencyMs: number;
  heapUsedMB: number;
  heapTotalMB: number;
  rssMB: number;
  uptimeSeconds: number;
  nodeVersion: string;
  serverTime: string;
}

interface ThroughputPoint {
  hour: string;
  requests: number;
  latency: number;
  dbQueries: number;
}

interface FeatureUsageItem {
  feature: string;
  activeUsers: number;
  queries: number;
}

interface PeakHourItem {
  timeSlot: string;
  scholars: number;
}

interface StatsData {
  chartData: ChartItem[];
  totals: {
    users: number;
    notes: number;
    forums: number;
    doubts: number;
    blogs?: number;
    courses?: number;
    researchPapers?: number;
    pendingWithdrawals?: number;
    pendingTeacherApps?: number;
    totalCoinsInCirculation?: number;
  };
  categoryBreakdown?: CategoryItem[];
  roleDistribution?: RoleItem[];
  ecosystemDistribution?: EcosystemItem[];
  featureUsageBreakdown?: FeatureUsageItem[];
  peakStudyHours?: PeakHourItem[];
  telemetry?: TelemetryMetrics;
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

interface ThreatFlagRecord {
  _id: string;
  targetId: string;
  targetType: "note" | "blog" | "forum" | "comment" | "doubt" | "community_post" | "chat" | "direct_message";
  authorName?: string;
  reason: string;
  flaggedText?: string;
  toxicityScore: number;
  status: "pending" | "approved" | "purged" | "dismissed";
  createdAt: string;
}

interface SystemLogRecord {
  _id: string;
  level: "info" | "warn" | "error" | "security" | "telemetry";
  source: string;
  message: string;
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
  const [activeTab, setActiveTab] = useState<
    | "analytics"
    | "users"
    | "teacher_applications"
    | "withdrawals"
    | "coupons"
    | "moderation"
    | "settings"
    | "audit"
    | "export"
    | "newsletter"
    | "c2logs"
  >("analytics");

  const [interval, setInterval] = useState<"daily" | "monthly" | "yearly">("daily");
  const [stats, setStats] = useState<StatsData | null>(null);
  const [users, setUsers] = useState<UserRecord[]>([]);

  // Real Telemetry & CC Logs State
  const [throughputData, setThroughputData] = useState<ThroughputPoint[]>([]);
  const [telemetryMetrics, setTelemetryMetrics] = useState<TelemetryMetrics | null>(null);
  const [systemLogs, setSystemLogs] = useState<SystemLogRecord[]>([]);
  const [logFilterLevel, setLogFilterLevel] = useState<string>("all");
  const [isLogsLoading, setIsLogsLoading] = useState<boolean>(false);

  // Threat Engine & Moderation State
  const [threatFlags, setThreatFlags] = useState<ThreatFlagRecord[]>([]);
  const [isThreatLoading, setIsThreatLoading] = useState<boolean>(false);

  // JARVIS Command Line State
  const [commandInput, setCommandInput] = useState("");
  const [commandLogs, setCommandLogs] = useState<string[]>([
    "JARVIS KERNEL v4.8 [ONLINE]",
    "REAL-TIME C2 LOGS ENGINE READY",
    "CYBER THREAT ENGINE ACTIVE",
    "TYPE /help FOR AVAILABLE COMMANDS",
  ]);
  const [isVoiceSpeaking, setIsVoiceSpeaking] = useState(false);
  const commandLogEndRef = useRef<HTMLDivElement | null>(null);

  // Withdrawal Requests state
  const [withdrawalRequests, setWithdrawalRequests] = useState<Array<{
    id: string;
    userId: string;
    userName: string;
    userEmail: string;
    userRole: string;
    amount: number;
    amountINR: number;
    payoutMethod: "upi" | "bank_transfer";
    status: "pending" | "approved" | "completed" | "rejected";
    createdAt: string;
  }>>([]);
  const [pendingWithdrawalsCount, setPendingWithdrawalsCount] = useState(0);
  const [isWithdrawalsLoading, setIsWithdrawalsLoading] = useState(false);
  const [withdrawalActionModal, setWithdrawalActionModal] = useState<{
    id: string;
    action: "approve" | "complete" | "reject";
    userName: string;
    amount: number;
    payoutMethod: string;
  } | null>(null);
  const [withdrawalTxRef, setWithdrawalTxRef] = useState("");
  const [withdrawalNote, setWithdrawalNote] = useState("");
  const [isProcessingWithdrawalAction, setIsProcessingWithdrawalAction] = useState(false);

  // Teacher Applications state
  const [teacherApplications, setTeacherApplications] = useState<Array<{
    _id: string;
    userName: string;
    userEmail: string;
    qualification: string;
    subjectExpertise: string;
    experienceYears: number;
    bio: string;
    status: "pending" | "approved" | "rejected";
    createdAt: string;
  }>>([]);
  const [pendingTeacherAppsCount, setPendingTeacherAppsCount] = useState(0);
  const [isTeacherAppsLoading, setIsTeacherAppsLoading] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "user" | "teacher" | "admin">("all");
  const [siteSettings, setSiteSettings] = useState<Record<string, boolean>>({
    maintenanceMode: false,
    enableComments: true,
    enableRegistrations: true,
  });
  const [auditLogs, setAuditLogs] = useState<AuditLogRecord[]>([]);
  const [isBackfillingWallets, setIsBackfillingWallets] = useState(false);

  // Admin Coupons state
  const [coupons, setCoupons] = useState<Array<{
    _id: string;
    code: string;
    description: string;
    discountType: "percentage" | "fixed";
    discountValue: number;
    maxUses: number;
    usedCount: number;
    isActive: boolean;
  }>>([]);
  const [isCouponsLoading, setIsCouponsLoading] = useState(false);
  const [couponStats, setCouponStats] = useState({ totalCount: 0, activeCount: 0, totalRedemptions: 0 });

  const [newCoupon, setNewCoupon] = useState({
    code: "",
    description: "",
    discountType: "percentage" as "percentage" | "fixed",
    discountValue: 50,
    minPurchaseAmount: 0,
    maxUses: 1000,
    validUntil: "2026-12-31",
    applicableFor: "all",
    isActive: true,
  });
  const [isSubmittingCoupon, setIsSubmittingCoupon] = useState(false);

  // Newsletter Subscribers state
  const [newsletterSubscribers, setNewsletterSubscribers] = useState<Array<{
    _id: string;
    email: string;
    source: string;
    createdAt: string;
  }>>([]);

  const [, setIsLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  // JARVIS Voice Synthesizer
  const speakJarvisMessage = (text: string) => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.05;
        utterance.pitch = 0.95;
        setIsVoiceSpeaking(true);
        utterance.onend = () => setIsVoiceSpeaking(false);
        utterance.onerror = () => setIsVoiceSpeaking(false);
        window.speechSynthesis.speak(utterance);
      } catch {
        setIsVoiceSpeaking(false);
      }
    }
  };

  const handleCommandSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cmd = commandInput.trim();
    if (!cmd) return;

    const newLogs = [...commandLogs, `> ${cmd}`];
    setCommandInput("");

    const lower = cmd.toLowerCase();
    if (lower === "/help") {
      newLogs.push(
        "AVAILABLE COMMANDS:",
        "  /telemetry - Refresh system metrics & 24h throughput",
        "  /c2        - Switch to C2 Log Command Deck",
        "  /threats   - Switch to Threat Engine Moderation Queue",
        "  /users     - Switch to Scholar Database Matrix",
        "  /withdraw  - Switch to Coin Vault & Payout Desk",
        "  /speak     - Speak JARVIS telemetry status",
        "  /clear     - Clear terminal logs"
      );
    } else if (lower === "/telemetry") {
      loadRealTelemetry();
      newLogs.push(`SYSTEM RESPONSE: DB Latency: ${telemetryMetrics?.dbLatencyMs || 12}ms | Heap: ${telemetryMetrics?.heapUsedMB || 45}MB`);
    } else if (lower === "/c2") {
      setActiveTab("c2logs");
      newLogs.push("ROUTING TO COMMAND & CONTROL LOG DECK...");
    } else if (lower === "/threats") {
      setActiveTab("moderation");
      newLogs.push("ROUTING TO CYBER THREAT MODERATION ENGINE...");
    } else if (lower === "/users") {
      setActiveTab("users");
      newLogs.push("ROUTING TO SCHOLAR MATRIX...");
    } else if (lower === "/withdraw") {
      setActiveTab("withdrawals");
      newLogs.push("ROUTING TO PAYOUT DESK...");
    } else if (lower === "/speak") {
      const msg = `Jarvis Command Center Online. ${stats?.totals?.users || 0} registered scholars. System status nominal.`;
      speakJarvisMessage(msg);
      newLogs.push(`JARVIS: "${msg}"`);
    } else if (lower === "/clear") {
      setCommandLogs(["JARVIS KERNEL v4.8 [ONLINE]"]);
      return;
    } else {
      newLogs.push(`UNRECOGNIZED PROTOCOL '${cmd}'. Type /help for available options.`);
    }

    setCommandLogs(newLogs);
    setTimeout(() => {
      commandLogEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  // Real Telemetry API Fetch
  const loadRealTelemetry = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/telemetry");
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setThroughputData(data.throughput || []);
          setTelemetryMetrics(data.metrics || null);
        }
      }
    } catch (e) {
      console.error("Failed to load telemetry", e);
    }
  }, []);

  // Real System C2 Logs API Fetch
  const loadRealLogs = useCallback(async () => {
    setIsLogsLoading(true);
    try {
      const res = await fetch(`/api/admin/logs?level=${logFilterLevel}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setSystemLogs(data.logs || []);
        }
      }
    } catch (e) {
      console.error("Failed to load system logs", e);
    } finally {
      setIsLogsLoading(false);
    }
  }, [logFilterLevel]);

  // Real Threat Flags API Fetch
  const loadModerationQueue = useCallback(async () => {
    setIsThreatLoading(true);
    try {
      const res = await fetch("/api/admin/moderation");
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setThreatFlags(data.flags || []);
        }
      }
    } catch (e) {
      console.error("Failed to load threat flags", e);
    } finally {
      setIsThreatLoading(false);
    }
  }, []);

  // Execute Real Content Purge or Dismissal
  const handleResolveThreatFlag = async (
    flagId: string,
    targetId: string,
    targetType: string,
    action: "purge" | "dismiss"
  ) => {
    try {
      const res = await fetch("/api/admin/moderation", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ flagId, targetId, targetType, action }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Action failed.");

      toast.success(data.message);
      loadModerationQueue();
      loadAuditLogsList();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to resolve threat item.";
      toast.error(msg);
    }
  };

  const loadCoupons = useCallback(async () => {
    setIsCouponsLoading(true);
    try {
      const res = await fetch("/api/admin/coupons");
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setCoupons(data.coupons || []);
          if (data.stats) setCouponStats(data.stats);
        }
      }
    } catch (e) {
      console.error("Failed to load coupons", e);
    } finally {
      setIsCouponsLoading(false);
    }
  }, []);

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCoupon.code.trim()) {
      toast.error("Please enter a valid coupon code.");
      return;
    }
    setIsSubmittingCoupon(true);
    try {
      const res = await fetch("/api/admin/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newCoupon),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(`Coupon '${data.coupon.code}' created successfully!`);
        setNewCoupon({
          code: "",
          description: "",
          discountType: "percentage",
          discountValue: 50,
          minPurchaseAmount: 0,
          maxUses: 1000,
          validUntil: "2026-12-31",
          applicableFor: "all",
          isActive: true,
        });
        loadCoupons();
      } else {
        toast.error(data.error || "Failed to create coupon.");
      }
    } catch {
      toast.error("Error creating coupon code.");
    } finally {
      setIsSubmittingCoupon(false);
    }
  };

  const handleToggleCouponStatus = async (couponId: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/admin/coupons/${couponId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !currentStatus }),
      });
      if (res.ok) {
        toast.success(`Coupon status updated.`);
        loadCoupons();
      } else {
        toast.error("Failed to update status.");
      }
    } catch {
      toast.error("Error toggling coupon status.");
    }
  };

  const handleDeleteCoupon = async (couponId: string, code: string) => {
    if (!confirm(`Are you sure you want to permanently delete coupon '${code}'?`)) return;
    try {
      const res = await fetch(`/api/admin/coupons/${couponId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success(`Coupon '${code}' deleted.`);
        loadCoupons();
      } else {
        toast.error("Failed to delete coupon.");
      }
    } catch {
      toast.error("Error deleting coupon.");
    }
  };

  const handleBackfillWallets = async () => {
    setIsBackfillingWallets(true);
    try {
      const res = await fetch("/api/admin/backfill-wallets", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        toast.success(`Backfill complete! Processed ${data.processedUsers} users.`);
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

  const loadTeacherApplications = useCallback(async () => {
    try {
      setIsTeacherAppsLoading(true);
      const res = await fetch("/api/admin/teacher-applications");
      if (res.ok) {
        const data = await res.json();
        setTeacherApplications(data.applications || []);
        setPendingTeacherAppsCount(data.pendingCount || 0);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsTeacherAppsLoading(false);
    }
  }, []);

  const handleTeacherApplicationAction = async (appId: string, action: "approve" | "reject") => {
    try {
      const res = await fetch(`/api/admin/teacher-applications/${appId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Action failed.");
      toast.success(data.message);
      loadTeacherApplications();
      loadUsersList();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update teacher application.";
      toast.error(message);
    }
  };

  const loadWithdrawals = useCallback(async () => {
    try {
      setIsWithdrawalsLoading(true);
      const res = await fetch("/api/admin/withdrawals");
      if (res.ok) {
        const data = await res.json();
        setWithdrawalRequests(data.requests || []);
        setPendingWithdrawalsCount(data.pendingCount || 0);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsWithdrawalsLoading(false);
    }
  }, []);

  const handleProcessWithdrawal = async () => {
    if (!withdrawalActionModal) return;
    try {
      setIsProcessingWithdrawalAction(true);
      const res = await fetch(`/api/admin/withdrawals/${withdrawalActionModal.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: withdrawalActionModal.action,
          transactionRef: withdrawalTxRef,
          adminNote: withdrawalNote,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Action failed.");

      toast.success(data.message || "Withdrawal request updated successfully.");
      setWithdrawalActionModal(null);
      setWithdrawalTxRef("");
      setWithdrawalNote("");
      loadWithdrawals();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to process withdrawal action.";
      toast.error(message);
    } finally {
      setIsProcessingWithdrawalAction(false);
    }
  };

  const fetchTabDetails = useCallback(async () => {
    setIsLoading(true);
    if (activeTab === "analytics") {
      await loadAnalytics();
      await loadRealTelemetry();
    } else if (activeTab === "users") await loadUsersList();
    else if (activeTab === "teacher_applications") await loadTeacherApplications();
    else if (activeTab === "withdrawals") await loadWithdrawals();
    else if (activeTab === "coupons") await loadCoupons();
    else if (activeTab === "moderation") await loadModerationQueue();
    else if (activeTab === "c2logs") await loadRealLogs();
    else if (activeTab === "settings") await loadSiteSettings();
    else if (activeTab === "audit") await loadAuditLogsList();
    setIsLoading(false);
  }, [
    activeTab,
    loadAnalytics,
    loadRealTelemetry,
    loadUsersList,
    loadTeacherApplications,
    loadWithdrawals,
    loadCoupons,
    loadModerationQueue,
    loadRealLogs,
    loadSiteSettings,
    loadAuditLogsList,
  ]);

  useEffect(() => {
    if (session?.user?.role === "admin" && isMounted) {
      fetchTabDetails();
      loadTeacherApplications();
      loadWithdrawals();
      loadRealTelemetry();
      loadModerationQueue();
    }
  }, [activeTab, interval, session, isMounted, fetchTabDetails, loadTeacherApplications, loadWithdrawals, loadRealTelemetry, loadModerationQueue]);

  const handleUserModify = async (targetUserId: string, isSuspended: boolean, action: string, role?: string) => {
    try {
      const act = action === "toggle_suspend" ? (isSuspended ? "unsuspend" : "suspend") : action;
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId, action: act, role }),
      });
      if (res.ok) {
        toast.success("User account updated successfully.");
        loadUsersList();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to update user account.");
      }
    } catch (e) {
      console.error(e);
      toast.error("Error updating user account.");
    }
  };

  const handleUserDelete = async (targetUserId: string) => {
    if (!confirm("Permanently delete user? Dependent folders, notes, and chats will be deleted recursively.")) return;
    try {
      const res = await fetch(`/api/admin/users?targetUserId=${targetUserId}`, { method: "DELETE" });
      if (res.ok) loadUsersList();
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
      if (res.ok) setSiteSettings((prev) => ({ ...prev, [key]: nextVal }));
    } catch (e) {
      console.error(e);
    }
  };

  const handleExportData = async (type: string) => {
    try {
      const res = await fetch(`/api/admin/export?type=${type}`);
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `notexia_${type}_export_${Date.now()}.csv`;
        a.click();
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (status === "loading" || !isMounted) {
    return (
      <div className="min-h-screen bg-[#04080B] flex flex-col items-center justify-center p-6 text-[#00F0FF] select-none gap-3 font-mono antialiased">
        <div className="relative flex items-center justify-center">
          <div className="size-16 rounded-full border-2 border-dashed border-[#00F0FF] animate-spin" />
          <Cpu className="size-6 text-[#00F0FF] absolute" />
        </div>
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-[#00F0FF]/80 animate-pulse">
          INITIALIZING JARVIS COMMAND CENTER...
        </p>
      </div>
    );
  }

  if (session?.user?.role !== "admin") return null;

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name?.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
      u.email?.toLowerCase().includes(userSearchQuery.toLowerCase());
    const matchesRole = roleFilter === "all" || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const CATEGORY_COLORS = ["#00F0FF", "#F0C93B", "#F28B6E", "#C9A9E0", "#10B981", "#3B82F6"];
  const ROLE_COLORS = ["#00F0FF", "#F0C93B", "#F28B6E"];

  return (
    <div className="min-h-screen bg-transparent text-[#FAFAF8] font-mono selection:bg-[#F5B429]/30 selection:text-[#FAFAF8] relative overflow-x-hidden antialiased">
      {/* Background Atmosphere */}
      <div className="fixed top-0 right-1/4 w-[600px] h-[400px] bg-[#F5B429]/10 rounded-full blur-[150px] pointer-events-none z-0" />
      <div className="fixed bottom-0 left-1/4 w-[600px] h-[400px] bg-[#F5941D]/8 rounded-full blur-[150px] pointer-events-none z-0" />

      {/* Main HUD Wrapper */}
      <div className="relative z-10 p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto">
        
        {/* ── JARVIS ARC REACTOR HEADER ── */}
        <header className="rounded-2xl bg-[#150F0B]/90 border border-[#2E2118] p-4 sm:p-6 relative backdrop-blur-2xl shadow-[0_0_30px_rgba(245,148,29,0.12)] overflow-hidden">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
            
            {/* ARC Core Title */}
            <div className="flex items-center gap-4">
              <div className="relative size-14 rounded-full border border-[#00F0FF]/50 bg-[#00F0FF]/10 flex items-center justify-center shadow-[0_0_20px_#00F0FF] shrink-0">
                <div className="absolute inset-0 rounded-full border border-dashed border-[#F0C93B]/60 animate-spin" style={{ animationDuration: "12s" }} />
                <Cpu className="size-7 text-[#00F0FF] animate-pulse" />
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="size-2 rounded-full bg-[#10B981] animate-ping" />
                  <span className="text-[10px] font-bold text-[#00F0FF] tracking-[0.25em] uppercase">
                    JARVIS C2 COMMAND CENTER v4.8
                  </span>
                  <span className="px-2 py-0.5 rounded bg-[#00F0FF]/10 border border-[#00F0FF]/30 text-[9px] text-[#00F0FF] font-bold">
                    REAL-TIME TELEMETRY &amp; THREAT ENGINE
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-wider uppercase font-heading flex items-center gap-3">
                  STARK TELEMETRY &amp; GOVERNANCE DECK
                </h1>
              </div>
            </div>

            {/* Diagnostic HUD Chips */}
            <div className="flex flex-wrap items-center gap-3 text-[10px]">
              <div className="px-3 py-1.5 rounded-lg bg-[#0E1A22] border border-[#00F0FF]/25 flex items-center gap-2">
                <Activity className="size-3.5 text-[#00F0FF]" />
                <span className="text-[#94A3B8]">DB LATENCY:</span>
                <span className="text-[#00F0FF] font-bold">{telemetryMetrics?.dbLatencyMs || 12}ms</span>
              </div>
              <div className="px-3 py-1.5 rounded-lg bg-[#0E1A22] border border-[#F0C93B]/25 flex items-center gap-2">
                <Cpu className="size-3.5 text-[#F0C93B]" />
                <span className="text-[#94A3B8]">HEAP MEM:</span>
                <span className="text-[#F0C93B] font-bold">{telemetryMetrics?.heapUsedMB || 48}MB</span>
              </div>
              <div className="px-3 py-1.5 rounded-lg bg-[#0E1A22] border border-[#10B981]/25 flex items-center gap-2">
                <Zap className="size-3.5 text-[#10B981]" />
                <span className="text-[#94A3B8]">UPTIME:</span>
                <span className="text-[#10B981] font-bold">{telemetryMetrics?.uptimeSeconds || 3600}s</span>
              </div>
              <Button
                size="sm"
                onClick={() => {
                  const msg = `Jarvis Telemetry: ${stats?.totals?.users || 0} registered scholars. System uptime ${telemetryMetrics?.uptimeSeconds || 3600} seconds. Threat engine monitoring.`;
                  speakJarvisMessage(msg);
                }}
                className={`h-8 px-3 text-[10px] font-bold gap-1.5 rounded-lg border transition-all ${
                  isVoiceSpeaking
                    ? "bg-[#00F0FF] text-black border-[#00F0FF] shadow-[0_0_15px_#00F0FF]"
                    : "bg-[#0E1A22] text-[#00F0FF] border-[#00F0FF]/30 hover:bg-[#00F0FF]/15"
                }`}
              >
                <Volume2 className="size-3.5" />
                <span>{isVoiceSpeaking ? "SPEAKING..." : "JARVIS VOICE"}</span>
              </Button>
            </div>
          </div>

          {/* JARVIS Interactive Terminal Line */}
          <div className="mt-4 pt-4 border-t border-[#00F0FF]/15 flex flex-col md:flex-row items-stretch md:items-center gap-3">
            <div className="flex-1 bg-[#04080B] border border-[#00F0FF]/30 rounded-lg p-2.5 flex items-center gap-2 text-xs">
              <Terminal className="size-4 text-[#00F0FF] shrink-0" />
              <span className="text-[#00F0FF] font-bold select-none">&gt;</span>
              <form onSubmit={handleCommandSubmit} className="flex-1">
                <input
                  type="text"
                  value={commandInput}
                  onChange={(e) => setCommandInput(e.target.value)}
                  placeholder="Type JARVIS command (e.g. /help, /telemetry, /c2, /threats, /users, /speak, /clear)..."
                  className="w-full bg-transparent text-[#E2E8F0] placeholder-[#64748B] outline-none text-xs"
                />
              </form>
            </div>

            <div className="flex items-center gap-2 text-[10px] overflow-x-auto pb-1 md:pb-0">
              <span className="text-[#64748B] uppercase shrink-0">Quick Actions:</span>
              <button
                onClick={() => {
                  setActiveTab("c2logs");
                  toast.info("Navigated to C2 Real-time System Logs.");
                }}
                className="px-2 py-1 rounded bg-[#0E1A22] border border-[#00F0FF]/25 hover:border-[#00F0FF] text-[#00F0FF] shrink-0"
              >
                /c2-logs
              </button>
              <button
                onClick={() => {
                  setActiveTab("moderation");
                  toast.info("Navigated to Cyber Threat Engine.");
                }}
                className="px-2 py-1 rounded bg-[#0E1A22] border border-rose-500/30 hover:border-rose-500 text-rose-400 shrink-0"
              >
                /threats ({threatFlags.length})
              </button>
            </div>
          </div>

          {/* Live Terminal Log Stream Box */}
          <div className="mt-3 bg-[#04080B]/80 border border-[#00F0FF]/20 rounded-lg p-2.5 max-h-20 overflow-y-auto text-[10px] text-[#94A3B8] space-y-0.5 custom-scroll font-mono">
            {commandLogs.map((log, idx) => (
              <div key={idx} className={log.startsWith(">") ? "text-[#00F0FF] font-bold" : log.startsWith("AVAILABLE") ? "text-[#F0C93B]" : "text-[#94A3B8]"}>
                {log}
              </div>
            ))}
            <div ref={commandLogEndRef} />
          </div>
        </header>

        {/* ── WORKSTATION NAVIGATION TABS ── */}
        <nav className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-[#00F0FF]/20 custom-scroll select-none">
          {[
            { id: "analytics", label: "01. TELEMETRY & 24H THROUGHPUT", icon: BarChart3, badge: null },
            { id: "c2logs", label: "02. REALTIME C2 SYSTEM LOGS", icon: Radio, badge: systemLogs.length ? `${systemLogs.length}` : null, badgeColor: "bg-[#00F0FF] text-black" },
            { id: "moderation", label: "03. CYBER THREAT ENGINE", icon: ShieldAlert, badge: threatFlags.length ? `${threatFlags.length}` : null, badgeColor: "bg-rose-500 text-white" },
            { id: "users", label: "04. SCHOLAR MATRIX", icon: Users, badge: users.length ? `${users.length}` : null },
            { id: "teacher_applications", label: "05. TEACHER VERIFICATION", icon: GraduationCap, badge: pendingTeacherAppsCount > 0 ? `${pendingTeacherAppsCount}` : null, badgeColor: "bg-[#F0C93B] text-black" },
            { id: "withdrawals", label: "06. COIN PAYOUT DESK", icon: Wallet, badge: pendingWithdrawalsCount > 0 ? `${pendingWithdrawalsCount}` : null, badgeColor: "bg-[#F28B6E] text-black" },
            { id: "coupons", label: "07. COUPON MATRIX", icon: Tag, badge: couponStats.activeCount ? `${couponStats.activeCount}` : null },
            { id: "settings", label: "08. GOVERNANCE PROTOCOLS", icon: SettingsIcon, badge: null },
            { id: "audit", label: "09. AUDIT TRAIL", icon: FileText, badge: null },
            { id: "export", label: "10. DATA VAULT EXPORT", icon: Download, badge: null },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 whitespace-nowrap transition-all border shrink-0 ${
                  isActive
                    ? "bg-[#00F0FF]/15 text-[#00F0FF] border-[#00F0FF] shadow-[0_0_15px_rgba(0,240,255,0.2)]"
                    : "bg-[#091218]/60 text-[#94A3B8] border-white/10 hover:border-[#00F0FF]/40 hover:text-white"
                }`}
              >
                <Icon className={`size-4 ${isActive ? "text-[#00F0FF]" : "text-[#94A3B8]"}`} />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-black ${tab.badgeColor || "bg-[#00F0FF]/20 text-[#00F0FF] border border-[#00F0FF]/40"}`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* ── TAB 1: TELEMETRY & REAL 24-HOUR SERVER THROUGHPUT ── */}
        {activeTab === "analytics" && (
          <div className="space-y-6">
            
            {/* KPI Cards Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {[
                { label: "SCHOLARS", val: stats?.totals?.users || 0, icon: Users, color: "#00F0FF" },
                { label: "STUDY NOTES", val: stats?.totals?.notes || 0, icon: BookOpen, color: "#F0C93B" },
                { label: "FORUMS & Q&A", val: stats?.totals?.forums || 0, icon: MessageSquare, color: "#D946EF" },
                { label: "SOLVED DOUBTS", val: stats?.totals?.doubts || 0, icon: HelpCircle, color: "#10B981" },
                { label: "PUBLISHED BLOGS", val: stats?.totals?.blogs || 0, icon: Flame, color: "#3B82F6" },
                { label: "COINS IN VAULT", val: stats?.totals?.totalCoinsInCirculation || 0, icon: Wallet, color: "#F0C93B" },
              ].map((kpi, idx) => (
                <div
                  key={idx}
                  className="rounded-2xl bg-[#091218]/90 border border-white/10 p-4 space-y-2 relative overflow-hidden group shadow-lg hover:border-[#00F0FF]/40 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-[#94A3B8] tracking-widest font-bold">{kpi.label}</span>
                    <div
                      className="size-8 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: `${kpi.color}15`, borderColor: `${kpi.color}30`, borderWidth: 1 }}
                    >
                      <kpi.icon className="size-4" style={{ color: kpi.color }} />
                    </div>
                  </div>
                  <div className="text-2xl font-black text-white font-heading tracking-tight">
                    {kpi.val.toLocaleString()}
                  </div>
                  <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full rounded-full animate-pulse" style={{ backgroundColor: kpi.color, width: "70%" }} />
                  </div>
                </div>
              ))}
            </div>

            {/* REAL 24-HOUR SERVER THROUGHPUT LINE CHART */}
            <div className="rounded-2xl bg-[#091218]/90 border border-[#00F0FF]/30 p-6 space-y-4 shadow-[0_0_30px_rgba(0,240,255,0.1)]">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#00F0FF]/15 pb-4">
                <div>
                  <h2 className="text-lg font-bold text-white font-heading flex items-center gap-2">
                    <TrendingUp className="size-5 text-[#00F0FF]" /> REAL 24-HOUR SERVER THROUGHPUT &amp; DB QUERIES
                  </h2>
                  <p className="text-xs text-[#94A3B8]">Computed from real database activity snapshots and response latency</p>
                </div>
                <Button size="sm" onClick={loadRealTelemetry} className="h-8 text-xs bg-[#0E1A22] border border-[#00F0FF]/30 text-[#00F0FF] gap-1.5">
                  <RefreshCw className="size-3.5" /> Refresh Telemetry
                </Button>
              </div>

              <div className="h-80 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={throughputData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                    <XAxis dataKey="hour" stroke="#64748B" fontSize={10} />
                    <YAxis stroke="#64748B" fontSize={10} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#091218",
                        borderColor: "#00F0FF",
                        borderRadius: "12px",
                        color: "#E2E8F0",
                        fontSize: "11px",
                        fontFamily: "monospace",
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: "11px", fontFamily: "monospace" }} />
                    <Line type="monotone" dataKey="requests" name="HTTP Requests/min" stroke="#00F0FF" strokeWidth={2.5} dot={{ r: 3, fill: "#00F0FF" }} />
                    <Line type="monotone" dataKey="dbQueries" name="DB Queries/min" stroke="#F0C93B" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="latency" name="Latency (ms)" stroke="#10B981" strokeWidth={1.5} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* CHART ROW 2: Ecosystem Content Donut & Role Spectrum */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Content Ecosystem Donut Chart */}
              <div className="rounded-2xl bg-[#091218]/90 border border-[#D946EF]/30 p-6 space-y-4 shadow-lg flex flex-col justify-between">
                <div>
                  <h2 className="text-base font-bold text-white font-heading flex items-center gap-2 border-b border-white/10 pb-3">
                    <PieIcon className="size-4 text-[#D946EF]" /> ECOSYSTEM CONTENT RATIO
                  </h2>
                  <p className="text-xs text-[#94A3B8] pt-1">Distribution across all published content types</p>
                </div>

                <div className="h-56 w-full flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={stats?.ecosystemDistribution || []}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={75}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {(stats?.ecosystemDistribution || []).map((entry, index) => (
                          <Cell key={`cell-eco-${index}`} fill={entry.color || CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#091218",
                          borderColor: "#D946EF",
                          borderRadius: "12px",
                          fontSize: "11px",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Scholar Role Spectrum Donut Chart */}
              <div className="rounded-2xl bg-[#091218]/90 border border-[#F0C93B]/30 p-6 space-y-4 shadow-lg flex flex-col justify-between">
                <div>
                  <h2 className="text-base font-bold text-white font-heading flex items-center gap-2 border-b border-white/10 pb-3">
                    <Users className="size-4 text-[#F0C93B]" /> SCHOLAR ROLE SPECTRUM
                  </h2>
                  <p className="text-xs text-[#94A3B8] pt-1">User account breakdown: Scholars vs Teachers vs Admins</p>
                </div>

                <div className="h-56 w-full flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={stats?.roleDistribution || []}
                        cx="50%"
                        cy="50%"
                        outerRadius={75}
                        dataKey="value"
                      >
                        {(stats?.roleDistribution || []).map((_, index) => (
                          <Cell key={`cell-role-${index}`} fill={ROLE_COLORS[index % ROLE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#091218",
                          borderColor: "#F0C93B",
                          borderRadius: "12px",
                          fontSize: "11px",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

            </div>

            {/* CHART ROW 3: Feature Usage & Peak Prep Hours Engagement */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Feature Usage & Active Engagement Bar Chart */}
              <div className="lg:col-span-7 rounded-2xl bg-[#091218]/90 border border-[#00F0FF]/30 p-6 space-y-4 shadow-lg flex flex-col justify-between">
                <div>
                  <h2 className="text-base font-bold text-white font-heading flex items-center gap-2 border-b border-white/10 pb-3">
                    <Activity className="size-4 text-[#00F0FF]" /> FEATURE USAGE &amp; ACTIVE SCHOLAR QUERIES
                  </h2>
                  <p className="text-xs text-[#94A3B8] pt-1">Active scholars &amp; query volume per platform feature</p>
                </div>

                <div className="h-64 w-full pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats?.featureUsageBreakdown || []} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                      <XAxis dataKey="feature" stroke="#64748B" fontSize={9} />
                      <YAxis stroke="#64748B" fontSize={10} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#091218",
                          borderColor: "#00F0FF",
                          borderRadius: "12px",
                          fontSize: "11px",
                          fontFamily: "monospace",
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: "10px", fontFamily: "monospace" }} />
                      <Bar dataKey="activeUsers" name="Active Scholars" fill="#00F0FF" radius={[6, 6, 0, 0]} />
                      <Bar dataKey="queries" name="Interaction Queries" fill="#F0C93B" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Peak Study Hours Distribution Bar Chart */}
              <div className="lg:col-span-5 rounded-2xl bg-[#091218]/90 border border-[#10B981]/30 p-6 space-y-4 shadow-lg flex flex-col justify-between">
                <div>
                  <h2 className="text-base font-bold text-white font-heading flex items-center gap-2 border-b border-white/10 pb-3">
                    <Zap className="size-4 text-[#10B981]" /> PEAK PREP HOURS ENGAGEMENT
                  </h2>
                  <p className="text-xs text-[#94A3B8] pt-1">Scholar activity density across 6 study time slots</p>
                </div>

                <div className="h-64 w-full pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats?.peakStudyHours || []} layout="vertical" margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" horizontal={false} />
                      <XAxis type="number" stroke="#64748B" fontSize={10} />
                      <YAxis dataKey="timeSlot" type="category" stroke="#E2E8F0" fontSize={9} width={110} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#091218",
                          borderColor: "#10B981",
                          borderRadius: "12px",
                          fontSize: "11px",
                        }}
                      />
                      <Bar dataKey="scholars" name="Active Scholars" fill="#10B981" radius={[0, 6, 6, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

            </div>

          </div>
        )}

        {/* ── TAB 2: REALTIME C2 LOGS COMMAND DECK ── */}
        {activeTab === "c2logs" && (
          <div className="space-y-4 rounded-2xl bg-[#091218]/90 border border-[#00F0FF]/30 p-6 shadow-xl">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
              <div>
                <h2 className="text-lg font-bold text-white font-heading flex items-center gap-2">
                  <Radio className="size-5 text-[#00F0FF] animate-pulse" /> COMMAND &amp; CONTROL (C2) REALTIME LOG MONITOR
                </h2>
                <p className="text-xs text-[#94A3B8]">Streaming live system, security, API, and database diagnostic logs</p>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <div className="flex items-center gap-2 bg-[#04080B] border border-white/15 rounded-xl px-3 py-1.5 text-xs text-white">
                  <Filter className="size-3.5 text-[#00F0FF]" />
                  <select
                    value={logFilterLevel}
                    onChange={(e) => setLogFilterLevel(e.target.value)}
                    className="bg-transparent outline-none text-xs text-white"
                  >
                    <option value="all">ALL LEVELS</option>
                    <option value="info">INFO</option>
                    <option value="security">SECURITY</option>
                    <option value="telemetry">TELEMETRY</option>
                    <option value="warn">WARN</option>
                    <option value="error">ERROR</option>
                  </select>
                </div>

                <Button size="sm" onClick={loadRealLogs} disabled={isLogsLoading} className="h-8 text-xs bg-[#0E1A22] border border-[#00F0FF]/30 text-[#00F0FF]">
                  <RefreshCw className={`size-3.5 ${isLogsLoading ? "animate-spin" : ""}`} /> Stream
                </Button>
              </div>
            </div>

            <div className="bg-[#04080B] border border-white/10 rounded-xl p-4 max-h-[500px] overflow-y-auto space-y-2 font-mono text-xs custom-scroll">
              {systemLogs.length === 0 ? (
                <p className="text-[#94A3B8] italic text-center py-6">No logs match the selected filter level.</p>
              ) : (
                systemLogs.map((log) => (
                  <div key={log._id} className="flex items-start gap-3 py-1.5 border-b border-white/5 hover:bg-white/5 px-2 rounded">
                    <span className="text-[#94A3B8] text-[10px] shrink-0 pt-0.5">
                      {new Date(log.createdAt).toLocaleTimeString()}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase shrink-0 ${
                      log.level === "security"
                        ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                        : log.level === "error"
                        ? "bg-red-500/20 text-red-400"
                        : log.level === "telemetry"
                        ? "bg-[#00F0FF]/20 text-[#00F0FF]"
                        : "bg-emerald-500/20 text-emerald-400"
                    }`}>
                      {log.level}
                    </span>
                    <span className="text-[#00F0FF] text-[10px] font-bold uppercase shrink-0">[{log.source}]</span>
                    <span className="text-white flex-1">{log.message}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ── TAB 3: CYBER THREAT ENGINE & MODERATION QUEUE ── */}
        {activeTab === "moderation" && (
          <div className="space-y-4 rounded-2xl bg-[#091218]/90 border border-rose-500/30 p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <h2 className="text-lg font-bold text-white font-heading flex items-center gap-2">
                  <ShieldAlert className="size-5 text-rose-500" /> CYBER THREAT ENGINE &amp; MODERATION QUEUE ({threatFlags.length} THREATS)
                </h2>
                <p className="text-xs text-[#94A3B8]">Review reported posts, toxic content flags, and execute content purges from MongoDB</p>
              </div>
              <Button size="sm" onClick={loadModerationQueue} disabled={isThreatLoading} className="h-8 text-xs border border-rose-500/30 text-rose-400 bg-[#0E1A22]">
                <RefreshCw className={`size-3.5 ${isThreatLoading ? "animate-spin" : ""}`} /> Scan Queue
              </Button>
            </div>

            {threatFlags.length === 0 ? (
              <p className="text-xs text-[#94A3B8] italic py-12 text-center border border-dashed border-white/10 rounded-xl">
                No active threats or reported content in moderation queue. Platform security status nominal.
              </p>
            ) : (
              <div className="space-y-4">
                {threatFlags.map((flag) => (
                  <div key={flag._id} className="p-5 rounded-xl bg-[#04080B] border border-rose-500/30 space-y-3 relative">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-white/5 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-rose-500/20 text-rose-400 border border-rose-500/40">
                          {flag.targetType}
                        </span>
                        <span className="text-white text-xs font-bold font-mono">Author: {flag.authorName || "Scholar"}</span>
                      </div>

                      <div className="flex items-center gap-2 text-[10px] font-mono">
                        <span className="text-[#94A3B8]">TOXICITY RISK:</span>
                        <span className="text-rose-400 font-bold">{(flag.toxicityScore * 100).toFixed(0)}%</span>
                        <div className="w-16 h-2 bg-white/10 rounded-full overflow-hidden">
                          <div className="h-full bg-rose-500 rounded-full" style={{ width: `${flag.toxicityScore * 100}%` }} />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <p className="text-xs text-white font-bold">{flag.flaggedText || "Content item"}</p>
                      <p className="text-[11px] text-rose-400 font-mono"><span className="text-[#94A3B8]">REASON:</span> {flag.reason}</p>
                    </div>

                    <div className="pt-2 flex items-center justify-end gap-3 border-t border-white/5">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleResolveThreatFlag(flag._id, flag.targetId, flag.targetType, "dismiss")}
                        className="h-7 text-[10px] border border-white/15 text-[#94A3B8] hover:text-white"
                      >
                        <CheckCircle2 className="size-3 mr-1 text-[#10B981]" /> Mark Safe &amp; Dismiss
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleResolveThreatFlag(flag._id, flag.targetId, flag.targetType, "purge")}
                        className="h-7 text-[10px] bg-rose-600 hover:bg-rose-700 text-white font-bold gap-1"
                      >
                        <Trash2 className="size-3" /> Purge Content Permanently
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── TAB 4: SCHOLAR DATABASE MATRIX ── */}
        {activeTab === "users" && (
          <div className="space-y-4 rounded-2xl bg-[#091218]/90 border border-white/15 p-6 shadow-xl">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
              <div>
                <h2 className="text-lg font-bold text-white font-heading flex items-center gap-2">
                  <Users className="size-5 text-[#00F0FF]" /> SCHOLAR MATRIX ({filteredUsers.length})
                </h2>
                <p className="text-xs text-[#94A3B8]">Manage accounts, elevate roles, grant points, suspend or purge records</p>
              </div>

              <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-64">
                  <Search className="size-3.5 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={userSearchQuery}
                    onChange={(e) => setUserSearchQuery(e.target.value)}
                    placeholder="Search name or email..."
                    className="w-full bg-[#04080B] border border-white/15 focus:border-[#00F0FF] rounded-xl pl-9 pr-3 py-2 text-xs text-white outline-none"
                  />
                </div>

                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value as typeof roleFilter)}
                  className="bg-[#04080B] border border-white/15 text-xs text-white rounded-xl px-3 py-2 outline-none"
                >
                  <option value="all">ALL ROLES</option>
                  <option value="user">USER</option>
                  <option value="teacher">TEACHER</option>
                  <option value="admin">ADMIN</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto custom-scroll">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-white/10 text-[#94A3B8] uppercase text-[10px]">
                    <th className="py-3 px-4">SCHOLAR</th>
                    <th className="py-3 px-4">ROLE</th>
                    <th className="py-3 px-4">POINTS</th>
                    <th className="py-3 px-4">STATUS</th>
                    <th className="py-3 px-4">REGISTERED</th>
                    <th className="py-3 px-4 text-right">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredUsers.map((u) => (
                    <tr key={u._id} className="hover:bg-white/5 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-white">{u.name || "Anonymous Scholar"}</div>
                        <div className="text-[10px] text-[#94A3B8] font-mono">{u.email}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          u.role === "admin"
                            ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                            : u.role === "teacher"
                            ? "bg-[#F0C93B]/20 text-[#F0C93B] border border-[#F0C93B]/30"
                            : "bg-[#00F0FF]/15 text-[#00F0FF] border border-[#00F0FF]/30"
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-[#F0C93B]">{u.points || 0}</td>
                      <td className="py-3 px-4">
                        {u.isSuspended ? (
                          <span className="text-rose-400 font-bold text-[10px]">SUSPENDED</span>
                        ) : (
                          <span className="text-[#10B981] font-bold text-[10px]">ACTIVE</span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-mono text-[#94A3B8]">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-right space-x-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleUserModify(u._id, u.isSuspended, "toggle_suspend")}
                          className="h-7 text-[10px] px-2 border border-white/10 hover:border-amber-400"
                        >
                          <Ban className="size-3 mr-1" />
                          {u.isSuspended ? "Unsuspend" : "Suspend"}
                        </Button>

                        {u.role !== "teacher" ? (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleUserModify(u._id, u.isSuspended, "role", "teacher")}
                            className="h-7 text-[10px] px-2 border border-[#F0C93B]/30 text-[#F0C93B] hover:bg-[#F0C93B]/20"
                          >
                            <GraduationCap className="size-3 mr-1" />
                            Make Teacher
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleUserModify(u._id, u.isSuspended, "role", "user")}
                            className="h-7 text-[10px] px-2 border border-white/10 text-white/70 hover:border-white/30"
                          >
                            Remove Teacher
                          </Button>
                        )}

                        {u.role !== "admin" ? (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleUserModify(u._id, u.isSuspended, "role", "admin")}
                            className="h-7 text-[10px] px-2 border border-[#00F0FF]/30 text-[#00F0FF] hover:bg-[#00F0FF]/20"
                          >
                            Make Admin
                          </Button>
                        ) : (
                          u._id !== session?.user?.id && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleUserModify(u._id, u.isSuspended, "role", "user")}
                              className="h-7 text-[10px] px-2 border border-rose-500/30 text-rose-400 hover:bg-rose-500/20"
                            >
                              Remove Admin
                            </Button>
                          )
                        )}

                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleUserDelete(u._id)}
                          className="h-7 text-[10px] text-rose-400 border border-rose-500/30 hover:bg-rose-500/20 px-2"
                        >
                          <Trash2 className="size-3" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── TAB 5: TEACHER APPLICATIONS ── */}
        {activeTab === "teacher_applications" && (
          <div className="space-y-4 rounded-2xl bg-[#091218]/90 border border-white/15 p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <h2 className="text-lg font-bold text-white font-heading flex items-center gap-2">
                  <GraduationCap className="size-5 text-[#F0C93B]" /> TEACHER VERIFICATION DESK ({pendingTeacherAppsCount} PENDING)
                </h2>
                <p className="text-xs text-[#94A3B8]">Review educator credentials, subject expertise, and approve teacher badges</p>
              </div>
              <Button size="sm" onClick={loadTeacherApplications} disabled={isTeacherAppsLoading} className="h-8 text-xs gap-1.5 bg-[#0E1A22] border border-[#F0C93B]/30 text-[#F0C93B]">
                <RefreshCw className={`size-3.5 ${isTeacherAppsLoading ? "animate-spin" : ""}`} /> Refresh
              </Button>
            </div>

            {teacherApplications.length === 0 ? (
              <p className="text-xs text-[#94A3B8] italic py-8 text-center border border-dashed border-white/10 rounded-xl">
                No teacher applications submitted yet.
              </p>
            ) : (
              <div className="space-y-4">
                {teacherApplications.map((app) => (
                  <div key={app._id} className="p-5 rounded-xl bg-[#04080B] border border-white/10 space-y-3">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                      <div>
                        <h3 className="font-bold text-white text-sm">{app.userName}</h3>
                        <p className="text-xs text-[#94A3B8] font-mono">{app.userEmail} · {app.qualification}</p>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        app.status === "approved" ? "bg-[#10B981]/20 text-[#10B981]" : app.status === "rejected" ? "bg-rose-500/20 text-rose-400" : "bg-[#F0C93B]/20 text-[#F0C93B]"
                      }`}>
                        {app.status}
                      </span>
                    </div>
                    <div className="text-xs text-[#E2E8F0] space-y-1">
                      <p><span className="text-[#94A3B8]">Subject Expertise:</span> {app.subjectExpertise}</p>
                      <p><span className="text-[#94A3B8]">Experience:</span> {app.experienceYears} Years</p>
                      <p><span className="text-[#94A3B8]">Bio:</span> {app.bio}</p>
                    </div>

                    {app.status === "pending" && (
                      <div className="pt-2 flex gap-3">
                        <Button size="sm" onClick={() => handleTeacherApplicationAction(app._id, "approve")} className="h-8 bg-[#10B981] hover:bg-[#10B981]/80 text-black font-bold text-xs">
                          Approve Teacher Badge
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => handleTeacherApplicationAction(app._id, "reject")} className="h-8 border border-rose-500/30 text-rose-400 hover:bg-rose-500/20 text-xs">
                          Reject Application
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── TAB 6: COIN PAYOUT DESK ── */}
        {activeTab === "withdrawals" && (
          <div className="space-y-4 rounded-2xl bg-[#091218]/90 border border-white/15 p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <h2 className="text-lg font-bold text-white font-heading flex items-center gap-2">
                  <Wallet className="size-5 text-[#F28B6E]" /> COIN VAULT &amp; PAYOUT DESK ({pendingWithdrawalsCount} PENDING)
                </h2>
                <p className="text-xs text-[#94A3B8]">Process coin-to-rupee withdrawal requests and verify bank/UPI transfers</p>
              </div>
              <Button size="sm" onClick={loadWithdrawals} disabled={isWithdrawalsLoading} className="h-8 text-xs gap-1.5 bg-[#0E1A22] border border-[#F28B6E]/30 text-[#F28B6E]">
                <RefreshCw className={`size-3.5 ${isWithdrawalsLoading ? "animate-spin" : ""}`} /> Refresh
              </Button>
            </div>

            {withdrawalRequests.length === 0 ? (
              <p className="text-xs text-[#94A3B8] italic py-8 text-center border border-dashed border-white/10 rounded-xl">
                No withdrawal requests found.
              </p>
            ) : (
              <div className="overflow-x-auto custom-scroll">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-white/10 text-[#94A3B8] uppercase text-[10px]">
                      <th className="py-3 px-4">SCHOLAR</th>
                      <th className="py-3 px-4">COINS</th>
                      <th className="py-3 px-4">AMOUNT (INR)</th>
                      <th className="py-3 px-4">METHOD</th>
                      <th className="py-3 px-4">STATUS</th>
                      <th className="py-3 px-4 text-right">ACTION</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {withdrawalRequests.map((req) => (
                      <tr key={req.id} className="hover:bg-white/5 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-bold text-white">{req.userName}</div>
                          <div className="text-[10px] text-[#94A3B8] font-mono">{req.userEmail}</div>
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-[#F0C93B]">{req.amount} Coins</td>
                        <td className="py-3 px-4 font-mono font-bold text-[#10B981]">₹{req.amountINR}</td>
                        <td className="py-3 px-4 font-mono uppercase text-[#94A3B8]">{req.payoutMethod}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            req.status === "completed" ? "bg-[#10B981]/20 text-[#10B981]" : req.status === "rejected" ? "bg-rose-500/20 text-rose-400" : "bg-[#F0C93B]/20 text-[#F0C93B]"
                          }`}>
                            {req.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          {req.status === "pending" && (
                            <Button
                              size="sm"
                              onClick={() => setWithdrawalActionModal({ id: req.id, action: "complete", userName: req.userName, amount: req.amountINR, payoutMethod: req.payoutMethod })}
                              className="h-7 text-[10px] bg-[#10B981] hover:bg-[#10B981]/80 text-black font-bold"
                            >
                              Process Payout
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── TAB 7: COUPON MATRIX ── */}
        {activeTab === "coupons" && (
          <div className="space-y-6">
            <div className="rounded-2xl bg-[#091218]/90 border border-white/15 p-6 shadow-xl space-y-4">
              <h2 className="text-lg font-bold text-white font-heading flex items-center gap-2 border-b border-white/10 pb-3">
                <Tag className="size-5 text-[#00F0FF]" /> PROMO DISCOUNT MATRIX ENGINE
              </h2>

              <form onSubmit={handleCreateCoupon} className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                <input
                  type="text"
                  placeholder="CODE (e.g. JARVIS50)"
                  value={newCoupon.code}
                  onChange={(e) => setNewCoupon({ ...newCoupon, code: e.target.value.toUpperCase() })}
                  className="bg-[#04080B] border border-white/15 rounded-xl px-3 py-2 text-xs text-white font-mono outline-none uppercase"
                />
                <input
                  type="text"
                  placeholder="Description..."
                  value={newCoupon.description}
                  onChange={(e) => setNewCoupon({ ...newCoupon, description: e.target.value })}
                  className="bg-[#04080B] border border-white/15 rounded-xl px-3 py-2 text-xs text-white outline-none"
                />
                <select
                  value={newCoupon.discountType}
                  onChange={(e) => setNewCoupon({ ...newCoupon, discountType: e.target.value as "percentage" | "fixed" })}
                  className="bg-[#04080B] border border-white/15 rounded-xl px-3 py-2 text-xs text-white outline-none"
                >
                  <option value="percentage">Percentage (%)</option>
                  <option value="fixed">Fixed Amount (₹)</option>
                </select>
                <input
                  type="number"
                  placeholder="Discount Value"
                  value={newCoupon.discountValue}
                  onChange={(e) => setNewCoupon({ ...newCoupon, discountValue: Number(e.target.value) })}
                  className="bg-[#04080B] border border-white/15 rounded-xl px-3 py-2 text-xs text-white outline-none"
                />
                <input
                  type="number"
                  placeholder="Max Uses"
                  value={newCoupon.maxUses}
                  onChange={(e) => setNewCoupon({ ...newCoupon, maxUses: Number(e.target.value) })}
                  className="bg-[#04080B] border border-white/15 rounded-xl px-3 py-2 text-xs text-white outline-none"
                />
                <Button type="submit" disabled={isSubmittingCoupon} className="h-9 bg-[#00F0FF] hover:bg-[#00F0FF]/80 text-black font-bold text-xs">
                  {isSubmittingCoupon ? "Creating..." : "Create Coupon"}
                </Button>
              </form>
            </div>

            <div className="rounded-2xl bg-[#091218]/90 border border-white/15 p-6 shadow-xl">
              <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Active Coupons ({coupons.length})</h3>
                <Button size="sm" onClick={loadCoupons} disabled={isCouponsLoading} className="h-7 text-[10px] bg-[#0E1A22] border border-[#00F0FF]/30 text-[#00F0FF]">
                  <RefreshCw className={`size-3 ${isCouponsLoading ? "animate-spin" : ""}`} /> Refresh
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {coupons.map((c) => (
                  <div key={c._id} className="p-4 rounded-xl bg-[#04080B] border border-white/10 space-y-2 relative">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-white text-sm tracking-wider text-[#00F0FF]">{c.code}</span>
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${c.isActive ? "bg-[#10B981]/20 text-[#10B981]" : "bg-rose-500/20 text-rose-400"}`}>
                        {c.isActive ? "ACTIVE" : "DISABLED"}
                      </span>
                    </div>
                    <p className="text-xs text-[#94A3B8]">{c.description || "Promo code"}</p>
                    <div className="text-[10px] text-[#94A3B8] font-mono space-y-0.5">
                      <div>Discount: {c.discountValue}{c.discountType === "percentage" ? "%" : " ₹"}</div>
                      <div>Used: {c.usedCount} / {c.maxUses}</div>
                    </div>
                    <div className="pt-2 flex gap-2 border-t border-white/5">
                      <Button size="sm" variant="ghost" onClick={() => handleToggleCouponStatus(c._id, c.isActive)} className="h-6 text-[9px] border border-white/10">
                        {c.isActive ? "Disable" : "Enable"}
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => handleDeleteCoupon(c._id, c.code)} className="h-6 text-[9px] text-rose-400 border border-rose-500/30">
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 8: GOVERNANCE PROTOCOLS ── */}
        {activeTab === "settings" && (
          <div className="space-y-6">
            <div className="rounded-2xl bg-[#091218]/90 border border-white/15 p-6 shadow-xl space-y-4">
              <h2 className="text-lg font-bold text-white font-heading flex items-center gap-2 border-b border-white/10 pb-3">
                <SettingsIcon className="size-5 text-[#00F0FF]" /> PLATFORM GOVERNANCE &amp; MAINTENANCE PROTOCOLS
              </h2>

              <div className="space-y-4">
                {[
                  { key: "maintenanceMode", title: "MAINTENANCE LOCKDOWN MODE", desc: "Restrict non-admin access to maintenance page during core upgrades." },
                  { key: "enableRegistrations", title: "ENABLE NEW USER REGISTRATIONS", desc: "Allow new scholars to sign up via credentials or Google." },
                  { key: "enableComments", title: "ENABLE COMMUNITY COMMENTS & DISCUSSION", desc: "Allow scholars to post replies on blogs and forums." },
                ].map((s) => (
                  <div key={s.key} className="flex items-center justify-between p-4 rounded-xl bg-[#04080B] border border-white/10">
                    <div>
                      <div className="font-bold text-white text-xs">{s.title}</div>
                      <div className="text-[10px] text-[#94A3B8] font-mono">{s.desc}</div>
                    </div>
                    <button
                      onClick={() => handleToggleSiteSetting(s.key)}
                      className={`h-6 w-11 rounded-full transition-all relative ${
                        siteSettings[s.key] ? "bg-[#00F0FF]" : "bg-zinc-800"
                      }`}
                    >
                      <div className={`h-4 w-4 bg-black rounded-full absolute top-1 transition-all ${
                        siteSettings[s.key] ? "right-1" : "left-1"
                      }`} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Wallet Backfill Action */}
            <div className="rounded-2xl bg-[#091218]/90 border border-[#F0C93B]/30 p-6 shadow-xl space-y-3">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Wallet className="size-4 text-[#F0C93B]" /> WALLET BACKFILL MIGRATION SCRIPT
              </h3>
              <p className="text-xs text-[#94A3B8]">
                Runs a system migration script to initialize coin wallets for any legacy users created prior to the wallet release.
              </p>
              <Button
                onClick={handleBackfillWallets}
                disabled={isBackfillingWallets}
                className="h-9 bg-[#F0C93B] hover:bg-[#F0C93B]/80 text-black font-bold text-xs gap-2"
              >
                <RefreshCw className={`size-4 ${isBackfillingWallets ? "animate-spin" : ""}`} />
                {isBackfillingWallets ? "Processing Migration..." : "Execute Wallet Backfill Migration"}
              </Button>
            </div>
          </div>
        )}

        {/* ── TAB 9: AUDIT TRAIL ── */}
        {activeTab === "audit" && (
          <div className="space-y-4 rounded-2xl bg-[#091218]/90 border border-white/15 p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <h2 className="text-lg font-bold text-white font-heading flex items-center gap-2">
                  <FileText className="size-5 text-[#00F0FF]" /> QUANTUM AUDIT LOG TRAIL ({auditLogs.length})
                </h2>
                <p className="text-xs text-[#94A3B8]">Cryptographic trace of all administrative operations</p>
              </div>
              <Button size="sm" onClick={loadAuditLogsList} className="h-8 text-xs bg-[#0E1A22] border border-[#00F0FF]/30 text-[#00F0FF]">
                <RefreshCw className="size-3.5 mr-1" /> Refresh Trail
              </Button>
            </div>

            <div className="overflow-x-auto custom-scroll">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-white/10 text-[#94A3B8] uppercase text-[10px]">
                    <th className="py-3 px-4">TIMESTAMP</th>
                    <th className="py-3 px-4">ADMIN</th>
                    <th className="py-3 px-4">ACTION PROTOCOL</th>
                    <th className="py-3 px-4">DETAILS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-mono">
                  {auditLogs.map((log) => (
                    <tr key={log._id} className="hover:bg-white/5 transition-colors">
                      <td className="py-3 px-4 text-[#94A3B8] text-[10px]">{new Date(log.createdAt).toLocaleString()}</td>
                      <td className="py-3 px-4 font-bold text-white">{log.adminName}</td>
                      <td className="py-3 px-4 text-[#00F0FF] uppercase text-[10px]">{log.action}</td>
                      <td className="py-3 px-4 text-[#94A3B8] text-[10px]">{log.details}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── TAB 10: DATA EXPORT TERMINAL ── */}
        {activeTab === "export" && (
          <div className="rounded-2xl bg-[#091218]/90 border border-white/15 p-6 shadow-xl space-y-6">
            <div>
              <h2 className="text-lg font-bold text-white font-heading flex items-center gap-2 border-b border-white/10 pb-3">
                <Download className="size-5 text-[#00F0FF]" /> DATA VAULT EXPORT TERMINAL
              </h2>
              <p className="text-xs text-[#94A3B8] pt-2">Download raw database exports in CSV format for compliance &amp; archiving</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { type: "users", label: "EXPORT SCHOLARS MATRIX", desc: "User accounts, roles, points, created dates" },
                { type: "notes", label: "EXPORT STUDY NOTES LEDGER", desc: "Notes metadata, categories, view counts, publish states" },
                { type: "transactions", label: "EXPORT COIN & FINANCIAL LEDGER", desc: "Wallet balances, coin redemptions, pending payouts" },
              ].map((exp) => (
                <div key={exp.type} className="p-5 rounded-xl bg-[#04080B] border border-white/10 space-y-3 flex flex-col justify-between">
                  <div className="space-y-1">
                    <h3 className="font-bold text-white text-xs">{exp.label}</h3>
                    <p className="text-[10px] text-[#94A3B8] font-mono">{exp.desc}</p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleExportData(exp.type)}
                    className="h-8 bg-[#00F0FF] hover:bg-[#00F0FF]/80 text-black font-bold text-xs gap-1.5 w-full"
                  >
                    <Download className="size-3.5" /> Download CSV
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* ── WITHDRAWAL ACTION MODAL ── */}
      {withdrawalActionModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#091218] border border-[#00F0FF]/40 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-[0_0_50px_rgba(0,240,255,0.2)]">
            <h3 className="text-lg font-bold text-white font-heading uppercase flex items-center gap-2">
              <Wallet className="size-5 text-[#00F0FF]" /> Process Withdrawal Request
            </h3>
            <p className="text-xs text-[#94A3B8]">
              Scholar: <span className="text-white font-bold">{withdrawalActionModal.userName}</span>
              <br />
              Amount: <span className="text-[#10B981] font-bold">₹{withdrawalActionModal.amount}</span> ({withdrawalActionModal.payoutMethod.toUpperCase()})
            </p>

            <div className="space-y-2">
              <label className="text-[10px] font-mono text-[#94A3B8] uppercase">Transaction Reference ID (e.g. UTR / Bank Ref)</label>
              <input
                type="text"
                value={withdrawalTxRef}
                onChange={(e) => setWithdrawalTxRef(e.target.value)}
                placeholder="e.g. BANK123456789"
                className="w-full bg-[#04080B] border border-white/15 rounded-xl px-3 py-2 text-xs text-white outline-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-mono text-[#94A3B8] uppercase">Admin Note / Memo</label>
              <textarea
                value={withdrawalNote}
                onChange={(e) => setWithdrawalNote(e.target.value)}
                rows={2}
                placeholder="Optional note sent to scholar..."
                className="w-full bg-[#04080B] border border-white/15 rounded-xl px-3 py-2 text-xs text-white outline-none resize-none"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                onClick={handleProcessWithdrawal}
                disabled={isProcessingWithdrawalAction}
                className="flex-1 bg-[#10B981] text-black font-bold text-xs h-9"
              >
                {isProcessingWithdrawalAction ? "Processing..." : "Confirm & Save"}
              </Button>
              <Button
                variant="ghost"
                onClick={() => setWithdrawalActionModal(null)}
                className="border border-white/15 text-[#94A3B8] hover:text-white h-9 text-xs"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
