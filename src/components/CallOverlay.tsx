"use client";

import React, { useEffect, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useCallStore } from "@/stores/callStore";
import Pusher from "pusher-js";
import { Phone, PhoneOff, PhoneMissed, User as UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ZegoUIKitPrebuilt } from "@zegocloud/zego-uikit-prebuilt";
import { toast } from "sonner";

// ────────────────────────────────────────────────────────────────────────
// Web Audio API Ringtone & Ring-back Tone Synthesizer
// ────────────────────────────────────────────────────────────────────────
class AudioSynthesizer {
  private ctx: AudioContext | null = null;
  private interval: NodeJS.Timeout | null = null;

  startRinging() {
    this.stop();
    const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    this.ctx = new AudioContextClass();

    const playBeep = () => {
      if (!this.ctx || this.ctx.state === "closed") return;
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gainNode = this.ctx.createGain();

      osc1.frequency.value = 440;
      osc2.frequency.value = 480;
      gainNode.gain.setValueAtTime(0, this.ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.08, this.ctx.currentTime + 0.1);
      gainNode.gain.setValueAtTime(0.08, this.ctx.currentTime + 1.8);
      gainNode.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 1.9);

      osc1.connect(gainNode);
      osc2.connect(gainNode);
      gainNode.connect(this.ctx.destination);

      osc1.start();
      osc2.start();
      osc1.stop(this.ctx.currentTime + 1.9);
      osc2.stop(this.ctx.currentTime + 1.9);
    };

    if (this.ctx.state === "suspended") {
      this.ctx.resume().catch((e) => console.warn("AudioContext resume failed:", e));
    }
    playBeep();
    this.interval = setInterval(playBeep, 4000);
  }

  startIncoming() {
    this.stop();
    const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    this.ctx = new AudioContextClass();

    const playMelody = () => {
      if (!this.ctx || this.ctx.state === "closed") return;
      const now = this.ctx.currentTime;
      const notes = [659.25, 783.99, 659.25, 783.99, 880, 783.99, 880, 987.77];
      notes.forEach((freq, idx) => {
        if (!this.ctx || this.ctx.state === "closed") return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.frequency.value = freq;
        osc.type = "sine";

        const start = now + idx * 0.18;
        const end = start + 0.15;

        gain.gain.setValueAtTime(0, start);
        gain.gain.linearRampToValueAtTime(0.06, start + 0.02);
        gain.gain.setValueAtTime(0.06, end - 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, end);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(start);
        osc.stop(end);
      });
    };

    if (this.ctx.state === "suspended") {
      this.ctx.resume().catch((e) => console.warn("AudioContext resume failed:", e));
    }
    playMelody();
    this.interval = setInterval(playMelody, 3000);
  }

  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    if (this.ctx) {
      if (this.ctx.state !== "closed") {
        this.ctx.close();
      }
      this.ctx = null;
    }
  }
}

const showNativeCallNotification = (title: string, body: string, tag: string) => {
  if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
    try {
      new Notification(title, { body, tag, icon: "/logo.png", requireInteraction: true });
    } catch (e) {
      console.warn("Failed to trigger native desktop notification:", e);
    }
  }
};

const showMissedCallToast = (callerName: string, callType: string, callerImage?: string) => {
  toast.custom(() => (
    <div className="flex items-center gap-3 bg-neutral-900 border border-neutral-700 rounded-xl px-4 py-3 shadow-2xl min-w-[260px]">
      <div className="relative flex-shrink-0">
        {callerImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={callerImage} alt={callerName} className="w-10 h-10 rounded-full object-cover border border-neutral-700" />
        ) : (
          <div className="w-10 h-10 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center text-neutral-400">
            <UserIcon className="w-4 h-4" />
          </div>
        )}
        <span className="absolute -bottom-0.5 -right-0.5 bg-red-500 rounded-full w-4 h-4 flex items-center justify-center">
          <PhoneMissed className="w-2.5 h-2.5 text-white" />
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold text-neutral-100 truncate">Missed {callType} call</p>
        <p className="text-[11px] text-neutral-400 truncate">{callerName}</p>
      </div>
    </div>
  ), { duration: 6000, position: "top-right" });
};

