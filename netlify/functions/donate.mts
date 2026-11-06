/* Donations for Muhasabah via Stripe card payments.
 *
 * GET  /api/donate → { enabled, publishableKey, currency, presets }
 * POST /api/donate → { clientSecret } for a one-time card PaymentIntent
 *
 * Payments switch on automatically once STRIPE_SECRET_KEY and STRIPE_PUBLISHABLE_KEY
 * are set as environment variables. DONATION_CURRENCY (e.g. "usd", "eur") is optional.
 * Card details never touch this server: they go straight from the browser to Stripe.
 */
import type { Config } from '@netlify/functions';

const ZERO_DECIMAL = new Set(['bif', 'clp', 'djf', 'gnf', 'jpy', 'kmf', 'krw', 'mga', 'pyg', 'rwf', 'ugx', 'vnd', 'vuv', 'xaf', 'xof', 'xpf']);
const MIN = 1;
const MAX = 10000;

function settings() {
  const secret = process.env.STRIPE_SECRET_KEY || '';
  const publishable = process.env.STRIPE_PUBLISHABLE_KEY || '';
  const currency = (process.env.DONATION_CURRENCY || 'usd').toLowerCase().replace(/[^a-z]/g, '').slice(0, 3) || 'usd';
  return { secret, publishable, currency, enabled: secret.startsWith('sk_') || secret.startsWith('rk_') ? publishable.startsWith('pk_') : false };
}

export default async (req: Request) => {
  const headers = { 'Cache-Control': 'no-store' };
  const s = settings();

  if (req.method === 'GET') {
    return Response.json({
      enabled: s.enabled,
      publishableKey: s.enabled ? s.publishable : null,
      currency: s.currency,
      presets: [5, 10, 25, 50, 100],
      min: MIN,
      max: MAX,
    }, { headers });
  }

  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405, headers });
  if (req.headers.get('origin') !== new URL(req.url).origin) return new Response('Forbidden', { status: 403, headers });
  if (!s.enabled) return Response.json({ error: 'not_configured' }, { status: 503, headers });

  const raw = await req.text();
  if (raw.length > 2048) return Response.json({ error: 'too_large' }, { status: 413, headers });
  let body: { amount?: unknown; name?: unknown; email?: unknown; note?: unknown };
  try { body = JSON.parse(raw); } catch { return Response.json({ error: 'invalid_json' }, { status: 400, headers }); }

  const amount = Number(body.amount);
  if (!Number.isFinite(amount) || amount < MIN || amount > MAX) return Response.json({ error: 'invalid_amount' }, { status: 400, headers });
  const minor = ZERO_DECIMAL.has(s.currency) ? Math.round(amount) : Math.round(amount * 100);
  const name = typeof body.name === 'string' ? body.name.trim().slice(0, 100) : '';
  const email = typeof body.email === 'string' ? body.email.trim().slice(0, 200) : '';
  const note = typeof body.note === 'string' ? body.note.trim().slice(0, 300) : '';

  const form = new URLSearchParams();
  form.set('amount', String(minor));
  form.set('currency', s.currency);
  form.append('payment_method_types[]', 'card');
  form.set('description', 'Donation for Muhasabah');
  form.set('statement_descriptor_suffix', 'MUHASABAH');
  form.set('metadata[source]', 'muhasabah-app');
  if (name) form.set('metadata[donor_name]', name);
  if (note) form.set('metadata[note]', note);
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) form.set('receipt_email', email);

  try {
    const res = await fetch('https://api.stripe.com/v1/payment_intents', {
      method: 'POST',
      headers: { Authorization: `Bearer ${s.secret}`, 'Content-Type': 'application/x-www-form-urlencoded' },
      body: form,
    });
    const data = await res.json();
    if (!res.ok || !data.client_secret) {
      console.error('Stripe PaymentIntent failed', data?.error?.type, data?.error?.code);
      return Response.json({ error: 'stripe_error' }, { status: 502, headers });
    }
    return Response.json({ clientSecret: data.client_secret }, { headers });
  } catch {
    return Response.json({ error: 'stripe_unreachable' }, { status: 502, headers });
  }
};

export const config: Config = { path: '/api/donate' };
