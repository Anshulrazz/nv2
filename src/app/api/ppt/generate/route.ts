import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { generateGeminiContent } from "@/lib/gemini";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

// ── Theme configs ─────────────────────────────────────────────────────────
const THEME_CONFIGS: Record<string, {
  bg950: string; bg900: string;
  accent500: string; accent300: string;
  gold500: string; gold300: string;
  cream: string; creamDim: string;
}> = {
  "indigo-amber": {
    bg950: "#100C2A", bg900: "#1B1642",
    accent500: "#4F46E5", accent300: "#A5A0F0",
    gold500: "#F59E0B", gold300: "#FCD34D",
    cream: "#F6F4EF", creamDim: "#C9C5DA",
  },
  "ocean-cyan": {
    bg950: "#06111E", bg900: "#0B1F35",
    accent500: "#0369A1", accent300: "#38BDF8",
    gold500: "#06B6D4", gold300: "#67E8F9",
    cream: "#F0F9FF", creamDim: "#BAE6FD",
  },
  "forest-gold": {
    bg950: "#0A170C", bg900: "#122018",
    accent500: "#166534", accent300: "#86EFAC",
    gold500: "#CA8A04", gold300: "#FDE047",
    cream: "#FAFAF9", creamDim: "#A8A29E",
  },
  "obsidian-rose": {
    bg950: "#1A0A0E", bg900: "#2D1018",
    accent500: "#9F1239", accent300: "#FDA4AF",
    gold500: "#F43F5E", gold300: "#FECDD3",
    cream: "#FFF1F2", creamDim: "#FECDD3",
  },
  "nebula-purple": {
    bg950: "#120A2A", bg900: "#1E1040",
    accent500: "#7C3AED", accent300: "#C4B5FD",
    gold500: "#A78BFA", gold300: "#DDD6FE",
    cream: "#FAF5FF", creamDim: "#D8B4FE",
  },
  "carbon-mono": {
    bg950: "#0A0A0A", bg900: "#141414",
    accent500: "#374151", accent300: "#9CA3AF",
    gold500: "#E5E7EB", gold300: "#F9FAFB",
    cream: "#FFFFFF", creamDim: "#9CA3AF",
  },
};

// ── Slide JSON interfaces ─────────────────────────────────────────────────
interface CoverSlide {
  kicker: string;
  title: string;
  titleAccent: string;
  subtitle: string;
}

interface ContentSlide {
  type: "content";
  index: string;
  sectionLabel: string;
  title: string;
  lede: string;
  body: string[];
  sideLabel: string;
  sideItems: Array<{ main: string; sub: string }>;
}

interface PillarsSlide {
  type: "pillars";
  index: string;
  sectionLabel: string;
  title: string;
  lede: string;
  pillars: Array<{ num: string; h3: string; p: string }>;
}

interface StatsSlide {
  type: "stats";
  index: string;
  sectionLabel: string;
  title: string;
  lede: string;
  stats: Array<{ n: string; l: string }>;
}

interface ClosingSlide {
  kicker: string;
  oneLiner: string;
  oneLinerHL: string;
  body: string;
  flowSteps: string[];
  contactValue: string;
}

interface PresentationJSON {
  cover: CoverSlide;
  slides: Array<ContentSlide | PillarsSlide | StatsSlide>;
  closing: ClosingSlide;
}

