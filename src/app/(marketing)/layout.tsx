import type { Metadata } from "next";
import { buildOrganizationSchema, buildWebSiteSchema } from "@/lib/seo/jsonld";

export const metadata: Metadata = {
  title: {
    default: "Notexia: Smart Notes, AI Doubt Solving & Study Groups",
    template: "%s | Notexia",
  },
  description:
    "Notexia is a study platform for students — organize notes, get AI-powered doubt solving, join forums, and learn with a smart study community.",
  alternates: { canonical: "https://notexia.in" },
  openGraph: {
    title: "Notexia: Smart Notes, AI Doubt Solving & Study Groups",
    description:
      "Notexia is a study platform for students — organize notes, get AI-powered doubt solving, join forums, and learn with a smart study community.",
    url: "https://notexia.in",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Notexia: Smart Notes, AI Doubt Solving & Study Groups",
    description:
      "Notexia is a study platform for students — organize notes, get AI-powered doubt solving, join forums, and learn with a smart study community.",
  },
};

const webAppSchema = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Notexia",
  url: "https://notexia.in",
  description:
    "Notexia is a smart study platform for students — notes, blogs, forums, AI chat, and community all in one place.",
  applicationCategory: "EducationalApplication",
  operatingSystem: "Web",
  inLanguage: "en",
  audience: {
    "@type": "Audience",
    audienceType: "Students, Researchers, Professionals",
  },
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "INR",
  },
  author: {
    "@type": "Organization",
    name: "Notexia",
    url: "https://notexia.in",
  },
};

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildOrganizationSchema()) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildWebSiteSchema()) }}
      />
      {children}
    </>
  );
}
