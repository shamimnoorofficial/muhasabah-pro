const assert = require('node:assert/strict');
const {chromium} = require('playwright');
(async()=>{
 const browser=await chromium.launch();
 try {
  for(const viewport of [{width:390,height:844},{width:1280,height:900}]) {
   const context=await browser.newContext({viewport,serviceWorkers:'block'});
   const page=await context.newPage(), errors=[]; page.setDefaultTimeout(10000);
   page.on('pageerror',e=>errors.push(e.message));
   let settings=null, rows=[], fail=false;
   await page.route('**/.netlify/functions/preferences',r=>r.fulfill({json:null}));
   await page.route('**/.netlify/functions/journal-settings',async r=>{
    if(fail) return r.fulfill({status:503,json:{error:'unavailable'}});
    if(r.request().method()==='PUT') settings=r.request().postDataJSON();
    await r.fulfill({json:settings});
   });
   await page.route('**/.netlify/functions/journal',async r=>{
    if(r.request().method()==='PUT') rows=r.request().postDataJSON();
    await r.fulfill({json:rows});
   });
   // An existing install: the first-run onboarding stays closed.
   await page.addInitScript(()=>{if(!localStorage.getItem('muhasabah:data:v1'))localStorage.setItem('muhasabah:data:v1',JSON.stringify({lang:'en',onboarded:true,habits:[],ledger:[]}));});
   await page.goto('http://localhost:8889');
   await page.locator('#mhs-startup').waitFor({state:'detached'});
   await page.getByRole('button',{name:'Settings',exact:true}).filter({visible:true}).last().click();
   await page.getByRole('button',{name:'Configure journal',exact:true}).click();
   const dialog=page.getByRole('dialog');
   await dialog.getByLabel('Text size',{exact:true}).selectOption('large');
   await page.waitForFunction(()=>true);
   await dialog.getByLabel('Week starts on',{exact:true}).selectOption('1');
   await dialog.getByLabel('Writing prompts',{exact:true}).selectOption('guided');
   await dialog.getByLabel('Daily word goal',{exact:true}).fill('100');
   await dialog.getByLabel('Daily word goal',{exact:true}).press('Tab');
   await page.waitForTimeout(250);
   assert.equal(settings.fontSize,'large');assert.equal(settings.weekStart,'1');assert.equal(settings.goal,100);
   await dialog.getByRole('button',{name:'Write',exact:true}).click();
   await dialog.getByRole('button',{name:'Insert reflection prompts',exact:true}).click();
   assert.match(await dialog.locator('textarea').inputValue(),/Gratitude/);
   assert.equal(await dialog.locator('textarea').evaluate(e=>e.style.fontSize),'23px');
   await dialog.locator('textarea').fill('A thoughtful day with gratitude.');
   await dialog.getByRole('button',{name:'Save now',exact:true}).click();
   await dialog.getByText('Saved to journal',{exact:true}).waitFor();
   await dialog.getByRole('button',{name:'Close',exact:true}).click();
   await page.getByRole('button',{name:'Configure journal',exact:true}).click();
   assert.equal(await dialog.getByLabel('Text size',{exact:true}).inputValue(),'large');
   fail=true;await dialog.getByLabel('Text size',{exact:true}).selectOption('small');
   await dialog.getByText('Could not sync — device copy kept. Tap Save now to retry.',{exact:true}).waitFor();
   fail=false; await dialog.getByRole('button',{name:'Retry',exact:true}).click();
   await page.waitForTimeout(200);assert.equal(settings.fontSize,'small');
   await dialog.getByRole('button',{name:'Calendar',exact:true}).click();
   assert.equal(await dialog.locator('.mhs-journal-weekday').first().textContent(),'Mon');
   await dialog.getByRole('button',{name:'Today',exact:true}).click();
   assert.equal(await dialog.locator('textarea').inputValue(),'A thoughtful day with gratitude.');
   await dialog.getByRole('button',{name:'Delete entry',exact:true}).click();
   await dialog.getByRole('button',{name:'Tap again to delete',exact:true}).click();
   await dialog.getByRole('button',{name:'Save now',exact:true}).click();
   await dialog.getByText('Saved to journal',{exact:true}).waitFor();
   assert.equal(rows[0].text,'');
   assert.equal(errors.length,0,errors.join('\n'));
   await context.close();
  }
  console.log('Journal: mobile/desktop configuration, persistence, prompts, writing, save status, retry, calendar and delete passed');
 } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
