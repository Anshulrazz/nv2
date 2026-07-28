import React from "react";
import Link from "next/link";
import { auth } from "@/auth";
import {
  ArrowUpRight,
  Sparkles,
  MessageSquare,
  Bot,
  FileText,
  Trophy,
  BookOpen,
  Star,
  ShieldCheck,
  GraduationCap,
  Calculator,
  CheckCircle2,
  HelpCircle,
  Zap,
} from "lucide-react";
import { Hero3DShowcase } from "@/components/marketing/Hero3DShowcase";
import { Reveal } from "@/components/marketing/Reveal";
import { CountUp } from "@/components/marketing/CountUp";
import { FAQAccordion } from "@/components/marketing/FAQAccordion";
import { buildFAQSchema } from "@/lib/seo/jsonld";

const homepageFaqs = [
  {
    question: "What is Notexia and who is it designed for?",
    answer: "Notexia is an AI-powered study platform built for Indian students, engineering undergraduates, researchers, and competitive exam aspirants (JEE, NEET, CBSE, GATE). It provides TipTap note editing, LaTeX formula support, instant AI doubt solving, community blogs, and gamified batch leaderboards in a single workspace.",
  },
  {
    question: "How does the AI copilot & doubt solver work?",
    answer: "Notexia's AI copilot integrates Anthropic Claude and OpenRouter models to answer complex physics, mathematics, and computer science questions. You can ask doubts directly inside your study notes, generate step-by-step code blueprints, or summarize length textbook chapters in seconds.",
  },
  {
    question: "Is Notexia free for students?",
    answer: "Yes! Notexia offers free access to all core study features including public note publishing, student forums, doubt resolution threads, formula calculators, and community leaderboards. Optional premium features offer higher AI query quotas and advanced research synthesis.",
  },
  {
    question: "Can I export my study notes and LaTeX math formulas?",
    answer: "Absolutely. All study notes created on Notexia support rich markdown, inline and block LaTeX formulas (via KaTeX), code blocks, and images. You can export your notes to clean PDF or Markdown files anytime.",
  },
  {
    question: "How does the gamified batch leaderboard work?",
    answer: "As you publish verified study notes, answer peer doubts, and contribute helpful forum posts, you earn activity points and scholar badges. The live leaderboard ranks top student contributors across university batches and exam streams.",
  },
  {
    question: "Can I publish my research articles and notes publicly?",
    answer: "Yes! Notexia allows scholars to publish their notes and articles as public blog posts under their custom profile URL (`notexia.in/blog/username/slug`). Public posts are indexed on Google for search visibility.",
  },
];

