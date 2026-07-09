import type { MetadataRoute } from "next";
import { connectToDatabase } from "@/lib/mongodb";
import { Note } from "@/models/Note";
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

  let blogRoutes: MetadataRoute.Sitemap = [];
  try {
    await connectToDatabase();
    const publishedNotes = await Note.find({ published: true, isTrashed: false })
      .select("slug authorId updatedAt")
      .lean();

    const authorIds = [...new Set(publishedNotes.map((n) => String(n.authorId)))];
    const authors = await User.find({ _id: { $in: authorIds } })
      .select("_id email")
      .lean();

    const authorMap: Record<string, string> = {};
    for (const a of authors) {
      const username = (a.email as string).split("@")[0].toLowerCase().replace(/[^a-z0-9]/g, "");
      authorMap[String(a._id)] = username;
    }

    blogRoutes = publishedNotes
      .filter((n) => n.slug && authorMap[String(n.authorId)])
      .map((n) => ({
        url: `${base}/blog/${authorMap[String(n.authorId)]}/${n.slug}`,
        lastModified: n.updatedAt ? new Date(n.updatedAt as Date) : new Date(),
        changeFrequency: "weekly" as const,
        priority: 0.6,
      }));
  } catch {
    // DB errors must not break the sitemap
  }

  return [...staticRoutes, ...blogRoutes];
}
