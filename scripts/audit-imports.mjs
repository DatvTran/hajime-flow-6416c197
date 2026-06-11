#!/usr/bin/env node
/**
 * Audit that every local/alias import in src/ and server/ resolves to an
 * existing file. Package imports are validated against package.json; they are
 * NOT checked against node_modules so the script stays fast and network-free.
 *
 * Checked:
 *   - Relative imports  (./foo, ../bar)
 *   - Path-alias imports (@/lib/utils  →  src/lib/utils)
 *   - Package imports    (react, express …) — warns if not in any package.json
 *
 * Skipped:
 *   - Node built-ins (node:fs, path, crypto, …)
 *   - Type-only imports that reference .d.ts files
 *   - node_modules, dist, .git directories
 *
 * Exit 0: no broken imports. Exit 1: one or more can't be resolved.
 */
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { resolve, dirname, join, extname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

// ── Collect known packages ────────────────────────────────────────────────────
function loadDeps(pkgPath) {
  try {
    const p = JSON.parse(readFileSync(pkgPath, 'utf8'));
    return [
      ...Object.keys(p.dependencies ?? {}),
      ...Object.keys(p.devDependencies ?? {}),
      ...Object.keys(p.peerDependencies ?? {}),
    ];
  } catch {
    return [];
  }
}

const knownPackages = new Set([
  ...loadDeps(resolve(root, 'package.json')),
  ...loadDeps(resolve(root, 'server/package.json')),
]);

// ── Node built-in module names ────────────────────────────────────────────────
const NODE_BUILTINS = new Set([
  'assert', 'buffer', 'child_process', 'cluster', 'console', 'constants',
  'crypto', 'dgram', 'dns', 'domain', 'events', 'fs', 'http', 'http2',
  'https', 'inspector', 'module', 'net', 'os', 'path', 'perf_hooks',
  'process', 'punycode', 'querystring', 'readline', 'repl', 'stream',
  'string_decoder', 'sys', 'timers', 'tls', 'trace_events', 'tty', 'url',
  'util', 'v8', 'vm', 'wasi', 'worker_threads', 'zlib',
]);

function isBuiltin(name) {
  if (name.startsWith('node:')) return true;
  const base = name.split('/')[0];
  return NODE_BUILTINS.has(base);
}

// ── File resolution helpers ───────────────────────────────────────────────────
const EXTENSIONS = ['.ts', '.tsx', '.mjs', '.js', '.json'];

function tryResolveFile(absPath) {
  if (existsSync(absPath)) {
    // Exists as-is (could be a directory — handled below)
    const stat = statSync(absPath);
    if (!stat.isDirectory()) return true;
  }
  // Try appending extensions
  for (const ext of EXTENSIONS) {
    if (existsSync(absPath + ext)) return true;
  }
  // Try as directory index
  for (const ext of EXTENSIONS) {
    if (existsSync(join(absPath, 'index' + ext))) return true;
  }
  return false;
}

// ── Import extraction ─────────────────────────────────────────────────────────
// Matches: import ... from '...', export ... from '...', import('...'), require('...')
const IMPORT_RE =
  /(?:(?:^|\n)\s*(?:import|export)\s+(?:type\s+)?(?:[^'"(;\n]+from\s+)?|(?:^|\n)[^'"]*?(?:import|require)\s*\()["']([^'"]+)["']/g;

function extractImports(src) {
  const paths = [];
  let m;
  IMPORT_RE.lastIndex = 0;
  while ((m = IMPORT_RE.exec(src)) !== null) {
    if (m[1]) paths.push(m[1]);
  }
  return paths;
}

// ── Directory walker ──────────────────────────────────────────────────────────
const SKIP_DIRS = new Set(['node_modules', 'dist', '.git', 'build', 'coverage']);

function walkDir(dir, exts) {
  const results = [];
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return results;
  }
  for (const entry of entries) {
    if (SKIP_DIRS.has(entry)) continue;
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      results.push(...walkDir(full, exts));
    } else if (exts.includes(extname(entry))) {
      results.push(full);
    }
  }
  return results;
}

// ── Main audit ────────────────────────────────────────────────────────────────
const srcFiles = walkDir(resolve(root, 'src'), ['.ts', '.tsx']);
const serverFiles = walkDir(resolve(root, 'server'), ['.mjs', '.js', '.ts']);
const allFiles = [...srcFiles, ...serverFiles];

const srcRoot = resolve(root, 'src');
let failures = 0;
const fileFailures = new Map(); // filePath -> issue[]

for (const filePath of allFiles) {
  let src;
  try {
    src = readFileSync(filePath, 'utf8');
  } catch {
    continue;
  }

  const fileDir = dirname(filePath);
  const imports = extractImports(src);
  const issues = [];

  for (const imp of imports) {
    if (imp.startsWith('.')) {
      // Relative import
      const abs = resolve(fileDir, imp);
      if (!tryResolveFile(abs)) {
        issues.push(`Cannot resolve relative import "${imp}"`);
      }
    } else if (imp.startsWith('@/')) {
      // Path alias: @/ → src/
      const abs = resolve(srcRoot, imp.slice(2));
      if (!tryResolveFile(abs)) {
        issues.push(`Cannot resolve alias import "${imp}"`);
      }
    } else {
      // Package import
      if (isBuiltin(imp)) continue;
      const pkgName = imp.startsWith('@')
        ? imp.split('/').slice(0, 2).join('/')
        : imp.split('/')[0];
      if (!knownPackages.has(pkgName)) {
        issues.push(`Unknown package "${pkgName}" — not found in any package.json`);
      }
    }
  }

  if (issues.length > 0) {
    fileFailures.set(relative(root, filePath), issues);
    failures += issues.length;
  }
}

// ── Report ────────────────────────────────────────────────────────────────────
if (failures === 0) {
  console.log(`OK: all imports resolve in ${allFiles.length} scanned files`);
  console.log(`    (src/: ${srcFiles.length} files, server/: ${serverFiles.length} files)`);
} else {
  for (const [file, issues] of fileFailures) {
    console.error(`\n${file}:`);
    for (const issue of issues) {
      console.error(`  ${issue}`);
    }
  }
  console.error(`\nFAIL: ${failures} unresolved import(s) across ${allFiles.length} files`);
  process.exit(1);
}
