/* Lemon Squeezy (merchant of record) helpers shared by /api/pro and the webhook.
 *
 * Environment variables:
 *   LEMONSQUEEZY_API_KEY               API key (Settings → API)
 *   LEMONSQUEEZY_LIFETIME_VARIANT_ID   variant ID of the one-time "Lifetime" product
 *   LEMONSQUEEZY_MONTHLY_VARIANT_ID    variant ID of the monthly subscription product
 *   LEMONSQUEEZY_WEBHOOK_SECRET        signing secret of the webhook pointing at /api/lemonsqueezy-webhook
 *   LEMONSQUEEZY_STORE_ID              optional — looked up from the variant when missing
 */
import { createHmac, timingSafeEqual } from 'node:crypto';

const API = 'https://api.lemonsqueezy.com/v1/';
const DAY = 86_400_000;

export function lsKeys() {
  const apiKey = process.env.LEMONSQUEEZY_API_KEY || '';
  const lifetimeVariant = (process.env.LEMONSQUEEZY_LIFETIME_VARIANT_ID || '').trim();
  const monthlyVariant = (process.env.LEMONSQUEEZY_MONTHLY_VARIANT_ID || '').trim();
  const storeId = (process.env.LEMONSQUEEZY_STORE_ID || '').trim();
  const webhookSecret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET || '';
  const enabled = apiKey.length > 20 && /^\d+$/.test(lifetimeVariant) && /^\d+$/.test(monthlyVariant);
  return { apiKey, lifetimeVariant, monthlyVariant, storeId, webhookSecret, enabled };
}

export class LemonError extends Error {
  code: string;
  status: number;
  constructor(code: string, status = 502) { super(code); this.code = code; this.status = status; }
}

export async function lemon(path: string, opts: { method?: string; body?: unknown } = {}) {
  const method = opts.method || (opts.body ? 'POST' : 'GET');
  let res: Response;
  try {
    res = await fetch(API + path, {
      method,
      headers: {
        Accept: 'application/vnd.api+json',
        'Content-Type': 'application/vnd.api+json',
        Authorization: `Bearer ${lsKeys().apiKey}`,
      },
      body: opts.body ? JSON.stringify(opts.body) : undefined,
    });
  } catch { throw new LemonError('gateway_unreachable'); }
  const data: any = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.error('Lemon Squeezy request failed', path.split('?')[0].split('/')[0], res.status, data?.errors?.[0]?.detail?.slice?.(0, 120));
    throw new LemonError(res.status === 404 ? 'not_found' : 'gateway_error', res.status >= 500 ? 502 : 400);
  }
  return data;
}

/* Variant price (cents) and the store it belongs to, cached per function instance. */
const variantCache: Record<string, { at: number; price: number; storeId: string }> = {};
export async function variantInfo(id: string) {
  const hit = variantCache[id];
  if (hit && Date.now() - hit.at < 10 * 60_000) return hit;
  const v = await lemon(`variants/${id}?include=product`);
  const product = (v.included || []).find((x: any) => x.type === 'products');
  const info = { at: Date.now(), price: Number(v.data?.attributes?.price) || 0, storeId: String(product?.attributes?.store_id || '') };
  variantCache[id] = info;
  return info;
}

export async function createCheckout(opts: { variant: string; email: string; userId: string; autoRenew: boolean; redirectUrl: string; dark: boolean }) {
  const k = lsKeys();
  const storeId = k.storeId || (await variantInfo(opts.variant)).storeId;
  if (!storeId) throw new LemonError('gateway_error');
  const res = await lemon('checkouts', {
    body: {
      data: {
        type: 'checkouts',
        attributes: {
          checkout_data: { email: opts.email || undefined, custom: { user_id: opts.userId, auto_renew: opts.autoRenew ? '1' : '0' } },
          checkout_options: { embed: true, media: false, logo: true, dark: opts.dark },
          product_options: { redirect_url: opts.redirectUrl, enabled_variants: [Number(opts.variant)] },
          expires_at: new Date(Date.now() + DAY).toISOString(),
        },
        relationships: {
          store: { data: { type: 'stores', id: storeId } },
          variant: { data: { type: 'variants', id: opts.variant } },
        },
      },
    },
  });
  const url = res?.data?.attributes?.url;
  if (!url) throw new LemonError('gateway_error');
  return String(url);
}

/* Lemon Squeezy subscription → the fields the app already uses for Stripe subscriptions.
 * A "cancelled" subscription keeps access until ends_at (grace period), so it stays active. */
export function lsSubscriptionFields(sub: any) {
  const a = sub?.attributes || {};
  const endsAt = a.ends_at ? Date.parse(a.ends_at) : null;
  const renewsAt = a.renews_at ? Date.parse(a.renews_at) : null;
  const map: Record<string, string> = { active: 'active', on_trial: 'trialing', past_due: 'past_due', unpaid: 'unpaid', paused: 'paused', expired: 'canceled' };
  const status = a.status === 'cancelled' ? (endsAt && endsAt > Date.now() ? 'active' : 'canceled') : (map[a.status] || String(a.status || 'unknown'));
  return {
    subscriptionId: String(sub.id),
    subscriptionStatus: status,
    subscriptionPeriodEnd: a.status === 'cancelled' ? endsAt : renewsAt,
    subscriptionAutoRenew: a.status !== 'cancelled' && a.status !== 'expired' && !a.cancelled,
    subscriptionProvider: 'lemonsqueezy',
    syncedAt: Date.now(),
  };
}

export async function setAutoRenew(subscriptionId: string, on: boolean) {
  return lemon(`subscriptions/${subscriptionId}`, {
    method: 'PATCH',
    body: { data: { type: 'subscriptions', id: subscriptionId, attributes: { cancelled: !on } } },
  });
}

/* Partial refund against an order (used for the streak cashback). */
export async function refundOrder(orderId: string, cents: number) {
  return lemon(`orders/${orderId}/refund`, {
    method: 'POST',
    body: { data: { type: 'orders', id: orderId, attributes: { amount: cents } } },
  });
}

export function verifySignature(raw: string, signature: string | null) {
  const secret = lsKeys().webhookSecret;
  if (!secret || !signature || !/^[a-f0-9]{64}$/i.test(signature)) return false;
  const digest = createHmac('sha256', secret).update(raw).digest();
  const given = Buffer.from(signature, 'hex');
  return given.length === digest.length && timingSafeEqual(given, digest);
}
