import React from "react";
import { Loader2, Sparkles } from "lucide-react";

export default function DashboardLoading() {
  return (
    <div className="flex-1 flex flex-col h-full bg-[#030305] text-zinc-100 overflow-hidden antialiased p-4 sm:p-8 lg:p-10 space-y-8 relative">
      {/* Background Ambient Glow Orbs */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 right-1/4 w-[500px] h-[350px] bg-cyan-500/10 rounded-full blur-[140px]" />
        <div className="absolute bottom-0 left-1/3 w-[450px] h-[300px] bg-amber-500/10 rounded-full blur-[130px]" />
      </div>

      {/* Header Skeleton */}
      <div className="relative z-10 flex items-center justify-between border-b border-white/10 pb-6">
        <div className="space-y-2">
          <div className="h-4 w-32 bg-zinc-900 border border-white/10 rounded-md animate-pulse" />
          <div className="h-8 w-56 bg-zinc-900 border border-white/10 rounded-xl animate-pulse" />
        </div>
        <div className="flex items-center gap-2">
          <Loader2 className="size-5 text-amber-400 animate-spin" />
          <span className="text-xs font-mono text-zinc-400 hidden sm:inline">Syncing Dashboard...</span>
        </div>
      </div>

      {/* Bento Grid Skeletons */}
      <div className="relative z-10 space-y-6">
        {/* Top 4 Stat Cards Skeleton */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-28 rounded-2xl bg-zinc-900/60 border border-white/10 p-4 flex flex-col justify-between animate-pulse"
            >
              <div className="h-3 w-16 bg-white/10 rounded" />
              <div className="h-7 w-24 bg-white/10 rounded-lg" />
            </div>
          ))}
        </div>

        {/* Main Content Area Skeletons */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-36 rounded-2xl bg-zinc-900/40 border border-white/10 p-5 space-y-3 animate-pulse"
              >
                <div className="h-4 w-1/3 bg-white/10 rounded" />
                <div className="h-3 w-3/4 bg-white/5 rounded" />
                <div className="h-3 w-1/2 bg-white/5 rounded" />
              </div>
            ))}
          </div>

          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="h-48 rounded-2xl bg-zinc-900/40 border border-white/10 p-5 space-y-4 animate-pulse"
              >
                <div className="h-4 w-1/2 bg-white/10 rounded" />
                <div className="h-20 bg-white/5 rounded-xl" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
