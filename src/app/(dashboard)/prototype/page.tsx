"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Sparkles,
  BookOpen,
  Plus,
  Search,
  Settings,
  Save,
  Check,
  ChevronRight,
  User,
  Sliders,
  Cpu,
  Activity,
  Layers,
  ArrowRight,
  Code,
  Lock,
  Clock,
  Command,
  Keyboard,
  Info,
} from "lucide-react";

// Mock Note database for dashboard and search
const INITIAL_MOCK_NOTES = [
  {
    id: "note-1",
    title: "Quantum Neural Knowledge Graph Architecture",
    preview: "Synthesized notes on building high-density relational vectors using Claude context graphs. Requires deep Mongoose mapping...",
    updatedAt: "2026-07-07T20:30:00Z",
    tags: ["neural", "graph", "database"],
    wordCount: 420,
    readingTime: "2 min read",
    isPinned: true,
  },
  {
    id: "note-2",
    title: "Project Antigravity: UI Specification v2",
    preview: "High-fidelity mockups of obsidian Cyber-panels. Grid borders set to 0.5px with glowing keyframes. Accessibility AAA rating target.",
    updatedAt: "2026-07-07T18:45:00Z",
    tags: ["design", "antigravity", "spec"],
    wordCount: 850,
    readingTime: "4 min read",
    isPinned: true,
  },
  {
    id: "note-3",
    title: "Auth.js Credentials Adapter Setup Checklist",
    preview: "Steps to implement session validation gate for suspended accounts. Ensure User model is checked in JWT callbacks and sign-ins.",
    updatedAt: "2026-07-07T14:10:00Z",
    tags: ["auth", "security", "mongodb"],
    wordCount: 310,
    readingTime: "2 min read",
    isPinned: false,
  },
  {
    id: "note-4",
    title: "Academic Workspace Vector Embeddings",
    preview: "Comparing cosine similarity performance inside edge functions. Local vector cache using state vs remote database calls.",
    updatedAt: "2026-07-06T09:12:00Z",
    tags: ["math", "vector", "ai"],
    wordCount: 1250,
    readingTime: "6 min read",
    isPinned: false,
  },
];

