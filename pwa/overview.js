/* <mhs-overview> — the 360° master overview on Home. Aggregates every module (habits, to-dos,
 * notes, ledger, zikr, Quran, amol, journal) into one Muhasabah Index and a Nafs · Qalb · Ruh
 * scorecard, with per-module tiles, sparklines and a 7-day (Pro: 30-day) life-audit heatmap.
 *
 * Scores (0–100), all computed on device from local data:
 *   Nafs (self-discipline) = on-time check-ins vs. missed/penalised + personal/nafl habit rate + to-dos done
 *   Qalb (heart)           = zikr days + daily amol completion + journal days
 *   Ruh  (soul)            = fard/sunnah habit completion + Quran reading days */
(function () {
  "use strict";
  if (window.customElements && customElements.get("mhs-overview")) return;
  var X = window.MHSX;
  var t = X.tr({
    en: { eyebrow: "360° Muhasabah", title: "Life audit", sub: "Every module, one honest picture", index: "Muhasabah Index",
      nafs: "Nafs", nafsS: "Self-discipline", qalb: "Qalb", qalbS: "Heart & remembrance", ruh: "Ruh", ruhS: "Soul & worship",
      habits: "Habits", todo: "To-Do", notes: "Notes", hisab: "Ledger", zikr: "Zikr", quran: "Quran", amol: "Amol", journal: "Journal", prayer: "Prayers", essential: "Essential amol", knowledge: "Duas & Wisdom", bookmarks: "Bookmarks",
      prayerV: "{d}/5 on time", essentialV: "{d}/{n} today", knowledgeV: "{n} read this week", bookmarksV: "{n} saved", share: "Share progress", shareTitle: "🔥 {n}-day streak on Muhasabah-Pro", shareBody: "Muhasabah Index {i}% · Nafs {nafs}% · Qalb {qalb}% · Ruh {ruh}% · {d}/{n} habits today. Alhamdulillah.",
      done: "{d}/{n} today", open: "{n} open", notesV: "{n} notes", recv: "Due to you", net: "Net this month", zikrV: "{n} today", quranV: "{n} ayahs this week", amolV: "{d}/{n} today", journalV: "{n} days this week",
      heat: "7-day audit", heat30: "30-day audit", d7: "7 days", d30: "30 days", locked: "Pro",
      i_ruh: "Your worship is your anchor — guard the fard and add a page of Quran.", i_qalb: "Soften the heart: a few minutes of zikr and one line in your journal tonight.", i_nafs: "Discipline wins quietly — finish one to-do and check in on time.",
      i_strong: "Strongest: {s}.", i_start: "Start small: tick one habit, say SubhanAllah ×33, read one ayah.", streak: "🔥 {n}-day streak", tap: "Open" },
    bn: { eyebrow: "৩৬০° মুহাসাবা", title: "জীবনের হিসাব", sub: "সব মডিউল, এক নজরে সৎ চিত্র", index: "মুহাসাবা সূচক",
      nafs: "নফস", nafsS: "আত্মনিয়ন্ত্রণ", qalb: "কলব", qalbS: "হৃদয় ও জিকির", ruh: "রূহ", ruhS: "আত্মা ও ইবাদত",
      habits: "অভ্যাস", todo: "করণীয়", notes: "নোট", hisab: "হিসাব", zikr: "জিকির", quran: "কুরআন", amol: "আমল", journal: "দিনলিপি", prayer: "নামাজ", essential: "প্রয়োজনীয় আমল", knowledge: "দোয়া ও হিকমাহ", bookmarks: "বুকমার্ক",
      prayerV: "{d}/৫ সময়মতো", essentialV: "আজ {d}/{n}", knowledgeV: "এ সপ্তাহে {n} পড়া", bookmarksV: "{n}টি সংরক্ষিত", share: "অগ্রগতি শেয়ার", shareTitle: "🔥 মুহাসাবা-প্রোতে {n} দিনের ধারা", shareBody: "মুহাসাবা সূচক {i}% · নফস {nafs}% · কলব {qalb}% · রূহ {ruh}% · আজ {d}/{n} অভ্যাস। আলহামদুলিল্লাহ।",
      done: "আজ {d}/{n}", open: "{n}টি বাকি", notesV: "{n}টি নোট", recv: "আপনার পাওনা", net: "এ মাসের নিট", zikrV: "আজ {n}", quranV: "এ সপ্তাহে {n} আয়াত", amolV: "আজ {d}/{n}", journalV: "এ সপ্তাহে {n} দিন",
      heat: "৭ দিনের হিসাব", heat30: "৩০ দিনের হিসাব", d7: "৭ দিন", d30: "৩০ দিন", locked: "প্রো",
      i_ruh: "ইবাদতই আপনার নোঙর — ফরজের হেফাজত করুন, এক পৃষ্ঠা কুরআন যোগ করুন।", i_qalb: "হৃদয় নরম করুন: আজ রাতে কয়েক মিনিট জিকির আর দিনলিপিতে এক লাইন।", i_nafs: "নিয়মানুবর্তিতা নীরবে জেতে — একটি করণীয় শেষ করুন, সময়মতো চেক-ইন করুন।",
      i_strong: "সবচেয়ে শক্তিশালী: {s}।", i_start: "ছোট করে শুরু করুন: একটি অভ্যাস টিক দিন, সুবহানাল্লাহ ×৩৩ বলুন, একটি আয়াত পড়ুন।", streak: "🔥 {n} দিনের ধারা", tap: "খুলুন" }
  });

  function clamp(v) { return Math.max(0, Math.min(1, isFinite(v) ? v : 0)); }
  function journalDays(data, days) {
    var j = data && data.journal || {}, set = {};
    Object.keys(j).forEach(function (k) {
      var m = /^(\d{4}-\d{2}-\d{2})/.exec(k), v = j[k];
      if (m && v && (typeof v === "string" ? v.trim() : JSON.stringify(v).length > 20)) set[m[1]] = true;
    });
    return days.map(function (d) { return set[X.dayKey(d)] ? 1 : 0; });
  }
  function zikrDays(days) { var z = X.get("zikr", null) || {}, log = z.log || {}; return days.map(function (d) { var e = log[X.dayKey(d)] || {}; return Object.keys(e).reduce(function (s, k) { return s + (Number(e[k]) || 0); }, 0); }); }
  function amolDays(days) { var a = X.get("amol", null) || {}, done = a.done || {}; return days.map(function (d) { return (done[X.dayKey(d)] || []).length; }); }
  function quranDays(days) { var log = X.readLS("quranlog", {}); return days.map(function (d) { var e = log[X.dayKey(d)]; return e ? e.n || 0 : 0; }); }
  function essentialDays(days) { var e = X.get("essential", null) || {}, done = e.done || {}; return days.map(function (d) { return (done[X.dayKey(d)] || []).length; }); }
  function prayerDays(days) { var e = X.get("essential", null) || {}, done = e.done || {}; return days.map(function (d) { return (done[X.dayKey(d)] || []).filter(function (id) { return /^p-(fajr|dhuhr|asr|maghrib|isha)$/.test(id); }).length; }); }
  function knowledgeDays(days) { var r = X.get("kread", null) || {}; return days.map(function (d) { var e = r[X.dayKey(d)] || {}; return (e.dua || 0) + (e.amol || 0) + (e.name || 0) + (e.wisdom || 0); }); }

  function compute(range) {
    var data = (window.MHS && window.MHS.current && window.MHS.current()) || {};
    var days = X.lastDays(range);
    var ins = null;
    try { ins = window.MHSInsights && window.MHSInsights.compute(data, range); } catch (e) {}
    var habits = Array.isArray(data.habits) ? data.habits : [];
    var catOf = {}; habits.forEach(function (h) { catOf[h.id] = h.category; });
    var worship = { due: 0, done: 0 }, personal = { due: 0, done: 0 };
    (ins && ins.habits || []).forEach(function (h) {
      var bucket = catOf[h.id] === "Fard" || catOf[h.id] === "Sunnah" ? worship : personal;
      bucket.due += h.due; bucket.done += h.done;
    });
    var ledger = Array.isArray(data.ledger) ? data.ledger : [], since = days[0].getTime();
    var checks = 0, misses = 0, todoDone = 0;
    var perDayHabit = days.map(function () { return 0; }), idx = {};
    days.forEach(function (d, i) { idx[X.dayKey(d)] = i; });
    ledger.forEach(function (e) {
      if (!(e.ts >= since)) return;
      if (e.type === "checkIn") { checks++; var i = idx[X.dayKey(new Date(e.ts))]; if (i != null) perDayHabit[i]++; }
      else if (e.type === "todoCheckIn") todoDone++;
      else if (e.type === "autoPenalty" || e.type === "todoPenalty") misses++;
    });
    var todos = Array.isArray(data.todos) ? data.todos : [];
    var todoOpen = todos.filter(function (x) { return x.status !== "done"; }).length;

    var zk = zikrDays(days), am = amolDays(days), qr = quranDays(days), jn = journalDays(data, days), es = essentialDays(days), pr = prayerDays(days), kn = knowledgeDays(days);
    var esTotal = window.MHSEssential ? Math.max(1, window.MHSEssential.items().length) : 22;
    var amTotal = window.MHSAmol ? window.MHSAmol.items.length : 17;
    var active = function (arr) { return arr.filter(function (v) { return v > 0; }).length / range; };

    var habitRate = ins && ins.hasExpected ? ins.rate : 0;
    var wRate = worship.due ? worship.done / worship.due : habitRate;
    var pRate = personal.due ? personal.done / personal.due : habitRate;
    var onTime = checks + misses ? checks / (checks + misses) : 0;
    var todoRate = todoDone + todoOpen ? todoDone / (todoDone + todoOpen) : 0;

    var nafs = clamp(0.45 * onTime + 0.35 * pRate + 0.2 * todoRate);
    var qalb = clamp(0.4 * active(zk) + 0.35 * (am.reduce(function (s, v) { return s + Math.min(1, v / Math.max(1, amTotal * 0.4)); }, 0) / range) + 0.25 * active(jn));
    var prRate = pr.reduce(function (s, v) { return s + Math.min(1, v / 5); }, 0) / range;
    var esRate = es.reduce(function (s, v) { return s + Math.min(1, v / Math.max(1, esTotal * 0.5)); }, 0) / range;
    var hasEs = es.some(function (v) { return v > 0; });
    var ruh = clamp(hasEs ? 0.4 * wRate + 0.25 * prRate + 0.15 * esRate + 0.2 * active(qr) : 0.7 * wRate + 0.3 * active(qr));
    qalb = clamp(qalb * 0.85 + 0.15 * active(kn));

    var today = [];
    try { today = window.MHSApp && window.MHSApp.habitsToday ? window.MHSApp.habitsToday() : []; } catch (e) {}
    return {
      range: range, days: days, nafs: nafs, qalb: qalb, ruh: ruh, index: (nafs + qalb + ruh) / 3,
      streak: ins ? ins.streak.current || 0 : 0,
      habitsToday: { d: today.filter(function (h) { return h.done; }).length, n: today.length },
      habitWeek: perDayHabit, todoOpen: todoOpen, todoDone: todoDone,
      zikr: zk, amol: am, quran: qr, journal: jn, amTotal: amTotal, essential: es, esTotal: esTotal, prayers: pr, knowledge: kn
    };
  }

  function insight(s) {
    var arr = [["nafs", s.nafs], ["qalb", s.qalb], ["ruh", s.ruh]].sort(function (a, b) { return a[1] - b[1]; });
    if (s.index < 0.05) return t("i_start");
    return t("i_strong", { s: t(arr[2][0]) }) + " " + t("i_" + arr[0][0]);
  }

  function sum(a) { return a.reduce(function (x, y) { return x + y; }, 0); }

  function render(host) {
    var range = host._range || 7;
    if (range > 7 && !(window.MHSGate && window.MHSGate.has("analytics"))) range = host._range = 7;
    var s = compute(range);
    var notes = window.MHSNotes && window.MHSNotes.stats ? window.MHSNotes.stats() : null;
    var hb = window.MHSHisab && window.MHSHisab.stats ? window.MHSHisab.stats() : null;
    var last7 = function (a) { return a.slice(-7); };
    var pct = function (v) { return X.num(Math.round(v * 100)); };
    var soul = [["nafs", s.nafs, "#ffab00"], ["qalb", s.qalb, "#ff4081"], ["ruh", s.ruh, "#00e5ff"]];

    var tiles = [
      { k: "habits", e: "🕌", v: t("done", { d: X.num(s.habitsToday.d), n: X.num(s.habitsToday.n) }), sp: last7(s.habitWeek), go: function () { window.MHSApp && window.MHSApp.nav("habits"); } },
      { k: "todo", e: "☑️", v: t("open", { n: X.num(s.todoOpen) }), sp: null, go: function () { window.MHSApp && window.MHSApp.nav("today"); } },
      { k: "zikr", e: "📿", v: t("zikrV", { n: X.num(s.zikr[s.zikr.length - 1]) }), sp: last7(s.zikr), go: function () { window.MHSZikr && window.MHSZikr.open(); } },
      { k: "quran", e: "📖", v: t("quranV", { n: X.num(sum(last7(s.quran))) }), sp: last7(s.quran), go: function () { window.MHSQuran && window.MHSQuran.open(); } },
      { k: "amol", e: "🤲", v: t("amolV", { d: X.num(s.amol[s.amol.length - 1]), n: X.num(s.amTotal) }), sp: last7(s.amol), go: function () { window.MHSAmol && window.MHSAmol.open(); } },
      { k: "journal", e: "✍️", v: t("journalV", { n: X.num(sum(last7(s.journal))) }), sp: last7(s.journal), go: function () { window.MHSJournal && window.MHSJournal.open(undefined, { focus: true }); } },
      { k: "notes", e: "🗒️", v: t("notesV", { n: X.num(notes ? notes.total : 0) }), sp: notes ? notes.week : null, go: function () { window.MHSNotes && window.MHSNotes.open(); } },
      { k: "hisab", e: "💰", v: hb ? (hb.receivable ? t("recv") + " " + X.money(hb.receivable, hb.currency) : t("net") + " " + X.money(hb.monthNet, hb.currency)) : "—", sp: hb ? hb.week.map(function (v) { return Math.abs(v); }) : null, go: function () { window.MHSHisab && window.MHSHisab.open(); } },
      { k: "prayer", e: "🕌", v: t("prayerV", { d: X.num(s.prayers[s.prayers.length - 1]) }), sp: last7(s.prayers), go: function () { window.MHSPrayerHub && window.MHSPrayerHub.open({ tab: "amol" }); } },
      { k: "essential", e: "📿", v: t("essentialV", { d: X.num(s.essential[s.essential.length - 1]), n: X.num(s.esTotal) }), sp: last7(s.essential), go: function () { window.MHSPrayerHub && window.MHSPrayerHub.open({ tab: "amol" }); } },
      { k: "knowledge", e: "🤲", v: t("knowledgeV", { n: X.num(sum(last7(s.knowledge))) }), sp: last7(s.knowledge), go: function () { window.MHSKnowledge && window.MHSKnowledge.open(); } },
      { k: "bookmarks", e: "🔖", v: t("bookmarksV", { n: X.num(window.MHSBookmarks ? window.MHSBookmarks.count() : 0) }), sp: null, go: function () { window.MHSBookmarks && window.MHSBookmarks.open(); } }
    ];

    var sec = X.el("section", { class: "panel mhs-ov", "aria-labelledby": "mhs-ov-h", dir: X.lang() === "ar" ? "rtl" : "ltr" });
    var head = X.el("header", { class: "mhs-ov-head" }, [
      X.el("div", null, [X.el("div", { class: "mhs-ov-eyebrow", text: t("eyebrow") }), X.el("h2", { id: "mhs-ov-h", text: t("title") }), X.el("p", { text: t("sub") }),
        X.el("button", { type: "button", class: "mhs-chip mhs-ov-share", text: "↗ " + t("share"), on: { click: function () {
          if (!window.MHSShare) return;
          window.MHSShare.menu({ medium: "streak", eyebrow: t("eyebrow"), title: t("shareTitle", { n: X.num(s.streak) }), text: t("shareBody", { i: pct(s.index), nafs: pct(s.nafs), qalb: pct(s.qalb), ruh: pct(s.ruh), d: X.num(s.habitsToday.d), n: X.num(s.habitsToday.n) }) });
        } } })]),
      X.el("div", { class: "mhs-ov-range", role: "group" }, [7, 30].map(function (r) {
        var locked = r > 7 && !(window.MHSGate && window.MHSGate.has("analytics"));
        return X.el("button", { type: "button", class: "mhs-chip" + (range === r ? " is-on" : ""), "aria-pressed": range === r ? "true" : "false", on: { click: function () {
          if (locked) { window.MHSGate && window.MHSGate.prompt("analytics"); return; }
          host._range = r; render(host);
        } } }, [t(r === 7 ? "d7" : "d30") + (locked ? " 🔒" : "")]);
      }))
    ]);
    var score = X.el("div", { class: "mhs-ov-score" }, [
      X.el("div", { class: "mhs-ov-index" }),
      X.el("div", { class: "mhs-ov-soul" }, soul.map(function (p) {
        return X.el("div", { class: "mhs-ov-bar", style: { "--c": p[2] } }, [
          X.el("div", { class: "lbl" }, [X.el("b", { text: t(p[0]) }), X.el("small", { text: t(p[0] + "S") }), X.el("span", { class: "num", text: pct(p[1]) })]),
          X.el("div", { class: "track", role: "meter", "aria-valuemin": "0", "aria-valuemax": "100", "aria-valuenow": String(Math.round(p[1] * 100)), "aria-label": t(p[0]) }, [X.el("i", { style: { width: Math.round(p[1] * 100) + "%" } })])
        ]);
      }))
    ]);
    var idxEl = score.querySelector(".mhs-ov-index");
    idxEl.innerHTML = X.ring(s.index, 132, 11, "url(#mhsOvGrad)").replace(/^<svg([^>]*)>/, '<svg$1><defs><linearGradient id="mhsOvGrad" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#00e676"/><stop offset="1" stop-color="#00b8d4"/></linearGradient></defs>') +
      '<div class="in"><b class="num">' + X.esc(pct(s.index)) + '</b><small>' + X.esc(t("index")) + "</small>" + (s.streak ? '<em>' + X.esc(t("streak", { n: X.num(s.streak) })) + "</em>" : "") + "</div>";

    var ins = X.el("p", { class: "mhs-ov-insight", text: "💡 " + insight(s) });

    var grid = X.el("div", { class: "mhs-ov-tiles" }, tiles.map(function (m) {
      return X.el("button", { type: "button", class: "mhs-ov-tile", "aria-label": t("tap") + " " + t(m.k), on: { click: m.go } }, [
        X.el("span", { class: "e", "aria-hidden": "true", text: m.e }),
        X.el("span", { class: "k", text: t(m.k) }),
        X.el("span", { class: "v", text: m.v }),
        m.sp ? X.el("span", { class: "sp", html: X.bars(m.sp, 72, 20) }) : null
      ]);
    }));

    // Heatmap: rows = modules, columns = days.
    var rows = [["habits", s.habitWeek], ["zikr", s.zikr], ["amol", s.amol], ["quran", s.quran], ["journal", s.journal]];
    var heat = X.el("div", { class: "mhs-ov-heat", role: "img", "aria-label": t(range > 7 ? "heat30" : "heat") });
    heat.style.setProperty("--cols", range);
    rows.forEach(function (r) {
      var max = Math.max.apply(null, r[1].concat([1]));
      heat.appendChild(X.el("span", { class: "rl", text: t(r[0]) }));
      r[1].forEach(function (v, i) {
        heat.appendChild(X.el("i", { class: "c", title: X.fmtDate(s.days[i]) + " · " + X.num(v), style: { "--a": v > 0 ? (0.25 + 0.75 * v / max).toFixed(2) : "0" } }));
      });
    });
    var heatWrap = X.el("div", { class: "mhs-ov-heatwrap" }, [X.el("h3", { text: t(range > 7 ? "heat30" : "heat") }), heat]);

    sec.append(head, score, ins, grid, heatWrap);
    host.replaceChildren(sec);
  }

  document.addEventListener("mhs:essential", function () { document.querySelectorAll("mhs-overview").forEach(function (h) { if (h._later) h._later(); }); });
  customElements.define("mhs-overview", class extends HTMLElement {
    connectedCallback() {
      var self = this, timer = null;
      function later() { clearTimeout(timer); timer = setTimeout(function () { if (self.isConnected) render(self); }, 250); }
      this._later = later;
      render(this);
      X.on(later);
      if (window.MHS && window.MHS.onSave) window.MHS.onSave(later);
      document.addEventListener("visibilitychange", function () { if (!document.hidden) later(); });
      document.addEventListener("mhs:pro-change", later);
      // Mini-apps may load after the Home view: re-render once they are ready.
      setTimeout(later, 900); setTimeout(later, 2500);
    }
    static get observedAttributes() { return ["lang"]; }
    attributeChangedCallback() { if (this.isConnected && this._later) this._later(); }
  });
})();
