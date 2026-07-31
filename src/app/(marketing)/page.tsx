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
  Calculator,
  CheckCircle2,
  Zap,
  Users,
  ShieldCheck,
  Star,
  ArrowRight,
  GraduationCap,
  TrendingUp,
} from "lucide-react";
import { HeroWorkspaceShowcase } from "@/components/marketing/HeroWorkspaceShowcase";
import { InteractiveDoubtSimulator } from "@/components/marketing/InteractiveDoubtSimulator";
import { Reveal } from "@/components/marketing/Reveal";
import { CountUp } from "@/components/marketing/CountUp";
import { FAQAccordion } from "@/components/marketing/FAQAccordion";
import { buildFAQSchema } from "@/lib/seo/jsonld";

const homepageFaqs = [
  {
    question: "What is Notexia and who is it designed for?",
    answer: "Notexia is an AI-powered study platform built for Indian students, engineering undergraduates, researchers, and competitive exam aspirants (JEE, NEET, CBSE, GATE, UPSC). It provides TipTap note editing, LaTeX formula support, instant AI doubt solving, community blogs, and gamified batch leaderboards in a single workspace.",
  },
  {
    question: "How does the AI copilot & doubt solver work?",
    answer: "Notexia's AI copilot integrates Anthropic Claude and OpenRouter models to answer complex physics, mathematics, and computer science questions. You can ask doubts directly inside your study notes, generate step-by-step code blueprints, or summarize lengthy textbook chapters in seconds.",
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

const studentReviews = [
  {
    quote: "Notexia's AI copilot helped me derive complex Electromagnetic Wave equations for my GATE physics revision in seconds. The LaTeX rendering is super clean!",
    author: "Rohan Kulkarni",
    role: "GATE Physics Aspirant • IIT Bombay Batch",
    rating: 5,
  },
  {
    quote: "The CGPA to percentage converter and TipTap markdown notes saved me hours during semester exams. Easily the best study tool for VTU engineers.",
    author: "Sneha Nair",
    role: "Computer Science Undergrad • VTU",
    rating: 5,
  },
  {
    quote: "Publishing my semester revision notes on Notexia earned me over 450 activity coins and topped our batch leaderboard. My peers love the shared study group forums!",
    author: "Aarav Sharma",
    role: "JEE Advanced Scholar • Kota",
    rating: 5,
  },
];

export default async function MarketingPage() {
  const session = await auth();
  const isLoggedIn = !!session?.user;

  return (
    <div className="min-h-screen bg-[#16261D] text-[#F3F0E4] font-sans selection:bg-[#F0C93B]/30 overflow-hidden relative antialiased">
      {/* FAQPage Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildFAQSchema(homepageFaqs)) }}
      />

      {/* Ambient Background Glow Orbs */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-[#8FC3DE]/10 rounded-full blur-[140px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[700px] h-[700px] bg-[#F28B6E]/8 rounded-full blur-[160px]" />
        <div className="absolute top-[40%] right-[10%] w-[500px] h-[500px] bg-[#C9A9E0]/8 rounded-full blur-[150px]" />
        <div className="absolute bottom-[30%] left-[5%] w-[550px] h-[550px] bg-[#F0C93B]/8 rounded-full blur-[140px]" />
      </div>

      {/* ── FLOATING ISLAND NAVBAR ── */}
      <header className="fixed top-4 inset-x-0 z-50 px-4">
        <div className="max-w-5xl mx-auto rounded-full bg-[#121F18]/90 border border-[#F3F0E4]/15 backdrop-blur-xl px-6 h-16 flex items-center justify-between shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="size-8 rounded-lg bg-[#F0C93B]/20 border border-[#F0C93B]/40 flex items-center justify-center text-[#F0C93B] font-mono text-xs font-bold group-hover:scale-105 transition-transform">
              N
            </div>
            <span className="text-base font-bold tracking-widest text-[#F3F0E4] font-heading">
              NOTEXIA
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-xs font-bold text-[#9FAEA1] font-heading tracking-wide uppercase">
            <a href="#features" className="hover:text-[#F3F0E4] transition-colors">Features</a>
            <a href="#demo" className="hover:text-[#F3F0E4] transition-colors">Live AI Demo</a>
            <a href="#offers" className="hover:text-[#F3F0E4] transition-colors">Offers &amp; Coupons</a>
            <a href="#how-it-works" className="hover:text-[#F3F0E4] transition-colors">Workflow</a>
            <a href="#tools" className="hover:text-[#F3F0E4] transition-colors">Calculators</a>
            <a href="#reviews" className="hover:text-[#F3F0E4] transition-colors">Reviews</a>
            <Link href="/feed" className="hover:text-[#F3F0E4] transition-colors">Public Feed</Link>
          </nav>

          <div className="flex items-center gap-3">
            {isLoggedIn ? (
              <Link
                href="/dashboard"
                className="group rounded-full bg-[#F0C93B] hover:bg-[#F0C93B]/90 text-[#2A2118] font-bold text-xs pl-4 pr-2 py-2 inline-flex items-center gap-2 transition-all duration-300 shadow-md font-heading active:scale-[0.98]"
              >
                <span>Dashboard</span>
                <div className="size-5 rounded-full bg-[#2A2118] flex items-center justify-center text-[#F0C93B]">
                  <ArrowUpRight className="size-3 text-[#F0C93B]" />
                </div>
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="hidden sm:inline-flex text-xs font-bold text-[#F3F0E4] hover:text-[#F0C93B] transition-colors px-3 py-1.5 font-heading uppercase tracking-wide"
                >
                  Sign In
                </Link>
                <Link
                  href="/signup"
                  className="group rounded-full bg-[#F0C93B] hover:bg-[#F0C93B]/90 text-[#2A2118] font-bold text-xs pl-4 pr-2 py-2 inline-flex items-center gap-2 transition-all duration-300 shadow-md font-heading active:scale-[0.98]"
                >
                  <span>Get Started Free</span>
                  <div className="size-5 rounded-full bg-[#2A2118] flex items-center justify-center text-[#F0C93B]">
                    <ArrowUpRight className="size-3 text-[#F0C93B]" />
                  </div>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ── MAIN HERO & LANDING CONTENT ── */}
      <main className="pt-28 sm:pt-36 relative z-10 space-y-24 sm:space-y-32">
        {/* HERO SECTION WITH DOUBLE-BEZEL FRAMING */}
        <section className="px-4 sm:px-6 max-w-[1400px] mx-auto">
          <div className="space-y-12 text-center">
            {/* HERO EYEBROW BADGE */}
            <Reveal>
              <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-[#1A2D23]/90 border border-[#F3F0E4]/15 text-[#8FC3DE] text-xs font-mono font-bold shadow-lg">
                <Zap className="size-3.5 text-[#F0C93B] animate-pulse" />
                <span>INTELLIGENT STUDY PLATFORM FOR INDIAN STUDENTS</span>
              </div>
            </Reveal>

            {/* HERO HEADLINE */}
            <Reveal delay={80}>
              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-[#F3F0E4] max-w-[24ch] mx-auto leading-[1.1] font-heading">
                Smart Notes, AI Doubt Solving &amp; Student Study Community
              </h1>
            </Reveal>

            {/* AEO SUMMARY DIRECT ANSWER */}
            <Reveal delay={140}>
              <p className="text-sm sm:text-base text-[#9FAEA1] max-w-3xl mx-auto leading-relaxed font-light">
                Notexia combines rich TipTap markdown editing with LaTeX formulas, 24/7 AI copilot doubt resolution, student forums, public blogs, and official university CGPA calculators for CBSE, VTU, KTU, and Mumbai University.
              </p>
            </Reveal>

            {/* HERO ACTION BUTTONS WITH BUTTON-IN-BUTTON ARCHITECTURE */}
            <Reveal delay={200}>
              <div className="flex flex-wrap gap-4 justify-center items-center pt-2">
                {isLoggedIn ? (
                  <Link
                    href="/dashboard"
                    className="group rounded-full bg-[#F0C93B] hover:bg-[#F0C93B]/90 text-[#2A2118] font-bold text-sm pl-7 pr-3 py-3.5 inline-flex items-center gap-3 transition-all duration-300 active:scale-[0.98] shadow-[0_0_25px_rgba(240,201,59,0.3)] font-heading"
                  >
                    <span>Open Student Dashboard</span>
                    <div className="size-8 rounded-full bg-[#2A2118] flex items-center justify-center text-[#F0C93B] group-hover:translate-x-1 transition-transform">
                      <ArrowRight className="size-4 text-[#F0C93B]" />
                    </div>
                  </Link>
                ) : (
                  <>
                    <Link
                      href="/signup"
                      className="group rounded-full bg-[#F0C93B] hover:bg-[#F0C93B]/90 text-[#2A2118] font-bold text-sm pl-7 pr-3 py-3.5 inline-flex items-center gap-3 transition-all duration-300 active:scale-[0.98] shadow-[0_0_25px_rgba(240,201,59,0.3)] font-heading"
                    >
                      <span>Create Free Account</span>
                      <div className="size-8 rounded-full bg-[#2A2118] flex items-center justify-center text-[#F0C93B] group-hover:translate-x-1 transition-transform">
                        <ArrowRight className="size-4 text-[#F0C93B]" />
                      </div>
                    </Link>
                    <Link
                      href="/feed"
                      className="rounded-full bg-[#1A2D23] hover:bg-[#1A2D23]/80 border border-[#F3F0E4]/15 text-[#F3F0E4] font-bold text-sm px-7 py-3.5 inline-flex items-center gap-2 transition-all duration-300 font-heading"
                    >
                      <span>Explore Public Notes</span>
                    </Link>
                  </>
                )}
              </div>
            </Reveal>

            {/* WORKSPACE SHOWCASE (2D DOUBLE-BEZEL) */}
            <Reveal delay={260} className="pt-6">
              <HeroWorkspaceShowcase />
            </Reveal>
          </div>
        </section>

        {/* METRICS & TELEMETRY TRUST BAR */}
        <section className="border-y border-[#F3F0E4]/10 bg-[#121F18]/90 py-12 relative z-10">
          <div className="max-w-[1400px] mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { val: 25480, suffix: "+", label: "Study Notes Authored" },
              { val: 14820, suffix: "+", label: "Doubts Solved by AI" },
              { val: 4.9, suffix: "/5", decimals: 1, label: "Student Rating (120+ Universities)" },
              { val: 99.9, suffix: "%", decimals: 1, label: "System Availability" },
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

        {/* INTERACTIVE LIVE AI DOUBT SIMULATOR DEMO */}
        <section id="demo" className="max-w-5xl mx-auto px-4 sm:px-6 relative z-10">
          <Reveal>
            <InteractiveDoubtSimulator />
          </Reveal>
        </section>

        {/* BENTO GRID 2.0 FEATURE SECTION */}
        <section id="features" className="max-w-[1400px] mx-auto px-4 sm:px-6 relative z-10 space-y-12">
          <div className="text-center space-y-4 max-w-3xl mx-auto">
            <Reveal>
              <span className="text-xs font-mono font-bold uppercase tracking-widest text-[#8FC3DE] bg-[#8FC3DE]/10 px-3.5 py-1.5 rounded-full border border-[#8FC3DE]/30">
                POWERFUL PLATFORM ENGINE
              </span>
            </Reveal>
            <Reveal delay={60}>
              <h2 className="text-3xl sm:text-5xl font-black text-[#F3F0E4] font-heading">
                Built for High-Performance Student Learning
              </h2>
            </Reveal>
            <Reveal delay={120}>
              <p className="text-sm sm:text-base text-[#9FAEA1] font-light leading-relaxed">
                Everything you need to organize lecture notes, solve difficult homework problems, and collaborate with peers across India.
              </p>
            </Reveal>
          </div>

          {/* BENTO ASYMMETRICAL CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* CARD 1: TIPTAP MARKDOWN & LATEX (SPAN 8) */}
            <div className="md:col-span-8 rounded-[2rem] bg-[#1A2D23]/90 border border-[#F3F0E4]/15 p-2 shadow-xl">
              <div className="rounded-[calc(2rem-0.5rem)] bg-[#121F18] p-8 space-y-6 h-full flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="size-12 rounded-2xl bg-[#8FC3DE]/10 border border-[#8FC3DE]/30 flex items-center justify-center text-[#8FC3DE]">
                    <BookOpen className="size-6" />
                  </div>
                  <div className="space-y-2">
                    <span className="text-[10px] font-mono font-bold text-[#8FC3DE] uppercase tracking-wider bg-[#8FC3DE]/10 px-3 py-1 rounded-full border border-[#8FC3DE]/20">
                      RICH EDITOR &amp; LATEX
                    </span>
                    <h3 className="text-2xl font-bold text-white font-heading">
                      TipTap Markdown &amp; KaTeX Equation Renderer
                    </h3>
                    <p className="text-xs sm:text-sm text-[#9FAEA1] font-light leading-relaxed">
                      Author beautiful study notes with syntax highlighted code blocks, checkboxes, and inline or block LaTeX equations. Export to PDF or Markdown anytime.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[#16261D] border border-[#F3F0E4]/10 font-mono text-xs text-[#8FC3DE] space-y-1">
                  <p className="text-[#9FAEA1]">{"// Maxwell-Boltzmann Distribution Formula"}</p>
                  <p className="text-[#F0C93B]">{"f(v) = 4\\pi \\left(\\frac{m}{2\\pi k_B T}\\right)^{3/2} v^2 e^{-\\frac{m v^2}{2 k_B T}}"}</p>
                </div>
              </div>
            </div>

            {/* CARD 2: 24/7 AI COPILOT (SPAN 4) */}
            <div className="md:col-span-4 rounded-[2rem] bg-[#1A2D23]/90 border border-[#F3F0E4]/15 p-2 shadow-xl">
              <div className="rounded-[calc(2rem-0.5rem)] bg-[#121F18] p-8 space-y-6 h-full flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="size-12 rounded-2xl bg-[#F0C93B]/10 border border-[#F0C93B]/30 flex items-center justify-center text-[#F0C93B]">
                    <Bot className="size-6" />
                  </div>
                  <div className="space-y-2">
                    <span className="text-[10px] font-mono font-bold text-[#F0C93B] uppercase tracking-wider bg-[#F0C93B]/10 px-3 py-1 rounded-full border border-[#F0C93B]/20">
                      24/7 AI TUTOR
                    </span>
                    <h3 className="text-xl font-bold text-white font-heading">
                      Instant AI Doubt Resolution
                    </h3>
                    <p className="text-xs text-[#9FAEA1] font-light leading-relaxed">
                      Ask physics derivations, calculus integrals, or debugging questions and get instant step-by-step answers directly inside your note view.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[#F0C93B]/10 border border-[#F0C93B]/30 text-xs text-[#F0C93B] font-mono">
                  &quot;Resolved 12 doubt queries in 420ms.&quot;
                </div>
              </div>
            </div>

            {/* CARD 3: GAMIFIED BATCH LEADERBOARDS (SPAN 4) */}
            <div className="md:col-span-4 rounded-[2rem] bg-[#1A2D23]/90 border border-[#F3F0E4]/15 p-2 shadow-xl">
              <div className="rounded-[calc(2rem-0.5rem)] bg-[#121F18] p-8 space-y-6 h-full flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="size-12 rounded-2xl bg-[#C9A9E0]/10 border border-[#C9A9E0]/30 flex items-center justify-center text-[#C9A9E0]">
                    <Trophy className="size-6" />
                  </div>
                  <div className="space-y-2">
                    <span className="text-[10px] font-mono font-bold text-[#C9A9E0] uppercase tracking-wider bg-[#C9A9E0]/10 px-3 py-1 rounded-full border border-[#C9A9E0]/20">
                      SCHOLAR RANKS
                    </span>
                    <h3 className="text-xl font-bold text-white font-heading">
                      Gamified Leaderboards &amp; Coins
                    </h3>
                    <p className="text-xs text-[#9FAEA1] font-light leading-relaxed">
                      Earn activity coins and scholar badges for answering peer doubts and publishing quality notes. Compare your contributions with university peers.
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-[#16261D] border border-[#F3F0E4]/10 text-xs font-mono">
                  <span className="text-[#F3F0E4]">Top Scholar Rank #1</span>
                  <span className="text-[#F0C93B] font-bold">+450 Coins</span>
                </div>
              </div>
            </div>

            {/* CARD 4: STUDY FORUMS & CHAT (SPAN 8) */}
            <div className="md:col-span-8 rounded-[2rem] bg-[#1A2D23]/90 border border-[#F3F0E4]/15 p-2 shadow-xl">
              <div className="rounded-[calc(2rem-0.5rem)] bg-[#121F18] p-8 space-y-6 h-full flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="size-12 rounded-2xl bg-[#F28B6E]/10 border border-[#F28B6E]/30 flex items-center justify-center text-[#F28B6E]">
                    <MessageSquare className="size-6" />
                  </div>
                  <div className="space-y-2">
                    <span className="text-[10px] font-mono font-bold text-[#F28B6E] uppercase tracking-wider bg-[#F28B6E]/10 px-3 py-1 rounded-full border border-[#F28B6E]/20">
                      PEER NETWORK
                    </span>
                    <h3 className="text-2xl font-bold text-white font-heading">
                      Subject Forums &amp; Study Group Chat
                    </h3>
                    <p className="text-xs sm:text-sm text-[#9FAEA1] font-light leading-relaxed">
                      Connect with classmates in dedicated subject forums, share revision notes, or send direct messages to collaborate on group assignments and competitive exam prep.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                  <div className="p-3 rounded-xl bg-[#16261D] border border-[#F3F0E4]/10 text-[#8FC3DE]">
                    # JEE-Physics-Discussion
                  </div>
                  <div className="p-3 rounded-xl bg-[#16261D] border border-[#F3F0E4]/10 text-[#F0C93B]">
                    # VTU-CS-Sem-4
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* HOW NOTEXIA WORKS (WORKFLOW SECTION) */}
        <section id="how-it-works" className="max-w-[1400px] mx-auto px-4 sm:px-6 relative z-10 space-y-12">
          <div className="text-center space-y-4 max-w-3xl mx-auto">
            <Reveal>
              <span className="text-xs font-mono font-bold uppercase tracking-widest text-[#F0C93B] bg-[#F0C93B]/10 px-3.5 py-1.5 rounded-full border border-[#F0C93B]/30">
                ACADEMIC WORKFLOW
              </span>
            </Reveal>
            <Reveal delay={60}>
              <h2 className="text-3xl sm:text-4xl font-black text-[#F3F0E4] font-heading">
                How Notexia Accelerates Your Learning
              </h2>
            </Reveal>
            <Reveal delay={120}>
              <p className="text-sm sm:text-base text-[#9FAEA1] font-light">
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
            ].map((wf, idx) => (
              <Reveal key={wf.step} delay={idx * 80}>
                <div className="rounded-[2rem] bg-[#1A2D23]/90 border border-[#F3F0E4]/15 p-2 shadow-xl h-full">
                  <div className="rounded-[calc(2rem-0.5rem)] bg-[#121F18] p-6 space-y-4 h-full flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className={`font-mono text-2xl font-black ${wf.accent}`}>
                          {wf.step}
                        </span>
                        <div className="size-10 rounded-xl bg-[#1A2D23] border border-[#F3F0E4]/10 flex items-center justify-center text-[#F3F0E4]">
                          <wf.icon className="size-5" />
                        </div>
                      </div>
                      <h3 className="text-lg font-bold text-[#F3F0E4] font-heading">{wf.title}</h3>
                      <p className="text-xs text-[#9FAEA1] leading-relaxed font-light">{wf.desc}</p>
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* FREE UTILITY TOOLS SECTION */}
        <section id="tools" className="max-w-[1400px] mx-auto px-4 sm:px-6 relative z-10">
          <div className="rounded-[2.5rem] bg-[#1A2D23] border border-[#F3F0E4]/15 p-2 shadow-2xl">
            <div className="rounded-[calc(2.5rem-0.5rem)] bg-[#121F18] p-8 sm:p-12 flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="space-y-4 text-center sm:text-left max-w-xl">
                <span className="text-xs font-mono font-bold uppercase tracking-widest text-[#F0C93B] bg-[#F0C93B]/10 px-3.5 py-1.5 rounded-full border border-[#F0C93B]/30">
                  FREE STUDENT TOOLS
                </span>
                <h2 className="text-2xl sm:text-4xl font-black text-[#F3F0E4] font-heading">
                  Official Academic CGPA Converters
                </h2>
                <p className="text-xs sm:text-sm text-[#9FAEA1] leading-relaxed font-light">
                  Calculate your exact percentage marks from CGPA for CBSE 10th/12th, VTU, KTU, and Mumbai University with official published conversion formulas.
                </p>
              </div>
              <Link
                href="/tools/cgpa-converter"
                className="group rounded-full bg-[#F0C93B] hover:bg-[#F0C93B]/90 text-[#2A2118] font-bold text-sm px-7 py-3.5 inline-flex items-center gap-3 transition-all duration-300 shadow-lg shrink-0 font-heading"
              >
                <Calculator className="size-5 text-[#2A2118]" />
                <span>Open CGPA Calculator</span>
                <ArrowUpRight className="size-4 text-[#2A2118] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </Link>
            </div>
          </div>
        </section>

        {/* STUDENT REVIEWS & TESTIMONIALS */}
        <section id="reviews" className="max-w-[1400px] mx-auto px-4 sm:px-6 relative z-10 space-y-12">
          <div className="text-center space-y-4 max-w-3xl mx-auto">
            <Reveal>
              <span className="text-xs font-mono font-bold uppercase tracking-widest text-[#8FC3DE] bg-[#8FC3DE]/10 px-3.5 py-1.5 rounded-full border border-[#8FC3DE]/30">
                STUDENT TESTIMONIALS
              </span>
            </Reveal>
            <Reveal delay={60}>
              <h2 className="text-3xl sm:text-4xl font-black text-[#F3F0E4] font-heading">
                Loved by Scholars Across India
              </h2>
            </Reveal>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {studentReviews.map((rev, idx) => (
              <Reveal key={idx} delay={idx * 80}>
                <div className="rounded-[2rem] bg-[#1A2D23]/90 border border-[#F3F0E4]/15 p-2 shadow-xl h-full">
                  <div className="rounded-[calc(2rem-0.5rem)] bg-[#121F18] p-6 space-y-4 h-full flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="flex items-center gap-1 text-[#F0C93B]">
                        {[...Array(rev.rating)].map((_, i) => (
                          <Star key={i} className="size-4 fill-[#F0C93B]" />
                        ))}
                      </div>
                      <p className="text-xs sm:text-sm text-[#F3F0E4] font-light leading-relaxed italic">
                        &quot;{rev.quote}&quot;
                      </p>
                    </div>

                    <div className="pt-4 border-t border-[#F3F0E4]/10 space-y-0.5">
                      <h4 className="text-sm font-bold text-white font-heading">{rev.author}</h4>
                      <p className="text-[11px] text-[#9FAEA1] font-mono">{rev.role}</p>
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* FAQ ACCORDION SECTION */}
        <section id="faq" className="py-16 bg-[#121F18]/80 border-t border-[#F3F0E4]/10 relative z-10">
          <div className="max-w-[1000px] mx-auto px-4 sm:px-6 space-y-12">
            <div className="text-center space-y-4">
              <Reveal>
                <span className="text-xs font-mono font-bold uppercase tracking-widest text-[#F0C93B] bg-[#F0C93B]/10 px-3.5 py-1.5 rounded-full border border-[#F0C93B]/30">
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

        {/* BOTTOM CONVERSION CTA HERO */}
        <section className="px-4 sm:px-6 max-w-[1400px] mx-auto pb-16">
          <div className="rounded-[2.5rem] bg-[#1A2D23] border border-[#F3F0E4]/15 p-2 shadow-2xl text-center">
            <div className="rounded-[calc(2.5rem-0.5rem)] bg-[#121F18] p-8 sm:p-16 space-y-6">
              <span className="text-xs font-mono font-bold uppercase tracking-widest text-[#8FC3DE] bg-[#8FC3DE]/10 px-3.5 py-1.5 rounded-full border border-[#8FC3DE]/30">
                START LEARNING SMART TODAY
              </span>
              <h2 className="text-3xl sm:text-5xl font-black text-[#F3F0E4] font-heading max-w-2xl mx-auto leading-tight">
                Ready to Supercharge Your Academic Performance?
              </h2>
              <p className="text-xs sm:text-sm text-[#9FAEA1] max-w-xl mx-auto font-light leading-relaxed">
                Join thousands of engineering students and aspirants taking notes, solving doubts with AI, and collaborating on Notexia.
              </p>

              <div className="pt-4 flex flex-wrap justify-center gap-4">
                <Link
                  href="/signup"
                  className="group rounded-full bg-[#F0C93B] hover:bg-[#F0C93B]/90 text-[#2A2118] font-bold text-sm pl-8 pr-3 py-3.5 inline-flex items-center gap-3 transition-all duration-300 shadow-lg font-heading active:scale-[0.98]"
                >
                  <span>Create Free Account</span>
                  <div className="size-8 rounded-full bg-[#2A2118] flex items-center justify-center text-[#F0C93B] group-hover:translate-x-1 transition-transform">
                    <ArrowRight className="size-4 text-[#F0C93B]" />
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ── FOOTER ── */}
      <footer className="border-t border-[#F3F0E4]/10 bg-[#121F18] py-16 text-xs text-[#9FAEA1] relative z-10">
        <div className="max-w-[1400px] mx-auto px-6 space-y-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-6 border-b border-[#F3F0E4]/10">
            <div className="flex items-center gap-2.5">
              <div className="size-2 rounded-full bg-[#8FC3DE] animate-pulse" />
              <span className="font-mono text-[#8FC3DE]">All systems operational</span>
            </div>
            <div className="text-[#9FAEA1] text-center">
              &copy; {new Date().getFullYear()} Notexia Inc. All rights reserved. Made for Indian Students &amp; Engineers.
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 font-heading uppercase text-[11px] font-bold">
            <Link href="/about" className="hover:text-[#F3F0E4] transition-colors">About Us</Link>
            <Link href="/contact" className="hover:text-[#F3F0E4] transition-colors">Contact Us</Link>
            <Link href="/privacy" className="hover:text-[#F3F0E4] transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-[#F3F0E4] transition-colors">Terms of Service</Link>
            <Link href="/disclaimer" className="hover:text-[#F3F0E4] transition-colors">Disclaimer</Link>
            <Link href="/refund-policy" className="hover:text-[#F3F0E4] transition-colors">Refund Policy</Link>
            <Link href="/community-guidelines" className="hover:text-[#F3F0E4] transition-colors">Community Guidelines</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}