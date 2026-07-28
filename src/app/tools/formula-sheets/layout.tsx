import type { Metadata } from "next";
import { buildFAQSchema, buildBreadcrumbSchema, buildOrganizationSchema } from "@/lib/seo/jsonld";

export const metadata: Metadata = {
  title: "JEE Main & NEET Physics Formula Sheet & Revision Notes",
  description: "Free complete Physics formula sheet for JEE Main, JEE Advanced, NEET, and CBSE Class 11/12. Formulas for Mechanics, Electrodynamics, Modern Physics & Optics.",
  alternates: { canonical: "https://notexia.in/tools/formula-sheets" },
  openGraph: {
    title: "JEE Main & NEET Physics Formula Sheet & Revision Notes | Notexia",
    description: "Free complete Physics formula sheet for JEE Main, JEE Advanced, NEET, and CBSE Class 11/12.",
    url: "https://notexia.in/tools/formula-sheets",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "JEE Main & NEET Physics Formula Sheet | Notexia",
    description: "Free complete Physics formula sheet for JEE Main, NEET, and CBSE Class 11/12.",
  },
};

const faqs = [
  {
    question: "Which topics are covered in the Physics formula sheet?",
    answer: "The formula sheet covers Kinematics, Laws of Motion, Work Energy Power, Rotational Dynamics, Gravitation, Electrostatics, Current Electricity, Magnetism, Optics, and Modern Physics.",
  },
  {
    question: "Is this Physics formula sheet suitable for JEE Main 2026 and NEET?",
    answer: "Yes! All formulas are compiled according to the latest NTA JEE Main and NEET UG exam syllabi.",
  },
];

const breadcrumbs = [
  { name: "Home", item: "/" },
  { name: "Free Tools", item: "/tools" },
  { name: "Physics Formula Sheet", item: "/tools/formula-sheets" },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
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
