import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Forums",
  description: "Join discussions, upvote answers, and share your expertise in the Notexia Q&A forums.",
  alternates: { canonical: "https://notexia.in/forums" },
  robots: { index: false, follow: false },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
