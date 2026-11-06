const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const base = process.env.TEST_BASE_URL || 'http://localhost:8889';
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ serviceWorkers: 'block', viewport:{width:390,height:844} });
  const p = await ctx.newPage(); const errs=[];
  p.on('pageerror', e=>errs.push(e.message)); p.on('console', m=>{ if(m.type()==='error' && !/preferences|journal|404|Failed to load/.test(m.text())) errs.push('console:'+m.text())});
  const now=Date.now(), D=86400000;
  await p.addInitScript(([now,D])=>{ if(sessionStorage.getItem('seeded')) return; sessionStorage.setItem('seeded',1);
    const habits=[{id:'h1',title:'Fajr',points:10,repeat:["Mon","Tue","Wed","Thu","Fri","Sat","Sun"],status:'active',icon:'🌅',createdAt:now-20*D},{id:'h2',title:'Quran',points:15,repeat:["Mon","Tue","Wed","Thu","Fri","Sat","Sun"],status:'active',icon:'📖',createdAt:now-20*D, deadline:'23:59'}];
    const ledger=[]; for(let i=1;i<=6;i++){ledger.push({id:'a'+i,ts:now-i*D,delta:10,reason:'Fajr',type:'checkIn',habitId:'h1'}); if(i%2) ledger.push({id:'b'+i,ts:now-i*D,delta:-15,reason:'Quran',type:'penalty'});}
    localStorage.setItem('muhasabah:data:v1', JSON.stringify({lang:'en',onboarded:true,habits,ledger}));},[now,D]);
  const t0=Date.now(); await p.goto(base); await p.locator('#mhs-startup').waitFor({state:'detached'}); console.log('open ms',Date.now()-t0);
  const cont=p.getByRole('button',{name:'Continue',exact:true}); await cont.waitFor({timeout:5000}).catch(()=>{}); if(await cont.count()) await cont.click(); await p.waitForTimeout(500);
  await p.goto(base+'/?tab=dashboard'); { const c=p.getByRole('button',{name:'Continue',exact:true}); await c.waitFor({timeout:4000}).catch(()=>{}); if(await c.count()) await c.click(); } await p.locator('mhs-insights .mhs-insights').waitFor();
  await p.waitForTimeout(1200);
  console.log(await p.locator('mhs-insights .mhs-ins-tiles').innerText());
  
  await p.getByRole('tab',{name:'30 days'}).click(); console.log('30d selected', await p.getByRole('tab',{name:'30 days'}).getAttribute('aria-selected'));
  await p.goto(base+'/?tab=today'); { const c=p.getByRole('button',{name:'Continue',exact:true}); await c.waitFor({timeout:4000}).catch(()=>{}); if(await c.count()) await c.click(); } await p.waitForTimeout(800);
  const done=p.getByRole('button',{name:/done/i}).first(); console.log('done buttons', await p.getByRole('button',{name:/done/i}).count());
  if(await done.count()){ await done.click(); await p.waitForTimeout(500); console.log('canvas', await p.locator('.mhs-confetti').count()); await p.waitForTimeout(400); console.log('banner', await p.locator('#mhs-celebrate.show').count() ? await p.locator('#mhs-celebrate').innerText() : 'none'); }
  assert.equal(errs.length, 0, errs.join('\n')); assert.equal(await p.locator('#mhs-celebrate').innerText().then(t=>t.includes('7-day streak')), true); console.log('Insights and celebrations passed');
  await b.close();
})();
