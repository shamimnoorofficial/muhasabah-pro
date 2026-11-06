/* Muhasabah suite core — shared helpers for the integrated mini-apps (Notes, Ledger, Zikr, Amol,
 * Home overview, widgets). Zero dependencies.
 *
 * Data lives inside the main app data object under `x` (see store.js → MHS.extra / MHS.setExtra),
 * so everything a mini-app saves is part of the local backup, the Google Drive sync (Pro) and the
 * server sync (Cloud) automatically. Large media (photos, audio, video) are stored as Blobs in
 * IndexedDB under "media:<id>" keys and never inflate the JSON backup. */
(function () {
  "use strict";
  if (window.MHSX) return;

  var LS_PREFIX = "mhs:x:"; // fallback/cache while the main store has not loaded yet

  function lang() {
    var l = (window.MHSLocale || document.documentElement.lang || "en").toLowerCase();
    if (window.MHSI18n && window.MHSI18n.base) l = window.MHSI18n.base(l);
    l = l.split("-")[0];
    return l === "bn" || l === "ar" ? l : "en";
  }
  function locale() {
    var l = lang();
    return l === "bn" ? "bn-BD" : l === "ar" ? "ar" : "en-US";
  }
  /* tr({en:{..}, bn:{..}}) → t(key, vars) with English fallback. */
  function tr(dict) {
    return function (key, vars) {
      var d = dict[lang()] || dict.en;
      var s = d[key];
      if (s == null) s = dict.en[key];
      if (s == null) s = key;
      if (vars) Object.keys(vars).forEach(function (k) { s = String(s).split("{" + k + "}").join(vars[k]); });
      return s;
    };
  }

  function el(tag, attrs, kids) {
    var n = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      var v = attrs[k];
      if (v == null || v === false) return;
      if (k === "text") n.textContent = v;
      else if (k === "html") n.innerHTML = v;
      else if (k === "on") Object.keys(v).forEach(function (ev) { n.addEventListener(ev, v[ev]); });
      else if (k === "class") n.className = v;
      else if (k === "style" && typeof v === "object") Object.keys(v).forEach(function (sk) { if (sk.indexOf("--") === 0) n.style.setProperty(sk, v[sk]); else n.style[sk] = v[sk]; });
      else if (v === true) n.setAttribute(k, "");
      else n.setAttribute(k, v);
    });
    (kids || []).forEach(function (c) {
      if (c == null || c === false) return;
      n.appendChild(typeof c === "string" || typeof c === "number" ? document.createTextNode(String(c)) : c);
    });
    return n;
  }
  function icon(paths) {
    var s = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    s.setAttribute("viewBox", "0 0 24 24");
    s.setAttribute("aria-hidden", "true");
    paths.split("|").forEach(function (d) {
      var p = document.createElementNS(s.namespaceURI, "path");
      p.setAttribute("d", d);
      s.appendChild(p);
    });
    return s;
  }
  var ICONS = {
    plus: "M12 5v14|M5 12h14",
    search: "M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z|M21 21l-4.3-4.3",
    calc: "M6 2h12a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Z|M8 6h8|M8 11h.01|M12 11h.01|M16 11h.01|M8 15h.01|M12 15h.01|M16 15h.01|M8 19h8",
    pin: "M12 17v5|M9 3h6l-1 6 4 4H6l4-4-1-6Z",
    archive: "M21 8v13H3V8|M1 3h22v5H1z|M10 12h4",
    trash: "M3 6h18|M8 6V4h8v2|M19 6l-1 14H6L5 6",
    image: "M3 5h18v14H3z|M3 16l5-5 4 4 3-3 6 6|M15.5 9.5a1.5 1.5 0 1 0 0-.01",
    mic: "M12 2a3 3 0 0 1 3 3v6a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3Z|M19 10v1a7 7 0 0 1-14 0v-1|M12 18v4",
    video: "M2 6h13v12H2z|M15 10l7-4v12l-7-4",
    share: "M4 12v8h16v-8|M12 3v13|M7 8l5-5 5 5",
    check: "M5 12l5 5L20 7",
    x: "M18 6 6 18|M6 6l12 12",
    edit: "M12 20h9|M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z",
    undo: "M9 14 4 9l5-5|M4 9h11a5 5 0 0 1 0 10h-3",
    reset: "M3 12a9 9 0 1 0 3-6.7L3 8|M3 3v5h5",
    sound: "M11 5 6 9H2v6h4l5 4V5Z|M15.5 8.5a5 5 0 0 1 0 7|M19 5a10 10 0 0 1 0 14",
    vibrate: "M8 3h8v18H8z|M3 8v8|M21 8v8",
    table: "M3 4h18v16H3z|M3 10h18|M3 15h18|M9 4v16",
    list: "M8 6h13|M8 12h13|M8 18h13|M3 6h.01|M3 12h.01|M3 18h.01",
    download: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4|M7 10l5 5 5-5|M12 15V3",
    book: "M4 19.5A2.5 2.5 0 0 1 6.5 17H20V2H6.5A2.5 2.5 0 0 0 4 4.5v15Z|M4 19.5A2.5 2.5 0 0 0 6.5 22H20",
    note: "M4 4h16v12l-4 4H4z|M16 20v-4h4|M8 9h8|M8 13h5",
    ledger: "M4 3h16v18H4z|M8 7h8|M8 11h8|M8 15h4|M15 15h1",
    beads: "M12 3a2 2 0 1 0 0 .01|M6 7a2 2 0 1 0 0 .01|M18 7a2 2 0 1 0 0 .01|M5 14a2 2 0 1 0 0 .01|M19 14a2 2 0 1 0 0 .01|M12 18v3|M10 21h4",
    mosque: "M12 2v3|M7 10a5 5 0 0 1 10 0|M5 10h14v10H5z|M10 20v-5a2 2 0 0 1 4 0v5|M2 20h20|M3 20V12|M21 20V12",
    tag: "M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8Z|M7.5 7.5h.01",
    palette: "M12 22a10 10 0 1 1 10-10c0 2.8-2.2 4-4 4h-2a2 2 0 0 0-1 3.7A1.6 1.6 0 0 1 12 22Z|M7.5 10.5h.01|M12 7.5h.01|M16.5 10.5h.01",
    chevron: "M9 18l6-6-6-6",
    lock: "M5 11h14v10H5z|M8 11V7a4 4 0 0 1 8 0v4",
    flame: "M12 22a7 7 0 0 0 7-7c0-4-3-6-4-10-2 2-3 4-3 6-1-1-2-2-2-4-3 2-5 5-5 8a7 7 0 0 0 7 7Z"
  };

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function num(n, opts) {
    try { return new Intl.NumberFormat(locale(), opts || {}).format(n); } catch (e) { return String(n); }
  }
  function money(n, cur) {
    var v = Math.round((Number(n) || 0) * 100) / 100;
    var s = num(Math.abs(v), { maximumFractionDigits: 2 });
    return (v < 0 ? "−" : "") + (cur || "") + s;
  }
  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function dayKey(d) { d = d || new Date(); return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); }
  function addDays(d, n) { var x = new Date(d.getFullYear(), d.getMonth(), d.getDate()); x.setDate(x.getDate() + n); return x; }
  function lastDays(n) { var out = [], t = new Date(); for (var i = n - 1; i >= 0; i--) out.push(addDays(t, -i)); return out; }
  function fmtDate(ts, opts) {
    try { return new Date(ts).toLocaleDateString(locale(), opts || { day: "numeric", month: "short" }); } catch (e) { return new Date(ts).toDateString(); }
  }
  function uid(p) { return (p || "x") + Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }

  /* ---- persistence ---- */
  function readLS(key, def) {
    try { var v = JSON.parse(localStorage.getItem(LS_PREFIX + key)); return v == null ? def : v; } catch (e) { return def; }
  }
  function get(key, def) {
    var m = window.MHS;
    if (m && m.current && m.current() && m.extra) {
      var v = m.extra(key);
      if (v !== undefined) return v;
      var cached = readLS(key, undefined);
      if (cached !== undefined) { m.setExtra(key, cached); return cached; } // migrate pre-load writes
      return def;
    }
    return readLS(key, def);
  }
  function set(key, val) {
    var m = window.MHS;
    if (m && m.current && m.current() && m.setExtra) {
      m.setExtra(key, val);
      try { localStorage.removeItem(LS_PREFIX + key); } catch (e) {}
    } else {
      try { localStorage.setItem(LS_PREFIX + key, JSON.stringify(val)); } catch (e) {}
    }
    emit(key);
  }
  function emit(key) {
    try { document.dispatchEvent(new CustomEvent("mhs:suite", { detail: { key: key } })); } catch (e) {}
    try { if (bc) bc.postMessage({ type: "suite", key: key }); } catch (e) {}
  }
  var bc = null;
  try { bc = "BroadcastChannel" in window ? new BroadcastChannel("mhs-suite") : null; } catch (e) {}
  function on(fn) {
    document.addEventListener("mhs:suite", function (e) { fn(e.detail && e.detail.key); });
    document.addEventListener("mhs:extras", function () { fn("*"); });
  }

  /* Media blobs (IndexedDB via the main store). */
  var media = {
    put: function (id, blob) { return window.MHS && window.MHS.set ? window.MHS.set("media:" + id, blob) : Promise.reject(new Error("store")); },
    get: function (id) { return window.MHS && window.MHS.get ? window.MHS.get("media:" + id) : Promise.resolve(null); },
    del: function (id) { return window.MHS && window.MHS.del ? window.MHS.del("media:" + id).catch(function () {}) : Promise.resolve(); }
  };

  /* ---- UI helpers ---- */
  function toast(msg) {
    if (window.MHSActions && window.MHSActions.toast) return window.MHSActions.toast(msg);
    if (window.MHSApp && window.MHSApp.toast) return window.MHSApp.toast(msg);
  }
  function share(text, title) {
    if (window.MHSActions && window.MHSActions.share) return window.MHSActions.share(text, title);
    if (navigator.share) return navigator.share({ title: title || "Muhasabah", text: text }).catch(function () {});
    return Promise.resolve();
  }
  function haptic(p) { try { if (navigator.vibrate) navigator.vibrate(p || 12); } catch (e) {} }
  function sheet(opts) { return window.MHSSheet ? window.MHSSheet.open(opts) : null; }
  function whenReady(name, fn) {
    if (window[name]) return fn(window[name]);
    var n = 0, t = setInterval(function () {
      if (window[name]) { clearInterval(t); fn(window[name]); } else if (++n > 60) clearInterval(t);
    }, 100);
  }

  /* Progress ring as an SVG string. pct 0..1 */
  function ring(pct, size, stroke, color, track) {
    size = size || 56; stroke = stroke || 6;
    var r = (size - stroke) / 2, c = 2 * Math.PI * r, p = Math.max(0, Math.min(1, pct || 0));
    return '<svg class="mhs-ring" viewBox="0 0 ' + size + " " + size + '" width="' + size + '" height="' + size + '" aria-hidden="true">' +
      '<circle cx="' + size / 2 + '" cy="' + size / 2 + '" r="' + r + '" fill="none" stroke="' + (track || "hsl(var(--foreground) / .08)") + '" stroke-width="' + stroke + '"/>' +
      '<circle cx="' + size / 2 + '" cy="' + size / 2 + '" r="' + r + '" fill="none" stroke="' + (color || "hsl(var(--primary))") + '" stroke-width="' + stroke + '" stroke-linecap="round" stroke-dasharray="' + (c * p).toFixed(2) + " " + c.toFixed(2) + '" transform="rotate(-90 ' + size / 2 + " " + size / 2 + ')"/></svg>';
  }
  /* Tiny bar sparkline as an SVG string. */
  function bars(values, w, h, color) {
    w = w || 84; h = h || 26;
    var n = values.length || 1, max = Math.max.apply(null, values.concat([1])), bw = w / n;
    var out = '<svg class="mhs-spark" viewBox="0 0 ' + w + " " + h + '" width="' + w + '" height="' + h + '" aria-hidden="true">';
    values.forEach(function (v, i) {
      var bh = v > 0 ? Math.max(2, (v / max) * (h - 2)) : 1.5;
      out += '<rect x="' + (i * bw + bw * 0.18).toFixed(1) + '" y="' + (h - bh).toFixed(1) + '" width="' + (bw * 0.64).toFixed(1) + '" height="' + bh.toFixed(1) + '" rx="1.5" fill="' + (color || "hsl(var(--primary))") + '" opacity="' + (v > 0 ? (i === n - 1 ? 1 : 0.55) : 0.2) + '"/>';
    });
    return out + "</svg>";
  }

  /* Register an item in the unified + action menu. */
  function action(item) {
    window.MHSActionsExtra = window.MHSActionsExtra || [];
    if (window.MHSActionsExtra.some(function (a) { return a.k === item.k; })) return;
    window.MHSActionsExtra.push(item);
  }

  /* An emoji field that uses the device's native emoji keyboard, with a few quick picks. */
  function emojiField(value, picks, onChange) {
    var input = el("input", { type: "text", class: "mhs-emoji-in", value: value || "", maxlength: "8", inputmode: "text", "aria-label": "Emoji", placeholder: "🙂", enterkeyhint: "done" });
    function firstGlyph(s) {
      s = String(s || "").trim();
      if (!s) return "";
      try {
        if (window.Intl && Intl.Segmenter) { var it = new Intl.Segmenter(undefined, { granularity: "grapheme" }).segment(s)[Symbol.iterator]().next(); return it.value ? it.value.segment : s; }
      } catch (e) {}
      return Array.from(s).slice(0, 2).join("");
    }
    input.addEventListener("input", function () {
      var g = firstGlyph(input.value);
      if (g !== input.value) input.value = g;
      onChange(g);
    });
    input.addEventListener("focus", function () { input.select(); });
    var row = el("div", { class: "mhs-emoji-row" }, [input]);
    (picks || []).forEach(function (p) {
      row.appendChild(el("button", { type: "button", class: "mhs-emoji-pick", text: p, "aria-label": p, on: { click: function () {
        input.value = p; onChange(p);
        row.querySelectorAll(".mhs-emoji-pick").forEach(function (b) { b.classList.toggle("is-on", b.textContent === p); });
      } } }));
    });
    row.querySelectorAll(".mhs-emoji-pick").forEach(function (b) { b.classList.toggle("is-on", b.textContent === value); });
    return row;
  }

  /* Quran reading tracker: the Quran reader saves the last-read ayah in "mhs:quran:last".
   * We record how many distinct ayahs were reached per day for the Quran mini-dashboard. */
  (function trackQuran() {
    try {
      var orig = Storage.prototype.setItem;
      Storage.prototype.setItem = function (k, v) {
        orig.apply(this, arguments);
        if (k === "mhs:quran:last" && this === window.localStorage) {
          try {
            var p = JSON.parse(v), day = dayKey(), log = readLS("quranlog", {}), d = log[day] || { n: 0, seen: [] };
            var key = p.s + ":" + p.a;
            if (d.seen.indexOf(key) === -1) { d.seen.push(key); d.n++; if (d.seen.length > 400) d.seen = d.seen.slice(-400); }
            d.last = key;
            log[day] = d;
            var keys = Object.keys(log).sort(); while (keys.length > 60) delete log[keys.shift()];
            orig.call(this, LS_PREFIX + "quranlog", JSON.stringify(log));
          } catch (e) {}
        }
      };
    } catch (e) {}
  })();

  window.MHSX = {
    lang: lang, locale: locale, tr: tr, el: el, icon: function (k) { return icon(ICONS[k] || k); }, ICONS: ICONS, esc: esc,
    num: num, money: money, dayKey: dayKey, addDays: addDays, lastDays: lastDays, fmtDate: fmtDate, uid: uid,
    get: get, set: set, on: on, emit: emit, readLS: readLS, media: media,
    toast: toast, share: share, haptic: haptic, sheet: sheet, whenReady: whenReady, ring: ring, bars: bars,
    action: action, emojiField: emojiField
  };
  if (bc) bc.onmessage = function (e) {
    if (e.data && e.data.type === "suite") try { document.dispatchEvent(new CustomEvent("mhs:suite", { detail: { key: e.data.key, remote: true } })); } catch (x) {}
  };
})();
