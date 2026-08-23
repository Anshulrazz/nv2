import React from "react";
import { Hammer } from "lucide-react";

export default function MaintenancePage() {
  return (
    <div className="min-h-screen bg-[#0A0806] flex flex-col items-center justify-center text-center p-6 select-none relative overflow-hidden glowing-bg">
      {/* Ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#F5B429]/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="space-y-6 relative z-10 max-w-sm">
        <div className="h-16 w-16 bg-[#150F0B] border border-[#2E2118] rounded-2xl flex items-center justify-center text-[#F5B429] mx-auto animate-bounce shadow-[0_0_30px_rgba(245,180,41,0.2)]">
          <Hammer className="h-7 w-7" />
        </div>

        <div className="space-y-2">
          <h1
            className="text-xl font-bold text-[#FAFAF8] tracking-tight font-display"
          >
            System Under Maintenance
          </h1>
          <p className="text-xs text-[#8A8078] leading-relaxed">
            Notexia is currently undergoing scheduled platform upgrades and database migrations.
            We will be back online shortly. Thank you for your patience!
          </p>
        </div>
      </div>
    </div>
  );
}
