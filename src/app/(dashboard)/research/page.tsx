"use client";

export const dynamic = "force-dynamic";

import React, { useEffect, useState, useCallback } from "react";
import {
  GraduationCap,
  Loader2,
  Download,
  Search,
  FileText,
  Edit,
  ArrowLeft,
  Upload,
  ExternalLink,
  X,
  Wand2,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useAlertStore } from "@/stores/alertStore";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import { SimpleEditor } from "@/components/editor/SimpleEditor";
import { BlogContentRenderer } from "@/components/blog/BlogContentRenderer";
import { TopicGeneratorModal } from "@/components/notes/TopicGeneratorModal";
import { NoteSideChat } from "@/components/notes/NoteSideChat";

interface PaperData {
  _id: string;
  title: string;
  authors: string;
  abstract: string;
  fileUrl: string;
  content?: string;
  userId: string;
  userName: string;
  createdAt: string;
}

export default function ResearchPage() {
  const { data: session } = useSession();
  const currentUserId = session?.user?.id;
  const [papers, setPapers] = useState<PaperData[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Split-screen detailed view & editor states
  const [selectedPaper, setSelectedPaper] = useState<PaperData | null>(null);
  const [isWriting, setIsWriting] = useState(false);
  const [showAiSideChat, setShowAiSideChat] = useState(true);

  // Editor states
  const [editingPaperId, setEditingPaperId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editAuthors, setEditAuthors] = useState("");
  const [editAbstract, setEditAbstract] = useState("");
  const [editContent, setEditContent] = useState("");
  const [isSubmittingWrite, setIsSubmittingWrite] = useState(false);
  const [showAiTopicModal, setShowAiTopicModal] = useState(false);

  // Upload PDF Modal states
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadAuthors, setUploadAuthors] = useState("");
  const [uploadAbstract, setUploadAbstract] = useState("");
  const [uploadFileUrl, setUploadFileUrl] = useState("");
  const [uploadFileName, setUploadFileName] = useState("");
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [isSubmittingUpload, setIsSubmittingUpload] = useState(false);

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

    if (file.type !== "application/pdf") {
      toast.error("Please upload a valid PDF document.");
      return;
    }

    setIsUploadingFile(true);
    setUploadFileName(file.name);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setUploadFileUrl(data.url);
        toast.success("PDF uploaded successfully!");
      } else {
        toast.error("Failed to upload PDF file.");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred during file upload.");
    } finally {
      setIsUploadingFile(false);
    }
  };

  const handlePublishUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadTitle.trim() || !uploadAuthors.trim() || !uploadAbstract.trim() || !uploadFileUrl) {
      toast.error("Please fill all required fields and upload a PDF.");
      return;
    }

    setIsSubmittingUpload(true);
    try {
      const res = await fetch("/api/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: uploadTitle.trim(),
          authors: uploadAuthors.trim(),
          abstract: uploadAbstract.trim(),
          fileUrl: uploadFileUrl,
        }),
      });

      if (res.ok) {
        setUploadTitle("");
        setUploadAuthors("");
        setUploadAbstract("");
        setUploadFileUrl("");
        setUploadFileName("");
        setIsUploadOpen(false);
        fetchPapers();
        toast.success("Research paper published successfully! You gained +50 points.");
      } else {
        const err = await res.json();
        showAlert("Publish Failed", err.error || "Could not publish paper.");
      }
    } catch (err) {
      console.error(err);
      showAlert("Publish Error", "An error occurred while saving paper.");
    } finally {
      setIsSubmittingUpload(false);
    }
  };

  const handlePublishWritten = async () => {
    if (!editTitle.trim() || !editAuthors.trim() || !editAbstract.trim() || !editContent.trim()) {
      toast.error("Please provide title, authors, abstract, and paper content.");
      return;
    }

    setIsSubmittingWrite(true);
    try {
      const isUpdate = !!editingPaperId;
      const url = isUpdate ? `/api/research/${editingPaperId}` : "/api/research";
      const method = isUpdate ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editTitle.trim(),
          authors: editAuthors.trim(),
          abstract: editAbstract.trim(),
          content: editContent,
        }),
      });

      if (res.ok) {
        setEditTitle("");
        setEditAuthors("");
        setEditAbstract("");
        setEditContent("");
        setEditingPaperId(null);
        setIsWriting(false);
        fetchPapers();
        toast.success(isUpdate ? "Research paper updated successfully!" : "Research paper published successfully! You gained +50 points.");
      } else {
        const err = await res.json();
        showAlert("Publish Failed", err.error || "Could not publish paper.");
      }
    } catch (err) {
      console.error(err);
      showAlert("Publish Error", "An error occurred while saving written paper.");
    } finally {
      setIsSubmittingWrite(false);
    }
  };

  const handleStartEditPaper = (paper: PaperData, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingPaperId(paper._id);
    setEditTitle(paper.title);
    setEditAuthors(paper.authors);
    setEditAbstract(paper.abstract);
    setEditContent(paper.content || "");
    setSelectedPaper(null);
    setIsWriting(true);
  };

  const handleDeletePaper = async (paperId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!confirm("Are you sure you want to delete this research paper?")) return;

    try {
      const res = await fetch(`/api/research/${paperId}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Research paper deleted successfully!");
        if (selectedPaper?._id === paperId) {
          setSelectedPaper(null);
        }
        fetchPapers();
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to delete paper.");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred while deleting the paper.");
    }
  };

  const filteredPapers = papers.filter(
    (p) =>
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.authors.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.abstract.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex-1 flex flex-col h-full bg-transparent text-text-primary overflow-y-auto antialiased relative selection:bg-accent-primary/30 selection:text-text-primary p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl mx-auto w-full">
      {/* Header Banner */}
      <header className="rounded-2xl bg-bg-surface border border-border-subtle p-6 sm:p-8 backdrop-blur-xl shadow-lg relative z-10">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
          <div className="flex items-start sm:items-center gap-4">
            <div className="size-12 sm:size-14 rounded-2xl bg-accent-primary/10 border border-accent-primary/20 flex items-center justify-center text-accent-primary shrink-0 shadow-sm">
              <GraduationCap className="size-6 sm:size-7" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="text-[10px] font-mono font-bold text-accent-primary tracking-widest uppercase">
                  ACADEMIC ARCHIVE
                </span>
                <span className="text-[10px] font-mono font-bold bg-accent-primary/10 text-accent-primary px-2.5 py-0.5 rounded-full border border-accent-primary/20 uppercase tracking-widest flex items-center gap-1">
                  <Wand2 className="size-3" /> AI RESEARCH COPILOT
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-text-primary font-display">
                Research Workspace
              </h1>
              <p className="text-xs sm:text-sm text-text-muted max-w-xl leading-relaxed">
                Publish academic papers, analyze PDFs with AI side assistants, and collaborate on scholarly research.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap shrink-0">
            <Button
              onClick={() => setShowAiTopicModal(true)}
              className="btn-premium-primary rounded-xl text-xs font-bold h-10 px-4 flex items-center gap-2 cursor-pointer"
            >
              <Wand2 className="size-3.5" />
              <span>AI Paper Writer</span>
            </Button>

            <Button
              onClick={() => {
                setIsWriting(true);
                setSelectedPaper(null);
              }}
              variant="outline"
              className="rounded-xl border-border-subtle bg-bg-elevated hover:bg-bg-card text-text-primary text-xs font-bold h-10 px-4 flex items-center gap-2 cursor-pointer"
            >
              <Edit className="size-3.5" /> Write Paper
            </Button>

            <Button
              onClick={() => setIsUploadOpen(true)}
              variant="outline"
              className="rounded-xl border-border-subtle bg-bg-elevated hover:bg-bg-card text-text-primary text-xs font-bold h-10 px-4 flex items-center gap-2 cursor-pointer"
            >
              <Upload className="size-3.5" />
              <span>Upload PDF</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="w-full space-y-6 relative z-10">
        {isWriting ? (
          <div className="w-full space-y-6">
            <div className="flex items-center justify-between border-b border-border-subtle pb-4">
              <button
                onClick={() => setIsWriting(false)}
                className="flex items-center gap-1.5 text-xs font-mono text-text-muted hover:text-text-primary font-bold uppercase tracking-wider cursor-pointer"
              >
                <ArrowLeft className="size-4" /> Cancel &amp; Back
              </button>
              <Button
                onClick={handlePublishWritten}
                disabled={isSubmittingWrite}
                className="btn-premium-primary rounded-xl text-xs font-bold h-10 px-5 cursor-pointer"
              >
                {isSubmittingWrite ? <Loader2 className="size-4 animate-spin" /> : "Publish Research Paper"}
              </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              <div className="lg:col-span-8 space-y-5">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono font-bold text-text-muted uppercase tracking-wider block">Title</label>
                    <Input
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      placeholder="Research Paper Title..."
                      className="bg-bg-base border-border-subtle text-text-primary placeholder:text-text-muted h-10 text-xs rounded-xl focus:border-accent-primary"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono font-bold text-text-muted uppercase tracking-wider block">Authors</label>
                    <Input
                      value={editAuthors}
                      onChange={(e) => setEditAuthors(e.target.value)}
                      placeholder="e.g. Dr. A. Sharma, Prof. B. Roy"
                      className="bg-bg-base border-border-subtle text-text-primary placeholder:text-text-muted h-10 text-xs rounded-xl focus:border-accent-primary"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono font-bold text-text-muted uppercase tracking-wider block">Abstract</label>
                  <textarea
                    value={editAbstract}
                    onChange={(e) => setEditAbstract(e.target.value)}
                    placeholder="Summary of methodology, experimental setup, and primary findings..."
                    rows={3}
                    className="w-full bg-bg-base border border-border-subtle rounded-xl p-3 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-primary resize-none leading-relaxed"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono font-bold text-text-muted uppercase tracking-wider block">Paper Content</label>
                  <SimpleEditor value={editContent} onChange={setEditContent} placeholder="Write paper sections using Markdown..." />
                </div>
              </div>

              {/* Side AI Assistant Panel */}
              <div className="lg:col-span-4 rounded-2xl bg-bg-surface border border-border-subtle overflow-hidden flex flex-col h-[650px] lg:sticky lg:top-6 shadow-sm">
                <NoteSideChat
                  noteTitle={editTitle || "Research Paper Draft"}
                  noteContentText={editContent}
                  onInsertText={(insertedText) => {
                    setEditContent((prev) => (prev ? `${prev}\n\n${insertedText}` : insertedText));
                    toast.success("Inserted AI response into research paper editor!");
                  }}
                />
              </div>
            </div>
          </div>
        ) : selectedPaper ? (
          <div className="w-full space-y-6">
            <div className="flex items-center justify-between border-b border-border-subtle pb-4">
              <button
                onClick={() => setSelectedPaper(null)}
                className="flex items-center gap-1.5 text-xs font-mono text-text-muted hover:text-text-primary font-bold uppercase tracking-wider cursor-pointer"
              >
                <ArrowLeft className="size-4" /> Back to Archive
              </button>
              <div className="flex items-center gap-2">
                {(currentUserId === selectedPaper.userId || session?.user?.role === "admin") && (
                  <>
                    <button
                      onClick={(e) => handleStartEditPaper(selectedPaper, e)}
                      className="text-xs font-mono font-bold px-3 py-1.5 rounded-lg bg-bg-elevated border border-border-subtle text-text-secondary hover:text-text-primary flex items-center gap-1 transition-all cursor-pointer"
                      title="Edit Paper"
                    >
                      <Edit className="size-3.5 text-accent-primary" /> Edit
                    </button>
                    <button
                      onClick={(e) => handleDeletePaper(selectedPaper._id, e)}
                      className="text-xs font-mono font-bold px-3 py-1.5 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive hover:bg-destructive/20 flex items-center gap-1 transition-all cursor-pointer"
                      title="Delete Paper"
                    >
                      <Trash2 className="size-3.5" /> Delete
                    </button>
                  </>
                )}
                <button
                  onClick={() => setShowAiSideChat((prev) => !prev)}
                  className={`text-xs font-mono font-bold px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                    showAiSideChat ? "bg-accent-primary/15 text-accent-primary border border-accent-primary/30" : "bg-bg-elevated text-text-muted border border-border-subtle hover:text-text-primary"
                  }`}
                >
                  <Wand2 className="size-3.5 text-accent-primary" />
                  <span>{showAiSideChat ? "Hide AI Side Chat" : "✨ AI Side Chat"}</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Paper Content */}
              <div className={showAiSideChat ? "lg:col-span-8 space-y-6" : "lg:col-span-12 space-y-6"}>
                <div className="space-y-2 border-b border-border-subtle pb-6">
                  <h2 className="text-2xl sm:text-3xl font-bold text-text-primary tracking-tight font-display">{selectedPaper.title}</h2>
                  <p className="text-xs sm:text-sm font-mono text-accent-primary">Authors: {selectedPaper.authors}</p>
                </div>

                <div className="p-5 bg-bg-surface rounded-2xl border-l-4 border-accent-primary border-y border-r border-border-subtle space-y-1.5 shadow-sm">
                  <span className="text-[10px] font-mono font-bold text-accent-primary uppercase tracking-widest block">ABSTRACT</span>
                  <p className="text-xs sm:text-sm text-text-secondary leading-relaxed font-light">{selectedPaper.abstract}</p>
                </div>

                {selectedPaper.fileUrl ? (
                  <div className="space-y-4">
                    <a
                      href={selectedPaper.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 text-xs font-mono text-accent-primary hover:underline font-bold"
                    >
                      <Download className="size-4" /> Download PDF Research Document
                    </a>
                    <div className="w-full h-[600px] rounded-2xl border border-border-subtle overflow-hidden bg-bg-card">
                      <iframe
                        src={selectedPaper.fileUrl}
                        title="PDF Viewer"
                        className="w-full h-full border-none"
                      />
                    </div>
                  </div>
                ) : selectedPaper.content ? (
                  <div className="w-full pt-2" id="research-paper-body">
                    <BlogContentRenderer content={selectedPaper.content} />
                  </div>
                ) : null}
              </div>

              {/* AI Copilot Side Chat Sidebar */}
              {showAiSideChat && (
                <div className="lg:col-span-4 rounded-2xl bg-bg-surface border border-border-subtle overflow-hidden flex flex-col h-[650px] lg:sticky lg:top-6 shadow-sm">
                  <NoteSideChat
                    noteTitle={selectedPaper.title}
                    noteContentText={selectedPaper.content || selectedPaper.abstract}
                    onInsertText={(insertedText) => {
                      setEditTitle(selectedPaper.title);
                      setEditAuthors(selectedPaper.authors);
                      setEditAbstract(selectedPaper.abstract);
                      setEditContent((prev) => (prev ? `${prev}\n\n${insertedText}` : selectedPaper.content ? `${selectedPaper.content}\n\n${insertedText}` : insertedText));
                      setIsWriting(true);
                      setSelectedPaper(null);
                      toast.success("Added AI response into research paper editor!");
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-3.5 top-3 size-4 text-text-muted" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search research paper titles, authors..."
                className="bg-bg-base border-border-subtle focus:border-accent-primary text-text-primary placeholder:text-text-muted h-10 text-xs pl-10 rounded-xl"
              />
            </div>

            {isLoading ? (
              <div className="py-20 flex flex-col items-center justify-center text-text-muted text-xs gap-3">
                <Loader2 className="size-8 animate-spin text-accent-primary" />
                <span className="font-mono text-text-muted tracking-widest uppercase">Loading Academic Archive...</span>
              </div>
            ) : filteredPapers.length === 0 ? (
              <div className="rounded-2xl bg-bg-card border border-border-subtle p-8 max-w-md mx-auto text-center my-12 shadow-sm space-y-3">
                <FileText className="size-10 text-text-muted mx-auto" />
                <h3 className="text-base font-bold text-text-primary font-display">No research papers found</h3>
                <p className="text-xs text-text-muted leading-relaxed">
                  Be the first scholar to upload or write a research paper in this workspace!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {filteredPapers.map((paper) => (
                  <div
                    key={paper._id}
                    onClick={() => setSelectedPaper(paper)}
                    className="rounded-2xl bg-bg-card border border-border-subtle hover:border-accent-primary/40 p-5 cursor-pointer flex flex-col justify-between h-full group transition-all duration-200 shadow-sm space-y-4"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-[10px] font-mono text-text-muted">
                        <span>By {paper.userName}</span>
                        <span>{new Date(paper.createdAt).toLocaleDateString()}</span>
                      </div>
                      <h3 className="text-base font-bold text-text-primary group-hover:text-accent-primary transition-colors font-display line-clamp-1">
                        {paper.title}
                      </h3>
                      <p className="text-xs font-mono text-accent-primary line-clamp-1">Authors: {paper.authors}</p>
                      <p className="text-xs text-text-muted leading-relaxed line-clamp-2">{paper.abstract}</p>
                    </div>

                    <div className="flex items-center justify-between border-t border-border-subtle pt-3 text-xs">
                      <span className="font-mono text-accent-primary font-bold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                        Open Paper Workspace →
                      </span>
                      <div className="flex items-center gap-2">
                        {(currentUserId === paper.userId || session?.user?.role === "admin") && (
                          <>
                            <button
                              onClick={(e) => handleStartEditPaper(paper, e)}
                              className="text-text-muted hover:text-text-primary p-1 transition-colors"
                              title="Edit Paper"
                            >
                              <Edit className="size-3.5" />
                            </button>
                            <button
                              onClick={(e) => handleDeletePaper(paper._id, e)}
                              className="text-text-muted hover:text-destructive p-1 transition-colors"
                              title="Delete Paper"
                            >
                              <Trash2 className="size-3.5" />
                            </button>
                          </>
                        )}
                        {paper.fileUrl && <ExternalLink className="size-3.5 text-text-muted" />}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Upload PDF Dialog Modal */}
      {isUploadOpen && (
        <Dialog open={true} onOpenChange={() => setIsUploadOpen(false)}>
          <DialogContent className="bg-bg-surface border border-border-subtle text-text-primary max-w-md rounded-2xl p-6 shadow-2xl">
            <DialogHeader className="flex flex-row items-center justify-between border-b border-border-subtle pb-3">
              <DialogTitle className="text-base font-bold text-text-primary font-display">Upload Research PDF</DialogTitle>
              <button onClick={() => setIsUploadOpen(false)} className="text-text-muted hover:text-text-primary cursor-pointer" aria-label="Close">
                <X className="size-4" />
              </button>
            </DialogHeader>

            <form onSubmit={handlePublishUpload} className="space-y-4 py-2">
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono font-bold text-text-muted uppercase tracking-wider block">Paper Title</label>
                <Input
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  placeholder="Paper Title..."
                  required
                  className="bg-bg-base border-border-subtle text-text-primary placeholder:text-text-muted h-10 text-xs rounded-xl focus:border-accent-primary"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-mono font-bold text-text-muted uppercase tracking-wider block">Authors</label>
                <Input
                  value={uploadAuthors}
                  onChange={(e) => setUploadAuthors(e.target.value)}
                  placeholder="Authors..."
                  required
                  className="bg-bg-base border-border-subtle text-text-primary placeholder:text-text-muted h-10 text-xs rounded-xl focus:border-accent-primary"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-mono font-bold text-text-muted uppercase tracking-wider block">Abstract</label>
                <textarea
                  value={uploadAbstract}
                  onChange={(e) => setUploadAbstract(e.target.value)}
                  placeholder="Brief abstract of the paper..."
                  rows={3}
                  required
                  className="w-full bg-bg-base border border-border-subtle rounded-xl p-3 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-primary resize-none leading-relaxed"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-mono font-bold text-text-muted uppercase tracking-wider block">PDF File</label>
                <label className="flex items-center justify-center border border-dashed border-border-subtle hover:border-accent-primary bg-bg-base rounded-xl p-4 cursor-pointer gap-2 text-xs font-mono text-text-muted hover:text-text-primary transition-colors">
                  {isUploadingFile ? <Loader2 className="size-4 animate-spin text-accent-primary" /> : <Upload className="size-4 text-accent-primary" />}
                  <span>{uploadFileName || "Select PDF File"}</span>
                  <input type="file" accept=".pdf" onChange={handleFileUpload} disabled={isUploadingFile} className="hidden" />
                </label>
              </div>

              <DialogFooter className="pt-2">
                <Button
                  type="submit"
                  disabled={isSubmittingUpload}
                  className="w-full btn-premium-primary rounded-xl text-xs font-bold h-11 transition-all cursor-pointer"
                >
                  {isSubmittingUpload ? <Loader2 className="size-4 animate-spin" /> : "Publish Research Paper (+50 pts)"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {showAiTopicModal && (
        <TopicGeneratorModal
          isOpen={showAiTopicModal}
          onClose={() => setShowAiTopicModal(false)}
          onGenerate={async (topic: string, contentHtml: string) => {
            setEditTitle(topic);
            setEditAuthors("AI Research Scholar");
            setEditAbstract(`Comprehensive academic research paper on ${topic}, synthesizing theoretical mechanics, architectural figures, experimental telemetry, and performance metrics.`);
            setEditContent(contentHtml);
            setSelectedPaper(null);
            setIsWriting(true);
            toast.success("AI Research Paper generated successfully!");
          }}
        />
      )}
    </div>
  );
}