export default function DesignPrototypePage() {
  // Navigation & System settings
  const [activeScreen, setActiveScreen] = useState<"onboarding" | "dashboard" | "editor" | "settings">("dashboard");
  const [accentTheme, setAccentTheme] = useState<"cyan" | "violet" | "amber">("cyan");
  const [panelView, setPanelView] = useState<"visuals" | "typography" | "micro">("visuals");
  
  // Onboarding Wizard states
  const [onboardingStep, setOnboardingStep] = useState(1);
  const [workspaceName, setWorkspaceName] = useState("Research Neural");
  const [productivityGoal, setProductivityGoal] = useState("speed");

  // Dashboard notes list states
  const [notes, setNotes] = useState(INITIAL_MOCK_NOTES);
  const [isGridView, setIsGridView] = useState(true);
  const [selectedNoteId, setSelectedNoteId] = useState("note-1");

  // Editor states
  const [editorTitle, setEditorTitle] = useState("Quantum Neural Knowledge Graph Architecture");
  const [editorTags, setEditorTags] = useState("neural, graph, database");
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [showHistory, setShowHistory] = useState(false);
  const [historyLogs, setHistoryLogs] = useState([
    { id: "h1", version: "v1.3", time: "Just now", action: "Autosaved snapshot" },
    { id: "h2", version: "v1.2", time: "2 hours ago", action: "Updated database tags" },
    { id: "h3", version: "v1.1", time: "5 hours ago", action: "Initial import" },
  ]);

  // Search Modal Command Palette states
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Settings states
  const [apiKey, setApiKey] = useState("sk-ant-••••••••••••••••••••••••");
  const [isMfaEnabled, setIsMfaEnabled] = useState(true);
  const [allowPublicBlogs, setAllowPublicBlogs] = useState(false);
  const [kbdShortcutMap, setKbdShortcutMap] = useState("qwerty");

  // Listen to keyboard shortcut to trigger search modal (Cmd/Ctrl + K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Autofocus search input when modal opens
  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
  }, [isSearchOpen]);

  // Handle note save simulation
  const handleSaveSimulation = () => {
    if (saveStatus !== "idle") return;
    setSaveStatus("saving");
    setTimeout(() => {
      setSaveStatus("saved");
      setHistoryLogs((prev) => [
        {
          id: String(Date.now()),
          version: `v1.${prev.length + 1}`,
          time: "Just now",
          action: "Manual save checkpoint",
        },
        ...prev,
      ]);
      setTimeout(() => setSaveStatus("idle"), 1500);
    }, 800);
  };

  // Get active accent colors mapping
  const getAccentColors = () => {
    switch (accentTheme) {
      case "violet":
        return {
          primary: "text-violet-400",
          border: "border-violet-500/30",
          bg: "bg-violet-500",
          bgMuted: "bg-violet-500/10",
          glow: "shadow-[0_0_15px_rgba(139,92,246,0.35)]",
          borderActive: "border-violet-400",
          accentLine: "from-violet-500 via-fuchsia-500 to-cyan-500",
        };
      case "amber":
        return {
          primary: "text-amber-400",
          border: "border-amber-500/30",
          bg: "bg-amber-500",
          bgMuted: "bg-amber-500/10",
          glow: "shadow-[0_0_15px_rgba(245,158,11,0.35)]",
          borderActive: "border-amber-400",
          accentLine: "from-amber-500 via-orange-500 to-rose-500",
        };
      case "cyan":
      default:
        return {
          primary: "text-cyan-400",
          border: "border-cyan-500/30",
          bg: "bg-cyan-500",
          bgMuted: "bg-cyan-500/10",
          glow: "shadow-[0_0_15px_rgba(6,182,212,0.35)]",
          borderActive: "border-cyan-400",
          accentLine: "from-cyan-400 via-indigo-500 to-violet-500",
        };
    }
  };

  const colors = getAccentColors();

  // Search filter
  const filteredNotes = notes.filter((n) =>
    n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    n.preview.toLowerCase().includes(searchQuery.toLowerCase()) ||
    n.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex overflow-hidden font-sans antialiased relative">
      
      {/* Load Space Grotesk & Plus Jakarta Sans dynamically */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
        
        /* Font configuration mapping */
        .font-space {
          font-family: 'Space Grotesk', system-ui, -apple-system, sans-serif;
        }
        .font-jakarta {
          font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
        }
        .font-jetbrains {
          font-family: 'JetBrains Mono', monospace;
        }

        /* Cyberpunk fine grid lines */
        .cyber-grid {
          background-size: 30px 30px;
          background-image: 
            linear-gradient(to right, rgba(255, 255, 255, 0.02) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255, 255, 255, 0.02) 1px, transparent 1px);
        }

        /* Scanline animation mockup */
        .scanline-pulse {
          position: relative;
          overflow: hidden;
        }
        .scanline-pulse::before {
          content: " ";
          display: block;
          position: absolute;
          top: 0; left: 0; bottom: 0; right: 0;
          background: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06));
          z-index: 2;
          background-size: 100% 2px, 3px 100%;
          pointer-events: none;
          opacity: 0.4;
        }

        /* Cybernetic laser slice corners */
        .cyber-panel-clip {
          clip-path: polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px));
        }

        /* Smooth scrollbar styling */
        .custom-scroll::-webkit-scrollbar {
          width: 5px;
          height: 5px;
        }
        .custom-scroll::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.2);
        }
        .custom-scroll::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 4px;
        }
        .custom-scroll::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }

        /* Keyframes for glow animations */
        @keyframes pulse-glow {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; filter: brightness(1.2); }
        }
        .neon-pulse {
          animation: pulse-glow 2s infinite ease-in-out;
        }
      `}</style>

      {/* Cybernetic Grid Overlay Background */}
      <div className="absolute inset-0 cyber-grid pointer-events-none opacity-60 z-0" />

      {/* LEFT DRAWER CONTROL SIDEBAR (Spec details viewer) */}
      <aside className="w-80 border-r border-neutral-900 bg-neutral-950/90 backdrop-blur-md z-10 flex flex-col justify-between select-none shrink-0 font-jakarta">
        <div>
          {/* Brand Spec Header */}
          <div className="h-16 px-6 border-b border-neutral-900 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-cyan-400 neon-pulse" />
              <span className="text-sm font-semibold tracking-wider font-space text-white">DESIGN SYSTEM SPEC</span>
            </div>
            <span className="text-[10px] bg-neutral-900 border border-neutral-800 text-neutral-400 px-2 py-0.5 rounded font-jetbrains">
              V1.0
            </span>
          </div>

          {/* Navigation for Spec Panels */}
          <div className="p-4 flex gap-1 border-b border-neutral-900 bg-neutral-900/10">
            <button
              onClick={() => setPanelView("visuals")}
              className={`flex-1 text-[11px] font-bold py-1.5 rounded transition-all ${
                panelView === "visuals" ? "bg-neutral-900 text-white border border-neutral-850" : "text-neutral-500 hover:text-neutral-300"
              }`}
            >
              Visuals
            </button>
            <button
              onClick={() => setPanelView("typography")}
              className={`flex-1 text-[11px] font-bold py-1.5 rounded transition-all ${
                panelView === "typography" ? "bg-neutral-900 text-white border border-neutral-850" : "text-neutral-500 hover:text-neutral-300"
              }`}
            >
              Typography
            </button>
            <button
              onClick={() => setPanelView("micro")}
              className={`flex-1 text-[11px] font-bold py-1.5 rounded transition-all ${
                panelView === "micro" ? "bg-neutral-900 text-white border border-neutral-850" : "text-neutral-500 hover:text-neutral-300"
              }`}
            >
              Interactions
            </button>
          </div>

          {/* Spec details scrollable body */}
          <div className="p-5 space-y-6 overflow-y-auto max-h-[calc(100vh-220px)] custom-scroll text-xs">
            {panelView === "visuals" && (
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-neutral-300 mb-2 font-space uppercase tracking-wider text-[11px]">Brand Personality</h4>
                  <p className="text-neutral-400 leading-relaxed">
                    <strong>Futuristic & Sharp</strong>: Tailored for power builders, AI researchers, and note-taking minimalists. It employs a low-luminance dark canvas, razor-thin panel separations, and contextual primary neon lights.
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold text-neutral-300 mb-2 font-space uppercase tracking-wider text-[11px]">Primary Color Accent Switcher</h4>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => setAccentTheme("cyan")}
                      className={`flex flex-col items-center gap-1.5 p-2 rounded-lg border bg-neutral-900/50 hover:bg-neutral-900 transition-all ${
                        accentTheme === "cyan" ? "border-cyan-400 bg-neutral-900" : "border-neutral-850"
                      }`}
                    >
                      <div className="h-4 w-4 rounded-full bg-cyan-400" />
                      <span className="text-[10px] text-neutral-400 font-jetbrains">Cyber Cyan</span>
                    </button>
                    <button
                      onClick={() => setAccentTheme("violet")}
                      className={`flex flex-col items-center gap-1.5 p-2 rounded-lg border bg-neutral-900/50 hover:bg-neutral-900 transition-all ${
                        accentTheme === "violet" ? "border-violet-500 bg-neutral-900" : "border-neutral-850"
                      }`}
                    >
                      <div className="h-4 w-4 rounded-full bg-violet-500" />
                      <span className="text-[10px] text-neutral-400 font-jetbrains">Neon Violet</span>
                    </button>
                    <button
                      onClick={() => setAccentTheme("amber")}
                      className={`flex flex-col items-center gap-1.5 p-2 rounded-lg border bg-neutral-900/50 hover:bg-neutral-900 transition-all ${
                        accentTheme === "amber" ? "border-amber-500 bg-neutral-900" : "border-neutral-850"
                      }`}
                    >
                      <div className="h-4 w-4 rounded-full bg-amber-500" />
                      <span className="text-[10px] text-neutral-400 font-jetbrains">Solar Amber</span>
                    </button>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-neutral-300 mb-2 font-space uppercase tracking-wider text-[11px]">Signature Element</h4>
                  <p className="text-neutral-400 leading-relaxed">
                    <strong>Cyber-Panel Corner Cuts</strong>. Elements feature an industrial <code>10px</code> corner bevel clip, bordered with a faint <code>0.5px</code> neon accent line, mirroring hardware telemetry boards.
                  </p>
                  <div className={`mt-2 h-14 bg-neutral-900 border border-neutral-800 p-3 rounded-lg flex items-center justify-between`}>
                    <div className="flex items-center gap-2">
                      <Layers className="h-4 w-4 text-neutral-500" />
                      <span className="font-semibold text-neutral-300 font-space text-[10px]">Cyber Container</span>
                    </div>
                    <div className={`h-2 w-2 rounded-full ${colors.bg} ${colors.glow}`} />
                  </div>
                </div>
              </div>
            )}

            {panelView === "typography" && (
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-neutral-300 mb-1 font-space uppercase tracking-wider text-[11px]">Heading Specimen</h4>
                  <p className="text-neutral-400 mb-2">Space Grotesk — Display Sans-Serif</p>
                  <div className="p-3 bg-neutral-900 rounded-lg border border-neutral-850 font-space text-base space-y-1">
                    <div className="font-bold text-white tracking-tight">H1: Space Neural</div>
                    <div className="font-medium text-neutral-300 text-sm">H2: Interface Dashboard</div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-neutral-300 mb-1 font-space uppercase tracking-wider text-[11px]">Body Text Specimen</h4>
                  <p className="text-neutral-400 mb-2">Plus Jakarta Sans — High-Legibility Sans</p>
                  <div className="p-3 bg-neutral-900 rounded-lg border border-neutral-850 font-jakarta text-xs space-y-1.5 text-neutral-300 leading-relaxed">
                    <p className="font-semibold">SemiBold Body Header</p>
                    <p>Medium body size, designed specifically for heavy reading comfort. Word rendering utilizes optimized kerning and standard line spacing at 1.6x.</p>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-neutral-300 mb-1 font-space uppercase tracking-wider text-[11px]">Code Specimen</h4>
                  <p className="text-neutral-400 mb-2">JetBrains Mono — Telemetry Data</p>
                  <div className="p-3 bg-neutral-900 rounded-lg border border-neutral-850 font-jetbrains text-[10px] text-emerald-400 leading-tight">
                    <code>
                      const data = await db.User.findById(id);<br />
                      if (data.isSuspended) return redirect(&apos;/login&apos;);
                    </code>
                  </div>
                </div>
              </div>
            )}

            {panelView === "micro" && (
              <div className="space-y-4 font-jakarta">
                <div>
                  <h4 className="font-semibold text-neutral-300 mb-2 font-space uppercase tracking-wider text-[11px]">Micro-Interactions spec</h4>
                  <ul className="space-y-2 text-neutral-400 leading-relaxed list-disc pl-4">
                    <li><strong>Command Palette:</strong> Instantly invoke globally using <kbd className="bg-neutral-800 px-1 py-0.5 rounded font-jetbrains text-[10px] text-neutral-300">Cmd + K</kbd> to query notes database.</li>
                    <li><strong>Interactive Save Checkpoints:</strong> Pulsing glowing neon dots in the toolbar indicating autosave action states. Try it out on the Editor Screen!</li>
                    <li><strong>Hover Acceleration:</strong> Hovering cards triggers kinetic 3D scaling transformations, color shifts, and precise shadow outlines.</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-neutral-300 mb-2 font-space uppercase tracking-wider text-[11px]">Accessibility Standards</h4>
                  <div className="grid grid-cols-2 gap-2 text-center text-[10px] font-bold">
                    <div className="p-2 border border-emerald-500/20 bg-emerald-500/5 text-emerald-400 rounded-lg">
                      Contrast Ratio<br />7.2:1 (AAA)
                    </div>
                    <div className="p-2 border border-emerald-500/20 bg-emerald-500/5 text-emerald-400 rounded-lg">
                      Keyboard Accessible
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Prototype Navigation controls */}
        <div className="p-4 border-t border-neutral-900 bg-neutral-950">
          <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest block mb-3 font-space">ACTIVE SCREEN VIEW</span>
          <div className="grid grid-cols-2 gap-1.5">
            <button
              onClick={() => {
                setActiveScreen("onboarding");
                setOnboardingStep(1);
              }}
              className={`py-2 px-3 text-[11px] font-bold rounded-lg border transition-all flex items-center gap-1.5 font-space ${
                activeScreen === "onboarding"
                  ? `${colors.borderActive} ${colors.bgMuted} text-white`
                  : "border-neutral-850 hover:border-neutral-700 bg-neutral-900/40 text-neutral-400 hover:text-white"
              }`}
            >
              <Cpu className="h-3 w-3" /> Onboarding
            </button>
            <button
              onClick={() => setActiveScreen("dashboard")}
              className={`py-2 px-3 text-[11px] font-bold rounded-lg border transition-all flex items-center gap-1.5 font-space ${
                activeScreen === "dashboard"
                  ? `${colors.borderActive} ${colors.bgMuted} text-white`
                  : "border-neutral-850 hover:border-neutral-700 bg-neutral-900/40 text-neutral-400 hover:text-white"
              }`}
            >
              <Activity className="h-3 w-3" /> Dashboard
            </button>
            <button
              onClick={() => setActiveScreen("editor")}
              className={`py-2 px-3 text-[11px] font-bold rounded-lg border transition-all flex items-center gap-1.5 font-space ${
                activeScreen === "editor"
                  ? `${colors.borderActive} ${colors.bgMuted} text-white`
                  : "border-neutral-850 hover:border-neutral-700 bg-neutral-900/40 text-neutral-400 hover:text-white"
              }`}
            >
              <Save className="h-3 w-3" /> Note Editor
            </button>
            <button
              onClick={() => setActiveScreen("settings")}
              className={`py-2 px-3 text-[11px] font-bold rounded-lg border transition-all flex items-center gap-1.5 font-space ${
                activeScreen === "settings"
                  ? `${colors.borderActive} ${colors.bgMuted} text-white`
                  : "border-neutral-850 hover:border-neutral-700 bg-neutral-900/40 text-neutral-400 hover:text-white"
              }`}
            >
              <Settings className="h-3 w-3" /> Settings
            </button>
          </div>

          <div className="mt-4 pt-4 border-t border-neutral-900/80 flex items-center justify-between text-[11px] text-neutral-500">
            <div className="flex items-center gap-1.5">
              <Command className="h-3 w-3" />
              <span>Press <kbd className="bg-neutral-900 border border-neutral-800 text-[9px] px-1 py-0.2 rounded font-jetbrains">⌘ K</kbd> anywhere</span>
            </div>
            <button
              onClick={() => setIsSearchOpen(true)}
              className="text-cyan-400 hover:underline flex items-center gap-0.5 font-space"
            >
              Search <Search className="h-3 w-3 inline" />
            </button>
          </div>
        </div>
      </aside>

      {/* CENTRAL PROTOTYPE WORKSPACE VIEW */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden z-10 scanline-pulse">
        
        {/* UPPER STATUS BAR / TELEMETRY */}
        <header className="h-16 px-8 border-b border-neutral-900 bg-neutral-950/60 backdrop-blur-md flex items-center justify-between shrink-0 select-none">
          <div className="flex items-center gap-6">
            {/* Project title */}
            <div className="flex items-center gap-2">
              <span className={`text-sm font-extrabold tracking-widest font-space bg-gradient-to-r ${colors.accentLine} bg-clip-text text-transparent`}>
                NOTEXIA
              </span>
              <span className="text-[9px] bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-1.5 py-0.5 rounded font-jetbrains">
                PROTOTYPE v1
              </span>
            </div>

            <div className="hidden md:flex items-center gap-2 text-[10px] font-jetbrains text-neutral-500 border-l border-neutral-850 pl-6">
              <span className="flex h-1.5 w-1.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
              </span>
              <span>NODE STATUS: SECURE</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Quick stats indicator */}
            <div className="hidden lg:flex items-center gap-4 text-[10px] font-jetbrains text-neutral-500 bg-neutral-900/40 border border-neutral-850 px-3.5 py-1.5 rounded-lg">
              <div>MEM: <span className="text-neutral-300">42%</span></div>
              <div className="h-3 w-[1px] bg-neutral-800" />
              <div>WORKSPACE: <span className={colors.primary}>{workspaceName || "Default"}</span></div>
            </div>

            {/* Simulated User widget */}
            <div className="flex items-center gap-2 bg-neutral-900/60 border border-neutral-850 py-1.5 px-3 rounded-lg">
              <div className="h-5 w-5 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center">
                <User className="h-3 w-3 text-neutral-400" />
              </div>
              <span className="text-[11px] font-medium font-jakarta text-neutral-300">Scholar User</span>
            </div>
          </div>
        </header>

        {/* ACTIVE SCREEN RENDER CONTAINER */}
        <div className="flex-1 overflow-hidden relative flex flex-col bg-neutral-950">
          
          {/* ==================== 1. ONBOARDING SCREEN ==================== */}
          {activeScreen === "onboarding" && (
            <div className="flex-1 flex flex-col items-center justify-center p-8 overflow-y-auto font-jakarta">
              <div className="max-w-md w-full bg-neutral-900/40 border border-neutral-900 rounded-2xl p-8 shadow-2xl relative cyber-panel-clip">
                
                {/* Accent glow background detail */}
                <div className={`absolute top-0 right-0 w-64 h-64 ${colors.bgMuted} rounded-full blur-[100px] pointer-events-none`} />

                {/* Onboarding Wizard Header */}
                <div className="mb-8 flex items-center justify-between select-none">
                  <div className="flex items-center gap-1.5">
                    <Cpu className={`h-4 w-4 ${colors.primary}`} />
                    <span className="text-[10px] font-bold text-neutral-400 font-space uppercase tracking-widest">Workspace Init Wizard</span>
                  </div>
                  <span className="text-xs font-semibold text-neutral-500 font-jetbrains">
                    Step {onboardingStep} of 3
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full h-1 bg-neutral-850 rounded-full mb-8 relative overflow-hidden select-none">
                  <div
                    className={`h-full ${colors.bg} rounded-full transition-all duration-500`}
                    style={{ width: `${(onboardingStep / 3) * 100}%` }}
                  />
                </div>

                {/* Step contents */}
                {onboardingStep === 1 && (
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <h2 className="text-xl font-bold font-space text-white tracking-tight">Configure Cybernet-Node</h2>
                      <p className="text-xs text-neutral-400 leading-relaxed font-jakarta">
                        Initialize your Notexia terminal workspace name and default telemetry context key.
                      </p>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-neutral-400 uppercase font-space tracking-wider">Node / Workspace Title</label>
                        <input
                          type="text"
                          value={workspaceName}
                          onChange={(e) => setWorkspaceName(e.target.value)}
                          className="w-full bg-neutral-950/80 border border-neutral-850 focus:border-cyan-400 rounded-xl px-4 py-2.5 text-xs text-white placeholder-neutral-750 font-jetbrains outline-none transition-all"
                          placeholder="e.g. Research Core"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-neutral-400 uppercase font-space tracking-wider">Workspace focus preference</label>
                        <div className="grid grid-cols-2 gap-3 font-jakarta">
                          <button
                            onClick={() => setProductivityGoal("speed")}
                            className={`p-3 text-left rounded-xl border transition-all ${
                              productivityGoal === "speed"
                                ? `${colors.borderActive} bg-neutral-950`
                                : "border-neutral-850 hover:border-neutral-800 bg-neutral-900/10"
                            }`}
                          >
                            <span className="block text-xs font-bold text-white mb-0.5">Quantum Speed</span>
                            <span className="block text-[9px] text-neutral-500 leading-normal">Fast notes & stream-first Claude answers.</span>
                          </button>
                          <button
                            onClick={() => setProductivityGoal("deep")}
                            className={`p-3 text-left rounded-xl border transition-all ${
                              productivityGoal === "deep"
                                ? `${colors.borderActive} bg-neutral-950`
                                : "border-neutral-850 hover:border-neutral-800 bg-neutral-900/10"
                            }`}
                          >
                            <span className="block text-xs font-bold text-white mb-0.5">Deep Synthesis</span>
                            <span className="block text-[9px] text-neutral-500 leading-normal">Context mapping, graph structures, databases.</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {onboardingStep === 2 && (
                  <div className="space-y-6">
                    <div className="space-y-2 font-jakarta">
                      <h2 className="text-xl font-bold font-space text-white tracking-tight">Select Workspace Neon Accent</h2>
                      <p className="text-xs text-neutral-400 leading-relaxed">
                        Customize the visual frequency of your productivity command center layout.
                      </p>
                    </div>

                    <div className="space-y-3 font-jakarta">
                      <button
                        onClick={() => setAccentTheme("cyan")}
                        className={`w-full p-4 rounded-xl border flex items-center justify-between transition-all ${
                          accentTheme === "cyan" ? "border-cyan-400 bg-neutral-950" : "border-neutral-850 hover:border-neutral-800"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-5 w-5 rounded-full bg-cyan-400 flex items-center justify-center text-[10px] text-black font-bold">✓</div>
                          <div className="text-left">
                            <span className="block text-xs font-bold text-white">Cyber Cyan Accent</span>
                            <span className="block text-[9px] text-neutral-500 font-jetbrains">#06b6d4 - Hyper-contrast & bright</span>
                          </div>
                        </div>
                        <span className="h-2 w-2 rounded-full bg-cyan-400 neon-pulse" />
                      </button>

                      <button
                        onClick={() => setAccentTheme("violet")}
                        className={`w-full p-4 rounded-xl border flex items-center justify-between transition-all ${
                          accentTheme === "violet" ? "border-violet-500 bg-neutral-950" : "border-neutral-850 hover:border-neutral-800"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-5 w-5 rounded-full bg-violet-500 flex items-center justify-center text-[10px] text-white font-bold">✓</div>
                          <div className="text-left">
                            <span className="block text-xs font-bold text-white">Neon Violet Accent</span>
                            <span className="block text-[9px] text-neutral-500 font-jetbrains">#8b5cf6 - Cool & atmospheric</span>
                          </div>
                        </div>
                        <span className="h-2 w-2 rounded-full bg-violet-500 neon-pulse" />
                      </button>

                      <button
                        onClick={() => setAccentTheme("amber")}
                        className={`w-full p-4 rounded-xl border flex items-center justify-between transition-all ${
                          accentTheme === "amber" ? "border-amber-500 bg-neutral-950" : "border-neutral-850 hover:border-neutral-800"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-5 w-5 rounded-full bg-amber-500 flex items-center justify-center text-[10px] text-black font-bold">✓</div>
                          <div className="text-left">
                            <span className="block text-xs font-bold text-white">Solar Amber Accent</span>
                            <span className="block text-[9px] text-neutral-500 font-jetbrains">#f59e0b - Warm & high-alert energy</span>
                          </div>
                        </div>
                        <span className="h-2 w-2 rounded-full bg-amber-500 neon-pulse" />
                      </button>
                    </div>
                  </div>
                )}

                {onboardingStep === 3 && (
                  <div className="space-y-6">
                    <div className="space-y-2 text-center py-4 font-jakarta">
                      <div className={`h-12 w-12 rounded-full ${colors.bgMuted} border border-dashed ${colors.border} mx-auto flex items-center justify-center mb-4`}>
                        <Sparkles className={`h-6 w-6 ${colors.primary} animate-spin-slow`} />
                      </div>
                      <h2 className="text-xl font-bold font-space text-white tracking-tight">Telemetry Node Active</h2>
                      <p className="text-xs text-neutral-400 leading-relaxed max-w-sm mx-auto mt-2">
                        Your workspace <strong>{workspaceName}</strong> is initialized. Theme is configured to <strong>{accentTheme.toUpperCase()}</strong>.
                      </p>
                    </div>

                    <div className="bg-neutral-950/60 border border-neutral-850 p-4 rounded-xl space-y-2 font-jetbrains text-[10px] text-neutral-400">
                      <div className="flex justify-between">
                        <span>WORKSPACE TITLE:</span>
                        <span className="text-white">{workspaceName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>VISUAL FREQUENCY:</span>
                        <span className={colors.primary}>{accentTheme.toUpperCase()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>FOCUS PREFERENCE:</span>
                        <span className="text-white">{productivityGoal.toUpperCase()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>INTEGRATED SYSTEM:</span>
                        <span className="text-emerald-400">ONLINE (WCAG AAA)</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Navigation Buttons footer */}
                <div className="mt-8 flex justify-between gap-4 select-none">
                  {onboardingStep > 1 ? (
                    <button
                      onClick={() => setOnboardingStep((s) => s - 1)}
                      className="px-4 py-2 border border-neutral-800 hover:border-neutral-700 rounded-xl text-xs text-neutral-400 hover:text-white transition-all font-space"
                    >
                      Back
                    </button>
                  ) : (
                    <div />
                  )}

                  {onboardingStep < 3 ? (
                    <button
                      onClick={() => setOnboardingStep((s) => s + 1)}
                      className={`px-5 py-2 ${colors.bg} hover:brightness-110 text-neutral-950 font-bold rounded-xl text-xs flex items-center gap-1 transition-all ${colors.glow} font-space`}
                    >
                      Continue <ArrowRight className="h-3 w-3" />
                    </button>
                  ) : (
                    <button
                      onClick={() => setActiveScreen("dashboard")}
                      className={`px-5 py-2 ${colors.bg} hover:brightness-110 text-neutral-950 font-bold rounded-xl text-xs flex items-center gap-1 transition-all ${colors.glow} font-space`}
                    >
                      Enter Workspace <Check className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

              </div>
            </div>
          )}

          {/* ==================== 2. HOME / DASHBOARD SCREEN ==================== */}
          {activeScreen === "dashboard" && (
            <div className="flex-1 flex flex-col h-full overflow-y-auto p-8 font-jakarta">
              <div className="max-w-5xl w-full mx-auto space-y-8 pb-12">
                
                {/* Dashboard Summary Welcome Widget */}
                <div className="border border-neutral-900 bg-neutral-900/10 p-6 rounded-2xl relative overflow-hidden select-none">
                  <div className={`absolute top-0 right-0 w-[450px] h-[150px] ${colors.bgMuted} rounded-full blur-[80px] pointer-events-none`} />
                  <div className="space-y-1 relative z-10">
                    <h2 className="text-xl font-bold font-space text-white tracking-tight">
                      System Workspace overview: {workspaceName || "Default Center"}
                    </h2>
                    <p className="text-neutral-500 text-xs font-jakarta">
                      Your high-performance academic synthesis cockpit. Quick search database or manage notes via the console tree.
                    </p>
                  </div>
                </div>

                {/* Modern Telemetry metrics grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 select-none">
                  <div className="bg-neutral-900/10 border border-neutral-900 p-4 rounded-xl flex items-center justify-between shadow-lg relative group">
                    <div className="absolute inset-0 border border-neutral-500/0 group-hover:border-cyan-400/20 rounded-xl transition-all" />
                    <div className="space-y-1">
                      <span className="text-[9px] font-bold text-neutral-500 uppercase tracking-widest font-space">Workspace Notes</span>
                      <h3 className="text-xl font-bold font-space text-white">{notes.length}</h3>
                    </div>
                    <BookOpen className="h-5 w-5 text-neutral-600 group-hover:text-cyan-400 transition-colors" />
                  </div>

                  <div className="bg-neutral-900/10 border border-neutral-900 p-4 rounded-xl flex items-center justify-between shadow-lg relative group">
                    <div className="absolute inset-0 border border-neutral-500/0 group-hover:border-violet-500/20 rounded-xl transition-all" />
                    <div className="space-y-1">
                      <span className="text-[9px] font-bold text-neutral-500 uppercase tracking-widest font-space">Pinned Items</span>
                      <h3 className="text-xl font-bold font-space text-white">
                        {notes.filter((n) => n.isPinned).length}
                      </h3>
                    </div>
                    <Sliders className="h-5 w-5 text-neutral-600 group-hover:text-violet-400 transition-colors" />
                  </div>

                  <div className="bg-neutral-900/10 border border-neutral-900 p-4 rounded-xl flex items-center justify-between shadow-lg relative group">
                    <div className="absolute inset-0 border border-neutral-500/0 group-hover:border-amber-500/20 rounded-xl transition-all" />
                    <div className="space-y-1">
                      <span className="text-[9px] font-bold text-neutral-500 uppercase tracking-widest font-space">Active Tickets</span>
                      <h3 className="text-xl font-bold font-space text-white">2</h3>
                    </div>
                    <Activity className="h-5 w-5 text-neutral-600 group-hover:text-amber-400 transition-colors" />
                  </div>

                  <div className="bg-neutral-900/10 border border-neutral-900 p-4 rounded-xl flex items-center justify-between shadow-lg relative group">
                    <div className="absolute inset-0 border border-neutral-500/0 group-hover:border-cyan-400/20 rounded-xl transition-all" />
                    <div className="space-y-1">
                      <span className="text-[9px] font-bold text-neutral-500 uppercase tracking-widest font-space">Node Security</span>
                      <h3 className="text-xl font-bold font-space text-emerald-400">AAA</h3>
                    </div>
                    <Cpu className="h-5 w-5 text-emerald-500/40 group-hover:text-emerald-400 transition-colors" />
                  </div>
                </div>

                {/* Search trigger bar & view layout toggle */}
                <div className="flex items-center justify-between gap-4 border-b border-neutral-900 pb-4 select-none">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setIsSearchOpen(true)}
                      className="bg-neutral-900/40 hover:bg-neutral-900 border border-neutral-850 hover:border-neutral-700 py-1.5 px-4 rounded-lg text-xs text-neutral-400 flex items-center gap-2 transition-all font-jakarta outline-none"
                    >
                      <Search className="h-3.5 w-3.5 text-neutral-500" />
                      <span>Search or commands...</span>
                      <kbd className="bg-neutral-950 border border-neutral-800 text-[9px] px-1 py-0.2 rounded font-jetbrains">⌘ K</kbd>
                    </button>

                    <button
                      onClick={() => {
                        // Quick note creation simulator
                        const newNote = {
                          id: `note-${Date.now()}`,
                          title: "Untitled Synced Workspace Notes",
                          preview: "Writing down raw thoughts. Connected via Claude context streams.",
                          updatedAt: new Date().toISOString(),
                          tags: ["draft"],
                          wordCount: 12,
                          readingTime: "1 min read",
                          isPinned: false,
                        };
                        setNotes((prev) => [newNote, ...prev]);
                        setSelectedNoteId(newNote.id);
                        setEditorTitle(newNote.title);
                        setEditorTags("draft");
                        setActiveScreen("editor");
                      }}
                      className={`h-8 px-3 rounded-lg border border-dashed border-neutral-805 hover:border-neutral-700 hover:bg-neutral-900 text-xs flex items-center gap-1.5 text-neutral-300 hover:text-white transition-all`}
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>New Note</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setIsGridView(true)}
                      className={`h-8 px-3 rounded-lg border text-xs font-bold font-space transition-all ${
                        isGridView ? "border-neutral-700 bg-neutral-900 text-white" : "border-neutral-850 text-neutral-500 hover:text-neutral-300"
                      }`}
                    >
                      Grid
                    </button>
                    <button
                      onClick={() => setIsGridView(false)}
                      className={`h-8 px-3 rounded-lg border text-xs font-bold font-space transition-all ${
                        !isGridView ? "border-neutral-700 bg-neutral-900 text-white" : "border-neutral-850 text-neutral-500 hover:text-neutral-300"
                      }`}
                    >
                      List
                    </button>
                  </div>
                </div>

                {/* Notes List / Grid Render */}
                {isGridView ? (
                  /* GRID VIEW */
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {notes.map((note) => (
                      <div
                        key={note.id}
                        onClick={() => {
                          setSelectedNoteId(note.id);
                          setEditorTitle(note.title);
                          setEditorTags(note.tags.join(", "));
                          setActiveScreen("editor");
                        }}
                        className={`cursor-pointer group relative p-5 bg-neutral-900/10 hover:bg-neutral-900/30 border rounded-xl flex flex-col justify-between h-44 transition-all duration-300 hover:scale-[1.01] ${
                          selectedNoteId === note.id ? `${colors.borderActive} ${colors.bgMuted}` : "border-neutral-900/80"
                        }`}
                      >
                        {/* Pinned star glow corner banner */}
                        {note.isPinned && (
                          <div className={`absolute top-0 right-0 bg-neutral-900 border-b border-l border-neutral-850 px-2 py-0.5 rounded-tr-xl rounded-bl-xl text-[8px] font-extrabold ${colors.primary} uppercase tracking-wider font-space`}>
                            PINNED
                          </div>
                        )}

                        <div className="space-y-2">
                          <h4 className="text-xs font-bold text-white group-hover:text-white line-clamp-1 font-space tracking-tight transition-colors">
                            {note.title}
                          </h4>
                          <p className="text-[11px] text-neutral-400 line-clamp-3 leading-relaxed">
                            {note.preview}
                          </p>
                        </div>

                        <div className="flex items-center justify-between select-none pt-4 border-t border-neutral-900/40">
                          {/* Tags */}
                          <div className="flex gap-1 overflow-hidden">
                            {note.tags.slice(0, 2).map((tag) => (
                              <span key={tag} className="text-[9px] bg-neutral-900/80 border border-neutral-850 text-neutral-400 px-1.5 py-0.2 rounded font-jetbrains">
                                #{tag}
                              </span>
                            ))}
                          </div>

                          <span className="text-[9px] text-neutral-500 font-jetbrains">
                            {new Date(note.updatedAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  /* LIST VIEW */
                  <div className="space-y-3">
                    {notes.map((note) => (
                      <div
                        key={note.id}
                        onClick={() => {
                          setSelectedNoteId(note.id);
                          setEditorTitle(note.title);
                          setEditorTags(note.tags.join(", "));
                          setActiveScreen("editor");
                        }}
                        className={`cursor-pointer group relative p-4 bg-neutral-900/10 hover:bg-neutral-900/30 border rounded-xl flex items-center justify-between transition-all duration-300 hover:-translate-y-0.5 ${
                          selectedNoteId === note.id ? `${colors.borderActive} ${colors.bgMuted}` : "border-neutral-900/80"
                        }`}
                      >
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                          {/* Pin indication circle */}
                          <div className={`h-2 w-2 rounded-full ${note.isPinned ? colors.bg : "bg-neutral-700"} shrink-0`} />
                          
                          <div className="flex-1 min-w-0">
                            <h4 className="text-xs font-bold text-white group-hover:text-white truncate font-space">
                              {note.title}
                            </h4>
                            <p className="text-[11px] text-neutral-400 truncate mt-0.5 max-w-2xl">
                              {note.preview}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-6 shrink-0 select-none ml-4">
                          {/* Tags */}
                          <div className="hidden sm:flex gap-1">
                            {note.tags.map((tag) => (
                              <span key={tag} className="text-[9px] bg-neutral-900 border border-neutral-850 text-neutral-400 px-1.5 py-0.2 rounded font-jetbrains">
                                {tag}
                              </span>
                            ))}
                          </div>

                          <div className="text-right text-[9px] font-jetbrains text-neutral-500">
                            <span>{new Date(note.updatedAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ==================== 3. NOTE EDITOR SCREEN ==================== */}
          {activeScreen === "editor" && (
            <div className="flex-1 flex h-full overflow-hidden font-jakarta">
              {/* Left Main Writing Panel */}
              <div className="flex-1 flex flex-col h-full overflow-hidden bg-neutral-950">
                {/* Editor Header Status toolbar */}
                <div className="h-14 border-b border-neutral-900 bg-neutral-950 px-6 flex items-center justify-between shrink-0 select-none font-space">
                  <div className="flex items-center gap-4 text-[10px] text-neutral-400">
                    <span className="font-bold text-white truncate max-w-[200px]">{editorTitle || "Untitled Note"}</span>
                    <div className="w-[1px] h-3 bg-neutral-800" />
                    <span>324 words</span>
                    <span>2 min read</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Simulated Autosave Status dot */}
                    <div className="flex items-center gap-1.5 text-[10px] text-neutral-500 font-jetbrains mr-2">
                      <div className={`h-1.5 w-1.5 rounded-full ${
                        saveStatus === "saving" ? "bg-amber-400 animate-pulse" :
                        saveStatus === "saved" ? "bg-emerald-400" :
                        "bg-neutral-600"
                      }`} />
                      <span>{
                        saveStatus === "saving" ? "SNAPSHOT SYNCING..." :
                        saveStatus === "saved" ? "SNAPSHOT SECURED" :
                        "CHANGES SAVED"
                      }</span>
                    </div>

                    <button
                      onClick={handleSaveSimulation}
                      className="h-8 px-3 rounded-lg border border-neutral-800 hover:border-neutral-700 bg-neutral-900/40 text-neutral-300 hover:text-white text-[11px] flex items-center gap-1.5 transition-all outline-none"
                    >
                      <Save className="h-3.5 w-3.5" />
                      <span>Take Snapshot</span>
                    </button>

                    <button
                      onClick={() => setShowHistory((prev) => !prev)}
                      className={`h-8 px-3 rounded-lg border text-[11px] flex items-center gap-1.5 transition-all outline-none ${
                        showHistory
                          ? `${colors.borderActive} ${colors.bgMuted} text-white`
                          : "border-neutral-850 hover:border-neutral-700 bg-neutral-900/40 text-neutral-400 hover:text-white"
                      }`}
                    >
                      <Clock className="h-3.5 w-3.5" />
                      <span>Versions</span>
                    </button>
                  </div>
                </div>

                {/* Editor Content Area */}
                <div className="flex-1 overflow-y-auto p-8 max-w-3xl w-full mx-auto space-y-6 custom-scroll">
                  {/* Category, tags, cover image container mockup */}
                  <div className="space-y-4 border-b border-neutral-900 pb-6 select-none text-xs">
                    
                    {/* High-tech Cover Image Selector Mockup */}
                    <div className="h-28 bg-neutral-900/30 border border-neutral-900 border-dashed rounded-xl flex flex-col items-center justify-center text-neutral-500 relative group overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/80 to-transparent pointer-events-none" />
                      <div className="z-10 text-center space-y-1">
                        <Activity className="h-5 w-5 mx-auto text-neutral-600 group-hover:text-cyan-400 transition-colors" />
                        <span className="block font-space text-[10px] uppercase tracking-wider text-neutral-400 group-hover:text-white transition-colors">SET WORKSPACE CONTEXT COVER</span>
                        <span className="block text-[8px] text-neutral-600">Supports PNG, WEBP (Max 2MB)</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest font-space">Workspace Category</span>
                        <select className="w-full bg-neutral-950 border border-neutral-855 rounded-lg px-3 py-1.5 text-neutral-300 font-jakarta outline-none">
                          <option>Neural Research</option>
                          <option>Academic Theses</option>
                          <option>Private Archives</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest font-space">Tags (comma separated)</span>
                        <input
                          type="text"
                          value={editorTags}
                          onChange={(e) => setEditorTags(e.target.value)}
                          className="w-full bg-neutral-950 border border-neutral-855 rounded-lg px-3 py-1.5 text-neutral-300 font-jetbrains text-[11px] outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Title editor */}
                  <input
                    type="text"
                    value={editorTitle}
                    onChange={(e) => setEditorTitle(e.target.value)}
                    className="w-full bg-transparent text-2xl font-bold font-space text-white outline-none border-b border-transparent focus:border-neutral-905 pb-2"
                    placeholder="Enter Title..."
                  />

                  {/* Formatting toolbar Mockup */}
                  <div className="bg-neutral-900/60 border border-neutral-855 p-1.5 rounded-lg flex items-center gap-1 text-neutral-400 select-none">
                    <button className="h-7 w-7 rounded hover:bg-neutral-800 hover:text-white text-xs font-bold font-space">H1</button>
                    <button className="h-7 w-7 rounded hover:bg-neutral-800 hover:text-white text-xs font-bold font-space">H2</button>
                    <div className="w-[1px] h-4 bg-neutral-800" />
                    <button className="h-7 w-7 rounded hover:bg-neutral-800 hover:text-white font-serif font-bold text-sm">B</button>
                    <button className="h-7 w-7 rounded hover:bg-neutral-800 hover:text-white font-serif italic text-sm">I</button>
                    <button className="h-7 w-7 rounded hover:bg-neutral-800 hover:text-white font-serif underline text-sm">U</button>
                    <div className="w-[1px] h-4 bg-neutral-805" />
                    <button className="h-7 w-7 rounded hover:bg-neutral-800 hover:text-white text-xs flex items-center justify-center"><Code className="h-3.5 w-3.5" /></button>
                    <button className="h-7 w-7 rounded hover:bg-neutral-800 hover:text-white text-xs flex items-center justify-center font-jetbrains">{}</button>
                  </div>

                  {/* Prose editor mockup */}
                  <div className="space-y-4 text-neutral-300 text-sm leading-relaxed font-jakarta">
                    <p className="border-l-2 border-neutral-700 pl-4 italic text-neutral-400 bg-neutral-900/10 py-1">
                      This page serves as a high-fidelity design prototype demonstrating Notexia&apos;s interactive capabilities. Real-time updates occur via standard Next.js components matching the workspace store.
                    </p>
                    
                    <h3 className="text-base font-bold text-white font-space mt-6">1. Cybernetic Obsidian UI Structure</h3>
                    <p>
                      The interface design uses zero-glare, dark elements combined with electric cyan accents. Our layouts prioritize structural data representation over standard SaaS illustrations.
                    </p>

                    <pre className="bg-neutral-950 border border-neutral-900 p-4 rounded-xl font-jetbrains text-xs text-emerald-400 overflow-x-auto select-all">
{`// Simulated Mongoose cascading hook configuration
noteSchema.pre("deleteOne", { document: true, query: false }, async function(next) {
  await mongoose.model("Comment").deleteMany({ noteId: this._id });
  next();
});`}
                    </pre>
                  </div>
                </div>
              </div>

              {/* Right Side Versions History sidebar */}
              {showHistory && (
                <aside className="w-72 border-l border-neutral-900 bg-neutral-950 flex flex-col shrink-0 h-full overflow-hidden select-none font-space animate-fade-in">
                  <div className="h-14 border-b border-neutral-900 px-6 flex items-center bg-neutral-900/10 shrink-0">
                    <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">
                      Telemetry History (Snapshots)
                    </span>
                  </div>

                  <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scroll">
                    {historyLogs.map((log) => (
                      <div
                        key={log.id}
                        className="p-3 bg-neutral-900/30 border border-neutral-900 hover:border-neutral-800 rounded-lg space-y-1.5 text-xs transition-all relative group"
                      >
                        <div className="flex items-center justify-between">
                          <span className={`text-[10px] font-bold font-jetbrains ${colors.primary}`}>
                            {log.version}
                          </span>
                          <span className="text-[9px] text-neutral-500 font-jetbrains">
                            {log.time}
                          </span>
                        </div>
                        <p className="text-[11px] text-neutral-300 font-jakarta">
                          {log.action}
                        </p>
                        
                        <div className="pt-2 border-t border-neutral-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex justify-end">
                          <button
                            onClick={() => {
                              alert(`Simulated rollback to version ${log.version}`);
                            }}
                            className="text-[9px] bg-neutral-900 border border-neutral-800 text-neutral-300 px-2 py-0.5 rounded font-jetbrains hover:text-white"
                          >
                            Rollback
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </aside>
              )}
            </div>
          )}

          {/* ==================== 4. SETTINGS SCREEN ==================== */}
          {activeScreen === "settings" && (
            <div className="flex-1 flex flex-col h-full overflow-y-auto p-8 font-jakarta">
              <div className="max-w-3xl w-full mx-auto space-y-8 pb-12">
                <div className="space-y-1 select-none border-b border-neutral-900 pb-4">
                  <h2 className="text-xl font-bold font-space text-white tracking-tight">System Node Settings</h2>
                  <p className="text-neutral-500 text-xs font-jakarta">
                    Configure your Anthropic AI credentials, database sync controls, and dark-theme configurations.
                  </p>
                </div>

                <div className="space-y-6">
                  {/* Section 1: AI Keys */}
                  <div className="bg-neutral-900/10 border border-neutral-900 p-6 rounded-xl space-y-4">
                    <h3 className="text-xs font-bold text-white uppercase tracking-widest font-space flex items-center gap-1.5 select-none">
                      <Sparkles className="h-4 w-4 text-cyan-400" />
                      <span>AI Model Credentials</span>
                    </h3>

                    <div className="space-y-3">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-neutral-500 uppercase font-space tracking-wider">Anthropic API Key</label>
                        <input
                          type="password"
                          value={apiKey}
                          onChange={(e) => setApiKey(e.target.value)}
                          className="w-full bg-neutral-950 border border-neutral-850 rounded-xl px-4 py-2.5 text-xs text-white placeholder-neutral-750 font-jetbrains outline-none focus:border-cyan-400"
                        />
                        <span className="text-[9px] text-neutral-500 block leading-normal">
                          Stored locally in NextAuth server configuration. Never exposed to browser telemetry.
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Section 2: Security & Sync */}
                  <div className="bg-neutral-900/10 border border-neutral-900 p-6 rounded-xl space-y-4">
                    <h3 className="text-xs font-bold text-white uppercase tracking-widest font-space flex items-center gap-1.5 select-none">
                      <Lock className="h-4 w-4 text-violet-400" />
                      <span>Security & Synchronization</span>
                    </h3>

                    <div className="space-y-4">
                      {/* Toggle 1 */}
                      <div className="flex items-center justify-between border-b border-neutral-900/60 pb-3 select-none">
                        <div className="space-y-0.5">
                          <span className="text-xs font-semibold text-white">Require Multi-Factor Authentication</span>
                          <p className="text-[10px] text-neutral-500 leading-normal font-jakarta">Prompt security verification on new terminal sessions.</p>
                        </div>
                        <button
                          onClick={() => setIsMfaEnabled(!isMfaEnabled)}
                          className={`h-5 w-9 rounded-full transition-all relative ${
                            isMfaEnabled ? colors.bg : "bg-neutral-800"
                          }`}
                        >
                          <div className={`h-3 w-3 bg-neutral-950 rounded-full absolute top-1 transition-all ${
                            isMfaEnabled ? "right-1" : "left-1"
                          }`} />
                        </button>
                      </div>

                      {/* Toggle 2 */}
                      <div className="flex items-center justify-between border-b border-neutral-900/60 pb-3 select-none">
                        <div className="space-y-0.5">
                          <span className="text-xs font-semibold text-white">Allow Public Feed Indexing</span>
                          <p className="text-[10px] text-neutral-500 leading-normal font-jakarta">Permit search crawlers to scan notes shared to global public feed.</p>
                        </div>
                        <button
                          onClick={() => setAllowPublicBlogs(!allowPublicBlogs)}
                          className={`h-5 w-9 rounded-full transition-all relative ${
                            allowPublicBlogs ? colors.bg : "bg-neutral-800"
                          }`}
                        >
                          <div className={`h-3 w-3 bg-neutral-950 rounded-full absolute top-1 transition-all ${
                            allowPublicBlogs ? "right-1" : "left-1"
                          }`} />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Section 3: Keyboard Map preference */}
                  <div className="bg-neutral-900/10 border border-neutral-900 p-6 rounded-xl space-y-4">
                    <h3 className="text-xs font-bold text-white uppercase tracking-widest font-space flex items-center gap-1.5 select-none">
                      <Keyboard className="h-4 w-4 text-amber-400" />
                      <span>Input & Keyboard preferences</span>
                    </h3>

                    <div className="grid grid-cols-3 gap-3 select-none">
                      <button
                        onClick={() => setKbdShortcutMap("qwerty")}
                        className={`p-3 text-left rounded-xl border transition-all ${
                          kbdShortcutMap === "qwerty"
                            ? `${colors.borderActive} bg-neutral-950`
                            : "border-neutral-800 hover:border-neutral-700 bg-neutral-900/10"
                        }`}
                      >
                        <span className="block text-xs font-bold text-white">QWERTY Standard</span>
                        <span className="block text-[9px] text-neutral-500 leading-normal mt-0.5">Standard desktop keys mappings.</span>
                      </button>

                      <button
                        onClick={() => setKbdShortcutMap("vim")}
                        className={`p-3 text-left rounded-xl border transition-all ${
                          kbdShortcutMap === "vim"
                            ? `${colors.borderActive} bg-neutral-950`
                            : "border-neutral-800 hover:border-neutral-700 bg-neutral-900/10"
                        }`}
                      >
                        <span className="block text-xs font-bold text-white">Vim Keybindings</span>
                        <span className="block text-[9px] text-neutral-500 leading-normal mt-0.5">HJKL nav bindings in markdown editor.</span>
                      </button>

                      <button
                        onClick={() => setKbdShortcutMap("emacs")}
                        className={`p-3 text-left rounded-xl border transition-all ${
                          kbdShortcutMap === "emacs"
                            ? `${colors.borderActive} bg-neutral-950`
                            : "border-neutral-800 hover:border-neutral-700 bg-neutral-900/10"
                        }`}
                      >
                        <span className="block text-xs font-bold text-white">Emacs Mode</span>
                        <span className="block text-[9px] text-neutral-500 leading-normal mt-0.5">Chords layout preference config.</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* ==================== 5. SEARCH OVERLAY / COMMAND PALETTE ==================== */}
      {isSearchOpen && (
        <div className="fixed inset-0 bg-neutral-950/80 backdrop-blur-sm z-50 flex items-start justify-center pt-24 px-4 font-jakarta animate-fade-in">
          <div className="max-w-lg w-full bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl overflow-hidden cyber-panel-clip relative">
            
            {/* Search Input bar */}
            <div className="h-12 px-4 border-b border-neutral-850 flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1">
                <Search className="h-4 w-4 text-neutral-500 shrink-0" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-transparent border-none text-white text-xs outline-none flex-1 font-jakarta placeholder-neutral-600"
                  placeholder="Query titles, tags, or contents..."
                />
              </div>
              <button
                onClick={() => setIsSearchOpen(false)}
                className="text-[10px] bg-neutral-950 border border-neutral-800 text-neutral-400 hover:text-white px-2 py-0.5 rounded font-jetbrains"
              >
                ESC
              </button>
            </div>

            {/* Matching Results list */}
            <div className="max-h-64 overflow-y-auto p-2 custom-scroll space-y-1">
              <div className="px-3 py-1.5 text-[9px] font-bold text-neutral-500 uppercase tracking-widest font-space select-none">
                {filteredNotes.length === 0 ? "No records match query" : "Matching notes records"}
              </div>

              {filteredNotes.map((note) => (
                <div
                  key={note.id}
                  onClick={() => {
                    setSelectedNoteId(note.id);
                    setEditorTitle(note.title);
                    setEditorTags(note.tags.join(", "));
                    setActiveScreen("editor");
                    setIsSearchOpen(false);
                  }}
                  className="p-3 hover:bg-neutral-950 rounded-lg cursor-pointer flex items-center justify-between transition-all group border border-transparent hover:border-neutral-850"
                >
                  <div className="min-w-0 flex-1">
                    <span className="block text-xs font-semibold text-neutral-300 group-hover:text-white truncate font-space">
                      {note.title}
                    </span>
                    <span className="block text-[10px] text-neutral-500 truncate font-jakarta mt-0.5">
                      {note.preview}
                    </span>
                  </div>
                  <ChevronRight className="h-3.5 w-3.5 text-neutral-600 group-hover:text-cyan-400 transition-colors ml-4 shrink-0" />
                </div>
              ))}
            </div>

            {/* Command palette shortcuts manual */}
            <div className="bg-neutral-950 p-3 border-t border-neutral-800/80 flex items-center justify-between text-[9px] font-jetbrains text-neutral-500 select-none">
              <div className="flex items-center gap-1.5">
                <Info className="h-3.5 w-3.5 text-neutral-600" />
                <span>Navigate using arrow keys & press Enter</span>
              </div>
              <div className="flex gap-2">
                <span>↑↓ navigate</span>
                <span>↵ select</span>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
