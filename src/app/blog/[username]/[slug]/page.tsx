import React from "react";
import { connectToDatabase } from "@/lib/mongodb";
import { Note } from "@/models/Note";
import { Blog } from "@/models/Blog";
import { User } from "@/models/User";
import { GoogleAdBanner } from "@/components/ads/GoogleAdBanner";
import { BlogSideChat } from "@/components/blog/BlogSideChat";
import { isValidObjectId } from "@/lib/validation";
import { notFound } from "next/navigation";
import { Calendar, Clock, ArrowLeft } from "lucide-react";
import Link from "next/link";

// Dynamic routing config segment
export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{
    username: string;
    slug: string;
  }>;
}

// Generate SEO meta tags dynamically
export async function generateMetadata({ params }: PageProps) {
  try {
    const { username, slug } = await params;
    await connectToDatabase();
    const note = await Note.findOne({ slug, published: true, isTrashed: false });
    if (!note) return { title: "Blog Not Found | Notexia", robots: { index: false } };

    const title = note.seoTitle || note.title || "Untitled";
    const description =
      note.seoDescription ||
      `Read "${title}" on Notexia — a smart study and publishing platform.`;
    const url = `https://notexia.in/blog/${username}/${slug}`;

    return {
      title,
      description,
      alternates: { canonical: url },
      openGraph: {
        title: `${title} | Notexia`,
        description,
        url,
        type: "article",
        siteName: "Notexia",
        locale: "en_IN",
        publishedTime: note.createdAt ? new Date(note.createdAt).toISOString() : undefined,
        modifiedTime: note.updatedAt ? new Date(note.updatedAt).toISOString() : undefined,
        images: [
          {
            url: "/opengraph-image",
            width: 1200,
            height: 630,
            alt: title,
          },
        ],
      },
      twitter: {
        card: "summary_large_image",
        title: `${title} | Notexia`,
        description,
        images: ["/opengraph-image"],
      },
    };
  } catch {
    return { title: "Blog Post | Notexia" };
  }
}

// TipTap JSON node type definition
interface TipTapNode {
  type?: string;
  text?: string;
  attrs?: Record<string, string | number | boolean | undefined>;
  marks?: TipTapMark[];
  content?: TipTapNode[];
}

interface TipTapMark {
  type: string;
  attrs?: Record<string, string | undefined>;
}

// Custom TipTap JSON to React compilation helper
function renderTipTapJSON(node: TipTapNode | null | undefined): React.ReactNode {
  if (!node) return null;

  if (node.type === "text") {
    let content: React.ReactNode = node.text;
    if (node.marks) {
      node.marks.forEach((mark: TipTapMark) => {
        if (mark.type === "bold") content = <strong key={Math.random()}>{content}</strong>;
        if (mark.type === "italic") content = <em key={Math.random()}>{content}</em>;
        if (mark.type === "underline") content = <u key={Math.random()}>{content}</u>;
        if (mark.type === "link") {
          content = (
            <a key={Math.random()} href={mark.attrs?.href} target="_blank" rel="noopener noreferrer" className="text-cyan-400 underline transition-colors">
              {content}
            </a>
          );
        }
      });
    }
    return content;
  }

  const children = node.content ? node.content.map((child: TipTapNode) => renderTipTapJSON(child)) : [];

  switch (node.type) {
    case "doc":
      return <div key={Math.random()} className="space-y-4">{children}</div>;
    case "paragraph":
      return <p key={Math.random()} className="text-sm text-neutral-300 leading-relaxed min-h-[1.2rem]">{children}</p>;
    case "heading": {
      const level = node.attrs?.level || 1;
      if (level === 1) return <h1 key={Math.random()} className="text-2xl font-bold text-neutral-100 tracking-tight mt-6 mb-2" style={{ fontFamily: "var(--font-space-grotesk)" }}>{children}</h1>;
      if (level === 2) return <h2 key={Math.random()} className="text-xl font-bold text-neutral-100 mt-4 mb-2" style={{ fontFamily: "var(--font-space-grotesk)" }}>{children}</h2>;
      return <h3 key={Math.random()} className="text-lg font-bold text-neutral-100 mt-3 mb-1" style={{ fontFamily: "var(--font-space-grotesk)" }}>{children}</h3>;
    }
    case "bulletList":
      return <ul key={Math.random()} className="list-disc pl-5 space-y-1 text-neutral-300 text-sm">{children}</ul>;
    case "orderedList":
      return <ol key={Math.random()} className="list-decimal pl-5 space-y-1 text-neutral-300 text-sm">{children}</ol>;
    case "listItem":
      return <li key={Math.random()}>{children}</li>;
    case "codeBlock":
      return (
        <pre key={Math.random()} className="bg-neutral-900 border border-neutral-850 rounded-lg p-4 font-mono text-xs text-neutral-300 overflow-x-auto my-4" style={{ fontFamily: "var(--font-jetbrains-mono)" }}>
          <code>{children}</code>
        </pre>
      );
    case "blockquote":
      return (
        <blockquote key={Math.random()} className="border-l-4 border-cyan-400 pl-4 py-1 my-4 italic text-neutral-400">
          {children}
        </blockquote>
      );
    case "image":
      return (
        // eslint-disable-next-line @next/next/no-img-element
        <img key={Math.random()} src={node.attrs?.src as string} alt={(node.attrs?.alt as string) || "Image"} className="w-full rounded-xl my-4 border border-neutral-900 max-h-[350px] object-cover" />
      );
    default:
      return null;
  }
}

