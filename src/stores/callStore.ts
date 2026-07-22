import { create } from "zustand";

export type CallState = "idle" | "calling" | "incoming" | "connected";
export type CallType = "voice" | "video";

export interface CallUser {
  id: string;
  name: string;
  image?: string;
}

interface CallStore {
  callState: CallState;
  callType: CallType;
  callId: string | null;
  otherUser: CallUser | null;
  isMuted: boolean;
  isVideoOff: boolean;
  duration: number;
  
  // Actions
  initiateCall: (user: CallUser, type: CallType) => void;
  receiveCall: (user: CallUser, type: CallType, callId: string) => void;
  acceptCall: () => void;
  rejectCall: () => void;
  endCall: () => void;
  setConnected: () => void;
  setDuration: (duration: number | ((prev: number) => number)) => void;
  toggleMute: () => void;
  toggleVideo: () => void;
  resetCall: () => void;
}

export const useCallStore = create<CallStore>((set) => ({
  callState: "idle",
  callType: "voice",
  callId: null,
  otherUser: null,
  isMuted: false,
  isVideoOff: false,
  duration: 0,

  initiateCall: (user, type) => set({
    callState: "calling",
    callType: type,
    otherUser: user,
    callId: Math.random().toString(36).substring(7),
    isMuted: false,
    isVideoOff: false,
    duration: 0
  }),
  receiveCall: (user, type, callId) => set({
    callState: "incoming",
    callType: type,
    otherUser: user,
    callId,
    isMuted: false,
    isVideoOff: false,
    duration: 0
  }),
  acceptCall: () => set({ callState: "connected" }),
  rejectCall: () => set({
    callState: "idle",
    otherUser: null,
    callId: null
  }),
  endCall: () => set({
    callState: "idle",
    otherUser: null,
    callId: null
  }),
  setConnected: () => set({ callState: "connected" }),
  setDuration: (duration) => set((state) => ({
    duration: typeof duration === "function" ? duration(state.duration) : duration
  })),
  toggleMute: () => set((state) => ({ isMuted: !state.isMuted })),
  toggleVideo: () => set((state) => ({ isVideoOff: !state.isVideoOff })),
  resetCall: () => set({
    callState: "idle",
    callType: "voice",
    callId: null,
    otherUser: null,
    isMuted: false,
    isVideoOff: false,
    duration: 0
  })
}));
