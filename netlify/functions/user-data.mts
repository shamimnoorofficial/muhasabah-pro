// Free account backup; authentication and ownership checks apply to every request.
import type { Config } from '@netlify/functions';
import { getUser } from '@netlify/identity';
import { eq } from 'drizzle-orm';
import { database } from '../../db/index.js';
import { userData } from '../../db/schema.js';

const MAX = 4_000_000;
const headers = { 'Cache-Control': 'private, no-store' };
const json = (body: unknown, status = 200) => Response.json(body, { status, headers });

export default async (req: Request) => {
  if (!['GET', 'PUT', 'DELETE'].includes(req.method)) return new Response('Method not allowed', { status: 405, headers });
  if (req.method !== 'GET' && req.headers.get('origin') !== new URL(req.url).origin) return new Response('Forbidden', { status: 403, headers });
  const user = await getUser();
  if (!user) return json({ error: 'auth_required' }, 401);
  try {
    const db = database();
    if (req.method === 'GET') {
      const [row] = await db.select().from(userData).where(eq(userData.userId, user.id));
      return json(row ? { updatedAt: row.updatedAt, size: row.size, device: row.device, data: row.data } : null);
    }
    if (req.method === 'DELETE') {
      await db.delete(userData).where(eq(userData.userId, user.id));
      return json({ ok: true });
    }
    if (Number(req.headers.get('content-length')) > MAX) return json({ error: 'too_large' }, 413);
    const raw = await req.text();
    if (raw.length > MAX) return json({ error: 'too_large' }, 413);
    let body: any;
    try { body = JSON.parse(raw); } catch { return json({ error: 'invalid_json' }, 400); }
    const data = body?.data;
    if (!data || typeof data !== 'object' || Array.isArray(data)) return json({ error: 'invalid_data' }, 400);
    for (const k of ['habits', 'todos', 'ledger']) if (data[k] !== undefined && !Array.isArray(data[k])) return json({ error: 'invalid_data' }, 400);
    const updatedAt = Number.isSafeInteger(body.updatedAt) && body.updatedAt > 0 ? Math.min(body.updatedAt, Date.now() + 60_000) : Date.now();
    const device = typeof body.device === 'string' ? body.device.slice(0, 80) : null;
    const size = Buffer.byteLength(JSON.stringify(data));
    const [existing] = await db.select({ updatedAt: userData.updatedAt }).from(userData).where(eq(userData.userId, user.id));
    if (existing && existing.updatedAt > updatedAt && !body.force) return json({ error: 'conflict', updatedAt: existing.updatedAt }, 409);
    await db.insert(userData).values({ userId: user.id, data, updatedAt, device, size, createdAt: Date.now() })
      .onConflictDoUpdate({ target: userData.userId, set: { data, updatedAt, device, size } });
    return json({ ok: true, updatedAt, size });
  } catch {
    return json({ error: 'unavailable' }, 503);
  }
};

export const config: Config = { path: '/api/user-data' };
