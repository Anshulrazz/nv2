import type { Metadata } from "next";
import { constructSeoMetadata } from "@/lib/seo/metadata";
import { buildBreadcrumbSchema } from "@/lib/seo/jsonld";

export const metadata: Metadata = constructSeoMetadata({
  title: "Student Batch Leaderboard & Academic Ranks | Notexia",
  description:
    "Explore top student contributors, academic contribution points, and gamified batch rankings on the Notexia leaderboard.",
  path: "/leaderboard",
  keywords: [
    "student leaderboard",
    "batch leaderboard",
    "academic contribution ranks",
    "student contribution points",
    "scholar rankings",
    "gamified learning leaderboard",
  ],
});

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
