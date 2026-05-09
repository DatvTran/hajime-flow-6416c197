/**
 * Audit: every @/ alias import and relative import in src/ must resolve to a
 * real file on disk. Catches renamed/moved files that TypeScript's "bundler"
 * moduleResolution and Vite would handle but a fresh grep wouldn't spot.
 *
 * Skips: bare specifiers (node_modules), dynamic import() expressions.
 * Usage: node scripts/audit-imports.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const srcDir = path.join(rootDir, 'src');

// Extensions tried in order when a path has no extension
const EXTS = ['.ts', '.tsx', '.js', '.jsx', '.json'];

// ── Resolution helpers ─────────────────────────────────────────────────────

function tryResolve(base) {
  // Exact match (already has extension)
  if (fs.existsSync(base) && fs.statSync(base).isFile()) return base;
  // With extensions
  for (const ext of EXTS) {
    if (fs.existsSync(base + ext)) return base + ext;
  }
  // Index files
  for (const ext of EXTS) {
    const idx = path.join(base, 'index' + ext);
    if (fs.existsSync(idx)) return idx;
  }
  return null;
}

function resolveImport(importPath, fromFile) {
  if (importPath.startsWith('@/')) {
    return tryResolve(path.join(srcDir, importPath.slice(2)));
  }
  if (importPath.startsWith('.')) {
    return tryResolve(path.resolve(path.dirname(fromFile), importPath));
  }
  return 'external'; // node_modules — skip
}

// ── File walker ────────────────────────────────────────────────────────────

function walk(dir, results = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full, results);
    } else if (/\.(ts|tsx)$/.test(entry.name)) {
      results.push(full);
    }
  }
  return results;
}

// ── Import extraction ──────────────────────────────────────────────────────

// Matches static import/export … from '...' and import '...' (side-effects).
// Deliberately excludes dynamic import() — those are caught by the build step.
const IMPORT_RE =
  /^\s*(?:import|export)\s+(?:type\s+)?(?:[^'"]*?\s+from\s+)?['"]([^'"]+)['"]/gm;

// ── Main ───────────────────────────────────────────────────────────────────

const files = walk(srcDir);
let failures = 0;

for (const file of files) {
  const src = fs.readFileSync(file, 'utf8');
  const relFile = path.relative(rootDir, file);
  const seen = new Set();

  for (const [, importPath] of src.matchAll(IMPORT_RE)) {
    if (seen.has(importPath)) continue;
    seen.add(importPath);

    const result = resolveImport(importPath, file);
    if (result === 'external') continue;
    if (result === null) {
      console.error(`❌  ${relFile}\n    Cannot resolve: "${importPath}"`);
      failures++;
    }
  }
}

if (failures === 0) {
  console.log(`✅  All imports resolve across ${files.length} source file(s).`);
} else {
  console.error(
    `\n${failures} unresolved import(s). Fix the paths or file names above.`,
  );
  process.exit(1);
}
