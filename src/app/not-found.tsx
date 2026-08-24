import Link from "next/link";
import type { Metadata } from "next";
import { NotexiaLogo } from "@/components/common/NotexiaLogo";

export const metadata: Metadata = {
  title: "404 — Page Not Found | Notexia",
  description: "The page you are looking for could not be found.",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#0A0806] text-[#FAFAF8] flex flex-col items-center justify-center p-6 select-none relative overflow-hidden antialiased glowing-bg">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#F5B429]/10 rounded-full blur-[140px]" />
      </div>

      <div className="relative z-10 text-center max-w-md w-full space-y-6">
        <div className="flex items-center justify-center mb-4">
          <Link href="/">
            <NotexiaLogo size="lg" />
          </Link>
        </div>

        <div className="text-7xl font-extrabold font-display text-[#F5B429] tracking-tight">
          404
        </div>

        <div className="space-y-2">
          <h1 className="text-xl font-bold text-[#FAFAF8] font-display">
            Page Not Found
          </h1>
          <p className="text-xs text-[#8A8078] font-light leading-relaxed">
            The page you are looking for does not exist, has been removed, or has moved to another address.
          </p>
        </div>

        <div className="flex items-center justify-center gap-3 pt-2">
          <Link
            href="/"
            className="rounded-full bg-gradient-to-br from-[#F7C948] to-[#F5941D] text-[#150F0B] font-bold text-xs px-6 py-2.5 inline-flex items-center justify-center transition-all shadow-[0_0_15px_rgba(245,180,41,0.25)]"
          >
            Go Home
          </Link>
          <Link
            href="/dashboard"
            className="rounded-full bg-[#150F0B] hover:bg-[#241811] text-[#FAFAF8] border border-[#2E2118] font-bold text-xs px-6 py-2.5 inline-flex items-center justify-center transition-all"
          >
            Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}

