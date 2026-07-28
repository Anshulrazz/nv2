import type { Metadata } from "next";
import { buildBreadcrumbSchema, buildOrganizationSchema } from "@/lib/seo/jsonld";

export const metadata: Metadata = {
  title: "Privacy Policy | Notexia",
  description: "Notexia Privacy Policy — Learn how we protect student data, encrypt notes, manage account information, and comply with data privacy standards.",
  alternates: { canonical: "https://notexia.in/privacy" },
  openGraph: {
    title: "Privacy Policy | Notexia",
    description: "Learn how Notexia protects student data, encrypts notes, and handles account privacy.",
    url: "https://notexia.in/privacy",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Privacy Policy | Notexia",
    description: "Learn how Notexia protects student data and account privacy.",
  },
};

const breadcrumbs = [
  { name: "Home", item: "/" },
  { name: "Privacy Policy", item: "/privacy" },
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
