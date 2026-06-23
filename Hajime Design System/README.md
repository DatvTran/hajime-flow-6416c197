# Hajime Design System

**Hajime (はじめ)** — "beginning." A premium Japanese spirits brand with a B2B Supply Chain OS as its operating backbone.

The logo is an **ensō** (brush-drawn circle) with the kanji **一** ("one / first") inside and はじめ rendered in kana above — ink on paper, asymmetric, intentionally imperfect. That one mark carries the whole visual language: warm stone backgrounds, sumi-black type, a single barrel-gold accent, and calm, restrained motion.

> **Sources this system was built from**
> - Uploaded logo: `uploads/websitelogo.png` → `assets/hajime-logo.png`
> - Product codebase: GitHub `DatvTran/hajime-flow-6416c197` (main) — Vite + React + shadcn/ui + Tailwind
>   - Tokens: `src/index.css`, `tailwind.config.ts`
>   - Key screens: `src/pages/Login.tsx`, `Dashboard.tsx`, `RetailHomePage.tsx`
>   - Key components: `HajimeLogo.tsx`, `AppSidebar.tsx`, `StatCard.tsx`, `StatusBadge.tsx`, `PageHeader.tsx`

---

## Product context

**Hajime Supply Chain OS** (aka *Hajime B2B Operations App*) is a single source of truth for commercial and supply operations: inventory, sales orders, CRM, purchase orders, manufacturer coordination, shipments, forecasting and reporting. It serves **five portals on one shared dataset**:

| Role | Scope |
|---|---|
| **Brand Operator (Hajime HQ)** | Command center — full access, settings, approvals |
| **Manufacturer** | Production & export portal |
| **Distributor / Wholesaler** | Warehouse & fulfillment |
| **Sales Rep** | Field accounts, draft orders, targets |
| **Retail Store** | Order catalog, track deliveries, reorder |

The product's tagline — *"Five portals — one shared dataset. Every change propagates in real time."* — is the pitch.

---

## Index (manifest)

```
README.md                  ← you are here
SKILL.md                   ← Claude Code skill entry point
colors_and_type.css        ← CSS vars: palette, type scale, radii, shadows
assets/
  hajime-logo.png          ← the ensō mark (brand primary)
fonts/                     ← Google Fonts substitutes (see Typography section)
preview/                   ← Design System tab cards (registered assets)
ui-kit-operator-dashboard.html  ← Brand Operator HQ · command-center (dark sidebar, KPIs, chart, alerts, orders table)
ui-kit-retail-store.html        ← Retail Store portal · home with live shipment tracker + reorder picks
ui-kit-auth.html                ← Sign-in · role picker + credentials on sumi ink
```

---

## CONTENT FUNDAMENTALS

Hajime's copy is **quiet, specific, and operationally honest**. It reads like someone who actually runs a supply chain wrote it — no marketing loft, no exclamation points, but small moments of craft (*"one calm view"*, *"your Hajime rep will confirm every request"*).

**Voice**
- Second person (*"you're all caught up"*, *"your Hajime rep"*) for retail/distributor-facing UI
- Third person / descriptive for HQ ops (*"drafts awaiting HQ allocation"*)
- Never marketing-speak. No "delight", no "seamless", no "empower"
- Operationally precise nouns: *sell-through, cover days, replenishment, backorder, depletion, lot, case, bottle*

**Casing**
- **Sentence case everywhere** — titles, buttons, nav, badges
  - ✓ "Command center" / "New wholesale order" / "Report depletions"
  - ✗ "Command Center" / "NEW WHOLESALE ORDER"
- **UPPERCASE only for eyebrows** (10px labels over values), tracked `0.1em`
  - "GLOBAL INVENTORY", "PENDING REVIEW", "30D SELL-THROUGH"
- **Status values are lowercased** in-app: `available`, `in-transit`, `delivered`

**Tone examples (from the product)**
- *"One calm view of sell-through, stock health, approvals, and shipments."* — dashboard subtitle
- *"Same list as Alerts hub — inventory, PO, logistics, demand, AR."* — cross-reference
- *"You're all caught up on shipments."* — empty state
- *"Five portals — one shared dataset. Every change propagates in real time."* — login footer
- *"Questions on delivery or invoicing? Your Hajime rep will confirm every request."* — support card
- Button verbs: *Approve · Hold · Reallocate · To distributor · Reorder · Quick order*

**Numbers & units**
- Tabular numerals for any quantity (`font-feature-settings: 'tnum'`)
- Explicit units: "`216 cases`", "`+12%`", "`ETA 14 Apr`", "`$48 wholesale`"
- Short date style: `15 Apr`, not `April 15, 2026`

