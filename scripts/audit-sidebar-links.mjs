/**
 * Audit that every URL referenced in AppSidebar.tsx resolves to a route in App.tsx.
 * Strips query strings before matching (e.g. /distributor/orders?tab=approved → /distributor/orders).
 * Exit 1 if any sidebar URL has no matching route.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sidebarPath = path.join(root, "src/components/AppSidebar.tsx");
const appPath = path.join(root, "src/App.tsx");

// Extract all url: "..." values from the sidebar file
const sidebarSrc = fs.readFileSync(sidebarPath, "utf8");
const urlMatches = [...sidebarSrc.matchAll(/url:\s*["']([^"']+)["']/g)];
const sidebarUrls = [
  ...new Set(urlMatches.map((m) => m[1].split("?")[0])),
];

// Extract all path="..." values from App.tsx
const appSrc = fs.readFileSync(appPath, "utf8");
const routeMatches = [...appSrc.matchAll(/path=["']([^"']+)["']/g)];
const routePaths = new Set(routeMatches.map((m) => m[1]));

// A sidebar URL matches if:
//   - exact route exists, OR
//   - a route with a param segment covers it (e.g. /retail/orders/:orderId covers /retail/orders)
function isMatched(url) {
  if (routePaths.has(url)) return true;
  // check every defined route: if the route is a prefix pattern like /foo/:id,
  // treat its static prefix as a match for the sidebar URL
  for (const route of routePaths) {
    if (!route.includes(":")) continue;
    const staticPrefix = route.replace(/\/:[^/]+.*$/, "");
    if (url === staticPrefix || url.startsWith(staticPrefix + "/")) return true;
  }
  return false;
}

let failures = 0;
for (const url of sidebarUrls) {
  if (!isMatched(url)) {
    console.error(`MISSING ROUTE for sidebar URL: ${url}`);
    failures++;
  }
}

if (failures === 0) {
  console.log(`OK: all ${sidebarUrls.length} sidebar URLs resolve to routes.`);
} else {
  console.error(`\n${failures} sidebar URL(s) have no matching route — RouteErrorBoundary will fire.`);
  process.exit(1);
}
