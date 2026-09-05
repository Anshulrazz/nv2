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
  Copy,
  Check,
  FileText,
  Share2,
  ImageIcon,
  Wand2,
  X,
  Clock,
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
  const [isCopied, setIsCopied] = useState(false);

  // Save & Publish Note Modal state
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [noteTitleInput, setNoteTitleInput] = useState("");
  const [noteCategoryInput, setNoteCategoryInput] = useState("Computer Science");
  const [noteTagsInput, setNoteTagsInput] = useState("");
  const [coverImageUrl, setCoverImageUrl] = useState("");
  const [isGeneratingCover, setIsGeneratingCover] = useState(false);
  const [shouldPublish, setShouldPublish] = useState(true);
  const [isSavingNote, setIsSavingNote] = useState(false);

  // Saved history state
  const [history, setHistory] = useState<VideoSummaryData[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);

  const fetchHistory = async () => {
    try {
      const res = await fetch("/api/youtube-summarizer");
      if (res.ok) {
        const data = await res.json();
        setHistory(data.summaries || []);
      }
    } catch {
      // ignore
    } finally {
      setIsLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleCopyNotes = () => {
    if (!activeSummary) return;
    const text = `
# ${activeSummary.title}
Channel: ${activeSummary.channelName || "YouTube"}
Subject: ${activeSummary.subject || "General"}

## Concise Summary
${activeSummary.summary}

## Key Takeaways
${(activeSummary.keyPoints || []).map((kp, i) => `${i + 1}. ${kp}`).join("\n")}

## Detailed Lecture Notes
${(activeSummary.lectures || []).map((lec) => `### ${lec.title}\n${lec.content}`).join("\n\n")}
`.trim();

    navigator.clipboard.writeText(text);
    setIsCopied(true);
    toast.success("Copied full study notes to clipboard!");
    setTimeout(() => setIsCopied(false), 2500);
  };

  const expandAllLectures = () => {
    if (!activeSummary) return;
    const all: Record<number, boolean> = {};
    (activeSummary.lectures || []).forEach((_, i) => (all[i] = true));
    setExpandedLectures(all);
  };

  const collapseAllLectures = () => {
    setExpandedLectures({});
  };

  const toggleLectureAccordion = (idx: number) => {
    setExpandedLectures((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  const copyModuleNotes = (title: string, content: string) => {
    navigator.clipboard.writeText(`### ${title}\n\n${content}`);
    toast.success(`Copied module "${title}"!`);
  };

  const handleOpenSaveModal = () => {
    if (!activeSummary) return;
    setNoteTitleInput(activeSummary.title);
    setNoteCategoryInput(activeSummary.subject || "Computer Science");
    setNoteTagsInput((activeSummary.examTags || ["YouTube Summary", "Notexia AI"]).join(", "));
    setCoverImageUrl(activeSummary.thumbnailUrl || "");
    setShouldPublish(true);
    setIsSaveModalOpen(true);
  };

  const handleGenerateAICover = async () => {
    if (!activeSummary) return;
    setIsGeneratingCover(true);
    try {
      const res = await fetch("/api/notes/generate-cover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: noteTitleInput || activeSummary.title,
          subject: noteCategoryInput || activeSummary.subject,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to generate AI cover.");
      }
      setCoverImageUrl(data.coverImageUrl);
      toast.success("Generated AI Cover Image!");
    } catch (err: unknown) {
      toast.error((err as Error).message || "Failed to generate cover image.");
    } finally {
      setIsGeneratingCover(false);
    }
  };

  const handleSaveToNotes = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSummary) return;

    setIsSavingNote(true);
    try {
      const parsedTags = noteTagsInput
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      const res = await fetch(`/api/youtube-summarizer/${activeSummary.videoId}/save-to-notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: noteTitleInput.trim() || activeSummary.title,
          coverImage: coverImageUrl,
          category: noteCategoryInput,
          tags: parsedTags,
          publish: shouldPublish,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to save note.");
      }

      setIsSaveModalOpen(false);
      toast.success(
        shouldPublish
          ? `Note saved & published to Notexia Community! +${data.xpAwarded || 25} XP earned!`
          : `Note saved to your personal Notes library! +${data.xpAwarded || 15} XP earned!`
      );
    } catch (err: unknown) {
      toast.error((err as Error).message || "Failed to save note.");
    } finally {
      setIsSavingNote(false);
    }
  };

  const handleSelectHistoryItem = (item: VideoSummaryData) => {
    setActiveSummary(item);
    setActiveTab("summary");
    setQuizResult(null);
    setSelectedAnswers({});
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim()) return;

    setIsLoading(true);
    setCurrentStepIdx(0);
    setActiveSummary(null);
    setQuizResult(null);
    setSelectedAnswers({});

    // Simulate step ticker
    const interval = setInterval(() => {
      setCurrentStepIdx((prev) => {
        if (prev < PIPELINE_STEPS.length - 1) return prev + 1;
        return prev;
      });
    }, 2800);

    try {
      const res = await fetch("/api/youtube-summarizer/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: urlInput }),
      });

      clearInterval(interval);

      if (!res.ok) {
        let errMessage = "Failed to summarize video.";
        try {
          const errData = await res.json();
          if (errData.error) errMessage = errData.error;
        } catch {
          // ignore non-JSON
        }
        throw new Error(errMessage);
      }

      const data = await res.json();
      setActiveSummary(data.summary);
      setActiveTab("summary");
      setUrlInput("");
      fetchHistory();
      toast.success("Video successfully processed and summarized!");
    } catch (err: unknown) {
      clearInterval(interval);
      console.error(err);
      toast.error((err as Error).message || "Error generating video summary.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOptionSelect = (questionIdx: number, optionIdx: number) => {
    if (quizResult) return;
    setSelectedAnswers((prev) => ({ ...prev, [questionIdx]: optionIdx }));
  };

  const handleSubmitQuiz = async () => {
    if (!activeSummary) return;

    const totalQuestions = activeSummary.quiz?.length || 0;
    const answeredCount = Object.keys(selectedAnswers).length;

    if (answeredCount < totalQuestions) {
      toast.error(`Please answer all ${totalQuestions} questions before submitting.`);
      return;
    }

    setIsSubmittingQuiz(true);

    const answerArray = Object.entries(selectedAnswers).map(([qIdx, optIdx]) => ({
      questionIndex: parseInt(qIdx, 10),
      selectedOptionIndex: optIdx,
    }));

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
        toast.success(`Quiz Completed! You earned +${data.xpAwarded} XP!`);
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
    <div className="text-text-primary p-4 sm:p-6 md:p-8 space-y-8 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border-subtle pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent-primary/10 border border-accent-primary/20 text-accent-primary text-xs font-mono mb-2">
            <Sparkles className="size-3.5" />
            AI Video Copilot
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-text-primary font-display">
            YouTube Lecture Summarizer
          </h1>
          <p className="text-sm text-text-muted mt-1 max-w-2xl leading-relaxed">
            Transform long YouTube lectures into structured notes, exam takeaways, interactive quizzes, and bonus insights in seconds.
          </p>
        </div>
      </div>

      {/* Input Section */}
      <div className="relative rounded-2xl bg-bg-surface border border-border-subtle p-4 sm:p-6 backdrop-blur-xl shadow-lg space-y-4">
        <form onSubmit={handleGenerate} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Play className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-accent-primary" />
            <input
              type="text"
              placeholder="Paste YouTube Video URL (e.g., https://www.youtube.com/watch?v=...)"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              disabled={isLoading}
              className="w-full bg-bg-base border border-border-subtle rounded-xl pl-10 pr-4 py-3 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary/40 transition-all font-sans"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading || !urlInput.trim()}
            className="btn-premium-primary rounded-xl px-6 py-3 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shrink-0 cursor-pointer disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Analyzing Video...
              </>
            ) : (
              <>
                <Sparkles className="size-4" />
                Summarize & Generate Notes
              </>
            )}
          </button>
        </form>

        {/* Pipeline Progress Indicator */}
        {isLoading && (
          <div className="p-4 rounded-xl bg-bg-card border border-accent-primary/30 space-y-3 animate-in fade-in duration-200">
            <div className="flex items-center justify-between text-xs font-mono text-accent-primary font-bold">
              <span className="flex items-center gap-2">
                <Loader2 className="size-3.5 animate-spin" />
                {PIPELINE_STEPS[currentStepIdx]}
              </span>
              <span>Step {currentStepIdx + 1} of 5</span>
            </div>
            <div className="w-full bg-bg-base h-2 rounded-full overflow-hidden border border-border-subtle">
              <div
                className="bg-gradient-to-r from-accent-primary to-accent-secondary h-full transition-all duration-500"
                style={{ width: `${((currentStepIdx + 1) / PIPELINE_STEPS.length) * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Main Results View */}
      {activeSummary && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Video Metadata Header Card */}
          <div className="flex flex-col sm:flex-row gap-4 p-5 rounded-2xl bg-bg-surface border border-border-subtle items-start sm:items-center justify-between shadow-sm">
            <div className="flex items-center gap-4">
              {activeSummary.thumbnailUrl && (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={activeSummary.thumbnailUrl}
                  alt={activeSummary.title}
                  className="w-24 h-16 sm:w-32 sm:h-20 object-cover rounded-xl border border-border-subtle shrink-0"
                />
              )}
              <div className="space-y-1">
                <h2 className="text-base sm:text-lg font-bold text-text-primary font-display line-clamp-2">
                  {activeSummary.title}
                </h2>
                <div className="flex flex-wrap items-center gap-2 text-xs text-text-muted">
                  <span className="text-accent-primary font-medium">{activeSummary.channelName || "YouTube"}</span>
                  {activeSummary.subject && (
                    <span className="px-2 py-0.5 rounded-full bg-bg-elevated border border-border-subtle text-text-secondary font-mono text-[11px]">
                      {activeSummary.subject}
                    </span>
                  )}
                  {activeSummary.examTags?.map((tag) => (
                    <span key={tag} className="px-2 py-0.5 rounded-full bg-accent-primary/10 border border-accent-primary/20 text-accent-primary font-mono text-[11px]">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                onClick={handleOpenSaveModal}
                className="btn-premium-primary rounded-xl px-4 py-2 text-xs font-bold flex items-center gap-2 cursor-pointer"
              >
                <FileText className="size-3.5" /> Save & Publish Note
              </button>
              <button
                onClick={handleCopyNotes}
                className="px-3.5 py-2 rounded-xl bg-bg-elevated hover:bg-bg-card border border-border-subtle text-xs text-text-primary flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {isCopied ? <Check className="size-3.5 text-success" /> : <Copy className="size-3.5 text-accent-primary" />}
                {isCopied ? "Copied!" : "Copy"}
              </button>
              <a
                href={activeSummary.url}
                target="_blank"
                rel="noreferrer"
                className="px-3.5 py-2 rounded-xl bg-bg-elevated hover:bg-bg-card border border-border-subtle text-xs text-text-primary flex items-center gap-1.5 transition-colors"
              >
                <Play className="size-3.5 text-accent-secondary" /> Watch
              </a>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-2xl bg-bg-surface border border-border-subtle shadow-sm">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-bg-card border border-border-subtle">
              <div className="p-2 rounded-lg bg-accent-primary/10 text-accent-primary">
                <Clock className="size-4" />
              </div>
              <div>
                <div className="text-[10px] uppercase font-mono text-text-muted tracking-wider">Reading Time</div>
                <div className="text-xs sm:text-sm font-bold text-text-primary font-mono">
                  {Math.max(
                    1,
                    Math.ceil(
                      (activeSummary.lectures || []).reduce(
                        (acc, l) => acc + (l.wordCount || (l.content || "").split(/\s+/).filter(Boolean).length),
                        0
                      ) / 200
                    )
                  )}{" "}
                  min read
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-xl bg-bg-card border border-border-subtle">
              <div className="p-2 rounded-lg bg-accent-secondary/10 text-accent-secondary">
                <FileText className="size-4" />
              </div>
              <div>
                <div className="text-[10px] uppercase font-mono text-text-muted tracking-wider">Word Count</div>
                <div className="text-xs sm:text-sm font-bold text-text-primary font-mono">
                  {(activeSummary.lectures || [])
                    .reduce((acc, l) => acc + (l.wordCount || (l.content || "").split(/\s+/).filter(Boolean).length), 0)
                    .toLocaleString()}{" "}
                  words
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-xl bg-bg-card border border-border-subtle">
              <div className="p-2 rounded-lg bg-success/10 text-success">
                <ListChecks className="size-4" />
              </div>
              <div>
                <div className="text-[10px] uppercase font-mono text-text-muted tracking-wider">Takeaways</div>
                <div className="text-xs sm:text-sm font-bold text-text-primary font-mono">
                  {(activeSummary.keyPoints || []).length} Points
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-xl bg-bg-card border border-border-subtle">
              <div className="p-2 rounded-lg bg-accent-primary/10 text-accent-primary">
                <HelpCircle className="size-4" />
              </div>
              <div>
                <div className="text-[10px] uppercase font-mono text-text-muted tracking-wider">Exam Quiz</div>
                <div className="text-xs sm:text-sm font-bold text-text-primary font-mono">
                  {(activeSummary.quiz || []).length} MCQs
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 border-b border-border-subtle overflow-x-auto pb-2 scrollbar-none">
            <button
              onClick={() => setActiveTab("summary")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all cursor-pointer whitespace-nowrap ${
                activeTab === "summary"
                  ? "bg-accent-primary/15 border border-accent-primary text-text-primary font-bold shadow-sm"
                  : "bg-bg-elevated/50 border border-border-subtle text-text-muted hover:text-text-primary hover:border-border-default"
              }`}
            >
              <BookOpen className="size-4" /> Summary
            </button>
            <button
              onClick={() => setActiveTab("keyPoints")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all cursor-pointer whitespace-nowrap ${
                activeTab === "keyPoints"
                  ? "bg-accent-primary/15 border border-accent-primary text-text-primary font-bold shadow-sm"
                  : "bg-bg-elevated/50 border border-border-subtle text-text-muted hover:text-text-primary hover:border-border-default"
              }`}
            >
              <ListChecks className="size-4" /> Key Points ({(activeSummary.keyPoints || []).length})
            </button>
            <button
              onClick={() => setActiveTab("lectures")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all cursor-pointer whitespace-nowrap ${
                activeTab === "lectures"
                  ? "bg-accent-primary/15 border border-accent-primary text-text-primary font-bold shadow-sm"
                  : "bg-bg-elevated/50 border border-border-subtle text-text-muted hover:text-text-primary hover:border-border-default"
              }`}
            >
              <Sparkles className="size-4" /> Lecture Notes ({(activeSummary.lectures || []).length})
            </button>
            <button
              onClick={() => setActiveTab("quiz")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all cursor-pointer whitespace-nowrap ${
                activeTab === "quiz"
                  ? "bg-accent-primary/15 border border-accent-primary text-text-primary font-bold shadow-sm"
                  : "bg-bg-elevated/50 border border-border-subtle text-text-muted hover:text-text-primary hover:border-border-default"
              }`}
            >
              <HelpCircle className="size-4" /> Quiz ({(activeSummary.quiz || []).length} Qs)
            </button>
            <button
              onClick={() => setActiveTab("beyondTheVideo")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all cursor-pointer whitespace-nowrap ${
                activeTab === "beyondTheVideo"
                  ? "bg-accent-secondary/15 border border-accent-secondary text-text-primary font-bold shadow-sm"
                  : "bg-bg-elevated/50 border border-border-subtle text-text-muted hover:text-text-primary hover:border-border-default"
              }`}
            >
              <Flame className="size-4 text-accent-secondary" /> Beyond the Video
            </button>
          </div>

          {/* TAB 1: SUMMARY */}
          {activeTab === "summary" && (
            <div className="p-6 rounded-2xl bg-bg-card border border-border-subtle space-y-4 shadow-sm">
              <h3 className="text-base sm:text-lg font-bold text-text-primary font-display flex items-center gap-2">
                <BookOpen className="size-5 text-accent-primary" /> Concise Overview
              </h3>
              <p className="text-text-secondary leading-relaxed text-sm sm:text-base">{activeSummary.summary}</p>
            </div>
          )}

          {/* TAB 2: KEY POINTS */}
          {activeTab === "keyPoints" && (
            <div className="p-6 rounded-2xl bg-bg-card border border-border-subtle space-y-4 shadow-sm">
              <h3 className="text-base sm:text-lg font-bold text-text-primary font-display flex items-center gap-2">
                <ListChecks className="size-5 text-accent-primary" /> High-Yield Takeaways
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {(activeSummary.keyPoints || []).map((point, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-4 rounded-xl bg-bg-elevated/50 border border-border-subtle hover:border-accent-primary/30 transition-colors">
                    <span className="flex items-center justify-center size-6 rounded-full bg-accent-primary/10 border border-accent-primary/20 text-accent-primary text-xs font-bold shrink-0">
                      {idx + 1}
                    </span>
                    <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">{point}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: LECTURE NOTES */}
          {activeTab === "lectures" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs text-text-muted font-mono font-bold">
                  {(activeSummary.lectures || []).length} Structured Modules
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={expandAllLectures}
                    className="px-3 py-1 rounded-lg bg-bg-elevated hover:bg-bg-card border border-border-subtle text-xs text-text-secondary transition-colors cursor-pointer"
                  >
                    Expand All
                  </button>
                  <button
                    onClick={collapseAllLectures}
                    className="px-3 py-1 rounded-lg bg-bg-elevated hover:bg-bg-card border border-border-subtle text-xs text-text-secondary transition-colors cursor-pointer"
                  >
                    Collapse All
                  </button>
                </div>
              </div>

              {(activeSummary.lectures || []).map((lec, idx) => {
                const isExpanded = expandedLectures[idx];
                return (
                  <div key={idx} className="rounded-2xl bg-bg-card border border-border-subtle overflow-hidden transition-all duration-200 hover:border-border-default shadow-sm">
                    <div className="flex items-center justify-between p-4 bg-bg-surface border-b border-border-subtle">
                      <button
                        onClick={() => toggleLectureAccordion(idx)}
                        className="flex-1 flex items-center justify-between text-left cursor-pointer pr-4"
                      >
                        <div className="flex items-center gap-3">
                          <span className="px-2.5 py-1 rounded-lg bg-accent-primary/10 border border-accent-primary/20 text-accent-primary text-xs font-mono font-bold">
                            Module {idx + 1}
                          </span>
                          <h3 className="font-bold text-text-primary text-sm sm:text-base font-display">{lec.title}</h3>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-text-muted">
                          <span className="font-mono bg-bg-elevated px-2 py-0.5 rounded border border-border-subtle">
                            {lec.wordCount || (lec.content || "").split(/\s+/).filter(Boolean).length} words
                          </span>
                          {isExpanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                        </div>
                      </button>
                      <button
                        onClick={() => copyModuleNotes(lec.title, lec.content)}
                        className="p-2 rounded-lg bg-bg-elevated hover:bg-bg-card border border-border-subtle text-text-muted hover:text-text-primary transition-colors cursor-pointer shrink-0"
                        title="Copy this module"
                      >
                        <Copy className="size-3.5 text-accent-primary" />
                      </button>
                    </div>

                    {isExpanded && (
                      <div className="p-6 bg-bg-card/50">
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
            <div className="p-6 rounded-2xl bg-bg-card border border-border-subtle space-y-6 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-subtle pb-4">
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-text-primary font-display flex items-center gap-2">
                    <HelpCircle className="size-5 text-accent-primary" /> Interactive Exam Quiz
                  </h3>
                  <p className="text-xs text-text-muted mt-0.5">
                    Test your understanding. Earn +5 XP per correct answer on your first completion.
                  </p>
                </div>
                {quizResult && (
                  <div className="flex items-center gap-3 bg-accent-primary/10 border border-accent-primary/20 px-4 py-2 rounded-xl">
                    <Award className="size-5 text-accent-secondary" />
                    <div>
                      <div className="text-xs font-mono text-accent-primary">Score: {quizResult.score}/{quizResult.totalQuestions}</div>
                      <div className="text-xs text-accent-secondary font-bold">+{quizResult.xpAwarded} XP Earned</div>
                    </div>
                    <button
                      onClick={handleRetakeQuiz}
                      className="ml-2 px-2.5 py-1 rounded-lg bg-bg-elevated hover:bg-bg-card text-xs text-text-primary border border-border-subtle flex items-center gap-1 transition-colors cursor-pointer"
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
                    <div key={qIdx} className="p-4 sm:p-5 rounded-xl bg-bg-surface border border-border-subtle space-y-3 shadow-sm">
                      <div className="flex items-start gap-3">
                        <span className="flex items-center justify-center size-6 rounded-full bg-accent-primary/10 border border-accent-primary/20 text-accent-primary text-xs font-bold shrink-0 font-mono">
                          {qIdx + 1}
                        </span>
                        <p className="text-sm sm:text-base font-semibold text-text-primary font-display">{q.question}</p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pl-9">
                        {q.options.map((opt, oIdx) => {
                          const isSelected = selectedAnswers[qIdx] === oIdx;
                          const letter = String.fromCharCode(65 + oIdx);
                          let btnStyle = "bg-bg-card border-border-subtle text-text-secondary hover:border-accent-primary/30";

                          if (resultItem) {
                            if (oIdx === q.correctIndex) {
                              btnStyle = "bg-success/15 border-success text-success font-bold";
                            } else if (isSelected && !resultItem.isCorrect) {
                              btnStyle = "bg-destructive/15 border-destructive text-destructive font-bold";
                            }
                          } else if (isSelected) {
                            btnStyle = "bg-accent-primary/15 border-accent-primary text-text-primary font-bold";
                          }

                          return (
                            <button
                              key={oIdx}
                              onClick={() => handleOptionSelect(qIdx, oIdx)}
                              disabled={!!quizResult}
                              className={`w-full p-3 rounded-xl border text-left text-xs sm:text-sm flex items-center justify-between transition-all cursor-pointer ${btnStyle}`}
                            >
                              <div className="flex items-center gap-2.5">
                                <span className={`flex items-center justify-center size-5 rounded text-[11px] font-mono font-bold shrink-0 ${isSelected ? "bg-accent-primary text-bg-base" : "bg-bg-elevated text-text-muted"}`}>
                                  {letter}
                                </span>
                                <span>{opt}</span>
                              </div>
                              {resultItem && oIdx === q.correctIndex && <CheckCircle2 className="size-4 text-success shrink-0" />}
                              {resultItem && isSelected && !resultItem.isCorrect && <XCircle className="size-4 text-destructive shrink-0" />}
                            </button>
                          );
                        })}
                      </div>

                      {resultItem && (
                        <div className="pl-9 text-xs p-3 rounded-xl bg-bg-elevated border border-border-subtle text-text-muted">
                          <span className="font-bold text-text-primary">Explanation:</span> {q.explanation}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {!quizResult && (
                <div className="flex justify-end pt-4 border-t border-border-subtle">
                  <button
                    onClick={handleSubmitQuiz}
                    disabled={isSubmittingQuiz}
                    className="btn-premium-primary rounded-xl px-6 py-3 text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isSubmittingQuiz ? (
                      <>
                        <Loader2 className="size-4 animate-spin" /> Scoring...
                      </>
                    ) : (
                      <>
                        <Zap className="size-4" /> Submit Quiz
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
              <div className="p-5 rounded-2xl bg-bg-card border border-border-subtle flex items-center gap-3 shadow-sm">
                <div className="size-10 rounded-xl bg-accent-secondary/10 border border-accent-secondary/20 flex items-center justify-center text-accent-secondary shrink-0">
                  <Flame className="size-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-text-primary font-display">Notexia Differentiation Pack</h4>
                  <p className="text-xs text-text-muted leading-relaxed">
                    High-value additive concepts, real-world applications, and common exam myths designed specifically for deep mastery.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 1. Fun Facts */}
                <div className="p-5 rounded-2xl bg-bg-card border border-border-subtle space-y-3 shadow-sm">
                  <h4 className="text-sm font-bold text-accent-primary font-display flex items-center gap-2">
                    <Lightbulb className="size-4 text-accent-primary" /> Fun Facts &amp; Historical Trivia
                  </h4>
                  <ul className="space-y-2 text-xs sm:text-sm text-text-secondary">
                    {activeSummary.beyondTheVideo?.funFacts?.map((fact, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-accent-primary font-bold">•</span>
                        <span>{fact}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* 2. Real World Connections */}
                <div className="p-5 rounded-2xl bg-bg-card border border-border-subtle space-y-3 shadow-sm">
                  <h4 className="text-sm font-bold text-accent-secondary font-display flex items-center gap-2">
                    <Globe2 className="size-4 text-accent-secondary" /> Real-World Connections
                  </h4>
                  <ul className="space-y-2 text-xs sm:text-sm text-text-secondary">
                    {activeSummary.beyondTheVideo?.realWorldConnections?.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-accent-secondary font-bold">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* 3. Common Misconceptions */}
                <div className="p-5 rounded-2xl bg-bg-card border border-border-subtle space-y-3 shadow-sm">
                  <h4 className="text-sm font-bold text-text-primary font-display flex items-center gap-2">
                    <QuestionIcon className="size-4 text-accent-primary" /> Common Exam Misconceptions
                  </h4>
                  <div className="space-y-3 text-xs sm:text-sm">
                    {activeSummary.beyondTheVideo?.commonMisconceptions?.map((misc, idx) => (
                      <div key={idx} className="p-3.5 rounded-xl bg-bg-elevated/40 border border-border-subtle space-y-1">
                        <p className="text-text-secondary leading-relaxed">{misc}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 4. Further Exploration */}
                <div className="p-5 rounded-2xl bg-bg-card border border-border-subtle space-y-3 shadow-sm">
                  <h4 className="text-sm font-bold text-text-primary font-display flex items-center gap-2">
                    <Compass className="size-4 text-accent-primary" /> Explore Further
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {activeSummary.beyondTheVideo?.furtherExploration?.map((topic, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1.5 rounded-lg bg-bg-elevated border border-border-subtle text-text-secondary text-xs font-mono font-medium"
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
      <div className="space-y-4 pt-6 border-t border-border-subtle">
        <h3 className="text-lg font-bold text-text-primary font-display flex items-center gap-2">
          <History className="size-5 text-accent-primary" /> Recently Summarized Lectures
        </h3>

        {isLoadingHistory ? (
          <div className="flex items-center justify-center py-8 text-text-muted text-xs font-mono">
            <Loader2 className="size-4 animate-spin mr-2" /> Loading history...
          </div>
        ) : history.length === 0 ? (
          <div className="text-center py-8 text-text-muted text-xs bg-bg-card rounded-2xl border border-border-subtle">
            No saved summaries found. Paste a YouTube link above to get started!
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {history.map((item) => (
              <div
                key={item._id}
                onClick={() => handleSelectHistoryItem(item)}
                className={`p-4 rounded-xl bg-bg-card border transition-all cursor-pointer hover:border-accent-primary/40 space-y-3 shadow-sm ${
                  activeSummary?._id === item._id ? "border-accent-primary bg-bg-elevated" : "border-border-subtle"
                }`}
              >
                <div className="flex items-center gap-3">
                  {item.thumbnailUrl && (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={item.thumbnailUrl} alt="" className="w-16 h-10 object-cover rounded-lg border border-border-subtle shrink-0" />
                  )}
                  <div className="overflow-hidden">
                    <h4 className="text-xs font-bold text-text-primary truncate font-display">{item.title}</h4>
                    <p className="text-[10px] text-text-muted truncate">{item.channelName || "YouTube"}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between text-[10px] text-text-muted font-mono">
                  <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                  <span className="px-2 py-0.5 rounded-md bg-bg-elevated border border-border-subtle text-text-secondary">
                    {item.subject || "Lecture"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Save & Publish Note Modal */}
      {isSaveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-xl rounded-2xl bg-bg-surface border border-border-subtle p-6 space-y-5 shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-border-subtle pb-4">
              <div className="flex items-center gap-2.5">
                <div className="size-10 rounded-xl bg-accent-primary/10 border border-accent-primary/20 text-accent-primary flex items-center justify-center">
                  <FileText className="size-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-text-primary font-display">Save &amp; Publish Study Note</h3>
                  <p className="text-xs text-text-muted">Save to your Notexia Notes or publish to community feed</p>
                </div>
              </div>
              <button
                onClick={() => setIsSaveModalOpen(false)}
                className="p-1 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-elevated transition-colors cursor-pointer"
                aria-label="Close"
              >
                <X className="size-5" />
              </button>
            </div>

            <form onSubmit={handleSaveToNotes} className="space-y-4">
              {/* Note Title */}
              <div className="space-y-1.5">
                <label className="text-xs font-mono font-bold text-text-muted uppercase tracking-wider">Note Title</label>
                <input
                  type="text"
                  value={noteTitleInput}
                  onChange={(e) => setNoteTitleInput(e.target.value)}
                  required
                  className="w-full bg-bg-base border border-border-subtle rounded-xl px-3.5 py-2.5 text-xs text-text-primary outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary/40 font-sans"
                />
              </div>

              {/* AI Cover Image Generator Box */}
              <div className="space-y-2 p-4 rounded-xl bg-bg-card border border-border-subtle">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-mono font-bold text-text-muted uppercase tracking-wider flex items-center gap-1.5">
                    <ImageIcon className="size-3.5 text-accent-primary" /> AI Cover Image
                  </label>
                  <button
                    type="button"
                    onClick={handleGenerateAICover}
                    disabled={isGeneratingCover}
                    className="px-2.5 py-1 rounded-lg bg-accent-primary/10 hover:bg-accent-primary/20 border border-accent-primary/20 text-accent-primary text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {isGeneratingCover ? (
                      <>
                        <Loader2 className="size-3 animate-spin" /> Generating...
                      </>
                    ) : (
                      <>
                        <Wand2 className="size-3" /> Generate with AI ✨
                      </>
                    )}
                  </button>
                </div>

                {coverImageUrl ? (
                  <div className="relative rounded-lg overflow-hidden border border-border-subtle aspect-[2/1] max-h-36">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={coverImageUrl} alt="Cover Preview" className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="text-center py-6 text-xs text-text-muted border border-dashed border-border-subtle rounded-lg">
                    No cover image set. Click &quot;Generate with AI&quot; to create a custom cover banner!
                  </div>
                )}
              </div>

              {/* Category & Tags */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-mono font-bold text-text-muted uppercase tracking-wider">Category</label>
                  <select
                    value={noteCategoryInput}
                    onChange={(e) => setNoteCategoryInput(e.target.value)}
                    className="w-full bg-bg-base border border-border-subtle rounded-xl px-3 py-2 text-xs text-text-primary outline-none focus:border-accent-primary"
                  >
                    <option value="Physics">Physics</option>
                    <option value="Chemistry">Chemistry</option>
                    <option value="Mathematics">Mathematics</option>
                    <option value="Computer Science">Computer Science</option>
                    <option value="Biology">Biology</option>
                    <option value="General Study">General Study</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-mono font-bold text-text-muted uppercase tracking-wider">Exam / Subject Tags</label>
                  <input
                    type="text"
                    value={noteTagsInput}
                    onChange={(e) => setNoteTagsInput(e.target.value)}
                    placeholder="JEE, NEET, GATE, CBSE"
                    className="w-full bg-bg-base border border-border-subtle rounded-xl px-3 py-2 text-xs text-text-primary outline-none focus:border-accent-primary"
                  />
                </div>
              </div>

              {/* Publish Toggle */}
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-accent-primary/10 border border-accent-primary/20">
                <div className="flex items-center gap-3">
                  <Share2 className="size-5 text-accent-primary shrink-0" />
                  <div>
                    <div className="text-xs font-bold text-text-primary flex items-center gap-2">
                      Publish to Notexia Community &amp; Blog
                      <span className="px-2 py-0.5 rounded-full bg-accent-secondary/20 text-accent-secondary text-[10px] font-mono font-bold">
                        +25 XP Reward
                      </span>
                    </div>
                    <div className="text-[11px] text-text-muted">Make note public in Notexia community feed and blog</div>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={shouldPublish}
                  onChange={(e) => setShouldPublish(e.target.checked)}
                  className="size-4 accent-amber-500 rounded cursor-pointer"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsSaveModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs text-text-muted hover:text-text-primary transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingNote}
                  className="btn-premium-primary rounded-xl px-5 py-2.5 text-xs font-bold flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSavingNote ? (
                    <>
                      <Loader2 className="size-4 animate-spin" /> Saving Note...
                    </>
                  ) : (
                    <>
                      <Zap className="size-4" /> Save Note
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
