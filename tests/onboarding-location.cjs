const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const baseURL = process.env.TEST_BASE_URL || 'http://localhost:8889';
// Replaces the device's geolocation with a fake that fails with the given error code(s).
const fakeGeo = codes => {
  window.__geoCalls = [];
  Object.defineProperty(navigator, 'geolocation', { value: { getCurrentPosition(ok, fail, opts) {
    window.__geoCalls.push(opts); const code = codes[Math.min(window.__geoCalls.length - 1, codes.length - 1)];
    setTimeout(() => fail({ code }), 50);
  } } });
  const query = navigator.permissions.query.bind(navigator.permissions);
  navigator.permissions.query = d => d.name === 'geolocation' ? Promise.resolve({ state: 'prompt' }) : query(d);
};
async function toLocationStep(page) {
  await page.goto(baseURL);
  await page.getByRole('heading', { name: 'Choose your language', exact: true }).waitFor();
  while (!(await page.getByRole('heading', { name: 'Exact prayer times', exact: true }).count())) {
    await page.locator('.mhs-ftue-next').click();
  }
}
(async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    // Location already allowed: the step fetches a real fix and names the nearest city.
    let ctx = await browser.newContext({ serviceWorkers: 'block', viewport: { width: 390, height: 844 }, permissions: ['geolocation'], geolocation: { latitude: 23.75, longitude: 90.39 } });
    let page = await ctx.newPage();
    await toLocationStep(page);
    await page.locator('.mhs-ftue-ok', { hasText: 'Dhaka' }).waitFor();
    assert.equal(await page.evaluate(() => MHSPrayer.config().src), 'gps');
    await ctx.close();

    // GPS switched off: a quick lookup, then one high-accuracy retry, then a clear message and a city fallback.
    ctx = await browser.newContext({ serviceWorkers: 'block', viewport: { width: 360, height: 640 } });
    page = await ctx.newPage();
    await page.addInitScript(fakeGeo, [2, 3]);
    await toLocationStep(page);
    await page.locator('.mhs-ftue-allow').click();
    await page.locator('.mhs-ftue-retry').waitFor();
    assert.match(await page.locator('.mhs-ftue-perm').innerText(), /Turn on your phone's location/);
    const calls = await page.evaluate(() => window.__geoCalls);
    assert.equal(calls.length, 2); assert.equal(calls[0].enableHighAccuracy, false); assert.equal(calls[1].enableHighAccuracy, true);
    await page.locator('.mhs-ftue-city').selectOption({ label: 'Chattogram' });
    await page.locator('.mhs-ftue-ok', { hasText: 'Chattogram' }).waitFor();
    assert.deepEqual(await page.evaluate(() => { const c = MHSPrayer.config(); return [c.src, c.place, c.on]; }), ['city', 'Chattogram', true]);
    assert.match(await page.locator('.mhs-ftue-next').getAttribute('class'), /primary/);
    await ctx.close();

    // Blocked permission: explains how to allow it (no dead end) and offers Try again + city.
    ctx = await browser.newContext({ serviceWorkers: 'block', viewport: { width: 390, height: 844 } });
    page = await ctx.newPage();
    await page.addInitScript(fakeGeo, [1]);
    await toLocationStep(page);
    await page.locator('.mhs-ftue-allow').click();
    await page.locator('.mhs-ftue-warn', { hasText: 'Location is blocked' }).waitFor();
    assert.equal(await page.locator('.mhs-ftue-retry').count(), 1);
    assert.equal(await page.locator('.mhs-ftue-city').count(), 1);
    assert.equal(await page.evaluate(() => window.__geoCalls.length), 1, 'no high-accuracy retry after a denial');
    await ctx.close();

    // Settings → Prayer times: a blocked permission shows the specific reason.
    ctx = await browser.newContext({ serviceWorkers: 'block', viewport: { width: 390, height: 844 } });
    page = await ctx.newPage();
    await page.addInitScript(fakeGeo, [1]);
    await page.addInitScript(() => {
      localStorage.setItem('mhs:ftue:v1', JSON.stringify({ firstRun: 1, intro: 1, tour: 1, tips: {} }));
      localStorage.setItem('muhasabah:data:v1', JSON.stringify({ lang: 'en', onboarded: true, habits: [], todos: [], ledger: [] }));
    });
    await page.goto(baseURL);
    await page.waitForFunction(() => window.MHSApp && window.MHSApp.nav);
    await page.evaluate(() => window.MHSApp.nav('settings'));
    await page.locator('mhs-prayer').first().waitFor({ state: 'attached' });
    await page.evaluate(() => document.querySelector('mhs-prayer').locate());
    await page.locator('mhs-prayer .mhs-status.warn', { hasText: 'Location is blocked' }).waitFor();
    await ctx.close();
    console.log('Onboarding location: allowed fix, GPS-off retry, city fallback, blocked guidance and Settings message passed');
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exit(1); });