function extractNotePlainText(content: unknown): string {
  if (!content) return "";
  if (typeof content === "string") {
    return content.replace(/<[^>]*>?/gm, " ").replace(/\s+/g, " ").trim();
  }
  if (typeof content === "object" && content !== null) {
    const obj = content as Record<string, unknown>;
    if (obj.text && typeof obj.text === "string") return obj.text;
    if (Array.isArray(obj.content)) return obj.content.map(extractNotePlainText).join("\n");
  }
  if (Array.isArray(content)) return content.map(extractNotePlainText).join(" ");
  return "";
}

function renderNoteContent(content: unknown) {
  if (!content) return null;

  if (typeof content === "string") {
    return (
      <div
        className="max-w-none text-zinc-200 text-sm sm:text-base leading-relaxed space-y-4 font-sans
          [&_figure]:my-6 [&_figure]:p-4 [&_figure]:bg-zinc-950/90 [&_figure]:border [&_figure]:border-white/10 [&_figure]:rounded-2xl [&_figure]:text-center [&_figure]:shadow-2xl
          [&_img]:max-h-[700px] [&_img]:w-full [&_img]:object-contain [&_img]:rounded-xl [&_img]:mx-auto [&_img]:border [&_img]:border-white/5
          [&_figcaption]:mt-3 [&_figcaption]:text-xs [&_figcaption]:font-mono [&_figcaption]:text-cyan-400 [&_figcaption]:font-semibold
          [&_table]:w-full [&_table]:my-6 [&_table]:border-collapse [&_table]:border [&_table]:border-white/10 [&_table]:rounded-xl [&_table]:overflow-hidden
          [&_th]:bg-zinc-900 [&_th]:p-3 [&_th]:text-xs [&_th]:font-mono [&_th]:text-white [&_th]:text-left [&_th]:border-b [&_th]:border-white/10
          [&_td]:p-3 [&_td]:text-sm [&_td]:text-zinc-300 [&_td]:border-b [&_td]:border-white/5
          [&_tr:hover_td]:bg-white/5
          [&_pre]:!bg-[#0d0d12] [&_pre]:!border [&_pre]:!border-white/[0.12] [&_pre]:!p-5 [&_pre]:!rounded-2xl [&_pre]:!font-mono [&_pre]:!text-[13px] [&_pre]:!overflow-x-auto [&_pre]:!my-4 [&_pre]:!leading-[1.75]
          [&_pre_code]:!bg-transparent [&_pre_code]:!p-0 [&_pre_code]:!border-0 [&_pre_code]:!rounded-none [&_pre_code]:!text-emerald-300 [&_pre_code]:!font-mono [&_pre_code]:!text-[13px] [&_pre_code]:!leading-[1.75] [&_pre_code]:!whitespace-pre [&_pre_code]:!block
          [&_code]:text-cyan-300 [&_code]:font-mono [&_code]:bg-zinc-800/80 [&_code]:border [&_code]:border-white/10 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-[12px] [&_code]:leading-none
          [&_blockquote]:border-l-4 [&_blockquote]:border-cyan-400 [&_blockquote]:pl-4 [&_blockquote]:py-2 [&_blockquote]:my-4 [&_blockquote]:italic [&_blockquote]:text-zinc-300 [&_blockquote]:bg-zinc-950/60 [&_blockquote]:rounded-r-xl
          [&_h1]:text-3xl [&_h1]:font-black [&_h1]:text-white [&_h1]:mt-8 [&_h1]:mb-4 [&_h1]:tracking-tight [&_h1]:border-b [&_h1]:border-white/10 [&_h1]:pb-2
          [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:text-white [&_h2]:mt-6 [&_h2]:mb-3 [&_h2]:tracking-tight
          [&_h3]:text-xl [&_h3]:font-bold [&_h3]:text-cyan-300 [&_h3]:mt-5 [&_h3]:mb-2
          [&_h4]:text-lg [&_h4]:font-bold [&_h4]:text-zinc-200 [&_h4]:mt-4 [&_h4]:mb-2
          [&_p]:text-sm [&_p]:text-zinc-300 [&_p]:leading-relaxed [&_p]:my-2
          [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1.5 [&_ul]:my-3 [&_ul]:text-zinc-300
          [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:space-y-1.5 [&_ol]:my-3 [&_ol]:text-zinc-300
          [&_li]:text-sm [&_li]:leading-relaxed
          [&_a]:text-cyan-400 [&_a]:underline [&_a]:underline-offset-2 [&_a]:font-semibold [&_a:hover]:text-cyan-300
          [&_strong]:font-extrabold [&_strong]:text-white
          [&_em]:italic [&_em]:text-zinc-200"
        dangerouslySetInnerHTML={{ __html: content }}
      />
    );
  }

  if (typeof content === "object") {
    return renderTipTapJSON(content as TipTapNode);
  }

  return null;
}

export default async function PublicBlogPostPage({ params }: PageProps) {
  const { username, slug } = await params;

  await connectToDatabase();

  const cleanSlug = slug ? decodeURIComponent(slug).trim() : "";
  const slugPattern = cleanSlug.toLowerCase().replace(/\s+/g, "-");
  const slugRegex = new RegExp(`^${cleanSlug.replace(/[-_]/g, "[-_ ]?")}$`, "i");

  // Query note flexibly by slug, slug regex, or _id
  let note = await Note.findOne({
    $or: [
      { slug: cleanSlug },
      { slug: slugPattern },
      { slug: slugRegex },
      ...(isValidObjectId(cleanSlug) ? [{ _id: cleanSlug }] : []),
    ],
    isTrashed: false,
  });

  // If not found in Note, query Blog collection
  if (!note) {
    note = await Note.findOne({
      title: { $regex: new RegExp(cleanSlug.replace(/-/g, " "), "i") },
      isTrashed: false,
    });
  }

  if (!note) {
    const blog = await Blog.findOne({
      $or: [
        { slug: cleanSlug },
        { slug: slugPattern },
        { slug: slugRegex },
        { title: { $regex: new RegExp(cleanSlug.replace(/-/g, " "), "i") } },
        ...(isValidObjectId(cleanSlug) ? [{ _id: cleanSlug }] : []),
      ],
      published: true,
    });

    if (blog) {
      const words = (blog.content || "").split(/\s+/).filter(Boolean).length;
      note = {
        _id: blog._id,
        title: blog.title,
        content: blog.content,
        coverImage: blog.coverImage || "",
        category: "Scholar Article",
        tags: ["blog"],
        readingTime: `${Math.max(1, Math.ceil(words / 200))} min read`,
        wordCount: words,
        createdAt: blog.createdAt,
        userId: blog.userId,
      };
    }
  }

  if (!note) {
    notFound();
  }

  // Find author or provide graceful fallback
  const authorDoc = await User.findById(note.userId);
  if (authorDoc && authorDoc.isSuspended) {
    notFound();
  }

  const author = authorDoc || {
    _id: note.userId,
    name: username || "Notexia Author",
    image: "",
  };

  const plainTextContent = extractNotePlainText(note.content);

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 selection:bg-cyan-500/30 overflow-hidden flex flex-col">
      {/* Dynamic gradients decoration background */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[300px] bg-cyan-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute inset-0 cyber-grid opacity-30 pointer-events-none" />

      {/* Top Header */}
      <header className="border-b border-neutral-900 bg-neutral-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="w-full px-6 md:px-12 h-16 flex items-center justify-between">
          <Link href="/feed" className="text-neutral-400 hover:text-white flex items-center gap-2 text-xs font-semibold select-none transition-colors">
            <ArrowLeft className="h-4 w-4 text-cyan-400" /> Back to Feed
          </Link>
          <span
            className="text-sm font-bold bg-gradient-to-r from-cyan-400 via-indigo-400 to-violet-400 bg-clip-text text-transparent tracking-widest"
            style={{ fontFamily: "var(--font-space-grotesk)" }}
          >
            NOTEXIA BLOGS
          </span>
        </div>
      </header>

      <main className="w-full px-6 md:px-12 lg:px-16 py-12 space-y-8 relative z-10 flex-1">
        {/* Cover image banner */}
        {note.coverImage && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={note.coverImage}
            alt={note.title}
            className="w-full h-72 md:h-96 lg:h-[450px] object-cover rounded-3xl border border-neutral-900 shadow-2xl"
          />
        )}

        {/* Post title & metadata header */}
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2 select-none">
            {note.category && (
              <span
                className="text-[9px] bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider"
                style={{ fontFamily: "var(--font-jetbrains-mono)" }}
              >
                {note.category}
              </span>
            )}
            {note.tags?.map((t: string) => (
              <span
                key={t}
                className="text-[9px] text-neutral-500 border border-neutral-900 px-2 py-0.5 rounded font-bold"
                style={{ fontFamily: "var(--font-jetbrains-mono)" }}
              >
                #{t}
              </span>
            ))}
          </div>

          <h1
            className="text-3xl md:text-5xl font-extrabold text-neutral-100 tracking-tight leading-tight"
            style={{ fontFamily: "var(--font-space-grotesk)" }}
          >
            {note.title}
          </h1>

          <div
            className="flex flex-wrap items-center gap-4 text-xs text-neutral-500 border-y border-neutral-905 py-3.5 select-none"
            style={{ fontFamily: "var(--font-space-grotesk)" }}
          >
            <Link href={`/user/${author._id}`} className="flex items-center gap-2 hover:text-cyan-400 transition-colors">
              {author.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={author.image} alt={author.name} className="h-6 w-6 rounded-full object-cover border border-neutral-800" />
              ) : (
                <div className="h-6 w-6 rounded-full bg-neutral-950 border border-neutral-850 flex items-center justify-center text-neutral-500 font-bold text-[9px]">
                  {author.name?.[0]?.toUpperCase()}
                </div>
              )}
              <span className="font-bold text-neutral-300 hover:text-cyan-400 transition-colors">{author.name}</span>
            </Link>

            <div className="w-[1px] h-3 bg-neutral-900" />

            <div className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5 text-neutral-600" />
              <span style={{ fontFamily: "var(--font-jetbrains-mono)" }}>
                {new Date(note.createdAt).toLocaleDateString()}
              </span>
            </div>

            <div className="w-[1px] h-3 bg-neutral-900" />

            <div className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5 text-neutral-600" />
              <span style={{ fontFamily: "var(--font-jetbrains-mono)" }}>
                {note.readingTime || "1 min read"} ({note.wordCount || 0} words)
              </span>
            </div>
          </div>
        </div>

        {/* Content body */}
        <article className="prose prose-invert max-w-none w-full text-base leading-relaxed">
          {renderNoteContent(note.content)}
        </article>

        {/* Public Blog Google Ad Placement */}
        <GoogleAdBanner adSlot="1003" className="mt-8" />
      </main>

      {/* Floating AI Chat Assistant for Public Blog Post */}
      <BlogSideChat blogTitle={note.title} blogContentText={plainTextContent} />
    </div>
  );
}
