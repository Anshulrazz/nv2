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
      {/* SVG Emblem: Geometric Shield N with Glowing Gold Accent */}
      <svg
        width={iconSize}
        height={iconSize}
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0 transition-transform duration-300 hover:scale-105"
      >
        <rect width="40" height="40" rx="10" fill="#150F0B" />
        <rect x="0.5" y="0.5" width="39" height="39" rx="9.5" stroke="#F5B429" strokeOpacity="0.4" />
        
        {/* N Path */}
        <path
          d="M12 29V11L28 29V11"
          stroke="#FAFAF8"
          strokeWidth="3.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        
        {/* Gold Accent Line */}
        <path
          d="M12 29L28 11"
          stroke="url(#notexia-logo-gold)"
          strokeWidth="3.2"
          strokeLinecap="round"
        />

        <defs>
          <linearGradient id="notexia-logo-gold" x1="12" y1="29" x2="28" y2="11" gradientUnits="userSpaceOnUse">
            <stop stopColor="#F7C948" />
            <stop offset="1" stopColor="#F5941D" />
          </linearGradient>
        </defs>
        
        {/* Glowing Orange Badge Dot */}
        <circle cx="31" cy="9" r="3.5" fill="#F5941D" />
        <circle cx="31" cy="9" r="4.5" stroke="#0A0806" strokeWidth="1.5" />
      </svg>

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
