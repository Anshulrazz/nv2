import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Refund & Cancellation Policy | Notexia Premium",
  description:
    "Read Notexia's Refund and Cancellation Policy. Learn about our 7-day money-back guarantee for Premium plans, coin purchase policies, and refund processing timelines.",
  alternates: { canonical: "https://notexia.in/refund-policy" },
  openGraph: {
    title: "Refund & Cancellation Policy | Notexia",
    description:
      "Review Notexia's refund guarantee, subscription cancellation terms, and digital token policies.",
    url: "https://notexia.in/refund-policy",
  },
};

export default function RefundLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