**Emoji**
- **Never.** Not in UI, not in copy. Ever.

**Unicode glyphs as icons**
- The login role picker uses geometric unicode marks (`◉ ⚙ ◫ ◈ ◻`) — these stand in for Lucide icons in high-ceremony contexts. Use sparingly.

---

## VISUAL FOUNDATIONS

### Palette
A **warm stone paper + sumi ink** neutral system, with a single **barrel-gold** accent. No blues in chrome; blues only appear as `info` semantics.

- **Paper** `hsl(40 18% 97%)` — page background, the "stone" base
- **Sumi ink** `hsl(24 10% 10%)` — foreground text, primary buttons
- **Barrel gold** `hsl(40 88% 42%)` `#C98A0C` — signature accent, rings, primary CTAs in dark contexts, sidebar glow
- **Deep sumi** `hsl(24 12% 8%)` — sidebar, login background
- **Muted fg** `hsl(24 6% 50%)` — subdued labels, metadata

Status pills use **8% fills with 20% rings**: emerald (success), amber (warning/pending), red (destructive), blue (info/in-transit), stone (neutral/draft).

### Typography
Three families, used in strict roles:

| Family | Use | Weights |
|---|---|---|
| **Cormorant Garamond** (serif display) | h1–h3, stat values, brand marks | 300, 500, 600 |
| **DM Sans** (sans body) | All UI chrome, body, labels | 400, 500, 600 |
| **JetBrains Mono** | SKUs, order IDs, tabular numbers | 400, 500 |

Display type is **tightly tracked** (`letter-spacing: -0.02em`) and **ranges 1.2 line-height**. Body type is tracked `-0.006em` with `1.6` line-height. Stat values combine the display serif with `tabular-nums` for dignified numbers.

All three typefaces: **Cormorant Garamond is self-hosted** from static TTFs in `fonts/` (Light 300 → Bold 700, roman + italic for every weight). DM Sans and JetBrains Mono continue to load from Google Fonts — no brand files were provided for those.

### Spacing & layout
- **4-pt base** Tailwind scale (`space-1 = 4px` through `space-12 = 48px`)
- Page gutters `16/24/32px` (mobile/tablet/desktop)
- Card padding `p-5` (20px) for stat cards, `p-6` (24px) for content cards
- Sidebar width: `~256px` expanded, icon-rail collapsed
- Content max `max-w-3xl` on descriptive copy, full-bleed on dashboards

### Radii
`--radius: 10px` is the anchor. Family: `sm 6` · `md 8` · `lg 10` · `xl 14` · `2xl 18` · `full 9999`. Cards are `rounded-xl` / `rounded-2xl`; buttons are `rounded-md`; pills are `rounded-full`.

### Shadow system
Three named elevations, all with warm-ink tint (`hsl(24 10% 10%)`), not pure black.
- **Soft** — idle cards, KPI tiles
- **Lifted** — hover state, popovers
- **Float** — dialogs, toasts
Never hard / pure-black shadows. No neon / colored glows.

### Backgrounds
- Default: flat **paper** (`--background`). No gradients on main surfaces.
- Login/sumi contexts use a **radial amber bloom** (`radial-gradient(ellipse 80% 50% at 50% -10%, hsl(40 88% 42% / 0.08), transparent)`) plus `.bg-dot-grid` at 3% opacity.
- One sanctioned gradient: `.gradient-accent` (barrel gold → warm copper) for emphasis elements only.
- A subtle `.texture-noise` SVG fractal at 2.5% opacity exists but is used sparingly on hero surfaces.
- **No photographic backgrounds in chrome.** Product imagery lives in cards (4:3 thumbnails, object-cover).

### Borders
`1px solid hsl(var(--border))` — warm stone `#E3DDD2`. Ubiquitous: every card, input, row divider, sidebar section uses this one value. Reduced opacity variants (`border-border/60`, `/40`) are used to soften when density is high. No heavy 2px borders anywhere.

### Animation & motion
A **calm, restrained** motion vocabulary, powered by `--ease-out-expo` (`cubic-bezier(0.16, 1, 0.3, 1)`) for all non-trivial motion.
- **Entry**: `enter` — 500ms, fade + 8px translateY. Staggered with `.animate-enter-delay-{1..6}` at 50ms increments.
- **Fade-up**: `fadeUp` — 600ms, 16px travel, used for section reveals.
- **Count-up**: stat values pulse in with a 400ms rise.
- **Scale-in**: 200ms opacity + `scale(0.96 → 1)` for menus/popovers.
- **No bounces, no springs, no overshoot.** Nothing playful — this is operations software.
- Shimmer loading: 1.5s linear infinite, muted tones only.

