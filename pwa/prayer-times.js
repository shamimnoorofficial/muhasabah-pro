/* MHSTimes — prayer & special-time engine built on top of the on-device calculator in prayer.js.
 *
 * Adds: Sehri/Iftar, forbidden (makruh) times, Tahajjud (last third of the night), Ishraq, Chasht
 * (Duha), Awwabin, Witr, Jumu'ah label, Islamic midnight; per-prayer manual minute adjustments,
 * 12h/24h clock, high-latitude rule, optional start-of-waqt alerts; localized formatting and
 * live countdown helpers shared by the Home strip, the Prayer hub, the widget and notifications.
 *
 * Settings live in MHSX "prayercfg" (so they ride along in backups/sync):
 *   { clock: "12"|"24", hiLat: "auto"|"middle"|"seventh"|"angle", adjust: { fajr:0, sunrise:0, dhuhr:0, asr:0, maghrib:0, isha:0 },
 *     alerts: { fajr:false, ... }, alertMin: 0, show: { sehri:true, ... } } */
(function () {
  "use strict";
  if (window.MHSTimes) return;
  var MIN = 6e4, DAY = 864e5;
  var FARD = ["fajr", "dhuhr", "asr", "maghrib", "isha"];
  var ALL = ["fajr", "sunrise", "dhuhr", "asr", "maghrib", "isha"];

  var NAMES = {
    en: { fajr: "Fajr", sunrise: "Sunrise", dhuhr: "Dhuhr", jumuah: "Jumu'ah", asr: "Asr", maghrib: "Maghrib", isha: "Isha", sehri: "Sehri ends", iftar: "Iftar", tahajjud: "Tahajjud", ishraq: "Ishraq", chasht: "Chasht (Duha)", awwabin: "Awwabin", witr: "Witr", midnight: "Islamic midnight",
      fSunrise: "Sunrise (forbidden)", fZawal: "Zawal (forbidden)", fSunset: "Sunset (forbidden)", lastThird: "Last third of night",
      startsIn: "{p} starts in {t}", endsIn: "{p} ends in {t}", now: "Now", next: "Next", start: "Start", end: "End", left: "left", ended: "Ended", forbidden: "No salah now", min: "min", h: "h", m: "m", s: "s", at: "at", today: "Today", tomorrow: "Tomorrow",
      kFard: "Obligatory", kSpecial: "Sehri & Iftar", kForbidden: "Forbidden times", kNafl: "Nafl & optional", approx: "Approximate window — scholars differ slightly." },
    bn: { fajr: "ফজর", sunrise: "সূর্যোদয়", dhuhr: "যোহর", jumuah: "জুমা", asr: "আসর", maghrib: "মাগরিব", isha: "এশা", sehri: "সেহরি শেষ", iftar: "ইফতার", tahajjud: "তাহাজ্জুদ", ishraq: "ইশরাক", chasht: "চাশত (দুহা)", awwabin: "আউয়াবিন", witr: "বিতর", midnight: "ইসলামি মধ্যরাত",
      fSunrise: "সূর্যোদয় (নিষিদ্ধ)", fZawal: "জাওয়াল (নিষিদ্ধ)", fSunset: "সূর্যাস্ত (নিষিদ্ধ)", lastThird: "রাতের শেষ তৃতীয়াংশ",
      startsIn: "{p} শুরু হবে {t} পরে", endsIn: "{p} শেষ হবে {t} পরে", now: "এখন", next: "পরবর্তী", start: "শুরু", end: "শেষ", left: "বাকি", ended: "শেষ হয়েছে", forbidden: "এখন নামাজ নিষিদ্ধ", min: "মিনিট", h: "ঘ", m: "মি", s: "সে", at: "সময়", today: "আজ", tomorrow: "আগামীকাল",
      kFard: "ফরজ নামাজ", kSpecial: "সেহরি ও ইফতার", kForbidden: "নিষিদ্ধ সময়", kNafl: "নফল ও ঐচ্ছিক", approx: "আনুমানিক সময় — আলেমদের মতে সামান্য পার্থক্য আছে।" },
    ar: { fajr: "الفجر", sunrise: "الشروق", dhuhr: "الظهر", jumuah: "الجمعة", asr: "العصر", maghrib: "المغرب", isha: "العشاء", sehri: "انتهاء السحور", iftar: "الإفطار", tahajjud: "التهجد", ishraq: "الإشراق", chasht: "الضحى", awwabin: "الأوابين", witr: "الوتر", midnight: "منتصف الليل الشرعي",
      fSunrise: "الشروق (نهي)", fZawal: "الزوال (نهي)", fSunset: "الغروب (نهي)", lastThird: "الثلث الأخير من الليل",
      startsIn: "{p} بعد {t}", endsIn: "ينتهي {p} بعد {t}", now: "الآن", next: "التالية", start: "البداية", end: "النهاية", left: "متبقية", ended: "انتهى", forbidden: "وقت نهي عن الصلاة", min: "د", h: "س", m: "د", s: "ث", at: "في", today: "اليوم", tomorrow: "غداً",
      kFard: "الفرائض", kSpecial: "السحور والإفطار", kForbidden: "أوقات النهي", kNafl: "النوافل", approx: "وقت تقريبي — يختلف العلماء قليلاً." }
  };
  function lang() {
    var l = (window.MHSLocale || document.documentElement.lang || "en").split("-")[0];
    if (window.MHSI18n && window.MHSI18n.base) l = window.MHSI18n.base(l);
    return NAMES[l] ? l : "en";
  }
  function t(k, vars) {
    var s = (NAMES[lang()] || NAMES.en)[k]; if (s == null) s = NAMES.en[k] || k;
    if (vars) Object.keys(vars).forEach(function (v) { s = s.split("{" + v + "}").join(vars[v]); });
    return s;
  }
  function num(n) { try { return window.MHSX ? window.MHSX.num(n) : String(n); } catch (e) { return String(n); } }

  /* ---- settings ---- */
  var DEF = { clock: "12", hiLat: "auto", adjust: {}, alerts: {}, alertMin: 0, show: {} };
  function cfg() {
    var c = null;
    try {
      if (window.MHSX) c = window.MHSX.get("prayercfg", null);
      else { var d = JSON.parse(localStorage.getItem("muhasabah:data:v1") || "null"); c = (d && d.x && d.x.prayercfg) || JSON.parse(localStorage.getItem("mhs:x:prayercfg") || "null"); }
    } catch (e) {}
    c = Object.assign({}, DEF, c || {});
    c.adjust = c.adjust || {}; c.alerts = c.alerts || {}; c.show = c.show || {};
    return c;
  }
  function setCfg(patch) {
    var c = Object.assign({}, cfg(), patch || {});
    if (window.MHSX) window.MHSX.set("prayercfg", c); else try { localStorage.setItem("mhs:x:prayercfg", JSON.stringify(c)); } catch (e) {}
    try { window.dispatchEvent(new CustomEvent("mhs-prayer-change")); } catch (e) {}
    return c;
  }
  /* Base location/method settings are owned by prayer.js (localStorage "muhasabah:prayer"). */
  function base() { return window.MHSPrayer && window.MHSPrayer.config ? window.MHSPrayer.config() : null; }
  function setBase(patch) {
    var a = {};
    try { a = JSON.parse(localStorage.getItem("muhasabah:prayer")) || {}; } catch (e) {}
    Object.assign(a, patch);
    try { localStorage.setItem("muhasabah:prayer", JSON.stringify(a)); } catch (e) {}
    try { window.dispatchEvent(new CustomEvent("mhs-prayer-change")); } catch (e) {}
  }
  function hasLocation() { var b = base(); return !!(b && b.lat !== null && b.lng !== null); }

  /* ---- raw day times with adjustments + high-latitude rule ---- */
  var cache = {};
  function dayKey(d) { return d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate(); }
  function raw(date) {
    if (!window.MHSPrayer || !window.MHSPrayer.day) return null;
    var d = date ? new Date(date) : new Date();
    var c = cfg(), b = base();
    var key = dayKey(d) + "|" + JSON.stringify(c.adjust) + c.hiLat + "|" + (b ? b.lat + "," + b.lng + b.method + b.asr : "");
    if (cache[key]) return cache[key];
    var r = window.MHSPrayer.day(d);
    if (!r) return null;
    r = Object.assign({}, r);
    // high-latitude rule: fallback for Fajr/Isha when the sun never reaches the angle
    var night = (r.sunrise + DAY) - r.sunset;
    if (c.hiLat === "middle") { r.fajr = r.sunrise - night / 2; r.isha = r.sunset + night / 2; }
    else if (c.hiLat === "seventh") { r.fajr = r.sunrise - night / 7; r.isha = r.sunset + night / 7; }
    else if (c.hiLat === "angle") { var frac = 18 / 60; r.fajr = r.sunrise - night * frac; r.isha = r.sunset + night * frac; }
    ALL.forEach(function (k) { var a = Number(c.adjust[k]) || 0; if (a) r[k] += a * MIN; });
    r.maghrib = r.sunset;
    r.midnight = r.sunset + ((r.fajr + DAY) - r.sunset) / 2;
    r.ishaEnd = r.midnight;
    r.date = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
    var keys = Object.keys(cache); if (keys.length > 30) cache = {};
    cache[key] = r;
    return r;
  }
  window.addEventListener("mhs-prayer-change", function () { cache = {}; });

  /* ---- windows ----
   * Each: { id, kind: fard|special|forbidden|nafl, start, end, name, icon, approx } for the civil day of `date`,
   * with night windows (tahajjud/witr/sehri) spanning into the following morning. */
  function windows(date) {
    var r = raw(date); if (!r) return [];
    var d = new Date(r.date), nextDay = raw(r.date + DAY) || {};
    var nextFajr = nextDay.fajr || (r.fajr + DAY);
    var night = nextFajr - r.sunset;
    var isFri = d.getDay() === 5;
    var qd = r.dhuhr - r.sunrise, duhaStart = r.sunrise + Math.max(15, Math.round(qd / MIN / 4)) * MIN;
    var w = [
      { id: "sehri", kind: "special", start: r.fajr, end: r.fajr, icon: "🌙", name: t("sehri"), point: true },
      { id: "fajr", kind: "fard", start: r.fajr, end: r.sunrise, icon: "🌅", name: t("fajr") },
      { id: "fSunrise", kind: "forbidden", start: r.sunrise, end: r.sunrise + 15 * MIN, icon: "⛔", name: t("fSunrise") },
      { id: "ishraq", kind: "nafl", start: r.sunrise + 15 * MIN, end: duhaStart, icon: "☀️", name: t("ishraq"), approx: true },
      { id: "chasht", kind: "nafl", start: duhaStart, end: r.dhuhr - 7 * MIN, icon: "🌤️", name: t("chasht"), approx: true },
      { id: "fZawal", kind: "forbidden", start: r.dhuhr - 7 * MIN, end: r.dhuhr, icon: "⛔", name: t("fZawal") },
      { id: "dhuhr", kind: "fard", start: r.dhuhr, end: r.asr, icon: "🕛", name: isFri ? t("jumuah") : t("dhuhr") },
      { id: "asr", kind: "fard", start: r.asr, end: r.sunset - 15 * MIN, icon: "🌇", name: t("asr"), softEnd: r.sunset },
      { id: "fSunset", kind: "forbidden", start: r.sunset - 15 * MIN, end: r.sunset, icon: "⛔", name: t("fSunset") },
      { id: "iftar", kind: "special", start: r.sunset, end: r.sunset, icon: "🍽️", name: t("iftar"), point: true },
      { id: "maghrib", kind: "fard", start: r.maghrib, end: r.isha, icon: "🌆", name: t("maghrib") },
      { id: "awwabin", kind: "nafl", start: r.maghrib + 10 * MIN, end: r.isha, icon: "🕯️", name: t("awwabin"), approx: true },
      { id: "isha", kind: "fard", start: r.isha, end: r.midnight, icon: "🌃", name: t("isha"), softEnd: nextFajr },
      { id: "witr", kind: "nafl", start: r.isha, end: nextFajr, icon: "🔹", name: t("witr") },
      { id: "midnight", kind: "special", start: r.midnight, end: r.midnight, icon: "🕛", name: t("midnight"), point: true, quiet: true },
      { id: "tahajjud", kind: "nafl", start: r.sunset + night * 2 / 3, end: nextFajr, icon: "✨", name: t("tahajjud"), sub: t("lastThird") }
    ];
    return w;
  }
  function byId(id, date) { return windows(date).filter(function (x) { return x.id === id; })[0] || null; }

  /* Status at `now`: the active fard, the next fard (today or tomorrow), active forbidden window. */
  function status(now) {
    now = now || Date.now();
    var r = raw(now); if (!r) return null;
    var w = windows(now), tomorrow = windows(r.date + DAY);
    var fard = w.filter(function (x) { return x.kind === "fard"; });
    var active = null, next = null, forbidden = null;
    fard.forEach(function (x) { if (now >= x.start && now < (x.softEnd || x.end)) active = x; });
    fard.forEach(function (x) { if (!next && now < x.start) next = x; });
    if (!next) next = tomorrow.filter(function (x) { return x.kind === "fard"; })[0];
    if (next) next = Object.assign({}, next, { tomorrow: next.start > r.date + DAY });
    w.filter(function (x) { return x.kind === "forbidden"; }).forEach(function (x) { if (now >= x.start && now < x.end) forbidden = x; });
    // Isha "active" continues until next Fajr for display; but midnight is the preferred end.
    var inIsha = !active && now >= r.isha && now < (tomorrow[1] ? tomorrow[1].start : r.fajr + DAY);
    if (inIsha) active = fard[4];
    var current = active || null;
    var headline = "";
    if (forbidden) headline = t("forbidden") + " · " + t("endsIn", { p: forbidden.name, t: countdown(forbidden.end - now) });
    else if (current && next && (next.start - now) < (current.end - now)) headline = t("startsIn", { p: next.name, t: countdown(next.start - now) });
    else if (current) headline = t("endsIn", { p: current.name, t: countdown(current.end - now) });
    else if (next) headline = t("startsIn", { p: next.name, t: countdown(next.start - now) });
    return { now: now, raw: r, windows: w, fard: fard, active: current, next: next, forbidden: forbidden, headline: headline };
  }

  /* ---- formatting ---- */
  var ARABIC_DIGITS = "٠١٢٣٤٥٦٧٨٩", BENGALI_DIGITS = "০১২৩৪৫৬৭৮৯";
  function digits(s) {
    var l = lang();
    if (l === "bn") return String(s).replace(/\d/g, function (d) { return BENGALI_DIGITS[d]; });
    if (l === "ar") return String(s).replace(/\d/g, function (d) { return ARABIC_DIGITS[d]; });
    return String(s);
  }
  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function fmt(ts, opts) {
    if (ts == null || isNaN(ts)) return "—";
    var d = new Date(ts), h = d.getHours(), m = d.getMinutes(), c = cfg();
    if (c.clock === "24") return digits(pad(h) + ":" + pad(m));
    var ap = h >= 12 ? (lang() === "bn" ? "" : lang() === "ar" ? "م" : "PM") : (lang() === "bn" ? "" : lang() === "ar" ? "ص" : "AM");
    var hh = h % 12 || 12;
    var s = digits(hh + ":" + pad(m));
    if (lang() === "bn") s = bnPeriod(h) + " " + s;
    else if (!(opts && opts.noAmPm)) s += " " + ap;
    return s;
  }
  function bnPeriod(h) { return h < 4 ? "রাত" : h < 6 ? "ভোর" : h < 12 ? "সকাল" : h < 15 ? "দুপুর" : h < 18 ? "বিকাল" : h < 20 ? "সন্ধ্যা" : "রাত"; }
  function countdown(ms, withSec) {
    if (ms == null || isNaN(ms)) return "—";
    ms = Math.max(0, ms);
    var s = Math.floor(ms / 1000), h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
    if (h >= 1) return digits(h) + t("h") + " " + digits(m) + t("m");
    if (withSec) return digits(m) + ":" + digits(pad(sec));
    if (m >= 1) return digits(m) + " " + t("min");
    return digits(sec) + " " + t("s");
  }
  function minutesLeft(ms) { return Math.max(0, Math.ceil(ms / MIN)); }

  /* ---- alerts (start-of-waqt notifications while the app runs) ---- */
  var timer = null;
  function scheduleAlerts() {
    clearTimeout(timer);
    var c = cfg(); if (!("Notification" in window) || Notification.permission !== "granted") return;
    var on = Object.keys(c.alerts).filter(function (k) { return c.alerts[k]; });
    if (!on.length) return;
    var now = Date.now(), lead = (Number(c.alertMin) || 0) * MIN, upcoming = [];
    [windows(now), windows(now + DAY)].forEach(function (list) { list.forEach(function (w) { if (on.indexOf(w.id) >= 0 && w.start - lead > now) upcoming.push({ w: w, at: w.start - lead }); }); });
    upcoming.sort(function (a, b) { return a.at - b.at; });
    var nx = upcoming[0]; if (!nx) return;
    timer = setTimeout(function () {
      try {
        var body = lead ? t("startsIn", { p: nx.w.name, t: countdown(lead) }) : t("start") + " · " + fmt(nx.w.start);
        var opts = { body: body, icon: "/icons/icon-192.png", badge: "/icons/icon-96.png", tag: "mhs-waqt-" + nx.w.id, data: { url: "/?open=prayer" } };
        if (navigator.serviceWorker && navigator.serviceWorker.ready) navigator.serviceWorker.ready.then(function (r) { return r.showNotification(nx.w.icon + " " + nx.w.name, opts); }).catch(function () { new Notification(nx.w.icon + " " + nx.w.name, opts); });
        else new Notification(nx.w.icon + " " + nx.w.name, opts);
      } catch (e) {}
      setTimeout(scheduleAlerts, 1500);
    }, Math.min(nx.at - now + 50, 2147000000));
    // mirror to the service worker so periodic sync can deliver when the page is closed
    try {
      if ("caches" in window) caches.open("mhs-state").then(function (ca) {
        return ca.put("/__state/waqt", new Response(JSON.stringify({ on: true, items: upcoming.slice(0, 12).map(function (u) { return { id: u.w.id, title: u.w.icon + " " + u.w.name, at: u.at, start: u.w.start, hm: fmt(u.w.start) }; }) }), { headers: { "Content-Type": "application/json" } }));
      }).catch(function () {});
    } catch (e) {}
  }
  window.addEventListener("mhs-prayer-change", function () { setTimeout(scheduleAlerts, 100); });
  document.addEventListener("visibilitychange", function () { if (!document.hidden) scheduleAlerts(); });
  setTimeout(scheduleAlerts, 1500);

  /* Items available to the widget wizard and the strip. */
  function catalog() {
    return [
      { id: "fajr", k: "kFard" }, { id: "dhuhr", k: "kFard" }, { id: "asr", k: "kFard" }, { id: "maghrib", k: "kFard" }, { id: "isha", k: "kFard" },
      { id: "sehri", k: "kSpecial" }, { id: "iftar", k: "kSpecial" },
      { id: "fSunrise", k: "kForbidden" }, { id: "fZawal", k: "kForbidden" }, { id: "fSunset", k: "kForbidden" },
      { id: "tahajjud", k: "kNafl" }, { id: "ishraq", k: "kNafl" }, { id: "chasht", k: "kNafl" }, { id: "awwabin", k: "kNafl" }, { id: "witr", k: "kNafl" }
    ].map(function (x) { var w = byId(x.id); return { id: x.id, group: t(x.k), name: w ? w.name : t(x.id), icon: w ? w.icon : "" }; });
  }

  window.MHSTimes = { t: t, lang: lang, cfg: cfg, setCfg: setCfg, base: base, setBase: setBase, hasLocation: hasLocation, raw: raw, windows: windows, byId: byId, status: status, fmt: fmt, countdown: countdown, minutesLeft: minutesLeft, digits: digits, catalog: catalog, FARD: FARD, scheduleAlerts: scheduleAlerts };
})();
