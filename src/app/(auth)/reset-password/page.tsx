import { Metadata } from "next";
import { Suspense } from "react";
import ResetPasswordClient from "./ResetPasswordClient";
import { Loader2 } from "lucide-react";

export const metadata: Metadata = {
  title: "Set New Password | Notexia",
  description: "Reset your Notexia account password securely.",
};

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#0A0806] text-[#FAFAF8] gap-2">
          <Loader2 className="h-6 w-6 animate-spin text-[#F5B429]" />
          <span className="text-xs font-mono">Loading password reset...</span>
        </div>
      }
    >
      <ResetPasswordClient />
    </Suspense>
  );
}
