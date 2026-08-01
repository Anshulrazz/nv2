"use client";

import { useState, useEffect } from "react";
import {
  Play,
  Sparkles,
  BookOpen,
  ListChecks,
  HelpCircle,
  Lightbulb,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronUp,
  History,
  Award,
  Zap,
  RotateCcw,
  Loader2,
  Flame,
  Globe2,
  HelpCircle as QuestionIcon,
  Compass,
} from "lucide-react";
import { MarkdownRenderer } from "@/components/ui/MarkdownRenderer";
import { toast } from "sonner";

interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

interface LectureSegment {
  title: string;
  startApproxTimestamp?: string;
  content: string;
  wordCount: number;
}

interface BeyondTheVideo {
  funFacts: string[];
  realWorldConnections: string[];
  commonMisconceptions: string[];
  furtherExploration: string[];
}

interface VideoSummaryData {
  _id: string;
  videoId: string;
  url: string;
  title: string;
  channelName?: string;
  thumbnailUrl?: string;
  durationSeconds?: number;
  summary: string;
  keyPoints: string[];
  lectures: LectureSegment[];
  quiz: QuizQuestion[];
  beyondTheVideo: BeyondTheVideo;
  subject?: string;
  examTags?: string[];
  createdAt: string;
}

interface QuizAttemptResult {
  score: number;
  totalQuestions: number;
  percentage: number;
  xpAwarded: number;
  isFirstAttempt: boolean;
  results: Array<{
    questionIndex: number;
    question: string;
    options: string[];
    selectedIndex: number;
    correctIndex: number;
    isCorrect: boolean;
    explanation: string;
  }>;
}

const PIPELINE_STEPS = [
  "Fetching video transcript & metadata...",
  "Analyzing lecture structure & topics...",
  "Writing 1000+ word detailed lecture notes...",
  "Generating high-yield exam quiz MCQs...",
  "Crafting 'Beyond the Video' bonus content...",
];

