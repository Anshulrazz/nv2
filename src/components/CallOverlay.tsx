"use client";

import React, { useEffect, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useCallStore } from "@/stores/callStore";
import Pusher from "pusher-js";
import { Phone, PhoneOff, Mic, MicOff, Video as VideoIcon, VideoOff, Loader2, User as UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import AgoraRTC, {
  AgoraRTCProvider,
  useLocalMicrophoneTrack,
  useLocalCameraTrack,
  usePublish,
  useJoin,
  useRemoteUsers,
  RemoteUser,
  LocalVideoTrack,
  useRTCClient
} from "agora-rtc-react";

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
  const isVisible = typeof document !== "undefined" && document.visibilityState === "visible";
  if (!isVisible && typeof window !== "undefined" && "Notification" in window) {
    if (Notification.permission === "granted") {
      try {
        new Notification(title, {
          body,
          tag,
          icon: "/logo.png",
          requireInteraction: true,
        });
      } catch (e) {
        console.warn("Failed to trigger native desktop notification:", e);
      }
    }
  }
};

const formatDuration = (secs: number) => {
  const m = Math.floor(secs / 60).toString().padStart(2, "0");
  const s = (secs % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
};

// ────────────────────────────────────────────────────────────────────────
// Agora Active Call Component
// ────────────────────────────────────────────────────────────────────────
function ActiveCall({ handleEndCall }: { handleEndCall: () => void }) {
  const { callType, callId, otherUser, isMuted, isVideoOff, toggleMute, toggleVideo, duration, setDuration } = useCallStore();
  
  // Create tracks
  const { localMicrophoneTrack } = useLocalMicrophoneTrack(!isMuted);
  const { localCameraTrack } = useLocalCameraTrack(callType === "video" && !isVideoOff);
  
  // Join channel (using the callId as channel name)
  const appId = process.env.NEXT_PUBLIC_AGORA_APP_ID || "";
  useJoin({ appid: appId, channel: callId || "", token: null }, true);
  
  // Publish tracks
  usePublish([
    ...(localMicrophoneTrack ? [localMicrophoneTrack] : []),
    ...(callType === "video" && localCameraTrack ? [localCameraTrack] : [])
  ]);

  const remoteUsers = useRemoteUsers();

  useEffect(() => {
    if (localMicrophoneTrack) {
      localMicrophoneTrack.setMuted(isMuted);
    }
  }, [isMuted, localMicrophoneTrack]);

  useEffect(() => {
    if (localCameraTrack) {
      localCameraTrack.setMuted(isVideoOff);
    }
  }, [isVideoOff, localCameraTrack]);

  useEffect(() => {
    const interval = setInterval(() => {
      setDuration((prev: number) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [setDuration]);

  return (
    <div className="w-full h-full max-w-4xl flex flex-col justify-between relative z-10">
      <div className="flex items-center justify-between p-4 border-b border-white/5 bg-neutral-900/40 rounded-t-2xl backdrop-blur-md">
        <div className="flex items-center gap-3">
          {otherUser?.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={otherUser.image} alt={otherUser.name} className="w-9 h-9 rounded-full object-cover border border-neutral-800" />
          ) : (
            <div className="w-9 h-9 rounded-full bg-neutral-950 border border-neutral-800 flex items-center justify-center text-neutral-500">
              <UserIcon className="w-4 h-4" />
            </div>
          )}
          <div>
            <h3 className="text-xs font-bold" style={{ fontFamily: "var(--font-space-grotesk)" }}>
              {otherUser?.name}
            </h3>
            <p className="text-[10px] text-cyan-400 font-mono mt-0.5">Connected • {formatDuration(duration)}</p>
          </div>
        </div>
        <div className="text-[9px] uppercase tracking-widest text-neutral-500 font-mono font-bold">
          {callType === "video" ? "Video Session" : "Voice Session"}
        </div>
      </div>

      <div className="flex-1 bg-neutral-950/60 border-x border-white/5 flex items-center justify-center relative min-h-0 overflow-hidden">
        {callType === "video" ? (
          <div className="w-full h-full relative flex items-center justify-center">
            {remoteUsers.length > 0 ? (
              <RemoteUser user={remoteUsers[0]} className="w-full h-full object-cover" playVideo={true} playAudio={true} />
            ) : (
              <div className="flex flex-col items-center gap-2 text-neutral-550">
                <Loader2 className="w-6 h-6 animate-spin text-cyan-400" />
                <span className="text-[10px] uppercase tracking-wider font-bold">Connecting video feed...</span>
              </div>
            )}

            <div className="absolute bottom-4 right-4 w-32 h-44 rounded-xl border border-white/10 bg-neutral-950 overflow-hidden shadow-2xl z-20">
              {!isVideoOff && localCameraTrack ? (
                <LocalVideoTrack track={localCameraTrack} play={true} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-neutral-900 text-neutral-600">
                  <VideoOff className="w-5 h-5" />
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center space-y-6">
            <div className="relative">
              <div className="absolute inset-0 rounded-full border border-cyan-500/20 animate-ping [animation-duration:2.5s]" />
              <div className="absolute inset-0 rounded-full border border-cyan-500/10 animate-ping [animation-duration:4s]" />
              {otherUser?.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={otherUser.image} alt={otherUser.name} className="w-28 h-28 rounded-full object-cover border-2 border-cyan-500/25 relative z-10" />
              ) : (
                <div className="w-28 h-28 rounded-full bg-neutral-900 border-2 border-cyan-500/20 flex items-center justify-center text-neutral-500 relative z-10">
                  <UserIcon className="w-10 h-10" />
                </div>
              )}
            </div>
            
            {/* Audio streams automatically play through useRemoteUsers hook */}
            {remoteUsers.map((u) => (
              <RemoteUser key={u.uid} user={u} playAudio={true} playVideo={false} className="hidden" />
            ))}

            <div className="flex items-center gap-1 h-8 justify-center">
              {[...Array(6)].map((_, i) => (
                <span
                  key={i}
                  className="w-1 rounded-full bg-cyan-400/60 animate-bounce"
                  style={{
                    height: `${Math.floor(Math.random() * 24) + 8}px`,
                    animationDelay: `${i * 0.15}s`,
                    animationDuration: "1s",
                  }}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-white/5 bg-neutral-900/40 rounded-b-2xl flex items-center justify-center gap-4 backdrop-blur-md">
        <Button onClick={toggleMute} variant="ghost" className={`w-11 h-11 rounded-xl flex items-center justify-center border transition-all ${isMuted ? "bg-red-500/15 border-red-500/30 text-red-400 hover:bg-red-500/25" : "bg-white/5 border-white/10 text-neutral-300 hover:bg-white/10"}`} size="icon">
          {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
        </Button>
        {callType === "video" && (
          <Button onClick={toggleVideo} variant="ghost" className={`w-11 h-11 rounded-xl flex items-center justify-center border transition-all ${isVideoOff ? "bg-red-500/15 border-red-500/30 text-red-400 hover:bg-red-500/25" : "bg-white/5 border-white/10 text-neutral-300 hover:bg-white/10"}`} size="icon">
            {isVideoOff ? <VideoOff className="h-4 w-4" /> : <VideoIcon className="h-4 w-4" />}
          </Button>
        )}
        <Button onClick={handleEndCall} className="w-11 h-11 rounded-xl bg-red-500 hover:bg-red-400 text-neutral-950 flex items-center justify-center transition-transform hover:scale-105 shadow-[0_0_15px_rgba(239,68,68,0.3)]" size="icon">
          <PhoneOff className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

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
      if (useCallStore.getState().callState === "calling") {
        showNativeCallNotification("Call Declined", `${otherUser?.name || "Someone"} declined your call.`, "declined-" + callId);
      }
      cleanUp();
      resetCall();
    });

    channel.bind("call-ended", () => {
      if (useCallStore.getState().callState === "incoming") {
        showNativeCallNotification("Missed Call", `Missed ${callType} call from ${otherUser?.name || "Someone"}`, "missed-" + callId);
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
    <div className="fixed inset-0 z-[99999] bg-neutral-950/80 backdrop-blur-xl flex flex-col items-center justify-center p-6 text-neutral-100 select-none animate-fade-in">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[140px] pointer-events-none" />

      {(callState === "calling" || callState === "incoming") && (
        <div className="flex flex-col items-center space-y-6 text-center max-w-sm z-10">
          <div className="relative">
            <div className="absolute inset-0 rounded-full border border-cyan-500/20 animate-ping [animation-duration:2.5s]" />
            <div className="absolute inset-0 rounded-full border border-cyan-500/10 animate-ping [animation-duration:4s]" />
            {otherUser?.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={otherUser.image} alt={otherUser.name} className="w-28 h-28 rounded-full object-cover border-2 border-cyan-500/25 relative z-10" />
            ) : (
              <div className="w-28 h-28 rounded-full bg-neutral-900 border-2 border-cyan-500/20 flex items-center justify-center text-neutral-500 relative z-10">
                <UserIcon className="w-10 h-10" />
              </div>
            )}
          </div>
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight mb-2" style={{ fontFamily: "var(--font-space-grotesk)" }}>
              {otherUser?.name}
            </h2>
            <p className="text-sm text-cyan-400 font-mono tracking-widest uppercase">
              {callState === "calling" ? `Calling...` : `Incoming ${callType} call`}
            </p>
          </div>
          <div className="flex items-center gap-6 pt-4">
            {callState === "incoming" ? (
              <>
                <Button onClick={handleAcceptCall} className="w-12 h-12 rounded-full bg-green-500 hover:bg-green-400 text-neutral-950 flex items-center justify-center transition-transform hover:scale-105 shadow-[0_0_15px_rgba(34,197,94,0.4)]" size="icon">
                  <Phone className="h-5 w-5" />
                </Button>
                <Button onClick={handleDeclineCall} className="w-12 h-12 rounded-full bg-red-500 hover:bg-red-400 text-neutral-950 flex items-center justify-center transition-transform hover:scale-105 shadow-[0_0_15px_rgba(239,68,68,0.4)]" size="icon">
                  <PhoneOff className="h-5 w-5" />
                </Button>
              </>
            ) : (
              <Button onClick={handleEndCall} className="w-12 h-12 rounded-full bg-red-500 hover:bg-red-400 text-neutral-950 flex items-center justify-center transition-transform hover:scale-105 shadow-[0_0_15px_rgba(239,68,68,0.4)]" size="icon">
                <PhoneOff className="h-5 w-5" />
              </Button>
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
  const client = useRTCClient(AgoraRTC.createClient({ codec: "vp8", mode: "rtc" }));
  return (
    <AgoraRTCProvider client={client}>
      <ActiveCall handleEndCall={handleEndCall} />
    </AgoraRTCProvider>
  );
}
