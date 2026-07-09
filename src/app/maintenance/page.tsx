import React from "react";
import { Hammer } from "lucide-react";

export default function MaintenancePage() {
  return (
    <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center text-center p-6 select-none relative overflow-hidden">
      {/* Background grid */}
      <div className="absolute inset-0 cyber-grid opacity-30 pointer-events-none" />
      {/* Ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-cyan-500/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="space-y-6 relative z-10 max-w-sm">
        <div className="h-16 w-16 bg-neutral-900 border border-neutral-800 rounded-2xl flex items-center justify-center text-cyan-400 mx-auto animate-bounce shadow-lg">
          <Hammer className="h-7 w-7" />
        </div>

        <div className="space-y-2">
          <h1
            className="text-xl font-bold text-neutral-100 tracking-tight"
            style={{ fontFamily: "var(--font-space-grotesk)" }}
          >
            System Under Maintenance
          </h1>
          <p className="text-xs text-neutral-500 leading-relaxed">
            Notexia is currently undergoing scheduled platform upgrades and database migrations.
            We will be back online shortly. Thank you for your patience!
          </p>
        </div>
      </div>
    </div>
  );
}
