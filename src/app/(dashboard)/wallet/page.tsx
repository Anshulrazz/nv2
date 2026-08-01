import React from "react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/models/User";
import { WalletSection } from "@/components/wallet/WalletSection";
import { ArrowLeft, Wallet, Sparkles, ShieldCheck } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "My Wallet & Coin Ledger | Notexia",
  description: "Manage your Notexia activity coins, creator earnings, payouts, and coin transactions securely.",
};

export default async function WalletPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  await connectToDatabase();
  const dbUser = await User.findById(session.user.id).select("name email role coins creatorEarnings").lean();

  if (!dbUser) {
    redirect("/login");
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-[#030305] text-zinc-100 overflow-y-auto antialiased relative selection:bg-amber-500/30 selection:text-amber-200">
      {/* Background Ambient Mesh Glow Orbs */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 right-1/4 w-[600px] h-[400px] bg-amber-500/10 rounded-full blur-[150px]" />
        <div className="absolute bottom-0 left-1/3 w-[500px] h-[350px] bg-emerald-500/10 rounded-full blur-[140px]" />
      </div>

      {/* Header */}
      <div className="p-6 sm:p-10 max-w-6xl w-full mx-auto space-y-6 z-10 relative">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
          <div className="space-y-1">
            <Link
              href="/dashboard"
              className="text-xs font-mono text-amber-400 hover:text-amber-300 flex items-center gap-2 font-bold uppercase tracking-widest transition-colors mb-2"
            >
              <ArrowLeft className="size-4" /> Back to Dashboard
            </Link>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <Wallet className="size-5" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2" style={{ fontFamily: "var(--font-space-grotesk)" }}>
                  Digital Wallet &amp; Ledger
                </h1>
                <p className="text-xs text-zinc-400 font-mono">
                  Manage your platform activity coins, educator payouts &amp; security PIN
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto bg-zinc-900/60 border border-white/10 px-3.5 py-1.5 rounded-full text-xs font-mono text-zinc-300">
            <ShieldCheck className="size-4 text-emerald-400" />
            <span>256-Bit Ledger Encryption</span>
          </div>
        </div>

        {/* Main Wallet Content */}
        <WalletSection />
      </div>
    </div>
  );
}
