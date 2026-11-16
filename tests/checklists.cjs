/* Keep-style checklists, mini-app back button, five Quran scripts, Account Book / Widget names. */
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch();
 try {
 const c=await browser.newContext({viewport:{width:360,height:780},serviceWorkers:'block'});
 await c.route('**/.netlify/functions/**',r=>r.fulfill({json:null}));
 await c.route('https://api.quran.com/**',r=>{const u=new URL(r.request().url()),kind=u.pathname.split('/').pop(),f={indopak:'text_indopak',uthmani_tajweed:'text_uthmani_tajweed',imlaei:'text_imlaei'}[kind];
  r.fulfill({json:{verses:[1,2,3,4].map(a=>({verse_key:'112:'+a,[f]:kind==='uthmani_tajweed'?'قُلْ <tajweed class=ghunnah>نّ</tajweed>َ TAJ-'+a+' <span class=end>'+a+'</span>':kind.toUpperCase()+'-'+a}))}});});
 await c.addInitScript(()=>{localStorage.setItem('mhs:ftue:v1',JSON.stringify({intro:1,tour:1,tips:{}}));if(!localStorage.getItem('muhasabah:data:v1'))localStorage.setItem('muhasabah:data:v1',JSON.stringify({onboarded:true,lang:'en',habits:[],todos:[],ledger:[]}));});
 const p=await c.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.goto((process.env.BASE||'http://localhost:8889')+'/');
 await p.waitForFunction(()=>window.MHSChecklists&&window.MHS&&MHS.current()&&window.MHSApp);
 // Create a checklist from the + menu: Enter adds the next row, "Add list" saves it.
 await p.evaluate(()=>MHSQuickTodo('list'));
 const q=p.locator('#mhs-quick-todo');await q.waitFor();
 await q.getByLabel('List title').fill('Groceries');await q.getByLabel('List title').press('Enter');
 for(const item of ['Dates','Milk','Honey']){await p.keyboard.type(item);await p.keyboard.press('Enter');}
 assert.equal(await q.locator('.mhs-cl-row-in').count(),4,'Enter creates the next row');
 await q.getByRole('button',{name:/Add list/}).click();
 await q.waitFor({state:'detached'});
 const list=await p.evaluate(()=>MHSChecklists.list()[0]);
 assert.equal(list.title,'Groceries');assert.deepEqual(list.items.map(i=>i.text),['Dates','Milk','Honey']);
 // The To-Do tab shows the list; ticking moves an item down, unticking returns it to its place.
 await p.evaluate(()=>MHSApp.nav('today'));
 await p.locator('.mhs-cl-card',{hasText:'Groceries'}).waitFor();
 await p.locator('.mhs-cl-card',{hasText:'Groceries'}).click();
 const s=p.locator('#mhs-checklist');await s.waitFor();
 await s.locator('.mhs-cl-item',{has:p.locator('input[value="Dates"]')}).locator('.mhs-cl-check').click();
 await p.waitForFunction(()=>document.querySelectorAll('#mhs-checklist .mhs-cl-list.is-done .mhs-cl-item').length===1);
 assert.deepEqual(await s.locator('.mhs-cl-list:not(.is-done) .mhs-cl-text').evaluateAll(n=>n.map(x=>x.value)),['Milk','Honey']);
 await s.locator('.mhs-cl-list.is-done .mhs-cl-check').click();
 await p.waitForFunction(()=>document.querySelectorAll('#mhs-checklist .mhs-cl-list:not(.is-done) .mhs-cl-item').length===3);
 assert.deepEqual(await s.locator('.mhs-cl-list:not(.is-done) .mhs-cl-text').evaluateAll(n=>n.map(x=>x.value)),['Dates','Milk','Honey'],'unticked item returns to its original place');
 await s.locator('.mhs-cl-add-in').fill('Bread');await s.locator('.mhs-cl-add-in').press('Enter');
 await p.waitForFunction(()=>MHSChecklists.list()[0].items.length===4);
 await s.getByRole('button',{name:'Close',exact:true}).click();
 // Back button: visible on every mini app; at the top level it closes the mini app.
 await p.evaluate(()=>MHSQuran.open());
 const qd=p.locator('#mhs-quran');await qd.waitFor();
 assert.ok(await qd.locator('.mhs-mini-back').isVisible());
 await qd.locator('.mhs-mini-back').click();await qd.waitFor({state:'detached'});
 // Five Quran scripts, each with its own text and font.
 await p.evaluate(()=>MHSQuran.open({surah:112}));await qd.locator('.mhs-q-ayah').first().waitFor({timeout:20000});
 const ar=()=>qd.locator('.mhs-q-ayah .ar').first();
 const want={uthmani:[/قُلْ/,/Uthmanic Hafs/],indopak:[/INDOPAK-1/,/IndoPak Nastaleeq/],tajweed:[/TAJ-1/,/Uthmanic Hafs/],naskh:[/قُلْ/,/Amiri Quran/],imlaei:[/IMLAEI-1/,/Scheherazade New/]};
 for(const k of Object.keys(want)){
  await p.evaluate(k=>MHSRasm.set(k),k);
  await p.waitForFunction(([k,re])=>{const a=document.querySelector('#mhs-quran .mhs-q-ayah .ar');return a&&new RegExp(re).test(a.textContent)&&document.querySelector('#mhs-quran .mhs-q-ayah').dataset.rasm===k;},[k,want[k][0].source]);
  assert.match(await ar().evaluate(n=>getComputedStyle(n).fontFamily),want[k][1],k+' font');
 }
 await p.evaluate(()=>MHSRasm.set('tajweed'));await qd.locator('.mhs-q-ayah .tj-ghunnah').first().waitFor();
 assert.equal(await qd.locator('.mhs-q-ayah .ar').first().evaluate(n=>n.innerHTML.includes('<tajweed')),false,'tajweed markup is rendered as spans, never as raw HTML');
 assert.equal(await qd.locator('.mhs-q-ayah .ar .n').count()>0,true,'ayah number is kept');
 await qd.locator('[data-reader-settings]').click();
 assert.equal(await p.locator('.mhs-rasm-opt').count(),5);
 await p.keyboard.press('Escape');
 await qd.getByRole('button',{name:'Close',exact:true}).click();
 // Names in English.
 const labels=await p.evaluate(()=>MHSActions.items().map(i=>i.label));
 assert.ok(labels.includes('Account Book')&&!labels.some(l=>/Hisab/.test(l)));
 assert.ok(labels.includes('Widget')&&!labels.includes('Widget Wizard'));
 assert.deepEqual(errors,[]);
 console.log('Checklists (Enter to add, tick to bottom, untick in order), back button, five Quran scripts and English names passed');
 } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
