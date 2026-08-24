import React from "react";
import { Loader2 } from "lucide-react";
import { NotexiaLogo } from "@/components/common/NotexiaLogo";

export default function GlobalLoading() {
  return (
    <div className="fixed inset-0 z-50 bg-[#0A0806] flex flex-col items-center justify-center p-6 text-[#FAFAF8] select-none overflow-hidden antialiased">
      {/* Minimal ambient glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-[#F5B429]/10 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 flex flex-col items-center space-y-5 text-center max-w-sm w-full">
        {/* Brand Emblem */}
        <div className="flex items-center justify-center mb-1">
          <NotexiaLogo size="lg" />
        </div>

        {/* Wordmark + spinner */}
        <div className="space-y-2">
          <div className="flex items-center justify-center gap-2 text-xs font-mono text-[#8A8078]">
            <Loader2 className="size-3.5 animate-spin text-[#F5B429]" />
            <span>Loading workspace...</span>
          </div>
        </div>

        {/* Progress shimmer bar */}
        <div className="w-32 h-1 bg-muted rounded-full overflow-hidden">
          <div className="h-full w-1/2 bg-primary/60 rounded-full animate-pulse" />
        </div>
      </div>
    </div>
  );
}
