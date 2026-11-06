/* Scheduled every hour: sends the daily Muhasabah reminder to each device whose
 * local time has reached the hour it chose, once per local day. Expired subscriptions are removed. */
import type { Config } from '@netlify/functions';
import { eq } from 'drizzle-orm';
import { database } from '../../db/index.js';
import { pushSubscriptions } from '../../db/schema.js';
import { configuredWebPush, dailyMessage, localClock } from '../../lib/push.js';

export default async () => {
  const db = database();
  const subs = await db.select().from(pushSubscriptions);
  if (!subs.length) return;
  const webpush = await configuredWebPush();
  let sent = 0, removed = 0;
  for (let i = 0; i < subs.length; i += 50) {
    await Promise.all(subs.slice(i, i + 50).map(async (s) => {
      const clock = localClock(s.timezone);
      if (clock.hour !== s.hour || s.lastSentDay === clock.day) return;
      try {
        await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, dailyMessage(s.lang), { TTL: 3 * 3600, urgency: 'normal' });
        await db.update(pushSubscriptions).set({ lastSentDay: clock.day }).where(eq(pushSubscriptions.endpoint, s.endpoint));
        sent++;
      } catch (e: any) {
        if (e?.statusCode === 404 || e?.statusCode === 410) {
          await db.delete(pushSubscriptions).where(eq(pushSubscriptions.endpoint, s.endpoint));
          removed++;
        } else console.error('push send failed', e?.statusCode || e);
      }
    }));
  }
  console.log(`daily push: ${sent} sent, ${removed} expired removed`);
};

export const config: Config = { schedule: '0 * * * *' };
