/* MHSKnowledge — Islamic Knowledge Hub (Hisnul Muslim style): মাসনুন দোয়া (Duas), দৈনন্দিন আমল ও ফজিলত
 * (daily amol with virtues), আল্লাহর ৯৯ নাম (Asmaul Husna), plus Saved items. Data is structured
 * JSON under /data/, lazy-loaded and cached by the service worker for offline use.
 * Every item: search (diacritics-insensitive), bookmark, share (MHSShare), copy, font-size & Arabic font
 * controls, deep links (?open=duas&id=… / ?open=names&n=…), "continue where you left off" and a
 * mini-dashboard that feeds the Home overview. */
(function () {
  "use strict";
  if (window.MHSKnowledge) return;
  var X = window.MHSX, SR = function () { return window.MHSSearch; };
  var t = X.tr({
    en: { title: "Duas & Knowledge", sub: "Masnun duas · Daily amol · 99 Names", menu: "Duas & 99 Names", menuSub: "Hisnul Muslim duas, amol & Asmaul Husna", duas: "Duas", amol: "Amol", names: "99 Names", saved: "Saved", search: "Search duas, amol, names…", all: "All", noResults: "Nothing matches. Try another word.", loading: "Loading…", offline: "Couldn't load — check your connection once; then it stays offline.",
      copy: "Copy", copied: "Copied", share: "Share", mark: "Save", marked: "Saved", zikr: "Count in tasbih", quran: "Read in Quran", habit: "Add to habits", cont: "Continue where you left off", readToday: "read today", savedN: "saved", streak: "day streak", none: "Nothing saved yet. Tap ♡ on any item.", fazilat: "Virtue", how: "How", src: "Source", when: "When", count: "Count", meaning: "Meaning", benefit: "Reflection", larger: "Larger text", smaller: "Smaller text", font: "Arabic font", amiri: "Amiri", naskh: "Naskh", audio: "Listen", results: "{n} results", back: "Back" },
    bn: { title: "দোয়া ও ইলম", sub: "মাসনুন দোয়া · দৈনন্দিন আমল · ৯৯ নাম", menu: "দোয়া ও ৯৯ নাম", menuSub: "হিসনুল মুসলিম দোয়া, আমল ও আসমাউল হুসনা", duas: "দোয়া", amol: "আমল", names: "৯৯ নাম", saved: "সংরক্ষিত", search: "দোয়া, আমল, নাম খুঁজুন…", all: "সব", noResults: "কিছু মেলেনি। অন্য শব্দ লিখুন।", loading: "লোড হচ্ছে…", offline: "লোড করা যায়নি — একবার ইন্টারনেটে খুলুন; এরপর অফলাইনে থাকবে।",
      copy: "কপি", copied: "কপি হয়েছে", share: "শেয়ার", mark: "সংরক্ষণ", marked: "সংরক্ষিত", zikr: "তাসবিহে গুনুন", quran: "কুরআনে পড়ুন", habit: "অভ্যাসে যোগ", cont: "যেখানে ছিলেন সেখান থেকে", readToday: "আজ পড়া", savedN: "সংরক্ষিত", streak: "দিনের ধারা", none: "এখনো কিছু সংরক্ষিত নেই। যেকোনো আইটেমে ♡ চাপুন।", fazilat: "ফজিলত", how: "নিয়ম", src: "সূত্র", when: "কখন", count: "সংখ্যা", meaning: "অর্থ", benefit: "ভাবনা", larger: "বড় লেখা", smaller: "ছোট লেখা", font: "আরবি ফন্ট", amiri: "আমিরি", naskh: "নাসখ", audio: "শুনুন", results: "{n}টি ফলাফল", back: "পেছনে" },
    ar: { title: "الأدعية والمعرفة", sub: "أدعية مأثورة · أعمال يومية · الأسماء الحسنى", menu: "الأدعية والأسماء الحسنى", menuSub: "حصن المسلم والأعمال والأسماء", duas: "الأدعية", amol: "الأعمال", names: "الأسماء", saved: "المحفوظات", search: "ابحث…", all: "الكل", noResults: "لا نتائج.", loading: "جارٍ التحميل…", offline: "تعذّر التحميل — افتح مرة مع الإنترنت.",
      copy: "نسخ", copied: "تم النسخ", share: "مشاركة", mark: "حفظ", marked: "محفوظ", zikr: "عدّ في المسبحة", quran: "اقرأ في القرآن", habit: "أضف للعادات", cont: "تابع من حيث توقفت", readToday: "قُرئ اليوم", savedN: "محفوظ", streak: "يوم متتالٍ", none: "لا محفوظات بعد.", fazilat: "الفضل", how: "الكيفية", src: "المصدر", when: "متى", count: "العدد", meaning: "المعنى", benefit: "تأمل", larger: "تكبير", smaller: "تصغير", font: "الخط", amiri: "أميري", naskh: "نسخ", audio: "استمع", results: "{n} نتيجة", back: "رجوع" }
  });
  function L(o) { if (!o) return ""; if (typeof o === "string") return o; return o[X.lang()] || o.en || o.bn || ""; }

  /* ---- shared reading preferences (font size / Arabic font) ---- */
  var RP = window.MHSReadPref || (window.MHSReadPref = (function () {
    function get() { return Object.assign({ ar: 1, tx: 1, font: "amiri" }, X.get("readpref", null) || {}); }
    function set(p) { X.set("readpref", Object.assign(get(), p)); }
    function apply(el) { var p = get(); el.style.setProperty("--mhs-ar-scale", p.ar); el.style.setProperty("--mhs-tx-scale", p.tx); el.setAttribute("data-font", p.font); }
    function controls(host) {
      var p = get();
      var wrap = X.el("div", { class: "mhs-kh-font" }, [
        X.el("button", { type: "button", class: "mhs-chip", "aria-label": t("smaller"), text: "A−", on: { click: function () { set({ ar: Math.max(.7, get().ar - .1), tx: Math.max(.8, get().tx - .1) }); apply(host); } } }),
        X.el("button", { type: "button", class: "mhs-chip", "aria-label": t("larger"), text: "A+", on: { click: function () { set({ ar: Math.min(1.8, get().ar + .1), tx: Math.min(1.5, get().tx + .1) }); apply(host); } } }),
        X.el("button", { type: "button", class: "mhs-chip", "aria-label": t("font") + ": " + t(p.font === "amiri" ? "naskh" : "amiri"), title: t("font"), text: "ع", on: { click: function (e) { var f = get().font === "amiri" ? "naskh" : "amiri"; set({ font: f }); apply(host); e.currentTarget.setAttribute("aria-label", t("font") + ": " + t(f === "amiri" ? "naskh" : "amiri")); } } })
      ]);
      apply(host);
      return wrap;
    }
    return { get: get, set: set, apply: apply, controls: controls };
  })());

  /* ---- data ---- */
  var DATA = {}, loading = {};
  function load(name) {
    if (DATA[name]) return Promise.resolve(DATA[name]);
    if (loading[name]) return loading[name];
    loading[name] = fetch("/data/" + name + ".json").then(function (r) { if (!r.ok) throw new Error(); return r.json(); }).then(function (j) { DATA[name] = j; return j; }).catch(function (e) { loading[name] = null; throw e; });
    return loading[name];
  }
  /* bookmarks: MHSX "kbm" = { dua:[], amol:[], name:[], wisdom:[] } */
  function marks() { var m = X.get("kbm", null) || {}; ["dua", "amol", "name", "wisdom"].forEach(function (k) { m[k] = Array.isArray(m[k]) ? m[k] : []; }); return m; }
  function isMarked(kind, id) { return marks()[kind].indexOf(id) >= 0; }
  function toggleMark(kind, id) { var m = marks(), i = m[kind].indexOf(id); if (i >= 0) m[kind].splice(i, 1); else m[kind].push(id); X.set("kbm", m); X.haptic(10); return i < 0; }
  /* reading log: MHSX "kread" = { "YYYY-MM-DD": { dua:n, amol:n, name:n } } + last: MHSX "klast" */
  var seen = {};
  function logRead(kind, id) {
    var day = X.dayKey(); seen[day] = seen[day] || {}; if (seen[day][kind + id]) return; seen[day][kind + id] = 1;
    var r = X.get("kread", null) || {}; r[day] = r[day] || {}; r[day][kind] = (r[day][kind] || 0) + 1;
    var keys = Object.keys(r).sort(); while (keys.length > 90) delete r[keys.shift()];
    X.set("kread", r);
    var last = X.get("klast", null) || {}; last[kind] = id; X.set("klast", last);
  }
  function stats() {
    var r = X.get("kread", null) || {}, m = marks();
    var week = X.lastDays(7).map(function (d) { var e = r[X.dayKey(d)] || {}; return (e.dua || 0) + (e.amol || 0) + (e.name || 0) + (e.wisdom || 0); });
    var streak = 0, day = new Date(); var has = function (d) { var e = r[X.dayKey(d)]; return e && ((e.dua || 0) + (e.amol || 0) + (e.name || 0) + (e.wisdom || 0)) > 0; };
    if (!has(day)) day = X.addDays(day, -1); while (has(day)) { streak++; day = X.addDays(day, -1); }
    return { today: week[week.length - 1], week: week, streak: streak, saved: m.dua.length + m.amol.length + m.name.length + m.wisdom.length, marks: m };
  }

  /* ---- UI ---- */
  var sh = null, tab = "duas", cat = "", q = "", target = null, seq = 0;
  function open(opts) {
    if (!window.MHSSheet) return;
    opts = opts || {};
    if (opts.tab) { if (opts.tab !== tab) { q = ""; cat = ""; } tab = opts.tab; } if (opts.cat != null) cat = opts.cat; if (opts.id) target = { kind: opts.tab === "names" ? "name" : opts.tab === "amol" ? "amol" : "dua", id: String(opts.id) };
    if (sh && sh.dialog.open) { render(); return; }
    sh = X.sheet({ id: "mhs-knowledge", title: t("title"), sub: t("sub"), onClose: function () { sh = null; } });
    sh.body.classList.add("mhs-kh");
    render();
  }
  function render() {
    var token = ++seq; // invalidate callbacks of the previous render BEFORE its inputs are removed (removal fires `change`)
    var b = sh.body; b.replaceChildren(); sh.tools.replaceChildren();
    RP.apply(b);
    sh.tools.appendChild(RP.controls(b));
    var tabs = X.el("div", { class: "mhs-kh-tabs", role: "tablist" });
    [["duas", "🤲"], ["amol", "⭐"], ["names", "✨"], ["saved", "♥"]].forEach(function (p) {
      tabs.appendChild(X.el("button", { type: "button", role: "tab", "aria-selected": tab === p[0] ? "true" : "false", class: "mhs-kh-tab" + (tab === p[0] ? " is-on" : ""), text: p[1] + " " + t(p[0]), on: { click: function () { tab = p[0]; cat = ""; q = ""; render(); b.scrollTop = 0; } } }));
    });
    b.appendChild(tabs);
    var s = stats();
    b.appendChild(X.el("div", { class: "mhs-kh-dash" }, [
      X.el("div", null, [X.el("b", { text: X.num(s.today) }), X.el("small", { text: t("readToday") })]),
      X.el("div", null, [X.el("b", { text: X.num(s.saved) }), X.el("small", { text: t("savedN") })]),
      X.el("div", null, [X.el("b", { text: "🔥 " + X.num(s.streak) }), X.el("small", { text: t("streak") })])
    ]));
    if (tab === "saved") return renderSaved(b);
    var box = SR().box({ ns: "knowledge", placeholder: t("search"), value: q, suggest: X.lang() === "bn" ? ["সকাল", "ঘুম", "সফর", "রহমান", "ইস্তিগফার"] : ["morning", "sleep", "travel", "Rahman", "istighfar"], onQuery: function (v) { if (token !== seq) return; q = v; drawList(); } });
    b.appendChild(box.el);
    var catRow = X.el("div", { class: "mhs-kh-cats" }), list = X.el("div", { class: "mhs-kh-list" }), count = X.el("p", { class: "mhs-kh-count" });
    b.append(catRow, count, list);
    list.appendChild(X.el("div", { class: "mhs-skel", style: { minHeight: "6rem" } }));
    var name = tab === "duas" ? "duas" : tab === "amol" ? "amol" : "names";
    load(name).then(function (j) {
      if (!sh || !sh.dialog.open) return;
      drawCats(catRow, j); drawList();
    }).catch(function () { list.replaceChildren(X.el("p", { class: "mhs-kh-empty", text: t("offline") })); });

    function drawCats(host, j) {
      host.replaceChildren();
      if (tab === "names") { host.hidden = true; return; }
      host.hidden = false;
      var cats = j.categories || j.groups || [];
      var last = (X.get("klast", null) || {})[tab === "duas" ? "dua" : "amol"];
      if (last && !cat && !q) {
        var it = (j.items || []).filter(function (x) { return x.id === last; })[0];
        if (it) b.insertBefore(X.el("button", { type: "button", class: "mhs-kh-cont", on: { click: function () { target = { kind: tab === "duas" ? "dua" : "amol", id: it.id }; cat = it.cat || it.g || ""; render(); } } }, [X.el("span", { text: "▶" }), X.el("span", null, [X.el("b", { text: t("cont") }), X.el("small", { text: L(it.title) })])]), host);
      }
      cats.forEach(function (c) {
        var n = (j.items || []).filter(function (x) { return (x.cat || x.g) === c.id; }).length;
        host.appendChild(X.el("button", { type: "button", class: "mhs-kh-cat" + (cat === c.id ? " is-on" : ""), on: { click: function () { cat = cat === c.id ? "" : c.id; host.querySelectorAll(".mhs-kh-cat").forEach(function (e) { e.classList.remove("is-on"); }); if (cat) this.classList.add("is-on"); drawList(); } } }, [X.el("span", { class: "ic", text: c.icon || "•" }), X.el("b", { text: L(c) }), X.el("small", { text: X.num(n) })]));
      });
    }
    function drawList() {
      var j = DATA[name]; if (!j) return;
      var items = j.items || [], kind = tab === "duas" ? "dua" : tab === "amol" ? "amol" : "name";
      var qq = q.trim();
      if (qq) { items = SR().search(items, qq, [function (x) { return L(x.title); }, "ar", "tl", "en", "bn", function (x) { return L(x.meaning) + " " + L(x.how) + " " + L(x.fazilat) + " " + L(x.benefit); }, "src"], 80).map(function (r) { return r.item; }); }
      else if (cat) items = items.filter(function (x) { return (x.cat || x.g) === cat; });
      else if (tab !== "names") items = items.slice(0, 60);
      count.textContent = qq ? t("results", { n: X.num(items.length) }) : "";
      list.replaceChildren();
      if (!items.length) { list.appendChild(X.el("p", { class: "mhs-kh-empty", text: t("noResults") })); return; }
      if (tab === "names" && !qq) { var grid = X.el("div", { class: "mhs-kh-names" }); items.forEach(function (n) { grid.appendChild(nameTile(n)); }); list.appendChild(grid); }
      else items.forEach(function (it) { list.appendChild(card(kind, it, qq)); });
      if (target) { var el = list.querySelector('[data-id="' + target.id + '"]'); if (el) { el.classList.add("is-target"); setTimeout(function () { el.scrollIntoView({ block: "center", behavior: "smooth" }); }, 80); if (el.tagName === "BUTTON") el.click(); } target = null; }
      observe(list, kind);
    }
  }
  var io = null;
  function observe(list, kind) {
    if (!("IntersectionObserver" in window)) return;
    if (io) io.disconnect();
    io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { logRead(kind, e.target.getAttribute("data-id")); io.unobserve(e.target); } }); }, { root: sh.body, threshold: .6 });
    list.querySelectorAll("[data-id]").forEach(function (el) { io.observe(el); });
  }
  function hl(text) { return q.trim() ? SR().highlight(text, q) : X.esc(text); }
  function tools(kind, it, payload) {
    var on = isMarked(kind, it.id);
    var mk = X.el("button", { type: "button", class: "mhs-chip" + (on ? " is-on" : ""), "aria-pressed": on ? "true" : "false", text: (on ? "♥ " : "♡ ") + t(on ? "marked" : "mark"), on: { click: function () { var now = toggleMark(kind, it.id); mk.classList.toggle("is-on", now); mk.textContent = (now ? "♥ " : "♡ ") + t(now ? "marked" : "mark"); mk.setAttribute("aria-pressed", now ? "true" : "false"); } } });
    var row = X.el("div", { class: "mhs-kh-tools" }, [
      mk,
      X.el("button", { type: "button", class: "mhs-chip", text: "↗ " + t("share"), on: { click: function () { window.MHSShare.menu(payload); } } }),
      X.el("button", { type: "button", class: "mhs-chip", text: "📋 " + t("copy"), on: { click: function () { window.MHSShare.copy(window.MHSShare.text(payload)); } } })
    ]);
    if (it.q) row.appendChild(X.el("button", { type: "button", class: "mhs-chip", text: "📖 " + t("quran"), on: { click: function () { window.MHSQuran && window.MHSQuran.open({ surah: it.q.s, ayah: it.q.a }); } } }));
    if (it.z) row.appendChild(X.el("button", { type: "button", class: "mhs-chip", text: "📿 " + t("zikr"), on: { click: function () { window.MHSZikr && window.MHSZikr.open({ zikr: it.z }); } } }));
    if (kind === "amol") row.appendChild(X.el("button", { type: "button", class: "mhs-chip", text: "+ " + t("habit"), on: { click: function () { if (window.MHSApp && window.MHSApp.addHabits) { var n = window.MHSApp.addHabits([{ title: L(it.title), icon: "⭐", category: "Sunnah", points: 10 }]); X.toast(n ? t("habit") + " ✓" : "✓"); } } } }));
    return row;
  }
  function card(kind, it, qq) {
    var title = L(it.title) || it.tl || "", medium = kind === "amol" ? "amol" : "dua";
    var payload = { medium: medium, eyebrow: t(kind === "amol" ? "amol" : "duas"), title: title, ar: it.ar, tl: it.tl, text: kind === "amol" ? L(it.fazilat) : (L(it[X.lang()]) || it.en), src: it.src, link: { id: it.id } };
    var el = X.el("article", { class: "mhs-kh-item", "data-id": it.id }, [
      X.el("div", { class: "top" }, [X.el("b", { html: hl(title) }), it.count ? X.el("small", { text: String(it.count) }) : it.when ? X.el("small", { text: String(it.when) }) : null]),
      it.ar ? X.el("p", { class: "mhs-kh-ar", lang: "ar", dir: "rtl", html: hl(it.ar) }) : null,
      it.tl ? X.el("p", { class: "mhs-kh-tl", html: hl(it.tl) }) : null,
      kind === "amol" ? X.el("p", { class: "mhs-kh-tr", html: "<b>" + t("how") + ":</b> " + hl(L(it.how)) }) : X.el("p", { class: "mhs-kh-tr", html: hl(L({ en: it.en, bn: it.bn, ar: it.meaning_ar })) }),
      kind === "amol" ? X.el("p", { class: "mhs-kh-tr", html: "<b>" + t("fazilat") + ":</b> " + hl(L(it.fazilat)) }) : (it.note && L(it.note) ? X.el("p", { class: "mhs-kh-tl", text: L(it.note) }) : null),
      it.src ? X.el("small", { class: "mhs-kh-src", text: t("src") + ": " + it.src }) : null,
      tools(kind, it, payload)
    ]);
    return el;
  }
  function nameTile(n) {
    return X.el("button", { type: "button", class: "mhs-kh-name", "data-id": n.id, on: { click: function () { openName(n); } } }, [X.el("span", { class: "n", text: X.num(n.n) }), X.el("span", { class: "ar", lang: "ar", text: n.ar }), X.el("b", { text: n.tl }), X.el("small", { text: L({ en: n.en, bn: n.bn }) })]);
  }
  function openName(n) {
    logRead("name", n.id);
    var payload = { medium: "names", eyebrow: t("names"), title: n.tl + " — " + L({ en: n.en, bn: n.bn }), ar: n.ar, text: L(n.meaning), src: "Asmaul Husna " + n.n, link: { n: n.n } };
    var d = X.el("article", { class: "mhs-kh-item is-target", "data-id": n.id, style: { textAlign: "center" } }, [
      X.el("div", { class: "top", style: { justifyContent: "center" } }, [X.el("small", { text: X.num(n.n) + " / ৯৯".replace("৯৯", X.num(99)) })]),
      X.el("p", { class: "mhs-kh-ar", lang: "ar", dir: "rtl", style: { textAlign: "center", fontSize: "calc(2.4rem * var(--mhs-ar-scale,1))", color: "hsl(var(--primary))" }, text: n.ar }),
      X.el("b", { style: { fontSize: "1.1rem" }, text: n.tl }), X.el("p", { class: "mhs-kh-tr", text: L({ en: n.en, bn: n.bn }) }),
      X.el("p", { class: "mhs-kh-tr", html: "<b>" + t("meaning") + ":</b> " + X.esc(L(n.meaning)) }),
      n.benefit ? X.el("p", { class: "mhs-kh-tl", html: "<b>" + t("benefit") + ":</b> " + X.esc(L(n.benefit)) }) : null,
      X.el("div", { class: "mhs-kh-tools", style: { justifyContent: "center" } }, [
        X.el("button", { type: "button", class: "mhs-chip", text: "📿 " + t("zikr"), on: { click: function () { sendToZikr(n); } } }),
        "speechSynthesis" in window ? X.el("button", { type: "button", class: "mhs-chip", text: "🔊 " + t("audio"), on: { click: function () { try { var u = new SpeechSynthesisUtterance(n.ar); u.lang = "ar-SA"; u.rate = .8; speechSynthesis.cancel(); speechSynthesis.speak(u); } catch (e) {} } } }) : null
      ]),
      tools("name", n, payload)
    ]);
    var all = (DATA.names && DATA.names.items) || [], idx = all.indexOf(n);
    var nav = X.el("div", { class: "mhs-actions", style: { justifyContent: "space-between", marginTop: ".6rem" } }, [
      X.el("button", { type: "button", class: "mhs-btn", text: "‹", "aria-label": "previous", disabled: idx <= 0 ? true : null, on: { click: function () { openName(all[idx - 1]); } } }),
      X.el("button", { type: "button", class: "mhs-btn", text: t("back"), on: { click: function () { render(); } } }),
      X.el("button", { type: "button", class: "mhs-btn", text: "›", "aria-label": "next", disabled: idx >= all.length - 1 ? true : null, on: { click: function () { openName(all[idx + 1]); } } })
    ]);
    var b = sh.body; b.replaceChildren(d, nav); b.scrollTop = 0;
  }
  function sendToZikr(n) {
    var z = X.get("zikr", null) || {}; z.custom = z.custom || [];
    var id = "name-" + n.n;
    if (!z.custom.some(function (c) { return c.id === id; })) z.custom.push({ id: id, name: n.tl, en: n.tl, bn: n.bn, ar: n.ar, n: 33, c: "#ffd54f" });
    z.sel = id; X.set("zikr", z);
    sh && sh.close(); setTimeout(function () { window.MHSZikr && window.MHSZikr.open({ zikr: id }); }, 150);
  }
  function renderSaved(b) {
    var m = marks(), list = X.el("div", { class: "mhs-kh-list" }); b.appendChild(list);
    if (!m.dua.length && !m.amol.length && !m.name.length) { list.appendChild(X.el("p", { class: "mhs-kh-empty", text: t("none") })); return; }
    Promise.all([m.dua.length ? load("duas") : null, m.amol.length ? load("amol") : null, m.name.length ? load("names") : null]).then(function (r) {
      if (!sh || !sh.dialog.open) return;
      var find = function (j, id) { return j && (j.items || []).filter(function (x) { return x.id === id; })[0]; };
      m.dua.forEach(function (id) { var it = find(r[0], id); if (it) list.appendChild(card("dua", it, "")); });
      m.amol.forEach(function (id) { var it = find(r[1], id); if (it) list.appendChild(card("amol", it, "")); });
      if (m.name.length) { var grid = X.el("div", { class: "mhs-kh-names" }); m.name.forEach(function (id) { var it = find(r[2], id); if (it) grid.appendChild(nameTile(it)); }); list.appendChild(grid); }
    }).catch(function () { list.appendChild(X.el("p", { class: "mhs-kh-empty", text: t("offline") })); });
  }

  window.MHSKnowledge = { open: open, stats: stats, marks: marks, toggleMark: toggleMark, isMarked: isMarked, load: load, t: t };
  X.action({ k: "duas", c: "linear-gradient(140deg,#7c4dff,#00b8d4)", icon: "M12 2a4 4 0 0 1 4 4v2h2a2 2 0 0 1 2 2v9a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3v-9a2 2 0 0 1 2-2h2V6a4 4 0 0 1 4-4Z|M9 12h6|M12 9v6", label: function () { return t("menu"); }, sub: function () { return t("menuSub"); }, run: function () { open(); } });
})();
