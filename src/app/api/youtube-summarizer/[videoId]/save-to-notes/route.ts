import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectToDatabase } from "@/lib/mongodb";
import VideoSummary from "@/models/VideoSummary";
import { Note } from "@/models/Note";
import { User } from "@/models/User";
import { pusherServer } from "@/lib/pusher";

export const dynamic = "force-dynamic";

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

export async function POST(
  req: Request,
  context: { params: Promise<{ videoId: string }> }
) {
  try {
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: "Unauthorized. Please sign in to save notes." }, { status: 401 });
    }

    const userId = session.user.id;
    const { videoId } = await context.params;

    if (!videoId) {
      return NextResponse.json({ error: "Video ID is required." }, { status: 400 });
    }

    await connectToDatabase();

    const summaryDoc = await VideoSummary.findOne({ videoId });
    if (!summaryDoc) {
      return NextResponse.json({ error: "Summary not found for this video." }, { status: 404 });
    }

    const body = await req.json().catch(() => ({}));
    const {
      title,
      coverImage,
      category,
      tags,
      publish = false,
    } = body;

    const noteTitle = (title && typeof title === "string" && title.trim())
      ? title.trim()
      : summaryDoc.title;

    const noteCoverImage = (coverImage && typeof coverImage === "string")
      ? coverImage.trim()
      : summaryDoc.thumbnailUrl || "";

    const noteCategory = (category && typeof category === "string")
      ? category.trim()
      : (summaryDoc.subject || "Study Notes");

    const noteTags = Array.isArray(tags)
      ? tags.map(String)
      : (summaryDoc.examTags || ["YouTube Summary", "Notexia AI"]);

    // Build rich TipTap content
    const tipTapContent = {
      type: "doc",
      content: [
        {
          type: "heading",
          attrs: { level: 1 },
          content: [{ type: "text", text: noteTitle }],
        },
        {
          type: "paragraph",
          content: [{ type: "text", text: `Source Video: ${summaryDoc.title} (${summaryDoc.url})` }],
        },
        {
          type: "heading",
          attrs: { level: 2 },
          content: [{ type: "text", text: "Executive Summary" }],
        },
        {
          type: "paragraph",
          content: [{ type: "text", text: summaryDoc.summary }],
        },
        {
          type: "heading",
          attrs: { level: 2 },
          content: [{ type: "text", text: "High-Yield Key Takeaways" }],
        },
        ...(summaryDoc.keyPoints || []).map((kp: string) => ({
          type: "paragraph",
          content: [{ type: "text", text: `• ${kp}` }],
        })),
        ...(summaryDoc.lectures || []).flatMap((lec: { title: string; content: string }) => [
          {
            type: "heading",
            attrs: { level: 2 },
            content: [{ type: "text", text: lec.title }],
          },
          {
            type: "paragraph",
            content: [{ type: "text", text: lec.content }],
          },
        ]),
      ],
    };

    // Calculate word count
    let totalWords = summaryDoc.summary.split(/\s+/).filter(Boolean).length;
    (summaryDoc.lectures || []).forEach((lec: { wordCount?: number; content?: string }) => {
      totalWords += lec.wordCount || (lec.content || "").split(/\s+/).filter(Boolean).length;
    });

    let slug: string | undefined = undefined;
    if (publish) {
      const baseSlug = slugify(noteTitle) || "youtube-lecture-note";
      slug = baseSlug;
      let counter = 1;
      while (await Note.findOne({ slug })) {
        slug = `${baseSlug}-${counter}`;
        counter++;
      }
    }

    const note = await Note.create({
      title: noteTitle,
      content: tipTapContent,
      userId,
      folderId: null,
      isFavorite: false,
      isTrashed: false,
      published: Boolean(publish),
      slug,
      tags: noteTags,
      category: noteCategory,
      coverImage: noteCoverImage,
      wordCount: totalWords,
    });

    // Award +20 XP for converting lecture to saved/published note
    const xpAwarded = publish ? 25 : 15;
    await User.updateOne({ _id: userId }, { $inc: { points: xpAwarded } });

    try {
      await pusherServer.trigger(`user-${userId}`, "xp-updated", {
        pointsEarned: xpAwarded,
        reason: publish ? "Published Note to Community" : "Saved Video Summary to Notes",
      });
    } catch (pusherErr) {
      console.warn("[Pusher] Notification trigger warning:", pusherErr);
    }

    return NextResponse.json({
      success: true,
      xpAwarded,
      note,
    }, { status: 201 });
  } catch (error) {
    console.error("[Save to Notes Error]:", error);
    return NextResponse.json({ error: "Failed to save video summary to notes." }, { status: 500 });
  }
}
