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
  return <>{children}</>;
}
