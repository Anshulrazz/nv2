/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  GraduationCap,
  Loader2,
  Download,
  Search,
  FileText,
  Send,
  Edit,
  ArrowLeft,
  Upload,
  ExternalLink,
  ArrowUpRight,
  X,
  Wand2,
  Plus,
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

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
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

  // AI Assistant chat states
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

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

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".pdf")) {
      showAlert("Invalid File Type", "Only PDF files are supported for research paper uploads.");
      return;
    }

    setIsUploadingFile(true);
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
        setUploadFileName(file.name);
        toast.success("PDF uploaded successfully!");
      } else {
        showAlert("Upload Failed", "Could not upload research paper file.");
      }
    } catch (err) {
      console.error(err);
      showAlert("Upload Error", "An error occurred during paper file upload.");
    } finally {
      setIsUploadingFile(false);
    }
  };

  const handlePublishUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadTitle.trim() || !uploadAuthors.trim() || !uploadAbstract.trim() || !uploadFileUrl || isSubmittingUpload) return;

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
        toast.success("Research paper uploaded successfully! You gained +50 points.");
      } else {
        const err = await res.json();
        showAlert("Upload Failed", err.error || "Could not publish research paper.");
      }
    } catch (err) {
      console.error(err);
      showAlert("Upload Error", "An error occurred while uploading research paper metadata.");
    } finally {
      setIsSubmittingUpload(false);
    }
  };

  const handlePublishWritten = async () => {
    if (!editTitle.trim() || !editAuthors.trim() || !editAbstract.trim() || !editContent.trim() || isSubmittingWrite) {
      toast.error("Please fill in Title, Authors, Abstract, and Paper Content.");
      return;
    }

    setIsSubmittingWrite(true);
    try {
      const isUpdate = Boolean(editingPaperId);
      const url = isUpdate ? `/api/research/${editingPaperId}` : "/api/research";
      const method = isUpdate ? "PATCH" : "POST";

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

  const handleSendChatMessage = async () => {
    if (!inputMessage.trim() || !selectedPaper || isSendingMessage) return;

    const userMsg = inputMessage.trim();
    setInputMessage("");
    setChatMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    setIsSendingMessage(true);

    try {
      const res = await fetch("/api/research/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paperId: selectedPaper._id,
          paperTitle: selectedPaper.title,
          paperAbstract: selectedPaper.abstract,
          paperContent: selectedPaper.content,
          message: userMsg,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setChatMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
      } else {
        toast.error("Failed to get AI analysis.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error communicating with AI Assistant.");
    } finally {
      setIsSendingMessage(false);
    }
  };

  const filteredPapers = papers.filter(
    (p) =>
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.authors.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.abstract.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex-1 flex flex-col h-full bg-[#030305] text-zinc-100 overflow-y-auto antialiased relative selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Background Ambient Mesh Glow Orbs */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 right-1/4 w-[500px] h-[350px] bg-violet-500/10 rounded-full blur-[140px]" />
      </div>

      {/* Header Banner */}
      <div className="border-b border-white/5 bg-zinc-950/40 p-8 rounded-[2rem] border border-white/10 relative z-10 backdrop-blur-2xl m-6 sm:m-10 mb-0">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="size-14 rounded-2xl bg-violet-500/10 flex items-center justify-center border border-violet-500/20 text-violet-400">
              <GraduationCap className="size-7" />
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tight text-white flex items-center gap-3">
                Research Workspace
                <span className="text-[10px] font-mono font-bold bg-violet-500/20 text-violet-300 px-3 py-1 rounded-full border border-violet-500/30 uppercase tracking-widest">
                  ACADEMIC ARCHIVE
                </span>
              </h1>
              <p className="text-zinc-400 text-xs sm:text-sm font-light mt-1">
                Publish papers, analyze PDFs with AI assistants, and collaborate with peer researchers.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <Button
              onClick={() => setShowAiTopicModal(true)}
              className="bg-gradient-to-r from-violet-500/20 via-purple-500/20 to-cyan-500/20 hover:from-violet-500/30 hover:to-cyan-500/30 text-violet-300 border border-violet-500/30 font-bold text-xs h-11 px-5 rounded-full flex items-center gap-2 transition-all shadow-[0_0_15px_rgba(139,92,246,0.15)]"
            >
              <Wand2 className="size-4 text-violet-400" />
              <span>AI Paper Writer (with Figures)</span>
            </Button>

            <Button
              onClick={() => {
                setIsWriting(true);
                setSelectedPaper(null);
              }}
              variant="outline"
              className="bg-zinc-900 border-white/10 text-white hover:bg-zinc-800 rounded-full text-xs font-bold h-11 px-5"
            >
              <Edit className="size-4 mr-2" /> Write Paper
            </Button>

            <Button
              onClick={() => setIsUploadOpen(true)}
              className="group rounded-full bg-white hover:bg-zinc-100 text-zinc-950 font-bold text-xs h-11 px-6 flex items-center justify-center gap-2 transition-all duration-300 active:scale-[0.97] shadow-[0_0_20px_rgba(255,255,255,0.15)]"
            >
              <Upload className="size-4 text-zinc-950" />
              <span>Upload PDF</span>
              <ArrowUpRight className="size-4 text-zinc-950 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="p-4 sm:p-8 w-full max-w-7xl mx-auto space-y-8 relative z-10">
        {isWriting ? (
          <div className="w-full space-y-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <button
                onClick={() => setIsWriting(false)}
                className="flex items-center gap-1.5 text-xs font-mono text-cyan-400 hover:text-cyan-300 font-bold uppercase tracking-widest"
              >
                <ArrowLeft className="size-4" /> Cancel &amp; Back
              </button>
              <Button
                onClick={handlePublishWritten}
                disabled={isSubmittingWrite}
                className="rounded-full bg-white hover:bg-zinc-100 text-zinc-950 font-bold text-xs h-10 px-6"
              >
                {isSubmittingWrite ? <Loader2 className="size-4 animate-spin text-zinc-950" /> : "Publish Research Paper"}
              </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              <div className="lg:col-span-8 space-y-6">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-widest block">Title</label>
                    <Input
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      placeholder="Research Paper Title..."
                      className="bg-zinc-950/80 border-white/10 text-white placeholder-zinc-600 h-11 text-xs rounded-xl focus:border-cyan-400"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-widest block">Authors</label>
                    <Input
                      value={editAuthors}
                      onChange={(e) => setEditAuthors(e.target.value)}
                      placeholder="e.g. Dr. A. Sharma, Prof. B. Roy"
                      className="bg-zinc-950/80 border-white/10 text-white placeholder-zinc-600 h-11 text-xs rounded-xl focus:border-cyan-400"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-widest block">Abstract</label>
                  <textarea
                    value={editAbstract}
                    onChange={(e) => setEditAbstract(e.target.value)}
                    placeholder="Summary of methodology, experimental setup, and primary findings..."
                    rows={3}
                    className="w-full bg-zinc-950/80 border border-white/10 rounded-2xl p-3.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-cyan-400 resize-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-widest block">Paper Content</label>
                  <SimpleEditor value={editContent} onChange={setEditContent} placeholder="Write paper sections using Markdown..." />
                </div>
              </div>

              {/* Side AI Assistant Panel */}
              <div className="lg:col-span-4 rounded-3xl bg-zinc-950/80 border border-white/10 overflow-hidden flex flex-col h-[650px] lg:sticky lg:top-6">
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
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <button
                onClick={() => setSelectedPaper(null)}
                className="flex items-center gap-1.5 text-xs font-mono text-cyan-400 hover:text-cyan-300 font-bold uppercase tracking-widest"
              >
                <ArrowLeft className="size-4" /> Back to Archive
              </button>
              <div className="flex items-center gap-2">
                {(currentUserId === selectedPaper.userId || session?.user?.role === "admin") && (
                  <>
                    <button
                      onClick={(e) => handleStartEditPaper(selectedPaper, e)}
                      className="text-xs font-mono font-bold px-3 py-1.5 rounded-full bg-zinc-900 border border-white/10 text-zinc-300 hover:text-white flex items-center gap-1 transition-all"
                      title="Edit Paper"
                    >
                      <Edit className="size-3.5" /> Edit
                    </button>
                    <button
                      onClick={(e) => handleDeletePaper(selectedPaper._id, e)}
                      className="text-xs font-mono font-bold px-3 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20 flex items-center gap-1 transition-all"
                      title="Delete Paper"
                    >
                      <Trash2 className="size-3.5" /> Delete
                    </button>
                  </>
                )}
                <button
                  onClick={() => setShowAiSideChat((prev) => !prev)}
                  className={`text-xs font-mono font-bold px-4 py-1.5 rounded-full uppercase tracking-widest transition-all flex items-center gap-1.5 ${
                    showAiSideChat ? "bg-violet-500/20 text-violet-300 border border-violet-500/30" : "bg-zinc-900 text-zinc-400 border border-white/10 hover:text-white"
                  }`}
                >
                  <Wand2 className="size-3.5 text-violet-400" />
                  <span>{showAiSideChat ? "Hide AI Side Chat" : "✨ AI Side Chat"}</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Paper Content - ALWAYS VISIBLE */}
              <div className={showAiSideChat ? "lg:col-span-8 space-y-6" : "lg:col-span-12 space-y-6"}>
                <div className="space-y-2 border-b border-white/10 pb-6">
                  <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-tight">{selectedPaper.title}</h2>
                  <p className="text-sm font-mono text-cyan-300">Authors: {selectedPaper.authors}</p>
                </div>

                <div className="p-5 bg-zinc-950/60 rounded-2xl border-l-4 border-cyan-400 border-y border-r border-white/5 space-y-1.5">
                  <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase tracking-widest block">ABSTRACT</span>
                  <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed font-light">{selectedPaper.abstract}</p>
                </div>

                {selectedPaper.fileUrl ? (
                  <a
                    href={selectedPaper.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 text-xs font-mono text-cyan-400 hover:text-cyan-300 underline font-bold"
                  >
                    <Download className="size-4" /> Download PDF Research File
                  </a>
                ) : selectedPaper.content ? (
                  <div className="w-full pt-2">
                    <BlogContentRenderer content={selectedPaper.content} />
                  </div>
                ) : null}
              </div>

              {/* AI Copilot Side Chat Sidebar */}
              {showAiSideChat && (
                <div className="lg:col-span-4 rounded-3xl bg-zinc-950/80 border border-white/10 overflow-hidden flex flex-col h-[650px] lg:sticky lg:top-6">
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
              <Search className="absolute left-3.5 top-3 size-4 text-zinc-500" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search research paper titles, authors..."
                className="bg-zinc-950 border-white/10 focus:border-cyan-400 text-white placeholder-zinc-600 h-10 text-xs pl-10 rounded-xl"
              />
            </div>

            {isLoading ? (
              <div className="py-20 flex flex-col items-center justify-center text-zinc-500 text-xs gap-3">
                <Loader2 className="size-8 animate-spin text-violet-400" />
                <span className="font-mono text-zinc-400 tracking-widest">LOADING PAPERS...</span>
              </div>
            ) : filteredPapers.length === 0 ? (
              <div className="rounded-[2.5rem] bg-zinc-900/40 border border-white/10 p-2.5 backdrop-blur-3xl max-w-md mx-auto text-center my-12">
                <div className="rounded-[calc(2.5rem-0.75rem)] bg-[#07070a] border border-white/5 p-8 flex flex-col items-center gap-4">
                  <FileText className="size-10 text-zinc-600" />
                  <h3 className="text-lg font-bold text-white">No research papers found</h3>
                  <p className="text-xs text-zinc-400 font-light max-w-xs">
                    Be the first scholar to upload or write a research paper!
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredPapers.map((paper) => (
                  <div key={paper._id} className="rounded-[2rem] bg-zinc-900/40 border border-white/10 p-2 backdrop-blur-xl hover:border-violet-500/40 transition-all duration-300 flex flex-col h-full">
                    <div
                      onClick={() => setSelectedPaper(paper)}
                      className="rounded-[calc(2rem-0.5rem)] bg-[#07070a] border border-white/5 p-6 space-y-4 cursor-pointer flex flex-col justify-between h-full group"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500">
                          <span>By {paper.userName}</span>
                          <span>{new Date(paper.createdAt).toLocaleDateString()}</span>
                        </div>
                        <h3 className="text-lg font-bold text-white group-hover:text-violet-400 transition-colors line-clamp-1">
                          {paper.title}
                        </h3>
                        <p className="text-xs font-mono text-zinc-400 line-clamp-1">Authors: {paper.authors}</p>
                        <p className="text-xs text-zinc-400 font-light line-clamp-2 leading-relaxed">{paper.abstract}</p>
                      </div>

                      <div className="flex items-center justify-between border-t border-white/5 pt-4">
                        <span className="text-xs font-mono text-cyan-400 font-bold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                          Open Paper Workspace →
                        </span>
                        <div className="flex items-center gap-2">
                          {(currentUserId === paper.userId || session?.user?.role === "admin") && (
                            <>
                              <button
                                onClick={(e) => handleStartEditPaper(paper, e)}
                                className="text-zinc-400 hover:text-white p-1 transition-colors"
                                title="Edit Paper"
                              >
                                <Edit className="size-4" />
                              </button>
                              <button
                                onClick={(e) => handleDeletePaper(paper._id, e)}
                                className="text-zinc-400 hover:text-rose-400 p-1 transition-colors"
                                title="Delete Paper"
                              >
                                <Trash2 className="size-4" />
                              </button>
                            </>
                          )}
                          {paper.fileUrl && <ExternalLink className="size-4 text-zinc-500" />}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Upload PDF Dialog Modal */}
      {isUploadOpen && (
        <Dialog open={true} onOpenChange={() => setIsUploadOpen(false)}>
          <DialogContent className="bg-zinc-950 border border-white/10 text-white max-w-md rounded-3xl p-6">
            <DialogHeader className="flex flex-row items-center justify-between">
              <DialogTitle className="text-lg font-bold text-white">Upload Research PDF</DialogTitle>
              <button onClick={() => setIsUploadOpen(false)} className="text-zinc-500 hover:text-white">
                <X className="size-4" />
              </button>
            </DialogHeader>

            <form onSubmit={handlePublishUpload} className="space-y-4 py-2">
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-widest block">Paper Title</label>
                <Input
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  placeholder="Paper Title..."
                  required
                  className="bg-zinc-900 border-white/10 text-white placeholder-zinc-600 h-11 text-xs rounded-xl"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-widest block">Authors</label>
                <Input
                  value={uploadAuthors}
                  onChange={(e) => setUploadAuthors(e.target.value)}
                  placeholder="Authors..."
                  required
                  className="bg-zinc-900 border-white/10 text-white placeholder-zinc-600 h-11 text-xs rounded-xl"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-widest block">Abstract</label>
                <textarea
                  value={uploadAbstract}
                  onChange={(e) => setUploadAbstract(e.target.value)}
                  placeholder="Brief abstract..."
                  rows={3}
                  required
                  className="w-full bg-zinc-900 border border-white/10 rounded-2xl p-3.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-cyan-400 resize-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-widest block">PDF File</label>
                <label className="flex items-center justify-center border border-dashed border-white/10 hover:border-violet-400 bg-zinc-900 rounded-2xl p-4 cursor-pointer gap-2 text-xs font-mono text-zinc-400 hover:text-white">
                  {isUploadingFile ? <Loader2 className="size-4 animate-spin text-violet-400" /> : <Upload className="size-4 text-violet-400" />}
                  <span>{uploadFileName || "Select PDF File"}</span>
                  <input type="file" accept=".pdf" onChange={handleFileUpload} disabled={isUploadingFile} className="hidden" />
                </label>
              </div>

              <DialogFooter className="pt-2">
                <Button
                  type="submit"
                  disabled={isSubmittingUpload}
                  className="w-full rounded-full bg-white hover:bg-zinc-100 text-zinc-950 font-bold text-xs h-11 transition-all"
                >
                  {isSubmittingUpload ? <Loader2 className="size-4 animate-spin text-zinc-950" /> : "Publish Research Paper (+50 pts)"}
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
            toast.success("AI Research Paper with related figures generated successfully!");
          }}
        />
      )}
    </div>
  );
}