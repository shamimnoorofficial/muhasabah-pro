/* MHSWidgetWizard — step-by-step builder for the configurable home-screen widget.
 * 1) pick items (prayers / special times, Essential Amol, streak, To-Do, Zikr, daily reminder)
 * 2) fields (start, end, countdown, highlight), size, theme, language, section order
 * 3) live preview + add to the home screen (install prompt / shortcut / copy link)
 * Config: MHSX "widgetcfg" (backed up & synced) + mirror in localStorage "mhs:widgetcfg" for instant
 * widget boot. The widget itself lives at /widgets/?view=custom (widgets/customWidget.js). */
(function () {
  "use strict";
  if (window.MHSWidgetWizard) return;
  var X = window.MHSX;
  var t = X.tr({
    en: { title: "Widget Wizard", sub: "Build your home-screen widget", menu: "Widget Wizard", menuSub: "Prayer times, amol & more on your home screen", s1: "What should the widget show?", s2: "How should it look?", s3: "Preview & add to home screen", next: "Next", back: "Back", finish: "Save widget", saved: "Widget saved",
      gPrayers: "Prayer times", gSpecial: "Sehri · Iftar · special times", gOther: "Other", essential: "Essential Amol checklist", streak: "Habit streak & progress", todo: "To-Do list", zikr: "Zikr counter", reminder: "Daily reminder (Quran · Hadith · Wisdom)",
      fields: "Fields for each time", fStart: "Start time", fEnd: "End time", fCountdown: "Live countdown", fHighlight: "Current / next highlight", size: "Size", compact: "Compact", regular: "Regular", theme: "Theme", dark: "Dark", light: "Light", auto: "Device", language: "Language", appLang: "Same as app", order: "Section order", up: "Move up", down: "Move down",
      preview: "Live preview", add: "Add to home screen", open: "Open widget", copy: "Copy link", copied: "Link copied", howTitle: "How to add it", howAndroid: "Open the widget link in Chrome → ⋮ menu → \"Add to Home screen\". Inside the Play Store app: long-press the Muhasabah icon → Widgets/Shortcuts.", howIos: "Open the widget link in Safari → Share → \"Add to Home Screen\".", howDesk: "Install the app, then pin the widget page from the browser's menu (or use the Windows Widgets board).", none: "Pick at least one item." },
    bn: { title: "উইজেট উইজার্ড", sub: "হোম স্ক্রিনের উইজেট সাজান", menu: "উইজেট উইজার্ড", menuSub: "নামাজের সময়, আমল ও আরও — হোম স্ক্রিনে", s1: "উইজেটে কী কী দেখাবে?", s2: "দেখতে কেমন হবে?", s3: "প্রিভিউ ও হোম স্ক্রিনে যোগ", next: "পরবর্তী", back: "পেছনে", finish: "উইজেট সংরক্ষণ", saved: "উইজেট সংরক্ষিত",
      gPrayers: "নামাজের সময়", gSpecial: "সেহরি · ইফতার · বিশেষ সময়", gOther: "অন্যান্য", essential: "প্রয়োজনীয় আমল চেকলিস্ট", streak: "অভ্যাসের ধারা ও অগ্রগতি", todo: "করণীয় তালিকা", zikr: "জিকির কাউন্টার", reminder: "দৈনিক স্মরণ (কুরআন · হাদিস · হিকমাহ)",
      fields: "প্রতিটি সময়ের জন্য", fStart: "শুরুর সময়", fEnd: "শেষ সময়", fCountdown: "লাইভ কাউন্টডাউন", fHighlight: "বর্তমান / পরবর্তী হাইলাইট", size: "আকার", compact: "ছোট", regular: "সাধারণ", theme: "থিম", dark: "ডার্ক", light: "লাইট", auto: "ডিভাইস", language: "ভাষা", appLang: "অ্যাপের মতো", order: "অংশের ক্রম", up: "উপরে", down: "নিচে",
      preview: "লাইভ প্রিভিউ", add: "হোম স্ক্রিনে যোগ করুন", open: "উইজেট খুলুন", copy: "লিংক কপি", copied: "লিংক কপি হয়েছে", howTitle: "কীভাবে যোগ করবেন", howAndroid: "উইজেট লিংকটি Chrome-এ খুলুন → ⋮ মেনু → \"Add to Home screen\"। প্লে স্টোর অ্যাপে: মুহাসাবা আইকন চেপে ধরুন → Widgets/Shortcuts।", howIos: "Safari-তে লিংক খুলুন → Share → \"Add to Home Screen\"।", howDesk: "অ্যাপ ইনস্টল করুন, তারপর ব্রাউজারের মেনু থেকে উইজেট পেজ পিন করুন।", none: "অন্তত একটি আইটেম বেছে নিন।" },
    ar: { title: "معالج الأداة", sub: "أنشئ أداة الشاشة الرئيسية", menu: "معالج الأداة", menuSub: "المواقيت والأعمال على الشاشة الرئيسية", s1: "ماذا تعرض الأداة؟", s2: "كيف تبدو؟", s3: "معاينة وإضافة", next: "التالي", back: "رجوع", finish: "حفظ الأداة", saved: "تم حفظ الأداة",
      gPrayers: "مواقيت الصلاة", gSpecial: "السحور · الإفطار · أوقات خاصة", gOther: "أخرى", essential: "قائمة الأعمال الأساسية", streak: "سلسلة العادات", todo: "المهام", zikr: "عداد الذكر", reminder: "تذكير يومي",
      fields: "الحقول", fStart: "البداية", fEnd: "النهاية", fCountdown: "عدّ تنازلي", fHighlight: "إبراز الحالي/التالي", size: "الحجم", compact: "مضغوط", regular: "عادي", theme: "المظهر", dark: "داكن", light: "فاتح", auto: "الجهاز", language: "اللغة", appLang: "مثل التطبيق", order: "ترتيب الأقسام", up: "أعلى", down: "أسفل",
      preview: "معاينة", add: "أضف إلى الشاشة الرئيسية", open: "افتح الأداة", copy: "نسخ الرابط", copied: "تم نسخ الرابط", howTitle: "كيفية الإضافة", howAndroid: "افتح الرابط في Chrome → القائمة → \"إضافة إلى الشاشة الرئيسية\".", howIos: "افتح الرابط في Safari → مشاركة → \"إضافة إلى الشاشة الرئيسية\".", howDesk: "ثبّت التطبيق ثم ثبّت صفحة الأداة من قائمة المتصفح.", none: "اختر عنصراً واحداً على الأقل." }
  });
  var SPECIAL = ["sehri", "iftar", "fSunrise", "fZawal", "fSunset", "tahajjud", "ishraq", "chasht", "awwabin", "witr"];
  var SECTIONS = ["prayers", "essential", "streak", "todo", "zikr", "reminder"];
  var DEF = { items: ["fajr", "dhuhr", "asr", "maghrib", "isha", "essential", "streak"], fields: { start: true, end: true, countdown: true, highlight: true }, size: "regular", theme: "dark", lang: "", order: SECTIONS.slice() };
  function cfg() { var c = X.get("widgetcfg", null); return Object.assign({}, DEF, c || {}, { fields: Object.assign({}, DEF.fields, (c && c.fields) || {}) }); }
  function save(c) { X.set("widgetcfg", c); try { localStorage.setItem("mhs:widgetcfg", JSON.stringify(c)); } catch (e) {} }
  function url() { return location.origin + "/widgets/?view=custom&source=widget"; }

  var sh = null, step = 0, draft = null;
  function open() {
    if (!window.MHSSheet) return;
    if (sh && sh.dialog.open) return;
    draft = cfg(); step = 0;
    sh = X.sheet({ id: "mhs-widgets", title: t("title"), sub: t("sub"), onClose: function () { sh = null; } });
    render();
  }
  function render() {
    var b = sh.body; b.replaceChildren(); b.scrollTop = 0;
    var steps = X.el("div", { class: "mhs-ww-steps" }, [0, 1, 2].map(function (i) { return X.el("i", { class: i <= step ? "is-on" : "" }); }));
    b.appendChild(steps);
    b.appendChild(X.el("h3", { class: "mhs-mini-sec", style: { fontSize: "13px", letterSpacing: ".04em", textTransform: "none", color: "inherit" }, text: (step + 1) + ". " + t(["s1", "s2", "s3"][step]) }));
    if (step === 0) stepItems(b); else if (step === 1) stepLook(b); else stepAdd(b);
    var nav = X.el("div", { class: "mhs-ww-nav" }, [
      X.el("button", { type: "button", class: "mhs-btn", text: "‹ " + t("back"), disabled: step === 0 ? true : null, on: { click: function () { step--; render(); } } }),
      step < 2 ? X.el("button", { type: "button", class: "mhs-btn primary", text: t("next") + " ›", on: { click: function () { if (step === 0 && !draft.items.length) { X.toast(t("none")); return; } save(draft); step++; render(); } } })
        : X.el("button", { type: "button", class: "mhs-btn primary", text: "✓ " + t("finish"), on: { click: function () { save(draft); X.toast(t("saved")); sh.close(); } } })
    ]);
    b.appendChild(nav);
  }
  function opt(id, label, sub) {
    var on = draft.items.indexOf(id) >= 0;
    var cb = X.el("input", { type: "checkbox", checked: on ? true : null });
    var lab = X.el("label", { class: "mhs-ww-opt" + (on ? " is-on" : "") }, [cb, X.el("span", null, [label, sub ? X.el("small", { style: { display: "block", fontSize: "10.5px", opacity: ".7" }, text: sub }) : null])]);
    cb.addEventListener("change", function () { if (cb.checked) { if (draft.items.indexOf(id) < 0) draft.items.push(id); } else draft.items = draft.items.filter(function (x) { return x !== id; }); lab.classList.toggle("is-on", cb.checked); });
    return lab;
  }
  function stepItems(b) {
    var M = window.MHSTimes;
    function group(title, ids) {
      b.appendChild(X.el("div", { class: "mhs-ww-group" }, [X.el("div", { class: "mhs-mini-sec", text: title }), X.el("div", { class: "mhs-ww-opts" }, ids.map(function (id) { var w = M && M.byId(id); return opt(id, (w ? w.icon + " " + w.name : id), w && w.approx ? M.t("approx") : null); }))]));
    }
    group(t("gPrayers"), ["fajr", "dhuhr", "asr", "maghrib", "isha"]);
    group(t("gSpecial"), SPECIAL);
    b.appendChild(X.el("div", { class: "mhs-ww-group" }, [X.el("div", { class: "mhs-mini-sec", text: t("gOther") }), X.el("div", { class: "mhs-ww-opts" }, [opt("essential", "📿 " + t("essential")), opt("streak", "🔥 " + t("streak")), opt("todo", "✅ " + t("todo")), opt("zikr", "📿 " + t("zikr")), opt("reminder", "💡 " + t("reminder"))])]));
  }
  function seg(title, key, options) {
    var wrap = X.el("div", { class: "mhs-ww-seg" });
    options.forEach(function (o) { wrap.appendChild(X.el("button", { type: "button", class: draft[key] === o[0] ? "is-on" : "", text: o[1], on: { click: function () { draft[key] = o[0]; wrap.querySelectorAll("button").forEach(function (x) { x.classList.toggle("is-on", x.textContent === o[1]); }); } } })); });
    return X.el("div", { class: "mhs-ww-group" }, [X.el("div", { class: "mhs-mini-sec", text: title }), wrap]);
  }
  function stepLook(b) {
    var f = draft.fields;
    b.appendChild(X.el("div", { class: "mhs-ww-group" }, [X.el("div", { class: "mhs-mini-sec", text: t("fields") }), X.el("div", { class: "mhs-ww-opts" }, [["start", "fStart"], ["end", "fEnd"], ["countdown", "fCountdown"], ["highlight", "fHighlight"]].map(function (p) {
      var cb = X.el("input", { type: "checkbox", checked: f[p[0]] !== false ? true : null }); var lab = X.el("label", { class: "mhs-ww-opt" + (f[p[0]] !== false ? " is-on" : "") }, [cb, X.el("span", { text: t(p[1]) })]);
      cb.addEventListener("change", function () { f[p[0]] = cb.checked; lab.classList.toggle("is-on", cb.checked); }); return lab;
    }))]));
    b.appendChild(seg(t("size"), "size", [["compact", t("compact")], ["regular", t("regular")]]));
    b.appendChild(seg(t("theme"), "theme", [["dark", t("dark")], ["light", t("light")], ["auto", t("auto")]]));
    b.appendChild(seg(t("language"), "lang", [["", t("appLang")], ["en", "English"], ["bn", "বাংলা"], ["ar", "العربية"]]));
    var ord = X.el("div", { class: "mhs-ww-order" });
    function drawOrder() {
      ord.replaceChildren();
      var active = draft.order.filter(function (s) { return s === "prayers" ? draft.items.some(function (i) { return SECTIONS.indexOf(i) < 0; }) : draft.items.indexOf(s) >= 0; });
      active.forEach(function (s, i) {
        ord.appendChild(X.el("div", { class: "row" }, [X.el("span", { text: t(s === "prayers" ? "gPrayers" : s) }),
          X.el("button", { type: "button", "aria-label": t("up"), text: "↑", disabled: i === 0 ? true : null, on: { click: function () { swap(s, -1); } } }),
          X.el("button", { type: "button", "aria-label": t("down"), text: "↓", disabled: i === active.length - 1 ? true : null, on: { click: function () { swap(s, 1); } } })]));
      });
    }
    function swap(s, dir) { var i = draft.order.indexOf(s), j = i + dir; if (j < 0 || j >= draft.order.length) return; draft.order.splice(i, 1); draft.order.splice(j, 0, s); drawOrder(); }
    b.appendChild(X.el("div", { class: "mhs-ww-group" }, [X.el("div", { class: "mhs-mini-sec", text: t("order") }), ord]));
    drawOrder();
  }
  function stepAdd(b) {
    save(draft);
    var frame = X.el("iframe", { src: url() + "&preview=1&t=" + Date.now(), title: t("preview"), loading: "eager" });
    b.appendChild(X.el("div", { class: "mhs-ww-group" }, [X.el("div", { class: "mhs-mini-sec", text: t("preview") }), X.el("div", { class: "mhs-ww-preview" }, [frame])]));
    var inp = X.el("input", { type: "text", readonly: true, value: url(), "aria-label": "URL" });
    var acts = X.el("div", { class: "mhs-actions" }, [
      X.el("button", { type: "button", class: "mhs-btn primary", text: "📲 " + t("add"), on: { click: function () {
        if (window.__mhsBIP && window.__mhsBIP.prompt) { try { window.__mhsBIP.prompt(); return; } catch (e) {} }
        if (window.MHSInstall && window.MHSInstall.guide) { window.MHSInstall.guide(); return; }
        window.open(url(), "_blank", "noopener");
      } } }),
      X.el("a", { class: "mhs-btn", href: url(), target: "_blank", rel: "noopener", text: "↗ " + t("open") }),
      X.el("button", { type: "button", class: "mhs-btn", text: "📋 " + t("copy"), on: { click: function () { (navigator.clipboard ? navigator.clipboard.writeText(url()) : Promise.reject()).then(function () { X.toast(t("copied")); }, function () { inp.select(); }); } } })
    ]);
    var ua = navigator.userAgent, how = /iPhone|iPad|iPod/.test(ua) ? "howIos" : /Android/.test(ua) ? "howAndroid" : "howDesk";
    b.appendChild(X.el("div", { class: "mhs-ww-group" }, [acts, X.el("div", { class: "mhs-ww-url" }, [inp]), X.el("div", { class: "mhs-mini-sec", text: t("howTitle") }), X.el("p", { class: "mhs-mini-note", text: t(how) })]));
  }
  window.MHSWidgetWizard = { open: open, cfg: cfg, save: save, url: url };
  X.action({ k: "widgets", c: "linear-gradient(140deg,#00b8d4,#7c4dff)", icon: "M4 4h7v7H4z|M13 4h7v7h-7z|M4 13h7v7H4z|M13 13h7v7h-7z", label: function () { return t("menu"); }, sub: function () { return t("menuSub"); }, run: open });
  /* keep the localStorage mirror fresh (e.g. after a restore/sync) */
  X.on(function (k) { if (k === "widgetcfg" || k === "*") { var c = X.get("widgetcfg", null); if (c) try { localStorage.setItem("mhs:widgetcfg", JSON.stringify(c)); } catch (e) {} } });
})();
