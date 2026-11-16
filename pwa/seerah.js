/* Seerah: attributed online edition, original text and explicitly labelled translations. */
(function () {
  'use strict';
  var X=window.MHSX, VERSION='english-issam-diab-v1', source=null, pending=null, sh=null, page=0, generation=0, displayed='';
  function t(en,bn,ar){return X.lang()==='bn'?bn:X.lang()==='ar'?(ar||en):en;}
  function title(){return t('Seerah · The Sealed Nectar','সীরাহ · আর রাহীকুল মাখতুম','السيرة · الرحيق المختوم');}
  function language(){var p=X.get('seerahSettings',{});return p.lang||window.MHSLocale||document.documentElement.lang||'en';}
  function imported(){var d=X.get('seerahEdition',{pages:[]});return d&&Array.isArray(d.pages)&&d.pages.length?d:null;}
  function edition(){return imported()||source;}
  function button(label,run,disabled){return X.el('button',{type:'button',class:'mhs-btn',text:label,disabled:!!disabled,on:{click:run}});}
  function key(lang,p){return 'seerah:'+VERSION+':'+lang+':'+p;}
  async function load(){
    if(source)return source;if(pending)return pending;
    pending=(async function(){
      var saved=await window.MHS.get('seerah:'+VERSION+':source');
      if(saved&&saved.version===VERSION&&Array.isArray(saved.pages)){source=saved;return source;}
      var r=await fetch('/api/seerah');if(!r.ok)throw Error('source');var d=await r.json();
      if(d.version!==VERSION||!Array.isArray(d.pages)||!d.pages.length||d.pages.some(function(p){return typeof p!=='string';}))throw Error('source');
      await window.MHS.set('seerah:'+VERSION+':source',d);source=d;return d;
    })().finally(function(){pending=null;});return pending;
  }
  async function passage(p,lang){
    var custom=imported();if(custom)return {text:custom.pages[p],lang:custom.lang||'en',machineTranslated:false};
    var d=await load();if(lang==='en')return {text:d.pages[p],lang:'en',machineTranslated:false};
    var saved=await window.MHS.get(key(lang,p));if(saved&&saved.text)return saved;
    var r=await fetch('/api/seerah',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({page:p,lang:lang})});
    if(!r.ok)throw Error('translation');var result=await r.json();if(typeof result.text!=='string'||!result.text.trim()||result.lang!==lang||result.page!==p)throw Error('translation');
    await window.MHS.set(key(lang,p),result);return result;
  }
  async function open(opts){
    page=Number.isSafeInteger(Number(opts&&opts.page))?Number(opts.page):Number(X.get('seerahPosition',0))||0;
    if(sh&&sh.dialog.open){draw();return;}
    sh=X.sheet({id:'mhs-seerah',title:title(),sub:'Safiur Rahman al-Mubarakpuri',onClose:function(){sh=null;generation++;}});draw();
  }
  async function draw(){
    if(!sh)return;var current=sh,token=++generation,b=sh.body;b.replaceChildren(X.el('p',{role:'status',text:t('Opening the book…','বই খোলা হচ্ছে…','جارٍ فتح الكتاب…')}));
    try {
      var d=imported()||await load();if(sh!==current||token!==generation)return;
      page=Math.max(0,Math.min(d.pages.length-1,page));var at=page,lang=language();displayed='';b.replaceChildren();
      var info=X.el('section',{class:'mhs-seerah-source'},[X.el('small',{text:t('THE LIFE OF THE PROPHET ﷺ','নবীজির ﷺ জীবনচরিত','سيرة النبي ﷺ')}),X.el('h3',{text:title()}),X.el('p',{text:imported()?d.source:d.author+' · '+t('English translation: ','ইংরেজি অনুবাদ: ','الترجمة الإنجليزية: ')+d.translator})]);
      if(!imported())info.append(X.el('a',{href:d.source,target:'_blank',rel:'noopener noreferrer',text:t('Source edition','মূল সংস্করণ','النسخة الأصلية')}),document.createTextNode(' · '),X.el('a',{href:d.pdf,target:'_blank',rel:'noopener noreferrer',text:t('Source PDF','মূল PDF','ملف PDF الأصلي')}));
      b.appendChild(info);
      var search=X.el('input',{type:'search',class:'mhs-seerah-search',placeholder:t('Search the original text…','মূল পাঠে খুঁজুন…','ابحث في النص الأصلي…'),'aria-label':t('Search Seerah','সীরাহ খুঁজুন','بحث في السيرة')});
      search.addEventListener('change',function(){var q=search.value.trim().toLocaleLowerCase();if(!q)return;var matches=d.pages.map(function(p,i){return p.toLocaleLowerCase().includes(q)?i:-1;}).filter(function(i){return i>=0;});if(!matches.length){X.toast(t('No matches in the original text','মূল পাঠে পাওয়া যায়নি','لا نتائج في النص الأصلي'));return;}results.replaceChildren();matches.slice(0,60).forEach(function(i){results.appendChild(button(t('Passage ','পাঠাংশ ','المقطع ')+(i+1),function(){page=i;draw();}));});});
      var results=X.el('div',{class:'mhs-seerah-results'});b.append(search,results);
      var jump=X.el('input',{type:'number',min:1,max:d.pages.length,value:page+1,'aria-label':t('Passage number','পাঠাংশ নম্বর','رقم المقطع')});jump.onchange=function(){var n=Number(jump.value);if(Number.isInteger(n)&&n>=1&&n<=d.pages.length){page=n-1;draw();}};
      var nav=X.el('nav',{class:'mhs-seerah-nav','aria-label':t('Book navigation','বইয়ের নেভিগেশন','تصفح الكتاب')},[button('‹',function(){page--;draw();},page===0),X.el('label',{},[jump,' / '+d.pages.length]),button('›',function(){page++;draw();},page===d.pages.length-1)]);b.appendChild(nav);
      var label=X.el('p',{class:'mhs-mini-note',role:'status'}),article=X.el('article',{class:'mhs-seerah-text',style:{whiteSpace:'pre-wrap',lineHeight:'2'},'aria-busy':'true'});b.append(label,article);
      label.textContent=lang==='en'||imported()?t('Digitized edition · passage numbers follow this reader, not printed pages.','ডিজিটাল সংস্করণ · পাঠাংশ নম্বর মুদ্রিত পৃষ্ঠা নম্বর নয়।','نسخة رقمية · أرقام المقاطع ليست أرقام الصفحات المطبوعة.'):t('Preparing translation… Original text remains available.','অনুবাদ প্রস্তুত হচ্ছে… মূল পাঠও দেখা যাবে।','جارٍ إعداد الترجمة… النص الأصلي متاح.');
      var actions=X.el('div',{class:'mhs-rf-actions'},[button(t('Bookmark','বুকমার্ক','حفظ'),function(){window.MHSCollections.choose({id:'s:'+at,kind:'seerah',page:at,title:(d.pages[at]||'').slice(0,90),sub:title(),edition:VERSION});}),button(t('Share','শেয়ার','مشاركة'),function(){if(!displayed)return;window.MHSShare.menu({medium:'seerah',text:displayed,src:title()+' · '+(at+1)+(lang!=='en'?' · '+t('Machine translation','স্বয়ংক্রিয় অনুবাদ','ترجمة آلية'):''),link:{page:at}});})]);b.appendChild(actions);
      if(lang!=='en'&&!imported()){
        var details=X.el('details',{},[X.el('summary',{text:t('Read the original English','মূল ইংরেজি পাঠ পড়ুন','اقرأ النص الإنجليزي الأصلي')}),X.el('div',{class:'mhs-seerah-text',lang:'en',dir:'ltr',text:d.pages[at]})]);b.appendChild(details);
      }
      X.set('seerahPosition',at);
      try{var p=await passage(at,lang);if(sh!==current||token!==generation)return;displayed=p.text;article.textContent=p.text;article.lang=p.lang;article.dir=['ar','he','fa','ur','ps','sd','ug','dv','ckb','yi'].includes(p.lang)?'rtl':'auto';article.setAttribute('aria-busy','false');if(p.machineTranslated)label.textContent=t('Machine translation from the digitized English edition · compare with the original.','ডিজিটাল ইংরেজি সংস্করণ থেকে স্বয়ংক্রিয় অনুবাদ · মূল পাঠের সঙ্গে মিলিয়ে পড়ুন।','ترجمة آلية من النسخة الإنجليزية الرقمية · قارن بالأصل.');}
      catch(e){if(sh!==current||token!==generation)return;article.setAttribute('aria-busy','false');label.textContent=t('Translation is not downloaded. Connect to the internet and retry, or read the original.','অনুবাদ ডাউনলোড করা নেই। ইন্টারনেট চালু করে আবার চেষ্টা করুন অথবা মূল পাঠ পড়ুন।','الترجمة غير محمّلة. اتصل بالإنترنت وأعد المحاولة أو اقرأ الأصل.');article.appendChild(button(t('Retry','আবার চেষ্টা করুন','أعد المحاولة'),draw));}
    }catch(e){if(sh!==current||token!==generation)return;b.replaceChildren(X.el('p',{role:'status',text:t('The book could not be opened. Connect once to download it for offline reading.','বই খোলা যায়নি। অফলাইনে পড়তে একবার ইন্টারনেট সংযোগ দিয়ে ডাউনলোড করুন।','تعذر فتح الكتاب. اتصل مرة لتنزيله للقراءة دون اتصال.')}),button(t('Retry','আবার চেষ্টা করুন','أعد المحاولة'),draw));}
  }
  function settings(host){
    var codes=window.MHSI18n&&window.MHSI18n.codes||['en','bn','ar'],select=X.el('select',{'aria-label':t('Reading language','পড়ার ভাষা','لغة القراءة')});
    codes.forEach(function(code){var name=code;try{name=new Intl.DisplayNames([document.documentElement.lang||'en'],{type:'language'}).of(code)||code;}catch(e){}select.appendChild(X.el('option',{value:code,text:name,selected:code===language()}));});
    select.onchange=function(){X.set('seerahSettings',{lang:select.value});draw();};host.append(X.el('label',{},[t('Reading language','পড়ার ভাষা','لغة القراءة'),select]),X.el('p',{class:'mhs-mini-note',text:t('Other languages use labelled machine translation. The original English and source PDF stay available. Download translations before going offline.','অন্যান্য ভাষায় চিহ্নিত স্বয়ংক্রিয় অনুবাদ দেখানো হয়। মূল ইংরেজি ও উৎস PDF দেখা যায়। অফলাইনে যাওয়ার আগে অনুবাদ ডাউনলোড করুন।','تستخدم اللغات الأخرى ترجمة آلية موضحة. الأصل الإنجليزي وملف PDF متاحان. نزّل الترجمة قبل استخدام التطبيق دون اتصال.')}));
    if(imported())host.appendChild(button(t('Use the online edition','অনলাইন সংস্করণ ব্যবহার করুন','استخدم النسخة الإلكترونية'),function(){X.set('seerahEdition',{pages:[]});page=0;draw();}));
    var file=X.el('input',{type:'file',accept:'.txt,text/plain','aria-label':t('Import your own text edition','নিজের টেক্সট সংস্করণ আমদানি','استيراد نسختك النصية')});file.onchange=async function(){var f=file.files[0];if(!f)return;if(f.size>3000000){X.toast(t('Maximum file size: 3 MB','সর্বোচ্চ ফাইল: ৩ MB','الحد الأقصى: ٣ ميغابايت'));return;}var text=await f.text(),pages=[];for(var i=0;i<text.length;i+=4000)pages.push(text.slice(i,i+4000));if(!pages.length)return;X.set('seerahEdition',{source:f.name,pages:pages,lang:language()});page=0;draw();};host.appendChild(file);
  }
  function downloadPanel(host,status,stopped){
    var busy=false;status.textContent=t('English downloads once. Translated editions download passage by passage; keep the app open.','ইংরেজি পাঠ একবারে ডাউনলোড হয়। অনুবাদ পাঠাংশ অনুযায়ী ডাউনলোড হয়; অ্যাপ খোলা রাখুন।','يُنزّل الأصل مرة واحدة. تُنزّل الترجمة مقطعاً مقطعاً؛ أبق التطبيق مفتوحاً.');
    async function run(translated){if(busy)return;busy=true;try{var d=imported()||await load();for(var i=0;translated&&i<d.pages.length;i++){if(stopped())return;status.textContent=t('Downloading ','ডাউনলোড হচ্ছে ','جارٍ التنزيل ')+(i+1)+' / '+d.pages.length;await passage(i,language());}status.textContent=t('Downloaded for offline reading on this device.','এই ডিভাইসে অফলাইনে পড়ার জন্য ডাউনলোড হয়েছে।','تم التنزيل للقراءة دون اتصال على هذا الجهاز.');}catch(e){status.textContent=t('Download paused. Check your connection or storage and retry. Completed passages are kept.','ডাউনলোড থেমেছে। সংযোগ বা স্টোরেজ দেখে আবার চেষ্টা করুন। সম্পন্ন পাঠাংশ রাখা আছে।','توقف التنزيل. تحقق من الاتصال أو التخزين وأعد المحاولة. المقاطع المكتملة محفوظة.');}finally{busy=false;}}
    host.appendChild(button(t('Download original English','মূল ইংরেজি ডাউনলোড','تنزيل الأصل الإنجليزي'),function(){run(false);}));
    if(language()!=='en'&&!imported())host.appendChild(button(t('Download selected translation','নির্বাচিত অনুবাদ ডাউনলোড','تنزيل الترجمة المختارة'),function(){run(true);}));
  }
  window.MHSSeerah={open:open,load:load,passage:passage,settings:settings,downloadPanel:downloadPanel,localize:function(id){return passage(Number(id.slice(2)),language());},posts:function(){var d=edition();if(!d)return [];return d.pages.map(function(p,i){return {id:'s:'+i,kind:'seerah',text:p,src:title()+' · '+(i+1),go:function(){open({page:i});}};});}};
  X.action({k:'seerah',c:'linear-gradient(140deg,#986e39,#5e4931)',icon:'M4 19V4h16v15|M8 7h8|M8 11h8|M4 19h16v3H4Z',label:title,sub:function(){return t('Biography · read, translate & save','জীবনী · পড়ুন, অনুবাদ ও সংরক্ষণ','السيرة · قراءة وترجمة وحفظ');},run:function(){open();}});
})();
