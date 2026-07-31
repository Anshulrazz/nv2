import React from "react";
import Link from "next/link";
import {
  Sparkles,
  BookOpen,
  Bot,
  Users,
  Trophy,
  ShieldCheck,
  Zap,
  GraduationCap,
  ArrowRight,
  Target,
  CheckCircle2,
} from "lucide-react";
import { TrustHeader } from "@/components/public/TrustHeader";
import { TrustFooter } from "@/components/public/TrustFooter";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#16261D] text-[#F3F0E4] font-sans selection:bg-[#F0C93B]/30 flex flex-col antialiased">
      <TrustHeader title="ABOUT US" />

      <main className="max-w-5xl w-full mx-auto px-4 sm:px-6 py-12 sm:py-16 space-y-16 flex-1">
        {/* HERO SECTION - Doppelrand / Double-Bezel Outer Shell */}
        <section className="rounded-[2.5rem] bg-[#1A2D23]/90 border border-[#F3F0E4]/15 p-2 shadow-2xl">
          <div className="rounded-[calc(2.5rem-0.5rem)] bg-[#121F18] p-8 sm:p-12 space-y-6 shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)] relative overflow-hidden">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#F0C93B]/15 border border-[#F0C93B]/30 text-[#F0C93B] text-xs font-mono font-bold uppercase tracking-wider">
              <Sparkles className="size-3.5" /> REVOLUTIONIZING STUDENT STUDY
            </div>

            <h1 className="text-3xl sm:text-5xl font-black text-[#F3F0E4] tracking-tight font-heading leading-tight max-w-3xl">
              Empowering Students Across India to Learn Faster &amp; Build Together
            </h1>

            <p className="text-[#9FAEA1] text-base sm:text-lg leading-relaxed max-w-3xl font-light">
              Notexia is built specifically for Indian school students, JEE/NEET aspirants, and university engineering undergraduates. We combine rich markdown note-taking with 24/7 AI doubt solving, peer forums, and official conversion calculators.
            </p>

            <div className="pt-4 flex flex-wrap items-center gap-4">
              <Link
                href="/signup"
                className="group rounded-full bg-[#F0C93B] hover:bg-[#F0C93B]/90 text-[#2A2118] font-bold text-sm px-6 py-3 inline-flex items-center gap-3 transition-all duration-300 shadow-[0_0_20px_rgba(240,201,59,0.3)] font-heading"
              >
                <span>Join Notexia Today</span>
                <div className="size-7 rounded-full bg-black/10 flex items-center justify-center group-hover:translate-x-1 transition-transform">
                  <ArrowRight className="size-4 text-[#2A2118]" />
                </div>
              </Link>
              <Link
                href="/tools/cgpa-converter"
                className="rounded-full bg-[#1A2D23] hover:bg-[#1A2D23]/80 border border-[#F3F0E4]/20 text-[#F3F0E4] font-semibold text-sm px-6 py-3 inline-flex items-center gap-2 transition-all duration-200"
              >
                <span>Try Free Calculators</span>
              </Link>
            </div>
          </div>
        </section>

        {/* MISSION & VISION */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="rounded-[2rem] bg-[#1A2D23]/90 border border-[#F3F0E4]/15 p-2 shadow-xl">
            <div className="rounded-[calc(2rem-0.5rem)] bg-[#121F18] p-8 space-y-4 h-full flex flex-col justify-between">
              <div className="space-y-4">
                <div className="size-12 rounded-2xl bg-[#8FC3DE]/15 border border-[#8FC3DE]/30 flex items-center justify-center text-[#8FC3DE]">
                  <Target className="size-6" />
                </div>
                <h2 className="text-2xl font-bold text-white font-heading">Our Mission</h2>
                <p className="text-[#9FAEA1] text-sm leading-relaxed font-light">
                  To eliminate academic friction by giving every student instant access to clear study notes, intelligent AI step-by-step doubt resolution, and a supportive community of peers.
                </p>
              </div>
              <ul className="space-y-2 pt-4 border-t border-[#F3F0E4]/10 text-xs text-[#F3F0E4]">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-[#8FC3DE]" /> 100% Free access to essential note features
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-[#8FC3DE]" /> Syllabi-aligned AI doubt assistance
                </li>
              </ul>
            </div>
          </div>

          <div className="rounded-[2rem] bg-[#1A2D23]/90 border border-[#F3F0E4]/15 p-2 shadow-xl">
            <div className="rounded-[calc(2rem-0.5rem)] bg-[#121F18] p-8 space-y-4 h-full flex flex-col justify-between">
              <div className="space-y-4">
                <div className="size-12 rounded-2xl bg-[#F0C93B]/15 border border-[#F0C93B]/30 flex items-center justify-center text-[#F0C93B]">
                  <GraduationCap className="size-6" />
                </div>
                <h2 className="text-2xl font-bold text-white font-heading">Our Vision</h2>
                <p className="text-[#9FAEA1] text-sm leading-relaxed font-light">
                  To create India’s most trusted digital academic ecosystem where students can transform raw lecture notes into published research, earn scholar badges, and crack competitive exams.
                </p>
              </div>
              <ul className="space-y-2 pt-4 border-t border-[#F3F0E4]/10 text-xs text-[#F3F0E4]">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-[#F0C93B]" /> Peer moderation &amp; academic integrity
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-[#F0C93B]" /> Data privacy &amp; bank-grade note encryption
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* CORE PLATFORM HIGHLIGHTS */}
        <section className="space-y-8">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-[#8FC3DE] bg-[#8FC3DE]/10 px-3.5 py-1.5 rounded-full border border-[#8FC3DE]/30">
              PLATFORM FEATURES
            </span>
            <h2 className="text-3xl font-black text-white font-heading">
              Everything Students Need in One Place
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: BookOpen,
                color: "#8FC3DE",
                title: "Rich TipTap Markdown Editor",
                desc: "Organize notes with LaTeX equations, code blocks, checklists, and instant PDF/Markdown exports.",
              },
              {
                icon: Bot,
                color: "#F0C93B",
                title: "24/7 AI Doubt Resolution",
                desc: "Ask complex numericals or conceptual questions and get instant, step-by-step explanations.",
              },
              {
                icon: Users,
                color: "#F28B6E",
                title: "Study Group Forums",
                desc: "Discuss exam strategies, share chapter summaries, and collaborate with peers nationwide.",
              },
              {
                icon: Trophy,
                color: "#C9A9E0",
                title: "Gamified Leaderboards",
                desc: "Earn activity coins and scholar badges for answering peer doubts and contributing quality notes.",
              },
              {
                icon: Zap,
                color: "#8FC3DE",
                title: "Free Academic Tools",
                desc: "Access official CGPA-to-Percentage calculators for CBSE 10th/12th, VTU, KTU, and Mumbai University.",
              },
              {
                icon: ShieldCheck,
                color: "#F0C93B",
                title: "Privacy & Encryption",
                desc: "Your private research is encrypted at rest (AES-256) and in transit (TLS 1.3) with full data controls.",
              },
            ].map((item, idx) => (
              <div
                key={idx}
                className="rounded-2xl bg-[#1A2D23]/80 border border-[#F3F0E4]/15 p-6 space-y-3 hover:border-[#F0C93B]/40 transition-colors shadow-lg flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div
                    className="size-10 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: `${item.color}15`, borderColor: `${item.color}30`, borderWidth: 1 }}
                  >
                    <item.icon className="size-5" style={{ color: item.color }} />
                  </div>
                  <h3 className="text-lg font-bold text-white font-heading">{item.title}</h3>
                  <p className="text-xs text-[#9FAEA1] leading-relaxed font-light">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA BANNER */}
        <section className="rounded-2xl border border-[#F3F0E4]/15 bg-[#1A2D23] p-8 text-center space-y-4 shadow-2xl">
          <h3 className="text-2xl font-bold text-white font-heading">Ready to Upgrade Your Study Workflow?</h3>
          <p className="text-sm text-[#9FAEA1] max-w-xl mx-auto font-light">
            Join thousands of students across India who use Notexia for smart note taking, AI assistance, and peer collaboration.
          </p>
          <div className="pt-2">
            <Link
              href="/signup"
              className="rounded-full bg-[#F0C93B] hover:bg-[#F0C93B]/90 text-[#2A2118] font-bold text-sm px-8 py-3.5 inline-flex items-center gap-2 shadow-lg transition-all font-heading"
            >
              Create Your Free Account
            </Link>
          </div>
        </section>
      </main>

      <TrustFooter />
    </div>
  );
}
