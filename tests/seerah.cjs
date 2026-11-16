const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch();
 try {
 const c=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block'});
 await c.route('**/api/**',r=>r.fulfill({status:503,json:{error:'offline'}}));
 await c.route('**/.netlify/functions/**',r=>r.fulfill({json:null}));
 const edition={version:'english-issam-diab-v1',title:'The Sealed Nectar',author:'Safiur Rahman al-Mubarakpuri',translator:'Issam Diab',publisher:'Dar-us-Salam',source:'https://archive.org/details/en_The_Sealed_Nectar',pdf:'https://archive.org/download/en_The_Sealed_Nectar/en_The_Sealed_Nectar.pdf',pages:['First test passage.','Second test passage.','Third test passage.']};
 await c.route('**/api/seerah',r=>r.request().method()==='GET'?r.fulfill({json:edition}):r.fulfill({json:{text:'দ্বিতীয় পরীক্ষামূলক পাঠ।',lang:'bn',page:r.request().postDataJSON().page,machineTranslated:true}}));
 await c.addInitScript(()=>{localStorage.setItem('mhs:ftue:v1',JSON.stringify({intro:1,tour:1,tips:{}}));if(!localStorage.getItem('muhasabah:data:v1'))localStorage.setItem('muhasabah:data:v1',JSON.stringify({onboarded:true,lang:'en',habits:[],todos:[],ledger:[]}));});
 const p=await c.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.goto((process.env.BASE||'http://localhost:8889')+'/');
 await p.waitForFunction(()=>window.MHSSeerah&&window.MHS&&MHS.current());
 await p.evaluate(()=>MHSSeerah.open({page:1}));
 await p.getByText('Second test passage.',{exact:true}).waitFor();
 assert.equal(await p.locator('#mhs-seerah a').first().getAttribute('href'),edition.source);
 await p.locator('#mhs-seerah [data-reader-settings]').click();
 assert.equal(await p.locator('#mhs-reader-settings select[aria-label="Reading language"] option').count(),await p.evaluate(()=>MHSI18n.codes.length));
 await p.locator('#mhs-reader-settings select[aria-label="Reading language"]').selectOption('bn');
 await p.evaluate(()=>document.querySelector('#mhs-reader-settings').close());
 await p.getByText('দ্বিতীয় পরীক্ষামূলক পাঠ।',{exact:true}).waitFor();
 assert.match(await p.locator('#mhs-seerah p[role=status]').innerText(),/Machine translation/);
 await p.locator('#mhs-seerah details summary').click();
 await p.getByText('Second test passage.',{exact:true}).waitFor();
 assert.ok(await p.evaluate(()=>MHSSeerah.posts().some(p=>p.id==='s:1')));
 await p.locator('#mhs-seerah [data-offline]').click();
 await p.locator('#mhs-offline-download').getByRole('button',{name:'Download original English',exact:true}).click();
 await p.getByText('Downloaded for offline reading on this device.',{exact:true}).waitFor();
 await p.evaluate(()=>document.querySelector('#mhs-offline-download').close());
 await p.waitForTimeout(300);
 await c.setOffline(true);
 await p.evaluate(()=>MHSSeerah.open({page:1}));
 await p.getByText('দ্বিতীয় পরীক্ষামূলক পাঠ।',{exact:true}).waitFor();
 assert.deepEqual(errors,[]);
 console.log('Seerah browser: online edition, language list, labelled translation, original comparison, feed and offline reading passed');
 } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
