import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Messages",
  description: "Send and receive direct messages with other Notexia members in real-time.",
  alternates: { canonical: "https://notexia.in/messages" },
  robots: { index: false, follow: false },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
