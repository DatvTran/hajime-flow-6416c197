# Localization Audit Confirmation (2026-04-25)

This note validates the externally provided **Localization Toolkit Audit Report** against the current repository state.

## What was validated directly

1. **TS/TSX file count = 196**
   - Verified via file scan under `src` and `server`.

2. **No i18n framework installed**
   - `react-i18next`, `i18next`, `i18next-browser-languagedetector`, and `next-intl` are not present in `package.json` dependencies.

3. **No locale files / locale directory scaffold**
   - No `public/locales/*` tree exists.

4. **No translation key usage (`t('...')`)**
   - Repository search found zero `t(...)` key calls in `src`.

5. **Accessibility literal attributes present at reported scale**
   - `aria-label="..."` occurrences: 16
   - `title="..."` occurrences: 46

6. **Raw error text leakage risk exists**
   - `err.message`/`error.message` usage exists in multiple places.

## Spot-check conclusion

The report is **directionally correct** and the stage assessment (**i18n Stage 0**) is accurate:
- no i18n runtime,
- no locale resources,
- heavy hardcoded English UI literals,
- no key-based translation architecture.

Some exact category counts (e.g., hardcoded button labels/placeholders) were not independently recomputed line-by-line in this confirmation note, but the sampled evidence aligns with the report's severity and remediation priority.

## Recommended adoption order

1. Foundation: install i18n runtime + provider + locale files.
2. Highest-impact extraction first: `AppSidebar.tsx`, `Login.tsx`, shared status/toast/error pathways.
3. Replace raw `err.message` UI exposure with code-to-key mapping.
4. Add automated i18n audit script in CI to prevent regressions.

