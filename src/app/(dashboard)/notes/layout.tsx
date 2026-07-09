import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Notes",
  description: "Write, organize, and publish your notes with a rich text editor, PDF viewer, and snapshot versioning on Notexia.",
  alternates: { canonical: "https://notexia.in/notes" },
  robots: { index: false, follow: false },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
