/**
 * JSON-LD Schema Builders for Notexia
 * Generates valid Google Rich Results & Schema.org JSON-LD objects for SEO/AEO/GEO.
 */

export const SITE_URL = "https://notexia.in";
export const SITE_NAME = "Notexia";

export interface AuthorDetails {
  id?: string;
  name: string;
  image?: string;
  url?: string;
}

export interface ArticleSchemaProps {
  title: string;
  description: string;
  url: string;
  datePublished: string;
  dateModified?: string;
  author: AuthorDetails;
  imageUrl?: string;
}

export interface BreadcrumbItem {
  name: string;
  item: string;
}

export interface FAQItem {
  question: string;
  answer: string;
}

/**
 * Builds Organization schema for Notexia root layout.
 */
export function buildOrganizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/logo.png`,
    sameAs: [
      "https://github.com/Anshulrazz/nv2",
    ],
  };
}

/**
 * Builds WebSite schema with Sitelinks Searchbox.
 */
export function buildWebSiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
    potentialAction: {
      "@type": "SearchAction",
      target: `${SITE_URL}/feed?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
}

/**
 * Builds Article/BlogPosting schema for published notes and blogs.
 */
export function buildArticleSchema(props: ArticleSchemaProps) {
  const authorUrl = props.author.id
    ? `${SITE_URL}/user/${props.author.id}`
    : props.author.url || SITE_URL;

  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": props.url,
    },
    headline: props.title,
    description: props.description,
    image: props.imageUrl ? [props.imageUrl] : [`${SITE_URL}/logo.png`],
    datePublished: props.datePublished,
    dateModified: props.dateModified || props.datePublished,
    author: {
      "@type": "Person",
      name: props.author.name,
      url: authorUrl,
      ...(props.author.image ? { image: props.author.image } : {}),
    },
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      logo: {
        "@type": "ImageObject",
        url: `${SITE_URL}/logo.png`,
      },
    },
  };
}

/**
 * Builds BreadcrumbList schema.
 */
export function buildBreadcrumbSchema(items: BreadcrumbItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.item.startsWith("http") ? item.item : `${SITE_URL}${item.item}`,
    })),
  };
}

/**
 * Builds FAQPage schema for pages with Q&A content.
 */
export function buildFAQSchema(faqs: FAQItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}

/**
 * Builds Person schema for public user profiles.
 */
export function buildPersonSchema(user: { id: string; name: string; image?: string; bio?: string }) {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: user.name,
    url: `${SITE_URL}/user/${user.id}`,
    ...(user.image ? { image: user.image } : {}),
    ...(user.bio ? { description: user.bio } : {}),
  };
}

/**
 * Builds SoftwareApplication schema for AI study tools & platform features.
 */
export function buildSoftwareApplicationSchema(props?: { name?: string; description?: string; url?: string }) {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: props?.name || `${SITE_NAME} AI Study Assistant`,
    applicationCategory: "EducationalApplication",
    operatingSystem: "Web",
    url: props?.url || SITE_URL,
    description: props?.description || "Notexia AI study assistant for note taking, PDF summarization, step-by-step doubt solving, and revision planning.",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "INR",
    },
    author: {
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_URL,
    },
  };
}

/**
 * Builds Course schema for public courses.
 */
export function buildCourseSchema(course: { title: string; description: string; url: string; provider?: string }) {
  return {
    "@context": "https://schema.org",
    "@type": "Course",
    name: course.title,
    description: course.description,
    provider: {
      "@type": "Organization",
      name: course.provider || SITE_NAME,
      sameAs: SITE_URL,
    },
    hasCourseInstance: {
      "@type": "CourseInstance",
      courseMode: "online",
      url: course.url,
    },
  };
}

