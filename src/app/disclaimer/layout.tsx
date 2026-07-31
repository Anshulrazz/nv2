import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Disclaimer | Academic & AI Copilot Disclaimers | Notexia",
  description:
    "Read Notexia's Academic and Legal Disclaimer regarding AI doubt solver responses, academic board affiliations, CGPA conversion tools, and peer-contributed notes.",
  alternates: { canonical: "https://notexia.in/disclaimer" },
  openGraph: {
    title: "Disclaimer | Notexia",
    description:
      "Read Notexia's disclaimers on academic affiliations, AI outputs, and student conversion tools.",
    url: "https://notexia.in/disclaimer",
  },
};

export default function DisclaimerLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
