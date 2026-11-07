/* MHSQuranSearch — powerful offline search across the whole Quran for the Quran reader.
 * Arabic (diacritics-insensitive), Bengali and English translation search with fuzzy/partial
 * matching, surah filter, highlighted results and history. Uses the exact same per-surah cache
 * the reader keeps in IndexedDB ("quran:<n>:<edition>"), so anything read is searchable offline;
 * "Download all" fetches the remaining surahs once (same API, same cache) for full offline search.
 * Adds a 🔍 button to the Quran sheet toolbar. Results deep-link to the ayah. */
(function () {
  "use strict";
  if (window.MHSQuranSearch) return;
  var X = window.MHSX, SR = function () { return window.MHSSearch; };
  var API = "https://api.alquran.cloud/v1/surah/", BISM = /^بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ\s*/;
  var t = X.tr({
    en: { title: "Search the Quran", sub: "Arabic · Bengali · English — works offline", ph: "Search ayahs… (e.g. patience, صبر, ধৈর্য)", all: "All surahs", results: "{n} ayahs found", none: "No ayah matches.", indexed: "{n} of 114 surahs available offline", download: "Download all for offline search", downloading: "Downloading {n}/114…", done: "All 114 surahs are available offline", failed: "Download paused — check your connection and try again", open: "Open ayah", min: "Type at least 2 characters" },
    bn: { title: "কুরআনে খুঁজুন", sub: "আরবি · বাংলা · ইংরেজি — অফলাইনে কাজ করে", ph: "আয়াত খুঁজুন… (যেমন: ধৈর্য, صبر, patience)", all: "সব সূরা", results: "{n}টি আয়াত পাওয়া গেছে", none: "কোনো আয়াত মেলেনি।", indexed: "১১৪টির মধ্যে {n}টি সূরা অফলাইনে আছে", download: "অফলাইন খোঁজার জন্য সব ডাউনলোড করুন", downloading: "ডাউনলোড হচ্ছে {n}/১১৪…", done: "১১৪টি সূরাই অফলাইনে আছে", failed: "ডাউনলোড থেমেছে — সংযোগ দেখে আবার চেষ্টা করুন", open: "আয়াত খুলুন", min: "অন্তত ২ অক্ষর লিখুন" },
    ar: { title: "ابحث في القرآن", sub: "عربي · بنغالي · إنجليزي — دون إنترنت", ph: "ابحث في الآيات…", all: "كل السور", results: "{n} آية", none: "لا نتائج.", indexed: "{n} من 114 سورة متاحة دون إنترنت", download: "تنزيل الكل للبحث دون إنترنت", downloading: "جارٍ التنزيل {n}/114…", done: "كل السور متاحة دون إنترنت", failed: "توقف التنزيل — تحقق من الاتصال", open: "افتح الآية", min: "اكتب حرفين على الأقل" }
  });
  function edition() { var l = X.lang(); return l === "bn" ? "bn.bengali" : l === "ar" ? "" : "en.sahih"; }
  function key(n) { return "quran:" + n + ":" + (edition() || "ar"); }
  var mem = {};
  function getSurah(n, fetchIfMissing) {
    var k = key(n); if (mem[k]) return Promise.resolve(mem[k]);
    var p = window.MHS && window.MHS.get ? window.MHS.get(k).catch(function () { return null; }) : Promise.resolve(null);
    return p.then(function (v) {
      if (v && v.ayahs) { mem[k] = v; return v; }
      if (!fetchIfMissing) return null;
      var eds = ["quran-uthmani"].concat(edition() ? [edition()] : []);
      return fetch(API + n + "/editions/" + eds.join(","), { cache: "force-cache" }).then(function (r) { if (!r.ok) throw new Error("http"); return r.json(); }).then(function (j) {
        var d = Array.isArray(j.data) ? j.data : [j.data], ar = d[0], tr = d[1];
        var h = { n: n, ayahs: ar.ayahs.map(function (a, i) { var txt = a.text; if (i === 0 && n !== 1 && n !== 9) txt = txt.replace(BISM, ""); return { a: a.numberInSurah, ar: txt, tr: tr && tr.ayahs[i] ? tr.ayahs[i].text : "" }; }) };
        mem[k] = h; if (window.MHS && window.MHS.set) window.MHS.set(k, h).catch(function () {}); return h;
      });
    });
  }
  function available() { var ps = []; for (var n = 1; n <= 114; n++) ps.push(getSurah(n, false)); return Promise.all(ps).then(function (r) { return r.filter(Boolean); }); }
  var sh = null, q = "", surahF = 0, hist = null, busy = false;
  function open(opts) {
    if (!window.MHSSheet) return;
    if (opts && opts.q) q = opts.q;
    if (sh && sh.dialog.open) { render(); return; }
    sh = X.sheet({ id: "mhs-quransearch", title: t("title"), sub: t("sub"), onClose: function () { sh = null; } });
    sh.body.classList.add("mhs-kh");
    render();
  }
  function surahName(n) { try { var r = window.MHSQuran.surahs[n - 1]; return X.lang() === "ar" ? r[1] : r[2]; } catch (e) { return "Surah " + n; } }
  function render() {
    var b = sh.body; b.replaceChildren();
    var RP = window.MHSReadPref; if (RP) RP.apply(b);
    var box = SR().box({ ns: "quran", placeholder: t("ph"), value: q, suggest: X.lang() === "bn" ? ["ধৈর্য", "রহমত", "জান্নাত"] : X.lang() === "ar" ? ["صبر", "رحمة", "جنة"] : ["patience", "mercy", "paradise"], onQuery: function (v) { q = v; run(); } });
    b.appendChild(box.el);
    var sel = X.el("select", { class: "mhs-select", "aria-label": t("all"), style: { width: "100%", marginBottom: ".6rem" } }, [X.el("option", { value: "0", text: t("all") })]);
    try { window.MHSQuran.surahs.forEach(function (r) { sel.appendChild(X.el("option", { value: String(r[0]), text: X.num(r[0]) + ". " + (X.lang() === "ar" ? r[1] : r[2]), selected: surahF === r[0] ? true : null })); }); } catch (e) {}
    sel.addEventListener("change", function () { surahF = Number(sel.value) || 0; run(); });
    b.appendChild(sel);
    var status = X.el("p", { class: "mhs-kh-count", role: "status" }), dl = X.el("div", { class: "mhs-actions", style: { marginBottom: ".6rem" } }), list = X.el("div", { class: "mhs-kh-list" });
    b.append(status, dl, list);
    available().then(function (av) {
      status.textContent = t("indexed", { n: X.num(av.length) });
      if (av.length < 114) dl.appendChild(X.el("button", { type: "button", class: "mhs-btn", disabled: busy ? true : null, text: "⬇ " + t("download"), on: { click: function (e) { downloadAll(e.currentTarget, status); } } }));
      run();
    });
    function run() {
      var qq = q.trim(); list.replaceChildren();
      if (qq.length < 2) { return; }
      list.appendChild(X.el("div", { class: "mhs-skel", style: { minHeight: "4rem" } }));
      available().then(function (av) {
        if (!sh || !sh.dialog.open || q.trim() !== qq) return;
        var rows = [];
        av.forEach(function (s) { if (surahF && s.n !== surahF) return; s.ayahs.forEach(function (a) { rows.push({ s: s.n, a: a.a, ar: a.ar, tr: a.tr }); }); });
        var res = SR().search(rows, qq, ["ar", "tr"], 120);
        list.replaceChildren();
        status.textContent = res.length ? t("results", { n: X.num(res.length) }) : t("none");
        res.forEach(function (r) {
          var it = r.item;
          list.appendChild(X.el("article", { class: "mhs-kh-item", role: "button", tabindex: "0", "aria-label": t("open"), on: { click: function () { sh.close(); setTimeout(function () { window.MHSQuran.open({ surah: it.s, ayah: it.a }); }, 120); }, keydown: function (e) { if (e.key === "Enter") { sh.close(); setTimeout(function () { window.MHSQuran.open({ surah: it.s, ayah: it.a }); }, 120); } } } }, [
            X.el("div", { class: "top" }, [X.el("b", { text: surahName(it.s) }), X.el("small", { class: "num", text: X.num(it.s) + ":" + X.num(it.a) })]),
            X.el("p", { class: "mhs-kh-ar", lang: "ar", dir: "rtl", html: SR().highlight(it.ar, qq) }),
            it.tr ? X.el("p", { class: "mhs-kh-tr", html: SR().highlight(it.tr, qq) }) : null
          ]));
        });
      });
    }
  }
  function downloadAll(btn, status) {
    if (busy) return; busy = true; btn.disabled = true;
    var n = 0;
    (function next(i) {
      if (i > 114) { busy = false; status.textContent = t("done"); btn.remove(); X.toast(t("done")); return; }
      getSurah(i, true).then(function () { n++; if (n % 3 === 0) status.textContent = t("downloading", { n: X.num(n) }); next(i + 1); }, function () { busy = false; btn.disabled = false; status.textContent = t("failed"); });
    })(1);
  }
  /* ---- Hadith: offline search across the on-device sahih pool (built-ins + reminders.json + wisdom.json) ---- */
  var BOOKS = { bukhari: "Sahih al-Bukhari", muslim: "Sahih Muslim", abudawud: "Sunan Abi Dawud", tirmidhi: "Jami' at-Tirmidhi", nasai: "Sunan an-Nasa'i", ibnmajah: "Sunan Ibn Majah", malik: "Muwatta Malik", ahmad: "Musnad Ahmad" };
  var ht = X.tr({
    en: { title: "Search Hadith", sub: "Arabic · Bengali · English — offline essentials", ph: "Search hadith… (e.g. intention, نية, নিয়ত)", all: "All books", results: "{n} hadith found", none: "No hadith matches.", open: "Open in reader", pool: "{n} sahih hadith available offline" },
    bn: { title: "হাদিস খুঁজুন", sub: "আরবি · বাংলা · ইংরেজি — অফলাইন", ph: "হাদিস খুঁজুন… (যেমন: নিয়ত, نية, intention)", all: "সব কিতাব", results: "{n}টি হাদিস পাওয়া গেছে", none: "কোনো হাদিস মেলেনি।", open: "রিডারে খুলুন", pool: "{n}টি সহিহ হাদিস অফলাইনে আছে" },
    ar: { title: "ابحث في الحديث", sub: "عربي · بنغالي · إنجليزي", ph: "ابحث…", all: "كل الكتب", results: "{n} حديث", none: "لا نتائج.", open: "افتح", pool: "{n} حديث متاح" }
  });
  var hpool = null;
  function hadithPool() {
    if (hpool) return Promise.resolve(hpool);
    var seen = {}, out = [];
    function push(h) { var id = h.book + ":" + h.n; if (seen[id] || !h.book || !h.n) return; seen[id] = 1; out.push(h); }
    try { (window.MHSWisdom && window.MHSWisdom.hadiths ? window.MHSWisdom.hadiths() : []).forEach(function (h) { push({ book: h.book, n: h.n, ar: h.ar, en: h.en, bn: h.bn, src: h.src }); }); } catch (e) {}
    return Promise.all([
      fetch("/data/reminders.json").then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; }),
      window.MHSWisdomApp ? window.MHSWisdomApp.load().catch(function () { return null; }) : Promise.resolve(null)
    ]).then(function (r) {
      if (r[0]) (r[0].hadiths || []).forEach(function (h) { push({ book: h.book, n: h.n, ar: h.ar, en: h.en, bn: h.bn, src: h.src, topic: h.topic }); });
      if (r[1]) (r[1].items || []).forEach(function (w) { if (w.author === "prophet" && w.book) push({ book: w.book, n: w.n, ar: w.ar, en: w.en, bn: w.bn, src: w.src }); });
      hpool = out; return out;
    });
  }
  var hs = null, hq = "", bookF = "";
  function openHadith(opts) {
    if (!window.MHSSheet) return;
    if (opts && opts.q) hq = opts.q;
    if (hs && hs.dialog.open) { renderH(); return; }
    hs = X.sheet({ id: "mhs-hadithsearch", title: ht("title"), sub: ht("sub"), onClose: function () { hs = null; } });
    hs.body.classList.add("mhs-kh"); renderH();
  }
  function renderH() {
    var b = hs.body; b.replaceChildren();
    var RP = window.MHSReadPref; if (RP) RP.apply(b);
    var box = SR().box({ ns: "hadith", placeholder: ht("ph"), value: hq, suggest: X.lang() === "bn" ? ["নিয়ত", "ধৈর্য", "দান"] : ["intention", "patience", "charity"], onQuery: function (v) { hq = v; run(); } });
    b.appendChild(box.el);
    var sel = X.el("select", { class: "mhs-select", "aria-label": ht("all"), style: { width: "100%", marginBottom: ".6rem" } }, [X.el("option", { value: "", text: ht("all") })].concat(Object.keys(BOOKS).map(function (k) { return X.el("option", { value: k, text: BOOKS[k], selected: bookF === k ? true : null }); })));
    sel.addEventListener("change", function () { bookF = sel.value; run(); });
    var status = X.el("p", { class: "mhs-kh-count", role: "status" }), list = X.el("div", { class: "mhs-kh-list" });
    b.append(sel, status, list);
    hadithPool().then(function (pool) { status.textContent = ht("pool", { n: X.num(pool.length) }); run(); });
    function run() {
      var qq = hq.trim(); list.replaceChildren(); if (qq.length < 2) return;
      hadithPool().then(function (pool) {
        if (!hs || !hs.dialog.open || hq.trim() !== qq) return;
        var rows = bookF ? pool.filter(function (h) { return h.book === bookF; }) : pool;
        var res = SR().search(rows, qq, ["ar", "en", "bn", "src", function (h) { return (h.topic || []).join(" "); }], 100);
        status.textContent = res.length ? ht("results", { n: X.num(res.length) }) : ht("none");
        res.forEach(function (r) {
          var h = r.item, go = function () { hs.close(); setTimeout(function () { window.MHSHadith && window.MHSHadith.open({ book: h.book, number: h.n }); }, 120); };
          list.appendChild(X.el("article", { class: "mhs-kh-item", role: "button", tabindex: "0", "aria-label": ht("open"), on: { click: go, keydown: function (e) { if (e.key === "Enter") go(); } } }, [
            X.el("div", { class: "top" }, [X.el("b", { text: BOOKS[h.book] || h.book }), X.el("small", { class: "num", text: X.num(h.n) })]),
            h.ar ? X.el("p", { class: "mhs-kh-ar", lang: "ar", dir: "rtl", html: SR().highlight(h.ar, qq) }) : null,
            X.el("p", { class: "mhs-kh-tr", html: SR().highlight(h[X.lang()] || h.en || "", qq) })
          ]));
        });
      });
    }
  }
  new MutationObserver(function () {
    var d = document.getElementById("mhs-hadith"); if (!d || d.__hs) return; d.__hs = true;
    var tools = d.querySelector(".mhs-mini-tools"); if (!tools) return;
    var add = function () { if (!tools.querySelector(".mhs-hs-btn")) tools.insertBefore(X.el("button", { type: "button", class: "mhs-mini-ib mhs-hs-btn", "aria-label": ht("title"), title: ht("title"), on: { click: function () { openHadith(); } } }, [X.icon("search")]), tools.firstChild); };
    new MutationObserver(add).observe(tools, { childList: true }); add();
  }).observe(document.body, { childList: true });

  window.MHSQuranSearch = { open: open, getSurah: getSurah, available: available };
  window.MHSHadithSearch = { open: openHadith, pool: hadithPool };
  /* Add the search button to the Quran sheet toolbar whenever it opens. */
  new MutationObserver(function () {
    var d = document.getElementById("mhs-quran"); if (!d || d.__qs) return; d.__qs = true;
    var tools = d.querySelector(".mhs-mini-tools"); if (!tools) return;
    var mo = new MutationObserver(function () { if (!tools.querySelector(".mhs-qs-btn")) tools.insertBefore(X.el("button", { type: "button", class: "mhs-mini-ib mhs-qs-btn", "aria-label": t("title"), title: t("title"), on: { click: function () { open(); } } }, [X.icon("search")]), tools.firstChild); });
    mo.observe(tools, { childList: true });
    tools.insertBefore(X.el("button", { type: "button", class: "mhs-mini-ib mhs-qs-btn", "aria-label": t("title"), title: t("title"), on: { click: function () { open(); } } }, [X.icon("search")]), tools.firstChild);
  }).observe(document.body, { childList: true });
})();
