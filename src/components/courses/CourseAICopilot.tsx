/* eslint-disable */
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
      content: `Hello! I'm your **Gemini AI Course Copilot** (with OpenRouter fallback). Ask me any questions about **"${lessonTitle || "this lecture"}"**!`,
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
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to reach AI copilot");
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: "⚠️ *Sorry, I encountered an issue connecting to Gemini / OpenRouter. Please try again in a moment.*",
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
    { label: "Code Example", icon: Code, prompt: "Provide a practical code/formula example illustrating this lesson." },
  ];

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, x: 300 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 300 }}
        transition={{ type: "spring", stiffness: 350, damping: 30 }}
        className="fixed right-0 top-0 bottom-0 w-full sm:w-[420px] bg-[#09090e] border-l border-white/10 shadow-2xl z-50 flex flex-col backdrop-blur-2xl text-zinc-100"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between bg-zinc-950/80">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-2xl bg-gradient-to-tr from-amber-500/20 to-violet-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-inner">
              <Sparkles className="size-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white">Gemini Course Copilot</h3>
                <span className="text-[9px] font-mono font-bold bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/30">
                  AI ACTIVE
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 truncate max-w-[220px]">
                {lessonTitle ? `Lecture: ${lessonTitle}` : courseTitle}
              </p>
            </div>
          </div>
          <Button
            size="icon"
            variant="ghost"
            onClick={onClose}
            className="size-8 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10"
          >
            <X className="size-4" />
          </Button>
        </div>

        {/* Prompt Pills Bar */}
        <div className="p-3 bg-zinc-950/40 border-b border-white/5 overflow-x-auto flex gap-2 custom-scroll shrink-0">
          {promptPills.map((pill, idx) => {
            const Icon = pill.icon;
            return (
              <button
                key={idx}
                onClick={() => handleSend(pill.prompt)}
                disabled={loading}
                className="flex items-center gap-1.5 whitespace-nowrap bg-white/5 hover:bg-amber-500/10 hover:border-amber-500/30 text-zinc-300 hover:text-amber-300 border border-white/10 px-3 py-1.5 rounded-full text-xs font-mono transition-all shrink-0"
              >
                <Icon className="size-3 text-amber-400" />
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
                <div className="size-7 rounded-xl bg-violet-500/20 border border-violet-500/30 flex items-center justify-center text-violet-300 shrink-0 mt-0.5">
                  <Bot className="size-4" />
                </div>
              )}

              <div
                className={`max-w-[85%] rounded-2xl p-3.5 text-xs leading-relaxed ${
                  msg.role === "user"
                    ? "bg-amber-500/20 text-amber-100 border border-amber-500/40 rounded-tr-none"
                    : "bg-zinc-900/90 text-zinc-200 border border-white/10 rounded-tl-none"
                }`}
              >
                {msg.role === "assistant" ? (
                  <MarkdownRenderer content={msg.content} />
                ) : (
                  <div className="font-sans whitespace-pre-wrap">{msg.content}</div>
                )}
                <div className="mt-1 text-[9px] font-mono text-zinc-500 text-right">
                  {msg.timestamp}
                </div>
              </div>

              {msg.role === "user" && (
                <div className="size-7 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-300 shrink-0 mt-0.5">
                  <User className="size-4" />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-3 text-xs text-amber-400 font-mono bg-amber-500/10 border border-amber-500/20 p-3 rounded-2xl w-fit animate-pulse">
              <Loader2 className="size-4 animate-spin text-amber-400" />
              <span>Gemini AI synthesizing answer...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-4 border-t border-white/10 bg-zinc-950/90 shrink-0">
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
              className="flex-1 bg-zinc-900 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-zinc-500 outline-none focus:border-amber-500 transition-colors"
            />
            <Button
              type="submit"
              disabled={loading || !input.trim()}
              className="bg-amber-500 hover:bg-amber-400 text-zinc-950 size-10 rounded-xl p-0 shrink-0 shadow-lg shadow-amber-500/20"
            >
              {loading ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
            </Button>
          </form>
          <div className="flex items-center justify-between mt-2 px-1 text-[10px] font-mono text-zinc-500">
            <span>Powered by Gemini & OpenRouter AI</span>
            <button
              onClick={() => setMessages([messages[0]])}
              className="hover:text-amber-400 flex items-center gap-1 transition-colors"
            >
              <RefreshCw className="size-2.5" /> Clear Chat
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