// ── HTML builder ──────────────────────────────────────────────────────────
function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function buildSlideSection(
  slide: ContentSlide | PillarsSlide | StatsSlide,
  idx: number,
  alt: boolean
): string {
  const tint = alt ? "tint-b" : "tint-a";
  const id = `s${idx}`;
  const num = String(idx).padStart(2, "0");

  if (slide.type === "content") {
    const bodyHtml = slide.body
      .map((p, i) => `<p${i === 0 ? ' class="lede"' : ""}>${escapeHtml(p)}</p>`)
      .join("\n        ");
    const sideItemsHtml = slide.sideItems
      .map(
        (item) =>
          `<li>${escapeHtml(item.main)}<span class="sub">${escapeHtml(item.sub)}</span></li>`
      )
      .join("\n          ");
    return `
  <section class="slide ${tint}" id="${id}">
    <div class="s-index">${num}</div>
    <div class="kicker"><span class="dash"></span>${escapeHtml(slide.sectionLabel)}</div>
    <h2 class="s-title">${escapeHtml(slide.title)}</h2>
    <div class="s-content">
      <div class="s-body">
        ${bodyHtml}
      </div>
      <div class="side-panel">
        <div class="label">${escapeHtml(slide.sideLabel)}</div>
        <ul>${sideItemsHtml}</ul>
      </div>
    </div>
    <span class="num">${num}</span>
  </section>`;
  }

  if (slide.type === "pillars") {
    const pillarsHtml = slide.pillars
      .map(
        (p) =>
          `<div class="pillar"><div class="p-num">${escapeHtml(p.num)}</div><h3>${escapeHtml(p.h3)}</h3><p>${escapeHtml(p.p)}</p></div>`
      )
      .join("\n      ");
    return `
  <section class="slide ${tint}" id="${id}">
    <div class="s-index">${num}</div>
    <div class="kicker"><span class="dash"></span>${escapeHtml(slide.sectionLabel)}</div>
    <h2 class="s-title">${escapeHtml(slide.title)}</h2>
    <p class="lede-top">${escapeHtml(slide.lede)}</p>
    <div class="pillars">
      ${pillarsHtml}
    </div>
    <span class="num">${num}</span>
  </section>`;
  }

  if (slide.type === "stats") {
    const statsHtml = slide.stats
      .map((s) => `<div class="stat"><div class="n">${escapeHtml(s.n)}</div><div class="l">${escapeHtml(s.l)}</div></div>`)
      .join("\n      ");
    return `
  <section class="slide ${tint}" id="${id}">
    <div class="s-index">${num}</div>
    <div class="kicker"><span class="dash"></span>${escapeHtml(slide.sectionLabel)}</div>
    <h2 class="s-title">${escapeHtml(slide.title)}</h2>
    <p class="lede-top">${escapeHtml(slide.lede)}</p>
    <div class="stat-strip">
      ${statsHtml}
    </div>
    <span class="num">${num}</span>
  </section>`;
  }

  return "";
}

function buildClosingSection(closing: ClosingSlide): string {
  const hl = escapeHtml(closing.oneLinerHL);
  const full = escapeHtml(closing.oneLiner);
  const hlSafe = full.replace(hl, `<span class="hl">${hl}</span>`);
  const flowHtml = closing.flowSteps
    .map((s, i) =>
      i < closing.flowSteps.length - 1
        ? `<span class="step">${escapeHtml(s)}</span><span class="arrow">→</span>`
        : `<span class="step">${escapeHtml(s)}</span>`
    )
    .join("\n      ");

  return `
  <section class="slide tint-a" id="closing">
    <div class="accent-bar" style="margin:0 auto 24px;"></div>
    <p class="kicker" style="justify-content:center;"><span class="dash"></span>${escapeHtml(closing.kicker)}<span class="dash"></span></p>
    <h2 class="one-liner">${hlSafe}</h2>
    <p class="closing-body">${escapeHtml(closing.body)}</p>
    <div class="flow">
      ${flowHtml}
    </div>
    <div class="contact-card">
      <span class="c-label">Contact</span>
      <span class="c-value">${escapeHtml(closing.contactValue)}</span>
    </div>
  </section>`;
}

