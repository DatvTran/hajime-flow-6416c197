import fs from "fs";
import path from "path";
import crypto from "crypto";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, "data");
const DEFAULT_FILE_KEY = "app-state";
const SEED_FILE = path.join(__dirname, "..", "src", "data", "seed-app.json");

// ── In-memory cache for JSON app-state ──────────────────────────────────────
const cacheByFileKey = new Map();

function stateFileFor(fileKey = DEFAULT_FILE_KEY) {
  return path.join(DATA_DIR, `${fileKey}.json`);
}

function computeEtag(jsonString) {
  return `"${crypto.createHash("sha1").update(jsonString).digest("hex")}"`;
}

function atomicWrite(file, jsonString) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const tmp = `${file}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, jsonString, "utf8");
  fs.renameSync(tmp, file);
}

function loadFromDisk(fileKey = DEFAULT_FILE_KEY) {
  const stateFile = stateFileFor(fileKey);
  if (!fs.existsSync(stateFile)) {
    if (!fs.existsSync(SEED_FILE)) {
      throw new Error(`Missing seed file: ${SEED_FILE}`);
    }
    const seed = fs.readFileSync(SEED_FILE, "utf8");
    atomicWrite(stateFile, seed);
  }
  const stat = fs.statSync(stateFile);
  const raw = fs.readFileSync(stateFile, "utf8");
  const parsed = JSON.parse(raw);
  const cache = {
    mtimeMs: stat.mtimeMs,
    data: parsed,
    jsonString: raw,
    etag: computeEtag(raw),
  };
  cacheByFileKey.set(fileKey, cache);
  return cache;
}

export function readAppState(fileKey = DEFAULT_FILE_KEY) {
  const stateFile = stateFileFor(fileKey);
  const cache = cacheByFileKey.get(fileKey);
  if (cache?.data) {
    try {
      const stat = fs.statSync(stateFile);
      if (stat.mtimeMs === cache.mtimeMs) {
        return structuredClone(cache.data);
      }
    } catch {
      // File was deleted or inaccessible; fall back to reload path.
    }
  }

  const fresh = loadFromDisk(fileKey);
  return structuredClone(fresh.data);
}

export function readAppStateMeta(fileKey = DEFAULT_FILE_KEY) {
  const stateFile = stateFileFor(fileKey);
  const cache = cacheByFileKey.get(fileKey);
  if (!cache?.data) {
    loadFromDisk(fileKey);
  } else {
    try {
      const stat = fs.statSync(stateFile);
      if (stat.mtimeMs !== cache.mtimeMs) loadFromDisk(fileKey);
    } catch {
      loadFromDisk(fileKey);
    }
  }
  const fresh = cacheByFileKey.get(fileKey);
  return { etag: fresh.etag, jsonString: fresh.jsonString };
}

export function writeAppState(state, fileKey = DEFAULT_FILE_KEY) {
  const stateFile = stateFileFor(fileKey);
  const jsonString = JSON.stringify(state, null, 2);
  atomicWrite(stateFile, jsonString);
  const stat = fs.statSync(stateFile);
  cacheByFileKey.set(fileKey, {
    mtimeMs: stat.mtimeMs,
    data: state,
    jsonString,
    etag: computeEtag(jsonString),
  });
}
