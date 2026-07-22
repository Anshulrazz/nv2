"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const CallOverlay = dynamic(
  () => import("@/components/CallOverlay").then((m) => m.CallOverlay),
  { ssr: false }
);

export function CallWrapper() {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div id="agora-wrapper">
      <CallOverlay />
    </div>
  );
}
