#!/usr/bin/env node
/**
 * Audit that every sidebar navigation URL has a matching React Router <Route>.
 *
 * Parses AppSidebar.tsx for url: "..." values and App.tsx for <Route path="...">
 * declarations, then cross-checks them. Query strings are stripped before matching;
 * dynamic segments (:param) in routes match any path segment.
 *
 * Exit 0: all sidebar URLs resolve. Exit 1: at least one is missing a route.
 */
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

// ── Extract sidebar URLs ──────────────────────────────────────────────────────
const sidebarSrc = readFileSync(resolve(root, 'src/components/AppSidebar.tsx'), 'utf8');
const rawSidebarUrls = [...sidebarSrc.matchAll(/url:\s*["']([^"']+)["']/g)].map((m) => m[1]);

// Deduplicate, strip query strings
const sidebarUrls = [...new Set(rawSidebarUrls.map((u) => u.split('?')[0]))];

// ── Extract registered routes ─────────────────────────────────────────────────
const appSrc = readFileSync(resolve(root, 'src/App.tsx'), 'utf8');
const registeredRoutes = [...appSrc.matchAll(/<Route\b[^>]*\bpath=["']([^"']+)["']/g)].map(
  (m) => m[1],
);

// ── Match helper ──────────────────────────────────────────────────────────────
// Converts a route pattern like "/retail/orders/:orderId" to a regex and tests it
// against a concrete URL like "/retail/orders".
function routeMatchesUrl(routePattern, url) {
  if (routePattern === '*') return true; // catch-all
  const pattern =
    '^' +
    routePattern
      .split('/')
      .map((seg) => (seg.startsWith(':') ? '[^/]+' : seg.replace(/[.+^${}()|[\]\\]/g, '\\$&')))
      .join('/') +
    '$';
  return new RegExp(pattern).test(url);
}

// ── Run audit ────────────────────────────────────────────────────────────────
let failures = 0;
const missing = [];

for (const url of sidebarUrls) {
  const matched = registeredRoutes.some((route) => routeMatchesUrl(route, url));
  if (!matched) {
    missing.push(url);
    failures++;
  }
}

// ── Report ────────────────────────────────────────────────────────────────────
if (failures === 0) {
  console.log(`OK: all ${sidebarUrls.length} sidebar URLs resolve to registered routes`);
  console.log(`    (${registeredRoutes.length} routes checked in App.tsx)`);
} else {
  for (const url of missing) {
    console.error(`MISSING ROUTE: sidebar links to "${url}" but no matching <Route> in App.tsx`);
  }
  console.error(`\nFAIL: ${failures} sidebar URL(s) have no matching route`);
  process.exit(1);
}
