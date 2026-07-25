/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Bell, Heart, MessageSquare, UserPlus, Share2, Loader2, CheckSquare, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Pusher from "pusher-js";

interface NotificationData {
  _id: string;
  senderName: string;
  senderImage?: string;
  type: "like" | "comment" | "follow" | "mention" | "message";
  targetId: string;
  senderId: string;
  isRead: boolean;
  createdAt: string;
}

export default function NotificationsPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const currentUserId = session?.user?.id;
  const [list, setList] = useState<NotificationData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const handleNotificationClick = (n: NotificationData) => {
    if (n.type === "message") {
      router.push(`/messages?userId=${n.senderId}`);
    } else if (n.type === "follow") {
      router.push(`/user/${n.senderId}`);
    } else {
      router.push("/feed");
    }
  };

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        setList(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const markAllRead = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications", {
        method: "PATCH",
      });
      if (res.ok) {
        setList((prev) => prev.map((n) => ({ ...n, isRead: true })));
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    fetchNotifications().then(() => {
      markAllRead();
    });
  }, [fetchNotifications, markAllRead]);

  useEffect(() => {
    if (!currentUserId) return;

    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY || "YOUR_KEY", {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || "YOUR_CLUSTER",
    });

    const channel = pusher.subscribe(`user-${currentUserId}`);
    channel.bind("new-notification", (newNotif: NotificationData) => {
      setList((prev) => {
        if (prev.some((n) => n._id === newNotif._id)) return prev;
        return [newNotif, ...prev];
      });
    });

    return () => {
      pusher.unsubscribe(`user-${currentUserId}`);
      pusher.disconnect();
    };
  }, [currentUserId]);

  const getAlertIcon = (type: string) => {
    switch (type) {
      case "like":
        return <Heart className="size-4 text-rose-400" />;
      case "comment":
        return <MessageSquare className="size-4 text-indigo-400" />;
      case "follow":
        return <UserPlus className="size-4 text-emerald-400" />;
      case "mention":
        return <Share2 className="size-4 text-cyan-400" />;
      case "message":
        return <MessageCircle className="size-4 text-cyan-400 animate-pulse" />;
      default:
        return <Bell className="size-4 text-zinc-400" />;
    }
  };

  const getAlertDescription = (n: NotificationData) => {
    switch (n.type) {
      case "like":
        return "liked your published post.";
      case "comment":
        return "commented on your published post.";
      case "follow":
        return "started following you.";
      case "mention":
        return "reshared your post to the feed.";
      case "message":
        return "sent you a direct message.";
      default:
        return "sent you an alert.";
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#030305] text-zinc-100 overflow-y-auto antialiased relative selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Background Ambient Mesh Glow Orbs */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 right-1/4 w-[500px] h-[350px] bg-cyan-500/10 rounded-full blur-[140px]" />
      </div>

      {/* Header Banner */}
      <div className="border-b border-white/5 bg-zinc-950/40 p-8 rounded-[2rem] border border-white/10 relative z-10 backdrop-blur-2xl m-6 sm:m-10 mb-0">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="size-14 rounded-2xl bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20 text-cyan-400">
              <Bell className="size-7" />
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tight text-white flex items-center gap-3">
                Notifications Inbox
                <span className="text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 px-3 py-1 rounded-full border border-cyan-500/30 uppercase tracking-widest">
                  LIVE FEED
                </span>
              </h1>
              <p className="text-zinc-400 text-xs sm:text-sm font-light mt-1">
                Stay updated on peer interactions, likes, comments, and direct message notifications.
              </p>
            </div>
          </div>

          {list.some((n) => !n.isRead) && (
            <Button
              onClick={markAllRead}
              className="rounded-full bg-white hover:bg-zinc-100 text-zinc-950 font-bold text-xs h-10 px-5 flex items-center justify-center gap-2 transition-all duration-300 active:scale-[0.97]"
            >
              <CheckSquare className="size-4 text-zinc-950" />
              <span>Mark All Read</span>
            </Button>
          )}
        </div>
      </div>

      <div className="p-6 sm:p-10 max-w-3xl w-full mx-auto space-y-4 relative z-10">
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center text-zinc-500 text-xs font-semibold gap-3">
            <Loader2 className="size-8 animate-spin text-cyan-400" />
            <span className="font-mono text-zinc-400 tracking-widest">RETRIEVING INBOX...</span>
          </div>
        ) : list.length === 0 ? (
          <div className="py-20 text-center text-zinc-500 italic select-none">Inbox is empty. No new notifications.</div>
        ) : (
          <div className="rounded-[2.5rem] bg-zinc-900/40 border border-white/10 p-2.5 backdrop-blur-3xl">
            <div className="rounded-[calc(2.5rem-0.75rem)] bg-[#07070a] border border-white/5 overflow-hidden divide-y divide-white/5">
              {list.map((n) => (
                <div
                  key={n._id}
                  onClick={() => handleNotificationClick(n)}
                  className={`p-5 flex items-center justify-between hover:bg-white/5 transition-colors cursor-pointer ${
                    !n.isRead ? "bg-cyan-500/10" : ""
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2.5 rounded-2xl bg-zinc-950 border border-white/10 shrink-0">
                      {getAlertIcon(n.type)}
                    </div>

                    <div className="flex items-center gap-3">
                      {n.senderImage ? (
                        <img src={n.senderImage} alt={n.senderName} className="size-8 rounded-full object-cover shrink-0 border border-white/10 bg-zinc-900" />
                      ) : (
                        <div className="size-8 rounded-full bg-zinc-950 border border-white/10 flex items-center justify-center text-zinc-400 font-bold shrink-0 text-xs">
                          {n.senderName?.[0]?.toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-xs text-zinc-300">
                          <span className="font-bold text-white">{n.senderName}</span>{" "}
                          {getAlertDescription(n)}
                        </p>
                        <p className="text-[10px] font-mono text-zinc-500 mt-0.5">
                          {new Date(n.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>

                  {!n.isRead && (
                    <span className="size-2 rounded-full bg-cyan-400 animate-pulse shrink-0" />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
