"use client";

import React, { useState, useRef, useEffect } from "react";
import { Send, Loader2, Bot, User, HelpCircle, RotateCcw, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MarkdownRenderer } from "@/components/ui/MarkdownRenderer";
import { toast } from "sonner";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface NoteSideChatProps {
  noteTitle: string;
  noteContentText: string;
  onInsertText?: (text: string) => void;
}

const QUICK_PROMPTS = [
  { label: "Summarize note", prompt: "Summarize the key concepts and conclusion of this note." },
  { label: "Quiz me (5 Questions)", prompt: "Generate 5 multiple-choice quiz questions based on this note to test my understanding." },
  { label: "Key Takeaways & Formulas", prompt: "List the essential takeaways, definitions, and formulas from this note." },
  { label: "Explain in Simple Terms", prompt: "Explain the main subject of this note in simple, easy-to-understand terms with an analogy." },
];

export function NoteSideChat({ noteTitle, noteContentText, onInsertText }: NoteSideChatProps) {
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
    scrollToBottom();
  }, [messages, streamedText]);

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
          contextNoteContent: `Document Title: ${noteTitle}\n\nDocument Content:\n${noteContentText || "(Empty note content)"}`,
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
        content: fullAssistantText || "I have analyzed your note and provided an answer.",
      };

      setMessages((prev) => [...prev, assistantMsg]);
      setStreamedText("");
    } catch (err) {
      console.error("Side chat error:", err);
      toast.error("Failed to stream response. Please try again.");
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: "Sorry, I encountered an issue analyzing this note. Please try asking again.",
        },
      ]);
    } finally {
      setIsStreaming(false);
      setStreamedText("");
    }
  };

  const handleClearChat = () => {
    setMessages([]);
    setStreamedText("");
    toast.info("Side chat history cleared.");
  };

  return (
    <div className="flex flex-col h-full min-h-0 bg-[#07070a] text-zinc-100 overflow-hidden select-none">
      {/* Context Badge Sub-header */}
      <div className="px-3.5 py-2.5 bg-zinc-950/80 border-b border-white/5 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <div className="size-2 rounded-full bg-cyan-400 animate-pulse shrink-0" />
          <span className="text-[11px] font-mono text-zinc-400 truncate">
            Note Context: <strong className="text-zinc-200">{noteTitle || "Untitled Note"}</strong>
          </span>
        </div>

        {messages.length > 0 && (
          <button
            onClick={handleClearChat}
            className="text-zinc-500 hover:text-zinc-300 px-2 py-0.5 rounded hover:bg-white/5 transition-colors text-[10px] font-mono flex items-center gap-1 shrink-0"
            title="Reset Chat"
          >
            <RotateCcw className="size-3" />
            <span>Clear</span>
          </button>
        )}
      </div>

      {/* Messages area */}
      <div
        ref={scrollContainerRef}
        className="flex-1 min-h-0 overflow-y-auto p-4 pb-8 space-y-4 custom-scroll"
      >
        {messages.length === 0 && !isStreaming ? (
          <div className="py-6 space-y-4">
            <div className="p-3.5 rounded-2xl bg-zinc-900/40 border border-white/5 space-y-2">
              <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs">
                <HelpCircle className="size-4" />
                <span>Ask Anything About This Note</span>
              </div>
              <p className="text-zinc-400 text-xs leading-relaxed">
                I have full context of this note. Select a quick prompt or type your query below to get instant AI answers, summaries, or study questions!
              </p>
            </div>

            {/* Quick Prompts Chips */}
            <div className="space-y-2">
              <span className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-wider block">
                Suggested Actions:
              </span>
              <div className="grid grid-cols-1 gap-2">
                {QUICK_PROMPTS.map((chip, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(chip.prompt)}
                    className="p-2.5 bg-zinc-950 border border-white/5 hover:border-cyan-500/30 rounded-xl text-left hover:bg-zinc-900/50 transition-all group"
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
                    : "bg-zinc-900 border border-white/10 text-zinc-200 rounded-tl-none space-y-2"
                }`}
              >
                {msg.role === "user" ? (
                  msg.content
                ) : (
                  <>
                    <MarkdownRenderer content={msg.content} />
                    {onInsertText && (
                      <button
                        type="button"
                        onClick={() => {
                          onInsertText(msg.content);
                          toast.success("Inserted text into article content!");
                        }}
                        className="mt-2 text-[10px] font-mono font-bold bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 px-2 py-1 rounded-md flex items-center gap-1 transition-colors select-none"
                      >
                        <Plus className="size-3 text-cyan-400" />
                        <span>Insert into Article</span>
                      </button>
                    )}
                  </>
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

        {/* Live streaming bubble */}
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
                  <span>Analyzing note context...</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Input Form */}
      <div className="p-3 border-t border-white/10 bg-zinc-950/90 backdrop-blur-md shrink-0 sticky bottom-0 z-10">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2 bg-zinc-900/90 border border-white/10 focus-within:border-cyan-400/50 rounded-xl p-1.5 transition-colors"
        >
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            disabled={isStreaming}
            placeholder="Ask anything about this note..."
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
    </div>
  );
}
