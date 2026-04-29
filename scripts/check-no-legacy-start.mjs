import fs from "fs";
import path from "path";

const repoRoot = path.resolve(process.cwd());
const serverPackagePath = path.join(repoRoot, "server", "package.json");

const raw = fs.readFileSync(serverPackagePath, "utf8");
const serverPackage = JSON.parse(raw);
const scripts = serverPackage.scripts ?? {};

const violations = [];

if (Object.hasOwn(scripts, "start:legacy")) {
  violations.push("server/package.json must not define start:legacy.");
}

for (const [name, value] of Object.entries(scripts)) {
  if (typeof value !== "string") continue;
  if (/\bnode\s+stripe-server\.mjs\b/.test(value)) {
    violations.push(`server/package.json script \"${name}\" must not start stripe-server.mjs directly.`);
  }
}

if (violations.length > 0) {
  console.error("[check:no-legacy-start] Deprecated legacy start script usage detected:");
  for (const violation of violations) {
    console.error(`- ${violation}`);
  }
  process.exit(1);
}

console.log("[check:no-legacy-start] OK: no deprecated legacy start scripts found.");
