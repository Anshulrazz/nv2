import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blogs",
  description: "Browse public blogs written by Notexia members. Discover insights, research, and stories from learners worldwide.",
  alternates: { canonical: "https://notexia.in/blogs" },
  robots: { index: false, follow: false },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
