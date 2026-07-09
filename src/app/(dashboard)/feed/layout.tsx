import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Public Feed",
  description: "Discover published notes and articles shared by the Notexia community. Like, comment, and explore knowledge.",
  alternates: { canonical: "https://notexia.in/feed" },
  robots: { index: false, follow: false },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
