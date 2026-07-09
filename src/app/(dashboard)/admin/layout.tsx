import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin Panel",
  description: "Notexia administration dashboard for managing users, content moderation, and site settings.",
  alternates: { canonical: "https://notexia.in/admin" },
  robots: { index: false, follow: false },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
