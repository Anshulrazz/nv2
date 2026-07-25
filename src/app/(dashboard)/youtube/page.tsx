"use client";

import React, { useState } from "react";
import { useWorkspaceStore } from "@/stores/workspaceStore";
import { toast } from "sonner";
import {
  Play,
  Loader2,
  BookOpen,
  Save,
  Award,
  HelpCircle,
  RefreshCw,
  Copy,
  Film,
  FileText,
  Bookmark,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface KeyPoint {
  term: string;
  definition: string;
}

interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
}

interface YouTubeStudyPackage {
  title: string;
  author: string;
  thumbnailUrl: string;
  summary: string;
  keyPoints: KeyPoint[];
  notes: string;
  quiz: QuizQuestion[];
}

export default function YouTubeLearningPage() {
  const { createNote, updateNote } = useWorkspaceStore();
  const [youtubeUrl, setYoutubeUrl] = useState<string>("");
  const [isDigesting, setIsDigesting] = useState<boolean>(false);
  const [studyData, setStudyData] = useState<YouTubeStudyPackage | null>(null);
  
  // Dashboard tab selector state
  const [activeTab, setActiveTab] = useState<"summary" | "keypoints" | "notes" | "quiz">("summary");

  // Interactive Quiz states
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [checkedQuestions, setCheckedQuestions] = useState<Record<number, boolean>>({});
  const [quizScore, setQuizScore] = useState<number | null>(null);
  const [isSavingNote, setIsSavingNote] = useState<boolean>(false);

  // Trigger digestion of YouTube Video URL
  const handleDigestVideo = async () => {
    if (!youtubeUrl.trim()) {
      toast.error("Please enter a valid YouTube video URL.");
      return;
    }

    setIsDigesting(true);
    setStudyData(null);
    setSelectedAnswers({});
    setCheckedQuestions({});
    setQuizScore(null);
    setActiveTab("summary");

    try {
      const res = await fetch("/api/youtube", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: youtubeUrl }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to parse video content.");
      }

      setStudyData(data);
      toast.success("YouTube video digested into study guide!");
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Error digesting YouTube video.");
    } finally {
      setIsDigesting(false);
    }
  };

  // Convert study materials into TipTap Rich Text Format for Note Saver
  const handleSaveToNotes = async () => {
    if (!studyData) return;
    setIsSavingNote(true);

    try {
      const title = `YouTube notes: ${studyData.title}`;
      const newNote = await createNote(title, null);
      if (!newNote) throw new Error("Failed to create document.");

      // Formulate content nodes representing summary and study guides
      const docContent: Record<string, unknown>[] = [
        {
          type: "heading",
          attrs: { level: 2 },
          content: [{ type: "text", text: title }],
        },
        {
          type: "paragraph",
          content: [
            { type: "text", text: `Source Channel: ${studyData.author}`, attrs: { italic: true } }
          ]
        },
        { type: "heading", attrs: { level: 3 }, content: [{ type: "text", text: "Digest Summary" }] },
        { type: "paragraph", content: [{ type: "text", text: studyData.summary }] }
      ];

      // Append Key Points glossary
      if (studyData.keyPoints && studyData.keyPoints.length > 0) {
        docContent.push({ type: "heading", attrs: { level: 3 }, content: [{ type: "text", text: "Key Terminology" }] });
        studyData.keyPoints.forEach(kp => {
          docContent.push({
            type: "paragraph",
            content: [
              { type: "text", text: `${kp.term}: `, attrs: { bold: true } },
              { type: "text", text: kp.definition }
            ]
          });
        });
      }

      // Append Study Notes Markdown
      docContent.push(
        { type: "heading", attrs: { level: 3 }, content: [{ type: "text", text: "Detailed Notes" }] }
      );
      
      studyData.notes.split("\n\n").forEach(p => {
        if (p.trim()) {
          if (p.startsWith("###")) {
            docContent.push({ type: "heading", attrs: { level: 4 }, content: [{ type: "text", text: p.replace("###", "").trim() }] });
          } else if (p.startsWith("####")) {
            docContent.push({ type: "heading", attrs: { level: 5 }, content: [{ type: "text", text: p.replace("####", "").trim() }] });
          } else if (p.startsWith("-")) {
            // Simplistic parsing for bullet points
            const bullets = p.split("\n").map(b => b.replace("-", "").trim());
            bullets.forEach(b => {
              docContent.push({ type: "paragraph", content: [{ type: "text", text: `• ${b}` }] });
            });
          } else {
            docContent.push({ type: "paragraph", content: [{ type: "text", text: p.trim() }] });
          }
        }
      });

      // Append Quiz Guide
      if (studyData.quiz && studyData.quiz.length > 0) {
        docContent.push({ type: "heading", attrs: { level: 3 }, content: [{ type: "text", text: "Mock Practice Quiz" }] });
        studyData.quiz.forEach((q, idx) => {
          docContent.push(
            { type: "paragraph", content: [{ type: "text", text: `Q${idx + 1}: ${q.question}`, attrs: { bold: true } }] },
            ...q.options.map((opt, oIdx) => ({
              type: "paragraph",
              content: [{ type: "text", text: `[${String.fromCharCode(65 + oIdx)}] ${opt}` }]
            })),
            { type: "paragraph", content: [{ type: "text", text: `Explanation: ${q.explanation}`, attrs: { italic: true } }] }
          );
        });
      }

      const defaultContent = {
        type: "doc",
        content: docContent,
      };

      await updateNote(newNote._id, { content: defaultContent });
      toast.success("YouTube study guide saved to Notes! You can view it from the sidebar.");
    } catch (err) {
      console.error(err);
      toast.error("Failed to save YouTube study notes to your workspace.");
    } finally {
      setIsSavingNote(false);
    }
  };

  // Submit and grade quiz answers
  const handleCheckQuizAnswers = () => {
    if (!studyData?.quiz) return;
    const questions = studyData.quiz;
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
    if (!studyData) return;
    let textToCopy = `YouTube Study Guide: ${studyData.title}\nAuthor: ${studyData.author}\n\n`;
    textToCopy += `Summary:\n${studyData.summary}\n\n`;
    textToCopy += `Key Terminology:\n`;
    studyData.keyPoints.forEach(kp => { textToCopy += `- ${kp.term}: ${kp.definition}\n`; });
    textToCopy += `\nDetailed Study Notes:\n${studyData.notes}\n\n`;
    textToCopy += `Mock Practice Quiz:\n`;
    studyData.quiz.forEach((q, idx) => {
      textToCopy += `${idx + 1}. ${q.question}\n`;
      q.options.forEach((opt, oIdx) => { textToCopy += `  ${String.fromCharCode(65 + oIdx)}) ${opt}\n`; });
      textToCopy += `Answer: ${String.fromCharCode(65 + q.correctAnswerIndex)}\nExplanation: ${q.explanation}\n\n`;
    });

    navigator.clipboard.writeText(textToCopy);
    toast.success("YouTube study text copied to clipboard!");
  };

  const renderNotesContent = (notesText: string) => {
    const lines = notesText.split("\n");
    const elements: React.ReactNode[] = [];
    
    let currentCodeBlock: string[] | null = null;
    let currentListItems: string[] | null = null;

    for (let idx = 0; idx < lines.length; idx++) {
      const line = lines[idx];
      const trimmed = line.trim();

      // Code Block Detection
      if (trimmed.startsWith("```")) {
        if (currentCodeBlock) {
          // Close Code Block
          elements.push(
            <pre key={`code-${idx}`} className="bg-black/60 border border-neutral-855 p-4 rounded-xl text-amber-450 font-mono text-[11px] overflow-x-auto leading-relaxed my-3 whitespace-pre select-text">
              {currentCodeBlock.join("\n")}
            </pre>
          );
          currentCodeBlock = null;
        } else {
          // Open Code Block
          currentCodeBlock = [];
        }
        continue;
      }

      if (currentCodeBlock !== null) {
        currentCodeBlock.push(line);
        continue;
      }

      // Bullet List Detection
      if (trimmed.startsWith("-") || trimmed.startsWith("*")) {
        if (!currentListItems) {
          currentListItems = [];
        }
        currentListItems.push(trimmed.substring(1).trim());
        continue;
      } else if (currentListItems) {
        // Flush previous bullet list if we hit a non-bullet line
        elements.push(
          <ul key={`list-${idx}`} className="list-disc pl-5 space-y-1.5 text-neutral-450 my-2.5 font-sans text-xs leading-relaxed select-text">
            {currentListItems.map((item, itemIdx) => (
              <li key={itemIdx}>{item}</li>
            ))}
          </ul>
        );
        currentListItems = null;
      }

      // Headers Detection
      if (trimmed.startsWith("###")) {
        elements.push(
          <h4 key={`h4-${idx}`} className="text-sm font-bold text-neutral-200 pt-3 pb-1 font-space uppercase tracking-wider select-text">
            {trimmed.replace(/^###\s*/, "")}
          </h4>
        );
        continue;
      }

      if (trimmed.startsWith("####")) {
        elements.push(
          <h5 key={`h5-${idx}`} className="text-xs font-bold text-neutral-300 pt-2 pb-0.5 font-space tracking-wide select-text">
            {trimmed.replace(/^####\s*/, "")}
          </h5>
        );
        continue;
      }

      // Empty Lines
      if (!trimmed) {
        continue;
      }

      // Standard Paragraph
      elements.push(
        <p key={`p-${idx}`} className="text-xs text-neutral-350 leading-relaxed font-sans mb-3.5 select-text">
          {trimmed}
        </p>
      );
    }

    // Flush any trailing lists or code blocks
    if (currentListItems) {
      const items = currentListItems as string[];
      elements.push(
        <ul key="list-trail" className="list-disc pl-5 space-y-1.5 text-neutral-455 my-2.5 font-sans text-xs leading-relaxed select-text">
          {items.map((item, itemIdx) => (
            <li key={itemIdx}>{item}</li>
          ))}
        </ul>
      );
    }
    if (currentCodeBlock && currentCodeBlock.length > 0) {
      const block = currentCodeBlock as string[];
      elements.push(
        <pre key="code-trail" className="bg-black/60 border border-neutral-855 p-4 rounded-xl text-amber-455 font-mono text-[11px] overflow-x-auto leading-relaxed my-3 whitespace-pre select-text">
          {block.join("\n")}
        </pre>
      );
    }

    return elements;
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-neutral-950 overflow-y-auto custom-scroll p-4 sm:p-6 lg:p-8 select-none relative">
      
      {/* Page Header */}
      <header className="mb-6 sm:mb-8 shrink-0">
        <div className="flex items-center gap-2 mb-1">
          <Play className="h-6 w-6 text-red-500 animate-pulse" />
          <h1 className="text-xl sm:text-2xl font-bold text-neutral-100 uppercase tracking-widest" style={{ fontFamily: "var(--font-space-grotesk)" }}>
            YouTube Learning Workspace
          </h1>
          <span className="text-[9px] bg-gradient-to-r from-red-500/20 to-amber-500/20 text-red-300 font-bold px-2 py-0.5 rounded border border-red-500/30 font-mono flex items-center gap-1">
            <Film className="h-3 w-3 text-red-400" /> GEMINI AI PREMIUM
          </span>
        </div>
        <p className="text-xs text-neutral-550 max-w-xl leading-relaxed">
          Paste any YouTube tutorial URL to retrieve video details, generate notes, summarize core lessons, list key glossary terms, and test your knowledge.
        </p>
      </header>

      {/* URL Input Box */}
      <section className="bg-neutral-900/60 border border-neutral-850 p-5 rounded-2xl shadow-xl shrink-0 mb-8 max-w-4xl">
        <label className="text-[10px] font-bold text-neutral-550 uppercase tracking-wider font-space block mb-2">Paste YouTube Video Link</label>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Film className="absolute left-3.5 top-3.5 h-4 w-4 text-neutral-600" />
            <Input
              type="text"
              placeholder="e.g. https://www.youtube.com/watch?v=dQw4w9WgXcQ"
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              className="bg-neutral-950/80 border-neutral-800 text-neutral-350 focus:border-cyan-500 pl-11 h-11 text-xs rounded-xl"
            />
          </div>
          <Button
            onClick={handleDigestVideo}
            disabled={isDigesting}
            className="btn-premium-primary text-xs font-bold uppercase tracking-wider h-11 px-6 rounded-xl flex items-center justify-center gap-1.5 shrink-0 cursor-pointer shadow-lg"
            style={{ fontFamily: "var(--font-space-grotesk)" }}
          >
            {isDigesting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Digesting Video...</span>
              </>
            ) : (
              <>
                <Play className="h-4 w-4" />
                <span>Digest Video</span>
              </>
            )}
          </Button>
        </div>
      </section>

      {/* Main Workspace Body container */}
      <main className="flex-1 min-h-[500px] bg-neutral-900/40 border border-neutral-850 rounded-2xl overflow-hidden flex flex-col shadow-2xl relative mb-6">
        
        {/* Output Header Panel */}
        <div className="px-5 py-3 border-b border-neutral-850 bg-neutral-900/70 flex flex-col sm:flex-row justify-between sm:items-center gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest font-space">
              Study Material Desk
            </span>
          </div>

          {studyData && (
            <div className="flex items-center gap-2 shrink-0">
              <Button
                onClick={handleCopyContent}
                variant="ghost"
                className="h-7 px-2 hover:bg-neutral-800 text-neutral-450 hover:text-neutral-200 transition-colors gap-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider font-space cursor-pointer"
              >
                <Copy className="h-3.5 w-3.5" />
                <span>Copy</span>
              </Button>
              
              <Button
                onClick={handleSaveToNotes}
                disabled={isSavingNote}
                className="bg-neutral-950 border border-neutral-850 hover:bg-neutral-850 text-cyan-400 hover:text-cyan-305 transition-colors font-bold h-7 px-3.5 rounded-md text-[10px] flex items-center justify-center gap-1.5 font-space uppercase cursor-pointer"
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
        <div className="flex-1 flex flex-col min-h-0 overflow-y-auto custom-scroll">
          {isDigesting ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-24 gap-4">
              <Loader2 className="h-10 w-10 animate-spin text-red-500" />
              <div>
                <p className="text-sm font-bold text-neutral-200 uppercase tracking-widest font-space">AI Studying Agent Parsing Video</p>
                <p className="text-[11px] text-neutral-500 italic mt-1.5">Fetching oEmbed video info, structural summaries, quiz questions, and study guides...</p>
              </div>
            </div>
          ) : !studyData ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-32 select-none">
              <Play className="h-12 w-12 text-neutral-800 mb-3 animate-pulse opacity-50" />
ay              <p className="text-sm font-bold text-neutral-300 uppercase tracking-wider font-space">YouTube Study Deck Empty</p>
              <p className="text-[11px] text-neutral-550 max-w-sm mt-1 leading-relaxed">
                Paste any standard YouTube video URL (e.g. tutorials, video lectures, coding guides) above and digest to begin generating study stacks!
              </p>
            </div>
          ) : (
            <div className="flex-1 flex flex-col min-h-0 animate-fade-in">
              
              {/* Video oEmbed details card section */}
              <div className="bg-neutral-950/60 p-5 sm:p-6 border-b border-neutral-850 flex flex-col sm:flex-row gap-5 items-start">
                {studyData.thumbnailUrl && (
                  <div className="relative w-full sm:w-44 aspect-video rounded-xl overflow-hidden border border-neutral-850 flex-shrink-0 shadow-lg">
                    <img
                      src={studyData.thumbnailUrl}
                      alt={studyData.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent flex items-end p-2.5">
                      <span className="text-[8px] bg-red-600 text-white font-bold px-1.5 py-0.5 rounded font-mono uppercase tracking-wider flex items-center gap-0.5 select-none">
                        <Film className="h-2 w-2" /> Video source
                      </span>
                    </div>
                  </div>
                )}
                <div className="space-y-1.5 select-text">
                  <h2 className="text-base font-bold text-neutral-100 leading-snug" style={{ fontFamily: "var(--font-space-grotesk)" }}>
                    {studyData.title}
                  </h2>
                  <p className="text-xs text-neutral-500 font-mono">
                    Channel: <span className="text-cyan-400 font-semibold">{studyData.author}</span>
                  </p>
                  <p className="text-[11px] text-neutral-450 leading-relaxed font-sans mt-2 pt-1 border-t border-neutral-900/60">
                    {studyData.summary.substring(0, 180)}...
                  </p>
                </div>
              </div>

              {/* Study Panel tabs selectors */}
              <div className="bg-neutral-900/30 border-b border-neutral-850 flex select-none text-xs font-bold font-space uppercase">
                <button
                  onClick={() => setActiveTab("summary")}
                  className={`px-5 py-3 border-b-2 transition-all cursor-pointer ${
                    activeTab === "summary" ? "border-cyan-500 text-cyan-400 bg-cyan-500/5" : "border-transparent text-neutral-450 hover:text-neutral-250"
                  }`}
                >
                  <BookOpen className="h-3.5 w-3.5 inline mr-1.5" /> Summary
                </button>
                <button
                  onClick={() => setActiveTab("keypoints")}
                  className={`px-5 py-3 border-b-2 transition-all cursor-pointer ${
                    activeTab === "keypoints" ? "border-violet-500 text-violet-400 bg-violet-500/5" : "border-transparent text-neutral-450 hover:text-neutral-250"
                  }`}
                >
                  <Bookmark className="h-3.5 w-3.5 inline mr-1.5" /> Key Points
                </button>
                <button
                  onClick={() => setActiveTab("notes")}
                  className={`px-5 py-3 border-b-2 transition-all cursor-pointer ${
                    activeTab === "notes" ? "border-amber-500 text-amber-500 bg-amber-500/5" : "border-transparent text-neutral-450 hover:text-neutral-250"
                  }`}
                >
                  <FileText className="h-3.5 w-3.5 inline mr-1.5" /> Lecture Notes
                </button>
                <button
                  onClick={() => setActiveTab("quiz")}
                  className={`px-5 py-3 border-b-2 transition-all cursor-pointer ${
                    activeTab === "quiz" ? "border-red-500 text-red-400 bg-red-500/5" : "border-transparent text-neutral-450 hover:text-neutral-250"
                  }`}
                >
                  <HelpCircle className="h-3.5 w-3.5 inline mr-1.5" /> Mock Quiz
                </button>
              </div>

              {/* Tabs Output display area */}
              <div className="flex-1 p-5 sm:p-6 select-text">
                
                {/* TAB: SUMMARY */}
                {activeTab === "summary" && (
                  <div className="space-y-4 animate-fade-in">
                    <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-wider font-space flex items-center gap-1.5 border-b border-neutral-900 pb-2 select-none">
                      Video summary
                    </h3>
                    <p className="text-xs text-neutral-300 leading-relaxed whitespace-pre-wrap font-sans">
                      {studyData.summary}
                    </p>
                  </div>
                )}

                {/* TAB: KEY POINTS */}
                {activeTab === "keypoints" && (
                  <div className="space-y-4 animate-fade-in">
                    <h3 className="text-xs font-bold text-violet-400 uppercase tracking-wider font-space flex items-center gap-1.5 border-b border-neutral-900 pb-2 select-none">
                      Key Terminology & Concepts
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {studyData.keyPoints.map((kp, idx) => (
                        <div key={idx} className="bg-neutral-950/20 border border-neutral-850 p-4 rounded-xl flex flex-col gap-1 transition-all hover:border-violet-500/20">
                          <h4 className="text-[11px] font-bold text-neutral-200">
                            {kp.term}
                          </h4>
                          <p className="text-xs text-neutral-450 leading-relaxed font-sans">{kp.definition}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* TAB: LECTURE NOTES */}
                {activeTab === "notes" && (
                  <div className="space-y-4 animate-fade-in">
                    <h3 className="text-xs font-bold text-amber-500 uppercase tracking-wider font-space flex items-center gap-1.5 border-b border-neutral-900 pb-2 select-none">
                      Digested Study Guide
                    </h3>
                    <div className="bg-neutral-950/20 border border-neutral-850 p-5 rounded-2xl markdown-view text-xs leading-relaxed text-neutral-350 font-sans space-y-2.5 max-w-4xl">
                      {renderNotesContent(studyData.notes)}
                    </div>
                  </div>
                )}

                {/* TAB: MOCK QUIZ */}
                {activeTab === "quiz" && (
                  <div className="space-y-8 animate-fade-in">
                    <h3 className="text-xs font-bold text-red-400 uppercase tracking-wider font-space flex items-center gap-1.5 border-b border-neutral-900 pb-2 select-none">
                      Lecture Practice Quiz
                    </h3>
                    
                    <div className="space-y-8">
                      {studyData.quiz.map((q, qIdx) => {
                        const isChecked = !!checkedQuestions[qIdx];
                        const selectedOption = selectedAnswers[qIdx];

                        return (
                          <div key={qIdx} className="bg-neutral-950/30 border border-neutral-850 rounded-2xl p-5 sm:p-6 space-y-4 max-w-4xl">
                            <div className="flex items-start justify-between gap-3 select-none">
                              <h4 className="text-xs sm:text-sm font-bold text-neutral-200 leading-snug">
                                <span className="text-red-400 font-mono mr-1">Q{qIdx + 1}.</span> {q.question}
                              </h4>
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

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 select-none">
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
                                  btnStyle = "bg-red-500/10 border-red-500/40 text-red-400";
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

                            {isChecked && (
                              <div className="bg-neutral-950/80 border border-neutral-850 rounded-xl p-4 text-[11px] leading-relaxed text-neutral-405 select-text font-sans">
                                <span className="font-bold text-neutral-300 uppercase tracking-wide font-space text-[10px] block mb-1">
                                  Explanation Glossary
                                </span>
                                {q.explanation}
                              </div>
                            )}
                          </div>
                        );
                      })}

                      {quizScore === null ? (
                        <div className="pt-4 flex justify-end max-w-4xl select-none">
                          <Button
                            onClick={handleCheckQuizAnswers}
                            disabled={Object.keys(selectedAnswers).length < studyData.quiz.length}
                            className="btn-premium-primary text-xs font-bold px-6 h-10 uppercase tracking-wider cursor-pointer rounded-xl"
                            style={{ fontFamily: "var(--font-space-grotesk)" }}
                          >
                            Submit quiz answers
                          </Button>
                        </div>
                      ) : (
                        <div className="pt-4 bg-neutral-950/40 border border-neutral-850 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4 max-w-4xl select-none">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400">
                              <Award className="h-5 w-5 animate-bounce" />
                            </div>
                            <div>
                              <p className="text-xs font-bold text-neutral-200 font-space uppercase">Quiz Review Completed</p>
                              <p className="text-[10px] text-neutral-500 mt-0.5">Scored {quizScore} / {studyData.quiz.length} ({Math.round((quizScore / studyData.quiz.length) * 100)}% accuracy)</p>
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
                  </div>
                )}

              </div>

            </div>
          )}
        </div>

      </main>

    </div>
  );
}
