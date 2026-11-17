/* Digital Asset Links for the Android (Trusted Web Activity) build of Muhasabah.
 *
 * GET /.well-known/assetlinks.json
 *
 * Android checks this file to confirm that the Play Store app and this website belong
 * together. When the check passes, the app opens full-screen without a browser URL bar.
 *
 * If the Android app shows a browser address bar at the top, this file is missing the
 * fingerprint of the key the installed app was signed with. Apps installed from Google Play are
 * re-signed by Google, so the "App signing key certificate" SHA-256 must be listed here.
 *
 * Configure with environment variables (no code change needed, just a redeploy):
 *   TWA_PACKAGE_NAME         Android package id(s), defaults to "com.shamimnoor.muhasabahpro".
 *                            Several ids may be listed (commas or spaces), e.g. when a PWABuilder
 *                            build uses a different package id.
 *   TWA_SHA256_FINGERPRINTS  One or more SHA-256 signing-certificate fingerprints,
 *                            separated by commas or spaces. Add both the Play App Signing
 *                            key (Play Console → Test and release → App integrity) and the
 *                            upload/local key used by `bubblewrap build` if you sideload.
 *
 *   TWA_ASSETLINKS_JSON      Optional: paste the whole assetlinks.json that PWABuilder or
 *                            `bubblewrap fingerprint` generated. Its statements are merged in.
 *
 * The upload key fingerprint (UPLOAD_KEY_FINGERPRINT) is always included for the default package.
 */
import type { Config } from '@netlify/functions';

const DEFAULT_PACKAGE = 'com.shamimnoor.muhasabahpro';
// SHA-256 of the upload key that signed the first .aab (download at /android-release).
// Always included; TWA_SHA256_FINGERPRINTS adds more (e.g. the Play App Signing key).
export const UPLOAD_KEY_FINGERPRINT =
  '86:B1:F6:49:8D:D2:FC:FB:39:51:4A:E3:3E:B4:71:63:24:1D:7C:A6:08:56:69:90:51:13:A0:97:35:DB:86:D0';
const PACKAGE_RE = /^[a-zA-Z][a-zA-Z0-9_]*(\.[a-zA-Z][a-zA-Z0-9_]*)+$/;

export function normaliseFingerprint(raw: string): string | null {
  const hex = raw.replace(/[^0-9a-fA-F]/g, '').toUpperCase();
  if (hex.length !== 64) return null;
  return hex.match(/.{2}/g)!.join(':');
}

const RELATION = 'delegate_permission/common.handle_all_urls';

type Statement = {
  relation: string[];
  target: { namespace: 'android_app'; package_name: string; sha256_cert_fingerprints: string[] };
};

/** Statements from a pasted assetlinks.json (PWABuilder / Bubblewrap output); invalid parts are ignored. */
export function parseExtraStatements(raw: string | undefined): Statement[] {
  if (!raw || !raw.trim()) return [];
  let data: unknown;
  try { data = JSON.parse(raw); } catch { return []; }
  const list = Array.isArray(data) ? data : [data];
  const out: Statement[] = [];
  for (const item of list) {
    const target = (item as any)?.target;
    if (!target || target.namespace !== 'android_app') continue;
    const pkg = String(target.package_name || '').trim();
    if (!PACKAGE_RE.test(pkg)) continue;
    const prints = (Array.isArray(target.sha256_cert_fingerprints) ? target.sha256_cert_fingerprints : [])
      .map((f: unknown) => normaliseFingerprint(String(f)))
      .filter((f: string | null): f is string => !!f);
    if (!prints.length) continue;
    out.push({ relation: [RELATION], target: { namespace: 'android_app', package_name: pkg, sha256_cert_fingerprints: prints } });
  }
  return out;
}

export function buildAssetLinks(packageName: string | undefined, fingerprints: string | undefined, extraJson?: string) {
  const pkgs = (packageName || '').split(/[\s,;]+/).map((p) => p.trim()).filter((p) => PACKAGE_RE.test(p));
  if (!pkgs.length) pkgs.push(DEFAULT_PACKAGE);
  const configured = (fingerprints || '').split(/[\s,;]+/)
    .map((f) => normaliseFingerprint(f))
    .filter((f): f is string => !!f);

  // One statement per package; fingerprints merged and de-duplicated.
  const byPkg = new Map<string, Set<string>>();
  const add = (pkg: string, prints: string[]) => {
    if (!prints.length) return;
    const set = byPkg.get(pkg) || new Set<string>();
    prints.forEach((p) => set.add(p));
    byPkg.set(pkg, set);
  };
  for (const pkg of pkgs) add(pkg, pkg === DEFAULT_PACKAGE ? [UPLOAD_KEY_FINGERPRINT, ...configured] : configured);
  for (const st of parseExtraStatements(extraJson)) add(st.target.package_name, st.target.sha256_cert_fingerprints);

  return [...byPkg].map(([pkg, prints]) => ({
    relation: [RELATION],
    target: { namespace: 'android_app', package_name: pkg, sha256_cert_fingerprints: [...prints] },
  }));
}

export default async () => {
  const body = buildAssetLinks(process.env.TWA_PACKAGE_NAME, process.env.TWA_SHA256_FINGERPRINTS, process.env.TWA_ASSETLINKS_JSON);
  return new Response(JSON.stringify(body, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=300',
      'Access-Control-Allow-Origin': '*',
    },
  });
};

export const config: Config = {
  path: '/.well-known/assetlinks.json',
  method: 'GET',
};
