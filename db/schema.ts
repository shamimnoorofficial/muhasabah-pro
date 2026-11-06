import { pgTable, text, bigint, primaryKey, jsonb, boolean, integer } from 'drizzle-orm/pg-core';

export const journalEntries = pgTable('journal_entries', {
  owner: text('owner').notNull(),
  day: text('day').notNull(),
  content: text('content').notNull().default(''),
  updatedAt: bigint('updated_at', { mode: 'number' }).notNull(),
}, table => [primaryKey({ columns: [table.owner, table.day] })]);

export const appPreferences = pgTable('app_preferences', {
  owner: text('owner').primaryKey(),
  language: text('language').notNull().default('en'),
  theme: text('theme').notNull().default('dark'),
  journalSettings: jsonb('journal_settings'),
});

/* Muhasabah Pro: one row per signed-in account (Netlify Identity user id). */
export const proMembers = pgTable('pro_members', {
  userId: text('user_id').primaryKey(),
  email: text('email').notNull().default(''),
  stripeCustomerId: text('stripe_customer_id'),
  /* Lifetime ($10 one-time) purchase; the payment is kept so cashback can be refunded against it. */
  lifetimePaymentIntent: text('lifetime_payment_intent'),
  lifetimePurchasedAt: bigint('lifetime_purchased_at', { mode: 'number' }),
  /* Monthly ($1) subscription mirrored from Stripe. */
  subscriptionId: text('subscription_id'),
  subscriptionStatus: text('subscription_status'),
  subscriptionPeriodEnd: bigint('subscription_period_end', { mode: 'number' }),
  subscriptionAutoRenew: boolean('subscription_auto_renew').notNull().default(true),
  syncedAt: bigint('synced_at', { mode: 'number' }),
  createdAt: bigint('created_at', { mode: 'number' }).notNull(),
  /* Which gateway each plan was bought through: null/'stripe' or 'lemonsqueezy'. */
  lifetimeProvider: text('lifetime_provider'),
  subscriptionProvider: text('subscription_provider'),
});

/* Each 40-day-streak cashback ($1, at most 10) refunded against the lifetime payment. */
export const proCashback = pgTable('pro_cashback', {
  userId: text('user_id').notNull(),
  step: integer('step').notNull(),
  amountCents: integer('amount_cents').notNull(),
  refundId: text('refund_id').notNull(),
  streak: integer('streak').notNull(),
  createdAt: bigint('created_at', { mode: 'number' }).notNull(),
}, table => [primaryKey({ columns: [table.userId, table.step] })]);

/* Web Push: one row per browser/device that turned on the daily reminder.
 * Anonymous — only the push endpoint, its keys and the device's timezone + chosen hour. */
export const pushSubscriptions = pgTable('push_subscriptions', {
  endpoint: text('endpoint').primaryKey(),
  p256dh: text('p256dh').notNull(),
  auth: text('auth').notNull(),
  timezone: text('timezone').notNull().default('UTC'),
  hour: integer('hour').notNull().default(21),
  lang: text('lang').notNull().default('en'),
  lastSentDay: text('last_sent_day'),
  createdAt: bigint('created_at', { mode: 'number' }).notNull(),
  updatedAt: bigint('updated_at', { mode: 'number' }).notNull(),
});

/* Account data sync (Monthly Pro): the whole on-device dataset (habits, to-dos, ledger, journal,
 * preferences) mirrored as one JSON document per signed-in Netlify Identity user. */
export const userData = pgTable('user_data', {
  userId: text('user_id').primaryKey(),
  data: jsonb('data').notNull(),
  updatedAt: bigint('updated_at', { mode: 'number' }).notNull(),
  device: text('device'),
  size: integer('size').notNull().default(0),
  createdAt: bigint('created_at', { mode: 'number' }).notNull(),
});
