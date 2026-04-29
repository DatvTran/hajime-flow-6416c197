import fs from "node:fs";

const pkg = JSON.parse(fs.readFileSync(new URL("../server/package.json", import.meta.url), "utf8"));

if (Object.prototype.hasOwnProperty.call(pkg.scripts ?? {}, "start:legacy")) {
  console.error("Forbidden script detected: start:legacy in server/package.json");
  process.exit(1);
}

console.log("OK: start:legacy not present in server/package.json");
