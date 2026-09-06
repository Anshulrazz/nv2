"use client";

import React, { useEffect, useRef } from "react";
import gsap from "gsap";

export function GsapHeroGraphic() {
  const containerRef = useRef<HTMLDivElement>(null);
  const ring1Ref = useRef<SVGGElement>(null);
  const ring2Ref = useRef<SVGGElement>(null);
  const ring3Ref = useRef<SVGGElement>(null);
  const coreRef = useRef<SVGGElement>(null);
  const nodesGroupRef = useRef<SVGGElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // 1. Slow continuous rotation on orbital rings
      if (ring1Ref.current) {
        gsap.to(ring1Ref.current, {
          rotation: 360,
          transformOrigin: "center center",
          duration: 40,
          repeat: -1,
          ease: "none",
        });
      }

      if (ring2Ref.current) {
        gsap.to(ring2Ref.current, {
          rotation: -360,
          transformOrigin: "center center",
          duration: 55,
          repeat: -1,
          ease: "none",
        });
      }

      if (ring3Ref.current) {
        gsap.to(ring3Ref.current, {
          rotation: 360,
          transformOrigin: "center center",
          duration: 70,
          repeat: -1,
          ease: "none",
        });
      }

      // 2. Pulsing central core
      if (coreRef.current) {
        gsap.to(coreRef.current, {
          scale: 1.08,
          transformOrigin: "center center",
          duration: 3,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
        });
      }

      // 3. Shimmer on orbital nodes
      if (nodesGroupRef.current) {
        const dots = nodesGroupRef.current.querySelectorAll(".orbit-node");
        dots.forEach((dot, index) => {
          gsap.to(dot, {
            scale: 1.6,
            opacity: 1,
            transformOrigin: "center center",
            duration: 1.8 + index * 0.4,
            repeat: -1,
            yoyo: true,
            ease: "power1.inOut",
            delay: index * 0.3,
          });
        });
      }
    }, containerRef);

    // Parallax mouse hover tracking
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;

      gsap.to(containerRef.current, {
        rotateY: x * 15,
        rotateX: -y * 15,
        ease: "power2.out",
        duration: 1.2,
      });
    };

    window.addEventListener("mousemove", handleMouseMove);

    return () => {
      ctx.revert();
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative w-full aspect-square max-w-[540px] mx-auto flex items-center justify-center select-none"
      style={{ perspective: "1000px" }}
    >
      {/* Ambient background glow backdrop */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#F5B429]/15 via-[#F5941D]/5 to-transparent blur-3xl pointer-events-none" />

      <svg
        className="w-full h-full relative z-10"
        viewBox="0 0 600 600"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#F5B429" stopOpacity="0.8" />
            <stop offset="50%" stopColor="#F5941D" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#D9720E" stopOpacity="0.1" />
          </linearGradient>

          <linearGradient id="glowRing" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#F5B429" stopOpacity="0.6" />
            <stop offset="50%" stopColor="#FAFAF8" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#F5941D" stopOpacity="0.4" />
          </linearGradient>

          <filter id="neonBlur" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="8" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>

          <radialGradient id="coreAura" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#F5B429" stopOpacity="0.3" />
            <stop offset="70%" stopColor="#F5941D" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#0A0806" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Outer Tech Grid Coordinates */}
        <circle cx="300" cy="300" r="280" stroke="#2E2118" strokeWidth="1" strokeDasharray="4 8" opacity="0.6" />
        <circle cx="300" cy="300" r="240" stroke="#2E2118" strokeWidth="1" opacity="0.4" />

        {/* Crosshair telemetry lines */}
        <line x1="300" y1="20" x2="300" y2="580" stroke="#2E2118" strokeWidth="1" strokeDasharray="6 12" opacity="0.3" />
        <line x1="20" y1="300" x2="580" y2="300" stroke="#2E2118" strokeWidth="1" strokeDasharray="6 12" opacity="0.3" />

        {/* Outer Ring 3: Segmented arc */}
        <g ref={ring3Ref}>
          <circle cx="300" cy="300" r="215" stroke="url(#goldGradient)" strokeWidth="1.5" strokeDasharray="30 180" />
          <circle cx="300" cy="300" r="215" stroke="#F5B429" strokeWidth="2.5" strokeDasharray="10 200" opacity="0.8" />
          <circle cx="515" cy="300" r="4" fill="#F5B429" filter="url(#neonBlur)" />
        </g>

        {/* Ring 2: Medium dashed ring */}
        <g ref={ring2Ref}>
          <circle cx="300" cy="300" r="165" stroke="url(#glowRing)" strokeWidth="1.5" strokeDasharray="14 14" opacity="0.7" />
          <circle cx="300" cy="135" r="3.5" fill="#FAFAF8" />
          <circle cx="300" cy="465" r="3.5" fill="#FAFAF8" />
        </g>

        {/* Ring 1: Inner ring with markers */}
        <g ref={ring1Ref}>
          <circle cx="300" cy="300" r="115" stroke="#F5B429" strokeWidth="1.5" strokeDasharray="8 60 4 20" opacity="0.75" />
          <circle cx="185" cy="300" r="3" fill="#F5941D" />
          <circle cx="415" cy="300" r="3" fill="#F5B429" />
        </g>

        {/* Core Backdrop Glow */}
        <circle cx="300" cy="300" r="95" fill="url(#coreAura)" />

        {/* Central Kinetic Core */}
        <g ref={coreRef}>
          {/* Hexagonal Shield */}
          <polygon
            points="300,245 348,272 348,328 300,355 252,328 252,272"
            fill="#150F0B"
            stroke="#F5B429"
            strokeWidth="1.5"
            filter="url(#neonBlur)"
          />
          <polygon
            points="300,255 338,277 338,323 300,345 262,323 262,277"
            fill="#0A0806"
            stroke="#2E2118"
            strokeWidth="1"
          />

          {/* Central Stylized "N" Monogram */}
          <path
            d="M285 330V270L315 330V270"
            stroke="#F5B429"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>

        {/* Orbit Nodes with pulsating motion */}
        <g ref={nodesGroupRef}>
          {/* Node 1 - Top Right */}
          <g className="orbit-node" opacity="0.6">
            <circle cx="440" cy="190" r="6" fill="#F5B429" filter="url(#neonBlur)" />
            <circle cx="440" cy="190" r="3" fill="#FAFAF8" />
          </g>

          {/* Node 2 - Bottom Left */}
          <g className="orbit-node" opacity="0.5">
            <circle cx="160" cy="410" r="5" fill="#F5941D" filter="url(#neonBlur)" />
            <circle cx="160" cy="410" r="2.5" fill="#FAFAF8" />
          </g>

          {/* Node 3 - Top Left */}
          <g className="orbit-node" opacity="0.7">
            <circle cx="200" cy="170" r="4" fill="#F5B429" />
          </g>

          {/* Node 4 - Bottom Right */}
          <g className="orbit-node" opacity="0.8">
            <circle cx="410" cy="430" r="5" fill="#FCD34D" filter="url(#neonBlur)" />
            <circle cx="410" cy="430" r="2.5" fill="#FAFAF8" />
          </g>
        </g>

        {/* Micro-telemetry Typography */}
        <text x="300" y="540" fill="#8A8078" fontSize="9" fontFamily="monospace" textAnchor="middle" letterSpacing="3">
          NOTEXIA ENGINE // 1 INR = 10 COINS // VERIFIED
        </text>
      </svg>
    </div>
  );
}
