"use client";

import React, { useState, useRef, useEffect } from "react";
import { Send, Loader2, Bot, User, Plus } from "lucide-react";
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
  { label: "Summarize note", prompt: "Summarize the key concepts and conclusions of this note." },
  { label: "Quiz me (5 Questions)", prompt: "Generate 5 multiple-choice quiz questions based on this note to test my understanding." },
  { label: "Key Takeaways & Formulas", prompt: "List the essential takeaways, definitions, and equations from this note." },
  { label: "Explain in Simple Terms", prompt: "Explain the main subject of this note in simple, intuitive terms with an analogy." },
];

function cleanSseText(text: string): string {
  if (!text) return "";
  if (!text.includes('data: {"text":') && !text.includes("data: {")) {
    return text;
  }
  const lines = text.split("\n");
  let result = "";
  let matched = false;
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("data: ")) {
      try {
        const parsed = JSON.parse(trimmed.substring(6));
        if (parsed.text) {
          result += parsed.text;
          matched = true;
        }
      } catch {
        // Ignore partial JSON parsing
      }
    }
  }
  return matched ? result : text;
}

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
        throw new Error("Failed to contact study copilot.");
      }

      if (!response.body) return;

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullAssistantText = "";
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed === "data: [DONE]") continue;
          if (trimmed.startsWith("data: ")) {
            try {
              const parsed = JSON.parse(trimmed.substring(6));
              if (parsed.text) {
                fullAssistantText += parsed.text;
                setStreamedText(fullAssistantText);
              } else if (parsed.error) {
                toast.error(parsed.error);
              }
            } catch {
              // Partial stream chunk JSON parse error, ignore
            }
          }
        }
      }

      // Flush remaining buffered data if any
      if (buffer.trim().startsWith("data: ")) {
        try {
          const parsed = JSON.parse(buffer.trim().substring(6));
          if (parsed.text) {
            fullAssistantText += parsed.text;
          }
        } catch {
          // ignore
        }
      }

      const finalContent = cleanSseText(fullAssistantText || buffer);

      const assistantMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: finalContent || "I have analyzed your note and answered your query.",
      };

      setMessages((prev) => [...prev, assistantMsg]);
      setStreamedText("");
    } catch (e) {
      console.error(e);
      toast.error("Error communicating with AI assistant.");
    } finally {
      setIsStreaming(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-bg-surface text-text-primary">
      {/* Messages area */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-3 custom-scroll select-text"
      >
        {messages.length === 0 && !isStreaming ? (
          <div className="space-y-4 pt-2">
            <div className="p-3.5 bg-bg-elevated border border-border-subtle rounded-xl space-y-1">
              <span className="text-xs font-semibold text-text-primary block font-display">
                Contextual AI Study Assistant
              </span>
              <p className="text-[11px] text-text-muted leading-relaxed">
                Ask questions, generate practice quizzes, or summarize &ldquo;{noteTitle}&rdquo;.
              </p>
            </div>

            <div className="space-y-1.5">
              <span className="text-[10px] font-mono font-bold text-text-muted uppercase tracking-wider block">
                Suggested Prompts:
              </span>
              <div className="grid grid-cols-1 gap-1.5">
                {QUICK_PROMPTS.map((chip, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSendMessage(chip.prompt)}
                    className="p-2.5 bg-bg-base border border-border-subtle hover:border-border-default rounded-xl text-left hover:bg-bg-elevated transition-colors group cursor-pointer"
                  >
                    <span className="text-xs font-medium text-text-primary group-hover:text-accent-primary transition-colors block">
                      {chip.label}
                    </span>
                    <span className="text-[10px] text-text-muted line-clamp-1 mt-0.5">
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
              <div className="size-6 rounded-full bg-accent-primary/10 border border-accent-primary/20 flex items-center justify-center text-accent-primary shrink-0 mt-0.5">
                <Bot className="size-3.5" />
              </div>
            )}

            <div
              className={`max-w-[85%] rounded-xl p-3 text-xs leading-relaxed ${
                msg.role === "user"
                  ? "bg-accent-primary text-bg-base font-semibold rounded-tr-none"
                  : "bg-bg-elevated border border-border-subtle text-text-primary rounded-tl-none space-y-2"
              }`}
            >
              {msg.role === "user" ? (
                msg.content
              ) : (
                <>
                  <MarkdownRenderer content={cleanSseText(msg.content)} />
                  {onInsertText && (
                    <div className="pt-2 border-t border-border-subtle flex justify-end">
                      <button
                        type="button"
                        onClick={() => onInsertText(cleanSseText(msg.content))}
                        className="text-[10px] font-mono font-medium text-accent-primary hover:text-accent-primary-hover flex items-center gap-1 cursor-pointer"
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
              <div className="size-6 rounded-full bg-bg-elevated border border-border-subtle flex items-center justify-center text-text-muted shrink-0 mt-0.5">
                <User className="size-3.5" />
              </div>
            )}
          </div>
        ))}

        {isStreaming && (
          <div className="flex gap-2.5 justify-start">
            <div className="size-6 rounded-full bg-accent-primary/10 border border-accent-primary/20 flex items-center justify-center text-accent-primary shrink-0 mt-0.5">
              <Bot className="size-3.5 animate-pulse" />
            </div>
            <div className="max-w-[85%] rounded-xl p-3 bg-bg-elevated border border-border-subtle text-text-primary text-xs rounded-tl-none space-y-1">
              <MarkdownRenderer content={cleanSseText(streamedText) || "Thinking..."} />
              <div className="flex items-center gap-1 text-[10px] text-accent-primary font-mono animate-pulse">
                <Loader2 className="size-3 animate-spin" />
                <span>Generating response...</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input bar */}
      <div className="p-3 border-t border-border-subtle bg-bg-surface shrink-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            disabled={isStreaming}
            placeholder="Ask about this note..."
            className="flex-1 bg-bg-base border border-border-subtle focus:border-accent-primary rounded-xl px-3 py-2 text-xs text-text-primary placeholder:text-text-muted outline-none transition-colors"
          />
          <Button
            type="submit"
            size="icon"
            disabled={isStreaming || !inputValue.trim()}
            className="size-8 rounded-xl bg-accent-primary hover:bg-accent-primary-hover text-bg-base transition-transform active:scale-95 disabled:opacity-40"
            aria-label="Send message"
          >
            {isStreaming ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Send className="size-3.5" />
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
