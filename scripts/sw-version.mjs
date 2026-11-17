/* Deploy-time service worker version.
 * The service worker's cache name (VERSION in sw.js) decides when installed apps — browser
 * installs and the Android (TWA) app — download a fresh copy of the app. Instead of relying on a
 * hand-edited date, the version is set to a hash of sw.js plus every file it precaches, so any
 * deploy that changes the app ships an update, and deploys that change nothing keep the cache.
 * Runs after scripts/optimize.mjs so the hash covers the files that are actually published. */
import { readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";

const file = "sw.js";
const src = await readFile(file, "utf8");
const list = src.match(/PRECACHE=\[([^\]]*)\]/);
if (!/VERSION="[^"]*"/.test(src) || !list) {
  console.log("sw-version: VERSION or PRECACHE not found — left unchanged");
  process.exit(0);
}
const hash = createHash("sha256").update(src.replace(/VERSION="[^"]*"/, 'VERSION=""'));
for (const raw of list[1].split(",")) {
  let path = raw.trim().replace(/^"|"$/g, "");
  if (!path.startsWith("/")) path = path === "OFFLINE" ? "/offline.html" : "";
  if (!path) continue;
  path = path.split("?")[0];
  if (path.endsWith("/")) path += "index.html";
  try { hash.update(path).update(await readFile("." + path)); } catch { hash.update(path + ":missing"); }
}
const version = createHash("sha256").update(hash.digest()).digest("hex").slice(0, 12);
await writeFile(file, src.replace(/VERSION="[^"]*"/, `VERSION="${version}"`));
console.log(`sw-version: VERSION=${version}`);
