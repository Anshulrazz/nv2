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
      // Auto-clear unread notifications on page open
      markAllRead();
    });
  }, [fetchNotifications, markAllRead]);

  // Real-time listener for new notifications
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
        return <Heart className="h-4 w-4 text-red-400" />;
      case "comment":
        return <MessageSquare className="h-4 w-4 text-indigo-400" />;
      case "follow":
        return <UserPlus className="h-4 w-4 text-emerald-400" />;
      case "mention":
        return <Share2 className="h-4 w-4 text-cyan-400" />;
      case "message":
        return <MessageCircle className="h-4 w-4 text-cyan-400 animate-pulse" />;
      default:
        return <Bell className="h-4 w-4 text-neutral-400" />;
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
    <div className="flex-1 flex flex-col h-full bg-neutral-950 overflow-y-auto custom-scroll relative">
      {/* Ambient background glows */}
      <div className="absolute top-0 right-1/4 w-[450px] h-[250px] bg-cyan-500/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Top Banner */}
      <div className="border-b border-neutral-900 bg-neutral-900/10 px-4 sm:px-8 py-4 sm:py-6 flex items-center justify-between shrink-0 select-none relative z-10">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-cyan-400" />
            <h1
              className="text-xl font-bold text-neutral-100 tracking-tight"
              style={{ fontFamily: "var(--font-space-grotesk)" }}
            >
              Alerts
            </h1>
          </div>
          <p className="text-neutral-500 text-xs">Stay updated on peer interactions, likes, comments, and new followers.</p>
        </div>

        {list.some((n) => !n.isRead) && (
          <Button
            onClick={markAllRead}
            variant="ghost"
            size="sm"
            className="text-[11px] font-bold text-cyan-400 hover:text-white hover:bg-neutral-900 gap-1.5 h-9 transition-colors"
            style={{ fontFamily: "var(--font-space-grotesk)" }}
          >
            <CheckSquare className="h-3.5 w-3.5" /> Mark all read
          </Button>
        )}
      </div>

      <div className="p-4 sm:p-8 max-w-2xl w-full mx-auto space-y-4 relative z-10">
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center text-neutral-500 text-xs font-semibold gap-2 select-none">
            <Loader2 className="h-6 w-6 animate-spin text-cyan-400" />
            <span style={{ fontFamily: "var(--font-jetbrains-mono)" }}>RETRIEVING INBOX...</span>
          </div>
        ) : list.length === 0 ? (
          <div className="py-20 text-center text-neutral-600 italic select-none">Inbox is empty. No new notifications.</div>
        ) : (
          <div className="divide-y divide-white/5 border border-white/5 rounded-2xl bg-neutral-955/30 backdrop-blur-md shadow-lg overflow-hidden">
            {list.map((n) => (
              <div
                key={n._id}
                onClick={() => handleNotificationClick(n)}
                className={`p-4 flex items-center justify-between hover:bg-neutral-900/10 transition-colors cursor-pointer ${
                  !n.isRead ? "bg-cyan-500/5" : ""
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-neutral-950 border border-neutral-850 shrink-0">
                    {getAlertIcon(n.type)}
                  </div>

                  <div className="flex items-center gap-2">
                    {n.senderImage ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={n.senderImage} alt={n.senderName} className="h-7 w-7 rounded-full object-cover shrink-0 border border-neutral-800" />
                    ) : (
                      <div className="h-7 w-7 rounded-full bg-neutral-950 border border-neutral-850 flex items-center justify-center text-neutral-500 font-bold shrink-0 text-xs">
                        {n.senderName?.[0]?.toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-xs text-neutral-300">
                        <span className="font-bold text-neutral-100" style={{ fontFamily: "var(--font-space-grotesk)" }}>{n.senderName}</span>{" "}
                        {getAlertDescription(n)}
                      </p>
                      <p className="text-[9px] text-neutral-600 select-none mt-0.5" style={{ fontFamily: "var(--font-jetbrains-mono)" }}>
                        {new Date(n.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>

                {!n.isRead && (
                  <span className="h-2 w-2 rounded-full bg-cyan-400 select-none animate-pulse shrink-0 ml-4" />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
