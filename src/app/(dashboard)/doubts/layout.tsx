import type { Metadata } from "next";
import { buildFAQSchema, buildBreadcrumbSchema } from "@/lib/seo/jsonld";

export const metadata: Metadata = {
  title: "Online Student Doubt Solver & Academic Q&A Hub",
  description: "Ask physics, chemistry, math, and coding doubts online on Notexia. Get instant step-by-step solutions, formula sheets, and peer explanation.",
  alternates: { canonical: "https://notexia.in/doubts" },
  openGraph: {
    title: "Online Student Doubt Solver & Academic Q&A Hub | Notexia",
    description: "Ask physics, chemistry, math, and coding doubts online on Notexia. Get instant step-by-step solutions and peer explanation.",
    url: "https://notexia.in/doubts",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Online Student Doubt Solver & Academic Q&A Hub | Notexia",
    description: "Ask physics, chemistry, math, and coding doubts online on Notexia.",
  },
};

const doubtsFaqs = [
  {
    question: "How do I ask academic doubts online on Notexia?",
    answer: "Click 'Ask a Doubt', enter your question title and detailed problem statement (with formulas or code), and submit. Peer scholars and AI assistants will provide step-by-step answers.",
  },
  {
    question: "What subjects are covered in Notexia's Doubt Solver?",
    answer: "Notexia covers Physics, Chemistry, Mathematics, Biology, Computer Science, Coding Algorithms, and Competitive Exams like JEE, NEET, and CBSE boards.",
  },
];

const breadcrumbs = [
  { name: "Home", item: "/" },
  { name: "Doubts Q&A", item: "/doubts" },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildFAQSchema(doubtsFaqs)) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildBreadcrumbSchema(breadcrumbs)) }}
      />
      {children}
    </>
  );
}
