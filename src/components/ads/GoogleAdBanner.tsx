"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

declare global {
  interface Window {
    adsbygoogle?: Record<string, unknown>[];
  }
}

interface GoogleAdBannerProps {
  adSlot?: string;
  adFormat?: "auto" | "rectangle" | "horizontal" | "vertical";
  fullWidthResponsive?: boolean;
  className?: string;
  label?: string;
}

export function GoogleAdBanner({
  adSlot = "1234567890",
  adFormat = "auto",
  fullWidthResponsive = true,
  className = "",
  label = "Advertisement",
}: GoogleAdBannerProps) {
  const { data: session } = useSession();
  const [isPremium, setIsPremium] = useState<boolean>(false);
  const [isMounted, setIsMounted] = useState<boolean>(false);

  useEffect(() => {
    setIsMounted(true);
    // Check if current user is Premium from session or profile fetch
    const checkPremium = async () => {
      try {
        const res = await fetch("/api/user/premium");
        if (res.ok) {
          const data = await res.json();
          if (data.isPremiumUser) {
            setIsPremium(true);
          }
        }
      } catch (err) {
        console.error("Ad banner premium check error:", err);
      }
    };
    checkPremium();
  }, [session]);

  useEffect(() => {
    if (isMounted && !isPremium) {
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch (err) {
        console.error("Google AdSense initialization error:", err);
      }
    }
  }, [isMounted, isPremium]);

  // Premium users enjoy a 100% Ad-Free experience
  if (isPremium) {
    return null;
  }

  const clientId = process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_ID || "ca-pub-1957290146491296";

  return (
    <div className={`w-full my-4 flex flex-col items-center justify-center select-none ${className}`}>
      {label && (
        <span className="text-[9px] uppercase tracking-widest font-mono text-neutral-550 mb-1">
          {label}
        </span>
      )}
      <div className="w-full overflow-hidden rounded-xl border border-neutral-850/60 bg-neutral-950/40 p-2 min-h-[90px] flex items-center justify-center">
        <ins
          className="adsbygoogle"
          style={{ display: "block", width: "100%" }}
          data-ad-client={clientId}
          data-ad-slot={adSlot}
          data-ad-format={adFormat}
          data-full-width-responsive={fullWidthResponsive ? "true" : "false"}
        />
      </div>
    </div>
  );
}
