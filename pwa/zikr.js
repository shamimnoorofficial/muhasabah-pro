/* Muhasabah Zikr — a tactile digital tasbih with targets, rounds, vibration/sound feedback,
 * custom adhkar and a daily history that feeds the Home overview (Qalb score).
 * Data: MHSX.get("zikr") = { log: { "YYYY-MM-DD": { <zikrId>: count } }, custom: [...], sel, sound, vibe, goal } */
(function () {
  "use strict";
  if (window.MHSZikr) return;
  var X = window.MHSX;
  var t = X.tr({
    en: { title: "Zikr Counter", sub: "Digital tasbih · history & targets", menuSub: "Tasbih with targets & history", today: "Today", streak: "Day streak", total: "All time", goal: "Daily goal", week: "Last 7 days",
      tap: "Tap anywhere on the circle", round: "Round {n}", of: "of {n}", done: "Target reached — Alhamdulillah!", undo: "Undo", reset: "Reset", resetQ: "Tap again to reset",
      sound: "Sound", vibe: "Vibration", add: "Custom zikr", addTitle: "New zikr", name: "Name / transliteration", arabic: "Arabic (optional)", target: "Target count", save: "Save", cancel: "Cancel", del: "Delete",
      history: "History", none: "No zikr logged yet. Start with SubhanAllah ×33.", set: "Set goal", per: "per day", wake: "Screen stays on while counting" },
    bn: { title: "জিকির কাউন্টার", sub: "ডিজিটাল তাসবিহ · ইতিহাস ও লক্ষ্য", menuSub: "লক্ষ্য ও ইতিহাসসহ তাসবিহ", today: "আজ", streak: "দিনের ধারা", total: "সর্বমোট", goal: "দৈনিক লক্ষ্য", week: "গত ৭ দিন",
      tap: "বৃত্তের যেকোনো জায়গায় ট্যাপ করুন", round: "রাউন্ড {n}", of: "{n}-এর মধ্যে", done: "লক্ষ্য পূর্ণ — আলহামদুলিল্লাহ!", undo: "পূর্বাবস্থা", reset: "রিসেট", resetQ: "রিসেট করতে আবার ট্যাপ করুন",
      sound: "শব্দ", vibe: "কম্পন", add: "নিজের জিকির", addTitle: "নতুন জিকির", name: "নাম / উচ্চারণ", arabic: "আরবি (ঐচ্ছিক)", target: "লক্ষ্য সংখ্যা", save: "সংরক্ষণ", cancel: "বাতিল", del: "মুছুন",
      history: "ইতিহাস", none: "এখনো কোনো জিকির নেই। সুবহানাল্লাহ ×৩৩ দিয়ে শুরু করুন।", set: "লক্ষ্য ঠিক করুন", per: "প্রতিদিন", wake: "গোনার সময় স্ক্রিন চালু থাকবে" }
  });
  var PRESETS = [
    { id: "subhanallah", ar: "سُبْحَانَ ٱللَّٰهِ", en: "SubhanAllah", bn: "সুবহানাল্লাহ", n: 33, c: "#00c853" },
    { id: "alhamdulillah", ar: "ٱلْحَمْدُ لِلَّٰهِ", en: "Alhamdulillah", bn: "আলহামদুলিল্লাহ", n: 33, c: "#00b8d4" },
    { id: "allahuakbar", ar: "ٱللَّٰهُ أَكْبَرُ", en: "Allahu Akbar", bn: "আল্লাহু আকবার", n: 34, c: "#ffab00" },
    { id: "tahlil", ar: "لَا إِلَٰهَ إِلَّا ٱللَّٰهُ", en: "La ilaha illallah", bn: "লা ইলাহা ইল্লাল্লাহ", n: 100, c: "#7c4dff" },
    { id: "istighfar", ar: "أَسْتَغْفِرُ ٱللَّٰهَ", en: "Astaghfirullah", bn: "আস্তাগফিরুল্লাহ", n: 100, c: "#ff4081" },
    { id: "salawat", ar: "ٱللَّٰهُمَّ صَلِّ عَلَىٰ مُحَمَّدٍ", en: "Salawat", bn: "দরুদ", n: 100, c: "#2979ff" },
    { id: "hawqala", ar: "لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِٱللَّٰهِ", en: "La hawla wa la quwwata illa billah", bn: "লা হাওলা ওয়ালা কুওয়াতা ইল্লা বিল্লাহ", n: 33, c: "#26a69a" }
  ];

  function data() {
    var d = X.get("zikr", null) || {};
    d.log = d.log || {}; d.custom = d.custom || []; d.goal = d.goal || 100;
    if (d.sound === undefined) d.sound = false;
    if (d.vibe === undefined) d.vibe = true;
    return d;
  }
  function save(d) {
    var keys = Object.keys(d.log).sort();
    while (keys.length > 400) delete d.log[keys.shift()];
    X.set("zikr", d);
  }
  function all(d) { return PRESETS.concat(d.custom); }
  function label(z) { return z[X.lang()] || z.en || z.name || ""; }
  function dayTotal(d, key) { var e = d.log[key] || {}; return Object.keys(e).reduce(function (s, k) { return s + (Number(e[k]) || 0); }, 0); }

  function stats() {
    var d = data(), today = X.dayKey(), week = X.lastDays(7).map(function (x) { return dayTotal(d, X.dayKey(x)); });
    var streak = 0, day = new Date();
    if (!dayTotal(d, today)) day = X.addDays(day, -1);
    while (dayTotal(d, X.dayKey(day)) > 0) { streak++; day = X.addDays(day, -1); }
    var total = Object.keys(d.log).reduce(function (s, k) { return s + dayTotal(d, k); }, 0);
    return { today: dayTotal(d, today), goal: d.goal, week: week, streak: streak, total: total };
  }

  var audioCtx = null;
  function click(strong) {
    try {
      audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
      var o = audioCtx.createOscillator(), g = audioCtx.createGain();
      o.type = "sine"; o.frequency.value = strong ? 660 : 1250;
      g.gain.setValueAtTime(0.0001, audioCtx.currentTime);
      g.gain.exponentialRampToValueAtTime(strong ? 0.22 : 0.09, audioCtx.currentTime + 0.005);
      g.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + (strong ? 0.35 : 0.05));
      o.connect(g); g.connect(audioCtx.destination); o.start(); o.stop(audioCtx.currentTime + (strong ? 0.4 : 0.06));
    } catch (e) {}
  }

  var sh = null, wake = null;
  function keepAwake() {
    try { if (navigator.wakeLock && !wake) navigator.wakeLock.request("screen").then(function (w) { wake = w; w.addEventListener("release", function () { wake = null; }); }).catch(function () {}); } catch (e) {}
  }
  function release() { try { wake && wake.release(); } catch (e) {} wake = null; }

  function open(opts) {
    if (!window.MHSSheet) return;
    if (sh && sh.dialog.open) return;
    sh = X.sheet({ id: "mhs-zikr", title: t("title"), sub: t("sub"), onClose: function () { release(); sh = null; } });
    var d = data();
    if (opts && opts.zikr) d.sel = opts.zikr;
    var cur = all(d).filter(function (z) { return z.id === d.sel; })[0] || PRESETS[0];
    var session = 0, undoStack = [];

    var body = sh.body;
    body.classList.add("mhs-zk");

    var dash = X.el("div", { class: "mhs-zk-dash" });
    var chips = X.el("div", { class: "mhs-zk-chips", role: "tablist" });
    var counter = X.el("button", { type: "button", class: "mhs-zk-tap", "aria-live": "polite" });
    var meta = X.el("div", { class: "mhs-zk-meta" });
    var ctrl = X.el("div", { class: "mhs-zk-ctrl" });
    var hist = X.el("div", { class: "mhs-zk-hist" });
    body.append(dash, chips, X.el("div", { class: "mhs-zk-stage" }, [counter, meta]), ctrl, hist);

    function drawDash() {
      var s = stats();
      dash.innerHTML =
        '<div class="mhs-zk-stat"><div class="r">' + X.ring(s.goal ? s.today / s.goal : 0, 48, 5, "hsl(var(--primary))") + "</div><div><b>" + X.esc(X.num(s.today)) + '</b><small>' + X.esc(t("today")) + " · " + X.esc(t("goal")) + " " + X.esc(X.num(s.goal)) + "</small></div></div>" +
        '<div class="mhs-zk-stat"><div><b>🔥 ' + X.esc(X.num(s.streak)) + "</b><small>" + X.esc(t("streak")) + "</small></div></div>" +
        '<div class="mhs-zk-stat wide"><div><b>' + X.esc(X.num(s.total)) + "</b><small>" + X.esc(t("total")) + "</small></div>" + X.bars(s.week, 90, 30) + "</div>";
    }
    function drawChips() {
      chips.replaceChildren();
      all(d).forEach(function (z) {
        var b = X.el("button", { type: "button", role: "tab", class: "mhs-chip" + (z.id === cur.id ? " is-on" : ""), "aria-selected": z.id === cur.id ? "true" : "false", text: label(z), on: { click: function () {
          cur = z; d.sel = z.id; session = 0; undoStack = []; save(d); drawChips(); drawCounter();
        } } });
        chips.appendChild(b);
      });
      chips.appendChild(X.el("button", { type: "button", class: "mhs-chip mhs-zk-add", text: "+ " + t("add"), on: { click: editor } }));
    }
    function drawCounter() {
      var target = cur.n || 33, inRound = session % target, round = Math.floor(session / target) + 1;
      var pct = session && inRound === 0 ? 1 : inRound / target;
      counter.style.setProperty("--zc", cur.c || "hsl(var(--primary))");
      counter.innerHTML = X.ring(pct, 260, 12, cur.c || "hsl(var(--primary))") +
        '<span class="in"><span class="ar" lang="ar" dir="rtl">' + X.esc(cur.ar || "") + '</span><b class="num">' + X.esc(X.num(session && inRound === 0 ? target : inRound)) + '</b><small>' + X.esc(t("of", { n: X.num(target) })) + "</small></span>";
      counter.setAttribute("aria-label", label(cur) + " " + (session && inRound === 0 ? target : inRound) + " / " + target);
      meta.innerHTML = "<b>" + X.esc(label(cur)) + "</b><span>" + X.esc(t("round", { n: X.num(round) })) + " · " + X.esc(t("tap")) + "</span>";
    }
    function drawCtrl() {
      ctrl.replaceChildren(
        X.el("button", { type: "button", class: "mhs-zk-btn", on: { click: function () {
          if (!undoStack.length) return;
          undoStack.pop(); session = Math.max(0, session - 1); bump(-1); drawCounter();
        } } }, [X.icon("undo"), t("undo")]),
        X.el("button", { type: "button", class: "mhs-zk-btn", on: { click: function (e) {
          var b = e.currentTarget;
          if (!b.dataset.armed) { b.dataset.armed = "1"; b.lastChild.textContent = t("resetQ"); setTimeout(function () { if (b.isConnected) { delete b.dataset.armed; b.lastChild.textContent = t("reset"); } }, 3000); return; }
          session = 0; undoStack = []; delete b.dataset.armed; b.lastChild.textContent = t("reset"); drawCounter();
        } } }, [X.icon("reset"), X.el("span", { text: t("reset") })]),
        X.el("button", { type: "button", class: "mhs-zk-btn" + (d.vibe ? " is-on" : ""), "aria-pressed": d.vibe ? "true" : "false", on: { click: function () { d.vibe = !d.vibe; save(d); drawCtrl(); } } }, [X.icon("vibrate"), t("vibe")]),
        X.el("button", { type: "button", class: "mhs-zk-btn" + (d.sound ? " is-on" : ""), "aria-pressed": d.sound ? "true" : "false", on: { click: function () { d.sound = !d.sound; save(d); drawCtrl(); } } }, [X.icon("sound"), t("sound")])
      );
    }
    function drawHist() {
      var days = Object.keys(d.log).sort().reverse().slice(0, 14);
      hist.replaceChildren(X.el("h3", { text: t("history") }));
      if (!days.length) { hist.appendChild(X.el("p", { class: "mhs-mini-msg", text: t("none") })); return; }
      var map = {}; all(d).forEach(function (z) { map[z.id] = z; });
      days.forEach(function (k) {
        var e = d.log[k], parts = Object.keys(e).filter(function (id) { return e[id] > 0; }).map(function (id) { return (map[id] ? label(map[id]) : id) + " ×" + X.num(e[id]); });
        hist.appendChild(X.el("div", { class: "mhs-zk-hrow" }, [
          X.el("b", { text: k === X.dayKey() ? t("today") : X.fmtDate(new Date(k + "T12:00:00"), { weekday: "short", day: "numeric", month: "short" }) }),
          X.el("span", { text: parts.join(" · ") }),
          X.el("em", { text: X.num(dayTotal(d, k)) })
        ]));
      });
    }
    var saveT = null;
    function bump(delta) {
      var k = X.dayKey(); d.log[k] = d.log[k] || {};
      d.log[k][cur.id] = Math.max(0, (d.log[k][cur.id] || 0) + delta);
      clearTimeout(saveT); saveT = setTimeout(function () { save(d); drawDash(); drawHist(); }, 350);
    }
    function tap() {
      keepAwake();
      session++; undoStack.push(1); if (undoStack.length > 200) undoStack.shift();
      bump(1);
      var target = cur.n || 33, complete = session % target === 0;
      if (d.vibe) X.haptic(complete ? [60, 60, 120] : 14);
      if (d.sound) click(complete);
      counter.classList.remove("is-pulse"); void counter.offsetWidth; counter.classList.add("is-pulse");
      if (complete) { counter.classList.add("is-done"); X.toast(t("done")); setTimeout(function () { counter.classList.remove("is-done"); }, 900); if (window.MHSMotion && window.MHSMotion.burst) try { window.MHSMotion.burst(counter); } catch (e) {} }
      drawCounter();
    }
    counter.addEventListener("click", tap);
    sh.dialog.addEventListener("keydown", function (e) {
      if ((e.key === " " || e.key === "Enter" || e.key === "ArrowUp") && e.target === counter) return; // native click
      if (e.key === "+" || e.key === "ArrowUp") { e.preventDefault(); tap(); }
    });

    function editor() {
      var form = { name: "", ar: "", n: 33 };
      var panel = X.el("div", { class: "mhs-zk-form", role: "dialog", "aria-label": t("addTitle") });
      var name = X.el("input", { type: "text", placeholder: t("name"), maxlength: "60", "aria-label": t("name") });
      var ar = X.el("input", { type: "text", placeholder: t("arabic"), dir: "rtl", lang: "ar", maxlength: "120", "aria-label": t("arabic") });
      var n = X.el("input", { type: "number", min: "1", max: "100000", value: "33", inputmode: "numeric", "aria-label": t("target") });
      var goal = X.el("input", { type: "number", min: "1", max: "100000", value: String(d.goal), inputmode: "numeric", "aria-label": t("goal") });
      panel.append(
        X.el("h3", { text: t("addTitle") }),
        X.el("label", null, [t("name"), name]), X.el("label", null, [t("arabic"), ar]), X.el("label", null, [t("target"), n]),
        X.el("label", null, [t("goal") + " (" + t("per") + ")", goal]),
        d.custom.length ? X.el("div", { class: "mhs-zk-custom" }, d.custom.map(function (z) {
          return X.el("button", { type: "button", class: "mhs-chip", text: "✕ " + z.name, "aria-label": t("del") + " " + z.name, on: { click: function (e) {
            var b = e.currentTarget; if (!b.dataset.armed) { b.dataset.armed = "1"; b.classList.add("is-danger"); return; }
            d.custom = d.custom.filter(function (c) { return c.id !== z.id; }); if (cur.id === z.id) cur = PRESETS[0]; save(d); b.remove(); drawChips(); drawCounter();
          } } });
        })) : null,
        X.el("div", { class: "mhs-zk-formbtns" }, [
          X.el("button", { type: "button", class: "mhs-zk-btn", text: t("cancel"), on: { click: function () { panel.remove(); } } }),
          X.el("button", { type: "button", class: "mhs-zk-btn primary", text: t("save"), on: { click: function () {
            var g = Math.max(1, Math.min(100000, parseInt(goal.value, 10) || d.goal)); d.goal = g;
            var nm = name.value.trim();
            if (nm.length >= 2) {
              var z = { id: X.uid("z"), name: nm, en: nm, bn: nm, ar: ar.value.trim(), n: Math.max(1, Math.min(100000, parseInt(n.value, 10) || 33)), c: "#00c853" };
              d.custom.push(z); cur = z; d.sel = z.id; session = 0;
            }
            save(d); panel.remove(); drawChips(); drawCounter(); drawDash();
          } } })
        ])
      );
      sh.dialog.appendChild(panel);
      setTimeout(function () { name.focus(); }, 30);
    }

    drawDash(); drawChips(); drawCounter(); drawCtrl(); drawHist();
    setTimeout(function () { counter.focus({ preventScroll: true }); }, 80);
  }

  window.MHSZikr = { open: open, stats: stats, presets: PRESETS };
  X.action({ k: "zikr", label: function () { return t("title"); }, sub: function () { return t("menuSub"); }, icon: X.ICONS.beads, c: "linear-gradient(140deg,#00e676,#00897b)", run: function () { open(); } });
})();
