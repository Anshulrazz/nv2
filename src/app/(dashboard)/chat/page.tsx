"use client";

export const dynamic = "force-dynamic";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { useWorkspaceStore } from "@/stores/workspaceStore";
import { Sparkles, MessageSquare, Send, Plus, Trash2, Loader2, FileText, CheckCircle2, Edit3, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface ChatMessage {
  _id?: string;
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

  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [editingChatTitle, setEditingChatTitle] = useState("");
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingMessageText, setEditingMessageText] = useState("");

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
        toast.success("New conversation started.");
      }
    } catch (e) {
      console.error(e);
      toast.error("Failed to start new chat.");
    }
  };

  const handleRenameChat = async (id: string, newTitle: string) => {
    if (!newTitle.trim()) return;
    try {
      const res = await fetch(`/api/chats/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTitle }),
      });
      if (res.ok) {
        setChats((prev) =>
          prev.map((c) => (c._id === id ? { ...c, title: newTitle } : c))
        );
        toast.info("Conversation title updated.");
      } else {
        toast.error("Failed to update chat title.");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred while renaming chat.");
    } finally {
      setEditingChatId(null);
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
        toast.success("Conversation deleted successfully.");
      }
    } catch (e) {
      console.error(e);
      toast.error("Failed to delete conversation.");
    }
  };

  const handleUpdateMessage = async (messageId: string, newContent: string) => {
    if (!activeChatId || !newContent.trim()) return;
    try {
      const res = await fetch(`/api/chats/${activeChatId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "edit-message",
          messageId,
          content: newContent,
        }),
      });
      if (res.ok) {
        setMessages((prev) =>
          prev.map((m) => (m._id === messageId ? { ...m, content: newContent } : m))
        );
        setChats((prev) =>
          prev.map((c) =>
            c._id === activeChatId
              ? {
                  ...c,
                  messages: c.messages.map((m) =>
                    m._id === messageId ? { ...m, content: newContent } : m
                  ),
                }
              : c
          )
        );
        toast.success("Message edited successfully.");
      } else {
        toast.error("Failed to edit message.");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred while editing message.");
    } finally {
      setEditingMessageId(null);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!activeChatId || !confirm("Delete this message?")) return;
    try {
      const res = await fetch(`/api/chats/${activeChatId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "delete-message",
          messageId,
        }),
      });
      if (res.ok) {
        setMessages((prev) => prev.filter((m) => m._id !== messageId));
        setChats((prev) =>
          prev.map((c) =>
            c._id === activeChatId
              ? { ...c, messages: c.messages.filter((m) => m._id !== messageId) }
              : c
          )
        );
        toast.warning("Message deleted.");
      } else {
        toast.error("Failed to delete message.");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred while deleting message.");
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

      const newAssistantMsg: ChatMessage = {
        role: "assistant",
        content: replyAccumulator,
        createdAt: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, newAssistantMsg]);
      setStreamedText("");
      setUseNoteContext(false);

      await fetchChats();
    } catch (err) {
      console.error(err);
      alert("Error talking to Claude.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 flex h-full bg-[#030305] text-zinc-100 overflow-hidden relative antialiased selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Ambient background glows */}
      <div className="absolute top-0 right-1/4 w-[500px] h-[350px] bg-cyan-500/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-[400px] h-[300px] bg-violet-500/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Mobile chat-sidebar checkbox toggle */}
      <input type="checkbox" id="chat-sidebar-toggle" className="peer hidden" />

      {/* Mobile backdrop */}
      <label
        htmlFor="chat-sidebar-toggle"
        className="fixed inset-0 bg-black/60 z-40 md:hidden opacity-0 pointer-events-none peer-checked:opacity-100 peer-checked:pointer-events-auto transition-opacity duration-300"
        aria-hidden="true"
      />

      {/* Side Conversations History */}
      <div className="fixed md:static inset-y-0 left-0 z-50 w-64 shrink-0 border-r border-white/5 bg-zinc-950/90 md:bg-zinc-950/40 backdrop-blur-2xl flex flex-col justify-between select-none -translate-x-full peer-checked:translate-x-0 md:translate-x-0 transition-transform duration-300 ease-in-out">
        <div className="p-4 flex flex-col space-y-4 h-full">
          <div className="flex items-center gap-2">
            <Button
              onClick={handleStartNewChat}
              className="group flex-1 rounded-full bg-white hover:bg-zinc-100 text-zinc-950 font-bold text-xs h-10 flex items-center justify-center gap-2 transition-all duration-300 active:scale-[0.97] shadow-[0_0_20px_rgba(255,255,255,0.15)]"
            >
              <Plus className="size-4 text-zinc-950" />
              <span>New Chat</span>
            </Button>
            <label
              htmlFor="chat-sidebar-toggle"
              className="md:hidden p-2 rounded-full border border-white/10 bg-zinc-900 text-zinc-400 hover:text-white cursor-pointer"
              aria-label="Close chat history"
            >
              <X className="size-4" />
            </label>
          </div>

          <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 custom-scroll">
            <div className="text-[9px] font-mono font-bold text-zinc-500 uppercase tracking-widest mb-2 px-2">
              History
            </div>
            {chats.map((c) => {
              const isActive = activeChatId === c._id;
              const isEditing = editingChatId === c._id;
              return (
                <div
                  key={c._id}
                  onClick={() => {
                    if (!isEditing) setActiveChatId(c._id);
                  }}
                  className={`group flex items-center justify-between py-2 px-3 rounded-xl cursor-pointer transition-all duration-200 ${
                    isActive
                      ? "bg-white/10 border border-white/10 text-white font-semibold"
                      : "text-zinc-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <MessageSquare className={`size-3.5 shrink-0 ${isActive ? "text-cyan-400" : "text-zinc-500"}`} />
                    {isEditing ? (
                      <Input
                        value={editingChatTitle}
                        onChange={(e) => setEditingChatTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleRenameChat(c._id, editingChatTitle);
                          else if (e.key === "Escape") setEditingChatId(null);
                        }}
                        className="h-6 text-xs bg-zinc-950 border-white/10 py-0.5 px-2 text-white focus:ring-1 focus:ring-cyan-500"
                        autoFocus
                        onClick={(e) => e.stopPropagation()}
                      />
                    ) : (
                      <span className="text-xs truncate">{c.title}</span>
                    )}
                  </div>
                  {!isEditing && (
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingChatId(c._id);
                          setEditingChatTitle(c.title);
                        }}
                        className="p-1 rounded-md hover:bg-zinc-800 text-zinc-400 hover:text-cyan-400 transition-colors"
                        title="Rename Chat"
                      >
                        <Edit3 className="size-3" />
                      </button>
                      <button
                        onClick={(e) => handleDeleteChat(c._id, e)}
                        className="p-1 rounded-md hover:bg-zinc-800 text-zinc-400 hover:text-rose-400 transition-colors"
                        title="Delete Chat"
                      >
                        <Trash2 className="size-3" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
            {chats.length === 0 && (
              <div className="text-center py-8 text-xs text-zinc-500 italic">No chat sessions</div>
            )}
          </div>
        </div>
      </div>

      {/* Main chat window */}
      <div className="flex-1 flex flex-col h-full bg-[#030305] overflow-hidden z-10 relative">
        {/* Chat header */}
        <div className="h-16 border-b border-white/5 px-4 sm:px-8 flex items-center justify-between shrink-0 bg-zinc-950/60 backdrop-blur-2xl">
          <div className="flex items-center gap-3">
            <label
              htmlFor="chat-sidebar-toggle"
              className="md:hidden mr-1 p-2 rounded-full bg-zinc-900 border border-white/10 text-zinc-300 cursor-pointer"
              aria-label="Open chat history"
            >
              <MessageSquare className="size-4 text-cyan-400" />
            </label>
            <div className="size-8 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
              <Sparkles className="size-4" />
            </div>
            <h1 className="font-extrabold text-white text-sm tracking-tight">
              {chats.find((c) => c._id === activeChatId)?.title || "AI Claude Assistant"}
            </h1>
          </div>
        </div>

        {/* Messages Feed */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6 custom-scroll">
          {messages.length === 0 && !streamedText && (
            <div className="h-full flex flex-col items-center justify-center text-center relative select-none">
              <div className="rounded-[2.5rem] bg-zinc-900/40 border border-white/10 p-2.5 backdrop-blur-3xl max-w-md w-full shadow-[0_0_80px_rgba(0,0,0,0.8)]">
                <div className="rounded-[calc(2.5rem-0.75rem)] bg-[#07070a] border border-white/5 p-8 flex flex-col items-center gap-6">
                  <div className="size-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                    <MessageSquare className="size-8" />
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-xl font-extrabold text-white tracking-tight">
                      Ask Claude anything
                    </h2>
                    <p className="text-zinc-400 text-xs font-light leading-relaxed">
                      Brainstorm lecture summaries, analyze note structures, or solve complex study doubts.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {messages.map((msg, index) => {
            const isMsgEditing = editingMessageId === msg._id;
            return (
              <div
                key={index}
                className={`group relative flex gap-4 max-w-3xl ${msg.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"}`}
              >
                <div
                  className={`size-8 rounded-xl flex items-center justify-center shrink-0 border select-none font-bold text-xs ${
                    msg.role === "user"
                      ? "bg-zinc-800 border-white/10 text-white"
                      : "bg-violet-500/10 border-violet-500/20 text-violet-400"
                  }`}
                >
                  {msg.role === "user" ? "U" : "C"}
                </div>

                {isMsgEditing ? (
                  <div className="p-4 rounded-2xl border bg-zinc-900/80 border-white/10 text-xs w-full max-w-xl space-y-3">
                    <textarea
                      value={editingMessageText}
                      onChange={(e) => setEditingMessageText(e.target.value)}
                      className="w-full min-h-[80px] p-3 bg-zinc-950 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-400 font-sans resize-none leading-relaxed"
                    />
                    <div className="flex items-center gap-2">
                      <Button
                        onClick={() => handleUpdateMessage(msg._id!, editingMessageText)}
                        className="bg-white hover:bg-zinc-100 text-zinc-950 font-bold text-[10px] h-7 px-3 rounded-full flex items-center gap-1 cursor-pointer transition-all"
                      >
                        <Check className="size-3" /> Save Changes
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => setEditingMessageId(null)}
                        className="text-zinc-400 hover:text-white text-[10px] h-7 px-3 rounded-full border border-white/10 hover:bg-zinc-800 transition-all"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div
                    className={`p-4 rounded-2xl border text-xs leading-relaxed whitespace-pre-wrap relative pr-10 ${
                      msg.role === "user"
                        ? "bg-cyan-500/10 border-cyan-500/20 text-zinc-100"
                        : "bg-zinc-900/30 backdrop-blur-xl border-white/10 text-zinc-300"
                    }`}
                  >
                    {msg.content}
                    
                    {msg._id && (
                      <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 bg-zinc-900 border border-white/10 rounded-lg p-1 shadow-md shrink-0">
                        <button
                          onClick={() => {
                            setEditingMessageId(msg._id!);
                            setEditingMessageText(msg.content);
                          }}
                          className="p-1 text-zinc-400 hover:text-cyan-400 rounded-md hover:bg-zinc-800 transition-colors"
                          title="Edit Message"
                        >
                          <Edit3 className="size-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteMessage(msg._id!)}
                          className="p-1 text-zinc-400 hover:text-rose-400 rounded-md hover:bg-zinc-800 transition-colors"
                          title="Delete Message"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {/* Real-time Streaming message */}
          {streamedText && (
            <div className="flex gap-4 max-w-3xl mr-auto">
              <div className="size-8 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center shrink-0 text-violet-400 select-none font-bold text-xs">
                C
              </div>
              <div className="p-4 rounded-2xl border bg-zinc-900/30 backdrop-blur-xl border-white/10 text-zinc-300 text-xs leading-relaxed whitespace-pre-wrap">
                {streamedText}
                <span className="inline-block size-1.5 bg-cyan-400 animate-pulse ml-1 align-middle rounded-full" />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Note context attachment banner */}
        {activeNote && (
          <div className="px-6 py-2.5 border-t border-white/5 bg-zinc-950/60 flex items-center justify-between select-none backdrop-blur-xl">
            <div className="flex items-center gap-2 text-xs text-zinc-400">
              <FileText className="size-4 text-cyan-400" />
              <span>Attach note context: <strong className="text-white">{activeNote.title}</strong></span>
            </div>
            <button
              onClick={() => setUseNoteContext(!useNoteContext)}
              className={`flex items-center gap-1.5 text-[10px] font-mono font-bold px-3 py-1 rounded-full transition-all border ${
                useNoteContext
                  ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/30"
                  : "bg-zinc-900 text-zinc-400 border-white/10 hover:border-white/20"
              }`}
            >
              {useNoteContext && <CheckCircle2 className="size-3 text-cyan-400" />}
              <span>{useNoteContext ? "Attached" : "Attach Context"}</span>
            </button>
          </div>
        )}

        {/* Input Form Bar */}
        <div className="p-4 sm:p-6 border-t border-white/5 bg-zinc-950/60 backdrop-blur-2xl">
          <div className="max-w-3xl mx-auto flex items-center gap-3">
            <Input
              type="text"
              name="ai_chat_message"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="sentences"
              spellCheck={false}
              data-lpignore="true"
              data-1p-ignore="true"
              data-bwignore="true"
              data-form-type="other"
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
              className="flex-1 bg-zinc-950 border-white/10 focus:border-cyan-400 text-white placeholder-zinc-600 h-11 text-xs rounded-xl"
            />
            <Button
              disabled={!activeChatId || isLoading || !inputValue.trim()}
              onClick={handleSendMessage}
              className="group rounded-full bg-white hover:bg-zinc-100 text-zinc-950 font-bold text-xs h-11 px-5 flex items-center gap-2 transition-all duration-300 active:scale-[0.97] shadow-[0_0_20px_rgba(255,255,255,0.15)] disabled:opacity-40"
            >
              {isLoading ? <Loader2 className="size-4 animate-spin text-zinc-950" /> : <Send className="size-4 text-zinc-950 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
