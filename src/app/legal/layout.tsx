import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    template: "%s | Legal & Compliance | Notexia",
    default: "Legal Hub & Compliance Center | Notexia",
  },
  description:
    "Review Notexia's legal policies, privacy standards, terms of service, security framework, data retention rules, and grievance redressal officer details.",
  alternates: {
    canonical: "https://notexia.in/legal",
  },
  openGraph: {
    title: "Legal & Compliance Center | Notexia",
    description:
      "Comprehensive terms, privacy policy, AI safety guidelines, security standards, and legal compliance documentation for Notexia users.",
    url: "https://notexia.in/legal",
    siteName: "Notexia",
    type: "website",
  },
};

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen bg-transparent text-[#FAFAF8] overflow-x-hidden antialiased selection:bg-[#F5B429]/30 selection:text-[#FAFAF8]">
      {/* Background Ambient Glow Orbs */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden="true">
        <div className="ambient-glow-orb-1" />
        <div className="ambient-glow-orb-2" />
        <div className="ambient-glow-orb-3" />
      </div>
      <div className="relative z-10 min-h-screen flex flex-col">
        {children}
      </div>
    </div>
  );
}
