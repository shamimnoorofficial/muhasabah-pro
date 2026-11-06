const assert = require('node:assert/strict');
const { chromium } = require('playwright');
(async () => {
 const browser = await chromium.launch({headless:true});
 try {
  for (const viewport of [{width:390,height:844},{width:1280,height:900}]) {
   const context = await browser.newContext({viewport, serviceWorkers:'block', timezoneId:'Asia/Dhaka'});
   const page = await context.newPage(); const errors=[]; page.on('pageerror', e=>errors.push(e.message));
   let prefs = null, fail = false;
   await page.route('**/.netlify/functions/preferences', async route => {
    if(route.request().method()==='PUT') {
     if(fail) return route.fulfill({status:503,json:{error:'unavailable'}});
     prefs=route.request().postDataJSON();
    }
    return route.fulfill({json:prefs});
   });
   await page.addInitScript(() => localStorage.setItem('muhasabah:data:v1',JSON.stringify({lang:'en', habits:[],ledger:[{id:'one',ts:Date.now(),delta:25,reason:'Reading',type:'manualReward'}]})));
   // Existing data: the first-run welcome screen and guide stay closed.
   await page.goto('http://localhost:8889'); await page.locator('#mhs-startup').waitFor({state:'detached'});
   assert.equal(await page.locator('.mhs-welcome, .mhs-ftue-intro, .mhs-coach').count(),0);
   await page.getByRole('button',{name:'∿ LINE',exact:true}).click();
   assert.equal(await page.locator('.mhs-flow circle').count(),1);
   await page.locator('.mhs-flow [role=button]').focus(); await page.keyboard.press('Enter');
   await page.getByText('Reading',{exact:true}).first().waitFor(); await page.keyboard.press('Escape');
   // Close the trade detail with its explicit close button if Escape is not handled.
   await page.evaluate(() => history.back()); await page.waitForTimeout(100);
   await page.getByRole('button',{name:'Settings',exact:true}).filter({visible:true}).last().click();
   await page.getByRole('heading',{name:'Settings',exact:true}).waitFor();
   await page.getByLabel('Theme',{exact:true}).selectOption('light'); await page.getByText('Saved',{exact:true}).waitFor();
   assert.equal(await page.locator('html').getAttribute('data-theme'),'light');
   await page.locator('.mhs-preferences .mhs-lp-btn').click(); await page.locator('.mhs-lp-search input').fill('bangla'); await page.keyboard.press('Enter'); await page.getByText('সংরক্ষিত',{exact:true}).waitFor();
   await page.getByRole('heading',{name:'সেটিংস',exact:true}).waitFor();
   assert.equal(prefs.language,'bn'); assert.equal(prefs.theme,'light');
   assert.equal(await page.locator('mhs-prayer').count(),1); assert.equal(await page.locator('mhs-remind').count(),1); assert.equal(await page.locator('mhs-backup').count(),1);
   fail=true; await page.getByLabel('থিম',{exact:true}).selectOption('dark'); await page.getByText('সংরক্ষণ করা যায়নি। আবার চেষ্টা করুন।',{exact:true}).waitFor(); fail=false;
   await page.getByRole('button',{name:'আবার চেষ্টা করুন',exact:true}).click(); await page.getByText('সংরক্ষিত',{exact:true}).waitFor();
   assert.equal(prefs.theme,'dark');
   assert.equal(errors.length,0,errors.join('\n'));
   await context.close();
  }
  console.log('Settings and flow: mobile/desktop, single point, keyboard inspect, languages, themes, controls and save retry passed');
 } finally { await browser.close(); }
})().catch(e=>{console.error(e);process.exitCode=1;});
