const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch();
 try{
  for(const lang of ['en','bn','ar']){
   const context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true,serviceWorkers:'block'});
   await context.route('**/api/**',r=>r.fulfill({status:503,json:{error:'offline'}}));
   await context.route('**/.netlify/functions/**',r=>r.fulfill({json:null}));
   await context.addInitScript(lang=>{
    localStorage.setItem('mhs:ftue:v1',JSON.stringify({intro:1,tour:1,tips:{}}));
    localStorage.setItem('muhasabah:data:v1',JSON.stringify({onboarded:true,lang,habits:[],todos:[],ledger:[]}));
   },lang);
   const page=await context.newPage(),errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   await page.goto((process.env.BASE||'http://localhost:8889')+'/');
   const card=page.locator('.mhs-rf-card'),content=page.locator('.mhs-story-content');
   await card.waitFor();await content.evaluate(n=>n.scrollIntoView({block:"center"}));
   await page.waitForFunction(()=>{const c=document.querySelector('.mhs-rf-card');return c&&c.offsetHeight>=620;},null,{timeout:5000}).catch(()=>{});
   const height=await card.evaluate(n=>n.offsetHeight);
   assert(height>=620,'Card should be larger at this viewport');
   const cdp=await context.newCDPSession(page);
   async function swipe(dx,dy=0,cancel=false){
    await content.evaluate(n=>n.scrollIntoView({block:"center"}));await page.waitForTimeout(350);
    const before=await page.locator('.mhs-rf-text').innerText();
    const r=await content.boundingBox(),x=r.x+r.width/2,y=Math.max(120,r.y+85);
    await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});
    for(let step=1;step<=5;step++)await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x+dx*step/5,y:y+dy*step/5}]});
    await cdp.send('Input.dispatchTouchEvent',{type:cancel?'touchCancel':'touchEnd',touchPoints:[]});
    await page.waitForTimeout(350);
    return before;
   }
   const next=lang==='ar'?95:-95;
   assert.equal(await page.locator('.mhs-story-hint').count(),0,'Swipe hint is gone');
   const original=await swipe(next);
   assert.equal(await page.locator('.mhs-rf-text').innerText(),original,'Horizontal swipe no longer changes the post');
   assert.equal(await page.locator('.mhs-story-prev').isDisabled(),true);
   await page.locator('.mhs-story-next').click();await page.waitForTimeout(350);
   assert.equal(await page.locator('.mhs-story-prev').isDisabled(),false,'Next button advances');
   await page.locator('.mhs-story-prev').click();await page.waitForTimeout(350);
   assert.equal(await page.locator('.mhs-rf-text').innerText(),original,'Previous button restores the post');
   async function pageScrollsOverCard(label){
    await page.evaluate(()=>window.scrollTo(0,0));await page.waitForTimeout(150);
    const r=await card.boundingBox(),vh=page.viewportSize().height,x=r.x+r.width/2,y=Math.min(vh-120,Math.max(r.y+40,vh*.6));
    const before=await page.evaluate(()=>window.scrollY);
    await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});
    for(let step=1;step<=8;step++)await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x,y:y-220*step/8}]});
    await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
    await page.waitForTimeout(500);
    assert(await page.evaluate(()=>window.scrollY)>before,'Vertical swipe over the feed card scrolls the page ('+label+')');
    assert.equal(await content.evaluate(n=>n.scrollTop),0,'Feed card has no nested scroll area ('+label+')');
   }
   await pageScrollsOverCard('short post');
   await content.evaluate(n=>{n.querySelector('.mhs-rf-text').textContent='A long reflection. '.repeat(700);});
   await page.waitForTimeout(100);
   assert(await card.evaluate(n=>n.offsetHeight)>height,'Long posts grow the card instead of scrolling inside it');
   await pageScrollsOverCard('long post');
   assert.deepEqual(errors,[]);
   await context.close();
  }
  console.log('Feed touch: larger card, no swipe navigation, previous/next buttons and page scrolling over the card passed');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
