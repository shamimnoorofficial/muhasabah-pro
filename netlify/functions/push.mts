/* Web Push API for the daily Muhasabah reminder.
 *   GET    /api/push            → { publicKey }
 *   POST   /api/push            → save/update a subscription { subscription, timezone, hour, lang }
 *   DELETE /api/push            → remove a subscription { endpoint }
 *   POST   /api/push?test=1     → also send a test notification right away
 */
import type { Config } from '@netlify/functions';
import { eq } from 'drizzle-orm';
import { database } from '../../db/index.js';
import { pushSubscriptions } from '../../db/schema.js';
import { configuredWebPush, dailyMessage, vapidKeys } from '../../lib/push.js';

const headers = { 'Cache-Control': 'private, no-store' };
const LANGS = new Set(['en', 'ar', 'bn']);

function validEndpoint(v: unknown): v is string {
  if (typeof v !== 'string' || v.length > 1024) return false;
  try { return new URL(v).protocol === 'https:'; } catch { return false; }
}
function validTz(v: unknown) {
  if (typeof v !== 'string' || v.length > 64) return 'UTC';
  try { new Intl.DateTimeFormat('en-US', { timeZone: v }); return v; } catch { return 'UTC'; }
}

export default async (req: Request) => {
  if (req.method === 'GET') {
    try { return Response.json({ publicKey: (await vapidKeys()).publicKey }, { headers }); }
    catch { return Response.json({ error: 'Push unavailable' }, { status: 503, headers }); }
  }
  if (!['POST', 'DELETE'].includes(req.method)) return new Response('Method not allowed', { status: 405, headers });
  const origin = req.headers.get('origin');
  if (origin && origin !== new URL(req.url).origin) return new Response('Forbidden', { status: 403, headers });

  const raw = await req.text();
  if (raw.length > 4096) return new Response('Too large', { status: 413, headers });
  let body: any;
  try { body = JSON.parse(raw); } catch { return new Response('Invalid JSON', { status: 400, headers }); }

  try {
    const db = database();
    if (req.method === 'DELETE') {
      if (!validEndpoint(body?.endpoint)) return new Response('Invalid endpoint', { status: 400, headers });
      await db.delete(pushSubscriptions).where(eq(pushSubscriptions.endpoint, body.endpoint));
      return Response.json({ ok: true }, { headers });
    }

    const sub = body?.subscription;
    const p256dh = sub?.keys?.p256dh, auth = sub?.keys?.auth;
    if (!validEndpoint(sub?.endpoint) || typeof p256dh !== 'string' || typeof auth !== 'string' || p256dh.length > 256 || auth.length > 128) {
      return new Response('Invalid subscription', { status: 400, headers });
    }
    const hour = Number.isInteger(body.hour) && body.hour >= 0 && body.hour <= 23 ? body.hour : 21;
    const lang = LANGS.has(body.lang) ? body.lang : 'en';
    const timezone = validTz(body.timezone);
    const now = Date.now();
    await db.insert(pushSubscriptions)
      .values({ endpoint: sub.endpoint, p256dh, auth, timezone, hour, lang, createdAt: now, updatedAt: now })
      .onConflictDoUpdate({ target: pushSubscriptions.endpoint, set: { p256dh, auth, timezone, hour, lang, updatedAt: now } });

    if (new URL(req.url).searchParams.get('test') === '1') {
      const webpush = await configuredWebPush();
      await webpush.sendNotification({ endpoint: sub.endpoint, keys: { p256dh, auth } }, dailyMessage(lang), { TTL: 600 });
    }
    return Response.json({ ok: true, hour, timezone }, { headers });
  } catch (e) {
    console.error('push api failed', e);
    return Response.json({ error: 'Push unavailable' }, { status: 503, headers });
  }
};

export const config: Config = { path: '/api/push' };
