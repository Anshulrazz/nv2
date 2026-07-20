import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { Note } from "@/models/Note";
import { isValidObjectId } from "@/lib/validation";

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
    if (!isValidObjectId(id)) {
      return NextResponse.json({ error: "Invalid note ID format." }, { status: 400 });
    }

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

    // Body validation
    if (published !== undefined && typeof published !== "boolean") {
      return NextResponse.json({ error: "published must be a boolean." }, { status: 400 });
    }
    if (tags !== undefined && (!Array.isArray(tags) || !tags.every((t) => typeof t === "string"))) {
      return NextResponse.json({ error: "tags must be an array of strings." }, { status: 400 });
    }
    if (category !== undefined && typeof category !== "string") {
      return NextResponse.json({ error: "category must be a string." }, { status: 400 });
    }
    if (coverImage !== undefined && typeof coverImage !== "string") {
      return NextResponse.json({ error: "coverImage must be a string." }, { status: 400 });
    }
    if (seoTitle !== undefined && typeof seoTitle !== "string") {
      return NextResponse.json({ error: "seoTitle must be a string." }, { status: 400 });
    }
    if (seoDescription !== undefined && typeof seoDescription !== "string") {
      return NextResponse.json({ error: "seoDescription must be a string." }, { status: 400 });
    }
    if (scheduledAt !== undefined && scheduledAt !== null && (typeof scheduledAt !== "string" || isNaN(new Date(scheduledAt).getTime()))) {
      return NextResponse.json({ error: "scheduledAt must be a valid date string or null." }, { status: 400 });
    }
    if (isPinned !== undefined && typeof isPinned !== "boolean") {
      return NextResponse.json({ error: "isPinned must be a boolean." }, { status: 400 });
    }

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
