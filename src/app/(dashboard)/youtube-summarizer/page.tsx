"use client";

export const dynamic = "force-dynamic";

import React, { useState, useEffect, useRef } from "react";
import {
  Sparkles,
  Loader2,
  AlertCircle,
  Award,
  RefreshCw,
  History,
  Zap,
} from "lucide-react";
import { VideoSummaryCard, FullVideoSummary } from "@/components/youtube/VideoSummaryCard";
import { VideoSummaryListItem, SummaryListItemData } from "@/components/youtube/VideoSummaryListItem";

function Youtube({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  );
}

// Regex helper for client-side instant validation
function isValidYouTubeUrl(url: string): boolean {
  if (!url || typeof url !== "string") return false;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|shorts\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.trim().match(regExp);
  return Boolean(match && match[2].length === 11);
}

export default function YouTubeSummarizerPage() {
  const [videoUrl, setVideoUrl] = useState("");
  const [inputError, setInputError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeSummary, setActiveSummary] = useState<FullVideoSummary | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [processingError, setProcessingError] = useState<string | null>(null);
  const [processingStep, setProcessingStep] = useState(1);

  // History state
  const [historyItems, setHistoryItems] = useState<SummaryListItemData[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);

  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch past summaries list on mount
  const fetchHistory = async () => {
    try {
      setIsLoadingHistory(true);
      const res = await fetch("/api/youtube-summary?limit=20");
      if (!res.ok) throw new Error("Failed to fetch history.");
      const data = await res.json();
      setHistoryItems(data.summaries || []);
    } catch (err: unknown) {
      console.error("Error loading history:", err);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  // Cleanup polling timer on unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, []);

  // Polling logic when processingId is set
  useEffect(() => {
    if (!processingId) return;

    // Cycle processing step message for smooth UX
    const stepInterval = setInterval(() => {
      setProcessingStep((prev) => (prev % 3) + 1);
    }, 3000);

    const checkStatus = async () => {
      try {
        const res = await fetch(`/api/youtube-summary/${processingId}`);
        if (!res.ok) return;

        const data: FullVideoSummary = await res.json();
        if (data.status === "completed") {
          setActiveSummary(data);
          setProcessingId(null);
          setProcessingError(null);
          fetchHistory(); // refresh history list
        } else if (data.status === "failed") {
          setProcessingError(data.errorMessage || "Summarization failed. Please try again.");
          setProcessingId(null);
          fetchHistory();
        }
      } catch (err) {
        console.error("Polling error:", err);
      }
    };

    // Initial check right away
    checkStatus();
    pollIntervalRef.current = setInterval(checkStatus, 2500);

    return () => {
      clearInterval(stepInterval);
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [processingId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setInputError("");
    setProcessingError(null);

    const cleanUrl = videoUrl.trim();
    if (!cleanUrl) {
      setInputError("Please enter a YouTube video URL.");
      return;
    }

    if (!isValidYouTubeUrl(cleanUrl)) {
      setInputError("Please enter a valid YouTube URL (e.g. youtube.com/watch?v=... or youtu.be/...)");
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await fetch("/api/youtube-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoUrl: cleanUrl }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to process video.");
      }

      if (data.status === "completed") {
        // Fast path cache hit!
        setActiveSummary(data);
        fetchHistory();
      } else if (data._id) {
        // Asynchronous processing started
        setActiveSummary(null);
        setProcessingId(data._id);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "An unexpected error occurred.";
      setProcessingError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSelectSummary = async (id: string) => {
    try {
      setProcessingError(null);
      const res = await fetch(`/api/youtube-summary/${id}`);
      if (!res.ok) throw new Error("Failed to load summary.");
      const data: FullVideoSummary = await res.json();
      if (data.status === "processing") {
        setActiveSummary(null);
        setProcessingId(data._id);
      } else if (data.status === "failed") {
        setActiveSummary(null);
        setProcessingError(data.errorMessage || "This video summary failed previously.");
      } else {
        setActiveSummary(data);
      }
    } catch (err: unknown) {
      console.error("Select summary error:", err);
    }
  };

  const handleDeleteSummary = async (id: string) => {
    try {
      const res = await fetch(`/api/youtube-summary/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete summary.");

      if (activeSummary?._id === id) {
        setActiveSummary(null);
      }
      setHistoryItems((prev) => prev.filter((item) => item._id !== id));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Could not delete summary.";
      alert(msg);
    }
  };

  return (
    <div className="min-h-[100dvh] p-4 sm:p-6 md:p-10 space-y-10 max-w-6xl mx-auto">
      {/* ── DOUBLE-BEZEL HEADER HERO ── */}
      <div className="p-2 rounded-[2.5rem] bg-zinc-950/90 border border-white/10 ring-1 ring-white/5 shadow-2xl backdrop-blur-2xl">
        <div className="relative overflow-hidden p-6 sm:p-10 md:p-12 rounded-[calc(2.5rem-0.5rem)] bg-gradient-to-r from-violet-950/90 via-zinc-900 to-rose-950/70 border border-white/5 shadow-inner">
          <div className="absolute top-0 right-0 p-10 opacity-10 pointer-events-none">
            <Youtube className="size-72 text-rose-500" />
          </div>

          <div className="relative z-10 space-y-4 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[10px] uppercase tracking-[0.2em] font-extrabold bg-violet-500/10 text-violet-300 border border-violet-500/20 backdrop-blur-md">
              <Sparkles className="size-3.5 text-violet-400" />
              <span>Notexia AI Learning Assistant</span>
              <span className="text-zinc-600">•</span>
              <span className="text-amber-400 font-mono flex items-center gap-1">
                <Award className="size-3 text-amber-400" /> +50 XP
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-tight">
              YouTube Video <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-rose-400 to-amber-300">Summarizer</span>
            </h1>

            <p className="text-sm sm:text-base text-zinc-300 leading-relaxed">
              Turn long YouTube lectures, tutorials, and tech talks into instant executive summaries, bulleted takeaways, and interactive chapter breakdowns in seconds.
            </p>
          </div>

          {/* URL Input Form with Button-in-Button Architecture */}
          <form onSubmit={handleSubmit} className="mt-8 space-y-3 relative z-10 max-w-3xl">
            <div className="flex flex-col sm:flex-row items-center gap-3 p-2 rounded-2xl bg-zinc-950/90 border border-white/15 focus-within:border-violet-500/60 focus-within:ring-2 focus-within:ring-violet-500/20 shadow-2xl transition-all">
              <div className="flex items-center gap-3 flex-1 px-3 w-full">
                <Youtube className="size-5 text-rose-500 shrink-0" />
                <input
                  type="url"
                  value={videoUrl}
                  onChange={(e) => {
                    setVideoUrl(e.target.value);
                    if (inputError) setInputError("");
                  }}
                  placeholder="Paste YouTube video link (e.g. https://www.youtube.com/watch?v=...)"
                  className="w-full bg-transparent text-sm text-white placeholder-zinc-500 focus:outline-none py-2 font-medium"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting || Boolean(processingId)}
                className="w-full sm:w-auto group inline-flex items-center justify-center gap-2.5 pl-6 pr-3 py-3 rounded-xl text-xs font-bold uppercase tracking-wider bg-gradient-to-r from-violet-600 via-rose-600 to-rose-500 hover:from-violet-500 hover:to-rose-400 text-white shadow-xl shadow-rose-600/20 active:scale-[0.98] transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    <span>Analyzing Video...</span>
                  </>
                ) : (
                  <>
                    <span>Summarize Video</span>
                    <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Zap className="size-3 text-white fill-current" />
                    </div>
                  </>
                )}
              </button>
            </div>

            {inputError && (
              <p className="text-xs text-rose-400 font-medium flex items-center gap-1.5 pl-2 animate-in fade-in">
                <AlertCircle className="size-3.5" />
                {inputError}
              </p>
            )}
          </form>
        </div>
      </div>

      {/* ── PROCESSING SKELETON STATE ── */}
      {processingId && (
        <div className="p-8 sm:p-12 rounded-[2.5rem] bg-zinc-950/90 border border-violet-500/30 shadow-2xl backdrop-blur-2xl text-center space-y-6 animate-pulse">
          <div className="inline-flex items-center justify-center size-16 rounded-full bg-violet-500/10 border border-violet-500/30 text-violet-400">
            <Loader2 className="size-8 animate-spin" />
          </div>

          <div className="space-y-2 max-w-md mx-auto">
            <h3 className="text-xl font-extrabold text-white">Generating AI Digest...</h3>
            <p className="text-sm text-zinc-400 leading-relaxed">
              {processingStep === 1 && "Fetching video transcript & caption timing markers..."}
              {processingStep === 2 && "Fetching video metadata & thumbnail details..."}
              {processingStep === 3 && "Synthesizing executive summary, key takeaways & chapter timestamps..."}
            </p>
          </div>

          {/* Progress bar animation */}
          <div className="w-full max-w-xs mx-auto h-2 bg-zinc-900 rounded-full overflow-hidden border border-white/5">
            <div className="h-full bg-gradient-to-r from-violet-500 via-rose-500 to-amber-400 rounded-full w-2/3 animate-pulse" />
          </div>
        </div>
      )}

      {/* ── PROCESSING ERROR STATE ── */}
      {processingError && !processingId && (
        <div className="p-6 rounded-3xl bg-rose-500/10 border border-rose-500/20 text-rose-300 space-y-3 flex items-start gap-4 shadow-xl">
          <AlertCircle className="size-6 text-rose-400 shrink-0 mt-0.5" />
          <div className="flex-1 space-y-1">
            <h4 className="text-sm font-bold text-white">Summarization Notice</h4>
            <p className="text-xs text-rose-200 leading-relaxed">{processingError}</p>
          </div>
          <button
            type="button"
            onClick={() => setProcessingError(null)}
            className="text-xs font-semibold text-zinc-400 hover:text-white px-3 py-1.5 rounded-full hover:bg-white/5 transition-colors"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* ── ACTIVE SUMMARY CARD ── */}
      {activeSummary && !processingId && (
        <div className="animate-in fade-in duration-500">
          <VideoSummaryCard summary={activeSummary} onDelete={handleDeleteSummary} />
        </div>
      )}

      {/* ── PAST SUMMARIES HISTORY GRID ── */}
      <div className="space-y-6 pt-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="p-1.5 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-400">
              <History className="size-4" />
            </span>
            <h3 className="text-xl font-extrabold text-white tracking-tight">Your Past Summaries</h3>
            <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-white/5 text-zinc-400 border border-white/10">
              {historyItems.length}
            </span>
          </div>

          <button
            type="button"
            onClick={fetchHistory}
            className="flex items-center gap-2 text-xs font-semibold text-zinc-400 hover:text-white transition-colors cursor-pointer px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/5"
          >
            <RefreshCw className={`size-3.5 ${isLoadingHistory ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        {isLoadingHistory ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-24 rounded-2xl bg-zinc-950/60 border border-white/5 animate-pulse" />
            ))}
          </div>
        ) : historyItems.length === 0 ? (
          <div className="p-12 text-center rounded-[2.5rem] bg-zinc-950/50 border border-white/5 text-zinc-500 space-y-3">
            <div className="w-14 h-14 rounded-full bg-zinc-900 flex items-center justify-center mx-auto text-zinc-600 border border-white/5">
              <Youtube className="size-7 text-rose-500/50" />
            </div>
            <p className="text-base font-bold text-zinc-300">No video summaries created yet.</p>
            <p className="text-xs text-zinc-500 max-w-sm mx-auto">
              Paste a YouTube link above to generate your first AI executive digest with chapter breakdowns!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4.5">
            {historyItems.map((item) => (
              <VideoSummaryListItem
                key={item._id}
                item={item}
                isSelected={activeSummary?._id === item._id}
                onSelect={handleSelectSummary}
                onDelete={handleDeleteSummary}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
