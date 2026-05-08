/**
 * Resolves every @/ import in src/ against the filesystem.
 * Exits non-zero if any import target does not exist.
 * Covers both bare paths (./src/foo) and extensions (.ts, .tsx, /index.ts, /index.tsx).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const srcRoot = path.join(root, "src");

const EXTENSIONS = [".ts", ".tsx", ".js", ".jsx"];

function resolves(target) {
  if (fs.existsSync(target)) return true;
  for (const ext of EXTENSIONS) {
    if (fs.existsSync(target + ext)) return true;
    if (fs.existsSync(path.join(target, `index${ext}`))) return true;
  }
  return false;
}

function walkSrc(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walkSrc(full, files);
    else if (/\.(ts|tsx)$/.test(entry.name)) files.push(full);
  }
  return files;
}

const allFiles = walkSrc(srcRoot);
const broken = [];

for (const file of allFiles) {
  const src = fs.readFileSync(file, "utf8");
  const imports = [...src.matchAll(/from\s+["'](@\/[^"']+)["']/g)].map((m) => m[1]);
  for (const imp of imports) {
    const resolved = path.join(srcRoot, imp.slice(2)); // strip @/
    if (!resolves(resolved)) {
      broken.push({ file: path.relative(root, file), import: imp });
    }
  }
}

if (broken.length === 0) {
  console.log(`OK: all @/ imports resolve (scanned ${allFiles.length} files)`);
  process.exit(0);
} else {
  console.error(`FAIL: ${broken.length} unresolvable @/ import(s):`);
  broken.forEach(({ file, import: imp }) => console.error(`  ${file}  →  ${imp}`));
  process.exit(1);
}
