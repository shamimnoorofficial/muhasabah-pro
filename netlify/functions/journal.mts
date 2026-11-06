import { createHash, randomUUID } from 'node:crypto';
import { eq, sql } from 'drizzle-orm';
import { database } from '../../db/index.js';
import { journalEntries } from '../../db/schema.js';

export default async (req: Request, context: any) => {
  const headers = { 'Cache-Control': 'private, no-store' };
  if (!['GET', 'PUT'].includes(req.method)) return new Response('Method not allowed', { status: 405, headers });
  if (req.method === 'PUT' && req.headers.get('origin') !== new URL(req.url).origin) {
    return new Response('Forbidden', { status: 403, headers });
  }
  let session = context.cookies.get('mhs_journal');
  if (!session || !/^[a-f0-9-]{36}$/.test(session)) {
    session = randomUUID();
    context.cookies.set({ name: 'mhs_journal', value: session, httpOnly: true, secure: new URL(req.url).protocol === 'https:', sameSite: 'Strict', path: '/', maxAge: 31536000 });
  }
  const owner = createHash('sha256').update(session).digest('hex');
  try {
    const db = database();
    if (req.method === 'PUT') {
      if (Number(req.headers.get('content-length')) > 2500000) return new Response('Too large', { status: 413, headers });
      const raw = await req.text();
      if (raw.length > 2500000) return new Response('Too large', { status: 413, headers });
      let entries: any;
      try { entries = JSON.parse(raw); } catch { return new Response('Invalid JSON', { status: 400, headers }); }
      if (!Array.isArray(entries) || entries.length > 3660 || entries.some(e => !e || typeof e.day !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(e.day) || new Date(e.day + 'T12:00:00Z').toISOString().slice(0, 10) !== e.day || typeof e.text !== 'string' || e.text.length > 100000 || !Number.isSafeInteger(e.updatedAt) || e.updatedAt < 0 || e.updatedAt > Date.now() + 60000)) {
        return new Response('Invalid entries', { status: 400, headers });
      }
      if (entries.length) await db.insert(journalEntries).values(entries.map(e => ({ owner, day: e.day, content: e.text, updatedAt: e.updatedAt }))).onConflictDoUpdate({
        target: [journalEntries.owner, journalEntries.day],
        set: { content: sql`excluded.content`, updatedAt: sql`excluded.updated_at` },
        setWhere: sql`excluded.updated_at >= ${journalEntries.updatedAt}`,
      });
    }
    const rows = await db.select({ day: journalEntries.day, text: journalEntries.content, updatedAt: journalEntries.updatedAt }).from(journalEntries).where(eq(journalEntries.owner, owner));
    return Response.json(rows, { headers });
  } catch {
    return Response.json({ error: 'Journal storage unavailable. Please retry.' }, { status: 503, headers });
  }
};
