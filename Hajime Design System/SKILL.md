---
name: hajime-design
description: Use this skill to generate well-branded interfaces and assets for Hajime (Supply Chain OS for a premium Japanese spirits brand), either for production or throwaway prototypes/mocks/decks. Contains essential design guidelines, colors, type, fonts, assets, and UI kit components for prototyping.
user-invocable: true
---

Read the README.md file within this skill, and explore the other available files. The system is anchored on:

- `colors_and_type.css` — all CSS vars (palette, type scale, radii, shadows, easing)
- `assets/hajime-logo.png` — the ensō (brush-circle) brand mark
- `ui-kit-operator-dashboard.html` — Brand Operator HQ command center (dark sidebar + paper content)
- `ui-kit-retail-store.html` — Retail Store portal (live tracker + reorder)
- `ui-kit-auth.html` — Sign-in (role picker + credentials on sumi)
- `preview/` — design-system specimen cards

If creating visual artifacts (slides, mocks, throwaway prototypes, etc.), copy assets out and create static HTML files for the user to view. If working on production code, you can copy assets and read the rules here to become an expert in designing with this brand.

**Core rules to never break**
- Sentence case everywhere except eyebrows (10px uppercase, `0.1em` tracking)
- One accent — barrel gold `hsl(40 88% 42%)`. Never introduce a second brand color
- Fonts: Cormorant Garamond (display), DM Sans (body), JetBrains Mono (numbers/IDs)
- No emoji, no gradients (except sanctioned `.gradient-accent`), no bounces in motion
- Icons: Lucide, stroke-based, `currentColor`
- Copy voice: quiet, operationally precise, second person for customer-facing screens

If the user invokes this skill without any other guidance, ask them what they want to build or design, ask some questions, and act as an expert designer who outputs HTML artifacts or production code, depending on the need.