function buildPresentationHTML(
  data: PresentationJSON,
  theme: typeof THEME_CONFIGS[string],
  topicName: string
): string {
  const t = theme;
  const line = `rgba(${parseInt(t.cream.slice(1, 3), 16)},${parseInt(t.cream.slice(3, 5), 16)},${parseInt(t.cream.slice(5, 7), 16)},0.12)`;

  // Title: replace accent phrase
  const titleSafe = escapeHtml(data.cover.title);
  const accentSafe = escapeHtml(data.cover.titleAccent);
  const titleWithAccent = titleSafe.replace(
    accentSafe,
    `<span class="accent">${accentSafe}</span>`
  );

  // Nav rail
  const railLinks = [
    `<a href="#s0" data-label="Cover" class="active"></a>`,
    ...data.slides.map(
      (s, i) =>
        `<a href="#s${i + 1}" data-label="${String(i + 1).padStart(2, "0")} ${s.title.slice(0, 22)}"></a>`
    ),
    `<a href="#closing" data-label="Closing"></a>`,
  ].join("\n  ");

  // Slide sections
  const slideSectionsHtml = data.slides
    .map((slide, i) => buildSlideSection(slide, i + 1, i % 2 === 0))
    .join("\n");

  const closingSectionHtml = buildClosingSection(data.closing);

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(topicName)} — Notexia Presentation</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Newsreader:ital,wght@0,400;0,500;0,600;1,400;1,500&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
<style>
:root{
  --bg-950:${t.bg950};
  --bg-900:${t.bg900};
  --accent-500:${t.accent500};
  --accent-300:${t.accent300};
  --gold-500:${t.gold500};
  --gold-300:${t.gold300};
  --cream:${t.cream};
  --cream-dim:${t.creamDim};
  --line:${line};
}
*{margin:0;padding:0;box-sizing:border-box;}
html{scroll-behavior:smooth;}
body{background:var(--bg-950);color:var(--cream);font-family:'Newsreader',serif;overflow-x:hidden;}
::selection{background:var(--gold-500);color:var(--bg-950);}
h1,h2,h3,.display,.s-title,.s-index{font-family:'Space Grotesk',sans-serif;letter-spacing:-0.02em;}
.mono{font-family:'JetBrains Mono',monospace;letter-spacing:0.04em;}

/* Rail */
.rail{position:fixed;right:28px;top:50%;transform:translateY(-50%);display:flex;flex-direction:column;gap:12px;z-index:100;}
.rail a{width:8px;height:8px;border-radius:50%;background:rgba(246,244,239,0.22);display:block;transition:all .3s ease;position:relative;text-decoration:none;}
.rail a.active{background:var(--gold-500);box-shadow:0 0 0 3px rgba(245,158,11,0.2);transform:scale(1.35);}
.rail a::after{content:attr(data-label);position:absolute;right:20px;top:50%;transform:translateY(-50%);font-family:'JetBrains Mono',monospace;font-size:11px;color:var(--cream-dim);white-space:nowrap;opacity:0;pointer-events:none;transition:opacity .2s ease;}
.rail a:hover::after{opacity:1;}
@media(max-width:820px){.rail{display:none;}}

/* Deck */
.deck{scroll-snap-type:y mandatory;height:100vh;overflow-y:scroll;}
.slide{scroll-snap-align:start;min-height:100vh;width:100%;display:flex;flex-direction:column;justify-content:center;padding:76px 100px;position:relative;border-bottom:1px solid var(--line);}
@media(max-width:820px){.slide{padding:44px 26px;}}

/* Kicker */
.kicker{display:flex;align-items:center;gap:10px;font-family:'JetBrains Mono',monospace;font-size:12px;letter-spacing:0.12em;text-transform:uppercase;color:var(--gold-300);margin-bottom:26px;}
.kicker .dash{width:28px;height:1px;background:var(--gold-500);display:inline-block;}

/* Slide num watermark */
.num{position:absolute;bottom:40px;left:100px;font-family:'JetBrains Mono',monospace;font-size:12px;color:rgba(246,244,239,0.28);}
@media(max-width:820px){.num{left:26px;bottom:20px;}}

