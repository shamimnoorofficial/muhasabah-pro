/* Muhasabah custom widget (/widgets/?view=custom) — rendered from the configuration the Widget
 * Wizard saved in the app (data.x.widgetcfg, mirrored to localStorage "mhs:widgetcfg").
 * Items: any prayer / special time (start · end · live countdown · current/next highlight),
 * the Essential Amol checklist, streak, to-dos, a one-tap zikr counter and a daily reminder.
 * Check-ins write straight to local storage (or through the open app) and feed Home analytics. */
(function () {
  "use strict";
  if (window.MHSCustomWidget) return;
  var S = window.MHSWidgetStore, U = window.MHSWidgetUI, C = window.MHSEssentialCore;
  var $ = function (id) { return document.getElementById(id); };
  var STR = {
    en: { prayers: "Prayer times", essential: "Essential amol", streak: "Streak", todo: "To-Do", zikr: "Zikr", reminder: "Daily reminder", left: "left", in: "in", next: "Next", now: "Now", ended: "Ended", days: "days", today: "today", setLoc: "Open the app and allow location to see prayer times.", configure: "Configure", noCfg: "No widget configured yet. Open the app → Widget Wizard.", another: "Another", forbidden: "No salah now", tap: "Tap to count" },
    bn: { prayers: "নামাজের সময়", essential: "প্রয়োজনীয় আমল", streak: "ধারা", todo: "করণীয়", zikr: "জিকির", reminder: "দৈনিক স্মরণ", left: "বাকি", in: "পরে", next: "পরবর্তী", now: "এখন", ended: "শেষ", days: "দিন", today: "আজ", setLoc: "নামাজের সময় দেখতে অ্যাপ খুলে লোকেশন অনুমতি দিন।", configure: "সাজান", noCfg: "এখনো কোনো উইজেট সাজানো হয়নি। অ্যাপ → উইজেট উইজার্ড খুলুন।", another: "আরেকটি", forbidden: "এখন নামাজ নিষিদ্ধ", tap: "গুনতে চাপুন" },
    ar: { prayers: "مواقيت الصلاة", essential: "الأعمال الأساسية", streak: "السلسلة", todo: "المهام", zikr: "الذكر", reminder: "تذكير يومي", left: "متبقية", in: "بعد", next: "التالية", now: "الآن", ended: "انتهى", days: "أيام", today: "اليوم", setLoc: "افتح التطبيق واسمح بالموقع لعرض المواقيت.", configure: "تخصيص", noCfg: "لم يتم إعداد أداة بعد.", another: "آخر", forbidden: "وقت نهي", tap: "اضغط للعد" }
  };
  var lang = "en";
  function t(k) { return (STR[lang] || STR.en)[k] || STR.en[k] || k; }
  function readCfg(data) {
    var c = data && data.x && data.x.widgetcfg;
    if (!c) { try { c = JSON.parse(localStorage.getItem("mhs:widgetcfg")); } catch (e) {} }
    return c && Array.isArray(c.items) ? c : null;
  }
  var ZIKR = [{ id: "subhanallah", ar: "سُبْحَانَ ٱللَّٰهِ", en: "SubhanAllah", bn: "সুবহানাল্লাহ", n: 33 }, { id: "alhamdulillah", ar: "ٱلْحَمْدُ لِلَّٰهِ", en: "Alhamdulillah", bn: "আলহামদুলিল্লাহ", n: 33 }, { id: "allahuakbar", ar: "ٱللَّٰهُ أَكْبَرُ", en: "Allahu Akbar", bn: "আল্লাহু আকবার", n: 34 }, { id: "istighfar", ar: "أَسْتَغْفِرُ ٱللَّٰهَ", en: "Astaghfirullah", bn: "আস্তাগফিরুল্লাহ", n: 100 }, { id: "salawat", ar: "ٱللَّٰهُمَّ صَلِّ عَلَىٰ مُحَمَّدٍ", en: "Salawat", bn: "দরুদ", n: 100 }];
  var PRAYER_IDS = ["fajr", "dhuhr", "asr", "maghrib", "isha", "sehri", "iftar", "fSunrise", "fZawal", "fSunset", "tahajjud", "ishraq", "chasht", "awwabin", "witr"];
  var timer = null, root, cfg, data, reminderItem = null;

  function boot() {
    root = $("wg-custom"); root.hidden = false;
    document.querySelector(".wg").classList.add("is-custom");
    S.load().then(function (d) { data = d; draw(); });
    S.onChange(function (d) { if (d) data = d; else S.load().then(function (x) { data = x; draw(); }); draw(); });
    document.addEventListener("visibilitychange", function () { if (document.hidden) stop(); else { S.load().then(function (d) { data = d; draw(); }); } });
  }
  function stop() { clearInterval(timer); timer = null; }
  function draw() {
    stop();
    cfg = readCfg(data) || { items: PRAYER_IDS.slice(0, 5).concat(["essential", "streak"]), fields: { start: true, end: true, countdown: true, highlight: true }, size: "regular", theme: "dark", lang: "" };
    lang = cfg.lang || (data && data.lang) || lang; if (!STR[lang]) lang = "en";
    U.setLang(lang); document.documentElement.lang = lang; document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
    var theme = cfg.theme === "auto" ? (matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark") : (cfg.theme || "dark");
    document.documentElement.setAttribute("data-wtheme", theme);
    document.querySelector(".wg").classList.toggle("is-compact", cfg.size === "compact");
    root.replaceChildren();
    var items = cfg.items.slice();
    var prayerItems = items.filter(function (i) { return PRAYER_IDS.indexOf(i) >= 0; });
    var order = (cfg.order && cfg.order.length ? cfg.order : ["prayers", "essential", "streak", "todo", "zikr", "reminder"]);
    order.forEach(function (sec) {
      if (sec === "prayers" && prayerItems.length) root.appendChild(prayerCard(prayerItems));
      else if (sec === "essential" && items.indexOf("essential") >= 0) root.appendChild(essentialCard());
      else if (sec === "streak" && items.indexOf("streak") >= 0) root.appendChild(streakCard());
      else if (sec === "todo" && items.indexOf("todo") >= 0) root.appendChild(todoCard());
      else if (sec === "zikr" && items.indexOf("zikr") >= 0) root.appendChild(zikrCard());
      else if (sec === "reminder" && items.indexOf("reminder") >= 0) root.appendChild(reminderCard());
    });
    if (!root.children.length) root.appendChild(U.el("section", { class: "wg-card wg-empty", text: t("noCfg") }));
    root.appendChild(U.el("p", { class: "wg-foot" }, [U.el("a", { class: "wg-open", href: "/?open=widgets&source=widget", text: "⚙︎ " + t("configure") })]));
  }

  /* ---- prayer & special times ---- */
  function prayerCard(ids) {
    var M = window.MHSTimes, f = cfg.fields || {};
    var card = U.el("section", { class: "wg-card" }, [U.el("h2", { text: t("prayers") })]);
    if (!M || !M.hasLocation()) { card.appendChild(U.el("p", { class: "wg-empty", text: t("setLoc") })); return card; }
    var head = U.el("div", { class: "wg-pt-head" }), list = U.el("div", { class: "wg-list" }), rows = {};
    card.append(head, list);
    ids.forEach(function (id) {
      var w = M.byId(id); if (!w) return;
      var row = U.el("div", { class: "wg-pt" + (w.kind === "forbidden" ? " is-forbidden" : ""), "data-id": id }, [
        U.el("span", { class: "ic", "aria-hidden": "true", text: w.icon }), U.el("div", { class: "nm" }, [w.name, w.sub ? U.el("small", { text: w.sub }) : null]),
        U.el("div", { class: "tm" }), U.el("span", { class: "cd" })]);
      rows[id] = row; list.appendChild(row);
    });
    function tick() {
      var s = M.status(); if (!s) return; var now = s.now;
      var hl = s.forbidden ? { a: t("forbidden"), b: M.countdown(s.forbidden.end - now, true), c: s.forbidden.name } : s.active ? { a: t("now") + " · " + s.active.name, b: M.countdown(s.active.end - now, true), c: s.headline } : s.next ? { a: t("next") + " · " + s.next.name, b: M.countdown(s.next.start - now, true), c: s.headline } : { a: "", b: "—", c: "" };
      head.replaceChildren(U.el("div", null, [U.el("b", { text: hl.a }), U.el("small", { text: hl.c })]), U.el("span", { class: "wg-pt-cd", text: hl.b }));
      s.windows.forEach(function (w) {
        var row = rows[w.id]; if (!row) return;
        var tm = row.querySelector(".tm"), cd = row.querySelector(".cd");
        tm.replaceChildren.apply(tm, [f.start !== false ? U.el("span", { text: M.fmt(w.start) }) : null, f.end !== false && !w.point ? U.el("small", { text: "→ " + M.fmt(w.end) }) : null].filter(Boolean));
        var live = now >= w.start && now < w.end, past = now >= w.end;
        if (f.highlight !== false) { row.classList.toggle("is-live", live); row.classList.toggle("is-past", past && !w.point); row.classList.toggle("is-next", !!(s.next && s.next.id === w.id && !s.next.tomorrow)); }
        cd.textContent = f.countdown === false ? "" : live ? M.countdown(w.end - now) + " " + t("left") : now < w.start ? t("in") + " " + M.countdown(w.start - now) : w.point ? "" : t("ended");
      });
    }
    tick(); timer = setInterval(function () { if (!document.hidden) tick(); }, 1000);
    return card;
  }

  /* ---- essential amol checklist ---- */
  function essentialCard() {
    var card = U.el("section", { class: "wg-card wg-es" }, [U.el("h2", { text: t("essential") })]);
    if (!C) return card;
    var ed = (data && data.x && data.x.essential) || {}, list = C.listFor(ed), done = C.doneToday(ed);
    var st = C.statsFor(ed), ul = U.el("ul", { class: "wg-list" });
    card.appendChild(U.el("p", { class: "wg-foot", style: "text-align:start;margin-bottom:.4rem", text: U.num(st.today) + " / " + U.num(st.total) + " · 🔥 " + U.num(st.streak) }));
    list.slice(0, cfg.size === "compact" ? 6 : 50).forEach(function (it) {
      var on = done.indexOf(it.id) >= 0, title = C.title(it, lang);
      var li = U.el("li", { class: "wg-row" + (on ? " is-done" : "") });
      var cb = U.check(on, title, function () {
        cb.disabled = true;
        S.toggleEssential(it.id).then(function (r) {
          cb.disabled = false; if (!r.ok) return;
          if (r.data) data = r.data;
          var nowOn = !on; on = nowOn; li.classList.toggle("is-done", nowOn); cb.classList.toggle("is-done", nowOn); cb.classList.add("is-pop"); setTimeout(function () { cb.classList.remove("is-pop"); }, 400); U.haptic(nowOn ? 16 : 6);
          var e2 = (data && data.x && data.x.essential) || {}, s2 = C.statsFor(e2); card.querySelector(".wg-foot").textContent = U.num(s2.today) + " / " + U.num(s2.total) + " · 🔥 " + U.num(s2.streak);
        });
      });
      li.append(cb, U.el("span", { class: "wg-ico", text: it.icon }), U.el("div", { class: "wg-txt" }, [U.el("b", { text: title }), U.el("small", { text: (it.src || "").split("·")[0] })]));
      ul.appendChild(li);
    });
    card.appendChild(ul);
    return card;
  }

  function streakCard() {
    var card = U.el("section", { class: "wg-card" }, [U.el("h2", { text: t("streak") })]);
    var items = S.habitsToday(data || {}), done = items.filter(function (x) { return x.done; }).length;
    card.appendChild(U.el("div", { class: "wg-streak" }, [U.ring(items.length ? done / items.length : 0, 64), U.el("div", null, [U.el("b", { text: "🔥 " + U.num(S.streak(data || {})) + " " + t("days") }), U.el("small", { text: U.num(done) + " / " + U.num(items.length) + " " + t("today") + " · " + U.num(S.balance(data || {})) + " pts" })])]));
    return card;
  }
  function todoCard() {
    var card = U.el("section", { class: "wg-card" }, [U.el("h2", { text: t("todo") })]);
    var host = U.el("div"); card.appendChild(host);
    window.MHSTodoWidget.render(host, data || {}, { onChange: function (d) { if (d) data = d; }, limit: cfg.size === "compact" ? 4 : 10 });
    return card;
  }
  function zikrCard() {
    var card = U.el("section", { class: "wg-card" }, [U.el("h2", { text: t("zikr") })]);
    var z = (data && data.x && data.x.zikr) || {}, sel = ZIKR.filter(function (x) { return x.id === z.sel; })[0] || ZIKR[0];
    var d = new Date(), k = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
    function count() { var l = (data && data.x && data.x.zikr && data.x.zikr.log && data.x.zikr.log[k]) || {}; return Number(l[sel.id]) || 0; }
    var ar = U.el("div", { class: "wg-zk-ar", text: sel.ar }), tap = U.el("button", { type: "button", class: "wg-zk-tap", "aria-label": t("tap"), text: U.num(count()) });
    var chips = U.el("div", { class: "wg-zk-sel" });
    ZIKR.forEach(function (x) { chips.appendChild(U.el("button", { type: "button", class: x.id === sel.id ? "is-on" : "", text: x[lang] || x.en, on: { click: function () { sel = x; ar.textContent = x.ar; tap.textContent = U.num(count()); chips.querySelectorAll("button").forEach(function (b) { b.classList.toggle("is-on", b.textContent === (x[lang] || x.en)); }); } } })); });
    var pending = 0, flush = null;
    tap.addEventListener("click", function () {
      pending++; U.haptic(10); tap.textContent = U.num(count() + pending);
      clearTimeout(flush); flush = setTimeout(function () { var n = pending; pending = 0; S.zikrTap(sel.id, n).then(function (r) { if (r.ok && r.data) data = r.data; tap.textContent = U.num(count() + pending); }); }, 350);
    });
    card.appendChild(U.el("div", { class: "wg-zk" }, [tap, U.el("div", null, [ar, chips])]));
    return card;
  }
  function reminderCard() {
    var card = U.el("section", { class: "wg-card wg-rem" }, [U.el("h2", { text: t("reminder") })]);
    var body = U.el("div"); card.appendChild(body);
    function show(it) {
      body.replaceChildren(it.ar ? U.el("div", { class: "ar", text: it.ar }) : null, U.el("p", { text: it[lang] || it.en || it.text }), U.el("small", { text: "— " + (it.src || (it.s ? it.s + ":" + it.a : "")) }),
        U.el("div", null, [U.el("button", { type: "button", class: "nx", text: "↻ " + t("another"), on: { click: pick } })]));
    }
    var pool = null;
    function pick() {
      if (pool) { var it = pool[Math.floor(Math.random() * pool.length)]; reminderItem = it; show(it); return; }
      fetch("/data/reminders.json").then(function (r) { return r.json(); }).then(function (j) {
        pool = (j.verses || []).map(function (v) { return Object.assign({ src: "Quran " + v.s + ":" + v.a }, v); }).concat(j.hadiths || []);
        pick();
      }).catch(function () { show({ ar: "إِنَّ مَعَ الْعُسْرِ يُسْرًا", en: "Indeed, with hardship comes ease.", bn: "নিশ্চয়ই কষ্টের সাথে রয়েছে স্বস্তি।", src: "Quran 94:6" }); });
    }
    pick();
    return card;
  }
  window.MHSCustomWidget = { boot: boot };
})();
