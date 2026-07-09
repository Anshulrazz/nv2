import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Notifications",
  description: "Stay updated on likes, comments, follows, and direct messages from the Notexia community.",
  alternates: { canonical: "https://notexia.in/notifications" },
  robots: { index: false, follow: false },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
