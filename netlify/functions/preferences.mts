import { createHash, randomUUID } from 'node:crypto';
import type { Context } from '@netlify/functions';
import { eq } from 'drizzle-orm';
import { database } from '../../db/index.js';
import { appPreferences } from '../../db/schema.js';
import languages from '../../i18n/languages.json' with { type: 'json' };

const LANGUAGES = new Set<string>(languages as string[]);

export default async (req: Request, context: Context) => {
  const headers = { 'Cache-Control': 'private, no-store' };
  if (!['GET', 'PUT'].includes(req.method)) return new Response('Method not allowed', { status: 405, headers });
  if (req.method === 'PUT' && req.headers.get('origin') !== new URL(req.url).origin) return new Response('Forbidden', { status: 403, headers });
  let session = context.cookies.get('mhs_preferences');
  if (!session || !/^[a-f0-9-]{36}$/.test(session)) {
    session = randomUUID();
    context.cookies.set({ name: 'mhs_preferences', value: session, httpOnly: true, secure: new URL(req.url).protocol === 'https:', sameSite: 'Strict', path: '/', maxAge: 31536000 });
  }
  const owner = createHash('sha256').update(session).digest('hex');
  try {
    const db = database();
    if (req.method === 'PUT') {
      const raw = await req.text();
      if (raw.length > 1024) return new Response('Too large', { status: 413, headers });
      let value;
      try { value = JSON.parse(raw); } catch { return new Response('Invalid JSON', { status: 400, headers }); }
      if (!value || !LANGUAGES.has(value.language) || !['dark', 'light', 'system'].includes(value.theme)) return new Response('Invalid preferences', { status: 400, headers });
      await db.insert(appPreferences).values({ owner, language: value.language, theme: value.theme }).onConflictDoUpdate({ target: appPreferences.owner, set: { language: value.language, theme: value.theme } });
    }
    const [value] = await db.select({ language: appPreferences.language, theme: appPreferences.theme }).from(appPreferences).where(eq(appPreferences.owner, owner));
    return Response.json(value || null, { headers });
  } catch {
    return Response.json({ error: 'Preferences unavailable' }, { status: 503, headers });
  }
};
