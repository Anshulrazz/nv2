"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  GraduationCap,
  Plus,
  Loader2,
  Download,
  Search,
  FileText,
  Sparkles,
  Send,
  BookOpen,
  Edit,
  ArrowLeft,
  Upload,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useAlertStore } from "@/stores/alertStore";
import { toast } from "sonner";
import { SimpleEditor } from "@/components/editor/SimpleEditor";

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
  const [papers, setPapers] = useState<PaperData[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Split-screen detailed view & editor states
  const [selectedPaper, setSelectedPaper] = useState<PaperData | null>(null);
  const [isWriting, setIsWriting] = useState(false);
  const [workspaceTab, setWorkspaceTab] = useState<"content" | "assistant">("content");

  // Editor states
  const [editTitle, setEditTitle] = useState("");
  const [editAuthors, setEditAuthors] = useState("");
  const [editAbstract, setEditAbstract] = useState("");
  const [editContent, setEditContent] = useState("");
  const [isSubmittingWrite, setIsSubmittingWrite] = useState(false);

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

  // Scroll chat messages to bottom on update
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

  // Create research paper from PDF upload dialog
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

  // Create research paper from browser Text Editor
  const handlePublishWritten = async () => {
    if (!editTitle.trim() || !editAuthors.trim() || !editAbstract.trim() || !editContent.trim() || isSubmittingWrite) {
      toast.error("Please fill in Title, Authors, Abstract, and Paper Content.");
      return;
    }

    setIsSubmittingWrite(true);
    try {
      const res = await fetch("/api/research", {
        method: "POST",
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
        setIsWriting(false);
        fetchPapers();
        toast.success("Research paper written and published successfully! You gained +50 points.");
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to publish written research paper.");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred while publishing paper.");
    } finally {
      setIsSubmittingWrite(false);
    }
  };

  // AI Assistant Message Submission (Streams  responses)
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || isSendingMessage) return;

    const userMessageText = inputMessage.trim();
    setInputMessage("");

    const newUserMsg: ChatMessage = { role: "user", content: userMessageText };
    setChatMessages((prev) => [...prev, newUserMsg]);
    setIsSendingMessage(true);

    // Compile research context to helper
    const paperContext = isWriting
      ? `Writing Mode Context:\nTitle: "${editTitle}"\nAuthors: "${editAuthors}"\nAbstract: "${editAbstract}"\nCurrent Draft Content:\n${editContent}`
      : `Reading Mode Context:\nTitle: "${selectedPaper?.title}"\nAuthors: "${selectedPaper?.authors}"\nAbstract: "${selectedPaper?.abstract}"\nWritten Content:\n${selectedPaper?.content || "(Paper is PDF format)"}`;

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: `Help me with my research. ${userMessageText}`,
          contextNoteContent: paperContext,
        }),
      });

      if (!res.ok) throw new Error("Failed to reach research assistant.");

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let replyAccumulator = "";

      const assistantMsgIndex = chatMessages.length + 1;

      if (reader) {
        setChatMessages((prev) => [...prev, { role: "assistant", content: "" }]);

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split("\n");
          
          for (const line of lines) {
            if (line.startsWith("data: ")) {
              try {
                const parsed = JSON.parse(line.substring(6));
                if (parsed.text) {
                  replyAccumulator += parsed.text;
                  setChatMessages((prev) => {
                    const updated = [...prev];
                    updated[assistantMsgIndex] = { role: "assistant", content: replyAccumulator };
                    return updated;
                  });
                }
              } catch {
                // Ignore parse errors from partial streaming lines
              }
            }
          }
        }
      }
    } catch (err) {
      console.error(err);
      toast.error("Error communicating with AI research assistant.");
    } finally {
      setIsSendingMessage(false);
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

  // Render workspace detailed reader
  const handleOpenDetailedView = (paper: PaperData) => {
    setSelectedPaper(paper);
    setWorkspaceTab("content");
    setChatMessages([
      {
        role: "assistant",
        content: `Welcome to the Research Assistant workspace. I've loaded "${paper.title}" as context. You can ask me to summarize the abstract, outline the key findings, analyze methodology, or generate citations.`,
      },
    ]);
  };

  const handleOpenWritingMode = () => {
    setIsWriting(true);
    setWorkspaceTab("content");
    setChatMessages([
      {
        role: "assistant",
        content: `I've opened the research editor workspace. Write your title, authors, abstract, and draft content on the left. Ask me on the right to help compile outline drafts, structure chapters, format academic notes, or check research formulations.`,
      },
    ]);
  };

  // Exit workspaces
  const handleExitWorkspace = () => {
    setSelectedPaper(null);
    setIsWriting(false);
    setWorkspaceTab("content");
    setChatMessages([]);
  };

  // RENDER SPLIT WORKSPACE INTERFACE: WRITING OR DETAILED VIEW
  if (isWriting || selectedPaper) {
    return (
      <div className="flex-1 flex flex-col h-full w-full bg-neutral-950 overflow-hidden relative select-none">
        
        {/* Workspace Top Bar */}
        <header className="h-14 border-b border-neutral-900 bg-neutral-955 px-4 flex items-center justify-between shrink-0 z-10 select-none">
          <div className="flex items-center gap-2">
            <button
              onClick={handleExitWorkspace}
              className="p-1.5 rounded-lg text-neutral-450 hover:text-neutral-200 hover:bg-neutral-850 transition-colors flex items-center justify-center cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div className="h-4 w-px bg-neutral-850 mx-1" />
            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest font-space hidden sm:block truncate max-w-[150px] sm:max-w-none">
              {isWriting ? "Drafting Environment" : "Detailed Research View"}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {isWriting ? (
              <>
                <Button
                  onClick={handleExitWorkspace}
                  variant="ghost"
                  className="h-8 text-neutral-455 hover:text-neutral-250 px-3 cursor-pointer text-xs"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handlePublishWritten}
                  disabled={isSubmittingWrite}
                  className="bg-cyan-500 hover:bg-cyan-400 text-neutral-950 font-bold h-8 px-4 text-xs cursor-pointer shadow-md rounded-lg flex items-center justify-center gap-1.5"
                >
                  {isSubmittingWrite ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="h-3.5 w-3.5" />
                  )}
                  <span className="hidden sm:inline">Publish Paper</span>
                  <span className="sm:hidden">Publish</span>
                </Button>
              </>
            ) : (
              selectedPaper?.fileUrl && selectedPaper.fileUrl !== "written" && (
                <a
                  href={selectedPaper.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-neutral-900 border border-neutral-850 hover:bg-neutral-850 text-neutral-300 font-bold h-8 px-4 text-xs rounded-lg transition-all flex items-center justify-center gap-1.5"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Download PDF</span>
                  <span className="sm:hidden">Download</span>
                </a>
              )
            )}
          </div>
        </header>

        {/* Mobile Tab Switches (hidden on md and up) */}
        <div className="flex border-b border-neutral-900 bg-neutral-955 md:hidden shrink-0 select-none">
          <button
            onClick={() => setWorkspaceTab("content")}
            className={`flex-1 py-3 text-center text-xs font-bold font-space uppercase tracking-wider transition-colors border-b-2 ${
              workspaceTab === "content"
                ? "text-cyan-400 border-cyan-400"
                : "text-neutral-550 border-transparent hover:text-neutral-300"
            }`}
          >
            {isWriting ? "Editor Draft" : "Paper Content"}
          </button>
          <button
            onClick={() => setWorkspaceTab("assistant")}
            className={`flex-1 py-3 text-center text-xs font-bold font-space uppercase tracking-wider transition-colors border-b-2 ${
              workspaceTab === "assistant"
                ? "text-violet-400 border-violet-400"
                : "text-neutral-555 border-transparent hover:text-neutral-300"
            }`}
          >
            AI Assistant
          </button>
        </div>

        {/* Workspace Splitted Body */}
        <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
          
          {/* LEFT PANEL: Editor or Viewer */}
          <div className={`${workspaceTab === "content" ? "flex" : "hidden"} md:flex flex-1 border-r border-neutral-900 flex-col min-w-0 overflow-y-auto custom-scroll bg-neutral-950/30 p-5 sm:p-6 lg:p-8`}>
            
            {isWriting ? (
              /* TEXT EDITOR */
              <div className="space-y-5 max-w-3xl w-full mx-auto select-text pb-24">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-neutral-500 uppercase font-space tracking-wider">Research Title</label>
                  <Input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    placeholder="Enter the title of your paper..."
                    className="bg-neutral-950/80 border-neutral-850 text-neutral-200 text-sm focus:border-cyan-500 h-10 px-3.5 rounded-xl"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-neutral-500 uppercase font-space tracking-wider">Authors / Affiliation</label>
                  <Input
                    value={editAuthors}
                    onChange={(e) => setEditAuthors(e.target.value)}
                    placeholder="e.g. Anshul R., ECE Dept, Stanford University"
                    className="bg-neutral-950/80 border-neutral-855 text-neutral-250 text-xs focus:border-cyan-500 h-9.5 px-3 rounded-xl"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-neutral-500 uppercase font-space tracking-wider">Abstract Summary</label>
                  <textarea
                    value={editAbstract}
                    onChange={(e) => setEditAbstract(e.target.value)}
                    placeholder="Write a brief, comprehensive summary of the scope, methodology, and results of this research paper..."
                    className="w-full min-h-[90px] bg-neutral-950/80 border border-neutral-855 text-neutral-250 text-xs focus:border-cyan-500 p-3 rounded-xl focus:outline-none resize-none font-sans leading-relaxed"
                  />
                </div>

                <div className="space-y-1 flex-1 flex flex-col relative">
                  <label className="text-[10px] font-bold text-neutral-500 uppercase font-space tracking-wider mb-1 block">Paper Content</label>
                  <SimpleEditor
                    value={editContent}
                    onChange={setEditContent}
                    placeholder="Write the complete research paper sections here (e.g. Introduction, Literature Review, Methodology, Results, Discussion, References)..."
                    className="flex-1"
                  />
                </div>
              </div>
            ) : (
              /* DETAILED VIEW */
              selectedPaper && (
                <div className="space-y-6 max-w-4xl w-full mx-auto select-text pb-24">
                  <div className="space-y-2 border-b border-neutral-900 pb-5">
                    <h1 className="text-xl sm:text-2xl font-bold text-neutral-100 font-heading leading-tight">
                      {selectedPaper.title}
                    </h1>
                    <p className="text-xs text-neutral-450 italic">
                      Written by: {selectedPaper.authors}
                    </p>
                    <div className="flex items-center gap-3 text-[10px] text-neutral-550 font-mono pt-1">
                      <span>Contributor: {selectedPaper.userName}</span>
                      <span>•</span>
                      <span>Published: {new Date(selectedPaper.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {/* Abstract card */}
                  <div className="bg-neutral-900/40 border border-neutral-850 p-5 rounded-2xl">
                    <h3 className="text-xs font-bold text-cyan-400 uppercase font-space tracking-wider mb-2">
                      Abstract
                    </h3>
                    <p className="text-[11px] text-neutral-300 leading-relaxed font-sans">
                      {selectedPaper.abstract}
                    </p>
                  </div>

                  {/* Render content: Either PDF IFrame or Written Notes Text */}
                  <div className="space-y-4">
                    <h3 className="text-xs font-bold text-neutral-400 uppercase font-space tracking-wider border-b border-neutral-900 pb-2">
                      Paper Corpus
                    </h3>
                    
                    {selectedPaper.content ? (
                      /* Written Content Render */
                      <div
                        className="bg-neutral-955/40 border border-neutral-855 p-6 rounded-2xl text-xs leading-relaxed text-neutral-300 font-sans max-h-[500px] overflow-y-auto custom-scroll ProseMirror"
                        dangerouslySetInnerHTML={{ __html: selectedPaper.content }}
                      />
                    ) : selectedPaper.fileUrl ? (
                      /* PDF File Frame Reader + Fallback Trigger Link */
                      <div className="space-y-3">
                        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 flex flex-col sm:flex-row items-center justify-between gap-2.5">
                          <div className="text-center sm:text-left">
                            <p className="text-[10px] font-bold text-amber-400 font-space uppercase">PDF Rendering Notice</p>
                            <p className="text-[9px] text-neutral-450 leading-normal mt-0.5">If the document does not display inside the reader, open it directly in a new window.</p>
                          </div>
                          <a
                            href={selectedPaper.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold px-3 py-1 rounded-lg text-[9px] uppercase tracking-wider font-space shrink-0 flex items-center gap-1 shadow-md"
                          >
                            <ExternalLink className="h-3 w-3" /> Open PDF
                          </a>
                        </div>
                        
                        <div className="w-full aspect-[4/5] rounded-2xl overflow-hidden border border-neutral-850 bg-neutral-950/90 shadow-xl relative">
                          <iframe
                            src={`${selectedPaper.fileUrl}#toolbar=1`}
                            className="w-full h-full border-none"
                            title="PDF Research Viewer"
                          />
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-neutral-600 italic">No paper content available.</p>
                    )}
                  </div>
                </div>
              )
            )}
          </div>

          {/* RIGHT PANEL: AI Research Assistant Chat */}
          <div className={`${workspaceTab === "assistant" ? "flex" : "hidden"} md:flex w-full md:w-80 shrink-0 overflow-hidden flex-col bg-neutral-900/30 border-l border-neutral-900`}>
            {/* Assistant Header */}
            <div className="px-4 py-3 border-b border-neutral-900 bg-neutral-955/60 flex items-center justify-between shrink-0 select-none">
              <div className="flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-violet-400" />
                <span className="text-[10px] font-bold text-neutral-300 uppercase tracking-widest font-space">
                  Research Assistant
                </span>
              </div>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto custom-scroll p-4 space-y-4 select-text">
              {chatMessages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex flex-col space-y-1 max-w-[85%] ${msg.role === "user" ? "ml-auto items-end" : "mr-auto items-start"}`}
                >
                  <span className="text-[8px] font-bold text-neutral-500 font-mono uppercase">
                    {msg.role === "user" ? "You" : "Research Assistant"}
                  </span>
                  <div
                    className={`rounded-xl px-3 py-2 text-xs leading-relaxed ${
                      msg.role === "user"
                        ? "bg-violet-500/10 border border-violet-500/20 text-violet-300"
                        : "bg-neutral-950/80 border border-neutral-850 text-neutral-300"
                    }`}
                  >
                    {msg.content || (
                      <div className="flex items-center gap-1 text-neutral-500 font-mono select-none">
                        <Loader2 className="h-3 w-3 animate-spin text-cyan-400" />
                        <span>  is writing...</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Chat Input form */}
            <form onSubmit={handleSendMessage} className="p-3 border-t border-neutral-900 bg-neutral-955/30 shrink-0 select-none">
              <div className="flex items-center gap-2 bg-neutral-950 border border-neutral-850 rounded-xl p-1 shadow-inner focus-within:border-violet-500/50 transition-colors">
                <Input
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="Ask the research assistant..."
                  className="bg-transparent border-none text-xs text-neutral-200 placeholder-neutral-600 focus-visible:ring-0 h-8 px-2 w-full font-sans"
                  autoComplete="off"
                  disabled={isSendingMessage}
                />
                <Button
                  type="submit"
                  size="icon"
                  disabled={isSendingMessage || !inputMessage.trim()}
                  className="h-8 w-8 bg-violet-600 hover:bg-violet-500 text-neutral-100 rounded-lg shrink-0 cursor-pointer"
                >
                  {isSendingMessage ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Send className="h-3.5 w-3.5" />
                  )}
                </Button>
              </div>
            </form>
          </div>

        </div>
      </div>
    );
  }

  // STANDARD REPOSITORY INDEX VIEW: list all uploaded/written research papers
  return (
    <div className="flex-1 flex flex-col h-full bg-neutral-950 overflow-y-auto custom-scroll relative select-none">
      
      {/* Ambient glow */}
      <div className="absolute top-0 right-1/4 w-[400px] h-[300px] bg-cyan-500/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Top Banner — now sticky so it doesn't scroll away/hide */}
      <div className="sticky top-0 border-b border-neutral-900 bg-neutral-955/95 backdrop-blur-md px-4 sm:px-8 py-4 sm:py-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 z-20">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-cyan-400" />
            <h1 className="text-xl font-bold text-neutral-100 tracking-tight" style={{ fontFamily: "var(--font-space-grotesk)" }}>
              Research Repository
            </h1>
          </div>
          <p className="text-neutral-500 text-xs">
            Review peer-reviewed academic notes, write research reports, or consult the AI assistant.
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <Button
            onClick={handleOpenWritingMode}
            className="flex-1 sm:flex-none justify-center bg-neutral-900 border border-neutral-850 hover:bg-neutral-850 text-neutral-300 text-xs font-bold gap-1.5 h-9 px-4 rounded-lg cursor-pointer"
            style={{ fontFamily: "var(--font-space-grotesk)" }}
          >
            <Edit className="h-3.5 w-3.5 text-cyan-400" /> <span className="whitespace-nowrap">Write Paper</span>
          </Button>

          <Button
            onClick={() => setIsUploadOpen(true)}
            className="flex-1 sm:flex-none justify-center bg-cyan-500 hover:bg-cyan-400 text-neutral-950 text-xs font-bold gap-1.5 h-9 px-4 rounded-lg shadow-[0_0_12px_rgba(6,182,212,0.25)] transition-all cursor-pointer font-heading"
            style={{ fontFamily: "var(--font-space-grotesk)" }}
          >
            <Plus className="h-4 w-4" /> <span className="whitespace-nowrap">Upload PDF</span>
          </Button>
        </div>
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
              <p className="text-[9px] text-neutral-550 uppercase tracking-widest font-mono">Upload Reward</p>
              <p className="text-sm font-bold text-cyan-400 mt-0.5">+50 pts</p>
            </div>
          </div>
        </div>

        {/* Papers Listing */}
        {isLoading ? (
          <div className="py-24 flex flex-col items-center justify-center text-neutral-550 text-xs gap-2 select-none font-semibold">
            <Loader2 className="h-6 w-6 animate-spin text-cyan-400" />
            <span style={{ fontFamily: "var(--font-jetbrains-mono)" }}>RETRIEVING RESEARCH PAPERS...</span>
          </div>
        ) : filteredPapers.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center text-center space-y-4 border border-dashed border-neutral-900 rounded-2xl bg-neutral-900/5 select-none">
            <FileText className="h-10 w-10 text-neutral-750" />
            <div className="space-y-1">
              <h3 className="text-neutral-350 font-bold text-sm" style={{ fontFamily: "var(--font-space-grotesk)" }}>
                No papers found
              </h3>
              <p className="text-neutral-555 text-xs max-w-xs leading-normal">
                {searchQuery ? "Try checking spelling or adjusting query keywords." : "Be the first to publish or write a research paper in the repository!"}
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredPapers.map((paper) => {
              const isWritten = !paper.fileUrl || paper.fileUrl === "written";

              return (
                <div
                  key={paper._id}
                  onClick={() => handleOpenDetailedView(paper)}
                  className="bg-neutral-900/10 border border-neutral-900 hover:border-cyan-500/25 hover:shadow-[0_0_20px_rgba(6,182,212,0.05)] rounded-2xl p-6 transition-all duration-300 cursor-pointer space-y-4 flex flex-col justify-between group"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <span className={`text-[8px] border px-2 py-0.5 rounded font-bold uppercase tracking-widest font-mono ${isWritten ? "bg-violet-500/10 text-violet-400 border-violet-500/20" : "bg-cyan-500/10 text-cyan-400 border-cyan-500/20"}`}>
                        {isWritten ? "Written Draft" : "PDF Document"}
                      </span>
                      <span className="text-[8px] text-neutral-600 font-mono">
                        ID: {paper._id.substring(0, 8)}
                      </span>
                    </div>

                    <div className="space-y-1 select-text">
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

                    <p className="text-[11px] text-neutral-450 leading-relaxed font-sans line-clamp-3 select-text pt-1">
                      {paper.abstract}
                    </p>

                    <div className="flex gap-2 pt-1 select-none" onClick={(e) => e.stopPropagation()}>
                      <Button
                        onClick={() => handleOpenDetailedView(paper)}
                        className="flex-1 bg-neutral-900 border border-neutral-850 hover:bg-neutral-850 text-neutral-300 text-[10px] font-bold font-space-grotesk h-8 rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <BookOpen className="h-3 w-3 text-cyan-400" />
                        <span>View Detailed Paper</span>
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Upload Paper Modal Dialog */}
      <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
        <DialogContent className="bg-neutral-900 border border-neutral-800 text-neutral-100 max-w-md cyber-panel select-none">
          <form onSubmit={handlePublishUpload} className="space-y-4">
            <DialogHeader>
              <DialogTitle
                className="text-neutral-100 text-sm font-bold"
                style={{ fontFamily: "var(--font-space-grotesk)" }}
              >
                Upload Academic Research Paper
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider font-space">Paper Title</label>
                <Input
                  required
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  placeholder="e.g. A Study on Spaced Repetition Logic"
                  className="bg-neutral-950 border-neutral-800 text-neutral-300 text-xs h-9.5"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider font-space">Authors</label>
                <Input
                  required
                  value={uploadAuthors}
                  onChange={(e) => setUploadAuthors(e.target.value)}
                  placeholder="e.g. Dr. John Doe, Prof. Jane Smith"
                  className="bg-neutral-950 border-neutral-800 text-neutral-300 text-xs h-9.5"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider font-space">Abstract</label>
                <textarea
                  required
                  value={uploadAbstract}
                  onChange={(e) => setUploadAbstract(e.target.value)}
                  placeholder="Briefly state the research background, methodologies, outcomes, and primary goals..."
                  className="w-full min-h-[80px] bg-neutral-955 border border-neutral-800 text-neutral-300 text-xs p-3 rounded-lg focus:outline-none focus:border-cyan-500 font-sans leading-relaxed"
                />
              </div>

              <div className="space-y-2.5 pt-1">
                <label className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider font-space block">PDF File Document</label>
                <div className="flex items-center gap-3">
                  <Input
                    id="paper-pdf-upload"
                    type="file"
                    accept=".pdf"
                    onChange={handleFileUpload}
                    className="hidden"
                    disabled={isUploadingFile}
                  />
                  <Button
                    type="button"
                    onClick={() => document.getElementById("paper-pdf-upload")?.click()}
                    disabled={isUploadingFile}
                    className="bg-neutral-950 border border-neutral-850 hover:bg-neutral-850 text-neutral-300 text-xs h-9 px-4 rounded-lg flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    {isUploadingFile ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4" />
                    )}
                    <span>{uploadFileName ? "Change PDF" : "Choose PDF File"}</span>
                  </Button>
                  {uploadFileName && (
                    <span className="text-[10px] text-neutral-400 font-mono truncate max-w-[200px]">
                      {uploadFileName}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                onClick={() => setIsUploadOpen(false)}
                variant="ghost"
                className="h-9.5 text-neutral-500 hover:text-neutral-300 hover:bg-neutral-850 text-xs px-4"
              >
                Close
              </Button>
              <Button
                type="submit"
                disabled={!uploadTitle || !uploadAuthors || !uploadAbstract || !uploadFileUrl || isSubmittingUpload}
                className="bg-cyan-500 hover:bg-cyan-400 text-neutral-950 font-bold h-9.5 px-5 text-xs rounded-lg shadow-lg flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {isSubmittingUpload ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                <span>Publish Paper</span>
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

    </div>
  );
}