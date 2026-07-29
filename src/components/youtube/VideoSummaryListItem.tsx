/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState } from "react";
import { Trash2, Loader2, CheckCircle2, AlertCircle } from "lucide-react";

function Youtube({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  );
}

export interface SummaryListItemData {
  _id: string;
  videoId: string;
  videoUrl: string;
  title?: string;
  thumbnailUrl?: string;
  channelName?: string;
  durationSeconds?: number;
  status: "processing" | "completed" | "failed";
  errorMessage?: string;
  createdAt: string;
}

interface VideoSummaryListItemProps {
  item: SummaryListItemData;
  isSelected?: boolean;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
}

export function VideoSummaryListItem({
  item,
  isSelected,
  onSelect,
  onDelete,
}: VideoSummaryListItemProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const formatDuration = (seconds?: number) => {
    if (!seconds) return "";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return "";
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this summary?")) {
      setIsDeleting(true);
      onDelete(item._id);
    }
  };

  return (
    <div
      onClick={() => onSelect(item._id)}
      className={`group relative flex items-center gap-4 p-3 rounded-2xl border transition-all duration-300 cursor-pointer select-none ${
        isSelected
          ? "bg-gradient-to-r from-violet-950/40 to-zinc-900 border-violet-500/50 shadow-xl shadow-violet-500/10 ring-1 ring-violet-500/30 scale-[1.01]"
          : "bg-zinc-900/70 hover:bg-zinc-850/80 border-white/10 hover:border-white/20 shadow-md"
      }`}
    >
      {/* Thumbnail Shell */}
      <div className="relative shrink-0 w-24 h-16 rounded-xl overflow-hidden bg-zinc-950 p-0.5 border border-white/10 shadow-inner group-hover:border-white/20 transition-colors">
        <div className="w-full h-full rounded-lg overflow-hidden relative">
          {item.thumbnailUrl ? (
            <img
              src={item.thumbnailUrl}
              alt={item.title || "YouTube Thumbnail"}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-zinc-900 text-zinc-600">
              <Youtube className="size-6 text-rose-500" />
            </div>
          )}
          {item.durationSeconds ? (
            <span className="absolute bottom-1 right-1 bg-black/85 backdrop-blur-xs text-[10px] font-mono px-1.5 py-0.5 rounded-md text-white font-semibold border border-white/10">
              {formatDuration(item.durationSeconds)}
            </span>
          ) : null}
        </div>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0 pr-1 space-y-1">
        <h4 className="text-sm font-bold text-zinc-100 group-hover:text-violet-300 transition-colors line-clamp-1">
          {item.title || (item.status === "processing" ? "Processing Video..." : `Video ID: ${item.videoId}`)}
        </h4>

        <div className="flex items-center gap-2 text-xs text-zinc-400">
          <span className="truncate max-w-[130px] font-semibold text-zinc-300">
            {item.channelName || "YouTube"}
          </span>
          <span className="text-zinc-600">•</span>
          <span className="text-zinc-500 font-mono text-[11px]">{formatDate(item.createdAt)}</span>
        </div>

        {/* Status Badge */}
        <div className="pt-0.5 flex items-center gap-1.5">
          {item.status === "completed" && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 className="size-2.5" />
              Completed
            </span>
          )}
          {item.status === "processing" && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse">
              <Loader2 className="size-2.5 animate-spin" />
              Processing
            </span>
          )}
          {item.status === "failed" && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <AlertCircle className="size-2.5" />
              Failed
            </span>
          )}
        </div>
      </div>

      {/* Delete button */}
      <button
        type="button"
        onClick={handleDelete}
        disabled={isDeleting}
        className="opacity-0 group-hover:opacity-100 p-2 rounded-xl text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all cursor-pointer shrink-0 active:scale-95"
        title="Delete Summary"
      >
        {isDeleting ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
      </button>
    </div>
  );
}
