/* Muhasabah widgets — tiny shared renderer: i18n, element builder, progress ring, toasts. */
(function () {
  "use strict";
  var lang = (function () {
    try {
      var d = JSON.parse(localStorage.getItem("muhasabah:data:v1") || "{}") || {};
      var l = String(d.lang || navigator.language || "en").toLowerCase().split("-")[0];
      return l === "bn" || l === "ar" ? l : "en";
    } catch (e) { return "en"; }
  })();
  var STR = {
    en: { today: "Today", habits: "Habits", todo: "To-Do", open: "Open app", points: "Points", streak: "Streak", days: "days", done: "done", of: "of",
      noHabits: "No habits due today.", noTodos: "All clear — add a to-do below.", add: "Add a to-do…", addBtn: "Add", synced: "Saved on this device", live: "Synced live with the app",
      deadline: "Deadline passed", waqt: "Waqt starts at {t}", missing: "Item not found", checked: "+{p} points", added: "To-do added", short: "Type at least 2 characters", pin: "Tip: add this page to your home screen for one-tap check-ins.", missed: "Missed", due: "until {t}" },
    bn: { today: "আজ", habits: "অভ্যাস", todo: "করণীয়", open: "অ্যাপ খুলুন", points: "পয়েন্ট", streak: "ধারা", days: "দিন", done: "সম্পন্ন", of: "/",
      noHabits: "আজ কোনো অভ্যাস নেই।", noTodos: "সব শেষ — নিচে নতুন করণীয় যোগ করুন।", add: "নতুন করণীয়…", addBtn: "যোগ", synced: "এই ডিভাইসে সংরক্ষিত", live: "অ্যাপের সাথে লাইভ সিঙ্ক",
      deadline: "সময় শেষ", waqt: "ওয়াক্ত শুরু {t}-এ", missing: "আইটেম পাওয়া যায়নি", checked: "+{p} পয়েন্ট", added: "করণীয় যোগ হয়েছে", short: "অন্তত ২ অক্ষর লিখুন", pin: "টিপ: এক ট্যাপে চেক-ইনের জন্য এই পেজটি হোম স্ক্রিনে যোগ করুন।", missed: "মিস", due: "{t} পর্যন্ত" },
    ar: { today: "اليوم", habits: "العادات", todo: "المهام", open: "افتح التطبيق", points: "النقاط", streak: "السلسلة", days: "أيام", done: "تم", of: "من",
      noHabits: "لا عادات اليوم.", noTodos: "لا مهام — أضف مهمة.", add: "أضف مهمة…", addBtn: "أضف", synced: "محفوظ على هذا الجهاز", live: "متزامن مع التطبيق",
      deadline: "انتهى الموعد", waqt: "يبدأ الوقت {t}", missing: "غير موجود", checked: "+{p} نقطة", added: "تمت الإضافة", short: "اكتب حرفين على الأقل", pin: "أضف هذه الصفحة إلى الشاشة الرئيسية.", missed: "فائت", due: "حتى {t}" }
  };
  function t(k, v) { var s = (STR[lang] || STR.en)[k] || STR.en[k] || k; if (v) Object.keys(v).forEach(function (x) { s = s.split("{" + x + "}").join(v[x]); }); return s; }
  function num(n) { try { return new Intl.NumberFormat(lang === "bn" ? "bn-BD" : lang === "ar" ? "ar" : "en-US").format(n); } catch (e) { return String(n); } }
  function el(tag, a, kids) {
    var n = document.createElement(tag);
    if (a) Object.keys(a).forEach(function (k) {
      var v = a[k]; if (v == null || v === false) return;
      if (k === "text") n.textContent = v; else if (k === "on") Object.keys(v).forEach(function (e) { n.addEventListener(e, v[e]); }); else if (k === "class") n.className = v; else n.setAttribute(k, v === true ? "" : v);
    });
    (kids || []).forEach(function (c) { if (c != null && c !== false) n.appendChild(typeof c === "string" ? document.createTextNode(c) : c); });
    return n;
  }
  function ring(p, size) {
    size = size || 64; var s = 6, r = (size - s) / 2, c = 2 * Math.PI * r;
    var ns = "http://www.w3.org/2000/svg", svg = document.createElementNS(ns, "svg");
    svg.setAttribute("viewBox", "0 0 " + size + " " + size); svg.setAttribute("width", size); svg.setAttribute("height", size); svg.setAttribute("aria-hidden", "true");
    [["rgba(255,255,255,.08)", c], ["#00e676", c * Math.max(0, Math.min(1, p))]].forEach(function (x, i) {
      var ci = document.createElementNS(ns, "circle");
      ci.setAttribute("cx", size / 2); ci.setAttribute("cy", size / 2); ci.setAttribute("r", r); ci.setAttribute("fill", "none"); ci.setAttribute("stroke", x[0]); ci.setAttribute("stroke-width", s);
      if (i) { ci.setAttribute("stroke-linecap", "round"); ci.setAttribute("stroke-dasharray", x[1].toFixed(2) + " " + c.toFixed(2)); ci.setAttribute("transform", "rotate(-90 " + size / 2 + " " + size / 2 + ")"); }
      svg.appendChild(ci);
    });
    return svg;
  }
  var toastT = null;
  function toast(msg, kind) {
    var n = document.getElementById("wg-toast");
    if (!n) { n = el("div", { id: "wg-toast", role: "status", "aria-live": "polite" }); document.body.appendChild(n); }
    n.textContent = msg; n.className = "show" + (kind ? " " + kind : "");
    clearTimeout(toastT); toastT = setTimeout(function () { n.className = ""; }, 2200);
  }
  function haptic(p) { try { navigator.vibrate && navigator.vibrate(p || 12); } catch (e) {} }
  /* Circular checkbox shared by habit and to-do rows. */
  function check(done, label, onTap, disabled) {
    var b = el("button", { type: "button", class: "wg-check" + (done ? " is-done" : ""), role: "checkbox", "aria-checked": done ? "true" : "false", "aria-label": label, disabled: disabled ? true : null });
    b.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
    if (onTap) b.addEventListener("click", onTap);
    return b;
  }
  function setLang(l) {
    l = String(l || "").toLowerCase().split("-")[0];
    if (!STR[l]) l = "en";
    lang = l;
    document.documentElement.lang = l;
    document.documentElement.dir = l === "ar" ? "rtl" : "ltr";
  }
  setLang(lang);
  window.MHSWidgetUI = { t: t, num: num, el: el, ring: ring, toast: toast, haptic: haptic, check: check, setLang: setLang };
})();
