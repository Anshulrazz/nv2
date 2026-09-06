"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  Wallet as WalletIcon,
  Send,
  ArrowUpRight,
  ArrowDownLeft,
  Loader2,
  RefreshCw,
  Gift,
  Crown,
  History,
  ShieldCheck,
  X,
  AlertCircle,
  Lock,
  KeyRound,
  ShieldAlert,
  Plus,
  GraduationCap,
  Copy,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

import { WithdrawEarningsModal } from "./WithdrawEarningsModal";
import { CoinConverterModal } from "./CoinConverterModal";
import { BecomeTeacherModal } from "@/components/teacher/BecomeTeacherModal";
import { ListSkeleton } from "@/components/ui/skeleton";

interface TransactionItem {
  id: string;
  type: string;
  amount: number;
  isDebit: boolean;
  fromWalletAddress: string | null;
  toWalletAddress: string;
  counterpartyName: string;
  counterpartyImage: string | null;
  status: "completed" | "failed" | "pending";
  metadata?: {
    note?: string;
    plan?: string;
    referralCode?: string;
  };
  createdAt: string;
}

export function WalletSection({ onCoinsUpdated }: { onCoinsUpdated?: () => void }) {
  const [address, setAddress] = useState<string>("");
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [balance, setBalance] = useState<number>(0);
  const [creatorEarnings, setCreatorEarnings] = useState<number>(0);
  const [payoutDetails, setPayoutDetails] = useState<{
    upiId?: string;
    bankAccount?: string;
    ifscCode?: string;
    accountHolderName?: string;
  }>({});
  const [userRole, setUserRole] = useState<"user" | "teacher" | "admin">("user");
  const [hasWalletPassword, setHasWalletPassword] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(true);

  // Withdraw Modal State
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [showCoinConverter, setShowCoinConverter] = useState(false);
  const [showBecomeTeacherModal, setShowBecomeTeacherModal] = useState(false);

  // Send Coins Modal State
  const [isSendModalOpen, setIsSendModalOpen] = useState(false);
  const [recipientAddress, setRecipientAddress] = useState("");
  const [resolvingRecipient, setResolvingRecipient] = useState(false);
  const [resolvedRecipient, setResolvedRecipient] = useState<{
    address: string;
    name: string;
    image?: string | null;
  } | null>(null);
  const [recipientError, setRecipientError] = useState<string | null>(null);

  const [transferAmount, setTransferAmount] = useState<string>("");
  const [transferNote, setTransferNote] = useState<string>("");
  const [walletPasswordInput, setWalletPasswordInput] = useState<string>("");
  const [isTransferring, setIsTransferring] = useState(false);
  const [showConfirmStep, setShowConfirmStep] = useState(false);

  // Set / Change Wallet Password Modal State
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [oldPasswordInput, setOldPasswordInput] = useState("");
  const [newPasswordInput, setNewPasswordInput] = useState("");
  const [confirmPasswordInput, setConfirmPasswordInput] = useState("");
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  // Ledger Transactions State
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [isLedgerLoading, setIsLedgerLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchWalletInfo = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/wallet/me");
      if (res.ok) {
        const data = await res.json();
        setAddress(data.address || "");
        setBalance(data.balance ?? 0);
        setCreatorEarnings(data.creatorEarnings ?? 0);
        setPayoutDetails(data.payoutDetails || {});
        setUserRole(data.userRole || "user");
        setHasWalletPassword(Boolean(data.hasWalletPassword));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchTransactions = useCallback(async (pg = 1) => {
    try {
      setIsLedgerLoading(true);
      const res = await fetch(`/api/wallet/transactions?page=${pg}&limit=10`);
      if (res.ok) {
        const data = await res.json();
        setTransactions(data.transactions || []);
        setPage(data.pagination?.page || 1);
        setTotalPages(data.pagination?.pages || 1);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLedgerLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWalletInfo();
    fetchTransactions(1);
  }, [fetchWalletInfo, fetchTransactions]);

  const handleOpenSendModal = () => {
    if (!hasWalletPassword) {
      toast.info("Please set up a Wallet Password first before sending coins.");
      setIsPasswordModalOpen(true);
      return;
    }
    setIsSendModalOpen(true);
  };

  const handleResolveRecipient = async (targetAddr: string) => {
    const clean = targetAddr.trim().toUpperCase();
    if (!clean) {
      setResolvedRecipient(null);
      setRecipientError(null);
      return;
    }

    if (clean === address) {
      setResolvedRecipient(null);
      setRecipientError("You cannot transfer coins to your own address.");
      return;
    }

    try {
      setResolvingRecipient(true);
      setRecipientError(null);
      const res = await fetch(`/api/wallet/resolve/${encodeURIComponent(clean)}`);
      const data = await res.json();

      if (!res.ok) {
        setResolvedRecipient(null);
        setRecipientError(data.error || "Wallet address not found.");
      } else {
        setResolvedRecipient(data);
        setRecipientError(null);
      }
    } catch (e) {
      console.error(e);
      setResolvedRecipient(null);
      setRecipientError("Failed to verify wallet address.");
    } finally {
      setResolvingRecipient(false);
    }
  };

  const handleExecuteTransfer = async () => {
    const amt = parseInt(transferAmount, 10);
    if (!resolvedRecipient || isNaN(amt) || amt <= 0) return;

    if (!walletPasswordInput.trim()) {
      toast.error("Please enter your Wallet Password to authorize transfer.");
      return;
    }

    try {
      setIsTransferring(true);
      const res = await fetch("/api/wallet/transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          toAddress: resolvedRecipient.address,
          amount: amt,
          note: transferNote,
          password: walletPasswordInput.trim(),
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        toast.error(json.message || json.error || "Transfer failed.");
        if (json.error === "WALLET_PASSWORD_NOT_SET") {
          setIsSendModalOpen(false);
          setIsPasswordModalOpen(true);
        }
        return;
      }

      toast.success(`Successfully sent ${amt} coins to ${resolvedRecipient.name}!`);
      setIsSendModalOpen(false);
      setShowConfirmStep(false);
      setRecipientAddress("");
      setResolvedRecipient(null);
      setTransferAmount("");
      setTransferNote("");
      setWalletPasswordInput("");

      fetchWalletInfo();
      fetchTransactions(1);
      if (onCoinsUpdated) onCoinsUpdated();
    } catch (err) {
      console.error(err);
      toast.error("An unexpected error occurred during transfer.");
    } finally {
      setIsTransferring(false);
    }
  };

  const handleSaveWalletPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPasswordInput.trim() || newPasswordInput.trim().length < 4) {
      toast.error("Wallet password must be at least 4 characters long.");
      return;
    }

    if (!hasWalletPassword && newPasswordInput !== confirmPasswordInput) {
      toast.error("New password and confirm password do not match.");
      return;
    }

    try {
      setIsSavingPassword(true);
      const res = await fetch("/api/wallet/set-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          newWalletPassword: newPasswordInput.trim(),
          oldWalletPassword: oldPasswordInput.trim() || undefined,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        toast.error(json.message || json.error || "Failed to set wallet password.");
        return;
      }

      const wasPasswordSetBefore = hasWalletPassword;
      toast.success(json.message || "Wallet password saved successfully!");
      setHasWalletPassword(true);
      setIsPasswordModalOpen(false);
      setOldPasswordInput("");
      setNewPasswordInput("");
      setConfirmPasswordInput("");

      // Automatically open Send Coins modal after first-time setup
      if (!wasPasswordSetBefore) {
        setIsSendModalOpen(true);
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred while saving wallet password.");
    } finally {
      setIsSavingPassword(false);
    }
  };

  const amountNum = parseInt(transferAmount, 10) || 0;
  const isInsufficientBalance = amountNum > balance;

  return (
    <div className="space-y-6">
      {/* WALLET ADDRESS HEADER BANNER */}
      <div className="rounded-2xl bg-bg-surface border border-border-subtle p-5 sm:p-6 shadow-sm relative overflow-hidden space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-accent-primary bg-accent-primary/10 px-2.5 py-0.5 rounded-full border border-accent-primary/20">
                Official Wallet Address
              </span>
              <span className="text-[10px] text-text-muted font-mono">• Peer-to-Peer ID</span>
            </div>
            <p className="text-xs text-text-secondary max-w-xl leading-relaxed">
              Share this unique wallet address with other scholars or educators on Notexia to receive instant coin transfers.
            </p>
          </div>

          <Button
            type="button"
            onClick={() => {
              if (!address) return;
              navigator.clipboard.writeText(address);
              setCopiedAddress(true);
              toast.success("Wallet address copied to clipboard!");
              setTimeout(() => setCopiedAddress(false), 2000);
            }}
            disabled={!address}
            className="w-full md:w-auto h-10 px-4 text-xs font-mono font-bold btn-premium-primary rounded-xl shrink-0 flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            {copiedAddress ? (
              <>
                <Check className="size-4" />
                <span>Address Copied!</span>
              </>
            ) : (
              <>
                <Copy className="size-4" />
                <span>Copy Wallet Address</span>
              </>
            )}
          </Button>
        </div>

        {/* CLICK TO COPY ADDRESS CONTAINER */}
        <div 
          onClick={() => {
            if (!address) return;
            navigator.clipboard.writeText(address);
            setCopiedAddress(true);
            toast.success("Wallet address copied to clipboard!");
            setTimeout(() => setCopiedAddress(false), 2000);
          }}
          className="bg-bg-elevated/70 border border-border-subtle p-3 sm:px-4 sm:py-3 rounded-xl flex items-center justify-between gap-3 group cursor-pointer hover:border-accent-primary/40 transition-colors select-all overflow-hidden"
          title="Click to copy wallet address"
        >
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="size-7 rounded-lg bg-accent-primary/10 border border-accent-primary/20 flex items-center justify-center text-accent-primary shrink-0">
              <WalletIcon className="size-3.5" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[9px] text-text-muted uppercase tracking-wider font-mono block">Your Unique Address</span>
              <span className="font-mono text-xs sm:text-sm text-accent-primary font-bold tracking-tight sm:tracking-wider break-all block truncate sm:whitespace-normal">
                {isLoading ? "Fetching address..." : (address || "NTX-GENERATING...")}
              </span>
            </div>
          </div>

          <div className="shrink-0 flex items-center gap-1.5 text-[11px] font-mono text-accent-primary bg-accent-primary/10 group-hover:bg-accent-primary/20 border border-accent-primary/20 px-2.5 py-1 rounded-lg transition-colors">
            {copiedAddress ? <Check className="size-3.5 text-emerald-400" /> : <Copy className="size-3.5" />}
            <span className="hidden sm:inline">{copiedAddress ? "Copied" : "Copy"}</span>
          </div>
        </div>
      </div>

      {/* TWO SEPARATE BALANCE CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* CARD 1: WITHDRAWABLE CREATOR EARNINGS (CREATORS WITH EARNINGS OR TEACHER/ADMIN) OR BECOME TEACHER CTA */}
        {userRole === "teacher" || userRole === "admin" || creatorEarnings > 0 ? (
          <div className="rounded-2xl bg-bg-surface border border-border-subtle p-5 sm:p-6 shadow-sm relative overflow-hidden flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="size-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold shrink-0">
                    ₹
                  </div>
                  <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider font-mono">
                    Withdrawable Creator Earnings
                  </span>
                </div>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20 shrink-0 font-bold">
                  WITHDRAWABLE CASH
                </span>
              </div>

              <div>
                <span className="text-xs text-text-muted">70% Project &amp; Course Creator Revenue</span>
                <div className="flex items-baseline gap-2 mt-1">
                  <h2 className="text-2xl sm:text-3xl font-bold font-mono text-text-primary tracking-tight">
                    {isLoading ? "..." : creatorEarnings.toLocaleString()}
                  </h2>
                  <span className="text-xs font-mono text-text-muted uppercase">
                    Coins (₹{(creatorEarnings / 10).toFixed(2)})
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-border-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <span className="text-[11px] text-text-muted">
                Only Creator Earnings can be withdrawn to bank/UPI (1 INR = 10 Coins).
              </span>
              <Button
                onClick={() => setIsWithdrawModalOpen(true)}
                disabled={creatorEarnings < 1}
                className="w-full sm:w-auto h-9 px-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition-all shrink-0 cursor-pointer"
              >
                Withdraw Cash
              </Button>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl bg-bg-surface border border-border-subtle p-5 sm:p-6 shadow-sm relative overflow-hidden flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="size-8 rounded-lg bg-accent-primary/10 border border-accent-primary/20 flex items-center justify-center text-accent-primary shrink-0">
                    <GraduationCap className="size-4" />
                  </div>
                  <span className="text-xs font-bold text-accent-primary uppercase tracking-wider font-mono">
                    Become a Notexia Teacher
                  </span>
                </div>
                <span className="text-[10px] font-mono text-accent-primary bg-accent-primary/10 px-2.5 py-0.5 rounded-full border border-accent-primary/20 shrink-0 font-bold">
                  70% REVENUE SHARE
                </span>
              </div>

              <div>
                <h3 className="text-sm font-bold text-text-primary">Publish Courses &amp; Earn Money</h3>
                <p className="text-xs text-text-secondary mt-1 leading-relaxed">
                  Earn 70% direct cash payout on every course &amp; research project sold. Apply as an educator in 2 simple steps!
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-border-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <span className="text-[11px] text-text-muted">
                Requires academic qualification or domain expertise.
              </span>
              <Button
                onClick={() => setShowBecomeTeacherModal(true)}
                className="w-full sm:w-auto h-9 px-4 btn-premium-primary text-xs shrink-0 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <GraduationCap className="size-4" />
                <span>Become a Teacher</span>
              </Button>
            </div>
          </div>
        )}

        {/* CARD 2: NOTEXIA ACTIVITY COINS (NON-WITHDRAWABLE) */}
        <div className="rounded-2xl bg-bg-surface border border-border-subtle p-5 sm:p-6 shadow-sm relative overflow-hidden flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="size-8 rounded-lg bg-accent-primary/10 border border-accent-primary/20 flex items-center justify-center text-accent-primary shrink-0">
                  <WalletIcon className="size-4" />
                </div>
                <span className="text-xs font-bold text-text-secondary uppercase tracking-wider font-mono">
                  Activity Coins (Non-Withdrawable)
                </span>
              </div>
              <span className="text-[10px] font-mono text-accent-primary bg-accent-primary/10 px-2.5 py-0.5 rounded-full border border-accent-primary/20 shrink-0 font-bold">
                PLATFORM TOKENS
              </span>
            </div>

            <div>
              <span className="text-xs text-text-muted">Referrals, Signups &amp; Activity Tokens</span>
              <div className="flex flex-wrap items-center gap-2.5 mt-1">
                <h2 className="text-2xl sm:text-3xl font-bold font-mono text-accent-primary tracking-tight">
                  {isLoading ? "..." : balance.toLocaleString()}
                </h2>
                <span className="text-xs font-mono text-text-muted uppercase">
                  Coins
                </span>

                <button
                  type="button"
                  onClick={() => setShowCoinConverter(true)}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-text-primary bg-bg-elevated hover:bg-bg-elevated/80 border border-border-default hover:border-accent-primary/40 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                >
                  <Plus className="size-3 text-accent-primary" />
                  <span>Convert / Buy</span>
                </button>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-border-subtle flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
            <Button
              onClick={() => setIsPasswordModalOpen(true)}
              variant="outline"
              className="h-9 px-3 bg-bg-elevated hover:bg-bg-elevated/80 border-border-subtle text-text-secondary hover:text-text-primary text-xs rounded-xl transition-colors cursor-pointer"
            >
              <KeyRound className="size-3.5 text-accent-primary mr-1" />
              <span>{hasWalletPassword ? "Change PIN" : "Set Wallet PIN"}</span>
            </Button>

            <Button
              onClick={handleOpenSendModal}
              className="h-9 px-4 btn-premium-primary text-xs flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Send className="size-3.5" />
              <span>Send Coins</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Transaction History Ledger */}
      <div className="rounded-2xl bg-bg-surface border border-border-subtle p-5 sm:p-6 space-y-4 shadow-sm">
        <div className="flex items-center justify-between border-b border-border-subtle pb-3">
          <div className="flex items-center gap-2">
            <History className="size-4 text-accent-primary" />
            <h3 className="text-xs sm:text-sm font-bold text-text-primary font-mono tracking-wider uppercase">
              Coin Transaction Ledger
            </h3>
          </div>

          <Button
            size="icon"
            variant="ghost"
            onClick={() => fetchTransactions(page)}
            className="size-7 text-text-muted hover:text-text-primary rounded-lg cursor-pointer"
          >
            <RefreshCw className={`size-3.5 ${isLedgerLoading ? "animate-spin" : ""}`} />
          </Button>
        </div>

        {isLedgerLoading && transactions.length === 0 ? (
          <ListSkeleton count={4} />
        ) : transactions.length === 0 ? (
          <div className="py-10 text-center text-xs text-text-muted space-y-1 border border-dashed border-border-subtle rounded-xl">
            <p>No coin transactions recorded yet.</p>
            <p className="text-[10px] text-text-muted/70">Earn coins via referrals or send coins to friends!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {transactions.map((tx) => {
              const isCredit = !tx.isDebit;
              const dateStr = new Date(tx.createdAt).toLocaleDateString([], {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              });

              return (
                <div
                  key={tx.id}
                  className="p-3 rounded-xl bg-bg-elevated/40 border border-border-subtle flex items-center justify-between gap-3 hover:border-border-default transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`size-9 rounded-xl flex items-center justify-center shrink-0 border ${
                        isCredit
                          ? "bg-accent-primary/10 border-accent-primary/20 text-accent-primary"
                          : "bg-destructive/10 border-destructive/20 text-destructive"
                      }`}
                    >
                      {tx.type === "referral_bonus" ? (
                        <Gift className="size-4" />
                      ) : tx.type === "premium_purchase" ? (
                        <Crown className="size-4 text-accent-primary" />
                      ) : isCredit ? (
                        <ArrowDownLeft className="size-4" />
                      ) : (
                        <ArrowUpRight className="size-4" />
                      )}
                    </div>

                    <div className="min-w-0 space-y-0.5">
                      <p className="text-xs font-semibold text-text-primary truncate">
                        {tx.type === "referral_bonus"
                          ? "Referral Reward Bonus"
                          : tx.type === "premium_purchase"
                          ? `Premium Subscription (${tx.metadata?.plan || "Upgrade"})`
                          : tx.type === "signup_bonus"
                          ? "Welcome Signup Bonus"
                          : tx.type === "project_creator_payout"
                          ? "Project Creator Earnings (70%)"
                          : tx.type === "project_purchase"
                          ? "Project Unlock"
                          : tx.type === "course_creator_payout"
                          ? "Course Creator Earnings (70%)"
                          : tx.type === "course_purchase"
                          ? "Course Enrollment"
                          : tx.type === "creator_withdrawal"
                          ? "Creator Cash Withdrawal"
                          : isCredit
                          ? `Received from ${tx.counterpartyName}`
                          : `Sent to ${tx.counterpartyName}`}
                      </p>
                      <p className="text-[10px] text-text-muted font-mono truncate">
                        {dateStr} {tx.metadata?.note ? `• ${tx.metadata.note}` : ""}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span
                      className={`text-sm font-bold font-mono ${
                        isCredit ? "text-accent-primary" : "text-destructive"
                      }`}
                    >
                      {isCredit ? `+${tx.amount}` : `-${tx.amount}`}
                    </span>
                    <span className="block text-[9px] text-text-muted uppercase font-mono">
                      {tx.status}
                    </span>
                  </div>
                </div>
              );
            })}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-3 border-t border-border-subtle text-xs text-text-muted">
                <span>Page {page} of {totalPages}</span>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={page <= 1}
                    onClick={() => fetchTransactions(page - 1)}
                    className="h-7 px-2.5 text-xs bg-bg-elevated hover:bg-bg-elevated/80 border border-border-subtle text-text-secondary disabled:opacity-40"
                  >
                    Previous
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={page >= totalPages}
                    onClick={() => fetchTransactions(page + 1)}
                    className="h-7 px-2.5 text-xs bg-bg-elevated hover:bg-bg-elevated/80 border border-border-subtle text-text-secondary disabled:opacity-40"
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Send Coins Modal */}
      {isSendModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-md bg-bg-surface border border-border-default rounded-2xl p-5 sm:p-6 space-y-5 shadow-2xl relative text-text-primary">
            <div className="flex items-center justify-between border-b border-border-subtle pb-3">
              <div className="flex items-center gap-2">
                <Send className="size-4 text-accent-primary" />
                <h3 className="text-sm font-bold text-text-primary tracking-tight">
                  Transfer Coins
                </h3>
              </div>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => {
                  setIsSendModalOpen(false);
                  setShowConfirmStep(false);
                }}
                className="size-7 text-text-muted hover:text-text-primary rounded-lg"
              >
                <X className="size-4" />
              </Button>
            </div>

            {!showConfirmStep ? (
              <div className="space-y-4 text-xs">
                {/* Address Input */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider font-mono">
                    Recipient Wallet Address
                  </label>
                  <div className="relative">
                    <Input
                      type="text"
                      name="recipient_wallet_address"
                      autoComplete="off"
                      data-1p-ignore="true"
                      placeholder="e.g. NTX-8F3B9A..."
                      value={recipientAddress}
                      onChange={(e) => {
                        const val = e.target.value;
                        setRecipientAddress(val);
                        handleResolveRecipient(val);
                      }}
                      onBlur={() => handleResolveRecipient(recipientAddress)}
                      className="bg-bg-elevated border-border-subtle text-text-primary placeholder:text-text-muted/60 text-xs h-10 font-mono pr-8"
                    />
                    {resolvingRecipient && (
                      <Loader2 className="absolute right-3 top-3 size-4 animate-spin text-accent-primary" />
                    )}
                  </div>

                  {recipientError && (
                    <p className="text-[10px] text-destructive font-mono flex items-center gap-1">
                      <AlertCircle className="size-3 shrink-0" /> {recipientError}
                    </p>
                  )}

                  {resolvedRecipient && (
                    <div className="p-2.5 rounded-xl bg-accent-primary/10 border border-accent-primary/30 flex items-center gap-2 text-xs text-text-primary animate-fade-in">
                      <ShieldCheck className="size-4 text-accent-primary shrink-0" />
                      <div className="min-w-0">
                        <span className="text-[10px] text-text-muted block">Verified Recipient:</span>
                        <span className="font-bold text-accent-primary truncate block">
                          {resolvedRecipient.name}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Amount Input */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-[10px] font-mono">
                    <label className="font-bold text-text-muted uppercase tracking-wider">
                      Amount (Coins)
                    </label>
                    <span className="text-text-muted">
                      Balance: <strong className="text-accent-primary">{balance}</strong>
                    </span>
                  </div>
                  <Input
                    type="number"
                    min="1"
                    step="1"
                    name="transfer_coin_amount"
                    placeholder="Enter whole amount (e.g. 50)"
                    value={transferAmount}
                    onChange={(e) => setTransferAmount(e.target.value)}
                    className="bg-bg-elevated border-border-subtle text-text-primary placeholder:text-text-muted/60 text-xs h-10 font-mono"
                  />
                  {isInsufficientBalance && (
                    <p className="text-[10px] text-destructive font-mono">
                      Entered amount exceeds available balance.
                    </p>
                  )}
                </div>

                {/* Optional Note */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider font-mono">
                    Note (Optional)
                  </label>
                  <Input
                    type="text"
                    name="transfer_note"
                    placeholder="What's this transfer for?"
                    value={transferNote}
                    onChange={(e) => setTransferNote(e.target.value)}
                    className="bg-bg-elevated border-border-subtle text-text-primary placeholder:text-text-muted/60 text-xs h-10"
                  />
                </div>

                <div className="pt-2 flex gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setIsSendModalOpen(false)}
                    className="flex-1 bg-bg-elevated hover:bg-bg-elevated/80 border border-border-subtle text-text-secondary text-xs h-10 rounded-xl"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    disabled={
                      !resolvedRecipient ||
                      amountNum <= 0 ||
                      isInsufficientBalance ||
                      Boolean(recipientError)
                    }
                    onClick={() => setShowConfirmStep(true)}
                    className="flex-1 btn-premium-primary text-xs h-10 rounded-xl disabled:opacity-40"
                  >
                    Review Transfer
                  </Button>
                </div>
              </div>
            ) : (
              /* Confirmation Step */
              <div className="space-y-4 text-xs animate-fade-in">
                <div className="p-4 rounded-xl bg-bg-elevated border border-border-subtle space-y-3">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-text-muted font-mono block">
                    Transfer Summary
                  </span>

                  <div className="space-y-1.5 border-b border-border-subtle pb-3">
                    <div className="flex justify-between">
                      <span className="text-text-muted">Sending to:</span>
                      <span className="font-bold text-text-primary">{resolvedRecipient?.name}</span>
                    </div>
                    <div className="flex justify-between font-mono">
                      <span className="text-text-muted">Recipient Address:</span>
                      <span className="text-accent-primary">{resolvedRecipient?.address}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-muted">Transfer Amount:</span>
                      <span className="font-bold text-accent-primary font-mono">{amountNum} Coins</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-muted">Network Fee:</span>
                      <span className="font-semibold text-emerald-400 font-mono">0 Coins (Free)</span>
                    </div>
                  </div>

                  <div className="flex justify-between font-bold pt-1">
                    <span className="text-text-primary">New Balance After Transfer:</span>
                    <span className="text-accent-primary font-mono">{balance - amountNum} Coins</span>
                  </div>
                </div>

                {/* Dedicated Wallet Security PIN / Password Field */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-accent-primary uppercase tracking-wider font-mono flex items-center gap-1">
                    <Lock className="size-3" /> Wallet PIN / Security Password
                  </label>
                  <Input
                    type="password"
                    name="dedicated_wallet_security_password"
                    autoComplete="new-password"
                    data-1p-ignore="true"
                    data-bwignore="true"
                    data-lpignore="true"
                    data-form-type="other"
                    placeholder="Enter your Wallet PIN/Password"
                    value={walletPasswordInput}
                    onChange={(e) => setWalletPasswordInput(e.target.value)}
                    className="bg-bg-elevated border-border-subtle text-text-primary placeholder:text-text-muted/60 text-xs h-10 font-mono focus:border-accent-primary"
                  />
                </div>

                <div className="flex gap-2 pt-1">
                  <Button
                    type="button"
                    variant="ghost"
                    disabled={isTransferring}
                    onClick={() => setShowConfirmStep(false)}
                    className="flex-1 bg-bg-elevated hover:bg-bg-elevated/80 border border-border-subtle text-text-secondary text-xs h-10 rounded-xl"
                  >
                    Back
                  </Button>
                  <Button
                    type="button"
                    disabled={isTransferring || !walletPasswordInput.trim()}
                    onClick={handleExecuteTransfer}
                    className="flex-1 btn-premium-primary text-xs h-10 rounded-xl flex items-center justify-center gap-2 disabled:opacity-40"
                  >
                    {isTransferring ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        <span>Sending...</span>
                      </>
                    ) : (
                      <>
                        <Send className="size-3.5" />
                        <span>Confirm & Send</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Set / Change Wallet Password Modal */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-md bg-bg-surface border border-border-default rounded-2xl p-5 sm:p-6 space-y-5 shadow-2xl relative text-text-primary">
            <div className="flex items-center justify-between border-b border-border-subtle pb-3">
              <div className="flex items-center gap-2">
                <KeyRound className="size-4 text-accent-primary" />
                <h3 className="text-sm font-bold text-text-primary tracking-tight">
                  {hasWalletPassword ? "Change Wallet PIN / Password" : "Set Up Wallet PIN / Password"}
                </h3>
              </div>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setIsPasswordModalOpen(false)}
                className="size-7 text-text-muted hover:text-text-primary rounded-lg"
              >
                <X className="size-4" />
              </Button>
            </div>

            <form onSubmit={handleSaveWalletPassword} className="space-y-4 text-xs">
              <div className="p-3 rounded-xl bg-bg-elevated border border-accent-secondary/30 text-text-secondary text-[11px] space-y-1">
                <span className="font-bold text-accent-secondary flex items-center gap-1 font-mono">
                  <ShieldAlert className="size-3.5" /> Dedicated Wallet Protection
                </span>
                <p>
                  This PIN/Password is specifically used to authorize sending coins from your wallet. It is separate from your account login password.
                </p>
              </div>

              {/* Current Password Field (only if updating) */}
              {hasWalletPassword && (
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider font-mono">
                    Current Wallet PIN / Password
                  </label>
                  <Input
                    type="password"
                    name="current_wallet_pin"
                    autoComplete="off"
                    placeholder="Enter current wallet password"
                    value={oldPasswordInput}
                    onChange={(e) => setOldPasswordInput(e.target.value)}
                    className="bg-bg-elevated border-border-subtle text-text-primary placeholder:text-text-muted/60 text-xs h-10 font-mono"
                  />
                </div>
              )}

              {/* New Password Field */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider font-mono">
                  {hasWalletPassword ? "New Wallet PIN / Password" : "Create Wallet PIN / Password"}
                </label>
                <Input
                  type="password"
                  name="new_wallet_pin"
                  autoComplete="new-password"
                  placeholder="Min 4 characters or digits"
                  value={newPasswordInput}
                  onChange={(e) => setNewPasswordInput(e.target.value)}
                  className="bg-bg-elevated border-border-subtle text-text-primary placeholder:text-text-muted/60 text-xs h-10 font-mono"
                />
              </div>

              {/* Confirm Password Field (only on initial setup) */}
              {!hasWalletPassword && (
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider font-mono">
                    Confirm Wallet PIN / Password
                  </label>
                  <Input
                    type="password"
                    name="confirm_wallet_pin"
                    autoComplete="new-password"
                    placeholder="Re-enter wallet password"
                    value={confirmPasswordInput}
                    onChange={(e) => setConfirmPasswordInput(e.target.value)}
                    className="bg-bg-elevated border-border-subtle text-text-primary placeholder:text-text-muted/60 text-xs h-10 font-mono"
                  />
                </div>
              )}

              <div className="pt-2 flex gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsPasswordModalOpen(false)}
                  className="flex-1 bg-bg-elevated hover:bg-bg-elevated/80 border border-border-subtle text-text-secondary text-xs h-10 rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSavingPassword || !newPasswordInput.trim()}
                  className="flex-1 btn-premium-primary text-xs h-10 rounded-xl flex items-center justify-center gap-2"
                >
                  {isSavingPassword ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Save Wallet PIN</span>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* WITHDRAW EARNINGS MODAL */}
      <WithdrawEarningsModal
        isOpen={isWithdrawModalOpen}
        onClose={() => setIsWithdrawModalOpen(false)}
        creatorEarnings={creatorEarnings}
        userCoins={balance}
        userRole={userRole}
        existingPayoutDetails={payoutDetails}
        onSuccess={() => {
          fetchWalletInfo();
          if (onCoinsUpdated) onCoinsUpdated();
        }}
      />

      {/* COIN CONVERTER MODAL */}
      <CoinConverterModal
        isOpen={showCoinConverter}
        onClose={() => setShowCoinConverter(false)}
        currentBalance={balance}
        onSuccess={() => {
          fetchWalletInfo();
          if (onCoinsUpdated) onCoinsUpdated();
        }}
      />

      {/* BECOME TEACHER MODAL */}
      <BecomeTeacherModal
        isOpen={showBecomeTeacherModal}
        onClose={() => setShowBecomeTeacherModal(false)}
        onSuccess={() => {
          fetchWalletInfo();
        }}
      />
    </div>
  );
}
