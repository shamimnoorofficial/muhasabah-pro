/* Home checklist, unified quick-action menu, Quran / Hadith / wisdom / Qibla mini-apps, To Do settings,
 * storage preference panel and the first-launch habit picker. Needs the dev server on :8889. */
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
(async () => {
  const b = await chromium.launch();
  for (const viewport of [{ width: 390, height: 844 }, { width: 1280, height: 900 }]) {
    const ctx = await b.newContext({ viewport, serviceWorkers: 'block', timezoneId: 'Asia/Dhaka' });
    const p = await ctx.newPage(); const errs = [];
    p.on('pageerror', e => errs.push(e.message));
    p.on('console', m => { if (m.type() === 'error' && !/preferences|journal|user-data|pro|404|Failed to load|net::|alquran|jsdelivr/.test(m.text())) errs.push('console:' + m.text()); });
    await p.route('**/.netlify/functions/**', r => r.fulfill({ json: null }));
    await p.route('**/api/**', r => r.fulfill({ status: 503, json: { error: 'off' } }));
    const now = Date.now();
    await p.addInitScript(now => {
      localStorage.setItem('muhasabah:data:v1', JSON.stringify({ lang: 'en', onboarded: true,
        habits: [{ id: 'h1', title: 'Quran Daily', points: 20, deadline: '23:59:00', repeat: ['Everyday'], status: 'active', icon: '📖', category: 'Sunnah', createdAt: now - 864e5 * 3, grace: 0, autoPenalty: true, color: '#00C853' }],
        todos: [{ id: 't1', title: 'Call parents', points: 10, penalty: 5, deadline: '23:59:00', icon: '📌', status: 'active', doneAt: null, createdAt: now - 3600e3 }],
        ledger: [] }));
      localStorage.setItem('mhs:ftue:v1', JSON.stringify({ intro: 1, tour: 1, tips: {} }));
    }, now);
    await p.goto('http://localhost:8889/?tab=dashboard'); await p.locator('#mhs-startup').waitFor({ state: 'detached' });
    const nav = viewport.width < 1024 ? p.locator('nav.side-rail') : p.locator('nav.mhs-side-nav');
    assert.match(await nav.innerText(), /Home/); assert.match(await nav.innerText(), /To Do/); assert.doesNotMatch(await nav.innerText(), /Dash\b|Today/);
    // Home checklist with circular checks
    const hc = p.locator('[data-tour="home-check"]'); await hc.waitFor();
    assert.equal(await hc.locator('.mhs-hc-check').count(), 2, 'habit + todo rows');
    const r = await hc.locator('.mhs-hc-check').first().evaluate(e => getComputedStyle(e).borderRadius); assert.equal(r, '50%');
    await hc.locator('.mhs-hc-check:not(:disabled)').first().click(); await p.waitForTimeout(300);
    assert.equal(await hc.locator('.mhs-hc-check.is-done').count(), 0, 'done rows collapse into Completed');
    assert.match(await hc.innerText(), /Completed · 1/);
    await hc.locator('.mhs-hc-toggle').click(); assert.equal(await hc.locator('.mhs-hc-check.is-done').count(), 1);
    // Quick add from Home
    await hc.locator('input').fill('Read 1 page'); await hc.locator('input').press('Enter'); await p.waitForTimeout(200);
    assert.match(await hc.innerText(), /Read 1 page/);
    // old floating buttons gone; unified FAB present
    assert.equal(await p.locator('.mhs-journal-fab').count(), 0);
    await p.locator('#mhs-fab').click(); await p.locator('.mhs-fab-menu.is-open').waitFor();
    assert.equal(await p.locator('.mhs-fab-item button').count(), 6);
    await p.screenshot({ path: `/tmp/mhs-fab-${viewport.width}.png` });
    // Quran
    await p.locator('[data-action="quran"]').click(); const q = p.locator('#mhs-quran'); await q.waitFor();
    assert.equal(await q.locator('.mhs-mini-row').count(), 114);
    await q.locator('input[type=search]').fill('kahf'); assert.equal(await q.locator('.mhs-mini-row').count(), 1);
    await q.locator('.mhs-mini-row').click(); await q.locator('.mhs-q-sura').waitFor(); await p.waitForTimeout(800);
    await p.screenshot({ path: `/tmp/mhs-quran-${viewport.width}.png` });
    await q.locator('.mhs-mini-back').click(); await q.locator('.mhs-mini-search').waitFor();
    await p.keyboard.press('Escape'); await p.waitForTimeout(300); assert.equal(await p.locator('#mhs-quran').count(), 0);
    // Hadith
    await p.locator('#mhs-fab').click(); await p.locator('[data-action="hadith"]').click(); const h = p.locator('#mhs-hadith'); await h.waitFor();
    assert.equal(await h.locator('.mhs-h-bookcard').count(), 8);
    await h.locator('.mhs-q-cont').click(); assert.ok(await h.locator('.mhs-h-item').count() >= 10, 'essentials offline');
    await p.keyboard.press('Escape'); await p.waitForTimeout(300);
    // Wisdom
    await p.locator('#mhs-fab').click(); await p.locator('[data-action="wisdom"]').click(); const w = p.locator('#mhs-wisdom'); await w.waitFor();
    await w.locator('.mhs-w-card').waitFor(); const first = await w.locator('.mhs-w-text').innerText();
    await w.getByRole('button', { name: /Next/ }).click(); await p.waitForTimeout(400); assert.notEqual(await w.locator('.mhs-w-text').innerText(), first);
    await w.locator('.mhs-mini-ib[aria-label="Add your own"]').click(); await w.locator('.mhs-w-form textarea').fill('Test my own saying'); await w.locator('.mhs-w-form button[type=submit]').click(); await p.waitForTimeout(300);
    assert.match(await w.innerText(), /Test my own saying/);
    await p.screenshot({ path: `/tmp/mhs-wisdom-${viewport.width}.png` });
    // jump from a verse to Quran
    for (let k = 0; k < 20; k++) { await w.locator('.mhs-chip', { hasText: 'Quran' }).click(); if (await w.locator('.mhs-w-src.is-link').count()) break; }
    await w.locator('.mhs-w-src.is-link').click(); await p.locator('#mhs-quran .mhs-q-sura').waitFor();
    await p.keyboard.press('Escape'); await p.waitForTimeout(200); await p.keyboard.press('Escape'); await p.waitForTimeout(300);
    // Qibla (no location yet)
    await p.locator('#mhs-fab').click(); await p.locator('[data-action="prayer"]').click(); const qb = p.locator('#mhs-qibla'); await qb.waitFor();
    // Location may be guessed from the time zone (Dhaka) or still be unknown.
    assert.match(await qb.innerText(), /Use my location|Prayer times today/);
    if (await qb.locator('.mhs-compass').count()) assert.match(await qb.locator('.mhs-p-deg').innerText(), /27[7-9]°|280°/);
    await p.keyboard.press('Escape'); await p.waitForTimeout(300);
    // To Do section: overview + settings
    await p.locator('#mhs-fab').click(); await p.locator('[data-action="todo"]').click(); const td = p.getByRole('dialog', { name: /New Todo/ }); await td.waitFor(); await td.getByRole('button', { name: 'Close', exact: true }).click(); await td.waitFor({ state: 'detached' });
    assert.ok(await p.locator('.mhs-todo-dash .mhs-td-tile').count() === 4);
    await p.locator('[data-tour="todo-settings"]').click(); await p.locator('#mhs-td-settings').waitFor();
    await p.locator('#mhs-td-settings input[type=number]').first().fill('15'); await p.locator('#mhs-td-settings input[type=number]').first().dispatchEvent('change');
    await p.screenshot({ path: `/tmp/mhs-todo-${viewport.width}.png`, fullPage: true });
    // Settings: storage preference panel
    await p.getByRole('button', { name: 'Settings', exact: true }).filter({ visible: true }).last().click();
    await p.locator('mhs-sync .mhs-sy-card').first().waitFor(); assert.equal(await p.locator('mhs-sync .mhs-sy-card').count(), 3);
    await p.locator('mhs-sync [data-a="pick-server"]').click(); assert.match(await p.locator('mhs-sync').innerText(), /sign in/i);
    await p.locator('mhs-sync [data-a="pick-device"]').click();
    await p.screenshot({ path: `/tmp/mhs-settings-${viewport.width}.png` });
    // persisted prefs
    const saved = await p.evaluate(() => JSON.parse(localStorage.getItem('muhasabah:data:v1')));
    assert.equal(saved.todoPrefs.points, 15); assert.equal(saved.todos.length, 2);
    assert.equal(errs.length, 0, errs.join('\n'));
    await ctx.close();
  }
  // First run: onboarding habit picker applies habits
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: 'block' });
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.route('**/.netlify/functions/**', r => r.fulfill({ json: null })); await p.route('**/api/**', r => r.fulfill({ status: 503, json: {} }));
  await p.goto('http://localhost:8889/'); await p.locator('#mhs-startup').waitFor({ state: 'detached' });
  await p.getByRole('heading', { name: 'Choose your language', exact: true }).waitFor();
  await p.getByRole('button', { name: 'Skip', exact: true }).click();
  await p.getByRole('heading', { name: 'Start with your daily habits', exact: true }).waitFor();
  assert.equal(await p.locator('.mhs-ftue-habit.on').count(), 6);
  await p.locator('.mhs-ftue-habit:not(.on)').first().click(); assert.equal(await p.locator('.mhs-ftue-habit.on').count(), 7);
  await p.screenshot({ path: '/tmp/mhs-onboard.png' });
  await p.locator('.mhs-ftue-next').click(); await p.locator('.mhs-ftue-next').click();
  await p.getByRole('button', { name: "I'll explore myself", exact: true }).click();
  await p.waitForTimeout(1200);
  const d = await p.evaluate(() => JSON.parse(localStorage.getItem('muhasabah:data:v1')));
  assert.equal(d.habits.length, 7, 'picked habits were created');
  assert.ok(await p.locator('[data-tour="home-check"] .mhs-hc-check').count() >= 7);
  assert.equal(errs.length, 0, errs.join('\n'));
  await ctx.close(); await b.close();
  console.log('Smoke: Home checklist, quick actions, Quran, Hadith, wisdom, Qibla, To Do settings, storage panel and onboarding habits passed');
})().catch(e => { console.error(e); process.exit(1); });
