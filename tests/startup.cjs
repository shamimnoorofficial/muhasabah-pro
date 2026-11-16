const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const baseURL = process.env.TEST_BASE_URL || 'http://localhost:8889';
(async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    for (const lang of ['en', 'bn', 'ar']) {
      const context = await browser.newContext({ serviceWorkers: 'block' });
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.addInitScript(lang => {
        localStorage.setItem('muhasabah:data:v1', JSON.stringify({ lang }));
        // A new install that picked a language but has not finished the welcome screen yet.
        localStorage.setItem('muhasabah:welcome:v2', '1');
      }, lang);
      await page.goto(baseURL);
      await page.locator('#mhs-startup').waitFor({ state: 'detached' });
      assert.equal(await page.locator('html').getAttribute('lang'), lang);
      // A new install opens straight into the onboarding, starting with the language step.
      const heading = { en: 'Choose your language', bn: 'আপনার ভাষা বেছে নিন', ar: 'اختر لغتك' }[lang];
      await page.getByRole('heading', { name: heading, exact: true }).waitFor();
      assert.equal(await page.locator('.mhs-loading').count(), 0);
      assert.equal(await page.locator('.mhs-welcome').count(), 0, 'no separate welcome box');
      await page.locator('.mhs-ftue-next').click();
      assert.equal(errors.length, 0, errors.join('\n'));
      await context.close();
    }
    // A returning user's home screen must actually be visible, not just present in the page.
    // (A clashing @keyframes name once left the whole app faded out at opacity 0.)
    for (const lang of ['en', 'bn']) {
      const home = await browser.newContext({ serviceWorkers: 'block', viewport: { width: 390, height: 844 } });
      const homePage = await home.newPage();
      await homePage.addInitScript(lang => {
        localStorage.setItem('mhs:ftue:v1', JSON.stringify({ intro: 1, tour: 1, tips: {} }));
        localStorage.setItem('muhasabah:data:v1', JSON.stringify({ lang, onboarded: true, habits: [], todos: [], ledger: [] }));
      }, lang);
      await homePage.goto(baseURL);
      await homePage.locator('#mhs-startup').waitFor({ state: 'detached' });
      await homePage.locator('main').first().waitFor();
      await homePage.waitForTimeout(1500);
      const hidden = await homePage.evaluate(() => {
        const out = [];
        for (let el = document.querySelector('main'); el && el !== document.documentElement; el = el.parentElement) {
          const cs = getComputedStyle(el);
          if (Number(cs.opacity) < 0.99 || cs.visibility === 'hidden' || cs.display === 'none') out.push(el.tagName + '.' + el.className + ' opacity=' + cs.opacity);
        }
        return out;
      });
      assert.deepEqual(hidden, [], 'home screen is hidden: ' + hidden.join(', '));
      await home.close();
    }
    const context = await browser.newContext({ serviceWorkers: 'block' });
    const page = await context.newPage();
    await page.addInitScript(() => {
      localStorage.setItem('muhasabah:data:v1', JSON.stringify({ lang: 'bn' }));
    });
    await page.route('**/assets/app.js', route => route.abort());
    await page.goto(baseURL);
    await page.getByText('মুহাসাবা খোলা যায়নি। সংযোগ পরীক্ষা করে আবার চেষ্টা করুন।', { exact: true }).waitFor();
    assert.equal(await page.locator('#mhs-startup-retry').textContent(), 'আবার চেষ্টা করুন');
    await page.unroute('**/assets/app.js');
    await page.locator('#mhs-startup-retry').click();
    await page.locator('#mhs-startup').waitFor({ state: 'detached' });
    await context.close();
    const slow = await browser.newContext({ serviceWorkers: 'block' });
    const slowPage = await slow.newPage();
    await slowPage.clock.install();
    await slowPage.route('**/assets/app.js', () => {});
    await slowPage.goto(baseURL, { waitUntil: 'commit' });
    await slowPage.locator('#mhs-startup-message').waitFor();
    // While loading only the glowing logo shows; the label is kept for screen readers.
    assert.equal(await slowPage.locator('#mhs-startup-message.is-quiet').count(), 1);
    assert.equal(await slowPage.locator('.mhs-splash-ring').count() > 0, true);
    await slowPage.clock.fastForward(16000);
    assert.equal(await slowPage.locator('#mhs-startup-retry').isVisible(), true);
    assert.equal(await slowPage.locator('#mhs-startup-message.is-quiet').count(), 0, 'the error message is shown');
    await slow.close();
    console.log('Startup: English, Bengali, Arabic, failed download, retry and stalled download passed');
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
