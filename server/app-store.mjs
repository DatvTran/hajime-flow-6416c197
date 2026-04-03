import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, "data");
const STATE_FILE = path.join(DATA_DIR, "app-state.json");
const SEED_FILE = path.join(__dirname, "..", "src", "data", "seed-app.json");

function atomicWrite(file, jsonString) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const tmp = `${file}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, jsonString, "utf8");
  fs.renameSync(tmp, file);
}

export function readAppState() {
  if (!fs.existsSync(STATE_FILE)) {
    if (!fs.existsSync(SEED_FILE)) {
      throw new Error(`Missing seed file: ${SEED_FILE}`);
    }
    const seed = fs.readFileSync(SEED_FILE, "utf8");
    atomicWrite(STATE_FILE, seed);
    return JSON.parse(seed);
  }
  return JSON.parse(fs.readFileSync(STATE_FILE, "utf8"));
}

export function writeAppState(state) {
  atomicWrite(STATE_FILE, JSON.stringify(state, null, 2));
}
