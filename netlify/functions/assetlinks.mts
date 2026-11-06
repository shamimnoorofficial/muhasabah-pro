/* Digital Asset Links for the Android (Trusted Web Activity) build of Muhasabah.
 *
 * GET /.well-known/assetlinks.json
 *
 * Android checks this file to confirm that the Play Store app and this website belong
 * together. When the check passes, the app opens full-screen without a browser URL bar.
 *
 * Configure with environment variables (no code change or redeploy of code needed):
 *   TWA_PACKAGE_NAME         Android package id, defaults to "com.shamimnoor.muhasabahplus"
 *   TWA_SHA256_FINGERPRINTS  One or more SHA-256 signing-certificate fingerprints,
 *                            separated by commas or spaces. Add both the Play App Signing
 *                            key (Play Console → Test and release → App integrity) and the
 *                            upload/local key used by `bubblewrap build` if you sideload.
 *
 * The upload key fingerprint (UPLOAD_KEY_FINGERPRINT) is always included.
 */
import type { Config } from '@netlify/functions';

const DEFAULT_PACKAGE = 'com.shamimnoor.muhasabahplus';
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

export function buildAssetLinks(packageName: string | undefined, fingerprints: string | undefined) {
  const pkg = (packageName || '').trim() || DEFAULT_PACKAGE;
  if (!PACKAGE_RE.test(pkg)) return [];
  const prints = [...new Set(
    [UPLOAD_KEY_FINGERPRINT, ...(fingerprints || '').split(/[\s,;]+/)]
      .map((f) => normaliseFingerprint(f))
      .filter((f): f is string => !!f),
  )];
  if (!prints.length) return [];
  return [{
    relation: ['delegate_permission/common.handle_all_urls'],
    target: { namespace: 'android_app', package_name: pkg, sha256_cert_fingerprints: prints },
  }];
}

export default async () => {
  const body = buildAssetLinks(process.env.TWA_PACKAGE_NAME, process.env.TWA_SHA256_FINGERPRINTS);
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
