import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "Notexia — Smart Notes, AI Chat & Study Community",
    template: "%s | Notexia",
  },
  description:
    "Notexia is a premium study platform for students and professionals. Organize notes, publish blogs, discuss doubts, explore forums, and grow with a smart learning community.",
  alternates: { canonical: "https://notexia.in" },
  openGraph: {
    title: "Notexia — Smart Notes, AI Chat & Study Community",
    description:
      "Organize notes, publish blogs, discuss doubts, explore forums, and grow with a smart learning community on Notexia.",
    url: "https://notexia.in",
    type: "website",
  },
};

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebApplication",
            name: "Notexia",
            url: "https://notexia.in",
            description:
              "Notexia is a smart study platform for students and professionals — notes, blogs, forums, AI chat, and community all in one place.",
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
          }),
        }}
      />
      {children}
    </>
  );
}
