/* Essential Amol (সবচেয়ে প্রয়োজনীয় আমল) — the most important daily acts with one-tap check-in,
 * short virtue (fazilat) + source, "Add to my habits", reorder / hide / custom items.
 * Completions feed the Home overview (Ruh/Qalb scores) in real time via MHSX "essential":
 *   { done: { "YYYY-MM-DD": [ids] }, order: [ids], hidden: [ids], custom: [ {id,title:{en,bn},fazilat:{en,bn},src,when} ] }
 *
 * The pure core (MHSEssentialCore) has no DOM/MHSX dependency so the home-screen widget can use it. */
(function () {
  "use strict";
  var ITEMS = [
    { id: "p-fajr", g: "salah", icon: "🌅", title: { en: "Fajr on time", bn: "ফজর সময়মতো", ar: "الفجر في وقتها" }, fazilat: { en: "Whoever prays Fajr is under the protection of Allah.", bn: "যে ফজর পড়ল সে আল্লাহর জিম্মায় থাকল।" }, src: "Sahih Muslim 657", prayer: "fajr", cat: "Fard", pts: 30 },
    { id: "p-dhuhr", g: "salah", icon: "🕛", title: { en: "Dhuhr on time", bn: "যোহর সময়মতো", ar: "الظهر في وقتها" }, fazilat: { en: "Guarding the five prayers is a light, proof and salvation on the Day of Judgement.", bn: "পাঁচ ওয়াক্ত নামাজের হেফাজত কিয়ামতের দিন নূর, দলিল ও মুক্তি হবে।" }, src: "Musnad Ahmad 6576", prayer: "dhuhr", cat: "Fard", pts: 25 },
    { id: "p-asr", g: "salah", icon: "🌇", title: { en: "Asr on time", bn: "আসর সময়মতো", ar: "العصر في وقتها" }, fazilat: { en: "Whoever prays the two cool prayers (Fajr and Asr) will enter Paradise.", bn: "যে দুই শীতল ওয়াক্তের (ফজর ও আসর) নামাজ পড়ল সে জান্নাতে প্রবেশ করবে।" }, src: "Sahih al-Bukhari 574", prayer: "asr", cat: "Fard", pts: 25 },
    { id: "p-maghrib", g: "salah", icon: "🌆", title: { en: "Maghrib on time", bn: "মাগরিব সময়মতো", ar: "المغرب في وقتها" }, fazilat: { en: "The most beloved deed to Allah is prayer at its proper time.", bn: "আল্লাহর কাছে সবচেয়ে প্রিয় আমল হলো সময়মতো নামাজ।" }, src: "Sahih al-Bukhari 527", prayer: "maghrib", cat: "Fard", pts: 25 },
    { id: "p-isha", g: "salah", icon: "🌃", title: { en: "Isha on time", bn: "এশা সময়মতো", ar: "العشاء في وقتها" }, fazilat: { en: "Whoever prays Isha in congregation, it is as if he stood half the night in prayer.", bn: "যে এশা জামাতে পড়ল, সে যেন অর্ধেক রাত নামাজে কাটাল।" }, src: "Sahih Muslim 656", prayer: "isha", cat: "Fard", pts: 25 },
    { id: "rawatib", g: "salah", icon: "🔁", title: { en: "12 rakat Sunnah (Rawatib)", bn: "১২ রাকাত সুন্নতে মুয়াক্কাদা", ar: "السنن الرواتب" }, fazilat: { en: "Whoever prays twelve rakat in a day and night, a house is built for him in Paradise.", bn: "যে দিন-রাতে বারো রাকাত (সুন্নত) পড়ে, তার জন্য জান্নাতে একটি ঘর নির্মাণ করা হয়।" }, src: "Sahih Muslim 728", cat: "Sunnah", pts: 15 },
    { id: "witr", g: "salah", icon: "🔹", title: { en: "Witr", bn: "বিতর", ar: "الوتر" }, fazilat: { en: "Allah is Witr (One) and loves the Witr — so pray Witr, O people of the Quran.", bn: "আল্লাহ বিতর (এক) এবং বিতরকে ভালোবাসেন — হে কুরআনের অনুসারীরা, বিতর পড়ো।" }, src: "Abu Dawud 1416 · Tirmidhi 453", cat: "Sunnah", pts: 15 },
    { id: "kursi", g: "after", icon: "🛡️", title: { en: "Ayatul Kursi after every salah", bn: "প্রতি নামাজের পর আয়াতুল কুরসি", ar: "آية الكرسي بعد كل صلاة" }, fazilat: { en: "Nothing stands between him and Paradise except death.", bn: "তার ও জান্নাতের মাঝে মৃত্যু ছাড়া আর কোনো বাধা থাকে না।" }, src: "An-Nasa'i, As-Sunan al-Kubra 9928", q: { s: 2, a: 255 }, cat: "Sunnah", pts: 10 },
    { id: "tasbih", g: "after", icon: "📿", title: { en: "Tasbih after salah (33·33·34)", bn: "নামাজের পর তাসবিহ (৩৩·৩৩·৩৪)", ar: "تسبيح ما بعد الصلاة" }, fazilat: { en: "Whoever says SubhanAllah 33, Alhamdulillah 33, Allahu Akbar 34 after every prayer — his sins are forgiven even if like the foam of the sea.", bn: "প্রতি নামাজের পর ৩৩ বার সুবহানাল্লাহ, ৩৩ বার আলহামদুলিল্লাহ ও ৩৪ বার আল্লাহু আকবার বললে গুনাহ সমুদ্রের ফেনার মতো হলেও মাফ হয়।" }, src: "Sahih Muslim 597", z: "subhanallah", cat: "Sunnah", pts: 10 },
    { id: "morning", g: "zikr", icon: "🌄", title: { en: "Morning adhkar", bn: "সকালের জিকির", ar: "أذكار الصباح" }, fazilat: { en: "Remember Allah morning and evening — the Quran commands it and it protects you all day.", bn: "সকাল-সন্ধ্যায় আল্লাহকে স্মরণ করো — কুরআনের নির্দেশ, সারাদিনের হেফাজত।" }, src: "Quran 33:41-42 · Abu Dawud 5082", q: { s: 33, a: 41 }, when: "morning", cat: "Sunnah", pts: 15 },
    { id: "evening", g: "zikr", icon: "🌙", title: { en: "Evening adhkar", bn: "সন্ধ্যার জিকির", ar: "أذكار المساء" }, fazilat: { en: "Say the three Quls three times in the evening — it suffices you against everything.", bn: "সন্ধ্যায় তিন কুল তিনবার পড়ো — সব কিছু থেকে তোমার জন্য যথেষ্ট।" }, src: "Abu Dawud 5082 · Tirmidhi 3575", q: { s: 112, a: 1 }, when: "evening", cat: "Sunnah", pts: 15 },
    { id: "istighfar", g: "zikr", icon: "🤲", title: { en: "Istighfar 100×", bn: "ইস্তিগফার ১০০ বার", ar: "الاستغفار ١٠٠ مرة" }, fazilat: { en: "The Prophet ﷺ sought forgiveness more than seventy times a day.", bn: "নবী ﷺ দিনে সত্তরবারের বেশি ইস্তিগফার করতেন।" }, src: "Sahih al-Bukhari 6307", z: "istighfar", cat: "Sunnah", pts: 10 },
    { id: "durood", g: "zikr", icon: "💚", title: { en: "Durood (Salawat)", bn: "দরুদ শরিফ", ar: "الصلاة على النبي ﷺ" }, fazilat: { en: "Whoever sends one blessing upon me, Allah sends ten upon him.", bn: "যে আমার উপর একবার দরুদ পাঠায়, আল্লাহ তার উপর দশবার রহমত পাঠান।" }, src: "Sahih Muslim 408", z: "salawat", cat: "Sunnah", pts: 10 },
    { id: "quran", g: "quran", icon: "📖", title: { en: "Daily Quran recitation", bn: "দৈনিক কুরআন তিলাওয়াত", ar: "تلاوة القرآن اليومية" }, fazilat: { en: "Whoever reads one letter of the Book of Allah earns a good deed, and each good deed is multiplied tenfold.", bn: "যে আল্লাহর কিতাবের একটি অক্ষর পড়ে তার একটি নেকি, আর প্রতিটি নেকি দশগুণ।" }, src: "Tirmidhi 2910", cat: "Sunnah", pts: 20 },
    { id: "tahajjud", g: "night", icon: "✨", title: { en: "Tahajjud", bn: "তাহাজ্জুদ", ar: "التهجد" }, fazilat: { en: "The best prayer after the obligatory ones is the night prayer.", bn: "ফরজ নামাজের পর সর্বোত্তম নামাজ হলো রাতের নামাজ।" }, src: "Sahih Muslim 1163", prayer: "tahajjud", cat: "Nafl", pts: 40 },
    { id: "duha", g: "night", icon: "☀️", title: { en: "Ishraq / Duha (Chasht)", bn: "ইশরাক / চাশত", ar: "الضحى" }, fazilat: { en: "Two rakat of Duha suffice as charity for every joint of the body.", bn: "দুহার দুই রাকাত শরীরের প্রতিটি জোড়ার সদকা হিসেবে যথেষ্ট।" }, src: "Sahih Muslim 720", cat: "Nafl", pts: 15 },
    { id: "sleep-dua", g: "night", icon: "🛏️", title: { en: "Sleeping & waking duas", bn: "ঘুম ও জাগরণের দোয়া", ar: "أذكار النوم والاستيقاظ" }, fazilat: { en: "Recite Ayatul Kursi before sleep — a guardian from Allah stays with you till morning.", bn: "ঘুমানোর আগে আয়াতুল কুরসি পড়ো — সকাল পর্যন্ত আল্লাহর পক্ষ থেকে একজন রক্ষক থাকবে।" }, src: "Sahih al-Bukhari 2311", when: "night", cat: "Sunnah", pts: 10 },
    { id: "mulk", g: "night", icon: "🌌", title: { en: "Surah Mulk before sleep", bn: "ঘুমের আগে সূরা মুলক", ar: "سورة الملك قبل النوم" }, fazilat: { en: "A surah of thirty verses intercedes for its reader until he is forgiven.", bn: "ত্রিশ আয়াতের একটি সূরা তার পাঠকের জন্য সুপারিশ করে যতক্ষণ না তাকে ক্ষমা করা হয়।" }, src: "Tirmidhi 2891 · Abu Dawud 1400", q: { s: 67, a: 1 }, when: "night", cat: "Sunnah", pts: 15 },
    { id: "kahf", g: "weekly", icon: "🕋", title: { en: "Surah Kahf on Friday", bn: "জুমার দিনে সূরা কাহফ", ar: "سورة الكهف يوم الجمعة" }, fazilat: { en: "Whoever reads Surah al-Kahf on Friday, a light shines for him between the two Fridays.", bn: "যে জুমার দিনে সূরা কাহফ পড়ে, দুই জুমার মাঝে তার জন্য নূর জ্বলে।" }, src: "Al-Hakim 2/368 · Bayhaqi (sahih per Albani)", q: { s: 18, a: 1 }, days: [5], cat: "Sunnah", pts: 20 },
    { id: "fast-mt", g: "weekly", icon: "🌙", title: { en: "Fast Monday / Thursday", bn: "সোম ও বৃহস্পতিবার রোজা", ar: "صيام الاثنين والخميس" }, fazilat: { en: "Deeds are presented on Monday and Thursday, and I love that my deeds be presented while I am fasting.", bn: "সোম ও বৃহস্পতিবার আমল পেশ করা হয়, আমি চাই আমার আমল পেশ হোক রোজা অবস্থায়।" }, src: "Tirmidhi 747", days: [1, 4], cat: "Nafl", pts: 30 },
    { id: "fast-beed", g: "weekly", icon: "🌕", title: { en: "Ayyam al-Beed fast (13·14·15)", bn: "আইয়ামে বীজ রোজা (১৩·১৪·১৫)", ar: "صيام الأيام البيض" }, fazilat: { en: "Fasting three days every month is like fasting the whole year.", bn: "প্রতি মাসে তিন দিন রোজা সারা বছর রোজার সমান।" }, src: "Sahih al-Bukhari 1979", hijri: [13, 14, 15], cat: "Nafl", pts: 30 },
    { id: "sadaqah", g: "daily", icon: "💝", title: { en: "Sadaqah (even a smile)", bn: "সদকা (একটি হাসিও)", ar: "الصدقة" }, fazilat: { en: "Charity extinguishes sin as water extinguishes fire.", bn: "সদকা গুনাহ নিভিয়ে দেয় যেমন পানি আগুন নেভায়।" }, src: "Tirmidhi 614", cat: "Sunnah", pts: 10 }
  ];
  var GROUPS = [
    { id: "salah", en: "Prayers", bn: "নামাজ", ar: "الصلاة" }, { id: "after", en: "After salah", bn: "নামাজের পর", ar: "بعد الصلاة" }, { id: "zikr", en: "Zikr & dua", bn: "জিকির ও দোয়া", ar: "الذكر والدعاء" },
    { id: "quran", en: "Quran", bn: "কুরআন", ar: "القرآن" }, { id: "night", en: "Night & nafl", bn: "রাত ও নফল", ar: "الليل والنوافل" }, { id: "weekly", en: "Weekly & fasting", bn: "সাপ্তাহিক ও রোজা", ar: "أسبوعي وصيام" }, { id: "daily", en: "Everyday", bn: "দৈনন্দিন", ar: "يومي" }
  ];

  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function dayKey(d) { d = d || new Date(); return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); }
  function norm(d) { d = d || {}; d.done = d.done || {}; d.order = Array.isArray(d.order) ? d.order : []; d.hidden = Array.isArray(d.hidden) ? d.hidden : []; d.custom = Array.isArray(d.custom) ? d.custom : []; return d; }
  /* Items due today (respecting weekday rules), ordered by the user, hidden removed. */
  function listFor(d, date) {
    d = norm(d); date = date || new Date();
    var all = ITEMS.concat(d.custom.map(function (c) { return Object.assign({ g: "daily", icon: "⭐", custom: true, cat: "Personal", pts: 10 }, c); }));
    var wd = date.getDay();
    all = all.filter(function (it) { return d.hidden.indexOf(it.id) < 0 && (!it.days || it.days.indexOf(wd) >= 0); });
    var pos = {}; d.order.forEach(function (id, i) { pos[id] = i; });
    all.sort(function (a, b) { var pa = pos[a.id], pb = pos[b.id]; if (pa == null && pb == null) return 0; if (pa == null) return 1; if (pb == null) return -1; return pa - pb; });
    return all;
  }
  function doneToday(d, date) { return norm(d).done[dayKey(date)] || []; }
  function toggleIn(d, id, date) {
    d = norm(d); var k = dayKey(date), list = (d.done[k] || []).slice(), i = list.indexOf(id);
    if (i === -1) list.push(id); else list.splice(i, 1);
    d.done[k] = list;
    var keys = Object.keys(d.done).sort(); while (keys.length > 400) delete d.done[keys.shift()];
    return { data: d, on: i === -1 };
  }
  function statsFor(d, days) {
    d = norm(d); days = days || 7;
    var out = [], today = new Date();
    for (var i = days - 1; i >= 0; i--) { var x = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i); out.push((d.done[dayKey(x)] || []).length); }
    var streak = 0, cur = new Date(); if (!(d.done[dayKey(cur)] || []).length) cur.setDate(cur.getDate() - 1);
    while ((d.done[dayKey(cur)] || []).length) { streak++; cur.setDate(cur.getDate() - 1); }
    var list = listFor(d), done = doneToday(d), prayers = list.filter(function (it) { return it.prayer && it.prayer !== "tahajjud"; });
    return { today: done.filter(function (id) { return list.some(function (it) { return it.id === id; }); }).length, total: list.length, week: out, streak: streak,
      prayersDone: prayers.filter(function (it) { return done.indexOf(it.id) >= 0; }).length, prayersTotal: prayers.length };
  }
  var CORE = { ITEMS: ITEMS, GROUPS: GROUPS, dayKey: dayKey, norm: norm, listFor: listFor, doneToday: doneToday, toggleIn: toggleIn, statsFor: statsFor,
    title: function (it, l) { return (it.title && (it.title[l] || it.title.en)) || it.id; }, fazilat: function (it, l) { return (it.fazilat && (it.fazilat[l] || it.fazilat.en)) || ""; } };
  window.MHSEssentialCore = CORE;

  /* ---- app UI (needs MHSX) ---- */
  if (!window.MHSX || window.MHSEssential) return;
  var X = window.MHSX;
  var t = X.tr({
    en: { title: "Essential Amol", sub: "The most important daily acts", doneToday: "{d} of {n} today", prayers: "{d}/5 prayers", streak: "{n}-day streak", mark: "Mark done", marked: "Done", addHabit: "Add to my habits", added: "Added to Habits", inHabits: "In Habits", src: "Source", quran: "Read", zikr: "Count", share: "Share",
      customize: "Customize", doneBtn: "Done", hide: "Hide", show: "Show", up: "Move up", down: "Move down", addCustom: "Add custom amol", name: "Name", fazilat: "Virtue / note (optional)", source: "Source (optional)", save: "Save", cancel: "Cancel", del: "Delete", custom: "Custom", reset: "Reset order", allDone: "Everything done — Alhamdulillah!", fri: "Friday", hint: "Tap the circle to check in. Completions feed your Home analytics instantly." },
    bn: { title: "প্রয়োজনীয় আমল", sub: "সবচেয়ে প্রয়োজনীয় দৈনিক আমল", doneToday: "আজ {n}টির মধ্যে {d}টি", prayers: "{d}/৫ ওয়াক্ত", streak: "{n} দিনের ধারা", mark: "সম্পন্ন করুন", marked: "সম্পন্ন", addHabit: "অভ্যাসে যোগ করুন", added: "অভ্যাসে যোগ হয়েছে", inHabits: "অভ্যাসে আছে", src: "সূত্র", quran: "পড়ুন", zikr: "গুনুন", share: "শেয়ার",
      customize: "সাজান", doneBtn: "হয়েছে", hide: "লুকান", show: "দেখান", up: "উপরে", down: "নিচে", addCustom: "নিজের আমল যোগ করুন", name: "নাম", fazilat: "ফজিলত / নোট (ঐচ্ছিক)", source: "সূত্র (ঐচ্ছিক)", save: "সংরক্ষণ", cancel: "বাতিল", del: "মুছুন", custom: "নিজের", reset: "ক্রম রিসেট", allDone: "সব সম্পন্ন — আলহামদুলিল্লাহ!", fri: "জুমা", hint: "চেক-ইন করতে বৃত্তে চাপুন। সম্পন্ন আমল সাথে সাথে হোম অ্যানালিটিক্সে যোগ হয়।" },
    ar: { title: "الأعمال الأساسية", sub: "أهم الأعمال اليومية", doneToday: "{d} من {n} اليوم", prayers: "{d}/٥ صلوات", streak: "سلسلة {n} يوم", mark: "تم", marked: "تم", addHabit: "أضف إلى عاداتي", added: "أُضيف إلى العادات", inHabits: "في العادات", src: "المصدر", quran: "اقرأ", zikr: "عدّ", share: "مشاركة",
      customize: "تخصيص", doneBtn: "تم", hide: "إخفاء", show: "إظهار", up: "أعلى", down: "أسفل", addCustom: "أضف عملاً", name: "الاسم", fazilat: "الفضل / ملاحظة", source: "المصدر", save: "حفظ", cancel: "إلغاء", del: "حذف", custom: "مخصص", reset: "إعادة الترتيب", allDone: "تم كل شيء — الحمد لله!", fri: "الجمعة", hint: "اضغط الدائرة لتسجيل الإنجاز." }
  });
  function data() { return norm(X.get("essential", null) || {}); }
  function save(d) { X.set("essential", d); }
  function items() { return listFor(data()); }
  function stats() { return statsFor(data(), 7); }
  function toggle(id) { var r = toggleIn(data(), id); save(r.data); X.haptic(r.on ? 18 : 8); try { document.dispatchEvent(new CustomEvent("mhs:essential", { detail: { id: id, on: r.on } })); } catch (e) {} return r.on; }
  function isHabit(it) {
    var app = window.MHSApp, d = app && app.data ? app.data() : null; if (!d) return false;
    var tt = CORE.title(it, "en").toLowerCase();
    return (d.habits || []).some(function (h) { return String(h.title || "").trim().toLowerCase() === tt; });
  }
  function addToHabits(it) {
    var app = window.MHSApp; if (!app || !app.addHabits) return 0;
    var n = app.addHabits([{ title: CORE.title(it, "en"), icon: it.icon, category: it.cat || "Sunnah", points: it.pts || 10, repeat: it.days ? it.days.map(function (d) { return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d]; }) : ["Everyday"], deadline: "23:59:00" }]);
    X.toast(n ? t("added") : t("inHabits"));
    return n;
  }

  function render(host, opts) {
    opts = opts || {};
    var d = data(), list = listFor(d), done = doneToday(d), l = X.lang(), editing = !!opts.editing;
    host.replaceChildren();
    var s = stats();
    host.appendChild(X.el("div", { class: "mhs-es-dash" }, [
      X.el("div", { class: "r", html: X.ring(s.total ? s.today / s.total : 0, 58, 6) + "<b>" + X.esc(X.num(Math.round(100 * (s.total ? s.today / s.total : 0)))) + "%</b>" }),
      X.el("div", { class: "t" }, [X.el("b", { text: t("doneToday", { d: X.num(s.today), n: X.num(s.total) }) }), X.el("small", { text: "🕌 " + t("prayers", { d: X.num(s.prayersDone) }) + " · 🔥 " + t("streak", { n: X.num(s.streak) }) })]),
      X.el("div", { class: "sp", html: X.bars(s.week, 84, 30) })
    ]));
    var bar = X.el("div", { class: "mhs-es-bar" }, [
      X.el("p", { class: "mhs-mini-note", text: t("hint") }),
      X.el("button", { type: "button", class: "mhs-chip" + (editing ? " is-on" : ""), text: editing ? "✓ " + t("doneBtn") : "⚙︎ " + t("customize"), on: { click: function () { render(host, { editing: !editing }); } } })
    ]);
    host.appendChild(bar);
    var all = editing ? ITEMS.concat(d.custom.map(function (c) { return Object.assign({ g: "daily", icon: "⭐", custom: true }, c); })) : list;
    if (editing) { var pos = {}; d.order.forEach(function (id, i) { pos[id] = i; }); all = all.slice().sort(function (a, b) { var pa = pos[a.id], pb = pos[b.id]; if (pa == null && pb == null) return 0; if (pa == null) return 1; if (pb == null) return -1; return pa - pb; }); }
    var wrap = X.el("div", { class: "mhs-es-list" });
    all.forEach(function (it, idx) {
      var on = done.indexOf(it.id) >= 0, hidden = d.hidden.indexOf(it.id) >= 0;
      var card = X.el("article", { class: "mhs-es-card" + (on ? " is-done" : "") + (hidden ? " is-hidden" : ""), "data-id": it.id });
      var chk = X.el("button", { type: "button", class: "mhs-es-chk", "aria-pressed": on ? "true" : "false", "aria-label": (on ? t("marked") : t("mark")) + ": " + CORE.title(it, l), disabled: editing ? true : null, on: { click: function () {
        var now = toggle(it.id); card.classList.toggle("is-done", now); chk.setAttribute("aria-pressed", now ? "true" : "false");
        if (now) { card.classList.add("is-pop"); setTimeout(function () { card.classList.remove("is-pop"); }, 500); if (window.MHSMotion && window.MHSMotion.burst) try { window.MHSMotion.burst(chk); } catch (e) {} }
        var s2 = stats(), dash = host.querySelector(".mhs-es-dash");
        if (dash) { dash.querySelector(".r").innerHTML = X.ring(s2.total ? s2.today / s2.total : 0, 58, 6) + "<b>" + X.esc(X.num(Math.round(100 * (s2.total ? s2.today / s2.total : 0)))) + "%</b>"; dash.querySelector(".t b").textContent = t("doneToday", { d: X.num(s2.today), n: X.num(s2.total) }); dash.querySelector(".t small").textContent = "🕌 " + t("prayers", { d: X.num(s2.prayersDone) }) + " · 🔥 " + t("streak", { n: X.num(s2.streak) }); dash.querySelector(".sp").innerHTML = X.bars(s2.week, 84, 30); }
        if (s2.today === s2.total && now) X.toast(t("allDone"));
      } } }, [X.icon("check")]);
      var tools = X.el("div", { class: "tools" });
      if (!editing) {
        if (it.q) tools.appendChild(X.el("button", { type: "button", class: "mhs-chip", text: "📖 " + t("quran"), on: { click: function () { window.MHSQuran && window.MHSQuran.open({ surah: it.q.s, ayah: it.q.a }); } } }));
        if (it.z) tools.appendChild(X.el("button", { type: "button", class: "mhs-chip", text: "📿 " + t("zikr"), on: { click: function () { window.MHSZikr && window.MHSZikr.open({ zikr: it.z }); } } }));
        if (!it.custom) tools.appendChild(X.el("button", { type: "button", class: "mhs-chip" + (isHabit(it) ? " is-on" : ""), text: (isHabit(it) ? "✓ " : "+ ") + t(isHabit(it) ? "inHabits" : "addHabit"), on: { click: function (e) { addToHabits(it); e.currentTarget.textContent = "✓ " + t("inHabits"); e.currentTarget.classList.add("is-on"); } } }));
        tools.appendChild(X.el("button", { type: "button", class: "mhs-chip", text: "↗ " + t("share"), on: { click: function () { window.MHSShare ? window.MHSShare.menu({ medium: "amol", eyebrow: t("title"), title: CORE.title(it, l), text: CORE.fazilat(it, l), src: it.src }) : X.share(CORE.title(it, l) + "\n" + CORE.fazilat(it, l) + "\n— " + it.src); } } }));
      } else {
        tools.appendChild(X.el("button", { type: "button", class: "mhs-chip", "aria-label": t("up"), text: "↑", on: { click: function () { move(it.id, -1, all); render(host, { editing: true }); } } }));
        tools.appendChild(X.el("button", { type: "button", class: "mhs-chip", "aria-label": t("down"), text: "↓", on: { click: function () { move(it.id, 1, all); render(host, { editing: true }); } } }));
        tools.appendChild(X.el("button", { type: "button", class: "mhs-chip" + (hidden ? "" : " is-on"), text: hidden ? "👁 " + t("show") : "🙈 " + t("hide"), on: { click: function () { var dd = data(); var i = dd.hidden.indexOf(it.id); if (i >= 0) dd.hidden.splice(i, 1); else dd.hidden.push(it.id); save(dd); render(host, { editing: true }); } } }));
        if (it.custom) tools.appendChild(X.el("button", { type: "button", class: "mhs-chip", text: "🗑 " + t("del"), on: { click: function () { var dd = data(); dd.custom = dd.custom.filter(function (c) { return c.id !== it.id; }); save(dd); render(host, { editing: true }); } } }));
      }
      card.append(chk, X.el("div", { class: "body" }, [
        X.el("div", { class: "ttl" }, [X.el("span", { class: "ico", "aria-hidden": "true", text: it.icon }), X.el("b", { text: CORE.title(it, l) }), it.custom ? X.el("small", { class: "tag", text: t("custom") }) : null, it.days ? X.el("small", { class: "tag", text: t("fri") }) : null]),
        CORE.fazilat(it, l) ? X.el("p", { class: "fz", text: CORE.fazilat(it, l) }) : null,
        it.src ? X.el("small", { class: "src", text: t("src") + ": " + it.src }) : null,
        tools
      ]));
      wrap.appendChild(card);
    });
    host.appendChild(wrap);
    if (editing) {
      var form = X.el("form", { class: "mhs-es-form", on: { submit: function (e) {
        e.preventDefault(); var name = form.querySelector("[name=name]").value.trim(); if (name.length < 2) return;
        var dd = data(); dd.custom.push({ id: X.uid("ea"), title: { en: name, bn: name, ar: name }, fazilat: { en: form.querySelector("[name=fz]").value.trim(), bn: form.querySelector("[name=fz]").value.trim() }, src: form.querySelector("[name=src]").value.trim() }); save(dd); render(host, { editing: true });
      } } }, [
        X.el("h4", { text: "+ " + t("addCustom") }),
        X.el("input", { name: "name", type: "text", required: true, maxlength: "80", placeholder: t("name"), "aria-label": t("name") }),
        X.el("input", { name: "fz", type: "text", maxlength: "200", placeholder: t("fazilat"), "aria-label": t("fazilat") }),
        X.el("input", { name: "src", type: "text", maxlength: "80", placeholder: t("source"), "aria-label": t("source") }),
        X.el("div", { class: "mhs-actions" }, [X.el("button", { type: "submit", class: "mhs-btn primary", text: t("save") }), X.el("button", { type: "button", class: "mhs-btn", text: t("reset"), on: { click: function () { var dd = data(); dd.order = []; save(dd); render(host, { editing: true }); } } })])
      ]);
      host.appendChild(form);
    }
  }
  function move(id, dir, all) {
    var ids = all.map(function (x) { return x.id; }), i = ids.indexOf(id), j = i + dir; if (i < 0 || j < 0 || j >= ids.length) return;
    ids.splice(i, 1); ids.splice(j, 0, id);
    var dd = data(); dd.order = ids; save(dd);
  }

  var sh = null;
  function open() {
    if (!window.MHSSheet) return;
    if (sh && sh.dialog.open) return;
    sh = X.sheet({ id: "mhs-essential", title: t("title"), sub: t("sub"), onClose: function () { sh = null; } });
    sh.body.classList.add("mhs-es");
    render(sh.body);
  }
  window.MHSEssential = { open: open, render: render, items: items, stats: stats, toggle: toggle, addToHabits: addToHabits, data: data, core: CORE, t: t };
})();