### Hover & press states
- **Buttons (primary)**: `hover:bg-primary/90` — 10% darker
- **Buttons (outline/ghost)**: `hover:bg-accent` (actually means the neutral secondary hover, not gold)
- **Cards (interactive)**: shadow `soft → lifted`, `translateY(-1px)`, 300ms
- **Press (active)**: `scale(0.98)` on primary CTAs, `translateY(0)` on cards, 100ms transition
- **Rows**: `hover:bg-muted/50` at 150ms — whisper-quiet
- **Focus**: `ring-2 ring-ring ring-offset-2 ring-offset-background` — always visible, always barrel gold

### Glass & transparency
Header bar is **glass**: `backdrop-filter: blur(12px) saturate(1.4)` on `hsl(40 20% 99% / 0.8)`. This is the one place transparency appears in chrome. Dialog overlays use `bg-black/50`, no blur.

### Image treatment
Imagery (product shots, hero photography) is **warm, natural-light, grain-forward**. Think amber whisky on stone, not studio white. No cool tones, no desaturated b&w except for brand portraits. When cropping: `aspect-[4/3]` for catalog tiles, full-bleed with `object-cover` for heroes.

### Cards
A card is: `bg-card` + `border border-border` + `rounded-xl` (or `2xl` for prominent) + `shadow-soft` (optional) + `p-5` or `p-6`. Variants:
- **Default** — flat background, 1px border
- **Elevated** — adds `shadow-soft`, hover lifts to `shadow-lifted`
- **Accent/Warning/Success** — gradient-tinted backgrounds (amber-50 → amber-100 etc.) with matched 50/30 borders, used on stat cards only

### Layout rules (fixed elements)
- Sidebar is **fixed-width, left-docked**, collapsible to icon rail (`~64px`)
- Sticky header: `h-14` glass bar with sidebar trigger
- All page content lives inside `<SidebarInset>`; scrolls independently
- On retail (store-facing), layout is looser — no dark sidebar, more whitespace

---

## ICONOGRAPHY

**Primary icon set: Lucide React** (`lucide-react@^0.462`). The production app imports directly; we pull from CDN here.

- **Stroke-based, 1.5–1.75px stroke weight.** Icons are set at `h-4 w-4` (16px) in nav/buttons and `h-5 w-5` (20px) in stat cards and page headers.
- Color inherits from text (`currentColor`) — icons are *never* filled gold accidentally; they stay `muted-foreground` or `foreground/80` unless they're the intentional focus of a stat card (where the icon tile gets a tinted background).
- Common vocabulary: `LayoutDashboard Package ShoppingCart Users FileText Factory Truck BarChart3 Settings AlertTriangle Globe Warehouse Home RotateCcw User HelpCircle Target ClipboardList TrendingUp TrendingDown Receipt Gift Scale Store Wine Search Bell`.

**Logo**: `HajimeLogo` component renders a single PNG (`/hajime-logo.png`). Two variants:
- `variant="light"` — black artwork, used on warm paper
- `variant="dark"` — `brightness-0 invert` to become pale on sumi backgrounds (login, sidebar)

**Unicode geometric glyphs** are used as low-noise role markers on the Login screen (`◉ ⚙ ◫ ◈ ◻`). This is a signature move — treat it as deliberate, not decorative.

**Emoji**: never.

**Status dots**: 6×6px circles, radius-full, placed left of pill text (see `StatusBadge`).

**No hand-rolled SVG decoration.** No swoops, squiggles, or spot illustrations. The ensō logo carries all the "art."

---

## Fonts

All three typefaces are Google Fonts — no local substitution needed:
- Cormorant Garamond: [https://fonts.google.com/specimen/Cormorant+Garamond](https://fonts.google.com/specimen/Cormorant+Garamond)
- DM Sans: [https://fonts.google.com/specimen/DM+Sans](https://fonts.google.com/specimen/DM+Sans)
- JetBrains Mono: [https://fonts.google.com/specimen/JetBrains+Mono](https://fonts.google.com/specimen/JetBrains+Mono)

Loaded via `@font-face` (Cormorant, self-hosted static weights 300/400/500/600/700 × roman+italic) and `@import` (DM Sans + JetBrains Mono) at the top of `colors_and_type.css`.
