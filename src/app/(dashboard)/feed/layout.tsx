import type { Metadata } from "next";
import { buildBreadcrumbSchema } from "@/lib/seo/jsonld";

export const metadata: Metadata = {
  title: "Public Study Notes, Research Papers & Academic Articles",
  description: "Browse verified student study notes, research papers, and technical articles on Notexia. Explore formula sheets, code blueprints, and peer insights.",
  alternates: { canonical: "https://notexia.in/feed" },
  openGraph: {
    title: "Public Study Notes, Research Papers & Academic Articles | Notexia",
    description: "Browse verified student study notes, research papers, and technical articles on Notexia.",
    url: "https://notexia.in/feed",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Public Study Notes, Research Papers & Academic Articles | Notexia",
    description: "Browse verified student study notes and research papers on Notexia.",
  },
};

const breadcrumbs = [
  { name: "Home", item: "/" },
  { name: "Public Feed", item: "/feed" },
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
