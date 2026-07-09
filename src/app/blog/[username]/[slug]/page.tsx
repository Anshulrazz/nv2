import React from "react";
import { connectToDatabase } from "@/lib/mongodb";
import { Note } from "@/models/Note";
import { User } from "@/models/User";
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

export default async function PublicBlogPostPage({ params }: PageProps) {
  const { slug } = await params;

  await connectToDatabase();

  const note = await Note.findOne({ slug, published: true, isTrashed: false });
  if (!note) {
    notFound();
  }

  // Check author account permissions status
  const author = await User.findById(note.userId);
  if (!author || author.isSuspended) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 selection:bg-cyan-500/30 relative overflow-hidden flex flex-col justify-between">
      {/* Dynamic gradients decoration background */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[300px] bg-cyan-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute inset-0 cyber-grid opacity-30 pointer-events-none" />

      {/* Top Header */}
      <header className="border-b border-neutral-900 bg-neutral-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-3xl mx-auto px-6 h-16 flex items-center justify-between">
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

      <main className="max-w-2xl mx-auto px-6 py-12 space-y-8 relative z-10 flex-1 w-full">
        {/* Cover image banner */}
        {note.coverImage && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={note.coverImage}
            alt={note.title}
            className="w-full h-64 md:h-80 object-cover rounded-2xl border border-neutral-900 shadow-xl"
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
            className="text-3xl md:text-4xl font-extrabold text-neutral-100 tracking-tight leading-tight"
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
                {note.readingTime || "1 min read"} ({note.wordCount} words)
              </span>
            </div>
          </div>
        </div>

        {/* Content body */}
        <article className="prose prose-invert max-w-none prose-sm leading-relaxed">
          {renderTipTapJSON(note.content as unknown as TipTapNode)}
        </article>
      </main>
    </div>
  );
}
