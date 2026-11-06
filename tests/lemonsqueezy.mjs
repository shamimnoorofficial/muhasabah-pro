/* Lemon Squeezy helpers: webhook signature checks and subscription → membership mapping. */
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';

process.env.LEMONSQUEEZY_WEBHOOK_SECRET = 'test-secret';
const { verifySignature, lsSubscriptionFields } = await import('../lib/lemonsqueezy.ts');

const body = JSON.stringify({ meta: { event_name: 'order_created' } });
const sig = createHmac('sha256', 'test-secret').update(body).digest('hex');
assert.equal(verifySignature(body, sig), true);
assert.equal(verifySignature(body + ' ', sig), false, 'tampered body');
assert.equal(verifySignature(body, null), false, 'missing signature');
assert.equal(verifySignature(body, 'zz'), false, 'malformed signature');

const future = new Date(Date.now() + 5 * 86400000).toISOString();
const past = new Date(Date.now() - 86400000).toISOString();
const active = lsSubscriptionFields({ id: 7, attributes: { status: 'active', renews_at: future, cancelled: false } });
assert.equal(active.subscriptionStatus, 'active');
assert.equal(active.subscriptionAutoRenew, true);
assert.equal(active.subscriptionId, '7');
assert.equal(active.subscriptionProvider, 'lemonsqueezy');

const grace = lsSubscriptionFields({ id: 7, attributes: { status: 'cancelled', ends_at: future, cancelled: true } });
assert.equal(grace.subscriptionStatus, 'active', 'cancelled keeps access until ends_at');
assert.equal(grace.subscriptionAutoRenew, false);
assert.equal(grace.subscriptionPeriodEnd, Date.parse(future));

assert.equal(lsSubscriptionFields({ id: 7, attributes: { status: 'cancelled', ends_at: past } }).subscriptionStatus, 'canceled');
assert.equal(lsSubscriptionFields({ id: 7, attributes: { status: 'expired' } }).subscriptionStatus, 'canceled');
assert.equal(lsSubscriptionFields({ id: 7, attributes: { status: 'past_due', renews_at: future } }).subscriptionStatus, 'past_due');
assert.equal(lsSubscriptionFields({ id: 7, attributes: { status: 'on_trial', renews_at: future } }).subscriptionStatus, 'trialing');

console.log('Lemon Squeezy: signature and subscription mapping checks passed');
