import fs from "fs";
import path from "path";
import crypto from "crypto";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, "data");
const DEFAULT_FILE_KEY = "app-state";
const SEED_FILE = path.join(__dirname, "..", "src", "data", "seed-app.json");
const STATE_FILE = process.env.STATE_FILE || path.join(DATA_DIR, `${DEFAULT_FILE_KEY}.json`);

// ── In-memory cache for JSON app-state ──────────────────────────────────────
let cache = {
  mtimeMs: 0,
  data: null,
  jsonString: null,
  etag: null,
};

function computeEtag(jsonString) {
  return `"${crypto.createHash("sha1").update(jsonString).digest("hex")}"`;
}

function atomicWrite(file, jsonString) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const tmp = `${file}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, jsonString, "utf8");
  fs.renameSync(tmp, file);
}

function loadFromDisk() {
  if (!fs.existsSync(STATE_FILE)) {
    if (!fs.existsSync(SEED_FILE)) {
      throw new Error(`Missing seed file: ${SEED_FILE}`);
    }
    const seed = fs.readFileSync(SEED_FILE, "utf8");
    atomicWrite(STATE_FILE, seed);
  }
  const stat = fs.statSync(STATE_FILE);
  const raw = fs.readFileSync(STATE_FILE, "utf8");
  const parsed = JSON.parse(raw);
  cache = {
    mtimeMs: stat.mtimeMs,
    data: parsed,
    jsonString: raw,
    etag: computeEtag(raw),
  };
  return cache;
}

export function readAppState() {
  if (cache.data) {
    try {
      const stat = fs.statSync(STATE_FILE);
      if (stat.mtimeMs === cache.mtimeMs) {
        return structuredClone(cache.data);
      }
    } catch {
      // File was deleted or inaccessible; fall back to reload path.
    }
  }

  loadFromDisk();
  return structuredClone(cache.data);
}

export function readAppStateMeta() {
  if (!cache.data) {
    loadFromDisk();
  } else {
    try {
      const stat = fs.statSync(STATE_FILE);
      if (stat.mtimeMs !== cache.mtimeMs) loadFromDisk();
    } catch {
      loadFromDisk();
    }
  }
  return { etag: cache.etag, jsonString: cache.jsonString };
}

export function writeAppState(state) {
  const jsonString = JSON.stringify(state, null, 2);
  atomicWrite(STATE_FILE, jsonString);
  const stat = fs.statSync(STATE_FILE);
  cache = {
    mtimeMs: stat.mtimeMs,
    data: state,
    jsonString,
    etag: computeEtag(jsonString),
  };
}