const showDeclinedCallToast = (otherName: string) => {
  toast.custom(() => (
    <div className="flex items-center gap-3 bg-neutral-900 border border-neutral-700 rounded-xl px-4 py-3 shadow-2xl min-w-[260px]">
      <div className="w-10 h-10 rounded-full bg-red-500/15 border border-red-500/30 flex items-center justify-center flex-shrink-0">
        <PhoneMissed className="w-4 h-4 text-red-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold text-neutral-100">Call Declined</p>
        <p className="text-[11px] text-neutral-400 truncate">{otherName} declined your call</p>
      </div>
    </div>
  ), { duration: 5000, position: "top-right" });
};

const showCallEndedToast = (callType: string, duration: number) => {
  const m = Math.floor(duration / 60).toString().padStart(2, "0");
  const s = (duration % 60).toString().padStart(2, "0");
  const formatted = `${m}:${s}`;
  toast.custom(() => (
    <div className="flex items-center gap-3 bg-neutral-900 border border-neutral-700 rounded-xl px-4 py-3 shadow-2xl min-w-[260px]">
      <div className="w-10 h-10 rounded-full bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center flex-shrink-0">
        <PhoneOff className="w-4 h-4 text-cyan-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold text-neutral-100">{callType === "video" ? "Video" : "Voice"} Call Ended</p>
        <p className="text-[11px] text-cyan-400 font-mono">Duration: {formatted}</p>
      </div>
    </div>
  ), { duration: 5000, position: "top-right" });
};

