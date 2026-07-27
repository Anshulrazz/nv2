import type { Metadata } from "next";
import { buildBreadcrumbSchema } from "@/lib/seo/jsonld";

export const metadata: Metadata = {
  title: "Student Batch Leaderboard & Academic Contribution Ranks",
  description: "View top student contributors, research rankings, and activity points on Notexia's gamified study leaderboard.",
  alternates: { canonical: "https://notexia.in/leaderboard" },
  openGraph: {
    title: "Student Batch Leaderboard & Academic Contribution Ranks | Notexia",
    description: "View top student contributors and activity rankings on Notexia.",
    url: "https://notexia.in/leaderboard",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Student Batch Leaderboard & Academic Contribution Ranks | Notexia",
    description: "View top student contributors and activity rankings on Notexia.",
  },
};

const breadcrumbs = [
  { name: "Home", item: "/" },
  { name: "Leaderboard", item: "/leaderboard" },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildBreadcrumbSchema(breadcrumbs)) }}
      />
      {children}
    </>
  );
}
