import type { Metadata } from "next";
import { buildBreadcrumbSchema, buildOrganizationSchema } from "@/lib/seo/jsonld";

export const metadata: Metadata = {
  title: "Security Infrastructure & Protection | Notexia",
  description: "Notexia Security Policy — Details on our encryption, database access controls, account authentication security, and infrastructure protection.",
  alternates: { canonical: "https://notexia.in/security" },
  openGraph: {
    title: "Security Infrastructure & Protection | Notexia",
    description: "Learn about Notexia's encryption, MongoDB security, authentication controls, and infrastructure safeguards.",
    url: "https://notexia.in/security",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Security Infrastructure | Notexia",
    description: "Notexia Security Infrastructure and Protection Policies.",
  },
};

const breadcrumbs = [
  { name: "Home", item: "/" },
  { name: "Security Infrastructure", item: "/security" },
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
