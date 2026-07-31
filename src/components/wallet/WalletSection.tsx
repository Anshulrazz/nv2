import React, { useEffect, useState, useCallback } from "react";
import {
  Wallet as WalletIcon,
  Copy,
  Check,
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

import { WithdrawEarningsModal } from "./WithdrawEarningsModal";
import { CoinConverterModal } from "./CoinConverterModal";

interface TransactionItem {
  id: string;
  type: "referral_bonus" | "signup_bonus" | "transfer" | "premium_purchase" | "admin_adjustment" | "creator_withdrawal";
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
  const [balance, setBalance] = useState<number>(0);
  const [creatorEarnings, setCreatorEarnings] = useState<number>(0);
  const [payoutDetails, setPayoutDetails] = useState<{
    upiId?: string;
    bankAccount?: string;
    ifscCode?: string;
    accountHolderName?: string;
  }>({});
  const [hasWalletPassword, setHasWalletPassword] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedAddress, setCopiedAddress] = useState(false);

  // Withdraw Modal State
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [showCoinConverter, setShowCoinConverter] = useState(false);

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

  const handleCopyAddress = () => {
    if (!address) return;
    navigator.clipboard.writeText(address);
    setCopiedAddress(true);
    toast.success("Wallet address copied to clipboard!");
    setTimeout(() => setCopiedAddress(false), 2000);
  };

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
      {/* TWO SEPARATE BALANCE CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* CARD 1: WITHDRAWABLE CREATOR EARNINGS */}
        <div className="rounded-2xl bg-gradient-to-br from-[#1A2D23] via-[#16261D] to-[#121F18] border border-emerald-500/30 p-5 sm:p-6 shadow-2xl relative overflow-hidden flex flex-col justify-between space-y-4">
          <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="space-y-3 relative z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-bold">
                  ₹
                </div>
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider font-mono">
                  Withdrawable Creator Earnings
                </span>
              </div>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                WITHDRAWABLE CASH
              </span>
            </div>

            <div>
              <span className="text-xs text-[#9FAEA1]">70% Course Sales &amp; Project Revenue</span>
              <div className="flex items-baseline gap-2 mt-1">
                <h2 className="text-3xl font-black text-emerald-400 font-heading tracking-tight">
                  {isLoading ? "..." : creatorEarnings.toLocaleString()}
                </h2>
                <span className="text-xs font-bold text-[#F3F0E4] font-mono uppercase">
                  Coins (₹{creatorEarnings})
                </span>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-[#F3F0E4]/10 relative z-10 flex items-center justify-between">
            <span className="text-[11px] text-[#9FAEA1] font-light">
              Only Creator Earnings can be withdrawn to bank/UPI.
            </span>
            <Button
              onClick={() => setIsWithdrawModalOpen(true)}
              className="h-9 px-4 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs rounded-xl shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all shrink-0 font-heading"
            >
              Withdraw Cash
            </Button>
          </div>
        </div>

        {/* CARD 2: NOTEXIA ACTIVITY COINS (NON-WITHDRAWABLE) */}
        <div className="rounded-2xl bg-gradient-to-br from-[#121F18] via-[#16261D] to-[#1A2D23] border border-[#F3F0E4]/15 p-5 sm:p-6 shadow-2xl relative overflow-hidden flex flex-col justify-between space-y-4">
          <div className="absolute top-0 right-0 w-48 h-48 bg-[#F0C93B]/10 rounded-full blur-3xl pointer-events-none" />

          <div className="space-y-3 relative z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-[#F0C93B]/15 border border-[#F0C93B]/30 flex items-center justify-center text-[#F0C93B]">
                  <WalletIcon className="h-4 w-4" />
                </div>
                <span className="text-xs font-bold text-[#9FAEA1] uppercase tracking-wider font-mono">
                  Activity Coins (Non-Withdrawable)
                </span>
              </div>
              <span className="text-[10px] font-mono text-[#F0C93B] bg-[#F0C93B]/10 px-2.5 py-0.5 rounded-full border border-[#F0C93B]/30">
                PLATFORM TOKENS
              </span>
            </div>

            <div>
              <span className="text-xs text-[#9FAEA1]">Referrals, Signups &amp; Activity Tokens</span>
              <div className="flex flex-wrap items-center gap-2.5 mt-1">
                <h2 className="text-3xl font-black text-[#F0C93B] font-heading tracking-tight">
                  {isLoading ? "..." : balance.toLocaleString()}
                </h2>
                <span className="text-xs font-bold text-[#F3F0E4] font-mono uppercase">
                  Coins
                </span>

                <button
                  type="button"
                  onClick={() => setShowCoinConverter(true)}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-[#2A2118] bg-[#F0C93B] hover:bg-[#F0C93B]/90 px-3 py-1 rounded-full border border-[#F0C93B]/50 transition-all font-heading shadow-md active:scale-95 ml-1"
                >
                  <Plus className="size-3.5" />
                  <span>Convert / Buy</span>
                </button>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-[#F3F0E4]/10 relative z-10 flex items-center justify-between gap-2">
            <Button
              onClick={() => setIsPasswordModalOpen(true)}
              variant="outline"
              className="h-9 px-3 bg-[#121F18] hover:bg-[#1F362A] border-[#F3F0E4]/20 text-[#F3F0E4] hover:text-[#F0C93B] font-bold text-xs rounded-xl transition-all"
            >
              <KeyRound className="h-3.5 w-3.5 text-[#F0C93B] mr-1" />
              <span>{hasWalletPassword ? "PIN" : "Set PIN"}</span>
            </Button>

            <Button
              onClick={handleOpenSendModal}
              className="h-9 px-4 bg-[#F0C93B] hover:bg-[#F0C93B]/90 text-[#2A2118] font-bold text-xs rounded-xl shadow-[0_0_15px_rgba(240,201,59,0.25)] transition-all flex items-center gap-1.5 font-heading"
            >
              <Send className="h-3.5 w-3.5" />
              <span>Send Coins</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Transaction History Ledger */}
      <div className="rounded-2xl bg-[#121F18]/90 border border-[#F3F0E4]/15 p-5 sm:p-6 space-y-4 shadow-xl">
        <div className="flex items-center justify-between border-b border-[#F3F0E4]/10 pb-3">
          <div className="flex items-center gap-2">
            <History className="h-4 w-4 text-[#F0C93B]" />
            <h3 className="text-xs sm:text-sm font-bold text-[#F3F0E4] font-heading tracking-wide uppercase">
              Coin Transaction Ledger
            </h3>
          </div>

          <Button
            size="icon"
            variant="ghost"
            onClick={() => fetchTransactions(page)}
            className="h-7 w-7 text-[#9FAEA1] hover:text-[#F3F0E4] rounded-lg"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLedgerLoading ? "animate-spin" : ""}`} />
          </Button>
        </div>

        {isLedgerLoading && transactions.length === 0 ? (
          <div className="py-12 text-center text-xs text-[#9FAEA1] flex items-center justify-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin text-[#F0C93B]" />
            <span>Fetching ledger audit records...</span>
          </div>
        ) : transactions.length === 0 ? (
          <div className="py-12 text-center text-xs text-[#9FAEA1] space-y-1">
            <p>No coin transactions recorded yet.</p>
            <p className="text-[10px] text-[#9FAEA1]/60">Earn coins via referrals or send coins to friends!</p>
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
                  className="p-3 rounded-xl bg-[#16261D] border border-[#F3F0E4]/10 flex items-center justify-between gap-3 hover:border-[#F3F0E4]/20 transition-all"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 border ${
                        isCredit
                          ? "bg-[#1F362A] border-[#F0C93B]/30 text-[#F0C93B]"
                          : "bg-red-500/10 border-red-500/30 text-red-400"
                      }`}
                    >
                      {tx.type === "referral_bonus" ? (
                        <Gift className="h-4 w-4" />
                      ) : tx.type === "premium_purchase" ? (
                        <Crown className="h-4 w-4 text-[#F0C93B]" />
                      ) : isCredit ? (
                        <ArrowDownLeft className="h-4 w-4" />
                      ) : (
                        <ArrowUpRight className="h-4 w-4" />
                      )}
                    </div>

                    <div className="min-w-0 space-y-0.5">
                      <p className="text-xs font-bold text-[#F3F0E4] truncate">
                        {tx.type === "referral_bonus"
                          ? "Referral Reward Bonus"
                          : tx.type === "premium_purchase"
                          ? `Premium Subscription (${tx.metadata?.plan || "Upgrade"})`
                          : tx.type === "signup_bonus"
                          ? "Welcome Signup Bonus"
                          : isCredit
                          ? `Received from ${tx.counterpartyName}`
                          : `Sent to ${tx.counterpartyName}`}
                      </p>
                      <p className="text-[10px] text-[#9FAEA1] font-mono truncate">
                        {dateStr} {tx.metadata?.note ? `• ${tx.metadata.note}` : ""}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span
                      className={`text-sm font-black font-mono ${
                        isCredit ? "text-[#F0C93B]" : "text-red-400"
                      }`}
                    >
                      {isCredit ? `+${tx.amount}` : `-${tx.amount}`}
                    </span>
                    <span className="block text-[9px] text-[#9FAEA1] uppercase font-mono">
                      {tx.status}
                    </span>
                  </div>
                </div>
              );
            })}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-3 border-t border-[#F3F0E4]/10 text-xs text-[#9FAEA1]">
                <span>Page {page} of {totalPages}</span>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={page <= 1}
                    onClick={() => fetchTransactions(page - 1)}
                    className="h-7 px-2 text-xs hover:bg-[#1F362A] text-[#F3F0E4]"
                  >
                    Previous
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={page >= totalPages}
                    onClick={() => fetchTransactions(page + 1)}
                    className="h-7 px-2 text-xs hover:bg-[#1F362A] text-[#F3F0E4]"
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
          <div className="w-full max-w-md bg-[#121F18] border border-[#F3F0E4]/20 rounded-2xl p-5 sm:p-6 space-y-5 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-[#F3F0E4]/10 pb-3">
              <div className="flex items-center gap-2">
                <Send className="h-4 w-4 text-[#F0C93B]" />
                <h3 className="text-sm font-bold text-[#F3F0E4] font-heading">
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
                className="h-7 w-7 text-[#9FAEA1] hover:text-[#F3F0E4] rounded-lg"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {!showConfirmStep ? (
              <div className="space-y-4 text-xs">
                {/* Address Input */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-[#9FAEA1] uppercase tracking-wider font-mono">
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
                      className="bg-[#1A2D23] border-[#F3F0E4]/15 text-[#F3F0E4] placeholder-[#9FAEA1]/40 text-xs h-10 font-mono pr-8"
                    />
                    {resolvingRecipient && (
                      <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-[#F0C93B]" />
                    )}
                  </div>

                  {recipientError && (
                    <p className="text-[10px] text-red-400 font-mono flex items-center gap-1">
                      <AlertCircle className="h-3 w-3 shrink-0" /> {recipientError}
                    </p>
                  )}

                  {resolvedRecipient && (
                    <div className="p-2.5 rounded-xl bg-[#1F362A] border border-[#F0C93B]/30 flex items-center gap-2 text-xs text-[#F3F0E4] animate-fade-in">
                      <ShieldCheck className="h-4 w-4 text-[#F0C93B] shrink-0" />
                      <div className="min-w-0">
                        <span className="text-[10px] text-[#9FAEA1] block">Verified Recipient:</span>
                        <span className="font-bold text-[#F0C93B] truncate block">
                          {resolvedRecipient.name}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Amount Input */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-[10px] font-mono">
                    <label className="font-bold text-[#9FAEA1] uppercase tracking-wider">
                      Amount (Coins)
                    </label>
                    <span className="text-[#9FAEA1]">
                      Balance: <strong className="text-[#F0C93B]">{balance}</strong>
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
                    className="bg-[#1A2D23] border-[#F3F0E4]/15 text-[#F3F0E4] placeholder-[#9FAEA1]/40 text-xs h-10 font-mono"
                  />
                  {isInsufficientBalance && (
                    <p className="text-[10px] text-red-400 font-mono">
                      Entered amount exceeds available balance.
                    </p>
                  )}
                </div>

                {/* Optional Note */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-[#9FAEA1] uppercase tracking-wider font-mono">
                    Note (Optional)
                  </label>
                  <Input
                    type="text"
                    name="transfer_note"
                    placeholder="What's this transfer for?"
                    value={transferNote}
                    onChange={(e) => setTransferNote(e.target.value)}
                    className="bg-[#1A2D23] border-[#F3F0E4]/15 text-[#F3F0E4] placeholder-[#9FAEA1]/40 text-xs h-10"
                  />
                </div>

                <div className="pt-2 flex gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setIsSendModalOpen(false)}
                    className="flex-1 bg-[#16261D] hover:bg-[#1F362A] text-[#9FAEA1] text-xs h-10 rounded-xl"
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
                    className="flex-1 bg-[#F0C93B] hover:bg-[#F0C93B]/90 text-[#2A2118] font-bold text-xs h-10 rounded-xl disabled:opacity-40"
                  >
                    Review Transfer
                  </Button>
                </div>
              </div>
            ) : (
              /* Confirmation Step */
              <div className="space-y-4 text-xs animate-fade-in">
                <div className="p-4 rounded-xl bg-[#1A2D23] border border-[#F0C93B]/30 space-y-3">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-[#9FAEA1] font-mono block">
                    Transfer Summary
                  </span>

                  <div className="space-y-1.5 border-b border-[#F3F0E4]/10 pb-3">
                    <div className="flex justify-between">
                      <span className="text-[#9FAEA1]">Sending to:</span>
                      <span className="font-bold text-[#F3F0E4]">{resolvedRecipient?.name}</span>
                    </div>
                    <div className="flex justify-between font-mono">
                      <span className="text-[#9FAEA1]">Recipient Address:</span>
                      <span className="text-[#F0C93B]">{resolvedRecipient?.address}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#9FAEA1]">Transfer Amount:</span>
                      <span className="font-black text-[#F0C93B] font-mono">{amountNum} Coins</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#9FAEA1]">Network Fee:</span>
                      <span className="font-bold text-emerald-400 font-mono">0 Coins (Free)</span>
                    </div>
                  </div>

                  <div className="flex justify-between font-bold pt-1">
                    <span className="text-[#F3F0E4]">New Balance After Transfer:</span>
                    <span className="text-[#F0C93B] font-mono">{balance - amountNum} Coins</span>
                  </div>
                </div>

                {/* Dedicated Wallet Security PIN / Password Field */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-[#F0C93B] uppercase tracking-wider font-mono flex items-center gap-1">
                    <Lock className="h-3 w-3" /> Wallet PIN / Security Password
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
                    className="bg-[#1A2D23] border-[#F0C93B]/40 text-[#F3F0E4] placeholder-[#9FAEA1]/40 text-xs h-10 font-mono focus:border-[#F0C93B]"
                  />
                </div>

                <div className="flex gap-2 pt-1">
                  <Button
                    type="button"
                    variant="ghost"
                    disabled={isTransferring}
                    onClick={() => setShowConfirmStep(false)}
                    className="flex-1 bg-[#16261D] hover:bg-[#1F362A] text-[#9FAEA1] text-xs h-10 rounded-xl"
                  >
                    Back
                  </Button>
                  <Button
                    type="button"
                    disabled={isTransferring || !walletPasswordInput.trim()}
                    onClick={handleExecuteTransfer}
                    className="flex-1 bg-[#F0C93B] hover:bg-[#F0C93B]/90 text-[#2A2118] font-bold text-xs h-10 rounded-xl flex items-center justify-center gap-2 disabled:opacity-40"
                  >
                    {isTransferring ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin text-[#2A2118]" />
                        <span>Sending...</span>
                      </>
                    ) : (
                      <>
                        <Send className="h-3.5 w-3.5" />
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
          <div className="w-full max-w-md bg-[#121F18] border border-[#F0C93B]/30 rounded-2xl p-5 sm:p-6 space-y-5 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-[#F3F0E4]/10 pb-3">
              <div className="flex items-center gap-2">
                <KeyRound className="h-4 w-4 text-[#F0C93B]" />
                <h3 className="text-sm font-bold text-[#F3F0E4] font-heading">
                  {hasWalletPassword ? "Change Wallet PIN / Password" : "Set Up Wallet PIN / Password"}
                </h3>
              </div>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setIsPasswordModalOpen(false)}
                className="h-7 w-7 text-[#9FAEA1] hover:text-[#F3F0E4] rounded-lg"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <form onSubmit={handleSaveWalletPassword} className="space-y-4 text-xs">
              <div className="p-3 rounded-xl bg-[#1F362A] border border-[#F0C93B]/20 text-[#9FAEA1] text-[11px] space-y-1">
                <span className="font-bold text-[#F0C93B] flex items-center gap-1 font-mono">
                  <ShieldAlert className="h-3.5 w-3.5" /> Dedicated Wallet Protection
                </span>
                <p>
                  This PIN/Password is specifically used to authorize sending coins from your wallet. It is separate from your account login password.
                </p>
              </div>

              {/* Current Password Field (only if updating) */}
              {hasWalletPassword && (
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-[#9FAEA1] uppercase tracking-wider font-mono">
                    Current Wallet PIN / Password
                  </label>
                  <Input
                    type="password"
                    name="current_wallet_pin"
                    autoComplete="off"
                    placeholder="Enter current wallet password"
                    value={oldPasswordInput}
                    onChange={(e) => setOldPasswordInput(e.target.value)}
                    className="bg-[#1A2D23] border-[#F3F0E4]/15 text-[#F3F0E4] placeholder-[#9FAEA1]/40 text-xs h-10 font-mono"
                  />
                </div>
              )}

              {/* New Password Field */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-[#9FAEA1] uppercase tracking-wider font-mono">
                  {hasWalletPassword ? "New Wallet PIN / Password" : "Create Wallet PIN / Password"}
                </label>
                <Input
                  type="password"
                  name="new_wallet_pin"
                  autoComplete="new-password"
                  placeholder="Min 4 characters or digits"
                  value={newPasswordInput}
                  onChange={(e) => setNewPasswordInput(e.target.value)}
                  className="bg-[#1A2D23] border-[#F3F0E4]/15 text-[#F3F0E4] placeholder-[#9FAEA1]/40 text-xs h-10 font-mono"
                />
              </div>

              {/* Confirm Password Field (only on initial setup) */}
              {!hasWalletPassword && (
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-[#9FAEA1] uppercase tracking-wider font-mono">
                    Confirm Wallet PIN / Password
                  </label>
                  <Input
                    type="password"
                    name="confirm_wallet_pin"
                    autoComplete="new-password"
                    placeholder="Re-enter wallet password"
                    value={confirmPasswordInput}
                    onChange={(e) => setConfirmPasswordInput(e.target.value)}
                    className="bg-[#1A2D23] border-[#F3F0E4]/15 text-[#F3F0E4] placeholder-[#9FAEA1]/40 text-xs h-10 font-mono"
                  />
                </div>
              )}

              <div className="pt-2 flex gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsPasswordModalOpen(false)}
                  className="flex-1 bg-[#16261D] hover:bg-[#1F362A] text-[#9FAEA1] text-xs h-10 rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSavingPassword || !newPasswordInput.trim()}
                  className="flex-1 bg-[#F0C93B] hover:bg-[#F0C93B]/90 text-[#2A2118] font-bold text-xs h-10 rounded-xl flex items-center justify-center gap-2"
                >
                  {isSavingPassword ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin text-[#2A2118]" />
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
    </div>
  );
}
