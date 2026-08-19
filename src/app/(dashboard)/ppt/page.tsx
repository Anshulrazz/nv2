"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Download,
  RotateCcw,
  Maximize2,
  Minimize2,
  Play,
  Loader2,
  Monitor,
  Quote,
  Code2,
  Columns2,
  List,
  Star,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────
type SlideLayout = "title" | "bullets" | "two-col" | "quote" | "code" | "closing";

interface Slide {
  id: number;
  layout: SlideLayout;
  title: string;
  subtitle?: string;
  bullets?: string[];
  leftCol?: string[];
  rightCol?: string[];
  leftColTitle?: string;
  rightColTitle?: string;
  quote?: string;
  quoteAuthor?: string;
  codeSnippet?: string;
  codeLanguage?: string;
  note?: string;
}

// ── Themes ─────────────────────────────────────────────────────────────────
const THEMES = [
  {
    id: "dark-tech",
    label: "Dark Tech",
    bg: "#070d1a",
    accent: "#6366f1",
    secondary: "#818cf8",
    surface: "rgba(99,102,241,0.08)",
    border: "rgba(99,102,241,0.2)",
    gradient: "linear-gradient(135deg, #070d1a 0%, #0e1530 100%)",
    text: "#f1f5f9",
    muted: "#94a3b8",
  },
  {
    id: "ocean-depth",
    label: "Ocean Depth",
    bg: "#071525",
    accent: "#06b6d4",
    secondary: "#22d3ee",
    surface: "rgba(6,182,212,0.08)",
    border: "rgba(6,182,212,0.2)",
    gradient: "linear-gradient(135deg, #071525 0%, #0c2340 100%)",
    text: "#f0f9ff",
    muted: "#7dd3fc",
  },
  {
    id: "sunset",
    label: "Sunset",
    bg: "#130800",
    accent: "#f97316",
    secondary: "#fb923c",
    surface: "rgba(249,115,22,0.08)",
    border: "rgba(249,115,22,0.2)",
    gradient: "linear-gradient(135deg, #130800 0%, #2a1200 100%)",
    text: "#fff7ed",
    muted: "#fdba74",
  },
  {
    id: "emerald",
    label: "Emerald Forest",
    bg: "#041409",
    accent: "#10b981",
    secondary: "#34d399",
    surface: "rgba(16,185,129,0.08)",
    border: "rgba(16,185,129,0.2)",
    gradient: "linear-gradient(135deg, #041409 0%, #092b18 100%)",
    text: "#f0fdf4",
    muted: "#6ee7b7",
  },
  {
    id: "royal-purple",
    label: "Royal Purple",
    bg: "#0c0520",
    accent: "#a855f7",
    secondary: "#c084fc",
    surface: "rgba(168,85,247,0.08)",
    border: "rgba(168,85,247,0.2)",
    gradient: "linear-gradient(135deg, #0c0520 0%, #1a0a35 100%)",
    text: "#faf5ff",
    muted: "#d8b4fe",
  },
  {
    id: "monochrome",
    label: "Monochrome",
    bg: "#0a0a0a",
    accent: "#e2e8f0",
    secondary: "#cbd5e1",
    surface: "rgba(226,232,240,0.06)",
    border: "rgba(226,232,240,0.15)",
    gradient: "linear-gradient(135deg, #0a0a0a 0%, #141414 100%)",
    text: "#f8fafc",
    muted: "#94a3b8",
  },
];

// ── Layout icons ───────────────────────────────────────────────────────────
const LAYOUT_ICONS: Record<SlideLayout, React.ReactNode> = {
  title: <Star className="size-3" />,
  bullets: <List className="size-3" />,
  "two-col": <Columns2 className="size-3" />,
  quote: <Quote className="size-3" />,
  code: <Code2 className="size-3" />,
  closing: <Star className="size-3" />,
};

