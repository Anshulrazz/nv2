import type { Metadata } from "next";

export const SITE_URL = "https://notexia.in";
export const DEFAULT_SITE_TITLE = "Notexia — AI Study Platform for Students | Notes, Doubt Solver & Community";
export const DEFAULT_SITE_DESCRIPTION =
  "Notexia is an AI-powered study platform for Indian students, engineering undergraduates, and competitive exam aspirants (JEE, NEET, GATE, CBSE). Access digital notes, AI doubt solving, formula sheets, and a collaborative student community.";

interface ConstructMetadataInput {
  title?: string;
  description?: string;
  path?: string;
  image?: string;
  noIndex?: boolean;
  type?: "website" | "article" | "profile";
  keywords?: string[];
}

export function constructSeoMetadata({
  title = DEFAULT_SITE_TITLE,
  description = DEFAULT_SITE_DESCRIPTION,
  path = "",
  image = "/opengraph-image",
  noIndex = false,
  type = "website",
  keywords = [],
}: ConstructMetadataInput = {}): Metadata {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  const canonicalUrl = `${SITE_URL}${cleanPath === "/" ? "" : cleanPath}`;

  const defaultKeywords = [
    "Notexia",
    "Notexia app",
    "Notexia AI",
    "AI study platform",
    "AI study app",
    "AI notes generator",
    "AI note taking app",
    "AI doubt solver",
    "AI PDF summarizer for students",
    "online study notes",
    "notes sharing platform",
    "student community",
    "JEE study notes",
    "NEET study notes",
    "GATE study notes",
    "CBSE notes",
    "BTech notes",
    "engineering notes",
    "AI study planner",
    "AI flashcards",
  ];

  const combinedKeywords = Array.from(new Set([...keywords, ...defaultKeywords]));

  return {
    title,
    description,
    keywords: combinedKeywords,
    metadataBase: new URL(SITE_URL),
    alternates: {
      canonical: canonicalUrl,
    },
    robots: {
      index: !noIndex,
      follow: !noIndex,
      googleBot: {
        index: !noIndex,
        follow: !noIndex,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    openGraph: {
      type,
      locale: "en_IN",
      url: canonicalUrl,
      title,
      description,
      siteName: "Notexia",
      images: [
        {
          url: image.startsWith("http") ? image : `${SITE_URL}${image}`,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image.startsWith("http") ? image : `${SITE_URL}${image}`],
      creator: "@notexia",
    },
  };
}
