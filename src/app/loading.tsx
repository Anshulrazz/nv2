import React from "react";
import { Loader2 } from "lucide-react";

export default function GlobalLoading() {
  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col items-center justify-center p-6 text-foreground select-none overflow-hidden antialiased">
      {/* Minimal ambient glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-primary/8 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 flex flex-col items-center space-y-5 text-center max-w-sm w-full">
        {/* Brand Emblem */}
        <div className="relative flex items-center justify-center">
          <div className="h-14 w-14 rounded-2xl bg-sidebar border border-sidebar-border flex items-center justify-center shadow-xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="Notexia" className="h-8 w-auto object-contain" />
          </div>
        </div>

        {/* Wordmark + spinner */}
        <div className="space-y-2">
          <h2
            className="text-base font-bold text-foreground tracking-widest uppercase"
            style={{ fontFamily: "var(--font-space-grotesk)" }}
          >
            NOTEXIA
          </h2>
          <div className="flex items-center justify-center gap-2 text-xs font-mono text-muted-foreground">
            <Loader2 className="size-3.5 animate-spin text-primary" />
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
