/* Deep links — one router for every mini-app, used by Reminder navigation, notifications, widgets,
 * shares and the web+muhasabah:// protocol handler. Runs BEFORE pwa/actions.js so it can claim
 * `?open=` URLs that carry extra parameters (the plain `?open=<menu-item>` form is still handled
 * by the unified menu).
 *
 *   /?open=quran&s=2&a=255            → Quran reader at Al-Baqarah 255
 *   /?open=hadith&book=bukhari&n=1    → Hadith reader at that entry
 *   /?open=wisdom&id=w-…  (or hikmah) → Wisdom mini-app at that saying
 *   /?open=reminder&id=…              → Reminder feed showing that item
 *   /?open=duas&id=…&cat=…            → Knowledge hub (duas) · /?open=amol&id=… · /?open=names&n=…
 *   /?open=prayer&tab=qibla|mosques|amol|settings · /?open=essential · /?open=widgets · /?open=bookmarks
 *   web+muhasabah:quran/2/255 · hadith/bukhari/1 · wisdom/<id> · dua/<id> · name/<n> */
(function () {
  "use strict";
  if (window.MHSDeepLink) return;
  var url = new URL(location.href), P = url.searchParams;
  var open = P.get("open"), proto = P.get("protocol");
  var params = {};
  P.forEach(function (v, k) { params[k] = v; });
  if (proto) {
    var m = String(proto).replace(/^web\+muhasabah:\/*/, "").split("/").filter(Boolean);
    if (m[0] === "quran") { open = "quran"; params.s = m[1]; params.a = m[2]; }
    else if (m[0] === "hadith") { open = "hadith"; params.book = m[1]; params.n = m[2]; }
    else if (m[0] === "wisdom") { open = "wisdom"; params.id = m[1]; }
    else if (m[0] === "dua") { open = "duas"; params.id = m[1]; }
    else if (m[0] === "name") { open = "names"; params.n = m[1]; }
    else if (m[0] === "amol") { open = "amol"; params.id = m[1]; }
    else if (m[0]) open = m[0];
  }
  var RICH = { quran: ["s", "a"], hadith: ["book", "n"], wisdom: ["id", "q", "cat"], hikmah: ["id", "q", "cat"], reminder: ["id"], duas: ["id", "cat"], amol: ["id", "cat"], names: ["n", "id"], prayer: ["tab"], essential: [], bookmarks: [], widgets: [] };
  function has(keys) { return keys.some(function (k) { return params[k] != null; }); }
  var claim = open && RICH[open] && (RICH[open].length === 0 ? ["essential", "bookmarks", "names", "reminder"].indexOf(open) >= 0 : has(RICH[open]));
  if (claim) {
    try { var u = new URL(location.href); ["open", "protocol"].concat(RICH[open]).forEach(function (k) { u.searchParams.delete(k); }); history.replaceState(history.state, "", u.pathname + (u.search || "") + u.hash); } catch (e) {}
  }
  function when(name, fn) { if (window[name]) return fn(window[name]); var n = 0, iv = setInterval(function () { if (window[name]) { clearInterval(iv); fn(window[name]); } else if (++n > 150) clearInterval(iv); }, 100); }
  function ready(fn) { var n = 0; (function w() { if (window.MHSSheet && !document.getElementById("mhs-startup")) return setTimeout(fn, 350); if (++n < 200) setTimeout(w, 100); })(); }
  function go(kind, p) {
    p = p || {};
    switch (kind) {
      case "quran": return when("MHSQuran", function (Q) { Q.open({ surah: Number(p.s) || 1, ayah: Number(p.a) || 1 }); });
      case "hadith": return when("MHSHadith", function (H) { H.open({ book: p.book || "bukhari", number: Number(p.n) || 1 }); });
      case "wisdom": case "hikmah": return when("MHSWisdomApp", function (W) { W.open({ id: p.id, q: p.q, cat: p.cat }); });
      case "reminder": return when("MHSReminder", function (R) { R.open({ id: p.id }); });
      case "duas": return when("MHSKnowledge", function (K) { K.open({ tab: "duas", id: p.id, cat: p.cat }); });
      case "amol": return when("MHSKnowledge", function (K) { K.open({ tab: "amol", id: p.id, cat: p.cat }); });
      case "names": return when("MHSKnowledge", function (K) { K.open({ tab: "names", id: p.id || (p.n ? "name-" + p.n : null) }); });
      case "prayer": return when("MHSPrayerHub", function (H) { H.open({ tab: p.tab || "times" }); });
      case "essential": return when("MHSPrayerHub", function (H) { H.open({ tab: "amol" }); });
      case "bookmarks": return when("MHSBookmarks", function (B) { B.open(); });
      case "widgets": return when("MHSWidgetWizard", function (W) { W.open(); });
    }
  }
  /* Build a shareable deep link for an item. */
  function link(kind, p) {
    var u = new URL((window.MHSShareConfig && window.MHSShareConfig.url) || location.origin);
    u.searchParams.set("open", kind); Object.keys(p || {}).forEach(function (k) { if (p[k] != null) u.searchParams.set(k, p[k]); });
    return u.toString();
  }
  window.MHSDeepLink = { go: go, link: link, params: params, claimed: claim ? open : null };
  if (claim) ready(function () { go(open, params); });
  /* Notifications opened via the service worker post a message with the URL to open in-place. */
  if (navigator.serviceWorker) navigator.serviceWorker.addEventListener("message", function (e) {
    var d = e.data || {}; if (d.type !== "OPEN_URL" || !d.url) return;
    try { var u = new URL(d.url, location.origin), o = u.searchParams.get("open"), q = {}; u.searchParams.forEach(function (v, k) { q[k] = v; }); if (o) go(o, q); } catch (x) {}
  });
})();
