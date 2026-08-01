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
      {/* SVG Emblem: Geometric Shield N with Glowing Gold Chalk Dot */}
      <svg
        width={iconSize}
        height={iconSize}
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0 transition-transform duration-300 hover:scale-105"
      >
        <rect width="40" height="40" rx="10" fill={theme === "light" ? "#1B2A4A" : "#121F18"} />
        <rect x="0.5" y="0.5" width="39" height="39" rx="9.5" stroke="#F0C93B" strokeOpacity="0.3" />
        
        {/* N Path */}
        <path
          d="M12 29V11L28 29V11"
          stroke="#F3F0E4"
          strokeWidth="3.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        
        {/* Quantum Accent Line */}
        <path
          d="M12 29L28 11"
          stroke="#F0C93B"
          strokeWidth="3.2"
          strokeLinecap="round"
        />
        
        {/* Glowing Red/Gold Chalk Status Badge Dot */}
        <circle cx="31" cy="9" r="3.5" fill="#F28B6E" />
        <circle cx="31" cy="9" r="4.5" stroke="#16261D" strokeWidth="1.5" />
      </svg>

      {showText && (
        <div className="flex flex-col">
          <span className="font-heading font-black text-lg tracking-widest text-[#F3F0E4] leading-tight">
            NOTEXIA
          </span>
          <span className="font-mono text-[9px] text-[#8FC3DE] tracking-widest uppercase">
            ACADEMIC SLATE
          </span>
        </div>
      )}
    </div>
  );
}
