import React from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  ChevronRight,
} from "lucide-react";
import { TrustHeader } from "@/components/public/TrustHeader";
import { TrustFooter } from "@/components/public/TrustFooter";
import { constructSeoMetadata } from "@/lib/seo/metadata";
import { buildBreadcrumbSchema, buildFAQSchema } from "@/lib/seo/jsonld";
import { connectToDatabase } from "@/lib/mongodb";
import { Note } from "@/models/Note";

export const dynamic = "force-dynamic";

interface SubjectData {
  title: string;
  seoTitle: string;
  description: string;
  h1: string;
  aeoAnswer: string;
  keywords: string[];
  topics: string[];
  faqs: { question: string; answer: string }[];
}

const SUBJECT_MAP: Record<string, SubjectData> = {
  engineering: {
    title: "Engineering Study Notes & BTech Revision Material | Notexia",
    seoTitle: "Engineering Study Notes & BTech Semester Material | Notexia",
    description:
      "Free engineering study notes, BTech lecture summaries, and university exam revision notes for Computer Science, Electrical, Mechanical, and Civil engineering on Notexia.",
    h1: "Engineering Study Notes & BTech Revision Material",
    aeoAnswer:
      "Notexia provides comprehensive engineering study notes and BTech semester revision materials covering Computer Science (Data Structures, Algorithms, OS, DBMS), Electrical Engineering, Mechanical Engineering, and Civil Engineering with LaTeX equations and diagrams.",
    keywords: [
      "engineering notes",
      "BTech notes",
      "BTech study material",
      "engineering study platform",
      "semester exam notes",
      "university exam notes",
      "computer science notes BTech",
    ],
    topics: [
      "Data Structures & Algorithms (C++/Java/Python)",
      "Operating Systems & Process Management",
      "Database Management Systems (DBMS) & SQL",
      "Computer Networks & Protocols",
      "Engineering Mathematics & Calculus",
      "Object Oriented Programming (OOPs)",
    ],
    faqs: [
      {
        question: "Where can I find free engineering and BTech study notes?",
        answer:
          "Notexia offers free access to community-contributed BTech study notes, lecture summaries, and university exam revision guides for all major engineering branches.",
      },
      {
        question: "Are BTech notes on Notexia formatted with code and formulas?",
        answer:
          "Yes! All notes include syntax-highlighted code blocks, block LaTeX math equations, and downloadable PDF/Markdown formats.",
      },
    ],
  },
  btech: {
    title: "BTech Notes & Semester Exam Study Material | Notexia",
    seoTitle: "BTech Notes & Semester Exam Revision Guides | Notexia",
    description:
      "Comprehensive BTech study notes, semester exam preparation guides, and university question banks for Computer Science, IT, ECE, Mechanical, and Civil Engineering.",
    h1: "BTech Study Notes & Semester Exam Guides",
    aeoAnswer:
      "Access curated BTech study notes and semester exam revision guides on Notexia. Formatted with step-by-step mathematical derivations, algorithms, and previous year university question patterns.",
    keywords: [
      "BTech notes",
      "BTech study material",
      "semester exam notes",
      "university exam notes",
      "engineering notes",
      "BTech CSE notes",
    ],
    topics: [
      "Software Engineering & Agile Methodologies",
      "Theory of Computation & Automata",
      "Compiler Design & Parsing",
      "Digital Logic Design & Microprocessors",
      "Analog & Digital Electronics",
    ],
    faqs: [
      {
        question: "Can I use Notexia's AI to summarize my BTech textbook PDFs?",
        answer:
          "Yes! Notexia's AI PDF Summarizer allows BTech students to upload textbook PDFs and generate chapter summaries and formula sheets instantly.",
      },
    ],
  },
  jee: {
    title: "JEE Main & Advanced Study Notes, Formulas & Revision | Notexia",
    seoTitle: "JEE Study Notes, Physics & Math Formulas | Notexia",
    description:
      "Free JEE Main and Advanced study notes, Physics derivations, Organic Chemistry reactions, and Mathematics formula sheets created by top JEE rankers on Notexia.",
    h1: "JEE Main & Advanced Study Notes & Revision",
    aeoAnswer:
      "Notexia offers curated JEE Main and JEE Advanced study notes, high-yield Physics formula sheets, Organic Chemistry reaction mechanisms, and Mathematics problem-solving shortcuts designed for competitive exam revision.",
    keywords: [
      "JEE study notes",
      "JEE notes",
      "JEE Physics notes",
      "JEE Chemistry notes",
      "JEE Math notes",
      "JEE formula sheets",
      "competitive exam preparation",
    ],
    topics: [
      "Physics: Mechanics, Electrodynamics & Optics",
      "Chemistry: Organic Mechanisms, Coordination Chemistry & Thermodynamics",
      "Mathematics: Calculus, Vectors & 3D Geometry, Algebra",
      "High-Yield Formula Sheets & Short Tricks",
    ],
    faqs: [
      {
        question: "Does Notexia provide step-by-step JEE doubt solving?",
        answer:
          "Yes! Students preparing for JEE Main & Advanced can ask complex physics and math numericals to Notexia's 24/7 AI doubt solver and get step-by-step LaTeX solutions.",
      },
    ],
  },
  neet: {
    title: "NEET Exam Study Notes & Biology/Physics/Chemistry | Notexia",
    seoTitle: "NEET Revision Notes & Biology Diagrams | Notexia",
    description:
      "High-yield NEET preparation notes, Biology NCERT line-by-line summaries, Physics formula sheets, and Organic Chemistry reaction tables on Notexia.",
    h1: "NEET Exam Study Notes & NCERT Summaries",
    aeoAnswer:
      "Notexia provides NEET aspirants with line-by-line NCERT Biology chapter summaries, high-yield Physics formula tables, and Organic Chemistry reaction charts for fast medical entrance revision.",
    keywords: [
      "NEET study notes",
      "NEET notes",
      "NEET Biology notes",
      "NEET Physics notes",
      "NEET Chemistry notes",
      "NCERT summary for NEET",
    ],
    topics: [
      "Biology: Genetics, Human Physiology, Plant Physiology, Ecology",
      "Physics: Units & Measurements, Mechanics, Modern Physics",
      "Chemistry: Physical Chemistry Formulas & Inorganic NCERT Line-by-Line",
    ],
    faqs: [
      {
        question: "Are NCERT line-by-line notes available for NEET Biology?",
        answer:
          "Yes, Notexia features community and teacher-uploaded NCERT summaries focused on NEET Biology diagrams, key terms, and past year questions.",
      },
    ],
  },
  gate: {
    title: "GATE Exam Study Notes & Engineering Revision | Notexia",
    seoTitle: "GATE Exam Notes, CS/EC/EE Formula Sheets | Notexia",
    description:
      "Free GATE CS, EC, EE, ME, and CE study notes, formula sheets, short notes, and previous year question breakdowns on Notexia.",
    h1: "GATE Exam Study Notes & Engineering Revision",
    aeoAnswer:
      "Get high-yield GATE study notes and short revision sheets for Computer Science (CS), Electronics (EC), Electrical (EE), Mechanical (ME), and Civil (CE) exams on Notexia.",
    keywords: [
      "GATE study notes",
      "GATE notes",
      "GATE CS notes",
      "GATE engineering mathematics",
      "GATE formula sheet",
    ],
    topics: [
      "GATE CS: Algorithms, Operating Systems, DBMS, TOC, Computer Networks",
      "Engineering Mathematics & Aptitude for GATE",
      "GATE Past Year Solved Problems & Formula Sheets",
    ],
    faqs: [
      {
        question: "Can I download GATE revision notes as PDF on Notexia?",
        answer:
          "Yes! All published GATE revision notes on Notexia can be exported directly to PDF or Markdown files for offline study.",
      },
    ],
  },
  cbse: {
    title: "CBSE Class 10 & 12 Study Notes, Material & Solutions | Notexia",
    seoTitle: "CBSE Class 10 & 12 Study Notes & Board Material | Notexia",
    description:
      "CBSE Board exam study notes, NCERT solutions, chapter summaries, and formula sheets for Class 10 and Class 12 Science & Commerce streams on Notexia.",
    h1: "CBSE Class 10 & 12 Study Notes & Board Material",
    aeoAnswer:
      "Notexia offers CBSE Class 10 and Class 12 students comprehensive chapter notes, NCERT exemplar solutions, board exam revision sheets, and formula tables for Physics, Chemistry, Biology, and Mathematics.",
    keywords: [
      "CBSE notes",
      "CBSE study material",
      "CBSE Class 12 notes",
      "CBSE Class 10 notes",
      "NCERT solutions CBSE",
    ],
    topics: [
      "Class 12 Physics: Electrostatics, Current Electricity, Optics, Atoms",
      "Class 12 Chemistry: Solutions, Electrochemistry, Haloalkanes, Biomolecules",
      "Class 12 Mathematics: Relations & Functions, Calculus, Vectors",
      "Class 10 Science & Mathematics Complete Revision",
    ],
    faqs: [
      {
        question: "How can CBSE students use Notexia for board exam revision?",
        answer:
          "CBSE students can read chapter notes, practice NCERT numericals using the 24/7 AI doubt solver, and calculate their percentage using Notexia's CGPA-to-Percentage converter.",
      },
    ],
  },
};