export default async function MarketingPage() {
  const session = await auth();
  const isLoggedIn = !!session?.user;

  return (
    <div className="min-h-screen bg-[#16261D] text-[#F3F0E4] font-sans selection:bg-[#F0C93B]/30 overflow-hidden relative antialiased">
      {/* Script for FAQPage Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildFAQSchema(homepageFaqs)) }}
      />

      {/* ── Ambient Background Glows ── */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-[#8FC3DE]/10 rounded-full blur-[140px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[700px] h-[700px] bg-[#F28B6E]/8 rounded-full blur-[160px]" />
        <div className="absolute top-[40%] right-[10%] w-[500px] h-[500px] bg-[#C9A9E0]/8 rounded-full blur-[150px]" />
        <div className="absolute bottom-[30%] left-[5%] w-[550px] h-[550px] bg-[#F0C93B]/8 rounded-full blur-[140px]" />
      </div>

      {/* ── HEADER NAVIGATION ── */}
      <header className="fixed top-0 inset-x-0 z-50 bg-[#16261D]/80 backdrop-blur-xl border-b border-[#F3F0E4]/10 transition-all duration-300">
        <div className="max-w-[1400px] mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="size-10 rounded-xl bg-[#F0C93B]/10 border border-[#F0C93B]/30 flex items-center justify-center text-[#F0C93B] group-hover:scale-105 transition-transform duration-300 shadow-[2px_2px_0_0_#F28B6E]">
              <Sparkles className="size-5" />
            </div>
            <span className="text-xl font-bold tracking-widest text-[#F3F0E4] font-heading">
              NOTEXIA
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-xs font-bold text-[#9FAEA1] font-heading tracking-wide uppercase">
            <a href="#features" className="hover:text-[#F3F0E4] transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-[#F3F0E4] transition-colors">Workflow</a>
            <a href="#tools" className="hover:text-[#F3F0E4] transition-colors">Free Tools</a>
            <a href="#faq" className="hover:text-[#F3F0E4] transition-colors">FAQ</a>
            <Link href="/feed" className="hover:text-[#F3F0E4] transition-colors">Public Feed</Link>
          </nav>

          <div className="flex items-center gap-4">
            {isLoggedIn ? (
              <Link
                href="/dashboard"
                className="group rounded-xl bg-[#F0C93B] hover:bg-[#F0C93B]/90 text-[#2A2118] font-bold text-xs px-5 py-2.5 inline-flex items-center gap-2 transition-all duration-300 shadow-[3px_3px_0_0_#F28B6E] font-heading"
              >
                <span>Dashboard</span>
                <ArrowUpRight className="size-4 text-[#2A2118] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-200" />
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="hidden sm:inline-flex text-xs font-bold text-[#F3F0E4] hover:text-[#F0C93B] transition-colors px-4 py-2 font-heading uppercase tracking-wide"
                >
                  Sign In
                </Link>
                <Link
                  href="/signup"
                  className="group rounded-xl bg-[#F0C93B] hover:bg-[#F0C93B]/90 text-[#2A2118] font-bold text-xs px-5 py-2.5 inline-flex items-center gap-2 transition-all duration-300 shadow-[3px_3px_0_0_#F28B6E] font-heading"
                >
                  <span>Get Started Free</span>
                  <ArrowUpRight className="size-4 text-[#2A2118] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-200" />
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ── MAIN CONTENT ── */}
      <main className="pt-28 sm:pt-36 relative z-10">
        {/* HERO SECTION */}
        <section className="px-6 pb-16 sm:pb-24 max-w-[1400px] mx-auto">
          <div className="text-center space-y-6">
            <Reveal>
              <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-[#1A2D23]/90 border border-[#F3F0E4]/15 text-[#8FC3DE] text-xs font-mono font-bold shadow-lg">
                <Zap className="size-3.5 text-[#F0C93B] animate-pulse" />
                <span>AI-POWERED STUDY PLATFORM FOR INDIAN STUDENTS</span>
              </div>
            </Reveal>

            <Reveal delay={80}>
              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-[#F3F0E4] max-w-[22ch] mx-auto leading-[1.1] font-heading">
                Smart Notes, AI Doubt Solving &amp; Student Study Community
              </h1>
            </Reveal>

            {/* AEO Direct Answer Summary Block */}
            <Reveal delay={140}>
              <p className="text-sm sm:text-base text-[#9FAEA1] max-w-3xl mx-auto leading-relaxed font-light">
                Notexia is an integrated academic workspace for students and researchers. Organize study notes with TipTap and LaTeX formulas, solve physics and coding doubts with AI copilots, publish research blogs, and compete on gamified batch leaderboards.
              </p>
            </Reveal>

            <Reveal delay={200}>
              <div className="flex flex-wrap gap-4 justify-center items-center pt-2">
                {isLoggedIn ? (
                  <Link
                    href="/dashboard"
                    className="group rounded-xl bg-[#F0C93B] hover:bg-[#F0C93B]/90 text-[#2A2118] font-bold text-sm pl-6 pr-3 py-3.5 inline-flex items-center gap-3 transition-all duration-300 active:scale-[0.97] shadow-[4px_4px_0_0_#F28B6E] font-heading"
                  >
                    <span>Open Dashboard</span>
                    <div className="size-8 rounded-full bg-[#2A2118] flex items-center justify-center text-[#F0C93B] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-200">
                      <ArrowUpRight className="size-4 text-[#F0C93B]" />
                    </div>
                  </Link>
                ) : (
                  <>
                    <Link
                      href="/signup"
                      className="group rounded-xl bg-[#F0C93B] hover:bg-[#F0C93B]/90 text-[#2A2118] font-bold text-sm pl-6 pr-3 py-3.5 inline-flex items-center gap-3 transition-all duration-300 active:scale-[0.97] shadow-[4px_4px_0_0_#F28B6E] font-heading"
                    >
                      <span>Get Started Free</span>
                      <div className="size-8 rounded-full bg-[#2A2118] flex items-center justify-center text-[#F0C93B] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-200">
                        <ArrowUpRight className="size-4 text-[#F0C93B]" />
                      </div>
                    </Link>
                    <Link
                      href="/feed"
                      className="rounded-xl bg-[#1A2D23] hover:bg-[#1A2D23]/80 border border-[#F3F0E4]/15 text-[#F3F0E4] font-bold text-sm px-6 py-3.5 inline-flex items-center gap-2 transition-all duration-300 font-heading"
                    >
                      <span>Explore Public Feed</span>
                    </Link>
                  </>
                )}
              </div>
            </Reveal>
          </div>

          {/* Interactive 3D Showcase */}
          <Reveal delay={280} className="pt-10">
            <Hero3DShowcase />
          </Reveal>
        </section>

        {/* METRICS STATS BAR */}
        <section className="border-y border-[#F3F0E4]/10 bg-[#121F18]/90 py-12 relative z-10">
          <div className="max-w-[1400px] mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { val: 25000, suffix: "+", label: "Study Notes Published" },
              { val: 12000, suffix: "+", label: "Doubts Solved by AI" },
              { val: 4.9, suffix: "/5", decimals: 1, label: "Student Satisfaction Rating" },
              { val: 99.9, suffix: "%", decimals: 1, label: "System Uptime" },
            ].map(({ val, suffix, decimals, label }) => (
              <div key={label} className="space-y-1">
                <div className="text-2xl sm:text-4xl font-black text-[#F3F0E4] font-heading">
                  <CountUp value={val} decimals={decimals} suffix={suffix} />
                </div>
                <div className="text-xs text-[#9FAEA1] font-light">{label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* HOW NOTEXIA WORKS (WORKFLOW SECTION) */}
        <section id="how-it-works" className="py-24 max-w-[1400px] mx-auto px-6 relative z-10">
          <div className="text-center space-y-4 mb-16">
            <Reveal>
              <span className="text-xs font-mono font-bold uppercase tracking-widest text-[#F0C93B] bg-[#F0C93B]/10 px-3 py-1 rounded-full border border-[#F0C93B]/30">
                ACADEMIC WORKFLOW
              </span>
            </Reveal>
            <Reveal delay={60}>
              <h2 className="text-3xl sm:text-4xl font-black text-[#F3F0E4] font-heading">
                How Notexia Accelerates Your Learning
              </h2>
            </Reveal>
            <Reveal delay={120}>
              <p className="text-sm sm:text-base text-[#9FAEA1] max-w-2xl mx-auto font-light">
                Four simple steps from taking rough lecture notes to mastering complex engineering and exam topics.
              </p>
            </Reveal>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              {
                step: "01",
                title: "Write & Format Notes",
                desc: "Create rich study notes using TipTap editor, code blocks, and KaTeX math formulas with automatic cloud sync.",
                icon: FileText,
                accent: "text-[#8FC3DE]",
              },
              {
                step: "02",
                title: "Ask AI Copilot",
                desc: "Stuck on a concept? Query the AI copilot directly inside your note to generate step-by-step explanations.",
                icon: Bot,
                accent: "text-[#F0C93B]",
              },
              {
                step: "03",
                title: "Discuss & Solve Doubts",
                desc: "Post difficult questions to the doubts hub. Get answers from AI models and verified peer scholars.",
                icon: MessageSquare,
                accent: "text-[#C9A9E0]",
              },
              {
                step: "04",
                title: "Publish & Earn Ranks",
                desc: "Share your notes as public blog posts. Earn scholar badges and climb your university batch leaderboard.",
                icon: Trophy,
                accent: "text-[#F28B6E]",
              },
            ].map((item, idx) => (
              <Reveal key={item.step} delay={idx * 80}>
                <div className="rounded-[2rem] bg-[#1A2D23]/80 border border-[#F3F0E4]/15 p-6 space-y-4 shadow-xl h-full flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-black font-mono text-[#F0C93B]/40">{item.step}</span>
                      <item.icon className={`size-6 ${item.accent}`} />
                    </div>
                    <h3 className="text-lg font-bold text-[#F3F0E4] font-heading">{item.title}</h3>
                    <p className="text-xs text-[#9FAEA1] leading-relaxed font-light">{item.desc}</p>
                  </div>
                  <div className="pt-2 border-t border-[#F3F0E4]/10 flex items-center gap-1 text-[11px] font-mono text-[#8FC3DE]">
                    <CheckCircle2 className="size-3.5 text-[#3fb950]" /> Verified Process
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* FEATURES BREAKDOWN GRID */}
        <section id="features" className="py-20 bg-[#121F18]/60 border-t border-[#F3F0E4]/10 relative z-10">
          <div className="max-w-[1400px] mx-auto px-6 space-y-16">
            <div className="text-center space-y-4">
              <Reveal>
                <span className="text-xs font-mono font-bold uppercase tracking-widest text-[#8FC3DE] bg-[#8FC3DE]/10 px-3 py-1 rounded-full border border-[#8FC3DE]/30">
                  ALL-IN-ONE PLATFORM
                </span>
              </Reveal>
              <Reveal delay={60}>
                <h2 className="text-3xl sm:text-4xl font-black text-[#F3F0E4] font-heading">
                  Engineered for High-Performance Learning
                </h2>
              </Reveal>
              <Reveal delay={120}>
                <p className="text-sm sm:text-base text-[#9FAEA1] max-w-2xl mx-auto font-light">
                  Everything you need to excel in university semester exams, GATE, JEE, NEET, and research projects.
                </p>
              </Reveal>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  title: "LaTeX Math & Code Blueprints",
                  desc: "Write beautiful mathematical equations, quantum physics derivations, and syntax-highlighted code snippets with real-time preview.",
                  icon: BookOpen,
                  tag: "Rich Formatting",
                },
                {
                  title: "Instant AI Doubt Resolution",
                  desc: "Never stay blocked on a homework problem. Notexia's AI analyzes formulas, code errors, and conceptual questions 24/7.",
                  icon: Bot,
                  tag: "24/7 AI Tutor",
                },
                {
                  title: "Public Blog Publishing",
                  desc: "Transform your private notes into beautifully rendered public blogs with custom URLs, canonical tags, and social share cards.",
                  icon: FileText,
                  tag: "SEO Publishing",
                },
                {
                  title: "Gamified Batch Leaderboard",
                  desc: "Earn activity coins and scholar badges for answering peer questions. Compare your academic contributions with university peers.",
                  icon: Trophy,
                  tag: "Rankings",
                },
                {
                  title: "Study Group Forums & Chat",
                  desc: "Connect with classmates in subject forums or direct message peers to collaborate on group assignments and research papers.",
                  icon: MessageSquare,
                  tag: "Peer Network",
                },
                {
                  title: "Free Calculator & Formula Tools",
                  desc: "Access free online tools including CGPA-to-Percentage converters (CBSE, VTU, KTU) and formula cheat sheets.",
                  icon: Calculator,
                  tag: "Utility Tools",
                },
              ].map((feature, idx) => (
                <Reveal key={feature.title} delay={idx * 60}>
                  <div className="rounded-[2rem] bg-[#1A2D23]/90 border border-[#F3F0E4]/15 p-8 space-y-4 shadow-xl hover:border-[#F0C93B]/40 transition-colors duration-300 h-full flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="size-12 rounded-2xl bg-[#F0C93B]/10 border border-[#F0C93B]/30 flex items-center justify-center text-[#F0C93B]">
                          <feature.icon className="size-6" />
                        </div>
                        <span className="text-[10px] font-mono font-bold bg-[#8FC3DE]/10 text-[#8FC3DE] px-3 py-1 rounded-full border border-[#8FC3DE]/20 uppercase">
                          {feature.tag}
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-[#F3F0E4] font-heading">{feature.title}</h3>
                      <p className="text-xs text-[#9FAEA1] leading-relaxed font-light">{feature.desc}</p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* FREE UTILITY TOOLS SECTION */}
        <section id="tools" className="py-20 max-w-[1400px] mx-auto px-6 relative z-10">
          <div className="rounded-[2.5rem] bg-[#1A2D23] border border-[#F3F0E4]/15 p-8 sm:p-12 flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl">
            <div className="space-y-4 text-center sm:text-left max-w-xl">
              <span className="text-xs font-mono font-bold uppercase tracking-widest text-[#F0C93B] bg-[#F0C93B]/10 px-3 py-1 rounded-full border border-[#F0C93B]/30">
                FREE STUDENT TOOLS
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-[#F3F0E4] font-heading">
                Try Our Free Academic Calculators
              </h2>
              <p className="text-xs sm:text-sm text-[#9FAEA1] leading-relaxed font-light">
                Calculate your exact percentage marks from CGPA for CBSE 10th/12th, VTU, KTU, and Mumbai University with official conversion formulas.
              </p>
            </div>
            <Link
              href="/tools/cgpa-converter"
              className="group rounded-xl bg-[#F0C93B] hover:bg-[#F0C93B]/90 text-[#2A2118] font-bold text-sm px-6 py-4 inline-flex items-center gap-3 transition-all duration-300 shadow-[4px_4px_0_0_#F28B6E] shrink-0 font-heading"
            >
              <Calculator className="size-5 text-[#2A2118]" />
              <span>Open CGPA Calculator</span>
              <ArrowUpRight className="size-4 text-[#2A2118] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-200" />
            </Link>
          </div>
        </section>

        {/* FAQ ACCORDION SECTION */}
        <section id="faq" className="py-20 bg-[#121F18]/80 border-t border-[#F3F0E4]/10 relative z-10">
          <div className="max-w-[1000px] mx-auto px-6 space-y-12">
            <div className="text-center space-y-4">
              <Reveal>
                <span className="text-xs font-mono font-bold uppercase tracking-widest text-[#F0C93B] bg-[#F0C93B]/10 px-3 py-1 rounded-full border border-[#F0C93B]/30">
                  FREQUENTLY ASKED QUESTIONS
                </span>
              </Reveal>
              <Reveal delay={60}>
                <h2 className="text-3xl sm:text-4xl font-black text-[#F3F0E4] font-heading">
                  Everything You Need to Know
                </h2>
              </Reveal>
            </div>

            <Reveal delay={120}>
              <FAQAccordion faqs={homepageFaqs} />
            </Reveal>
          </div>
        </section>
      </main>

      {/* ── FOOTER ── */}
      <footer className="border-t border-[#F3F0E4]/10 bg-[#121F18] py-16 text-xs text-[#9FAEA1] relative z-10">
        <div className="max-w-[1400px] mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-2.5">
            <div className="size-2 rounded-full bg-[#8FC3DE] animate-pulse" />
            <span className="font-mono text-[#8FC3DE]">All systems operational</span>
          </div>
          <div className="text-[#9FAEA1]">
            &copy; {new Date().getFullYear()} Notexia Inc. All rights reserved. Made for Indian Students &amp; Engineers.
          </div>
          <div className="flex items-center gap-8 font-heading uppercase text-[11px] font-bold">
            <Link href="/privacy" className="hover:text-[#F3F0E4] transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-[#F3F0E4] transition-colors">Terms</Link>
            <Link href="/security" className="hover:text-[#F3F0E4] transition-colors">Security</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}