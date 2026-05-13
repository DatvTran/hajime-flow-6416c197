/**
 * Audit that lazy-loaded page imports in App.tsx and all @/ alias imports
 * in src/ resolve to real files on disk.
 *
 * Checks:
 *   1. Every lazyWithChunkReload(() => import("./pages/X")) in App.tsx
 *      has a matching src/pages/X.tsx (or X/index.tsx).
 *   2. Every `from "@/..."` import in src/**\/*.{ts,tsx} resolves under src/.
 *
 * Exit 1 if any import is unresolvable.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const srcDir = path.join(root, "src");

let failures = 0;

// ─── Check 1: lazy page imports in App.tsx ────────────────────────────────────

const appSrc = fs.readFileSync(path.join(srcDir, "App.tsx"), "utf8");
const lazyMatches = [
  ...appSrc.matchAll(/lazyWithChunkReload\(\s*\(\)\s*=>\s*import\(["']\.\/pages\/([^"']+)["']\)/g),
];

for (const [, pageName] of lazyMatches) {
  const candidates = [
    path.join(srcDir, "pages", `${pageName}.tsx`),
    path.join(srcDir, "pages", `${pageName}.ts`),
    path.join(srcDir, "pages", pageName, "index.tsx"),
    path.join(srcDir, "pages", pageName, "index.ts"),
  ];
  if (!candidates.some((c) => fs.existsSync(c))) {
    console.error(`MISSING PAGE: src/pages/${pageName}.tsx (referenced in App.tsx)`);
    failures++;
  }
}

// ─── Check 2: @/ alias imports across all src files ──────────────────────────

function walk(dir) {
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) results.push(...walk(full));
    else if (/\.(tsx?|jsx?)$/.test(entry.name)) results.push(full);
  }
  return results;
}

const aliasRe = /from\s+["'](@\/[^"']+)["']/g;

for (const file of walk(srcDir)) {
  const src = fs.readFileSync(file, "utf8");
  for (const [, alias] of src.matchAll(aliasRe)) {
    // @/ maps to src/
    const relative = alias.slice(2); // strip "@/"
    const candidates = [
      path.join(srcDir, relative),
      path.join(srcDir, `${relative}.tsx`),
      path.join(srcDir, `${relative}.ts`),
      path.join(srcDir, relative, "index.tsx"),
      path.join(srcDir, relative, "index.ts"),
    ];
    if (!candidates.some((c) => fs.existsSync(c))) {
      const displayFile = path.relative(root, file);
      console.error(`UNRESOLVED IMPORT: ${alias}  in  ${displayFile}`);
      failures++;
    }
  }
}

// ─── Summary ─────────────────────────────────────────────────────────────────

if (failures === 0) {
  const lazyCount = lazyMatches.length;
  const fileCount = walk(srcDir).length;
  console.log(`OK: ${lazyCount} lazy page import(s) and @/ imports across ${fileCount} files all resolve.`);
} else {
  console.error(`\n${failures} unresolved import(s) found.`);
  process.exit(1);
}
