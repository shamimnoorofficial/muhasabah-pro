const {chromium}=require('playwright');const assert=require('node:assert/strict');
(async()=>{const b=await chromium.launch();try{
for(const [w,h] of [[160,160],[250,300],[360,640],[820,1180]]){
 const c=await b.newContext({viewport:{width:w,height:h},serviceWorkers:'block'});
 await c.addInitScript(()=>{localStorage.setItem('mhs:widgetcfg',JSON.stringify({items:['hijri','checklist','streak','zikr'],fields:{},size:'regular',theme:'dark',lang:'bn',order:[]}));
  localStorage.setItem('muhasabah:data:v1',JSON.stringify({onboarded:true,lang:'bn',habits:[],todos:[],ledger:[],x:{checklists:[{id:'l1',title:'বাজারের একটি অনেক লম্বা তালিকার নাম যা ভাঙবে না',items:[{id:'a',text:'খেজুর',done:false,at:1},{id:'b',text:'দুধ',done:true,at:2,doneAt:3}],at:1}]}}));});
 const p=await c.newPage(),errs=[];p.on('pageerror',e=>errs.push(e.message));
 await p.goto((process.env.BASE||'http://localhost:8889')+'/widgets/?view=custom');
 await p.locator('.wg-cl .wg-row').first().waitFor();
 assert.match(await p.locator('.wg-date').innerText(),/\S/);
 const over=await p.evaluate(()=>document.documentElement.scrollWidth-innerWidth);
 console.log(w,h,'overflow',over,'cl',await p.locator('.wg-cl-head').innerText().then(s=>s.replace(/\n/g,' ')),errs);
 assert.ok(over<=1);
 await p.locator('.wg-cl .wg-row button, .wg-cl .wg-row [role=checkbox], .wg-cl .wg-row input').first().click();
 await p.waitForFunction(()=>!document.querySelector('.wg-cl .wg-row'));
 await c.close();}
console.log('widget ok');}finally{await b.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
