import type { Metadata } from "next";
import { constructSeoMetadata } from "@/lib/seo/metadata";
import { buildBreadcrumbSchema } from "@/lib/seo/jsonld";

export const metadata: Metadata = constructSeoMetadata({
  title: "Student Blogs & Educational Articles | Notexia",
  description:
    "Read public student blogs, educational articles, research notes, and study insights written by scholars and educators on Notexia.",
  path: "/blogs",
  keywords: [
    "student blogs",
    "educational blogs",
    "academic blog",
    "research papers",
    "student research papers",
    "educational articles",
    "study guides",
    "JEE NEET preparation blogs",
    "engineering blogs",
  ],
});

const breadcrumbs = [
  { name: "Home", item: "/" },
  { name: "Blogs", item: "/blogs" },
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