interface PageProps {
  params: Promise<{ subject: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { subject } = await params;
  const data = SUBJECT_MAP[subject.toLowerCase()];

  if (!data) {
    return constructSeoMetadata({
      title: "Study Notes | Notexia",
      path: `/study-notes/${subject}`,
    });
  }

  return constructSeoMetadata({
    title: data.seoTitle,
    description: data.description,
    path: `/study-notes/${subject.toLowerCase()}`,
    keywords: data.keywords,
  });
}

export default async function ProgrammaticSubjectNotesPage({ params }: PageProps) {
  const { subject } = await params;
  const slug = subject.toLowerCase();
  const data = SUBJECT_MAP[slug];

  if (!data) {
    notFound();
  }

  let dbNotes: Array<{ _id: string; title: string; summary?: string }> = [];

  try {
    await connectToDatabase();
    const fetched = await Note.find({
      published: true,
      isTrashed: false,
      $or: [
        { category: new RegExp(slug, "i") },
        { title: new RegExp(slug, "i") },
        { tags: new RegExp(slug, "i") },
      ],
    })
      .select("_id title summary")
      .limit(6)
      .lean();

    dbNotes = fetched.map((n) => ({
      _id: String(n._id),
      title: n.title,
      summary: n.summary || "Student study note.",
    }));
  } catch {
    // Fallback
  }

  const breadcrumbs = [
    { name: "Home", item: "/" },
    { name: "Study Notes", item: "/study-notes" },
    { name: data.h1, item: `/study-notes/${slug}` },
  ];

  return (
    <div className="min-h-screen bg-[#16261D] text-[#F3F0E4] font-sans selection:bg-[#F0C93B]/30 flex flex-col antialiased">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildBreadcrumbSchema(breadcrumbs)) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildFAQSchema(data.faqs)) }}
      />

      <TrustHeader title={`${slug.toUpperCase()} NOTES`} />

      <main className="max-w-5xl w-full mx-auto px-4 sm:px-6 py-12 sm:py-16 space-y-16 flex-1">
        {/* HERO */}
        <section className="rounded-[2.5rem] bg-[#1A2D23]/90 border border-[#F3F0E4]/15 p-2 shadow-2xl">
          <div className="rounded-[calc(2.5rem-0.5rem)] bg-[#121F18] p-8 sm:p-12 space-y-6 shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)] relative overflow-hidden">
            <div className="flex items-center gap-2 text-xs font-mono text-[#8FC3DE]">
              <Link href="/study-notes" className="hover:underline">Study Notes Directory</Link>
              <ChevronRight className="size-3" />
              <span className="text-[#F0C93B] uppercase">{slug}</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black text-[#F3F0E4] tracking-tight font-heading leading-tight max-w-3xl">
              {data.h1}
            </h1>

            {/* AEO Direct Answer Block */}
            <div className="p-5 rounded-2xl bg-[#16261D]/90 border border-[#F0C93B]/30 space-y-2">
              <p className="text-xs font-mono text-[#F0C93B] font-bold uppercase tracking-widest">
                DIRECT ANSWER / SYLLABUS OVERVIEW
              </p>
              <p className="text-sm text-[#F3F0E4] leading-relaxed font-normal">
                {data.aeoAnswer}
              </p>
            </div>

            <div className="pt-2 flex flex-wrap items-center gap-4">
              <Link
                href="/signup"
                className="group rounded-full bg-[#F0C93B] hover:bg-[#F0C93B]/90 text-[#2A2118] font-bold text-sm px-7 py-3.5 inline-flex items-center gap-3 transition-all shadow-[0_0_20px_rgba(240,201,59,0.3)] font-heading"
              >
                <span>Publish {data.h1} Free</span>
                <ArrowRight className="size-4 text-[#2A2118] group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/ai-study-tools"
                className="rounded-full bg-[#1A2D23] hover:bg-[#1A2D23]/80 border border-[#F3F0E4]/20 text-[#F3F0E4] font-semibold text-sm px-6 py-3.5 inline-flex items-center gap-2 transition-all"
              >
                <span>AI Doubt Solver</span>
              </Link>
            </div>
          </div>
        </section>

        {/* CURATED TOPICS */}
        <section className="space-y-6">
          <div className="text-center space-y-2">
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-[#8FC3DE] bg-[#8FC3DE]/10 px-3.5 py-1.5 rounded-full border border-[#8FC3DE]/30">
              HIGH-YIELD REVISION MODULES
            </span>
            <h2 className="text-3xl font-black text-white font-heading">
              Core Study Modules &amp; Chapters
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.topics.map((topic, idx) => (
              <div
                key={idx}
                className="rounded-xl bg-[#1A2D23]/80 border border-[#F3F0E4]/15 p-5 space-y-2 flex items-start gap-3 shadow-lg"
              >
                <CheckCircle2 className="size-5 text-[#F0C93B] shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-bold text-white font-heading">{topic}</h3>
                  <p className="text-xs text-[#9FAEA1] font-light pt-1">
                    Includes definitions, LaTeX equations, key diagrams, and active recall checklists.
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* COMMUNITY PUBLISHED NOTES (DYNAMIC DB QUERY) */}
        {dbNotes.length > 0 && (
          <section className="space-y-6">
            <h2 className="text-2xl font-bold text-white font-heading">
              Community Published {data.h1}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {dbNotes.map((n) => (
                <div
                  key={n._id}
                  className="rounded-xl bg-[#1A2D23]/60 border border-[#F3F0E4]/10 p-5 space-y-2 shadow"
                >
                  <h3 className="text-base font-bold text-white font-heading line-clamp-1">
                    {n.title}
                  </h3>
                  <p className="text-xs text-[#9FAEA1] line-clamp-2 font-light">{n.summary}</p>
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
            {data.faqs.map((faq, idx) => (
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

        {/* RELATED SUBJECT LINKS */}
        <section className="space-y-4 pt-4 border-t border-[#F3F0E4]/10 text-center">
          <p className="text-xs font-mono text-[#9FAEA1] uppercase tracking-wider">
            Explore Other Study Categories
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {Object.keys(SUBJECT_MAP)
              .filter((s) => s !== slug)
              .map((s) => (
                <Link
                  key={s}
                  href={`/study-notes/${s}`}
                  className="px-4 py-2 rounded-full bg-[#1A2D23] border border-[#F3F0E4]/15 text-xs text-[#F3F0E4] hover:border-[#F0C93B] transition-colors uppercase font-mono"
                >
                  {s} Notes &rarr;
                </Link>
              ))}
          </div>
        </section>
      </main>

      <TrustFooter />
    </div>
  );
}
