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
    <div className="flex flex-col h-full min-h-0 bg-[#0A0806] text-[#FAFAF8] overflow-hidden select-none">
      {/* Context Badge Sub-header */}
      <div className="px-3.5 py-2.5 bg-[#150F0B] border-b border-[#2E2118] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <div className="size-2 rounded-full bg-[#F5B429] animate-pulse shrink-0" />
          <span className="text-[11px] font-mono text-[#8A8078] truncate">
            Note Context: <strong className="text-[#FAFAF8]">{noteTitle || "Untitled Note"}</strong>
          </span>
        </div>

        {messages.length > 0 && (
          <button
            onClick={handleClearChat}
            className="text-[#8A8078] hover:text-[#FAFAF8] px-2 py-0.5 rounded hover:bg-[#241811] transition-colors text-[10px] font-mono flex items-center gap-1 shrink-0 cursor-pointer"
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
            <div className="p-3.5 rounded-2xl bg-[#150F0B] border border-[#2E2118] space-y-2 shadow-[0_0_20px_-5px_rgba(245,148,29,0.1)]">
              <div className="flex items-center gap-2 text-[#F5B429] font-bold text-xs font-display">
                <HelpCircle className="size-4 text-[#F5B429]" />
                <span>Ask Anything About This Note</span>
              </div>
              <p className="text-[#8A8078] text-xs leading-relaxed font-light">
                I have full context of this note. Select a quick prompt or type your query below to get instant AI answers, summaries, or study questions!
              </p>
            </div>

            {/* Quick Prompts Chips */}
            <div className="space-y-2">
              <span className="text-[10px] font-mono font-bold text-[#8A8078] uppercase tracking-wider block">
                Suggested Actions:
              </span>
              <div className="grid grid-cols-1 gap-2">
                {QUICK_PROMPTS.map((chip, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(chip.prompt)}
                    className="p-2.5 bg-[#150F0B] border border-[#2E2118] hover:border-[#F5B429]/40 rounded-xl text-left hover:bg-[#241811] transition-all group cursor-pointer"
                  >
                    <span className="text-xs font-semibold text-[#FAFAF8] group-hover:text-[#F5B429] transition-colors block">
                      {chip.label}
                    </span>
                    <span className="text-[11px] text-[#8A8078] line-clamp-1 mt-0.5 font-light">
                      {chip.prompt}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : null}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-2.5 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            {msg.role === "assistant" && (
              <div className="size-6 rounded-full bg-[#F5B429]/10 border border-[#F5B429]/20 flex items-center justify-center text-[#F5B429] shrink-0 mt-0.5">
                <Bot className="size-3.5" />
              </div>
            )}

            <div
              className={`max-w-[85%] rounded-2xl p-3.5 text-xs ${
                msg.role === "user"
                  ? "bg-gradient-to-r from-[#F7C948] to-[#F5941D] text-[#150F0B] font-medium rounded-tr-none shadow-[0_0_15px_rgba(245,180,41,0.2)]"
                  : "bg-[#150F0B] border border-[#2E2118] text-[#FAFAF8] rounded-tl-none space-y-2 shadow-[0_0_20px_-5px_rgba(245,148,29,0.1)]"
              }`}
            >
              {msg.role === "user" ? (
                msg.content
              ) : (
                <>
                  <MarkdownRenderer content={msg.content} />
                  {onInsertText && (
                    <div className="pt-2 border-t border-[#2E2118] flex justify-end">
                      <button
                        onClick={() => onInsertText(msg.content)}
                        className="text-[10px] font-mono text-[#F5B429] hover:text-[#FCD34D] flex items-center gap-1 cursor-pointer"
                        title="Insert response directly into note"
                      >
                        <Plus className="size-3" />
                        <span>Insert in note</span>
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>

            {msg.role === "user" && (
              <div className="size-6 rounded-full bg-[#241811] border border-[#2E2118] flex items-center justify-center text-[#8A8078] shrink-0 mt-0.5">
                <User className="size-3.5" />
              </div>
            )}
          </div>
        ))}

        {/* Live streaming bubble */}
        {isStreaming && (
          <div className="flex gap-2.5 justify-start animate-in fade-in">
            <div className="size-6 rounded-full bg-[#F5B429]/10 border border-[#F5B429]/20 flex items-center justify-center text-[#F5B429] shrink-0 mt-0.5">
              <Bot className="size-3.5" />
            </div>
            <div className="max-w-[85%] rounded-2xl rounded-tl-none bg-[#150F0B] border border-[#F5B429]/30 p-3.5 text-xs text-[#FAFAF8]">
              {streamedText ? (
                <MarkdownRenderer content={streamedText} />
              ) : (
                <div className="flex items-center gap-2 text-[#F5B429] font-mono text-[11px]">
                  <Loader2 className="size-3.5 animate-spin" />
                  <span>Analyzing note context...</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Input Form */}
      <div className="p-3 border-t border-[#2E2118] bg-[#0A0806]/90 backdrop-blur-md shrink-0 sticky bottom-0 z-10">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          autoComplete="off"
          className="flex items-center gap-2 bg-[#150F0B] border border-[#2E2118] focus-within:border-[#F5B429]/50 rounded-xl p-1.5 transition-colors"
        >
          <input type="text" name="username" style={{ display: "none" }} tabIndex={-1} autoComplete="off" />
          <input type="password" name="password" style={{ display: "none" }} tabIndex={-1} autoComplete="new-password" />
          <input
            type="text"
            name="note_chat_message"
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
            placeholder="Ask anything about this note..."
            className="flex-1 bg-transparent px-2.5 text-xs text-[#FAFAF8] placeholder-[#8A8078] outline-none min-w-0"
          />
          <Button
            type="submit"
            size="icon"
            disabled={isStreaming || !inputValue.trim()}
            className="h-8 w-8 rounded-lg bg-gradient-to-br from-[#F7C948] to-[#F5941D] hover:opacity-90 text-[#150F0B] shrink-0 disabled:opacity-40 shadow-sm cursor-pointer"
          >
            {isStreaming ? (
              <Loader2 className="size-3.5 animate-spin text-[#150F0B]" />
            ) : (
              <Send className="size-3.5 text-[#150F0B]" />
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
