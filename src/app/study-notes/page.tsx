import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import {
  BookOpen,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import { TrustHeader } from "@/components/public/TrustHeader";
import { TrustFooter } from "@/components/public/TrustFooter";
import { constructSeoMetadata } from "@/lib/seo/metadata";
import { buildBreadcrumbSchema, buildFAQSchema } from "@/lib/seo/jsonld";
import { connectToDatabase } from "@/lib/mongodb";
import { Note } from "@/models/Note";

export const dynamic = "force-dynamic";

export const metadata: Metadata = constructSeoMetadata({
  title: "Online Study Notes & Sharing Platform for Students | Notexia",
  description:
    "Explore free digital study notes, lecture summaries, LaTeX formula sheets, and study materials for JEE, NEET, GATE, CBSE, BTech, and Engineering subjects on Notexia.",
  path: "/study-notes",
  keywords: [
    "online study notes",
    "student notes platform",
    "study notes app",
    "notes sharing platform",
    "digital study notes",
    "online notes for students",
    "academic notes platform",
    "JEE study notes",
    "NEET study notes",
    "GATE study notes",
    "CBSE study material",
    "BTech notes",
    "engineering notes",
    "college notes",
    "free study notes for engineering students",
  ],
});

const categories = [
  { slug: "engineering", name: "Engineering & BTech Notes", count: "1,200+ Notes", color: "#8FC3DE" },
  { slug: "jee", name: "JEE Main & Advanced", count: "850+ Notes", color: "#F0C93B" },
  { slug: "neet", name: "NEET Medical Notes", count: "640+ Notes", color: "#F28B6E" },
  { slug: "gate", name: "GATE Exam Revision", count: "420+ Notes", color: "#C9A9E0" },
  { slug: "cbse", name: "CBSE Class 10 & 12", count: "950+ Notes", color: "#8FC3DE" },
  { slug: "btech", name: "BTech Semester Exams", count: "1,500+ Notes", color: "#F0C93B" },
];

const faqs = [
  {
    question: "What is Notexia Study Notes Platform?",
    answer:
      "Notexia is an open digital study notes sharing platform where students and educators write, publish, and explore markdown notes formatted with LaTeX math equations, code blocks, and diagrams.",
  },
  {
    question: "Are study notes free to read and download on Notexia?",
    answer:
      "Yes! All public notes published by community members and educators are 100% free to read, copy, and download as Markdown or PDF files.",
  },
  {
    question: "Can I publish my own college or exam notes on Notexia?",
    answer:
      "Absolutely. Registered students can create rich notes in Notexia's TipTap editor and publish them publicly to earn scholar badges and activity points on the leaderboard.",
  },
];

const breadcrumbs = [
  { name: "Home", item: "/" },
  { name: "Study Notes", item: "/study-notes" },
];

export default async function PublicNotesPage() {
  let recentNotes: Array<{ _id: string; title: string; summary?: string; slug?: string; category?: string }> = [];

  try {
    await connectToDatabase();
    const fetched = await Note.find({ published: true, isTrashed: false })
      .select("_id title summary slug category")
      .limit(6)
      .sort({ updatedAt: -1 })
      .lean();

    recentNotes = fetched.map((n) => ({
      _id: String(n._id),
      title: n.title,
      summary: n.summary || "Public student study note.",
      slug: n.slug || String(n._id),
      category: n.category || "General Study",
    }));
  } catch {
    // DB error fallback
  }

  return (
    <div className="min-h-screen bg-[#16261D] text-[#F3F0E4] font-sans selection:bg-[#F0C93B]/30 flex flex-col antialiased">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildBreadcrumbSchema(breadcrumbs)) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildFAQSchema(faqs)) }}
      />

      <TrustHeader title="STUDY NOTES DIRECTORY" />

      <main className="max-w-5xl w-full mx-auto px-4 sm:px-6 py-12 sm:py-16 space-y-16 flex-1">
        {/* HERO */}
        <section className="rounded-[2.5rem] bg-[#1A2D23]/90 border border-[#F3F0E4]/15 p-2 shadow-2xl">
          <div className="rounded-[calc(2.5rem-0.5rem)] bg-[#121F18] p-8 sm:p-12 space-y-6 shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)] relative overflow-hidden">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#F0C93B]/15 border border-[#F0C93B]/30 text-[#F0C93B] text-xs font-mono font-bold uppercase tracking-wider">
              <BookOpen className="size-3.5" /> ACADEMIC KNOWLEDGE BASE
            </div>

            <h1 className="text-3xl sm:text-5xl font-black text-[#F3F0E4] tracking-tight font-heading leading-tight max-w-3xl">
              Online Study Notes &amp; Notes Sharing Platform
            </h1>

            <p className="text-[#9FAEA1] text-base sm:text-lg leading-relaxed max-w-3xl font-light">
              Discover verified study notes, lecture summaries, and formula sheets shared by students and educators across India.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-4">
              <Link
                href="/signup"
                className="group rounded-full bg-[#F0C93B] hover:bg-[#F0C93B]/90 text-[#2A2118] font-bold text-sm px-7 py-3.5 inline-flex items-center gap-3 transition-all shadow-[0_0_20px_rgba(240,201,59,0.3)] font-heading"
              >
                <span>Publish Notes Free</span>
                <ArrowRight className="size-4 text-[#2A2118] group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/ai-study-tools"
                className="rounded-full bg-[#1A2D23] hover:bg-[#1A2D23]/80 border border-[#F3F0E4]/20 text-[#F3F0E4] font-semibold text-sm px-6 py-3.5 inline-flex items-center gap-2 transition-all"
              >
                <span>AI Notes Generator</span>
              </Link>
            </div>
          </div>
        </section>

        {/* CATEGORIES GRID */}
        <section className="space-y-8">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-[#8FC3DE] bg-[#8FC3DE]/10 px-3.5 py-1.5 rounded-full border border-[#8FC3DE]/30">
              BROWSE BY EXAM &amp; SUBJECT
            </span>
            <h2 className="text-3xl font-black text-white font-heading">
              Explore Study Materials by Category
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((cat) => (
              <Link
                key={cat.slug}
                href={`/study-notes/${cat.slug}`}
                className="rounded-2xl bg-[#1A2D23]/80 border border-[#F3F0E4]/15 p-6 space-y-3 hover:border-[#F0C93B]/40 transition-colors shadow-lg group block"
              >
                <div className="flex items-center justify-between">
                  <div
                    className="size-10 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: `${cat.color}15`, borderColor: `${cat.color}30`, borderWidth: 1 }}
                  >
                    <BookOpen className="size-5" style={{ color: cat.color }} />
                  </div>
                  <span className="text-[10px] font-mono font-bold text-[#9FAEA1] uppercase">
                    {cat.count}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white font-heading group-hover:text-[#F0C93B] transition-colors">
                  {cat.name}
                </h3>
                <p className="text-xs text-[#9FAEA1] font-light flex items-center gap-1">
                  <span>Browse notes</span> &rarr;
                </p>
              </Link>
            ))}
          </div>
        </section>

        {/* RECENT PUBLIC NOTES */}
        {recentNotes.length > 0 && (
          <section className="space-y-6">
            <div className="flex items-center justify-between border-b border-[#F3F0E4]/10 pb-4">
              <h2 className="text-2xl font-bold text-white font-heading">Recent Published Study Notes</h2>
              <Link href="/blogs" className="text-xs font-mono text-[#F0C93B] hover:underline">
                View All Posts &rarr;
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {recentNotes.map((note) => (
                <div
                  key={note._id}
                  className="rounded-xl bg-[#1A2D23]/60 border border-[#F3F0E4]/10 p-5 space-y-2 shadow"
                >
                  <span className="text-[10px] font-mono text-[#8FC3DE] uppercase bg-[#8FC3DE]/10 px-2 py-0.5 rounded border border-[#8FC3DE]/30">
                    {note.category}
                  </span>
                  <h3 className="text-base font-bold text-white font-heading line-clamp-1">
                    {note.title}
                  </h3>
                  <p className="text-xs text-[#9FAEA1] line-clamp-2 font-light">{note.summary}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* FAQ */}
        <section className="space-y-6">
          <h2 className="text-2xl sm:text-3xl font-black text-white font-heading text-center">
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <div key={idx} className="rounded-2xl bg-[#1A2D23]/80 border border-[#F3F0E4]/15 p-6 space-y-2 shadow-lg">
                <h3 className="text-base font-bold text-white font-heading flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-[#F0C93B] shrink-0" />
                  {faq.question}
                </h3>
                <p className="text-xs sm:text-sm text-[#9FAEA1] leading-relaxed font-light pl-6">
                  {faq.answer}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="rounded-2xl border border-[#F3F0E4]/15 bg-[#1A2D23] p-8 text-center space-y-4 shadow-2xl">
          <h2 className="text-2xl font-bold text-white font-heading">Share Your Notes &amp; Build Your Academic Reputation</h2>
          <p className="text-sm text-[#9FAEA1] max-w-xl mx-auto font-light">
            Join the student notes platform designed for Indian scholars. Publish notes, answer peer doubts, and earn scholar badges.
          </p>
          <div>
            <Link
              href="/signup"
              className="rounded-full bg-[#F0C93B] hover:bg-[#F0C93B]/90 text-[#2A2118] font-bold text-sm px-8 py-3.5 inline-flex items-center gap-2 shadow-lg transition-all font-heading"
            >
              Start Publishing Notes
            </Link>
          </div>
        </section>
      </main>

      <TrustFooter />
    </div>
  );
}
