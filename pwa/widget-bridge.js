/* Widget bridge — runs inside the main app. Home-screen widgets (/widgets/) talk to it over a
 * BroadcastChannel: when the app is open, check-ins and quick to-dos are applied through the app
 * itself (same rules, points, celebrations) and every open widget refreshes instantly. */
(function () {
  "use strict";
  if (window.__mhsWidgetBridge || !("BroadcastChannel" in window)) return;
  window.__mhsWidgetBridge = true;
  var bc = new BroadcastChannel("mhs-widget");
  function snapshot() { return window.MHS && window.MHS.current ? window.MHS.current() : null; }
  function reply(id, extra) {
    // Give React a moment to commit and persist the new state.
    setTimeout(function () { bc.postMessage(Object.assign({ type: "result", id: id, data: snapshot() }, extra || {})); }, 220);
  }
  bc.onmessage = function (e) {
    var m = e.data || {}, app = window.MHSApp;
    if (!app) return; // app not ready yet: the widget falls back to writing directly
    if (m.type === "ping") bc.postMessage({ type: "pong", id: m.id });
    else if (m.type === "check") {
      if (m.kind === "habit" && app.checkHabit) app.checkHabit(m.itemId);
      else if (m.kind === "todo" && app.checkTodo) app.checkTodo(m.itemId);
      reply(m.id);
    } else if (m.type === "addTodo" && app.addTodo) { app.addTodo(m.title); reply(m.id); }
    else if (m.type === "essential") { if (window.MHSEssential) window.MHSEssential.toggle(m.itemId); reply(m.id); }
    else if (m.type === "zikr") {
      try { var X = window.MHSX, z = X.get("zikr", null) || {}; z.log = z.log || {}; var k = X.dayKey(); z.log[k] = z.log[k] || {}; z.log[k][m.itemId] = (Number(z.log[k][m.itemId]) || 0) + (Number(m.n) || 1); z.sel = m.itemId; X.set("zikr", z); } catch (e) {}
      reply(m.id);
    }
  };
  function push() { try { bc.postMessage({ type: "state", data: snapshot() }); } catch (e) {} }
  function hook() { if (window.MHS && window.MHS.onSave) window.MHS.onSave(push); else setTimeout(hook, 300); }
  hook();
})();
