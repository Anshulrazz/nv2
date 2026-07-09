import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { Note } from "@/models/Note";

function slugify(text: string) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w\-]+/g, "")
    .replace(/\-\-+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");
}

interface TipTapNode {
  type?: string;
  text?: string;
  content?: TipTapNode[];
}

function extractTextContent(content: TipTapNode | null | undefined): string {
  if (!content) return "";
  if (content.type === "text") return content.text || "";
  if (content.content && Array.isArray(content.content)) {
    return content.content.map((c) => extractTextContent(c)).join(" ");
  }
  return "";
}

export const PATCH = auth(async function PATCH(req, context) {
  try {
    const userId = req.auth?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await (context?.params as Promise<{ id: string }>);

    const body = await req.json();
    const {
      published,
      tags,
      category,
      coverImage,
      seoTitle,
      seoDescription,
      scheduledAt,
      isPinned,
    } = body;

    await connectToDatabase();

    const note = await Note.findOne({ _id: id, userId });
    if (!note) {
      return NextResponse.json({ error: "Note not found." }, { status: 404 });
    }

    // Compute metrics
    const rawText = extractTextContent(note.content as unknown as TipTapNode);
    const wordCount = rawText.split(/\s+/).filter(Boolean).length;
    const readingTimeMin = Math.ceil(wordCount / 200);
    const readingTime = readingTimeMin <= 1 ? "1 min read" : `${readingTimeMin} min read`;

    note.wordCount = wordCount;
    note.readingTime = readingTime;

    if (published !== undefined) {
      note.published = published;
      if (published && !note.slug) {
        // Generate unique slug
        const baseSlug = slugify(note.title) || "untitled";
        let uniqueSlug = baseSlug;
        let counter = 1;
        while (await Note.findOne({ slug: uniqueSlug, _id: { $ne: note._id } })) {
          uniqueSlug = `${baseSlug}-${counter}`;
          counter++;
        }
        note.slug = uniqueSlug;
      }
    }

    if (tags !== undefined) note.tags = tags;
    if (category !== undefined) note.category = category;
    if (coverImage !== undefined) note.coverImage = coverImage;
    if (seoTitle !== undefined) note.seoTitle = seoTitle;
    if (seoDescription !== undefined) note.seoDescription = seoDescription;
    if (scheduledAt !== undefined) note.scheduledAt = scheduledAt ? new Date(scheduledAt) : null;
    if (isPinned !== undefined) note.isPinned = isPinned;

    await note.save();
    return NextResponse.json(note);
  } catch (error) {
    console.error("Publish toggle error:", error);
    return NextResponse.json({ error: "Failed to update publication settings." }, { status: 500 });
  }
});
