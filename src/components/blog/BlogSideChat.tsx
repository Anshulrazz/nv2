"use client";

import React, { useState, useRef, useEffect } from "react";
import { Sparkles, Send, Loader2, Bot, User, HelpCircle, X, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MarkdownRenderer } from "@/components/ui/MarkdownRenderer";
import { toast } from "sonner";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface BlogSideChatProps {
  blogTitle: string;
  blogContentText: string;
}

const QUICK_PROMPTS = [
  { label: "Summarize Blog", prompt: "Give me a concise summary of the key takeaways from this blog post." },
  { label: "Quiz Me (5 Questions)", prompt: "Generate 5 practice quiz questions based on the content of this blog." },
  { label: "Key Formulas & Takeaways", prompt: "List all major concepts, formulas, and key definitions from this post." },
  { label: "Explain Simply", prompt: "Explain the main subject of this blog post in simple terms for a beginner." },
];

export function BlogSideChat({ blogTitle, blogContentText }: BlogSideChatProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamedText, setStreamedText] = useState("");
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: scrollContainerRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  };

  useEffect(() => {
    if (isOpen) scrollToBottom();
  }, [messages, streamedText, isOpen]);

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputValue).trim();
    if (!query || isStreaming) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: query,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue("");
    setIsStreaming(true);
    setStreamedText("");

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: query,
          contextNoteContent: `Blog Title: ${blogTitle}\n\nBlog Content:\n${blogContentText || "(No text content available)"}`,
        }),
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      if (!response.body) {
        throw new Error("No response body available");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullAssistantText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith("data: ")) {
            try {
              const parsed = JSON.parse(trimmed.substring(6));
              if (parsed.text) {
                fullAssistantText += parsed.text;
                setStreamedText(fullAssistantText);
              }
            } catch {
              // Ignore partial JSON parsing errors
            }
          }
        }
      }

      const assistantMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: fullAssistantText || "I have analyzed this blog post and answered your question.",
      };

      setMessages((prev) => [...prev, assistantMsg]);
      setStreamedText("");
    } catch (err) {
      console.error("Blog side chat error:", err);
      toast.error("Failed to stream response. Please try again.");
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: "Sorry, I encountered an issue analyzing this blog post. Please try asking again.",
        },
      ]);
    } finally {
      setIsStreaming(false);
      setStreamedText("");
    }
  };

  return (
    <>
      {/* Floating trigger button (hides when drawer is open) */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 btn-premium-primary px-4 py-3 text-xs select-none animate-in fade-in"
        >
          <Sparkles className="size-4" />
          <span>Ask AI about this Post</span>
        </button>
      )}

      {/* Drawer Overlay & Panel */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/70 z-50 transition-opacity backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />

          <aside className="fixed inset-y-0 right-0 z-50 w-full sm:w-[420px] bg-[#0A0806] border-l border-[#2E2118] flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
            {/* Header */}
            <div className="p-4 border-b border-[#2E2118] bg-[#150F0B]/90 backdrop-blur-md flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="size-8 rounded-xl bg-[#F5B429]/10 border border-[#F5B429]/30 flex items-center justify-center text-[#F5B429] shrink-0">
                  <Sparkles className="size-4" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-xs font-bold text-white truncate">AI Blog Assistant</h3>
                  <p className="text-[10px] font-mono text-zinc-400 truncate">
                    Analyzing: &ldquo;{blogTitle}&rdquo;
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                {messages.length > 0 && (
                  <button
                    onClick={() => setMessages([])}
                    className="text-zinc-400 hover:text-white p-1.5 rounded-lg hover:bg-white/5 transition-colors"
                    title="Reset Chat"
                  >
                    <RotateCcw className="size-4" />
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-zinc-400 hover:text-white p-1.5 rounded-lg hover:bg-white/5 transition-colors"
                >
                  <X className="size-5" />
                </button>
              </div>
            </div>

            {/* Messages Area */}
            <div
              ref={scrollContainerRef}
              className="flex-1 min-h-0 overflow-y-auto p-4 pb-8 space-y-4 custom-scroll"
            >
              {messages.length === 0 && !isStreaming ? (
                <div className="py-6 space-y-4">
                  <div className="p-4 rounded-2xl bg-zinc-900/40 border border-white/5 space-y-2">
                    <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs">
                      <HelpCircle className="size-4" />
                      <span>Ask AI Anything About This Blog</span>
                    </div>
                    <p className="text-zinc-400 text-xs leading-relaxed">
                      Have questions about this article? Want a quick summary or quiz questions? Click a prompt below or type your query!
                    </p>
                  </div>

                  <div className="space-y-2">
                    <span className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-wider block">
                      Quick Prompts:
                    </span>
                    <div className="grid grid-cols-1 gap-2">
                      {QUICK_PROMPTS.map((chip, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSendMessage(chip.prompt)}
                          className="p-3 bg-zinc-950 border border-white/5 hover:border-cyan-500/40 rounded-xl text-left hover:bg-zinc-900/60 transition-all group"
                        >
                          <span className="text-xs font-bold text-zinc-200 group-hover:text-cyan-300 transition-colors block">
                            {chip.label}
                          </span>
                          <span className="text-[10px] text-zinc-500 truncate block mt-0.5">
                            &ldquo;{chip.prompt}&rdquo;
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex gap-2.5 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    {msg.role === "assistant" && (
                      <div className="size-6 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shrink-0 mt-0.5">
                        <Bot className="size-3.5" />
                      </div>
                    )}

                    <div
                      className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed ${
                        msg.role === "user"
                          ? "bg-cyan-500/20 border border-cyan-500/30 text-white font-medium rounded-tr-none"
                          : "bg-zinc-900 border border-white/10 text-zinc-200 rounded-tl-none space-y-1"
                      }`}
                    >
                      {msg.role === "user" ? (
                        msg.content
                      ) : (
                        <MarkdownRenderer content={msg.content} />
                      )}
                    </div>

                    {msg.role === "user" && (
                      <div className="size-6 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-300 shrink-0 mt-0.5">
                        <User className="size-3.5" />
                      </div>
                    )}
                  </div>
                ))
              )}

              {/* Streaming Bubble */}
              {isStreaming && (
                <div className="flex gap-2.5 justify-start animate-in fade-in">
                  <div className="size-6 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shrink-0 mt-0.5">
                    <Bot className="size-3.5" />
                  </div>
                  <div className="max-w-[85%] rounded-2xl rounded-tl-none bg-zinc-900 border border-cyan-500/30 p-3.5 text-xs text-zinc-200">
                    {streamedText ? (
                      <MarkdownRenderer content={streamedText} />
                    ) : (
                      <div className="flex items-center gap-2 text-cyan-400 font-mono text-[11px]">
                        <Loader2 className="size-3.5 animate-spin" />
                        <span>Analyzing blog post content...</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

            </div>

            {/* Input Form */}
            <div className="p-3 border-t border-white/10 bg-zinc-950/90 backdrop-blur-md shrink-0">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                autoComplete="off"
                className="flex items-center gap-2 bg-zinc-900/90 border border-white/10 focus-within:border-cyan-400/50 rounded-xl p-1.5 transition-colors"
              >
                <input type="text" name="username" style={{ display: "none" }} tabIndex={-1} autoComplete="off" />
                <input type="password" name="password" style={{ display: "none" }} tabIndex={-1} autoComplete="new-password" />
                <input
                  type="text"
                  name="blog_chat_message"
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="sentences"
                  spellCheck={false}
                  data-lpignore="true"
                  data-1p-ignore="true"
                  data-bwignore="true"
                  data-form-type="other"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  disabled={isStreaming}
                  placeholder="Ask anything about this blog..."
                  className="flex-1 bg-transparent px-2.5 text-xs text-white placeholder-zinc-500 outline-none min-w-0"
                />
                <Button
                  type="submit"
                  size="icon"
                  disabled={isStreaming || !inputValue.trim()}
                  className="h-8 w-8 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-zinc-950 shrink-0 disabled:opacity-40"
                >
                  {isStreaming ? (
                    <Loader2 className="size-3.5 animate-spin text-zinc-950" />
                  ) : (
                    <Send className="size-3.5 text-zinc-950" />
                  )}
                </Button>
              </form>
            </div>
          </aside>
        </>
      )}
    </>
  );
}
