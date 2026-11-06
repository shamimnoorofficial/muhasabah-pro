/* Lemon Squeezy webhook: keeps Pro status in sync with payments, renewals and cancellations.
 *
 * In Lemon Squeezy → Settings → Webhooks, add https://<your-site>/api/lemonsqueezy-webhook with the
 * events order_created and subscription_* (created, updated, cancelled, resumed, expired, paused,
 * unpaused, payment_success), and use the same signing secret as LEMONSQUEEZY_WEBHOOK_SECRET.
 * Every request is verified with the X-Signature HMAC before anything is written.
 */
import type { Config } from '@netlify/functions';
import { eq } from 'drizzle-orm';
import { database } from '../../db/index.js';
import { proMembers } from '../../db/schema.js';
import { lemon, lsKeys, lsSubscriptionFields, setAutoRenew, verifySignature } from '../../lib/lemonsqueezy.js';

const ACTIVE = new Set(['active', 'trialing', 'past_due']);

async function ensureMember(userId: string, email: string) {
  const db = database();
  await db.insert(proMembers).values({ userId, email, createdAt: Date.now() }).onConflictDoNothing();
  const [row] = await db.select().from(proMembers).where(eq(proMembers.userId, userId));
  return row;
}

export default async (req: Request) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });
  const raw = await req.text();
  if (raw.length > 200_000) return new Response('Too large', { status: 413 });
  if (!verifySignature(raw, req.headers.get('x-signature'))) return new Response('Invalid signature', { status: 401 });

  let payload: any;
  try { payload = JSON.parse(raw); } catch { return new Response('Invalid JSON', { status: 400 }); }
  const event = String(payload?.meta?.event_name || '');
  const userId = String(payload?.meta?.custom_data?.user_id || '');
  const data = payload?.data;
  const a = data?.attributes || {};
  const k = lsKeys();

  /* Purchases made outside the app (no linked account) are acknowledged and ignored. */
  if (!userId || userId.length > 100) return Response.json({ ok: true, ignored: 'no_user' });

  try {
    const db = database();
    if (event === 'order_created' && data?.type === 'orders') {
      const variant = String(a.first_order_item?.variant_id || '');
      if (variant === k.lifetimeVariant && a.status === 'paid') {
        const m = await ensureMember(userId, String(a.user_email || ''));
        const [taken] = await db.select({ userId: proMembers.userId }).from(proMembers).where(eq(proMembers.lifetimePaymentIntent, String(data.id)));
        if (!m.lifetimePaymentIntent && !(taken && taken.userId !== userId)) {
          await db.update(proMembers).set({ lifetimePaymentIntent: String(data.id), lifetimePurchasedAt: Date.parse(a.created_at) || Date.now(), lifetimeProvider: 'lemonsqueezy' }).where(eq(proMembers.userId, userId));
        }
      }
      return Response.json({ ok: true });
    }

    if (event.startsWith('subscription_')) {
      /* payment_* events carry an invoice; read the subscription itself for the current state. */
      const sub = data?.type === 'subscriptions' ? data
        : a.subscription_id ? (await lemon(`subscriptions/${a.subscription_id}`)).data : null;
      if (!sub || String(sub.attributes?.variant_id) !== k.monthlyVariant) return Response.json({ ok: true, ignored: 'variant' });
      const m = await ensureMember(userId, String(sub.attributes?.user_email || ''));
      const set = lsSubscriptionFields(sub);
      /* Never let an old, ended subscription overwrite a different one that is still running. */
      const other = m.subscriptionId && m.subscriptionId !== set.subscriptionId && ACTIVE.has(m.subscriptionStatus || '');
      if (other && !ACTIVE.has(set.subscriptionStatus)) return Response.json({ ok: true, ignored: 'stale' });
      /* The member turned auto-pay off at checkout: cancel at period end right away. */
      if (event === 'subscription_created' && payload.meta.custom_data.auto_renew === '0' && set.subscriptionAutoRenew) {
        try { Object.assign(set, lsSubscriptionFields((await setAutoRenew(set.subscriptionId, false)).data)); } catch { /* retried by member */ }
      }
      await db.update(proMembers).set(set).where(eq(proMembers.userId, userId));
      return Response.json({ ok: true });
    }

    return Response.json({ ok: true, ignored: event || 'unknown' });
  } catch (e) {
    console.error('Lemon Squeezy webhook failed', event, e instanceof Error ? e.message : 'unknown');
    /* A 5xx makes Lemon Squeezy retry the delivery. */
    return new Response('Temporary failure', { status: 500 });
  }
};

export const config: Config = { path: '/api/lemonsqueezy-webhook' };
