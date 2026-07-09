import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Research",
  description: "Explore curated research tools, academic resources, and AI-powered knowledge discovery on Notexia.",
  alternates: { canonical: "https://notexia.in/research" },
  robots: { index: false, follow: false },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
