import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service & User Agreement | Notexia",
  description:
    "Read Notexia's Terms of Service and User Agreement. Review account rules, acceptable academic conduct, intellectual property rights, coin economy, and platform terms.",
  alternates: { canonical: "https://notexia.in/terms" },
  openGraph: {
    title: "Terms of Service | Notexia",
    description:
      "Review Notexia's platform terms, user agreement, and academic conduct guidelines.",
    url: "https://notexia.in/terms",
  },
};

export default function TermsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
