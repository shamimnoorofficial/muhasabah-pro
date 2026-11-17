/* Calculated Hijri calendar; local moon-sighting can be aligned by ±2 days. */
(function(){
  'use strict';
  const texts={
    en:{note:'Calculated Hijri date (Umm al-Qura). Local moon-sighting may differ; the date changes at Maghrib when a location is set.',adjust:'Hijri date adjustment (local moon-sighting)',days:'days',newYear:'Islamic New Year · 1 Muharram',ashura:'Ashura · 10 Muharram',ramadan:'Ramadan',lastTen:'Last ten nights of Ramadan',oddNight:'Odd night in the last ten nights — seek Laylat al-Qadr',fitr:'Eid al-Fitr',arafah:'Day of Arafah',adha:'Eid al-Adha',tashriq:'Days of Tashriq',white:'White days · 13–15 of the Hijri month',friday:'Friday · Jumu’ah'},
    bn:{note:'হিসাবভিত্তিক হিজরি তারিখ (উম্মুল কুরা)। স্থানীয় চাঁদ দেখা অনুযায়ী ভিন্ন হতে পারে; লোকেশন সেট থাকলে মাগরিবে তারিখ বদলায়।',adjust:'হিজরি তারিখ সমন্বয় (স্থানীয় চাঁদ দেখা অনুযায়ী)',days:'দিন',newYear:'হিজরি নববর্ষ · ১ মুহাররম',ashura:'আশুরা · ১০ মুহাররম',ramadan:'রমজান',lastTen:'রমজানের শেষ দশ রাত',oddNight:'শেষ দশকের বেজোড় রাত — লাইলাতুল কদর অন্বেষণ করুন',fitr:'ঈদুল ফিতর',arafah:'আরাফার দিন',adha:'ঈদুল আজহা',tashriq:'আইয়ামে তাশরীক',white:'আইয়ামে বীজ · হিজরি মাসের ১৩–১৫ তারিখ',friday:'শুক্রবার · জুমা'},
    ar:{note:'تاريخ هجري محسوب (أم القرى). قد تختلف رؤية الهلال محلياً؛ يتغير التاريخ عند المغرب بعد تحديد الموقع.',adjust:'تعديل التاريخ الهجري حسب رؤية الهلال',days:'أيام',newYear:'رأس السنة الهجرية · ١ محرم',ashura:'عاشوراء · ١٠ محرم',ramadan:'رمضان',lastTen:'العشر الأواخر من رمضان',oddNight:'ليلة وترية من العشر الأواخر — تحروا ليلة القدر',fitr:'عيد الفطر',arafah:'يوم عرفة',adha:'عيد الأضحى',tashriq:'أيام التشريق',white:'الأيام البيض · ١٣–١٥ من الشهر الهجري',friday:'الجمعة'}
  };
  const lang=()=> (window.MHSLocale||document.documentElement.lang||'en').split('-')[0];
  const t=k=>(texts[lang()]||texts.en)[k];
  function info(now=Date.now()){
    const d=new Date(now), raw=window.MHSPrayer?.day(d);
    const c=window.MHSTimes?.cfg()||{};
    const offset=Math.max(-2,Math.min(2,Math.round(Number(c.hijriAdjust)||0)));
    // Work with civil noon to avoid DST transitions and midnight edge cases.
    const civil=window.MHSPrayer?.civil(now)||{year:d.getFullYear(),month:d.getMonth()+1,day:d.getDate()};
    const calendarDay=new Date(civil.year,civil.month-1,civil.day+offset+(raw&&Number.isFinite(raw.sunset)&&now>=raw.sunset?1:0),12);
    const parts=new Intl.DateTimeFormat('en-u-ca-islamic-umalqura-nu-latn',{year:'numeric',month:'numeric',day:'numeric'}).formatToParts(calendarDay);
    const get=k=>Number(parts.find(p=>p.type===k)?.value);
    const month=get('month'), day=get('day'), events=[];
    if(month===1&&day===1)events.push('newYear');if(month===1&&day===10)events.push('ashura');
    if(month===9){events.push('ramadan');if(day>=21){events.push('lastTen');if(day%2)events.push('oddNight');}}
    if(month===10&&day===1)events.push('fitr');if(month===12&&day===9)events.push('arafah');if(month===12&&day===10)events.push('adha');if(month===12&&day>=11&&day<=13)events.push('tashriq');
    if(day>=13&&day<=15&&month!==9&&!(month===12&&day===13))events.push('white');
    if(calendarDay.getDay()===5)events.push('friday');
    return {year:get('year'),month,day,events,date:format(get('year'),month,day)};
  }
  /* Build the Hijri date from explicit month names. Some browsers lack Hijri names for Bengali and
     fall back to Gregorian months and the BCE era (e.g. "৮ জুন, ১৪৪৮ খ্রিস্টপূর্ব"). */
  const MONTHS={
    en:['Muharram','Safar','Rabi al-Awwal','Rabi al-Thani','Jumada al-Ula','Jumada al-Akhirah','Rajab','Shaban','Ramadan','Shawwal','Dhu al-Qadah','Dhu al-Hijjah'],
    bn:['মুহাররম','সফর','রবিউল আউয়াল','রবিউস সানি','জমাদিউল আউয়াল','জমাদিউস সানি','রজব','শাবান','রমজান','শাওয়াল','জিলকদ','জিলহজ'],
    ar:['محرم','صفر','ربيع الأول','ربيع الآخر','جمادى الأولى','جمادى الآخرة','رجب','شعبان','رمضان','شوال','ذو القعدة','ذو الحجة']
  };
  const DIGITS={bn:'০১২৩৪৫৬৭৮৯',ar:'٠١٢٣٤٥٦٧٨٩'};
  function format(year,month,day,l=lang()){
    if(!(year>0&&month>=1&&month<=12&&day>=1))return '';
    const code=MONTHS[l]?l:'en', n=v=>DIGITS[code]?String(v).replace(/\d/g,x=>DIGITS[code][x]):String(v);
    const suffix=code==='bn'?' হিজরি':code==='ar'?' هـ':' AH';
    return n(day)+' '+MONTHS[code][month-1]+' '+n(year)+suffix;
  }
  function today(d=new Date(),l=lang()){
    const parts=new Intl.DateTimeFormat('en-u-ca-islamic-umalqura-nu-latn',{year:'numeric',month:'numeric',day:'numeric'}).formatToParts(d);
    const get=k=>Number(parts.find(p=>p.type===k)?.value);
    return format(get('year'),get('month'),get('day'),l);
  }
  function paint(node){try{const x=info(), key=lang()+JSON.stringify(x);if(node.dataset.key===key)return;node.dataset.key=key;node.replaceChildren();const date=document.createElement('b');date.textContent=x.date;node.append(date);x.events.forEach(k=>{const p=document.createElement('strong');p.textContent=t(k);node.append(p);});const note=document.createElement('small');note.textContent=t('note');node.append(note);}catch{node.textContent='';}}
  class Calendar extends HTMLElement{
    connectedCallback(){this.classList.add('mhs-prayer-calendar');this._paint=()=>paint(this);this._paint();this._timer=setInterval(this._paint,60000);window.addEventListener('mhs-prayer-change',this._paint);document.addEventListener('visibilitychange',this._paint);}
    disconnectedCallback(){clearInterval(this._timer);window.removeEventListener('mhs-prayer-change',this._paint);document.removeEventListener('visibilitychange',this._paint);}
  }
  customElements.define('mhs-prayer-calendar',Calendar);
  function settings(){const box=document.createElement('label');box.className='mhs-calendar-setting';const title=document.createElement('span');title.textContent=t('adjust');const select=document.createElement('select');select.className='mhs-select';for(let i=-2;i<=2;i++){const opt=document.createElement('option');opt.value=String(i);opt.textContent=(i>0?'+':'')+i+' '+t('days');select.append(opt);}select.value=String(window.MHSTimes?.cfg().hijriAdjust||0);select.onchange=()=>window.MHSTimes.setCfg({hijriAdjust:Number(select.value)});box.append(title,select);return box;}
  window.MHSPrayerCalendar={info,format,today,create:()=>document.createElement('mhs-prayer-calendar'),settings,refresh:root=>root.querySelectorAll('mhs-prayer-calendar').forEach(paint)};
})();
