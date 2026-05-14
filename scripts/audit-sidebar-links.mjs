#!/usr/bin/env node
/**
 * Verifies every sidebar navigation URL resolves to a registered React Router route.
 *
 * Catches the class of bug that caused the /orders crash: a field rename or route
 * removal that leaves a sidebar link pointing at a dead path, triggering
 * RouteErrorBoundary in production.
 *
 * Exit 0 → all sidebar URLs match a registered route.
 * Exit 1 → one or more URLs are unmatched (stop condition for daily-check.sh).
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const GREEN = '\x1b[32m';
const RED   = '\x1b[31m';
const DIM   = '\x1b[2m';
const RESET = '\x1b[0m';
const BOLD  = '\x1b[1m';

// ── Parse App.tsx for registered <Route path="..."> values ────────────────────
function extractRegisteredRoutes(content) {
  const routes = [];
  for (const m of content.matchAll(/<Route[^>]+path="([^"]+)"/g)) {
    const p = m[1];
    if (p !== '*') routes.push(p); // exclude catch-all
  }
  return routes;
}

// ── Parse AppSidebar.tsx for url: "..." values ────────────────────────────────
function extractSidebarUrls(content) {
  const urls = [];
  for (const m of content.matchAll(/url:\s*"([^"]+)"/g)) {
    urls.push(m[1]);
  }
  return urls;
}

// ── Convert a route pattern like /retail/orders/:orderId to a regex ───────────
function routeToRegex(pattern) {
  // Escape regex metacharacters except for the : param syntax we handle below
  const escaped = pattern.replace(/[.+*?^${}()|[\]\\]/g, '\\$&');
  const withParams = escaped.replace(/:[^/]+/g, '[^/]+');
  return new RegExp(`^${withParams}\\/?$`);
}

// ── Strip query string and hash (sidebar URLs like /orders?tab=approved) ──────
function stripQueryAndHash(url) {
  return url.split('?')[0].split('#')[0];
}

// ── Main ──────────────────────────────────────────────────────────────────────
const appContent     = readFileSync(path.join(ROOT, 'src/App.tsx'), 'utf-8');
const sidebarContent = readFileSync(path.join(ROOT, 'src/components/AppSidebar.tsx'), 'utf-8');

const registeredRoutes = extractRegisteredRoutes(appContent);
const rawSidebarUrls   = extractSidebarUrls(sidebarContent);
// Deduplicate (e.g. "/retail/new-order" appears twice for "New order" and "Catalog")
const sidebarUrls = [...new Set(rawSidebarUrls)];

const routeRegexes = registeredRoutes.map(r => ({ pattern: r, regex: routeToRegex(r) }));

let failures = 0;
const results = [];

for (const rawUrl of sidebarUrls) {
  const url     = stripQueryAndHash(rawUrl);
  const matched = routeRegexes.some(({ regex }) => regex.test(url));
  results.push({ url, rawUrl, matched });
  if (!matched) failures++;
}

// ── Output ────────────────────────────────────────────────────────────────────
const fileInfo = `${DIM}src/App.tsx${RESET}`;
console.log(`\n${BOLD}audit-sidebar-links${RESET} — ${sidebarUrls.length} unique sidebar URLs · ${registeredRoutes.length} routes in ${fileInfo}\n`);

for (const { url, rawUrl, matched } of results) {
  const suffix = rawUrl !== url ? ` ${DIM}(strips query: ${rawUrl})${RESET}` : '';
  if (matched) {
    console.log(`  ${GREEN}✓${RESET} ${url}${suffix}`);
  } else {
    console.log(`  ${RED}✗${RESET} ${url}${suffix}  ${RED}← no matching route${RESET}`);
  }
}

console.log('');
if (failures === 0) {
  console.log(`${GREEN}✓ All ${sidebarUrls.length} sidebar URLs resolve to registered routes.${RESET}\n`);
  process.exit(0);
} else {
  console.error(`${RED}✗ ${failures} sidebar URL(s) have no matching route — fix before deploying.${RESET}\n`);
  process.exit(1);
}
