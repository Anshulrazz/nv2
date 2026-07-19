// ─── PusherListener — rebuilt toast + realtime notification system ───
"use client";

import { useEffect, useRef, useCallback } from "react";
import Pusher from "pusher-js";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Bell, X, MessageCircle, Heart, MessageSquare, UserPlus } from "lucide-react";
import { toast } from "sonner";

import type {
  NewMessagePayload,
  NewNotificationPayload,
  MessagesReadPayload,
  NotificationContent,
} from "@/types/notification-types";

// ────────────────────────────────────────────────────────────────────────
// Single source of truth: build display content for any event
// ────────────────────────────────────────────────────────────────────────

function getAbsoluteUrl(path?: string): string | undefined {
  if (!path) return undefined;
  if (path.startsWith("http://") || path.startsWith("https://") || path.startsWith("data:")) {
    return path;
  }
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "https://nottexia.in";
  return `${baseUrl}${path.startsWith("/") ? "" : "/"}${path}`;
}

function resolveMessageContent(data: NewMessagePayload): NotificationContent {
  return {
    title: data.senderName ? `New message from ${data.senderName}` : "New message",
    body: data.content || "You have a new direct message.",
    image: getAbsoluteUrl(data.senderImage),
    link: `/messages?userId=${data.senderId}`,
    dedupKey: `msg-${data._id}`,
  };
}

function resolveNotificationContent(notif: NewNotificationPayload): NotificationContent {
  const descriptions: Record<string, string> = {
    message: "sent you a direct message.",
    like: "liked your post.",
    comment: "commented on your post.",
    follow: "started following you.",
    mention: "mentioned you.",
  };

  const body = descriptions[notif.type] || "You have a new notification.";

  // Resolve navigation link based on notification type
  let link = "/notifications";
  if (notif.type === "message") {
    link = `/messages?userId=${notif.senderId}`;
  } else if (notif.type === "like" || notif.type === "comment") {
    link = `/feed`;
  } else if (notif.type === "follow") {
    link = `/user/${notif.senderId}`;
  }

  return {
    title: notif.senderName || "Notexia",
    body,
    image: getAbsoluteUrl(notif.senderImage),
    link,
    dedupKey: `notif-${notif._id}`,
  };
}

// ────────────────────────────────────────────────────────────────────────
// Icon picker for toast card
// ────────────────────────────────────────────────────────────────────────

function NotifIcon({ type }: { type?: string }) {
  const cls = "h-4 w-4";
  switch (type) {
    case "message":
      return <MessageCircle className={cls} />;
    case "like":
      return <Heart className={cls} />;
    case "comment":
      return <MessageSquare className={cls} />;
    case "follow":
      return <UserPlus className={cls} />;
    default:
      return <Bell className={cls} />;
  }
}

// ────────────────────────────────────────────────────────────────────────
// Component
// ────────────────────────────────────────────────────────────────────────

