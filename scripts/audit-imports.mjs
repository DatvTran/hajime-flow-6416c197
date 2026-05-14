#!/usr/bin/env node
/**
 * Walks src/ and attempts to resolve every local import specifier on disk.
 *
 * Catches broken @/ alias paths and extensionless relative imports that Vite
 * silently drops into the bundle but that blow up at runtime or after a rename.
 * This is intentionally a superset of what tsc catches — it runs even on JS
 * files and catches path typos before the type-checker sees them.
 *
 * Exit 0 → all local imports resolve.
 * Exit 1 → one or more imports cannot be found on disk.
 */
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SRC  = path.join(ROOT, 'src');

const GREEN = '\x1b[32m';
const RED   = '\x1b[31m';
const DIM   = '\x1b[2m';
const RESET = '\x1b[0m';
const BOLD  = '\x1b[1m';

// Extensions we scan
const SCAN_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.mjs']);

// Resolution candidates tried in order for each import specifier
const RESOLVE_SUFFIXES = [
  '',
  '.ts',
  '.tsx',
  '.js',
  '.mjs',
  '/index.ts',
  '/index.tsx',
  '/index.js',
  '/index.mjs',
];

// Asset extensions handled by Vite — skip these, they won't be on the TS path
const ASSET_RE = /\.(css|svg|png|jpg|jpeg|gif|ico|webp|woff2?|ttf|eot|mp4|json)$/i;

// ── File walker ───────────────────────────────────────────────────────────────
function walkDir(dir) {
  const files = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === '.git') continue;
      files.push(...walkDir(path.join(dir, entry.name)));
    } else if (entry.isFile() && SCAN_EXTENSIONS.has(path.extname(entry.name))) {
      files.push(path.join(dir, entry.name));
    }
  }
  return files;
}

// ── Import extractor ──────────────────────────────────────────────────────────
function extractLocalImports(content) {
  const specifiers = [];

  // static:  import ... from '...'  /  export ... from '...'
  // handles: import X, import {X}, import * as X, import type X, bare import '...'
  for (const m of content.matchAll(
    /^(?:import|export)(?:\s+type)?\s+(?:.*?\s+from\s+)?['"]([^'"]+)['"]/gm,
  )) {
    specifiers.push(m[1]);
  }

  // dynamic: import('...')
  for (const m of content.matchAll(/\bimport\(\s*['"]([^'"]+)['"]\s*\)/g)) {
    specifiers.push(m[1]);
  }

  return specifiers.filter(s => {
    if (!s.startsWith('.') && !s.startsWith('@/')) return false; // skip node_modules
    if (ASSET_RE.test(s)) return false;                          // skip Vite-handled assets
    return true;
  });
}

// ── Resolver ──────────────────────────────────────────────────────────────────
function tryResolve(specifier, fromFile) {
  const base = specifier.startsWith('@/')
    ? path.join(SRC, specifier.slice(2))
    : path.resolve(path.dirname(fromFile), specifier);

  for (const suffix of RESOLVE_SUFFIXES) {
    const candidate = base + suffix;
    if (existsSync(candidate) && statSync(candidate).isFile()) return candidate;
  }
  return null;
}

// ── Main ──────────────────────────────────────────────────────────────────────
const files = walkDir(SRC);
let failures = 0;

console.log(`\n${BOLD}audit-imports${RESET} — scanning ${files.length} source files in ${DIM}src/${RESET}\n`);

for (const file of files) {
  const content  = readFileSync(file, 'utf-8');
  const imports  = extractLocalImports(content);
  const rel      = path.relative(ROOT, file);

  for (const specifier of imports) {
    const resolved = tryResolve(specifier, file);
    if (!resolved) {
      console.error(`  ${RED}✗${RESET} ${DIM}${rel}${RESET}\n    cannot resolve: ${RED}${specifier}${RESET}`);
      failures++;
    }
  }
}

console.log('');
if (failures === 0) {
  console.log(`${GREEN}✓ All local imports resolved (${files.length} files scanned).${RESET}\n`);
  process.exit(0);
} else {
  console.error(`${RED}✗ ${failures} unresolved import(s) — these will fail at runtime or after a rename.${RESET}\n`);
  process.exit(1);
}
