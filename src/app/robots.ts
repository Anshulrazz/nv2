import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "Mediapartners-Google",
        allow: "/",
      },
      {
        userAgent: "*",
        allow: ["/", "/blogs", "/blog/", "/forums", "/leaderboard", "/community", "/user/", "/tools/", "/legal/", "/privacy", "/terms", "/security", "/login", "/signup", "/ads.txt", "/sitemap.xml", "/llms.txt"],
        disallow: [
          "/dashboard",
          "/notes",
          "/admin",
          "/api/",
          "/settings",
          "/messages",
          "/notifications",
          "/bookmarks",
          "/prototype",
          "/research",
          "/doubts",
          "/chat",
        ],
      },
    ],
    sitemap: "https://notexia.in/sitemap.xml",
    host: "https://notexia.in",
  };
}
