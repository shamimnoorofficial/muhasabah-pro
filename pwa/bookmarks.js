/* MHSBookmarks — one place for everything saved across the mini-apps: Quran ayahs, Hadith entries,
 * Reminder favourites, Duas, Amol, 99 Names and Wisdom sayings. Each row deep-links to its exact
 * source. Folders/tags are the content types; a search box filters across all of them. */
(function () {
  "use strict";
  if (window.MHSBookmarks) return;
  var X = window.MHSX;
  var t = X.tr({
    en: { title: "Bookmarks", sub: "Everything you saved, in one place", menu: "Bookmarks", menuSub: "Saved ayahs, hadith, duas, names & wisdom", all: "All", quran: "Quran", hadith: "Hadith", reminder: "Reminder", dua: "Duas", amol: "Amol", name: "99 Names", wisdom: "Wisdom", none: "Nothing saved yet. Tap the bookmark or ♡ on any ayah, hadith, dua or saying.", search: "Search your bookmarks…", open: "Open", remove: "Remove", ayah: "Ayah {s}:{a}", n: "{n} saved" },
    bn: { title: "বুকমার্ক", sub: "আপনার সংরক্ষিত সবকিছু এক জায়গায়", menu: "বুকমার্ক", menuSub: "সংরক্ষিত আয়াত, হাদিস, দোয়া, নাম ও হিকমাহ", all: "সব", quran: "কুরআন", hadith: "হাদিস", reminder: "স্মরণ", dua: "দোয়া", amol: "আমল", name: "৯৯ নাম", wisdom: "হিকমাহ", none: "এখনো কিছু সংরক্ষিত নেই। যেকোনো আয়াত, হাদিস, দোয়া বা বাণীতে বুকমার্ক বা ♡ চাপুন।", search: "বুকমার্কে খুঁজুন…", open: "খুলুন", remove: "মুছুন", ayah: "আয়াত {s}:{a}", n: "{n}টি সংরক্ষিত" },
    ar: { title: "المحفوظات", sub: "كل ما حفظته في مكان واحد", menu: "المحفوظات", menuSub: "آيات وأحاديث وأدعية وأسماء وحِكم", all: "الكل", quran: "القرآن", hadith: "الحديث", reminder: "تذكرة", dua: "الأدعية", amol: "الأعمال", name: "الأسماء", wisdom: "الحكمة", none: "لا محفوظات بعد.", search: "ابحث…", open: "افتح", remove: "إزالة", ayah: "آية {s}:{a}", n: "{n} محفوظ" }
  });
  function ls(k, d) { try { return JSON.parse(localStorage.getItem(k) || "null") || d; } catch (e) { return d; } }
  function lsSet(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function L(o) { if (!o) return ""; if (typeof o === "string") return o; return o[X.lang()] || o.en || o.bn || ""; }
  function surah(s) { try { var r = window.MHSQuran.surahs[s - 1]; return X.lang() === "ar" ? r[1] : r[2]; } catch (e) { return "Surah " + s; } }

  /* Collect rows: { kind, id, title, sub, at, go(), remove() } */
  function collect() {
    var rows = [];
    ls("mhs:quran:marks", []).forEach(function (m) { rows.push({ kind: "quran", id: "q" + m.s + ":" + m.a, title: surah(m.s), sub: t("ayah", { s: X.num(m.s), a: X.num(m.a) }), at: m.at || 0, go: function () { window.MHSQuran.open({ surah: m.s, ayah: m.a }); }, remove: function () { lsSet("mhs:quran:marks", ls("mhs:quran:marks", []).filter(function (x) { return !(x.s === m.s && x.a === m.a); })); } }); });
    ls("mhs:hadith:marks", []).forEach(function (m) { rows.push({ kind: "hadith", id: "h" + m.b + ":" + m.n, title: m.title || (m.b + " " + m.n), sub: m.b + " · " + X.num(m.n), at: m.at || 0, go: function () { window.MHSHadith.open({ book: m.b, number: m.n }); }, remove: function () { lsSet("mhs:hadith:marks", ls("mhs:hadith:marks", []).filter(function (x) { return !(x.b === m.b && x.n === m.n); })); } }); });
    var pool = window.MHSReminder ? window.MHSReminder.pool() : [];
    ls("mhs:wisdom:favs", []).forEach(function (id) { var it = pool.filter(function (r) { return r.id === id; })[0]; if (!it) return; rows.push({ kind: "reminder", id: "r" + id, title: String(it.text || "").slice(0, 90), sub: it.src, at: 0, go: function () { window.MHSReminder.open({ id: id }); }, remove: function () { lsSet("mhs:wisdom:favs", ls("mhs:wisdom:favs", []).filter(function (x) { return x !== id; })); } }); });
    var K = window.MHSKnowledge, m = K ? K.marks() : { dua: [], amol: [], name: [], wisdom: [] };
    m.dua.forEach(function (id) { rows.push({ kind: "dua", id: "d" + id, title: id, lazy: ["duas", id], at: 0, go: function () { K.open({ tab: "duas", id: id }); }, remove: function () { K.toggleMark("dua", id); } }); });
    m.amol.forEach(function (id) { rows.push({ kind: "amol", id: "a" + id, title: id, lazy: ["amol", id], at: 0, go: function () { K.open({ tab: "amol", id: id }); }, remove: function () { K.toggleMark("amol", id); } }); });
    m.name.forEach(function (id) { rows.push({ kind: "name", id: "n" + id, title: id, lazy: ["names", id], at: 0, go: function () { K.open({ tab: "names", id: id }); }, remove: function () { K.toggleMark("name", id); } }); });
    m.wisdom.forEach(function (id) { rows.push({ kind: "wisdom", id: "w" + id, title: id, lazyW: id, at: 0, go: function () { window.MHSWisdomApp.open({ id: id }); }, remove: function () { K.toggleMark("wisdom", id); } }); });
    return rows;
  }
  function count() { return collect().length; }

  var sh = null, kind = "all", q = "";
  function open() {
    if (!window.MHSSheet) return;
    if (sh && sh.dialog.open) { render(); return; }
    sh = X.sheet({ id: "mhs-bookmarks", title: t("title"), sub: t("sub"), onClose: function () { sh = null; } });
    sh.body.classList.add("mhs-kh");
    render();
  }
  function render() {
    var b = sh.body; b.replaceChildren();
    var rows = collect();
    var chips = X.el("div", { class: "mhs-mini-chips", role: "tablist" });
    var kinds = ["all", "quran", "hadith", "reminder", "dua", "amol", "name", "wisdom"];
    kinds.forEach(function (k) { var n = k === "all" ? rows.length : rows.filter(function (r) { return r.kind === k; }).length; if (k !== "all" && !n) return; chips.appendChild(X.el("button", { type: "button", role: "tab", class: "mhs-chip" + (kind === k ? " is-on" : ""), text: t(k) + " · " + X.num(n), on: { click: function () { kind = k; render(); } } })); });
    b.appendChild(chips);
    var box = window.MHSSearch.box({ ns: "bookmarks", placeholder: t("search"), value: q, onQuery: function (v) { q = v; draw(); } });
    b.appendChild(box.el);
    var list = X.el("div", { class: "mhs-mini-list" }); b.appendChild(list);
    // resolve lazy titles for knowledge items
    var K = window.MHSKnowledge, need = rows.filter(function (r) { return r.lazy || r.lazyW; });
    Promise.all([need.some(function (r) { return r.lazy && r.lazy[0] === "duas"; }) ? K.load("duas") : null, need.some(function (r) { return r.lazy && r.lazy[0] === "amol"; }) ? K.load("amol") : null, need.some(function (r) { return r.lazy && r.lazy[0] === "names"; }) ? K.load("names") : null, need.some(function (r) { return r.lazyW; }) && window.MHSWisdomApp ? window.MHSWisdomApp.load() : null].map(function (p) { return p ? p.catch(function () { return null; }) : null; })).then(function (res) {
      var find = function (j, id) { return j && (j.items || []).filter(function (x) { return x.id === id; })[0]; };
      rows.forEach(function (r) {
        if (r.lazy) { var it = find(res[r.lazy[0] === "duas" ? 0 : r.lazy[0] === "amol" ? 1 : 2], r.lazy[1]); if (it) { r.title = L(it.title) || it.tl || it.en || r.title; r.sub = it.ar ? String(it.ar).slice(0, 60) : it.src || ""; } }
        if (r.lazyW) { var w = find(res[3], r.lazyW); if (w) { r.title = String(w[X.lang()] || w.en).slice(0, 90); r.sub = w.src || ""; } }
      });
      draw();
    });
    draw();
    function draw() {
      list.replaceChildren();
      var SR = window.MHSSearch, qq = q.trim();
      var vis = rows.filter(function (r) { return kind === "all" || r.kind === kind; });
      if (qq) vis = SR.search(vis, qq, ["title", "sub"]).map(function (x) { return x.item; });
      if (!vis.length) { list.appendChild(X.el("p", { class: "mhs-kh-empty", text: t("none") })); return; }
      vis.forEach(function (r) {
        var row = X.el("div", { class: "mhs-mini-row", role: "button", tabindex: "0", on: { click: function (e) { if (e.target.closest && e.target.closest(".rm")) return; sh.close(); setTimeout(r.go, 120); }, keydown: function (e) { if (e.key === "Enter") { sh.close(); setTimeout(r.go, 120); } } } }, [
          X.el("span", { class: "mhs-mini-num", text: { quran: "📖", hadith: "📚", reminder: "💡", dua: "🤲", amol: "⭐", name: "✨", wisdom: "🕯️" }[r.kind] }),
          X.el("div", { class: "txt" }, [X.el("b", { html: qq ? SR.highlight(r.title, qq) : X.esc(r.title) }), X.el("small", { text: (r.sub || "") + " · " + t(r.kind) })]),
          X.el("button", { type: "button", class: "mhs-mini-ib rm", "aria-label": t("remove"), title: t("remove"), on: { click: function (e) { e.stopPropagation(); r.remove(); render(); } } }, [sh.icon("M18 6 6 18|M6 6l12 12")])
        ]);
        list.appendChild(row);
      });
    }
  }
  /* Keep the per-module localStorage keys (Quran/Hadith bookmarks, Reminder favourites & custom
   * items, widget config) mirrored inside the main data object (MHSX "lsmirror") so they ride along
   * in Export/Import, Google Drive and server sync — and restore them on a fresh device. */
  var MIRROR = ["mhs:quran:marks", "mhs:hadith:marks", "mhs:wisdom:favs", "mhs:wisdom:custom", "mhs:widgetcfg", "mhs:quran:last"];
  function mirrorOut() {
    var m = {}; MIRROR.forEach(function (k) { var v = ls(k, null); if (v != null) m[k] = v; });
    var cur = X.get("lsmirror", null) || {};
    if (JSON.stringify(cur) !== JSON.stringify(m)) X.set("lsmirror", m);
  }
  function mirrorIn() {
    var m = X.get("lsmirror", null); if (!m) return;
    MIRROR.forEach(function (k) { if (m[k] != null && localStorage.getItem(k) == null) lsSet(k, m[k]); });
  }
  try {
    var orig = Storage.prototype.setItem, tmr = null;
    Storage.prototype.setItem = function (k, v) { orig.apply(this, arguments); if (this === window.localStorage && MIRROR.indexOf(k) >= 0) { clearTimeout(tmr); tmr = setTimeout(mirrorOut, 800); } };
  } catch (e) {}
  X.whenReady("MHS", function () { setTimeout(function () { mirrorIn(); mirrorOut(); }, 1200); });
  document.addEventListener("mhs:extras", function () { setTimeout(mirrorIn, 300); });

  window.MHSBookmarks = { open: open, count: count, collect: collect, mirror: mirrorOut };
  X.action({ k: "bookmarks", c: "linear-gradient(140deg,#ff4081,#ff8f00)", icon: "M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2Z", label: function () { return t("menu"); }, sub: function () { return t("menuSub"); }, run: open });
})();
