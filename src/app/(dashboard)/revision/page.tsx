"use client";

export const dynamic = "force-dynamic";

import React, { useState, useEffect } from "react";
import { useWorkspaceStore } from "@/stores/workspaceStore";
import { toast } from "sonner";
import {
  Sparkles,
  Loader2,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Save,
  BrainCircuit,
  Award,
  HelpCircle,
  RefreshCw,
  Copy,
  ChevronDown,
  CheckCircle2,
  RotateCcw,
  Zap,
  FileText,
  Target,
  Check,
  Flame,
  Search,
  ArrowRight,
  Sparkle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

// Structured interfaces matching API response schema
interface CheatSheetConcept {
  term: string;
  definition: string;
}

interface CheatSheetFormula {
  name: string;
  description: string;
}

interface CheatSheetData {
  summary: string;
  concepts: CheatSheetConcept[];
  formulas: CheatSheetFormula[];
  highlights: string[];
}

interface FlashcardData {
  question: string;
  answer: string;
}

interface QuizData {
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
}

interface RevisionPayload {
  title: string;
  type: "cheatsheet" | "flashcards" | "quiz";
  cheatsheet?: CheatSheetData;
  flashcards?: FlashcardData[];
  quiz?: QuizData[];
}

export default function RevisionPage() {
  const { notes, createNote, updateNote, fetchNotes } = useWorkspaceStore();
  const [selectedNoteId, setSelectedNoteId] = useState<string>("");
  const [customText, setCustomText] = useState<string>("");
  const [useCustomText, setUseCustomText] = useState<boolean>(false);
  const [revisionMode, setRevisionMode] = useState<"cheatsheet" | "flashcards" | "quiz">("cheatsheet");
  const [noteSearchQuery, setNoteSearchQuery] = useState<string>("");
  
  // Generation & payload state
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [revisionData, setRevisionData] = useState<RevisionPayload | null>(null);
  
  // Interactive UI states for Flashcards
  const [activeFlashcardIndex, setActiveFlashcardIndex] = useState<number>(0);
  const [isFlashcardFlipped, setIsFlashcardFlipped] = useState<boolean>(false);
  const [masteredCards, setMasteredCards] = useState<Record<number, boolean>>({});

  // Interactive UI states for Quiz
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [checkedQuestions, setCheckedQuestions] = useState<Record<number, boolean>>({});
  const [activeQuizIndex, setActiveQuizIndex] = useState<number>(0);
  const [quizScore, setQuizScore] = useState<number | null>(null);
  const [isSavingNote, setIsSavingNote] = useState<boolean>(false);

  // Takeaways checklist state
  const [checkedHighlights, setCheckedHighlights] = useState<Record<number, boolean>>({});

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  // Generate revision deck from selected note or custom text
  const handleGenerateStack = async () => {
    if (!useCustomText && !selectedNoteId) {
      toast.error("Please choose a study note or enter custom text to generate revision materials.");
      return;
    }
    if (useCustomText && !customText.trim()) {
      toast.error("Please enter some study text first.");
      return;
    }

    setIsGenerating(true);
    setRevisionData(null);
    setSelectedAnswers({});
    setCheckedQuestions({});
    setQuizScore(null);
    setActiveFlashcardIndex(0);
    setIsFlashcardFlipped(false);
    setMasteredCards({});
    setCheckedHighlights({});
    setActiveQuizIndex(0);

    try {
      const res = await fetch("/api/revision/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          noteId: useCustomText ? undefined : selectedNoteId,
          customText: useCustomText ? customText : undefined,
          mode: revisionMode,
        }),
      });

      if (!res.ok) {
        let errMessage = "Generation request failed.";
        try {
          const errData = await res.json();
          if (errData.error) errMessage = errData.error;
        } catch {
          // ignore non-JSON body
        }
        throw new Error(errMessage);
      }

      const data: RevisionPayload = await res.json();
      setRevisionData(data);
      toast.success(
        `${
          revisionMode === "cheatsheet"
            ? "Cheat Sheet Summary"
            : revisionMode === "flashcards"
            ? "Spaced Flashcards"
            : "Practice Quiz"
        } generated successfully!`
      );
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Error generating revision deck.");
    } finally {
      setIsGenerating(false);
    }
  };

  // Convert study materials into TipTap Rich Text Format and save to workspace
  const handleSaveToNotes = async () => {
    if (!revisionData) return;
    setIsSavingNote(true);

    try {
      const title = `Revision: ${revisionData.title}`;
      const folderId = null;
      
      const newNote = await createNote(title, folderId);
      if (!newNote) throw new Error("Failed to create note.");

      const docContent: Record<string, unknown>[] = [
        {
          type: "heading",
          attrs: { level: 2 },
          content: [{ type: "text", text: title }],
        },
      ];

      if (revisionData.type === "cheatsheet" && revisionData.cheatsheet) {
        const cs = revisionData.cheatsheet;
        docContent.push(
          { type: "heading", attrs: { level: 3 }, content: [{ type: "text", text: "Executive Summary" }] },
          { type: "paragraph", content: [{ type: "text", text: cs.summary }] }
        );

        if (cs.concepts && cs.concepts.length > 0) {
          docContent.push({ type: "heading", attrs: { level: 3 }, content: [{ type: "text", text: "Glossary & Key Concepts" }] });
          cs.concepts.forEach((c) => {
            docContent.push({
              type: "paragraph",
              content: [
                { type: "text", text: `${c.term}: `, attrs: { bold: true } },
                { type: "text", text: c.definition },
              ],
            });
          });
        }

        if (cs.formulas && cs.formulas.length > 0) {
          docContent.push({ type: "heading", attrs: { level: 3 }, content: [{ type: "text", text: "Equations & Critical Rules" }] });
          cs.formulas.forEach((f) => {
            docContent.push({
              type: "paragraph",
              content: [
                { type: "text", text: `${f.name}: `, attrs: { code: true } },
                { type: "text", text: f.description },
              ],
            });
          });
        }

        if (cs.highlights && cs.highlights.length > 0) {
          docContent.push({ type: "heading", attrs: { level: 3 }, content: [{ type: "text", text: "Key Takeaways" }] });
          cs.highlights.forEach((h) => {
            docContent.push({
              type: "paragraph",
              content: [{ type: "text", text: `• ${h}` }],
            });
          });
        }
      } else if (revisionData.type === "flashcards" && revisionData.flashcards) {
        docContent.push({ type: "heading", attrs: { level: 3 }, content: [{ type: "text", text: "Revision Flashcards" }] });
        revisionData.flashcards.forEach((card, idx) => {
          docContent.push(
            { type: "paragraph", content: [{ type: "text", text: `Q${idx + 1}: ${card.question}`, attrs: { bold: true } }] },
            { type: "paragraph", content: [{ type: "text", text: `A${idx + 1}: ${card.answer}` }] }
          );
        });
      } else if (revisionData.type === "quiz" && revisionData.quiz) {
        docContent.push({ type: "heading", attrs: { level: 3 }, content: [{ type: "text", text: "Practice Exam Quiz" }] });
        revisionData.quiz.forEach((q, idx) => {
          docContent.push(
            { type: "paragraph", content: [{ type: "text", text: `${idx + 1}. ${q.question}`, attrs: { bold: true } }] },
            ...q.options.map((opt, oIdx) => ({
              type: "paragraph",
              content: [{ type: "text", text: `[${String.fromCharCode(65 + oIdx)}] ${opt}` }],
            })),
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  text: `Correct Answer: Option ${String.fromCharCode(65 + q.correctAnswerIndex)}. Explanation: ${q.explanation}`,
                  attrs: { italic: true },
                },
              ],
            }
          );
        });
      }

      await updateNote(newNote._id, { content: { type: "doc", content: docContent } });
      toast.success("Saved to Notes workspace! Access it anytime from the sidebar.");
    } catch (err) {
      console.error(err);
      toast.error("Failed to save revision deck to notes.");
    } finally {
      setIsSavingNote(false);
    }
  };

  // Submit & grade quiz answers
  const handleCheckQuizAnswers = () => {
    if (!revisionData?.quiz) return;
    const questions = revisionData.quiz;
    let score = 0;

    questions.forEach((q, idx) => {
      const selected = selectedAnswers[idx];
      if (selected === q.correctAnswerIndex) {
        score++;
      }
      setCheckedQuestions((prev) => ({ ...prev, [idx]: true }));
    });

    setQuizScore(score);
    toast.success(`Quiz complete! Scored ${score} / ${questions.length}.`);
  };

  // Copy raw formatted text to clipboard
  const handleCopyContent = () => {
    if (!revisionData) return;
    let textToCopy = `Revision Guide: ${revisionData.title}\n\n`;

    if (revisionData.type === "cheatsheet" && revisionData.cheatsheet) {
      const cs = revisionData.cheatsheet;
      textToCopy += `SUMMARY:\n${cs.summary}\n\n`;
      textToCopy += `KEY CONCEPTS:\n`;
      cs.concepts.forEach((c) => {
        textToCopy += `- ${c.term}: ${c.definition}\n`;
      });
      if (cs.formulas.length > 0) {
        textToCopy += `\nEQUATIONS & RULES:\n`;
        cs.formulas.forEach((f) => {
          textToCopy += `- ${f.name}: ${f.description}\n`;
        });
      }
      textToCopy += `\nTAKEAWAYS:\n`;
      cs.highlights.forEach((h) => {
        textToCopy += `• ${h}\n`;
      });
    } else if (revisionData.type === "flashcards" && revisionData.flashcards) {
      revisionData.flashcards.forEach((card, idx) => {
        textToCopy += `Q${idx + 1}: ${card.question}\nA${idx + 1}: ${card.answer}\n\n`;
      });
    } else if (revisionData.type === "quiz" && revisionData.quiz) {
      revisionData.quiz.forEach((q, idx) => {
        textToCopy += `${idx + 1}. ${q.question}\n`;
        q.options.forEach((opt, oIdx) => {
          textToCopy += `  ${String.fromCharCode(65 + oIdx)}) ${opt}\n`;
        });
        textToCopy += `Answer: ${String.fromCharCode(65 + q.correctAnswerIndex)}\nExplanation: ${q.explanation}\n\n`;
      });
    }

    navigator.clipboard.writeText(textToCopy);
    toast.success("Revision material copied to clipboard!");
  };

  const filteredNotes = notes.filter((n) =>
    !n.isTrashed && n.title.toLowerCase().includes(noteSearchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen flex flex-col bg-[#05080E] text-[#E2E8F0] selection:bg-cyan-500/30 selection:text-cyan-300 relative font-sans antialiased overflow-x-hidden p-4 sm:p-6 lg:p-8">
      {/* Dynamic Background Cyber Gradients */}
      <div className="fixed top-0 left-1/4 w-[700px] h-[400px] bg-cyan-500/5 rounded-full blur-[160px] pointer-events-none z-0" />
      <div className="fixed bottom-0 right-1/4 w-[700px] h-[400px] bg-violet-500/5 rounded-full blur-[160px] pointer-events-none z-0" />

      {/* ── HEADER BANNER ── */}
      <header className="relative z-10 mb-8 rounded-2xl bg-[#0B121C]/90 border border-cyan-500/20 p-6 backdrop-blur-xl shadow-[0_0_30px_rgba(0,240,255,0.08)] flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-cyan-400 animate-ping" />
            <span className="text-[10px] font-bold text-cyan-400 tracking-[0.2em] font-mono uppercase">
              SMART REVISION ENGINE v3.0
            </span>
            <span className="px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/30 text-[9px] text-cyan-300 font-bold font-mono uppercase flex items-center gap-1">
              <Sparkles className="size-3 text-cyan-400" /> GEMINI PRO INTEGRATED
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-wider font-heading flex items-center gap-3">
            AI REVISION WORKSTATION
          </h1>
          <p className="text-xs text-[#94A3B8] max-w-2xl leading-relaxed">
            Transform notes and lectures into high-yield cheat sheets, interactive flashcards, or practice exam quizzes in seconds.
          </p>
        </div>

        {/* Quick Stats Chips */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="px-4 py-2 rounded-xl bg-[#060D14] border border-white/10 text-center">
            <div className="text-[10px] text-[#94A3B8] uppercase font-mono font-bold">Notes Synced</div>
            <div className="text-base font-bold text-cyan-400 font-mono">{notes.filter((n) => !n.isTrashed).length}</div>
          </div>
          <div className="px-4 py-2 rounded-xl bg-[#060D14] border border-amber-500/20 text-center">
            <div className="text-[10px] text-[#94A3B8] uppercase font-mono font-bold">XP Reward</div>
            <div className="text-base font-bold text-amber-400 font-mono flex items-center justify-center gap-1">
              <Flame className="size-4 text-amber-400" /> +5 XP
            </div>
          </div>
        </div>
      </header>

      {/* ── 2-COLUMN MAIN WORKSPACE GRID ── */}
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* ── LEFT PANEL: CONFIGURATION & INPUT DESK (5 cols) ── */}
        <section className="lg:col-span-5 space-y-6">
          
          {/* STEP 1: CHOOSE REVISION METHOD */}
          <div className="rounded-2xl bg-[#0B121C]/90 border border-white/10 p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <span className="text-xs font-bold text-white uppercase tracking-widest font-mono flex items-center gap-2">
                <Target className="size-4 text-cyan-400" /> 01. SELECT REVISION METHOD
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {[
                { id: "cheatsheet", label: "Cheat Sheet", icon: BookOpen, color: "#00F0FF" },
                { id: "flashcards", label: "Flashcards", icon: BrainCircuit, color: "#A855F7" },
                { id: "quiz", label: "Mock Quiz", icon: HelpCircle, color: "#F59E0B" },
              ].map((m) => {
                const Icon = m.icon;
                const isActive = revisionMode === m.id;
                return (
                  <button
                    key={m.id}
                    onClick={() => setRevisionMode(m.id as typeof revisionMode)}
                    className={`p-3 rounded-xl border flex flex-col items-center justify-center text-center gap-2 transition-all cursor-pointer ${
                      isActive
                        ? "bg-white/10 border-cyan-400 text-white shadow-[0_0_15px_rgba(0,240,255,0.2)]"
                        : "bg-[#060D14] border-white/5 text-[#94A3B8] hover:border-white/20 hover:text-white"
                    }`}
                  >
                    <Icon className="size-5" style={{ color: isActive ? m.color : "#94A3B8" }} />
                    <span className="text-[11px] font-bold uppercase tracking-wider">{m.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* STEP 2: CHOOSE SOURCE CONTENT */}
          <div className="rounded-2xl bg-[#0B121C]/90 border border-white/10 p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <span className="text-xs font-bold text-white uppercase tracking-widest font-mono flex items-center gap-2">
                <FileText className="size-4 text-cyan-400" /> 02. INPUT STUDY SOURCE
              </span>

              {/* Toggle Note vs Custom Text */}
              <div className="flex items-center bg-[#060D14] border border-white/10 rounded-lg p-0.5 text-[10px] font-bold uppercase font-mono">
                <button
                  onClick={() => setUseCustomText(false)}
                  className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                    !useCustomText ? "bg-cyan-500 text-black shadow-md" : "text-[#94A3B8] hover:text-white"
                  }`}
                >
                  My Notes
                </button>
                <button
                  onClick={() => setUseCustomText(true)}
                  className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                    useCustomText ? "bg-cyan-500 text-black shadow-md" : "text-[#94A3B8] hover:text-white"
                  }`}
                >
                  Custom Text
                </button>
              </div>
            </div>

            {!useCustomText ? (
              <div className="space-y-3">
                {/* Search note filter */}
                <div className="relative">
                  <Search className="size-3.5 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={noteSearchQuery}
                    onChange={(e) => setNoteSearchQuery(e.target.value)}
                    placeholder="Search note titles..."
                    className="w-full bg-[#060D14] border border-white/15 focus:border-cyan-400 rounded-xl pl-9 pr-3 py-2 text-xs text-white outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-[#94A3B8] uppercase font-mono">Select Workspace Note</label>
                  <div className="relative">
                    <select
                      value={selectedNoteId}
                      onChange={(e) => setSelectedNoteId(e.target.value)}
                      className="w-full bg-[#060D14] border border-white/15 text-xs text-white rounded-xl px-3 py-2.5 outline-none appearance-none cursor-pointer focus:border-cyan-400"
                    >
                      <option value="">-- Choose Note Document --</option>
                      {filteredNotes.map((n) => (
                        <option key={n._id} value={n._id}>
                          {n.title}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3.5 top-3.5 size-3.5 text-[#94A3B8] pointer-events-none" />
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold text-[#94A3B8] uppercase font-mono">Paste Custom Text</label>
                  <span className="text-[10px] text-[#94A3B8] font-mono">{customText.length} chars</span>
                </div>
                <textarea
                  placeholder="Paste lecture notes, textbook chapters, or raw text here to convert into revision materials..."
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value)}
                  rows={6}
                  className="w-full bg-[#060D14] border border-white/15 focus:border-cyan-400 rounded-xl p-3 text-xs text-white outline-none resize-none leading-relaxed"
                />
              </div>
            )}
          </div>

          {/* STEP 3: GENERATE ACTION CTA */}
          <div className="rounded-2xl bg-[#0B121C]/90 border border-white/10 p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-widest font-mono">
                <Award className="size-4 text-amber-400" /> EARN +5 XP PER DECK
              </div>
              <span className="text-[10px] text-[#94A3B8] font-mono">INSTANT AI GENERATION</span>
            </div>

            <Button
              onClick={handleGenerateStack}
              disabled={isGenerating}
              className="w-full h-12 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-bold uppercase tracking-wider text-xs rounded-xl shadow-[0_0_20px_rgba(0,240,255,0.3)] gap-2 flex items-center justify-center cursor-pointer transition-all"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  <span>SYNTHESIZING STUDY DECK...</span>
                </>
              ) : (
                <>
                  <Sparkles className="size-4" />
                  <span>GENERATE REVISION DECK</span>
                </>
              )}
            </Button>
          </div>

        </section>

        {/* ── RIGHT PANEL: REVISION RESULTS WORKSPACE (7 cols) ── */}
        <section className="lg:col-span-7 rounded-2xl bg-[#0B121C]/90 border border-white/10 overflow-hidden shadow-2xl flex flex-col min-h-[600px]">
          
          {/* Output Toolbar */}
          <div className="p-4 border-b border-white/10 bg-[#060D14] flex flex-wrap items-center justify-between gap-3 shrink-0 select-none">
            <div className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-cyan-400 animate-pulse" />
              <span className="text-xs font-bold text-white uppercase tracking-widest font-mono">
                REVISION WORKSPACE
              </span>
            </div>

            {revisionData && (
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleCopyContent}
                  className="h-8 px-3 text-[10px] font-bold text-[#94A3B8] hover:text-white border border-white/10 hover:border-white/30 rounded-lg gap-1.5"
                >
                  <Copy className="size-3.5" /> Copy Text
                </Button>

                <Button
                  size="sm"
                  onClick={handleSaveToNotes}
                  disabled={isSavingNote}
                  className="h-8 px-3 text-[10px] font-bold bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/25 rounded-lg gap-1.5"
                >
                  {isSavingNote ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
                  <span>Save to Notes</span>
                </Button>
              </div>
            )}
          </div>

          {/* Output Content Body */}
          <div className="flex-1 p-6 overflow-y-auto custom-scroll space-y-6">
            {isGenerating ? (
              <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-center space-y-4">
                <div className="relative flex items-center justify-center">
                  <div className="size-16 rounded-full border-2 border-dashed border-cyan-400 animate-spin" />
                  <BrainCircuit className="size-7 text-cyan-400 absolute animate-pulse" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-bold text-white uppercase tracking-wider font-mono">PARSING STUDY CONTENT...</p>
                  <p className="text-xs text-[#94A3B8]">Extracting key concepts, formulas, and spaced flashcards</p>
                </div>
              </div>
            ) : !revisionData ? (
              <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-center p-8 space-y-4 select-none">
                <div className="size-16 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                  <BrainCircuit className="size-8" />
                </div>
                <div className="space-y-1 max-w-sm">
                  <h3 className="text-base font-bold text-white uppercase font-heading">NO REVISION DECK ACTIVE</h3>
                  <p className="text-xs text-[#94A3B8]">
                    Choose a note from the left panel or paste study text, then hit <strong>Generate Revision Deck</strong> to begin.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                
                {/* Title & Badge Header */}
                <div className="border-b border-white/10 pb-4 space-y-2">
                  <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase font-mono bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                    {revisionData.type === "cheatsheet"
                      ? "Cheat Sheet Guide"
                      : revisionData.type === "flashcards"
                      ? "Spaced Flashcards"
                      : "Mock Practice Quiz"}
                  </span>
                  <h2 className="text-xl font-bold text-white font-heading">{revisionData.title}</h2>
                </div>

                {/* ── MODE 1: CHEAT SHEET VIEW ── */}
                {revisionData.type === "cheatsheet" && revisionData.cheatsheet && (
                  <div className="space-y-6">
                    
                    {/* Executive Summary */}
                    <div className="p-5 rounded-2xl bg-[#060D14] border border-cyan-500/30 space-y-2 shadow-inner">
                      <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-widest font-mono flex items-center gap-2">
                        <BookOpen className="size-4" /> EXECUTIVE SUMMARY
                      </h3>
                      <p className="text-xs text-[#E2E8F0] leading-relaxed whitespace-pre-wrap">
                        {revisionData.cheatsheet.summary}
                      </p>
                    </div>

                    {/* Concepts & Glossary Grid */}
                    <div className="space-y-3">
                      <h3 className="text-xs font-bold text-violet-400 uppercase tracking-widest font-mono flex items-center gap-2 border-b border-white/10 pb-2">
                        <BrainCircuit className="size-4" /> GLOSSARY &amp; KEY CONCEPTS
                      </h3>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {revisionData.cheatsheet.concepts.map((c, idx) => (
                          <div key={idx} className="p-4 rounded-xl bg-[#060D14] border border-white/10 space-y-1.5 hover:border-violet-500/40 transition-colors">
                            <div className="text-xs font-bold text-white font-mono">{c.term}</div>
                            <p className="text-xs text-[#94A3B8] leading-relaxed">{c.definition}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Equations & Rules Deck */}
                    {revisionData.cheatsheet.formulas && revisionData.cheatsheet.formulas.length > 0 && (
                      <div className="space-y-3">
                        <h3 className="text-xs font-bold text-amber-400 uppercase tracking-widest font-mono flex items-center gap-2 border-b border-white/10 pb-2">
                          <Zap className="size-4" /> EQUATIONS &amp; CORE LAWS
                        </h3>

                        <div className="grid grid-cols-1 gap-3">
                          {revisionData.cheatsheet.formulas.map((f, idx) => (
                            <div key={idx} className="p-4 rounded-xl bg-[#060D14] border border-amber-500/20 space-y-1">
                              <div className="text-xs font-bold text-amber-400 font-mono">{f.name}</div>
                              <pre className="text-xs text-white bg-black/50 p-2.5 rounded-lg font-mono overflow-x-auto whitespace-pre">
                                {f.description}
                              </pre>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Key Takeaways Checklist */}
                    {revisionData.cheatsheet.highlights && revisionData.cheatsheet.highlights.length > 0 && (
                      <div className="p-5 rounded-2xl bg-[#060D14] border border-white/10 space-y-3">
                        <h3 className="text-xs font-bold text-white uppercase tracking-widest font-mono border-b border-white/10 pb-2">
                          KEY TAKEAWAYS CHECKLIST
                        </h3>

                        <div className="space-y-2">
                          {revisionData.cheatsheet.highlights.map((h, idx) => (
                            <button
                              key={idx}
                              onClick={() => setCheckedHighlights((prev) => ({ ...prev, [idx]: !prev[idx] }))}
                              className="w-full p-3 rounded-xl bg-[#0B121C] border border-white/5 hover:border-cyan-500/30 flex items-start gap-3 text-left transition-colors cursor-pointer"
                            >
                              <div className={`size-4 rounded border flex items-center justify-center shrink-0 mt-0.5 ${
                                checkedHighlights[idx] ? "bg-cyan-500 border-cyan-500 text-black" : "border-white/20"
                              }`}>
                                {checkedHighlights[idx] && <Check className="size-3" />}
                              </div>
                              <span className={`text-xs ${checkedHighlights[idx] ? "line-through text-[#64748B]" : "text-[#E2E8F0]"}`}>
                                {h}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                  </div>
                )}

                {/* ── MODE 2: FLASHCARDS VIEW ── */}
                {revisionData.type === "flashcards" && revisionData.flashcards && revisionData.flashcards.length > 0 && (
                  <div className="flex flex-col items-center justify-center py-6 space-y-6 select-none">
                    
                    {/* Interactive Flip Card */}
                    <div
                      onClick={() => setIsFlashcardFlipped(!isFlashcardFlipped)}
                      className="w-full max-w-lg aspect-[8/5] cursor-pointer group perspective-1000"
                    >
                      <div className={`w-full h-full relative transition-transform duration-500 shadow-2xl rounded-2xl border border-cyan-500/30 preserve-3d ${
                        isFlashcardFlipped ? "rotate-y-180" : ""
                      }`}>
                        
                        {/* FRONT SIDE (Question) */}
                        <div className="absolute inset-0 w-full h-full backface-hidden bg-[#060D14] flex flex-col justify-between p-6 rounded-2xl border border-white/10">
                          <div className="flex items-center justify-between text-[10px] text-[#94A3B8] font-mono uppercase">
                            <span>CARD QUESTION</span>
                            <span>{activeFlashcardIndex + 1} / {revisionData.flashcards.length}</span>
                          </div>

                          <div className="flex-1 flex items-center justify-center text-center px-4">
                            <p className="text-base font-bold text-white leading-relaxed group-hover:text-cyan-400 transition-colors">
                              {revisionData.flashcards[activeFlashcardIndex].question}
                            </p>
                          </div>

                          <div className="text-center text-[10px] text-cyan-400 font-mono uppercase tracking-wider animate-pulse">
                            TAP TO FLIP &amp; REVEAL ANSWER
                          </div>
                        </div>

                        {/* BACK SIDE (Answer) */}
                        <div className="absolute inset-0 w-full h-full backface-hidden bg-[#060D14] border-2 border-violet-500/40 flex flex-col justify-between p-6 rounded-2xl [transform:rotateY(180deg)]">
                          <div className="flex items-center justify-between text-[10px] text-violet-400 font-mono uppercase">
                            <span>ANSWER EXPLANATION</span>
                            <span>{activeFlashcardIndex + 1} / {revisionData.flashcards.length}</span>
                          </div>

                          <div className="flex-1 flex items-center justify-center text-center px-4 overflow-y-auto custom-scroll py-2">
                            <p className="text-sm text-[#E2E8F0] leading-relaxed">
                              {revisionData.flashcards[activeFlashcardIndex].answer}
                            </p>
                          </div>

                          <div className="text-center text-[10px] text-violet-400 font-mono uppercase tracking-wider">
                            TAP TO RE-FLIP QUESTION
                          </div>
                        </div>

                      </div>
                    </div>

                    {/* Navigation Controls */}
                    <div className="flex items-center gap-4">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsFlashcardFlipped(false);
                          setTimeout(() => setActiveFlashcardIndex((prev) => Math.max(0, prev - 1)), 100);
                        }}
                        disabled={activeFlashcardIndex === 0}
                        className="size-9 rounded-xl border border-white/10 text-white"
                      >
                        <ChevronLeft className="size-4" />
                      </Button>

                      <span className="text-xs font-mono font-bold text-white">
                        {activeFlashcardIndex + 1} / {revisionData.flashcards.length}
                      </span>

                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsFlashcardFlipped(false);
                          setTimeout(() => setActiveFlashcardIndex((prev) => Math.min(revisionData.flashcards!.length - 1, prev + 1)), 100);
                        }}
                        disabled={activeFlashcardIndex === revisionData.flashcards.length - 1}
                        className="size-9 rounded-xl border border-white/10 text-white"
                      >
                        <ChevronRight className="size-4" />
                      </Button>
                    </div>

                  </div>
                )}

                {/* ── MODE 3: MOCK QUIZ VIEW ── */}
                {revisionData.type === "quiz" && revisionData.quiz && revisionData.quiz.length > 0 && (
                  <div className="space-y-6 select-none">
                    
                    {revisionData.quiz.map((q, qIdx) => {
                      const isChecked = !!checkedQuestions[qIdx];
                      const selectedOption = selectedAnswers[qIdx];

                      return (
                        <div key={qIdx} className="p-5 sm:p-6 rounded-2xl bg-[#060D14] border border-white/10 space-y-4">
                          <div className="flex items-start justify-between gap-3">
                            <h3 className="text-sm font-bold text-white leading-snug">
                              <span className="text-cyan-400 font-mono mr-1">Q{qIdx + 1}.</span> {q.question}
                            </h3>
                            {isChecked && (
                              selectedOption === q.correctAnswerIndex ? (
                                <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase font-mono bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shrink-0">
                                  Correct
                                </span>
                              ) : (
                                <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase font-mono bg-rose-500/20 text-rose-400 border border-rose-500/40 shrink-0">
                                  Incorrect
                                </span>
                              )
                            )}
                          </div>

                          {/* Options Grid */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            {q.options.map((opt, oIdx) => {
                              const isSelected = selectedOption === oIdx;
                              const isCorrect = oIdx === q.correctAnswerIndex;
                              let btnStyle = "bg-[#0B121C] border-white/10 text-white hover:border-cyan-500/40";

                              if (isChecked) {
                                if (isCorrect) {
                                  btnStyle = "bg-emerald-500/20 border-emerald-500 text-emerald-400 font-bold";
                                } else if (isSelected) {
                                  btnStyle = "bg-rose-500/20 border-rose-500 text-rose-400";
                                } else {
                                  btnStyle = "bg-[#0B121C]/40 border-white/5 text-[#64748B] opacity-50";
                                }
                              } else if (isSelected) {
                                btnStyle = "bg-cyan-500/20 border-cyan-400 text-cyan-300 font-bold";
                              }

                              return (
                                <button
                                  key={oIdx}
                                  disabled={isChecked}
                                  onClick={() => setSelectedAnswers((prev) => ({ ...prev, [qIdx]: oIdx }))}
                                  className={`p-3.5 rounded-xl border text-left text-xs transition-all font-sans cursor-pointer ${btnStyle}`}
                                >
                                  <span className="font-bold font-mono mr-2">{String.fromCharCode(65 + oIdx)}.</span> {opt}
                                </button>
                              );
                            })}
                          </div>

                          {/* Explanation Card */}
                          {isChecked && (
                            <div className="p-4 rounded-xl bg-black/60 border border-white/10 text-xs text-[#94A3B8] space-y-1">
                              <span className="font-bold text-white font-mono uppercase text-[10px] block">
                                EXPLANATION
                              </span>
                              <p className="leading-relaxed">{q.explanation}</p>
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {/* Quiz Action Row */}
                    {quizScore === null ? (
                      <div className="pt-2 flex justify-end">
                        <Button
                          onClick={handleCheckQuizAnswers}
                          disabled={Object.keys(selectedAnswers).length < revisionData.quiz.length}
                          className="h-10 bg-cyan-500 hover:bg-cyan-400 text-black font-bold uppercase tracking-wider text-xs px-6 rounded-xl cursor-pointer"
                        >
                          Submit &amp; Grade Quiz
                        </Button>
                      </div>
                    ) : (
                      <div className="p-5 rounded-2xl bg-[#060D14] border border-cyan-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="size-10 rounded-full bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
                            <Award className="size-5 animate-bounce" />
                          </div>
                          <div>
                            <div className="text-xs font-bold text-white uppercase font-mono">QUIZ EVALUATION COMPLETE</div>
                            <div className="text-xs text-cyan-400 font-mono font-bold mt-0.5">
                              Scored {quizScore} / {revisionData.quiz.length} ({Math.round((quizScore / revisionData.quiz.length) * 100)}% Accuracy)
                            </div>
                          </div>
                        </div>

                        <Button
                          onClick={() => {
                            setSelectedAnswers({});
                            setCheckedQuestions({});
                            setQuizScore(null);
                          }}
                          variant="ghost"
                          className="h-9 px-4 text-xs font-bold text-white border border-white/10 hover:border-white/30 rounded-xl gap-1.5"
                        >
                          <RotateCcw className="size-3.5" /> Retake Quiz
                        </Button>
                      </div>
                    )}

                  </div>
                )}

              </div>
            )}
          </div>

        </section>

      </div>
    </div>
  );
}
