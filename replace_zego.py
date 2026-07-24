import re

with open('src/components/CallOverlay.tsx', 'r') as f:
    content = f.read()

# Replace imports
content = re.sub(r'import AgoraRTC, {[\s\S]*?} from "agora-rtc-react";', 'import { ZegoUIKitPrebuilt } from "@zegocloud/zego-uikit-prebuilt";', content)

# Find ActiveCall and ActiveCallProvider
# Let's replace the whole ActiveCallProvider to the end of file with our Zego code
content = re.sub(r'// ────────────────────────────────────────────────────────────────────────\n// Agora Active Call Component[\s\S]*?(?=// ────────────────────────────────────────────────────────────────────────\n// Main Overlay)', '', content)

content = re.sub(r'function ActiveCallProvider[\s\S]*?}\n', '''
function ActiveCallProvider({ handleEndCall }: { handleEndCall: () => void }) {
  const { data: session } = useSession();
  const { callType, callId } = useCallStore();

  const myMeeting = async (element: HTMLDivElement | null) => {
    if (!element) return;
    const appID = parseInt(process.env.NEXT_PUBLIC_ZEGO_APP_ID || "0");
    const serverSecret = process.env.NEXT_PUBLIC_ZEGO_SERVER_SECRET || "";
    if (!appID || !serverSecret) {
      console.warn("ZegoCloud credentials missing");
      return;
    }

    const kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(
      appID,
      serverSecret,
      callId || "default-room",
      session?.user?.id || "user-" + Math.random().toString(36).substr(2, 5),
      session?.user?.name || "User"
    );

    const zp = ZegoUIKitPrebuilt.create(kitToken);
    
    zp.joinRoom({
      container: element,
      scenario: {
        mode: callType === "video" ? ZegoUIKitPrebuilt.OneONoneCall : ZegoUIKitPrebuilt.GroupCall,
      },
      turnOnCameraWhenJoining: callType === "video",
      showMyCameraToggleButton: callType === "video",
      turnOnMicrophoneWhenJoining: true,
      showPreJoinView: false,
      onLeaveRoom: () => {
        handleEndCall();
      },
    });
  };

  return (
    <div className="w-full h-full max-w-5xl relative z-10 shadow-2xl overflow-hidden rounded-2xl bg-black">
      <div className="w-full h-full" ref={myMeeting} />
    </div>
  );
}
''', content)

with open('src/components/CallOverlay.tsx', 'w') as f:
    f.write(content)
