/* Prayer-time accuracy and Quran Rasm (mushaf script) switching.
 * Reference times for 16 Nov 2026 were recorded from the Aladhan API using each region's official
 * authority; the app must pick that authority automatically and stay within 2 minutes (Dhuhr gets
 * the app's intentional +1 minute). Needs the dev server: node tests/prayer-accuracy.cjs */
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const BASE = process.env.TEST_BASE_URL || 'http://localhost:8889';
const REF = [["Dhaka",23.8103,90.4125,"karachi","hanafi","Asia/Dhaka",{"fajr":"04:55","sunrise":"06:13","dhuhr":"11:43","asr":"15:37","maghrib":"17:12","isha":"18:31"}],["Makkah",21.4225,39.8262,"makkah","standard","Asia/Riyadh",{"fajr":"05:13","sunrise":"06:32","dhuhr":"12:05","asr":"15:16","maghrib":"17:39","isha":"19:09"}],["Dubai",25.2048,55.2708,"dubai","standard","Asia/Dubai",{"fajr":"05:16","sunrise":"06:36","dhuhr":"12:07","asr":"15:10","maghrib":"17:34","isha":"18:51"}],["Cairo",30.0444,31.2357,"egypt","standard","Africa/Cairo",{"fajr":"04:51","sunrise":"06:21","dhuhr":"11:40","asr":"14:38","maghrib":"16:58","isha":"18:19"}],["Istanbul",41.0082,28.9784,"turkey","standard","Europe/Istanbul",{"fajr":"06:17","sunrise":"07:45","dhuhr":"12:54","asr":"15:29","maghrib":"17:52","isha":"19:15"}],["Tehran",35.6892,51.389,"tehran","standard","Asia/Tehran",{"fajr":"05:14","sunrise":"06:41","dhuhr":"11:49","asr":"14:37","maghrib":"17:16","isha":"18:05"}],["Kuala Lumpur",3.139,101.6869,"jakim","standard","Asia/Kuala_Lumpur",{"fajr":"05:38","sunrise":"06:59","dhuhr":"12:58","asr":"16:21","maghrib":"18:57","isha":"20:10"}],["Jakarta",-6.2088,106.8456,"kemenag","standard","Asia/Jakarta",{"fajr":"04:03","sunrise":"05:25","dhuhr":"11:37","asr":"15:00","maghrib":"17:49","isha":"19:03"}],["New York",40.7128,-74.006,"isna","standard","America/New_York",{"fajr":"05:25","sunrise":"06:44","dhuhr":"11:41","asr":"14:17","maghrib":"16:37","isha":"17:56"}],["London",51.5074,-0.1278,"mwl","standard","Europe/London",{"fajr":"05:23","sunrise":"07:20","dhuhr":"11:45","asr":"13:49","maghrib":"16:10","isha":"18:01"}]];
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: 'block' });
  await ctx.addInitScript(() => { localStorage.setItem('muhasabah:data:v1', JSON.stringify({ lang: 'en', onboarded: true, habits: [], ledger: [] })); localStorage.setItem('mhs:ftue:v1', JSON.stringify({ intro: 1, tour: 1, tips: {} })); });
  await ctx.route('https://api.quran.com/**', r => r.fulfill({ json: { verses: [1, 2, 3, 4].map(a => ({ verse_key: '112:' + a, text_indopak: 'INDOPAK-' + a + '‏' })) } }));
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto(BASE + '/?tab=dashboard'); await p.waitForFunction(() => window.MHSPrayer && window.MHSPrayer.resolve);
  for (const [name, lat, lng, method, asr, tz, ref] of REF) {
    const got = await p.evaluate(([lat, lng, tz]) => {
      localStorage.setItem('muhasabah:prayer', JSON.stringify({ on: true, lat, lng, place: 'x', src: 'city' }));
      const d = MHSPrayer.day(new Date(2026, 10, 16, 12).getTime());
      const f = x => new Intl.DateTimeFormat('en-GB', { timeZone: tz, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(new Date(x));
      return { r: MHSPrayer.resolve(), t: { fajr: f(d.fajr), sunrise: f(d.sunrise), dhuhr: f(d.dhuhr), asr: f(d.asr), maghrib: f(d.maghrib), isha: f(d.isha) } };
    }, [lat, lng, tz]);
    assert.deepEqual(got.r, { method, asr }, name + ' authority');
    for (const k of Object.keys(ref)) {
      const m = s => { const [h, mm] = s.split(':').map(Number); return h * 60 + mm; };
      assert.ok(Math.abs(m(got.t[k]) - m(ref[k])) <= 2, name + ' ' + k + ' ' + got.t[k] + ' vs ' + ref[k]);
    }
  }
  // A method the user picks explicitly is kept.
  assert.equal(await p.evaluate(() => { localStorage.setItem('muhasabah:prayer', JSON.stringify({ on: true, lat: 23.81, lng: 90.41, src: 'city', method: 'mwl', asr: 'standard', mv: 2 })); return MHSPrayer.resolve().method; }), 'mwl');

  // Rasm: Indo-Pak swaps in the Indo-Pak text and font; Uthmani restores the original.
  await p.evaluate(() => { localStorage.setItem('muhasabah:prayer', JSON.stringify({ on: true, lat: 23.81, lng: 90.41, src: 'city' })); MHSRasm.set('indopak'); MHSQuran.open({ surah: 112 }); });
  const q = p.locator('#mhs-quran'); await q.locator('.mhs-q-ayah').first().waitFor({ timeout: 20000 });
  await p.waitForFunction(() => /INDOPAK-1/.test(document.querySelector('#mhs-quran .mhs-q-ayah .ar').textContent));
  assert.match(await q.locator('.mhs-q-ayah .ar').first().evaluate(n => getComputedStyle(n).fontFamily), /IndoPak Nastaleeq/);
  await q.locator('[data-reader-settings]').click(); await p.locator('.mhs-rasm-opt[data-rasm=uthmani]').click(); await p.keyboard.press('Escape');
  await p.waitForFunction(() => !/INDOPAK/.test(document.querySelector('#mhs-quran .mhs-q-ayah .ar').textContent));
  const first = await q.locator('.mhs-q-ayah .ar').first().textContent();
  assert.doesNotMatch(first, /^بِسْمِ/, 'Bismillah is not repeated inside ayah 1');
  assert.match(await q.locator('.mhs-q-ayah .ar').first().evaluate(n => getComputedStyle(n).fontFamily), /Uthmanic Hafs/);
  assert.deepEqual(errs, []);
  await b.close();
  console.log('Prayer accuracy (' + REF.length + ' cities, automatic authority) and Quran Rasm switching passed');
})().catch(e => { console.error(e); process.exit(1); });
