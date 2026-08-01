import React from "react";
import { Loader2, Sparkles } from "lucide-react";

export default function GlobalLoading() {
  return (
    <div className="fixed inset-0 z-50 bg-[#030305] flex flex-col items-center justify-center p-6 text-zinc-100 select-none overflow-hidden antialiased">
      {/* Ambient background glow orbs */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/3 w-[400px] h-[400px] bg-cyan-500/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center space-y-6 text-center max-w-sm w-full">
        {/* Animated Brand Emblem */}
        <div className="relative flex items-center justify-center">
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-amber-500 to-cyan-500 blur-xl opacity-40 animate-pulse" />
          <div className="relative h-16 w-16 rounded-2xl bg-zinc-900 border border-white/15 flex items-center justify-center shadow-2xl">
            <img src="/logo.png" alt="Notexia" className="h-9 w-auto object-contain animate-bounce" />
          </div>
        </div>

        {/* Loading Spinner & Status Text */}
        <div className="space-y-2">
          <h2
            className="text-lg font-bold text-white tracking-wider uppercase flex items-center justify-center gap-2"
            style={{ fontFamily: "var(--font-space-grotesk)" }}
          >
            <span>NOTEXIA</span>
            <Sparkles className="size-4 text-amber-400 animate-spin" />
          </h2>
          <div className="flex items-center justify-center gap-2 text-xs font-mono text-zinc-400">
            <Loader2 className="size-3.5 animate-spin text-amber-400" />
            <span>Loading workspace...</span>
          </div>
        </div>

        {/* Skeleton Shimmer Bar */}
        <div className="w-48 h-1.5 bg-zinc-900 rounded-full overflow-hidden border border-white/10 relative">
          <div className="absolute inset-y-0 w-1/2 bg-gradient-to-r from-transparent via-amber-400 to-transparent animate-pulse rounded-full" />
        </div>
      </div>
    </div>
  );
}
