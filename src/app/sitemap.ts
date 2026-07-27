import type { MetadataRoute } from "next";
import { connectToDatabase } from "@/lib/mongodb";
import { Note } from "@/models/Note";
import { Blog } from "@/models/Blog";
import { User } from "@/models/User";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = "https://notexia.in";

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: base, lastModified: new Date(), changeFrequency: "weekly", priority: 1.0 },
    { url: `${base}/login`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.4 },
    { url: `${base}/signup`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.5 },
    { url: `${base}/blogs`, lastModified: new Date(), changeFrequency: "daily", priority: 0.8 },
    { url: `${base}/forums`, lastModified: new Date(), changeFrequency: "daily", priority: 0.7 },
    { url: `${base}/leaderboard`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.6 },
    { url: `${base}/community`, lastModified: new Date(), changeFrequency: "daily", priority: 0.7 },
  ];

  let dynamicRoutes: MetadataRoute.Sitemap = [];
  try {
    await connectToDatabase();

    // 1. Note articles
    const publishedNotes = await Note.find({ published: true, isTrashed: false })
      .select("slug authorId userId updatedAt")
      .lean();

    const noteAuthorIds = [...new Set(publishedNotes.map((n) => String(n.authorId || n.userId)))];
    const authors = await User.find({ _id: { $in: noteAuthorIds } })
      .select("_id name email")
      .lean();

    const authorMap: Record<string, string> = {};
    for (const a of authors) {
      const username = a.name
        ? encodeURIComponent(a.name)
        : (a.email as string).split("@")[0].toLowerCase().replace(/[^a-z0-9]/g, "");
      authorMap[String(a._id)] = username;
    }

    const noteEntries: MetadataRoute.Sitemap = publishedNotes
      .filter((n) => (n.slug || n._id) && authorMap[String(n.authorId || n.userId)])
      .map((n) => ({
        url: `${base}/blog/${authorMap[String(n.authorId || n.userId)]}/${n.slug || n._id}`,
        lastModified: n.updatedAt ? new Date(n.updatedAt as Date) : new Date(),
        changeFrequency: "weekly" as const,
        priority: 0.7,
      }));

    // 2. Blog articles
    const publishedBlogs = await Blog.find({ published: true })
      .select("_id slug userName userId updatedAt")
      .lean();

    const blogEntries: MetadataRoute.Sitemap = publishedBlogs.map((b) => ({
      url: `${base}/blog/${encodeURIComponent(b.userName || "author")}/${b.slug || b._id}`,
      lastModified: b.updatedAt ? new Date(b.updatedAt as Date) : new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));

    // 3. User profile pages
    const activeUsers = await User.find({ isSuspended: false })
      .select("_id updatedAt")
      .limit(500)
      .lean();

    const userEntries: MetadataRoute.Sitemap = activeUsers.map((u) => ({
      url: `${base}/user/${u._id}`,
      lastModified: u.updatedAt ? new Date(u.updatedAt as Date) : new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.5,
    }));

    dynamicRoutes = [...noteEntries, ...blogEntries, ...userEntries];
  } catch {
    // DB errors must not break the sitemap
  }

  return [...staticRoutes, ...dynamicRoutes];
}
