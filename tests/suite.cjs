/* Integrated mini-apps: Notes, Hisab (ledger), Zikr, Amol, Home overview, footer, Pro gate for
 * Export/Import, mini-app data in backups, and the home-screen widget ↔ app sync.
 * Needs the dev server on :8889. */
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const BASE = process.env.BASE || 'http://localhost:8889';
(async () => {
  const b = await chromium.launch();
  const now = Date.now();
  const seed = now => {
    if (sessionStorage.getItem('seeded')) return;
    sessionStorage.setItem('seeded', '1');
    localStorage.setItem('muhasabah:data:v1', JSON.stringify({ lang: 'en', onboarded: true,
      habits: [{ id: 'h1', title: 'Quran Daily', points: 20, deadline: '23:59:00', repeat: ['Everyday'], status: 'active', icon: '📖', category: 'Sunnah', createdAt: now - 864e5 * 3, grace: 0, autoPenalty: true, color: '#00C853' }],
      todos: [{ id: 't1', title: 'Call parents', points: 10, penalty: 5, deadline: '23:59:00', icon: '📌', status: 'active', doneAt: null, createdAt: now - 3600e3 }],
      ledger: [] }));
    localStorage.setItem('mhs:ftue:v1', JSON.stringify({ intro: 1, tour: 1, tips: {} }));
  };
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: 'block', timezoneId: 'Asia/Dhaka', acceptDownloads: true });
  await ctx.route('**/.netlify/functions/**', r => r.fulfill({ json: null }));
  await ctx.route('**/api/**', r => r.fulfill({ status: 503, json: { error: 'off' } }));
  await ctx.addInitScript(seed, now);
  const errs = [];
  const p = await ctx.newPage();
  p.on('pageerror', e => errs.push(e.message));
  await p.goto(BASE + '/?tab=dashboard'); await p.locator('#mhs-startup').waitFor({ state: 'detached' });

  // Home: master overview + footer with developer link
  await p.locator('mhs-overview .mhs-ov').waitFor();
  assert.equal(await p.locator('mhs-overview .mhs-ov-tile').count(), 8);
  const dev = p.locator('mhs-footer a.mhs-foot-dev');
  assert.equal(await dev.getAttribute('href'), 'https://github.com/shamimnoorofficial');
  assert.equal(await dev.getAttribute('target'), '_blank');
  assert.match(await dev.getAttribute('rel'), /noopener/);
  assert.match(await dev.innerText(), /Developed by\s*Shamim Noor/);

  // Unified + menu has the new mini-apps
  await p.locator('#mhs-fab').click(); await p.locator('.mhs-fab-menu.is-open').waitFor();
  assert.equal(await p.locator('.mhs-fab-item button').count(), 10);
  for (const k of ['notes', 'hisab', 'zikr', 'amol']) assert.equal(await p.locator(`[data-action="${k}"]`).count(), 1, k);

  // Notes: take a note, go back, it is saved
  await p.locator('[data-action="notes"]').click(); const n = p.locator('#mhs-notes'); await n.waitFor();
  await n.locator('.mhs-nt-take').first().click();
  await n.locator('textarea').first().fill('Buy dates for iftar — 2 kg');
  await p.waitForTimeout(600);
  await p.keyboard.press('Escape'); await p.waitForTimeout(500);
  assert.equal(await p.evaluate(() => window.MHSNotes.stats().total), 1, 'note saved');

  // Zikr: five taps are logged for today
  await p.evaluate(() => window.MHSZikr.open()); const z = p.locator('#mhs-zikr .mhs-zk-tap'); await z.waitFor();
  for (let i = 0; i < 5; i++) await z.click();
  await p.waitForTimeout(600);
  assert.equal(await p.evaluate(() => window.MHSZikr.stats().today), 5);
  await p.keyboard.press('Escape'); await p.waitForTimeout(300);

  // Amol: tick one item
  await p.evaluate(() => window.MHSAmol.open()); await p.locator('#mhs-amol .mhs-am-chk').first().click();
  assert.equal(await p.evaluate(() => window.MHSAmol.stats().today), 1);
  await p.keyboard.press('Escape'); await p.waitForTimeout(300);

  // Hisab: data API + stats
  await p.evaluate(() => {
    const d = new Date(), k = window.MHSX.dayKey(d);
    window.MHSX.set('hisab', { currency: '৳', books: [{ id: 'b1', name: 'Shop dues', emoji: '🧾', type: 'dues', createdAt: Date.now() }, { id: 'b2', name: 'Cash', emoji: '💵', type: 'cash', createdAt: Date.now() }],
      entries: [{ id: 'e1', bookId: 'b1', party: 'Karim', dir: 'out', amount: 500, note: 'Rice', date: k, ts: Date.now() }, { id: 'e2', bookId: 'b1', party: 'Karim', dir: 'in', amount: 200, note: 'Paid', date: k, ts: Date.now() },
        { id: 'e3', bookId: 'b2', dir: 'in', amount: 1000, note: 'Sales', date: k, ts: Date.now() }, { id: 'e4', bookId: 'b2', dir: 'out', amount: 250, note: 'Tea', date: k, ts: Date.now() }] });
  });
  const hs = await p.evaluate(() => window.MHSHisab.stats());
  assert.equal(hs.receivable, 300); assert.equal(hs.monthNet, 750);
  await p.evaluate(() => window.MHSHisab.open({ bookId: 'b1' })); await p.locator('#mhs-hisab').waitFor(); await p.waitForTimeout(300);
  assert.match(await p.locator('#mhs-hisab').innerText(), /Karim/);
  await p.keyboard.press('Escape'); await p.waitForTimeout(300);

  // Calculator evaluates safely
  assert.equal(await p.evaluate(() => window.MHSCalc.evaluate('120+35×2−10%')), 189.9);

  // Mini-app data persists across reloads (part of the main data object)
  await p.waitForTimeout(600);
  await p.reload(); await p.locator('#mhs-startup').waitFor({ state: 'detached' }); await p.waitForTimeout(500);
  const x = await p.evaluate(() => window.MHS.current().x);
  assert.equal(x.notes.length, 1); assert.equal(x.hisab.entries.length, 4); assert.ok(x.zikr.log);

  // Free tier: Export opens the upgrade prompt instead of downloading
  await p.evaluate(() => window.MHSApp.nav('settings')); await p.waitForTimeout(400);
  await p.locator('button[data-mhs-lock]').scrollIntoViewIfNeeded(); await p.locator('button[data-mhs-lock]').click();
  await p.locator('dialog.mhs-gate[open]').waitFor();
  assert.match(await p.locator('dialog.mhs-gate').innerText(), /Export & Import/);
  await p.keyboard.press('Escape'); await p.waitForTimeout(300);
  await p.locator('label[data-mhs-lock]').click(); await p.locator('dialog.mhs-gate[open]').waitFor(); await p.keyboard.press('Escape');
  assert.equal(await p.locator('mhs-plans .mhs-plan').count(), 3);

  // Pro: Export downloads a backup that includes the mini-app data
  await p.evaluate(() => { localStorage.setItem('mhs:pro', '1'); document.dispatchEvent(new Event('mhs:pro-change')); });
  assert.equal(await p.evaluate(() => window.MHSGate.has('backup')), true);
  const [dl] = await Promise.all([p.waitForEvent('download'), p.locator('button[data-mhs-lock]').click()]);
  const json = JSON.parse(require('node:fs').readFileSync(await dl.path(), 'utf8'));
  assert.equal(json.x.notes.length, 1); assert.equal(json.x.hisab.books.length, 2);
  await p.evaluate(() => localStorage.removeItem('mhs:pro'));

  // Widget with the app open: check-in is applied through the app (live)
  const w = await ctx.newPage(); w.on('pageerror', e => errs.push('widget: ' + e.message));
  await w.goto(BASE + '/widgets/?view=today'); await w.locator('.wg-habits .wg-check').first().waitFor();
  await w.locator('.wg-todos .wg-check').first().click(); await w.waitForTimeout(900);
  assert.equal(await p.evaluate(() => window.MHSApp.todos().find(t => t.id === 't1').status), 'done', 'todo checked via app');
  await p.close();

  // Widget with the app closed: writes directly, app sees it on next launch
  await w.reload(); await w.locator('.wg-habits .wg-check').first().click(); await w.waitForTimeout(700);
  assert.equal(await w.locator('.wg-habits .wg-row.is-done').count(), 1);
  const p2 = await ctx.newPage(); p2.on('pageerror', e => errs.push(e.message));
  await p2.goto(BASE + '/?tab=dashboard'); await p2.locator('#mhs-startup').waitFor({ state: 'detached' }); await p2.waitForTimeout(400);
  assert.ok(await p2.evaluate(() => window.MHSApp.habitsToday().find(h => h.id === 'h1').done), 'habit check-in from widget is in the app');

  assert.deepEqual(errs, []);
  await b.close();
  console.log('suite: ok');
})().catch(e => { console.error(e); process.exit(1); });
