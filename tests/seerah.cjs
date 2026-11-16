const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch();
 try {
 const c=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block'});
 await c.route('**/api/**',r=>r.fulfill({status:503,json:{error:'offline'}}));
 await c.route('**/.netlify/functions/**',r=>r.fulfill({json:null}));
 const chapters=[{title:'Arab Tribes',level:1,page:0,index:0},{title:'The Battle of Badr',level:1,page:1,index:0},{title:'Reaction in Makkah',level:2,page:2,index:0}];
 const pages=['# Arab Tribes\n\nThe Arabs lived in the peninsula for many centuries before Islam, and their tribes were many and proud of their lineage and history.','# The Battle of Badr\n\nThe Prophet ﷺ consulted his Companions before the battle, and Abu Bakr (RA) spoke first with words of loyalty and resolve.','## Reaction in Makkah\n\nThe news of the victory reached Makkah and shook the leaders of Quraish, who could not believe what they heard from the riders.'];
 const meta={version:'english-issam-diab-v2',title:'Ar-Raheeq Al-Makhtum',author:'Safiur Rahman al-Mubarakpuri',translator:'Issam Diab',publisher:'Dar-us-Salam',source:'https://archive.org/details/en_The_Sealed_Nectar',pdf:'https://archive.org/download/en_The_Sealed_Nectar/en_The_Sealed_Nectar.pdf',chapters};
 const bn=p=>'# বদরের যুদ্ধ\n\nবদরের যুদ্ধের আগে নবী ﷺ সাহাবিদের সঙ্গে পরামর্শ করলেন, এবং আবু বকর (রা.) প্রথমে আনুগত্য ও দৃঢ়তার কথা বললেন। পৃষ্ঠা '+p+'।';
 let posts=0;
 await c.route('**/api/seerah**',r=>{const u=new URL(r.request().url()),v=u.searchParams.get('view'),lang=u.searchParams.get('lang')||'en',page=Number(u.searchParams.get('page'));
  if(r.request().method()==='POST'){posts++;const b=r.request().postDataJSON();return r.fulfill({json:{text:bn(b.page),lang:b.lang,page:b.page,machineTranslated:true}});}
  if(v==='meta')return r.fulfill({json:Object.assign({count:pages.length},meta)});
  if(v==='toc')return r.fulfill({json:{lang,titles:lang==='bn'?['আরব গোত্রসমূহ','বদরের যুদ্ধ','মক্কার প্রতিক্রিয়া']:chapters.map(x=>x.title)}});
  if(v==='featured')return r.fulfill({json:{lang,items:lang==='bn'?[{text:bn(1),lang:'bn',page:1,machineTranslated:true}]:[]}});
  if(v==='page')return lang==='en'?r.fulfill({json:{text:pages[page],lang:'en',page,machineTranslated:false}}):r.fulfill({status:404,json:{error:'not_translated'}});
  return r.fulfill({json:Object.assign({pages},meta)});});
 await c.addInitScript(()=>{localStorage.setItem('mhs:ftue:v1',JSON.stringify({intro:1,tour:1,tips:{}}));if(!localStorage.getItem('muhasabah:data:v1'))localStorage.setItem('muhasabah:data:v1',JSON.stringify({onboarded:true,lang:'en',habits:[],todos:[],ledger:[]}));});
 const p=await c.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.goto((process.env.BASE||'http://localhost:8889')+'/');
 await p.waitForFunction(()=>window.MHSSeerah&&window.MHS&&MHS.current());
 // English reader: short title, chapter headings, honorific, contents jump.
 await p.evaluate(()=>MHSSeerah.open({page:0}));
 const d=p.locator('#mhs-seerah');
 await d.locator('.mhs-sr-chapter',{hasText:'Arab Tribes'}).waitFor();
 assert.equal(await d.locator('.mhs-mini-head .ttl').textContent(),'Seerah');
 await d.getByRole('button',{name:'Contents',exact:true}).click();
 await d.locator('.mhs-sr-entry.lv2',{hasText:'Reaction in Makkah'}).click();
 await d.locator('.mhs-sr-section',{hasText:'Reaction in Makkah'}).waitFor();
 assert.match(await d.locator('.mhs-sr-where').textContent(),/Page 3 \/ 3/);
 // Back from contents returns to the page; at the top level, back closes the reader.
 await d.getByRole('button',{name:'Contents',exact:true}).click();
 await d.locator('.mhs-mini-back').click();
 await d.locator('.mhs-sr-section').waitFor();
 // Previous page button.
 await d.getByRole('button',{name:'Previous page',exact:true}).click();
 await d.locator('.mhs-sr-chapter',{hasText:'The Battle of Badr'}).waitFor();
 assert.match(await d.locator('.mhs-sr-text').innerText(),/Prophet ﷺ consulted/);
 assert.doesNotMatch(await d.locator('.mhs-sr-text').innerText(),/pbuh/i);
 // Search jumps to the page with the match highlighted.
 await d.getByRole('button',{name:'Search the book',exact:true}).click();
 await d.getByRole('searchbox').fill('Quraish');await d.getByRole('button',{name:'Search',exact:true}).click();
 await d.locator('.mhs-sr-row').first().click();
 await d.locator('.mhs-sr-text mark',{hasText:'Quraish'}).waitFor();
 await d.locator('.mhs-mini-back').click();
 await d.waitFor({state:'detached'});
 // Bengali app: the reader and the feed use Bengali only.
 await p.evaluate(()=>{MHSX.set('seerahLang','bn');MHSSeerah.open({page:1});});
 await p.locator('#mhs-seerah .mhs-sr-chapter',{hasText:'বদরের যুদ্ধ'}).waitFor();
 assert.match(await p.locator('#mhs-seerah .mhs-sr-label').innerText(),/Machine translation/);
 assert.ok(await p.evaluate(()=>MHSSeerah.feedItems('bn').every(x=>x.lang==='bn'&&/[ঀ-৿]/.test(x.text)&&!/^#/.test(x.text))));
 assert.equal(await p.evaluate(()=>MHSSeerah.feedItems('en').some(x=>/[ঀ-৿]/.test(x.text))),false);
 // Bookmark into a new collection.
 await p.locator('#mhs-seerah .mhs-sr-mark').click();
 const pick=p.locator('#mhs-collection-picker');await pick.waitFor();
 await pick.getByRole('textbox').fill('Battles');await pick.getByRole('button',{name:/Create/}).click();
 await pick.getByRole('button',{name:'Save',exact:true}).click();
 assert.ok(await p.evaluate(()=>MHSCollections.collect().some(i=>i.kind==='seerah'&&i.collection==='Battles'&&i.page===1)));
 assert.deepEqual(errors,[]);
 console.log('Seerah browser: short title, contents jump, back, search, honorifics, Bengali reader and feed, collections passed');
 } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
