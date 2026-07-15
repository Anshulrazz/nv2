"use client";

import { useEffect } from "react";
import Pusher from "pusher-js";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Bell, X } from "lucide-react";
import { toast } from "sonner";

export function PusherListener() {
  const { data: session } = useSession();
  const router = useRouter();

  useEffect(() => {
    // Request Native Browser Notification Permission
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "default") {
        Notification.requestPermission();
      }
    }

    const currentUserId = session?.user?.id;
    if (!currentUserId) return;

    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY || "YOUR_KEY", {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || "YOUR_CLUSTER",
    });

    const channel = pusher.subscribe(`user-${currentUserId}`);

    const showToastAndPush = (title: string, description: string, image?: string) => {
      // 1. In-app robust toast via Sonner
      toast.custom((t) => (
        <div className="flex items-center gap-3 bg-neutral-900 border border-neutral-700 shadow-2xl rounded-xl p-3 w-80">
          {image ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={image} alt={title} className="h-10 w-10 rounded-full object-cover shrink-0 border border-neutral-800" />
          ) : (
            <div className="h-10 w-10 shrink-0 bg-cyan-500/20 rounded-full border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Bell className="h-4 w-4" />
            </div>
          )}
          
          <div className="flex-1 min-w-0">
            <h4 className="text-xs font-bold text-neutral-100 truncate" style={{ fontFamily: "var(--font-space-grotesk)" }}>
              {title}
            </h4>
            <p className="text-[11px] text-neutral-400 truncate mt-0.5">{description}</p>
          </div>
          
          <button
            onClick={() => toast.dismiss(t)}
            className="shrink-0 text-neutral-500 hover:text-neutral-300 transition-colors p-1"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ));

      // 2. Native OS Push Notification
      if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
        new Notification(title, {
          body: description,
          icon: image || "/favicon.ico",
        });
      }
    };

    channel.bind("new-message", (msg: any) => {
      router.refresh();
      // We rely on 'new-notification' to show the rich popup since it contains senderName & senderImage.
    });

    channel.bind("new-notification", (notif: any) => {
      router.refresh();
      let desc = "You have a new notification.";
      if (notif.type === "message") desc = "sent you a direct message.";
      else if (notif.type === "like") desc = "liked your post.";
      else if (notif.type === "comment") desc = "commented on your post.";
      else if (notif.type === "follow") desc = "started following you.";
      
      showToastAndPush(notif.senderName || "New Alert", desc, notif.senderImage);
    });

    channel.bind("messages-read", () => {
      router.refresh();
    });

    return () => {
      pusher.unsubscribe(`user-${currentUserId}`);
      pusher.disconnect();
    };
  }, [session?.user?.id, router]);

  return null;
}
