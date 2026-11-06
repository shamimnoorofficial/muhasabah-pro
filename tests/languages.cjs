/* Every-language interface: the language list, English default, automatic translation
 * of the visible interface, right-to-left layout and switching back to English.
 * The translation service is stubbed, so this runs offline: node tests/languages.cjs */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { chromium } = require('playwright');
(async () => {
  const codes = JSON.parse(fs.readFileSync(__dirname + '/../i18n/languages.json', 'utf8'));
  const inline = JSON.parse(fs.readFileSync(__dirname + '/../pwa/i18n.js', 'utf8').match(/var CODES = (\[[^\]]+\])/)[1]);
  assert.deepEqual(inline, codes, 'pwa/i18n.js and i18n/languages.json must list the same languages');
  assert.ok(codes.length > 90 && codes[0] === 'en');
  const browser = await chromium.launch({ headless: true });
  try {
    for (const viewport of [{ width: 390, height: 844 }, { width: 1280, height: 900 }]) {
      const context = await browser.newContext({ viewport, serviceWorkers: 'block' });
      const page = await context.newPage(); const errors = []; page.on('pageerror', e => errors.push(e.message));
      const asked = [];
      await page.route('**/.netlify/functions/preferences', r => r.fulfill({ json: null }));
      await page.route('**/api/i18n**', route => {
        if (route.request().method() === 'GET') return route.fulfill({ json: { translations: {} } });
        const { lang, strings } = route.request().postDataJSON(); asked.push(...strings);
        return route.fulfill({ json: { translations: Object.fromEntries(strings.map(s => [s, `[${lang}] ${s}`])) } });
      });
      await page.goto('http://localhost:8889');
      assert.equal(await page.locator('html').getAttribute('lang'), 'en', 'English is the default');
      // The onboarding starts with the language step, then offers location and notifications.
      await page.locator('.mhs-ftue-langs').waitFor();
      assert.ok(await page.locator('.mhs-ftue-lang').count() >= codes.length);
      await page.locator('.mhs-ftue-search').fill('hebr');
      assert.equal(await page.locator('.mhs-ftue-lang').count(), 1, 'search finds one language');
      await page.locator('.mhs-ftue-lang').click();
      await page.getByRole('heading', { name: '[he] Choose your language', exact: true }).waitFor();
      await page.getByRole('button', { name: '[he] Skip', exact: true }).click();
      // Skip lands on the first-launch habit picker, then the permissions.
      await page.getByRole('heading', { name: '[he] Start with your daily habits', exact: true }).waitFor();
      assert.ok(await page.locator('.mhs-ftue-habit').count() >= 10, 'habit picker');
      await page.getByRole('button', { name: '[he] Next', exact: true }).click();
      await page.getByRole('heading', { name: '[he] Exact prayer times', exact: true }).waitFor();
      assert.equal(await page.locator('.mhs-ftue-perm').count(), 1, 'location step');
      await page.getByRole('button', { name: '[he] Next', exact: true }).click();
      await page.getByRole('heading', { name: '[he] Reminders before deadlines', exact: true }).waitFor();
      assert.equal(await page.locator('.mhs-ftue-perm').count(), 1, 'notification step');
      await page.getByRole('button', { name: "[he] I'll explore myself", exact: true }).click();
      await page.getByRole('heading', { name: '[he] Home', exact: true }).waitFor();
      assert.equal(await page.locator('html').getAttribute('dir'), 'rtl');
      assert.ok(asked.every(s => typeof s === 'string') && !asked.some(s => /^\d+$/.test(s)));
      await page.getByRole('button', { name: '[he] Settings', exact: true }).filter({ visible: true }).last().click();
      await page.locator('.mhs-preferences .mhs-lp-btn').click();
      await page.locator('.mhs-lp-search input').fill('english');
      await page.locator('.mhs-lp-opt', { hasText: 'English' }).first().click();
      await page.getByRole('heading', { name: 'Settings', exact: true }).waitFor();
      assert.equal(await page.locator('html').getAttribute('dir'), 'ltr');
      assert.equal(await page.getByText('[he]', { exact: false }).count(), 0, 'switching back restores English');
      assert.equal(errors.length, 0, errors.join('\n'));
      await context.close();
    }
    console.log('Languages: list, English default, automatic translation, RTL and switching back passed');
  } finally { await browser.close(); }
})();
