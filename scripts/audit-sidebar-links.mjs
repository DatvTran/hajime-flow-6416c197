/**
 * Checks that every URL in AppSidebar.tsx resolves to a defined route in App.tsx.
 * Exits non-zero if any sidebar link has no matching route.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

const sidebarSrc = fs.readFileSync(path.join(root, "src/components/AppSidebar.tsx"), "utf8");
const appSrc = fs.readFileSync(path.join(root, "src/App.tsx"), "utf8");

// Extract url: "..." values from sidebar
const sidebarUrls = [...sidebarSrc.matchAll(/url:\s*["']([^"'?#]+)/g)]
  .map((m) => m[1].split("?")[0]) // strip query strings
  .filter((u) => u.startsWith("/"))
  .map((u) => u.replace(/\/$/, "") || "/");

// Extract path="..." values from App.tsx routes
const routePaths = [...appSrc.matchAll(/path=["']([^"']+)["']/g)].map((m) => m[1]);

// Convert route paths to a set of exact and prefix matchers
const exactRoutes = new Set(routePaths.filter((p) => !p.includes(":")));
const paramRoutes = routePaths.filter((p) => p.includes(":"));

function isResolved(url) {
  if (exactRoutes.has(url)) return true;
  // Check if it matches a param route pattern like /retail/orders/:orderId
  return paramRoutes.some((r) => {
    const pattern = new RegExp(
      "^" + r.replace(/:[^/]+/g, "[^/]+") + "$"
    );
    return pattern.test(url);
  });
}

const dedupedUrls = [...new Set(sidebarUrls)];
const broken = dedupedUrls.filter((u) => !isResolved(u));

if (broken.length === 0) {
  console.log(`OK: all ${dedupedUrls.length} sidebar URLs resolve to defined routes`);
  process.exit(0);
} else {
  console.error(`FAIL: ${broken.length} sidebar URL(s) have no matching route:`);
  broken.forEach((u) => console.error(`  ${u}`));
  process.exit(1);
}
