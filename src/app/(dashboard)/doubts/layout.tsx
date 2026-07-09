import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Doubts",
  description: "Post your academic questions and get answers from the Notexia community. Collaborative doubt-solving made easy.",
  alternates: { canonical: "https://notexia.in/doubts" },
  robots: { index: false, follow: false },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
