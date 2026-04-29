import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();

function readJson(relativePath) {
  const absolutePath = path.join(rootDir, relativePath);
  return JSON.parse(fs.readFileSync(absolutePath, 'utf8'));
}

function fail(message) {
  console.error(`❌ ${message}`);
  process.exitCode = 1;
}

const rootPackage = readJson('package.json');
const serverPackage = readJson(path.join('server', 'package.json'));

if (serverPackage?.scripts?.start !== 'node index.mjs') {
  fail('server/package.json must keep scripts.start set to "node index.mjs".');
}

if (Object.hasOwn(serverPackage?.scripts ?? {}, 'start:legacy')) {
  fail('server/package.json must not define scripts.start:legacy.');
}

for (const [pkgName, pkg] of [
  ['package.json', rootPackage],
  ['server/package.json', serverPackage],
]) {
  for (const [scriptName, scriptValue] of Object.entries(pkg?.scripts ?? {})) {
    if (typeof scriptValue === 'string' && scriptValue.includes('stripe-server.mjs')) {
      fail(`${pkgName} script \"${scriptName}\" must not reference stripe-server.mjs.`);
    }
  }
}

if (process.exitCode) {
  process.exit(process.exitCode);
}

console.log('✅ Legacy startup validation passed.');
