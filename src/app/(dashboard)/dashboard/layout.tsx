import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Your personal Notexia dashboard — recent notes, activity, stats, and quick actions all in one place.",
  alternates: { canonical: "https://notexia.in/dashboard" },
  robots: { index: false, follow: false },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
