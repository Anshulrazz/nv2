import type { Metadata } from "next";
import { constructSeoMetadata } from "@/lib/seo/metadata";
import { buildBreadcrumbSchema } from "@/lib/seo/jsonld";

export const metadata: Metadata = constructSeoMetadata({
  title: "Student Community & Online Study Groups | Notexia",
  description:
    "Join the Notexia student community — collaborate with peers across India, form online study groups, share study resources, and participate in academic discussions.",
  path: "/community",
  keywords: [
    "student community",
    "online student community",
    "study community for students",
    "student collaboration platform",
    "study groups online",
    "peer learning platform",
    "student knowledge sharing",
    "college student community",
    "university student community",
    "Indian student network",
  ],
});

const breadcrumbs = [
  { name: "Home", item: "/" },
  { name: "Community", item: "/community" },
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
