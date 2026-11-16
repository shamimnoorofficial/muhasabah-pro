/* Mini-app navigation bar: every reader app has the Seerah-style icon bar (Contents · Search ·
 * Bookmarks · Settings · Download) and each button does something; the Reminder feed mixes in
 * Duas & Ilm and its settings control which apps the feed draws from and how often. */
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch();
 try{
  const c=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block'});
  await c.route('**/api/**',r=>r.fulfill({status:503,json:{error:'offline'}}));
  await c.route('**/.netlify/functions/**',r=>r.fulfill({json:null}));
  await c.route('https://api.quran.com/**',r=>r.fulfill({status:503,body:''}));
  await c.addInitScript(()=>{localStorage.setItem('mhs:ftue:v1',JSON.stringify({intro:1,tour:1,tips:{}}));if(!localStorage.getItem('muhasabah:data:v1'))localStorage.setItem('muhasabah:data:v1',JSON.stringify({onboarded:true,lang:'en',habits:[],todos:[],ledger:[]}));});
  const p=await c.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
  await p.goto((process.env.BASE||'http://localhost:8889')+'/');
  await p.waitForFunction(()=>window.MHSActions&&window.MHS&&MHS.current()&&window.MHSReminder&&window.MHSKnowledge);
  const closeAll=()=>p.evaluate(()=>document.querySelectorAll('dialog[open]').forEach(d=>d.close()));
  const labels=id=>p.locator('#'+id+' .mhs-mini-tools > *').evaluateAll(n=>n.filter(b=>getComputedStyle(b).display!=='none').map(b=>b.getAttribute('aria-label')));
  const ORDER=['Contents','Search','Bookmarks','Settings','Download for offline'];
  for(const [key,id,search] of [['quran','mhs-quran','Search the Quran'],['hadith','mhs-hadith','Search hadith'],['duas','mhs-knowledge','Search'],['hikmah','mhs-wisdomapp','Search'],['wisdom','mhs-wisdom','Search']]){
   await p.evaluate(k=>MHSActions.items().find(x=>x.key===k).run(),key);
   await p.locator('#'+id+' [data-nav-item=offline]').waitFor();await p.waitForTimeout(200);
   const l=await labels(id);
   assert.deepEqual(l.slice(0,5).map(x=>x==='Feed settings'?'Settings':x===search?'Search':x),ORDER,id+': '+l.join(', '));
   const d=p.locator('#'+id);
   // Contents
   await d.getByRole('button',{name:'Contents',exact:true}).click();
   if(id==='mhs-quran'||id==='mhs-hadith')await d.locator('.mhs-mini-list, .mhs-q-sura, button').first().waitFor();
   else{const t=p.locator('#mhs-nav-contents');await t.waitFor();assert.ok(await t.locator('.mhs-nav-toc-row').count()>2,id+' contents rows');await t.locator('.mhs-nav-toc-row').nth(1).click();await t.waitFor({state:'detached'});}
   // Settings opens the reader settings (or the feed settings for the Reminder).
   await d.locator('[data-nav-item=settings]').click();
   if(id==='mhs-wisdom'){await d.locator('.mhs-feed-sources').waitFor();}
   else{await p.locator('#mhs-reader-settings').waitFor();await p.evaluate(()=>document.querySelector('#mhs-reader-settings').close());await p.locator('#mhs-reader-settings').waitFor({state:'detached'});}
   // Bookmarks
   await d.getByRole('button',{name:'Bookmarks',exact:true}).click();await p.waitForTimeout(300);
   if(id==='mhs-wisdom'){await p.locator('#mhs-bookmarks').waitFor();await p.evaluate(()=>document.querySelector('#mhs-bookmarks').close());}
   // Search
   await d.getByRole('button',{name:search,exact:true}).click();await p.waitForTimeout(400);
   const focusedSearch=await p.evaluate(()=>{const a=document.activeElement;return !!a&&a.tagName==='INPUT';});
   const searchDialog=await p.evaluate(()=>[...document.querySelectorAll('dialog[open]')].map(x=>x.id).join(','));
   assert.ok(focusedSearch||/search|qs|hs/i.test(searchDialog),id+' search: '+searchDialog);
   await closeAll();await p.waitForTimeout(300);
  }
  // Other mini-apps get the same bar with what applies to them.
  await p.evaluate(()=>MHSActions.items().find(x=>x.key==='notes').run());
  await p.locator('#mhs-notes [data-nav-item=toc]').waitFor();
  assert.deepEqual((await labels('mhs-notes')).slice(0,2),['Contents','Search']);
  await closeAll();await p.waitForTimeout(300);

  // Ayah numbers stay inside their circle, even for three digits.
  await p.evaluate(()=>MHSQuran.open({surah:2,ayah:120}));
  await p.locator('#mhs-quran #mhs-q-120 .n').waitFor();
  const fit=await p.locator('#mhs-quran .mhs-q-ayah .n').evaluateAll(ns=>ns.slice(95,130).every(n=>n.scrollWidth<=n.clientWidth+1&&n.scrollHeight<=n.clientHeight+1));
  assert.ok(fit,'ayah numbers overflow their circle');
  await closeAll();await p.waitForTimeout(300);

  // Feed: Duas & Ilm posts are part of the pool; per-app mix settings.
  await p.evaluate(()=>MHSReminder.open());await p.locator('#mhs-wisdom .mhs-rf-card').waitFor();
  await p.evaluate(()=>MHSReminder.load());
  assert.ok(await p.evaluate(()=>MHSReminder.pool().some(x=>x.kind==='dua')),'duas in the feed pool');
  if(!await p.locator('#mhs-wisdom .mhs-feed-sources').count())await p.locator('#mhs-wisdom [data-nav-item=settings]').click();
  const box=p.locator('#mhs-wisdom .mhs-feed-sources');await box.waitFor();
  assert.equal(await box.locator('.mhs-feed-src').count(),6);
  assert.equal(await box.locator('.mhs-feed-src[data-src=journal] input').isChecked(),false);
  await box.locator('.mhs-feed-src[data-src=dua] [data-level=more]').click();
  assert.equal(await p.evaluate(()=>MHSX.get('feedMix').level.dua),'more');
  // With only Duas & Ilm enabled, every post comes from it.
  for(const k of ['verse','hadith','quote','seerah'])await p.locator('#mhs-wisdom .mhs-feed-src[data-src='+k+'] input').uncheck();
  assert.ok(await p.evaluate(()=>Array.from({length:12},()=>MHSReminder.pick('all')).every(x=>x&&x.kind==='dua')));
  await p.locator('#mhs-wisdom .mhs-feed-mode [data-mode=random]').click();
  assert.equal(await p.evaluate(()=>MHSX.get('feedMix').mode),'random');
  assert.ok(await p.locator('#mhs-wisdom .mhs-feed-src[data-src=dua] [data-level=more]').isDisabled());
  assert.deepEqual(errors,[]);
  console.log('mini-nav: ok');
 } finally { await browser.close(); }
})().catch(e=>{console.error(e);process.exit(1);});