/* Cover */
#s0{background:radial-gradient(ellipse 900px 500px at 15% 20%,rgba(79,70,229,0.28),transparent 60%),radial-gradient(ellipse 700px 500px at 85% 80%,rgba(245,158,11,0.10),transparent 60%),var(--bg-950);}
.badge-row{display:flex;align-items:center;gap:18px;margin-bottom:34px;}
.logo-badge{width:52px;height:52px;border-radius:14px;background:linear-gradient(135deg,var(--accent-500),var(--bg-900));display:flex;align-items:center;justify-content:center;font-family:'Space Grotesk',sans-serif;font-weight:700;font-size:22px;position:relative;box-shadow:0 8px 30px rgba(79,70,229,0.35);}
.logo-badge::after{content:'';position:absolute;top:-6px;right:-6px;width:16px;height:16px;background:var(--gold-500);clip-path:polygon(0 0,100% 0,100% 100%);border-radius:0 4px 0 0;}
.powered-by{font-family:'Space Grotesk',sans-serif;font-weight:600;font-size:15px;color:var(--cream);border:1px solid var(--line);border-radius:100px;padding:9px 18px;background:rgba(246,244,239,0.03);}
.title-xl{font-size:clamp(44px,6.2vw,88px);font-weight:700;line-height:0.99;max-width:16ch;}
.title-xl .accent{color:var(--gold-500);}
.subtitle{margin-top:26px;font-family:'Newsreader',serif;font-style:italic;font-size:20px;color:var(--cream-dim);max-width:54ch;line-height:1.65;font-weight:400;}
.scroll-cue{position:absolute;bottom:46px;right:100px;font-family:'JetBrains Mono',monospace;font-size:11px;color:var(--cream-dim);display:flex;align-items:center;gap:10px;}
.scroll-cue .line{width:1px;height:32px;background:linear-gradient(var(--gold-500),transparent);animation:pulse 1.8s infinite;}
@keyframes pulse{0%,100%{opacity:.25}50%{opacity:1}}
@media(max-width:820px){.scroll-cue{right:26px;}}

/* Ghost index */
.s-index{font-family:'Space Grotesk',sans-serif;font-size:14vw;line-height:0.75;font-weight:700;color:transparent;-webkit-text-stroke:1.5px rgba(246,244,239,0.12);position:absolute;top:34px;right:56px;z-index:0;pointer-events:none;user-select:none;}
@media(max-width:820px){.s-index{font-size:26vw;top:14px;right:14px;}}

/* Content slide */
.s-title{font-size:clamp(26px,3.5vw,46px);font-weight:600;max-width:20ch;line-height:1.1;position:relative;z-index:1;}
.s-content{display:grid;grid-template-columns:1.3fr 0.9fr;gap:52px;margin-top:28px;position:relative;z-index:1;}
@media(max-width:900px){.s-content{grid-template-columns:1fr;gap:24px;}}
.s-body p{font-size:18px;line-height:1.8;color:var(--cream-dim);max-width:58ch;}
.s-body p+p{margin-top:16px;}
.s-body .lede{font-size:20px;color:var(--cream);font-style:italic;}
.side-panel{border-left:1px solid var(--line);padding-left:28px;}
.side-panel .label{font-family:'JetBrains Mono',monospace;font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:rgba(246,244,239,0.38);margin-bottom:14px;}
.side-panel ul{list-style:none;}
.side-panel li{font-family:'Space Grotesk',sans-serif;font-size:15px;color:var(--cream);padding:10px 0;border-bottom:1px solid var(--line);display:flex;align-items:baseline;gap:10px;flex-direction:column;}
.side-panel li:last-child{border-bottom:none;}
.side-panel li::before{content:'→';color:var(--gold-500);font-size:13px;display:block;}
.side-panel li{flex-direction:row;align-items:flex-start;}
.side-panel li .sub{display:block;font-family:'Newsreader',serif;font-size:13px;font-style:italic;color:var(--cream-dim);margin-top:2px;}

/* Tints */
.tint-a{background:linear-gradient(180deg,var(--bg-950),var(--bg-900) 120%);}
.tint-b{background:linear-gradient(180deg,var(--bg-900),var(--bg-950) 120%);}

/* Pillars */
.pillars{display:grid;grid-template-columns:repeat(3,1fr);gap:28px;margin-top:36px;position:relative;z-index:1;}
@media(max-width:820px){.pillars{grid-template-columns:1fr;}}
.pillar{border:1px solid var(--line);border-radius:16px;padding:26px 24px;background:rgba(246,244,239,0.02);}
.pillar .p-num{font-family:'JetBrains Mono',monospace;font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:var(--gold-300);margin-bottom:14px;}
.pillar h3{font-family:'Space Grotesk',sans-serif;font-size:19px;font-weight:600;margin-bottom:10px;color:var(--cream);}
.pillar p{font-family:'Newsreader',serif;font-size:15.5px;line-height:1.65;color:var(--cream-dim);}
.lede-top{font-size:19px;color:var(--cream);font-style:italic;max-width:64ch;position:relative;z-index:1;margin-top:22px;line-height:1.7;}

