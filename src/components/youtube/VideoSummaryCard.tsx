/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState } from "react";
import {
  Clock,
  Sparkles,
  ListChecks,
  ListVideo,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Trash2,
  Share2,
  Check,
  Award,
} from "lucide-react";

function Youtube({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  );
}

export interface Chapter {
  timestampSeconds: number;
  title: string;
  summary: string;
}

export interface FullVideoSummary {
  _id: string;
  videoId: string;
  videoUrl: string;
  title?: string;
  thumbnailUrl?: string;
  channelName?: string;
  durationSeconds?: number;
  summary?: string;
  keyPoints?: string[];
  chapters?: Chapter[];
  status: "processing" | "completed" | "failed";
  errorMessage?: string;
  xpAwarded?: boolean;
  createdAt?: string;
}

interface VideoSummaryCardProps {
  summary: FullVideoSummary;
  onDelete?: (id: string) => void;
}

export function VideoSummaryCard({ summary, onDelete }: VideoSummaryCardProps) {
  const [chaptersOpen, setChaptersOpen] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [copied, setCopied] = useState(false);

  const formatDuration = (seconds?: number) => {
    if (!seconds) return "N/A";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    const hrs = Math.floor(mins / 60);
    if (hrs > 0) {
      const remMins = mins % 60;
      return `${hrs}h ${remMins}m ${secs < 10 ? "0" : ""}${secs}s`;
    }
    return `${mins}m ${secs < 10 ? "0" : ""}${secs}s`;
  };

  const formatTimestamp = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    const hrs = Math.floor(mins / 60);
    if (hrs > 0) {
      const remMins = mins % 60;
      return `${hrs}:${remMins < 10 ? "0" : ""}${remMins}:${secs < 10 ? "0" : ""}${secs}`;
    }
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const handleCopySummary = async () => {
    const textToCopy = `🎬 ${summary.title || "YouTube Video Digest"} (${summary.channelName})\n\nSUMMARY:\n${summary.summary}\n\nKEY TAKEAWAYS:\n${summary.keyPoints?.map((kp) => `• ${kp}`).join("\n")}\n\nWatch full video: ${summary.videoUrl}`;
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy summary:", err);
    }
  };

  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this video summary?")) {
      setIsDeleting(true);
      onDelete?.(summary._id);
    }
  };

  return (
    /* Double-Bezel Hardware Container Architecture */
    <div className="w-full p-2 rounded-[2.5rem] bg-zinc-950/80 border border-white/10 ring-1 ring-white/5 shadow-2xl backdrop-blur-2xl transition-all duration-300">
      <div className="w-full rounded-[calc(2.5rem-0.5rem)] bg-zinc-900/90 overflow-hidden border border-white/5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]">
        {/* Header Container */}
        <div className="relative p-6 sm:p-8 md:p-10 bg-gradient-to-b from-violet-950/40 via-zinc-900/60 to-zinc-900 border-b border-white/10">
          <div className="flex flex-col md:flex-row items-start gap-6 md:gap-8">
            {/* Double-Bezel Thumbnail Enclosure */}
            <div className="relative w-full md:w-80 aspect-video shrink-0 p-1.5 rounded-2xl bg-zinc-950/90 border border-white/15 shadow-2xl group overflow-hidden">
              <div className="relative w-full h-full rounded-xl overflow-hidden bg-zinc-950">
                {summary.thumbnailUrl ? (
                  <img
                    src={summary.thumbnailUrl}
                    alt={summary.title || "Video Thumbnail"}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)]"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-zinc-900 text-zinc-600">
                    <Youtube className="size-12 text-rose-500" />
                  </div>
                )}
                <a
                  href={summary.videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 text-white font-medium text-xs backdrop-blur-md transition-opacity duration-300"
                >
                  <Youtube className="size-5 text-rose-500" />
                  Watch on YouTube
                  <ExternalLink className="size-3.5" />
                </a>
                {summary.durationSeconds ? (
                  <span className="absolute bottom-2 right-2 bg-black/90 backdrop-blur-md text-[11px] font-mono px-2 py-0.5 rounded-md text-white font-semibold border border-white/10">
                    {formatDuration(summary.durationSeconds)}
                  </span>
                ) : null}
              </div>
            </div>

            {/* Title & Metadata */}
            <div className="flex-1 min-w-0 space-y-3.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] uppercase tracking-[0.2em] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                  <Youtube className="size-3" />
                  YouTube AI Digest
                </span>
                {summary.xpAwarded && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] uppercase tracking-[0.15em] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/20 shadow-sm shadow-amber-500/10">
                    <Award className="size-3 text-amber-400" />
                    +50 XP Earned
                  </span>
                )}
              </div>

              <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white leading-snug tracking-tight">
                {summary.title || "Untitled YouTube Video"}
              </h2>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-zinc-400">
                <span className="font-semibold text-zinc-200">{summary.channelName || "Creator"}</span>
                <span className="text-zinc-600">•</span>
                <span className="flex items-center gap-1 text-zinc-400 font-mono text-xs">
                  <Clock className="size-3.5" />
                  {formatDuration(summary.durationSeconds)}
                </span>
              </div>

              {/* Button-in-Button Trailing Icon Action Bar */}
              <div className="pt-3 flex flex-wrap items-center gap-3">
                <a
                  href={summary.videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex items-center gap-2.5 pl-4 pr-2 py-2 rounded-full text-xs font-semibold bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white shadow-lg shadow-rose-600/25 active:scale-[0.98] transition-all duration-200 cursor-pointer"
                >
                  <span>Open Original Video</span>
                  <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <ExternalLink className="size-3 text-white" />
                  </div>
                </a>

                <button
                  type="button"
                  onClick={handleCopySummary}
                  className="group inline-flex items-center gap-2.5 pl-4 pr-2 py-2 rounded-full text-xs font-medium bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-200 active:scale-[0.98] transition-all duration-200 cursor-pointer"
                >
                  <span>{copied ? "Copied Digest!" : "Share Summary"}</span>
                  <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                    {copied ? <Check className="size-3 text-emerald-400" /> : <Share2 className="size-3 text-zinc-400" />}
                  </div>
                </button>

                {onDelete && (
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-300 transition-all cursor-pointer ml-auto active:scale-[0.98]"
                  >
                    <Trash2 className="size-3.5" />
                    Delete
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Body */}
        <div className="p-6 sm:p-8 md:p-10 space-y-10">
          {/* Executive Overview Section */}
          <div className="space-y-3.5">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-400">
                <Sparkles className="size-4" />
              </span>
              <h3 className="text-base font-bold text-white tracking-tight">Executive Overview</h3>
            </div>
            <div className="p-6 rounded-2xl bg-gradient-to-br from-violet-950/30 via-zinc-950/60 to-zinc-950 border border-violet-500/20 text-zinc-200 leading-relaxed text-sm sm:text-base shadow-inner">
              {summary.summary || "No overview summary provided."}
            </div>
          </div>

          {/* Key Takeaways Section */}
          {summary.keyPoints && summary.keyPoints.length > 0 && (
            <div className="space-y-3.5">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                  <ListChecks className="size-4" />
                </span>
                <h3 className="text-base font-bold text-white tracking-tight">Key Takeaways</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {summary.keyPoints.map((kp, idx) => (
                  <div
                    key={idx}
                    className="group flex items-start gap-3.5 p-4 rounded-2xl bg-zinc-950/60 border border-white/5 hover:border-emerald-500/30 transition-all duration-300 text-sm text-zinc-200 hover:shadow-lg hover:shadow-emerald-500/5"
                  >
                    <span className="shrink-0 flex items-center justify-center size-6 rounded-full bg-emerald-500/10 text-emerald-400 font-mono text-xs font-bold border border-emerald-500/20 mt-0.5 group-hover:bg-emerald-500 group-hover:text-black transition-colors">
                      {idx + 1}
                    </span>
                    <span className="leading-snug">{kp}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Chapters Breakdown Section */}
          {summary.chapters && summary.chapters.length > 0 && (
            <div className="space-y-4 border-t border-white/10 pt-8">
              <button
                type="button"
                onClick={() => setChaptersOpen((prev) => !prev)}
                className="w-full flex items-center justify-between p-3.5 rounded-2xl hover:bg-white/5 transition-colors cursor-pointer group select-none"
              >
                <div className="flex items-center gap-2.5">
                  <span className="p-1.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                    <ListVideo className="size-4" />
                  </span>
                  <h3 className="text-base font-bold text-white tracking-tight">Video Chapters Breakdown</h3>
                  <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 ml-2">
                    {summary.chapters.length} chapters
                  </span>
                </div>
                {chaptersOpen ? (
                  <ChevronUp className="size-5 text-zinc-400 group-hover:text-white" />
                ) : (
                  <ChevronDown className="size-5 text-zinc-400 group-hover:text-white" />
                )}
              </button>

              {chaptersOpen && (
                <div className="space-y-3 max-h-[440px] overflow-y-auto pr-1 custom-scrollbar">
                  {summary.chapters.map((chap, idx) => (
                    <a
                      key={idx}
                      href={`https://youtube.com/watch?v=${summary.videoId}&t=${chap.timestampSeconds}s`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group/item flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 p-4 sm:p-5 rounded-2xl bg-zinc-950/70 hover:bg-zinc-800/70 border border-white/5 hover:border-cyan-500/40 transition-all duration-300 cursor-pointer shadow-sm hover:shadow-cyan-500/5"
                    >
                      <div className="flex items-start gap-3.5 min-w-0">
                        <span className="shrink-0 font-mono text-xs font-bold px-3 py-1.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 group-hover/item:bg-cyan-500 group-hover/item:text-black transition-colors">
                          {formatTimestamp(chap.timestampSeconds)}
                        </span>
                        <div className="space-y-1">
                          <h4 className="text-sm font-bold text-white group-hover/item:text-cyan-300 transition-colors">
                            {chap.title}
                          </h4>
                          {chap.summary && <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">{chap.summary}</p>}
                        </div>
                      </div>

                      <div className="shrink-0 flex items-center gap-1.5 text-xs font-semibold text-cyan-400 opacity-80 group-hover/item:opacity-100 transition-opacity">
                        <span>Jump to {formatTimestamp(chap.timestampSeconds)}</span>
                        <ExternalLink className="size-3.5" />
                      </div>
                    </a>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
