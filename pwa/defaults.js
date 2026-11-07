/* Smart device-based defaults — on the very first launch: language from navigator.language,
 * theme from prefers-color-scheme (→ "system"), location from the time zone (prayer.js) and, if the
 * user allows it in the wizard, device geolocation. Defaults are shown inside the first-launch
 * wizard, stay configurable in Settings and never block the app when a permission is denied.
 * Loaded early (head, after i18n/store/theme) so the detected language is in place before the UI renders. */
(function () {
  "use strict";
  if (window.MHSDefaults) return;
  var KEY = "muhasabah:data:v1", REC = "mhs:defaults:v1";
  var STR = {
    en: { title: "Detected from your device", lang: "Language", theme: "Theme", loc: "Location", system: "Follows device (dark/light)", tz: "From time zone", gps: "Device location", none: "Not set yet", change: "You can change any of these later in Settings." },
    bn: { title: "আপনার ডিভাইস থেকে শনাক্ত", lang: "ভাষা", theme: "থিম", loc: "লোকেশন", system: "ডিভাইস অনুযায়ী (ডার্ক/লাইট)", tz: "টাইম জোন থেকে", gps: "ডিভাইস লোকেশন", none: "এখনো সেট হয়নি", change: "এগুলো পরে সেটিংসে পরিবর্তন করা যাবে।" },
    ar: { title: "تم اكتشافه من جهازك", lang: "اللغة", theme: "المظهر", loc: "الموقع", system: "حسب الجهاز", tz: "من المنطقة الزمنية", gps: "موقع الجهاز", none: "لم يُضبط بعد", change: "يمكنك تغيير هذه لاحقاً من الإعدادات." }
  };
  function read() { try { return JSON.parse(localStorage.getItem(KEY)) || null; } catch (e) { return null; } }
  function rec() { try { return JSON.parse(localStorage.getItem(REC)) || null; } catch (e) { return null; } }
  var data = read(), first = !data || (!data.onboarded && !data.lang);
  var detected = rec() || {};
  if (first && !detected.at) {
    var I = window.MHSI18n, lang = I && I.deviceLanguage ? I.deviceLanguage() : null;
    if (!lang) { var nl = String(navigator.language || "en").split("-")[0]; lang = ["en", "bn", "ar"].indexOf(nl) >= 0 ? nl : "en"; }
    var light = false; try { light = matchMedia("(prefers-color-scheme: light)").matches; } catch (e) {}
    var tz = ""; try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ""; } catch (e) {}
    detected = { at: Date.now(), lang: lang, theme: "system", light: light, tz: tz };
    try { localStorage.setItem(REC, JSON.stringify(detected)); } catch (e) {}
    // language → stored before the React app boots so it renders in the device language
    try { var d = data || {}; if (!d.lang) { d.lang = lang; localStorage.setItem(KEY, JSON.stringify(d)); } } catch (e) {}
    // Mark this as a fresh install for the app's first-run logic so the welcome wizard still opens.
    try { if (!localStorage.getItem("muhasabah:welcome:v2")) localStorage.setItem("muhasabah:welcome:v2", "1"); } catch (e) {}
    document.documentElement.lang = lang;
    document.documentElement.dir = I && I.dir ? I.dir(lang) : (/^(ar|he|fa|ur)$/.test(lang) ? "rtl" : "ltr");
    // theme → follow the device until the user picks one in Settings
    if (window.MHSTheme) { try { window.MHSTheme.set("system"); } catch (e) {} }
  } else if (detected.theme === "system" && !detected.themeChosen && window.MHSTheme) {
    // keep following the device until the user explicitly chooses a theme
    try { window.MHSTheme.set("system"); } catch (e) {}
  }
  window.addEventListener("mhs:theme-edit", function () { var r = rec() || {}; r.themeChosen = true; try { localStorage.setItem(REC, JSON.stringify(r)); } catch (e) {} });

  function L() { var l = (window.MHSLocale || document.documentElement.lang || "en").split("-")[0]; return STR[l] ? l : "en"; }
  function t(k) { return (STR[L()] || STR.en)[k]; }
  function summary() {
    var r = rec() || {}, p = null;
    try { p = JSON.parse(localStorage.getItem("muhasabah:prayer")) || null; } catch (e) {}
    var langName = r.lang; try { langName = new Intl.DisplayNames([r.lang || "en"], { type: "language" }).of(r.lang || "en") || r.lang; } catch (e) {}
    return { lang: langName || "English", theme: t("system"), loc: p && p.lat != null ? (p.place || p.lat + ", " + p.lng) + " · " + (p.src === "gps" ? t("gps") : t("tz")) : (r.tz ? r.tz + " · " + t("tz") : t("none")) };
  }
  /* Show the detected defaults inside the first-launch wizard's language step. */
  function inject() {
    var slide = document.querySelector(".mhs-ftue-langbox"); if (!slide || slide.parentNode.querySelector(".mhs-defaults-note")) return;
    var s = summary(), p = document.createElement("div"); p.className = "mhs-ftue-note mhs-defaults-note"; p.style.cssText = "margin-top:.6rem;padding:.6rem .75rem;border-radius:.8rem;border:1px dashed hsl(var(--border));font-size:12px;line-height:1.6;text-align:start";
    p.innerHTML = "<b>✨ " + t("title") + "</b><br>🌐 " + t("lang") + ": <b>" + s.lang + "</b> · 🎨 " + t("theme") + ": <b>" + s.theme + "</b><br>📍 " + t("loc") + ": <b>" + s.loc + "</b><br><span style=\"opacity:.75\">" + t("change") + "</span>";
    slide.parentNode.insertBefore(p, slide.nextSibling);
  }
  if (first) { var mo = new MutationObserver(function () { inject(); }); document.addEventListener("DOMContentLoaded", function () { mo.observe(document.body, { childList: true, subtree: true }); inject(); }); }
  window.MHSDefaults = { detected: rec, summary: summary, first: first };
})();
