"use client";

import React, { useEffect, useState, useCallback } from "react";
import { GraduationCap, Plus, Loader2, Download, Search, FileText, ChevronDown, ChevronUp, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useAlertStore } from "@/stores/alertStore";

interface PaperData {
  _id: string;
  title: string;
  authors: string;
  abstract: string;
  fileUrl: string;
  userId: string;
  userName: string;
  createdAt: string;
}

export default function ResearchPage() {
  const [papers, setPapers] = useState<PaperData[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [expandedPaperId, setExpandedPaperId] = useState<string | null>(null);

  // Upload Form states
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [authors, setAuthors] = useState("");
  const [abstract, setAbstract] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  const [fileName, setFileName] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { showAlert } = useAlertStore();

  const fetchPapers = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/research");
      if (res.ok) {
        const data = await res.json();
        setPapers(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPapers();
  }, [fetchPapers]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".pdf")) {
      showAlert("Invalid File Type", "Only PDF files are supported for research paper uploads.");
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setFileUrl(data.url);
        setFileName(file.name);
      } else {
        showAlert("Upload Failed", "Could not upload research paper file.");
      }
    } catch (err) {
      console.error(err);
      showAlert("Upload Error", "An error occurred during paper file upload.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleCreatePaper = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !authors.trim() || !abstract.trim() || !fileUrl || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          authors: authors.trim(),
          abstract: abstract.trim(),
          fileUrl,
        }),
      });

      if (res.ok) {
        setTitle("");
        setAuthors("");
        setAbstract("");
        setFileUrl("");
        setFileName("");
        setIsOpen(false);
        fetchPapers();
        showAlert("Success", "Research paper uploaded successfully! You gained +50 Leaderboard points.");
      } else {
        const err = await res.json();
        showAlert("Upload Failed", err.error || "Could not publish research paper.");
      }
    } catch (err) {
      console.error(err);
      showAlert("Upload Error", "An error occurred while uploading research paper metadata.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredPapers = papers.filter((paper) => {
    const search = searchQuery.toLowerCase();
    return (
      paper.title.toLowerCase().includes(search) ||
      paper.authors.toLowerCase().includes(search) ||
      paper.abstract.toLowerCase().includes(search)
    );
  });

  return (
    <div className="flex-1 flex flex-col h-full bg-neutral-950 overflow-y-auto custom-scroll relative">
      {/* Ambient glows */}
      <div className="absolute top-0 right-1/4 w-[400px] h-[300px] bg-cyan-500/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Top Banner */}
      <div className="border-b border-neutral-900 bg-neutral-955/80 backdrop-blur-md px-4 sm:px-8 py-4 sm:py-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shrink-0 select-none z-10 relative">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-cyan-400" />
            <h1
              className="text-xl font-bold text-neutral-100 tracking-tight"
              style={{ fontFamily: "var(--font-space-grotesk)" }}
            >
              Research Repository
            </h1>
          </div>
          <p className="text-neutral-500 text-xs">
            Submit and review peer-reviewed research papers and academic reports.
          </p>
        </div>

        <Button
          onClick={() => setIsOpen(true)}
          className="bg-cyan-500 hover:bg-cyan-400 text-neutral-950 text-xs font-bold gap-1.5 h-9 px-4 rounded-lg shadow-[0_0_12px_rgba(6,182,212,0.25)] transition-all font-space-grotesk"
        >
          <Plus className="h-4 w-4" /> Upload Paper
        </Button>
      </div>

      {/* Search and Stats Section */}
      <div className="p-4 sm:p-8 max-w-5xl w-full mx-auto space-y-6 z-10 relative">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:max-w-md">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-neutral-600" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title, authors, or abstract keywords..."
              className="bg-neutral-900/40 border-neutral-900 text-xs pl-10 focus:border-cyan-400 placeholder-neutral-600 h-10 rounded-xl"
            />
          </div>

          {/* Quick Academic Stats */}
          <div className="flex gap-4 select-none self-stretch md:self-auto justify-between">
            <div className="bg-neutral-900/20 border border-neutral-900 rounded-xl px-4 py-2 text-center flex-1 md:flex-initial">
              <p className="text-[9px] text-neutral-500 uppercase tracking-widest font-mono">Total Papers</p>
              <p className="text-sm font-bold text-neutral-200 mt-0.5">{papers.length}</p>
            </div>
            <div className="bg-neutral-900/20 border border-neutral-900 rounded-xl px-4 py-2 text-center flex-1 md:flex-initial">
              <p className="text-[9px] text-neutral-500 uppercase tracking-widest font-mono">Upload Reward</p>
              <p className="text-sm font-bold text-cyan-400 mt-0.5">+50 pts</p>
            </div>
          </div>
        </div>

        {/* Papers Listing */}
        {isLoading ? (
          <div className="py-24 flex flex-col items-center justify-center text-neutral-500 text-xs gap-2 select-none font-semibold">
            <Loader2 className="h-6 w-6 animate-spin text-cyan-400" />
            <span style={{ fontFamily: "var(--font-jetbrains-mono)" }}>RETRIEVING RESEARCH PAPERS...</span>
          </div>
        ) : filteredPapers.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center text-center space-y-4 border border-dashed border-neutral-900 rounded-2xl bg-neutral-900/5 select-none">
            <FileText className="h-10 w-10 text-neutral-750" />
            <div className="space-y-1">
              <h3 className="text-neutral-300 font-bold text-sm" style={{ fontFamily: "var(--font-space-grotesk)" }}>
                No papers found
              </h3>
              <p className="text-neutral-550 text-xs max-w-xs leading-normal">
                {searchQuery ? "Try checking spelling or adjusting query keywords." : "Be the first to publish a research paper in the repository!"}
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredPapers.map((paper) => {
              const isExpanded = expandedPaperId === paper._id;

              return (
                <div
                  key={paper._id}
                  onClick={() => setExpandedPaperId(isExpanded ? null : paper._id)}
                  className="bg-neutral-900/10 border border-neutral-900 hover:border-cyan-500/25 hover:shadow-[0_0_20px_rgba(6,182,212,0.05)] rounded-2xl p-6 transition-all duration-300 cursor-pointer space-y-4 flex flex-col justify-between group"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <span className="text-[8px] bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-2 py-0.5 rounded font-bold uppercase tracking-widest font-mono">
                        PDF Document
                      </span>
                      <span className="text-[8px] text-neutral-600 font-mono">
                        ID: {paper._id.substring(0, 8)}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <h2
                        className="text-xs font-bold text-neutral-200 group-hover:text-cyan-400 transition-colors leading-snug"
                        style={{ fontFamily: "var(--font-space-grotesk)" }}
                      >
                        {paper.title}
                      </h2>
                      <p className="text-[10px] text-neutral-450 italic">
                        By: {paper.authors}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3 pt-2">
                    <div className="flex items-center justify-between border-t border-neutral-900/60 pt-3 text-[9px] text-neutral-550 font-mono select-none">
                      <span>Contributor: {paper.userName}</span>
                      <span>{new Date(paper.createdAt).toLocaleDateString()}</span>
                    </div>

                    {isExpanded && (
                      <div className="pt-2 space-y-2.5 cursor-default border-t border-neutral-900/40" onClick={(e) => e.stopPropagation()}>
                        <h4 className="text-[8px] font-bold text-neutral-400 uppercase tracking-widest font-space-grotesk">
                          Abstract Summary
                        </h4>
                        <p className="text-neutral-400 text-[10px] leading-relaxed whitespace-pre-wrap">
                          {paper.abstract}
                        </p>
                      </div>
                    )}

                    <div className="flex gap-2 pt-1 select-none" onClick={(e) => e.stopPropagation()}>
                      <Button
                        onClick={() => setExpandedPaperId(isExpanded ? null : paper._id)}
                        variant="outline"
                        className="flex-1 border-neutral-850 hover:border-neutral-700 bg-neutral-950 text-neutral-400 hover:text-neutral-200 text-[10px] font-bold font-space-grotesk h-8"
                      >
                        {isExpanded ? "Hide Abstract" : "Read Abstract"}
                      </Button>

                      <a
                        href={paper.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 bg-cyan-500 hover:bg-cyan-400 text-neutral-950 hover:shadow-[0_0_10px_rgba(6,182,212,0.2)] text-[10px] font-extrabold font-space-grotesk h-8 rounded-lg transition-all flex items-center justify-center gap-1"
                      >
                        <Download className="h-3 w-3" />
                        <span>Download PDF</span>
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Upload Paper Modal Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="bg-neutral-900 border border-neutral-800 text-neutral-100 max-w-md cyber-panel">
          <form onSubmit={handleCreatePaper} className="space-y-4">
            <DialogHeader>
              <DialogTitle
                className="text-neutral-100 text-sm font-bold"
                style={{ fontFamily: "var(--font-space-grotesk)" }}
              >
                Upload Academic Research Paper
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-3 py-2 text-xs">
              <Input
                placeholder="Paper Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="bg-neutral-950 border-neutral-850 focus:border-cyan-400 text-neutral-100 placeholder-neutral-600 h-10 text-xs"
              />

              <Input
                placeholder="Authors (e.g. Jane Doe, John Smith)"
                value={authors}
                onChange={(e) => setAuthors(e.target.value)}
                required
                className="bg-neutral-950 border-neutral-855 focus:border-cyan-400 text-neutral-100 placeholder-neutral-650 h-10 text-xs"
              />

              <textarea
                placeholder="Abstract / Short Description..."
                value={abstract}
                onChange={(e) => setAbstract(e.target.value)}
                required
                rows={5}
                className="w-full rounded-xl bg-neutral-950 border border-neutral-855 focus:border-cyan-400 text-neutral-105 placeholder-neutral-700 p-3 text-xs focus:outline-none resize-none transition-colors"
              />

              {/* PDF File uploader */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block font-space-grotesk">
                  Upload PDF Document
                </label>
                {fileUrl ? (
                  <div className="flex items-center justify-between p-2.5 bg-neutral-950 border border-neutral-850 rounded-xl text-xs">
                    <span className="text-neutral-450 truncate max-w-[220px] font-mono text-[10px]">
                      {fileName || "ResearchPaper.pdf"}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setFileUrl("");
                        setFileName("");
                      }}
                      className="text-[10px] text-red-400 hover:underline font-bold font-space-grotesk"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <label className="flex items-center justify-center border border-dashed border-neutral-850 hover:border-neutral-750 bg-neutral-950/40 rounded-xl p-3.5 cursor-pointer transition-all gap-1.5 text-xs text-neutral-400 hover:text-neutral-200">
                    {isUploading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin text-cyan-400" />
                        <span className="font-space-grotesk text-[10px] font-bold">Uploading Document...</span>
                      </>
                    ) : (
                      <>
                        <FileText className="h-4 w-4 text-cyan-400" />
                        <span className="font-space-grotesk text-[10px] font-bold">Upload PDF File</span>
                      </>
                    )}
                    <input
                      type="file"
                      accept="application/pdf"
                      onChange={handleFileUpload}
                      disabled={isUploading}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                type="button"
                onClick={() => setIsOpen(false)}
                className="border-neutral-805 text-neutral-400 hover:text-white bg-neutral-950 hover:bg-neutral-900 text-xs h-9"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || isUploading || !fileUrl}
                className="bg-cyan-500 hover:bg-cyan-400 text-neutral-950 font-bold text-xs h-9 px-4 shadow-[0_0_12px_rgba(6,182,212,0.25)] transition-all font-space-grotesk flex items-center gap-1"
              >
                {isSubmitting ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <>
                    <Sparkles className="h-3.5 w-3.5 text-neutral-950" />
                    <span>Upload &amp; Gain Points (+50 pts)</span>
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
