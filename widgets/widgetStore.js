/* Muhasabah widgets — data layer.
 * Reads and writes the exact same on-device data the main app uses:
 *   localStorage "muhasabah:data:v1" + "muhasabah:savedAt" and IndexedDB "muhasabah" → "kv" → "data".
 * If the full app is open (any tab / the TWA), changes are routed through it over a
 * BroadcastChannel so its state, points and dashboard update in real time. Otherwise the widget
 * writes the change itself, in the same format, and the app picks it up on next launch. */
(function () {
  "use strict";
  var KEY = "muhasabah:data:v1", AT = "muhasabah:savedAt", DB = "muhasabah", STORE = "kv";
  var bc = null;
  try { bc = new BroadcastChannel("mhs-widget"); } catch (e) {}
  var listeners = [];

  function idb() {
    return new Promise(function (res, rej) {
      if (!window.indexedDB) return rej(new Error("no idb"));
      var r = indexedDB.open(DB, 1);
      r.onupgradeneeded = function () { if (!r.result.objectStoreNames.contains(STORE)) r.result.createObjectStore(STORE); };
      r.onsuccess = function () { res(r.result); };
      r.onerror = function () { rej(r.error); };
    });
  }
  function idbGet() {
    return idb().then(function (db) {
      return new Promise(function (res) {
        var q = db.transaction(STORE, "readonly").objectStore(STORE).get("data");
        q.onsuccess = function () { res(q.result || null); }; q.onerror = function () { res(null); };
      });
    }).catch(function () { return null; });
  }
  function idbPut(v) {
    return idb().then(function (db) {
      return new Promise(function (res) {
        var tx = db.transaction(STORE, "readwrite"); tx.objectStore(STORE).put(v, "data");
        tx.oncomplete = function () { res(); }; tx.onerror = function () { res(); };
      });
    }).catch(function () {});
  }
  function lsGet() { try { return { data: JSON.parse(localStorage.getItem(KEY)), savedAt: +localStorage.getItem(AT) || 0 }; } catch (e) { return { data: null, savedAt: 0 }; } }

  function load() {
    var ls = lsGet();
    return Promise.race([idbGet(), new Promise(function (r) { setTimeout(function () { r(null); }, 1500); })]).then(function (rec) {
      if (rec && rec.data && (!ls.data || (rec.savedAt || 0) >= ls.savedAt)) return rec.data;
      return ls.data || {};
    });
  }
  function save(data) {
    var now = Date.now();
    try { localStorage.setItem(KEY, JSON.stringify(data)); localStorage.setItem(AT, String(now)); } catch (e) {}
    return idbPut({ data: data, savedAt: now }).then(function () {
      try { navigator.serviceWorker && navigator.serviceWorker.controller && navigator.serviceWorker.controller.postMessage({ type: "STATE_UPDATED" }); } catch (e) {}
      return data;
    });
  }

  /* Ask the running app (if any) to perform an action. Resolves with fresh data, or null if no app answered. */
  var seq = 0, waiting = {};
  function ask(msg, ms) {
    if (!bc) return Promise.resolve(null);
    var id = "w" + (++seq) + Date.now();
    return new Promise(function (res) {
      waiting[id] = res;
      bc.postMessage(Object.assign({ id: id }, msg));
      setTimeout(function () { if (waiting[id]) { delete waiting[id]; res(null); } }, ms || 450);
    });
  }
  if (bc) bc.onmessage = function (e) {
    var m = e.data || {};
    if (m.id && waiting[m.id] && (m.type === "pong" || m.type === "result")) { var r = waiting[m.id]; delete waiting[m.id]; r(m); }
    if (m.type === "state") listeners.forEach(function (fn) { try { fn(m.data || null); } catch (x) {} });
  };
  window.addEventListener("storage", function (e) { if (e.key === KEY) listeners.forEach(function (fn) { try { fn(null); } catch (x) {} }); });

  /* ---- domain helpers (mirror the main app's rules) ---- */
  var DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  function sameDay(ts, d) { return new Date(ts).toDateString() === (d || new Date()).toDateString(); }
  function deadline(h, d) {
    d = d || new Date();
    var p = null;
    try { p = window.MHSPrayer && window.MHSPrayer.dl ? window.MHSPrayer.dl(h, d) : null; } catch (e) {}
    var grace = Math.max(0, Number(h && h.grace) || 0) * 6e4;
    if (p) return p + grace;
    var x = String(h && h.deadline || "23:59:00").split(":").map(function (v) { return parseInt(v, 10) || 0; });
    return new Date(d.getFullYear(), d.getMonth(), d.getDate(), x[0] || 0, x[1] || 0, x[2] || 0).getTime() + grace;
  }
  function waqtStart(h) { try { return window.MHSPrayer && window.MHSPrayer.start ? window.MHSPrayer.start(h) : null; } catch (e) { return null; } }
  function habitsToday(data) {
    var day = DAYS[new Date().getDay()], ledger = data.ledger || [];
    var done = {}, missed = {}, excused = {};
    ledger.forEach(function (e) {
      if (!sameDay(e.ts)) return;
      if (e.type === "checkIn") done[e.habitId] = true;
      else if (e.type === "autoPenalty") missed[e.habitId] = true;
      else if (e.type === "excuse" && e.habitId) excused[e.habitId] = true;
    });
    return (data.habits || []).filter(function (h) { return h.status === "active" && Array.isArray(h.repeat) && (h.repeat.indexOf(day) !== -1 || h.repeat.indexOf("Everyday") !== -1); })
      .map(function (h) {
        var dl = deadline(h);
        return { h: h, done: !!done[h.id], missed: !!missed[h.id] || (!done[h.id] && Date.now() >= dl), excused: !!excused[h.id], deadline: dl };
      });
  }
  function balance(data) { return (data.ledger || []).reduce(function (s, e) { return s + (Number(e.delta) || 0); }, 0); }
  function streak(data) {
    var set = {};
    (data.ledger || []).forEach(function (e) { if (e.type === "checkIn" || e.type === "todoCheckIn") set[new Date(e.ts).toDateString()] = true; });
    var d = new Date(), n = 0;
    if (!set[d.toDateString()]) d.setDate(d.getDate() - 1);
    while (set[d.toDateString()]) { n++; d.setDate(d.getDate() - 1); }
    return n;
  }
  function hm(ts) { var d = new Date(ts); return (d.getHours() < 10 ? "0" : "") + d.getHours() + ":" + (d.getMinutes() < 10 ? "0" : "") + d.getMinutes(); }

  function checkHabit(id) {
    return ask({ type: "check", kind: "habit", itemId: id }).then(function (r) {
      if (r) return { ok: true, via: "app", data: r.data };
      return load().then(function (data) {
        var item = habitsToday(data).filter(function (x) { return x.h.id === id; })[0];
        if (!item) return { ok: false, reason: "missing" };
        if (item.done) return { ok: true, data: data };
        if (item.missed) return { ok: false, reason: "deadline" };
        var st = waqtStart(item.h); if (st && Date.now() < st) return { ok: false, reason: "waqt", at: hm(st) };
        var now = Date.now(), entry = { id: "l" + now, ts: now, delta: Number(item.h.points) || 0, reason: item.h.title, note: "Widget • " + new Date().toLocaleString() + " • On-time", type: "checkIn", habitId: item.h.id };
        data.ledger = [entry].concat(data.ledger || []);
        return save(data).then(function () { return { ok: true, via: "widget", data: data, delta: entry.delta }; });
      });
    });
  }
  function checkTodo(id) {
    return ask({ type: "check", kind: "todo", itemId: id }).then(function (r) {
      if (r) return { ok: true, via: "app", data: r.data };
      return load().then(function (data) {
        var td = (data.todos || []).filter(function (x) { return x.id === id; })[0];
        if (!td) return { ok: false, reason: "missing" };
        if (td.status === "done") return { ok: true, data: data };
        var now = Date.now(), pts = Math.abs(Number(td.points) || 0);
        data.todos = data.todos.map(function (x) { return x.id === id ? Object.assign({}, x, { status: "done", doneAt: now }) : x; });
        data.ledger = [{ id: "l" + now, ts: now, delta: pts, reason: td.title, note: "Todo • Widget • On-time", type: "todoCheckIn", todoId: id }].concat(data.ledger || []);
        return save(data).then(function () { return { ok: true, via: "widget", data: data, delta: pts }; });
      });
    });
  }
  function addTodo(title) {
    title = String(title || "").trim();
    if (title.length < 2) return Promise.resolve({ ok: false, reason: "short" });
    return ask({ type: "addTodo", title: title }).then(function (r) {
      if (r) return { ok: true, via: "app", data: r.data };
      return load().then(function (data) {
        var p = data.todoPrefs || {};
        var td = { id: "t" + Date.now() + Math.random(), title: title, points: Math.max(0, Number(p.points) || 0), penalty: Math.max(0, Number(p.penalty) || 0), deadline: p.deadline || "23:59:00", icon: "📌", status: "active", doneAt: null, createdAt: Date.now() };
        data.todos = [td].concat(data.todos || []);
        return save(data).then(function () { return { ok: true, via: "widget", data: data }; });
      });
    });
  }

  /* Essential amol check-in (Prayer hub list) — via the app when open, else written directly. */
  function toggleEssential(id) {
    return ask({ type: "essential", itemId: id }).then(function (r) {
      if (r) return { ok: true, via: "app", data: r.data };
      var C = window.MHSEssentialCore; if (!C) return { ok: false, reason: "missing" };
      return load().then(function (data) {
        data.x = data.x || {};
        var res = C.toggleIn(data.x.essential || {}, id);
        data.x.essential = res.data;
        return save(data).then(function () { return { ok: true, via: "widget", data: data, on: res.on }; });
      });
    });
  }
  /* One zikr tap: increments today's count for `zid` in the zikr log. */
  function zikrTap(zid, n) {
    n = n || 1;
    return ask({ type: "zikr", itemId: zid, n: n }).then(function (r) {
      if (r) return { ok: true, via: "app", data: r.data };
      return load().then(function (data) {
        data.x = data.x || {}; var z = data.x.zikr || {}; z.log = z.log || {};
        var d = new Date(), k = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
        z.log[k] = z.log[k] || {}; z.log[k][zid] = (Number(z.log[k][zid]) || 0) + n; z.sel = zid;
        data.x.zikr = z;
        return save(data).then(function () { return { ok: true, via: "widget", data: data }; });
      });
    });
  }

  window.MHSWidgetStore = { load: load, save: save, habitsToday: habitsToday, balance: balance, streak: streak, checkHabit: checkHabit, checkTodo: checkTodo, addTodo: addTodo, toggleEssential: toggleEssential, zikrTap: zikrTap, ask: ask, onChange: function (fn) { listeners.push(fn); }, hm: hm };
})();
