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
        allow: ["/", "/blogs", "/blog/", "/forums", "/leaderboard", "/community", "/login", "/signup", "/ads.txt", "/sitemap.xml"],
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
          "/feed",
          "/research",
          "/doubts",
          "/chat",
          "/user/",
        ],
      },
    ],
    sitemap: "https://notexia.in/sitemap.xml",
    host: "https://notexia.in",
  };
}
