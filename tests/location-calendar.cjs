const assert = require('node:assert/strict');
const {chromium} = require('playwright');
(async()=>{
 const browser=await chromium.launch();
 try{
 const ctx=await browser.newContext({viewport:{width:390,height:844},timezoneId:'UTC',serviceWorkers:'block'});
 await ctx.addInitScript(()=>{localStorage.setItem('muhasabah:data:v1',JSON.stringify({lang:'en',onboarded:true,habits:[],ledger:[]}));localStorage.setItem('mhs:ftue:v1',JSON.stringify({intro:1,tour:1,tips:{}}));});
 const page=await ctx.newPage(), errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(process.env.TEST_BASE_URL||'http://localhost:8889');await page.waitForFunction(()=>window.MHSLocation&&window.MHSPrayerCalendar);
 await page.evaluate(()=>{const host=document.createElement('div');host.id='picker-test';host.style.cssText='position:relative;z-index:9999;background:hsl(var(--background));width:350px';host.append(MHSLocation.create());document.body.prepend(host);});
 const p=page.locator('#picker-test');const field=name=>p.getByRole('combobox',{name,exact:true});
 await page.waitForFunction(()=>document.querySelector('#picker-test select').options.length===251);
 await field('Country / territory').selectOption('BD');await field('Division / state / province').selectOption('1');await field('District / county').selectOption('1');await field('Upazila / city / town').selectOption('1');
 assert.equal(await page.evaluate(()=>MHSPrayer.config().src),'','selection does not save before confirmation');
 await p.getByRole('button',{name:'Confirm location',exact:true}).click();
 let c=await page.evaluate(()=>MHSPrayer.config());assert.equal(c.src,'city');assert.equal(c.timeZone,'Asia/Dhaka');assert.match(c.place,/Debidwar/);assert.ok(c.lat>23&&c.lat<24);
 // Country changes invalidate the old place; all downstream fields reset.
 await field('Country / territory').selectOption('US');await field('Division / state / province').selectOption('1452');assert.equal(await field('District / county').inputValue(),'');assert.equal(await p.getByRole('button',{name:'Confirm location',exact:true}).isDisabled(),true);
 let searches=0;
 await ctx.route('https://nominatim.openstreetmap.org/**',async r=>{searches++;assert.match(r.request().url(),/countrycodes=us/);await r.fulfill({json:[{lat:'40.7128',lon:'-74.006',display_name:'Manhattan, New York, United States'}]});});
 await p.getByRole('searchbox',{name:'Area / neighbourhood',exact:true}).fill('Manhattan');assert.equal(searches,0);
 await p.getByRole('button',{name:'Search',exact:true}).click();await p.getByRole('button',{name:'Manhattan, New York, United States',exact:true}).click();await p.getByRole('button',{name:'Confirm location',exact:true}).click();assert.equal(searches,1);
 // Place time zone, date boundaries and daylight-saving transitions are independent of the device clock.
 const zone=await page.evaluate(()=>{
 MHSPrayer.setLocation({lat:40.7128,lng:-74.006,place:'New York',tz:'America/New_York'});
 return {date:MHSPrayer.civil(Date.parse('2026-11-17T02:00:00Z')),fmt:MHSTimes.fmt(Date.parse('2026-11-17T17:00:00Z')),a:MHSPrayer.dayStart(Date.parse('2026-11-01T16:00:00Z')),b:MHSPrayer.dayStart(Date.parse('2026-11-02T16:00:00Z')),one:MHSTimes.raw(Date.parse('2026-11-01T16:00:00Z')).fajr,two:MHSTimes.raw(MHSPrayer.shiftDay(Date.parse('2026-11-01T16:00:00Z'),1)).fajr};
 });assert.deepEqual(zone.date,{year:2026,month:11,day:16});assert.equal(zone.fmt,'12:00 PM');assert.equal(zone.b-zone.a,25*3600000);assert.ok(zone.two>zone.one+23*3600000);
 const cal=await page.evaluate(()=>{
 MHSPrayer.setLocation({lat:23.81,lng:90.41,place:'Dhaka',tz:'Asia/Dhaka'});
 const ts=Date.parse('2026-03-20T06:00:00Z'),raw=MHSPrayer.day(ts),before=MHSPrayerCalendar.info(raw.sunset-1000),after=MHSPrayerCalendar.info(raw.sunset+1000),normal=MHSPrayerCalendar.info(ts);MHSTimes.setCfg({hijriAdjust:1});const adjusted=MHSPrayerCalendar.info(ts);MHSTimes.setCfg({hijriAdjust:0});return {before,after,normal,adjusted};
 });assert.equal(cal.normal.month,10);assert.equal(cal.normal.day,1);assert.ok(cal.normal.events.includes('fitr'));assert.equal(cal.after.day,cal.before.day+1);assert.equal(cal.adjusted.day,cal.normal.day+1);
 assert.equal(await page.evaluate(()=>MHSPrayer.setLocation({lat:91,lng:0})),false);
 await p.locator('summary').click();const lat=p.getByRole('spinbutton',{name:'Latitude (−90 to 90)',exact:true}),lng=p.getByRole('spinbutton',{name:'Longitude (−180 to 180)',exact:true});await lat.fill('91');await lng.fill('20');assert.equal(await p.getByRole('button',{name:'Confirm location',exact:true}).isDisabled(),true);await lat.fill('0');await lng.fill('0');assert.equal(await p.getByRole('button',{name:'Confirm location',exact:true}).isEnabled(),true);
 assert.deepEqual(errors,[]);
 await ctx.close();console.log('Location hierarchy, explicit area search, coordinate validation, time zones, DST, Hijri events and sunset rollover passed');
 } finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