/* Stats */
.stat-strip{display:grid;grid-template-columns:repeat(4,1fr);gap:20px;margin-top:38px;position:relative;z-index:1;}
@media(max-width:820px){.stat-strip{grid-template-columns:repeat(2,1fr);}}
.stat{border-top:1px solid var(--line);padding-top:16px;}
.stat .n{font-family:'Space Grotesk',sans-serif;font-size:34px;font-weight:700;color:var(--gold-500);}
.stat .l{font-family:'JetBrains Mono',monospace;font-size:11.5px;color:var(--cream-dim);text-transform:uppercase;letter-spacing:0.06em;margin-top:6px;}

/* Closing */
#closing{align-items:center;text-align:center;}
.accent-bar{width:56px;height:4px;border-radius:4px;background:var(--gold-500);}
.one-liner{font-family:'Newsreader',serif;font-style:italic;font-size:clamp(22px,3vw,36px);font-weight:500;max-width:30ch;margin:0 auto;line-height:1.55;color:var(--cream);}
.one-liner .hl{color:var(--gold-500);font-style:normal;font-weight:600;}
.closing-body{margin-top:18px;font-family:'Newsreader',serif;font-size:16px;color:var(--cream-dim);max-width:52ch;margin-left:auto;margin-right:auto;line-height:1.7;}
.flow{margin-top:38px;display:flex;align-items:center;justify-content:center;gap:14px;flex-wrap:wrap;font-family:'JetBrains Mono',monospace;font-size:13px;letter-spacing:0.05em;}
.flow span.step{padding:10px 20px;border:1px solid rgba(245,158,11,0.3);border-radius:100px;color:var(--gold-300);background:rgba(245,158,11,0.05);}
.flow span.arrow{color:var(--cream-dim);}
.contact-card{margin-top:44px;display:inline-flex;flex-direction:column;gap:6px;border:1px solid var(--line);border-radius:16px;padding:26px 40px;background:rgba(246,244,239,0.02);}
.contact-card .c-label{font-family:'JetBrains Mono',monospace;font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:rgba(246,244,239,0.38);}
.contact-card .c-value{font-family:'Space Grotesk',sans-serif;font-size:20px;font-weight:600;color:var(--gold-300);}
</style>
</head>
<body>

<nav class="rail" id="rail">
  ${railLinks}
</nav>

<div class="deck" id="deck">

  <!-- COVER -->
  <section class="slide" id="s0">
    <div class="badge-row">
      <div class="logo-badge">N</div>
      <span class="powered-by">Notexia AI Presentation</span>
    </div>
    <div class="kicker"><span class="dash"></span>${escapeHtml(data.cover.kicker)}</div>
    <h1 class="title-xl">${titleWithAccent}</h1>
    <p class="subtitle">${escapeHtml(data.cover.subtitle)}</p>
    <div class="scroll-cue"><span class="line"></span>SCROLL</div>
  </section>

${slideSectionsHtml}
${closingSectionHtml}

</div>

<!-- Floating nav controls -->
<div class="ctrl-bar" id="ctrlBar">
  <button class="key-btn" id="prevBtn" title="Previous slide (↑)">
    <span class="key-cap">↑</span>
  </button>
  <div class="slide-counter" id="slideCounter">1 / 1</div>
  <button class="key-btn" id="nextBtn" title="Next slide (↓ / Space)">
    <span class="key-cap">↓</span>
  </button>
  <div class="ctrl-divider"></div>
  <button class="key-btn key-wide" id="fsBtn" title="Fullscreen (F)">
    <span class="key-cap">F</span>
    <span class="key-label">full</span>
  </button>
</div>

