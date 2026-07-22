"use client";

import React, { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { useCallStore, CallType, CallUser } from "@/stores/callStore";
import Pusher from "pusher-js";
import { Phone, PhoneOff, Mic, MicOff, Video, VideoOff, Loader2, User as UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

const peerConnectionConfig = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
  ],
};

// ────────────────────────────────────────────────────────────────────────
// Web Audio API Ringtone & Ring-back Tone Synthesizer
// ────────────────────────────────────────────────────────────────────────
class AudioSynthesizer {
  private ctx: AudioContext | null = null;
  private interval: NodeJS.Timeout | null = null;

  startRinging() {
    // Caller Ring-back tone (US standard style: 440Hz + 480Hz dual frequency)
    this.stop();
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
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

    // Attempt to resume audio context if suspended (browser security)
    if (this.ctx.state === "suspended") {
      this.ctx.resume().catch((e) => console.warn("AudioContext resume failed:", e));
    }
    playBeep();
    this.interval = setInterval(playBeep, 4000); // 2s ring, 2s silent interval
  }

  startIncoming() {
    // Incoming ringtone melody: Alternate pitch clean electronic loop
    this.stop();
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    this.ctx = new AudioContextClass();

    const playMelody = () => {
      if (!this.ctx || this.ctx.state === "closed") return;
      const now = this.ctx.currentTime;
      // High pitch sweet retro digital pattern
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

// ────────────────────────────────────────────────────────────────────────
// Native Browser Desktop Notification Helper
// ────────────────────────────────────────────────────────────────────────
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

export function CallOverlay() {
  const { data: session } = useSession();
  const currentUserId = session?.user?.id;

  const {
    callState,
    callType,
    callId,
    otherUser,
    isMuted,
    isVideoOff,
    duration,
    receiveCall,
    acceptCall,
    rejectCall,
    endCall,
    setConnected,
    setDuration,
    toggleMute,
    toggleVideo,
    resetCall,
  } = useCallStore();

  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);

  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);

  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const pusherRef = useRef<Pusher | null>(null);
  const ringTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Track who initiated the call to accurately set senderId / receiverId in logs
  const isCallerRef = useRef<boolean>(false);
  const synthRef = useRef<AudioSynthesizer | null>(null);

  // Initialize synthesizer
  useEffect(() => {
    synthRef.current = new AudioSynthesizer();
    return () => {
      synthRef.current?.stop();
    };
  }, []);

  // Format MM:SS duration helper
  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  // ────────────────────────────────────────────────────────────────────────
  // 1. Signaling & Database Logging Helper
  // ────────────────────────────────────────────────────────────────────────
  const sendSignal = async (
    action: string,
    signalData?: any,
    logParams?: { saveLog: boolean; logContent: string; logSenderId: string; logReceiverId: string }
  ) => {
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
          signalData,
          ...logParams,
        }),
      });
    } catch (err) {
      console.error("[CallOverlay] Signaling error:", err);
    }
  };

  // ────────────────────────────────────────────────────────────────────────
  // 2. WebRTC Resource Cleanup
  // ────────────────────────────────────────────────────────────────────────
  const cleanUpWebRTC = () => {
    console.log("[CallOverlay] Cleaning up WebRTC streams and connection.");
    synthRef.current?.stop();

    if (ringTimeoutRef.current) {
      clearTimeout(ringTimeoutRef.current);
      ringTimeoutRef.current = null;
    }

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }
    setLocalStream(null);
    setRemoteStream(null);

    if (peerConnectionRef.current) {
      peerConnectionRef.current.ontrack = null;
      peerConnectionRef.current.onicecandidate = null;
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
  };

  // ────────────────────────────────────────────────────────────────────────
  // 3. Setup RTCPeerConnection and Streams
  // ────────────────────────────────────────────────────────────────────────
  const initPeerConnection = (stream: MediaStream) => {
    console.log("[CallOverlay] Initializing RTCPeerConnection.");
    const pc = new RTCPeerConnection(peerConnectionConfig);
    peerConnectionRef.current = pc;

    // Add local tracks
    stream.getTracks().forEach((track) => {
      pc.addTrack(track, stream);
    });

    // Handle remote tracks
    pc.ontrack = (event) => {
      console.log("[CallOverlay] Received remote track.");
      if (event.streams && event.streams[0]) {
        setRemoteStream(event.streams[0]);
      }
    };

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        console.log("[CallOverlay] Sending ICE candidate.");
        sendSignal("webrtc-signal", { candidate: event.candidate });
      }
    };

    return pc;
  };

  // ────────────────────────────────────────────────────────────────────────
  // 4. Initiating Call Flow (User A - Caller)
  // ────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (callState !== "calling" || !otherUser?.id || !callId) return;

    isCallerRef.current = true;
    synthRef.current?.startRinging();

    const startCall = async () => {
      console.log("[CallOverlay] Starting outgoing call.");
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: callType === "video",
        });
        localStreamRef.current = stream;
        setLocalStream(stream);

        // Notify Receiver
        await sendSignal("incoming-call");

        // Set No Answer Timeout (35 seconds)
        ringTimeoutRef.current = setTimeout(() => {
          console.log("[CallOverlay] No response from receiver. Ending call.");
          // Caller timed out, log as missed call
          sendSignal("call-ended", null, {
            saveLog: true,
            logContent: `📞 Missed ${callType} call`,
            logSenderId: currentUserId!,
            logReceiverId: otherUser.id,
          });
          cleanUpWebRTC();
          resetCall();
        }, 35000);
      } catch (err) {
        console.error("[CallOverlay] Failed to acquire media devices:", err);
        alert("Could not access camera/microphone. Check permissions.");
        resetCall();
      }
    };

    startCall();
    return () => {
      if (callState === "calling") cleanUpWebRTC();
    };
  }, [callState]);

  // ────────────────────────────────────────────────────────────────────────
  // 5. Accepting & Declining Call Flow (User B - Receiver)
  // ────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (callState === "incoming") {
      synthRef.current?.startIncoming();
    }
  }, [callState]);

  const handleAcceptCall = async () => {
    if (callState !== "incoming" || !otherUser?.id || !callId) return;

    if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "default") {
      Notification.requestPermission().catch(() => {});
    }

    synthRef.current?.stop();
    if (ringTimeoutRef.current) {
      clearTimeout(ringTimeoutRef.current);
      ringTimeoutRef.current = null;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: callType === "video",
      });
      localStreamRef.current = stream;
      setLocalStream(stream);

      const pc = initPeerConnection(stream);
      await sendSignal("call-accepted");
      acceptCall(); // Update store state to connected
    } catch (err) {
      console.error("[CallOverlay] Accept call media capture error:", err);
      alert("Could not access camera/microphone to accept call.");
      handleDeclineCall();
    }
  };

  const handleDeclineCall = () => {
    if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "default") {
      Notification.requestPermission().catch(() => {});
    }
    console.log("[CallOverlay] Call declined by local receiver.");
    // Receiver declines, log as missed call immediately
    sendSignal("call-rejected", null, {
      saveLog: true,
      logContent: `📞 Missed ${callType} call`,
      logSenderId: otherUser!.id,
      logReceiverId: currentUserId!,
    });
    cleanUpWebRTC();
    resetCall();
  };

  const handleEndCall = () => {
    console.log("[CallOverlay] Call ended by local user.");
    const isCallActive = callState === "connected";
    const formattedDuration = formatDuration(useCallStore.getState().duration);
    
    // Caller is logSenderId, recipient is logReceiverId
    const callerId = isCallerRef.current ? currentUserId! : otherUser!.id;
    const receiverId = isCallerRef.current ? otherUser!.id : currentUserId!;

    const logContent = isCallActive
      ? `📞 ${callType === "video" ? "Video" : "Voice"} call (${formattedDuration})`
      : `📞 Missed ${callType} call`;

    sendSignal(isCallActive ? "call-ended" : "call-rejected", null, {
      saveLog: true,
      logContent,
      logSenderId: callerId,
      logReceiverId: receiverId,
    });

    cleanUpWebRTC();
    resetCall();
  };

  // ────────────────────────────────────────────────────────────────────────
  // 6. Global Pusher Subscription & Signaling Listeners
  // ────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!currentUserId) return;

    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY || "", {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || "",
    });
    pusherRef.current = pusher;

    const channelName = `user-${currentUserId}`;
    const channel = pusher.subscribe(channelName);

    // BIND EVENT: incoming-call (For User B)
    channel.bind("incoming-call", (data: any) => {
      console.log("[CallOverlay] Incoming call event received:", data);
      if (useCallStore.getState().callState !== "idle") {
        console.log("[CallOverlay] Busy. Rejecting incoming call.");
        fetch("/api/messages/call/signal", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            receiverId: data.callerId,
            action: "call-rejected",
            callId: data.callId,
            callType: data.callType,
          }),
        });
        return;
      }

      isCallerRef.current = false;
      receiveCall(
        { id: data.callerId, name: data.callerName, image: data.callerImage },
        data.callType,
        data.callId
      );

      // Trigger desktop native alert
      showNativeCallNotification(
        "Incoming Call",
        `Incoming ${data.callType} call from ${data.callerName}`,
        "incoming-" + data.callId
      );

      // Set auto-expire if not accepted
      ringTimeoutRef.current = setTimeout(() => {
        console.log("[CallOverlay] Incoming call ring timeout.");
        cleanUpWebRTC();
        resetCall();
      }, 35000);
    });

    // BIND EVENT: call-accepted (For User A)
    channel.bind("call-accepted", async (data: any) => {
      console.log("[CallOverlay] Call accepted by receiver.");
      synthRef.current?.stop();
      if (ringTimeoutRef.current) {
        clearTimeout(ringTimeoutRef.current);
        ringTimeoutRef.current = null;
      }

      setConnected(); // Updates state to connected

      const stream = localStreamRef.current;
      if (!stream) return;

      const pc = initPeerConnection(stream);

      // Create Offer
      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        console.log("[CallOverlay] Sending SDP offer.");
        sendSignal("webrtc-signal", { sdp: offer });
      } catch (err) {
        console.error("[CallOverlay] Offer creation failed:", err);
      }
    });

    // BIND EVENT: call-rejected (User B declined or busy)
    channel.bind("call-rejected", () => {
      console.log("[CallOverlay] Call was rejected / busy.");
      const state = useCallStore.getState().callState;
      if (state === "calling") {
        showNativeCallNotification(
          "Call Declined",
          `${otherUser?.name || "Someone"} declined your call.`,
          "declined-" + callId
        );
      }
      cleanUpWebRTC();
      resetCall();
    });

    // BIND EVENT: call-ended
    channel.bind("call-ended", () => {
      console.log("[CallOverlay] Call was ended by other user.");
      const state = useCallStore.getState().callState;
      if (state === "incoming") {
        // Show missed call desktop notification
        showNativeCallNotification(
          "Missed Call",
          `Missed ${callType} call from ${otherUser?.name || "Someone"}`,
          "missed-" + callId
        );
      }
      cleanUpWebRTC();
      resetCall();
    });

    // BIND EVENT: webrtc-signal
    channel.bind("webrtc-signal", async (data: any) => {
      const pc = peerConnectionRef.current;
      if (!pc) return;

      const { sdp, candidate } = data.signalData || {};

      try {
        if (sdp) {
          console.log("[CallOverlay] Received remote SDP:", sdp.type);
          await pc.setRemoteDescription(new RTCSessionDescription(sdp));

          if (sdp.type === "offer") {
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            console.log("[CallOverlay] Sending SDP answer.");
            sendSignal("webrtc-signal", { answer });
          }
        } else if (candidate) {
          console.log("[CallOverlay] Received remote ICE candidate.");
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        }
      } catch (err) {
        console.error("[CallOverlay] Error processing WebRTC signal:", err);
      }
    });

    return () => {
      channel.unbind_all();
      pusher.unsubscribe(channelName);
      pusher.disconnect();
    };
  }, [currentUserId, callId, otherUser?.id]);

  // ────────────────────────────────────────────────────────────────────────
  // 7. Track Mutex & Camera Toggles
  // ────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = !isMuted;
      });
    }
  }, [isMuted]);

  useEffect(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach((track) => {
        track.enabled = !isVideoOff;
      });
    }
  }, [isVideoOff]);

  // Link Video Stream DOM References
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream, callState]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream, callState]);

  // ────────────────────────────────────────────────────────────────────────
  // 8. Duration Counter
  // ────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (callState !== "connected") return;
    const interval = setInterval(() => {
      setDuration((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [callState]);

  if (callState === "idle") return null;

  return (
    <div className="fixed inset-0 z-[99999] bg-neutral-950/80 backdrop-blur-xl flex flex-col items-center justify-center p-6 text-neutral-100 select-none animate-fade-in">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Outgoing & Incoming State Layout */}
      {(callState === "calling" || callState === "incoming") && (
        <div className="flex flex-col items-center space-y-6 text-center max-w-sm z-10">
          {/* Avatar Container with pulse glow */}
          <div className="relative">
            <div className="absolute -inset-1 rounded-full bg-cyan-500/20 blur-md animate-pulse" />
            {otherUser?.image ? (
              <img
                src={otherUser.image}
                alt={otherUser.name}
                className="w-24 h-24 rounded-full object-cover border-2 border-cyan-500/30 shadow-2xl relative z-10"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-neutral-900 border-2 border-cyan-500/20 flex items-center justify-center text-neutral-500 relative z-10">
                <UserIcon className="w-10 h-10" />
              </div>
            )}
          </div>

          <div>
            <h2 className="text-xl font-bold tracking-tight" style={{ fontFamily: "var(--font-space-grotesk)" }}>
              {otherUser?.name}
            </h2>
            <p className="text-xs text-neutral-500 mt-1 uppercase font-semibold tracking-wider font-mono">
              {callState === "calling" ? `Ringing for ${callType} call...` : `Incoming ${callType} call...`}
            </p>
          </div>

          {/* Action Row */}
          <div className="flex items-center gap-6 pt-4">
            {callState === "incoming" ? (
              <>
                <Button
                  onClick={handleAcceptCall}
                  className="w-12 h-12 rounded-full bg-green-500 hover:bg-green-400 text-neutral-950 flex items-center justify-center transition-transform hover:scale-105 shadow-[0_0_15px_rgba(34,197,94,0.4)]"
                  size="icon"
                >
                  <Phone className="h-5 w-5" />
                </Button>
                <Button
                  onClick={handleDeclineCall}
                  className="w-12 h-12 rounded-full bg-red-500 hover:bg-red-400 text-neutral-950 flex items-center justify-center transition-transform hover:scale-105 shadow-[0_0_15px_rgba(239,68,68,0.4)]"
                  size="icon"
                >
                  <PhoneOff className="h-5 w-5" />
                </Button>
              </>
            ) : (
              <Button
                onClick={handleEndCall}
                className="w-12 h-12 rounded-full bg-red-500 hover:bg-red-400 text-neutral-950 flex items-center justify-center transition-transform hover:scale-105 shadow-[0_0_15px_rgba(239,68,68,0.4)]"
                size="icon"
              >
                <PhoneOff className="h-5 w-5" />
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Connected Active Call Layout */}
      {callState === "connected" && (
        <div className="w-full h-full max-w-4xl flex flex-col justify-between relative z-10">
          {/* Header metadata */}
          <div className="flex items-center justify-between p-4 border-b border-white/5 bg-neutral-900/40 rounded-t-2xl backdrop-blur-md">
            <div className="flex items-center gap-3">
              {otherUser?.image ? (
                <img
                  src={otherUser.image}
                  alt={otherUser.name}
                  className="w-9 h-9 rounded-full object-cover border border-neutral-800"
                />
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

          {/* Media Viewport */}
          <div className="flex-1 bg-neutral-950/60 border-x border-white/5 flex items-center justify-center relative min-h-0 overflow-hidden">
            {callType === "video" ? (
              <div className="w-full h-full relative flex items-center justify-center">
                {/* Remote Stream Video - Full Container */}
                {remoteStream ? (
                  <video
                    ref={remoteVideoRef}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-2 text-neutral-550">
                    <Loader2 className="w-6 h-6 animate-spin text-cyan-400" />
                    <span className="text-[10px] uppercase tracking-wider font-bold">Connecting video feed...</span>
                  </div>
                )}

                {/* Local Stream Video - Pip Window */}
                <div className="absolute bottom-4 right-4 w-32 h-44 rounded-xl border border-white/10 bg-neutral-950 overflow-hidden shadow-2xl z-20">
                  {!isVideoOff && localStream ? (
                    <video
                      ref={localVideoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-neutral-900 text-neutral-600">
                      <VideoOff className="w-5 h-5" />
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* Voice Call Visualization */
              <div className="flex flex-col items-center space-y-6">
                <div className="relative">
                  {/* CSS waveform circle pulses */}
                  <div className="absolute inset-0 rounded-full border border-cyan-500/20 animate-ping [animation-duration:2.5s]" />
                  <div className="absolute inset-0 rounded-full border border-cyan-500/10 animate-ping [animation-duration:4s]" />
                  {otherUser?.image ? (
                    <img
                      src={otherUser.image}
                      alt={otherUser.name}
                      className="w-28 h-28 rounded-full object-cover border-2 border-cyan-500/25 relative z-10"
                    />
                  ) : (
                    <div className="w-28 h-28 rounded-full bg-neutral-900 border-2 border-cyan-500/20 flex items-center justify-center text-neutral-500 relative z-10">
                      <UserIcon className="w-10 h-10" />
                    </div>
                  )}
                </div>

                {/* Hidden Audio Nodes */}
                {remoteStream && (
                  <audio ref={(el) => { if (el) el.srcObject = remoteStream; }} autoPlay />
                )}
                {localStream && (
                  <audio ref={(el) => { if (el) el.srcObject = localStream; }} muted />
                )}

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

          {/* Footer Control Panel */}
          <div className="p-4 border-t border-white/5 bg-neutral-900/40 rounded-b-2xl flex items-center justify-center gap-4 backdrop-blur-md">
            <Button
              onClick={toggleMute}
              variant="ghost"
              className={`w-11 h-11 rounded-xl flex items-center justify-center border transition-all ${
                isMuted
                  ? "bg-red-500/15 border-red-500/30 text-red-400 hover:bg-red-500/25"
                  : "bg-white/5 border-white/10 text-neutral-300 hover:bg-white/10"
              }`}
              size="icon"
            >
              {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </Button>

            {callType === "video" && (
              <Button
                onClick={toggleVideo}
                variant="ghost"
                className={`w-11 h-11 rounded-xl flex items-center justify-center border transition-all ${
                  isVideoOff
                    ? "bg-red-500/15 border-red-500/30 text-red-400 hover:bg-red-500/25"
                    : "bg-white/5 border-white/10 text-neutral-300 hover:bg-white/10"
                }`}
                size="icon"
              >
                {isVideoOff ? <VideoOff className="h-4 w-4" /> : <Video className="h-4 w-4" />}
              </Button>
            )}

            <Button
              onClick={handleEndCall}
              className="w-11 h-11 rounded-xl bg-red-500 hover:bg-red-400 text-neutral-950 flex items-center justify-center transition-transform hover:scale-105 shadow-[0_0_15px_rgba(239,68,68,0.3)]"
              size="icon"
            >
              <PhoneOff className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
