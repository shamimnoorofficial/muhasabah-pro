/* Mini-app configuration, collections and offline reader controls.
 * Structured state uses MHSX and the existing Netlify Database account backup. */
(function () {
  'use strict';
  var X = window.MHSX;
  function tr(en,bn,ar) { return X.lang()==='bn'?bn:X.lang()==='ar'?(ar||en):en; }
  function button(label,run,icon) { return X.el('button',{type:'button',class:'mhs-btn','aria-label':label,on:{click:run}},icon?[X.icon(icon)]:[label]); }
  var gear='M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2Z|M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z';
  var down='M12 3v12|M7 10l5 5 5-5|M4 17v4h16v-4';
  function collections(){ var c=X.get('collections',{names:['Saved'],items:{}}); if(!Array.isArray(c.names)||!c.names.length)c.names=['Saved']; c.items=c.items||{}; return c; }
  function cname(n){ return n==='Saved'?tr('Saved','সংরক্ষিত','المحفوظات'):n; }
  var KIND_ICON={quran:'📖',hadith:'📚',seerah:'🕌',wisdom:'🕯️',reminder:'💡',dua:'🤲',amol:'⭐',name:'✨',journal:'✍️'};
  /* Save anything (ayah, hadith, Seerah page, wisdom, diary day…) into a collection. Pick an existing
   * collection or create one inline; saving again moves it; "Remove" takes it out of collections. */
  function choose(item, opts) {
    opts=opts||{};
    var c=collections(), existing=c.items[item.id], picked=existing?existing.collection:(X.get('collectionLast','')&&c.names.indexOf(X.get('collectionLast',''))>=0?X.get('collectionLast',''):c.names[0]);
    var sh=X.sheet({id:'mhs-collection-picker',title:existing?tr('Saved in a collection','কালেকশনে সংরক্ষিত','محفوظ في مجموعة'):tr('Save to collection','কালেকশনে রাখুন','حفظ في مجموعة'),sub:item.sub?String(item.sub).slice(0,80):''});
    sh.body.classList.add('mhs-col');
    var preview=X.el('div',{class:'mhs-col-preview'},[X.el('span',{class:'ic','aria-hidden':'true',text:KIND_ICON[item.kind]||'🔖'}),X.el('b',{text:String(item.title||'').slice(0,140)})]);
    var list=X.el('div',{class:'mhs-col-list',role:'radiogroup','aria-label':tr('Collections','কালেকশন','المجموعات')});
    function count(n){return Object.keys(c.items).filter(function(k){return c.items[k].collection===n;}).length;}
    function draw(){
      list.replaceChildren();
      c.names.forEach(function(n){
        var on=n===picked;
        list.appendChild(X.el('button',{type:'button',role:'radio','aria-checked':String(on),class:'mhs-col-opt'+(on?' is-on':''),on:{click:function(){picked=n;draw();}}},[X.el('span',{class:'mhs-col-check','aria-hidden':'true'}),X.el('span',{class:'nm',text:cname(n)}),X.el('small',{text:X.num(count(n))})]));
      });
    }
    var name=X.el('input',{placeholder:tr('New collection name','নতুন কালেকশনের নাম','اسم مجموعة جديدة'),'aria-label':tr('New collection','নতুন কালেকশন','مجموعة جديدة'),maxlength:60,enterkeyhint:'done'});
    function create(){var n=name.value.trim().replace(/\s+/g,' ');if(!n)return;if(c.names.indexOf(n)<0)c.names.push(n);picked=n;name.value='';draw();X.haptic(8);}
    name.addEventListener('keydown',function(e){if(e.key==='Enter'){e.preventDefault();create();}});
    var add=X.el('div',{class:'mhs-col-new'},[name,X.el('button',{type:'button',class:'mhs-btn',text:'＋ '+tr('Create','তৈরি করুন','إنشاء'),on:{click:create}})]);
    var save=X.el('button',{type:'button',class:'mhs-btn primary mhs-col-save',text:tr('Save','সংরক্ষণ','حفظ'),on:{click:function(){
      if(name.value.trim())create();
      c.items[item.id]=Object.assign({},item,{collection:picked,at:existing&&existing.collection===picked?existing.at:Date.now()});
      X.set('collections',c);X.set('collectionLast',picked);sh.close();
      if(window.MHSSaveFX&&window.MHSSaveFX.flash)window.MHSSaveFX.flash({message:tr('Saved to ','সংরক্ষিত: ','تم الحفظ في ')+cname(picked)});else X.toast(tr('Saved to ','সংরক্ষিত: ','تم الحفظ في ')+cname(picked));
      if(opts.onDone)opts.onDone(true);
    }}});
    var remove=existing?X.el('button',{type:'button',class:'mhs-btn mhs-col-remove',text:tr('Remove bookmark','বুকমার্ক সরান','إزالة الحفظ'),on:{click:function(){delete c.items[item.id];X.set('collections',c);sh.close();X.toast(tr('Removed','সরানো হয়েছে','تمت الإزالة'));if(opts.onDone)opts.onDone(false);}}}):null;
    draw();
    sh.body.append(preview,X.el('h3',{class:'mhs-col-h',text:tr('Choose a collection','একটি কালেকশন বেছে নিন','اختر مجموعة')}),list,add,X.el('div',{class:'mhs-col-actions'},[remove,save]));
  }
  function renameCollection(from,to){var c=collections();to=String(to||'').trim();if(!to||from===to||c.names.indexOf(to)>=0)return false;c.names=c.names.map(function(n){return n===from?to:n;});Object.keys(c.items).forEach(function(k){if(c.items[k].collection===from)c.items[k].collection=to;});X.set('collections',c);return true;}
  function deleteCollection(n){var c=collections();c.names=c.names.filter(function(x){return x!==n;});if(!c.names.length)c.names=['Saved'];Object.keys(c.items).forEach(function(k){if(c.items[k].collection===n)c.items[k].collection=c.names[0];});X.set('collections',c);}
  window.MHSCollections={choose:choose,names:function(){return collections().names.slice();},label:cname,rename:renameCollection,removeCollection:deleteCollection,has:function(id){return !!collections().items[id];},collect:function(){var c=collections();return Object.keys(c.items).map(function(id){var i=c.items[id];return Object.assign({},i,{go:function(){if(i.kind==='journal')window.MHSJournal.open(i.day);else if(i.kind==='seerah')window.MHSSeerah.open({page:i.page,edition:i.edition||'english-issam-diab-v1'});else if(i.kind==='quran')window.MHSQuran.open({surah:i.s,ayah:i.a});else if(i.kind==='hadith')window.MHSHadith.open({book:i.b,number:i.n});else if(i.kind==='wisdom')window.MHSWisdomApp.open({id:i.sourceId});else if(['dua','amol','name'].indexOf(i.kind)>=0)window.MHSKnowledge.open({tab:{dua:'duas',amol:'amol',name:'names'}[i.kind],id:i.sourceId});else window.MHSReminder.open({id:id.slice(1)});},remove:function(){var c=collections();delete c.items[id];X.set('collections',c);}});});}};

  /* ---------- Shared top navigation for every mini-app ----------
   * The same icon bar as the Seerah reader: Contents · Search · Bookmarks · Settings · Download,
   * always in that order, followed by any app-specific action (calculator, add your own…).
   * Each app only shows the items that make sense for it. */
  var NAV_ICON={toc:'M8 6h13|M8 12h13|M8 18h13|M3 6h.01|M3 12h.01|M3 18h.01',search:'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14Z|M21 21l-4.3-4.3',marks:'M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2Z',settings:gear,offline:down};
  var NAV_ORDER=['toc','search','marks','settings','offline'];
  function navLabel(k,id){
    if(k==='toc')return tr('Contents','সূচিপত্র','الفهرس');
    if(k==='search')return id==='mhs-quran'?tr('Search the Quran','কুরআনে খুঁজুন','ابحث في القرآن'):id==='mhs-hadith'?tr('Search hadith','হাদিস খুঁজুন','ابحث في الحديث'):tr('Search','খুঁজুন','بحث');
    if(k==='marks')return tr('Bookmarks','বুকমার্ক','المحفوظات');
    if(k==='settings')return tr('Settings','সেটিংস','الإعدادات');
    return tr('Download for offline','অফলাইনের জন্য ডাউনলোড','تنزيل دون اتصال');
  }
  function Lx(o){if(!o)return '';if(typeof o==='string')return o;return o[X.lang()]||o.en||o.bn||'';}
  function bodyOf(d){return d.querySelector('.mhs-mini-body');}
  /* Focus the app's own search field (after an optional re-render). */
  function focusSearch(d,before){
    if(before)before();
    var n=0;(function find(){var b=bodyOf(d),i=b&&b.querySelector('input[type=search],input[role=searchbox],.mhs-search input');
      if(i){i.scrollIntoView({block:'center',behavior:'smooth'});try{i.focus({preventScroll:true});}catch(e){i.focus();}if(i.select)i.select();return;}
      if(++n<20)setTimeout(find,80);else X.toast(tr('Search is not available here','এখানে খোঁজার সুবিধা নেই','البحث غير متاح هنا'));})();
  }
  /* A contents sheet: titled groups of rows; picking a row closes the sheet and runs it. */
  function contents(title,groups){
    var sh=X.sheet({id:'mhs-nav-contents',title:tr('Contents','সূচিপত্র','الفهرس'),sub:title});
    sh.body.classList.add('mhs-nav-toc');
    groups.forEach(function(g){
      if(!g.rows.length)return;
      if(g.title)sh.body.appendChild(X.el('h3',{class:'mhs-nav-toc-h',text:g.title}));
      var list=X.el('div',{class:'mhs-nav-toc-list'});
      g.rows.forEach(function(r){list.appendChild(X.el('button',{type:'button',class:'mhs-nav-toc-row'+(r.on?' is-on':''),'aria-current':r.on?'true':null,on:{click:function(){sh.close();setTimeout(r.run,60);}}},[r.icon?X.el('span',{class:'ic','aria-hidden':'true',text:r.icon}):null,X.el('b',{text:r.label}),r.count!=null?X.el('small',{text:X.num(r.count)}):null]));});
      sh.body.appendChild(list);
    });
    return sh;
  }
  /* Contents for apps without their own index: one row per tab of the app. */
  function tabContents(d){
    var tabs=[].slice.call(d.querySelectorAll('.mhs-mini-body [role=tab]')),title=(d.querySelector('.mhs-mini-head .ttl')||{}).textContent||'';
    contents(title,[{rows:tabs.map(function(tb,i){return {label:tb.textContent.trim(),on:tb.getAttribute('aria-selected')==='true'||tb.classList.contains('is-on'),run:function(){var now=d.querySelectorAll('.mhs-mini-body [role=tab]')[i]||tb;now.click();now.scrollIntoView({block:'nearest',inline:'center'});var b=bodyOf(d);if(b)b.scrollTop=0;}};})}]);
  }
  function knowledgeContents(){
    var K=window.MHSKnowledge;if(!K)return;
    Promise.all(['duas','amol'].map(function(n){return K.load(n).catch(function(){return null;});})).then(function(r){
      var duas=r[0]||{},amol=r[1]||{};
      function rows(j,tab,key){return (j[key]||[]).map(function(c){return {icon:c.icon||'•',label:Lx(c),count:(j.items||[]).filter(function(x){return (x.cat||x.g)===c.id;}).length,run:function(){K.open({tab:tab,cat:c.id});}};});}
      contents(K.t('title'),[
        {title:'🤲 '+K.t('duas'),rows:[{icon:'📚',label:K.t('all'),count:(duas.items||[]).length,run:function(){K.open({tab:'duas',cat:''});}}].concat(rows(duas,'duas','categories'))},
        {title:'⭐ '+K.t('amol'),rows:[{icon:'📚',label:K.t('all'),count:(amol.items||[]).length,run:function(){K.open({tab:'amol',cat:''});}}].concat(rows(amol,'amol','groups'))},
        {title:'✨ '+K.t('names'),rows:[{icon:'✨',label:K.t('names'),count:99,run:function(){K.open({tab:'names'});}}]},
        {title:'♥ '+K.t('saved'),rows:[{icon:'♥',label:K.t('saved'),run:function(){K.open({tab:'saved'});}}]}
      ]);
    });
  }
  function wisdomContents(){
    var W=window.MHSWisdomApp;if(!W)return;
    W.load().then(function(j){
      var items=(j.items||[]).concat(W.custom?W.custom():[]),count=function(f){return items.filter(f).length;};
      var authors=(j.authors||[]).map(function(a){return {label:Lx(a),count:count(function(x){return x.author===a.id;}),run:function(){W.open({author:a.id});}};}).filter(function(r){return r.count>0;}).sort(function(a,b){return b.count-a.count;});
      contents(W.t('title'),[
        {rows:[{icon:'📚',label:W.t('all'),count:items.length,run:function(){W.open({all:true});}},{icon:'♥',label:W.t('saved'),run:function(){W.open({saved:true});}}]},
        {title:W.t('cats'),rows:(j.categories||[]).map(function(c){return {icon:c.icon||'•',label:Lx(c),count:count(function(x){return x.cat===c.id;}),run:function(){W.open({cat:c.id});}};})},
        {title:W.t('authors'),rows:authors}
      ]);
    }).catch(function(){X.toast(tr('Not downloaded yet. Connect to the internet once.','এখনো ডাউনলোড হয়নি। একবার ইন্টারনেট সংযোগ দিন।','لم يُنزَّل بعد. اتصل بالإنترنت مرة.'));});
  }
  function reminderContents(){
    var R=window.MHSReminder;if(!R)return;var cur=R.current?R.current():'all';
    contents(R.t('title'),[{rows:[['all','🌿',R.t('all')],['verse','📖',R.t('verse')],['hadith','📚',R.t('hadith')],['quote','💡',R.t('quote')],['dua','🤲',R.t('dua')],['favs','♥',R.t('favs')],['mine','✍️',R.t('mine')]].map(function(o){return {icon:o[1],label:o[2],on:cur===o[0],run:function(){R.filter(o[0]);}};})}]);
  }
  /* Search across everything the Reminder feed can show; a result opens in the Reminder. */
  function reminderSearch(){
    var R=window.MHSReminder;if(!R)return;
    var sh=X.sheet({id:'mhs-nav-search',title:tr('Search reminders','স্মরণে খুঁজুন','ابحث في التذكير')});
    sh.body.classList.add('mhs-nav-toc');
    var input=X.el('input',{type:'search',class:'mhs-nav-search-in',placeholder:tr('Verse, hadith, dua, wisdom…','আয়াত, হাদিস, দোয়া, হিকমাহ…','آية، حديث، دعاء، حكمة…'),'aria-label':tr('Search','খুঁজুন','بحث'),enterkeyhint:'search'});
    var out=X.el('div',{class:'mhs-nav-toc-list',role:'list'}),status=X.el('p',{class:'mhs-nav-search-status',role:'status'});
    sh.body.append(input,status,out);
    var pool=[];(R.load?R.load():Promise.resolve()).then(function(){pool=R.pool().filter(function(x){return x.kind!=='journal';});run();});
    function norm(v){return String(v||'').toLocaleLowerCase().normalize('NFKD').replace(/[ً-ٰٟۖ-ۭ]/g,'');}
    function run(){
      var q=norm(input.value.trim());out.replaceChildren();
      if(q.length<2){status.textContent=tr('Type at least two letters.','অন্তত দুটি অক্ষর লিখুন।','اكتب حرفين على الأقل.');return;}
      var hits=pool.filter(function(x){return norm(x.text+' '+(x.src||'')+' '+(x.ar||'')+' '+(x.tags||[]).join(' ')).indexOf(q)>=0;}).slice(0,60);
      status.textContent=hits.length?tr(hits.length+' results',X.num(hits.length)+'টি ফলাফল',X.num(hits.length)+' نتيجة'):tr('Nothing found.','কিছু পাওয়া যায়নি।','لا نتائج.');
      hits.forEach(function(h){out.appendChild(X.el('button',{type:'button',class:'mhs-nav-toc-row is-result',role:'listitem',on:{click:function(){sh.close();setTimeout(function(){R.open({id:h.id});},60);}}},[X.el('b',{text:String(h.text).slice(0,140)}),X.el('small',{text:h.src||''})]));});
    }
    var tm;input.addEventListener('input',function(){clearTimeout(tm);tm=setTimeout(run,160);});
    setTimeout(function(){input.focus();},80);
  }
  function openMarks(){if(window.MHSBookmarks)window.MHSBookmarks.open();}
  function readerSettings(d){return function(){settings(d);};}
  function offlineFor(d){return function(){download(d);};}
  /* Per-app wiring. `own(button)` names an existing toolbar button the app already renders. */
  var NAV={
    'mhs-quran':{toc:function(){window.MHSQuran.show('list');},search:function(){window.MHSQuranSearch&&window.MHSQuranSearch.open();},marks:function(){window.MHSQuran.show('marks');},settings:'reader',offline:true},
    'mhs-hadith':{toc:function(){window.MHSHadith.show('books');},search:function(){window.MHSHadithSearch&&window.MHSHadithSearch.open();},marks:function(){window.MHSHadith.show('marks');},settings:'reader',offline:true},
    'mhs-knowledge':{toc:knowledgeContents,search:function(d){focusSearch(d,function(){if(d.querySelector('.mhs-kh-tab.is-on')&&!d.querySelector('.mhs-mini-body input[type=search]'))window.MHSKnowledge.open({tab:'duas'});});},marks:function(){window.MHSKnowledge.open({tab:'saved'});},settings:'reader',offline:true},
    'mhs-wisdomapp':{toc:wisdomContents,search:function(d){focusSearch(d);},marks:function(){window.MHSWisdomApp.open({saved:true});},settings:'reader',offline:true,keep:function(b){return window.MHSWisdomApp&&b.getAttribute('aria-label')===window.MHSWisdomApp.t('add');}},
    'mhs-wisdom':{toc:reminderContents,search:reminderSearch,marks:openMarks,settings:'own',offline:true,keep:function(b){return window.MHSReminder&&b.getAttribute('aria-label')===window.MHSReminder.t('add');}},
    'mhs-zikr':{toc:'tabs'},
    'mhs-amol':{toc:'tabs',marks:openMarks},
    'mhs-notes':{toc:'tabs',search:function(d){focusSearch(d);},keepAll:true},
    'mhs-hisab':{toc:'tabs',keepAll:true},
    'mhs-bookmarks':{toc:'tabs',search:function(d){focusSearch(d);},keepAll:true},
    'mhs-prayerhub':{toc:'tabs',settings:'own',keepAll:true},
    'mhs-essential':{toc:'tabs',search:'auto',marks:openMarks,keepAll:true}
  };
  function isSettingsButton(b){var l=b.getAttribute('aria-label')||b.getAttribute('title')||'';return b.classList.contains('mhs-settings-trigger')||/settings|সেটিংস|إعدادات/i.test(l);}
  function navButton(k,d,run){var l=navLabel(k,d.id),b=X.el('button',{type:'button',class:'mhs-mini-ib mhs-nav-ib','aria-label':l,title:l,on:{click:function(){run(d);}}},[X.icon(NAV_ICON[k])]);b.dataset.navItem=k;if(k==='settings')b.dataset.readerSettings='1';if(k==='offline')b.dataset.offline='1';return b;}
  function navDecorate(d,spec){
    var tools=d.querySelector('.mhs-mini-tools');if(!tools)return;
    if(!tools.dataset.nav)tools.dataset.nav='1';
    var body=bodyOf(d),have={},extras=[];
    [].slice.call(tools.children).forEach(function(c){
      var k=c.dataset.navItem;
      if(k&&k!=='extra'&&k!=='hide'){if(have[k])c.remove();else have[k]=c;return;}
      if(k==='extra'){extras.push(c);return;}if(k==='hide')return;
      // Classify a button the app rendered itself.
      if(spec.settings==='own'&&!have.settings&&c.tagName==='BUTTON'&&isSettingsButton(c)){c.dataset.navItem='settings';have.settings=c;return;}
      if((spec.keepAll&&c.tagName==='BUTTON')||(spec.keep&&spec.keep(c))){c.dataset.navItem='extra';extras.push(c);return;}
      c.dataset.navItem='hide';
    });
    NAV_ORDER.forEach(function(k){
      var want=spec[k];if(!want||have[k])return;
      var run=null;
      if(k==='toc')run=want==='tabs'?(body&&body.querySelectorAll('[role=tab]').length>1?tabContents:null):want;
      else if(k==='search')run=want==='auto'?(body&&body.querySelector('input[type=search]')?function(x){focusSearch(x);}:null):want;
      else if(k==='settings')run=want==='reader'?function(x){settings(x);}:null;
      else if(k==='offline')run=function(x){download(x);};
      else run=want;
      if(run)have[k]=navButton(k,d,run);
    });
    var order=NAV_ORDER.map(function(k){return have[k];}).filter(Boolean).concat(extras);
    var visible=[].slice.call(tools.children).filter(function(c){return c.dataset.navItem!=='hide';});
    if(visible.length===order.length&&visible.every(function(c,i){return c===order[i];}))return;
    order.forEach(function(c){tools.appendChild(c);});
  }
  // Give all reader mini-apps a single compact settings popover.
  function decorate(dialog) {
    var tools=dialog.querySelector('.mhs-mini-tools');if(!tools)return;
    var id=dialog.id;
    if(NAV[id])return navDecorate(dialog,NAV[id]);
    if(id==='mhs-collection-picker'||id==='mhs-reader-settings'||id==='mhs-offline-download')return;
    if(['mhs-quran','mhs-hadith','mhs-knowledge','mhs-wisdom-app','mhs-seerah'].indexOf(id)>=0&&!tools.querySelector('[data-reader-settings]')){
      var b=button(tr('Settings','সেটিংস','الإعدادات'),function(){settings(dialog);},gear);b.className='mhs-mini-ib';b.dataset.readerSettings='1';tools.appendChild(b);
    }
    if(['mhs-quran','mhs-hadith','mhs-knowledge','mhs-wisdom-app','mhs-wisdom','mhs-seerah'].indexOf(id)>=0&&!tools.querySelector('[data-offline]')){
      var d=button(tr('Download for offline','অফলাইনের জন্য ডাউনলোড','تنزيل دون اتصال'),function(){download(dialog);},down);d.className='mhs-mini-ib';d.dataset.offline='1';tools.appendChild(d);
    }
  }

  /* Quran Rasm (mushaf script / khatt). Five complete scripts, each with matching text and font:
   *  - Uthmani · Madani: King Fahd Complex print (KFGQPC Uthmanic Hafs font, Uthmani orthography).
   *  - Indo-Pak: South Asian print (IndoPak Nastaleeq font, Indo-Pak orthography from Quran.com with
   *    standing fatha, inverted damma and waqf marks).
   *  - Tajweed: the Madani text colour-coded by tajweed rule (Quran.com tajweed markup).
   *  - Naskh: the classic Egyptian / Ottoman naskh mushaf hand (Amiri Quran font, Uthmani text).
   *  - Imla'i: modern standard spelling, easiest for learners (Scheherazade New, Quran.com Imla'i text).
   * The Uthmani text ships with the reader; the others download once per surah and then work offline. */
  var RASM={
    uthmani:{font:"'KFGQPC Uthmanic Hafs'"},
    indopak:{font:"'IndoPak Nastaleeq'",src:'indopak',field:'text_indopak'},
    tajweed:{font:"'KFGQPC Uthmanic Hafs'",src:'uthmani_tajweed',field:'text_uthmani_tajweed',html:true},
    naskh:{font:"'Amiri Quran'"},
    imlaei:{font:"'Scheherazade New'",src:'imlaei',field:'text_imlaei'}
  };
  var RASM_ORDER=['uthmani','indopak','tajweed','naskh','imlaei'];
  var SOUTH_ASIA=/^(bn|ur|hi|ps|sd|ne|as|pa|gu|ks)$/;
  function defaultRasm(){var tz='',l=window.MHSLocale||X.lang();try{tz=Intl.DateTimeFormat().resolvedOptions().timeZone||'';}catch(e){}return SOUTH_ASIA.test(String(l).split('-')[0])||/^Asia\/(Dhaka|Kolkata|Calcutta|Karachi|Kathmandu|Thimphu|Colombo)$/.test(tz)?'indopak':'uthmani';}
  function rasm(){var r=X.get('quranRasm',null);return RASM[r]?r:defaultRasm();}
  function quranFont(p){return p&&p.arabic&&p.arabic!=='mushaf'?"'"+p.arabic+"'":RASM[rasm()].font;}
  function ensureWebFont(name){if(name!=='Noto Naskh Arabic'||document.getElementById('mhs-font-naskh'))return;document.head.appendChild(X.el('link',{id:'mhs-font-naskh',rel:'stylesheet',href:'https://fonts.googleapis.com/css2?family=Noto+Naskh+Arabic:wght@400;700&display=swap'}));}
  var textMem={},textBusy={};
  function clean(s){return String(s||'').replace(/[​‎‏]/g,'').replace(/\s+/g,' ').trim();}
  /* Ayah texts of one surah in one script → {ayah: text}. Cached in the offline library. */
  function fetchText(kind,s){
    var R=RASM[kind];if(!R||!R.src)return Promise.reject(Error('builtin'));
    var key=kind+':'+s;if(textMem[key])return Promise.resolve(textMem[key]);
    var url='https://api.quran.com/api/v4/quran/verses/'+R.src+'?chapter_number='+s;
    var c=('caches' in window)?caches.open('mhs-library'):Promise.resolve(null);
    return c.then(function(cache){return (cache?cache.match(url):Promise.resolve(null)).then(function(hit){
      if(hit)return hit.json();
      return fetch(url).then(function(r){if(!r.ok)throw Error('http');if(cache)cache.put(url,r.clone());return r.json();});
    });}).then(function(j){var m={};(j.verses||[]).forEach(function(v){var a=Number(String(v.verse_key).split(':')[1]);m[a]=R.html?String(v[R.field]||''):clean(v[R.field]);});if(!Object.keys(m).length)throw Error('empty');textMem[key]=m;return m;});
  }
  function fetchIndo(s){return fetchText('indopak',s);}
  /* Tajweed markup → coloured spans. Only <tajweed class=…> and the ayah-end marker are expected;
   * everything is inserted as text, never as HTML. */
  function tajweedNodes(markup){
    var frag=document.createDocumentFragment(),re=/<tajweed class=["']?([a-z_]+)["']?>([^<]*)<\/tajweed>|<span class=["']?end["']?>[^<]*<\/span>|<[^>]*>|([^<]+)/g,m;
    while((m=re.exec(markup))){
      if(m[1])frag.appendChild(X.el('span',{class:'tj tj-'+m[1],'data-rule':m[1],text:m[2]}));
      else if(m[3])frag.appendChild(document.createTextNode(m[3]));
    }
    return frag;
  }
  var BISM={uthmani:'بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ',indopak:'بِسۡمِ اللّٰهِ الرَّحۡمٰنِ الرَّحِيۡمِ',tajweed:'بِسْمِ <tajweed class=ham_wasl>ٱ</tajweed>للَّهِ <tajweed class=ham_wasl>ٱ</tajweed><tajweed class=laam_shamsiyah>ل</tajweed>رَّحْمَ<tajweed class=madda_normal>ـٰ</tajweed>نِ <tajweed class=ham_wasl>ٱ</tajweed><tajweed class=laam_shamsiyah>ل</tajweed>رَّح<tajweed class=madda_permissible>ِي</tajweed>مِ',naskh:'بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ',imlaei:'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ'};
  function setBism(node,kind){node.dataset.rasm=kind;if(RASM[kind].html)node.replaceChildren(tajweedNodes(BISM[kind]));else node.textContent=BISM[kind];}
  /* The ayah text lives in a wrapper span inside .ar so the ayah number and tools stay untouched. */
  function holder(el){
    var ar=el.querySelector('.ar');if(!ar)return null;
    var w=ar.querySelector(':scope > .mhs-q-rt');if(w)return w;
    var node=ar.firstChild;if(!node||node.nodeType!==3)return null;
    w=X.el('span',{class:'mhs-q-rt'});el.dataset.uth=node.textContent.trim();w.textContent=node.textContent;ar.replaceChild(w,node);return w;
  }
  function put(el,kind,text){var w=holder(el);if(!w)return;if(RASM[kind].html)w.replaceChildren(tajweedNodes(text),document.createTextNode(' '));else w.textContent=text+' ';el.dataset.rasm=kind;}
  var offlineNoted=false;
  function rasmText(d){
    var want=rasm();d.dataset.rasm=want;
    var bism=d.querySelector('.mhs-q-bismillah');if(bism&&bism.dataset.rasm!==want)setBism(bism,want);
    var groups={};
    d.querySelectorAll('.mhs-q-ayah[data-s]').forEach(function(el){
      if(!el.dataset.rasm)el.dataset.rasm='uthmani';
      if(el.dataset.rasm===want)return;
      if(!holder(el))return;
      if(!RASM[want].src){put(el,want,el.dataset.uth||'');return;}
      (groups[el.dataset.s]=groups[el.dataset.s]||[]).push(el);
    });
    Object.keys(groups).forEach(function(s){
      var k=want+':'+s;if(textBusy[k])return;textBusy[k]=1;
      fetchText(want,s).then(function(m){groups[s].forEach(function(el){var a=Number(el.dataset.a);if(rasm()!==want||!m[a])return;put(el,want,m[a]);});d.dataset.rasmOffline='';})
      .catch(function(){d.dataset.rasmOffline='1';groups[s].forEach(function(el){if(el.dataset.rasm!=='uthmani'&&el.dataset.uth)put(el,'uthmani',el.dataset.uth);});if(!offlineNoted){offlineNoted=true;X.toast(tr('This script needs the internet once per surah. Showing the Uthmani text for now.','এই লিপি প্রতিটি সূরার জন্য একবার ইন্টারনেট লাগে। আপাতত উসমানি লিপি দেখানো হচ্ছে।','يحتاج هذا الخط إلى الإنترنت مرة لكل سورة. يُعرض النص العثماني الآن.'));}})
      .then(function(){delete textBusy[k];});
    });
  }
  window.MHSRasm={get:rasm,list:RASM_ORDER.slice(),set:function(r){if(!RASM[r])return;X.set('quranRasm',r);offlineNoted=false;document.querySelectorAll('dialog#mhs-quran[open]').forEach(function(d){var p=X.get('reader:mhs-quran',null)||{size:20,arabic:'mushaf'};applyReader(d,p);rasmText(d);});},font:function(){return RASM[rasm()].font;},indopak:fetchIndo,text:fetchText,needsDownload:function(r){return !!(RASM[r||rasm()]||{}).src;}};
  function rasmPicker(dialog){
    var cur=rasm();
    var opts=[
      {k:'uthmani',t:tr('Uthmani · Madani','উসমানি · মাদানি','العثماني · المدني'),d:tr('King Fahd Complex print · 15 lines · popular for hifz','কিং ফাহাদ কমপ্লেক্সের মুদ্রণ · ১৫ লাইন · হিফজের জন্য জনপ্রিয়','مصحف مجمع الملك فهد · ١٥ سطراً · الأشهر للحفظ')},
      {k:'indopak',t:tr('Indo-Pak','ইন্দো-পাক','الهندي الباكستاني'),d:tr('South Asian print · 13 lines · clear vowels and waqf marks','দক্ষিণ এশীয় মুদ্রণ · ১৩ লাইন · স্পষ্ট হরকত ও ওয়াকফ চিহ্ন','طبعة جنوب آسيا · ١٣ سطراً · حركات وعلامات وقف واضحة')},
      {k:'tajweed',t:tr('Tajweed (colour-coded)','তাজবিদ (রঙিন)','مصحف التجويد الملوّن'),d:tr('Madani text with each tajweed rule in its own colour','মাদানি লিপিতে প্রতিটি তাজবিদের নিয়ম আলাদা রঙে','النص المدني مع تلوين أحكام التجويد')},
      {k:'naskh',t:tr('Naskh','নাসখ','النسخ'),d:tr('Classic Egyptian / Ottoman mushaf hand','ক্লাসিক মিসরীয় / উসমানীয় মুসহাফের হস্তলিপি','خط المصاحف المصرية والعثمانية الكلاسيكي')},
      {k:'imlaei',t:tr("Imla'i (simple spelling)",'ইমলায়ি (সহজ বানান)','الإملائي'),d:tr('Modern standard spelling · easiest for learners','আধুনিক প্রচলিত বানান · নতুনদের জন্য সহজ','الرسم الإملائي الحديث · الأسهل للمتعلمين')}
    ];
    var box=X.el('fieldset',{class:'mhs-rasm'},[X.el('legend',{text:tr('Mushaf script (Rasm / Khatt)','মুসহাফ লিপি (রসম / খাত্ত)','رسم المصحف (الخط)')})]);
    opts.forEach(function(o){
      var input=X.el('input',{type:'radio',name:'mhs-rasm',value:o.k,checked:o.k===cur?true:null,on:{change:function(){window.MHSRasm.set(o.k);}}});
      var sample=X.el('span',{class:'mhs-rasm-sample',lang:'ar',dir:'rtl','aria-hidden':'true'});setBism(sample,o.k);
      box.appendChild(X.el('label',{class:'mhs-rasm-opt','data-rasm':o.k},[input,sample,X.el('b',{text:o.t}),X.el('small',{text:o.d})]));
    });
    box.appendChild(X.el('p',{class:'mhs-settings-intro',text:tr('Indo-Pak, Tajweed and Imla\'i texts download per surah the first time and then work offline. Uthmani and Naskh work offline right away.','ইন্দো-পাক, তাজবিদ ও ইমলায়ি লিপি প্রতিটি সূরার জন্য প্রথমবার ডাউনলোড হয়, এরপর অফলাইনে চলে। উসমানি ও নাসখ শুরু থেকেই অফলাইনে চলে।','تُنزَّل نصوص الهندي والتجويد والإملائي لكل سورة أول مرة ثم تعمل دون اتصال. العثماني والنسخ يعملان دون اتصال فوراً.')}));
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
    if(['mhs-quran','mhs-hadith','mhs-knowledge','mhs-wisdomapp'].indexOf(dialog.id)>=0)sh.body.append(X.el('label',{class:'mhs-setting-row','for':'mhs-reader-font'},[tr('Arabic typeface','আরবি টাইপফেস','نوع الخط العربي'),font]));
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
    if(dialog.id==='mhs-quran')sh.body.appendChild(button(tr('All 114 surahs · selected language','সব ১১৪ সূরা · নির্বাচিত ভাষা','١١٤ سورة · اللغة المحددة'),function(){run(Array.from({length:114},function(_,i){return function(){return window.MHSQuran.download(i+1).then(function(r){return RASM[rasm()].src?fetchText(rasm(),i+1).then(function(){return r;}):r;});};}));}));
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
      this.replaceChildren(this.prayer,this.summary,this.apps,this.feed);
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
window.MHSQuickTodo=function(mode){
  var X=window.MHSX,lang=X.lang(),tr=function(en,bn,ar){return lang==='bn'?bn:lang==='ar'?ar:en;};
  var sh=X.sheet({id:'mhs-quick-todo',title:tr('Quick add','দ্রুত যোগ','إضافة سريعة')});
  var kind=mode==='list'?'list':X.get('quickAddMode','task')==='list'?'list':'task';
  var tabs=X.el('div',{class:'mhs-cl-seg',role:'tablist','aria-label':tr('What to add','কী যোগ করবেন','ماذا تضيف')});
  var body=X.el('div');
  function draw(){
    tabs.replaceChildren();
    [['task','✓ '+tr('To-do','টু-ডু','مهمة')],['list','☑ '+tr('Checklist','চেকলিস্ট','قائمة تحقق')]].forEach(function(o){tabs.appendChild(X.el('button',{type:'button',role:'tab','aria-selected':String(kind===o[0]),class:kind===o[0]?'is-on':'',text:o[1],on:{click:function(){kind=o[0];X.set('quickAddMode',kind);draw();}}}));});
    body.replaceChildren();
    if(kind==='list'&&window.MHSChecklists){
      var c=window.MHSChecklists.composer();body.appendChild(c.el);
      body.appendChild(X.el('div',{class:'mhs-actions'},[X.el('button',{type:'button',class:'mhs-btn primary',text:'＋ '+tr('Add list','তালিকা যোগ করুন','إضافة القائمة'),on:{click:function(){if(window.MHSChecklists.add(c.value())){sh.close();if(window.MHSApp&&window.MHSApp.nav)window.MHSApp.nav('today');}}}})]));
      c.focus();return;
    }
    var input=X.el('input',{placeholder:tr('A task for today','আজকের কাজ','مهمة لليوم'),required:true,minlength:2,maxlength:200,'aria-label':tr('Task title','কাজের নাম','عنوان المهمة'),enterkeyhint:'done'});
    var form=X.el('form',{class:'mhs-quick-todo-form',on:{submit:function(e){e.preventDefault();if(window.MHSApp.addTodo(input.value)){sh.close();X.toast(tr('To-do added','টু-ডু যোগ হয়েছে','تمت إضافة المهمة'));}}}},[input,X.el('button',{type:'submit',class:'mhs-btn primary',text:tr('Add','যোগ করুন','إضافة')})]);
    body.appendChild(form);
    // Points, deadline and repeat live in the full form; keep it one tap away.
    if(window.MHSApp&&window.MHSApp.newTodo)body.appendChild(X.el('button',{type:'button',class:'mhs-chip mhs-quick-todo-more',text:tr('More options: points, deadline…','আরও অপশন: পয়েন্ট, সময়সীমা…','خيارات أكثر: النقاط والموعد…'),on:{click:function(){var v=input.value;sh.close();setTimeout(function(){window.MHSApp.newTodo(v);},50);}}}));
    setTimeout(function(){input.focus();},0);
  }
  sh.body.append(tabs,body);draw();
};
/* Diary: mood and special days. Each day can carry a mood and a special-day mark (type + title).
 * They show on the calendar, can be set from the editor or straight from the calendar (long-press a
 * day, or turn on "Mark days"), and are listed under the month. Stored in MHSX "journalDays". */
(function(){
  function L(en,bn,ar){return X.lang()==='bn'?bn:X.lang()==='ar'?ar:en;}
  var MOODS=[['happy','😊','Happy','আনন্দিত','سعيد'],['grateful','🤲','Grateful','কৃতজ্ঞ','ممتن'],['calm','😌','Calm','শান্ত','هادئ'],['motivated','💪','Motivated','উদ্যমী','متحمس'],['tired','😴','Tired','ক্লান্ত','متعب'],['sad','😔','Sad','বিষণ্ণ','حزين'],['anxious','😟','Anxious','উদ্বিগ্ন','قلق'],['angry','😠','Angry','রাগান্বিত','غاضب']];
  var TYPES=[['special','⭐','Special day','বিশেষ দিন','يوم مميز'],['islamic','🌙','Islamic occasion','ইসলামি উপলক্ষ','مناسبة إسلامية'],['birthday','🎂','Birthday','জন্মদিন','عيد ميلاد'],['anniversary','💍','Anniversary','বার্ষিকী','ذكرى سنوية'],['family','👨‍👩‍👧','Family','পরিবার','العائلة'],['milestone','🏆','Milestone','মাইলফলক','إنجاز'],['travel','✈️','Travel','ভ্রমণ','سفر'],['health','🩺','Health','স্বাস্থ্য','الصحة']];
  function name(row){return L(row[2],row[3],row[4]);}
  function find(list,k){return list.filter(function(r){return r[0]===k;})[0];}
  function all(){return X.get('journalDays',{})||{};}
  function meta(day){var m=all()[day]||{};if(m.event&&!m.type)m.type='special';return m;}
  function store(day,m){var a=all();var clean={};if(m.mood)clean.mood=m.mood;if(m.type){clean.type=m.type;clean.event=String(m.event||'').trim().slice(0,160);}if(Object.keys(clean).length)a[day]=clean;else delete a[day];X.set('journalDays',a);document.dispatchEvent(new CustomEvent('mhs:journal-days',{detail:{day:day}}));}
  function fmt(day){try{return new Date(day+'T12:00:00').toLocaleDateString(X.locale(),{weekday:'long',day:'numeric',month:'long'});}catch(e){return day;}}
  /* The editor block used both inside the diary and in the quick "mark a day" sheet. */
  function editor(day,onChange){
    var m=meta(day),box=X.el('div',{class:'mhs-jd'}),saved=X.el('span',{class:'mhs-jd-saved',role:'status','aria-live':'polite'});
    function commit(){store(day,m);saved.textContent='✓ '+L('Saved','সংরক্ষিত','تم الحفظ');saved.classList.remove('is-on');void saved.offsetWidth;saved.classList.add('is-on');X.haptic(8);if(onChange)onChange(m);}
    var moods=X.el('div',{class:'mhs-jd-chips',role:'radiogroup','aria-label':L('Mood','মুড','المزاج')});
    MOODS.forEach(function(r){var on=m.mood===r[0];moods.appendChild(X.el('button',{type:'button',role:'radio','aria-checked':String(on),class:'mhs-jd-chip'+(on?' is-on':''),'data-mood':r[0],on:{click:function(){m.mood=m.mood===r[0]?'':r[0];moods.querySelectorAll('button').forEach(function(x){var o=x.dataset.mood===m.mood;x.classList.toggle('is-on',o);x.setAttribute('aria-checked',String(o));});commit();}}},[X.el('span',{class:'e','aria-hidden':'true',text:r[1]}),name(r)]));});
    var title=X.el('input',{value:m.event||'',maxlength:160,placeholder:L('What makes this day special? (optional)','দিনটি কেন বিশেষ? (ঐচ্ছিক)','ما الذي يميز هذا اليوم؟ (اختياري)'),'aria-label':L('Special day title','বিশেষ দিনের নাম','عنوان اليوم المميز'),enterkeyhint:'done'});
    var types=X.el('div',{class:'mhs-jd-chips',role:'radiogroup','aria-label':L('Special day','বিশেষ দিন','يوم مميز')});
    function paintTypes(){types.querySelectorAll('button').forEach(function(x){var o=x.dataset.type===m.type;x.classList.toggle('is-on',o);x.setAttribute('aria-checked',String(o));});title.hidden=!m.type;}
    TYPES.forEach(function(r){types.appendChild(X.el('button',{type:'button',role:'radio','aria-checked':'false',class:'mhs-jd-chip','data-type':r[0],on:{click:function(){m.type=m.type===r[0]?'':r[0];paintTypes();commit();if(m.type)setTimeout(function(){title.focus();},30);}}},[X.el('span',{class:'e','aria-hidden':'true',text:r[1]}),name(r)]));});
    var tmr=null;title.addEventListener('input',function(){m.event=title.value;clearTimeout(tmr);tmr=setTimeout(commit,500);});
    title.addEventListener('keydown',function(e){if(e.key==='Enter'){e.preventDefault();clearTimeout(tmr);commit();title.blur();}});
    paintTypes();
    box.append(X.el('div',{class:'mhs-jd-h'},[X.el('b',{text:L('Mood','মুড','المزاج')}),saved]),moods,X.el('div',{class:'mhs-jd-h'},[X.el('b',{text:L('Mark as a special day','বিশেষ দিন হিসেবে চিহ্নিত করুন','علّمه يوماً مميزاً')})]),types,title);
    return box;
  }
  window.MHSJournalDayTools=function(host,day){
    var wrap=X.el('div',{class:'mhs-j-day-extra'});
    var date=X.el('input',{type:'date',value:day,'aria-label':L('Diary date','ডায়েরির তারিখ','تاريخ اليوميات')});date.onchange=function(){if(date.value)window.MHSJournal.open(date.value);};
    var mark=X.el('button',{type:'button',class:'mhs-btn mhs-jd-bm',on:{click:function(){var m=meta(day);window.MHSCollections.choose({id:'j:'+day,kind:'journal',day:day,title:fmt(day),sub:(m.event||'')},{onDone:paint});}}});
    function paint(){var on=window.MHSCollections&&window.MHSCollections.has('j:'+day);mark.classList.toggle('is-on',!!on);mark.textContent=(on?'🔖 ':'🔖 ')+(on?L('Bookmarked','বুকমার্ক করা','محفوظ'):L('Bookmark','বুকমার্ক','حفظ'));}
    paint();
    wrap.append(X.el('div',{class:'mhs-jd-top'},[date,mark]),editor(day));
    host.appendChild(wrap);
  };
  function clearMarks(btn){btn.querySelectorAll('.mhs-jm').forEach(function(n){n.remove();});btn.classList.remove('has-special-day');delete btn.dataset.mood;delete btn.dataset.special;if(btn.dataset.baseLabel)btn.setAttribute('aria-label',btn.dataset.baseLabel);}
  function paintDay(btn,day){
    if(!btn.dataset.baseLabel)btn.dataset.baseLabel=btn.getAttribute('aria-label')||'';
    clearMarks(btn);btn.dataset.day=day;
    var m=meta(day),extra=[];
    if(m.type){var tp=find(TYPES,m.type)||TYPES[0];btn.classList.add('has-special-day');btn.dataset.special=tp[0];btn.appendChild(X.el('span',{class:'mhs-jm mhs-jm-type','aria-hidden':'true',text:tp[1]}));extra.push(name(tp)+(m.event?': '+m.event:''));btn.title=m.event||name(tp);}
    if(m.mood){var md=find(MOODS,m.mood);if(md){btn.dataset.mood=md[0];btn.appendChild(X.el('span',{class:'mhs-jm mhs-jm-mood','aria-hidden':'true',text:md[1]}));extra.push(L('Mood','মুড','المزاج')+': '+name(md));}}
    if(extra.length)btn.setAttribute('aria-label',btn.dataset.baseLabel+' · '+extra.join(' · '));
  }
  window.MHSJournalCalendarMark=paintDay;
  var marking=false;
  function quick(day,btn){
    var sh=X.sheet({id:'mhs-j-mark',title:fmt(day),sub:L('Mood and special day','মুড ও বিশেষ দিন','المزاج واليوم المميز')});
    sh.body.appendChild(editor(day,function(){if(btn&&btn.isConnected)paintDay(btn,day);month(btn&&btn.closest('.mhs-journal-body'));}));
    sh.body.appendChild(X.el('div',{class:'mhs-actions'},[X.el('button',{type:'button',class:'mhs-btn',text:'✍ '+L('Write in the diary','ডায়েরিতে লিখুন','اكتب في اليوميات'),on:{click:function(){sh.close();setTimeout(function(){window.MHSJournal.open(day,{focus:true});},80);}}}),X.el('button',{type:'button',class:'mhs-btn primary',text:L('Done','সম্পন্ন','تم'),on:{click:function(){sh.close();}}})]));
  }
  /* Month summary under the calendar: legend, "Mark days" switch and the list of special days. */
  function month(body){
    if(!body)return;var grid=body.querySelector('.mhs-journal-grid');if(!grid)return;
    var old=body.querySelector('.mhs-jd-month');if(old)old.remove();
    var days=Array.prototype.map.call(grid.querySelectorAll('button[data-day]'),function(b){return b.dataset.day;});
    var a=all(),special=days.filter(function(d){return a[d]&&(a[d].type||a[d].event);}),moods={};
    days.forEach(function(d){if(a[d]&&a[d].mood)moods[a[d].mood]=(moods[a[d].mood]||0)+1;});
    var box=X.el('section',{class:'mhs-jd-month'});
    var toggle=X.el('button',{type:'button',class:'mhs-btn mhs-jd-markmode'+(marking?' is-on':''),'aria-pressed':String(marking),text:(marking?'✓ ':'⭐ ')+(marking?L('Marking: tap a day','চিহ্নিত করছেন: একটি দিনে চাপ দিন','وضع التعليم: اضغط يوماً'):L('Mark days on the calendar','ক্যালেন্ডারে দিন চিহ্নিত করুন','علّم أياماً في التقويم')),on:{click:function(){marking=!marking;body.classList.toggle('is-marking',marking);month(body);}}});
    box.appendChild(X.el('div',{class:'mhs-jd-month-top'},[toggle,X.el('small',{class:'mhs-mini-note',text:L('Tip: long-press any day to mark it.','টিপ: যেকোনো দিনে চেপে ধরে চিহ্নিত করুন।','تلميح: اضغط مطولاً على أي يوم لتعليمه.')})]));
    var mk=Object.keys(moods);
    if(mk.length)box.appendChild(X.el('div',{class:'mhs-jd-moodsum','aria-label':L('Moods this month','এ মাসের মুড','مزاج هذا الشهر')},mk.sort(function(x,y){return moods[y]-moods[x];}).map(function(k){var r=find(MOODS,k);return X.el('span',{title:name(r)},[r[1]+' ',X.el('b',{text:X.num(moods[k])})]);})));
    if(special.length){
      var ul=X.el('ul',{class:'mhs-jd-list'});
      special.forEach(function(d){var m=meta(d),tp=find(TYPES,m.type)||TYPES[0];ul.appendChild(X.el('li',{},[X.el('button',{type:'button',on:{click:function(){quick(d,grid.querySelector('button[data-day="'+d+'"]'));}}},[X.el('span',{class:'e','aria-hidden':'true',text:tp[1]}),X.el('span',{class:'d',text:new Date(d+'T12:00:00').toLocaleDateString(X.locale(),{day:'numeric',month:'short'})}),X.el('span',{class:'t',text:m.event||name(tp)})])]));});
      box.append(X.el('h4',{text:L('Special days this month','এ মাসের বিশেষ দিন','الأيام المميزة هذا الشهر')}),ul);
    }
    var after=grid.nextSibling;if(after&&after.classList&&after.classList.contains('mhs-j-month-sum'))after=after.nextSibling;grid.parentNode.insertBefore(box,after||null);
    body.classList.toggle('is-marking',marking);
  }
  // Calendar day taps: in marking mode open the quick sheet instead of the editor; long-press always.
  document.addEventListener('click',function(e){var b=e.target.closest&&e.target.closest('.mhs-journal-grid button[data-day]');if(!b||!marking)return;e.preventDefault();e.stopImmediatePropagation();quick(b.dataset.day,b);},true);
  document.addEventListener('contextmenu',function(e){var b=e.target.closest&&e.target.closest('.mhs-journal-grid button[data-day]');if(!b)return;e.preventDefault();quick(b.dataset.day,b);},true);
  var q=false;new MutationObserver(function(){if(q)return;q=true;requestAnimationFrame(function(){q=false;document.querySelectorAll('.mhs-journal-body').forEach(function(body){if(body.querySelector('.mhs-journal-grid')&&!body.querySelector('.mhs-jd-month'))month(body);});});}).observe(document.body,{childList:true,subtree:true});
  window.MHSJournalDays={get:meta,set:store,moods:MOODS,types:TYPES,mark:quick};
})();
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
