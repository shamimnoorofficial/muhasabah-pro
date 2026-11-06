/* Deploy-time manifest metadata.
 * `iarc_rating_id` must be the real certificate ID issued by IARC (Google Play Console →
 * Policy → App content → Content rating). It is read from the IARC_RATING_ID environment
 * variable so the committed manifest never carries a made-up ID. */
import { readFile, writeFile } from "node:fs/promises";

const file = "manifest.webmanifest";
const manifest = JSON.parse(await readFile(file, "utf8"));
const id = (process.env.IARC_RATING_ID || "").trim();
if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
  manifest.iarc_rating_id = id;
  await writeFile(file, JSON.stringify(manifest, null, 2) + "\n");
  console.log("manifest: iarc_rating_id set from IARC_RATING_ID");
} else {
  console.log(id ? "manifest: IARC_RATING_ID is not a valid IARC certificate ID (UUID) — skipped" : "manifest: IARC_RATING_ID not set — iarc_rating_id omitted");
}
