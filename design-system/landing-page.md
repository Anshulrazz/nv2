# Notexia Landing Page Design System

## Pattern
Academic Chalkboard Excellence

## Style
Refined Chalkboard (Education-focused)

## Colors
--background: #16261D; /* board-bg */
--foreground: #F3F0E4; /* chalk-white */
--card: #1A2D23;
--card-foreground: #F3F0E4;
--popover: #121F18;
--popover-foreground: #F3F0E4;
--primary: #F0C93B; /* chalk-yellow */
--primary-foreground: #2A2118;
--secondary: #8FC3DE; /* chalk-blue */
--secondary-foreground: #2A2118;
--muted: #1F362A;
--muted-foreground: #9FAEA1;
--accent: #C9A9E0; /* chalk-lilac */
--accent-foreground: #2A2118;
--destructive: #F28B6E; /* chalk-coral */
--border: rgba(243, 240, 228, 0.15);
--input: rgba(243, 240, 228, 0.08);
--ring: #F0C93B;
--chart-1: #8FC3DE;
--chart-2: #C9A9E0;
--chart-3: #F0C93B;
--chart-4: #F28B6E;
--chart-5: #F3F0E4;

## Typography
--font-jakarta: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
--font-space-grotesk: 'Space Grotesk', system-ui, -apple-system, sans-serif;
--font-jetbrains-mono: 'JetBrains Mono', monospace;
--font-kalam: 'Kalam', cursive;

## Layout Principles
- Max width container: 1180px padding 28px
- Sticky header with blur background
- Hero section with split layout
- Feature sections with consistent spacing
- Pricing comparison table
- Testimonials grid
- Stats strip
- FAQ accordion
- Final CTA band
- Footer with multiple columns

## Components
### Buttons
- Primary (btn-solid): Chalk-yellow background, dark text, hover to lighter yellow
- Ghost (btn-ghost): Transparent with chalk-white text, hover to chalk-yellow border/border
- Link-style (btn-link): Simple text links that hover to chalk-yellow
- All use Space Grotesk font

### Cards/Sheets
- Background: #1A2D23 (card)
- Border: 1px dashed rgba(243,240,228,0.15)
- Border radius: 20px
- Box shadow: 0 1px 2px rgba(0,0,0,0.3), 0 8px 24px -12px rgba(0,0,0,0.5)
- Interior: #121F18 for headers with dashed border bottom

### Typography
- Headings: Space Grotesk (bold, tight letter spacing)
- Body: Plus Jakarta Sans (regular weight)
- Code/technical: JetBrains Mono
- Accent/handwriting: Kalam (for quotes, marginalia)

### Effects
- Subtle micro-interactions (150-300ms)
- Chalkboard texture background (cyber-grid class)
- Sticky note variations for highlights
- Dashed borders for interactive elements
- Pulse animations for live indicators
- Ticker animations for scrolling text
- Hover lifts and scale effects

## Anti-patterns to avoid
- Using emojis as structural icons
- Low contrast text (<4.5:1)
- Layout-shifting interactions on hover
- Inconsistent spacing (should use 4/8px rhythm)
- Solid borders where dashed would be more appropriate
- Overly bright colors that hurt readability in dark mode
