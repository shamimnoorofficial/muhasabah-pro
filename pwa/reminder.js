/* MHSReminder — the Reminder (wisdom feed): Quran · authentic Hadith · Wisdom, rotating unseen items
 * first, each tap jumping to its exact source (ayah in the Quran reader, hadith entry, saying in
 * the Wisdom mini-app). Next · Share · Bookmark · Add-custom stay. Opt-in daily notifications with
 * user-controlled times, frequency and sources (Service Worker + Notifications, TWA-compatible).
 * Supersedes the open() of the legacy feed (pwa/wisdom.js) while reusing its built-in content. */
(function () {
  "use strict";
  if (window.MHSReminder) return;
  var X = window.MHSX;
  var t = X.tr({
    en: { title: "Reminder", sub: "Verses, hadith and wise words", all: "All", verse: "Quran", hadith: "Hadith", quote: "Wisdom", favs: "Saved", mine: "Mine", next: "Next", share: "Share", fav: "Save", unfav: "Saved", add: "Add own", openQ: "Open in Quran", openH: "Open in Hadith", openW: "Open in Wisdom", none: "Nothing in this filter yet.", context: "Context",
      nTitle: "Daily reminder notifications", nSub: "A random verse, hadith or saying at the times you choose — even when the app is closed.", nEnable: "Daily reminders", nTimes: "Times", nAdd: "+ Add time", nSources: "Sources", nPerDay: "{n} per day", nDenied: "Notifications are blocked. Allow them in your browser or phone settings.", nUnsupported: "This browser doesn't support notifications.", nTest: "Send test", nSent: "Test sent", nIos: "On iPhone/iPad, add the app to the Home Screen first.", nNote: "Reminders are scheduled on this device; they arrive while the app is open or in the background and via push when the daily push reminder is on.",
      addTitle: "Add a quote or saying", text: "Text", textPh: "Write the quote, verse or saying…", by: "Source / author", byPh: "e.g. Imam Ahmad, Surah Al-Kahf 18:10", kind: "Type", save: "Save", cancel: "Cancel", saved: "Saved to your reminders", delete: "Delete", deleted: "Removed", dua: "Duas & Ilm", openK: "Open in Duas & Ilm", k_dua: "Dua", k_amol: "Amol", k_name: "Names of Allah", appQuran: "Quran", appHadith: "Hadith", appWisdom: "Hikmah", appDua: "Duas & Ilm", appSeerah: "Seerah", appJournal: "Private diary", mixTitle: "Feed sources", mixSub: "Choose which apps the feed draws from, and how often each one appears.", mixMode: "How to mix", mixRandom: "Random mix", mixRandomSub: "Every app equally", mixCustom: "Custom", mixCustomSub: "Set more or less per app", mixAmount: "Amount", lv_less: "Less", lv_normal: "Normal", lv_more: "More" },
    bn: { title: "স্মরণ", sub: "আয়াত, হাদিস ও জ্ঞানের কথা", all: "সব", verse: "কুরআন", hadith: "হাদিস", quote: "হিকমাহ", favs: "সংরক্ষিত", mine: "আমার", next: "পরবর্তী", share: "শেয়ার", fav: "সংরক্ষণ", unfav: "সংরক্ষিত", add: "নিজের যোগ", openQ: "কুরআনে খুলুন", openH: "হাদিসে খুলুন", openW: "হিকমাহে খুলুন", none: "এই ফিল্টারে এখনো কিছু নেই।", context: "প্রসঙ্গ",
      nTitle: "দৈনিক স্মরণ নোটিফিকেশন", nSub: "আপনার বেছে নেওয়া সময়ে একটি আয়াত, হাদিস বা বাণী — অ্যাপ বন্ধ থাকলেও।", nEnable: "দৈনিক স্মরণ", nTimes: "সময়", nAdd: "+ সময় যোগ", nSources: "উৎস", nPerDay: "দিনে {n}টি", nDenied: "নোটিফিকেশন বন্ধ আছে। ব্রাউজার বা ফোনের সেটিংসে অনুমতি দিন।", nUnsupported: "এই ব্রাউজারে নোটিফিকেশন সমর্থিত নয়।", nTest: "পরীক্ষা পাঠান", nSent: "পরীক্ষা পাঠানো হয়েছে", nIos: "আইফোন/আইপ্যাডে প্রথমে হোম স্ক্রিনে অ্যাপ যোগ করুন।", nNote: "স্মরণগুলো এই ডিভাইসে নির্ধারিত হয়; অ্যাপ খোলা বা ব্যাকগ্রাউন্ডে থাকলে এবং দৈনিক পুশ চালু থাকলে পুশের মাধ্যমে আসে।",
      addTitle: "একটি উক্তি বা বাণী যোগ করুন", text: "লেখা", textPh: "উক্তি, আয়াত বা বাণী লিখুন…", by: "সূত্র / বক্তা", byPh: "যেমন: ইমাম আহমাদ, সূরা কাহফ ১৮:১০", kind: "ধরন", save: "সংরক্ষণ", cancel: "বাতিল", saved: "আপনার স্মরণে যোগ হয়েছে", delete: "মুছুন", deleted: "মুছে ফেলা হয়েছে", dua: "দোয়া ও ইলম", openK: "দোয়া ও ইলমে খুলুন", k_dua: "দোয়া", k_amol: "আমল", k_name: "আল্লাহর নাম", appQuran: "কুরআন", appHadith: "হাদিস", appWisdom: "হিকমাহ", appDua: "দোয়া ও ইলম", appSeerah: "সীরাত", appJournal: "ব্যক্তিগত ডায়েরি", mixTitle: "ফিডের উৎস", mixSub: "কোন কোন অ্যাপ থেকে ফিডে পোস্ট আসবে এবং কোনটি কত বেশি আসবে তা ঠিক করুন।", mixMode: "মেশানোর ধরন", mixRandom: "র‍্যান্ডম মিশ্রণ", mixRandomSub: "সব অ্যাপ থেকে সমানভাবে", mixCustom: "নিজের মতো", mixCustomSub: "প্রতিটি অ্যাপে কম বা বেশি ঠিক করুন", mixAmount: "পরিমাণ", lv_less: "কম", lv_normal: "স্বাভাবিক", lv_more: "বেশি" },
    ar: { title: "تذكرة", sub: "آيات وأحاديث وحِكم", all: "الكل", verse: "القرآن", hadith: "الحديث", quote: "الحكمة", favs: "المحفوظات", mine: "لي", next: "التالي", share: "مشاركة", fav: "حفظ", unfav: "محفوظ", add: "أضف", openQ: "افتح في القرآن", openH: "افتح في الحديث", openW: "افتح في الحكمة", none: "لا شيء هنا بعد.", context: "السياق",
      nTitle: "إشعارات التذكير اليومي", nSub: "آية أو حديث أو حكمة في الأوقات التي تختارها.", nEnable: "تذكير يومي", nTimes: "الأوقات", nAdd: "+ وقت", nSources: "المصادر", nPerDay: "{n} يومياً", nDenied: "الإشعارات محظورة.", nUnsupported: "المتصفح لا يدعم الإشعارات.", nTest: "إشعار تجريبي", nSent: "تم الإرسال", nIos: "أضف التطبيق إلى الشاشة الرئيسية أولاً.", nNote: "تُجدول التذكيرات على هذا الجهاز.",
      addTitle: "أضف حكمة", text: "النص", textPh: "اكتب…", by: "المصدر", byPh: "مثال: الإمام أحمد", kind: "النوع", save: "حفظ", cancel: "إلغاء", saved: "تم الحفظ", delete: "حذف", deleted: "تم الحذف", dua: "الأدعية والعلم", openK: "افتح في الأدعية والعلم", k_dua: "دعاء", k_amol: "عمل", k_name: "أسماء الله", appQuran: "القرآن", appHadith: "الحديث", appWisdom: "الحكمة", appDua: "الأدعية والعلم", appSeerah: "السيرة", appJournal: "يوميات خاصة", mixTitle: "مصادر الموجز", mixSub: "اختر التطبيقات التي يأتي منها الموجز وكم يظهر كل منها.", mixMode: "طريقة المزج", mixRandom: "مزيج عشوائي", mixRandomSub: "كل التطبيقات بالتساوي", mixCustom: "مخصص", mixCustomSub: "حدد الأكثر والأقل لكل تطبيق", mixAmount: "الكمية", lv_less: "أقل", lv_normal: "عادي", lv_more: "أكثر" }
  });
  function ls(k, d) { try { return JSON.parse(localStorage.getItem(k) || "null") || d; } catch (e) { return d; } }
  function lsSet(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function favs() { return ls("mhs:wisdom:favs", []); }
  function mine() { return ls("mhs:wisdom:custom", []); }
  function L(o) { if (!o) return ""; if (typeof o === "string") return o; return o[X.lang()] || o.en || o.bn || ""; }
  function surahName(s) { try { var r = window.MHSQuran.surahs[s - 1]; return X.lang() === "ar" ? r[1] : r[2]; } catch (e) { return "Surah " + s; } }
  var BOOKS = { bukhari: "Sahih al-Bukhari", muslim: "Sahih Muslim", abudawud: "Sunan Abi Dawud", tirmidhi: "Jami' at-Tirmidhi", nasai: "Sunan an-Nasa'i", ibnmajah: "Sunan Ibn Majah", malik: "Muwatta Malik", ahmad: "Musnad Ahmad" };

  /* ---- pool: legacy built-ins + /data/reminders.json + /data/wisdom.json + user items ---- */
  var extra = null, wis = null, kdata = null, loading = null;
  function loadExtra() {
    if (loading) return loading;
    loading = Promise.all([
      fetch("/data/reminders.json").then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; }),
      window.MHSWisdomApp ? window.MHSWisdomApp.load().catch(function () { return null; }) : Promise.resolve(null),
      new Promise(function(resolve){X.whenReady("MHSSeerah",function(S){S.warm(feedLang()).then(resolve).catch(function(){resolve(null);});});}),
      loadKnowledge()
    ]).then(function (r) { extra = r[0]; wis = r[1]; return true; });
    return loading;
  }
  /* Duas & Ilm posts (masnun duas, daily amol, the 99 Names). Loaded alongside the rest but never
   * allowed to hold the feed back: a slow or missing file just means no Duas & Ilm posts yet. */
  var kloading = null;
  function loadKnowledge() {
    if (!window.MHSKnowledge) return Promise.resolve(null);
    if (!kloading) kloading = Promise.all(["duas", "amol", "names"].map(function (n) { return window.MHSKnowledge.load(n).catch(function () { return null; }); }))
      .then(function (r) { kdata = { duas: r[0], amol: r[1], names: r[2] }; if (!r[0] && !r[1] && !r[2]) kloading = null; return kdata; });
    return Promise.race([kloading, new Promise(function (res) { setTimeout(res, 400); })]);
  }
  function pool() {
    var out = [], ids = {};
    function push(it) { if (ids[it.id]) return; ids[it.id] = 1; out.push(it); }
    var legacy = window.MHSWisdom && window.MHSWisdom.data ? window.MHSWisdom.data() : [];
    if (extra) {
      (extra.verses || []).forEach(function (v) { push({ id: "v" + v.s + ":" + v.a, kind: "verse", ar: v.ar, text: v[X.lang()] || v.en, ctx: L(v.context), tags: v.topic || [], src: surahName(v.s) + " " + v.s + ":" + v.a, go: function () { window.MHSQuran && window.MHSQuran.open({ surah: v.s, ayah: v.a }); }, goLabel: t("openQ") }); });
      (extra.hadiths || []).forEach(function (h) { push({ id: "h" + h.book + ":" + h.n, kind: "hadith", ar: h.ar, text: h[X.lang()] || h.en, tags: h.topic || [], src: h.src || (BOOKS[h.book] || h.book) + " " + h.n, go: function () { window.MHSHadith && window.MHSHadith.open({ book: h.book, number: h.n }); }, goLabel: t("openH") }); });
    }
    if (wis) (wis.items || []).forEach(function (w) {
      var author = (wis.authors || []).filter(function (a) { return a.id === w.author; })[0];
      push({ id: "w:" + w.id, kind: "quote", ar: w.ar || "", text: w[X.lang()] || w.en, tags: w.tags || [], src: (author ? L(author) : "") + (w.src ? " · " + w.src : ""), go: function () { window.MHSWisdomApp && window.MHSWisdomApp.open({ id: w.id }); }, goLabel: t("openW") });
    });
    legacy.forEach(function (it) {
      if (it.kind === "quote" && !it.mine && !it.go) { var txt = it.text; it.go = function () { window.MHSWisdomApp && window.MHSWisdomApp.open({ q: String(txt).split(" ").slice(0, 4).join(" ") }); }; it.goLabel = t("openW"); }
      else if (it.kind === "verse") it.goLabel = t("openQ"); else if (it.kind === "hadith") it.goLabel = t("openH");
      push(it);
    });
    if (kdata) {
      var K = window.MHSKnowledge, kl = function (k) { return K && K.t ? K.t(k) : k; };
      var kopen = function (tab, id) { return function () { window.MHSKnowledge && window.MHSKnowledge.open({ tab: tab, id: id }); }; };
      ((kdata.duas || {}).items || []).forEach(function (d) { var tx = L(d); if (!tx) return; push({ id: "k:" + d.id, kind: "dua", sub: "dua", ar: d.ar || "", text: tx, src: L(d.title) + (d.src ? " · " + d.src : ""), go: kopen("duas", d.id), goLabel: t("openK") }); });
      ((kdata.amol || {}).items || []).forEach(function (m) { var tx = L(m.fazilat) || L(m.how); if (!tx) return; push({ id: "k:" + m.id, kind: "dua", sub: "amol", ar: "", text: L(m.title) + " — " + tx, src: m.src || L(m.title), go: kopen("amol", m.id), goLabel: t("openK") }); });
      ((kdata.names || {}).items || []).forEach(function (n) { var mn = L(n.meaning); push({ id: "k:" + n.id, kind: "dua", sub: "name", ar: n.ar || "", text: (n.tl ? n.tl + " — " : "") + L(n) + (mn ? ". " + mn : ""), src: kl("names") + (n.n ? " · " + X.num(Number(n.n)) : ""), go: kopen("names", n.id), goLabel: t("openK") }); });
    }
    if(window.MHSSeerah) window.MHSSeerah.feedItems(feedLang()).forEach(push);
    var journal = window.MHS && window.MHS.current() && window.MHS.current().journal || {};
    Object.keys(journal).forEach(function(day) { if(journal[day].text) push({id:"j:"+day,kind:"journal",text:journal[day].text,src:day,go:function(){window.MHSJournal.open(day);}}); });
    return out;
  }
  /* unseen-first rotation (persisted) */
  function seen() { var s = X.get("rfseen", null) || { ids: [] }; s.ids = Array.isArray(s.ids) ? s.ids : []; return s; }
  /* Each post type gets a share of the feed; Seerah and diary appear less often than verses,
   * hadith and wisdom, whatever the size of each library. Unseen posts come first. */
  /* Feed mix (Reminder settings): every app can be switched on or off. "random" gives every
   * enabled app the same share; "custom" uses the amount chosen per app (less / normal / more). */
  var SOURCES = ["verse", "hadith", "quote", "dua", "seerah", "journal"];
  var SRC_DEF = { verse: true, hadith: true, quote: true, dua: true, seerah: true, journal: false };
  var LEVEL_W = { less: 1, normal: 3, more: 6 };
  var MIX_DEF = { mode: "custom", level: { verse: "normal", hadith: "normal", quote: "normal", dua: "normal", seerah: "less", journal: "less" } };
  function feedSources() { return Object.assign({}, SRC_DEF, X.get("feedSources", null) || {}); }
  function feedMix() { var m = X.get("feedMix", null) || {}; return { mode: m.mode === "random" ? "random" : "custom", level: Object.assign({}, MIX_DEF.level, m.level || {}) }; }
  function weight(kind, mix) { if (mix.mode === "random") return 1; return LEVEL_W[mix.level[kind]] || 3; }
  function pick(filter) {
    var sources = feedSources(), mix = feedMix(), WEIGHT = {}; SOURCES.forEach(function (k) { WEIGHT[k] = weight(k, mix); });
    var all = pool().filter(function (r) { return sources[r.kind] !== false; }).filter(function (r) { return filter === "all" || (filter === "favs" ? favs().indexOf(r.id) >= 0 : filter === "mine" ? r.mine : r.kind === filter); });
    if (!all.length) return null;
    var s = seen(), unseen = all.filter(function (r) { return s.ids.indexOf(r.id) < 0; });
    if (!unseen.length) { s.ids = s.ids.filter(function (id) { return !all.some(function (r) { return r.id === id; }); }); unseen = all; }
    var kinds = {}; unseen.forEach(function (r) { (kinds[r.kind] = kinds[r.kind] || []).push(r); });
    var names = Object.keys(kinds), total = names.reduce(function (n, k) { return n + (WEIGHT[k] || 2); }, 0), roll = Math.random() * total, kind = names[0];
    for (var i = 0; i < names.length; i++) { roll -= WEIGHT[names[i]] || 2; if (roll <= 0) { kind = names[i]; break; } }
    var list = kinds[kind], it = list[Math.floor(Math.random() * list.length)];
    s.ids.push(it.id); if (s.ids.length > 2000) s.ids = s.ids.slice(-2000); X.set("rfseen", s);
    return Object.assign({}, it, { _lang: feedLang() });
  }
  function feedLang() { return window.MHSLocale || document.documentElement.lang || "en"; }

  /* ---- UI ---- */
  var sh = null, filter = "all", cur = null, adding = false, historyItems = [], historyAt = -1, configuring = false, gestureActive = false, deferredRender = false;
  function advance(step) { if (step < 0) { if (historyAt > 0) cur = historyItems[--historyAt]; } else if (historyAt < historyItems.length - 1) cur = historyItems[++historyAt]; else { if(cur && historyAt < 0) { historyItems.push(cur); historyAt = 0; } cur = pick(filter); if(cur) { historyItems.push(cur); historyAt = historyItems.length - 1; } } render(true); }
  function open(opts) {
    if (!window.MHSSheet) return;
    if (opts && opts.id) cur = pool().filter(function (r) { return r.id === opts.id; })[0] || null;
    if (sh && sh.dialog.open && !sh.embedded) { render(); return; }
    sh = X.sheet({ id: "mhs-wisdom", title: t("title"), sub: t("sub"), onClose: function () { gestureActive=false;deferredRender=false;sh = null; } });
    sh.body.classList.add("mhs-kh");
    render();
    loadExtra().then(function () { if (sh && sh.dialog.open && !cur) { cur = pick(filter); render(); } });
  }
  function render(next) {
    if(gestureActive){deferredRender=true;return;}
    if (!sh) return;
    var b = sh.body; b.replaceChildren(); sh.tools.replaceChildren();
    var RP = window.MHSReadPref; if (RP) { RP.apply(b); if(configuring) b.appendChild(RP.controls(b)); }
    sh.tools.appendChild(X.el("button", {type:"button",class:"mhs-mini-ib", "aria-expanded":String(configuring), "aria-label":X.lang()==="bn"?"ফিড সেটিংস":X.lang()==="ar"?"إعدادات الموجز":"Feed settings",on:{click:function(){configuring=!configuring;render();}}}, [sh.icon("M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z|M12 2v3|M12 19v3|M2 12h3|M19 12h3|M5 5l2 2|M17 17l2 2|M5 19l2-2|M17 7l2-2")]));
    if(configuring) sh.tools.appendChild(X.el("button", { type: "button", class: "mhs-mini-ib" + (adding ? " is-on" : ""), "aria-label": t("add"), title: t("add"), on: { click: function () { adding = !adding; render(); } } }, [sh.icon("M12 5v14|M5 12h14")]));
    var chips = X.el("div", { class: "mhs-mini-chips", role: "tablist" });
    [["all", t("all")], ["verse", "📖 " + t("verse")], ["hadith", "📚 " + t("hadith")], ["quote", "💡 " + t("quote")], ["dua", "🤲 " + t("dua")], ["favs", "♥ " + t("favs")], ["mine", "✍️ " + t("mine")]].forEach(function (o) {
      chips.appendChild(X.el("button", { type: "button", role: "tab", class: "mhs-chip" + (filter === o[0] ? " is-on" : ""), "aria-selected": String(filter === o[0]), text: o[1], on: { click: function () { filter = o[0]; cur = pick(filter); render(); } } }));
    });
    if(configuring) b.appendChild(chips);
    if (adding) b.appendChild(form());
    // Never show a post prepared for another language: re-resolve it, or pick a new one.
    if (cur && cur._lang && cur._lang !== feedLang()) { var again = pool().filter(function (r) { return r.id === cur.id; })[0]; historyItems = []; historyAt = -1; cur = again ? Object.assign({}, again, { _lang: feedLang() }) : null; }
    if (!cur) cur = pick(filter);
    if (!cur) b.appendChild(X.el("p", { class: "mhs-kh-empty", text: t("none") }));
    else {
      var a = cur, isFav = favs().indexOf(a.id) >= 0;

      var card = X.el("div", { class: "mhs-rf-card", role: "region", "aria-live": "polite" }, [
        X.el("div", { class: "mhs-rf-type", text: ({seerah:X.lang()==="bn"?"সীরাত":X.lang()==="ar"?"السيرة":"Seerah",journal:X.lang()==="bn"?"ডায়েরি":X.lang()==="ar"?"اليوميات":"Diary"})[a.kind] || (a.kind === "dua" && a.sub ? t("k_" + a.sub) : t(a.kind)) }),
        a.ar ? X.el("div", { class: "mhs-rf-ar" + (String(a.ar).length>450?" is-collapsed":""), lang: "ar", dir: "rtl", text: a.ar }) : null,
        a.kind === "seerah" && a.chapter ? X.el("div", { class: "mhs-rf-chapter", text: a.chapter }) : null,
        X.el("div", { class: "mhs-rf-text" + (String(a.text).length>650?" is-collapsed":""), lang: a.lang || null, dir: a.lang && window.MHSI18n && window.MHSI18n.isRtl && window.MHSI18n.isRtl(a.lang) ? "rtl" : a.lang ? "ltr" : null, translate: a.kind === "seerah" ? "no" : null, text: a.text }),
        a.ctx ? X.el("p", { class: "mhs-rf-ctx", text: t("context") + ": " + a.ctx }) : null,
        a.go ? X.el("button", { type: "button", class: "mhs-rf-src", "aria-label": a.goLabel || a.src, on: { click: function () { sh.close(); setTimeout(a.go, 120); } } }, ["— " + a.src + " ↗"]) : X.el("div", { class: "mhs-rf-src", style: { border: "0", cursor: "default" }, text: "— " + a.src }),
        a.tags && a.tags.length ? X.el("div", { class: "mhs-rf-tags" }, a.tags.slice(0, 4).map(function (g) { return X.el("span", { text: "#" + g }); })) : null,
        a.mine ? X.el("button", { type: "button", class: "mhs-chip", style: { marginTop: ".6rem" }, text: "🗑 " + t("delete"), on: { click: function () { lsSet("mhs:wisdom:custom", mine().filter(function (m) { return m.id !== a.id; })); X.toast(t("deleted")); cur = pick(filter); render(); } } }) : null
      ]);
      var content=X.el("div",{class:"mhs-story-content",tabindex:0,"aria-label":t(a.kind)});
      while(card.firstChild)content.appendChild(card.firstChild);
      content.querySelectorAll(".is-collapsed").forEach(function(n){n.classList.remove("is-collapsed");});
      card.appendChild(content);
      var start=null; card.style.touchAction="pan-y";
      function begin(x,y){start={x:x,y:y,at:performance.now(),axis:null};gestureActive=true;}
      function move(x,y,event){
        if(!start)return;
        var dx=x-start.x,dy=y-start.y;
        if(!start.axis&&Math.max(Math.abs(dx),Math.abs(dy))>10)start.axis=Math.abs(dx)>Math.abs(dy)*1.15?"x":"y";
        if(start.axis==="x"){
          if(event.cancelable)event.preventDefault();
          content.classList.add("is-swiping");
          content.style.transform="translateX("+Math.max(-70,Math.min(70,dx*.3))+"px)";
        }
      }
      function finish(x,y,cancelled,event){
        if(!start)return;
        var dx=x-start.x,dy=y-start.y,elapsed=Math.max(1,performance.now()-start.at);
        var horizontal=start.axis!=="y"&&Math.abs(dx)>Math.abs(dy)*1.15;
        var navigate=!cancelled&&horizontal&&(Math.abs(dx)>=40||(Math.abs(dx)>=22&&Math.abs(dx)/elapsed>.35));
        start=null;gestureActive=false;content.style.transform="";content.classList.remove("is-swiping");
        var refresh=deferredRender;deferredRender=false;
        if(navigate){if(event&&event.cancelable)event.preventDefault();advance((dx<0)!==(document.documentElement.dir==="rtl")?1:-1);}
        else if(refresh)render();
      }
      card.addEventListener("touchstart",function(e){if(e.touches.length!==1||e.target.closest("button"))return;begin(e.touches[0].clientX,e.touches[0].clientY);},{passive:true});
      card.addEventListener("touchmove",function(e){if(e.touches.length!==1){finish(0,0,true);return;}move(e.touches[0].clientX,e.touches[0].clientY,e);},{passive:false});
      card.addEventListener("touchend",function(e){var p=e.changedTouches[0];if(p)finish(p.clientX,p.clientY,false,e);},{passive:false});
      card.addEventListener("touchcancel",function(){finish(0,0,true);},{passive:true});
      card.addEventListener("pointerdown",function(e){if(e.pointerType==="touch"||e.button!==0||e.target.closest("button"))return;begin(e.clientX,e.clientY);card.setPointerCapture(e.pointerId);});
      card.addEventListener("pointermove",function(e){if(e.pointerType!=="touch")move(e.clientX,e.clientY,e);});
      card.addEventListener("pointerup",function(e){if(e.pointerType!=="touch")finish(e.clientX,e.clientY,false,e);});
      card.addEventListener("pointercancel",function(e){if(e.pointerType!=="touch")finish(0,0,true);});
      card.addEventListener("lostpointercapture",function(e){if(e.pointerType!=="touch")finish(0,0,true);});
      card.tabIndex=0;
      card.addEventListener("keydown",function(e){if(e.target.closest("button"))return;if(e.key==="ArrowRight"||e.key==="ArrowLeft"){e.preventDefault();advance((e.key==="ArrowRight")!==(document.documentElement.dir==="rtl")?1:-1);}});
      var progress=X.el("div",{class:"mhs-story-progress","aria-hidden":"true"});
      for(var segment=0;segment<5;segment++) progress.appendChild(X.el("span",{class:segment<=Math.max(0,historyAt)%5?"is-seen":""}));
      card.prepend(progress);
      card.appendChild(X.el("span",{class:"mhs-story-hint",text:X.lang()==="bn"?"সোয়াইপ করে পরেরটি পড়ুন":X.lang()==="ar"?"اسحب للقراءة التالية":"Swipe to explore"}));
      if(next)card.classList.add("mhs-story-enter");
      b.appendChild(card);
      var reactions=X.get("feedReactions",{});
      function label(en,bn,ar){return X.lang()==="bn"?bn:X.lang()==="ar"?ar:en;}
      function action(name,path,run,extra){return X.el("button",Object.assign({type:"button","aria-label":name,title:name,on:{click:run}},extra||{}),[sh.icon(path)]);}
      var saved=window.MHSCollections&&window.MHSCollections.collect().some(function(i){return i.id==="r"+a.id;});
      var actions=X.el("div",{class:"mhs-rf-actions mhs-story-actions"},[
        action(label("Previous","পূর্ববর্তী","السابق"),"M15 18l-6-6 6-6",function(){advance(-1);},{disabled:historyAt<=0,class:"mhs-story-prev"}),
        action(label("React","প্রতিক্রিয়া","إعجاب"),"M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z",function(){reactions[a.id]=!reactions[a.id];X.set("feedReactions",reactions);render();},{class:reactions[a.id]?"is-reacted":"","aria-pressed":String(!!reactions[a.id])}),
        action(label("Save to collection","কালেকশনে রাখুন","حفظ في مجموعة"),"M19 21l-7-5-7 5V3h14Z",function(){window.MHSCollections.choose({id:"r"+a.id,kind:"reminder",title:a.text,sub:a.src});},{class:saved?"is-bookmarked":""}),
        action(t("share"),"M18 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z|M6 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z|M18 22a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z|M8.6 10.5l6.8-4|M8.6 13.5l6.8 4",function(){window.MHSShare.menu({medium:"reminder",eyebrow:t(a.kind),ar:a.ar,text:a.text,src:a.src,link:{id:a.id}});}),
        action(t("next"),"M9 18l6-6-6-6",function(){advance(1);},{class:"mhs-story-next"})
      ]);
      card.appendChild(actions);

    }
    if(configuring) {
      b.appendChild(mixPanel()); b.appendChild(notifCard());
    }
  }
  function srcName(k) { return ({ verse: t("appQuran"), hadith: t("appHadith"), quote: t("appWisdom"), dua: t("appDua"), seerah: t("appSeerah"), journal: t("appJournal") })[k] || k; }
  function mixPanel() {
    var sources = feedSources(), mix = feedMix();
    function reset() { cur = null; historyItems = []; historyAt = -1; }
    var box = X.el("fieldset", { class: "mhs-feed-sources" }, [X.el("legend", { text: t("mixTitle") }), X.el("p", { class: "mhs-feed-mix-hint", text: t("mixSub") })]);
    var modes = X.el("div", { class: "mhs-feed-mode", role: "radiogroup", "aria-label": t("mixMode") });
    [["random", t("mixRandom"), t("mixRandomSub")], ["custom", t("mixCustom"), t("mixCustomSub")]].forEach(function (o) {
      var on = mix.mode === o[0];
      modes.appendChild(X.el("button", { type: "button", role: "radio", "aria-checked": String(on), class: on ? "is-on" : "", "data-mode": o[0], on: { click: function () { var m = feedMix(); m.mode = o[0]; X.set("feedMix", m); reset(); render(); } } }, [X.el("b", { text: o[1] }), X.el("small", { text: o[2] })]));
    });
    box.appendChild(modes);
    var rows = X.el("div", { class: "mhs-feed-src-rows" });
    SOURCES.forEach(function (k) {
      var cb = X.el("input", { type: "checkbox", checked: !!sources[k], on: { change: function () { var s = feedSources(); s[k] = cb.checked; if (!SOURCES.some(function (x) { return s[x]; })) { s[k] = true; cb.checked = true; } X.set("feedSources", s); reset(); render(); } } });
      var lv = X.el("div", { class: "mhs-feed-level", role: "radiogroup", "aria-label": t("mixAmount") + ": " + srcName(k) });
      ["less", "normal", "more"].forEach(function (l) {
        var on = mix.level[k] === l;
        lv.appendChild(X.el("button", { type: "button", role: "radio", "aria-checked": String(on), class: on ? "is-on" : "", "data-level": l, disabled: mix.mode === "random" || !sources[k] ? true : null, text: t("lv_" + l), on: { click: function () { var m = feedMix(); m.level[k] = l; X.set("feedMix", m); reset(); render(); } } }));
      });
      rows.appendChild(X.el("div", { class: "mhs-feed-src" + (sources[k] ? "" : " is-off"), "data-src": k }, [X.el("label", {}, [cb, X.el("span", { text: srcName(k) })]), lv]));
    });
    box.appendChild(rows);
    return box;
  }
  function form() {
    var ta = X.el("textarea", { rows: "3", maxlength: "600", placeholder: t("textPh"), "aria-label": t("text"), style: { width: "100%", minHeight: "5rem", borderRadius: ".9rem", border: "1px solid hsl(var(--border))", background: "hsl(var(--background) / .6)", color: "inherit", padding: ".6rem .8rem", font: "inherit", fontSize: "15px" } });
    var by = X.el("input", { type: "text", maxlength: "80", placeholder: t("byPh"), "aria-label": t("by") });
    var kind = X.el("select", { class: "mhs-select", "aria-label": t("kind") }, [["quote", t("quote")], ["verse", t("verse")], ["hadith", t("hadith")]].map(function (o) { return X.el("option", { value: o[0], text: o[1] }); }));
    return X.el("form", { class: "mhs-es-form", on: { submit: function (e) {
      e.preventDefault(); var txt = ta.value.trim(); if (txt.length < 3) return;
      var m = mine(); var it = { id: "m" + Date.now(), text: txt, by: by.value.trim(), kind: kind.value, mine: true }; m.push(it); lsSet("mhs:wisdom:custom", m); adding = false; filter = "mine"; cur = { id: it.id, kind: it.kind, ar: "", text: it.text, src: it.by || t("mine"), mine: true }; render(); X.toast(t("saved"));
    } } }, [X.el("h4", { text: "✍️ " + t("addTitle") }), ta, by, kind, X.el("div", { class: "mhs-actions" }, [X.el("button", { type: "submit", class: "mhs-btn primary", text: t("save") }), X.el("button", { type: "button", class: "mhs-btn", text: t("cancel"), on: { click: function () { adding = false; render(); } } })])]);
  }

  /* ---- daily notifications ---- */
  var DEF = { on: false, times: ["08:00", "20:00"], sources: { verse: true, hadith: true, quote: true } };
  function ncfg() { var c = Object.assign({}, DEF, X.get("rfnotif", null) || {}); c.times = Array.isArray(c.times) && c.times.length ? c.times.slice(0, 5) : DEF.times.slice(); c.sources = Object.assign({}, DEF.sources, c.sources || {}); return c; }
  function nset(p) { X.set("rfnotif", Object.assign(ncfg(), p)); schedule(); }
  var timer = null;
  function nextAt(times, from) {
    var best = null; var d = new Date(from);
    times.forEach(function (hm) { var p = hm.split(":"); for (var k = 0; k < 2; k++) { var x = new Date(d.getFullYear(), d.getMonth(), d.getDate() + k, +p[0] || 0, +p[1] || 0, 0, 0).getTime(); if (x > from && (best === null || x < best)) best = x; } });
    return best;
  }
  function compact(it) { return { id: it.id, kind: it.kind, ar: (it.ar || "").slice(0, 160), text: String(it.text || "").slice(0, 220), src: it.src, url: "/?open=reminder&id=" + encodeURIComponent(it.id) }; }
  function sourcesPool(c) { return pool().filter(function (r) { return !r.mine && c.sources[r.kind]; }); }
  function schedule() {
    clearTimeout(timer);
    var c = ncfg();
    var state = { on: !!c.on, times: c.times, items: [], lang: X.lang(), title: t("title") };
    if (c.on && "Notification" in window && Notification.permission === "granted") {
      var p = sourcesPool(c), s = seen(), unseen = p.filter(function (r) { return s.ids.indexOf(r.id) < 0; }); if (!unseen.length) unseen = p;
      for (var i = 0; i < 12 && unseen.length; i++) { var it = unseen.splice(Math.floor(Math.random() * unseen.length), 1)[0]; state.items.push(compact(it)); }
      var at = nextAt(c.times, Date.now());
      if (at) timer = setTimeout(function () { fire(); setTimeout(schedule, 1500); }, Math.min(at - Date.now() + 100, 2147000000));
    }
    try { if ("caches" in window) caches.open("mhs-state").then(function (ca) { return ca.put("/__state/daily", new Response(JSON.stringify(state), { headers: { "Content-Type": "application/json" } })); }).catch(function () {}); } catch (e) {}
  }
  function fire(test) {
    var c = ncfg(), p = sourcesPool(c); if (!p.length) return;
    var it = pick("all"); if (!it || !c.sources[it.kind]) it = p[Math.floor(Math.random() * p.length)];
    var o = { body: (it.ar ? it.ar + "\n" : "") + it.text + "\n— " + it.src, icon: "/icons/icon-192.png", badge: "/icons/icon-96.png", tag: test ? "mhs-rf-test" : "mhs-rf-" + X.dayKey(), data: { url: "/?open=reminder&id=" + encodeURIComponent(it.id) }, lang: X.lang() };
    var title = "💡 " + t("title") + " · " + t(it.kind);
    try {
      if (navigator.serviceWorker && navigator.serviceWorker.ready) navigator.serviceWorker.ready.then(function (r) { return r.showNotification(title, o); }).catch(function () { new Notification(title, o); });
      else new Notification(title, o);
    } catch (e) {}
  }
  function notifCard() {
    var c = ncfg(), can = "Notification" in window, perm = can ? Notification.permission : "unsupported";
    var card = X.el("section", { class: "mhs-rf-notif" }, [X.el("h3", { text: "🔔 " + t("nTitle") }), X.el("p", { class: "mhs-mini-note", style: { marginTop: 0 }, text: t("nSub") })]);
    var cb = X.el("input", { type: "checkbox", checked: c.on ? true : null, disabled: !can ? true : null });
    var status = X.el("p", { class: "mhs-mini-note", role: "status", text: !can ? t("nUnsupported") : perm === "denied" ? t("nDenied") : (/iPhone|iPad|iPod/.test(navigator.userAgent) && !matchMedia("(display-mode: standalone)").matches ? t("nIos") : "") });
    cb.addEventListener("change", function () {
      if (!cb.checked) { nset({ on: false }); return; }
      Notification.requestPermission().then(function (r) { if (r === "granted") { nset({ on: true }); status.textContent = ""; } else { cb.checked = false; status.textContent = t("nDenied"); } });
    });
    card.appendChild(X.el("div", { class: "row" }, [X.el("label", { class: "mhs-switch" }, [cb, X.el("span", { text: t("nEnable") })]), X.el("small", { class: "mhs-mini-note", style: { margin: 0 }, text: t("nPerDay", { n: X.num(c.times.length) }) })]));
    var times = X.el("div", { class: "times" });
    c.times.forEach(function (hm, i) {
      var inp = X.el("input", { type: "time", value: hm, "aria-label": t("nTimes") });
      inp.addEventListener("change", function () { var tt = ncfg().times; tt[i] = inp.value || tt[i]; nset({ times: tt }); render(); });
      times.appendChild(X.el("span", { style: { display: "inline-flex", gap: ".2rem", alignItems: "center" } }, [inp, c.times.length > 1 ? X.el("button", { type: "button", class: "mhs-chip", "aria-label": t("delete"), text: "×", on: { click: function () { var tt = ncfg().times; tt.splice(i, 1); nset({ times: tt }); render(); } } }) : null]));
    });
    if (c.times.length < 5) times.appendChild(X.el("button", { type: "button", class: "mhs-chip", text: t("nAdd"), on: { click: function () { var tt = ncfg().times; tt.push("13:00"); nset({ times: tt }); render(); } } }));
    card.appendChild(X.el("div", { class: "row" }, [X.el("span", { text: t("nTimes") }), times]));
    var src = X.el("div", { class: "times" });
    ["verse", "hadith", "quote"].forEach(function (k) { var x = X.el("input", { type: "checkbox", checked: c.sources[k] ? true : null }); x.addEventListener("change", function () { var s = ncfg().sources; s[k] = x.checked; if (!s.verse && !s.hadith && !s.quote) { s[k] = true; x.checked = true; } nset({ sources: s }); }); src.appendChild(X.el("label", { class: "mhs-switch", style: { minHeight: "36px" } }, [x, X.el("span", { text: t(k) })])); });
    card.appendChild(X.el("div", { class: "row" }, [X.el("span", { text: t("nSources") }), src]));
    card.appendChild(X.el("div", { class: "mhs-actions" }, [X.el("button", { type: "button", class: "mhs-chip", disabled: perm !== "granted" ? true : null, text: "🔔 " + t("nTest"), on: { click: function () { fire(true); X.toast(t("nSent")); } } })]));
    card.appendChild(status);
    card.appendChild(X.el("p", { class: "mhs-mini-note", text: t("nNote") }));
    return card;
  }
  document.addEventListener("visibilitychange", function () { if (!document.hidden) schedule(); });
  X.whenReady("MHSWisdom", function () { loadExtra().then(schedule); });

  window.MHSReminder = { mount: function(host){
    gestureActive=false;deferredRender=false;
    if(sh && sh.dialog && sh.dialog.open && !sh.embedded) return;
    host.replaceChildren();var tools=X.el("div",{class:"mhs-mini-tools"}),body=X.el("div",{class:"mhs-mini-body mhs-kh"});
    host.append(X.el("header",{class:"mhs-feed-heading"},[X.el("div",{},[X.el("small",{text:"MUHASABAH"}),X.el("h1",{text:X.lang()==="bn"?"আজকের অনুপ্রেরণা":X.lang()==="ar"?"إلهام اليوم":"A moment to reflect"})]),tools]),body);
    sh={embedded:true,host:host,dialog:{open:true},body:body,tools:tools,icon:X.icon,close:function(){window.MHSApp.nav("dashboard");}};render();loadExtra().then(function(){if(sh&&sh.host===host){if(!cur)cur=pick(filter);render();}});
  }, unmount:function(host){if(sh&&sh.host===host){gestureActive=false;deferredRender=false;sh=null;}}, open: open, pool: pool, pick: pick, schedule: schedule, cfg: ncfg, t: t,
    /* Jump the open Reminder to one source (all · verse · hadith · quote · dua · favs · mine). */
    filter: function (f) { if (!sh || sh.embedded) return; filter = f || "all"; historyItems = []; historyAt = -1; cur = pick(filter); render(); },
    current: function () { return filter; },
    settings: function () { if (!sh || sh.embedded) return; configuring = !configuring; render(); if (configuring) setTimeout(function () { var n = sh && sh.body.querySelector(".mhs-feed-sources"); if (n) n.scrollIntoView({ block: "start", behavior: "smooth" }); }, 60); },
    load: loadExtra };
  /* Language changes: rebuild the feed so the heading, labels and posts all use the new language. */
  var lastLang = feedLang();
  new MutationObserver(function () {
    var l = feedLang(); if (l === lastLang) return; lastLang = l;
    cur = null; historyItems = []; historyAt = -1;
    if (window.MHSSeerah) window.MHSSeerah.warm(l).then(function () { if (sh && !cur) { cur = pick(filter); render(); } });
    if (sh && sh.embedded && sh.host && sh.host.isConnected) window.MHSReminder.mount(sh.host); else if (sh) render();
  }).observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });
  /* Route the unified menu "Get Reminder" item and legacy callers to the new feed. */
  X.whenReady("MHSWisdom", function (W) { W.open = function (o) { open(o); }; });
})();
