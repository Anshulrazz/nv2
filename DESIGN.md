# Design System: NOTEXIA (Chalkboard Cyber)

## 1. Visual Theme & Atmosphere
NOTEXIA is a restrained, tactile, and high-density **Knowledge Operating System for Student Scholars & Engineers**. The atmosphere fuses dark academic chalkboard warmth with precise code terminal architecture. It features generous double-bezel card enclosures, subtle ambient mesh glow orbs, and fluid spring-physics motion.

- **Density:** 7 (Balanced High-Density Code & Research Workspace)
- **Variance:** 8 (Asymmetric Split Layouts & Custom Bento Cards)
- **Motion:** 6 (Fluid Framer Motion Springs & Perpetual Micro-Glow)

---

## 2. Color Palette & Roles

```
┌────────────────────────────────────────────────────────────────────────┐
│                                                                        │
│  [ Deep Board Green ]    [ Chalk Yellow ]     [ Chalk Coral ]          │
│      #16261D                 #F0C93B              #F28B6E              │
│                                                                        │
│  [ Dark Core Surface ]   [ Chalk Blue ]       [ Chalk Lilac ]          │
│      #121F18                 #8FC3DE              #C9A9E0              │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

- **Deep Board Green** (`#16261D`) — Primary background canvas for main app backdrop
- **Outer Bezel Frame** (`#1A2D23`) — Outer container surface for double-bezel cards
- **Dark Core Surface** (`#121F18`) — Inner core surface for code editors, inputs, and comments
- **Chalk Yellow Accent** (`#F0C93B`) — Primary action CTAs, active pill tabs, and focus rings
- **Chalk Coral** (`#F28B6E`) — Destructive actions & tactile button shadow offset (`shadow-[2px_2px_0_0_#F28B6E]`)
- **Chalk Blue** (`#8FC3DE`) — Secondary tags, code links, and live stream indicators
- **Chalk Lilac** (`#C9A9E0`) — Academic badges, discussion dispatch tags, and ambient glow orbs
- **Chalk White** (`#F3F0E4`) — High-contrast primary text and optical display headings
- **Muted Sage Green** (`#9FAEA1`) — Secondary text labels, timestamps, and 1px structural borders

*Strict Color Rule*: The AI purple/blue neon gradient aesthetic is strictly BANNED. Pure black (`#000000`) is strictly BANNED.

---

## 3. Typography Rules

- **Display / Headlines**: `Cabinet Grotesk` or `Satoshi` (`font-heading`) — Track-tight (`letter-spacing: -0.02em`), controlled scale hierarchy, weight-driven emphasis in Chalk White (`#F3F0E4`).
- **Body Text**: System Sans-Serif stack (`font-sans`) — Relaxed leading (1.6), max 65 characters per line, comfortable long-form reading for research notes.
- **Monospace Code & Numbers**: `JetBrains Mono` or `Geist Mono` (`font-mono`) — Used for all code blocks, tabular numbers, points tallies, line numbers, and timestamps.
- **Banned Typography**: `Inter` for creative display headings, generic serifs (`Times New Roman`, `Georgia`, `Garamond`).

---

## 4. Component Stylings

### Buttons
- **Primary CTA**: Chalk Yellow fill (`#F0C93B`), dark ink text (`#2A2118`), rounded corners (`rounded-xl`), with tactile coral shadow offset (`shadow-[2px_2px_0_0_#F28B6E]`).
- **Interaction Feedback**: Tactile scale-down press state (`active:scale-[0.97]`).
- **No Outer Neon Glows**: Button glows are strictly natural soft drop shadows.

### Double-Bezel Cards
Every card and container uses a 2-layer hardware enclosure:
```tsx
<div className="rounded-[2rem] bg-[#1A2D23]/80 border border-[#F3F0E4]/15 p-2 backdrop-blur-xl shadow-[0_10px_30px_rgba(0,0,0,0.25)]">
  <div className="rounded-[calc(2rem-0.5rem)] bg-[#121F18] border border-[#F3F0E4]/10 p-6">
    {/* Content */}
  </div>
</div>
```

### Inputs & Forms
- **Field Styling**: Dark core background (`#121F18`), 1px border (`#F3F0E4]/15`), focus border in Chalk Yellow (`#F0C93B`).
- **Autocomplete Suppression**:
  ```tsx
  <Input
    type="text"
    autoComplete="off"
    autoCorrect="off"
    autoCapitalize="none"
    spellCheck={false}
    data-lpignore="true"
  />
  ```

---

## 5. Layout & Responsive Principles

- **Viewport Containment**: Contain main app layouts within `max-w-7xl` or `max-w-5xl` centered containers.
- **Full-Height Pages**: Full-screen viewports must use `min-h-[100dvh]` — never `h-screen`.
- **Mobile Collapse (< 768px)**: Multi-column bento grids collapse to a single column automatically.
- **No Overlapping Elements**: Text must never overlap images or other text cards.

---

## 6. Motion & Interaction

- **Spring Physics Default**: Framer Motion spring curve `type: "spring", stiffness: 350, damping: 22`.
- **Staggered Cascade Reveals**: Lists and feeds stagger entrance using `staggerChildren: 0.08`.
- **Perpetual Micro-Interactions**: Ambient float animation (`animate-float-glow`) for background mesh glow orbs.
- **Hardware Acceleration**: Animate exclusively via `transform` and `opacity` to preserve 60fps frame rate.

---

## 7. Anti-Patterns (Explicitly Banned)

1. **No Emojis** anywhere in UI copywriting or labels.
2. **No Pure Black (`#000000`)** — always use Deep Board Green (`#16261D`) or Dark Core (`#121F18`).
3. **No AI Neon Purple/Blue Glows**.
4. **No Generic 3-Column Equal Grids** without spatial hierarchy.
5. **No AI Copywriting Clichés** ("Elevate", "Seamless", "Unleash", "Next-Gen").
6. **No Filler Text or Bouncing Chevrons** ("Scroll to explore", "Swipe down").
7. **No Unused Imports or Dead Lint Warnings**.
