import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Community Guidelines | Academic Integrity & Conduct | Notexia",
  description:
    "Review Notexia's Community Guidelines. Read our standards for peer respect, academic integrity, anti-cheating rules, spam prohibition, and account safety.",
  alternates: { canonical: "https://notexia.in/community-guidelines" },
  openGraph: {
    title: "Community Guidelines | Notexia",
    description:
      "Learn about Notexia's academic integrity standards, peer conduct rules, and community moderation policies.",
    url: "https://notexia.in/community-guidelines",
  },
};

export default function CommunityGuidelinesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
