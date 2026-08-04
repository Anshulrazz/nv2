"use client";

import { useEffect, useState } from "react";

interface EventCountdownProps {
  /** ISO 8601 string for the target date/time */
  targetIso: string;
  label: string;
}

export function EventCountdown({ targetIso, label }: EventCountdownProps) {
  const [diff, setDiff] = useState(() =>
    Math.max(0, new Date(targetIso).getTime() - Date.now())
  );

  useEffect(() => {
    const target = new Date(targetIso).getTime();

    const tick = () => {
      const remaining = Math.max(0, target - Date.now());
      setDiff(remaining);
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [targetIso]);

  if (diff <= 0) return null;

  const days = Math.floor(diff / 86_400_000);
  const hours = Math.floor((diff % 86_400_000) / 3_600_000);
  const minutes = Math.floor((diff % 3_600_000) / 60_000);
  const seconds = Math.floor((diff % 60_000) / 1_000);

  return (
    <div className="flex flex-col gap-1">
      <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
        {label}
      </span>
      <div className="flex items-center gap-2">
        {days > 0 && (
          <span className="text-lg font-bold text-foreground font-mono">{days}d</span>
        )}
        <span className="text-lg font-bold text-foreground font-mono">{hours}h</span>
        <span className="text-lg font-bold text-foreground font-mono">{minutes}m</span>
        {days === 0 && (
          <span className="text-lg font-bold text-primary font-mono">{String(seconds).padStart(2, "0")}s</span>
        )}
      </div>
    </div>
  );
}
