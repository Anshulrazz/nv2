"use client";

export const dynamic = "force-dynamic";

import React, { useState, useEffect, useCallback } from "react";
import { useWorkspaceStore } from "@/stores/workspaceStore";
import { toast } from "sonner";
import {
  Sparkles,
  Loader2,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  BrainCircuit,
  Award,
  HelpCircle,
  Copy,
  CheckCircle2,
  RotateCcw,
  Zap,
  FileText,
  Target,
  Check,
  Flame,
  Search,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";

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

  // Interactive UI states for Quiz
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [checkedQuestions, setCheckedQuestions] = useState<Record<number, boolean>>({});
  const [quizScore, setQuizScore] = useState<number | null>(null);
  const [isSavingNote, setIsSavingNote] = useState<boolean>(false);

  // Takeaways checklist state
  const [checkedHighlights, setCheckedHighlights] = useState<Record<number, boolean>>({});

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  // Keyboard navigation for Flashcards
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (revisionData?.type !== "flashcards" || !revisionData.flashcards?.length) return;
      // Don't intercept if user is typing in an input/textarea
      if (["INPUT", "TEXTAREA"].includes((e.target as HTMLElement)?.tagName)) return;

      if (e.code === "Space") {
        e.preventDefault();
        setIsFlashcardFlipped((prev) => !prev);
      } else if (e.code === "ArrowLeft") {
        e.preventDefault();
        setIsFlashcardFlipped(false);
        setActiveFlashcardIndex((prev) => Math.max(0, prev - 1));
      } else if (e.code === "ArrowRight") {
        e.preventDefault();
        setIsFlashcardFlipped(false);
        setActiveFlashcardIndex((prev) =>
          Math.min(revisionData.flashcards!.length - 1, prev + 1)
        );
      }
    },
    [revisionData]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

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
    setCheckedHighlights({});

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
      if (cs.highlights.length > 0) {
        textToCopy += `\nTAKEAWAYS:\n`;
        cs.highlights.forEach((h) => {
          textToCopy += `• ${h}\n`;
        });
      }
    } else if (revisionData.type === "flashcards" && revisionData.flashcards) {
      revisionData.flashcards.forEach((card, idx) => {
        textToCopy += `Card ${idx + 1}\nQuestion: ${card.question}\nAnswer: ${card.answer}\n\n`;
      });
    } else if (revisionData.type === "quiz" && revisionData.quiz) {
      revisionData.quiz.forEach((q, idx) => {
        textToCopy += `Question ${idx + 1}: ${q.question}\n`;
        q.options.forEach((opt, oIdx) => {
          textToCopy += `  ${String.fromCharCode(65 + oIdx)}. ${opt}\n`;
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
    <div className="min-h-screen flex flex-col bg-transparent text-text-primary selection:bg-accent-primary/30 selection:text-text-primary relative font-sans antialiased overflow-x-hidden p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl mx-auto w-full">
      {/* ── HEADER BANNER ── */}
      <header className="rounded-2xl bg-bg-surface border border-border-subtle p-6 sm:p-8 backdrop-blur-xl shadow-lg relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="text-[10px] font-mono font-bold text-accent-primary tracking-widest uppercase">
              SMART REVISION ENGINE v3.0
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-accent-primary/10 border border-accent-primary/20 text-[10px] text-accent-primary font-bold font-mono uppercase flex items-center gap-1">
              <Sparkles className="size-3 text-accent-primary" /> GEMINI PRO INTEGRATED
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-text-primary tracking-tight font-display flex items-center gap-3">
            AI Revision Workstation
          </h1>
          <p className="text-xs sm:text-sm text-text-muted max-w-2xl leading-relaxed">
            Transform notes and lectures into high-yield cheat sheets, interactive flashcards, or practice exam quizzes in seconds.
          </p>
        </div>

        {/* Quick Stats Chips */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="px-4 py-2.5 rounded-xl bg-bg-elevated border border-border-subtle text-center min-w-[100px]">
            <div className="text-[10px] text-text-muted uppercase font-mono font-bold">Notes Synced</div>
            <div className="text-base font-bold text-text-primary font-mono">{notes.filter((n) => !n.isTrashed).length}</div>
          </div>
          <div className="px-4 py-2.5 rounded-xl bg-bg-elevated border border-accent-primary/20 text-center min-w-[100px]">
            <div className="text-[10px] text-text-muted uppercase font-mono font-bold">XP Reward</div>
            <div className="text-base font-bold text-accent-primary font-mono flex items-center justify-center gap-1">
              <Flame className="size-4 text-accent-secondary" /> +5 XP
            </div>
          </div>
        </div>
      </header>

      {/* ── 2-COLUMN MAIN WORKSPACE GRID ── */}
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* ── LEFT PANEL: CONFIGURATION & INPUT DESK (5 cols) ── */}
        <section className="lg:col-span-5 space-y-6">
          {/* STEP 1: CHOOSE REVISION METHOD */}
          <div className="rounded-2xl bg-bg-card border border-border-subtle p-5 sm:p-6 space-y-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-border-subtle pb-3">
              <span className="text-xs font-bold text-text-primary uppercase tracking-widest font-mono flex items-center gap-2">
                <Target className="size-4 text-accent-primary" /> 01. SELECT REVISION METHOD
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
              {[
                { id: "cheatsheet", label: "Cheat Sheet", icon: BookOpen },
                { id: "flashcards", label: "Flashcards", icon: BrainCircuit },
                { id: "quiz", label: "Mock Quiz", icon: HelpCircle },
              ].map((m) => {
                const Icon = m.icon;
                const isActive = revisionMode === m.id;
                return (
                  <button
                    key={m.id}
                    onClick={() => setRevisionMode(m.id as typeof revisionMode)}
                    className={`p-3 min-h-[48px] rounded-xl border flex sm:flex-col items-center justify-center text-center gap-2.5 transition-all cursor-pointer ${
                      isActive
                        ? "bg-accent-primary/15 border-accent-primary text-text-primary shadow-sm"
                        : "bg-bg-elevated/60 border-border-subtle text-text-muted hover:border-border-default hover:text-text-primary"
                    }`}
                  >
                    <Icon className={`size-5 shrink-0 ${isActive ? "text-accent-primary" : "text-text-muted"}`} />
                    <span className="text-xs sm:text-[11px] font-bold uppercase tracking-wider">{m.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* STEP 2: CHOOSE SOURCE CONTENT */}
          <div className="rounded-2xl bg-bg-card border border-border-subtle p-5 sm:p-6 space-y-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-border-subtle pb-3">
              <span className="text-xs font-bold text-text-primary uppercase tracking-widest font-mono flex items-center gap-2">
                <FileText className="size-4 text-accent-primary" /> 02. INPUT STUDY SOURCE
              </span>

              {/* Toggle Note vs Custom Text */}
              <div className="flex items-center bg-bg-base border border-border-subtle rounded-lg p-0.5 text-[10px] font-bold uppercase font-mono">
                <button
                  onClick={() => setUseCustomText(false)}
                  className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                    !useCustomText ? "bg-accent-primary text-bg-base font-bold shadow-sm" : "text-text-muted hover:text-text-primary"
                  }`}
                >
                  My Notes
                </button>
                <button
                  onClick={() => setUseCustomText(true)}
                  className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                    useCustomText ? "bg-accent-primary text-bg-base font-bold shadow-sm" : "text-text-muted hover:text-text-primary"
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
                  <Search className="size-3.5 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={noteSearchQuery}
                    onChange={(e) => setNoteSearchQuery(e.target.value)}
                    placeholder="Search note titles..."
                    className="w-full bg-bg-base border border-border-subtle rounded-xl pl-9 pr-3 py-2 text-xs text-text-primary placeholder:text-text-muted outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary/40 transition-all font-sans"
                  />
                </div>

                {/* Notes list */}
                <div className="max-h-56 overflow-y-auto custom-scroll space-y-1.5 pr-1">
                  {filteredNotes.length === 0 ? (
                    <div className="p-4 text-center text-xs text-text-muted font-mono">
                      No matching notes found.
                    </div>
                  ) : (
                    filteredNotes.map((n) => {
                      const isSelected = selectedNoteId === n._id;
                      return (
                        <button
                          key={n._id}
                          onClick={() => setSelectedNoteId(n._id)}
                          className={`w-full p-2.5 rounded-xl border text-left text-xs transition-all flex items-center justify-between gap-3 cursor-pointer ${
                            isSelected
                              ? "bg-accent-primary/10 border-accent-primary text-text-primary font-bold shadow-sm"
                              : "bg-bg-elevated/40 border-border-subtle text-text-secondary hover:border-border-default hover:text-text-primary"
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate">
                            <FileText className={`size-3.5 shrink-0 ${isSelected ? "text-accent-primary" : "text-text-muted"}`} />
                            <span className="truncate">{n.title || "Untitled Note"}</span>
                          </div>
                          {isSelected && <CheckCircle2 className="size-3.5 text-accent-primary shrink-0" />}
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <textarea
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value)}
                  placeholder="Paste lecture notes, textbook chapters, or equations here to synthesize revision materials..."
                  rows={6}
                  className="w-full bg-bg-base border border-border-subtle rounded-xl p-3 text-xs text-text-primary placeholder:text-text-muted outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary/40 transition-all resize-none font-sans leading-relaxed"
                />
                <div className="text-right text-[10px] font-mono text-text-muted">
                  {customText.length} characters
                </div>
              </div>
            )}

            {/* Synthesize CTA Button */}
            <Button
              onClick={handleGenerateStack}
              disabled={isGenerating || (!useCustomText && !selectedNoteId) || (useCustomText && !customText.trim())}
              className="w-full btn-premium-primary rounded-xl h-11 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  <span>Synthesizing Material...</span>
                </>
              ) : (
                <>
                  <Sparkles className="size-4" />
                  <span>Synthesize Revision Guide</span>
                  <ArrowRight className="size-4" />
                </>
              )}
            </Button>
          </div>
        </section>

        {/* ── RIGHT PANEL: REVISION WORKSTATION CANVAS (7 cols) ── */}
        <section className="lg:col-span-7 space-y-6">
          <div className="rounded-2xl bg-bg-card border border-border-subtle p-5 sm:p-6 shadow-sm min-h-[500px]">
            {isGenerating ? (
              <div className="py-24 flex flex-col items-center justify-center text-center space-y-4">
                <div className="size-14 rounded-2xl bg-accent-primary/10 border border-accent-primary/20 flex items-center justify-center text-accent-primary">
                  <Loader2 className="size-7 animate-spin" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-mono font-bold text-text-primary tracking-widest uppercase">
                    Synthesizing Revision Guide
                  </h3>
                  <p className="text-xs text-text-muted">
                    Parsing critical formulas, core concepts, and active recall cues...
                  </p>
                </div>
              </div>
            ) : !revisionData ? (
              <div className="py-24 flex flex-col items-center justify-center text-center space-y-4 max-w-md mx-auto">
                <div className="size-14 rounded-2xl bg-bg-elevated border border-border-subtle flex items-center justify-center text-text-muted">
                  <BrainCircuit className="size-7 text-accent-primary" />
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-base font-bold text-text-primary font-display">Workstation Ready</h3>
                  <p className="text-xs text-text-muted leading-relaxed">
                    Select a revision mode and choose a study note on the left desk to generate cheat sheets, flashcard decks, or practice quizzes.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Result Header & Actions */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border-subtle pb-4">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-accent-primary uppercase tracking-widest">
                      GENERATED REVISION MATERIAL
                    </span>
                    <h2 className="text-lg font-bold text-text-primary font-display line-clamp-1">
                      {revisionData.title}
                    </h2>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 flex-wrap">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleCopyContent}
                      className="h-8 px-3 text-xs rounded-lg border-border-subtle bg-bg-surface hover:bg-bg-elevated text-text-secondary hover:text-text-primary gap-1.5 cursor-pointer"
                    >
                      <Copy className="size-3.5 text-accent-primary" /> Copy
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSaveToNotes}
                      disabled={isSavingNote}
                      className="h-8 px-3 text-xs rounded-lg btn-premium-primary gap-1.5 cursor-pointer"
                    >
                      {isSavingNote ? (
                        <Loader2 className="size-3.5 animate-spin" />
                      ) : (
                        <Check className="size-3.5" />
                      )}
                      Save as Note
                    </Button>
                  </div>
                </div>

                {/* ── MODE 1: CHEAT SHEET VIEW ── */}
                {revisionData.type === "cheatsheet" && revisionData.cheatsheet && (
                  <div className="space-y-6">
                    {/* Executive Summary */}
                    <div className="p-5 rounded-2xl bg-bg-surface border border-border-subtle space-y-2">
                      <h3 className="text-xs font-bold text-accent-primary uppercase tracking-widest font-mono flex items-center gap-2">
                        <BookOpen className="size-4 text-accent-primary" /> EXECUTIVE SUMMARY
                      </h3>
                      <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
                        {revisionData.cheatsheet.summary}
                      </p>
                    </div>

                    {/* Glossary / Concepts */}
                    <div className="space-y-3">
                      <h3 className="text-xs font-bold text-accent-secondary uppercase tracking-widest font-mono flex items-center gap-2 border-b border-border-subtle pb-2">
                        <BrainCircuit className="size-4" /> GLOSSARY &amp; KEY CONCEPTS
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {revisionData.cheatsheet.concepts?.map((c, idx) => (
                          <div
                            key={idx}
                            className="p-4 rounded-xl bg-bg-elevated/50 border border-border-subtle space-y-1.5"
                          >
                            <div className="text-xs font-bold text-text-primary font-mono">{c.term}</div>
                            <p className="text-xs text-text-muted leading-relaxed">{c.definition}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Equations & Rules Deck */}
                    {revisionData.cheatsheet.formulas && revisionData.cheatsheet.formulas.length > 0 && (
                      <div className="space-y-3">
                        <h3 className="text-xs font-bold text-accent-primary uppercase tracking-widest font-mono flex items-center gap-2 border-b border-border-subtle pb-2">
                          <Zap className="size-4" /> EQUATIONS &amp; CORE LAWS
                        </h3>

                        <div className="grid grid-cols-1 gap-3">
                          {revisionData.cheatsheet.formulas.map((f, idx) => (
                            <div key={idx} className="p-4 rounded-xl bg-bg-base border border-accent-primary/20 space-y-1.5">
                              <div className="text-xs font-bold text-accent-primary font-mono">{f.name}</div>
                              <pre className="text-xs text-text-primary bg-bg-surface p-2.5 rounded-lg font-mono overflow-x-auto whitespace-pre border border-border-subtle">
                                {f.description}
                              </pre>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Key Takeaways Checklist */}
                    {revisionData.cheatsheet.highlights && revisionData.cheatsheet.highlights.length > 0 && (
                      <div className="p-5 rounded-2xl bg-bg-surface border border-border-subtle space-y-3">
                        <h3 className="text-xs font-bold text-text-primary uppercase tracking-widest font-mono border-b border-border-subtle pb-2">
                          KEY TAKEAWAYS CHECKLIST
                        </h3>

                        <div className="space-y-2">
                          {revisionData.cheatsheet.highlights.map((h, idx) => (
                            <button
                              key={idx}
                              onClick={() => setCheckedHighlights((prev) => ({ ...prev, [idx]: !prev[idx] }))}
                              className="w-full p-3 rounded-xl bg-bg-card border border-border-subtle hover:border-accent-primary/30 flex items-start gap-3 text-left transition-colors cursor-pointer"
                            >
                              <div
                                className={`size-4 rounded border flex items-center justify-center shrink-0 mt-0.5 ${
                                  checkedHighlights[idx] ? "bg-accent-primary border-accent-primary text-bg-base" : "border-border-default"
                                }`}
                              >
                                {checkedHighlights[idx] && <Check className="size-3 stroke-[3]" />}
                              </div>
                              <span
                                className={`text-xs ${
                                  checkedHighlights[idx] ? "line-through text-text-muted" : "text-text-secondary"
                                }`}
                              >
                                {h}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* ── MODE 2: FLASHCARDS VIEW (Safari / iOS 3D Flip Hardened) ── */}
                {revisionData.type === "flashcards" && revisionData.flashcards && revisionData.flashcards.length > 0 && (
                  <div className="flex flex-col items-center justify-center py-6 space-y-6 select-none">
                    {/* Interactive 3D Flip Card */}
                    <div
                      onClick={() => setIsFlashcardFlipped(!isFlashcardFlipped)}
                      className="w-full max-w-lg aspect-[8/5] cursor-pointer group [perspective:1000px] select-none"
                    >
                      <div
                        className={`w-full h-full relative transition-transform duration-500 rounded-2xl shadow-xl [transform-style:preserve-3d] [will-change:transform] ${
                          isFlashcardFlipped ? "[transform:rotateY(180deg)]" : ""
                        }`}
                      >
                        {/* FRONT SIDE (Question) */}
                        <div
                          style={{
                            WebkitBackfaceVisibility: "hidden",
                            backfaceVisibility: "hidden",
                            transform: "translateZ(0)",
                          }}
                          className="absolute inset-0 w-full h-full bg-bg-card border border-border-subtle hover:border-accent-primary/40 flex flex-col justify-between p-6 sm:p-7 rounded-2xl transition-colors"
                        >
                          <div className="flex items-center justify-between text-[10px] text-text-muted font-mono uppercase">
                            <span className="text-accent-primary font-bold">CARD QUESTION</span>
                            <span>{activeFlashcardIndex + 1} / {revisionData.flashcards.length}</span>
                          </div>

                          <div className="flex-1 flex items-center justify-center text-center px-4">
                            <p className="text-base sm:text-lg font-bold text-text-primary leading-relaxed font-display">
                              {revisionData.flashcards[activeFlashcardIndex].question}
                            </p>
                          </div>

                          <div className="text-center text-[10px] text-accent-primary font-mono uppercase tracking-wider flex items-center justify-center gap-1.5">
                            <Sparkles className="size-3" /> TAP OR PRESS SPACE TO REVEAL ANSWER
                          </div>
                        </div>

                        {/* BACK SIDE (Answer) */}
                        <div
                          style={{
                            WebkitBackfaceVisibility: "hidden",
                            backfaceVisibility: "hidden",
                            transform: "rotateY(180deg) translateZ(0)",
                          }}
                          className="absolute inset-0 w-full h-full bg-bg-elevated border-2 border-accent-primary/40 flex flex-col justify-between p-6 sm:p-7 rounded-2xl"
                        >
                          <div className="flex items-center justify-between text-[10px] text-accent-secondary font-mono uppercase font-bold">
                            <span>ANSWER EXPLANATION</span>
                            <span>{activeFlashcardIndex + 1} / {revisionData.flashcards.length}</span>
                          </div>

                          <div className="flex-1 flex items-center justify-center text-center px-4 overflow-y-auto custom-scroll py-2">
                            <p className="text-sm sm:text-base text-text-secondary leading-relaxed">
                              {revisionData.flashcards[activeFlashcardIndex].answer}
                            </p>
                          </div>

                          <div className="text-center text-[10px] text-accent-secondary font-mono uppercase tracking-wider">
                            TAP OR PRESS SPACE TO FLIP QUESTION
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
                        className="size-10 rounded-xl border border-border-subtle text-text-primary hover:bg-bg-elevated cursor-pointer"
                        aria-label="Previous Flashcard"
                      >
                        <ChevronLeft className="size-5" />
                      </Button>

                      <span className="text-xs font-mono font-bold text-text-primary">
                        {activeFlashcardIndex + 1} / {revisionData.flashcards.length}
                      </span>

                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsFlashcardFlipped(false);
                          setTimeout(
                            () =>
                              setActiveFlashcardIndex((prev) =>
                                Math.min(revisionData.flashcards!.length - 1, prev + 1)
                              ),
                            100
                          );
                        }}
                        disabled={activeFlashcardIndex === revisionData.flashcards.length - 1}
                        className="size-10 rounded-xl border border-border-subtle text-text-primary hover:bg-bg-elevated cursor-pointer"
                        aria-label="Next Flashcard"
                      >
                        <ChevronRight className="size-5" />
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
                        <div key={qIdx} className="p-5 sm:p-6 rounded-2xl bg-bg-surface border border-border-subtle space-y-4 shadow-sm">
                          <div className="flex items-start justify-between gap-3">
                            <h3 className="text-sm font-bold text-text-primary leading-snug font-display">
                              <span className="text-accent-primary font-mono mr-1">Q{qIdx + 1}.</span> {q.question}
                            </h3>
                            {isChecked && (
                              selectedOption === q.correctAnswerIndex ? (
                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase font-mono bg-success/15 text-success border border-success/30 shrink-0">
                                  Correct
                                </span>
                              ) : (
                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase font-mono bg-destructive/15 text-destructive border border-destructive/30 shrink-0">
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
                              let btnStyle = "bg-bg-card border-border-subtle text-text-secondary hover:border-accent-primary/40 hover:text-text-primary";

                              if (isChecked) {
                                if (isCorrect) {
                                  btnStyle = "bg-success/15 border-success text-success font-bold";
                                } else if (isSelected) {
                                  btnStyle = "bg-destructive/15 border-destructive text-destructive";
                                } else {
                                  btnStyle = "bg-bg-elevated/30 border-border-subtle/50 text-text-muted opacity-50";
                                }
                              } else if (isSelected) {
                                btnStyle = "bg-accent-primary/15 border-accent-primary text-text-primary font-bold";
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
                            <div className="p-4 rounded-xl bg-bg-elevated border border-border-subtle text-xs text-text-muted space-y-1">
                              <span className="font-bold text-text-primary font-mono uppercase text-[10px] block">
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
                          className="btn-premium-primary h-10 px-6 rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer"
                        >
                          Submit &amp; Grade Quiz
                        </Button>
                      </div>
                    ) : (
                      <div className="p-5 rounded-2xl bg-bg-surface border border-accent-primary/30 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
                        <div className="flex items-center gap-3">
                          <div className="size-10 rounded-full bg-accent-primary/15 border border-accent-primary/30 flex items-center justify-center text-accent-primary">
                            <Award className="size-5" />
                          </div>
                          <div>
                            <div className="text-xs font-bold text-text-primary uppercase font-mono">QUIZ EVALUATION COMPLETE</div>
                            <div className="text-xs text-accent-primary font-mono font-bold mt-0.5">
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
                          className="h-9 px-4 text-xs font-bold text-text-primary border border-border-subtle hover:bg-bg-elevated rounded-xl gap-1.5 cursor-pointer"
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
