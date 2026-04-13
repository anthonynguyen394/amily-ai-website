# Amily AI Website

Landing page for Amily AI -- an AI automation business targeting Melbourne SMBs (tradies, cafes, professional services).

## Tech Stack

| Layer | Tool | Version |
|---|---|---|
| Framework | React | 19 |
| Bundler | Vite | 8 |
| CSS | Tailwind CSS | 3.4 |
| Animations | GSAP 3 + ScrollTrigger | 3.14 |
| Icons | Lucide React | 1.8 |
| Fonts | Nunito (sans), Fraunces (serif), IBM Plex Mono (mono) | Google Fonts via CDN |

## Brand Tokens

Defined in `tailwind.config.js`:

| Token | Hex | Usage |
|---|---|---|
| navy | `#1e3a5f` | Primary text, dark sections, CTAs |
| terracotta | `#c97b5d` | Accent, `.ai` brand highlight, hover states |
| cream | `#faf5eb` | Hero background, light sections |
| charcoal | `#0c1b30` | Headings, body text |
| mustard | `#e8b04e` | Stars, underline gradients, highlights |

Logo text: `amily` in navy + `.ai` in terracotta.

## Project Structure

```
src/
  App.jsx        -- All components (~1150 lines, single file)
  index.css      -- Custom animations (float, marquee, cursor-blink, pulse-dot, shuffler, rotate, scan, pulse-wave)
  main.jsx       -- React entry point
public/
  assets/        -- Logo files + 6 Amily character PNGs (transparent bg via rembg)
index.html       -- Entry HTML with Google Fonts CDN links
tailwind.config.js
vite.config.js
```

## Page Sections (top to bottom)

1. **Navbar** -- Floating glass pill, fixed top-center, semi-transparent. Links: Services, How It Works, Pricing. CTA: "Book a Free Call"
2. **Hero** -- Warm cream gradient bg. Centered amily.ai logo with 4 floating animated badges orbiting it (call answered, 4.9 stars, 12 jobs booked, $4,200 saved). Headline: "Stop losing jobs to missed calls." Two CTAs
3. **Marquee Ticker** -- Navy bar with sliding industry facts between hero and features
4. **Features** -- 3 animated interactive cards:
   - ShufflerCard: voice receptionist (shuffling text animation)
   - TypewriterCard: review management (typewriter effect)
   - SchedulerCard: AI consulting (calendar animation)
   - Each card has an Amily character PNG header icon (80px, tinted container)
5. **How It Works** -- 3-column cards (Discovery / Build / Results), GSAP fade-up
6. **Philosophy** -- Dark navy manifesto section, GSAP line-by-line reveal
7. **Pricing** -- 3-tier grid: Essential ($99/mo), Performance ($249/mo, highlighted), Enterprise ($3,500 setup)
8. **Footer** -- Dark charcoal, rounded-t-4xl, "System Operational" pulse indicator

## Design Decisions

- No stock photos in hero -- pure gradient + floating badges (stock photos looked too generic/geographic)
- Amily character PNGs used as feature card header icons only, NOT in hero (transparent PNG fringe issue on cream bg)
- PNGs processed with rembg (U2Net ML model) for proper alpha transparency
- No sticky-stacking ScrollTrigger -- was buggy, cards stuck on screen. Use simple GSAP fade-up instead
- Navbar always shows navy text (hero bg is light cream, white text would be invisible)
- Style inspiration: ahm.com.au, a purple/green finance site Anthony referenced

## Development

```bash
npm install
npm run dev          # Vite dev server (localhost:5173)
npm run build        # Production build to dist/
```

### Serving on Pi (production build)

Dev server CSS breaks over network due to WebSocket HMR. Use production build instead:

```bash
npm run build
cp -r public/assets dist/
cd dist && python3 -m http.server 5173 --bind 0.0.0.0
```

## Conventions

- All components live in `src/App.jsx` (single-file architecture for now)
- Custom CSS animations in `src/index.css`, Tailwind utility classes for layout/spacing
- GSAP for scroll-triggered animations and entrance effects
- Lucide React for all icons (no FontAwesome, no custom SVGs)
- Mobile-first responsive: badges hidden below `lg`, CTA buttons stack below `sm`

## Parent Project

This website is part of the Amily AI business project. Business context (tech stack decisions, pricing model, Australian regulatory requirements, voice AI platform choices) lives in the parent repo `amily-ai` at `projects/ai-agent-business/`.
