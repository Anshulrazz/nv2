"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";

interface FollowButtonProps {
  targetUserId: string;
  initialFollowing: boolean;
}

export function FollowButton({ targetUserId, initialFollowing }: FollowButtonProps) {
  const [following, setFollowing] = useState(initialFollowing);
  const [isLoading, setIsLoading] = useState(false);

  const handleFollowToggle = async () => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/user/${targetUserId}/follow`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (res.ok) {
        const data = await res.json();
        setFollowing(data.isFollowing);
      } else {
        alert("Failed to toggle follow status.");
      }
    } catch (e) {
      console.error(e);
      alert("Error toggling follow status.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleFollowToggle}
      disabled={isLoading}
      className={`text-[10px] font-bold px-4 py-1.5 rounded-lg border uppercase tracking-wider transition-all h-auto select-none ${
        following
          ? "bg-neutral-950 border-neutral-900 text-neutral-500 hover:text-neutral-400"
          : "bg-cyan-500 hover:bg-cyan-400 border-cyan-500 hover:border-cyan-400 text-neutral-950 font-extrabold"
      }`}
      style={{ fontFamily: "var(--font-space-grotesk)" }}
    >
      {following ? "Following" : "Follow User"}
    </Button>
  );
}