export function PusherListener() {
  const { data: session } = useSession();
  const router = useRouter();

  // Dedup: track recently-shown dedupKeys to prevent double toasts
  const recentKeys = useRef<Set<string>>(new Set());

  /** Returns true if this key was already shown recently */
  const isDuplicate = useCallback((key: string): boolean => {
    if (recentKeys.current.has(key)) {
      console.log(`[PusherListener] Deduplicated duplicate event for key: ${key}`);
      return true;
    }
    recentKeys.current.add(key);
    console.log(`[PusherListener] Tracking unique event key: ${key}`);
    // Auto-expire after 5 seconds
    setTimeout(() => {
      recentKeys.current.delete(key);
      console.log(`[PusherListener] Expired unique key tracking for: ${key}`);
    }, 5000);
    return false;
  }, []);

  /**
   * Show an in-app toast and (optionally) a native OS notification.
   * This is the single entry point for all visual notifications.
   */
  const showNotification = useCallback(
    (content: NotificationContent, iconType?: string) => {
      console.log("[PusherListener] Processing notification show request:", { content, iconType });

      // ── Dedup check ──
      if (isDuplicate(content.dedupKey)) {
        console.log(`[PusherListener] Event skipped due to deduplication: ${content.dedupKey}`);
        return;
      }

      // ── 1. In-app toast via Sonner ──
      console.log(`[PusherListener] Showing custom Sonner toast for key: ${content.dedupKey}`);
      toast.custom(
        (t) => (
          <div
            onClick={() => {
              console.log(`[PusherListener] Custom toast clicked. Routing to: ${content.link}`);
              router.push(content.link);
              toast.dismiss(t);
            }}
            className="flex items-center gap-3 bg-neutral-900 border border-neutral-700 shadow-2xl rounded-xl p-3 w-80 cursor-pointer hover:bg-neutral-850 transition-colors"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                console.log(`[PusherListener] Custom toast key pressed (${e.key}). Routing to: ${content.link}`);
                router.push(content.link);
                toast.dismiss(t);
              }
            }}
          >
            {content.image ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={content.image}
                alt={content.title}
                className="h-10 w-10 rounded-full object-cover shrink-0 border border-neutral-800"
              />
            ) : (
              <div className="h-10 w-10 shrink-0 bg-cyan-500/20 rounded-full border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                <NotifIcon type={iconType} />
              </div>
            )}

            <div className="flex-1 min-w-0">
              <h4
                className="text-xs font-bold text-neutral-100 truncate"
                style={{ fontFamily: "var(--font-space-grotesk)" }}
              >
                {content.title}
              </h4>
              <p className="text-[11px] text-neutral-400 truncate mt-0.5">
                {content.body}
              </p>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                console.log(`[PusherListener] Custom toast dismissed via close button for key: ${content.dedupKey}`);
                toast.dismiss(t);
              }}
              className="shrink-0 text-neutral-500 hover:text-neutral-300 transition-colors p-1"
              aria-label="Close notification"
              type="button"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ),
        { duration: 5000 }
      );

      // ── 2. Native OS notification (only when tab is NOT focused) ──
      const isVisible = typeof document !== "undefined" && document.visibilityState === "visible";
      console.log(`[PusherListener] Native OS check: document.visibilityState is "${typeof document !== "undefined" ? document.visibilityState : "undefined"}", permission is "${typeof window !== "undefined" && "Notification" in window ? Notification.permission : "unsupported"}"`);

      if (!isVisible) {
        if (
          typeof window !== "undefined" &&
          "Notification" in window &&
          Notification.permission === "granted"
        ) {
          try {
            console.log(`[PusherListener] Creating native browser Notification for tag: ${content.dedupKey}`);
            const n = new Notification(content.title, {
              body: content.body,
              icon: content.image || "/logo.png",
              tag: content.dedupKey, // stable tag prevents duplicates
            });
            n.onclick = () => {
              console.log(`[PusherListener] Native notification clicked. Focusing window and routing to: ${content.link}`);
              window.focus();
              router.push(content.link);
              n.close();
            };
          } catch (err) {
            console.warn("[PusherListener] Native notification construction failed:", err);
          }
        } else {
          console.log("[PusherListener] Native OS notification skipped: either unsupported or permission not granted.");
        }
      } else {
        console.log("[PusherListener] Native OS notification skipped: tab is currently active/visible.");
      }
    },
    [isDuplicate, router]
  );

  useEffect(() => {
    const currentUserId = session?.user?.id;
    if (!currentUserId) {
      console.log("[PusherListener] No authenticated user session found — skipping Pusher initialization.");
      return;
    }

    console.log(`[PusherListener] Authenticated user: ${currentUserId}. Connecting to Pusher...`);

    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY || "", {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || "",
    });

    const channelName = `user-${currentUserId}`;
    console.log(`[PusherListener] Subscribing to Pusher channel: ${channelName}`);
    const channel = pusher.subscribe(channelName);

    // ── new-message ──
    channel.bind("new-message", (data: NewMessagePayload) => {
      console.log("[PusherListener] Received Pusher event: new-message", data);
      router.refresh();

      // Skip toast for own messages (multi-tab echo)
      if (data.senderId === currentUserId) {
        console.log("[PusherListener] Skipping new-message toast: message was sent by current user.");
        return;
      }

      const content = resolveMessageContent(data);
      showNotification(content, "message");
    });

    // ── new-notification ──
    channel.bind("new-notification", (notif: NewNotificationPayload) => {
      console.log("[PusherListener] Received Pusher event: new-notification", notif);
      router.refresh();

      // Skip type=message notifications — already handled by new-message event
      // to avoid double-toasting the same DM
      if (notif.type === "message") {
        console.log("[PusherListener] Skipping type=message notification (already handled by new-message binding).");
        return;
      }

      const content = resolveNotificationContent(notif);
      showNotification(content, notif.type);
    });

    // ── messages-read ──
    channel.bind("messages-read", (data: MessagesReadPayload) => {
      console.log("[PusherListener] Received Pusher event: messages-read", data);
      router.refresh();
    });

    // ── Cleanup ──
    return () => {
      console.log(`[PusherListener] Cleaning up subscriptions and disconnecting Pusher for channel: ${channelName}`);
      channel.unbind_all();
      pusher.unsubscribe(channelName);
      pusher.disconnect();
    };
  }, [session?.user?.id, router, showNotification]);

  return null;
}
