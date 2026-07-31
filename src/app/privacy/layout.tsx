import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | Data Encryption & Student Rights | Notexia",
  description:
    "Read Notexia's Privacy Policy to learn how we encrypt student credentials, study notes, AI doubt resolution queries, and platform data under global privacy standards.",
  alternates: { canonical: "https://notexia.in/privacy" },
  openGraph: {
    title: "Privacy Policy | Notexia",
    description:
      "Learn how Notexia protects student privacy, encrypts notes, and handles account data.",
    url: "https://notexia.in/privacy",
  },
};

export default function PrivacyLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
