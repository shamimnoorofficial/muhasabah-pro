/* Donate pill + sheet: preview mode (no Stripe keys) and a stubbed live Stripe flow. */
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const base = process.env.TEST_BASE_URL || 'http://localhost:8889';
const STUB = `window.Stripe=function(pk){return{elements:function(){return{create:function(type){var h={};return{mount:function(sel){var d=document.querySelector(sel);d.innerHTML='<input data-stub="'+type+'">';d.firstChild.addEventListener('input',function(){h.change&&h.change({complete:true})});},on:function(e,f){h[e]=f},destroy:function(){}}}}},confirmCardPayment:function(cs){window.__confirmed=cs;return Promise.resolve({paymentIntent:{status:'succeeded'}})}}}`;
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ serviceWorkers: 'block', viewport: { width: 390, height: 844 } });
  const p = await ctx.newPage(); const errs = [];
  p.on('pageerror', e => errs.push(e.message));
  await p.addInitScript(() => { if (!localStorage.getItem('muhasabah:data:v1')) localStorage.setItem('muhasabah:data:v1', JSON.stringify({ lang: 'en', onboarded: true, habits: [], ledger: [] })); });
  await p.goto(base + '/?tab=dashboard'); await p.locator('#mhs-startup').waitFor({ state: 'detached' });
  const c = p.getByRole('button', { name: 'Continue', exact: true }); await c.waitFor({ timeout: 4000 }).catch(() => {}); if (await c.count()) await c.click();
  const pill = p.locator('#mhs-donate-pill'); await pill.waitFor();
  assert.match(await pill.innerText(), /Donate for\s+Muhasabah/);
  await p.waitForTimeout(900); await p.screenshot({ path: '/tmp/dn-pill.png' });
  await pill.click(); await p.getByRole('dialog', { name: 'Support Muhasabah' }).waitFor();
  assert.ok(await p.locator('.mhs-dn-go').isDisabled(), 'preview button disabled');
  await p.getByRole('button', { name: 'Other' }).click(); await p.locator('input[name=custom]').fill('7');
  await p.waitForTimeout(400); await p.locator('.mhs-dn-sheet').evaluate(s => s.scrollTop = 0); await p.screenshot({ path: '/tmp/dn-preview.png' }); await p.locator('.mhs-dn-sheet').evaluate(s => s.scrollTop = 9999); await p.screenshot({ path: '/tmp/dn-preview2.png' });
  await p.keyboard.press('Escape'); await p.waitForTimeout(300);
  assert.equal(await p.locator('.mhs-dn-sheet.show').count(), 0, 'Escape closes');

  // Live mode with Stripe stubbed
  let posted = null;
  await p.route('**/api/donate', r => r.request().method() === 'GET'
    ? r.fulfill({ json: { enabled: true, publishableKey: 'pk_test_x', currency: 'usd', presets: [5, 10, 25, 50, 100], min: 1, max: 10000 } })
    : (posted = r.request().postDataJSON(), r.fulfill({ json: { clientSecret: 'pi_123_secret_abc' } })));
  await p.route('https://js.stripe.com/v3/', r => r.fulfill({ contentType: 'application/javascript', body: STUB }));
  await p.reload(); await p.locator('#mhs-startup').waitFor({ state: 'detached' });
  { const c2 = p.getByRole('button', { name: 'Continue', exact: true }); await c2.waitFor({ timeout: 3000 }).catch(() => {}); if (await c2.count()) await c2.click(); }
  await p.locator('#mhs-donate-pill').click();
  await p.locator('[data-stub=cardNumber]').waitFor();
  await p.getByRole('button', { name: '$25' }).click();
  assert.match(await p.locator('.mhs-dn-go').innerText(), /Donate \$25/);
  await p.locator('.mhs-dn-go').click(); assert.match(await p.locator('.mhs-dn-msg').innerText(), /name/);
  await p.fill('input[name=name]', 'Abdullah'); await p.fill('input[name=email]', 'a@example.com');
  for (const k of ['cardNumber', 'cardExpiry', 'cardCvc']) await p.locator(`[data-stub=${k}]`).fill('1');
  await p.screenshot({ path: '/tmp/dn-live.png' });
  await p.locator('.mhs-dn-go').click();
  await p.getByText('JazakAllahu khayran!').waitFor();
  assert.deepEqual({ a: posted.amount, n: posted.name }, { a: 25, n: 'Abdullah' });
  assert.equal(await p.evaluate(() => window.__confirmed), 'pi_123_secret_abc');
  await p.screenshot({ path: '/tmp/dn-thanks.png' });
  await p.getByRole('button', { name: 'Close', exact: true }).first().click();

  // Bengali
  await p.evaluate(() => { document.documentElement.lang = 'bn'; }); await p.waitForTimeout(100);
  assert.match(await p.locator('#mhs-donate-pill').innerText(), /দান করুন/);
  assert.deepEqual(errs, []);
  console.log('donate ok'); await b.close();
})().catch(e => { console.error(e); process.exit(1); });
