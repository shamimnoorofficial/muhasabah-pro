/* MHSPrayerHub 🕌 — the Jainamaz-icon hub: Times · Qibla · Mosques · Essential Amol, plus prayer
 * settings (method, Asr madhab, high-latitude rule, per-prayer adjustments, 12h/24h, alerts,
 * location with manual override and offline fallback to the last known location). */
(function () {
  "use strict";
  if (window.MHSPrayerHub) return;
  var X = window.MHSX, MIN = 6e4;
  var T = function () { return window.MHSTimes; };
  var t = X.tr({
    en: { title: "Prayer & Qibla", sub: "Times · Qibla · Mosques · Essential Amol", times: "Times", qibla: "Qibla", mosques: "Mosques", amol: "Amol", settings: "Prayer settings", back: "Back",
      start: "Start", end: "End", now: "Now", next: "Next", left: "left", in: "in", ended: "Ended", point: "At", today: "Today", tomorrow: "Tomorrow", noLoc: "Allow location (or pick a city) to see exact times and the Qibla for where you are.", allow: "Use my location", locating: "Finding your location…", denied: "Location is blocked. Allow it in your phone settings or set a city below.",
      fromN: "from north", km: "km to Makkah", aligned: "You're facing the Qibla ✓", turn: "Turn {d}° {dir}", left2: "left", right: "right", compassOff: "Start compass", compassNo: "No compass sensor here. Use the bearing with a physical compass or a map.", compassHint: "Hold the phone flat and move it in a figure of 8 to calibrate.", calibrating: "Calibrating…",
      mapBtn: "Show mosques on map", mapHint: "Loads Google Maps (internet needed).", openMaps: "Open in Google Maps", directions: "Directions", loc: "Location", place: "Place", lat: "Latitude", lng: "Longitude", apply: "Apply", city: "Pick a city", method: "Calculation method", asr: "Asr (juristic)", hanafi: "Hanafi (later)", standard: "Shafi'i / Maliki / Hanbali", hiLat: "High-latitude rule", auto: "Automatic", middle: "Middle of the night", seventh: "One-seventh of the night", angle: "Angle-based", clock: "Clock", h12: "12-hour", h24: "24-hour",
      adjust: "Manual adjustments (minutes)", alerts: "Alerts at the start of waqt", alertLead: "Notify before (min)", alertsNeed: "Allow notifications to get waqt alerts.", enableNotif: "Allow notifications", offlineNote: "Times are calculated on this device from your saved location — no internet needed.", lastKnown: "Using last known location", src: { gps: "Device location", city: "City", tz: "From time zone", manual: "Manual" }, saved: "Saved", approx: "Approximate" },
    bn: { title: "নামাজ ও কিবলা", sub: "সময় · কিবলা · মসজিদ · প্রয়োজনীয় আমল", times: "সময়", qibla: "কিবলা", mosques: "মসজিদ", amol: "আমল", settings: "নামাজের সেটিংস", back: "পেছনে",
      start: "শুরু", end: "শেষ", now: "এখন", next: "পরবর্তী", left: "বাকি", in: "পরে", ended: "শেষ", point: "সময়", today: "আজ", tomorrow: "আগামীকাল", noLoc: "সঠিক সময় ও কিবলা দেখতে লোকেশন অনুমতি দিন (অথবা একটি শহর বেছে নিন)।", allow: "আমার লোকেশন ব্যবহার করুন", locating: "লোকেশন খোঁজা হচ্ছে…", denied: "লোকেশন বন্ধ আছে। ফোনের সেটিংসে অনুমতি দিন বা নিচে শহর বেছে নিন।",
      fromN: "উত্তর থেকে", km: "কিমি মক্কা পর্যন্ত", aligned: "আপনি কিবলামুখী আছেন ✓", turn: "{d}° {dir} ঘুরুন", left2: "বামে", right: "ডানে", compassOff: "কম্পাস চালু করুন", compassNo: "এই ডিভাইসে কম্পাস সেন্সর নেই। কোণটি কম্পাস বা মানচিত্রে ব্যবহার করুন।", compassHint: "ফোন সমতল রেখে ৮-এর মতো ঘুরিয়ে ক্যালিব্রেট করুন।", calibrating: "ক্যালিব্রেট হচ্ছে…",
      mapBtn: "মানচিত্রে মসজিদ দেখান", mapHint: "Google Maps লোড হবে (ইন্টারনেট লাগবে)।", openMaps: "Google Maps-এ খুলুন", directions: "দিকনির্দেশ", loc: "লোকেশন", place: "স্থান", lat: "অক্ষাংশ", lng: "দ্রাঘিমাংশ", apply: "প্রয়োগ", city: "শহর বেছে নিন", method: "হিসাবের পদ্ধতি", asr: "আসর (মাযহাব)", hanafi: "হানাফি (পরে)", standard: "শাফেয়ি / মালিকি / হাম্বলি", hiLat: "উচ্চ অক্ষাংশ নিয়ম", auto: "স্বয়ংক্রিয়", middle: "রাতের মধ্যভাগ", seventh: "রাতের এক-সপ্তমাংশ", angle: "কোণভিত্তিক", clock: "ঘড়ি", h12: "১২ ঘণ্টা", h24: "২৪ ঘণ্টা",
      adjust: "ম্যানুয়াল সমন্বয় (মিনিট)", alerts: "ওয়াক্ত শুরুর অ্যালার্ট", alertLead: "কত মিনিট আগে", alertsNeed: "ওয়াক্ত অ্যালার্ট পেতে নোটিফিকেশন অনুমতি দিন।", enableNotif: "নোটিফিকেশন অনুমতি", offlineNote: "সংরক্ষিত লোকেশন থেকে এই ডিভাইসেই সময় হিসাব হয় — ইন্টারনেট লাগে না।", lastKnown: "সর্বশেষ জানা লোকেশন ব্যবহার হচ্ছে", src: { gps: "ডিভাইস লোকেশন", city: "শহর", tz: "টাইম জোন থেকে", manual: "ম্যানুয়াল" }, saved: "সংরক্ষিত", approx: "আনুমানিক" },
    ar: { title: "الصلاة والقبلة", sub: "المواقيت · القبلة · المساجد · الأعمال", times: "المواقيت", qibla: "القبلة", mosques: "المساجد", amol: "الأعمال", settings: "إعدادات الصلاة", back: "رجوع",
      start: "البداية", end: "النهاية", now: "الآن", next: "التالية", left: "متبقية", in: "بعد", ended: "انتهى", point: "في", today: "اليوم", tomorrow: "غداً", noLoc: "اسمح بالموقع (أو اختر مدينة) لعرض المواقيت الدقيقة والقبلة.", allow: "استخدم موقعي", locating: "جارٍ تحديد موقعك…", denied: "الموقع محظور. اسمح به من إعدادات الهاتف أو اختر مدينة.",
      fromN: "من الشمال", km: "كم إلى مكة", aligned: "أنت تواجه القبلة ✓", turn: "در {d}° إلى {dir}", left2: "اليسار", right: "اليمين", compassOff: "تشغيل البوصلة", compassNo: "لا يوجد مستشعر بوصلة. استخدم الزاوية مع بوصلة أو خريطة.", compassHint: "أمسك الهاتف أفقياً وحرّكه على شكل 8 للمعايرة.", calibrating: "جارٍ المعايرة…",
      mapBtn: "عرض المساجد على الخريطة", mapHint: "يتم تحميل خرائط Google (يلزم الإنترنت).", openMaps: "افتح في خرائط Google", directions: "الاتجاهات", loc: "الموقع", place: "المكان", lat: "خط العرض", lng: "خط الطول", apply: "تطبيق", city: "اختر مدينة", method: "طريقة الحساب", asr: "العصر (المذهب)", hanafi: "حنفي", standard: "شافعي / مالكي / حنبلي", hiLat: "قاعدة خطوط العرض العليا", auto: "تلقائي", middle: "منتصف الليل", seventh: "سُبع الليل", angle: "بالزاوية", clock: "الساعة", h12: "١٢ ساعة", h24: "٢٤ ساعة",
      adjust: "تعديلات يدوية (دقائق)", alerts: "تنبيه عند دخول الوقت", alertLead: "قبل بـ (دقيقة)", alertsNeed: "اسمح بالإشعارات لتلقي التنبيهات.", enableNotif: "السماح بالإشعارات", offlineNote: "تُحسب المواقيت على هذا الجهاز من موقعك المحفوظ — دون إنترنت.", lastKnown: "يُستخدم آخر موقع معروف", src: { gps: "موقع الجهاز", city: "مدينة", tz: "من المنطقة الزمنية", manual: "يدوي" }, saved: "تم الحفظ", approx: "تقريبي" }
  });
  var METHODS = { karachi: "Karachi (Univ. of Islamic Sciences)", mwl: "Muslim World League", isna: "ISNA (North America)", egypt: "Egyptian Authority", makkah: "Umm al-Qura (Makkah)" };
  var CITIES = [["Dhaka", 23.8103, 90.4125], ["Chattogram", 22.3569, 91.7832], ["Sylhet", 24.8949, 91.8687], ["Rajshahi", 24.3745, 88.6042], ["Khulna", 22.8456, 89.5403], ["Barishal", 22.701, 90.3535], ["Rangpur", 25.7439, 89.2752], ["Mymensingh", 24.7471, 90.4203], ["Cumilla", 23.4607, 91.1809], ["Cox's Bazar", 21.4272, 92.0058], ["Kolkata", 22.5726, 88.3639], ["Delhi", 28.6139, 77.209], ["Mumbai", 19.076, 72.8777], ["Karachi", 24.8607, 67.0011], ["Lahore", 31.5204, 74.3587], ["Makkah", 21.3891, 39.8579], ["Madinah", 24.5247, 39.5692], ["Riyadh", 24.7136, 46.6753], ["Jeddah", 21.4858, 39.1925], ["Dubai", 25.2048, 55.2708], ["Doha", 25.2854, 51.531], ["Kuwait City", 29.3759, 47.9774], ["Muscat", 23.588, 58.3829], ["Kuala Lumpur", 3.139, 101.6869], ["Singapore", 1.3521, 103.8198], ["Jakarta", -6.2088, 106.8456], ["Istanbul", 41.0082, 28.9784], ["Cairo", 30.0444, 31.2357], ["London", 51.5074, -0.1278], ["Birmingham", 52.4862, -1.8904], ["Paris", 48.8566, 2.3522], ["Berlin", 52.52, 13.405], ["Rome", 41.9028, 12.4964], ["New York", 40.7128, -74.006], ["Toronto", 43.6532, -79.3832], ["Chicago", 41.8781, -87.6298], ["Sydney", -33.8688, 151.2093], ["Tokyo", 35.6762, 139.6503]];

  var sh = null, tab = "times", view = "tabs", iv = null, compass = null;
  function open(opts) {
    if (!window.MHSSheet) return;
    if (opts && opts.tab) { if (opts.tab === "settings") { view = "settings"; } else { tab = opts.tab; view = "tabs"; } }
    if (sh && sh.dialog.open) { render(); return; }
    sh = X.sheet({ id: "mhs-prayerhub", title: t("title"), sub: t("sub"), onClose: function () { stop(); sh = null; view = "tabs"; } });
    sh.body.classList.add("mhs-ph");
    render();
  }
  function stop() { clearInterval(iv); iv = null; if (compass) { compass.stop(); compass = null; } }
  function render() {
    if (!sh) return;
    stop();
    var b = sh.body; b.replaceChildren(); sh.tools.replaceChildren();
    if (view === "settings") { sh.setTitle(t("settings"), t("offlineNote")); sh.showBack(true); sh.onBack = function () { view = "tabs"; render(); return true; }; renderSettings(b); return; }
    sh.setTitle(t("title"), t("sub")); sh.showBack(false); sh.onBack = null;
    sh.tools.appendChild(X.el("button", { type: "button", class: "mhs-mini-ib", "aria-label": t("settings"), title: t("settings"), on: { click: function () { view = "settings"; render(); } } }, [sh.icon("M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z|M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z")]));
    var tabs = X.el("div", { class: "mhs-ph-tabs", role: "tablist" });
    [["times", "🕐", "times"], ["qibla", "🧭", "qibla"], ["mosques", "🕌", "mosques"], ["amol", "📿", "amol"]].forEach(function (p) {
      tabs.appendChild(X.el("button", { type: "button", role: "tab", "aria-selected": tab === p[0] ? "true" : "false", class: "mhs-ph-tab" + (tab === p[0] ? " is-on" : ""), on: { click: function () { tab = p[0]; render(); b.scrollTop = 0; } } }, [X.el("span", { class: "ic", "aria-hidden": "true", text: p[1] }), t(p[2])]));
    });
    b.appendChild(tabs);
    var M = T();
    if (!M || !M.hasLocation()) {
      if (tab !== "amol") { b.appendChild(locationCta(b)); if (tab === "times") return; }
    }
    if (tab === "times") renderTimes(b);
    else if (tab === "qibla") renderQibla(b);
    else if (tab === "mosques") renderMosques(b);
    else X.whenReady("MHSEssential", function (E) { var host = X.el("div", { class: "mhs-es" }); b.appendChild(host); E.render(host); });
  }

  function locationCta(b) {
    var msg = X.el("p", { class: "mhs-mini-note", role: "status" });
    var card = X.el("div", { class: "mhs-ph-card" }, [X.el("h3", { text: "📍 " + t("loc") }), X.el("p", { class: "mhs-mini-note", text: t("noLoc") }), X.el("div", { class: "mhs-actions" }, [
      X.el("button", { type: "button", class: "mhs-btn primary", text: t("allow"), on: { click: function (e) {
        e.currentTarget.disabled = true; msg.textContent = t("locating");
        var P = window.MHSPrayer; (P && P.enableLocation ? P.enableLocation() : Promise.resolve("unsupported")).then(function (r) { if (r === "granted" || T().hasLocation()) render(); else { e.target.disabled = false; msg.textContent = t("denied"); } });
      } } }),
      citySelect(function () { render(); })
    ]), msg]);
    return card;
  }
  function citySelect(onPick) {
    var sel = X.el("select", { class: "mhs-select", "aria-label": t("city") }, [X.el("option", { value: "", text: t("city") })].concat(CITIES.map(function (c, i) { return X.el("option", { value: String(i), text: c[0] }); })));
    sel.addEventListener("change", function () { if (sel.value === "") return; var c = CITIES[+sel.value]; T().setBase({ lat: c[1], lng: c[2], place: c[0], src: "city", at: Date.now(), on: true }); onPick && onPick(); });
    return sel;
  }

  /* ---- Tab A: times ---- */
  function renderTimes(b) {
    var M = T(), base = M.base();
    var hero = X.el("div", { class: "mhs-ph-hero" });
    var list = X.el("div", { class: "mhs-ph-list" });
    b.append(hero, X.el("p", { class: "mhs-mini-note mhs-ph-locline" }, ["📍 " + (base.place || "") + " · " + (t("src")[base.src] || t("src").manual) + (navigator.onLine ? "" : " · " + t("lastKnown"))]), list);
    var groups = [["fard", "kFard", "🕌"], ["special", "kSpecial", "🌙"], ["forbidden", "kForbidden", "⛔"], ["nafl", "kNafl", "✨"]];
    var rows = {};
    groups.forEach(function (g) {
      var sec = X.el("section", { class: "mhs-ph-sec mhs-ph-" + g[0] }, [X.el("h3", { class: "mhs-mini-sec", text: g[2] + " " + M.t(g[1]) })]);
      M.windows().filter(function (w) { return w.kind === g[0] && !w.quiet; }).forEach(function (w) {
        var row = X.el("div", { class: "mhs-ph-row", "data-id": w.id }, [
          X.el("span", { class: "ic", "aria-hidden": "true", text: w.icon }),
          X.el("div", { class: "nm" }, [X.el("b", { text: w.name }), w.sub ? X.el("small", { text: w.sub }) : null, w.approx ? X.el("small", { text: t("approx") }) : null]),
          X.el("div", { class: "tm" }, [X.el("span", { class: "num s" }), X.el("span", { class: "num e" })]),
          X.el("span", { class: "num cd" })
        ]);
        rows[w.id] = row; sec.appendChild(row);
      });
      list.appendChild(sec);
    });
    b.appendChild(X.el("p", { class: "mhs-mini-note", text: M.t("approx") + " " + t("offlineNote") }));
    function tick() {
      var s = M.status(); if (!s) return;
      var now = s.now;
      hero.replaceChildren(
        X.el("div", { class: "mhs-ph-hero-now" }, [
          X.el("small", { text: s.forbidden ? M.t("forbidden") : s.active ? t("now") + " · " + s.active.name : t("next") + " · " + (s.next ? s.next.name : "") }),
          X.el("b", { class: "num", text: s.forbidden ? M.countdown(s.forbidden.end - now, true) : s.active ? M.countdown(s.active.end - now, true) : s.next ? M.countdown(s.next.start - now, true) : "—" }),
          X.el("span", { text: s.headline })
        ]),
        X.el("div", { class: "mhs-ph-hero-next" }, s.next ? [X.el("small", { text: t("next") + (s.next.tomorrow ? " · " + t("tomorrow") : "") }), X.el("b", { text: s.next.icon + " " + s.next.name }), X.el("span", { class: "num", text: M.fmt(s.next.start) })] : [])
      );
      s.windows.forEach(function (w) {
        var row = rows[w.id]; if (!row) return;
        var sEl = row.querySelector(".s"), eEl = row.querySelector(".e"), cd = row.querySelector(".cd");
        if (w.point) { sEl.textContent = t("point") + " " + M.fmt(w.start); eEl.textContent = ""; }
        else { sEl.textContent = M.fmt(w.start); eEl.textContent = "→ " + M.fmt(w.end); }
        var live = now >= w.start && now < w.end, past = now >= w.end, upcoming = now < w.start;
        row.classList.toggle("is-live", live); row.classList.toggle("is-past", past && !w.point); row.classList.toggle("is-next", !!(s.next && s.next.id === w.id && !s.next.tomorrow));
        cd.textContent = live ? M.countdown(w.end - now) + " " + M.t("left") : upcoming ? t("in") + " " + M.countdown(w.start - now) : w.point && past ? "" : past ? t("ended") : "";
      });
    }
    tick(); iv = setInterval(function () { if (!document.hidden && sh && sh.dialog.open) tick(); }, 1000);
  }

  /* ---- Tab B: Qibla compass ---- */
  function renderQibla(b) {
    var base = T().base(), Q = window.MHSQibla;
    var bearing = Q.bearing(base.lat, base.lng), dist = Q.distanceKm(base.lat, base.lng);
    var dial = X.el("div", { class: "mhs-qb-dial" }, [X.el("span", { class: "cd n", text: "N" }), X.el("span", { class: "cd e", text: "E" }), X.el("span", { class: "cd s", text: "S" }), X.el("span", { class: "cd w", text: "W" }), X.el("div", { class: "mhs-qb-kaaba", style: { "--b": bearing.toFixed(1) + "deg" }, "aria-hidden": "true", text: "🕋" })]);
    for (var i = 0; i < 72; i++) dial.appendChild(X.el("i", { class: "tick" + (i % 6 ? "" : " big"), style: { transform: "rotate(" + i * 5 + "deg)" } }));
    var needle = X.el("div", { class: "mhs-qb-needle", "aria-hidden": "true" });
    var wrap = X.el("div", { class: "mhs-qb", role: "img", "aria-label": t("qibla") + " " + Math.round(bearing) + "° " + t("fromN") }, [dial, needle, X.el("div", { class: "mhs-qb-center" })]);
    var info = X.el("div", { class: "mhs-qb-info" }, [X.el("b", { class: "num", text: X.num(Math.round(bearing)) + "° " + t("fromN") }), X.el("small", { class: "num", text: X.num(Math.round(dist)) + " " + t("km") })]);
    var hint = X.el("p", { class: "mhs-mini-note", role: "status", text: "" });
    var btn = X.el("button", { type: "button", class: "mhs-btn primary", text: "🧭 " + t("compassOff") });
    var status = X.el("div", { class: "mhs-qb-status", "aria-live": "polite" });
    b.append(X.el("div", { class: "mhs-ph-card mhs-qb-card" }, [X.el("h3", { text: "🧭 " + t("qibla") }), wrap, info, status, X.el("div", { class: "mhs-actions" }, [btn]), hint, X.el("p", { class: "mhs-mini-note", text: "📍 " + (base.place || base.lat + ", " + base.lng) })]));
    var heading = null;
    function paint() {
      if (heading === null) return;
      dial.style.transform = "rotate(" + (-heading) + "deg)";
      var diff = ((bearing - heading + 540) % 360) - 180, ok = Math.abs(diff) <= 5;
      wrap.classList.toggle("is-aligned", ok);
      status.textContent = ok ? t("aligned") : t("turn", { d: X.num(Math.abs(Math.round(diff))), dir: t(diff > 0 ? "right" : "left2") });
      if (ok && !wrap._buzzed) { wrap._buzzed = true; X.haptic([30, 40, 30]); } else if (!ok) wrap._buzzed = false;
    }
    function onOrient(e) {
      var h = null;
      if (typeof e.webkitCompassHeading === "number") h = e.webkitCompassHeading;
      else if (e.absolute !== false && typeof e.alpha === "number") h = (360 - e.alpha) % 360;
      if (h === null) return;
      heading = heading === null ? h : (heading + (((h - heading + 540) % 360) - 180) * 0.3 + 360) % 360;
      paint();
    }
    compass = { stop: function () { window.removeEventListener("deviceorientationabsolute", onOrient, true); window.removeEventListener("deviceorientation", onOrient, true); } };
    function start() {
      var D = window.DeviceOrientationEvent;
      if (!D) { hint.textContent = t("compassNo"); return; }
      var go = function () {
        btn.hidden = true; hint.textContent = t("compassHint");
        if ("ondeviceorientationabsolute" in window) window.addEventListener("deviceorientationabsolute", onOrient, true);
        window.addEventListener("deviceorientation", onOrient, true);
        setTimeout(function () { if (heading === null) { hint.textContent = t("compassNo"); btn.hidden = false; } }, 4000);
      };
      if (typeof D.requestPermission === "function") D.requestPermission().then(function (r) { if (r === "granted") go(); else hint.textContent = t("compassNo"); }).catch(function () { hint.textContent = t("compassNo"); });
      else go();
    }
    btn.addEventListener("click", start);
  }

  /* ---- Tab C: nearby mosques ---- */
  function renderMosques(b) {
    var base = T().base(), ll = base.lat + "," + base.lng;
    var search = "https://www.google.com/maps/search/mosque/@" + ll + ",15z";
    var embed = "https://www.google.com/maps?q=" + encodeURIComponent("mosque near " + ll) + "&ll=" + ll + "&z=15&output=embed";
    var card = X.el("div", { class: "mhs-ph-card" }, [X.el("h3", { text: "🕌 " + t("mosques") }), X.el("p", { class: "mhs-mini-note", text: t("mapHint") })]);
    var frameWrap = X.el("div", { class: "mhs-ph-map" });
    var showBtn = X.el("button", { type: "button", class: "mhs-btn primary", text: "🗺️ " + t("mapBtn"), on: { click: function () {
      showBtn.hidden = true;
      frameWrap.appendChild(X.el("iframe", { src: embed, title: t("mosques"), loading: "lazy", referrerpolicy: "no-referrer-when-downgrade", allow: "geolocation", style: { border: "0" } }));
    } } });
    card.append(X.el("div", { class: "mhs-actions" }, [showBtn, X.el("a", { class: "mhs-btn", href: search, target: "_blank", rel: "noopener noreferrer", text: "↗ " + t("openMaps") })]), frameWrap);
    if (navigator.onLine) showBtn.click();
    b.appendChild(card);
  }

  /* ---- settings ---- */
  function renderSettings(b) {
    var M = T(), base = M.base() || {}, c = M.cfg();
    function sec(title, kids) { return X.el("section", { class: "mhs-ph-card" }, [X.el("h3", { text: title })].concat(kids)); }
    function select(opts, val, on) { var s = X.el("select", { class: "mhs-select" }, opts.map(function (o) { return X.el("option", { value: o[0], text: o[1], selected: o[0] === val ? true : null }); })); s.addEventListener("change", function () { on(s.value); }); return s; }
    function row(label, ctl) { return X.el("label", { class: "mhs-ph-set" }, [X.el("span", { text: label }), ctl]); }
    var msg = X.el("p", { class: "mhs-mini-note", role: "status" });
    // location
    var latIn = X.el("input", { type: "number", step: "0.0001", min: "-90", max: "90", value: base.lat != null ? base.lat : "", "aria-label": t("lat"), placeholder: t("lat"), inputmode: "decimal" });
    var lngIn = X.el("input", { type: "number", step: "0.0001", min: "-180", max: "180", value: base.lng != null ? base.lng : "", "aria-label": t("lng"), placeholder: t("lng"), inputmode: "decimal" });
    var placeIn = X.el("input", { type: "text", maxlength: "60", value: base.place && base.src !== "gps" ? base.place : "", "aria-label": t("place"), placeholder: t("place") });
    b.appendChild(sec("📍 " + t("loc"), [
      X.el("p", { class: "mhs-mini-note", text: (base.lat != null ? (base.place || base.lat + ", " + base.lng) + " · " + (t("src")[base.src] || t("src").manual) : t("noLoc")) }),
      X.el("div", { class: "mhs-actions" }, [X.el("button", { type: "button", class: "mhs-btn primary", text: "📍 " + t("allow"), on: { click: function (e) { e.currentTarget.disabled = true; msg.textContent = t("locating"); (window.MHSPrayer.enableLocation ? window.MHSPrayer.enableLocation() : Promise.resolve()).then(function () { render(); }); } } }), citySelect(function () { render(); })]),
      X.el("div", { class: "mhs-ph-grid3" }, [latIn, lngIn, placeIn]),
      X.el("div", { class: "mhs-actions" }, [X.el("button", { type: "button", class: "mhs-btn", text: t("apply"), on: { click: function () { var la = parseFloat(latIn.value), ln = parseFloat(lngIn.value); if (isNaN(la) || isNaN(ln)) return; M.setBase({ lat: la, lng: ln, place: placeIn.value.trim() || la.toFixed(3) + ", " + ln.toFixed(3), src: "manual", at: Date.now(), on: true }); X.toast(t("saved")); render(); } } })]),
      msg
    ]));
    // method & madhab & hi-lat & clock
    b.appendChild(sec("🧮 " + t("method"), [
      row(t("method"), select(Object.keys(METHODS).map(function (k) { return [k, METHODS[k]]; }), base.method || "karachi", function (v) { M.setBase({ method: v }); })),
      row(t("asr"), select([["hanafi", t("hanafi")], ["standard", t("standard")]], base.asr || "hanafi", function (v) { M.setBase({ asr: v }); })),
      row(t("hiLat"), select([["auto", t("auto")], ["middle", t("middle")], ["seventh", t("seventh")], ["angle", t("angle")]], c.hiLat, function (v) { M.setCfg({ hiLat: v }); })),
      row(t("clock"), select([["12", t("h12")], ["24", t("h24")]], c.clock, function (v) { M.setCfg({ clock: v }); }))
    ]));
    // adjustments
    var adj = X.el("div", { class: "mhs-ph-adj" });
    ["fajr", "sunrise", "dhuhr", "asr", "maghrib", "isha"].forEach(function (k) {
      var inp = X.el("input", { type: "number", min: "-60", max: "60", step: "1", value: c.adjust[k] || 0, "aria-label": M.t(k), inputmode: "numeric" });
      inp.addEventListener("change", function () { var a = Object.assign({}, M.cfg().adjust); a[k] = Math.max(-60, Math.min(60, parseInt(inp.value, 10) || 0)); M.setCfg({ adjust: a }); });
      adj.appendChild(X.el("label", null, [X.el("span", { text: M.t(k) }), inp]));
    });
    b.appendChild(sec("⏱ " + t("adjust"), [adj]));
    // alerts
    var canN = "Notification" in window, granted = canN && Notification.permission === "granted";
    var al = X.el("div", { class: "mhs-ph-alerts" });
    M.FARD.concat(["tahajjud", "sehri", "iftar"]).forEach(function (k) {
      var cb = X.el("input", { type: "checkbox", checked: c.alerts[k] ? true : null });
      cb.addEventListener("change", function () { var a = Object.assign({}, M.cfg().alerts); a[k] = cb.checked; M.setCfg({ alerts: a }); M.scheduleAlerts(); });
      al.appendChild(X.el("label", { class: "mhs-switch" }, [cb, X.el("span", { text: M.t(k) })]));
    });
    var lead = X.el("input", { type: "number", min: "0", max: "60", step: "5", value: c.alertMin || 0, inputmode: "numeric", "aria-label": t("alertLead") });
    lead.addEventListener("change", function () { M.setCfg({ alertMin: Math.max(0, Math.min(60, parseInt(lead.value, 10) || 0)) }); M.scheduleAlerts(); });
    b.appendChild(sec("🔔 " + t("alerts"), [
      granted ? null : X.el("div", { class: "mhs-actions" }, [X.el("p", { class: "mhs-mini-note", text: canN ? t("alertsNeed") : "—" }), canN ? X.el("button", { type: "button", class: "mhs-btn", text: t("enableNotif"), on: { click: function () { Notification.requestPermission().then(function () { render(); }); } } }) : null]),
      al, row(t("alertLead"), lead)
    ]));
    b.appendChild(X.el("p", { class: "mhs-mini-note", text: t("offlineNote") }));
  }

  window.MHSPrayerHub = { open: open };
  /* The unified menu's Jainamaz item ("prayer") calls MHSQibla.open — route it to the hub. */
  X.whenReady("MHSQibla", function (Q) { Q.open = function (o) { open(o); }; });
  /* Cache the last known location for offline use: prayer.js already persists it in localStorage. */
})();
