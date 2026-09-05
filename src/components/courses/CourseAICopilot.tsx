"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Send, Bot, User, X, Loader2, RefreshCw, HelpCircle, BookOpen, Code, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MarkdownRenderer } from "@/components/ui/MarkdownRenderer";
import { toast } from "sonner";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

interface CourseAICopilotProps {
  courseTitle: string;
  lessonTitle: string;
  lessonText?: string;
  isOpen: boolean;
  onClose: () => void;
}

export function CourseAICopilot({
  courseTitle,
  lessonTitle,
  lessonText = "",
  isOpen,
  onClose,
}: CourseAICopilotProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: `Hello! I'm your **Course Copilot**. Ask me any conceptual or practical questions about **"${lessonTitle || "this lecture"}"**!`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  // Handle send message
  const handleSend = async (customPrompt?: string) => {
    const messageText = customPrompt || input.trim();
    if (!messageText || loading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: messageText,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!customPrompt) setInput("");
    setLoading(true);

    try {
      const payload = {
        courseTitle,
        lessonTitle,
        lessonText,
        messages: [...messages, userMsg].map((m) => ({ role: m.role, content: m.content })),
      };

      const res = await fetch("/api/courses/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch response");

      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "Failed to reach AI copilot";
      console.error(err);
      toast.error(errMsg);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: "⚠️ *Sorry, I encountered an issue generating a response. Please try again in a moment.*",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const promptPills = [
    { label: "Explain simply", icon: Lightbulb, prompt: "Can you explain this lecture in simple, beginner-friendly terms?" },
    { label: "Key Takeaways", icon: BookOpen, prompt: "What are the key takeaways and summary of this lecture?" },
    { label: "3 Quiz Questions", icon: HelpCircle, prompt: "Generate 3 quick practice quiz questions based on this lecture." },
    { label: "Code Example", icon: Code, prompt: "Provide a practical code or formula example illustrating this lesson." },
  ];

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, x: 320 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 320 }}
        transition={{ type: "spring", stiffness: 350, damping: 30 }}
        className="fixed right-0 top-0 bottom-0 w-full sm:w-[420px] bg-[#150F0B] border-l border-[#2E2118] shadow-2xl z-50 flex flex-col backdrop-blur-2xl text-[#FAFAF8]"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#241811] flex items-center justify-between bg-[#0A0806]">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-[#F5B429]/10 border border-[#F5B429]/25 flex items-center justify-center text-[#F5B429]">
              <Sparkles className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-[#FAFAF8] font-display">Course Copilot</h3>
                <span className="text-[9px] font-mono font-bold bg-[#F5B429]/10 text-[#F5B429] px-2 py-0.5 rounded-full border border-[#F5B429]/25">
                  ACTIVE
                </span>
              </div>
              <p className="text-[11px] text-[#8A8078] truncate max-w-[220px]">
                {lessonTitle ? `Lecture: ${lessonTitle}` : courseTitle}
              </p>
            </div>
          </div>
          <Button
            size="icon"
            variant="ghost"
            onClick={onClose}
            className="size-8 rounded-xl text-[#8A8078] hover:text-[#FAFAF8] hover:bg-[#241811]"
          >
            <X className="size-4" />
          </Button>
        </div>

        {/* Prompt Pills Bar */}
        <div className="p-3 bg-[#0A0806]/80 border-b border-[#241811] overflow-x-auto flex gap-2 custom-scroll shrink-0">
          {promptPills.map((pill, idx) => {
            const Icon = pill.icon;
            return (
              <button
                key={idx}
                onClick={() => handleSend(pill.prompt)}
                disabled={loading}
                className="flex items-center gap-1.5 whitespace-nowrap bg-[#241811] hover:bg-[#F5B429]/10 text-[#B8AFA6] hover:text-[#F5B429] border border-[#2E2118] hover:border-[#F5B429]/30 px-3 py-1.5 rounded-full text-xs font-mono transition-all shrink-0"
              >
                <Icon className="size-3 text-[#F5B429]" />
                <span>{pill.label}</span>
              </button>
            );
          })}
        </div>

        {/* Message Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scroll">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {msg.role === "assistant" && (
                <div className="size-7 rounded-xl bg-[#F5B429]/10 border border-[#F5B429]/25 flex items-center justify-center text-[#F5B429] shrink-0 mt-0.5">
                  <Bot className="size-4" />
                </div>
              )}

              <div
                className={`max-w-[85%] rounded-2xl p-3.5 text-xs leading-relaxed ${
                  msg.role === "user"
                    ? "bg-[#F5B429]/15 text-[#FAFAF8] border border-[#F5B429]/30 rounded-tr-none"
                    : "bg-[#0A0806] text-[#FAFAF8] border border-[#241811] rounded-tl-none"
                }`}
              >
                {msg.role === "assistant" ? (
                  <MarkdownRenderer content={msg.content} />
                ) : (
                  <div className="font-sans whitespace-pre-wrap">{msg.content}</div>
                )}
                <div className="mt-1 text-[9px] font-mono text-[#8A8078] text-right">
                  {msg.timestamp}
                </div>
              </div>

              {msg.role === "user" && (
                <div className="size-7 rounded-xl bg-[#241811] border border-[#2E2118] flex items-center justify-center text-[#B8AFA6] shrink-0 mt-0.5">
                  <User className="size-4" />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-2.5 text-xs text-[#F5B429] font-mono bg-[#F5B429]/10 border border-[#F5B429]/20 p-3 rounded-2xl w-fit">
              <Loader2 className="size-4 animate-spin text-[#F5B429]" />
              <span>Copilot is analyzing lecture context...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-4 border-t border-[#241811] bg-[#0A0806] shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask Copilot about this lecture..."
              className="flex-1 bg-[#150F0B] border border-[#2E2118] rounded-xl px-4 py-2.5 text-xs text-[#FAFAF8] placeholder:text-[#8A8078] outline-none focus:border-[#F5B429]/50 transition-colors"
            />
            <Button
              type="submit"
              disabled={loading || !input.trim()}
              className="btn-premium-primary size-10 rounded-xl p-0 shrink-0"
            >
              {loading ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
            </Button>
          </form>
          <div className="flex items-center justify-between mt-2 px-1 text-[10px] font-mono text-[#8A8078]">
            <span>Powered by Gemini AI</span>
            <button
              onClick={() => setMessages([messages[0]])}
              className="hover:text-[#F5B429] flex items-center gap-1 transition-colors"
            >
              <RefreshCw className="size-2.5" /> Clear Chat
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
