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
      addTitle: "Add a quote or saying", text: "Text", textPh: "Write the quote, verse or saying…", by: "Source / author", byPh: "e.g. Imam Ahmad, Surah Al-Kahf 18:10", kind: "Type", save: "Save", cancel: "Cancel", saved: "Saved to your reminders", delete: "Delete", deleted: "Removed" },
    bn: { title: "স্মরণ", sub: "আয়াত, হাদিস ও জ্ঞানের কথা", all: "সব", verse: "কুরআন", hadith: "হাদিস", quote: "হিকমাহ", favs: "সংরক্ষিত", mine: "আমার", next: "পরবর্তী", share: "শেয়ার", fav: "সংরক্ষণ", unfav: "সংরক্ষিত", add: "নিজের যোগ", openQ: "কুরআনে খুলুন", openH: "হাদিসে খুলুন", openW: "হিকমাহে খুলুন", none: "এই ফিল্টারে এখনো কিছু নেই।", context: "প্রসঙ্গ",
      nTitle: "দৈনিক স্মরণ নোটিফিকেশন", nSub: "আপনার বেছে নেওয়া সময়ে একটি আয়াত, হাদিস বা বাণী — অ্যাপ বন্ধ থাকলেও।", nEnable: "দৈনিক স্মরণ", nTimes: "সময়", nAdd: "+ সময় যোগ", nSources: "উৎস", nPerDay: "দিনে {n}টি", nDenied: "নোটিফিকেশন বন্ধ আছে। ব্রাউজার বা ফোনের সেটিংসে অনুমতি দিন।", nUnsupported: "এই ব্রাউজারে নোটিফিকেশন সমর্থিত নয়।", nTest: "পরীক্ষা পাঠান", nSent: "পরীক্ষা পাঠানো হয়েছে", nIos: "আইফোন/আইপ্যাডে প্রথমে হোম স্ক্রিনে অ্যাপ যোগ করুন।", nNote: "স্মরণগুলো এই ডিভাইসে নির্ধারিত হয়; অ্যাপ খোলা বা ব্যাকগ্রাউন্ডে থাকলে এবং দৈনিক পুশ চালু থাকলে পুশের মাধ্যমে আসে।",
      addTitle: "একটি উক্তি বা বাণী যোগ করুন", text: "লেখা", textPh: "উক্তি, আয়াত বা বাণী লিখুন…", by: "সূত্র / বক্তা", byPh: "যেমন: ইমাম আহমাদ, সূরা কাহফ ১৮:১০", kind: "ধরন", save: "সংরক্ষণ", cancel: "বাতিল", saved: "আপনার স্মরণে যোগ হয়েছে", delete: "মুছুন", deleted: "মুছে ফেলা হয়েছে" },
    ar: { title: "تذكرة", sub: "آيات وأحاديث وحِكم", all: "الكل", verse: "القرآن", hadith: "الحديث", quote: "الحكمة", favs: "المحفوظات", mine: "لي", next: "التالي", share: "مشاركة", fav: "حفظ", unfav: "محفوظ", add: "أضف", openQ: "افتح في القرآن", openH: "افتح في الحديث", openW: "افتح في الحكمة", none: "لا شيء هنا بعد.", context: "السياق",
      nTitle: "إشعارات التذكير اليومي", nSub: "آية أو حديث أو حكمة في الأوقات التي تختارها.", nEnable: "تذكير يومي", nTimes: "الأوقات", nAdd: "+ وقت", nSources: "المصادر", nPerDay: "{n} يومياً", nDenied: "الإشعارات محظورة.", nUnsupported: "المتصفح لا يدعم الإشعارات.", nTest: "إشعار تجريبي", nSent: "تم الإرسال", nIos: "أضف التطبيق إلى الشاشة الرئيسية أولاً.", nNote: "تُجدول التذكيرات على هذا الجهاز.",
      addTitle: "أضف حكمة", text: "النص", textPh: "اكتب…", by: "المصدر", byPh: "مثال: الإمام أحمد", kind: "النوع", save: "حفظ", cancel: "إلغاء", saved: "تم الحفظ", delete: "حذف", deleted: "تم الحذف" }
  });
  function ls(k, d) { try { return JSON.parse(localStorage.getItem(k) || "null") || d; } catch (e) { return d; } }
  function lsSet(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function favs() { return ls("mhs:wisdom:favs", []); }
  function mine() { return ls("mhs:wisdom:custom", []); }
  function L(o) { if (!o) return ""; if (typeof o === "string") return o; return o[X.lang()] || o.en || o.bn || ""; }
  function surahName(s) { try { var r = window.MHSQuran.surahs[s - 1]; return X.lang() === "ar" ? r[1] : r[2]; } catch (e) { return "Surah " + s; } }
  var BOOKS = { bukhari: "Sahih al-Bukhari", muslim: "Sahih Muslim", abudawud: "Sunan Abi Dawud", tirmidhi: "Jami' at-Tirmidhi", nasai: "Sunan an-Nasa'i", ibnmajah: "Sunan Ibn Majah", malik: "Muwatta Malik", ahmad: "Musnad Ahmad" };

  /* ---- pool: legacy built-ins + /data/reminders.json + /data/wisdom.json + user items ---- */
  var extra = null, wis = null, loading = null;
  function loadExtra() {
    if (loading) return loading;
    loading = Promise.all([
      fetch("/data/reminders.json").then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; }),
      window.MHSWisdomApp ? window.MHSWisdomApp.load().catch(function () { return null; }) : Promise.resolve(null)
    ]).then(function (r) { extra = r[0]; wis = r[1]; return true; });
    return loading;
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
    return out;
  }
  /* unseen-first rotation (persisted) */
  function seen() { var s = X.get("rfseen", null) || { ids: [] }; s.ids = Array.isArray(s.ids) ? s.ids : []; return s; }
  function pick(filter) {
    var all = pool().filter(function (r) { return filter === "all" || (filter === "favs" ? favs().indexOf(r.id) >= 0 : filter === "mine" ? r.mine : r.kind === filter); });
    if (!all.length) return null;
    var s = seen(), unseen = all.filter(function (r) { return s.ids.indexOf(r.id) < 0; });
    if (!unseen.length) { s.ids = s.ids.filter(function (id) { return !all.some(function (r) { return r.id === id; }); }); unseen = all; }
    var it = unseen[Math.floor(Math.random() * unseen.length)];
    s.ids.push(it.id); if (s.ids.length > 2000) s.ids = s.ids.slice(-2000); X.set("rfseen", s);
    return it;
  }

  /* ---- UI ---- */
  var sh = null, filter = "all", cur = null, adding = false;
  function open(opts) {
    if (!window.MHSSheet) return;
    if (opts && opts.id) cur = pool().filter(function (r) { return r.id === opts.id; })[0] || null;
    if (sh && sh.dialog.open) { render(); return; }
    sh = X.sheet({ id: "mhs-wisdom", title: t("title"), sub: t("sub"), onClose: function () { sh = null; } });
    sh.body.classList.add("mhs-kh");
    render();
    loadExtra().then(function () { if (sh && sh.dialog.open && !cur) { cur = pick(filter); render(); } });
  }
  function render(next) {
    var b = sh.body; b.replaceChildren(); sh.tools.replaceChildren();
    var RP = window.MHSReadPref; if (RP) { RP.apply(b); sh.tools.appendChild(RP.controls(b)); }
    sh.tools.appendChild(X.el("button", { type: "button", class: "mhs-mini-ib" + (adding ? " is-on" : ""), "aria-label": t("add"), title: t("add"), on: { click: function () { adding = !adding; render(); } } }, [sh.icon("M12 5v14|M5 12h14")]));
    var chips = X.el("div", { class: "mhs-mini-chips", role: "tablist" });
    [["all", t("all")], ["verse", "📖 " + t("verse")], ["hadith", "📚 " + t("hadith")], ["quote", "💡 " + t("quote")], ["favs", "♥ " + t("favs")], ["mine", "✍️ " + t("mine")]].forEach(function (o) {
      chips.appendChild(X.el("button", { type: "button", role: "tab", class: "mhs-chip" + (filter === o[0] ? " is-on" : ""), "aria-selected": String(filter === o[0]), text: o[1], on: { click: function () { filter = o[0]; cur = pick(filter); render(); } } }));
    });
    b.appendChild(chips);
    if (adding) b.appendChild(form());
    if (!cur) cur = pick(filter);
    if (!cur) b.appendChild(X.el("p", { class: "mhs-kh-empty", text: t("none") }));
    else {
      var a = cur, isFav = favs().indexOf(a.id) >= 0;
      var card = X.el("div", { class: "mhs-rf-card", role: "region", "aria-live": "polite" }, [
        X.el("div", { class: "mhs-rf-type", text: t(a.kind) }),
        a.ar ? X.el("div", { class: "mhs-rf-ar", lang: "ar", dir: "rtl", text: a.ar }) : null,
        X.el("div", { class: "mhs-rf-text", text: a.text }),
        a.ctx ? X.el("p", { class: "mhs-rf-ctx", text: t("context") + ": " + a.ctx }) : null,
        a.go ? X.el("button", { type: "button", class: "mhs-rf-src", "aria-label": a.goLabel || a.src, on: { click: function () { sh.close(); setTimeout(a.go, 120); } } }, ["— " + a.src + " ↗"]) : X.el("div", { class: "mhs-rf-src", style: { border: "0", cursor: "default" }, text: "— " + a.src }),
        a.tags && a.tags.length ? X.el("div", { class: "mhs-rf-tags" }, a.tags.slice(0, 4).map(function (g) { return X.el("span", { text: "#" + g }); })) : null,
        a.mine ? X.el("button", { type: "button", class: "mhs-chip", style: { marginTop: ".6rem" }, text: "🗑 " + t("delete"), on: { click: function () { lsSet("mhs:wisdom:custom", mine().filter(function (m) { return m.id !== a.id; })); X.toast(t("deleted")); cur = pick(filter); render(); } } }) : null
      ]);
      b.appendChild(card);
      var acts = X.el("div", { class: "mhs-rf-actions" }, [
        X.el("button", { type: "button", on: { click: function () { cur = pick(filter); render(true); } } }, [X.el("span", { class: "ic", text: "↻" }), t("next")]),
        X.el("button", { type: "button", on: { click: function () { window.MHSShare.menu({ medium: "reminder", eyebrow: t(a.kind), ar: a.ar, text: a.text, src: a.src, link: { id: a.id } }); } } }, [X.el("span", { class: "ic", text: "↗" }), t("share")]),
        X.el("button", { type: "button", class: isFav ? "is-on" : "", "aria-pressed": String(isFav), on: { click: function () { var f = favs(), i = f.indexOf(a.id); if (i >= 0) f.splice(i, 1); else f.push(a.id); lsSet("mhs:wisdom:favs", f); render(); } } }, [X.el("span", { class: "ic", text: isFav ? "♥" : "♡" }), t(isFav ? "unfav" : "fav")]),
        X.el("button", { type: "button", on: { click: function () { adding = true; render(); } } }, [X.el("span", { class: "ic", text: "✍️" }), t("add")])
      ]);
      b.appendChild(acts);
    }
    b.appendChild(notifCard());
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

  window.MHSReminder = { open: open, pool: pool, pick: pick, schedule: schedule, cfg: ncfg, t: t };
  /* Route the unified menu "Get Reminder" item and legacy callers to the new feed. */
  X.whenReady("MHSWisdom", function (W) { W.open = function (o) { open(o); }; });
})();
