/* Private download page for the signed Android (Trusted Web Activity) release.
 *
 * GET  /android-release            → small HTML page with a password form
 * POST /android-release (form)     → file=aab | keystore, password=…
 *
 * Files live in the "android-release" Netlify Blobs store:
 *   app-release-bundle.aab  signed bundle to upload in Google Play Console
 *   android.keystore        upload signing key (alias "muhasabah"), needed for every update
 * Both are only served when the password matches ANDROID_KEYSTORE_PASSWORD.
 */
import type { Config } from '@netlify/functions';
import { getStore } from '@netlify/blobs';
import { createHash, timingSafeEqual } from 'node:crypto';

const FILES: Record<string, { key: string; name: string; type: string }> = {
  aab: { key: 'app-release-bundle.aab', name: 'muhasabah-plus-1.3.0.aab', type: 'application/octet-stream' },
  keystore: { key: 'android.keystore', name: 'muhasabah-upload.keystore', type: 'application/octet-stream' },
};

function passwordOk(given: string): boolean {
  const expected = process.env.ANDROID_KEYSTORE_PASSWORD || '';
  if (!expected || !given) return false;
  const a = createHash('sha256').update(given).digest();
  const b = createHash('sha256').update(expected).digest();
  return timingSafeEqual(a, b);
}

function page(message = '', status = 200) {
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow">
<title>Muhasabah Plus — Android release</title>
<style>body{font-family:system-ui,sans-serif;background:#0a0d14;color:#e8eaf0;max-width:520px;margin:40px auto;padding:0 20px;line-height:1.5}
h1{font-size:1.3rem}form{background:#141a26;padding:20px;border-radius:12px;display:grid;gap:12px}
input,select,button{font:inherit;padding:10px;border-radius:8px;border:1px solid #2a3346;background:#0a0d14;color:inherit}
button{background:#3b82f6;border:0;cursor:pointer;font-weight:600}.err{color:#f87171}small{color:#9aa3b5}</style></head><body>
<h1>Muhasabah Plus — Android release (v1.3.0, code 1)</h1>
<p>Enter the <b>ANDROID_KEYSTORE_PASSWORD</b> you set in Netlify to download.</p>
${message ? `<p class="err">${message}</p>` : ''}
<form method="post"><select name="file">
<option value="aab">App bundle (.aab) — upload to Google Play Console</option>
<option value="keystore">Upload signing key (.keystore) — keep a private backup</option>
</select><input type="password" name="password" placeholder="Password" required autocomplete="current-password">
<button type="submit">Download</button></form>
<p><small>Package: com.shamimnoor.muhasabahplus · Key alias: muhasabah · The keystore and key use the same password.</small></p>
</body></html>`;
  return new Response(html, { status, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' } });
}

export default async (req: Request) => {
  if (req.method === 'GET') return page();
  let form: FormData;
  try { form = await req.formData(); } catch { return page('Invalid request.', 400); }
  const file = FILES[String(form.get('file') || 'aab')];
  if (!file) return page('Unknown file.', 400);
  if (!passwordOk(String(form.get('password') || ''))) return page('Wrong password.', 401);
  const data = await getStore('android-release').get(file.key, { type: 'arrayBuffer' });
  if (!data) return page('File not found. It may not have been uploaded yet.', 404);
  return new Response(data, {
    headers: {
      'Content-Type': file.type,
      'Content-Disposition': `attachment; filename="${file.name}"`,
      'Content-Length': String(data.byteLength),
      'Cache-Control': 'no-store',
    },
  });
};

export const config: Config = { path: '/android-release', method: ['GET', 'POST'] };
