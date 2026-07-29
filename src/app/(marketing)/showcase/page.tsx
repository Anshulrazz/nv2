"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Sparkles,
  ArrowUpRight,
  Zap,
  Shield,
  Code2,
  Terminal,
  Lock,
  Globe,
  Command,
  Check,
  FileText,
  Bot,
  Cpu,
} from "lucide-react";

export default function ShowcaseLandingPage() {
  const [activeTab, setActiveTab] = useState<"editor" | "ai" | "sync">("editor");
  const [isAnnual, setIsAnnual] = useState(true);
  const [copiedSnippet, setCopiedSnippet] = useState(false);

  const handleCopySnippet = () => {
    navigator.clipboard.writeText("npx skills add emilkowalski/skill");
    setCopiedSnippet(true);
    setTimeout(() => setCopiedSnippet(false), 2000);
  };

  return (
    <div className="min-h-[100dvh] bg-[#030305] text-zinc-100 font-sans selection:bg-cyan-500/30 selection:text-cyan-200 overflow-x-hidden antialiased">
      {/* Background Ambient Mesh Orbs */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[1200px] h-[600px] bg-gradient-to-b from-cyan-500/15 via-violet-600/10 to-transparent blur-[140px] opacity-70" />
        <div className="absolute top-[900px] -right-40 w-[700px] h-[500px] bg-cyan-500/10 blur-[160px]" />
        <div className="absolute top-[1800px] -left-40 w-[600px] h-[500px] bg-violet-500/10 blur-[160px]" />
      </div>

      {/* Floating Island Navbar */}
      <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-4xl px-4 pointer-events-none">
        <header className="pointer-events-auto rounded-full bg-zinc-950/80 border border-white/10 backdrop-blur-2xl px-6 py-2.5 flex items-center justify-between shadow-[0_20px_50px_rgba(0,0,0,0.8)]">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="size-8 rounded-full bg-gradient-to-tr from-cyan-500 to-teal-400 flex items-center justify-center text-zinc-950 font-bold shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-transform duration-300 group-hover:scale-105">
              <Zap className="size-4 fill-current text-zinc-950" />
            </div>
            <span className="font-bold tracking-tight text-sm text-white">
              Notexia <span className="text-cyan-400 font-mono text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 ml-1">v2.4</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-7 text-xs font-medium text-zinc-400 tracking-wide">
            <a href="#features" className="hover:text-white transition-colors duration-200">Capabilities</a>
            <a href="#architecture" className="hover:text-white transition-colors duration-200">Architecture</a>
            <a href="#benchmarks" className="hover:text-white transition-colors duration-200">Benchmarks</a>
            <a href="#pricing" className="hover:text-white transition-colors duration-200">Pricing</a>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-xs font-medium text-zinc-400 hover:text-white transition-colors px-2 py-1"
            >
              Sign In
            </Link>
            {/* Button-in-Button Architecture */}
            <Link
              href="/signup"
              className="group rounded-full bg-white hover:bg-zinc-100 text-zinc-950 font-bold text-xs pl-4 pr-1.5 py-1.5 inline-flex items-center gap-2.5 transition-all duration-300 active:scale-[0.97] shadow-[0_0_20px_rgba(255,255,255,0.2)]"
            >
              <span>Get Started</span>
              <div className="size-6 rounded-full bg-zinc-950/10 flex items-center justify-center group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-200">
                <ArrowUpRight className="size-3.5 text-zinc-950" />
              </div>
            </Link>
          </div>
        </header>
      </div>

      <main className="relative z-10 pt-28">
        {/* HERO SECTION - Asymmetric & Generous Macro-Whitespace */}
        <section className="max-w-[1400px] mx-auto px-6 pt-20 pb-32 space-y-16">
          <div className="max-w-4xl space-y-8 text-left">
            {/* Micro Eyebrow Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 font-mono text-[10px] uppercase tracking-[0.25em]">
              <span className="size-1.5 rounded-full bg-cyan-400 animate-pulse" />
              <span>THE NEXT-GEN KNOWLEDGE OPERATING SYSTEM</span>
            </div>

            {/* Massive Display Headline */}
            <h1 className="text-5xl sm:text-7xl lg:text-8xl font-black tracking-[-0.03em] leading-[0.94] text-white">
              Engineered for speed. <br />
              <span className="bg-gradient-to-r from-cyan-400 via-teal-300 to-violet-400 bg-clip-text text-transparent">
                Built for deep focus.
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-zinc-400 max-w-[52ch] leading-relaxed font-light">
              The high-performance workspace combining real-time collaborative notes, instant AI research tools, and local-first encryption for modern engineering teams.
            </p>

            {/* Nested CTA & Snippet Action Bar */}
            <div className="flex flex-wrap items-center gap-5 pt-4">
              <Link
                href="/signup"
                className="group rounded-full bg-white hover:bg-zinc-100 text-zinc-950 font-bold text-sm pl-6 pr-2 py-3.5 inline-flex items-center gap-3 transition-all duration-300 active:scale-[0.97] shadow-[0_0_35px_rgba(255,255,255,0.25)]"
              >
                <span>Start Free Trial</span>
                <div className="size-8 rounded-full bg-zinc-950 flex items-center justify-center text-white group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-200">
                  <ArrowUpRight className="size-4 text-white" />
                </div>
              </Link>

              <button
                onClick={handleCopySnippet}
                className="rounded-full bg-zinc-900/90 hover:bg-zinc-850 border border-white/10 text-zinc-300 font-mono text-xs px-5 py-3.5 inline-flex items-center gap-3 transition-all duration-200 active:scale-[0.97] backdrop-blur-xl"
              >
                <Terminal className="size-4 text-cyan-400" />
                <span>{copiedSnippet ? "Copied Command!" : "npx skills add emilkowalski/skill"}</span>
                {copiedSnippet ? <Check className="size-4 text-emerald-400" /> : <Command className="size-4 text-zinc-500" />}
              </button>
            </div>
          </div>

          {/* Doppelrand (Double-Bezel) Hardware Shell Showcase */}
          <div className="rounded-[2.5rem] bg-zinc-900/40 border border-white/10 p-3 backdrop-blur-3xl shadow-[0_0_100px_rgba(0,0,0,0.9)]">
            <div className="rounded-[calc(2.5rem-0.75rem)] bg-[#060608] border border-white/5 p-6 sm:p-8 relative overflow-hidden space-y-6 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]">
              {/* Window Header */}
              <div className="flex items-center justify-between pb-4 border-b border-white/5">
                <div className="flex items-center gap-2">
                  <div className="size-3 rounded-full bg-rose-500/80" />
                  <div className="size-3 rounded-full bg-amber-500/80" />
                  <div className="size-3 rounded-full bg-emerald-500/80" />
                </div>
                <div className="text-[11px] font-mono text-zinc-400 flex items-center gap-2">
                  <FileText className="size-3.5 text-cyan-400" />
                  <span>distributed_cache_engine.md</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="size-2 rounded-full bg-cyan-400 animate-pulse" />
                  <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">LIVE CRDT</span>
                </div>
              </div>

              {/* Editor Code Preview Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                <div className="lg:col-span-7 space-y-4 font-mono text-xs">
                  <div className="p-4 rounded-xl bg-zinc-950/80 border border-white/5 text-zinc-300 space-y-2">
                    <div className="text-cyan-400 font-bold text-sm"># Distributed Cache Layer Architecture</div>
                    <p className="text-zinc-400 text-xs leading-relaxed">
                      Implements dual-phase write-through caching with ultra-low latency invalidation protocols across edge nodes...
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-zinc-950/40 border border-white/5 flex items-center justify-between text-zinc-400 text-xs">
                    <div className="flex items-center gap-2">
                      <Cpu className="size-4 text-violet-400" />
                      <span>WebAssembly Vector Search Engine</span>
                    </div>
                    <span className="text-emerald-400 font-bold">0.8ms Index</span>
                  </div>
                </div>

                <div className="lg:col-span-5 space-y-4 font-mono text-xs">
                  <div className="p-4 rounded-xl bg-cyan-950/20 border border-cyan-500/20 text-cyan-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 font-bold text-cyan-400">
                        <Sparkles className="size-4 animate-spin" />
                        <span>AI Research Synthesis</span>
                      </div>
                      <span className="text-[9px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-bold">READY</span>
                    </div>
                    <p className="text-[11px] text-zinc-300 leading-relaxed">
                      Analyzed 24 paper sources: Verified zero race conditions in lock-free queue implementation.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-3.5 rounded-xl bg-zinc-950/50 border border-white/5 text-zinc-400 space-y-1">
                      <div className="text-[9px] uppercase tracking-wider text-zinc-500">Sync Latency</div>
                      <div className="text-base font-bold text-white">1.4ms</div>
                    </div>
                    <div className="p-3.5 rounded-xl bg-zinc-950/50 border border-white/5 text-zinc-400 space-y-1">
                      <div className="text-[9px] uppercase tracking-wider text-zinc-500">AI Tokens</div>
                      <div className="text-base font-bold text-cyan-400">128k Context</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* LOGO WALL */}
        <section className="border-y border-white/5 bg-zinc-950/40 py-12">
          <div className="max-w-[1400px] mx-auto px-6 space-y-6 text-center">
            <div className="text-[10px] font-mono uppercase tracking-[0.25em] text-zinc-500">
              TRUSTED BY ENGINEERING LEADS AT HIGH-GROWTH TEAMS
            </div>
            <div className="flex flex-wrap items-center justify-center gap-12 sm:gap-20 opacity-60 hover:opacity-100 transition-opacity duration-300">
              {["Linear", "Vercel", "Supabase", "Raycast", "GitHub", "Stripe"].map((brand) => (
                <span key={brand} className="font-mono text-sm sm:text-base font-bold tracking-widest text-zinc-400 hover:text-white transition-colors cursor-default">
                  {brand}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* ASYMMETRICAL DOPPELRAND BENTO GRID */}
        <section id="features" className="max-w-[1400px] mx-auto px-6 py-36 space-y-16">
          <div className="space-y-4 text-left">
            <h2 className="text-4xl sm:text-5xl font-extrabold tracking-[-0.02em] text-white">
              Architected for absolute clarity
            </h2>
            <p className="text-zinc-400 text-base max-w-[55ch] font-light leading-relaxed">
              Every subsystem is engineered with strict performance budgets, hardware acceleration, and ergonomic keyboard shortcuts.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Tile 1: Massive Double-Bezel Card */}
            <div className="md:col-span-8 rounded-[2rem] bg-zinc-900/30 border border-white/10 p-2 backdrop-blur-2xl hover:border-cyan-500/30 transition-colors group">
              <div className="rounded-[calc(2rem-0.5rem)] bg-[#07070a] border border-white/5 p-8 h-full flex flex-col justify-between space-y-8">
                <div className="space-y-4">
                  <div className="size-11 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                    <Code2 className="size-5" />
                  </div>
                  <h3 className="text-2xl font-bold text-white tracking-tight">Rich MDX &amp; Live Code Evaluation</h3>
                  <p className="text-zinc-400 text-sm leading-relaxed max-w-[52ch]">
                    Write structured technical documents with full TipTap rich text, interactive math formulas, live diagramming, and real-time JavaScript evaluation directly inside notes.
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-zinc-950 border border-white/5 font-mono text-xs text-zinc-300 space-y-2">
                  <div className="text-zinc-500">{"// Executing async CRDT benchmark test..."}</div>
                  <div className="text-emerald-400">✓ 10,000 documents synchronized in 1.4ms</div>
                </div>
              </div>
            </div>

            {/* Tile 2: Side Double-Bezel Tile */}
            <div className="md:col-span-4 rounded-[2rem] bg-zinc-900/30 border border-white/10 p-2 backdrop-blur-2xl hover:border-violet-500/30 transition-colors group">
              <div className="rounded-[calc(2rem-0.5rem)] bg-[#07070a] border border-white/5 p-8 h-full flex flex-col justify-between space-y-8">
                <div className="space-y-4">
                  <div className="size-11 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
                    <Shield className="size-5" />
                  </div>
                  <h3 className="text-2xl font-bold text-white tracking-tight">Zero-Knowledge Vault</h3>
                  <p className="text-zinc-400 text-sm leading-relaxed">
                    Encryption keys remain strictly client-side. Server infrastructure only stores encrypted blobs.
                  </p>
                </div>
                <div className="flex items-center gap-2.5 text-xs font-mono text-violet-300 bg-violet-950/30 p-3.5 rounded-xl border border-violet-500/20">
                  <Lock className="size-4" />
                  <span>AES-GCM 256-Bit Hardware Locked</span>
                </div>
              </div>
            </div>

            {/* Bottom Triple Row */}
            <div className="md:col-span-4 rounded-[2rem] bg-zinc-900/30 border border-white/10 p-2 hover:border-cyan-500/30 transition-colors">
              <div className="rounded-[calc(2rem-0.5rem)] bg-[#07070a] border border-white/5 p-6 space-y-3 h-full">
                <div className="size-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
                  <Zap className="size-4" />
                </div>
                <h4 className="text-lg font-bold text-white tracking-tight">Sub-10ms Global Index</h4>
                <p className="text-zinc-400 text-xs leading-relaxed">
                  Instant fuzzy search engine powered by WebAssembly running locally inside your browser tab.
                </p>
              </div>
            </div>

            <div className="md:col-span-4 rounded-[2rem] bg-zinc-900/30 border border-white/10 p-2 hover:border-cyan-500/30 transition-colors">
              <div className="rounded-[calc(2rem-0.5rem)] bg-[#07070a] border border-white/5 p-6 space-y-3 h-full">
                <div className="size-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                  <Bot className="size-4" />
                </div>
                <h4 className="text-lg font-bold text-white tracking-tight">Contextual AI Copilot</h4>
                <p className="text-zinc-400 text-xs leading-relaxed">
                  Generates instant summaries, flashcards, and automated mind maps from complex articles.
                </p>
              </div>
            </div>

            <div className="md:col-span-4 rounded-[2rem] bg-zinc-900/30 border border-white/10 p-2 hover:border-cyan-500/30 transition-colors">
              <div className="rounded-[calc(2rem-0.5rem)] bg-[#07070a] border border-white/5 p-6 space-y-3 h-full">
                <div className="size-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                  <Globe className="size-4" />
                </div>
                <h4 className="text-lg font-bold text-white tracking-tight">Offline-First Core</h4>
                <p className="text-zinc-400 text-xs leading-relaxed">
                  Full functionality uninterrupted offline. Automatic background resolution when connection restores.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* WORKFLOW SHOWCASE SECTION */}
        <section id="architecture" className="border-t border-white/5 bg-[#050508] py-36">
          <div className="max-w-[1400px] mx-auto px-6 space-y-16">
            <div className="text-center space-y-4 max-w-[600px] mx-auto">
              <h2 className="text-4xl sm:text-5xl font-extrabold tracking-[-0.02em] text-white">
                Designed for daily flow
              </h2>
              <p className="text-zinc-400 text-sm font-light">
                Switch between editing, research synthesis, and cross-device sync seamlessly.
              </p>
            </div>

            {/* Double-Bezel Interactive Tab Selector */}
            <div className="flex justify-center">
              <div className="rounded-full bg-zinc-950 border border-white/10 p-1.5 flex items-center gap-2">
                {(["editor", "ai", "sync"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-6 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-300 ${
                      activeTab === tab
                        ? "bg-white text-zinc-950 shadow-lg"
                        : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    {tab === "editor" ? "Pro Editor" : tab === "ai" ? "AI Research" : "Realtime Sync"}
                  </button>
                ))}
              </div>
            </div>

            {/* Display Card */}
            <div className="max-w-4xl mx-auto rounded-[2rem] bg-zinc-900/40 border border-white/10 p-2 backdrop-blur-2xl shadow-2xl">
              <div className="rounded-[calc(2rem-0.5rem)] bg-[#07070a] border border-white/5 p-8 space-y-6">
                {activeTab === "editor" && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-xs font-mono text-zinc-400 border-b border-white/5 pb-4">
                      <span>TipTap Markdown Engine</span>
                      <span className="text-cyan-400 font-bold">WYSIWYG Mode</span>
                    </div>
                    <p className="text-base text-zinc-300 leading-relaxed font-light">
                      Distraction-free writing environment with full slash commands, custom code blocks, inline equations (\(E=mc^2\)), and instant PDF export.
                    </p>
                  </div>
                )}

                {activeTab === "ai" && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-xs font-mono text-zinc-400 border-b border-white/5 pb-4">
                      <span>Deep Research Engine</span>
                      <span className="text-violet-400 font-bold">Anthropic Claude 3.5</span>
                    </div>
                    <p className="text-base text-zinc-300 leading-relaxed font-light">
                      Synthesize long research documents, generate flashcard decks, and perform automated query expansion across your entire note library.
                    </p>
                  </div>
                )}

                {activeTab === "sync" && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-xs font-mono text-zinc-400 border-b border-white/5 pb-4">
                      <span>Pusher WebSocket Transport</span>
                      <span className="text-emerald-400 font-bold">&lt; 2ms Socket Latency</span>
                    </div>
                    <p className="text-base text-zinc-300 leading-relaxed font-light">
                      Collaborate live with teammates. Changes are merged smoothly using conflict-free replicated data type (CRDT) algorithms.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* PRICING SECTION */}
        <section id="pricing" className="max-w-[1400px] mx-auto px-6 py-36 space-y-16">
          <div className="text-center space-y-4 max-w-[500px] mx-auto">
            <h2 className="text-4xl sm:text-5xl font-extrabold tracking-[-0.02em] text-white">
              Transparent pricing
            </h2>
            <p className="text-zinc-400 text-sm font-light">
              Start free forever. Upgrade when your team scales.
            </p>

            <div className="pt-4 flex items-center justify-center gap-3 text-xs font-medium text-zinc-400">
              <span>Monthly</span>
              <button
                onClick={() => setIsAnnual(!isAnnual)}
                className={`w-11 h-6 rounded-full p-1 transition-colors ${
                  isAnnual ? "bg-cyan-500" : "bg-zinc-800"
                }`}
              >
                <div
                  className={`size-4 rounded-full bg-zinc-950 transition-transform ${
                    isAnnual ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
              <span>Annual <span className="text-cyan-400 font-bold">(Save 20%)</span></span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Free Tier */}
            <div className="rounded-[2rem] bg-zinc-900/30 border border-white/10 p-2">
              <div className="rounded-[calc(2rem-0.5rem)] bg-[#07070a] border border-white/5 p-8 h-full flex flex-col justify-between space-y-8">
                <div className="space-y-5">
                  <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-zinc-500">Starter</div>
                  <div className="text-4xl font-extrabold text-white">$0 <span className="text-xs font-normal text-zinc-500">/ forever</span></div>
                  <p className="text-xs text-zinc-400 leading-relaxed">Perfect for individual creators and students looking for clean note-taking.</p>
                  <ul className="space-y-3 text-xs text-zinc-300 pt-6 border-t border-white/5">
                    <li className="flex items-center gap-2.5"><Check className="size-4 text-cyan-400" /> Unlimited Local Notes</li>
                    <li className="flex items-center gap-2.5"><Check className="size-4 text-cyan-400" /> 100 AI Queries / Month</li>
                    <li className="flex items-center gap-2.5"><Check className="size-4 text-cyan-400" /> Markdown &amp; PDF Export</li>
                  </ul>
                </div>
                <Link
                  href="/signup"
                  className="w-full h-11 rounded-full bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs flex items-center justify-center transition-all duration-200 active:scale-[0.97]"
                >
                  Get Started Free
                </Link>
              </div>
            </div>

            {/* Pro Tier (High Highlight Doppelrand) */}
            <div className="rounded-[2rem] bg-cyan-500/10 border border-cyan-500/40 p-2 shadow-[0_0_60px_rgba(6,182,212,0.15)] relative">
              <div className="absolute -top-3.5 right-8 px-3.5 py-1 rounded-full bg-cyan-500 text-zinc-950 font-bold text-[10px] uppercase tracking-widest shadow-lg">
                Most Popular
              </div>
              <div className="rounded-[calc(2rem-0.5rem)] bg-[#07070a] border border-white/5 p-8 h-full flex flex-col justify-between space-y-8">
                <div className="space-y-5">
                  <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-cyan-400 font-bold">Pro Team</div>
                  <div className="text-4xl font-extrabold text-white">{isAnnual ? "$12" : "$15"} <span className="text-xs font-normal text-zinc-500">/ user / mo</span></div>
                  <p className="text-xs text-zinc-400 leading-relaxed">For engineering leads and teams needing unlimited AI synthesis &amp; real-time sync.</p>
                  <ul className="space-y-3 text-xs text-zinc-300 pt-6 border-t border-white/5">
                    <li className="flex items-center gap-2.5"><Check className="size-4 text-cyan-400" /> Everything in Starter</li>
                    <li className="flex items-center gap-2.5"><Check className="size-4 text-cyan-400" /> Unlimited AI Research Queries</li>
                    <li className="flex items-center gap-2.5"><Check className="size-4 text-cyan-400" /> Real-time CRDT Team Collaboration</li>
                    <li className="flex items-center gap-2.5"><Check className="size-4 text-cyan-400" /> Zero-Knowledge Encryption Keys</li>
                  </ul>
                </div>
                <Link
                  href="/signup?plan=pro"
                  className="group w-full h-11 rounded-full bg-white hover:bg-zinc-100 text-zinc-950 font-bold text-xs flex items-center justify-center gap-2 transition-all duration-300 active:scale-[0.97] shadow-[0_0_25px_rgba(255,255,255,0.2)]"
                >
                  <span>Upgrade to Pro</span>
                  <ArrowUpRight className="size-4 text-zinc-950 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-white/5 bg-zinc-950 py-16 text-xs text-zinc-500">
        <div className="max-w-[1400px] mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-2.5">
            <div className="size-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-mono text-zinc-400">All systems operational</span>
          </div>
          <div className="text-zinc-500">
            &copy; {new Date().getFullYear()} Notexia Inc. Built with High-End Agency Standards ($150k Architecture).
          </div>
          <div className="flex items-center gap-8">
            <a href="#features" className="hover:text-white transition-colors">Privacy</a>
            <a href="#features" className="hover:text-white transition-colors">Terms</a>
            <a href="#features" className="hover:text-white transition-colors">Security</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
