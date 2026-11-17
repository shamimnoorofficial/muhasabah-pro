/* Shared geographic picker. Reference lists are static, lazy-loaded by country.
 * Nominatim is queried only on explicit submission, never autocomplete. */
(function () {
  'use strict';
  const copy = {
    en: { sources:'Sources / licenses', zone:'Time zone', refine:'Showing the first 250 matches. Type more letters to narrow the list.', country:'Country / territory', region:'Division / state / province', district:'District / county', city:'Upazila / city / town', area:'Area / neighbourhood', search:'Search', choose:'Choose…', any:'Skip / not listed', filter:'Type to filter', loading:'Loading locations…', error:'Could not load locations. Check your connection and try again.', empty:'No matching places. Try another spelling or search an area below.', hint:'Choose the smallest available place, then confirm its coordinates. Lists vary by country. Search an area if it is missing.', privacy:'Area search sends your search terms to OpenStreetMap Nominatim. Saved prayer times work offline.', use:'Confirm location', saved:'Location saved', gps:'Use live device location', busy:'Getting your location…', denied:'Location is blocked. Allow Location in browser/site and phone settings, then try again.', unavailable:'No position found. Turn on device Location / GPS and try again, or choose a place.', unsupported:'Live location needs HTTPS and a supported browser. Choose a place instead.', retry:'Retry loading', coords:'Coordinates', approximate:'Place centre — use GPS for a more precise position.', accuracy:'GPS accuracy: ±', metres:'metres', manual:'Enter exact coordinates', lat:'Latitude (−90 to 90)', lng:'Longitude (−180 to 180)', invalid:'Enter valid latitude and longitude.', attribution:'Place data: CSC Database · Bangladesh Geocode. Area search: © OpenStreetMap contributors.', result:'Select a search result', required:'Choose a country first.' },
    bn: { sources:'তথ্যসূত্র / লাইসেন্স', zone:'টাইমজোন', refine:'প্রথম ২৫০টি মিল দেখানো হচ্ছে। তালিকা ছোট করতে আরও অক্ষর লিখুন।', country:'দেশ / অঞ্চল', region:'বিভাগ / রাজ্য / প্রদেশ', district:'জেলা / কাউন্টি', city:'উপজেলা / শহর', area:'এলাকা / মহল্লা', search:'খুঁজুন', choose:'বেছে নিন…', any:'এড়িয়ে যান / তালিকায় নেই', filter:'লিখে খুঁজুন', loading:'লোকেশনের তালিকা লোড হচ্ছে…', error:'তালিকা লোড হয়নি। ইন্টারনেট সংযোগ দেখে আবার চেষ্টা করুন।', empty:'মিল পাওয়া যায়নি। অন্য বানানে বা নিচে এলাকার নাম দিয়ে খুঁজুন।', hint:'সবচেয়ে নির্দিষ্ট স্থান বেছে নিয়ে স্থানাঙ্ক নিশ্চিত করুন। দেশের ভিত্তিতে তালিকার পূর্ণতা ভিন্ন। তালিকায় না থাকলে এলাকা সার্চ করুন।', privacy:'এলাকা সার্চের শব্দ OpenStreetMap Nominatim-এ পাঠানো হয়। লোকেশন সংরক্ষণ হলে নামাজের সময় অফলাইনেও পাওয়া যায়।', use:'লোকেশন নিশ্চিত করুন', saved:'লোকেশন সংরক্ষিত হয়েছে', gps:'ডিভাইসের লাইভ লোকেশন ব্যবহার করুন', busy:'আপনার লোকেশন খোঁজা হচ্ছে…', denied:'লোকেশনের অনুমতি বন্ধ। ব্রাউজারের Site settings এবং ফোনের Location অনুমতি চালু করে আবার চেষ্টা করুন।', unavailable:'লোকেশন পাওয়া যায়নি। ফোনের Location / GPS চালু করে আবার চেষ্টা করুন অথবা স্থান বেছে নিন।', unsupported:'লাইভ লোকেশনের জন্য HTTPS ও সমর্থিত ব্রাউজার প্রয়োজন। তালিকা থেকে স্থান বেছে নিন।', retry:'তালিকা আবার লোড করুন', coords:'স্থানাঙ্ক', approximate:'স্থানের কেন্দ্রবিন্দু — আরও নির্ভুল অবস্থানের জন্য GPS ব্যবহার করুন।', accuracy:'GPS-এর নির্ভুলতা: ±', metres:'মিটার', manual:'নির্দিষ্ট স্থানাঙ্ক লিখুন', lat:'অক্ষাংশ (−৯০ থেকে ৯০)', lng:'দ্রাঘিমাংশ (−১৮০ থেকে ১৮০)', invalid:'সঠিক অক্ষাংশ ও দ্রাঘিমাংশ লিখুন।', attribution:'স্থানতথ্য: CSC Database · Bangladesh Geocode। এলাকা সার্চ: © OpenStreetMap contributors।', result:'সার্চের ফল বেছে নিন', required:'আগে দেশ বেছে নিন।' },
    ar: { sources:'المصادر / التراخيص', zone:'المنطقة الزمنية', refine:'تظهر أول ٢٥٠ نتيجة. اكتب المزيد لتضييق القائمة.', country:'الدولة / الإقليم', region:'الولاية / المحافظة', district:'المقاطعة', city:'المدينة / البلدة', area:'المنطقة / الحي', search:'بحث', choose:'اختر…', any:'تخطي / غير مدرج', filter:'اكتب للتصفية', loading:'جارٍ تحميل المواقع…', error:'تعذر التحميل. تحقق من الاتصال وأعد المحاولة.', empty:'لا توجد نتائج. جرّب اسماً آخر أو ابحث عن الحي.', hint:'اختر أدق موقع متاح ثم أكد الإحداثيات. تختلف التغطية حسب الدولة.', privacy:'يرسل البحث أسماء الأماكن إلى OpenStreetMap Nominatim. تعمل المواقيت المحفوظة دون إنترنت.', use:'تأكيد الموقع', saved:'تم حفظ الموقع', gps:'استخدم موقع الجهاز المباشر', busy:'جارٍ تحديد الموقع…', denied:'الموقع محظور. اسمح به من إعدادات المتصفح والهاتف ثم أعد المحاولة.', unavailable:'تعذر تحديد الموقع. شغّل GPS أو اختر مكاناً.', unsupported:'يلزم HTTPS ومتصفح يدعم الموقع. اختر مكاناً.', retry:'إعادة التحميل', coords:'الإحداثيات', approximate:'مركز المكان — استخدم GPS لدقة أكبر.', accuracy:'دقة GPS: ±', metres:'متر', manual:'أدخل الإحداثيات', lat:'خط العرض (−90 إلى 90)', lng:'خط الطول (−180 إلى 180)', invalid:'أدخل إحداثيات صحيحة.', attribution:'البيانات: CSC Database · Bangladesh Geocode. البحث: © OpenStreetMap contributors.', result:'اختر نتيجة البحث', required:'اختر الدولة أولاً.' }
  };
  const lang = () => (window.MHSLocale || document.documentElement.lang || 'en').split('-')[0];
  const t = k => (copy[lang()] || copy.en)[k] || copy.en[k];
  const el = (tag, attrs, children=[]) => { const n=document.createElement(tag); Object.entries(attrs||{}).forEach(([k,v])=> { if(k==='text') n.textContent=v; else n.setAttribute(k,v); }); children.forEach(c=>n.append(c)); return n; };
  const valid = p => p && Number.isFinite(p.lat) && Number.isFinite(p.lng) && Math.abs(p.lat)<=90 && Math.abs(p.lng)<=180;
  let lastSearch=0;
  async function load(code) { const r=await fetch('/pwa/data/locations/'+code+'.json'); if(!r.ok) throw Error('load'); return r.json(); }
  function create(onPick, options={}) {
    const root=el('section',{class:'mhs-location-picker','aria-label':t('country')});
    const message=el('p',{class:'mhs-mini-note',role:'status','aria-live':'polite'});
    let data, country, selected={}, candidate=null, generation=0;
    const fields={};
    function status(s){ message.textContent=s; retry.hidden=s!==t('error'); }
    function preview(p) { candidate=valid(p)?p:null; confirm.disabled=!candidate; point.textContent=candidate?t('coords')+': '+p.lat.toFixed(5)+', '+p.lng.toFixed(5)+' · '+p.place+' · '+t('zone')+': '+(p.tz||p.timeZone||Intl.DateTimeFormat().resolvedOptions().timeZone)+' — '+t('approximate'):''; }
    function field(key, optional, onChange) {
      const box=el('label',{class:'mhs-location-field'}), title=el('span',{text:t(key)}), input=el('input',{type:'search',class:'mhs-input',placeholder:t('filter'),'aria-label':t(key)+' — '+t('filter')}), select=el('select',{class:'mhs-select','aria-label':t(key)});
      const feedback=el('small',{class:'mhs-mini-note',role:'status'});
      let rows=[];
      function draw(){
        const old=select.value, q=input.value.normalize('NFKC').toLocaleLowerCase().trim();
        const matches=rows.filter(x=>(x.name+' '+(x.native||'')+' '+(x.label||'')).normalize('NFKC').toLocaleLowerCase().includes(q));
        const shown=matches.slice(0,250), chosen=matches.find(x=>x.id===old);if(chosen&&!shown.includes(chosen))shown.push(chosen);
        feedback.textContent=matches.length>250?t('refine'):q&&!matches.length?t('empty'):'';
        select.replaceChildren(el('option',{value:'',text:t(optional?'any':'choose')}));
        const fragment=document.createDocumentFragment();shown.forEach(x=>fragment.append(el('option',{value:x.id,text:x.label||((lang()==='bn'&&x.native?x.native:x.name)+(x.native&&x.native!==x.name&&lang()!=='bn'?' · '+x.native:''))})));select.append(fragment);
        select.value=shown.some(x=>x.id===old)?old:'';
      }
      input.addEventListener('input',()=>{const previous=select.value;draw();if(previous&&!select.value)onChange(null);}); select.addEventListener('change',()=>onChange(rows.find(x=>x.id===select.value)||null)); box.append(title,input,select,feedback); root.append(box);
      return { set(list,disabled=false){rows=list;input.value='';select.value='';input.disabled=select.disabled=disabled;draw();}, select };
    }
    if(!options.noGPS){
      const gps=el('button',{type:'button',class:'mhs-btn primary',text:t('gps')});
      gps.onclick=async()=>{gps.disabled=true;status(t('busy'));try{ const r=await window.MHSPrayer.enableLocation(); if(!root.isConnected)return; gps.disabled=false;if(r==='granted'){preview(null);status(t('saved'));onPick&&onPick();}else status(t(r==='denied'?'denied':r==='unsupported'?'unsupported':'unavailable'));}catch{gps.disabled=false;status(t('unavailable'));}};
      root.append(gps);
    }
    root.append(el('p',{class:'mhs-mini-note',text:t('hint')}));
    function cities(){
      const districts=new Set((data?.districts||[]).filter(d=>d.parent===selected.region?.id).map(d=>d.id));
      return (data?.cities||[]).filter(c=>selected.district?c.district===selected.district.id:!selected.region||c.parent===selected.region.id||districts.has(c.district));
    }
    function reset(keys){keys.forEach(k=>{delete selected[k];fields[k].set([],true);});preview(null); results.replaceChildren(); searchInput.value='';}
    fields.country=field('country',false,async c=>{
      const token=++generation; country=c;data=null;reset(['region','district','city']);status(''); if(!c)return;status(t('loading'));
      try{const d=await load(c.id);if(token!==generation)return;data=d;fields.region.set(d.regions);fields.district.set(d.districts);fields.city.set(cities());status('');}catch{if(token===generation)status(t('error'));}
    });
    fields.region=field('region',true,r=>{generation++;selected.region=r;reset(['district','city']);fields.district.set((data?.districts||[]).filter(d=>!r||d.parent===r.id));fields.city.set(cities());});
    fields.district=field('district',true,d=>{generation++;selected.district=d;reset(['city']);fields.city.set(cities());});
    fields.city=field('city',true,c=>{generation++;selected.city=c;preview(c?{...c,tz:c.tz||selected.region?.tz,place:[c.name,selected.district?.name,selected.region?.name,country?.name].filter(Boolean).join(', ')}:null);results.replaceChildren();});
    const searchInput=el('input',{type:'search',class:'mhs-input',placeholder:t('area'),'aria-label':t('area'),maxlength:'160'}), search=el('button',{type:'button',class:'mhs-btn',text:t('search')}), results=el('div',{class:'mhs-location-results','aria-label':t('result')});
    const searchLabel=el('label',{class:'mhs-location-field'},[el('span',{text:t('area')}),searchInput]); root.append(searchLabel,search,el('small',{class:'mhs-mini-note',text:t('privacy')}),results);
    searchInput.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();search.click();}});
    search.onclick=async()=>{
      if(!country){status(t('required'));return;} if(searchInput.value.trim().length<2)return;
      const token=++generation; search.disabled=true;status(t('loading'));results.replaceChildren();
      try{
        await new Promise(resolve=>setTimeout(resolve,Math.max(0,1100-(Date.now()-lastSearch))));lastSearch=Date.now();
        const q=[searchInput.value.trim(),selected.city?.name,selected.district?.name,selected.region?.name,country.name].filter(Boolean).join(', ');
        const url=new URL('https://nominatim.openstreetmap.org/search');url.search=new URLSearchParams({q,format:'jsonv2',addressdetails:'1',limit:'10',countrycodes:country.id.toLowerCase(),'accept-language':lang()});
        const r=await fetch(url,{signal:AbortSignal.timeout(15000)});if(!r.ok)throw Error('search');const rows=await r.json();if(token!==generation)return;
        const places=rows.map(x=>({lat:Number(x.lat),lng:Number(x.lon),place:x.display_name,tz:selected.city?.tz||selected.region?.tz})).filter(valid);status(places.length?'':t('empty'));
        places.forEach(p=>{const b=el('button',{type:'button',class:'mhs-btn',text:p.place});b.onclick=()=>{generation++;preview(p);results.replaceChildren();};results.append(b);});
      }catch{if(token===generation)status(t('error'));}finally{search.disabled=false;}
    };
    const manual=el('details',{},[el('summary',{text:t('manual')})]), lat=el('input',{type:'number',min:'-90',max:'90',step:'any','aria-label':t('lat'),placeholder:t('lat'),class:'mhs-input'}), lng=el('input',{type:'number',min:'-180',max:'180',step:'any','aria-label':t('lng'),placeholder:t('lng'),class:'mhs-input'});
    function manualChange(){generation++;preview(lat.value.trim()&&lng.value.trim()?{lat:Number(lat.value),lng:Number(lng.value),place:lat.value+', '+lng.value}:null);status(candidate?'':t('invalid'));} lat.oninput=lng.oninput=manualChange;manual.append(lat,lng);root.append(manual);
    const point=el('p',{class:'mhs-mini-note',role:'status'}), confirm=el('button',{type:'button',class:'mhs-btn primary',text:t('use')});confirm.disabled=true;
    confirm.onclick=()=>{if(!valid(candidate))return;window.MHSPrayer.setLocation(candidate);preview(null);status(t('saved'));onPick&&onPick();};
    const retry=el('button',{type:'button',class:'mhs-btn',text:t('retry')});retry.onclick=()=>country?fields.country.select.dispatchEvent(new Event('change')):init();
    const credits=el('small',{class:'mhs-mini-note',text:t('attribution')});
    credits.append(' ',el('a',{href:'/pwa/data/locations/README.md',target:'_blank',rel:'noopener',text:t('sources')}),' · ',el('a',{href:'https://www.openstreetmap.org/copyright',target:'_blank',rel:'noopener',text:'OpenStreetMap'}));
    root.append(point,confirm,message,retry,credits);
    async function init(){status(t('loading'));try{const rows=await load('countries');let names;try{names=new Intl.DisplayNames([lang()],{type:'region'});}catch{} rows.forEach(r=>r.label=(names?.of(r.id)||r.name)+(lang()==='en'?'':' · '+r.name));fields.country.set(rows.sort((a,b)=>a.label.localeCompare(b.label,lang())));status('');}catch{status(t('error'));}}
    fields.region.set([],true);fields.district.set([],true);fields.city.set([],true);init();return root;
  }
  window.MHSLocation={create,valid};
})();
