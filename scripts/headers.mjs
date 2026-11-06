/* Deploy-time security headers: builds a strict Content-Security-Policy for the published site.
 * The app shell has a few small inline scripts, so instead of allowing every inline script
 * ('unsafe-inline') the policy lists the SHA-256 hash of each one found in the HTML pages.
 * Editing an inline script is safe: the hashes are recomputed on every deploy.
 * Output: a `_headers` file in the publish directory (generated, not committed). */
import { readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";

const PAGES = ["index.html", "offline.html"];
const hash = (s) => `'sha256-${createHash("sha256").update(s, "utf8").digest("base64")}'`;

const scripts = new Set();
const handlers = new Set();
for (const page of PAGES) {
  let html;
  try { html = await readFile(page, "utf8"); } catch { continue; }
  // Executable inline <script> blocks (JSON / JSON-LD data blocks are never executed, so skip them).
  for (const m of html.matchAll(/<script(\s[^>]*)?>([\s\S]*?)<\/script>/gi)) {
    const attrs = m[1] || "";
    if (/\ssrc\s*=/i.test(attrs)) continue;
    const type = (attrs.match(/\stype\s*=\s*["']?([^"'\s>]+)/i) || [])[1];
    if (type && !/^(text\/javascript|module|application\/javascript)$/i.test(type)) continue;
    if (m[2].trim()) scripts.add(hash(m[2]));
  }
  // Inline event handler attributes (e.g. the non-blocking font stylesheet's onload).
  for (const m of html.matchAll(/\son[a-z]+\s*=\s*"([^"]*)"/gi)) handlers.add(hash(m[1].replace(/&amp;/g, "&").replace(/&quot;/g, '"')));
}

const csp = [
  "default-src 'self'",
  `script-src 'self' ${[...scripts].join(" ")}${handlers.size ? " 'unsafe-hashes' " + [...handlers].join(" ") : ""} https://js.stripe.com https://assets.lemonsqueezy.com https://accounts.google.com/gsi/client`,
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://accounts.google.com/gsi/style",
  "font-src 'self' data: https://fonts.gstatic.com",
  "img-src 'self' data: blob: https:",
  "media-src 'self' data: blob:",
  "connect-src 'self' https://fonts.googleapis.com https://fonts.gstatic.com https://api.stripe.com https://*.lemonsqueezy.com https://accounts.google.com https://oauth2.googleapis.com https://www.googleapis.com https://api.alquran.cloud https://cdn.jsdelivr.net",
  "frame-src https://js.stripe.com https://hooks.stripe.com https://*.lemonsqueezy.com https://accounts.google.com https://maps.google.com https://www.google.com",
  "worker-src 'self'",
  "manifest-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self' https://*.lemonsqueezy.com",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests",
].join("; ");

await writeFile("_headers", `/*\n  Content-Security-Policy: ${csp}\n`);
console.log(`headers: CSP written with ${scripts.size} inline script hash(es) and ${handlers.size} handler hash(es)`);
