"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  ArrowRight,
  BookOpen,
  Sparkles,
  Zap,
  HelpCircle,
  CheckCircle2,
  MessageSquare,
  Lightbulb,
  Bot,
  FileText,
  Compass,
  Trophy,
  TrendingUp,
  Award,
} from "lucide-react";

/* ────────────────────────────────────────────────────────────────
   Small animation primitives — no external animation library.
   Reveal: fades/slides an element up once it scrolls into view.
   CountUp: animates a number from 0 to its target once in view.
   ──────────────────────────────────────────────────────────────── */

function Reveal({
  children,
  className = "",
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible(true);
            obs.disconnect();
          }
        });
      },
      { threshold: 0.15 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`nx-reveal ${visible ? "nx-in" : ""} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

function CountUp({
  value,
  decimals = 0,
  prefix = "",
  suffix = "",
  duration = 1300,
}: {
  value: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const [display, setDisplay] = useState(0);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !started.current) {
            started.current = true;
            const start = performance.now();
            const step = (now: number) => {
              const progress = Math.min((now - start) / duration, 1);
              const eased = 1 - Math.pow(1 - progress, 3);
              setDisplay(eased * value);
              if (progress < 1) requestAnimationFrame(step);
              else setDisplay(value);
            };
            requestAnimationFrame(step);
            obs.disconnect();
          }
        });
      },
      { threshold: 0.4 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [value, duration]);

  return (
    <span ref={ref}>
      {prefix}
      {display.toFixed(decimals)}
      {suffix}
    </span>
  );
}

/** Hand-drawn squiggle underline, self-draws in when its parent Reveal is visible. */
function Squiggle({ className = "", color = "var(--nx-yellow)" }: { className?: string; color?: string }) {
  return (
    <svg
      className={`nx-squiggle ${className}`}
      viewBox="0 0 200 16"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <path
        d="M2 10 Q 25 2, 50 9 T 100 8 T 150 10 T 198 6"
        fill="none"
        stroke={color}
        strokeWidth="5"
        strokeLinecap="round"
      />
    </svg>
  );
}

/* ──────────────────────────────────────────────────────────────── */

const CHALK_DUST = Array.from({ length: 16 }).map((_, i) => ({
  left: `${(i * 37) % 100}%`,
  delay: `${(i * 1.7) % 9}s`,
  duration: `${9 + (i % 5) * 2}s`,
  size: 2 + (i % 3),
}));

export default function LandingPage() {
  const { data: session } = useSession();
  const isLoggedIn = !!session?.user;
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="nx-root min-h-screen relative overflow-hidden flex flex-col">
      {/* ── Ambient chalkboard atmosphere ── */}
      <div className="nx-sheen pointer-events-none absolute inset-0" aria-hidden="true" />
      <div className="nx-grid pointer-events-none absolute inset-0" aria-hidden="true" />
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        {CHALK_DUST.map((d, i) => (
          <span
            key={i}
            className="nx-dust"
            style={{
              left: d.left,
              width: d.size,
              height: d.size,
              animationDelay: d.delay,
              animationDuration: d.duration,
            }}
          />
        ))}
      </div>

      {/* ── Nav ── */}
      <div className="w-full px-4 sm:px-6 sticky top-0 z-50">
        <header
          className={`max-w-5xl mx-auto mt-4 relative rounded-2xl transition-all duration-300 ${
            scrolled ? "nx-nav-scrolled" : ""
          }`}
        >
          <div className="nx-nav-panel absolute inset-0 rounded-2xl" />
          <div className="relative px-5 sm:px-7 py-3.5 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <img src="/logo.png" className="h-5.5 w-auto object-contain" alt="Notexia Logo" />
              <span className="font-display text-lg sm:text-xl font-bold tracking-tight text-[color:var(--nx-chalk)]">
                Notexia
              </span>
            </div>

            <nav className="flex items-center gap-4 sm:gap-7">
              <Link href="#features" className="nx-navlink hidden sm:inline-block">
                Features
              </Link>
              <Link href="#pricing" className="nx-navlink hidden sm:inline-block">
                Pricing
              </Link>

              {isLoggedIn ? (
                <Link href="/dashboard" className="nx-btn-solid">
                  Open dashboard <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              ) : (
                <div className="flex items-center gap-3 sm:gap-4">
                  <Link href="/login" className="nx-navlink">
                    Log in
                  </Link>
                  <Link href="/signup" className="nx-btn-solid">
                    Sign up
                  </Link>
                </div>
              )}
            </nav>
          </div>
          <div className="nx-wood-tray" />
        </header>
      </div>

      {/* ── Main ── */}
      <main className="flex-1 flex flex-col relative z-10 py-16 sm:py-20">
        {/* ── Hero ── */}
        <section className="max-w-5xl mx-auto px-6 text-center pt-10 pb-10">
          <Reveal className="nx-fade-up">
            <span className="nx-tag inline-flex items-center gap-2 mb-8">
              <span className="nx-chalk-dot" />
              Modern learning platform for students
            </span>
          </Reveal>

          <Reveal delay={80} className="nx-fade-up">
            <h1 className="font-display text-[2.6rem] leading-[1.08] sm:text-6xl md:text-7xl font-bold text-[color:var(--nx-chalk)] mb-2 max-w-4xl mx-auto">
              Learn Smarter.
            </h1>
          </Reveal>
          <Reveal delay={160} className="nx-fade-up">
            <h1 className="relative inline-block font-display text-[2.6rem] leading-[1.08] sm:text-6xl md:text-7xl font-bold mb-7">
              <span style={{ color: "var(--nx-yellow)" }}>Grow Faster.</span>
              <Squiggle className="absolute left-1/2 -translate-x-1/2 -bottom-3 w-[85%]" />
            </h1>
          </Reveal>

          <Reveal delay={220} className="nx-fade-up">
            <p className="text-sm md:text-lg text-[color:var(--nx-dim)] max-w-2xl mx-auto mb-10 leading-relaxed">
              One place to share notes, solve doubts, and collaborate with peers. Designed for fast
              workflows, clean content, and measurable academic progress.
            </p>
          </Reveal>

          <Reveal delay={280} className="nx-fade-up">
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              {isLoggedIn ? (
                <Link href="/dashboard" className="nx-btn-primary">
                  Open dashboard <ArrowRight className="h-4 w-4" />
                </Link>
              ) : (
                <>
                  <Link href="/signup" className="nx-btn-primary">
                    Get Started Free <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link href="/login" className="nx-btn-ghost">
                    Log in
                  </Link>
                </>
              )}
            </div>
          </Reveal>

          {/* Quick metrics — chalk-circled figures */}
          <div className="mt-16 max-w-3xl mx-auto grid grid-cols-3 gap-4 sm:gap-6">
            {[
              { value: 248, label: "New Notes", color: "var(--nx-yellow)" },
              { value: 931, label: "Doubts Answered", color: "var(--nx-coral)" },
              { value: 118, label: "Forum Discussions", color: "var(--nx-blue)" },
            ].map(({ value, label, color }, i) => (
              <Reveal key={label} delay={i * 90} className="nx-fade-up">
                <div className="nx-metric">
                  <div className="font-mono text-xl sm:text-3xl font-bold" style={{ color }}>
                    <CountUp value={value} prefix="+" />
                  </div>
                  <div className="text-[9px] sm:text-[10px] text-[color:var(--nx-dim)] uppercase tracking-widest mt-1.5">
                    {label}
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* ── Impact numbers ── */}
        <section className="max-w-5xl mx-auto px-6 mt-8">
          <Reveal className="nx-fade-up">
            <div className="nx-panel rounded-[28px] p-8 sm:p-12 grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 text-center">
              {[
                { val: 10, suffix: "K+", desc: "Students Active" },
                { val: 50, suffix: "K+", desc: "Notes Shared" },
                { val: 25, suffix: "K+", desc: "Doubts Answered" },
                { val: 500, suffix: "+", desc: "Study Circles" },
              ].map(({ val, suffix, desc }, i) => (
                <Reveal key={desc} delay={i * 90} className="nx-fade-up space-y-1.5">
                  <div className="font-display text-3xl sm:text-4xl font-bold text-[color:var(--nx-chalk)]">
                    <CountUp value={val} suffix={suffix} />
                  </div>
                  <div className="font-mono text-[10px] text-[color:var(--nx-dim)] uppercase tracking-widest">
                    {desc}
                  </div>
                </Reveal>
              ))}
            </div>
          </Reveal>
        </section>

        {/* ── Feature cards ── */}
        <section id="features" className="max-w-5xl mx-auto px-6 mt-28">
          <Reveal className="nx-fade-up text-center mb-14">
            <span className="nx-eyebrow">Features</span>
            <h2 className="font-display text-3xl md:text-5xl font-bold text-[color:var(--nx-chalk)] mb-3 mt-3">
              Everything students need, without clutter
            </h2>
            <p className="text-[color:var(--nx-dim)] max-w-xl mx-auto text-xs sm:text-sm leading-relaxed">
              A cleaner experience inspired by modern product design: fast, focused, and built
              around everyday study tasks.
            </p>
          </Reveal>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-7">
            {[
              {
                icon: BookOpen,
                color: "var(--nx-blue)",
                title: "Notes That Stay Organized",
                desc: "Upload, filter, and discover useful materials by subject, semester, and tags.",
                rot: "-rotate-[0.6deg]",
              },
              {
                icon: HelpCircle,
                color: "var(--nx-coral)",
                title: "Doubts Solved With Context",
                desc: "Ask questions and get peer answers plus AI hints that help you understand.",
                rot: "rotate-[0.5deg]",
              },
              {
                icon: MessageSquare,
                color: "var(--nx-lilac)",
                title: "Community Driven Learning",
                desc: "Join discussions, collaborate in forums, and build a smarter study network.",
                rot: "rotate-[0.4deg]",
              },
              {
                icon: Sparkles,
                color: "var(--nx-yellow)",
                title: "Knowledge Sharing Culture",
                desc: "Publish blogs, learn from seniors, and contribute to a growing student library.",
                rot: "-rotate-[0.5deg]",
              },
            ].map(({ icon: Icon, color, title, desc, rot }, i) => (
              <Reveal key={title} delay={i * 90} className="nx-fade-up">
                <div className={`nx-card group p-6 sm:p-8 flex items-start gap-4 ${rot}`}>
                  <div
                    className="nx-icon-badge shrink-0"
                    style={{ borderColor: color, color }}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="space-y-1.5">
                    <h3 className="font-display text-base font-bold text-[color:var(--nx-chalk)]">
                      {title}
                    </h3>
                    <p className="text-[color:var(--nx-dim)] text-xs sm:text-sm leading-relaxed">
                      {desc}
                    </p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* ── AI Features ── */}
        <section className="max-w-5xl mx-auto px-6 mt-28">
          <Reveal className="nx-fade-up text-center mb-14">
            <span className="nx-eyebrow">AI on the board</span>
            <h2 className="font-display text-3xl md:text-5xl font-bold text-[color:var(--nx-chalk)] mb-3 mt-3">
              AI that teaches, not just answers
            </h2>
            <p className="text-[color:var(--nx-dim)] max-w-xl mx-auto text-xs sm:text-sm leading-relaxed">
              Four ways Notexia&apos;s AI shows up in your day-to-day — always in service of
              understanding, never a shortcut around it.
            </p>
          </Reveal>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {[
              {
                icon: Lightbulb,
                color: "var(--nx-yellow)",
                title: "AI Hint",
                desc: "Stuck on a problem? Get a nudge toward the solution without the answer being given away.",
              },
              {
                icon: Bot,
                color: "var(--nx-coral)",
                title: "AI Answer",
                desc: "Need the full picture? Get a step-by-step explanation you can actually learn from.",
              },
              {
                icon: FileText,
                color: "var(--nx-blue)",
                title: "AI Summary",
                desc: "Long notes or blog posts get boiled down to the key points in seconds.",
              },
              {
                icon: Compass,
                color: "var(--nx-lilac)",
                title: "Smart Recommendations",
                desc: "The AI learns what you&apos;re studying and surfaces notes, doubts, and forums worth your time.",
              },
            ].map(({ icon: Icon, color, title, desc }, i) => (
              <Reveal key={title} delay={i * 90} className="nx-fade-up">
                <div className="nx-card h-full p-6 space-y-4">
                  <div className="nx-icon-badge" style={{ borderColor: color, color }}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-display text-sm font-bold text-[color:var(--nx-chalk)]">
                    {title}
                  </h3>
                  <p className="text-[color:var(--nx-dim)] text-xs leading-relaxed">{desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* ── Data figures ── */}
        <section className="max-w-5xl mx-auto px-6 mt-28">
          <Reveal className="nx-fade-up">
            <div className="nx-panel nx-graph rounded-[28px] p-8 sm:p-12 space-y-10">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-dashed border-[color:var(--nx-line)] pb-6">
                <div>
                  <h3 className="font-display text-xl sm:text-2xl font-bold text-[color:var(--nx-chalk)]">
                    Data figures that show real impact
                  </h3>
                  <p className="text-[color:var(--nx-dim)] text-xs mt-1">
                    Metrics that matter for your daily learning routine.
                  </p>
                </div>
                <span className="nx-pill self-start md:self-auto">Updated daily</span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center border-b border-dashed border-[color:var(--nx-line)] pb-10">
                {[
                  { label: "Average weekly study time tracked", value: 14.8, decimals: 1, suffix: " hrs" },
                  { label: "Response speed for peer doubts", value: 12, suffix: " min" },
                  { label: "Assignment completion confidence", value: 92, suffix: "%" },
                  { label: "Repeat platform engagement", value: 81, suffix: "%" },
                ].map(({ label, value, decimals, suffix }, i) => (
                  <Reveal key={label} delay={i * 80} className="nx-fade-up space-y-1">
                    <div className="font-display text-2xl sm:text-3xl font-bold text-[color:var(--nx-chalk)]">
                      <CountUp value={value} decimals={decimals} suffix={suffix} />
                    </div>
                    <p className="text-[10px] text-[color:var(--nx-dim)] max-w-[150px] mx-auto leading-relaxed">
                      {label}
                    </p>
                  </Reveal>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { prefix: "Notes discovery", value: 230, sign: "+", suffix: "%", detail: "higher content reach after smart tagging" },
                  { prefix: "Doubt resolution", value: 3.2, decimals: 1, suffix: "x", detail: "faster answer turnaround in active batches" },
                  { prefix: "Exam readiness", value: 41, sign: "+", suffix: "%", detail: "improvement in self-reported confidence" },
                ].map(({ prefix, value, sign, decimals, suffix, detail }, i) => (
                  <Reveal key={prefix} delay={i * 90} className="nx-fade-up">
                    <div className="nx-inset rounded-2xl p-5 space-y-2">
                      <span className="font-mono text-[9px] font-bold text-[color:var(--nx-dim)] uppercase tracking-wider block">
                        {prefix}
                      </span>
                      <div className="font-display text-xl sm:text-2xl font-bold" style={{ color: "var(--nx-yellow)" }}>
                        <CountUp value={value} prefix={sign} decimals={decimals} suffix={suffix} />
                      </div>
                      <p className="text-[11px] text-[color:var(--nx-dim)] leading-snug">{detail}</p>
                    </div>
                  </Reveal>
                ))}
              </div>
            </div>
          </Reveal>
        </section>

        {/* ── How it works ── */}
        <section className="max-w-5xl mx-auto px-6 mt-28">
          <Reveal className="nx-fade-up text-center mb-16">
            <h2 className="font-display text-3xl md:text-5xl font-bold text-[color:var(--nx-chalk)] mb-2">
              How students use Notexia every week
            </h2>
            <p className="text-[color:var(--nx-dim)] text-xs sm:text-sm">
              A systematic workflow, one chalk stroke at a time.
            </p>
          </Reveal>

          <div className="relative grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-6">
            <svg
              className="nx-arrow-row hidden md:block absolute top-10 left-0 w-full h-10"
              viewBox="0 0 700 40"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <path
                d="M110 20 Q 235 -8, 350 20 T 590 20"
                fill="none"
                stroke="var(--nx-line-bright)"
                strokeWidth="2.5"
                strokeDasharray="7 9"
                strokeLinecap="round"
              />
              <path d="M580 12 L 596 20 L 580 28" fill="none" stroke="var(--nx-line-bright)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>

            {[
              { step: "1", title: "Collect", desc: "Gather notes, links, and class references in one organized space.", icon: BookOpen, color: "var(--nx-blue)" },
              { step: "2", title: "Collaborate", desc: "Ask doubts, join focused discussions, and review quality answers.", icon: MessageSquare, color: "var(--nx-coral)" },
              { step: "3", title: "Improve", desc: "Track progress with data, identify weak topics, and iterate weekly.", icon: Zap, color: "var(--nx-yellow)" },
            ].map(({ step, title, desc, icon: Icon, color }, i) => (
              <Reveal key={step} delay={i * 120} className="nx-fade-up relative">
                <div className="nx-card p-6 sm:p-7 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="nx-step-badge" style={{ borderColor: color, color }}>
                      {step}
                    </span>
                    <Icon className="h-4 w-4 text-[color:var(--nx-dim)]" />
                  </div>
                  <h3 className="font-display text-lg font-bold text-[color:var(--nx-chalk)]">{title}</h3>
                  <p className="text-[color:var(--nx-dim)] text-xs sm:text-sm leading-relaxed">{desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* ── Study tracks ── */}
        <section className="max-w-5xl mx-auto px-6 mt-28">
          <Reveal className="nx-fade-up text-center mb-14">
            <h2 className="font-display text-3xl md:text-5xl font-bold text-[color:var(--nx-chalk)] mb-3">
              Choose your study track, then execute
            </h2>
            <p className="text-[color:var(--nx-dim)] max-w-xl mx-auto text-xs sm:text-sm">
              Different students have different rhythms. Pick a track that matches your semester
              pressure and learning style.
            </p>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-7">
            {[
              {
                title: "Semester Sprint",
                subtitle: "Weekly targets, topic checklists, and peer accountability to stay ahead of deadlines.",
                features: ["Structured weekly goals", "Peer check-ins", "Revision map by subject"],
                color: "var(--nx-yellow)",
              },
              {
                title: "Exam Crunch Mode",
                subtitle: "Focused revision stack with top notes, solved doubts, and quick concept refreshers.",
                features: ["Most-saved notes first", "Frequently asked doubts", "Time-boxed revision windows"],
                color: "var(--nx-coral)",
              },
              {
                title: "Consistency Builder",
                subtitle: "Low-friction daily workflow for students who want to improve one step at a time.",
                features: ["Daily 30-min prompts", "Progress snapshots", "Habit streak reinforcement"],
                color: "var(--nx-blue)",
              },
            ].map(({ title, subtitle, features, color }, i) => (
              <Reveal key={title} delay={i * 100} className="nx-fade-up">
                <div className="nx-card p-6 sm:p-8 flex flex-col justify-between h-full">
                  <div>
                    <h3 className="font-display text-base sm:text-lg font-bold text-[color:var(--nx-chalk)] mb-2">
                      {title}
                    </h3>
                    <p className="text-[color:var(--nx-dim)] text-xs sm:text-sm leading-relaxed mb-6">
                      {subtitle}
                    </p>
                    <ul className="space-y-2 mb-8">
                      {features.map((f) => (
                        <li key={f} className="flex items-center gap-2 text-xs text-[color:var(--nx-chalk)]">
                          <CheckCircle2 className="h-3.5 w-3.5 shrink-0" style={{ color }} />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="nx-stamp" style={{ borderColor: color, color }}>
                    Active Track
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* ── Leaderboard & achievements ── */}
        <section className="max-w-5xl mx-auto px-6 mt-28">
          <Reveal className="nx-fade-up">
            <div className="nx-panel nx-graph rounded-[28px] p-8 sm:p-12">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10 text-center md:text-left">
                <div>
                  <span className="nx-eyebrow">Gamified progress</span>
                  <h3 className="font-display text-2xl sm:text-3xl font-bold text-[color:var(--nx-chalk)] mt-3">
                    Contribution earns you a name on the board
                  </h3>
                  <p className="text-[color:var(--nx-dim)] text-xs sm:text-sm mt-2 max-w-md">
                    Every note, answer, and post counts toward a running leaderboard the whole
                    batch can see.
                  </p>
                </div>
                <Trophy className="h-10 w-10 mx-auto md:mx-0" style={{ color: "var(--nx-yellow)" }} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  {
                    icon: TrendingUp,
                    color: "var(--nx-yellow)",
                    title: "Earning Points",
                    desc: "Upload notes, answer doubts, write blogs, and join forums to add to your score.",
                  },
                  {
                    icon: Trophy,
                    color: "var(--nx-coral)",
                    title: "Rankings",
                    desc: "Top contributors are ranked in real time as the community keeps growing.",
                  },
                  {
                    icon: Award,
                    color: "var(--nx-blue)",
                    title: "Achievements",
                    desc: "Unlock badges at milestones and show them off right on your profile.",
                  },
                ].map(({ icon: Icon, color, title, desc }, i) => (
                  <Reveal key={title} delay={i * 100} className="nx-fade-up">
                    <div className="nx-inset rounded-2xl p-6 space-y-3">
                      <div className="nx-icon-badge" style={{ borderColor: color, color }}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <h4 className="font-display text-sm font-bold text-[color:var(--nx-chalk)]">
                        {title}
                      </h4>
                      <p className="text-[color:var(--nx-dim)] text-xs leading-relaxed">{desc}</p>
                    </div>
                  </Reveal>
                ))}
              </div>
            </div>
          </Reveal>
        </section>

        {/* ── Testimonials ── */}
        <section className="max-w-5xl mx-auto px-6 mt-28">
          <Reveal className="nx-fade-up text-center mb-14">
            <h2 className="font-display text-3xl md:text-5xl font-bold text-[color:var(--nx-chalk)] mb-2">
              What students are saying
            </h2>
            <p className="text-[color:var(--nx-dim)] text-xs sm:text-sm">
              Based on active contributors across notes, doubts, and forums
            </p>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-10 pt-4">
            {[
              { quote: "I used to lose time searching multiple groups. Now all my notes and doubts are in one workflow.", name: "Aarav S.", role: "2nd Year CSE", rot: "-rotate-2" },
              { quote: "The forum answers plus AI hints made tough subjects far less intimidating before exams.", name: "Nisha R.", role: "ECE Student", rot: "rotate-1" },
              { quote: "Our batch finally has a proper knowledge base instead of scattered PDFs and chats.", name: "Rohan M.", role: "Class Representative", rot: "-rotate-1" },
            ].map(({ quote, name, role, rot }, i) => (
              <Reveal key={name} delay={i * 100} className="nx-fade-up">
                <div className={`nx-sticky ${rot} p-6 sm:p-7`}>
                  <p className="font-hand text-lg sm:text-xl text-[color:var(--nx-ink)] leading-snug mb-5">
                    &ldquo;{quote}&rdquo;
                  </p>
                  <div>
                    <h4 className="font-display text-xs font-bold text-[color:var(--nx-ink)]">{name}</h4>
                    <p className="text-[10px] text-[color:var(--nx-ink-dim)] mt-0.5">{role}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* ── FAQs ── */}
        <section id="pricing" className="max-w-3xl mx-auto px-6 mt-28">
          <Reveal className="nx-fade-up text-center mb-12">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-[color:var(--nx-chalk)] mb-2">
              Frequently asked questions
            </h2>
          </Reveal>

          <div className="space-y-3.5">
            {[
              { q: "Can first-year students use this effectively?", a: "Yes. Notexia is designed for beginners with clear tags, guided discovery, and simple workflows." },
              { q: "Is it only for notes, or can I ask doubts too?", a: "You can do both. Share notes, ask doubts, join forums, and follow topic-specific discussions." },
              { q: "How do I measure my improvement?", a: "The dashboard highlights contribution, engagement, and completion patterns so you can improve weekly." },
              { q: "Can seniors contribute resources for juniors?", a: "Absolutely. Seniors can share notes and insights, helping build a stronger learning culture." },
            ].map(({ q, a }, i) => (
              <Reveal key={q} delay={i * 70} className="nx-fade-up">
                <details className="nx-faq group">
                  <summary className="font-display text-xs sm:text-sm font-bold text-[color:var(--nx-chalk)] flex items-center justify-between gap-4 cursor-pointer list-none">
                    {q}
                    <span className="nx-faq-plus">+</span>
                  </summary>
                  <p className="text-[color:var(--nx-dim)] text-xs sm:text-sm leading-relaxed mt-3">{a}</p>
                </details>
              </Reveal>
            ))}
          </div>
        </section>

        {/* ── Final CTA ── */}
        <section className="max-w-5xl mx-auto px-6 mt-28 text-center">
          <Reveal className="nx-fade-up">
            <div className="nx-panel nx-cta rounded-[28px] p-8 sm:p-14 space-y-6 relative overflow-hidden">
              <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold text-[color:var(--nx-chalk)] tracking-tight relative">
                Ready to modernize how you learn?
              </h2>
              <p className="text-[color:var(--nx-dim)] text-xs sm:text-sm max-w-lg mx-auto leading-relaxed relative">
                Join a platform where notes, community, and smart support work together.
              </p>
              <div className="pt-2 relative">
                <Link href={isLoggedIn ? "/dashboard" : "/signup"} className="nx-btn-primary inline-flex">
                  {isLoggedIn ? "Continue to Dashboard" : "Create Your Free Account"}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </Reveal>
        </section>
      </main>

      {/* ── Footer ── */}
      <footer className="relative z-10 mt-24">
        <div className="nx-wood-tray" />
        <div className="nx-footer py-8">
          <div className="max-w-5xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between text-[color:var(--nx-dim)] text-xs gap-4">
            <div className="flex items-center gap-2">
              <span className="nx-chalk-dot" />
              <p className="font-mono" style={{ fontSize: "11px" }}>
                © 2026 Notexia · Built for students, by students.
              </p>
            </div>
            <div className="flex gap-6">
              <Link href="/docs" className="hover:text-[color:var(--nx-chalk)] transition-colors">Docs</Link>
              <Link href="/terms" className="hover:text-[color:var(--nx-chalk)] transition-colors">Terms</Link>
              <Link href="/privacy" className="hover:text-[color:var(--nx-chalk)] transition-colors">Privacy</Link>
            </div>
          </div>
        </div>
      </footer>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Kalam:wght@400;700&family=JetBrains+Mono:wght@500;600&display=swap');

        .nx-root {
          --nx-bg: #16261D;
          --nx-bg-deep: #0F1C15;
          --nx-chalk: #F3F0E4;
          --nx-dim: #9FAEA1;
          --nx-yellow: #F0C93B;
          --nx-coral: #F28B6E;
          --nx-blue: #8FC3DE;
          --nx-lilac: #C9A9E0;
          --nx-line: rgba(243, 240, 228, 0.16);
          --nx-line-bright: rgba(243, 240, 228, 0.34);
          --nx-wood: #3A2A1C;
          --nx-wood-light: #55402B;
          --nx-ink: #2A2118;
          --nx-ink-dim: #6B5E4E;
          background: var(--nx-bg);
          color: var(--nx-chalk);
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        }
        .font-display { font-family: "Space Grotesk", sans-serif; }
        .font-hand { font-family: "Kalam", cursive; }
        .font-mono { font-family: "JetBrains Mono", monospace; }

        /* Ambient board texture */
        .nx-sheen {
          background:
            radial-gradient(ellipse 900px 500px at 50% -10%, rgba(255,255,255,0.05), transparent 60%),
            radial-gradient(ellipse 700px 500px at 90% 30%, rgba(143,195,222,0.06), transparent 60%),
            radial-gradient(ellipse 700px 500px at 5% 70%, rgba(242,139,110,0.05), transparent 60%);
        }
        .nx-grid {
          background-image:
            linear-gradient(var(--nx-line) 1px, transparent 1px),
            linear-gradient(90deg, var(--nx-line) 1px, transparent 1px);
          background-size: 46px 46px;
          opacity: 0.05;
          mask-image: radial-gradient(ellipse 80% 60% at 50% 0%, black, transparent 75%);
        }
        .nx-dust {
          position: absolute;
          bottom: -10px;
          border-radius: 50%;
          background: rgba(243, 240, 228, 0.35);
          animation: nx-drift linear infinite;
        }
        @keyframes nx-drift {
          0% { transform: translateY(0) translateX(0); opacity: 0; }
          10% { opacity: 0.6; }
          90% { opacity: 0.3; }
          100% { transform: translateY(-620px) translateX(24px); opacity: 0; }
        }

        /* Reveal-on-scroll */
        .nx-reveal { opacity: 0; transform: translateY(22px); transition: opacity 0.7s cubic-bezier(.22,1,.36,1), transform 0.7s cubic-bezier(.22,1,.36,1); }
        .nx-reveal.nx-in { opacity: 1; transform: translateY(0); }

        /* Squiggle underline draw-in */
        .nx-squiggle { height: 12px; overflow: visible; }
        .nx-squiggle path { stroke-dasharray: 260; stroke-dashoffset: 260; animation: nx-draw 1s ease forwards 0.5s; }
        @keyframes nx-draw { to { stroke-dashoffset: 0; } }

        /* Nav */
        .nx-nav-panel {
          background: rgba(20, 33, 25, 0.72);
          backdrop-filter: blur(18px) saturate(140%);
          border: 1px solid var(--nx-line);
          box-shadow: 0 12px 34px -12px rgba(0,0,0,0.55);
        }
        .nx-nav-scrolled .nx-nav-panel { background: rgba(15, 26, 19, 0.9); }
        .nx-wood-tray {
          height: 6px;
          background: repeating-linear-gradient(90deg, var(--nx-wood) 0px, var(--nx-wood-light) 2px, var(--nx-wood) 5px);
          border-radius: 0 0 10px 10px;
          margin: 0 10px;
          opacity: 0.9;
        }
        .nx-navlink { font-size: 12px; font-weight: 600; color: var(--nx-dim); position: relative; transition: color 0.2s; }
        .nx-navlink:hover { color: var(--nx-chalk); }
        .nx-chalk-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--nx-yellow); box-shadow: 0 0 8px 1px rgba(240,201,59,0.6); flex-shrink: 0; }

        /* Tag / eyebrow */
        .nx-tag {
          font-family: "JetBrains Mono", monospace;
          font-size: 10px; font-weight: 600; letter-spacing: 0.14em; text-transform: uppercase;
          color: var(--nx-yellow);
          padding: 7px 16px;
          border: 1.5px dashed var(--nx-line-bright);
          border-radius: 999px;
          background: rgba(243,240,228,0.03);
        }
        .nx-eyebrow {
          font-family: "JetBrains Mono", monospace;
          font-size: 10px; font-weight: 700; letter-spacing: 0.16em; text-transform: uppercase;
          color: var(--nx-dim);
          padding: 5px 14px;
          border: 1px solid var(--nx-line);
          border-radius: 999px;
        }

        /* Buttons — hand-drawn offset shadow */
        .nx-btn-primary, .nx-btn-solid {
          font-family: "Space Grotesk", sans-serif;
          display: inline-flex; align-items: center; gap: 8px;
          font-weight: 700; color: var(--nx-ink);
          background: var(--nx-yellow);
          border-radius: 14px;
          box-shadow: 4px 4px 0 0 var(--nx-coral);
          transition: transform 0.15s ease, box-shadow 0.15s ease;
        }
        .nx-btn-primary { padding: 14px 30px; font-size: 14px; }
        .nx-btn-solid { padding: 9px 18px; font-size: 12px; box-shadow: 3px 3px 0 0 var(--nx-coral); border-radius: 10px; }
        .nx-btn-primary:hover, .nx-btn-solid:hover { transform: translate(2px, 2px); box-shadow: 2px 2px 0 0 var(--nx-coral); }
        .nx-btn-ghost {
          font-family: "Space Grotesk", sans-serif;
          padding: 14px 30px; font-size: 14px; font-weight: 600;
          color: var(--nx-chalk);
          border: 1.5px dashed var(--nx-line-bright);
          border-radius: 14px;
          transition: background 0.2s, border-color 0.2s;
        }
        .nx-btn-ghost:hover { background: rgba(243,240,228,0.05); border-color: var(--nx-chalk); }

        /* Panels & cards — wobbly hand-drawn borders */
        .nx-panel {
          background: rgba(243, 240, 228, 0.035);
          border: 1.5px solid var(--nx-line);
          box-shadow: 0 20px 50px -20px rgba(0,0,0,0.55);
        }
        .nx-card {
          background: rgba(243, 240, 228, 0.035);
          border: 1.5px dashed var(--nx-line-bright);
          border-radius: 22px 24px 20px 26px;
          transition: transform 0.3s cubic-bezier(.22,1,.36,1), border-color 0.3s, background 0.3s;
        }
        .nx-card:hover {
          transform: translateY(-4px) rotate(0deg) !important;
          border-color: var(--nx-chalk);
          background: rgba(243, 240, 228, 0.06);
        }
        .nx-icon-badge {
          width: 46px; height: 46px; border-radius: 14px 16px 12px 18px;
          border: 1.5px solid; display: flex; align-items: center; justify-content: center;
          background: rgba(243,240,228,0.04);
        }
        .nx-metric {
          padding: 14px 6px;
          border: 1.5px dashed var(--nx-line);
          border-radius: 18px 20px 16px 22px;
          background: rgba(243,240,228,0.03);
        }
        .nx-inset {
          background: rgba(243, 240, 228, 0.045);
          border: 1px solid var(--nx-line);
        }
        .nx-pill {
          font-family: "JetBrains Mono", monospace;
          font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.14em;
          color: var(--nx-yellow);
          padding: 5px 12px; border-radius: 999px;
          border: 1px solid rgba(240,201,59,0.35);
          background: rgba(240,201,59,0.08);
        }
        .nx-step-badge {
          font-family: "Space Grotesk", sans-serif;
          width: 30px; height: 30px; border-radius: 50%;
          border: 1.5px solid; display: flex; align-items: center; justify-content: center;
          font-size: 12px; font-weight: 700;
        }
        .nx-stamp {
          text-align: center; padding: 10px; border-radius: 999px;
          border: 1.5px dashed; font-size: 11px; font-weight: 700;
          font-family: "Space Grotesk", sans-serif;
          transform: rotate(-1.5deg);
        }

        /* Sticky-note testimonials */
        .nx-sticky {
          background: var(--nx-yellow);
          border-radius: 4px 4px 8px 8px;
          box-shadow: 0 14px 30px -10px rgba(0,0,0,0.5);
          position: relative;
          transition: transform 0.3s ease;
        }
        .nx-sticky:nth-child(2) { background: var(--nx-coral); }
        .nx-sticky:nth-child(3) { background: var(--nx-blue); }
        .nx-sticky:hover { transform: rotate(0deg) scale(1.03) !important; }
        .nx-sticky::before {
          content: ""; position: absolute; top: -10px; left: 50%; transform: translateX(-50%) rotate(-3deg);
          width: 56px; height: 18px;
          background: rgba(243,240,228,0.55);
          border: 1px solid rgba(0,0,0,0.05);
        }

        /* FAQ */
        .nx-faq {
          background: rgba(243, 240, 228, 0.035);
          border: 1.5px dashed var(--nx-line);
          border-radius: 16px;
          padding: 18px 20px;
          transition: border-color 0.2s, background 0.2s;
        }
        .nx-faq:hover { border-color: var(--nx-line-bright); background: rgba(243,240,228,0.05); }
        .nx-faq-plus {
          font-family: "Space Grotesk", sans-serif;
          font-size: 16px; color: var(--nx-yellow); transition: transform 0.25s ease; flex-shrink: 0;
        }
        .nx-faq[open] .nx-faq-plus { transform: rotate(45deg); }

        .nx-graph {
          background-image: linear-gradient(var(--nx-line) 1px, transparent 1px), linear-gradient(90deg, var(--nx-line) 1px, transparent 1px);
          background-size: 28px 28px;
        }
        .nx-cta { background: rgba(243, 240, 228, 0.045); }

        .nx-footer { background: rgba(15, 26, 19, 0.6); border-top: none; }

        @media (prefers-reduced-motion: reduce) {
          .nx-reveal, .nx-dust, .nx-squiggle path, .nx-card, .nx-sticky, .nx-btn-primary, .nx-btn-solid {
            animation: none !important; transition: none !important;
          }
          .nx-reveal { opacity: 1; transform: none; }
        }
      `}</style>
    </div>
  );
}