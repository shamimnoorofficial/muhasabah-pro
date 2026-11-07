/* MHSWisdomApp — the dedicated Wisdom mini-app (হিকমাহ): categories, authors, offline search,
 * bookmarks, share, custom user entries (clearly marked) and unique IDs for deep linking
 * (?open=wisdom&id=…). Data: /data/wisdom.json (lazy) + user entries in MHSX "wisdomcustom".
 * Its mini-dashboard (read today, saved, streak) feeds the Home overview via MHSKnowledge.stats. */
(function () {
  "use strict";
  if (window.MHSWisdomApp) return;
  var X = window.MHSX, SR = function () { return window.MHSSearch; };
  var t = X.tr({
    en: { title: "Wisdom", sub: "Sayings of the Prophet ﷺ, Sahaba & scholars", menu: "Wisdom", menuSub: "Hikmah — categories, authors, search & bookmarks", search: "Search wisdom, authors, topics…", all: "All", authors: "Authors", cats: "Topics", mine: "My entries", saved: "Saved", add: "Add your own", text: "Text", textPh: "Write the saying…", by: "Author / source", byPh: "e.g. Imam Shafi'i", cat: "Topic", save: "Save", cancel: "Cancel", del: "Delete", custom: "Your entry", none: "Nothing matches.", noneSaved: "Nothing saved yet. Tap ♡ on any saying.", offline: "Couldn't load — open once with internet; then it works offline.", results: "{n} results", share: "Share", copy: "Copy", mark: "Save", marked: "Saved", readToday: "read today", savedN: "saved", streak: "day streak", cont: "Continue where you left off", random: "Surprise me" },
    bn: { title: "হিকমাহ", sub: "নবী ﷺ, সাহাবা ও আলেমদের বাণী", menu: "হিকমাহ", menuSub: "জ্ঞানের কথা — বিষয়, বক্তা, খোঁজ ও সংরক্ষণ", search: "হিকমাহ, বক্তা, বিষয় খুঁজুন…", all: "সব", authors: "বক্তা", cats: "বিষয়", mine: "আমার লেখা", saved: "সংরক্ষিত", add: "নিজের যোগ করুন", text: "লেখা", textPh: "বাণীটি লিখুন…", by: "বক্তা / সূত্র", byPh: "যেমন: ইমাম শাফেয়ি", cat: "বিষয়", save: "সংরক্ষণ", cancel: "বাতিল", del: "মুছুন", custom: "আপনার লেখা", none: "কিছু মেলেনি।", noneSaved: "এখনো কিছু সংরক্ষিত নেই। যেকোনো বাণীতে ♡ চাপুন।", offline: "লোড করা যায়নি — একবার ইন্টারনেটে খুলুন; এরপর অফলাইনে কাজ করবে।", results: "{n}টি ফলাফল", share: "শেয়ার", copy: "কপি", mark: "সংরক্ষণ", marked: "সংরক্ষিত", readToday: "আজ পড়া", savedN: "সংরক্ষিত", streak: "দিনের ধারা", cont: "যেখানে ছিলেন সেখান থেকে", random: "যেকোনো একটি" },
    ar: { title: "الحكمة", sub: "أقوال النبي ﷺ والصحابة والعلماء", menu: "الحكمة", menuSub: "حِكم — مواضيع، أعلام، بحث ومحفوظات", search: "ابحث…", all: "الكل", authors: "الأعلام", cats: "المواضيع", mine: "إدخالاتي", saved: "المحفوظات", add: "أضف حكمة", text: "النص", textPh: "اكتب الحكمة…", by: "القائل / المصدر", byPh: "مثال: الإمام الشافعي", cat: "الموضوع", save: "حفظ", cancel: "إلغاء", del: "حذف", custom: "إدخالك", none: "لا نتائج.", noneSaved: "لا محفوظات بعد.", offline: "تعذّر التحميل.", results: "{n} نتيجة", share: "مشاركة", copy: "نسخ", mark: "حفظ", marked: "محفوظ", readToday: "قُرئ اليوم", savedN: "محفوظ", streak: "يوم متتالٍ", cont: "تابع من حيث توقفت", random: "عشوائي" }
  });
  function L(o) { if (!o) return ""; if (typeof o === "string") return o; return o[X.lang()] || o.en || o.bn || ""; }
  var DATA = null, loading = null;
  function load() {
    if (DATA) return Promise.resolve(DATA);
    if (loading) return loading;
    loading = fetch("/data/wisdom.json").then(function (r) { if (!r.ok) throw new Error(); return r.json(); }).then(function (j) { DATA = j; return j; }).catch(function (e) { loading = null; throw e; });
    return loading;
  }
  function custom() { return X.get("wisdomcustom", null) || []; }
  function allItems(j) {
    var c = custom().map(function (x) { return Object.assign({ mine: true, author: "me", cat: x.cat || "heart" }, x); });
    return (j ? j.items : []).concat(c);
  }
  function authorName(j, id) { if (id === "me") return t("custom"); var a = (j && j.authors || []).filter(function (x) { return x.id === id; })[0]; return a ? L(a) : id; }
  function catName(j, id) { var c = (j && j.categories || []).filter(function (x) { return x.id === id; })[0]; return c ? L(c) : id; }
  function byId(id) { return load().then(function (j) { return allItems(j).filter(function (x) { return x.id === id; })[0] || null; }); }
  function K() { return window.MHSKnowledge; }

  var sh = null, q = "", filter = { cat: "", author: "", mine: false, saved: false }, target = null, adding = false, seq = 0;
  function open(opts) {
    if (!window.MHSSheet) return;
    opts = opts || {};
    if (opts.id) target = String(opts.id);
    if (opts.cat) filter = { cat: opts.cat, author: "", mine: false, saved: false };
    if (opts.q) { q = String(opts.q); filter = { cat: "", author: "", mine: false, saved: false }; }
    if (sh && sh.dialog.open) { render(); return; }
    sh = X.sheet({ id: "mhs-wisdomapp", title: t("title"), sub: t("sub"), onClose: function () { sh = null; } });
    sh.body.classList.add("mhs-kh");
    render();
  }
  function render() {
    var token = ++seq; // invalidate the previous render's search callbacks before its input is removed
    var b = sh.body; b.replaceChildren(); sh.tools.replaceChildren();
    var RP = window.MHSReadPref; if (RP) { RP.apply(b); sh.tools.appendChild(RP.controls(b)); }
    sh.tools.appendChild(X.el("button", { type: "button", class: "mhs-mini-ib" + (adding ? " is-on" : ""), "aria-label": t("add"), title: t("add"), on: { click: function () { adding = !adding; render(); } } }, [sh.icon("M12 5v14|M5 12h14")]));
    var s = K() ? K().stats() : { today: 0, saved: 0, streak: 0, marks: { wisdom: [] } };
    var r = X.get("kread", null) || {}, todayW = (r[X.dayKey()] || {}).wisdom || 0;
    b.appendChild(X.el("div", { class: "mhs-kh-dash" }, [
      X.el("div", null, [X.el("b", { text: X.num(todayW) }), X.el("small", { text: t("readToday") })]),
      X.el("div", null, [X.el("b", { text: X.num(s.marks.wisdom.length) }), X.el("small", { text: t("savedN") })]),
      X.el("div", null, [X.el("b", { text: "🔥 " + X.num(s.streak) }), X.el("small", { text: t("streak") })])
    ]));
    if (adding) { b.appendChild(form()); }
    var box = SR().box({ ns: "wisdom", placeholder: t("search"), value: q, suggest: X.lang() === "bn" ? ["ধৈর্য", "সময়", "উমর", "অন্তর"] : ["patience", "time", "Umar", "heart"], onQuery: function (v) { if (token !== seq) return; q = v; draw(); } });
    b.appendChild(box.el);
    var chips = X.el("div", { class: "mhs-mini-chips" }), authors = X.el("div", { class: "mhs-w-authors" }), count = X.el("p", { class: "mhs-kh-count" }), list = X.el("div", { class: "mhs-kh-list" });
    b.append(chips, authors, count, list);
    list.appendChild(X.el("div", { class: "mhs-skel", style: { minHeight: "6rem" } }));
    load().then(function (j) {
      if (!sh || !sh.dialog.open) return;
      function chip(label, on, fn) { return X.el("button", { type: "button", class: "mhs-chip" + (on ? " is-on" : ""), text: label, on: { click: fn } }); }
      chips.append(chip(t("all"), !filter.cat && !filter.mine && !filter.saved, function () { filter = { cat: "", author: filter.author, mine: false, saved: false }; render(); }),
        chip("♥ " + t("saved"), filter.saved, function () { filter = { cat: "", author: "", mine: false, saved: !filter.saved }; render(); }),
        chip("✍️ " + t("mine"), filter.mine, function () { filter = { cat: "", author: "", mine: !filter.mine, saved: false }; render(); }),
        chip("🎲 " + t("random"), false, function () { var all = allItems(j); target = all[Math.floor(Math.random() * all.length)].id; filter = { cat: "", author: "", mine: false, saved: false }; q = ""; render(); }));
      (j.categories || []).forEach(function (c) { chips.appendChild(chip(L(c), filter.cat === c.id, function () { filter = { cat: filter.cat === c.id ? "" : c.id, author: "", mine: false, saved: false }; render(); })); });
      var seenA = {}; allItems(j).forEach(function (it) { seenA[it.author] = (seenA[it.author] || 0) + 1; });
      Object.keys(seenA).sort(function (a, b) { return seenA[b] - seenA[a]; }).slice(0, 14).forEach(function (a) { if (a === "me") return; authors.appendChild(chip(authorName(j, a) + " · " + X.num(seenA[a]), filter.author === a, function () { filter.author = filter.author === a ? "" : a; render(); })); });
      var last = (X.get("klast", null) || {}).wisdom;
      if (last && !q && !filter.cat && !filter.author && !target) { var li = allItems(j).filter(function (x) { return x.id === last; })[0]; if (li) b.insertBefore(X.el("button", { type: "button", class: "mhs-kh-cont", on: { click: function () { target = li.id; render(); } } }, [X.el("span", { text: "▶" }), X.el("span", null, [X.el("b", { text: t("cont") }), X.el("small", { text: L({ en: li.en, bn: li.bn }).slice(0, 80) })])]), box.el); }
      draw();
    }).catch(function () { list.replaceChildren(X.el("p", { class: "mhs-kh-empty", text: t("offline") })); });
    function draw() {
      var j = DATA; if (!j) return;
      var items = allItems(j), marksW = K() ? K().marks().wisdom : [];
      if (filter.saved) items = items.filter(function (x) { return marksW.indexOf(x.id) >= 0; });
      if (filter.mine) items = items.filter(function (x) { return x.mine; });
      if (filter.cat) items = items.filter(function (x) { return x.cat === filter.cat; });
      if (filter.author) items = items.filter(function (x) { return x.author === filter.author; });
      var qq = q.trim();
      if (qq) items = SR().search(items, qq, ["en", "bn", "ar", "src", function (x) { return authorName(j, x.author) + " " + catName(j, x.cat) + " " + (x.tags || []).join(" "); }], 80).map(function (r) { return r.item; });
      if (target) { var ti = items.filter(function (x) { return x.id === target; })[0]; if (!ti) { ti = allItems(j).filter(function (x) { return x.id === target; })[0]; if (ti) items = [ti].concat(items); } }
      count.textContent = qq ? t("results", { n: X.num(items.length) }) : "";
      list.replaceChildren();
      if (!items.length) { list.appendChild(X.el("p", { class: "mhs-kh-empty", text: filter.saved ? t("noneSaved") : t("none") })); return; }
      items.slice(0, 120).forEach(function (it) { list.appendChild(card(j, it, qq)); });
      if (target) { var el = list.querySelector('[data-id="' + target + '"]'); if (el) { el.classList.add("is-target"); setTimeout(function () { el.scrollIntoView({ block: "center", behavior: "smooth" }); }, 80); } target = null; }
      if ("IntersectionObserver" in window && K()) { var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { logRead(e.target.getAttribute("data-id")); io.unobserve(e.target); } }); }, { root: b, threshold: .6 }); list.querySelectorAll("[data-id]").forEach(function (el) { io.observe(el); }); }
    }
  }
  var seen = {};
  function logRead(id) {
    var day = X.dayKey(); seen[day] = seen[day] || {}; if (seen[day][id]) return; seen[day][id] = 1;
    var r = X.get("kread", null) || {}; r[day] = r[day] || {}; r[day].wisdom = (r[day].wisdom || 0) + 1; X.set("kread", r);
    var last = X.get("klast", null) || {}; last.wisdom = id; X.set("klast", last);
  }
  function card(j, it, qq) {
    var text = L({ en: it.en, bn: it.bn }), hl = function (s) { return qq ? SR().highlight(s, qq) : X.esc(s); };
    var payload = { medium: "wisdom", eyebrow: t("title"), ar: it.ar, text: text, src: it.src ? authorName(j, it.author) + " · " + it.src : authorName(j, it.author), link: { id: it.id } };
    var on = K() && K().isMarked("wisdom", it.id);
    var mk = X.el("button", { type: "button", class: "mhs-chip" + (on ? " is-on" : ""), "aria-pressed": on ? "true" : "false", text: (on ? "♥ " : "♡ ") + t(on ? "marked" : "mark"), on: { click: function () { var now = K().toggleMark("wisdom", it.id); mk.classList.toggle("is-on", now); mk.textContent = (now ? "♥ " : "♡ ") + t(now ? "marked" : "mark"); } } });
    var tools = X.el("div", { class: "mhs-kh-tools" }, [mk,
      X.el("button", { type: "button", class: "mhs-chip", text: "↗ " + t("share"), on: { click: function () { window.MHSShare.menu(payload); } } }),
      X.el("button", { type: "button", class: "mhs-chip", text: "📋 " + t("copy"), on: { click: function () { window.MHSShare.copy(window.MHSShare.text(payload)); } } }),
      it.mine ? X.el("button", { type: "button", class: "mhs-chip", text: "🗑 " + t("del"), on: { click: function () { X.set("wisdomcustom", custom().filter(function (c) { return c.id !== it.id; })); render(); } } }) : null,
      it.author === "prophet" && it.book ? X.el("button", { type: "button", class: "mhs-chip", text: "📚 Hadith ↗", on: { click: function () { window.MHSHadith && window.MHSHadith.open({ book: it.book, number: it.n }); } } }) : null
    ]);
    return X.el("article", { class: "mhs-kh-item" + (it.mine ? " is-mine" : ""), "data-id": it.id }, [
      X.el("div", { class: "top" }, [X.el("b", { html: hl(authorName(j, it.author)) }), X.el("small", { text: it.mine ? "✍️ " + t("custom") : catName(j, it.cat) })]),
      it.ar ? X.el("p", { class: "mhs-kh-ar", lang: "ar", dir: "rtl", html: hl(it.ar) }) : null,
      X.el("p", { class: "mhs-kh-tr", style: { fontSize: "calc(15px * var(--mhs-tx-scale,1))" }, html: "“" + hl(text) + "”" }),
      it.src ? X.el("small", { class: "mhs-kh-src", text: "— " + it.src }) : null,
      (it.tags && it.tags.length) ? X.el("div", { class: "mhs-rf-tags" }, it.tags.slice(0, 4).map(function (g) { return X.el("span", { text: "#" + g }); })) : null,
      tools
    ]);
  }
  function form() {
    var ta = X.el("textarea", { rows: "3", maxlength: "600", placeholder: t("textPh"), "aria-label": t("text"), style: { width: "100%", minHeight: "5rem", borderRadius: ".9rem", border: "1px solid hsl(var(--border))", background: "hsl(var(--background) / .6)", color: "inherit", padding: ".6rem .8rem", font: "inherit", fontSize: "15px" } });
    var by = X.el("input", { type: "text", maxlength: "80", placeholder: t("byPh"), "aria-label": t("by") });
    var sel = X.el("select", { class: "mhs-select", "aria-label": t("cat") }, ((DATA && DATA.categories) || [{ id: "heart", en: "Heart" }]).map(function (c) { return X.el("option", { value: c.id, text: L(c) }); }));
    return X.el("form", { class: "mhs-es-form", on: { submit: function (e) {
      e.preventDefault(); var txt = ta.value.trim(); if (txt.length < 3) return;
      var c = custom(); c.push({ id: X.uid("wm"), en: txt, bn: txt, src: by.value.trim(), cat: sel.value, mine: true, ts: Date.now() }); X.set("wisdomcustom", c); adding = false; filter = { cat: "", author: "", mine: true, saved: false }; render(); X.toast("✓ " + t("save"));
    } } }, [X.el("h4", { text: "✍️ " + t("add") }), ta, by, sel, X.el("div", { class: "mhs-actions" }, [X.el("button", { type: "submit", class: "mhs-btn primary", text: t("save") }), X.el("button", { type: "button", class: "mhs-btn", text: t("cancel"), on: { click: function () { adding = false; render(); } } })])]);
  }
  window.MHSWisdomApp = { open: open, load: load, byId: byId, custom: custom, t: t };
  X.action({ k: "hikmah", c: "linear-gradient(140deg,#ffd54f,#ff8f00)", icon: "M12 3a6 6 0 0 1 6 6c0 2.2-1.2 3.6-2.4 4.8-.8.8-1.1 1.4-1.1 2.2H9.5c0-.8-.3-1.4-1.1-2.2C7.2 12.6 6 11.2 6 9a6 6 0 0 1 6-6Z|M9.5 19h5|M10.5 22h3", label: function () { return t("menu"); }, sub: function () { return t("menuSub"); }, run: function () { open(); } });
})();
