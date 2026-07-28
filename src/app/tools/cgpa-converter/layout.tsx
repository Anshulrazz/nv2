import type { Metadata } from "next";
import { buildFAQSchema, buildBreadcrumbSchema, buildOrganizationSchema } from "@/lib/seo/jsonld";

export const metadata: Metadata = {
  title: "CGPA to Percentage Converter | CBSE, VTU, KTU, Mumbai Univ Calculator",
  description: "Free online CGPA to percentage calculator for CBSE Class 10/12, VTU, KTU, Mumbai University, Anna University, and 10-point scale. Instant formula & percentage calculation.",
  alternates: { canonical: "https://notexia.in/tools/cgpa-converter" },
  openGraph: {
    title: "CGPA to Percentage Converter | CBSE, VTU, KTU, Mumbai Univ Calculator",
    description: "Free online CGPA to percentage calculator for CBSE Class 10/12, VTU, KTU, Mumbai University, Anna University. Calculate percentage instantly.",
    url: "https://notexia.in/tools/cgpa-converter",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "CGPA to Percentage Converter | CBSE, VTU, KTU, Mumbai Univ",
    description: "Free online CGPA to percentage calculator for Indian university and CBSE students.",
  },
};

const faqs = [
  {
    question: "How to convert CBSE CGPA to Percentage?",
    answer: "To convert CBSE Class 10 CGPA to percentage, multiply your overall CGPA by 9.5. For example, if your CGPA is 8.4, your percentage is 8.4 × 9.5 = 79.8%.",
  },
  {
    question: "What is the VTU CGPA to percentage formula?",
    answer: "For Visvesvaraya Technological University (VTU), the percentage conversion formula is Percentage = (CGPA - 0.75) × 10. For example, a CGPA of 8.25 equals (8.25 - 0.75) × 10 = 75%.",
  },
  {
    question: "How to convert KTU CGPA to Percentage?",
    answer: "For APJ Abdul Kalam Technological University (KTU), Percentage = (CGPA - 0.5) × 10. For example, 7.5 CGPA equals (7.5 - 0.5) × 10 = 70%.",
  },
  {
    question: "How to convert Mumbai University CGPA to Percentage?",
    answer: "For Mumbai University (7-point and 10-point systems), the 10-point formula is Percentage = 7.1 || (CGPA × 7.1) + 11 or Percentage = 7.25 × CGPA + 11 depending on the stream regulations.",
  },
];

const breadcrumbs = [
  { name: "Home", item: "/" },
  { name: "Free Tools", item: "/tools" },
  { name: "CGPA to Percentage Converter", item: "/tools/cgpa-converter" },
];

const toolSchema = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Notexia CGPA to Percentage Calculator",
  url: "https://notexia.in/tools/cgpa-converter",
  applicationCategory: "EducationalApplication",
  operatingSystem: "Web Browser",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "INR",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(toolSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildFAQSchema(faqs)) }}
      />
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
