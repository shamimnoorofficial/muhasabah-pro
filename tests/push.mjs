/* Offline compatibility checks for reminder scheduling and encrypted Web Push. */
import assert from 'node:assert/strict';
import { createECDH, randomBytes } from 'node:crypto';
import * as webpush from 'web-push';
import { dailyMessage, localClock } from '../lib/push.ts';

const now = new Date('2026-11-07T20:30:00Z');
assert.deepEqual(localClock('Asia/Dhaka', now), { day: '2026-11-08', hour: 2 });
assert.deepEqual(localClock('America/New_York', now), { day: '2026-11-07', hour: 15 });
assert.deepEqual(localClock('invalid/timezone', now), { day: '2026-11-07', hour: 20 });
assert.deepEqual(localClock('UTC', new Date('2026-11-08T00:00:00Z')), { day: '2026-11-08', hour: 0 });
for (const lang of ['en', 'bn', 'ar']) {
  const message = JSON.parse(dailyMessage(lang));
  assert.ok(message.title && message.body);
  assert.equal(message.tag, 'mhs-daily');
  assert.equal(message.url, '/?tab=today&source=push');
}
assert.equal(dailyMessage('unknown'), dailyMessage('en'));

// Prepare the same encrypted request as the reminder function, without sending it.
const subscriber = createECDH('prime256v1');
subscriber.generateKeys();
const vapid = webpush.generateVAPIDKeys();
webpush.setVapidDetails('https://muhasabah-pro.app', vapid.publicKey, vapid.privateKey);
const details = webpush.generateRequestDetails({
  endpoint: 'https://push.example.com/reminder',
  keys: {
    p256dh: subscriber.getPublicKey().toString('base64url'),
    auth: randomBytes(16).toString('base64url'),
  },
}, dailyMessage('en'), {
  TTL: 10800, urgency: 'normal',
});
assert.equal(details.method, 'POST');
assert.equal(details.headers.TTL, 10800);
assert.equal(details.headers['Content-Encoding'], 'aes128gcm');
assert.ok(details.headers.Authorization.startsWith('vapid '));
assert.ok(Buffer.isBuffer(details.body) && details.body.length > 0);
console.log('Push: timezone rollover, language fallback and encrypted request checks passed');
