/* Mini-app configuration, collections and offline reader controls.
 * Structured state uses MHSX and the existing Netlify Database account backup. */
(function () {
  'use strict';
  var X = window.MHSX;
  function tr(en,bn,ar) { return X.lang()==='bn'?bn:X.lang()==='ar'?(ar||en):en; }
  function button(label,run,icon) { return X.el('button',{type:'button',class:'mhs-btn','aria-label':label,on:{click:run}},icon?[X.icon(icon)]:[label]); }
  var gear='M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z|M12 2v3|M12 19v3|M2 12h3|M19 12h3|M5 5l2 2|M17 17l2 2|M5 19l2-2|M17 7l2-2';
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
  function settings(dialog){
    var sh=X.sheet({id:'mhs-reader-settings',title:tr('Reader settings','পড়ার সেটিংস','إعدادات القراءة')});
    var key='reader:'+dialog.id,p=X.get(key,{size:20,arabic:'Amiri',mushaf:false});
    sh.body.classList.add('mhs-settings-panel');
    sh.body.appendChild(X.el('p',{class:'mhs-settings-intro',text:tr('Make reading comfortable. Changes apply immediately.','স্বাচ্ছন্দ্যে পড়ুন। পরিবর্তন সঙ্গে সঙ্গে কার্যকর হয়।','خصص القراءة لراحتك. تطبق التغييرات فوراً.')}));
    var size=X.el('input',{id:'mhs-reader-size',type:'range',min:14,max:40,value:p.size,'aria-label':tr('Text size','অক্ষরের আকার','حجم النص')});
    var value=X.el('output',{'for':'mhs-reader-size',text:p.size+' px'});
    var font=X.el('select',{id:'mhs-reader-font','aria-label':tr('Arabic font','আরবি ফন্ট','الخط العربي')},['Amiri','Noto Naskh Arabic','serif'].map(function(f){return X.el('option',{value:f,text:f,selected:p.arabic===f});}));
    var mushaf=X.el('input',{id:'mhs-reader-mushaf',type:'checkbox',checked:p.mushaf});
    function apply(){p={size:Number(size.value),arabic:font.value,mushaf:mushaf.checked};value.textContent=p.size+' px';X.set(key,p);applyReader(dialog,p);}
    size.oninput=apply;font.onchange=apply;mushaf.onchange=apply;
    sh.body.append(X.el('label',{class:'mhs-setting-row','for':'mhs-reader-size'},[X.el('span',{text:tr('Text size','অক্ষরের আকার','حجم النص')}),value,size]));
    if(['mhs-quran','mhs-hadith','mhs-knowledge'].indexOf(dialog.id)>=0)sh.body.append(X.el('label',{class:'mhs-setting-row','for':'mhs-reader-font'},[tr('Arabic script','আরবি লিপি','الخط العربي'),font]));
    if(dialog.id==='mhs-quran')sh.body.append(X.el('label',{class:'mhs-setting-row','for':'mhs-reader-mushaf'},[tr('Continuous Mushaf layout','একটানা মুসহাফ বিন্যাস','عرض المصحف المتصل'),mushaf]));
    if(dialog.id==='mhs-seerah'&&window.MHSSeerah)window.MHSSeerah.settings(sh.body);
    // Keep search, navigation and app actions in their original toolbar.
  }

  function applyReader(d,p){var b=d.querySelector('.mhs-mini-body');if(!b)return;b.style.fontSize=p.size+'px';b.style.setProperty('--mhs-ar-scale',p.size/20);b.style.setProperty('--mhs-tx-scale',p.size/20);b.style.setProperty('--mhs-q-size',p.size/16+'rem');b.style.setProperty('--reader-arabic',p.arabic);b.style.setProperty('--mhs-arabic',p.arabic+', serif');d.classList.toggle('mhs-mushaf',!!p.mushaf);}
  async function download(dialog){
    var sh=X.sheet({id:'mhs-offline-download',title:tr('Offline library','অফলাইন লাইব্রেরি','مكتبة دون اتصال')});
    var status=X.el('p',{role:'status',text:tr('Choose a download. Keep this window open. Audio is streamed separately.','ডাউনলোড বেছে নিন। উইন্ডো খোলা রাখুন। অডিও আলাদাভাবে অনলাইনে চলে।','اختر تنزيلاً وأبق النافذة مفتوحة. الصوت يحتاج اتصالاً.')});sh.body.appendChild(status);
    var stop=false;sh.dialog.addEventListener('close',function(){stop=true;});
    async function run(tasks){try{for(var i=0;i<tasks.length;i++){if(stop)return;status.textContent=tr('Downloading ','ডাউনলোড হচ্ছে ','جارٍ التنزيل ')+(i+1)+' / '+tasks.length;await tasks[i]();}status.textContent=tr('Downloaded. Available offline on this device.','ডাউনলোড সম্পন্ন। এই ডিভাইসে অফলাইনে পড়তে পারবেন।','تم التنزيل للقراءة دون اتصال.');}catch(e){status.textContent=tr('Download interrupted. Check storage and connection, then retry. Completed sections are kept.','ডাউনলোড থেমেছে। স্টোরেজ ও সংযোগ দেখে আবার চেষ্টা করুন। সম্পন্ন অংশগুলো রাখা আছে।','توقف التنزيل. تحقق من الاتصال والتخزين ثم أعد المحاولة.');}}
    if(dialog.id==='mhs-quran')sh.body.appendChild(button(tr('All 114 surahs · selected language','সব ১১৪ সূরা · নির্বাচিত ভাষা','١١٤ سورة · اللغة المحددة'),function(){run(Array.from({length:114},function(_,i){return function(){return window.MHSQuran.download(i+1);};}));}));
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
  new MutationObserver(function(){if(queued)return;queued=true;requestAnimationFrame(function(){queued=false;polishSettings();document.querySelectorAll('dialog.mhs-mini[open]').forEach(function(d){decorate(d);var p=X.get('reader:'+d.id,null);if(p)applyReader(d,p);});});}).observe(document.body,{childList:true,subtree:true});

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
window.MHSQuickTodo=function(){var sh=X.sheet({id:'mhs-quick-todo',title:X.lang()==='bn'?'দ্রুত টু-ডু':'Quick to-do'}),input=X.el('input',{placeholder:X.lang()==='bn'?'আজকের কাজ':'A task for today',required:true,minlength:2,'aria-label':'Task title'});var form=X.el('form',{on:{submit:function(e){e.preventDefault();if(window.MHSApp.addTodo(input.value)){sh.close();X.toast(X.lang()==='bn'?'টু-ডু যোগ হয়েছে':'To-do added');}}}},[input,X.el('button',{type:'submit',class:'mhs-btn primary',text:X.lang()==='bn'?'যোগ করুন':'Add'})]);sh.body.appendChild(form);input.focus();};
window.MHSJournalDayTools=function(host,day){var all=X.get('journalDays',{}),meta=all[day]||{};var box=X.el('div',{class:'mhs-j-day-extra'});var mood=X.el('select',{'aria-label':X.lang()==='bn'?'মুড':'Mood'},[['','—'],['happy',X.lang()==='bn'?'আনন্দিত':X.lang()==='ar'?'سعيد':'Happy'],['grateful',X.lang()==='bn'?'কৃতজ্ঞ':X.lang()==='ar'?'ممتن':'Grateful'],['calm',X.lang()==='bn'?'শান্ত':X.lang()==='ar'?'هادئ':'Calm'],['sad',X.lang()==='bn'?'বিষণ্ণ':X.lang()==='ar'?'حزين':'Sad'],['anxious',X.lang()==='bn'?'উদ্বিগ্ন':X.lang()==='ar'?'قلق':'Anxious']].map(function(v){return X.el('option',{value:v[0],text:v[1],selected:meta.mood===v[0]});}));var date=X.el('input',{type:'date',value:day,'aria-label':X.lang()==='bn'?'ডায়েরির তারিখ':X.lang()==='ar'?'تاريخ اليوميات':'Diary date'});date.onchange=function(){if(date.value)window.MHSJournal.open(date.value);};var event=X.el('input',{value:meta.event||'',maxlength:160,placeholder:X.lang()==='bn'?'বিশেষ দিন / উপলক্ষ':X.lang()==='ar'?'يوم خاص / مناسبة':'Special day / occasion','aria-label':X.lang()==='bn'?'বিশেষ দিন':X.lang()==='ar'?'يوم خاص':'Special day'});function save(){all[day]={mood:mood.value,event:event.value.trim()};X.set('journalDays',all);}mood.onchange=save;event.oninput=save;box.append(date,mood,event,X.el('button',{type:'button',class:'mhs-btn',text:X.lang()==='bn'?'বুকমার্ক':X.lang()==='ar'?'حفظ':'Bookmark',on:{click:function(){window.MHSCollections.choose({id:'j:'+day,kind:'journal',day:day,title:day,sub:event.value});}}}));host.appendChild(box);};
window.MHSJournalCalendarMark=function(button,day){var m=X.get('journalDays',{})[day];if(!m)return;if(m.event){button.classList.add('has-special-day');button.title=m.event;button.appendChild(X.el('small',{text:'•','aria-label':m.event}));}if(m.mood){button.dataset.mood=m.mood;button.appendChild(X.el('span',{class:'mhs-j-mood-dot','aria-hidden':'true',text:({happy:'◉',grateful:'✦',calm:'◌',sad:'☂',anxious:'≈'})[m.mood]||'•'}));button.setAttribute('aria-label',button.getAttribute('aria-label')+' · '+m.mood+(m.event?' · '+m.event:''));}};
// Replace purchase entry points with donations without changing account sign-in APIs.
function donateButtons(){document.querySelectorAll('.mhs-pro-btn').forEach(function(b){if(b.dataset.donation)return;b.dataset.donation='1';b.textContent='Donate';b.setAttribute('aria-label','Donate');b.addEventListener('click',function(e){e.preventDefault();e.stopImmediatePropagation();if(window.MuhasabahDonate)window.MuhasabahDonate.open();},true);});}
new MutationObserver(donateButtons).observe(document.body,{childList:true,subtree:true});donateButtons();
})();
