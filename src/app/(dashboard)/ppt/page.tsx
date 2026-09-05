"use client";

import { useState, useEffect, useRef } from "react";
import {
  Sparkles,
  Download,
  RotateCcw,
  Maximize2,
  Minimize2,
  Loader2,
  Monitor,
} from "lucide-react";

// ── Themes ─────────────────────────────────────────────────────────────────
const THEMES = [
  {
    id: "indigo-amber",
    label: "Indigo Amber",
    bg: "#100C2A",
    accent: "#4F46E5",
    gold: "#F59E0B",
    preview: "linear-gradient(135deg,#100C2A 0%,#1B1642 100%)",
    dot: "#F59E0B",
  },
  {
    id: "ocean-cyan",
    label: "Ocean Cyan",
    bg: "#06111E",
    accent: "#0369A1",
    gold: "#06B6D4",
    preview: "linear-gradient(135deg,#06111E 0%,#0B1F35 100%)",
    dot: "#06B6D4",
  },
  {
    id: "forest-gold",
    label: "Forest Gold",
    bg: "#0A170C",
    accent: "#166534",
    gold: "#CA8A04",
    preview: "linear-gradient(135deg,#0A170C 0%,#122018 100%)",
    dot: "#CA8A04",
  },
  {
    id: "obsidian-rose",
    label: "Obsidian Rose",
    bg: "#1A0A0E",
    accent: "#9F1239",
    gold: "#F43F5E",
    preview: "linear-gradient(135deg,#1A0A0E 0%,#2D1018 100%)",
    dot: "#F43F5E",
  },
  {
    id: "nebula-purple",
    label: "Nebula Purple",
    bg: "#120A2A",
    accent: "#7C3AED",
    gold: "#A78BFA",
    preview: "linear-gradient(135deg,#120A2A 0%,#1E1040 100%)",
    dot: "#A78BFA",
  },
  {
    id: "carbon-mono",
    label: "Carbon Mono",
    bg: "#0A0A0A",
    accent: "#374151",
    gold: "#E5E7EB",
    preview: "linear-gradient(135deg,#0A0A0A 0%,#141414 100%)",
    dot: "#E5E7EB",
  },
];

// ── Phase definitions ───────────────────────────────────────────────────────
const PHASES = [
  { id: "research",    label: "Deep Research",   icon: "🔍", desc: "Gathering facts, stats, quotes & examples" },
  { id: "structuring", label: "Structuring",      icon: "🗂️", desc: "Planning slide flow & narrative arc" },
  { id: "generating",  label: "Writing Content",  icon: "✍️", desc: "Crafting editorial slide content" },
  { id: "polishing",   label: "Building HTML",    icon: "✨", desc: "Assembling final presentation" },
];