<style>
.ctrl-bar{
  position:fixed;bottom:28px;left:50%;transform:translateX(-50%);
  display:flex;align-items:center;gap:8px;
  background:rgba(10,8,20,0.82);backdrop-filter:blur(14px);
  border:1px solid rgba(246,244,239,0.10);border-radius:16px;
  padding:10px 14px;z-index:200;
  box-shadow:0 8px 32px rgba(0,0,0,0.5),0 0 0 1px rgba(246,244,239,0.04);
  transition:opacity .3s ease;
}
.ctrl-bar.hidden{opacity:0;pointer-events:none;}
.key-btn{
  background:rgba(246,244,239,0.06);
  border:1px solid rgba(246,244,239,0.14);
  border-bottom:3px solid rgba(246,244,239,0.22);
  border-radius:9px;
  color:var(--cream);
  cursor:pointer;
  display:flex;align-items:center;justify-content:center;gap:5px;
  font-family:'JetBrains Mono',monospace;
  min-width:42px;height:42px;padding:0 10px;
  transition:all .12s ease;
  user-select:none;
}
.key-btn:hover{
  background:rgba(246,244,239,0.11);
  border-color:rgba(246,244,239,0.22);
  border-bottom-color:rgba(246,244,239,0.36);
  transform:translateY(-1px);
}
.key-btn:active{
  transform:translateY(1px);
  border-bottom-width:1px;
  background:rgba(246,244,239,0.04);
}
.key-btn.key-wide{min-width:64px;}
.key-cap{font-size:14px;font-weight:500;line-height:1;}
.key-label{font-size:9px;letter-spacing:0.08em;text-transform:uppercase;color:var(--cream-dim);}
.slide-counter{
  font-family:'JetBrains Mono',monospace;font-size:12px;
  color:var(--cream-dim);min-width:48px;text-align:center;
  letter-spacing:0.06em;
}
.ctrl-divider{width:1px;height:28px;background:rgba(246,244,239,0.12);margin:0 4px;}
@media(max-width:480px){
  .ctrl-bar{bottom:16px;padding:8px 10px;gap:6px;}
  .key-btn{min-width:38px;height:38px;}
}
</style>

<script>
const links=document.querySelectorAll('.rail a');
const slides=Array.from(document.querySelectorAll('.slide'));
const deck=document.getElementById('deck');
const counter=document.getElementById('slideCounter');
const prevBtn=document.getElementById('prevBtn');
const nextBtn=document.getElementById('nextBtn');
const fsBtn=document.getElementById('fsBtn');
let currentIdx=0;

function updateCounter(){
  if(counter)counter.textContent=(currentIdx+1)+' / '+slides.length;
}
function scrollToSlide(idx){
  if(!deck||idx<0||idx>=slides.length)return;
  currentIdx=idx;
  deck.scrollTo({top:idx*deck.clientHeight,behavior:'smooth'});
  updateCounter();
}
function next(){scrollToSlide(Math.min(currentIdx+1,slides.length-1));}
function prev(){scrollToSlide(Math.max(currentIdx-1,0));}

if(prevBtn)prevBtn.addEventListener('click',prev);
if(nextBtn)nextBtn.addEventListener('click',next);

if(fsBtn){
  fsBtn.addEventListener('click',()=>{
    if(!document.fullscreenElement){
      document.documentElement.requestFullscreen();
      fsBtn.querySelector('.key-label').textContent='exit';
    }else{
      document.exitFullscreen();
      fsBtn.querySelector('.key-label').textContent='full';
    }
  });
}

// Track current slide via IntersectionObserver
const observer=new IntersectionObserver(entries=>{
  entries.forEach(entry=>{
    if(entry.isIntersecting){
      const id=entry.target.getAttribute('id');
      const idx=slides.indexOf(entry.target);
      if(idx>=0){currentIdx=idx;updateCounter();}
      links.forEach(l=>l.classList.remove('active'));
      const match=document.querySelector('.rail a[href="#'+id+'"]');
      if(match)match.classList.add('active');
    }
  });
},{threshold:0.5});
slides.forEach(s=>observer.observe(s));

// Keyboard
document.addEventListener('keydown',e=>{
  if(!deck)return;
  if(e.key==='ArrowDown'||e.key===' '){e.preventDefault();next();}
  if(e.key==='ArrowUp'){e.preventDefault();prev();}
  if(e.key==='f'||e.key==='F'){fsBtn&&fsBtn.click();}
});

// Hide bar when fullscreen
document.addEventListener('fullscreenchange',()=>{
  const bar=document.getElementById('ctrlBar');
  if(bar)bar.style.display=document.fullscreenElement?'none':'flex';
});