export default function YouTubeSummarizerPage() {
  const [urlInput, setUrlInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentStepIdx, setCurrentStepIdx] = useState(0);

  const [activeSummary, setActiveSummary] = useState<VideoSummaryData | null>(null);
  const [activeTab, setActiveTab] = useState<"summary" | "keyPoints" | "lectures" | "quiz" | "beyondTheVideo">("summary");

  // Lecture Notes tab state
  const [expandedLectures, setExpandedLectures] = useState<Record<number, boolean>>({ 0: true });

  // Quiz state
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [isSubmittingQuiz, setIsSubmittingQuiz] = useState(false);
  const [quizResult, setQuizResult] = useState<QuizAttemptResult | null>(null);

  // Saved history state
  const [history, setHistory] = useState<VideoSummaryData[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);

  // Fetch history on load
  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      setIsLoadingHistory(true);
      const res = await fetch("/api/youtube-summarizer?limit=15");
      if (res.ok) {
        const data = await res.json();
        setHistory(data.summaries || []);
      }
    } catch (err) {
      console.warn("Failed to fetch history:", err);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // Step simulation during loading
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isLoading) {
      setCurrentStepIdx(0);
      interval = setInterval(() => {
        setCurrentStepIdx((prev) => (prev < PIPELINE_STEPS.length - 1 ? prev + 1 : prev));
      }, 3500);
    }
    return () => clearInterval(interval);
  }, [isLoading]);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim()) {
      toast.error("Please enter a valid YouTube video link.");
      return;
    }

    setIsLoading(true);
    setQuizResult(null);
    setSelectedAnswers({});

    try {
      const res = await fetch("/api/youtube-summarizer/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: urlInput.trim() }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to generate video summary.");
      }

      setActiveSummary(data.summary);
      setActiveTab("summary");

      if (data.cached) {
        toast.info("Retrieved instantly from cached summary!");
      } else {
        toast.success(`Summary ready! +${data.xpAwarded || 15} XP earned! 🎉`);
        fetchHistory();
      }
    } catch (err: unknown) {
      toast.error((err as Error).message || "An error occurred while analyzing the video.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectHistoryItem = (item: VideoSummaryData) => {
    setActiveSummary(item);
    setActiveTab("summary");
    setQuizResult(null);
    setSelectedAnswers({});
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const toggleLectureAccordion = (idx: number) => {
    setExpandedLectures((prev) => ({
      ...prev,
      [idx]: !prev[idx],
    }));
  };

  const handleOptionSelect = (qIdx: number, oIdx: number) => {
    if (quizResult) return; // Prevent changing after submission
    setSelectedAnswers((prev) => ({ ...prev, [qIdx]: oIdx }));
  };

  const handleSubmitQuiz = async () => {
    if (!activeSummary) return;

    const answerArray = activeSummary.quiz.map((_, idx) =>
      selectedAnswers[idx] !== undefined ? selectedAnswers[idx] : -1
    );

    if (Object.keys(selectedAnswers).length < activeSummary.quiz.length) {
      toast.warning("Please answer all questions before submitting your quiz.");
    }

    setIsSubmittingQuiz(true);
    try {
      const res = await fetch(`/api/youtube-summarizer/${activeSummary.videoId}/quiz-attempt`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: answerArray }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit quiz attempt.");
      }

      setQuizResult(data);

      if (data.xpAwarded > 0) {
        toast.success(`Quiz Completed! You earned +${data.xpAwarded} XP! 🔥`);
      } else {
        toast.info(`Quiz Attempt Recorded. Score: ${data.score}/${data.totalQuestions}`);
      }
    } catch (err: unknown) {
      toast.error((err as Error).message || "Error submitting quiz.");
    } finally {
      setIsSubmittingQuiz(false);
    }
  };

  const handleRetakeQuiz = () => {
    setQuizResult(null);
    setSelectedAnswers({});
  };

  return (
    <div className="min-h-screen bg-[#0A0D14] text-white p-4 sm:p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-xs font-mono mb-2">
            <Sparkles className="size-3.5" />
            AI Video Copilot
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">YouTube Lecture Summarizer</h1>
          <p className="text-sm text-zinc-400 mt-1">
            Transform long YouTube lectures into 1000+ word structured notes, exam takeaways, interactive quizzes, and bonus insights.
          </p>
        </div>
      </div>

      {/* Input Section */}
      <div className="relative rounded-2xl bg-zinc-900/60 border border-white/10 p-4 sm:p-6 backdrop-blur-xl shadow-2xl space-y-4">
        <form onSubmit={handleGenerate} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Play className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-rose-500" />
            <input
              type="text"
              placeholder="Paste YouTube Video URL (e.g., https://www.youtube.com/watch?v=...)"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              disabled={isLoading}
              className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500/60 transition-all"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading || !urlInput.trim()}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-medium text-sm transition-all shadow-lg shadow-violet-600/25 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isLoading ? (
              <>
                <Loader2 className="size-4 animate-spin text-white" />
                Analyzing Video...
              </>
            ) : (
              <>
                <Sparkles className="size-4 text-violet-200" />
                Summarize & Generate Notes
              </>
            )}
          </button>
        </form>

        {/* Pipeline Progress Indicator */}
        {isLoading && (
          <div className="p-4 rounded-xl bg-violet-950/30 border border-violet-500/30 space-y-3 animate-in fade-in duration-300">
            <div className="flex items-center justify-between text-xs font-mono text-violet-300">
              <span className="flex items-center gap-2">
                <Loader2 className="size-3.5 animate-spin" />
                {PIPELINE_STEPS[currentStepIdx]}
              </span>
              <span>Step {currentStepIdx + 1} of 5</span>
            </div>
            <div className="w-full bg-black/40 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-violet-500 to-indigo-500 h-full transition-all duration-500"
                style={{ width: `${((currentStepIdx + 1) / PIPELINE_STEPS.length) * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Main Results View */}
      {activeSummary && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Video Metadata Header Card */}
          <div className="flex flex-col sm:flex-row gap-4 p-4 rounded-2xl bg-zinc-900/40 border border-white/10 items-start sm:items-center justify-between">
            <div className="flex items-center gap-4">
              {activeSummary.thumbnailUrl && (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={activeSummary.thumbnailUrl}
                  alt={activeSummary.title}
                  className="w-24 h-16 sm:w-32 sm:h-20 object-cover rounded-lg border border-white/10 shrink-0"
                />
              )}
              <div>
                <h2 className="text-base sm:text-lg font-bold text-white line-clamp-2">{activeSummary.title}</h2>
                <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-zinc-400">
                  <span className="text-rose-400 font-medium">{activeSummary.channelName || "YouTube"}</span>
                  {activeSummary.subject && (
                    <span className="px-2 py-0.5 rounded bg-violet-500/10 border border-violet-500/20 text-violet-300 font-mono">
                      {activeSummary.subject}
                    </span>
                  )}
                  {activeSummary.examTags?.map((tag) => (
                    <span key={tag} className="px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-300 font-mono">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <a
              href={activeSummary.url}
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-zinc-300 flex items-center gap-1.5 transition-colors shrink-0"
            >
              <Play className="size-3 text-rose-500" /> Watch on YouTube
            </a>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 border-b border-white/10 overflow-x-auto pb-2 scrollbar-none">
            <button
              onClick={() => setActiveTab("summary")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all cursor-pointer whitespace-nowrap ${
                activeTab === "summary"
                  ? "bg-violet-600 text-white shadow-lg shadow-violet-600/30"
                  : "bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10"
              }`}
            >
              <BookOpen className="size-4" /> Summary
            </button>
            <button
              onClick={() => setActiveTab("keyPoints")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all cursor-pointer whitespace-nowrap ${
                activeTab === "keyPoints"
                  ? "bg-violet-600 text-white shadow-lg shadow-violet-600/30"
                  : "bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10"
              }`}
            >
              <ListChecks className="size-4" /> Key Points ({(activeSummary.keyPoints || []).length})
            </button>
            <button
              onClick={() => setActiveTab("lectures")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all cursor-pointer whitespace-nowrap ${
                activeTab === "lectures"
                  ? "bg-violet-600 text-white shadow-lg shadow-violet-600/30"
                  : "bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10"
              }`}
            >
              <Sparkles className="size-4" /> Lecture Notes ({(activeSummary.lectures || []).length})
            </button>
            <button
              onClick={() => setActiveTab("quiz")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all cursor-pointer whitespace-nowrap ${
                activeTab === "quiz"
                  ? "bg-violet-600 text-white shadow-lg shadow-violet-600/30"
                  : "bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10"
              }`}
            >
              <HelpCircle className="size-4" /> Quiz ({(activeSummary.quiz || []).length} Qs)
            </button>
            <button
              onClick={() => setActiveTab("beyondTheVideo")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all cursor-pointer whitespace-nowrap ${
                activeTab === "beyondTheVideo"
                  ? "bg-gradient-to-r from-amber-500 to-rose-500 text-white shadow-lg shadow-amber-500/30"
                  : "bg-amber-500/10 text-amber-300 border border-amber-500/20 hover:bg-amber-500/20"
              }`}
            >
              <Flame className="size-4 text-amber-300" /> Beyond the Video
            </button>
          </div>

          {/* TAB 1: SUMMARY */}
          {activeTab === "summary" && (
            <div className="p-6 rounded-2xl bg-zinc-900/60 border border-white/10 space-y-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <BookOpen className="size-5 text-violet-400" /> Concise Overview
              </h3>
              <p className="text-zinc-300 leading-relaxed text-sm sm:text-base">{activeSummary.summary}</p>
            </div>
          )}

          {/* TAB 2: KEY POINTS */}
          {activeTab === "keyPoints" && (
            <div className="p-6 rounded-2xl bg-zinc-900/60 border border-white/10 space-y-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <ListChecks className="size-5 text-violet-400" /> High-Yield Takeaways
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {(activeSummary.keyPoints || []).map((point, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-3.5 rounded-xl bg-black/40 border border-white/5">
                    <span className="flex items-center justify-center size-6 rounded-full bg-violet-500/20 text-violet-400 text-xs font-bold shrink-0">
                      {idx + 1}
                    </span>
                    <p className="text-xs sm:text-sm text-zinc-300 leading-normal">{point}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: LECTURE NOTES */}
          {activeTab === "lectures" && (
            <div className="space-y-4">
              {(activeSummary.lectures || []).map((lec, idx) => {
                const isExpanded = expandedLectures[idx];
                return (
                  <div key={idx} className="rounded-2xl bg-zinc-900/60 border border-white/10 overflow-hidden">
                    <button
                      onClick={() => toggleLectureAccordion(idx)}
                      className="w-full flex items-center justify-between p-4 text-left hover:bg-white/5 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <span className="px-2.5 py-1 rounded-lg bg-violet-500/10 border border-violet-500/20 text-violet-400 text-xs font-mono font-bold">
                          Lecture {idx + 1}
                        </span>
                        <h3 className="font-bold text-white text-sm sm:text-base">{lec.title}</h3>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-zinc-400">
                        <span className="font-mono bg-black/40 px-2 py-0.5 rounded border border-white/5">
                          {lec.wordCount || 0} words
                        </span>
                        {isExpanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="p-6 border-t border-white/10 bg-black/30">
                        <MarkdownRenderer content={lec.content} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB 4: QUIZ */}
          {activeTab === "quiz" && (
            <div className="p-6 rounded-2xl bg-zinc-900/60 border border-white/10 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <HelpCircle className="size-5 text-violet-400" /> Interactive Exam Quiz
                  </h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Test your understanding. Earn +5 XP per correct answer on your first completion.
                  </p>
                </div>
                {quizResult && (
                  <div className="flex items-center gap-3 bg-violet-500/10 border border-violet-500/20 px-4 py-2 rounded-xl">
                    <Award className="size-5 text-amber-400" />
                    <div>
                      <div className="text-xs font-mono text-violet-300">Score: {quizResult.score}/{quizResult.totalQuestions}</div>
                      <div className="text-xs text-amber-400 font-bold">+{quizResult.xpAwarded} XP Earned</div>
                    </div>
                    <button
                      onClick={handleRetakeQuiz}
                      className="ml-2 px-2.5 py-1 rounded bg-white/10 hover:bg-white/20 text-xs text-white flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <RotateCcw className="size-3" /> Retake
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-6">
                {(activeSummary.quiz || []).map((q, qIdx) => {
                  const resultItem = quizResult?.results[qIdx];
                  return (
                    <div key={qIdx} className="p-4 sm:p-5 rounded-xl bg-black/40 border border-white/5 space-y-3">
                      <div className="flex items-start gap-3">
                        <span className="flex items-center justify-center size-6 rounded-full bg-violet-500/20 text-violet-400 text-xs font-bold shrink-0">
                          {qIdx + 1}
                        </span>
                        <p className="text-sm sm:text-base font-semibold text-white">{q.question}</p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-9">
                        {q.options.map((opt, oIdx) => {
                          const isSelected = selectedAnswers[qIdx] === oIdx;
                          let btnStyle = "bg-white/5 border-white/10 text-zinc-300 hover:bg-white/10";

                          if (resultItem) {
                            if (oIdx === q.correctIndex) {
                              btnStyle = "bg-emerald-500/20 border-emerald-500/40 text-emerald-300 font-medium";
                            } else if (isSelected && !resultItem.isCorrect) {
                              btnStyle = "bg-rose-500/20 border-rose-500/40 text-rose-300";
                            }
                          } else if (isSelected) {
                            btnStyle = "bg-violet-600/30 border-violet-500 text-white font-medium";
                          }

                          return (
                            <button
                              key={oIdx}
                              onClick={() => handleOptionSelect(qIdx, oIdx)}
                              disabled={!!quizResult}
                              className={`w-full p-3 rounded-lg border text-left text-xs sm:text-sm flex items-center justify-between transition-all cursor-pointer ${btnStyle}`}
                            >
                              <span>{opt}</span>
                              {resultItem && oIdx === q.correctIndex && <CheckCircle2 className="size-4 text-emerald-400 shrink-0" />}
                              {resultItem && isSelected && !resultItem.isCorrect && <XCircle className="size-4 text-rose-400 shrink-0" />}
                            </button>
                          );
                        })}
                      </div>

                      {resultItem && (
                        <div className="pl-9 text-xs p-3 rounded-lg bg-violet-950/20 border border-violet-500/20 text-violet-300">
                          <span className="font-bold">Explanation:</span> {q.explanation}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {!quizResult && (
                <div className="flex justify-end pt-4 border-t border-white/10">
                  <button
                    onClick={handleSubmitQuiz}
                    disabled={isSubmittingQuiz}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition-all shadow-lg shadow-violet-600/25 disabled:opacity-50 cursor-pointer"
                  >
                    {isSubmittingQuiz ? (
                      <>
                        <Loader2 className="size-4 animate-spin" /> Scoring...
                      </>
                    ) : (
                      <>
                        <Zap className="size-4 text-amber-300" /> Submit Quiz
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: BEYOND THE VIDEO (BONUS) */}
          {activeTab === "beyondTheVideo" && (
            <div className="space-y-6">
              <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500/10 via-rose-500/10 to-violet-500/10 border border-amber-500/20 flex items-center gap-3">
                <Flame className="size-6 text-amber-400 shrink-0" />
                <div>
                  <h4 className="text-sm font-bold text-amber-300">Notexia Differentiation Pack</h4>
                  <p className="text-xs text-zinc-400">
                    High-value additive concepts, real-world applications, and common exam myths designed specifically for deep mastery.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 1. Fun Facts */}
                <div className="p-5 rounded-2xl bg-zinc-900/60 border border-amber-500/20 space-y-3">
                  <h4 className="text-sm font-bold text-amber-400 flex items-center gap-2">
                    <Lightbulb className="size-4 text-amber-400" /> Fun Facts & Historical Trivia
                  </h4>
                  <ul className="space-y-2 text-xs sm:text-sm text-zinc-300">
                    {activeSummary.beyondTheVideo?.funFacts?.map((fact, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-amber-400 font-bold">•</span>
                        <span>{fact}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* 2. Real World Connections */}
                <div className="p-5 rounded-2xl bg-zinc-900/60 border border-cyan-500/20 space-y-3">
                  <h4 className="text-sm font-bold text-cyan-400 flex items-center gap-2">
                    <Globe2 className="size-4 text-cyan-400" /> Real-World Connections
                  </h4>
                  <ul className="space-y-2 text-xs sm:text-sm text-zinc-300">
                    {activeSummary.beyondTheVideo?.realWorldConnections?.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-cyan-400 font-bold">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* 3. Common Misconceptions */}
                <div className="p-5 rounded-2xl bg-zinc-900/60 border border-rose-500/20 space-y-3">
                  <h4 className="text-sm font-bold text-rose-400 flex items-center gap-2">
                    <QuestionIcon className="size-4 text-rose-400" /> Common Exam Misconceptions
                  </h4>
                  <div className="space-y-3 text-xs sm:text-sm">
                    {activeSummary.beyondTheVideo?.commonMisconceptions?.map((misc, idx) => (
                      <div key={idx} className="p-3 rounded-lg bg-black/40 border border-white/5 space-y-1">
                        <p className="text-zinc-300 leading-normal">{misc}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 4. Further Exploration */}
                <div className="p-5 rounded-2xl bg-zinc-900/60 border border-violet-500/20 space-y-3">
                  <h4 className="text-sm font-bold text-violet-400 flex items-center gap-2">
                    <Compass className="size-4 text-violet-400" /> Explore Further
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {activeSummary.beyondTheVideo?.furtherExploration?.map((topic, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1.5 rounded-lg bg-violet-500/10 border border-violet-500/20 text-violet-300 text-xs font-medium"
                      >
                        {topic}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* History Grid */}
      <div className="space-y-4 pt-6 border-t border-white/10">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <History className="size-5 text-violet-400" /> Recently Summarized Lectures
        </h3>

        {isLoadingHistory ? (
          <div className="flex items-center justify-center py-8 text-zinc-500 text-xs">
            <Loader2 className="size-4 animate-spin mr-2" /> Loading history...
          </div>
        ) : history.length === 0 ? (
          <div className="text-center py-8 text-zinc-500 text-xs bg-zinc-900/30 rounded-2xl border border-white/5">
            No saved summaries found. Paste a YouTube link above to get started!
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {history.map((item) => (
              <div
                key={item._id}
                onClick={() => handleSelectHistoryItem(item)}
                className={`p-4 rounded-xl bg-zinc-900/50 border transition-all cursor-pointer hover:border-violet-500/40 space-y-3 ${
                  activeSummary?._id === item._id ? "border-violet-500 bg-violet-950/20" : "border-white/10"
                }`}
              >
                <div className="flex items-center gap-3">
                  {item.thumbnailUrl && (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={item.thumbnailUrl} alt="" className="w-16 h-10 object-cover rounded border border-white/10 shrink-0" />
                  )}
                  <div className="overflow-hidden">
                    <h4 className="text-xs font-bold text-white truncate">{item.title}</h4>
                    <p className="text-[10px] text-zinc-400 truncate">{item.channelName || "YouTube"}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between text-[10px] text-zinc-500">
                  <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                  <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-zinc-400">
                    {item.subject || "Lecture"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