const formatDuration = (secs: number) => {
  const m = Math.floor(secs / 60).toString().padStart(2, "0");
  const s = (secs % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
};

// ────────────────────────────────────────────────────────────────────────
// Main Overlay (Handles Pusher Ringing / Idle states)
// ────────────────────────────────────────────────────────────────────────
export function CallOverlay() {
  const { data: session } = useSession();
  const currentUserId = session?.user?.id;

  const { callState, callType, callId, otherUser, receiveCall, acceptCall, setConnected, resetCall } = useCallStore();

  const isCallerRef = useRef<boolean>(false);
  const synthRef = useRef<AudioSynthesizer | null>(null);
  const ringTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pusherRef = useRef<Pusher | null>(null);

  useEffect(() => {
    synthRef.current = new AudioSynthesizer();
    return () => synthRef.current?.stop();
  }, []);

  const sendSignal = useCallback(async (action: string, logParams?: { saveLog: boolean; logContent: string; logSenderId: string; logReceiverId: string }) => {
    if (!otherUser?.id || !callId) return;
    try {
      await fetch("/api/messages/call/signal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          receiverId: otherUser.id,
          action,
          callId,
          callType,
          ...logParams,
        }),
      });
    } catch (err) {
      console.error("[CallOverlay] Signaling error:", err);
    }
  }, [otherUser?.id, callId, callType]);

  const cleanUp = useCallback(() => {
    synthRef.current?.stop();
    if (ringTimeoutRef.current) clearTimeout(ringTimeoutRef.current);
  }, []);

  // Outgoing calls start
  useEffect(() => {
    if (callState !== "calling" || !otherUser?.id || !callId) return;
    isCallerRef.current = true;
    synthRef.current?.startRinging();

    const startCall = async () => {
      await sendSignal("incoming-call");
      ringTimeoutRef.current = setTimeout(() => {
        sendSignal("call-ended", {
          saveLog: true, logContent: `📞 Missed ${callType} call`, logSenderId: currentUserId!, logReceiverId: otherUser.id,
        });
        cleanUp();
        resetCall();
      }, 35000);
    };
    startCall();

    return () => cleanUp();
  }, [callState, otherUser?.id, callId, callType, currentUserId, sendSignal, cleanUp, resetCall]);

  const handleAcceptCall = async () => {
    cleanUp();
    setConnected();
    await sendSignal("call-accepted");
    acceptCall();
  };

  const handleDeclineCall = () => {
    sendSignal("call-rejected", { saveLog: true, logContent: `📞 Missed ${callType} call`, logSenderId: otherUser!.id, logReceiverId: currentUserId! });
    cleanUp();
    resetCall();
  };

  const handleEndCall = () => {
    const isCallActive = callState === "connected";
    const formattedDuration = formatDuration(useCallStore.getState().duration);
    const callerId = isCallerRef.current ? currentUserId! : otherUser!.id;
    const receiverId = isCallerRef.current ? otherUser!.id : currentUserId!;
    const logContent = isCallActive ? `📞 ${callType === "video" ? "Video" : "Voice"} call (${formattedDuration})` : `📞 Missed ${callType} call`;

    sendSignal(isCallActive ? "call-ended" : "call-rejected", { saveLog: true, logContent, logSenderId: callerId, logReceiverId: receiverId });
    cleanUp();
    resetCall();
  };

  useEffect(() => {
    if (!currentUserId) return;
    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY || "", { cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || "" });
    pusherRef.current = pusher;
    const channelName = `user-${currentUserId}`;
    const channel = pusher.subscribe(channelName);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    channel.bind("incoming-call", (data: any) => {
      if (useCallStore.getState().callState !== "idle") {
        fetch("/api/messages/call/signal", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ receiverId: data.callerId, action: "call-rejected", callId: data.callId, callType: data.callType }),
        });
        return;
      }
      isCallerRef.current = false;
      receiveCall({ id: data.callerId, name: data.callerName, image: data.callerImage }, data.callType, data.callId);
      showNativeCallNotification("Incoming Call", `Incoming ${data.callType} call from ${data.callerName}`, "incoming-" + data.callId);
      synthRef.current?.startIncoming();
      
      ringTimeoutRef.current = setTimeout(() => { cleanUp(); resetCall(); }, 35000);
    });

    channel.bind("call-accepted", () => {
      synthRef.current?.stop();
      if (ringTimeoutRef.current) clearTimeout(ringTimeoutRef.current);
      setConnected();
    });

    channel.bind("call-rejected", () => {
      const state = useCallStore.getState();
      if (state.callState === "calling") {
        const name = state.otherUser?.name || "Someone";
        showNativeCallNotification("Call Declined", `${name} declined your call.`, "declined-" + callId);
        showDeclinedCallToast(name);
      }
      cleanUp();
      resetCall();
    });

    channel.bind("call-ended", () => {
      const state = useCallStore.getState();
      if (state.callState === "incoming") {
        const name = state.otherUser?.name || "Someone";
        const type = state.callType;
        const img = state.otherUser?.image;
        showNativeCallNotification("Missed Call", `Missed ${type} call from ${name}`, "missed-" + callId);
        showMissedCallToast(name, type, img);
      } else if (state.callState === "connected") {
        showCallEndedToast(state.callType, state.duration);
      }
      cleanUp();
      resetCall();
    });

    return () => {
      channel.unbind_all();
      pusher.unsubscribe(channelName);
      pusher.disconnect();
    };
  }, [currentUserId, callId, otherUser, callType, receiveCall, resetCall, sendSignal, setConnected, cleanUp]);

  if (callState === "idle") return null;

  return (
    <div className="fixed inset-0 z-[99999] bg-neutral-950/90 backdrop-blur-xl flex flex-col items-center justify-center text-neutral-100 select-none animate-fade-in overflow-hidden">
      {/* Background glow — scaled for mobile */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[250px] h-[250px] sm:w-[400px] sm:h-[400px] md:w-[500px] md:h-[500px] bg-cyan-500/10 rounded-full blur-[100px] sm:blur-[140px] pointer-events-none" />

      {(callState === "calling" || callState === "incoming") && (
        <div className="flex flex-col items-center space-y-5 sm:space-y-6 text-center px-6 w-full max-w-xs sm:max-w-sm z-10">
          {/* Avatar with pulsing rings */}
          <div className="relative flex-shrink-0">
            <div className="absolute inset-0 rounded-full border border-cyan-500/20 animate-ping [animation-duration:2.5s]" />
            <div className="absolute inset-0 rounded-full border border-cyan-500/10 animate-ping [animation-duration:4s]" />
            {otherUser?.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={otherUser.image}
                alt={otherUser.name}
                className="w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover border-2 border-cyan-500/25 relative z-10"
              />
            ) : (
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-neutral-900 border-2 border-cyan-500/20 flex items-center justify-center text-neutral-500 relative z-10">
                <UserIcon className="w-8 h-8 sm:w-10 sm:h-10" />
              </div>
            )}
          </div>

          <div>
            <h2
              className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-2 truncate max-w-[200px] sm:max-w-none"
              style={{ fontFamily: "var(--font-space-grotesk)" }}
            >
              {otherUser?.name}
            </h2>
            <p className="text-xs sm:text-sm text-cyan-400 font-mono tracking-widest uppercase">
              {callState === "calling" ? "Calling..." : `Incoming ${callType} call`}
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-8 sm:gap-10 pt-2">
            {callState === "incoming" ? (
              <>
                <div className="flex flex-col items-center gap-2">
                  <Button
                    onClick={handleAcceptCall}
                    className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-green-500 hover:bg-green-400 text-neutral-950 flex items-center justify-center transition-transform hover:scale-105 shadow-[0_0_20px_rgba(34,197,94,0.5)]"
                    size="icon"
                  >
                    <Phone className="h-5 w-5 sm:h-6 sm:h-6" />
                  </Button>
                  <span className="text-[10px] text-neutral-400 font-mono uppercase tracking-widest">Accept</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <Button
                    onClick={handleDeclineCall}
                    className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-red-500 hover:bg-red-400 text-neutral-950 flex items-center justify-center transition-transform hover:scale-105 shadow-[0_0_20px_rgba(239,68,68,0.5)]"
                    size="icon"
                  >
                    <PhoneOff className="h-5 w-5 sm:h-6 sm:h-6" />
                  </Button>
                  <span className="text-[10px] text-neutral-400 font-mono uppercase tracking-widest">Decline</span>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <Button
                  onClick={handleEndCall}
                  className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-red-500 hover:bg-red-400 text-neutral-950 flex items-center justify-center transition-transform hover:scale-105 shadow-[0_0_20px_rgba(239,68,68,0.5)]"
                  size="icon"
                >
                  <PhoneOff className="h-5 w-5 sm:h-6 sm:h-6" />
                </Button>
                <span className="text-[10px] text-neutral-400 font-mono uppercase tracking-widest">Cancel</span>
              </div>
            )}
          </div>
        </div>
      )}

      {callState === "connected" && (
        <ActiveCallProvider handleEndCall={handleEndCall} />
      )}
    </div>
  );
}


