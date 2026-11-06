/* Web Push (VAPID) helpers shared by the push API and the scheduled daily reminder.
 * The VAPID key pair is generated once and kept in Netlify Blobs, so no manual key setup is needed. */
import { getStore } from '@netlify/blobs';
import webpush from 'web-push';

type Keys = { publicKey: string; privateKey: string };
let cached: Keys | null = null;

export async function vapidKeys(): Promise<Keys> {
  if (cached) return cached;
  const store = getStore({ name: 'web-push', consistency: 'strong' });
  let keys = (await store.get('vapid', { type: 'json' })) as Keys | null;
  if (!keys?.publicKey || !keys?.privateKey) {
    const fresh = webpush.generateVAPIDKeys();
    /* onlyIfNew: if two requests race on the very first use, both end up with the same stored pair. */
    await store.setJSON('vapid', fresh, { onlyIfNew: true });
    keys = (await store.get('vapid', { type: 'json' })) as Keys;
  }
  cached = keys;
  return keys;
}

export async function configuredWebPush() {
  const keys = await vapidKeys();
  webpush.setVapidDetails('https://muhasabah-plus.app', keys.publicKey, keys.privateKey);
  return webpush;
}

const MESSAGES: Record<string, { title: string; body: string }> = {
  en: { title: 'Time for your Muhasabah', body: "Review today's habits before the day ends and write a line in your journal." },
  ar: { title: 'حان وقت المحاسبة', body: 'راجع عادات اليوم قبل انتهائه واكتب سطراً في يومياتك.' },
  bn: { title: 'মুহাসাবার সময় হয়েছে', body: 'দিন শেষ হওয়ার আগে আজকের অভ্যাসগুলো দেখে নিন এবং জার্নালে এক লাইন লিখুন।' },
};

export function dailyMessage(lang: string) {
  const m = MESSAGES[lang] || MESSAGES.en;
  return JSON.stringify({ title: m.title, body: m.body, tag: 'mhs-daily', url: '/?tab=today&source=push' });
}

/* Local calendar day + hour for a timezone, e.g. { day: '2026-11-05', hour: 21 }. */
export function localClock(timezone: string, now = new Date()) {
  let tz = timezone;
  try { new Intl.DateTimeFormat('en-US', { timeZone: tz }); } catch { tz = 'UTC'; }
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', hourCycle: 'h23' })
    .formatToParts(now).map((p) => [p.type, p.value]));
  return { day: `${parts.year}-${parts.month}-${parts.day}`, hour: Number(parts.hour) % 24 };
}
