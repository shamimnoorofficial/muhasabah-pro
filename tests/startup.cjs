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
