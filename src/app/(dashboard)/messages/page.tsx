"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  MessageSquare,
  Search,
  Send,
  Paperclip,
  ExternalLink,
  Film,
  FileText,
  User as UserIcon,
  X,
  Loader2,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { useSession } from "next-auth/react";

interface UserProfile {
  _id: string;
  name: string;
  image?: string;
  email: string;
}

interface MessageNode {
  _id: string;
  senderId: string;
  receiverId: string;
  content: string;
  mediaUrl?: string;
  mediaType?: "image" | "video" | "file" | "";
  isRead: boolean;
  createdAt: string;
}

interface ConversationNode {
  otherUser: UserProfile;
  lastMessage: MessageNode;
  unreadCount: number;
}

export default function MessagesPage() {
  const { data: session } = useSession();
  const currentUserId = session?.user?.id || "";
  const searchParams = useSearchParams();
  const router = useRouter();

  const [conversations, setConversations] = useState<ConversationNode[]>([]);
  const [activeUser, setActiveUser] = useState<UserProfile | null>(null);
  const [messages, setMessages] = useState<MessageNode[]>([]);
  
  // UI Inputs & Statuses
  const [inputText, setInputText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isConversationsLoading, setIsConversationsLoading] = useState(true);
  const [isMessagesLoading, setIsMessagesLoading] = useState(false);

  // Media Attachment Upload
  const [attachmentUrl, setAttachmentUrl] = useState("");
  const [attachmentType, setAttachmentType] = useState<"image" | "video" | "file" | "">("");
  const [attachmentName, setAttachmentName] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const [isRecipientTyping, setIsRecipientTyping] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const lastMessageIdRef = useRef<string>("");
  const lastMessagesLengthRef = useRef<number>(0);
  const activeUserIdRef = useRef<string>("");

  // 1. Fetch Conversations list
  const fetchConversations = useCallback(async () => {
    try {
      const res = await fetch("/api/messages/conversations");
      if (res.ok) {
        const data = await res.json();
        setConversations(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsConversationsLoading(false);
    }
  }, []);

  // 2. Fetch Messages between current user and active user
  const fetchMessages = useCallback(async (targetUserId: string, silent = false) => {
    if (!silent) setIsMessagesLoading(true);
    try {
      const res = await fetch(`/api/messages?userId=${targetUserId}`);
      if (res.ok) {
        const data = await res.json();
        if (data && typeof data === "object" && "messages" in data) {
          setMessages(data.messages);
          setIsRecipientTyping(data.isTyping || false);
        } else {
          setMessages(data);
          setIsRecipientTyping(false);
        }
        // Refresh conversations list to update unread counts
        fetchConversations();
      }
    } catch (e) {
      console.error(e);
    } finally {
      if (!silent) setIsMessagesLoading(false);
    }
  }, [fetchConversations]);

  // Load from search parameters (e.g. redirected from profile "Message" button)
  useEffect(() => {
    const userIdParam = searchParams.get("userId");
    if (userIdParam) {
      const loadUserFromParam = async () => {
        try {
          const res = await fetch(`/api/user?userId=${userIdParam}`);
          if (res.ok) {
            const users = await res.json();
            if (users && users.length > 0) {
              setActiveUser(users[0]);
            }
          }
        } catch (e) {
          console.error(e);
        }
      };
      loadUserFromParam();
    }
  }, [searchParams]);

  // Load chats once session is resolved
  useEffect(() => {
    if (currentUserId) {
      fetchConversations();
    }
  }, [currentUserId, fetchConversations]);

  // Load active messages
  useEffect(() => {
    if (activeUser) {
      fetchMessages(activeUser._id);
    } else {
      setMessages([]);
    }
  }, [activeUser, fetchMessages]);

  // Scroll to bottom of message thread (smart snap-down scroll)
  useEffect(() => {
    if (!scrollContainerRef.current) return;

    const activeUserChanged = activeUser?._id !== activeUserIdRef.current;
    if (activeUserChanged) {
      activeUserIdRef.current = activeUser?._id || "";
      lastMessageIdRef.current = "";
      lastMessagesLengthRef.current = 0;
    }

    const lastMsg = messages[messages.length - 1];
    const lastMsgId = lastMsg?._id || "";
    const messagesLength = messages.length;

    const isInitialLoad = lastMessagesLengthRef.current === 0;
    const hasNewMessage = lastMsgId !== lastMessageIdRef.current || messagesLength !== lastMessagesLengthRef.current;

    if (isInitialLoad || activeUserChanged) {
      lastMessageIdRef.current = lastMsgId;
      lastMessagesLengthRef.current = messagesLength;
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    } else if (hasNewMessage) {
      lastMessageIdRef.current = lastMsgId;
      lastMessagesLengthRef.current = messagesLength;

      // Only scroll down if the user was already near the bottom
      const threshold = 150; // px
      const isNearBottom = scrollContainerRef.current.scrollHeight - scrollContainerRef.current.scrollTop - scrollContainerRef.current.clientHeight < threshold;
      if (isNearBottom) {
        scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
      }
    }
  }, [messages, activeUser]);

  // Polling for new messages and typing status every 1.5 seconds
  useEffect(() => {
    if (!activeUser) return;
    const interval = setInterval(() => {
      fetchMessages(activeUser._id, true);
    }, 1500);
    return () => clearInterval(interval);
  }, [activeUser, fetchMessages]);

  // Polling for active conversation list updates
  useEffect(() => {
    if (!currentUserId) return;
    const interval = setInterval(() => {
      fetchConversations();
    }, 3000);
    return () => clearInterval(interval);
  }, [currentUserId, fetchConversations]);

  const lastTypedRef = useRef<number>(0);
  const handleTypingNotification = useCallback(async () => {
    if (!activeUser) return;
    const now = Date.now();
    if (now - lastTypedRef.current > 2000) {
      lastTypedRef.current = now;
      try {
        await fetch("/api/messages/typing", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ recipientId: activeUser._id }),
        });
      } catch (err) {
        console.error(err);
      }
    }
  }, [activeUser]);

  // 3. Handle Searching for Users to chat with
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const delayDebounce = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/user?query=${encodeURIComponent(searchQuery)}`);
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsSearching(false);
      }
    }, 400);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  // 4. Handle Media Uploads
  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setAttachmentUrl(data.url);
        setAttachmentName(file.name);

        const lower = file.name.toLowerCase();
        if (lower.match(/\.(jpeg|jpg|gif|png|webp|svg)$/)) {
          setAttachmentType("image");
        } else if (lower.match(/\.(mp4|webm|mov|ogg)$/)) {
          setAttachmentType("video");
        } else {
          setAttachmentType("file");
        }
      } else {
        alert("Failed to upload file.");
      }
    } catch (err) {
      console.error(err);
      alert("Error uploading media file.");
    } finally {
      setIsUploading(false);
    }
  };

  // 5. Send message
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() && !attachmentUrl) return;
    if (!activeUser) return;

    const payload = {
      receiverId: activeUser._id,
      content: inputText.trim(),
      mediaUrl: attachmentUrl || undefined,
      mediaType: attachmentType || undefined,
    };

    // Optimistically add message
    const tempMsg: MessageNode = {
      _id: Math.random().toString(),
      senderId: currentUserId,
      receiverId: activeUser._id,
      content: inputText.trim(),
      mediaUrl: attachmentUrl || undefined,
      mediaType: attachmentType || undefined,
      isRead: false,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempMsg]);

    setInputText("");
    setAttachmentUrl("");
    setAttachmentType("");
    setAttachmentName("");

    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        // Refetch actual history from server
        const updatedMsg = await res.json();
        setMessages((prev) => prev.map((m) => (m._id === tempMsg._id ? updatedMsg : m)));
        fetchConversations();
      }
    } catch (e) {
      console.error("Failed to send:", e);
    }
  };

  return (
    <div className="flex-1 flex h-full bg-neutral-950 overflow-hidden relative">
      {/* 1. Conversations Column (Left Pane) */}
      <aside className={`w-full md:w-80 border-r border-white/[0.08] bg-white/[0.02] flex flex-col shrink-0 h-full overflow-hidden ${
        activeUser ? "hidden md:flex" : "flex"
      }`}>
        {/* Header */}
        <div className="h-16 px-6 border-b border-white/[0.08] flex items-center justify-between shrink-0 select-none">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-cyan-400" />
            <h1
              className="text-sm font-bold text-neutral-100 uppercase tracking-widest"
              style={{ fontFamily: "var(--font-space-grotesk)" }}
            >
              Direct Messages
            </h1>
          </div>
        </div>

        {/* User Search Bar */}
        <div className="p-4 border-b border-white/[0.06] relative">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-neutral-500" />
            <Input
              placeholder="Search users to message..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-neutral-950/60 border-neutral-850 pl-9 focus:border-cyan-400 text-neutral-100 placeholder-neutral-600 h-9 text-xs"
            />
          </div>

          {/* Search Dropdown Panel */}
          {searchQuery && (
            <div className="absolute left-4 right-4 mt-1 bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl z-50 max-h-60 overflow-y-auto custom-scroll p-1.5">
              {isSearching ? (
                <div className="flex items-center justify-center py-4 text-neutral-550 gap-2 text-xs">
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-cyan-400" />
                  Searching...
                </div>
              ) : searchResults.length === 0 ? (
                <div className="text-center py-4 text-neutral-600 text-xs italic">
                  No users found
                </div>
              ) : (
                searchResults.map((usr) => (
                  <button
                    key={usr._id}
                    onClick={() => {
                      setActiveUser(usr);
                      setSearchQuery("");
                      router.replace("/messages");
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/[0.05] transition-all text-left text-xs"
                  >
                    {usr.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={usr.image} alt={usr.name} className="h-7 w-7 rounded-full object-cover border border-neutral-800" />
                    ) : (
                      <div className="h-7 w-7 rounded-full bg-neutral-800 flex items-center justify-center text-neutral-450 border border-neutral-700">
                        <UserIcon className="h-3.5 w-3.5" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-neutral-200 truncate">{usr.name}</p>
                      <p className="text-[10px] text-neutral-500 truncate">{usr.email}</p>
                    </div>
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        {/* Conversations list */}
        <div className="flex-1 overflow-y-auto custom-scroll p-3 space-y-1">
          {isConversationsLoading ? (
            <div className="flex flex-col items-center justify-center h-40 text-neutral-600 gap-2 select-none">
              <Loader2 className="h-5 w-5 animate-spin text-cyan-400" />
              <span className="text-[10px] uppercase font-bold tracking-wider">Loading chats...</span>
            </div>
          ) : conversations.length === 0 ? (
            <div className="text-center py-12 text-neutral-600 text-xs select-none">
              No conversations active.<br />Search users to start chatting!
            </div>
          ) : (
            conversations.map((conv) => {
              const isSelected = activeUser?._id === conv.otherUser._id;
              const hasUnread = conv.unreadCount > 0;
              const lastMsgSnippet = conv.lastMessage.mediaUrl 
                ? `[Media] ${conv.lastMessage.content || "Attached file"}` 
                : conv.lastMessage.content;

              return (
                <button
                  key={conv.otherUser._id}
                  onClick={() => {
                    setActiveUser(conv.otherUser);
                    router.replace("/messages");
                  }}
                  className={`w-full flex items-center gap-3.5 p-3 rounded-xl border transition-all text-left group ${
                    isSelected
                      ? "bg-cyan-500/10 border-cyan-500/25 hover:bg-cyan-500/12 shadow-[0_0_15px_rgba(6,182,212,0.04)]"
                      : "bg-transparent border-transparent hover:bg-white/[0.04] hover:border-white/5"
                  }`}
                >
                  {/* User Avatar */}
                  <div className="relative shrink-0 select-none">
                    {conv.otherUser.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={conv.otherUser.image}
                        alt={conv.otherUser.name}
                        className="h-10 w-10 rounded-full object-cover border border-neutral-800"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-neutral-850 flex items-center justify-center text-neutral-500 border border-neutral-750 font-bold uppercase text-xs">
                        {conv.otherUser.name.substring(0, 2)}
                      </div>
                    )}
                    {/* Active/Unread glow indicator */}
                    {hasUnread && (
                      <span className="absolute -top-0.5 -right-0.5 h-3 w-3 bg-cyan-400 border-2 border-neutral-950 rounded-full shadow-[0_0_10px_rgba(34,211,238,0.8)] animate-pulse" />
                    )}
                  </div>

                  {/* Message Metadata */}
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <div className="flex justify-between items-baseline select-none">
                      <span
                        className="text-xs font-bold text-neutral-200 truncate group-hover:text-neutral-100"
                        style={{ fontFamily: "var(--font-space-grotesk)" }}
                      >
                        {conv.otherUser.name}
                      </span>
                      <span className="text-[9px] text-neutral-600 font-mono shrink-0">
                        {new Date(conv.lastMessage.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <p
                        className={`text-[11px] truncate flex-1 ${
                          hasUnread ? "text-cyan-300 font-semibold" : "text-neutral-500"
                        }`}
                      >
                        {lastMsgSnippet}
                      </p>
                      {conv.unreadCount > 0 && (
                        <span className="bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[8px] font-bold px-1.5 py-0.5 rounded-full select-none font-mono">
                          {conv.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </aside>

      {/* 2. Message Thread (Right Pane) */}
      <main className={`flex-1 flex flex-col h-full bg-transparent overflow-hidden ${
        activeUser ? "flex" : "hidden md:flex"
      }`}>
        {activeUser ? (
          <div className="flex-1 flex flex-col h-full overflow-hidden">
            {/* Header controls */}
            <div className="h-16 px-6 border-b border-white/[0.08] bg-white/[0.02] backdrop-blur-md flex items-center justify-between shrink-0 select-none">
              <div className="flex items-center gap-3 min-w-0">
                {/* Mobile Back Button */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setActiveUser(null);
                    router.replace("/messages");
                  }}
                  className="md:hidden h-8 w-8 text-neutral-450 hover:text-neutral-250 hover:bg-white/[0.08]"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>

                {activeUser.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={activeUser.image}
                    alt={activeUser.name}
                    className="h-9 w-9 rounded-full object-cover border border-neutral-800"
                  />
                ) : (
                  <div className="h-9 w-9 rounded-full bg-neutral-800 flex items-center justify-center text-neutral-500 border border-neutral-700 font-bold uppercase text-xs">
                    {activeUser.name.substring(0, 2)}
                  </div>
                )}
                <div className="min-w-0">
                  <h2
                    className="text-xs font-bold text-neutral-100 truncate"
                    style={{ fontFamily: "var(--font-space-grotesk)" }}
                  >
                    {activeUser.name}
                  </h2>
                  <p className="text-[10px] text-neutral-500 truncate font-mono">{activeUser.email}</p>
                </div>
              </div>

              <div>
                <Link href={`/user/${activeUser._id}`}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 text-[11px] gap-1.5 text-neutral-400 hover:text-cyan-400 hover:bg-cyan-500/10 border border-neutral-850 hover:border-cyan-500/20 transition-all font-bold"
                    style={{ fontFamily: "var(--font-space-grotesk)" }}
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    View Profile
                  </Button>
                </Link>
              </div>
            </div>

            {/* Scrollable messages container */}
            <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-6 space-y-4 custom-scroll bg-neutral-950/20 flex flex-col">
              {isMessagesLoading ? (
                <div className="flex items-center justify-center py-10 text-neutral-550 gap-2 text-xs">
                  <Loader2 className="h-4 w-4 animate-spin text-cyan-400" />
                  Loading message history...
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center py-12 text-neutral-600 text-xs italic select-none">
                  No messages yet. Send a message to break the ice!
                </div>
              ) : (
                messages.map((msg) => {
                  const isSentByMe = msg.senderId === currentUserId;
                  const messageTime = new Date(msg.createdAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  });

                  return (
                    <div
                      key={msg._id}
                      className={`flex flex-col max-w-[70%] ${isSentByMe ? "self-end items-end" : "self-start items-start"}`}
                    >
                      {/* Message Bubble */}
                      <div
                        className={`rounded-2xl px-4 py-2.5 border text-xs leading-relaxed shadow-sm transition-all break-words w-full ${
                          isSentByMe
                            ? "bg-cyan-500/15 border-cyan-500/20 text-neutral-100 rounded-tr-none"
                            : "bg-neutral-900 border-neutral-800 text-neutral-300 rounded-tl-none"
                        }`}
                      >
                        {/* Media display */}
                        {msg.mediaUrl && (
                          <div className={`mb-2 flex items-center max-w-full select-none ${isSentByMe ? "justify-end" : "justify-start"}`}>
                            {msg.mediaType === "image" ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={msg.mediaUrl}
                                alt="Attachment"
                                className="max-h-60 w-auto object-contain cursor-pointer hover:opacity-90 transition-opacity rounded-lg border border-neutral-800/80 bg-neutral-950/40"
                                onClick={() => window.open(msg.mediaUrl, "_blank")}
                              />
                            ) : msg.mediaType === "video" ? (
                              <video src={msg.mediaUrl} controls className="max-h-60 w-auto object-contain rounded-lg border border-neutral-800/80 bg-neutral-950/40" />
                            ) : (
                              <div className="p-3 flex items-center gap-2.5 bg-neutral-900 hover:bg-neutral-850 cursor-pointer transition-colors" onClick={() => window.open(msg.mediaUrl, "_blank")}>
                                <FileText className="h-5 w-5 text-cyan-400 shrink-0" />
                                <span className="text-[10px] text-neutral-300 truncate max-w-[200px] font-mono">Download File</span>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Text Content */}
                        {msg.content && <p>{msg.content}</p>}
                      </div>

                      {/* Message Meta Info */}
                      <span className="text-[9px] text-neutral-600 font-mono mt-1 select-none">
                        {messageTime}
                      </span>
                    </div>
                  );
                })
              )}
              {isRecipientTyping && (
                <div className="flex items-center gap-2 text-neutral-450 text-[10px] pl-4 select-none italic font-mono animate-pulse">
                  <div className="flex gap-1 shrink-0">
                    <span className="h-1 w-1 bg-neutral-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                    <span className="h-1 w-1 bg-neutral-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                    <span className="h-1 w-1 bg-neutral-500 rounded-full animate-bounce" />
                  </div>
                  <span>{activeUser?.name} is typing...</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Bottom Text/Media Inputs Panel */}
            <div className="p-4 border-t border-white/[0.08] bg-white/[0.01] shrink-0">
              <form onSubmit={handleSendMessage} className="space-y-3">
                {/* Media Attachment Previews */}
                {attachmentUrl && (
                  <div className="inline-flex items-center gap-3 p-2 bg-neutral-900 border border-neutral-800 rounded-xl relative select-none animate-[slideIn_0.2s_ease-out]">
                    <div className="shrink-0 h-10 w-10 bg-neutral-950 rounded-lg flex items-center justify-center border border-neutral-800 overflow-hidden">
                      {attachmentType === "image" ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={attachmentUrl} alt="Preview" className="object-cover h-full w-full" />
                      ) : attachmentType === "video" ? (
                        <Film className="h-5 w-5 text-cyan-400" />
                      ) : (
                        <FileText className="h-5 w-5 text-cyan-400" />
                      )}
                    </div>
                    <div className="min-w-0 max-w-[200px] text-[10px] text-neutral-450 mr-6">
                      <p className="truncate font-semibold text-neutral-200">{attachmentName}</p>
                      <p className="text-[8px] uppercase tracking-wider text-cyan-500 font-bold font-mono mt-0.5">{attachmentType}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setAttachmentUrl("");
                        setAttachmentType("");
                        setAttachmentName("");
                      }}
                      className="absolute top-1.5 right-1.5 p-0.5 rounded-full bg-neutral-950 border border-neutral-800 text-neutral-500 hover:text-red-400 transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                )}

                {/* Input Fields Row */}
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    onChange={handleMediaUpload}
                    ref={fileInputRef}
                    className="hidden"
                    disabled={isUploading}
                  />

                  {/* Attachment Icon Trigger */}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="h-10 w-10 shrink-0 text-neutral-450 hover:text-cyan-400 hover:bg-cyan-500/10 border border-neutral-850 hover:border-cyan-500/20 transition-all rounded-xl"
                  >
                    {isUploading ? (
                      <Loader2 className="h-4 w-4 animate-spin text-cyan-400" />
                    ) : (
                      <Paperclip className="h-4 w-4" />
                    )}
                  </Button>

                  {/* Text Input Box */}
                  <Input
                    placeholder="Type a message..."
                    value={inputText}
                    onChange={(e) => {
                      setInputText(e.target.value);
                      handleTypingNotification();
                    }}
                    className="bg-neutral-955/60 border-neutral-850 focus:border-cyan-400 text-neutral-100 placeholder-neutral-600 h-10 text-xs flex-1 rounded-xl"
                  />

                  {/* Send Button */}
                  <Button
                    type="submit"
                    size="icon"
                    className="h-10 w-10 shrink-0 bg-cyan-500 hover:bg-cyan-400 text-neutral-950 transition-all rounded-xl shadow-[0_0_12px_rgba(6,182,212,0.25)] hover:shadow-[0_0_15px_rgba(6,182,212,0.4)]"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </form>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center bg-neutral-950/20 text-center px-8 relative select-none">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-cyan-500/5 rounded-full blur-[110px] pointer-events-none" />

            <div className="relative z-10 space-y-5 max-w-sm">
              <div className="h-14 w-14 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-center mx-auto shadow-inner">
                <MessageSquare className="h-6 w-6 text-neutral-500" />
              </div>
              <div className="space-y-1">
                <h3
                  className="text-sm font-bold text-neutral-300 tracking-tight"
                  style={{ fontFamily: "var(--font-space-grotesk)" }}
                >
                  No conversation active
                </h3>
                <p className="text-neutral-600 text-xs leading-relaxed">
                  Select a user from your messages sidebar on the left, or use the search bar to find someone new and start chatting.
                </p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
