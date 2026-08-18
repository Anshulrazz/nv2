import type { Metadata } from "next";
import { constructSeoMetadata } from "@/lib/seo/metadata";
import { buildBreadcrumbSchema } from "@/lib/seo/jsonld";

export const metadata: Metadata = constructSeoMetadata({
  title: "Online Courses & Learning Resources for Students | Notexia",
  description:
    "Discover online academic courses, structured video lessons, and interactive study modules for engineering, JEE, NEET, GATE, and university exams on Notexia.",
  path: "/courses",
  keywords: [
    "online courses for students",
    "student learning platform",
    "engineering courses",
    "JEE online preparation",
    "NEET online learning",
    "GATE course modules",
    "BTech online lectures",
    "educational resources",
  ],
});

const breadcrumbs = [
  { name: "Home", item: "/" },
  { name: "Courses", item: "/courses" },
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
