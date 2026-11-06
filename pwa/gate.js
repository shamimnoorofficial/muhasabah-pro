/* Muhasabah entitlements — one place that decides what each plan unlocks.
 *
 *   Free          everything on this device (habits, to-dos, notes, ledger, zikr, journal, restore points)
 *   Pro Lifetime  one-time payment: manual Export/Import, folder & file backups, instant Google Drive
 *                 auto-sync (incl. notes & ledgers), CSV exports and advanced analytics
 *   Cloud Monthly subscription: encrypted copy on the Muhasabah server, sign in on any device
 *
 * Checkout is delegated to `window.MuhasabahPro.open()` (pro.js), which talks to /api/pro.
 * The payment processor (Lemon Squeezy, Stripe…) is chosen server-side from environment
 * variables, so connecting a gateway never requires changes here.
 *
 * API: MHSGate.tier() → "free" | "lifetime" | "cloud" | "both"
 *      MHSGate.has(feature) → boolean
 *      MHSGate.require(feature, fn) → runs fn if unlocked, otherwise shows the upgrade prompt
 *      MHSGate.prompt(feature) */
(function () {
  "use strict";
  if (window.MHSGate) return;
  var X = window.MHSX;
  var FEATURES = {
    backup: "lifetime",   // Export / Import file, folder backups, share backup file
    drive: "lifetime",    // Google Drive auto-sync
    media: "lifetime",    // notes (text, checklists) in Google Drive sync; media files stay on device
    csv: "lifetime",      // ledger / notes CSV export
    analytics: "lifetime",// 30/90-day trends on the Home overview
    server: "cloud"       // server sync & multi-device login
  };
  var t = X.tr({
    en: {
      locked: "Pro feature", getPro: "Get Pro", notNow: "Not now", current: "Your plan", popular: "Best value",
      free: "Free", freePrice: "$0", freeSub: "Forever, on this device",
      life: "Pro Lifetime", lifeSub: "One-time payment · yours forever",
      cloud: "Cloud Monthly", cloudSub: "Server sync · cancel anytime", perMonth: "/month", once: "once",
      compareTitle: "Plans & backup", compareSub: "Your data always stays on your device. Upgrade to keep a copy somewhere safe.",
      f_local: "Habits, to-dos, notes, ledger, zikr & journal", f_restore: "30 daily restore points", f_offline: "Works fully offline",
      f_export: "Export & Import backup files", f_drive: "Instant Google Drive auto-sync", f_media: "Notes & ledger included in Drive sync", f_csv: "CSV export for ledgers & notes", f_analytics: "30 & 90-day deep analytics",
      f_server: "Secure copy on our server", f_multi: "Sign in on any device, data follows", f_recover: "Recover data with your account",
      backup: "Export & Import are part of Pro", backupB: "Make a backup file, restore it on any phone and keep folder backups — unlocked forever with one payment.",
      drive: "Google Drive sync is part of Pro", driveB: "Your habits, notes, ledgers and journal sync instantly to a private folder in your own Google Drive.",
      media: "Notes sync is part of Pro", mediaB: "Your notes, checklists and ledgers sync to your own Google Drive with Pro. Photos, audio and video stay on this device.",
      csv: "CSV export is part of Pro", csvB: "Open your ledger in Google Sheets or Excel with one tap.",
      analytics: "Deep analytics are part of Pro", analyticsB: "See 30 and 90-day trends for every module and your Nafs · Qalb · Ruh balance over time.",
      server: "Server sync needs Cloud Monthly", serverB: "Keep your data on the Muhasabah server and continue on any device by signing in.",
      unavailable: "Checkout is not available right now. Please try again later."
    },
    bn: {
      locked: "প্রো ফিচার", getPro: "প্রো নিন", notNow: "এখন না", current: "আপনার প্ল্যান", popular: "সেরা মূল্য",
      free: "ফ্রি", freePrice: "$0", freeSub: "চিরকাল, এই ডিভাইসে",
      life: "প্রো লাইফটাইম", lifeSub: "এককালীন পেমেন্ট · চিরদিনের জন্য",
      cloud: "ক্লাউড মাসিক", cloudSub: "সার্ভার সিঙ্ক · যেকোনো সময় বাতিল", perMonth: "/মাস", once: "একবার",
      compareTitle: "প্ল্যান ও ব্যাকআপ", compareSub: "আপনার ডেটা সবসময় ডিভাইসেই থাকে। নিরাপদ কপি রাখতে আপগ্রেড করুন।",
      f_local: "অভ্যাস, করণীয়, নোট, হিসাব, জিকির ও দিনলিপি", f_restore: "৩০ দিনের রিস্টোর পয়েন্ট", f_offline: "সম্পূর্ণ অফলাইনে চলে",
      f_export: "ব্যাকআপ ফাইল এক্সপোর্ট ও ইমপোর্ট", f_drive: "Google Drive-এ তাৎক্ষণিক অটো-সিঙ্ক", f_media: "নোট ও হিসাব Drive সিঙ্কে অন্তর্ভুক্ত", f_csv: "হিসাব ও নোটের CSV এক্সপোর্ট", f_analytics: "৩০ ও ৯০ দিনের গভীর বিশ্লেষণ",
      f_server: "আমাদের সার্ভারে নিরাপদ কপি", f_multi: "যেকোনো ডিভাইসে সাইন ইন, ডেটা সাথে থাকবে", f_recover: "অ্যাকাউন্ট দিয়ে ডেটা পুনরুদ্ধার",
      backup: "এক্সপোর্ট ও ইমপোর্ট প্রো-এর অংশ", backupB: "ব্যাকআপ ফাইল বানান, যেকোনো ফোনে রিস্টোর করুন ও ফোল্ডার ব্যাকআপ রাখুন — একবার পেমেন্টে চিরদিন।",
      drive: "Google Drive সিঙ্ক প্রো-এর অংশ", driveB: "আপনার অভ্যাস, নোট, হিসাব ও দিনলিপি নিজের Google Drive-এর গোপন ফোল্ডারে তাৎক্ষণিক সিঙ্ক হয়।",
      media: "নোট সিঙ্ক প্রো-এর অংশ", mediaB: "প্রো-তে আপনার নোট, চেকলিস্ট ও হিসাব নিজের Google Drive-এ সিঙ্ক হয়। ছবি, অডিও ও ভিডিও এই ডিভাইসেই থাকে।",
      csv: "CSV এক্সপোর্ট প্রো-এর অংশ", csvB: "এক ট্যাপে আপনার হিসাব Google Sheets বা Excel-এ খুলুন।",
      analytics: "গভীর বিশ্লেষণ প্রো-এর অংশ", analyticsB: "প্রতিটি মডিউলের ৩০ ও ৯০ দিনের ট্রেন্ড এবং নফস · কলব · রূহ-এর ভারসাম্য দেখুন।",
      server: "সার্ভার সিঙ্কের জন্য ক্লাউড মাসিক লাগবে", serverB: "ডেটা মুহাসাবা সার্ভারে রাখুন এবং সাইন ইন করে যেকোনো ডিভাইসে চালিয়ে যান।",
      unavailable: "এই মুহূর্তে পেমেন্ট চালু নেই। পরে আবার চেষ্টা করুন।"
    }
  });

  function state() { try { return window.MuhasabahPro && window.MuhasabahPro.state && window.MuhasabahPro.state(); } catch (e) { return null; } }
  function member() { var s = state(); return s && s.member || null; }
  function cachedPro() { try { return localStorage.getItem("mhs:pro") === "1"; } catch (e) { return false; } }
  function tier() {
    var m = member(), s = state();
    if (!m && (!s || s.unreachable)) return cachedPro() ? "lifetime" : "free"; // offline: trust the last known state
    if (!m) return "free";
    var life = !!(m.lifetime || (m.pro && !(m.monthly && m.monthly.active))), cloud = !!(m.monthly && m.monthly.active);
    return life && cloud ? "both" : life ? "lifetime" : cloud ? "cloud" : m.pro ? "lifetime" : "free";
  }
  function has(feature) {
    var need = FEATURES[feature] || "lifetime", tr = tier();
    if (tr === "both") return true;
    if (need === "cloud") return tr === "cloud";
    // Any paid plan unlocks the lifetime set — a Cloud subscriber should never be blocked from exporting.
    return tr === "lifetime" || tr === "cloud";
  }
  function plans() {
    var s = state();
    return (s && s.plans) || { lifetime: 10, monthly: 1 };
  }
  function price(v) {
    try { return new Intl.NumberFormat(X.locale(), { style: "currency", currency: "USD", maximumFractionDigits: v % 1 ? 2 : 0 }).format(v); } catch (e) { return "$" + v; }
  }

  function checkout(plan) {
    if (window.MuhasabahPro && window.MuhasabahPro.open) return window.MuhasabahPro.open(plan === "member" ? "member" : undefined);
    X.toast(t("unavailable"));
  }

  var dlg = null;
  function prompt(feature) {
    if (dlg) { try { dlg.close(); } catch (e) {} dlg.remove(); }
    var need = FEATURES[feature] || "lifetime", p = plans();
    var list = need === "cloud" ? ["f_server", "f_multi", "f_recover"] : ["f_export", "f_drive", "f_media", "f_csv", "f_analytics"];
    dlg = X.el("dialog", { class: "mhs-gate", "aria-labelledby": "mhs-gate-h", dir: document.documentElement.dir || "ltr" }, [
      X.el("div", { class: "mhs-gate-card" }, [
        X.el("div", { class: "mhs-gate-crest", "aria-hidden": "true" }, [X.icon("lock")]),
        X.el("div", { class: "mhs-gate-eyebrow", text: t("locked") }),
        X.el("h2", { id: "mhs-gate-h", text: t(feature) }),
        X.el("p", { text: t(feature + "B") }),
        X.el("ul", { class: "mhs-gate-list" }, list.map(function (k) { return X.el("li", null, [X.el("span", { class: "ck", "aria-hidden": "true" }, [X.icon("check")]), t(k)]); })),
        X.el("div", { class: "mhs-gate-price" }, need === "cloud"
          ? [X.el("b", { text: price(p.monthly) }), X.el("span", { text: t("perMonth") + " · " + t("cloud") })]
          : [X.el("b", { text: price(p.lifetime) }), X.el("span", { text: t("once") + " · " + t("life") })]),
        X.el("button", { type: "button", class: "mhs-gate-go", on: { click: function () { dlg.close(); checkout(); } } }, [t("getPro")]),
        X.el("button", { type: "button", class: "mhs-gate-later", text: t("notNow"), on: { click: function () { dlg.close(); } } })
      ])
    ]);
    dlg.addEventListener("click", function (e) { if (e.target === dlg) dlg.close(); });
    dlg.addEventListener("close", function () { var d = dlg; setTimeout(function () { d && d.remove(); }, 200); dlg = null; });
    document.body.appendChild(dlg);
    try { dlg.showModal(); } catch (e) { dlg.setAttribute("open", ""); }
    X.haptic(10);
  }
  function require(feature, fn) {
    if (has(feature)) { if (fn) fn(); return true; }
    prompt(feature);
    return false;
  }

  /* Gate the device backup panel (folder backup / share backup file) and the backup nudge.
   * Restore points and storage protection stay free. */
  document.addEventListener("click", function (e) {
    var b = e.target && e.target.closest && e.target.closest("mhs-backup .mhs-sec .mhs-actions button, #mhs-backup-bar button:not(.x), [data-mhs-gate]");
    if (!b) return;
    var f = b.getAttribute("data-mhs-gate") || "backup";
    if (!has(f)) { e.preventDefault(); e.stopImmediatePropagation(); prompt(f); }
  }, true);

  /* <mhs-plans> — clear Free vs Pro Lifetime vs Cloud Monthly comparison in Settings → Backup. */
  function renderPlans(host) {
    var p = plans(), tr = tier();
    function col(key, priceText, sub, feats, cls, cta) {
      var isCur = key === "free" ? tr === "free" : key === "life" ? tr === "lifetime" || tr === "both" : tr === "cloud" || tr === "both";
      return X.el("div", { class: "mhs-plan " + cls + (isCur ? " is-current" : "") }, [
        cls === "is-life" ? X.el("span", { class: "mhs-plan-flag", text: t("popular") }) : null,
        X.el("div", { class: "mhs-plan-name", text: t(key) }),
        X.el("div", { class: "mhs-plan-price" }, [X.el("b", { text: priceText }), X.el("span", { text: sub })]),
        X.el("ul", null, feats.map(function (f) { return X.el("li", null, [X.el("span", { class: "ck", "aria-hidden": "true" }, [X.icon("check")]), t(f)]); })),
        isCur ? X.el("div", { class: "mhs-plan-cur", text: "✓ " + t("current") }) : cta
      ]);
    }
    var go = function (label) { return X.el("button", { type: "button", class: "mhs-plan-go", text: label, on: { click: function () { checkout(); } } }); };
    host.replaceChildren(X.el("section", { class: "panel mhs-plans", "aria-labelledby": "mhs-plans-h", dir: X.lang() === "ar" ? "rtl" : "ltr" }, [
      X.el("div", { class: "mhs-plans-head" }, [X.el("h3", { id: "mhs-plans-h", text: t("compareTitle") }), X.el("p", { text: t("compareSub") })]),
      X.el("div", { class: "mhs-plans-grid" }, [
        col("free", t("freePrice"), t("freeSub"), ["f_local", "f_restore", "f_offline"], "is-free", null),
        col("life", price(p.lifetime), t("once") + " · " + t("lifeSub"), ["f_export", "f_drive", "f_media", "f_csv", "f_analytics"], "is-life", go(t("getPro"))),
        col("cloud", price(p.monthly) + t("perMonth"), t("cloudSub"), ["f_server", "f_multi", "f_recover"], "is-cloud", go(t("getPro")))
      ])
    ]));
  }
  if (window.customElements && !customElements.get("mhs-plans")) {
    customElements.define("mhs-plans", class extends HTMLElement {
      connectedCallback() {
        var self = this;
        renderPlans(this);
        this._h = function () { renderPlans(self); };
        document.addEventListener("mhs:pro-change", this._h);
      }
      disconnectedCallback() { document.removeEventListener("mhs:pro-change", this._h); }
      static get observedAttributes() { return ["lang"]; }
      attributeChangedCallback() { if (this.isConnected) renderPlans(this); }
    });
  }

  /* Reflect the tier on <html> so CSS can show lock badges on gated controls. */
  function mark() {
    var tr = tier();
    document.documentElement.classList.toggle("mhs-can-backup", has("backup"));
    document.documentElement.setAttribute("data-mhs-tier", tr);
  }
  document.addEventListener("mhs:pro-change", mark);
  mark();

  window.MHSGate = { tier: tier, has: has, require: require, prompt: prompt, features: FEATURES, checkout: checkout };
})();
