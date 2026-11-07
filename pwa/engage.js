/* 3-day engagement prompt — tracks consecutive active days locally (privacy-friendly: just day keys
 * on this device), and after 3 consecutive days shows one tasteful bottom sheet asking the user to
 * share the app, with a 30-day cooldown and "don't show again". Share uses the central share service;
 * on the Play (TWA) build an optional "Rate us" opens the store listing. */
(function () {
  "use strict";
  if (window.MHSEngage) return;
  var KEY = "mhs:engage:v1", COOLDOWN = 30 * 864e5, DELAY = 9000;
  var STR = {
    en: { title: "Alhamdulillah — 3 days together", body: "If Muhasabah-Pro has been useful to you, please share it with your friends. May Allah arrange your life beautifully. Ameen.", share: "Share the app", rate: "Rate us on Google Play", later: "Maybe later", never: "Don't show again" },
    bn: { title: "আলহামদুলিল্লাহ — ৩ দিন একসাথে", body: "আপনি যদি আমাদের অ্যাপটি ব্যবহার করে সন্তুষ্ট হয়ে থাকেন, তবে দয়া করে এটি আপনার বন্ধুদের সাথে শেয়ার করুন। আল্লাহ তায়ালা যেন আপনার জীবনটাকে অনেক সুন্দরভাবে গুছিয়ে দেন। আমীন।", share: "অ্যাপটি শেয়ার করুন", rate: "Google Play-তে রেটিং দিন", later: "পরে", never: "আর দেখাবেন না" },
    ar: { title: "الحمد لله — ثلاثة أيام معاً", body: "إن كان تطبيق محاسبة برو نافعاً لك، فشاركه مع أصدقائك. جعل الله حياتك مرتّبة جميلة. آمين.", share: "شارك التطبيق", rate: "قيّمنا على Google Play", later: "لاحقاً", never: "لا تُظهر مجدداً" }
  };
  function lang() { var l = (window.MHSLocale || document.documentElement.lang || "en").split("-")[0]; if (window.MHSI18n && window.MHSI18n.base) l = window.MHSI18n.base(l); return STR[l] ? l : "en"; }
  function t(k) { return (STR[lang()] || STR.en)[k]; }
  function state() { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } }
  function save(s) { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) {} }
  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function key(d) { return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); }
  function isTwa() { try { return /android-app:\/\//.test(document.referrer) || new URLSearchParams(location.search).get("source") === "twa" || sessionStorage.getItem("mhs:twa") === "1"; } catch (e) { return false; } }
  if (isTwa()) try { sessionStorage.setItem("mhs:twa", "1"); } catch (e) {}

  function touch() {
    var s = state(), today = key(new Date()), days = Array.isArray(s.days) ? s.days : [];
    if (days.indexOf(today) < 0) days.push(today);
    days = days.filter(function (k) { return k >= key(new Date(Date.now() - 14 * 864e5)); }).sort();
    s.days = days; save(s);
    return s;
  }
  function streak(days) {
    var n = 0, d = new Date();
    while (days.indexOf(key(d)) >= 0) { n++; d.setDate(d.getDate() - 1); }
    return n;
  }
  function shouldShow(s) {
    if (s.never) return false;
    if (s.shownAt && Date.now() - s.shownAt < COOLDOWN) return false;
    return streak(s.days || []) >= 3;
  }
  function show() {
    if (document.querySelector("dialog[open]") || document.getElementById("mhs-startup")) { setTimeout(show, 4000); return; }
    var s = state(); s.shownAt = Date.now(); s.shown = (s.shown || 0) + 1; save(s);
    var d = document.createElement("dialog"); d.className = "mhs-eng"; d.setAttribute("dir", document.documentElement.dir || "ltr"); d.setAttribute("aria-label", t("title"));
    function b(cls, text, fn) { var x = document.createElement("button"); x.type = "button"; x.className = cls; x.textContent = text; x.addEventListener("click", fn); return x; }
    var acts = document.createElement("div"); acts.className = "acts";
    acts.appendChild(b("mhs-btn primary", "↗ " + t("share"), function () { d.close(); setTimeout(function () { window.MHSShare && window.MHSShare.invite(); }, 80); }));
    if (isTwa() && window.MHSShareConfig) { var a = document.createElement("a"); a.className = "mhs-btn"; a.href = window.MHSShareConfig.playUrl; a.target = "_blank"; a.rel = "noopener noreferrer"; a.textContent = "⭐ " + t("rate"); a.addEventListener("click", function () { d.close(); }); acts.appendChild(a); }
    acts.appendChild(b("later", t("later"), function () { d.close(); }));
    acts.appendChild(b("later", t("never"), function () { var st = state(); st.never = true; save(st); d.close(); }));
    var ico = document.createElement("span"); ico.className = "ico"; ico.textContent = "🤲"; ico.setAttribute("aria-hidden", "true");
    var h = document.createElement("h3"); h.textContent = t("title");
    var p = document.createElement("p"); p.textContent = t("body");
    d.append(ico, h, p, acts);
    d.addEventListener("click", function (e) { if (e.target === d) d.close(); });
    d.addEventListener("close", function () { d.remove(); });
    document.body.appendChild(d);
    try { d.showModal(); } catch (e) { d.remove(); }
  }
  function boot() {
    var s = touch();
    if (shouldShow(s)) setTimeout(show, DELAY);
  }
  window.MHSEngage = { state: state, streak: function () { return streak(state().days || []); }, show: show, reset: function () { save({}); } };
  if (document.readyState === "complete") boot(); else window.addEventListener("load", boot);
  document.addEventListener("visibilitychange", function () { if (!document.hidden) touch(); });
})();
