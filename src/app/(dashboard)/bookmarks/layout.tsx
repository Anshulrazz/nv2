import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Bookmarks",
  description: "Access all your saved notes, blogs, and posts in one place. Never lose track of important content.",
  alternates: { canonical: "https://notexia.in/bookmarks" },
  robots: { index: false, follow: false },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
