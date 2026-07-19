// components/PusherListener.tsx
"use client";

import { useEffect, useRef } from "react";
import Pusher from "pusher-js";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Bell, X } from "lucide-react";
import { toast } from "sonner";

type NotifPayload = {
  type?: "message" | "like" | "comment" | "follow" | string;
  senderName?: string;
  senderImage?: string;
  conversationId?: string; // for message-type notifications
  postId?: string;         // for like/comment
  link?: string;           // optional explicit override from backend
};

type MessagePayload = {
  senderName?: string;
  senderImage?: string;
  text?: string;
  conversationId: string;
};

export function PusherListener() {
  const { data: session } = useSession();
  const router = useRouter();

  // Track a monotonically increasing tag so native notifications don't collide/get silently dropped
  const notifTagRef = useRef(0);

  useEffect(() => {
    const currentUserId = session?.user?.id;
    if (!currentUserId) return;

    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY || "YOUR_KEY", {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || "YOUR_CLUSTER",
    });

    const channel = pusher.subscribe(`user-${currentUserId}`);

    const resolveLink = (opts: { type?: string; conversationId?: string; postId?: string; link?: string }) => {
      if (opts.link) return opts.link;
      if (opts.type === "message" && opts.conversationId) return `/messages/${opts.conversationId}`;
      if ((opts.type === "like" || opts.type === "comment") && opts.postId) return `/notes/${opts.postId}`;
      if (opts.type === "follow") return `/notifications`;
      return "/notifications";
    };

    const showToastAndPush = (
      title: string,
      description: string,
      image?: string,
      href?: string
    ) => {
      const go = () => {
        if (href) router.push(href);
      };

      // 1. In-app toast via Sonner
      toast.custom((t) => (
        <div
          onClick={() => {
            go();
            toast.dismiss(t);
          }}
          className="flex items-center gap-3 bg-neutral-900 border border-neutral-700 shadow-2xl rounded-xl p-3 w-80 cursor-pointer"
        >
          {image ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={image}
              alt={title}
              className="h-10 w-10 rounded-full object-cover shrink-0 border border-neutral-800"
            />
          ) : (
            <div className="h-10 w-10 shrink-0 bg-cyan-500/20 rounded-full border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Bell className="h-4 w-4" />
            </div>
          )}

          <div className="flex-1 min-w-0">
            <h4
              className="text-xs font-bold text-neutral-100 truncate"
              style={{ fontFamily: "var(--font-space-grotesk)" }}
            >
              {title}
            </h4>
            <p className="text-[11px] text-neutral-400 truncate mt-0.5">{description}</p>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              toast.dismiss(t);
            }}
            className="shrink-0 text-neutral-500 hover:text-neutral-300 transition-colors p-1"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ));

      // 2. Native OS push notification — same title/body/image as the toast
      if (
        typeof window !== "undefined" &&
        "Notification" in window &&
        Notification.permission === "granted"
      ) {
        notifTagRef.current += 1;
        const n = new Notification(title, {
          body: description,
          icon: image || "/favicon.ico",
          tag: `notexia-${notifTagRef.current}`, // prevents native de-dupe from swallowing rapid notifications
        });
        n.onclick = () => {
          window.focus();
          go();
          n.close();
        };
      }
    };

    channel.bind("new-message", (data: MessagePayload) => {
      router.refresh(); // keeps unread badge / sidebar in sync

      // Show the same rich toast + push for direct messages instead of staying silent
      showToastAndPush(
        data.senderName ? `New message from ${data.senderName}` : "New message",
        data.text || "You have a new direct message.",
        data.senderImage,
        `/messages/${data.conversationId}`
      );
    });

    channel.bind("new-notification", (notif: NotifPayload) => {
      router.refresh();

      let desc = "You have a new notification.";
      if (notif.type === "message") desc = "sent you a direct message.";
      else if (notif.type === "like") desc = "liked your post.";
      else if (notif.type === "comment") desc = "commented on your post.";
      else if (notif.type === "follow") desc = "started following you.";

      showToastAndPush(
        notif.senderName || "New Alert",
        desc,
        notif.senderImage,
        resolveLink(notif)
      );
    });

    channel.bind("messages-read", () => {
      router.refresh();
    });

    return () => {
      channel.unbind_all();
      pusher.unsubscribe(`user-${currentUserId}`);
      pusher.disconnect();
    };
  }, [session?.user?.id, router]);

  return null;
}

/**
 * Call this from a real user gesture — e.g. a "Enable notifications" button
 * in Settings or a first-login prompt. Browsers largely ignore permission
 * requests that aren't tied to a click, so firing this on mount (as before)
 * silently fails in Chrome/Firefox and does nothing on iOS Safari at all
 * (iOS requires a Service Worker + Push API subscription, not this API).
 */
export async function requestNotificationPermission() {
  if (typeof window === "undefined" || !("Notification" in window)) return "unsupported";
  if (Notification.permission === "default") {
    return Notification.requestPermission();
  }
  return Notification.permission;
}