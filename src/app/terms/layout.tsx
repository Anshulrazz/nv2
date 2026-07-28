import type { Metadata } from "next";
import { buildBreadcrumbSchema, buildOrganizationSchema } from "@/lib/seo/jsonld";

export const metadata: Metadata = {
  title: "Terms of Service | Notexia",
  description: "Notexia Terms of Service — Rules, user obligations, academic integrity guidelines, and platform terms governing your use of Notexia.",
  alternates: { canonical: "https://notexia.in/terms" },
  openGraph: {
    title: "Terms of Service | Notexia",
    description: "Read the Terms of Service governing your use of Notexia's study workspace, AI copilot, and community features.",
    url: "https://notexia.in/terms",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Terms of Service | Notexia",
    description: "Terms of Service governing your use of Notexia.",
  },
};

const breadcrumbs = [
  { name: "Home", item: "/" },
  { name: "Terms of Service", item: "/terms" },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildBreadcrumbSchema(breadcrumbs)) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildOrganizationSchema()) }}
      />
      {children}
    </>
  );
}
