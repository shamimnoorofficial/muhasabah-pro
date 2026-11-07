/* Growth engine, Prayer hub, Knowledge hub, Wisdom, Reminder, Widget Wizard, share service,
 * deep links, 3-day prompt and save feedback. Needs the dev server on :8889. */
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const BASE = process.env.BASE || 'http://localhost:8889';
(async () => {
  const b = await chromium.launch();
  const now = Date.now();
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: 'block', timezoneId: 'Asia/Dhaka' });
  await ctx.route('**/.netlify/functions/**', r => r.fulfill({ json: null }));
  await ctx.route('**/api/**', r => r.fulfill({ status: 503, json: { error: 'off' } }));
  await ctx.addInitScript(now => {
    if (sessionStorage.getItem('seeded')) return; sessionStorage.setItem('seeded', '1');
    localStorage.setItem('muhasabah:data:v1', JSON.stringify({ lang: 'en', onboarded: true, habits: [], todos: [], ledger: [] }));
    localStorage.setItem('mhs:ftue:v1', JSON.stringify({ intro: 1, tour: 1, tips: {} }));
    localStorage.setItem('muhasabah:prayer', JSON.stringify({ on: true, lat: 23.8103, lng: 90.4125, place: 'Dhaka', src: 'city', method: 'karachi', asr: 'hanafi', links: {} }));
  }, now);
  const errs = [];
  const p = await ctx.newPage();
  // Storage access errors come from the third-party Google Maps embed (mosques tab), not from the app.
  p.on('pageerror', e => { if (!/Access is denied for this document/.test(e.message)) errs.push(e.message); });
  await p.goto(BASE + '/?tab=dashboard'); await p.locator('#mhs-startup').waitFor({ state: 'detached' }); await p.waitForTimeout(1500);

  // Phase 2 — Home prayer strip at the very top with 5 prayers, start/end and countdown headline
  const strip = p.locator('mhs-prayer-strip'); await strip.waitFor();
  assert.equal(await p.evaluate(() => document.querySelector('main .space-y-8').firstElementChild.tagName), 'MHS-PRAYER-STRIP', 'strip is first on Home');
  assert.equal(await strip.locator('.mhs-ps-p').count(), 5);
  assert.match(await strip.locator('.mhs-ps-headline').innerText(), /(starts|ends) in/);
  assert.equal(await strip.locator('.mhs-ps-p.is-now, .mhs-ps-p.is-next').count() >= 1, true, 'current/next highlighted');
  await strip.locator('.mhs-ps-more').click(); const hub = p.locator('#mhs-prayerhub'); await hub.waitFor();

  // Phase 3 — Prayer hub: times incl. Sehri/Iftar/forbidden/Tahajjud/Ishraq/Chasht/Awwabin/Witr, Qibla, Mosques, Essential Amol
  const ids = await hub.locator('.mhs-ph-row').evaluateAll(els => els.map(e => e.getAttribute('data-id')));
  for (const id of ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha', 'sehri', 'iftar', 'fSunrise', 'fZawal', 'fSunset', 'tahajjud', 'ishraq', 'chasht', 'awwabin', 'witr']) assert.ok(ids.includes(id), 'window ' + id);
  assert.match(await hub.locator('.mhs-ph-hero').innerText(), /\d/);
  await hub.locator('.mhs-ph-tab').nth(1).click(); await hub.locator('.mhs-qb').waitFor(); assert.match(await hub.locator('.mhs-qb-info').innerText(), /27[7-9]°/);
  await hub.locator('.mhs-ph-tab').nth(2).click(); assert.ok(await hub.locator('a[href*="google.com/maps"]').count() >= 1, 'maps link');
  await hub.locator('.mhs-ph-tab').nth(3).click(); await hub.locator('.mhs-es-card').first().waitFor();
  assert.ok(await hub.locator('.mhs-es-card').count() >= 18, 'essential amol list');
  await hub.locator('.mhs-es-chk').first().click(); await p.waitForTimeout(200);
  assert.equal(await p.evaluate(() => window.MHSEssential.stats().today), 1, 'check-in stored');
  await hub.locator('.mhs-es-card').first().getByRole('button', { name: /Add to my habits/ }).click(); await p.waitForTimeout(300);
  assert.equal(await p.evaluate(() => window.MHSApp.data().habits.length), 1, 'added to habits');
  await hub.locator('.mhs-mini-tools button').first().click(); await hub.locator('.mhs-ph-adj').waitFor(); // settings
  assert.ok(await hub.locator('select').count() >= 4, 'method/asr/hi-lat/clock settings');
  await p.keyboard.press('Escape'); await p.waitForTimeout(300);
  // Overview shows the essential check-in
  assert.equal(await p.locator('mhs-overview .mhs-ov-tile').count(), 12);

  // Phase 1 — share service: footer + UTM on every share
  const txt = await p.evaluate(() => window.MHSShare.text({ medium: 'hadith', ar: 'إنما الأعمال بالنيات', text: 'Actions are by intentions.', src: 'Bukhari 1' }));
  assert.match(txt, /https:\/\/muhasabah-pro\.app\?utm_source=app_share&utm_medium=hadith$/);
  assert.match(txt, /— Muhasabah-Pro/);
  assert.equal(await p.evaluate(() => window.MHSShare.medium('bogus')), 'app');
  assert.ok(await p.evaluate(() => window.MHSShare.card({ medium: 'quran', ar: 'إِنَّ مَعَ الْعُسْرِ يُسْرًا', text: 'With hardship comes ease.', src: 'Quran 94:6' }).then(b => b.size > 20000)), 'image card');
  // legacy helper routed through the service
  assert.ok(await p.evaluate(() => window.MHSActions.__shareHooked && window.MHSX.__shareHooked));

  // Phase 4 — Widget Wizard saves config and the widget renders from it
  await p.evaluate(() => window.MHSWidgetWizard.open()); const wz = p.locator('#mhs-widgets'); await wz.waitFor();
  assert.ok(await wz.locator('.mhs-ww-opt').count() >= 18);
  await wz.locator('.mhs-ww-opt').filter({ hasText: /Tahajjud/ }).locator('input').check();
  await wz.locator('.mhs-ww-nav .primary').click(); await wz.locator('.mhs-ww-seg').first().waitFor();
  await wz.locator('.mhs-ww-seg').first().locator('button').first().click(); // compact
  await wz.locator('.mhs-ww-nav .primary').click(); await wz.locator('.mhs-ww-preview iframe').waitFor();
  await wz.locator('.mhs-ww-nav .primary').click(); await p.waitForTimeout(300);
  const cfg = await p.evaluate(() => JSON.parse(localStorage.getItem('mhs:widgetcfg')));
  assert.ok(cfg.items.includes('tahajjud') && cfg.size === 'compact');
  const w = await ctx.newPage(); await w.goto(BASE + '/widgets/?view=custom'); await w.locator('#wg-custom .wg-card').first().waitFor(); await w.waitForTimeout(800);
  assert.ok((await w.locator('#wg-custom').innerText()).includes('Tahajjud'), 'widget shows configured item');
  assert.ok(await w.locator('.wg-pt .cd').evaluateAll(els => els.some(e => /left|in /.test(e.textContent))), 'live countdown');
  await w.locator('.wg-es .wg-check').nth(1).click(); await w.waitForTimeout(600);
  assert.equal(await w.evaluate(() => JSON.parse(localStorage.getItem('muhasabah:data:v1')).x.essential.done[Object.keys(JSON.parse(localStorage.getItem('muhasabah:data:v1')).x.essential.done)[0]].length), 2, 'widget check-in persisted');
  await w.close();

  // Phase 5/6 — Knowledge hub: duas, amol, 99 names, search, bookmark, deep link
  await p.evaluate(() => window.MHSKnowledge.open()); const kh = p.locator('#mhs-knowledge'); await kh.waitFor(); await kh.locator('.mhs-kh-cat').first().waitFor({ timeout: 10000 });
  await kh.locator('.mhs-kh-cat').first().click(); await kh.locator('.mhs-kh-item').first().waitFor();
  assert.ok(await kh.locator('.mhs-kh-item .mhs-kh-ar').count() >= 1, 'arabic shown');
  await kh.locator('.mhs-kh-item').first().getByRole('button', { name: /Save/ }).click();
  assert.equal(await p.evaluate(() => window.MHSKnowledge.marks().dua.length), 1);
  await kh.locator('input[type=search]').fill('sleep'); await p.waitForTimeout(400); assert.ok(await kh.locator('.mhs-kh-item').count() >= 1, 'search');
  await kh.locator('.mhs-kh-tab').nth(2).click(); await kh.locator('.mhs-kh-name').first().waitFor(); assert.equal(await kh.locator('.mhs-kh-name').count(), 99);
  await kh.locator('.mhs-kh-name').nth(0).click(); assert.match(await kh.innerText(), /Rahman/i);
  await p.keyboard.press('Escape'); await p.waitForTimeout(300);

  // Phase 7 — Wisdom mini-app with authors, categories, custom entries
  await p.evaluate(() => window.MHSWisdomApp.open()); const wa = p.locator('#mhs-wisdomapp'); await wa.waitFor(); await wa.locator('.mhs-kh-item').first().waitFor({ timeout: 10000 });
  assert.ok(await wa.locator('.mhs-w-authors .mhs-chip').count() >= 5, 'authors');
  await wa.locator('.mhs-mini-tools button').last().click(); await wa.locator('textarea').fill('Test my own wisdom'); await wa.locator('form button[type=submit]').click(); await p.waitForTimeout(300);
  assert.match(await wa.innerText(), /Test my own wisdom/); assert.match(await wa.innerText(), /Your entry/);
  await p.keyboard.press('Escape'); await p.waitForTimeout(300);

  // Phase 8 — Reminder feed: Next changes item, Save, source deep link
  await p.evaluate(() => window.MHSActions.run('wisdom')); const rf = p.locator('#mhs-wisdom'); await rf.waitFor(); await rf.locator('.mhs-rf-card').waitFor();
  assert.ok(await p.evaluate(() => window.MHSReminder.pool().length) > 150, 'expanded pool');
  const first = await rf.locator('.mhs-rf-text').innerText();
  await rf.getByRole('button', { name: /Next/ }).click(); await p.waitForTimeout(300); assert.notEqual(await rf.locator('.mhs-rf-text').innerText(), first);
  assert.ok(await rf.locator('.mhs-rf-notif input[type=time]').count() >= 1, 'notification times');
  await rf.locator('.mhs-mini-chips .mhs-chip').nth(1).click(); await p.waitForTimeout(300); // Quran filter
  await rf.locator('button.mhs-rf-src').click(); await p.locator('#mhs-quran').waitFor(); await p.keyboard.press('Escape'); await p.waitForTimeout(300);

  // Phase 6 — deep links
  const d = await ctx.newPage(); await d.goto(BASE + '/?open=names&n=5'); await d.locator('#mhs-startup').waitFor({ state: 'detached' }); await d.locator('#mhs-knowledge').waitFor(); await d.waitForTimeout(1200);
  assert.match(await d.locator('#mhs-knowledge').innerText(), /Salam/);
  assert.equal(new URL(d.url()).searchParams.get('open'), null, 'deep-link params consumed');
  await d.close();

  // Phase 9 — 3-day prompt
  const e3 = await ctx.newPage(); await e3.addInitScript(() => { const k = d => d.toISOString().slice(0, 10); localStorage.setItem('mhs:engage:v1', JSON.stringify({ days: [0, 1, 2].map(n => { const x = new Date(Date.now() - n * 864e5); return x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') + '-' + String(x.getDate()).padStart(2, '0'); }) })); });
  await e3.goto(BASE + '/?tab=dashboard'); await e3.locator('dialog.mhs-eng').waitFor({ timeout: 20000 });
  assert.match(await e3.locator('dialog.mhs-eng').innerText(), /Share the app/);
  await e3.locator('dialog.mhs-eng .later').last().click();
  assert.equal(await e3.evaluate(() => window.MHSEngage.state().never), true);
  await e3.close();

  // Phase 10 — journal save pill
  await p.evaluate(() => window.MHSJournal.open()); await p.locator('dialog[open] .mhs-saved-pill').waitFor();
  await p.locator('dialog[open] footer button').first().click(); await p.waitForTimeout(400);
  assert.match(await p.locator('dialog[open] .mhs-saved-pill').innerText(), /✓ \d/);
  await p.keyboard.press('Escape');

  // Phase 11 — first launch picks device language + theme
  const fl = await b.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: 'block', locale: 'bn-BD', colorScheme: 'light' });
  await fl.route('**/.netlify/functions/**', r => r.fulfill({ json: null }));
  const f = await fl.newPage(); await f.goto(BASE + '/'); await f.locator('#mhs-startup').waitFor({ state: 'detached' }); await f.waitForTimeout(800);
  assert.equal(await f.locator('html').getAttribute('lang'), 'bn'); assert.equal(await f.locator('html').getAttribute('data-theme'), 'light');
  await fl.close();

  assert.equal(errs.length, 0, errs.join('\n'));
  console.log('Growth suite: share, prayer strip & hub, essential amol, widget wizard, knowledge, wisdom, reminder, deep links, 3-day prompt, save feedback, defaults passed');
  await b.close();
})().catch(e => { console.error(e); process.exit(1); });