updateCounter();
</script>
</body>
</html>`;
}


function cleanJSON(raw: string): string {
  let s = raw.replace(/```json/gi, "").replace(/```/gi, "").trim();
  const obj = s.match(/\{[\s\S]*\}/);
  if (obj) return obj[0];
  return s;
}

// ── POST /api/ppt/generate ────────────────────────────────────────────────
export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized. Please sign in." }, { status: 401 });
    }

    const body = await req.json() as {
      topic: string;
      slideCount?: number;
      themeId?: string;
      audience?: string;
      extraContext?: string;
    };

    const {
      topic,
      slideCount = 7,
      themeId = "indigo-amber",
      audience = "general",
      extraContext,
    } = body;

    if (!topic?.trim()) {
      return NextResponse.json({ error: "Topic is required." }, { status: 400 });
    }
    if (topic.trim().length > 500) {
      return NextResponse.json({ error: "Topic must be under 500 characters." }, { status: 400 });
    }

    const contentSlides = Math.min(Math.max(Number(slideCount) || 5, 2), 10);
    const themeConfig = THEME_CONFIGS[themeId] || THEME_CONFIGS["indigo-amber"];
    const cleanTopic = topic.trim();

    const audienceNote =
      audience === "student"
        ? "Audience: students — use clear language, analogies, relatable examples."
        : audience === "professional"
          ? "Audience: professionals — focus on applied knowledge, industry context, business value, metrics."
          : "Audience: general — balanced mix of concepts, examples, and real-world relevance.";

    // ── Phase 1: Research ────────────────────────────────────────────────
    const researchRaw = await generateGeminiContent({
      systemPrompt: `You are a world-class research assistant. Produce a deep, factual, comprehensive research brief. Return ONLY valid JSON — no markdown, no code fences.`,
      userPrompt: `Research this topic thoroughly: "${cleanTopic}"
${extraContext ? `Additional focus: ${extraContext.trim()}` : ""}
${audienceNote}

Return a JSON object:
{
  "overview": "3-4 sentence high-level summary",
  "keyPoints": ["important fact/insight 1", "fact 2", "fact 3", "fact 4", "fact 5", "fact 6"],
  "subtopics": [
    { "title": "subtopic heading", "points": ["detail 1", "detail 2", "detail 3"], "lede": "1-2 sentence framing" }
  ],
  "statistics": [{ "value": "e.g. 73%", "label": "of companies use X" }],
  "applications": ["real-world application 1", "application 2", "application 3"],
  "quote": { "text": "a real, accurate quote about the topic", "author": "Full Name, Title" },
  "misconceptions": ["common misconception 1", "misconception 2"],
  "suggestedSlideTopics": ["topic 1", "topic 2", "topic 3", "topic 4", "topic 5", "topic 6", "topic 7", "topic 8"]
}
Return ONLY the JSON object.`,
      temperature: 0.3,
      jsonMode: true,
    });

    let research: Record<string, unknown> = {};
    try {
      research = JSON.parse(cleanJSON(researchRaw));
    } catch {
      research = { rawNotes: researchRaw.slice(0, 3000) };
    }

    // ── Phase 2: Presentation JSON ───────────────────────────────────────
    const slideTypeMix = (() => {
      const types: string[] = [];
      for (let i = 0; i < contentSlides; i++) {
        if (i % 3 === 0) types.push("content");
        else if (i % 3 === 1) types.push("pillars");
        else types.push(research.statistics && (research.statistics as unknown[]).length >= 3 ? "stats" : "content");
      }
      return types;
    })();

    const slideTypeDocs = slideTypeMix.map((t, i) => {
      if (t === "content")
        return `Slide ${i + 1}: type "content" — editorial text + side panel`;
      if (t === "pillars")
        return `Slide ${i + 1}: type "pillars" — 3 pillar cards with heading + paragraph each`;
      return `Slide ${i + 1}: type "stats" — 4 statistics with large number + label`;
    }).join("\n");

    const presentationRaw = await generateGeminiContent({
      systemPrompt: `You are an elite editorial presentation writer. You produce structured JSON for high-end, scroll-based HTML presentations.
ALL content must come directly from the research brief provided. Write in a confident, editorial voice.
Return ONLY valid JSON — no markdown, no code fences.`,
      userPrompt: `Create a high-end editorial presentation on: "${cleanTopic}"
${audienceNote}

RESEARCH BRIEF (sole source of truth):
${JSON.stringify(research, null, 2)}

REQUIRED SLIDE MIX (${contentSlides} content slides):
${slideTypeDocs}

Return a JSON object with this exact schema:

{
  "cover": {
    "kicker": "SHORT TOPIC CATEGORY IN CAPS (3-5 words)",
    "title": "Compelling 6-12 word headline using strong verbs",
    "titleAccent": "2-4 words from the title to highlight (must appear verbatim in title)",
    "subtitle": "2-3 sentence editorial summary explaining what this presentation covers and why it matters. Use Newsreader-style flowing prose."
  },
  "slides": [
    // For type "content":
    {
      "type": "content",
      "index": "01",
      "sectionLabel": "SECTION THEME IN CAPS (2-4 words)",
      "title": "Specific slide title (5-9 words, not generic)",
      "lede": "Opening italic sentence that frames the slide (20-35 words)",
      "body": ["paragraph 1 (60-90 words, analytical prose)", "paragraph 2 (50-80 words)", "optional paragraph 3 (40-60 words)"],
      "sideLabel": "Label for the side panel list (3-5 words)",
      "sideItems": [
        { "main": "Short item heading (4-6 words)", "sub": "Brief elaboration in italic (8-14 words)" }
      ]
    },
    // For type "pillars":
    {
      "type": "pillars",
      "index": "02",
      "sectionLabel": "SECTION THEME IN CAPS",
      "title": "Specific slide title (5-9 words)",
      "lede": "Framing sentence for the three pillars (20-30 words)",
      "pillars": [
        { "num": "01 — PILLAR NAME", "h3": "Pillar heading (3-5 words)", "p": "2-3 sentence explanation (40-60 words)" }
      ]
    },
    // For type "stats":
    {
      "type": "stats",
      "index": "03",
      "sectionLabel": "SECTION THEME IN CAPS",
      "title": "Specific slide title (5-9 words)",
      "lede": "Context sentence for the data (20-30 words)",
      "stats": [
        { "n": "Large display number/value (e.g. 73%, $4.2B, 10×)", "l": "What the number means (6-10 words uppercase)" }
      ]
    }
  ],
  "closing": {
    "kicker": "CLOSING SECTION LABEL IN CAPS",
    "oneLiner": "One memorable closing sentence (18-28 words) that distills the key takeaway.",
    "oneLinerHL": "3-6 words from oneLiner to highlight (must appear verbatim)",
    "body": "2-3 sentence practical next step or call to action (40-60 words).",
    "flowSteps": ["STEP 1 (2-3 words)", "STEP 2", "STEP 3"],
    "contactValue": "hello@notexia.com"
  }
}

QUALITY RULES:
- Titles must be specific — never use generic headings like "Introduction" or "Overview"
- Body paragraphs must contain real information from the research, not vague statements
- Side panel items should be concrete, not abstract
- Pillar headings and paragraphs must be substantive (use actual content from research)
- Stats: use real numbers from research; if not enough, derive reasonable industry estimates
- The oneLiner must be memorable and quotable
- sideItems: 4-6 items per content slide
- pillars: exactly 3 pillars per pillars slide
- stats: exactly 4 stats per stats slide
- flowSteps: exactly 3 steps

Return ONLY the JSON object.`,
      temperature: 0.55,
      jsonMode: true,
    });

    let presJSON: PresentationJSON;
    try {
      presJSON = JSON.parse(cleanJSON(presentationRaw)) as PresentationJSON;
      if (!presJSON.cover || !Array.isArray(presJSON.slides) || !presJSON.closing) {
        throw new Error("Invalid structure");
      }
    } catch (e) {
      console.error("[ppt/generate] Failed to parse presentation JSON:", presentationRaw.slice(0, 800), e);
      return NextResponse.json(
        { error: "AI returned an invalid response. Please try again." },
        { status: 500 }
      );
    }

    const html = buildPresentationHTML(presJSON, themeConfig, cleanTopic);

    return NextResponse.json({
      html,
      topic: cleanTopic,
      themeId,
      slideCount: (presJSON.slides?.length ?? 0) + 2, // +cover +closing
    });
  } catch (err) {
    console.error("[ppt/generate] Error:", err);
    return NextResponse.json(
      { error: "Failed to generate presentation. Please try again." },
      { status: 500 }
    );
  }
}