function ActiveCallProvider({ handleEndCall }: { handleEndCall: () => void }) {
  const { data: session, status } = useSession();
  const { callType, callId, setDuration } = useCallStore();

  const containerRef = useRef<HTMLDivElement>(null);
  const zpRef = useRef<ReturnType<typeof ZegoUIKitPrebuilt.create> | null>(null);
  const hasJoinedRef = useRef(false);
  const endCallRef = useRef(handleEndCall);

  // Keep endCallRef up-to-date without triggering re-renders
  useEffect(() => {
    endCallRef.current = handleEndCall;
  }, [handleEndCall]);

  // Duration timer — increments callStore.duration every second while connected
  useEffect(() => {
    setDuration(0);
    const timer = setInterval(() => {
      setDuration((prev: number) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // Wait until session is loaded and we have all required values
    if (status !== "authenticated" || !session?.user?.id || !callId) return;
    // Guard against double-init (React Strict Mode / fast refresh)
    if (hasJoinedRef.current || zpRef.current) return;
    const element = containerRef.current;
    if (!element) return;

    const appID = parseInt(process.env.NEXT_PUBLIC_ZEGO_APP_ID || "0");
    const serverSecret = process.env.NEXT_PUBLIC_ZEGO_SERVER_SECRET || "";
    if (!appID || !serverSecret) {
      console.error("[Zego] App ID or Server Secret is missing from .env");
      return;
    }

    hasJoinedRef.current = true;
    console.log("[Zego] Joining room:", callId, "as", session.user.id, "type:", callType);

    const kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(
      appID,
      serverSecret,
      callId,
      session.user.id,
      session.user.name || "User"
    );

    const zp = ZegoUIKitPrebuilt.create(kitToken);
    zpRef.current = zp;

    // Both voice and video are 1-on-1 calls — always use OneONoneCall
    zp.joinRoom({
      container: element,
      scenario: {
        mode: ZegoUIKitPrebuilt.OneONoneCall,
      },
      turnOnCameraWhenJoining: callType === "video",
      turnOnMicrophoneWhenJoining: true,
      showMyCameraToggleButton: callType === "video",
      showPreJoinView: false,
      onLeaveRoom: () => {
        endCallRef.current();
      },
    });

    return () => {
      if (zpRef.current && typeof zpRef.current.destroy === "function") {
        zpRef.current.destroy();
        zpRef.current = null;
      }
      // NOTE: hasJoinedRef is intentionally NOT reset here.
      // React Strict Mode runs cleanup + re-run on every mount.
      // If we reset it, the second run re-initializes ZegoCloud on a
      // partially-destroyed SDK instance → "Cannot set properties of null".
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, session?.user?.id, callId]);

  return (
    <div className="w-full h-full sm:max-w-5xl relative z-10 shadow-2xl overflow-hidden sm:rounded-2xl bg-black">
      <div className="w-full h-full" ref={containerRef} />
    </div>
  );
}
