import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Community",
  description: "Share updates, photos, and insights with the Notexia community. Engage with peers through posts and comments.",
  alternates: { canonical: "https://notexia.in/community" },
  robots: { index: false, follow: false },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
