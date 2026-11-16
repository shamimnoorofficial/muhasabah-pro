/* Mini-app configuration, collections and offline reader controls.
 * Structured state uses MHSX and the existing Netlify Database account backup. */
(function () {
  'use strict';
  var X = window.MHSX;
  function tr(en,bn,ar) { return X.lang()==='bn'?bn:X.lang()==='ar'?(ar||en):en; }
  function button(label,run,icon) { return X.el('button',{type:'button',class:'mhs-btn','aria-label':label,on:{click:run}},icon?[X.icon(icon)]:[label]); }
  var gear='M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2Z|M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z';
  var down='M12 3v12|M7 10l5 5 5-5|M4 17v4h16v-4';
  function collections(){ return X.get('collections',{names:['Saved'],items:{}}); }
  function choose(item) {
    var c=collections(); if(!Array.isArray(c.names)||!c.names.length)c.names=['Saved']; c.items=c.items||{}; var sh=X.sheet({id:'mhs-collection-picker',title:tr('Save to collection','কালেকশনে রাখুন','حفظ في مجموعة')});
    var select=X.el('select',{'aria-label':tr('Collection','কালেকশন','المجموعة')},c.names.map(function(n){return X.el('option',{value:n,text:n});}));
    var name=X.el('input',{placeholder:tr('Or create a collection','অথবা নতুন কালেকশন','أو مجموعة جديدة'),'aria-label':tr('New collection','নতুন কালেকশন','مجموعة جديدة'),maxlength:80});
    sh.body.append(select,name,button(tr('Save','সংরক্ষণ','حفظ'),function(){var n=name.value.trim()||select.value;if(c.names.indexOf(n)<0)c.names.push(n);c.items[item.id]=Object.assign({},item,{collection:n,at:Date.now()});X.set('collections',c);sh.close();X.toast(tr('Saved to ','সংরক্ষিত: ','تم الحفظ في ')+n);}));
  }
  window.MHSCollections={choose:choose,collect:function(){var c=collections();return Object.keys(c.items).map(function(id){var i=c.items[id];return Object.assign({},i,{go:function(){if(i.kind==='journal')window.MHSJournal.open(i.day);else if(i.kind==='seerah')window.MHSSeerah.open({page:i.page});else if(i.kind==='quran')window.MHSQuran.open({surah:i.s,ayah:i.a});else if(i.kind==='hadith')window.MHSHadith.open({book:i.b,number:i.n});else if(i.kind==='wisdom')window.MHSWisdomApp.open({id:i.sourceId});else if(['dua','amol','name'].indexOf(i.kind)>=0)window.MHSKnowledge.open({tab:{dua:'duas',amol:'amol',name:'names'}[i.kind],id:i.sourceId});else window.MHSReminder.open({id:id.slice(1)});},remove:function(){var c=collections();delete c.items[id];X.set('collections',c);}});});}};

  // Give all reader mini-apps a single compact settings popover.
  function decorate(dialog) {
    var tools=dialog.querySelector('.mhs-mini-tools');if(!tools)return;
    var id=dialog.id;
    if(id==='mhs-collection-picker'||id==='mhs-reader-settings'||id==='mhs-offline-download')return;
    if(['mhs-quran','mhs-hadith','mhs-knowledge','mhs-wisdom-app','mhs-seerah'].indexOf(id)>=0&&!tools.querySelector('[data-reader-settings]')){
      var b=button(tr('Settings','সেটিংস','الإعدادات'),function(){settings(dialog);},gear);b.className='mhs-mini-ib';b.dataset.readerSettings='1';tools.appendChild(b);
    }
    if(['mhs-quran','mhs-hadith','mhs-knowledge','mhs-wisdom-app','mhs-wisdom','mhs-seerah'].indexOf(id)>=0&&!tools.querySelector('[data-offline]')){
      var d=button(tr('Download for offline','অফলাইনের জন্য ডাউনলোড','تنزيل دون اتصال'),function(){download(dialog);},down);d.className='mhs-mini-ib';d.dataset.offline='1';tools.appendChild(d);
    }
  }

  /* Quran Rasm (mushaf script). Uthmani/Madani follows the King Fahd Complex print (KFGQPC Hafs font,
   * Uthmani orthography). Indo-Pak follows the South Asian print (IndoPak Nastaleeq font and the
   * Indo-Pak orthography from Quran.com, with standing fatha, inverted damma and waqf marks). */
  var RASM={uthmani:{font:"'KFGQPC Uthmanic Hafs'"},indopak:{font:"'IndoPak Nastaleeq'"}};
  var SOUTH_ASIA=/^(bn|ur|hi|ps|sd|ne|as|pa|gu|ks)$/;
  function defaultRasm(){var tz='';try{tz=Intl.DateTimeFormat().resolvedOptions().timeZone||'';}catch(e){}return SOUTH_ASIA.test(X.lang())||/^Asia\/(Dhaka|Kolkata|Calcutta|Karachi|Kathmandu|Thimphu|Colombo)$/.test(tz)?'indopak':'uthmani';}
  function rasm(){var r=X.get('quranRasm',null);return RASM[r]?r:defaultRasm();}
  function quranFont(p){return p&&p.arabic&&p.arabic!=='mushaf'?"'"+p.arabic+"'":RASM[rasm()].font;}
  function ensureWebFont(name){if(name!=='Noto Naskh Arabic'||document.getElementById('mhs-font-naskh'))return;document.head.appendChild(X.el('link',{id:'mhs-font-naskh',rel:'stylesheet',href:'https://fonts.googleapis.com/css2?family=Noto+Naskh+Arabic:wght@400;700&display=swap'}));}
  var indoMem={},indoBusy={};
  function fetchIndo(s){
    if(indoMem[s])return Promise.resolve(indoMem[s]);
    var url='https://api.quran.com/api/v4/quran/verses/indopak?chapter_number='+s;
    var c=('caches' in window)?caches.open('mhs-library'):Promise.resolve(null);
    return c.then(function(cache){return (cache?cache.match(url):Promise.resolve(null)).then(function(hit){
      if(hit)return hit.json();
      return fetch(url).then(function(r){if(!r.ok)throw Error('http');if(cache)cache.put(url,r.clone());return r.json();});
    });}).then(function(j){var m={};(j.verses||[]).forEach(function(v){var a=Number(String(v.verse_key).split(':')[1]);m[a]=String(v.text_indopak||'').replace(/[​‎‏]/g,'').replace(/\s+/g,' ').trim();});if(!Object.keys(m).length)throw Error('empty');indoMem[s]=m;return m;});
  }
  var BISM={uthmani:'بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ',indopak:'بِسۡمِ اللّٰهِ الرَّحۡمٰنِ الرَّحِيۡمِ'};
  function rasmText(d){
    var want=rasm();d.dataset.rasm=want;
    var bism=d.querySelector('.mhs-q-bismillah');if(bism&&bism.textContent!==BISM[want])bism.textContent=BISM[want];
    var groups={};
    d.querySelectorAll('.mhs-q-ayah[data-s]').forEach(function(el){
      var cur=el.dataset.rasm||'uthmani';if(cur===want)return;
      var ar=el.querySelector('.ar'),node=ar&&ar.firstChild;if(!node||node.nodeType!==3)return;
      if(want==='uthmani'){if(el.dataset.uth){node.textContent=el.dataset.uth;}el.dataset.rasm='uthmani';return;}
      (groups[el.dataset.s]=groups[el.dataset.s]||[]).push(el);
    });
    Object.keys(groups).forEach(function(s){
      if(indoBusy[s])return;indoBusy[s]=1;
      fetchIndo(s).then(function(m){groups[s].forEach(function(el){var a=Number(el.dataset.a),node=el.querySelector('.ar').firstChild;if(!m[a]||rasm()!=='indopak')return;if(!el.dataset.uth)el.dataset.uth=node.textContent;node.textContent=m[a]+' ';el.dataset.rasm='indopak';});})
      .catch(function(){d.dataset.rasmOffline='1';}).then(function(){delete indoBusy[s];});
    });
  }
  window.MHSRasm={get:rasm,set:function(r){if(!RASM[r])return;X.set('quranRasm',r);document.querySelectorAll('dialog#mhs-quran[open]').forEach(function(d){var p=X.get('reader:mhs-quran',null)||{size:20,arabic:'mushaf'};applyReader(d,p);rasmText(d);});},font:function(){return RASM[rasm()].font;},indopak:fetchIndo};
  function rasmPicker(dialog){
    var cur=rasm();
    var opts=[
      {k:'uthmani',t:tr('Uthmani · Madani','উসমানি · মাদানি','العثماني · المدني'),d:tr('King Fahd Complex print · 15 lines · popular for hifz','কিং ফাহাদ কমপ্লেক্সের মুদ্রণ · ১৫ লাইন · হিফজের জন্য জনপ্রিয়','مصحف مجمع الملك فهد · ١٥ سطراً · الأشهر للحفظ')},
      {k:'indopak',t:tr('Indo-Pak','ইন্দো-পাক','الهندي الباكستاني'),d:tr('South Asian print · 13 lines · clear vowels and waqf marks','দক্ষিণ এশীয় মুদ্রণ · ১৩ লাইন · স্পষ্ট হরকত ও ওয়াকফ চিহ্ন','طبعة جنوب آسيا · ١٣ سطراً · حركات وعلامات وقف واضحة')}
    ];
    var box=X.el('fieldset',{class:'mhs-rasm'},[X.el('legend',{text:tr('Mushaf script (Rasm / Khatt)','মুসহাফ লিপি (রসম / খাত্ত)','رسم المصحف (الخط)')})]);
    opts.forEach(function(o){
      var input=X.el('input',{type:'radio',name:'mhs-rasm',value:o.k,checked:o.k===cur?true:null,on:{change:function(){window.MHSRasm.set(o.k);}}});
      box.appendChild(X.el('label',{class:'mhs-rasm-opt','data-rasm':o.k},[input,X.el('span',{class:'mhs-rasm-sample',lang:'ar',dir:'rtl','aria-hidden':'true',text:BISM[o.k]}),X.el('b',{text:o.t}),X.el('small',{text:o.d})]));
    });
    box.appendChild(X.el('p',{class:'mhs-settings-intro',text:tr('Indo-Pak text downloads per surah the first time and then works offline.','ইন্দো-পাক লিপি প্রতিটি সূরার জন্য প্রথমবার ডাউনলোড হয়, এরপর অফলাইনে চলে।','يُنزَّل النص الهندي لكل سورة أول مرة ثم يعمل دون اتصال.')}));
    return box;
  }
  function settings(dialog){
    var sh=X.sheet({id:'mhs-reader-settings',title:tr('Reader settings','পড়ার সেটিংস','إعدادات القراءة')});
    var key='reader:'+dialog.id,p=X.get(key,{size:20,arabic:dialog.id==='mhs-quran'?'mushaf':'Amiri',mushaf:false});
    sh.body.classList.add('mhs-settings-panel');
    sh.body.appendChild(X.el('p',{class:'mhs-settings-intro',text:tr('Make reading comfortable. Changes apply immediately.','স্বাচ্ছন্দ্যে পড়ুন। পরিবর্তন সঙ্গে সঙ্গে কার্যকর হয়।','خصص القراءة لراحتك. تطبق التغييرات فوراً.')}));
    var size=X.el('input',{id:'mhs-reader-size',type:'range',min:14,max:40,value:p.size,'aria-label':tr('Text size','অক্ষরের আকার','حجم النص')});
    var value=X.el('output',{'for':'mhs-reader-size',text:p.size+' px'});
    var font=X.el('select',{id:'mhs-reader-font','aria-label':tr('Arabic font','আরবি ফন্ট','الخط العربي')},(dialog.id==='mhs-quran'?[['mushaf',tr('Match the mushaf script','মুসহাফ লিপি অনুযায়ী','حسب رسم المصحف')],['Amiri','Amiri'],['Noto Naskh Arabic','Noto Naskh Arabic']]:[['Amiri','Amiri'],['Noto Naskh Arabic','Noto Naskh Arabic'],['KFGQPC Uthmanic Hafs','Uthmanic Hafs'],['serif',tr('System','সিস্টেম','النظام')]]).map(function(f){return X.el('option',{value:f[0],text:f[1],selected:p.arabic===f[0]});}));
    var mushaf=X.el('input',{id:'mhs-reader-mushaf',type:'checkbox',checked:p.mushaf});
    function apply(){p={size:Number(size.value),arabic:font.value,mushaf:mushaf.checked};value.textContent=p.size+' px';X.set(key,p);applyReader(dialog,p);}
    size.oninput=apply;font.onchange=apply;mushaf.onchange=apply;
    sh.body.append(X.el('label',{class:'mhs-setting-row','for':'mhs-reader-size'},[X.el('span',{text:tr('Text size','অক্ষরের আকার','حجم النص')}),value,size]));
    if(dialog.id==='mhs-quran')sh.body.append(rasmPicker(dialog));
    if(['mhs-quran','mhs-hadith','mhs-knowledge'].indexOf(dialog.id)>=0)sh.body.append(X.el('label',{class:'mhs-setting-row','for':'mhs-reader-font'},[tr('Arabic typeface','আরবি টাইপফেস','نوع الخط العربي'),font]));
    if(dialog.id==='mhs-quran')sh.body.append(X.el('label',{class:'mhs-setting-row','for':'mhs-reader-mushaf'},[tr('Continuous Mushaf layout','একটানা মুসহাফ বিন্যাস','عرض المصحف المتصل'),mushaf]));
    if(dialog.id==='mhs-seerah'&&window.MHSSeerah)window.MHSSeerah.settings(sh.body);
    // Keep search, navigation and app actions in their original toolbar.
  }

  function applyReader(d,p){var b=d.querySelector('.mhs-mini-body');if(!b)return;b.style.fontSize=p.size+'px';b.style.setProperty('--mhs-ar-scale',p.size/20);b.style.setProperty('--mhs-tx-scale',p.size/20);b.style.setProperty('--mhs-q-size',p.size/16+'rem');var fam=d.id==='mhs-quran'?quranFont(p):p.arabic==='serif'?'serif':"'"+p.arabic+"'";ensureWebFont(p.arabic);b.style.setProperty('--reader-arabic',fam);b.style.setProperty('--mhs-arabic',fam.replace(/'/g,'')+', Amiri, serif');d.classList.toggle('mhs-mushaf',!!p.mushaf);}
  async function download(dialog){
    var sh=X.sheet({id:'mhs-offline-download',title:tr('Offline library','অফলাইন লাইব্রেরি','مكتبة دون اتصال')});
    var status=X.el('p',{role:'status',text:tr('Choose a download. Keep this window open. Audio is streamed separately.','ডাউনলোড বেছে নিন। উইন্ডো খোলা রাখুন। অডিও আলাদাভাবে অনলাইনে চলে।','اختر تنزيلاً وأبق النافذة مفتوحة. الصوت يحتاج اتصالاً.')});sh.body.appendChild(status);
    var stop=false;sh.dialog.addEventListener('close',function(){stop=true;});
    async function run(tasks){try{for(var i=0;i<tasks.length;i++){if(stop)return;status.textContent=tr('Downloading ','ডাউনলোড হচ্ছে ','جارٍ التنزيل ')+(i+1)+' / '+tasks.length;await tasks[i]();}status.textContent=tr('Downloaded. Available offline on this device.','ডাউনলোড সম্পন্ন। এই ডিভাইসে অফলাইনে পড়তে পারবেন।','تم التنزيل للقراءة دون اتصال.');}catch(e){status.textContent=tr('Download interrupted. Check storage and connection, then retry. Completed sections are kept.','ডাউনলোড থেমেছে। স্টোরেজ ও সংযোগ দেখে আবার চেষ্টা করুন। সম্পন্ন অংশগুলো রাখা আছে।','توقف التنزيل. تحقق من الاتصال والتخزين ثم أعد المحاولة.');}}
    if(dialog.id==='mhs-quran')sh.body.appendChild(button(tr('All 114 surahs · selected language','সব ১১৪ সূরা · নির্বাচিত ভাষা','١١٤ سورة · اللغة المحددة'),function(){run(Array.from({length:114},function(_,i){return function(){return window.MHSQuran.download(i+1).then(function(r){return rasm()==='indopak'?fetchIndo(i+1).then(function(){return r;}):r;});};}));}));
    else if(dialog.id==='mhs-hadith')window.MHSHadith.books.forEach(function(book){sh.body.appendChild(button(book[X.lang()]||book.en,function(){run(Array.from({length:book.n},function(_,i){return function(){return window.MHSHadith.download(book.id,i+1);};}));}));});
    else if(dialog.id==='mhs-seerah') {window.MHSSeerah.downloadPanel(sh.body,status,function(){return stop;});}
    else sh.body.appendChild(button(tr('Download library','লাইব্রেরি ডাউনলোড','تنزيل المكتبة'),function(){run(['duas','names','amol','wisdom','reminders'].map(function(k){return async function(){var r=await fetch('/data/'+k+'.json');if(!r.ok)throw Error();await(await caches.open('mhs-library')).put('/data/'+k+'.json',r);};}));}));
  }
  function polishSettings(){
    document.querySelectorAll('button').forEach(function(b){
      var label=b.getAttribute('aria-label')||b.getAttribute('title')||b.textContent.trim();
      if(!/^(settings|feed settings|সেটিংস|ফিড সেটিংস|الإعدادات|إعدادات الموجز)$/i.test(label)||b.dataset.settingsPolished)return;
      b.dataset.settingsPolished='1';b.classList.add('mhs-settings-trigger');
      b.title=label;if(!b.getAttribute('aria-label'))b.setAttribute('aria-label',label);
      var svg=b.querySelector('svg');
      if(svg)svg.replaceWith(X.icon(gear));
      else if(b.classList.contains('mhs-mini-ib'))b.replaceChildren(X.icon(gear));
    });
  }
  var queued=false;
  new MutationObserver(function(){if(queued)return;queued=true;requestAnimationFrame(function(){queued=false;polishSettings();document.querySelectorAll('dialog.mhs-mini[open]').forEach(function(d){decorate(d);var p=X.get('reader:'+d.id,null);if(d.id==='mhs-quran'){applyReader(d,p||{size:20,arabic:'mushaf',mushaf:false});rasmText(d);}else if(p)applyReader(d,p);});});}).observe(document.body,{childList:true,subtree:true});

  customElements.define('mhs-feed-home',class extends HTMLElement {
    static get observedAttributes(){return ['lang'];}
    connectedCallback(){
      this.classList.add('mhs-home-stack');
      this.prayer=X.el('mhs-prayer-strip',{lang:X.lang()});
      this.feed=X.el('section',{class:'mhs-home-feed'});
      this.summary=X.el('section',{class:'panel mhs-home-summary'});
      this.apps=X.el('section',{class:'panel mhs-home-apps'});
      this.replaceChildren(this.prayer,this.feed,this.summary,this.apps);
      var host=this;
      X.whenReady('MHSReminder',function(){if(host.isConnected)window.MHSReminder.mount(host.feed);});
      this.refresh=function(){if(host.isConnected)host.renderHome();};
      ['mhs:suite','mhs:extras','mhs:essential','visibilitychange'].forEach(function(e){document.addEventListener(e,host.refresh);});
      // The application save API has no unsubscribe; register one shared listener below.
      this.renderHome();
    }
    disconnectedCallback(){
      if(window.MHSReminder)window.MHSReminder.unmount(this.feed);
      var host=this;['mhs:suite','mhs:extras','mhs:essential','visibilitychange'].forEach(function(e){document.removeEventListener(e,host.refresh);});
    }
    attributeChangedCallback(){if(this.isConnected&&this.feed){this.prayer.setAttribute("lang",X.lang());this.renderHome();}}
    renderHome(){
      var title=tr('Dashboard summary','ড্যাশবোর্ড সারাংশ','ملخص لوحة المعلومات');
      var stats=window.MHSOverview&&window.MHSOverview.compute(7);
      var link=X.el('button',{type:'button',class:'mhs-home-summary-link',on:{click:function(){window.MHSApp.nav('dashboard');}}});
      link.append(X.el('span',{class:'mhs-home-section-title',text:title}),X.el('span',{class:'mhs-home-more',text:tr('More info →','বিস্তারিত দেখুন →','المزيد ←')}));
      if(stats){var values=X.el('span',{class:'mhs-home-stats'});
        [[Math.round(stats.index*100)+'%',tr('Muhasabah Index','মুহাসাবা সূচক','مؤشر المحاسبة')],[stats.habitsToday.d+'/'+stats.habitsToday.n,tr('Habits today','আজকের অভ্যাস','عادات اليوم')],[stats.todoOpen,tr('Open tasks','বাকি কাজ','المهام المتبقية')]].forEach(function(v){values.appendChild(X.el('span',{},[X.el('b',{class:'num',text:String(v[0])}),X.el('small',{text:v[1]})]));});link.appendChild(values);
      }
      this.summary.replaceChildren(link);
      var grid=X.el('div',{class:'mhs-home-app-grid'});
      var order=['quran','hadith','seerah','wisdom','wisdom-app','knowledge','bookmarks','prayer','zikr','amol','essential','todo','journal','notes','hisab','calc','gate'];
      if(window.MHSActions&&window.MHSActions.items)window.MHSActions.items().sort(function(a,b){var i=order.indexOf(a.key),j=order.indexOf(b.key);return (i<0?99:i)-(j<0?99:j);}).forEach(function(item){
        grid.appendChild(X.el('button',{type:'button',class:'mhs-home-app','data-app':item.key,on:{click:item.run}},[X.el('span',{class:'mhs-home-app-icon','aria-hidden':'true'},[X.icon(item.icon||'grid')]),X.el('span',{text:item.label})]));
      });
      this.apps.replaceChildren(X.el('h2',{class:'mhs-home-section-title',text:tr('All apps','সব অ্যাপ','كل التطبيقات')}),grid);
    }
  });
  X.whenReady('MHS',function(M){if(M.onSave)M.onSave(function(){document.querySelectorAll('mhs-feed-home').forEach(function(h){h.renderHome();});});});
})();
(function(){
'use strict';var X=window.MHSX;
window.MHSQuickTodo=function(){
  var X=window.MHSX,lang=X.lang(),tr=function(en,bn,ar){return lang==='bn'?bn:lang==='ar'?ar:en;};
  var sh=X.sheet({id:'mhs-quick-todo',title:tr('Quick to-do','দ্রুত টু-ডু','مهمة سريعة')});
  var input=X.el('input',{placeholder:tr('A task for today','আজকের কাজ','مهمة لليوم'),required:true,minlength:2,maxlength:200,'aria-label':tr('Task title','কাজের নাম','عنوان المهمة'),enterkeyhint:'done'});
  var form=X.el('form',{class:'mhs-quick-todo-form',on:{submit:function(e){e.preventDefault();if(window.MHSApp.addTodo(input.value)){sh.close();X.toast(tr('To-do added','টু-ডু যোগ হয়েছে','تمت إضافة المهمة'));}}}},[input,X.el('button',{type:'submit',class:'mhs-btn primary',text:tr('Add','যোগ করুন','إضافة')})]);
  sh.body.appendChild(form);
  // Points, deadline and repeat live in the full form; keep it one tap away.
  if(window.MHSApp&&window.MHSApp.newTodo)sh.body.appendChild(X.el('button',{type:'button',class:'mhs-chip mhs-quick-todo-more',text:tr('More options: points, deadline…','আরও অপশন: পয়েন্ট, সময়সীমা…','خيارات أكثر: النقاط والموعد…'),on:{click:function(){var v=input.value;sh.close();setTimeout(function(){window.MHSApp.newTodo(v);},50);}}}));
  input.focus();
};
window.MHSJournalDayTools=function(host,day){var all=X.get('journalDays',{}),meta=all[day]||{};var box=X.el('div',{class:'mhs-j-day-extra'});var mood=X.el('select',{'aria-label':X.lang()==='bn'?'মুড':'Mood'},[['','—'],['happy',X.lang()==='bn'?'আনন্দিত':X.lang()==='ar'?'سعيد':'Happy'],['grateful',X.lang()==='bn'?'কৃতজ্ঞ':X.lang()==='ar'?'ممتن':'Grateful'],['calm',X.lang()==='bn'?'শান্ত':X.lang()==='ar'?'هادئ':'Calm'],['sad',X.lang()==='bn'?'বিষণ্ণ':X.lang()==='ar'?'حزين':'Sad'],['anxious',X.lang()==='bn'?'উদ্বিগ্ন':X.lang()==='ar'?'قلق':'Anxious']].map(function(v){return X.el('option',{value:v[0],text:v[1],selected:meta.mood===v[0]});}));var date=X.el('input',{type:'date',value:day,'aria-label':X.lang()==='bn'?'ডায়েরির তারিখ':X.lang()==='ar'?'تاريخ اليوميات':'Diary date'});date.onchange=function(){if(date.value)window.MHSJournal.open(date.value);};var event=X.el('input',{value:meta.event||'',maxlength:160,placeholder:X.lang()==='bn'?'বিশেষ দিন / উপলক্ষ':X.lang()==='ar'?'يوم خاص / مناسبة':'Special day / occasion','aria-label':X.lang()==='bn'?'বিশেষ দিন':X.lang()==='ar'?'يوم خاص':'Special day'});function save(){all[day]={mood:mood.value,event:event.value.trim()};X.set('journalDays',all);}mood.onchange=save;event.oninput=save;box.append(date,mood,event,X.el('button',{type:'button',class:'mhs-btn',text:X.lang()==='bn'?'বুকমার্ক':X.lang()==='ar'?'حفظ':'Bookmark',on:{click:function(){window.MHSCollections.choose({id:'j:'+day,kind:'journal',day:day,title:day,sub:event.value});}}}));host.appendChild(box);};
window.MHSJournalCalendarMark=function(button,day){var m=X.get('journalDays',{})[day];if(!m)return;if(m.event){button.classList.add('has-special-day');button.title=m.event;button.appendChild(X.el('small',{text:'•','aria-label':m.event}));}if(m.mood){button.dataset.mood=m.mood;button.appendChild(X.el('span',{class:'mhs-j-mood-dot','aria-hidden':'true',text:({happy:'◉',grateful:'✦',calm:'◌',sad:'☂',anxious:'≈'})[m.mood]||'•'}));button.setAttribute('aria-label',button.getAttribute('aria-label')+' · '+m.mood+(m.event?' · '+m.event:''));}};
// Replace purchase entry points with donations without changing account sign-in APIs.
function donateButtons(){document.querySelectorAll('.mhs-pro-btn').forEach(function(b){if(b.dataset.donation)return;b.dataset.donation='1';b.textContent='Donate';b.setAttribute('aria-label','Donate');b.addEventListener('click',function(e){e.preventDefault();e.stopImmediatePropagation();if(window.MuhasabahDonate)window.MuhasabahDonate.open();},true);});}
new MutationObserver(donateButtons).observe(document.body,{childList:true,subtree:true});donateButtons();
})();

/* + menu: drop the bottom fade once the list is scrolled to its end (or doesn't need scrolling). */
(function () {
  function sync(m) { if (m) m.classList.toggle('is-scrolled-end', m.scrollTop + m.clientHeight >= m.scrollHeight - 4); }
  document.addEventListener('scroll', function (e) { if (e.target && e.target.id === 'mhs-fab-menu') sync(e.target); }, true);
  document.addEventListener('click', function (e) {
    if (e.target && e.target.closest && e.target.closest('#mhs-fab')) setTimeout(function () { sync(document.getElementById('mhs-fab-menu')); }, 60);
  });
  window.addEventListener('resize', function () { sync(document.getElementById('mhs-fab-menu')); });
})();