// ── Main Page ───────────────────────────────────────────────────────────────
export default function PPTMakerPage() {
  const [stage, setStage] = useState<"form" | "loading" | "viewer">("form");
  const [topic, setTopic] = useState("");
  const [slideCount, setSlideCount] = useState(6);
  const [themeId, setThemeId] = useState("indigo-amber");
  const [audience, setAudience] = useState<"student" | "professional" | "general">("general");
  const [extraContext, setExtraContext] = useState("");
  const [generatedHtml, setGeneratedHtml] = useState("");
  const [error, setError] = useState("");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentPhase, setCurrentPhase] = useState("research");
  const [phaseMessage, setPhaseMessage] = useState("");
  const [completedPhases, setCompletedPhases] = useState<string[]>([]);
  const viewerRef = useRef<HTMLDivElement>(null);

  const theme = THEMES.find((t) => t.id === themeId) || THEMES[0];

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  const handleGenerate = async () => {
    if (!topic.trim()) return;
    setError("");
    setCurrentPhase("research");
    setCompletedPhases([]);
    setPhaseMessage("Gathering facts, quotes & real-world data…");
    setStage("loading");

    // Timed phase ticker aligned with real generation time
    const timers: ReturnType<typeof setTimeout>[] = [];
    const ticks = [
      { delay: 9000,  phase: "structuring", done: ["research"],                       msg: "Planning editorial flow & narrative…" },
      { delay: 18000, phase: "generating",  done: ["research", "structuring"],          msg: "Writing slide content from research…" },
      { delay: 28000, phase: "polishing",   done: ["research", "structuring", "generating"], msg: "Building the final presentation HTML…" },
    ];
    ticks.forEach(({ delay, phase, done, msg }) => {
      timers.push(setTimeout(() => {
        setCurrentPhase(phase);
        setCompletedPhases(done);
        setPhaseMessage(msg);
      }, delay));
    });

    try {
      const res = await fetch("/api/ppt/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, slideCount, themeId, audience, extraContext }),
      });

      timers.forEach(clearTimeout);
      const data = await res.json();

      if (!res.ok || !data.html) {
        setError(data.error || "Failed to generate. Please try again.");
        setStage("form");
        return;
      }

      setCompletedPhases(PHASES.map((p) => p.id));
      setPhaseMessage("Done! Opening your presentation…");
      setGeneratedHtml(data.html);

      setTimeout(() => setStage("viewer"), 500);
    } catch (err) {
      timers.forEach(clearTimeout);
      console.error("[ppt]", err);
      setError("Failed to connect. Please try again.");
      setStage("form");
    }
  };

  const handleExport = () => {
    const blob = new Blob([generatedHtml], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${topic.replace(/[^a-z0-9]/gi, "-").toLowerCase()}-presentation.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const enterFullscreen = () => viewerRef.current?.requestFullscreen?.();
  const exitFullscreen = () => document.exitFullscreen?.();

  // ── FORM ─────────────────────────────────────────────────────────────────
  if (stage === "form") {
    return (
      <div className="min-h-screen bg-transparent text-text-primary px-4 py-10 max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8 space-y-2">
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-xl bg-accent-primary/10 border border-accent-primary/20 flex items-center justify-center text-accent-primary">
              <Monitor className="size-4" />
            </div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-accent-primary font-bold">
              AI Presentation Studio
            </span>
          </div>
          <h1 className="text-3xl font-bold text-text-primary font-display">AI PPT Maker</h1>
          <p className="text-xs sm:text-sm text-text-muted max-w-lg leading-relaxed">
            Generate full-page editorial slide presentations with Space Grotesk typography, 
            scroll-snapping slides, and animated nav rail. Export as a standalone HTML file.
          </p>
        </div>

        <div className="space-y-6 bg-bg-surface border border-border-subtle p-6 sm:p-8 rounded-2xl shadow-lg">
          {/* Topic */}
          <div className="space-y-1.5">
            <label className="text-xs font-mono font-bold uppercase tracking-wider text-text-muted block">
              Topic <span className="text-destructive">*</span>
            </label>
            <textarea
              className="w-full bg-bg-base border border-border-subtle rounded-xl px-4 py-3 text-xs sm:text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary/40 transition-all resize-none font-sans leading-relaxed"
              rows={2}
              placeholder="e.g. The Future of AI in Healthcare, React Performance Patterns, Climate Change & Cities…"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              maxLength={500}
            />
            <p className="text-[10px] font-mono text-text-muted text-right">{topic.length}/500</p>
          </div>

          {/* Slide count */}
          <div className="space-y-2">
            <label className="text-xs font-mono font-bold uppercase tracking-wider text-text-muted block">
              Content Slides <span className="text-text-muted font-normal lowercase">(+ cover &amp; closing = total)</span>
            </label>
            <div className="flex gap-2">
              {[4, 6, 8, 10].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setSlideCount(n)}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                    slideCount === n
                      ? "bg-accent-primary/15 border-accent-primary text-text-primary font-bold shadow-sm"
                      : "bg-bg-elevated/60 border-border-subtle text-text-muted hover:border-border-default hover:text-text-primary"
                  }`}
                >
                  {n} <span className="text-[10px] opacity-60 font-mono">→{n + 2}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Audience */}
          <div className="space-y-2">
            <label className="text-xs font-mono font-bold uppercase tracking-wider text-text-muted block">
              Audience
            </label>
            <div className="flex gap-2">
              {(["student", "professional", "general"] as const).map((a) => (
                <button
                  key={a}
                  type="button"
                  onClick={() => setAudience(a)}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-semibold border capitalize transition-all cursor-pointer ${
                    audience === a
                      ? "bg-accent-primary/15 border-accent-primary text-text-primary font-bold shadow-sm"
                      : "bg-bg-elevated/60 border-border-subtle text-text-muted hover:border-border-default hover:text-text-primary"
                  }`}
                >
                  {a}
                </button>
              ))}
            </div>
          </div>

          {/* Theme */}
          <div className="space-y-2">
            <label className="text-xs font-mono font-bold uppercase tracking-wider text-text-muted block">
              Color Theme
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
              {THEMES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setThemeId(t.id)}
                  className={`relative overflow-hidden rounded-xl border p-3 text-left transition-all cursor-pointer ${
                    themeId === t.id
                      ? "border-accent-primary ring-1 ring-accent-primary/40 shadow-sm"
                      : "border-border-subtle hover:border-border-default"
                  }`}
                  style={{ background: t.preview }}
                >
                  <div
                    className="size-5 rounded-full mb-2 border-2"
                    style={{
                      background: t.dot,
                      borderColor: `${t.dot}50`,
                      boxShadow: `0 0 8px ${t.dot}50`,
                    }}
                  />
                  <p className="text-xs font-semibold" style={{ color: "#f8fafc" }}>
                    {t.label}
                  </p>
                  {themeId === t.id && (
                    <div
                      className="absolute top-1.5 right-1.5 size-4 rounded-full flex items-center justify-center"
                      style={{ background: t.dot }}
                    >
                      <span className="text-[8px] font-bold" style={{ color: t.bg }}>✓</span>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Extra context */}
          <div className="space-y-1.5">
            <label className="text-xs font-mono font-bold uppercase tracking-wider text-text-muted block">
              Extra Context <span className="text-text-muted font-normal lowercase">(optional)</span>
            </label>
            <input
              type="text"
              className="w-full bg-bg-base border border-border-subtle rounded-xl px-4 py-2.5 text-xs sm:text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary/40 transition-all font-sans"
              placeholder="e.g. Focus on India market, include Python code examples, beginner-friendly tone…"
              value={extraContext}
              onChange={(e) => setExtraContext(e.target.value)}
            />
          </div>

          {error && (
            <div className="flex items-start gap-2 bg-destructive/10 border border-destructive/30 rounded-xl px-4 py-3 text-xs text-destructive">
              {error}
            </div>
          )}

          <button
            type="button"
            disabled={!topic.trim()}
            onClick={handleGenerate}
            className="w-full py-3.5 btn-premium-primary rounded-xl font-bold text-xs sm:text-sm uppercase tracking-wider transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
          >
            <Sparkles className="size-4" />
            Generate Presentation
          </button>

          <p className="text-[10px] font-mono text-text-muted text-center">
            AI researches your topic first, then writes editorial slides and builds standalone HTML (~40-60s).
          </p>
        </div>
      </div>
    );
  }

  // ── LOADING ───────────────────────────────────────────────────────────────
  if (stage === "loading") {
    const activePhaseIdx = PHASES.findIndex((p) => p.id === currentPhase);
    return (
      <div className="min-h-screen bg-transparent flex flex-col items-center justify-center gap-6 px-4 py-10">
        <div className="text-center space-y-2">
          <div className="size-14 rounded-2xl bg-accent-primary/10 border border-accent-primary/20 flex items-center justify-center mx-auto shadow-sm text-accent-primary">
            <Sparkles className="size-6 animate-pulse" />
          </div>
          <h2 className="text-xl font-bold text-text-primary font-display">Building Your Presentation</h2>
          <p className="text-xs text-text-muted max-w-sm">
            AI is analyzing facts, structuring the narrative arc, and assembling the slide deck.
          </p>
        </div>

        {/* 4-phase tracker */}
        <div className="w-full max-w-md space-y-2.5">
          {PHASES.map((phase, idx) => {
            const isDone = completedPhases.includes(phase.id);
            const isActive = phase.id === currentPhase;
            return (
              <div
                key={phase.id}
                className={`flex items-center gap-3 rounded-xl px-4 py-3 border transition-all duration-300 ${
                  isActive
                    ? "bg-accent-primary/10 border-accent-primary/40 shadow-sm"
                    : isDone
                    ? "bg-success/10 border-success/30"
                    : "bg-bg-elevated/40 border-border-subtle"
                }`}
              >
                <div
                  className={`size-8 rounded-full flex items-center justify-center shrink-0 border transition-all duration-300 ${
                    isActive
                      ? "bg-accent-primary/20 border-accent-primary/50 text-accent-primary"
                      : isDone
                      ? "bg-success/20 border-success/40 text-success"
                      : "bg-bg-base border-border-subtle text-text-muted font-mono"
                  }`}
                >
                  {isDone ? (
                    <span className="text-success text-xs font-bold">✓</span>
                  ) : isActive ? (
                    <Loader2 className="size-3.5 animate-spin text-accent-primary" />
                  ) : (
                    <span className="text-[11px] font-mono">{idx + 1}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-xs sm:text-sm font-semibold transition-colors ${
                      isActive ? "text-accent-primary" : isDone ? "text-success" : "text-text-muted"
                    }`}
                  >
                    {phase.icon} {phase.label}
                  </p>
                  <p className="text-[11px] text-text-muted truncate">{phase.desc}</p>
                </div>
                {isActive && (
                  <div className="w-14 h-1.5 rounded-full overflow-hidden bg-accent-primary/20">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-accent-primary to-accent-secondary"
                      style={{
                        animation: "pptShimmer 1.4s ease-in-out infinite",
                        width: "60%",
                      }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <p className="text-xs font-mono text-text-muted text-center max-w-xs transition-all duration-500">
          {phaseMessage}
        </p>

        {/* Slide preview skeleton */}
        <div
          className="w-full max-w-xl rounded-2xl overflow-hidden border border-border-subtle shadow-2xl opacity-60"
          style={{ aspectRatio: "16/9" }}
        >
          <div
            style={{
              background: "linear-gradient(135deg,#0A0806 0%,#150F0B 100%)",
              height: "100%",
              padding: "40px 60px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              gap: "16px",
            }}
            className="animate-pulse"
          >
            <div style={{ width: "40px", height: "2px", background: "#F5B429", borderRadius: "2px" }} />
            <div style={{ width: "65%", height: "32px", background: "rgba(255,255,255,0.06)", borderRadius: "6px" }} />
            <div style={{ width: "80%", height: "16px", background: "rgba(255,255,255,0.04)", borderRadius: "4px" }} />
            <div style={{ width: "70%", height: "16px", background: "rgba(255,255,255,0.03)", borderRadius: "4px" }} />
            <div style={{ width: "55%", height: "16px", background: "rgba(255,255,255,0.02)", borderRadius: "4px" }} />
          </div>
        </div>

        {/* Progress dots */}
        <div className="flex gap-2">
          {[...Array(Math.min(slideCount + 2, 12))].map((_, i) => (
            <div
              key={i}
              className="h-1.5 rounded-full animate-pulse"
              style={{
                width: i === 0 ? "20px" : "6px",
                background: i <= activePhaseIdx * 2 ? "#F5B429" : "rgba(245,180,41,0.2)",
                animationDelay: `${i * 0.1}s`,
              }}
            />
          ))}
        </div>

        <style>{`
          @keyframes pptShimmer {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(300%); }
          }
        `}</style>
      </div>
    );
  }

  // ── VIEWER ────────────────────────────────────────────────────────────────
  return (
    <div ref={viewerRef} className="flex flex-col h-screen bg-black overflow-hidden">
      {/* Top bar */}
      {!isFullscreen && (
        <div className="shrink-0 flex items-center justify-between px-4 py-2.5 border-b border-border-subtle bg-bg-surface">
          <div className="flex items-center gap-3">
            <button
              onClick={() => { setStage("form"); setGeneratedHtml(""); }}
              className="flex items-center gap-1.5 text-xs text-text-muted hover:text-text-primary transition-colors cursor-pointer"
            >
              <RotateCcw className="size-3.5" />
              New
            </button>
            <span className="text-border-default text-xs">|</span>
            <p className="text-xs text-text-primary font-medium truncate max-w-[200px]">{topic}</p>
          </div>

          <div className="flex items-center gap-2">
            <span
              className="text-[10px] font-mono px-2 py-0.5 rounded-full border hidden sm:block font-bold"
              style={{
                color: theme.dot,
                borderColor: `${theme.dot}40`,
                background: `${theme.dot}15`,
              }}
            >
              {theme.label}
            </span>

            <span className="text-[10px] text-text-muted font-mono hidden sm:block">
              ↑↓ or scroll
            </span>

            <button
              onClick={handleExport}
              className="btn-premium-primary flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg cursor-pointer font-bold"
            >
              <Download className="size-3.5" />
              Export HTML
            </button>

            <button
              onClick={isFullscreen ? exitFullscreen : enterFullscreen}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-border-subtle bg-bg-elevated hover:bg-bg-card text-text-primary transition-colors cursor-pointer"
            >
              {isFullscreen ? (
                <><Minimize2 className="size-3.5" />Exit</>
              ) : (
                <><Maximize2 className="size-3.5" />Fullscreen</>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Iframe */}
      <iframe
        srcDoc={generatedHtml}
        sandbox="allow-scripts"
        className="flex-1 w-full border-none"
        title="Generated Presentation"
        style={{ display: "block" }}
      />
    </div>
  );
}
