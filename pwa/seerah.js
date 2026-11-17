/* Seerah — an e-book reader for Ar-Raheeq Al-Makhtum (The Sealed Nectar).
 * Structured edition (chapters + pages) from /api/seerah, read in the app language by default.
 * Translations are labelled machine translations, fetched once and kept on this device; the original
 * English stays one tap away. Features: table of contents with direct jumps, search, bookmarks in
 * collections, progress, page swipe, reading themes, line spacing, typeface and offline download.
 * The Home feed gets short, complete excerpts only in the language the app is using. */
(function () {
  'use strict';
  var X = window.MHSX;
  var V = 'english-issam-diab-v2', V1_PAGES = 258;
  var RTL = ['ar', 'he', 'fa', 'ur', 'ps', 'sd', 'ug', 'dv', 'ckb', 'yi'];
  var full = null, meta = null, pendingFull = null, pendingMeta = null;
  var pages = {}, tocs = {}, inflight = {}, feedPool = {}, warming = {};
  var sh = null, page = 0, view = 'read', target = -1, token = 0, highlight = '', original = false;

  function t(en, bn, ar) { var l = X.lang(); return l === 'bn' ? bn : l === 'ar' ? (ar || en) : en; }
  function appLang() { var l = window.MHSLocale || document.documentElement.lang || 'en'; return window.MHSI18n && window.MHSI18n.supported && !window.MHSI18n.supported(l) ? 'en' : l; }
  /* Reading language: follows the app unless the reader chose one in Seerah settings. */
  function readLang() { var l = X.get('seerahLang', 'auto'); return l && l !== 'auto' ? l : appLang(); }
  function isRtl(l) { return RTL.indexOf(String(l).split('-')[0]) >= 0; }
  function langName(code) { try { return new Intl.DisplayNames([appLang()], { type: 'language' }).of(code) || code; } catch (e) { return code; } }
  function num(n) { return X.num ? X.num(n) : String(n); }
  function title() { return t('Seerah', 'সীরাহ', 'السيرة'); }
  function prefs() { return Object.assign({ theme: 'default', spacing: 1.9, face: 'serif', justify: false }, X.get('seerahReader', {})); }
  function idb(k) { return window.MHS && window.MHS.get ? window.MHS.get(k).catch(function () { return null; }) : Promise.resolve(null); }
  function idbSet(k, v) { return window.MHS && window.MHS.set ? window.MHS.set(k, v).catch(function () {}) : Promise.resolve(); }
  function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

  /* ---------- data ---------- */
  function loadMeta() {
    if (meta) return Promise.resolve(meta);
    if (full) return Promise.resolve(meta = toMeta(full));
    if (pendingMeta) return pendingMeta;
    pendingMeta = idb('seerah:' + V + ':meta').then(function (saved) {
      if (saved && saved.version === V && Array.isArray(saved.chapters)) return (meta = saved);
      return fetch('/api/seerah?view=meta').then(function (r) { if (!r.ok) throw Error('meta'); return r.json(); }).then(function (d) {
        if (d.version !== V || !Array.isArray(d.chapters) || !d.count) throw Error('meta');
        idbSet('seerah:' + V + ':meta', d); return (meta = d);
      });
    }).finally(function () { pendingMeta = null; });
    return pendingMeta;
  }
  function toMeta(d) { return { version: d.version, title: d.title, author: d.author, translator: d.translator, publisher: d.publisher, source: d.source, pdf: d.pdf, chapters: d.chapters, count: d.pages.length }; }
  /* The whole English book (about 1 MB): only for search and offline reading. */
  function loadFull() {
    if (full) return Promise.resolve(full);
    if (pendingFull) return pendingFull;
    pendingFull = idb('seerah:' + V + ':source').then(function (saved) {
      if (saved && saved.version === V && Array.isArray(saved.pages)) return saved;
      return fetch('/api/seerah').then(function (r) { if (!r.ok) throw Error('source'); return r.json(); }).then(function (d) {
        if (d.version !== V || !Array.isArray(d.pages) || !d.pages.length || d.pages.some(function (p) { return typeof p !== 'string'; })) throw Error('source');
        idbSet('seerah:' + V + ':source', d); return d;
      });
    }).then(function (d) { full = d; meta = meta || toMeta(d); return d; }).finally(function () { pendingFull = null; });
    return pendingFull;
  }
  function pkey(lang, p) { return 'seerah:' + V + ':' + lang + ':' + p; }
  /* Native script of languages that do not use the Latin alphabet (same rule as the server): a saved
   * "translation" that is really English is not shown as that language. */
  var AR = '\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF', CY = '\u0400-\u04FF', DE = '\u0900-\u097F', BN = '\u0980-\u09FF', HE = '\u0590-\u05FF', HAN = '\u3400-\u9FFF', ET = '\u1200-\u139F';
  var SCRIPT = { bn: BN, as: BN, ar: AR, fa: AR, ur: AR, ps: AR, sd: AR, ug: AR, ckb: AR, he: HE, yi: HE, dv: '\u0780-\u07BF', hi: DE, mr: DE, ne: DE,
    pa: '\u0A00-\u0A7F', gu: '\u0A80-\u0AFF', or: '\u0B00-\u0B7F', ta: '\u0B80-\u0BFF', te: '\u0C00-\u0C7F', kn: '\u0C80-\u0CFF', ml: '\u0D00-\u0D7F', si: '\u0D80-\u0DFF',
    th: '\u0E00-\u0E7F', lo: '\u0E80-\u0EFF', my: '\u1000-\u109F', ka: '\u10A0-\u10FF', hy: '\u0530-\u058F', am: ET, ti: ET, km: '\u1780-\u17FF', el: '\u0370-\u03FF\u1F00-\u1FFF',
    ru: CY, uk: CY, be: CY, bg: CY, mk: CY, sr: CY, kk: CY, ky: CY, tg: CY, tt: CY, mn: CY, 'zh-CN': HAN, 'zh-TW': HAN, ja: '\u3040-\u30FF' + HAN, ko: '\uAC00-\uD7AF\u1100-\u11FF' };
  function inScript(lang, text) {
    var range = SCRIPT[lang]; if (!range) return true;
    var body = AR.indexOf(range) === 0 ? String(text) : String(text).replace(new RegExp('[' + AR + ']+', 'g'), ' ');
    var native = (body.match(new RegExp('[' + range + ']', 'g')) || []).length, latin = (body.match(/[A-Za-z\u00C0-\u024F]/g) || []).length;
    return native + latin < 12 || native / (native + latin) >= 0.7;
  }
  function valid(r, lang, p) { return !!(r && typeof r.text === 'string' && r.text.trim() && r.lang === lang && r.page === p && inScript(lang, r.text)); }
  /* One Unicode form for searching, so Bengali letters typed as two code points (য + ়) still match. */
  function nfc(s) { s = String(s); try { return s.normalize('NFC'); } catch (e) { return s; } }
  function fold(s) { return nfc(s).toLocaleLowerCase(); }
  /* One page in a language: memory → device → shared cache → translate (English needs no translation). */
  function passage(p, lang, opts) {
    var k = lang + ':' + p;
    if (pages[k]) return Promise.resolve(pages[k]);
    if (inflight[k]) return inflight[k];
    inflight[k] = (async function () {
      if (lang === 'en' && full) return (pages[k] = { text: full.pages[p], lang: 'en', page: p, machineTranslated: false });
      var saved = await idb(pkey(lang, p)); if (valid(saved, lang, p)) return (pages[k] = saved);
      var r = await fetch('/api/seerah?view=page&page=' + p + '&lang=' + encodeURIComponent(lang));
      if (r.ok) { var d = await r.json(); if (valid(d, lang, p)) { idbSet(pkey(lang, p), d); return (pages[k] = d); } }
      if (lang === 'en' || (opts && opts.cacheOnly)) throw Error('page');
      for (var tries = 0; tries < 45; tries++) {
        var res = await fetch('/api/seerah', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ page: p, lang: lang }) });
        if (res.ok) { var out = await res.json(); if (!valid(out, lang, p)) throw Error('translation'); idbSet(pkey(lang, p), out); return (pages[k] = out); }
        if (res.status !== 429) throw Error('translation');
        await sleep(3000); // someone else is translating this page right now
        var again = await fetch('/api/seerah?view=page&page=' + p + '&lang=' + encodeURIComponent(lang));
        if (again.ok) { var g = await again.json(); if (valid(g, lang, p)) { idbSet(pkey(lang, p), g); return (pages[k] = g); } }
      }
      throw Error('translation');
    })().finally(function () { delete inflight[k]; });
    return inflight[k];
  }
  function toc(lang) {
    if (tocs[lang]) return Promise.resolve(tocs[lang]);
    return loadMeta().then(function (m) {
      var english = m.chapters.map(function (c) { return c.title; });
      if (lang === 'en') return (tocs.en = english);
      return idb('seerah:' + V + ':toc:' + lang).then(function (saved) {
        if (Array.isArray(saved) && saved.length === english.length && inScript(lang, saved.join(' '))) return (tocs[lang] = saved);
        return fetch('/api/seerah?view=toc&lang=' + encodeURIComponent(lang)).then(function (r) { return r.ok ? r.json() : null; }).then(function (d) {
          if (d && Array.isArray(d.titles) && d.titles.length === english.length && inScript(lang, d.titles.join(' '))) { idbSet('seerah:' + V + ':toc:' + lang, d.titles); return (tocs[lang] = d.titles); }
          return english;
        }).catch(function () { return english; });
      });
    });
  }
  function chapterAt(p, level) { var m = meta, found = -1; if (!m) return -1; m.chapters.forEach(function (c, i) { if (c.page <= p && (!level || c.level === level)) found = i; }); return found; }
  function chapterTitle(i, lang) { if (i < 0 || !meta) return ''; var list = tocs[lang] || tocs.en; return (list && list[i]) || meta.chapters[i].title; }
  /* Positions saved by the v1 reader used 258 raw slices; map them proportionally onto v2 pages. */
  function migrate(p, edition) { if (edition === V) return p; var n = (meta && meta.count) || 471; return Math.max(0, Math.min(n - 1, Math.round(p / V1_PAGES * n))); }

  /* ---------- reader ---------- */
  function open(opts) {
    opts = opts || {};
    loadMeta().then(function () {
      var saved = X.get('seerahPos2', null);
      if (saved == null) { var old = Number(X.get('seerahPosition', 0)) || 0; saved = old ? migrate(old) : 0; }
      page = Number.isSafeInteger(Number(opts.page)) ? migrate(Number(opts.page), opts.edition || V) : saved;
      target = Number.isInteger(opts.heading) ? opts.heading : -1; view = 'read'; original = false;
      show();
    }).catch(function () { show(); });
    if (sh && sh.dialog.open) return;
    sh = X.sheet({ id: 'mhs-seerah', title: title(), sub: t('The Sealed Nectar', 'আর-রাহীকুল মাখতূম', 'الرحيق المختوم'), onClose: function () { sh = null; token++; } });
    sh.dialog.classList.add('mhs-sr');
    applyPrefs();
    sh.body.appendChild(skeleton(t('Opening the book…', 'বই খোলা হচ্ছে…', 'جارٍ فتح الكتاب…')));
    tools();
  }
  function tools() {
    if (!sh) return;
    function ib(label, path, run, cls) { return X.el('button', { type: 'button', class: 'mhs-mini-ib ' + (cls || ''), 'aria-label': label, title: label, on: { click: run } }, [X.icon(path)]); }
    sh.tools.replaceChildren(
      ib(t('Contents', 'সূচিপত্র', 'الفهرس'), 'M8 6h13|M8 12h13|M8 18h13|M3 6h.01|M3 12h.01|M3 18h.01', function () { go('toc'); }, 'mhs-sr-toc-btn'),
      ib(t('Search the book', 'বইয়ে খুঁজুন', 'ابحث في الكتاب'), 'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14Z|M21 21l-4.3-4.3', function () { go('search'); }),
      ib(t('Bookmark this page', 'এই পৃষ্ঠা বুকমার্ক করুন', 'احفظ هذه الصفحة'), 'M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2Z', bookmark, 'mhs-sr-mark')
    );
    syncMark();
  }
  function go(v) { view = v; show(); }
  function show() {
    if (!sh) return;
    var my = ++token;
    sh.foot.hidden = view !== 'read';
    if (view === 'read') { sh.onBack = null; sh.showBack(false); return renderPage(my); }
    sh.showBack(true); sh.onBack = function () { view = 'read'; show(); return true; };
    if (view === 'toc' || view === 'marks') return renderToc(my);
    if (view === 'search') return renderSearch(my);
  }
  function skeleton(msg, sub) {
    var box = X.el('div', { class: 'mhs-sr-skel', role: 'status', 'aria-live': 'polite' }, [X.el('b', { text: msg }), sub ? X.el('small', { text: sub }) : null]);
    for (var i = 0; i < 7; i++) box.appendChild(X.el('i', { style: { width: (i % 3 === 2 ? 62 : 92 - i * 2) + '%' } }));
    return box;
  }
  function applyPrefs() {
    if (!sh) return; var p = prefs(), d = sh.dialog;
    d.dataset.srTheme = p.theme; d.dataset.srFace = p.face; d.classList.toggle('mhs-sr-justify', !!p.justify);
    d.style.setProperty('--sr-leading', String(p.spacing));
  }
  function article(text, lang) {
    var a = X.el('article', { class: 'mhs-sr-text', lang: lang, dir: isRtl(lang) ? 'rtl' : 'ltr', translate: 'no' });
    String(text).split(/\n{2,}/).forEach(function (block) {
      block = block.trim(); if (!block) return;
      if (/^# /.test(block)) a.appendChild(X.el('h3', { class: 'mhs-sr-chapter', text: block.slice(2) }));
      else if (/^## /.test(block)) a.appendChild(X.el('h4', { class: 'mhs-sr-section', text: block.slice(3) }));
      else a.appendChild(X.el('p', { text: block.replace(/\n/g, ' ') }));
    });
    if (highlight) mark(a, highlight);
    return a;
  }
  function mark(root, q) {
    var lower = fold(q), first = null;
    root.querySelectorAll('p,h3,h4').forEach(function (n) {
      var s = nfc(n.textContent), i = fold(s).indexOf(lower); if (i < 0) return;
      n.replaceChildren(document.createTextNode(s.slice(0, i)), X.el('mark', { text: s.slice(i, i + q.length) }), document.createTextNode(s.slice(i + q.length)));
      first = first || n;
    });
    if (first) setTimeout(function () { first.scrollIntoView({ block: 'center' }); }, 60);
  }
  async function renderPage(my) {
    var b = sh.body, lang = original ? 'en' : readLang();
    try { await loadMeta(); } catch (e) { return failed(my, t('The book could not be opened. Connect once to download it for offline reading.', 'বই খোলা যায়নি। অফলাইনে পড়তে একবার ইন্টারনেট সংযোগ দিয়ে ডাউনলোড করুন।', 'تعذر فتح الكتاب. اتصل مرة لتنزيله للقراءة دون اتصال.')); }
    if (my !== token || !sh) return;
    page = Math.max(0, Math.min(meta.count - 1, page)); X.set('seerahPos2', page);
    toc(readLang()).then(function () { if (my === token && sh) heading(); });
    footer();
    var ready = pages[lang + ':' + page];
    if (!ready) {
      b.replaceChildren(skeleton(lang === 'en' ? t('Opening the page…', 'পৃষ্ঠা খোলা হচ্ছে…', 'جارٍ فتح الصفحة…') : t('Preparing the ', 'প্রস্তুত হচ্ছে: ', 'جارٍ إعداد ') + langName(lang) + t(' translation…', ' অনুবাদ…', '…'),
        lang === 'en' ? '' : t('The first time a page is opened in a language it is translated; afterwards it opens instantly, even offline.', 'কোনো ভাষায় প্রথমবার খুললে পৃষ্ঠাটি অনুবাদ হয়; এরপর অফলাইনেও সঙ্গে সঙ্গে খুলবে।', 'تُترجم الصفحة أول مرة فقط، ثم تفتح فوراً حتى دون اتصال.')));
    }
    try { ready = ready || await passage(page, lang); }
    catch (e) {
      if (my !== token || !sh) return;
      return failed(my, t('This page is not downloaded yet. Connect to the internet and try again.', 'এই পৃষ্ঠাটি এখনো ডাউনলোড হয়নি। ইন্টারনেট চালু করে আবার চেষ্টা করুন।', 'لم تُنزَّل هذه الصفحة بعد. اتصل بالإنترنت وأعد المحاولة.'), lang !== 'en');
    }
    if (my !== token || !sh) return;
    var top = b.scrollTop;
    var art = article(ready.text, ready.lang);
    var info = X.el('div', { class: 'mhs-sr-label' });
    if (ready.machineTranslated) info.append(X.el('span', { text: t('Machine translation · ', 'স্বয়ংক্রিয় অনুবাদ · ', 'ترجمة آلية · ') + langName(ready.lang) }), X.el('button', { type: 'button', class: 'mhs-sr-link', text: t('Read the original English', 'মূল ইংরেজি পড়ুন', 'اقرأ الأصل الإنجليزي'), on: { click: function () { original = true; show(); } } }));
    else if (original && readLang() !== 'en') info.append(X.el('span', { text: t('Original English', 'মূল ইংরেজি', 'الأصل الإنجليزي') }), X.el('button', { type: 'button', class: 'mhs-sr-link', text: t('Back to ', 'ফিরে যান: ', 'العودة إلى ') + langName(readLang()), on: { click: function () { original = false; show(); } } }));
    var end = X.el('div', { class: 'mhs-sr-end' });
    if (page < meta.count - 1) end.appendChild(X.el('button', { type: 'button', class: 'mhs-btn primary', text: t('Next page', 'পরের পৃষ্ঠা', 'الصفحة التالية') + (isRtl(appLang()) ? ' ‹' : ' ›'), on: { click: function () { turn(1); } } }));
    else end.appendChild(X.el('p', { class: 'mhs-mini-note', text: t('End of the book. May Allah accept it from you.', 'বইয়ের শেষ। আল্লাহ কবুল করুন।', 'نهاية الكتاب. تقبل الله منك.') }));
    if (page === 0) end.appendChild(credit());
    b.replaceChildren(info, art, end);
    swipe(art);
    if (target >= 0) { var hs = art.querySelectorAll('h3,h4'), h = hs[target]; target = -1; if (h) setTimeout(function () { h.scrollIntoView({ block: 'start' }); }, 30); else b.scrollTop = 0; }
    else if (!highlight) b.scrollTop = top && b.dataset.page === String(page) ? top : 0;
    b.dataset.page = String(page); highlight = '';
    syncMark(); heading();
    // Make the next pages instant.
    [1, 2].forEach(function (d) { if (page + d < meta.count) passage(page + d, lang).catch(function () {}); });
  }
  function credit() {
    var m = meta || {};
    return X.el('p', { class: 'mhs-sr-credit' }, [
      t(m.author || 'Safiur Rahman al-Mubarakpuri', 'সফিউর রহমান মুবারকপুরী', 'صفي الرحمن المباركفوري') + ' · ' + t('English translation: ', 'ইংরেজি অনুবাদ: ', 'الترجمة الإنجليزية: ') + t(m.translator || 'Issam Diab', 'ইসাম দিয়াব', 'عصام دياب') + ' · ',
      X.el('a', { href: m.source || 'https://archive.org/details/en_The_Sealed_Nectar', target: '_blank', rel: 'noopener noreferrer', text: t('Source edition', 'মূল সংস্করণ', 'النسخة الأصلية') }), ' · ',
      X.el('a', { href: m.pdf || 'https://archive.org/download/en_The_Sealed_Nectar/en_The_Sealed_Nectar.pdf', target: '_blank', rel: 'noopener noreferrer', text: 'PDF' })
    ]);
  }
  function failed(my, msg, offerOriginal) {
    if (my !== token || !sh) return;
    sh.body.replaceChildren(X.el('div', { class: 'mhs-sr-error', role: 'alert' }, [
      X.el('p', { text: msg }),
      X.el('div', { class: 'mhs-actions' }, [
        X.el('button', { type: 'button', class: 'mhs-btn primary', text: t('Try again', 'আবার চেষ্টা করুন', 'أعد المحاولة'), on: { click: show } }),
        offerOriginal ? X.el('button', { type: 'button', class: 'mhs-btn', text: t('Read the original English', 'মূল ইংরেজি পড়ুন', 'اقرأ الأصل الإنجليزي'), on: { click: function () { original = true; show(); } } }) : null
      ])
    ]));
  }
  function heading() {
    if (!sh || !meta) return;
    var lang = readLang(), c = chapterAt(page, 1), s = chapterAt(page);
    sh.setTitle(title(), chapterTitle(s >= 0 ? s : c, lang) || t('The Sealed Nectar', 'আর-রাহীকুল মাখতূম', 'الرحيق المختوم'));
  }
  function footer() {
    var f = sh.foot; f.replaceChildren(); f.classList.add('mhs-sr-foot');
    var rtl = isRtl(appLang()), pct = Math.round((page + 1) / meta.count * 100);
    var prev = X.el('button', { type: 'button', class: 'mhs-mini-ib', 'aria-label': t('Previous page', 'আগের পৃষ্ঠা', 'الصفحة السابقة'), disabled: page === 0, on: { click: function () { turn(-1); } } }, [X.icon(rtl ? 'M9 18l6-6-6-6' : 'M15 18l-6-6 6-6')]);
    var next = X.el('button', { type: 'button', class: 'mhs-mini-ib', 'aria-label': t('Next page', 'পরের পৃষ্ঠা', 'الصفحة التالية'), disabled: page >= meta.count - 1, on: { click: function () { turn(1); } } }, [X.icon(rtl ? 'M15 18l-6-6 6-6' : 'M9 18l6-6-6-6')]);
    var range = X.el('input', { type: 'range', min: 1, max: meta.count, value: page + 1, class: 'mhs-sr-range', 'aria-label': t('Go to page', 'পৃষ্ঠায় যান', 'انتقل إلى الصفحة') });
    var where = X.el('span', { class: 'mhs-sr-where', text: t('Page ', 'পৃষ্ঠা ', 'صفحة ') + num(page + 1) + ' / ' + num(meta.count) + ' · ' + num(pct) + '%' });
    range.oninput = function () { where.textContent = t('Page ', 'পৃষ্ঠা ', 'صفحة ') + num(range.value) + ' / ' + num(meta.count); };
    range.onchange = function () { page = Number(range.value) - 1; show(); };
    f.append(X.el('div', { class: 'mhs-sr-progress', 'aria-hidden': 'true' }, [X.el('i', { style: { width: pct + '%' } })]), prev, X.el('div', { class: 'mhs-sr-mid' }, [where, range]), next);
  }
  function turn(d) { if (!meta) return; var n = page + d; if (n < 0 || n >= meta.count) return; page = n; target = -1; X.haptic(6); show(); sh && (sh.body.scrollTop = 0); }
  function swipe(el) {
    var s = null;
    el.addEventListener('touchstart', function (e) { if (e.touches.length === 1) s = { x: e.touches[0].clientX, y: e.touches[0].clientY, t: Date.now() }; }, { passive: true });
    el.addEventListener('touchend', function (e) {
      if (!s) return; var p = e.changedTouches[0], dx = p.clientX - s.x, dy = p.clientY - s.y, fast = Date.now() - s.t < 600; s = null;
      if (window.getSelection && String(window.getSelection()).length) return; // selecting text, not turning
      if (fast && Math.abs(dx) > 70 && Math.abs(dx) > Math.abs(dy) * 1.8) turn((dx < 0) !== isRtl(appLang()) ? 1 : -1);
    }, { passive: true });
  }
  function keys(e) {
    if (!sh || view !== 'read' || /INPUT|TEXTAREA|SELECT/.test((e.target && e.target.tagName) || '')) return;
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); turn((e.key === 'ArrowRight') !== isRtl(appLang()) ? 1 : -1); }
  }
  document.addEventListener('keydown', keys);

  /* ---------- contents & bookmarks ---------- */
  function marks() { var c = window.MHSCollections ? window.MHSCollections.collect() : []; return c.filter(function (i) { return i.kind === 'seerah'; }); }
  function markId(p) { return 's2:' + p; }
  function syncMark() {
    var btn = sh && sh.tools.querySelector('.mhs-sr-mark'); if (!btn) return;
    var on = marks().some(function (i) { return i.id === markId(page) || (i.edition !== V && migrate(Number(i.page), i.edition) === page); });
    btn.classList.toggle('is-on', on); btn.setAttribute('aria-pressed', String(on));
  }
  function bookmark() {
    if (!meta || !window.MHSCollections) return;
    var lang = readLang(), p = pages[lang + ':' + page] || pages['en:' + page], c = chapterAt(page);
    var snippet = p ? excerpt(p.text, 140, p.lang) : '';
    window.MHSCollections.choose({ id: markId(page), kind: 'seerah', page: page, edition: V, title: chapterTitle(c, lang) || title(), sub: title() + ' · ' + t('Page ', 'পৃষ্ঠা ', 'صفحة ') + num(page + 1) + (snippet ? ' — ' + snippet : '') }, { onDone: syncMark });
  }
  async function renderToc(my) {
    var b = sh.body, lang = readLang();
    sh.setTitle(title(), view === 'toc' ? t('Contents', 'সূচিপত্র', 'الفهرس') : t('Bookmarks', 'বুকমার্ক', 'المحفوظات'));
    b.replaceChildren(skeleton(t('Loading contents…', 'সূচিপত্র লোড হচ্ছে…', 'جارٍ تحميل الفهرس…')));
    var titles; try { await loadMeta(); titles = await toc(lang); } catch (e) { return failed(my, t('Contents are not downloaded yet. Connect to the internet and try again.', 'সূচিপত্র এখনো ডাউনলোড হয়নি। ইন্টারনেট চালু করে আবার চেষ্টা করুন।', 'لم يُنزَّل الفهرس بعد.')); }
    if (my !== token || !sh) return;
    var tabs = X.el('div', { class: 'mhs-mini-chips', role: 'tablist' }, [['toc', t('Contents', 'সূচিপত্র', 'الفهرس')], ['marks', t('Bookmarks', 'বুকমার্ক', 'المحفوظات')]].map(function (o) {
      return X.el('button', { type: 'button', role: 'tab', class: 'mhs-chip' + (view === o[0] ? ' is-on' : ''), 'aria-selected': String(view === o[0]), text: o[1], on: { click: function () { go(o[0]); } } });
    }));
    b.replaceChildren(tabs);
    if (view === 'marks') {
      var list = marks().sort(function (a, c) { return (c.at || 0) - (a.at || 0); });
      if (!list.length) { b.appendChild(X.el('p', { class: 'mhs-kh-empty', text: t('No bookmarks yet. Tap the bookmark icon while reading to save a page.', 'এখনো বুকমার্ক নেই। পড়ার সময় বুকমার্ক আইকনে চাপ দিয়ে পৃষ্ঠা সংরক্ষণ করুন।', 'لا محفوظات بعد. اضغط رمز الحفظ أثناء القراءة.') })); return; }
      var box = X.el('div', { class: 'mhs-mini-list' });
      list.forEach(function (i) {
        var p = migrate(Number(i.page) || 0, i.edition);
        box.appendChild(X.el('button', { type: 'button', class: 'mhs-sr-row', on: { click: function () { page = p; view = 'read'; show(); } } }, [
          X.el('b', { text: chapterTitle(chapterAt(p), lang) || i.title }), X.el('small', { text: t('Page ', 'পৃষ্ঠা ', 'صفحة ') + num(p + 1) + (i.collection ? ' · ' + i.collection : '') })]));
      });
      b.appendChild(box); return;
    }
    var filter = X.el('input', { type: 'search', class: 'mhs-sr-filter', placeholder: t('Find a chapter…', 'অধ্যায় খুঁজুন…', 'ابحث عن فصل…'), 'aria-label': t('Find a chapter', 'অধ্যায় খুঁজুন', 'ابحث عن فصل') });
    var nav = X.el('nav', { class: 'mhs-sr-toc', 'aria-label': t('Contents', 'সূচিপত্র', 'الفهرس'), lang: lang, dir: isRtl(lang) ? 'rtl' : 'ltr' });
    var current = chapterAt(page), chapterNo = 0, rows = [];
    meta.chapters.forEach(function (c, i) {
      if (c.level === 1) chapterNo++;
      var row = X.el('button', { type: 'button', class: 'mhs-sr-entry lv' + c.level + (i === current ? ' is-current' : ''), 'aria-current': i === current ? 'location' : null, on: { click: function () { page = c.page; target = c.index; view = 'read'; show(); } } }, [
        c.level === 1 ? X.el('span', { class: 'no', text: num(chapterNo) }) : null, X.el('span', { class: 'tt', text: titles[i] || c.title, lang: lang !== 'en' && (titles[i] || c.title) === c.title ? 'en' : null }), X.el('span', { class: 'pg', text: num(c.page + 1) })]);
      row.dataset.q = fold((titles[i] || '') + ' ' + c.title); rows.push(row); nav.appendChild(row);
    });
    filter.oninput = function () { var q = fold(filter.value.trim()); rows.forEach(function (r) { r.hidden = !!q && r.dataset.q.indexOf(q) < 0; }); };
    if (lang !== 'en' && titles[0] === meta.chapters[0].title) b.appendChild(X.el('p', { class: 'mhs-mini-note', text: t('Chapter titles are shown in English until their translation is available.', 'অনুবাদ পাওয়া না যাওয়া পর্যন্ত অধ্যায়ের নাম ইংরেজিতে দেখানো হচ্ছে।', 'تظهر العناوين بالإنجليزية حتى تتوفر ترجمتها.') }));
    b.append(filter, nav);
    var cur = nav.querySelector('.is-current'); if (cur) setTimeout(function () { cur.scrollIntoView({ block: 'center' }); }, 40);
  }

  /* ---------- search ---------- */
  function renderSearch(my) {
    var b = sh.body; sh.setTitle(title(), t('Search the book', 'বইয়ে খুঁজুন', 'ابحث في الكتاب'));
    var input = X.el('input', { type: 'search', class: 'mhs-sr-filter', enterkeyhint: 'search', placeholder: t('Name, place or event…', 'নাম, স্থান বা ঘটনা…', 'اسم أو مكان أو حدث…'), 'aria-label': t('Search the book', 'বইয়ে খুঁজুন', 'ابحث في الكتاب') });
    var status = X.el('p', { class: 'mhs-mini-note', role: 'status' }), results = X.el('div', { class: 'mhs-mini-list' });
    var form = X.el('form', { class: 'mhs-sr-search', on: { submit: function (e) { e.preventDefault(); run(); } } }, [input, X.el('button', { type: 'submit', class: 'mhs-btn primary', text: t('Search', 'খুঁজুন', 'بحث') })]);
    b.replaceChildren(form, status, results); setTimeout(function () { input.focus(); }, 60);
    async function run() {
      var q = input.value.trim(); if (q.length < 2) return;
      var lang = readLang(), lower = fold(q), hits = [];
      Object.keys(pages).forEach(function (k) { var p = pages[k]; if (p.lang === lang && lang !== 'en') { var i = fold(p.text).indexOf(lower); if (i >= 0) hits.push({ page: p.page, text: nfc(p.text), at: i, lang: lang }); } });
      if (!full) status.textContent = t('Downloading the book for searching (once)…', 'খোঁজার জন্য বইটি ডাউনলোড হচ্ছে (একবারই)…', 'جارٍ تنزيل الكتاب للبحث (مرة واحدة)…');
      try { await loadFull(); } catch (e) { if (!hits.length) { status.textContent = t('Search needs the book downloaded once. Connect to the internet and try again.', 'খুঁজতে বইটি একবার ডাউনলোড করতে হবে। ইন্টারনেট চালু করে আবার চেষ্টা করুন।', 'يحتاج البحث إلى تنزيل الكتاب مرة.'); return; } }
      if (my !== token || !sh) return;
      if (full) full.pages.forEach(function (p, n) { var i = fold(p).indexOf(lower); if (i >= 0 && !hits.some(function (h) { return h.page === n; })) hits.push({ page: n, text: p, at: i, lang: 'en' }); });
      hits.sort(function (a, c) { return a.page - c.page; });
      status.textContent = hits.length ? num(hits.length) + t(' pages found', 'টি পৃষ্ঠায় পাওয়া গেছে', ' صفحة') : (lang !== 'en' && !/[A-Za-z]/.test(q)
        ? t('No matches. Search covers the original English and the pages translated on this device; try the English spelling, e.g. Badr.', 'পাওয়া যায়নি। খোঁজা হয় মূল ইংরেজিতে ও এই ডিভাইসে অনূদিত পৃষ্ঠাগুলোতে; ইংরেজি বানানেও চেষ্টা করুন, যেমন Badr।', 'لا نتائج. يشمل البحث الأصل الإنجليزي والصفحات المترجمة على هذا الجهاز؛ جرّب التهجئة الإنجليزية مثل Badr.')
        : t('No matches. Try another spelling, e.g. Makkah / Mecca.', 'পাওয়া যায়নি। অন্য বানানে চেষ্টা করুন, যেমন Makkah / Mecca।', 'لا نتائج. جرّب تهجئة أخرى.'));
      results.replaceChildren();
      hits.slice(0, 80).forEach(function (h) {
        var s = Math.max(0, h.at - 70), snippet = (s ? '…' : '') + h.text.slice(s, h.at + q.length + 90).replace(/^#+ /gm, '').replace(/\s+/g, ' ') + '…';
        var i = fold(snippet).indexOf(lower);
        results.appendChild(X.el('button', { type: 'button', class: 'mhs-sr-row', lang: h.lang, on: { click: function () { page = h.page; highlight = q; original = h.lang === 'en' && readLang() !== 'en'; view = 'read'; show(); } } }, [
          X.el('b', { text: chapterTitle(chapterAt(h.page), readLang()) + ' · ' + t('Page ', 'পৃষ্ঠা ', 'صفحة ') + num(h.page + 1) }),
          X.el('small', {}, i >= 0 ? [snippet.slice(0, i), X.el('mark', { text: snippet.slice(i, i + q.length) }), snippet.slice(i + q.length)] : [snippet])]));
      });
    }
  }

  /* ---------- settings & offline ---------- */
  function settings(host) {
    var p = prefs(), cur = X.get('seerahLang', 'auto');
    var codes = window.MHSI18n && window.MHSI18n.codes || ['en', 'bn', 'ar'];
    var select = X.el('select', { 'aria-label': t('Reading language', 'পড়ার ভাষা', 'لغة القراءة') }, [X.el('option', { value: 'auto', text: t('Same as the app', 'অ্যাপের ভাষা অনুযায়ী', 'مثل لغة التطبيق') + ' (' + langName(appLang()) + ')', selected: cur === 'auto' })].concat(codes.map(function (code) { return X.el('option', { value: code, text: langName(code), selected: cur === code }); })));
    select.onchange = function () { X.set('seerahLang', select.value); original = false; show(); };
    function seg(label, key, opts) {
      var box = X.el('div', { class: 'mhs-sr-seg', role: 'radiogroup', 'aria-label': label });
      opts.forEach(function (o) {
        var b = X.el('button', { type: 'button', role: 'radio', 'aria-checked': String(p[key] === o[0]), class: p[key] === o[0] ? 'is-on' : '', 'data-v': String(o[0]), text: o[1], on: { click: function () {
          p[key] = o[0]; X.set('seerahReader', p); applyPrefs(); box.querySelectorAll('button').forEach(function (x) { var on = x === b; x.classList.toggle('is-on', on); x.setAttribute('aria-checked', String(on)); });
        } } });
        box.appendChild(b);
      });
      return X.el('div', { class: 'mhs-setting-row' }, [X.el('span', { text: label }), box]);
    }
    var justify = X.el('input', { type: 'checkbox', checked: !!p.justify, on: { change: function () { p.justify = justify.checked; X.set('seerahReader', p); applyPrefs(); } } });
    host.append(
      X.el('label', { class: 'mhs-setting-row' }, [X.el('span', { text: t('Reading language', 'পড়ার ভাষা', 'لغة القراءة') }), select]),
      seg(t('Page colour', 'পৃষ্ঠার রং', 'لون الصفحة'), 'theme', [['default', t('App', 'অ্যাপ', 'التطبيق')], ['sepia', t('Sepia', 'সেপিয়া', 'بني')], ['paper', t('Paper', 'কাগজ', 'ورقي')], ['night', t('Night', 'রাত', 'ليلي')]]),
      seg(t('Line spacing', 'লাইনের ব্যবধান', 'تباعد الأسطر'), 'spacing', [[1.6, t('Compact', 'কম', 'ضيق')], [1.9, t('Normal', 'স্বাভাবিক', 'عادي')], [2.3, t('Relaxed', 'বেশি', 'واسع')]]),
      seg(t('Typeface', 'ফন্ট', 'الخط'), 'face', [['serif', t('Book', 'বই', 'كتابي')], ['sans', t('Modern', 'আধুনিক', 'حديث')]]),
      X.el('label', { class: 'mhs-setting-row' }, [X.el('span', { text: t('Justify text', 'দুই পাশে সমান লেখা', 'ضبط النص') }), justify]),
      X.el('button', { type: 'button', class: 'mhs-btn', text: '⬇ ' + t('Download for offline reading', 'অফলাইনে পড়ার জন্য ডাউনলোড', 'تنزيل للقراءة دون اتصال'), on: { click: function () { var b = document.querySelector('#mhs-seerah [data-offline]'); if (b) b.click(); } } }),
      X.el('p', { class: 'mhs-mini-note', text: t('Other languages use labelled machine translation of the English edition; the original stays one tap away.', 'অন্যান্য ভাষায় ইংরেজি সংস্করণের চিহ্নিত স্বয়ংক্রিয় অনুবাদ দেখানো হয়; মূল পাঠ এক চাপে দেখা যায়।', 'تستخدم اللغات الأخرى ترجمة آلية موضحة للنسخة الإنجليزية، والأصل متاح بلمسة.') })
    );
  }
  function downloadPanel(host, status, stopped) {
    var busy = false, lang = readLang();
    status.textContent = t('Download the book to read it offline. Translations download page by page; keep this window open.', 'অফলাইনে পড়তে বইটি ডাউনলোড করুন। অনুবাদ পৃষ্ঠা ধরে ডাউনলোড হয়; উইন্ডো খোলা রাখুন।', 'نزّل الكتاب للقراءة دون اتصال. تُنزّل الترجمة صفحة صفحة؛ أبق النافذة مفتوحة.');
    async function run(translated) {
      if (busy) return; busy = true;
      try {
        await loadFull(); await toc(lang);
        for (var i = 0; translated && i < full.pages.length; i++) { if (stopped()) return; status.textContent = t('Downloading ', 'ডাউনলোড হচ্ছে ', 'جارٍ التنزيل ') + num(i + 1) + ' / ' + num(full.pages.length); await passage(i, lang); }
        status.textContent = t('Downloaded for offline reading on this device.', 'এই ডিভাইসে অফলাইনে পড়ার জন্য ডাউনলোড হয়েছে।', 'تم التنزيل للقراءة دون اتصال على هذا الجهاز.');
      } catch (e) { status.textContent = t('Download paused. Check your connection or storage and retry. Completed pages are kept.', 'ডাউনলোড থেমেছে। সংযোগ বা স্টোরেজ দেখে আবার চেষ্টা করুন। সম্পন্ন পৃষ্ঠা রাখা আছে।', 'توقف التنزيل. تحقق من الاتصال أو التخزين وأعد المحاولة.'); }
      finally { busy = false; }
    }
    host.appendChild(X.el('button', { type: 'button', class: 'mhs-btn', text: t('Download the English book', 'ইংরেজি বই ডাউনলোড', 'تنزيل الكتاب الإنجليزي'), on: { click: function () { run(false); } } }));
    if (lang !== 'en') host.appendChild(X.el('button', { type: 'button', class: 'mhs-btn primary', text: t('Download the ', 'ডাউনলোড: ', 'تنزيل ') + langName(lang) + t(' translation', ' অনুবাদ', ''), on: { click: function () { run(true); } } }));
  }

  /* ---------- Home feed ---------- */
  var END = /[.!?।۔。؟"”’)\]]$/;
  /* A short, complete passage: whole sentences from one paragraph, never a heading or a fragment. */
  function excerpt(text, max, lang) {
    max = max || 620;
    var paras = String(text).split(/\n{2,}/).map(function (s) { return s.trim(); }).filter(function (s) { return s && !/^#/.test(s); });
    var good = paras.filter(function (s) { return s.length >= 160 && END.test(s) && !/^[a-z,;)\]]/.test(s); });
    var p = good[0] || paras.filter(function (s) { return END.test(s); })[0] || paras[0] || '';
    if (p.length <= max) return p;
    var out = '';
    try {
      var seg = new Intl.Segmenter(lang || undefined, { granularity: 'sentence' });
      for (var it = seg.segment(p)[Symbol.iterator](), n = it.next(); !n.done; n = it.next()) { if ((out + n.value.segment).length > max) break; out += n.value.segment; }
    } catch (e) { out = p.slice(0, max).replace(/[^.!?।۔؟]*$/, ''); }
    out = out.trim();
    return out.length > 120 ? out : p.slice(0, max).replace(/\s+\S*$/, '') + '…';
  }
  function post(d, lang) {
    var c = chapterAt(d.page);
    return { id: 's:' + d.page, lang: lang, kind: 'seerah', text: excerpt(d.text, 0, lang), page: d.page, chapter: chapterTitle(c, lang),
      src: title() + ' · ' + t('Page ', 'পৃষ্ঠা ', 'صفحة ') + num(d.page + 1), goLabel: t('Continue reading', 'পড়া চালিয়ে যান', 'تابع القراءة'),
      go: function () { open({ page: d.page }); } };
  }
  /* Ready passages for the feed in this exact language (never another language as a placeholder). */
  function feedItems(lang) {
    lang = lang || appLang();
    var pool = feedPool[lang] || {};
    Object.keys(pages).forEach(function (k) { var p = pages[k]; if (p.lang === lang && !pool[p.page]) pool[p.page] = p; });
    feedPool[lang] = pool;
    if (!meta) return [];
    return Object.keys(pool).map(function (k) { return post(pool[k], lang); }).filter(function (p) { return p.text.length >= 120; });
  }
  function warm(lang) {
    lang = lang || appLang();
    if (warming[lang]) return warming[lang];
    warming[lang] = loadMeta().then(function () { return toc(lang); }).then(function () {
      return fetch('/api/seerah?view=featured&lang=' + encodeURIComponent(lang)).then(function (r) { return r.ok ? r.json() : { items: [] }; }).catch(function () { return { items: [] }; });
    }).then(function (d) {
      var pool = feedPool[lang] = feedPool[lang] || {};
      (d.items || []).forEach(function (p) { if (valid(p, lang, p.page)) { pool[p.page] = p; pages[lang + ':' + p.page] = pages[lang + ':' + p.page] || p; } });
      // Grow the shared library a little: one new page per session in this language.
      if (lang !== 'en' && Object.keys(pool).length < 12 && navigator.onLine && !X.get('seerahWarm:' + lang + ':' + X.dayKey(), false)) {
        X.set('seerahWarm:' + lang + ':' + X.dayKey(), true);
        var p = Math.floor(Math.random() * meta.count);
        passage(p, lang).then(function (r) { pool[p] = r; }).catch(function () {});
      }
      return feedItems(lang);
    }).catch(function () { warming[lang] = null; return []; });
    return warming[lang];
  }
  // Legacy names used elsewhere in the app.
  function load() { return loadMeta(); }

  window.MHSSeerah = { open: open, load: load, loadFull: loadFull, passage: passage, settings: settings, downloadPanel: downloadPanel, feedItems: feedItems, warm: warm, excerpt: excerpt, version: V,
    posts: function () { return feedItems(appLang()); }, localize: function () { return Promise.reject(Error('retired')); } };
  X.action({ k: 'seerah', c: 'linear-gradient(140deg,#986e39,#5e4931)', icon: 'M19 17V5a2 2 0 0 0-2-2H4|M8 21h12a2 2 0 0 0 2-2v-1a1 1 0 0 0-1-1H11a1 1 0 0 0-1 1v1a2 2 0 1 1-4 0V5a2 2 0 1 0-4 0v2a1 1 0 0 0 1 1h3|M10 8h6|M10 12h6', label: title, sub: function () { return t('The Sealed Nectar · contents, search & bookmarks', 'আর-রাহীকুল মাখতূম · সূচিপত্র, খোঁজা ও বুকমার্ক', 'الرحيق المختوم · فهرس وبحث وحفظ'); }, run: function () { open(); } });
})();
