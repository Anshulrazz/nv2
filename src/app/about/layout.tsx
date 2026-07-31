import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Us | Notexia - Smart Notes & AI Doubt Solving Platform",
  description:
    "Learn about Notexia's mission to revolutionize student learning across India with AI-powered notes, instant doubt resolution, peer study groups, and free academic tools.",
  alternates: { canonical: "https://notexia.in/about" },
  openGraph: {
    title: "About Us | Notexia",
    description:
      "Learn about Notexia's mission to revolutionize student learning across India with AI-powered notes, instant doubt resolution, and study communities.",
    url: "https://notexia.in/about",
  },
};

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
