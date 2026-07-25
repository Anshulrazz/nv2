"use client";

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
} from "lucide-react";
import { Button } from "@/components/ui/button";

// Structured interfaces matching the API payload schemas
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
  
  // Generation & display states
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [revisionData, setRevisionData] = useState<RevisionPayload | null>(null);
  
  // Interactive UI states
  const [activeFlashcardIndex, setActiveFlashcardIndex] = useState<number>(0);
  const [isFlashcardFlipped, setIsFlashcardFlipped] = useState<boolean>(false);
  
  // Quiz states: store user chosen option indexes and confirmation state per question
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [checkedQuestions, setCheckedQuestions] = useState<Record<number, boolean>>({});
  const [quizScore, setQuizScore] = useState<number | null>(null);
  const [isSavingNote, setIsSavingNote] = useState<boolean>(false);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  // Handle generating study stack
  const handleGenerateStack = async () => {
    if (!useCustomText && !selectedNoteId) {
      toast.error("Please select a note or enter custom text to begin revision.");
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
          // ignore non-JSON error body
        }
        throw new Error(errMessage);
      }

      const data = await res.json();

      setRevisionData(data);
      toast.success(`${revisionMode === "cheatsheet" ? "Cheat Sheet" : revisionMode === "flashcards" ? "Flashcards" : "Quiz"} generated successfully!`);
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Error generating revision stacks.");
    } finally {
      setIsGenerating(false);
    }
  };

  // Convert study materials into TipTap Rich Text Format for Note Saver
  const handleSaveToNotes = async () => {
    if (!revisionData) return;
    setIsSavingNote(true);

    try {
      const title = `Revision: ${revisionData.title}`;
      const folderId = null; // Save to root level
      
      const newNote = await createNote(title, folderId);
      if (!newNote) throw new Error("Failed to create new document.");

      // Formulate content array representing the structured study data
      const docContent: Record<string, unknown>[] = [
        {
          type: "heading",
          attrs: { level: 2 },
          content: [{ type: "text", text: title }],
        }
      ];

      if (revisionData.type === "cheatsheet" && revisionData.cheatsheet) {
        const cs = revisionData.cheatsheet;
        docContent.push(
          { type: "heading", attrs: { level: 3 }, content: [{ type: "text", text: "Summary Overview" }] },
          { type: "paragraph", content: [{ type: "text", text: cs.summary }] }
        );

        if (cs.concepts && cs.concepts.length > 0) {
          docContent.push({ type: "heading", attrs: { level: 3 }, content: [{ type: "text", text: "Glossary & Key Concepts" }] });
          cs.concepts.forEach(c => {
            docContent.push({
              type: "paragraph",
              content: [
                { type: "text", text: `${c.term}: `, attrs: { bold: true } },
                { type: "text", text: c.definition }
              ]
            });
          });
        }

        if (cs.formulas && cs.formulas.length > 0) {
          docContent.push({ type: "heading", attrs: { level: 3 }, content: [{ type: "text", text: "Equations & Key Rules" }] });
          cs.formulas.forEach(f => {
            docContent.push({
              type: "paragraph",
              content: [
                { type: "text", text: `${f.name} => `, attrs: { code: true } },
                { type: "text", text: f.description }
              ]
            });
          });
        }

        if (cs.highlights && cs.highlights.length > 0) {
          docContent.push({ type: "heading", attrs: { level: 3 }, content: [{ type: "text", text: "Key Takeaways" }] });
          cs.highlights.forEach(h => {
            docContent.push({
              type: "paragraph",
              content: [{ type: "text", text: `• ${h}` }]
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
              content: [{ type: "text", text: `[${String.fromCharCode(65 + oIdx)}] ${opt}` }]
            })),
            { type: "paragraph", content: [{ type: "text", text: `Correct Answer: Option ${String.fromCharCode(65 + q.correctAnswerIndex)}. Explanation: ${q.explanation}`, attrs: { italic: true } }] }
          );
        });
      }

      const defaultContent = {
        type: "doc",
        content: docContent,
      };

      await updateNote(newNote._id, { content: defaultContent });
      toast.success("Revision stack saved to Notes! You can view it from the sidebar.");
    } catch (err) {
      console.error(err);
      toast.error("Failed to save study sheet to notes workspace.");
    } finally {
      setIsSavingNote(false);
    }
  };

  // Check answers and calculate quiz score
  const handleCheckQuizAnswers = () => {
    if (!revisionData?.quiz) return;
    const questions = revisionData.quiz;
    let score = 0;
    
    questions.forEach((q, idx) => {
      const selected = selectedAnswers[idx];
      if (selected === q.correctAnswerIndex) {
        score++;
      }
      setCheckedQuestions(prev => ({ ...prev, [idx]: true }));
    });

    setQuizScore(score);
    toast.success(`Quiz completed! You scored ${score} out of ${questions.length}.`);
  };

  // Copy raw content to clipboard
  const handleCopyContent = () => {
    if (!revisionData) return;
    let textToCopy = `Revision Guide: ${revisionData.title}\n\n`;

    if (revisionData.type === "cheatsheet" && revisionData.cheatsheet) {
      const cs = revisionData.cheatsheet;
      textToCopy += `Summary:\n${cs.summary}\n\n`;
      textToCopy += `Glossary Concepts:\n`;
      cs.concepts.forEach(c => { textToCopy += `- ${c.term}: ${c.definition}\n`; });
      if (cs.formulas.length > 0) {
        textToCopy += `\nFormulas & Rules:\n`;
        cs.formulas.forEach(f => { textToCopy += `- ${f.name}: ${f.description}\n`; });
      }
      textToCopy += `\nHighlights:\n`;
      cs.highlights.forEach(h => { textToCopy += `• ${h}\n`; });
    } else if (revisionData.type === "flashcards" && revisionData.flashcards) {
      revisionData.flashcards.forEach((card, idx) => {
        textToCopy += `Q${idx + 1}: ${card.question}\nA${idx + 1}: ${card.answer}\n\n`;
      });
    } else if (revisionData.type === "quiz" && revisionData.quiz) {
      revisionData.quiz.forEach((q, idx) => {
        textToCopy += `${idx + 1}. ${q.question}\n`;
        q.options.forEach((opt, oIdx) => { textToCopy += `  ${String.fromCharCode(65 + oIdx)}) ${opt}\n`; });
        textToCopy += `Answer: ${String.fromCharCode(65 + q.correctAnswerIndex)}\nExplanation: ${q.explanation}\n\n`;
      });
    }

    navigator.clipboard.writeText(textToCopy);
    toast.success("Revision text copied to clipboard!");
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-neutral-950 overflow-y-auto custom-scroll p-4 sm:p-6 lg:p-8 select-none relative">
      
      {/* Page Header */}
      <header className="mb-6 sm:mb-8 shrink-0 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="h-5 w-5 text-cyan-400 animate-pulse" />
            <h1 className="text-xl sm:text-2xl font-bold text-neutral-100 uppercase tracking-widest" style={{ fontFamily: "var(--font-space-grotesk)" }}>
              Smart Revision Mode
            </h1>
            <span className="text-[9px] bg-gradient-to-r from-cyan-500/20 to-indigo-500/20 text-cyan-300 font-bold px-2 py-0.5 rounded border border-cyan-500/30 font-mono flex items-center gap-1">
              <Sparkles className="h-3 w-3 text-cyan-400" /> GEMINI AI PREMIUM
            </span>
          </div>
          <p className="text-xs text-neutral-550 max-w-xl leading-relaxed">
            Instantly digest documents into condensed cheat sheets, test your comprehension with interactive flashcards, or take generated mock prep quizzes.
          </p>
        </div>
      </header>

      {/* Inputs Configuration Panel */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8 shrink-0">
        
        {/* Step 1: Input Content */}
        <div className="bg-neutral-900/60 border border-neutral-850 p-5 rounded-2xl shadow-xl flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-neutral-850 pb-2.5">
            <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider font-space">
              1. Input Content
            </span>
            <div className="flex items-center bg-neutral-950 border border-neutral-800 rounded-lg p-0.5 text-[9px] font-bold font-space uppercase">
              <button
                onClick={() => setUseCustomText(false)}
                className={`px-2 py-1 rounded-md transition-colors ${!useCustomText ? "bg-cyan-500 text-neutral-950" : "text-neutral-500 hover:text-neutral-350"}`}
              >
                My Notes
              </button>
              <button
                onClick={() => setUseCustomText(true)}
                className={`px-2 py-1 rounded-md transition-colors ${useCustomText ? "bg-cyan-500 text-neutral-950" : "text-neutral-500 hover:text-neutral-350"}`}
              >
                Custom Text
              </button>
            </div>
          </div>

          {!useCustomText ? (
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-neutral-550 uppercase tracking-wider font-space">Select Note Source</label>
              <div className="relative">
                <select
                  value={selectedNoteId}
                  onChange={(e) => setSelectedNoteId(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 text-neutral-300 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-cyan-500 font-sans appearance-none"
                >
                  <option value="">-- Choose Note Document --</option>
                  {notes
                    .filter((n) => !n.isTrashed)
                    .map((n) => (
                      <option key={n._id} value={n._id}>
                        {n.title}
                      </option>
                    ))}
                </select>
                <ChevronDown className="absolute right-3.5 top-3.5 h-3.5 w-3.5 text-neutral-650 pointer-events-none" />
              </div>
            </div>
          ) : (
            <div className="space-y-1 flex-1 flex flex-col">
              <label className="text-[10px] font-bold text-neutral-550 uppercase tracking-wider font-space">Paste Text Content</label>
              <textarea
                placeholder="Paste paragraph notes, study modules, or key text here to convert..."
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
                className="w-full min-h-[120px] lg:flex-1 bg-neutral-950 border border-neutral-800 text-neutral-300 rounded-xl p-3 text-xs focus:outline-none focus:border-cyan-500 resize-none font-sans leading-relaxed"
              />
            </div>
          )}
        </div>

        {/* Step 2: Revision Mode */}
        <div className="bg-neutral-900/60 border border-neutral-850 p-5 rounded-2xl shadow-xl flex flex-col gap-4">
          <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider font-space border-b border-neutral-850 pb-2.5">
            2. Study Method
          </span>
          <div className="grid grid-cols-1 gap-2.5">
            <button
              onClick={() => setRevisionMode("cheatsheet")}
              className={`flex items-start gap-3.5 p-3.5 border rounded-xl text-left transition-all ${
                revisionMode === "cheatsheet"
                  ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.04)]"
                  : "bg-neutral-950/40 border-neutral-800 hover:border-neutral-750 text-neutral-450 hover:text-neutral-250"
              }`}
            >
              <BookOpen className="h-5 w-5 shrink-0 mt-0.5 text-cyan-500" />
              <div>
                <p className="text-xs font-bold font-space uppercase">Cheat Sheet</p>
                <p className="text-[10px] text-neutral-500 mt-1 leading-snug">Generate highly condensed summaries, glossaries, and important formula indices.</p>
              </div>
            </button>
            <button
              onClick={() => setRevisionMode("flashcards")}
              className={`flex items-start gap-3.5 p-3.5 border rounded-xl text-left transition-all ${
                revisionMode === "flashcards"
                  ? "bg-violet-500/10 border-violet-500/30 text-violet-400 shadow-[0_0_15px_rgba(168,85,247,0.04)]"
                  : "bg-neutral-950/40 border-neutral-800 hover:border-neutral-750 text-neutral-450 hover:text-neutral-250"
              }`}
            >
              <BrainCircuit className="h-5 w-5 shrink-0 mt-0.5 text-violet-400" />
              <div>
                <p className="text-xs font-bold font-space uppercase">Flashcards</p>
                <p className="text-[10px] text-neutral-500 mt-1 leading-snug">Create interactive flip-cards to practice self-testing and spaced recall.</p>
              </div>
            </button>
            <button
              onClick={() => setRevisionMode("quiz")}
              className={`flex items-start gap-3.5 p-3.5 border rounded-xl text-left transition-all ${
                revisionMode === "quiz"
                  ? "bg-amber-500/10 border-amber-500/30 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.04)]"
                  : "bg-neutral-950/40 border-neutral-800 hover:border-neutral-750 text-neutral-450 hover:text-neutral-250"
              }`}
            >
              <HelpCircle className="h-5 w-5 shrink-0 mt-0.5 text-amber-500" />
              <div>
                <p className="text-xs font-bold font-space uppercase">Mock Quiz</p>
                <p className="text-[10px] text-neutral-500 mt-1 leading-snug">Generate multiple-choice questions with real-time feedback and explanation cards.</p>
              </div>
            </button>
          </div>
        </div>

        {/* Step 3: Action & Statistics */}
        <div className="bg-neutral-900/60 border border-neutral-850 p-5 rounded-2xl shadow-xl flex flex-col justify-between gap-6">
          <div>
            <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider font-space border-b border-neutral-850 pb-2.5 block mb-4">
              3. Revision Action
            </span>
            <div className="flex items-center gap-3 px-3 py-3 border border-neutral-800 bg-neutral-950/50 rounded-xl mb-2">
              <Award className="h-5 w-5 text-yellow-500 shrink-0 animate-pulse" />
              <div>
                <p className="text-[10px] font-bold text-neutral-300 font-space uppercase">Study Streak Boost</p>
                <p className="text-[9px] text-neutral-550 leading-relaxed">Earn 5 activity coins on every stack generation to unlock premium files!</p>
              </div>
            </div>
          </div>
          
          <Button
            onClick={handleGenerateStack}
            disabled={isGenerating}
            className="w-full btn-premium-primary h-12 text-sm font-bold uppercase tracking-wider gap-2 flex items-center justify-center cursor-pointer shadow-lg rounded-xl"
            style={{ fontFamily: "var(--font-space-grotesk)" }}
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Digesting study deck...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                <span>Generate revision stack</span>
              </>
            )}
          </Button>
        </div>
      </section>

      {/* Main Results Board Container */}
      <main className="flex-1 min-h-[400px] bg-neutral-900/40 border border-neutral-850 rounded-2xl overflow-hidden flex flex-col shadow-2xl relative mb-6">
        
        {/* Output Header Panel */}
        <div className="px-5 py-3 border-b border-neutral-850 bg-neutral-900/70 flex items-center justify-between shrink-0 select-none">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest font-space">
              Study Workspace
            </span>
          </div>

          {revisionData && (
            <div className="flex items-center gap-2 shrink-0">
              <Button
                onClick={handleCopyContent}
                variant="ghost"
                className="h-7 px-2 hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200 transition-colors gap-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider font-space cursor-pointer"
              >
                <Copy className="h-3.5 w-3.5" />
                <span>Copy</span>
              </Button>
              
              <Button
                onClick={handleSaveToNotes}
                disabled={isSavingNote}
                className="bg-neutral-950 border border-neutral-850 hover:bg-neutral-850 text-cyan-400 hover:text-cyan-300 transition-colors font-bold h-7 px-3.5 rounded-md text-[10px] flex items-center justify-center gap-1.5 font-space uppercase cursor-pointer"
              >
                {isSavingNote ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Save className="h-3.5 w-3.5" />
                )}
                <span>Save to Notes</span>
              </Button>
            </div>
          )}
        </div>

        {/* Output Body Content */}
        <div className="flex-1 p-5 sm:p-6 overflow-y-auto custom-scroll">
          {isGenerating ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-20 gap-4">
              <Loader2 className="h-10 w-10 animate-spin text-cyan-400" />
              <div>
                <p className="text-sm font-bold text-neutral-200 uppercase tracking-widest font-space">AI Studying Agent Active</p>
                <p className="text-[11px] text-neutral-500 italic mt-1.5">Parsing document structure, building quizzes and spaced flashcard indices...</p>
              </div>
            </div>
          ) : !revisionData ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-24 select-none">
              <BrainCircuit className="h-12 w-12 text-neutral-800 mb-3 animate-pulse opacity-60" />
              <p className="text-sm font-bold text-neutral-300 uppercase tracking-wider font-space">Revision Deck Empty</p>
              <p className="text-[11px] text-neutral-550 max-w-sm mt-1 leading-relaxed">
                Choose a note or paste your study material above, select your preferred revision method, and generate!
              </p>
            </div>
          ) : (
            <div className="space-y-8 animate-fade-in select-text">
              
              {/* Revision Title */}
              <div className="border-b border-neutral-850 pb-4">
                <h2 className="text-lg font-bold text-neutral-100" style={{ fontFamily: "var(--font-space-grotesk)" }}>
                  {revisionData.title}
                </h2>
                <span className="text-[9px] bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 font-bold px-2 py-0.5 rounded font-mono uppercase tracking-widest mt-2 inline-block">
                  {revisionData.type === "cheatsheet" ? "Cheat Sheet Summary" : revisionData.type === "flashcards" ? "Spaced Flashcards" : "Mock Practice Quiz"}
                </span>
              </div>

              {/* RENDER MODE: CHEAT SHEET */}
              {revisionData.type === "cheatsheet" && revisionData.cheatsheet && (
                <div className="grid grid-cols-1 gap-6">
                  
                  {/* Summary Block */}
                  <div className="bg-neutral-950/40 border border-neutral-855 rounded-2xl p-5 shadow-inner">
                    <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-wider font-space mb-3 flex items-center gap-1.5 select-none">
                      <BookOpen className="h-4 w-4" /> Summary Overview
                    </h3>
                    <p className="text-xs text-neutral-300 leading-relaxed whitespace-pre-wrap font-sans">
                      {revisionData.cheatsheet.summary}
                    </p>
                  </div>

                  {/* Concepts & Formulas Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    {/* Glossary */}
                    <div className="bg-neutral-950/20 border border-neutral-850 rounded-2xl p-5 flex flex-col gap-4">
                      <h3 className="text-xs font-bold text-violet-400 uppercase tracking-wider font-space border-b border-neutral-900 pb-2 select-none">
                        Glossary & Key Concepts
                      </h3>
                      {revisionData.cheatsheet.concepts && revisionData.cheatsheet.concepts.length > 0 ? (
                        <div className="space-y-4">
                          {revisionData.cheatsheet.concepts.map((c, idx) => (
                            <div key={idx} className="space-y-1 group">
                              <h4 className="text-[11px] font-bold text-neutral-200 group-hover:text-cyan-400 transition-colors">
                                {c.term}
                              </h4>
                              <p className="text-xs text-neutral-400 leading-relaxed font-sans">{c.definition}</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-neutral-600 italic">No key concepts identified.</p>
                      )}
                    </div>

                    {/* Formulas / Rules */}
                    <div className="bg-neutral-950/20 border border-neutral-850 rounded-2xl p-5 flex flex-col gap-4">
                      <h3 className="text-xs font-bold text-amber-500 uppercase tracking-wider font-space border-b border-neutral-900 pb-2 select-none">
                        Equations & Critical Rules
                      </h3>
                      {revisionData.cheatsheet.formulas && revisionData.cheatsheet.formulas.length > 0 ? (
                        <div className="space-y-4">
                          {revisionData.cheatsheet.formulas.map((f, idx) => (
                            <div key={idx} className="bg-neutral-950/50 border border-neutral-855 rounded-xl p-3.5 space-y-1.5">
                              <h4 className="text-[10px] font-bold text-neutral-300 font-space uppercase tracking-wider">
                                {f.name}
                              </h4>
                              <pre className="text-xs text-amber-400 font-mono overflow-x-auto whitespace-pre bg-black/40 p-2 rounded-lg leading-relaxed">
                                {f.description}
                              </pre>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-neutral-600 italic">No explicit formulas or numerical laws in notes.</p>
                      )}
                    </div>
                  </div>

                  {/* Highlights Bullet List */}
                  <div className="bg-neutral-950/20 border border-neutral-850 rounded-2xl p-5">
                    <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider font-space border-b border-neutral-900 pb-2 mb-3 select-none">
                      Critical Takeaways
                    </h3>
                    <ul className="space-y-2.5">
                      {revisionData.cheatsheet.highlights.map((h, idx) => (
                        <li key={idx} className="flex gap-2.5 text-xs text-neutral-300 leading-relaxed font-sans">
                          <span className="text-cyan-400 font-mono shrink-0">✓</span>
                          <span>{h}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                </div>
              )}

              {/* RENDER MODE: FLASHCARDS */}
              {revisionData.type === "flashcards" && revisionData.flashcards && (
                <div className="flex flex-col items-center justify-center py-6 gap-6 select-none">
                  
                  {/* Card Container */}
                  <div 
                    onClick={() => setIsFlashcardFlipped(!isFlashcardFlipped)}
                    className="w-full max-w-lg aspect-[8/5] cursor-pointer group perspective-1000"
                  >
                    <div className={`w-full h-full relative transition-transform duration-500 shadow-2xl rounded-2xl border border-neutral-800 preserve-3d ${isFlashcardFlipped ? "rotate-y-180" : ""}`}>
                      
                      {/* FRONT CARD SIDE */}
                      <div className="absolute inset-0 w-full h-full backface-hidden bg-neutral-900 flex flex-col justify-between p-6 sm:p-8 rounded-2xl">
                        <div className="flex items-center justify-between text-[10px] text-neutral-500 font-mono uppercase tracking-widest">
                          <span>Card Question</span>
                          <span>{activeFlashcardIndex + 1} / {revisionData.flashcards.length}</span>
                        </div>
                        <div className="flex-1 flex items-center justify-center text-center px-4">
                          <p className="text-sm sm:text-base font-semibold leading-relaxed text-neutral-100 group-hover:text-cyan-400 transition-colors">
                            {revisionData.flashcards[activeFlashcardIndex].question}
                          </p>
                        </div>
                        <div className="text-center text-[9px] text-neutral-500 font-space uppercase tracking-wider">
                          Tap card to reveal answer
                        </div>
                      </div>

                      {/* BACK CARD SIDE */}
                      <div className="absolute inset-0 w-full h-full backface-hidden bg-neutral-900 border-2 border-violet-500/20 flex flex-col justify-between p-6 sm:p-8 rounded-2xl [transform:rotateY(180deg)]">
                        <div className="flex items-center justify-between text-[10px] text-violet-400 font-mono uppercase tracking-widest">
                          <span>Answer Sheet</span>
                          <span>{activeFlashcardIndex + 1} / {revisionData.flashcards.length}</span>
                        </div>
                        <div className="flex-1 flex items-center justify-center text-center px-4 overflow-y-auto custom-scroll py-2">
                          <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed select-text">
                            {revisionData.flashcards[activeFlashcardIndex].answer}
                          </p>
                        </div>
                        <div className="text-center text-[9px] text-violet-400 font-space uppercase tracking-wider animate-pulse">
                          Tap card to see question
                        </div>
                      </div>

                    </div>
                  </div>

                  {/* Navigation Arrows */}
                  <div className="flex items-center gap-4">
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsFlashcardFlipped(false);
                        setTimeout(() => {
                          setActiveFlashcardIndex(prev => Math.max(0, prev - 1));
                        }, 100);
                      }}
                      disabled={activeFlashcardIndex === 0}
                      variant="ghost"
                      className="h-9 w-9 rounded-full border border-neutral-800 text-neutral-400 hover:text-neutral-100 flex items-center justify-center transition-colors cursor-pointer"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </Button>
                    
                    <span className="text-xs font-mono font-bold text-neutral-400">
                      {activeFlashcardIndex + 1} / {revisionData.flashcards.length}
                    </span>

                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsFlashcardFlipped(false);
                        setTimeout(() => {
                          setActiveFlashcardIndex(prev => Math.min(revisionData.flashcards!.length - 1, prev + 1));
                        }, 100);
                      }}
                      disabled={activeFlashcardIndex === revisionData.flashcards.length - 1}
                      variant="ghost"
                      className="h-9 w-9 rounded-full border border-neutral-800 text-neutral-400 hover:text-neutral-100 flex items-center justify-center transition-colors cursor-pointer"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </Button>
                  </div>

                </div>
              )}

              {/* RENDER MODE: QUIZ */}
              {revisionData.type === "quiz" && revisionData.quiz && (
                <div className="space-y-8 select-none">
                  {revisionData.quiz.map((q, qIdx) => {
                    const isChecked = !!checkedQuestions[qIdx];
                    const selectedOption = selectedAnswers[qIdx];
                    
                    return (
                      <div key={qIdx} className="bg-neutral-950/30 border border-neutral-850 rounded-2xl p-5 sm:p-6 space-y-4">
                        <div className="flex items-start justify-between gap-3 select-none">
                          <h3 className="text-xs sm:text-sm font-bold text-neutral-200 leading-snug">
                            <span className="text-cyan-400 font-mono mr-1">Q{qIdx + 1}.</span> {q.question}
                          </h3>
                          {isChecked && (
                            selectedOption === q.correctAnswerIndex ? (
                              <span className="text-[9px] bg-green-500/10 border border-green-500/30 text-green-400 font-bold px-2 py-0.5 rounded font-mono uppercase shrink-0">
                                Correct
                              </span>
                            ) : (
                              <span className="text-[9px] bg-red-500/10 border border-red-500/30 text-red-400 font-bold px-2 py-0.5 rounded font-mono uppercase shrink-0">
                                Incorrect
                              </span>
                            )
                          )}
                        </div>

                        {/* Quiz Options List */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {q.options.map((opt, oIdx) => {
                            const isSelected = selectedOption === oIdx;
                            const isCorrect = oIdx === q.correctAnswerIndex;
                            let btnStyle = "bg-neutral-950/40 border-neutral-800 hover:border-neutral-700 text-neutral-300";
                            
                            if (isChecked) {
                              if (isCorrect) {
                                btnStyle = "bg-green-500/10 border-green-500/40 text-green-400";
                              } else if (isSelected) {
                                btnStyle = "bg-red-500/10 border-red-500/40 text-red-400";
                              } else {
                                btnStyle = "bg-neutral-950/10 border-neutral-850/30 text-neutral-500 opacity-60";
                              }
                            } else if (isSelected) {
                              btnStyle = "bg-cyan-500/10 border-cyan-500/40 text-cyan-400";
                            }

                            return (
                              <button
                                key={oIdx}
                                disabled={isChecked}
                                onClick={() => setSelectedAnswers(prev => ({ ...prev, [qIdx]: oIdx }))}
                                className={`p-3.5 border rounded-xl text-left text-xs transition-all font-sans cursor-pointer ${btnStyle}`}
                              >
                                <span className="font-bold font-mono mr-2">{String.fromCharCode(65 + oIdx)}.</span> {opt}
                              </button>
                            );
                          })}
                        </div>

                        {/* Explanation Panel */}
                        {isChecked && (
                          <div className="bg-neutral-950/80 border border-neutral-850 rounded-xl p-4 text-[11px] leading-relaxed text-neutral-400 select-text font-sans">
                            <span className="font-bold text-neutral-300 uppercase tracking-wide font-space text-[10px] block mb-1">
                              Explanation Glossary
                            </span>
                            {q.explanation}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* Check Score Actions row */}
                  {quizScore === null ? (
                    <div className="pt-4 flex justify-end shrink-0 select-none">
                      <Button
                        onClick={handleCheckQuizAnswers}
                        disabled={Object.keys(selectedAnswers).length < revisionData.quiz.length}
                        className="btn-premium-primary text-xs font-bold px-6 h-10 uppercase tracking-wider cursor-pointer"
                        style={{ fontFamily: "var(--font-space-grotesk)" }}
                      >
                        Submit quiz answers
                      </Button>
                    </div>
                  ) : (
                    <div className="pt-4 bg-neutral-950/40 border border-neutral-850 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4 select-none">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                          <Award className="h-5 w-5 animate-bounce" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-neutral-200 font-space uppercase">Quiz Review Completed</p>
                          <p className="text-[10px] text-neutral-500 mt-0.5">Scored {quizScore} / {revisionData.quiz.length} ({Math.round((quizScore / revisionData.quiz.length) * 100)}% accuracy)</p>
                        </div>
                      </div>
                      <Button
                        onClick={() => {
                          setSelectedAnswers({});
                          setCheckedQuestions({});
                          setQuizScore(null);
                        }}
                        variant="ghost"
                        className="border border-neutral-800 hover:bg-neutral-800 text-neutral-400 hover:text-neutral-100 text-xs font-bold px-5 h-10 uppercase tracking-wider font-space cursor-pointer"
                      >
                        <RefreshCw className="h-3.5 w-3.5 mr-1" /> Reset quiz
                      </Button>
                    </div>
                  )}

                </div>
              )}

            </div>
          )}
        </div>
      </main>

    </div>
  );
}
