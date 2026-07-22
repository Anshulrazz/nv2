"use client";

import dynamic from "next/dynamic";

const CallOverlay = dynamic(
  () => import("@/components/CallOverlay").then((m) => m.CallOverlay),
  { ssr: false }
);

export function CallWrapper() {
  return (
    <div id="agora-wrapper">
      <CallOverlay />
    </div>
  );
}
