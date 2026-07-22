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
  ChevronLeft,
  ChevronRight,
  Download,
  Check,
  CheckCheck,
  CornerUpLeft,
  Edit3,
  Trash2,
  Phone,
  Video,
  Palette,
  Image as ImageIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCallStore } from "@/stores/callStore";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { useSession } from "next-auth/react";
import Pusher from "pusher-js";
import { motion } from "framer-motion";

interface UserProfile {
  _id: string;
  name: string;
  image?: string;
  email: string;
}

export interface Attachment {
  url: string;
  type: "image" | "video" | "file" | "";
  name?: string;
}

interface MessageNode {
  _id: string;
  senderId: string;
  receiverId: string;
  content: string;
  attachments?: Attachment[];
  isRead: boolean;
  isDeleted?: boolean;
  isEdited?: boolean;
  createdAt: string;
}

interface ConversationNode {
  otherUser: UserProfile;
  lastMessage: MessageNode;
  unreadCount: number;
}

interface WallpaperProfile {
  directMessageWallpaper: string;
  directMessageWallpapers: Record<string, string>;
}

export default function MessagesPage() {
  const { data: session } = useSession();
  const currentUserId = session?.user?.id || "";
  const searchParams = useSearchParams();
  const router = useRouter();

  const { initiateCall } = useCallStore();
  const [currentUserProfile, setCurrentUserProfile] = useState<WallpaperProfile | null>(null);
  const [isWallpaperPickerOpen, setIsWallpaperPickerOpen] = useState(false);
  const [isUploadingWallpaper, setIsUploadingWallpaper] = useState(false);

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
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const [isRecipientTyping, setIsRecipientTyping] = useState(false);

  // Media Gallery Viewer state
  const [mediaGalleryIndex, setMediaGalleryIndex] = useState<number>(-1);

  const getThreadMedia = useCallback(() => {
    const list: { url: string; type: "image" | "video"; name?: string; messageId: string }[] = [];
    messages.forEach((msg) => {
      if (msg.attachments) {
        msg.attachments.forEach((att) => {
          if (att.type === "image" || att.type === "video") {
            list.push({
              url: att.url,
              type: att.type,
              name: att.name,
              messageId: msg._id,
            });
          }
        });
      }
    });
    return list;
  }, [messages]);

  const handleOpenMediaViewer = (url: string) => {
    const gallery = getThreadMedia();
    const idx = gallery.findIndex((m) => m.url === url);
    if (idx !== -1) {
      setMediaGalleryIndex(idx);
    }
  };

  const [replyingMessage, setReplyingMessage] = useState<MessageNode | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingMessageText, setEditingMessageText] = useState("");
  const [contextMenu, setContextMenu] = useState<{
    visible: boolean;
    x: number;
    y: number;
    message: MessageNode;
  } | null>(null);

  const touchTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleContextMenu = (e: React.MouseEvent, msg: MessageNode) => {
    e.preventDefault();
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      message: msg,
    });
  };

  const handleTouchStart = (e: React.TouchEvent, msg: MessageNode) => {
    if (touchTimerRef.current) clearTimeout(touchTimerRef.current);
    
    const touch = e.touches[0];
    const x = touch.clientX;
    const y = touch.clientY;
    
    touchTimerRef.current = setTimeout(() => {
      setContextMenu({
        visible: true,
        x,
        y: y - 50,
        message: msg,
      });
      if (typeof window !== "undefined" && window.navigator?.vibrate) {
        window.navigator.vibrate(20);
      }
    }, 600);
  };

  const handleTouchEnd = () => {
    if (touchTimerRef.current) {
      clearTimeout(touchTimerRef.current);
      touchTimerRef.current = null;
    }
  };

  useEffect(() => {
    const handleCloseMenu = () => setContextMenu(null);
    window.addEventListener("click", handleCloseMenu);
    return () => window.removeEventListener("click", handleCloseMenu);
  }, []);

  const handleUpdateDM = async (messageId: string, newContent: string) => {
    if (!newContent.trim()) return;
    try {
      const res = await fetch(`/api/messages/${messageId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newContent }),
      });
      if (res.ok) {
        const updated = await res.json();
        setMessages((prev) => prev.map((m) => (m._id === messageId ? updated : m)));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setEditingMessageId(null);
    }
  };

  const handleDeleteDM = async (messageId: string) => {
    if (!confirm("Permanently delete this message?")) return;
    try {
      const res = await fetch(`/api/messages/${messageId}`, { method: "DELETE" });
      if (res.ok) {
        setMessages((prev) => prev.filter((m) => m._id !== messageId));
      }
    } catch (err) {
      console.error(err);
    }
  };

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

  const fetchCurrentUserProfile = useCallback(async () => {
    try {
      const res = await fetch("/api/user/wallpaper");
      if (res.ok) {
        const data = await res.json();
        setCurrentUserProfile(data);
      }
    } catch (err) {
      console.error(err);
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


  // Pusher Real-Time Integration
  useEffect(() => {
    if (!currentUserId) return;

    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY || "YOUR_KEY", {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || "YOUR_CLUSTER",
    });

    const channel = pusher.subscribe(`user-${currentUserId}`);

    channel.bind("new-message", (newMsg: MessageNode) => {
      fetchConversations();
      if (activeUserIdRef.current && (newMsg.senderId === activeUserIdRef.current || newMsg.receiverId === activeUserIdRef.current)) {
         setMessages(prev => {
           if (prev.some(m => m._id === newMsg._id)) return prev;

           // If we are the sender, check if we have a temporary optimistic message to replace
           if (newMsg.senderId === currentUserId) {
             const tempIndex = prev.findIndex(
               m => !/^[0-9a-fA-F]{24}$/.test(m._id) &&
                    m.senderId === currentUserId &&
                    m.content === newMsg.content
             );
             if (tempIndex !== -1) {
               const updated = [...prev];
               updated[tempIndex] = newMsg;
               return updated;
             }
           }

           return [...prev, newMsg];
         });
      }
    });

    channel.bind("message-updated", (updatedMsg: MessageNode) => {
      fetchConversations();
      if (activeUserIdRef.current && (updatedMsg.senderId === activeUserIdRef.current || updatedMsg.receiverId === activeUserIdRef.current)) {
        setMessages((prev) =>
          prev.map((m) => (m._id === updatedMsg._id ? updatedMsg : m))
        );
      }
    });

    channel.bind("message-deleted", (data: { messageId: string }) => {
      fetchConversations();
      setMessages((prev) => prev.filter((m) => m._id !== data.messageId));
    });

    channel.bind("messages-read", (data: { readerId: string }) => {
      if (activeUserIdRef.current === data.readerId) {
        setMessages((prev) => prev.map(m => ({ ...m, isRead: true })));
      }
    });

    return () => {
      pusher.unsubscribe(`user-${currentUserId}`);
      pusher.disconnect();
    };
  }, [currentUserId, fetchConversations]);

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
      fetchCurrentUserProfile();
    }
  }, [currentUserId, fetchConversations, fetchCurrentUserProfile]);

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
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setIsUploading(true);
    try {
      const uploadedAttachments: Attachment[] = [];
      for (const file of files) {
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (res.ok) {
          const data = await res.json();
          const lower = file.name.toLowerCase();
          let type: "image"|"video"|"file" = "file";
          if (lower.match(/\.(jpeg|jpg|gif|png|webp|svg)$/)) type = "image";
          else if (lower.match(/\.(mp4|webm|mov|ogg)$/)) type = "video";
          
          uploadedAttachments.push({ url: data.url, name: file.name, type });
        }
      }
      setAttachments(prev => [...prev, ...uploadedAttachments]);
    } catch (err) {
      console.error(err);
      alert("Error uploading media files.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // 5. Send message
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() && attachments.length === 0) return;
    if (!activeUser) return;

    interface MessagePayload {
      receiverId: string;
      content: string;
      attachments?: Attachment[];
      repliedTo?: {
        messageId: string;
        content: string;
        senderName: string;
      };
    }

    const payload: MessagePayload = {
      receiverId: activeUser._id,
      content: inputText.trim(),
      attachments: attachments.length > 0 ? attachments : undefined,
    };

    if (replyingMessage) {
      const isSentByMe = replyingMessage.senderId === currentUserId;
      const senderName = isSentByMe ? "You" : (activeUser.name || "Someone");
      payload.repliedTo = {
        messageId: replyingMessage._id,
        content: replyingMessage.content || (replyingMessage.attachments && replyingMessage.attachments.length > 0 ? "📷 Media Attachment" : ""),
        senderName,
      };
    }

    // Optimistically add message
    const tempMsg: MessageNode & { repliedTo?: MessagePayload["repliedTo"] } = {
      _id: Math.random().toString(),
      senderId: currentUserId,
      receiverId: activeUser._id,
      content: inputText.trim(),
      attachments: attachments.length > 0 ? [...attachments] : undefined,
      isRead: false,
      createdAt: new Date().toISOString(),
      repliedTo: payload.repliedTo || undefined,
    };
    setMessages((prev) => [...prev, tempMsg]);

    setInputText("");
    setAttachments([]);
    setReplyingMessage(null);

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

  const updateWallpaper = async (wallpaperValue: string, isChatSpecific = true) => {
    try {
      const payload: { wallpaper: string; otherUserId?: string } = { wallpaper: wallpaperValue };
      if (isChatSpecific && activeUser) {
        payload.otherUserId = activeUser._id;
      }
      const res = await fetch("/api/user/wallpaper", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const updated = await res.json();
        setCurrentUserProfile(updated);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleWallpaperUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingWallpaper(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      if (res.ok) {
        const data = await res.json();
        await updateWallpaper(data.url);
      } else {
        alert("Failed to upload custom wallpaper.");
      }
    } catch (err) {
      console.error(err);
      alert("Error uploading wallpaper.");
    } finally {
      setIsUploadingWallpaper(false);
    }
  };

  const activeWallpaper = activeUser
    ? (currentUserProfile?.directMessageWallpapers?.[activeUser._id] || currentUserProfile?.directMessageWallpaper || "")
    : "";

  let wallpaperStyle: React.CSSProperties = {};
  if (activeWallpaper) {
    if (activeWallpaper.startsWith("url(") || activeWallpaper.startsWith("/") || activeWallpaper.startsWith("http")) {
      const cleanUrl = activeWallpaper.startsWith("url(") ? activeWallpaper : `url(${activeWallpaper})`;
      wallpaperStyle = {
        backgroundImage: cleanUrl,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      };
    } else if (activeWallpaper.startsWith("linear-gradient")) {
      wallpaperStyle = {
        background: activeWallpaper,
      };
    } else {
      wallpaperStyle = {
        backgroundColor: activeWallpaper,
      };
    }
  }

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
              const lastMsgSnippet = (conv.lastMessage.attachments && conv.lastMessage.attachments.length > 0) 
                ? `[Media] ${conv.lastMessage.content || "Attachments"}` 
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

              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={async () => {
                    if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "default") {
                      Notification.requestPermission().catch(() => {});
                    }
                    if (typeof window !== "undefined" && !window.isSecureContext) {
                      alert("WebRTC calls require a secure origin (HTTPS or localhost). Please test calling via localhost or HTTPS.");
                      return;
                    }
                    try {
                      const stream = await navigator.mediaDevices.getUserMedia({
                        audio: true,
                        video: false,
                      });
                      stream.getTracks().forEach((track) => track.stop());

                      initiateCall({
                        id: activeUser._id,
                        name: activeUser.name,
                        image: activeUser.image
                      }, "voice");
                    } catch (err) {
                      console.error("Media permission denied:", err);
                      alert("Microphone permission is required to start a voice call.");
                    }
                  }}
                  className="h-8 w-8 text-neutral-400 hover:text-cyan-400 hover:bg-cyan-500/10 border border-neutral-850 hover:border-cyan-500/20 transition-all rounded-lg"
                  title="Voice Call"
                >
                  <Phone className="h-4 w-4" />
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={async () => {
                    if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "default") {
                      Notification.requestPermission().catch(() => {});
                    }
                    if (typeof window !== "undefined" && !window.isSecureContext) {
                      alert("WebRTC calls require a secure origin (HTTPS or localhost). Please test calling via localhost or HTTPS.");
                      return;
                    }
                    try {
                      const stream = await navigator.mediaDevices.getUserMedia({
                        audio: true,
                        video: true,
                      });
                      stream.getTracks().forEach((track) => track.stop());

                      initiateCall({
                        id: activeUser._id,
                        name: activeUser.name,
                        image: activeUser.image
                      }, "video");
                    } catch (err) {
                      console.error("Media permission denied:", err);
                      alert("Microphone and Camera permissions are required to start a video call.");
                    }
                  }}
                  className="h-8 w-8 text-neutral-400 hover:text-cyan-400 hover:bg-cyan-500/10 border border-neutral-850 hover:border-cyan-500/20 transition-all rounded-lg"
                  title="Video Call"
                >
                  <Video className="h-4 w-4" />
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsWallpaperPickerOpen(true)}
                  className="h-8 w-8 text-neutral-400 hover:text-cyan-400 hover:bg-cyan-500/10 border border-neutral-850 hover:border-cyan-500/20 transition-all rounded-lg"
                  title="Chat Theme"
                >
                  <Palette className="h-4 w-4" />
                </Button>

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
            <div
              ref={scrollContainerRef}
              style={wallpaperStyle}
              className="flex-1 overflow-y-auto p-6 space-y-4 custom-scroll bg-neutral-950/20 flex flex-col"
            >
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
                  // @ts-expect-error custom repliedTo field
                  const repliedToMsg = msg.repliedTo;
                  const isDMEditing = editingMessageId === msg._id;

                  return (
                    <div
                      key={msg._id}
                      className={`w-full flex ${isSentByMe ? "justify-end" : "justify-start"} relative overflow-visible group`}
                    >
                      {/* Swipe reply indicator behind the bubble */}
                      {!msg.isDeleted && (
                        <div className="absolute left-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-40 transition-opacity flex items-center justify-center h-8 w-8 text-cyan-400 pointer-events-none">
                          <CornerUpLeft className="h-4 w-4" />
                        </div>
                      )}

                      <motion.div
                        drag={msg.isDeleted ? false : "x"}
                        dragConstraints={{ left: 0, right: 0 }}
                        dragElastic={{ left: 0, right: 0.5 }}
                        onDragEnd={(event, info) => {
                          if (msg.isDeleted) return;
                          if (info.offset.x > 50) {
                            setReplyingMessage(msg);
                            if (typeof window !== "undefined" && window.navigator?.vibrate) {
                              window.navigator.vibrate(15);
                            }
                          }
                        }}
                        onContextMenu={(e) => { if (!msg.isDeleted) handleContextMenu(e, msg); }}
                        onTouchStart={(e) => { if (!msg.isDeleted) handleTouchStart(e, msg); }}
                        onTouchEnd={handleTouchEnd}
                        className={`flex flex-col max-w-[70%] relative ${isSentByMe ? "items-end" : "items-start"}`}
                      >
                        {/* Message Bubble */}
                        <div
                          className={`rounded-2xl px-4 py-2.5 border text-xs leading-relaxed shadow-sm transition-all break-words w-full ${
                            isSentByMe
                              ? "bg-cyan-500/15 border-cyan-500/20 text-neutral-100 rounded-tr-none"
                              : "bg-neutral-900 border-neutral-800 text-neutral-300 rounded-tl-none"
                          }`}
                        >
                          {/* Replied Message Preview Header */}
                          {repliedToMsg && repliedToMsg.messageId && (
                            <div className="mb-2 p-2 bg-neutral-950/40 border-l-2 border-cyan-400 rounded text-[10px] leading-normal text-neutral-400 flex flex-col gap-0.5 select-none">
                              <span className="font-bold text-cyan-400 font-mono">{repliedToMsg.senderName}</span>
                              <span className="truncate max-w-[200px]">{repliedToMsg.content}</span>
                            </div>
                          )}

                          {msg.isDeleted ? (
                            <span className="italic text-neutral-500 flex items-center gap-1.5 text-[11px] select-none py-0.5 font-sans">
                              <span className="text-[12px]">🚫</span> This message was deleted
                            </span>
                          ) : (
                            <>
                              {/* Media display */}
                              {msg.attachments && msg.attachments.length > 0 && (
                                <div className={`mb-2 flex flex-col gap-2 max-w-full select-none ${isSentByMe ? "items-end" : "items-start"}`}>
                                  {msg.attachments.map((att, i) => (
                                    <div key={i}>
                                      {att.type === "image" ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img
                                          src={att.url}
                                          alt={att.name || "Attachment"}
                                          className="max-h-60 w-auto object-contain cursor-pointer hover:opacity-90 transition-opacity rounded-lg border border-neutral-800/80 bg-neutral-950/40"
                                          onClick={() => handleOpenMediaViewer(att.url)}
                                        />
                                      ) : att.type === "video" ? (
                                        <div
                                          className="relative max-h-60 w-auto rounded-lg border border-neutral-800/80 bg-neutral-950/40 overflow-hidden cursor-pointer group/vid"
                                          onClick={() => handleOpenMediaViewer(att.url)}
                                        >
                                          <video src={att.url} className="max-h-60 w-auto object-contain pointer-events-none" />
                                          <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover/vid:bg-black/45 transition-colors">
                                            <div className="h-10 w-10 rounded-full bg-cyan-500/90 text-neutral-950 flex items-center justify-center shadow-lg transition-transform group-hover/vid:scale-105">
                                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 ml-0.5">
                                                <path fillRule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z" clipRule="evenodd" />
                                              </svg>
                                            </div>
                                          </div>
                                        </div>
                                      ) : (
                                        <div className="p-3 flex items-center gap-2.5 bg-neutral-900 hover:bg-neutral-850 cursor-pointer transition-colors rounded-lg border border-neutral-800/80" onClick={() => window.open(att.url, "_blank")}>
                                          <FileText className="h-5 w-5 text-cyan-400 shrink-0" />
                                          <span className="text-[10px] text-neutral-300 truncate max-w-[200px] font-mono">{att.name || "Download File"}</span>
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}

                              {/* Text Content */}
                              {isDMEditing ? (
                                <div className="space-y-2 mt-2 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
                                  <textarea
                                    value={editingMessageText}
                                    onChange={(e) => setEditingMessageText(e.target.value)}
                                    className="w-full min-h-[50px] p-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-neutral-200 focus:outline-none focus:border-cyan-500 font-sans resize-none leading-relaxed"
                                  />
                                  <div className="flex items-center gap-1.5">
                                    <Button
                                      onClick={() => handleUpdateDM(msg._id, editingMessageText)}
                                      className="bg-cyan-500 hover:bg-cyan-400 text-neutral-955 font-bold text-[9px] h-6 px-2.5 rounded-md flex items-center gap-0.5 cursor-pointer transition-all"
                                      style={{ fontFamily: "var(--font-space-grotesk)" }}
                                    >
                                      <Check className="h-3 w-3" /> Save
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      onClick={() => setEditingMessageId(null)}
                                      className="text-neutral-455 hover:text-neutral-200 text-[9px] h-6 px-2.5 rounded-md border border-neutral-800 hover:bg-neutral-800 transition-all"
                                      style={{ fontFamily: "var(--font-space-grotesk)" }}
                                    >
                                      Cancel
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                msg.content && <p>{msg.content}</p>
                              )}
                            </>
                          )}
                        </div>

                        {/* Message Meta Info */}
                        <div className="flex items-center gap-1 mt-1 text-[9px] text-neutral-600 font-mono select-none">
                          <span>{messageTime}</span>
                          {msg.isEdited && !msg.isDeleted && (
                            <span className="text-cyan-400 font-bold ml-1 font-sans text-[8px] lowercase">(edited)</span>
                          )}
                          {isSentByMe && (
                            msg.isRead ? (
                              <CheckCheck className="h-3 w-3 text-cyan-500" />
                            ) : (
                              <Check className="h-3 w-3" />
                            )
                          )}
                        </div>
                      </motion.div>
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
                {/* Replying message preview banner */}
                {replyingMessage && (
                  <div className="flex items-center justify-between p-3 bg-neutral-900 border border-neutral-805 rounded-xl animate-fade-in relative select-none">
                    <div className="flex items-start gap-2.5 min-w-0 flex-1">
                      <div className="shrink-0 h-4 border-l-2 border-cyan-400 self-stretch" />
                      <div className="flex flex-col gap-0.5 min-w-0">
                        <span className="text-[10px] font-bold text-cyan-400 font-mono">
                          Replying to {replyingMessage.senderId === currentUserId ? "yourself" : activeUser?.name}
                        </span>
                        <span className="text-[10px] text-neutral-450 truncate max-w-[300px] sm:max-w-md">
                          {replyingMessage.content || (replyingMessage.attachments && replyingMessage.attachments.length > 0 ? "📷 Media Attachment" : "")}
                        </span>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setReplyingMessage(null)}
                      className="h-6 w-6 p-0 hover:bg-neutral-800 text-neutral-500 hover:text-neutral-200 rounded-lg shrink-0 flex items-center justify-center cursor-pointer transition-all"
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                )}
                {/* Media Attachment Previews */}
                {attachments.length > 0 && (
                  <div className="flex flex-wrap gap-2 animate-[slideIn_0.2s_ease-out]">
                    {attachments.map((att, i) => (
                      <div key={i} className="inline-flex items-center gap-3 p-2 bg-neutral-900 border border-neutral-800 rounded-xl relative select-none">
                        <div className="shrink-0 h-10 w-10 bg-neutral-950 rounded-lg flex items-center justify-center border border-neutral-800 overflow-hidden">
                          {att.type === "image" ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={att.url} alt="Preview" className="object-cover h-full w-full" />
                          ) : att.type === "video" ? (
                            <Film className="h-5 w-5 text-cyan-400" />
                          ) : (
                            <FileText className="h-5 w-5 text-cyan-400" />
                          )}
                        </div>
                        <div className="min-w-0 max-w-[200px] text-[10px] text-neutral-450 mr-6">
                          <p className="truncate font-semibold text-neutral-200">{att.name}</p>
                          <p className="text-[8px] uppercase tracking-wider text-cyan-500 font-bold font-mono mt-0.5">{att.type}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setAttachments(prev => prev.filter((_, index) => index !== i));
                          }}
                          className="absolute top-1.5 right-1.5 p-0.5 rounded-full bg-neutral-950 border border-neutral-800 text-neutral-500 hover:text-red-400 transition-colors"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Input Fields Row */}
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    multiple
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

      {/* WhatsApp Media Viewer Lightbox */}
      {mediaGalleryIndex !== -1 && (() => {
        const gallery = getThreadMedia();
        const activeMedia = gallery[mediaGalleryIndex];
        if (!activeMedia) return null;

        const handlePrev = () => {
          setMediaGalleryIndex((prev) => (prev > 0 ? prev - 1 : gallery.length - 1));
        };

        const handleNext = () => {
          setMediaGalleryIndex((prev) => (prev < gallery.length - 1 ? prev + 1 : 0));
        };

        const handleDownload = () => {
          const link = document.createElement("a");
          link.href = activeMedia.url;
          link.download = activeMedia.name || activeMedia.url.split("/").pop() || "media";
          link.target = "_blank";
          link.click();
        };

        return (
          <div className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-md flex flex-col justify-between select-none animate-fade-in">
            {/* Header */}
            <div className="h-16 px-6 bg-gradient-to-b from-black/50 to-transparent flex items-center justify-between text-neutral-300 relative z-10 shrink-0">
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-bold font-mono truncate max-w-xs sm:max-w-md">{activeMedia.name || "Media Attachment"}</span>
                <span className="text-[10px] text-neutral-500 font-mono">
                  {mediaGalleryIndex + 1} of {gallery.length}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  onClick={handleDownload}
                  variant="ghost"
                  className="h-9 w-9 p-0 hover:bg-neutral-900 text-neutral-400 hover:text-cyan-400 rounded-lg flex items-center justify-center cursor-pointer transition-all"
                  title="Download Media"
                >
                  <Download className="h-4 w-4" />
                </Button>
                <Button
                  onClick={() => setMediaGalleryIndex(-1)}
                  variant="ghost"
                  className="h-9 w-9 p-0 hover:bg-neutral-900 text-neutral-400 hover:text-neutral-100 rounded-lg flex items-center justify-center cursor-pointer transition-all"
                  title="Close Viewer"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Viewport content */}
            <div className="flex-1 relative flex items-center justify-center min-h-0 px-4">
              {/* Navigation Arrows */}
              {gallery.length > 1 && (
                <>
                  <button
                    onClick={handlePrev}
                    className="absolute left-4 sm:left-8 z-10 p-2.5 rounded-full bg-neutral-900/60 hover:bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-neutral-200 transition-all focus:outline-none cursor-pointer"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    onClick={handleNext}
                    className="absolute right-4 sm:right-8 z-10 p-2.5 rounded-full bg-neutral-900/60 hover:bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-neutral-250 transition-all focus:outline-none cursor-pointer"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </>
              )}

              {/* Media node */}
              <div className="max-w-[85vw] max-h-[75vh] flex items-center justify-center relative">
                {activeMedia.type === "image" ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={activeMedia.url}
                    alt={activeMedia.name || "Attachment"}
                    className="max-w-full max-h-[75vh] object-contain rounded-lg shadow-2xl"
                  />
                ) : (
                  <video
                    src={activeMedia.url}
                    controls
                    autoPlay
                    className="max-w-full max-h-[75vh] object-contain rounded-lg shadow-2xl"
                  />
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="h-16 bg-gradient-to-t from-black/50 to-transparent flex items-center justify-center shrink-0">
              <span className="text-[10px] text-neutral-500 uppercase tracking-widest font-space font-bold">
                Notexia Media Viewer
              </span>
            </div>
          </div>
        );
      })()}

      {/* Context Menu Dropdown */}
      {contextMenu && contextMenu.visible && (
        <div
          className="fixed z-[99999] bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl p-1 w-32 flex flex-col animate-fade-in"
          style={{
            top: Math.min(contextMenu.y, typeof window !== "undefined" ? window.innerHeight - 150 : contextMenu.y),
            left: Math.min(contextMenu.x, typeof window !== "undefined" ? window.innerWidth - 140 : contextMenu.x),
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => {
              setReplyingMessage(contextMenu.message);
              setContextMenu(null);
            }}
            className="w-full text-left py-1.5 px-2.5 rounded-lg text-[10px] text-neutral-300 hover:bg-neutral-800 hover:text-cyan-400 font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            style={{ fontFamily: "var(--font-space-grotesk)" }}
          >
            <CornerUpLeft className="h-3.5 w-3.5" />
            <span>Reply</span>
          </button>

          {contextMenu.message.senderId === currentUserId && (
            <>
              <button
                onClick={() => {
                  setEditingMessageId(contextMenu.message._id);
                  setEditingMessageText(contextMenu.message.content);
                  setContextMenu(null);
                }}
                className="w-full text-left py-1.5 px-2.5 rounded-lg text-[10px] text-neutral-300 hover:bg-neutral-800 hover:text-cyan-400 font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                style={{ fontFamily: "var(--font-space-grotesk)" }}
              >
                <Edit3 className="h-3.5 w-3.5" />
                <span>Edit</span>
              </button>
              <button
                onClick={() => {
                  handleDeleteDM(contextMenu.message._id);
                  setContextMenu(null);
                }}
                className="w-full text-left py-1.5 px-2.5 rounded-lg text-[10px] text-red-400 hover:bg-neutral-800 hover:text-red-300 font-bold transition-all flex items-center gap-1.5 cursor-pointer border-t border-neutral-800 mt-0.5 pt-1.5"
                style={{ fontFamily: "var(--font-space-grotesk)" }}
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Delete</span>
              </button>
            </>
          )}
        </div>
      )}

      {/* Wallpaper Picker Modal */}
      {isWallpaperPickerOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in" onClick={() => setIsWallpaperPickerOpen(false)}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-2xl p-6 space-y-6 shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div className="flex items-center gap-2">
                <Palette className="h-4 w-4 text-cyan-400" />
                <h3 className="text-sm font-bold text-neutral-200 uppercase tracking-widest" style={{ fontFamily: "var(--font-space-grotesk)" }}>
                  Chat Wallpaper Settings
                </h3>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsWallpaperPickerOpen(false)}
                className="h-8 w-8 text-neutral-500 hover:text-neutral-200 rounded-lg"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Presets - Solid Colors */}
            <div className="space-y-3">
              <h4 className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider" style={{ fontFamily: "var(--font-space-grotesk)" }}>
                Solid Colors
              </h4>
              <div className="grid grid-cols-6 gap-2.5">
                {[
                  { name: "Charcoal", value: "#0b141a" },
                  { name: "Olive", value: "#1c2826" },
                  { name: "Teal", value: "#0d2c30" },
                  { name: "Indigo", value: "#182238" },
                  { name: "Crimson", value: "#2e141a" },
                  { name: "Royal", value: "#221230" },
                ].map((color) => (
                  <button
                    key={color.name}
                    title={color.name}
                    onClick={() => updateWallpaper(color.value)}
                    className="w-10 h-10 rounded-full border border-white/5 shadow-inner hover:scale-105 active:scale-95 transition-transform"
                    style={{ backgroundColor: color.value }}
                  />
                ))}
              </div>
            </div>

            {/* Presets - Gradients */}
            <div className="space-y-3">
              <h4 className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider" style={{ fontFamily: "var(--font-space-grotesk)" }}>
                Cyber Gradients
              </h4>
              <div className="grid grid-cols-4 gap-2.5">
                {[
                  { name: "Neon", value: "linear-gradient(135deg, rgba(6, 182, 212, 0.15), rgba(59, 130, 246, 0.15), rgba(139, 92, 246, 0.15))" },
                  { name: "Cosmic", value: "linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(236, 72, 153, 0.15))" },
                  { name: "Flame", value: "linear-gradient(135deg, rgba(249, 115, 22, 0.15), rgba(234, 179, 8, 0.15))" },
                  { name: "Forest", value: "linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(5, 150, 105, 0.15))" },
                ].map((grad) => (
                  <button
                    key={grad.name}
                    title={grad.name}
                    onClick={() => updateWallpaper(grad.value)}
                    className="h-10 rounded-lg border border-white/5 shadow-inner hover:scale-105 active:scale-95 transition-transform"
                    style={{ background: grad.value }}
                  />
                ))}
              </div>
            </div>

            {/* Custom Image Upload */}
            <div className="space-y-3 border-t border-neutral-800 pt-4">
              <h4 className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider" style={{ fontFamily: "var(--font-space-grotesk)" }}>
                Custom Background Image
              </h4>
              <div className="flex items-center gap-3">
                <label className="flex-1 flex flex-col items-center justify-center border border-dashed border-neutral-850 hover:border-cyan-500/50 bg-neutral-950/40 rounded-xl p-4 cursor-pointer transition-all hover:bg-neutral-950/60 select-none">
                  {isUploadingWallpaper ? (
                    <div className="flex items-center gap-2 text-xs text-neutral-400">
                      <Loader2 className="h-4 w-4 animate-spin text-cyan-400" />
                      <span>Uploading...</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-1.5 text-xs text-neutral-400">
                      <ImageIcon className="h-5 w-5 text-neutral-500" />
                      <span className="font-semibold text-neutral-350">Choose a file...</span>
                      <span className="text-[9px] text-neutral-600">JPG, PNG, WEBP or GIF up to 10MB</span>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleWallpaperUpload}
                    disabled={isUploadingWallpaper}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* Reset Defaults */}
            <div className="flex items-center gap-2 border-t border-neutral-800 pt-4">
              <Button
                onClick={() => updateWallpaper("")}
                className="flex-1 bg-neutral-800 hover:bg-neutral-750 text-neutral-300 text-[10px] uppercase font-space font-bold py-2 rounded-xl transition-all cursor-pointer"
                style={{ fontFamily: "var(--font-space-grotesk)" }}
              >
                Clear Custom Wallpaper
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
