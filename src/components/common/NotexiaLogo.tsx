import Image from "next/image";
import React from "react";

interface NotexiaLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  theme?: "dark" | "light";
}

export function NotexiaLogo({
  className = "",
  size = "md",
  showText = true,
  theme = "dark",
}: NotexiaLogoProps) {
  const iconSize = size === "sm" ? 28 : size === "lg" ? 44 : 34;

  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      <Image
        src="/images/logo.jpeg"
        alt="Notexia Logo"
        width={iconSize}
        height={iconSize}
        className="shrink-0 transition-transform duration-300 hover:scale-105 rounded-xl"
        priority
      />

      {showText && (
        <div className="flex flex-col">
          <span className="font-display font-black text-lg tracking-widest text-[#FAFAF8] leading-tight">
            NOTEXIA
          </span>
          <span className="font-mono text-[9px] text-[#F5B429] tracking-widest uppercase">
            STUDY PLATFORM
          </span>
        </div>
      )}
    </div>
  );
}
