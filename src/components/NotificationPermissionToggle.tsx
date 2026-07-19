// ─── Settings UI toggle for Pusher Beams notification opt-in ───
"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Bell, BellOff, BellRing, Loader2, AlertTriangle } from "lucide-react";
import {
  requestNotificationPermission,
  subscribeToPush,
  unsubscribeFromPush,
  isPushSubscribed,
} from "@/lib/push-client";

type PermissionState = "granted" | "denied" | "default" | "unsupported" | "loading";

export function NotificationPermissionToggle() {
  const { data: session } = useSession();
  const userId = session?.user?.id;

  const [permState, setPermState] = useState<PermissionState>("loading");
  const [isToggling, setIsToggling] = useState(false);
  const [pushSubscribed, setPushSubscribed] = useState(false);

  // Check initial permission and subscription state
  useEffect(() => {
    console.log("[NotificationToggle] Checking browser permission context...");
    if (typeof window === "undefined" || !("Notification" in window)) {
      setPermState("unsupported");
      return;
    }

    const currentPermission = Notification.permission as PermissionState;
    setPermState(currentPermission);

    if (currentPermission !== "granted" || !userId) {
      console.log("[NotificationToggle] No granted permission or no userId yet.");
      if (currentPermission === "granted" && !userId) {
        // We're loading session
        setPermState("loading");
      }
      return;
    }

    // Check Beams device interest state
    console.log(`[NotificationToggle] Checking Beams interest status for user: ${userId}`);
    isPushSubscribed(userId)
      .then((subbed) => {
        setPushSubscribed(subbed);
      })
      .catch((err) => {
        console.error("[NotificationToggle] Failed to check Beams interest status:", err);
      });
  }, [userId]);

  const handleEnable = useCallback(async () => {
    if (!userId) {
      console.warn("[NotificationToggle] Enable clicked but user session is not loaded.");
      return;
    }
    console.log("[NotificationToggle] Initiating push registration...");
    setIsToggling(true);
    try {
      // 1. Request standard permission
      const result = await requestNotificationPermission();
      if (result === "unsupported") {
        setPermState("unsupported");
        return;
      }
      setPermState(result);

      if (result !== "granted") {
        console.warn("[NotificationToggle] Permission not granted:", result);
        return;
      }

      // 2. Register to Pusher Beams interest
      const ok = await subscribeToPush(userId);
      setPushSubscribed(ok);
    } catch (err) {
      console.error("[NotificationToggle] Push subscription activation failed:", err);
    } finally {
      setIsToggling(false);
    }
  }, [userId]);

  const handleDisable = useCallback(async () => {
    if (!userId) return;
    console.log("[NotificationToggle] Initiating push unregistration...");
    setIsToggling(true);
    try {
      const ok = await unsubscribeFromPush(userId);
      if (ok) {
        setPushSubscribed(false);
      }
    } catch (err) {
      console.error("[NotificationToggle] Push unsubscription failed:", err);
    } finally {
      setIsToggling(false);
    }
  }, [userId]);

  // If user session is loading, show loading spinner
  const displayState = !userId && permState === "loading" ? "loading" : permState;

  return (
    <div className="bg-neutral-955/40 backdrop-blur-md border border-white/5 hover:border-neutral-800 rounded-xl p-6 space-y-4 transition-all hover:shadow-[0_0_25px_rgba(255,255,255,0.02)]">
      <div className="flex items-center gap-2 border-b border-neutral-900/80 pb-3 select-none">
        <Bell className="h-4 w-4 text-amber-400" />
        <h2
          className="text-[10px] font-bold text-neutral-300 uppercase tracking-widest"
          style={{ fontFamily: "var(--font-space-grotesk)" }}
        >
          Push Notifications (Pusher Beams)
        </h2>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="space-y-1 min-w-0">
          <p className="text-xs font-semibold text-neutral-200" style={{ fontFamily: "var(--font-space-grotesk)" }}>
            {displayState === "unsupported" && "Notifications Not Supported"}
            {displayState === "denied" && "Notifications Blocked"}
            {displayState === "default" && "Enable Notifications"}
            {displayState === "granted" && (pushSubscribed ? "Notifications Enabled" : "Enable Push Notifications")}
            {displayState === "loading" && "Loading..."}
          </p>
          <p className="text-[10px] text-neutral-500 leading-relaxed">
            {displayState === "unsupported" &&
              "Your browser does not support push notifications."}
            {displayState === "denied" && (
              <>
                You&apos;ve blocked notifications. To re-enable, open your browser&apos;s site settings
                and allow notifications for this site.
              </>
            )}
            {displayState === "default" &&
              "Get notified about new messages, likes, comments, and follows — even when this tab is closed."}
            {displayState === "granted" &&
              pushSubscribed &&
              "You'll receive push notifications on this device."}
            {displayState === "granted" &&
              !pushSubscribed &&
              "Notification permission granted. Click to subscribe to push notifications."}
          </p>
        </div>

        <div className="shrink-0">
          {displayState === "loading" && (
            <div className="h-9 w-9 flex items-center justify-center">
              <Loader2 className="h-4 w-4 animate-spin text-neutral-500" />
            </div>
          )}

          {displayState === "unsupported" && (
            <div className="h-9 w-9 flex items-center justify-center text-neutral-600">
              <BellOff className="h-4 w-4" />
            </div>
          )}

          {displayState === "denied" && (
            <div className="h-9 w-9 flex items-center justify-center text-red-400">
              <AlertTriangle className="h-4 w-4" />
            </div>
          )}

          {(displayState === "default" || (displayState === "granted" && !pushSubscribed)) && (
            <button
              type="button"
              onClick={handleEnable}
              disabled={isToggling || !userId}
              className="h-9 px-4 rounded-lg bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 text-xs font-bold
                         hover:bg-cyan-500/25 hover:border-cyan-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed
                         flex items-center gap-2"
              style={{ fontFamily: "var(--font-space-grotesk)" }}
            >
              {isToggling ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <BellRing className="h-3.5 w-3.5" />
              )}
              Enable
            </button>
          )}

          {displayState === "granted" && pushSubscribed && (
            <button
              type="button"
              onClick={handleDisable}
              disabled={isToggling || !userId}
              className="h-5 w-9 rounded-full transition-all relative shrink-0 bg-cyan-500 cursor-pointer disabled:opacity-50"
            >
              {isToggling ? (
                <Loader2 className="h-2.5 w-2.5 animate-spin absolute top-1.5 left-1/2 -translate-x-1/2 text-neutral-950" />
              ) : (
                <div className="h-3 w-3 bg-neutral-950 rounded-full absolute top-1 right-1 transition-all" />
              )}
            </button>
          )}
        </div>
      </div>

      {/* iOS notice */}
      {displayState !== "unsupported" && displayState !== "loading" && (
        <p className="text-[9px] text-neutral-600 leading-relaxed select-none">
          💡 On iOS, push notifications require adding Notexia to your home screen first (Safari → Share → Add to Home Screen).
        </p>
      )}
    </div>
  );
}
