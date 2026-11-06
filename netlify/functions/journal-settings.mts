import { createHash, randomUUID } from 'node:crypto';
import type { Context } from '@netlify/functions';
import { eq } from 'drizzle-orm';
import { database } from '../../db/index.js';
import { appPreferences } from '../../db/schema.js';

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
      if (raw.length > 2048) return new Response('Too large', { status: 413, headers });
      let value;
      try { value = JSON.parse(raw); } catch { return new Response('Invalid JSON', { status: 400, headers }); }
      if (!value || !['small','medium','large'].includes(value.fontSize) || !['0','1'].includes(value.weekStart) || !['free','guided'].includes(value.template) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(value.reminderTime) || typeof value.showLedger !== 'boolean' || !Number.isInteger(value.goal) || value.goal < 10 || value.goal > 10000) return new Response('Invalid settings', { status: 400, headers });
      const journalSettings = {fontSize:value.fontSize,weekStart:value.weekStart,template:value.template,reminderTime:value.reminderTime,showLedger:value.showLedger,goal:value.goal};
      await db.insert(appPreferences).values({owner, journalSettings}).onConflictDoUpdate({target: appPreferences.owner, set:{journalSettings}});
    }
    const [row] = await db.select({value:appPreferences.journalSettings}).from(appPreferences).where(eq(appPreferences.owner, owner));
    return Response.json(row?.value || null, {headers});
  } catch { return Response.json({error:'Settings unavailable'}, {status:503,headers}); }
};
