"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { useWorkspaceStore } from "@/stores/workspaceStore";
import { Sparkles, MessageSquare, Send, Plus, Trash2, Loader2, FileText, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

interface ChatSession {
  _id: string;
  title: string;
  messages: ChatMessage[];
  updatedAt: string;
}

export default function ChatPage() {
  const { activeNoteId, notes } = useWorkspaceStore();
  const activeNote = notes.find((n) => n._id === activeNoteId);

  const [chats, setChats] = useState<ChatSession[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [useNoteContext, setUseNoteContext] = useState(false);
  const [streamedText, setStreamedText] = useState("");

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Load chat session histories
  const fetchChats = useCallback(async () => {
    try {
      const res = await fetch("/api/chats");
      if (res.ok) {
        const data = await res.json();
        setChats(data);
        if (data.length > 0 && !activeChatId) {
          setActiveChatId(data[0]._id);
          setMessages(data[0].messages || []);
        }
      }
    } catch (e) {
      console.error(e);
    }
  }, [activeChatId]);

  useEffect(() => {
    fetchChats();
  }, [fetchChats]);

  useEffect(() => {
    if (activeChatId) {
      const current = chats.find((c) => c._id === activeChatId);
      if (current) {
        setMessages(current.messages || []);
      }
    } else {
      setMessages([]);
    }
  }, [activeChatId, chats]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamedText]);

  const handleStartNewChat = async () => {
    try {
      const res = await fetch("/api/chats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "New Chat" }),
      });
      if (res.ok) {
        const newChat = await res.json();
        setChats((prev) => [newChat, ...prev]);
        setActiveChatId(newChat._id);
        setMessages([]);
        setStreamedText("");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteChat = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Delete this conversation?")) return;

    try {
      const res = await fetch(`/api/chats/${id}`, { method: "DELETE" });
      if (res.ok) {
        setChats((prev) => prev.filter((c) => c._id !== id));
        if (activeChatId === id) {
          setActiveChatId(null);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Extract raw text from TipTap JSON structure
  const getNoteTextContent = () => {
    if (!activeNote || !activeNote.content) return "";
    try {
      interface TipTapNode {
        type?: string;
        text?: string;
        content?: TipTapNode[];
      }
      const extract = (node: TipTapNode): string => {
        if (!node) return "";
        if (node.type === "text") return node.text || "";
        if (node.content) {
          return node.content.map(extract).join(" ");
        }
        return "";
      };
      return extract(activeNote.content as TipTapNode);
    } catch {
      return "";
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMsgText = inputValue.trim();
    setInputValue("");
    setIsLoading(true);
    setStreamedText("");

    // Add user message locally
    const newUserMsg: ChatMessage = {
      role: "user",
      content: userMsgText,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, newUserMsg]);

    const contextContent = useNoteContext ? getNoteTextContent() : "";

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMsgText,
          chatId: activeChatId || undefined,
          contextNoteContent: contextContent || undefined,
        }),
      });

      if (!res.ok) throw new Error("Failed to send message");

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let replyAccumulator = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              try {
                const data = JSON.parse(line.substring(6));
                if (data.text) {
                  replyAccumulator += data.text;
                  setStreamedText(replyAccumulator);
                }
              } catch {
                // Ignore parsing errors for partial stream chunks
              }
            }
          }
        }
      }

      // Append assistant message locally
      const newAssistantMsg: ChatMessage = {
        role: "assistant",
        content: replyAccumulator,
        createdAt: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, newAssistantMsg]);
      setStreamedText("");
      setUseNoteContext(false);

      // Refresh chats list to capture updating metadata titles
      await fetchChats();
    } catch (err) {
      console.error(err);
      alert("Error talking to Claude.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 flex h-full bg-neutral-950 overflow-hidden relative">
      {/* Ambient background glows */}
      <div className="absolute top-0 right-1/4 w-[400px] h-[300px] bg-cyan-500/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-[300px] h-[250px] bg-violet-500/5 rounded-full blur-[80px] pointer-events-none" />

      {/* ── Mobile chat-sidebar checkbox toggle ── */}
      <input type="checkbox" id="chat-sidebar-toggle" className="peer hidden" />

      {/* ── Mobile backdrop ── */}
      <label
        htmlFor="chat-sidebar-toggle"
        className="fixed inset-0 bg-black/60 z-40 md:hidden
                   opacity-0 pointer-events-none
                   peer-checked:opacity-100 peer-checked:pointer-events-auto
                   transition-opacity duration-300"
        aria-hidden="true"
      />

      {/* Side Conversations History */}
      <div className="
        fixed md:static inset-y-0 left-0 z-50
        w-64 shrink-0
        border-r border-neutral-900 bg-neutral-950/98 md:bg-neutral-950/60 backdrop-blur-md
        flex flex-col justify-between
        select-none
        -translate-x-full peer-checked:translate-x-0
        md:translate-x-0
        transition-transform duration-300 ease-in-out
      ">
        <div className="p-4 flex flex-col space-y-4 h-full">
          <div className="flex items-center gap-2">
            <Button
              onClick={handleStartNewChat}
              className="flex-1 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 text-neutral-200 text-xs font-bold gap-2 h-9 rounded-lg transition-all"
              style={{ fontFamily: "var(--font-space-grotesk)" }}
            >
              <Plus className="h-4 w-4" /> New Chat
            </Button>
            {/* Close button — mobile only */}
            <label
              htmlFor="chat-sidebar-toggle"
              className="md:hidden p-1.5 rounded-md text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800 cursor-pointer transition-colors"
              aria-label="Close chat history"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </label>
          </div>

          <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 custom-scroll">
            <div
              className="text-[9px] font-bold text-neutral-500 uppercase tracking-widest mb-2 px-2"
              style={{ fontFamily: "var(--font-space-grotesk)" }}
            >
              History
            </div>
            {chats.map((c) => {
              const isActive = activeChatId === c._id;
              return (
                <div
                  key={c._id}
                  onClick={() => setActiveChatId(c._id)}
                  className={`group flex items-center justify-between py-1.5 px-3 rounded-lg cursor-pointer transition-all duration-155 ${
                    isActive
                      ? "bg-neutral-900 border border-neutral-800 text-neutral-100 font-medium"
                      : "text-neutral-500 hover:text-neutral-300 hover:bg-neutral-900/30"
                  }`}
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <MessageSquare className={`h-4 w-4 shrink-0 ${isActive ? "text-cyan-400" : "text-neutral-700"}`} />
                    <span className="text-xs truncate">{c.title}</span>
                  </div>
                  <button
                    onClick={(e) => handleDeleteChat(c._id, e)}
                    className="p-1 rounded hover:bg-neutral-800 text-neutral-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              );
            })}
            {chats.length === 0 && (
              <div className="text-center py-8 text-xs text-neutral-600 italic">No chat sessions</div>
            )}
          </div>
        </div>
      </div>

      {/* Main chat window */}
      <div className="flex-1 flex flex-col h-full bg-neutral-950 overflow-hidden z-10 relative">
        {/* Chat header — close button on mobile */}
        <div className="h-16 border-b border-neutral-900 px-4 sm:px-8 flex items-center justify-between shrink-0 bg-neutral-950/80 backdrop-blur-md">
          <div className="flex items-center gap-2">
            {/* Mobile hamburger to open chat sidebar */}
            <label
              htmlFor="chat-sidebar-toggle"
              className="md:hidden mr-1 p-1.5 rounded-md bg-neutral-800 hover:bg-neutral-700 cursor-pointer transition-colors"
              aria-label="Open chat history"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-neutral-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </label>
            <Sparkles className="h-4 w-4 text-cyan-400 neon-pulse" />
            <h1
              className="font-bold text-neutral-100 text-sm"
              style={{ fontFamily: "var(--font-space-grotesk)" }}
            >
              {chats.find((c) => c._id === activeChatId)?.title || "AI Claude Assistant"}
            </h1>
          </div>
        </div>

        {/* Messages Feed */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6 custom-scroll">
          {messages.length === 0 && !streamedText && (
            <div className="h-full flex flex-col items-center justify-center text-center relative select-none">
              <div className="max-w-md space-y-6">
                <div className="h-16 w-16 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-center text-cyan-400 mx-auto shadow-xl">
                  <MessageSquare className="h-8 w-8" />
                </div>
                <div className="space-y-2">
                  <h2
                    className="text-xl font-bold text-neutral-200 tracking-tight"
                    style={{ fontFamily: "var(--font-space-grotesk)" }}
                  >
                    Ask Claude anything
                  </h2>
                  <p className="text-neutral-500 text-xs max-w-xs mx-auto leading-relaxed">
                    Brainstorm layouts, analyze your note structure, write summaries, or organize doubts.
                  </p>
                </div>
              </div>
            </div>
          )}

          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex gap-4 max-w-3xl ${msg.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"}`}
            >
              <div
                className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 border select-none font-bold text-xs ${
                  msg.role === "user"
                    ? "bg-neutral-800 border-neutral-700 text-neutral-350"
                    : "bg-cyan-500/10 border-cyan-500/25 text-cyan-400"
                }`}
                style={{ fontFamily: "var(--font-space-grotesk)" }}
              >
                {msg.role === "user" ? "U" : "C"}
              </div>

              <div
                className={`p-4 rounded-xl border text-xs leading-relaxed whitespace-pre-wrap ${
                  msg.role === "user"
                    ? "bg-cyan-500/5 border-cyan-500/20 text-neutral-200"
                    : "bg-neutral-955/20 backdrop-blur-sm border-white/5 text-neutral-300"
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}

          {/* Real-time Streaming message */}
          {streamedText && (
            <div className="flex gap-4 max-w-3xl mr-auto">
              <div
                className="h-8 w-8 rounded-lg bg-cyan-500/10 border border-cyan-500/25 flex items-center justify-center shrink-0 text-cyan-400 select-none font-bold text-xs"
                style={{ fontFamily: "var(--font-space-grotesk)" }}
              >
                C
              </div>
              <div className="p-4 rounded-xl border bg-neutral-955/20 backdrop-blur-sm border-white/5 text-neutral-300 text-xs leading-relaxed whitespace-pre-wrap">
                {streamedText}
                <span className="inline-block w-1.5 h-4 bg-cyan-400 animate-pulse ml-1 align-middle" />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Note context attachment banner */}
        {activeNote && (
          <div className="px-8 py-2 border-t border-neutral-900 bg-neutral-950/40 flex items-center justify-between select-none">
            <div className="flex items-center gap-2 text-xs text-neutral-500">
              <FileText className="h-3.5 w-3.5 text-neutral-600" />
              <span>Attach note context: <strong className="text-neutral-300">{activeNote.title}</strong></span>
            </div>
            <button
              onClick={() => setUseNoteContext(!useNoteContext)}
              className={`flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded transition-all border ${
                useNoteContext
                  ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/20"
                  : "bg-neutral-900/60 text-neutral-400 border-neutral-800 hover:border-neutral-700"
              }`}
              style={{ fontFamily: "var(--font-space-grotesk)" }}
            >
              {useNoteContext && <CheckCircle2 className="h-3 w-3 text-cyan-400" />}
              <span>{useNoteContext ? "Attached" : "Attach Context"}</span>
            </button>
          </div>
        )}

        {/* Input Form Bar */}
        <div className="p-4 sm:p-6 border-t border-white/[0.12] bg-white/[0.04] backdrop-blur-[30px]">
          <div className="max-w-3xl mx-auto flex items-center gap-3">
            <Input
              placeholder={activeChatId ? "Ask AI anything..." : "Create or select a chat first..."}
              disabled={!activeChatId || isLoading}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              className="flex-1 input-premium h-11 text-xs placeholder-neutral-700 font-sans"
            />
            <Button
              disabled={!activeChatId || isLoading || !inputValue.trim()}
              onClick={handleSendMessage}
              className="btn-premium-primary h-11 px-5 font-bold cursor-pointer disabled:opacity-40"
              style={{ fontFamily: "var(--font-space-grotesk)" }}
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