// ── Slide Renderer ─────────────────────────────────────────────────────────
function SlideCard({
  slide,
  theme,
  animKey,
}: {
  slide: Slide;
  theme: (typeof THEMES)[0];
  animKey: number;
}) {
  const baseStyle: React.CSSProperties = {
    background: theme.gradient,
    color: theme.text,
    fontFamily: "'Inter', 'Segoe UI', sans-serif",
    height: "100%",
    width: "100%",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    padding: "48px 64px",
    boxSizing: "border-box",
    position: "relative",
    overflow: "hidden",
  };

  // Subtle radial blob
  const blob = (
    <div
      style={{
        position: "absolute",
        width: "600px",
        height: "600px",
        borderRadius: "50%",
        background: theme.accent,
        opacity: 0.06,
        filter: "blur(120px)",
        top: "-150px",
        right: "-150px",
        pointerEvents: "none",
      }}
    />
  );

  const slideNumBadge = (
    <div
      style={{
        position: "absolute",
        bottom: "20px",
        right: "28px",
        fontSize: "11px",
        color: theme.muted,
        fontFamily: "monospace",
        letterSpacing: "0.05em",
      }}
    >
      {slide.id}
    </div>
  );

  const accentLine = (
    <div
      key={`line-${animKey}`}
      style={{
        width: "60px",
        height: "3px",
        background: `linear-gradient(90deg, ${theme.accent}, ${theme.secondary})`,
        borderRadius: "2px",
        marginBottom: "20px",
        animation: "pptLineIn 0.6s cubic-bezier(0.22,1,0.36,1) both",
      }}
    />
  );

  // ── TITLE layout
  if (slide.layout === "title") {
    return (
      <div style={baseStyle} key={animKey}>
        {blob}
        <div style={{ textAlign: "center", maxWidth: "800px", zIndex: 1 }}>
          <div
            key={`badge-${animKey}`}
            style={{
              display: "inline-block",
              padding: "4px 14px",
              borderRadius: "999px",
              background: theme.surface,
              border: `1px solid ${theme.border}`,
              color: theme.accent,
              fontSize: "11px",
              fontWeight: 700,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              marginBottom: "24px",
              animation: "pptFadeUp 0.5s ease both",
            }}
          >
            Presentation
          </div>
          <h1
            key={`h1-${animKey}`}
            style={{
              fontSize: "clamp(28px, 4vw, 56px)",
              fontWeight: 800,
              lineHeight: 1.15,
              marginBottom: "20px",
              background: `linear-gradient(135deg, ${theme.text} 60%, ${theme.secondary})`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              animation: "pptFadeUp 0.55s 0.1s ease both",
            }}
          >
            {slide.title}
          </h1>
          {slide.subtitle && (
            <p
              key={`sub-${animKey}`}
              style={{
                fontSize: "clamp(14px, 1.8vw, 22px)",
                color: theme.muted,
                lineHeight: 1.6,
                animation: "pptFadeUp 0.6s 0.2s ease both",
              }}
            >
              {slide.subtitle}
            </p>
          )}
        </div>
        {slideNumBadge}
      </div>
    );
  }

  // ── CLOSING layout
  if (slide.layout === "closing") {
    return (
      <div style={{ ...baseStyle, justifyContent: "center" }} key={animKey}>
        {blob}
        <div style={{ textAlign: "center", maxWidth: "700px", zIndex: 1 }}>
          <div
            style={{
              width: "72px",
              height: "72px",
              borderRadius: "50%",
              background: theme.surface,
              border: `2px solid ${theme.border}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 28px",
              animation: "pptFadeUp 0.5s ease both",
            }}
          >
            <span style={{ fontSize: "28px" }}>🎉</span>
          </div>
          <h1
            key={`ch1-${animKey}`}
            style={{
              fontSize: "clamp(28px, 4vw, 52px)",
              fontWeight: 800,
              color: theme.accent,
              marginBottom: "16px",
              animation: "pptFadeUp 0.55s 0.1s ease both",
            }}
          >
            {slide.title}
          </h1>
          {slide.subtitle && (
            <p
              style={{
                fontSize: "clamp(14px, 1.8vw, 20px)",
                color: theme.muted,
                animation: "pptFadeUp 0.6s 0.2s ease both",
              }}
            >
              {slide.subtitle}
            </p>
          )}
        </div>
        {slideNumBadge}
      </div>
    );
  }

  // ── QUOTE layout
  if (slide.layout === "quote") {
    return (
      <div style={baseStyle} key={animKey}>
        {blob}
        <div style={{ maxWidth: "780px", zIndex: 1, textAlign: "center" }}>
          <div
            style={{
              fontSize: "80px",
              lineHeight: 1,
              color: theme.accent,
              opacity: 0.4,
              fontFamily: "Georgia, serif",
              marginBottom: "-24px",
              animation: "pptFadeUp 0.5s ease both",
            }}
          >
            &ldquo;
          </div>
          <blockquote
            key={`bq-${animKey}`}
            style={{
              fontSize: "clamp(16px, 2.2vw, 28px)",
              fontStyle: "italic",
              lineHeight: 1.7,
              color: theme.text,
              fontWeight: 500,
              marginBottom: "24px",
              animation: "pptFadeUp 0.6s 0.1s ease both",
            }}
          >
            {slide.quote}
          </blockquote>
          {slide.quoteAuthor && (
            <p
              style={{
                color: theme.accent,
                fontWeight: 700,
                fontSize: "14px",
                letterSpacing: "0.08em",
                animation: "pptFadeUp 0.6s 0.2s ease both",
              }}
            >
              — {slide.quoteAuthor}
            </p>
          )}
        </div>
        {slideNumBadge}
      </div>
    );
  }

  // ── CODE layout
  if (slide.layout === "code") {
    return (
      <div style={{ ...baseStyle, alignItems: "flex-start", padding: "40px 56px" }} key={animKey}>
        {blob}
        <div style={{ width: "100%", maxWidth: "900px", zIndex: 1 }}>
          {accentLine}
          <h2
            key={`ch2-${animKey}`}
            style={{
              fontSize: "clamp(18px, 2.4vw, 32px)",
              fontWeight: 700,
              marginBottom: "24px",
              color: theme.text,
              animation: "pptFadeUp 0.5s 0.05s ease both",
            }}
          >
            {slide.title}
          </h2>
          <div
            key={`code-${animKey}`}
            style={{
              background: "rgba(0,0,0,0.5)",
              border: `1px solid ${theme.border}`,
              borderRadius: "12px",
              padding: "24px",
              fontFamily: "'Fira Code', 'Courier New', monospace",
              fontSize: "clamp(11px, 1.2vw, 15px)",
              lineHeight: 1.7,
              color: "#e2e8f0",
              overflowX: "auto",
              whiteSpace: "pre",
              animation: "pptFadeUp 0.6s 0.15s ease both",
            }}
          >
            <div
              style={{
                display: "flex",
                gap: "6px",
                marginBottom: "12px",
              }}
            >
              {["#ff5f57", "#febc2e", "#28c840"].map((c) => (
                <div key={c} style={{ width: "10px", height: "10px", borderRadius: "50%", background: c }} />
              ))}
              {slide.codeLanguage && (
                <span
                  style={{
                    marginLeft: "auto",
                    fontSize: "10px",
                    color: theme.muted,
                    fontFamily: "monospace",
                    letterSpacing: "0.05em",
                  }}
                >
                  {slide.codeLanguage}
                </span>
              )}
            </div>
            {slide.codeSnippet}
          </div>
        </div>
        {slideNumBadge}
      </div>
    );
  }

  // ── TWO-COL layout
  if (slide.layout === "two-col") {
    return (
      <div style={{ ...baseStyle, alignItems: "flex-start", padding: "40px 56px" }} key={animKey}>
        {blob}
        <div style={{ width: "100%", zIndex: 1 }}>
          {accentLine}
          <h2
            style={{
              fontSize: "clamp(18px, 2.4vw, 36px)",
              fontWeight: 700,
              marginBottom: "32px",
              color: theme.text,
              animation: "pptFadeUp 0.5s ease both",
            }}
          >
            {slide.title}
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
            {[
              { items: slide.leftCol, colTitle: slide.leftColTitle },
              { items: slide.rightCol, colTitle: slide.rightColTitle },
            ].map((col, ci) => (
              <div
                key={ci}
                style={{
                  background: theme.surface,
                  border: `1px solid ${theme.border}`,
                  borderRadius: "16px",
                  padding: "20px 24px",
                  animation: `pptFadeUp 0.55s ${0.1 + ci * 0.1}s ease both`,
                }}
              >
                {col.colTitle && (
                  <p
                    style={{
                      color: theme.accent,
                      fontSize: "11px",
                      fontWeight: 700,
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      marginBottom: "12px",
                    }}
                  >
                    {col.colTitle}
                  </p>
                )}
                <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: "10px" }}>
                  {(col.items || []).map((item, ii) => (
                    <li
                      key={ii}
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: "10px",
                        fontSize: "clamp(12px, 1.3vw, 16px)",
                        color: theme.text,
                        lineHeight: 1.5,
                        animation: `pptFadeUp 0.5s ${0.2 + ci * 0.1 + ii * 0.06}s ease both`,
                      }}
                    >
                      <span
                        style={{
                          width: "6px",
                          height: "6px",
                          borderRadius: "50%",
                          background: theme.accent,
                          marginTop: "7px",
                          flexShrink: 0,
                        }}
                      />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
        {slideNumBadge}
      </div>
    );
  }

  // ── BULLETS layout (default)
  return (
    <div style={{ ...baseStyle, alignItems: "flex-start", padding: "40px 64px" }} key={animKey}>
      {blob}
      <div style={{ width: "100%", maxWidth: "860px", zIndex: 1 }}>
        {accentLine}
        <h2
          key={`bh2-${animKey}`}
          style={{
            fontSize: "clamp(20px, 2.8vw, 38px)",
            fontWeight: 700,
            marginBottom: "32px",
            color: theme.text,
            lineHeight: 1.25,
            animation: "pptFadeUp 0.5s ease both",
          }}
        >
          {slide.title}
        </h2>
        <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: "14px" }}>
          {(slide.bullets || []).map((b, i) => (
            <li
              key={i}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "14px",
                animation: `pptFadeUp 0.55s ${0.1 + i * 0.08}s ease both`,
              }}
            >
              <span
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  background: `linear-gradient(135deg, ${theme.accent}, ${theme.secondary})`,
                  marginTop: "8px",
                  flexShrink: 0,
                  boxShadow: `0 0 8px ${theme.accent}60`,
                }}
              />
              <span
                style={{
                  fontSize: "clamp(14px, 1.6vw, 20px)",
                  color: theme.text,
                  lineHeight: 1.6,
                }}
              >
                {b}
              </span>
            </li>
          ))}
        </ul>
      </div>
      {slideNumBadge}
    </div>
  );
}

// ── Skeleton slide ─────────────────────────────────────────────────────────
function SlideSkeleton() {
  return (
    <div
      style={{
        background: "linear-gradient(135deg, #070d1a 0%, #0e1530 100%)",
        height: "100%",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "48px 64px",
        boxSizing: "border-box",
      }}
    >
      <div
        className="animate-pulse"
        style={{ display: "flex", flexDirection: "column", gap: "16px", maxWidth: "700px" }}
      >
        <div style={{ width: "60px", height: "3px", background: "#6366f130", borderRadius: "2px" }} />
        <div style={{ width: "70%", height: "36px", background: "#6366f115", borderRadius: "8px" }} />
        <div style={{ width: "55%", height: "20px", background: "#6366f110", borderRadius: "6px" }} />
        {[80, 65, 90, 50].map((w, i) => (
          <div
            key={i}
            style={{
              width: `${w}%`,
              height: "16px",
              background: "#6366f10a",
              borderRadius: "4px",
              marginTop: i === 0 ? "8px" : 0,
            }}
          />
        ))}
      </div>
    </div>
  );
}

// ── Export to HTML ─────────────────────────────────────────────────────────
function buildExportHTML(slides: Slide[], topic: string, themeObj: (typeof THEMES)[0]): string {
  const slidesJson = JSON.stringify(slides);
  const themeJson = JSON.stringify(themeObj);

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>${topic} — Notexia Presentation</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{background:#000;font-family:'Inter','Segoe UI',sans-serif;overflow:hidden;height:100vh}
  #viewer{position:fixed;inset:0;display:flex;flex-direction:column}
  #slide-area{flex:1;position:relative;overflow:hidden}
  .slide{position:absolute;inset:0;display:flex;flex-direction:column;justify-content:center;align-items:center;padding:48px 64px;transition:opacity 0.4s,transform 0.4s;opacity:0;pointer-events:none;transform:translateX(40px)}
  .slide.active{opacity:1;pointer-events:auto;transform:translateX(0)}
  .slide.prev{opacity:0;transform:translateX(-40px)}
  #controls{display:flex;align-items:center;justify-content:center;gap:16px;padding:14px 24px;background:rgba(0,0,0,0.8);border-top:1px solid rgba(255,255,255,0.08)}
  button{background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.12);color:#fff;padding:8px 18px;border-radius:8px;cursor:pointer;font-size:13px;font-weight:600;transition:background 0.2s}
  button:hover{background:rgba(255,255,255,0.15)}
  #counter{color:#94a3b8;font-size:13px;font-family:monospace;min-width:60px;text-align:center}
  @keyframes pptFadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
  @keyframes pptLineIn{from{width:0;opacity:0}to{width:60px;opacity:1}}
  .blob{position:absolute;width:600px;height:600px;border-radius:50%;opacity:0.06;filter:blur(120px);top:-150px;right:-150px;pointer-events:none}
  ul{list-style:none}.dot{width:8px;height:8px;border-radius:50%;flex-shrink:0;margin-top:8px}
  .accent-line{width:60px;height:3px;border-radius:2px;margin-bottom:20px}
</style>
</head>
<body>
<div id="viewer">
  <div id="slide-area"></div>
  <div id="controls">
    <button id="prev-btn">&#8592; Prev</button>
    <span id="counter">1 / 1</span>
    <button id="next-btn">Next &#8594;</button>
    <button id="fs-btn" style="margin-left:8px">&#x26F6; Fullscreen</button>
  </div>
</div>
<script>
const slides=${slidesJson};
const theme=${themeJson};
let cur=0;

function renderSlide(s){
  const div=document.createElement('div');
  div.className='slide';
  div.style.background=theme.gradient;
  div.style.color=theme.text;

  const blob=document.createElement('div');
  blob.className='blob';
  blob.style.background=theme.accent;
  div.appendChild(blob);

  const inner=document.createElement('div');
  inner.style.cssText='position:relative;z-index:1;width:100%;max-width:900px;';

  if(s.layout==='title'||s.layout==='closing'){
    inner.style.textAlign='center';
    inner.style.margin='0 auto';
    const h=document.createElement('h1');
    h.style.cssText='font-size:clamp(28px,4vw,52px);font-weight:800;line-height:1.15;margin-bottom:16px;animation:pptFadeUp 0.55s ease both';
    h.style.color=s.layout==='closing'?theme.accent:theme.text;
    h.textContent=s.title;
    inner.appendChild(h);
    if(s.subtitle){const p=document.createElement('p');p.style.cssText='font-size:clamp(14px,1.8vw,22px);line-height:1.6;animation:pptFadeUp 0.6s 0.1s ease both';p.style.color=theme.muted;p.textContent=s.subtitle;inner.appendChild(p);}
  }else if(s.layout==='quote'){
    inner.style.textAlign='center';
    inner.style.margin='0 auto';
    const q=document.createElement('blockquote');
    q.style.cssText='font-size:clamp(16px,2.2vw,26px);font-style:italic;line-height:1.7;font-weight:500;margin-bottom:20px;animation:pptFadeUp 0.6s ease both';
    q.textContent='"'+s.quote+'"';
    inner.appendChild(q);
    if(s.quoteAuthor){const a=document.createElement('p');a.style.cssText='font-weight:700;font-size:14px;letter-spacing:0.08em;animation:pptFadeUp 0.6s 0.1s ease both';a.style.color=theme.accent;a.textContent='— '+s.quoteAuthor;inner.appendChild(a);}
  }else if(s.layout==='code'){
    const al=document.createElement('div');al.className='accent-line';al.style.background='linear-gradient(90deg,'+theme.accent+','+theme.secondary+')';inner.appendChild(al);
    const h=document.createElement('h2');h.style.cssText='font-size:clamp(18px,2.4vw,32px);font-weight:700;margin-bottom:20px;animation:pptFadeUp 0.5s ease both';h.style.color=theme.text;h.textContent=s.title;inner.appendChild(h);
    const pre=document.createElement('pre');pre.style.cssText='background:rgba(0,0,0,0.5);border-radius:12px;padding:20px;font-family:monospace;font-size:clamp(11px,1.2vw,14px);line-height:1.7;color:#e2e8f0;overflow-x:auto;white-space:pre;animation:pptFadeUp 0.6s 0.15s ease both';pre.style.border='1px solid '+theme.border;pre.textContent=s.codeSnippet||'';inner.appendChild(pre);
  }else if(s.layout==='two-col'){
    const al=document.createElement('div');al.className='accent-line';al.style.background='linear-gradient(90deg,'+theme.accent+','+theme.secondary+')';inner.appendChild(al);
    const h=document.createElement('h2');h.style.cssText='font-size:clamp(18px,2.4vw,34px);font-weight:700;margin-bottom:24px;animation:pptFadeUp 0.5s ease both';h.style.color=theme.text;h.textContent=s.title;inner.appendChild(h);
    const grid=document.createElement('div');grid.style.cssText='display:grid;grid-template-columns:1fr 1fr;gap:20px';
    [[s.leftColTitle,s.leftCol],[s.rightColTitle,s.rightCol]].forEach(([ct,items],ci)=>{
      const card=document.createElement('div');card.style.cssText='border-radius:14px;padding:18px 20px;animation:pptFadeUp 0.55s '+(0.1+ci*0.1)+'s ease both';card.style.background=theme.surface;card.style.border='1px solid '+theme.border;
      if(ct){const tt=document.createElement('p');tt.style.cssText='font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;margin-bottom:10px';tt.style.color=theme.accent;tt.textContent=ct;card.appendChild(tt);}
      const ul=document.createElement('ul');ul.style.cssText='display:flex;flex-direction:column;gap:8px';
      (items||[]).forEach((item,ii)=>{const li=document.createElement('li');li.style.cssText='display:flex;align-items:flex-start;gap:10px;font-size:clamp(12px,1.3vw,15px);line-height:1.5;animation:pptFadeUp 0.5s '+(0.2+ci*0.1+ii*0.06)+'s ease both';li.style.color=theme.text;const dot=document.createElement('span');dot.className='dot';dot.style.background=theme.accent;dot.style.marginTop='7px';li.appendChild(dot);li.appendChild(document.createTextNode(item));ul.appendChild(li);});
      card.appendChild(ul);grid.appendChild(card);
    });
    inner.appendChild(grid);
  }else{
    const al=document.createElement('div');al.className='accent-line';al.style.background='linear-gradient(90deg,'+theme.accent+','+theme.secondary+')';inner.appendChild(al);
    const h=document.createElement('h2');h.style.cssText='font-size:clamp(20px,2.8vw,36px);font-weight:700;margin-bottom:28px;line-height:1.25;animation:pptFadeUp 0.5s ease both';h.style.color=theme.text;h.textContent=s.title;inner.appendChild(h);
    const ul=document.createElement('ul');ul.style.cssText='display:flex;flex-direction:column;gap:12px';
    (s.bullets||[]).forEach((b,i)=>{const li=document.createElement('li');li.style.cssText='display:flex;align-items:flex-start;gap:12px;animation:pptFadeUp 0.55s '+(0.1+i*0.08)+'s ease both';const dot=document.createElement('span');dot.className='dot';dot.style.cssText='width:8px;height:8px;flex-shrink:0;margin-top:8px';dot.style.background='linear-gradient(135deg,'+theme.accent+','+theme.secondary+')';dot.style.boxShadow='0 0 8px '+theme.accent+'60';li.appendChild(dot);const sp=document.createElement('span');sp.style.cssText='font-size:clamp(14px,1.6vw,20px);line-height:1.6';sp.style.color=theme.text;sp.textContent=b;li.appendChild(sp);ul.appendChild(li);});
    inner.appendChild(ul);
  }
  div.appendChild(inner);

  const num=document.createElement('div');num.style.cssText='position:absolute;bottom:20px;right:28px;font-size:11px;font-family:monospace;letter-spacing:0.05em';num.style.color=theme.muted;num.textContent=s.id;div.appendChild(num);
  return div;
}

const area=document.getElementById('slide-area');
const rendered=slides.map(renderSlide);
rendered.forEach(d=>area.appendChild(d));

function show(i){
  rendered.forEach((d,j)=>{d.className='slide'+(j===i?' active':j<i?' prev':'');});
  document.getElementById('counter').textContent=(i+1)+' / '+slides.length;
  cur=i;
}

show(0);
document.getElementById('prev-btn').onclick=()=>{if(cur>0)show(cur-1);};
document.getElementById('next-btn').onclick=()=>{if(cur<slides.length-1)show(cur+1);};
document.getElementById('fs-btn').onclick=()=>{if(!document.fullscreenElement)document.documentElement.requestFullscreen();else document.exitFullscreen();};
document.addEventListener('keydown',e=>{if(e.key==='ArrowRight'||e.key===' ')document.getElementById('next-btn').click();if(e.key==='ArrowLeft')document.getElementById('prev-btn').click();});
</script>
</body>
</html>`;
}

// ── Phase definitions ─────────────────────────────────────────────────────
const PHASES = [
  { id: "research",    label: "Deep Research",    icon: "🔍", desc: "Gathering facts, stats, quotes & examples" },
  { id: "structuring", label: "Structuring",       icon: "🗂️", desc: "Planning slide flow & narrative arc" },
  { id: "generating",  label: "Writing Slides",    icon: "✍️", desc: "Crafting content from research" },
  { id: "polishing",   label: "Polishing",         icon: "✨", desc: "Final quality pass" },
];

// ── Main Page ──────────────────────────────────────────────────────────────
export default function PPTMakerPage() {
  const [stage, setStage] = useState<"form" | "loading" | "viewer">("form");
  const [topic, setTopic] = useState("");
  const [slideCount, setSlideCount] = useState(7);
  const [themeId, setThemeId] = useState("dark-tech");
  const [audience, setAudience] = useState<"student" | "professional" | "general">("general");
  const [extraContext, setExtraContext] = useState("");
  const [slides, setSlides] = useState<Slide[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [error, setError] = useState("");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [animKey, setAnimKey] = useState(0);
  const [currentPhase, setCurrentPhase] = useState<string>("research");
  const [phaseMessage, setPhaseMessage] = useState("Starting research…");
  const [researchSummary, setResearchSummary] = useState("");
  const [completedPhases, setCompletedPhases] = useState<string[]>([]);
  const viewerRef = useRef<HTMLDivElement>(null);

  const theme = THEMES.find((t) => t.id === themeId) || THEMES[0];

  // Reset phase state when loading starts
  useEffect(() => {
    if (stage === "loading") {
      setCurrentPhase("research");
      setCompletedPhases([]);
      setPhaseMessage("Starting AI research…");
    }
  }, [stage]);

  // Keyboard nav
  useEffect(() => {
    if (stage !== "viewer") return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") goNext();
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "Escape" && isFullscreen) exitFullscreen();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [stage, currentSlide, slides.length, isFullscreen]); // eslint-disable-line

  // Fullscreen change listener
  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  const goPrev = useCallback(() => {
    if (currentSlide > 0) {
      setCurrentSlide((p) => p - 1);
      setAnimKey((k) => k + 1);
    }
  }, [currentSlide]);

  const goNext = useCallback(() => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide((p) => p + 1);
      setAnimKey((k) => k + 1);
    }
  }, [currentSlide, slides.length]);

  const enterFullscreen = () => {
    viewerRef.current?.requestFullscreen?.();
  };
  const exitFullscreen = () => {
    document.exitFullscreen?.();
  };

  const handleGenerate = async () => {
    if (!topic.trim()) return;
    setError("");
    setResearchSummary("");
    setStage("loading");

    try {
      const res = await fetch("/api/ppt/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, slideCount, theme: theme.label, audience, extraContext }),
      });

      if (!res.ok || !res.body) {
        const errData = await res.json().catch(() => ({}));
        setError((errData as { error?: string }).error || "Failed to generate. Please try again.");
        setStage("form");
        return;
      }

      // Consume SSE stream
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        // Process each complete SSE line
        const lines = buffer.split("\n");
        buffer = lines.pop() || ""; // keep incomplete last line

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const event = JSON.parse(line.slice(6)) as {
              type: string;
              phase?: string;
              message?: string;
              slides?: Slide[];
              researchSummary?: string;
              error?: string;
            };

            if (event.type === "phase") {
              const prevPhaseIdx = PHASES.findIndex((p) => p.id === currentPhase);
              const newPhaseIdx = PHASES.findIndex((p) => p.id === event.phase);
              if (newPhaseIdx > prevPhaseIdx) {
                setCompletedPhases((prev) => [
                  ...prev,
                  ...PHASES.slice(prevPhaseIdx, newPhaseIdx).map((p) => p.id),
                ]);
              }
              setCurrentPhase(event.phase || "research");
              setPhaseMessage(event.message || "");
            } else if (event.type === "done") {
              setCompletedPhases(PHASES.map((p) => p.id));
              if (event.researchSummary) setResearchSummary(event.researchSummary);
              if (event.slides && event.slides.length > 0) {
                setSlides(event.slides);
                setCurrentSlide(0);
                setAnimKey(0);
                setStage("viewer");
              } else {
                setError("No slides were generated. Please try again.");
                setStage("form");
              }
            } else if (event.type === "error") {
              setError(event.error || "Failed to generate. Please try again.");
              setStage("form");
            }
          } catch {
            // skip malformed SSE lines
          }
        }
      }
    } catch {
      setError("Network error. Please try again.");
      setStage("form");
    }
  };

  const handleExport = () => {
    const html = buildExportHTML(slides, topic, theme);
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${topic.replace(/[^a-z0-9]/gi, "-").toLowerCase()}-presentation.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ── FORM STAGE ────────────────────────────────────────────────────────────
  if (stage === "form") {
    return (
      <div className="min-h-screen bg-background px-4 py-10 max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <div className="size-8 rounded-xl bg-violet-500/15 border border-violet-500/25 flex items-center justify-center">
              <Monitor className="size-4 text-violet-400" />
            </div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-violet-400 font-bold">
              AI Tool
            </span>
          </div>
          <h1 className="text-3xl font-bold text-foreground">AI PPT Maker</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Generate beautiful, animated HTML slide decks from any topic — powered by Gemini AI.
          </p>
        </div>

        <div className="space-y-5">
          {/* Topic */}
          <div>
            <label className="text-xs font-mono font-bold uppercase tracking-widest text-muted-foreground block mb-1.5">
              Topic <span className="text-destructive">*</span>
            </label>
            <textarea
              className="w-full bg-sidebar border border-sidebar-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-violet-500/60 focus:ring-1 focus:ring-violet-500/20 transition-all resize-none"
              rows={2}
              placeholder="e.g. Introduction to Machine Learning, Photosynthesis, React Hooks…"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              maxLength={500}
            />
            <p className="text-[10px] text-muted-foreground mt-1">{topic.length}/500</p>
          </div>

          {/* Slide count */}
          <div>
            <label className="text-xs font-mono font-bold uppercase tracking-widest text-muted-foreground block mb-2">
              Number of Slides
            </label>
            <div className="flex gap-2 flex-wrap">
              {[5, 7, 10, 12].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setSlideCount(n)}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${
                    slideCount === n
                      ? "bg-violet-500/20 border-violet-500/50 text-violet-300"
                      : "bg-sidebar border-sidebar-border text-muted-foreground hover:border-violet-500/30"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          {/* Audience */}
          <div>
            <label className="text-xs font-mono font-bold uppercase tracking-widest text-muted-foreground block mb-2">
              Audience
            </label>
            <div className="flex gap-2 flex-wrap">
              {(["student", "professional", "general"] as const).map((a) => (
                <button
                  key={a}
                  type="button"
                  onClick={() => setAudience(a)}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold border capitalize transition-all ${
                    audience === a
                      ? "bg-violet-500/20 border-violet-500/50 text-violet-300"
                      : "bg-sidebar border-sidebar-border text-muted-foreground hover:border-violet-500/30"
                  }`}
                >
                  {a}
                </button>
              ))}
            </div>
          </div>

          {/* Theme */}
          <div>
            <label className="text-xs font-mono font-bold uppercase tracking-widest text-muted-foreground block mb-2">
              Theme
            </label>
            <div className="grid grid-cols-3 gap-2">
              {THEMES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setThemeId(t.id)}
                  className={`relative overflow-hidden rounded-xl border p-3 text-left transition-all group ${
                    themeId === t.id
                      ? "border-violet-500/60 ring-1 ring-violet-500/30"
                      : "border-sidebar-border hover:border-violet-500/30"
                  }`}
                  style={{ background: t.gradient }}
                >
                  <div
                    className="size-5 rounded-full mb-2 border-2"
                    style={{
                      background: t.accent,
                      borderColor: `${t.accent}60`,
                      boxShadow: `0 0 8px ${t.accent}60`,
                    }}
                  />
                  <p className="text-xs font-semibold" style={{ color: t.text }}>
                    {t.label}
                  </p>
                  {themeId === t.id && (
                    <div
                      className="absolute top-1.5 right-1.5 size-4 rounded-full flex items-center justify-center"
                      style={{ background: t.accent }}
                    >
                      <span className="text-[8px] text-white font-bold">✓</span>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Extra context */}
          <div>
            <label className="text-xs font-mono font-bold uppercase tracking-widest text-muted-foreground block mb-1.5">
              Extra Context <span className="text-muted-foreground font-normal">(optional)</span>
            </label>
            <input
              type="text"
              className="w-full bg-sidebar border border-sidebar-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-violet-500/60 focus:ring-1 focus:ring-violet-500/20 transition-all"
              placeholder="e.g. Focus on practical examples, include Python code, beginner-friendly…"
              value={extraContext}
              onChange={(e) => setExtraContext(e.target.value)}
            />
          </div>

          {error && (
            <div className="flex items-start gap-2 bg-destructive/10 border border-destructive/30 rounded-xl px-4 py-3 text-sm text-destructive">
              <span>{error}</span>
            </div>
          )}

          <button
            type="button"
            disabled={!topic.trim()}
            onClick={handleGenerate}
            className="w-full py-3.5 bg-violet-600 text-white rounded-xl font-bold text-sm hover:bg-violet-500 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-violet-500/20"
          >
            <Sparkles className="size-4" />
            Generate Presentation
          </button>
        </div>
      </div>
    );
  }

  // ── LOADING STAGE ─────────────────────────────────────────────────────────
  if (stage === "loading") {
    const activePhaseIdx = PHASES.findIndex((p) => p.id === currentPhase);
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-6 px-4 py-10">
        {/* Header */}
        <div className="text-center">
          <div className="size-14 rounded-2xl bg-violet-500/15 border border-violet-500/25 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-violet-500/10">
            <Sparkles className="size-6 text-violet-400 animate-pulse" />
          </div>
          <h2 className="text-xl font-bold text-foreground">Building Your Presentation</h2>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm text-center">
            AI is researching, then generating fully loaded slides.
          </p>
        </div>

        {/* 4-phase tracker */}
        <div className="w-full max-w-md space-y-3">
          {PHASES.map((phase, idx) => {
            const isDone = completedPhases.includes(phase.id);
            const isActive = phase.id === currentPhase;
            return (
              <div
                key={phase.id}
                className="flex items-center gap-3 rounded-xl px-4 py-3 border transition-all duration-500"
                style={{
                  background: isActive
                    ? "rgba(99,102,241,0.10)"
                    : isDone
                    ? "rgba(16,185,129,0.06)"
                    : "rgba(255,255,255,0.02)",
                  borderColor: isActive
                    ? "rgba(99,102,241,0.40)"
                    : isDone
                    ? "rgba(16,185,129,0.25)"
                    : "rgba(255,255,255,0.06)",
                }}
              >
                {/* Step icon */}
                <div
                  className="size-8 rounded-full flex items-center justify-center shrink-0 text-sm transition-all duration-500"
                  style={{
                    background: isActive
                      ? "rgba(99,102,241,0.25)"
                      : isDone
                      ? "rgba(16,185,129,0.20)"
                      : "rgba(255,255,255,0.04)",
                    border: isActive
                      ? "1px solid rgba(99,102,241,0.5)"
                      : isDone
                      ? "1px solid rgba(16,185,129,0.4)"
                      : "1px solid rgba(255,255,255,0.08)",
                  }}
                >
                  {isDone ? (
                    <span className="text-emerald-400 text-xs font-bold">✓</span>
                  ) : isActive ? (
                    <Loader2 className="size-3.5 text-violet-400 animate-spin" />
                  ) : (
                    <span className="text-xs text-muted-foreground font-mono">{idx + 1}</span>
                  )}
                </div>
                {/* Label */}
                <div className="flex-1 min-w-0">
                  <p
                    className="text-sm font-semibold transition-colors"
                    style={{
                      color: isActive ? "#a5b4fc" : isDone ? "#6ee7b7" : "#64748b",
                    }}
                  >
                    {phase.icon} {phase.label}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">{phase.desc}</p>
                </div>
                {/* Active shimmer bar */}
                {isActive && (
                  <div className="w-16 h-1.5 rounded-full overflow-hidden bg-violet-500/15">
                    <div
                      className="h-full rounded-full"
                      style={{
                        background: "linear-gradient(90deg, #6366f1, #818cf8)",
                        animation: "pptShimmer 1.4s ease-in-out infinite",
                        width: "60%",
                      }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Live phase message */}
        <p className="text-xs text-muted-foreground text-center max-w-xs transition-all duration-500">
          {phaseMessage}
        </p>

        {/* Skeleton preview */}
        <div className="w-full max-w-xl aspect-video rounded-2xl overflow-hidden border border-sidebar-border shadow-2xl opacity-60">
          <SlideSkeleton />
        </div>

        {/* Dot indicators */}
        <div className="flex gap-2">
          {[...Array(Math.min(slideCount, 10))].map((_, i) => (
            <div
              key={i}
              className="h-1.5 rounded-full animate-pulse"
              style={{
                width: i === 0 ? "24px" : "7px",
                background:
                  i <= activePhaseIdx * 2
                    ? "#6366f1"
                    : "#6366f120",
                animationDelay: `${i * 0.12}s`,
              }}
            />
          ))}
        </div>

        <style>{`
          @keyframes pptShimmer {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(270%); }
          }
        `}</style>
      </div>
    );
  }

  // ── VIEWER STAGE ──────────────────────────────────────────────────────────
  const slide = slides[currentSlide];
  const progress = ((currentSlide + 1) / slides.length) * 100;

  return (
    <div className="flex flex-col h-screen bg-black overflow-hidden">
      {/* Top bar */}
      {!isFullscreen && (
        <div className="flex items-center justify-between px-4 py-2.5 bg-black border-b border-white/8 shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => { setStage("form"); setSlides([]); }}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
            >
              <RotateCcw className="size-3.5" />
              New
            </button>
            <span className="text-slate-600 text-xs">|</span>
            <p className="text-xs text-slate-400 font-medium truncate max-w-[200px]">{topic}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-slate-500">
              {LAYOUT_ICONS[slide.layout]}
            </span>
            <span
              className="text-[10px] font-mono px-2 py-0.5 rounded-full border"
              style={{ color: theme.accent, borderColor: `${theme.accent}40`, background: `${theme.accent}10` }}
            >
              {theme.label}
            </span>
            <button
              onClick={handleExport}
              className="flex items-center gap-1.5 text-xs bg-white/8 border border-white/12 text-slate-200 px-3 py-1.5 rounded-lg hover:bg-white/15 transition-colors"
            >
              <Download className="size-3.5" />
              Export HTML
            </button>
            <button
              onClick={enterFullscreen}
              className="flex items-center gap-1.5 text-xs bg-violet-500/20 border border-violet-500/30 text-violet-300 px-3 py-1.5 rounded-lg hover:bg-violet-500/30 transition-colors"
            >
              <Maximize2 className="size-3.5" />
              Fullscreen
            </button>
          </div>
        </div>
      )}

      {/* Slide area */}
      <div ref={viewerRef} className="flex-1 relative overflow-hidden">
        {/* Progress bar */}
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-white/5 z-10">
          <div
            className="h-full transition-all duration-500"
            style={{
              width: `${progress}%`,
              background: `linear-gradient(90deg, ${theme.accent}, ${theme.secondary})`,
            }}
          />
        </div>

        {/* Slide */}
        <div className="h-full w-full">
          <style>{`
            @keyframes pptFadeUp {
              from { opacity: 0; transform: translateY(20px); }
              to { opacity: 1; transform: translateY(0); }
            }
            @keyframes pptLineIn {
              from { width: 0; opacity: 0; }
              to { width: 60px; opacity: 1; }
            }
          `}</style>
          <SlideCard slide={slide} theme={theme} animKey={animKey} />
        </div>

        {/* Side nav arrows */}
        <button
          onClick={goPrev}
          disabled={currentSlide === 0}
          className="absolute left-4 top-1/2 -translate-y-1/2 size-10 rounded-full bg-black/40 border border-white/10 flex items-center justify-center text-white hover:bg-black/60 transition-all disabled:opacity-0 z-10 backdrop-blur-sm"
        >
          <ChevronLeft className="size-5" />
        </button>
        <button
          onClick={goNext}
          disabled={currentSlide === slides.length - 1}
          className="absolute right-4 top-1/2 -translate-y-1/2 size-10 rounded-full bg-black/40 border border-white/10 flex items-center justify-center text-white hover:bg-black/60 transition-all disabled:opacity-0 z-10 backdrop-blur-sm"
        >
          <ChevronRight className="size-5" />
        </button>

        {/* Fullscreen exit hint */}
        {isFullscreen && (
          <button
            onClick={exitFullscreen}
            className="absolute bottom-4 right-4 flex items-center gap-1.5 text-xs bg-black/50 border border-white/10 text-slate-300 px-3 py-1.5 rounded-lg hover:bg-black/70 transition-all z-10 backdrop-blur-sm"
          >
            <Minimize2 className="size-3.5" />
            Exit
          </button>
        )}
      </div>

      {/* Bottom bar */}
      {!isFullscreen && (
        <div className="shrink-0 bg-black border-t border-white/8 px-4 py-2.5">
          <div className="flex items-center justify-between">
            {/* Slide dots */}
            <div className="flex items-center gap-1.5 overflow-x-auto max-w-[60%] pb-0.5">
              {slides.map((_, i) => (
                <button
                  key={i}
                  onClick={() => { setCurrentSlide(i); setAnimKey((k) => k + 1); }}
                  className="shrink-0 transition-all duration-300"
                  style={{
                    width: i === currentSlide ? "20px" : "6px",
                    height: "6px",
                    borderRadius: "3px",
                    background: i === currentSlide ? theme.accent : `${theme.accent}30`,
                  }}
                />
              ))}
            </div>

            {/* Controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={goPrev}
                disabled={currentSlide === 0}
                className="size-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-slate-300 hover:bg-white/10 transition-colors disabled:opacity-30"
              >
                <ChevronLeft className="size-4" />
              </button>
              <span className="text-xs font-mono text-slate-500 min-w-[48px] text-center">
                {currentSlide + 1} / {slides.length}
              </span>
              <button
                onClick={goNext}
                disabled={currentSlide === slides.length - 1}
                className="size-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-slate-300 hover:bg-white/10 transition-colors disabled:opacity-30"
              >
                <ChevronRight className="size-4" />
              </button>

              {/* Speaker note pill */}
              {slide.note && (
                <div className="ml-2 flex items-center gap-1.5 text-[10px] text-slate-500 bg-white/4 border border-white/8 rounded-lg px-2.5 py-1 max-w-[240px] truncate">
                  <Play className="size-2.5 shrink-0" />
                  <span className="truncate">{slide.note}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
