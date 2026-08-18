import type { Metadata } from "next";
import { buildOrganizationSchema, buildWebSiteSchema, buildSoftwareApplicationSchema } from "@/lib/seo/jsonld";
import { constructSeoMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = constructSeoMetadata({
  title: "Notexia — AI Study Platform for Students | Notes, Doubt Solver & Community",
  description:
    "Notexia is an AI study platform for Indian students, engineering undergraduates, and competitive exam aspirants (JEE, NEET, GATE, CBSE). Generate AI notes, solve doubts 24/7, access formula sheets, publish research, and join an online study community.",
  path: "/",
  keywords: [
    "Notexia",
    "Notexia app",
    "Notexia AI",
    "Notexia study platform",
    "AI study platform",
    "AI study app",
    "AI notes generator",
    "AI note taking app",
    "AI study assistant",
    "AI tutor for students",
    "AI doubt solver",
    "AI question solver",
    "AI study notes",
    "AI notes summarizer",
    "AI PDF summarizer for students",
    "online study notes",
    "student notes platform",
    "study notes sharing platform",
    "student community",
    "online student community",
    "JEE study notes",
    "NEET study notes",
    "GATE study notes",
    "CBSE study material",
    "BTech notes",
    "engineering notes",
    "AI study planner",
    "AI flashcards",
    "best AI study app for students in India",
  ],
});

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildSoftwareApplicationSchema()) }}
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
