import type { Metadata } from "next";
import { constructSeoMetadata } from "@/lib/seo/metadata";
import { buildBreadcrumbSchema } from "@/lib/seo/jsonld";

export const metadata: Metadata = constructSeoMetadata({
  title: "Student Competitions, Hackathons & Academic Events | Notexia",
  description:
    "Participate in student hackathons, academic coding arenas, research competitions, and live webinars hosted on Notexia.",
  path: "/events",
  keywords: [
    "student competitions",
    "student hackathons",
    "academic events",
    "coding competition for students",
    "engineering hackathons India",
    "college events",
    "student webinars",
  ],
});

const breadcrumbs = [
  { name: "Home", item: "/" },
  { name: "Events", item: "/events" },
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
