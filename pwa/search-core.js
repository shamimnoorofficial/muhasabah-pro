/* MHSSearch — shared offline search core for every content mini-app (Quran, Hadith, Wisdom, Duas,
 * Amol, Names). Arabic diacritics-insensitive, Bengali/English accent & case-insensitive, fuzzy and
 * partial matching with a relevance score, result highlighting, history and suggestions. */
(function () {
  "use strict";
  if (window.MHSSearch) return;
  var AR_DIACRITICS = /[ؐ-ًؚ-ٰٟۖ-ۭـ]/g; // harakat, tanween, shadda, sukun, superscript alef, tatweel
  var AR_MAP = [[/[أإآٱ]/g, "ا"], [/ى/g, "ي"], [/ة/g, "ه"], [/ؤ/g, "و"], [/ئ/g, "ي"], [/ک/g, "ك"], [/ی/g, "ي"]];
  var BN_MAP = [[/[়]/g, ""], [/য়/g, "য়"], [/ড়/g, "ড়"], [/ঢ়/g, "ঢ়"], [/[‌‍]/g, ""]];

  function normAr(s) { s = String(s || "").replace(AR_DIACRITICS, ""); AR_MAP.forEach(function (m) { s = s.replace(m[0], m[1]); }); return s; }
  function normBn(s) { s = String(s || ""); BN_MAP.forEach(function (m) { s = s.replace(m[0], m[1]); }); return s; }
  function norm(s) {
    s = String(s || "").toLowerCase();
    try { s = s.normalize("NFD").replace(/[̀-ͯ]/g, ""); } catch (e) {}
    s = normAr(normBn(s)).replace(/[’'`ʿʾ\-–—_.,;:!?()\[\]"«»।؟،]/g, " ").replace(/\s+/g, " ").trim();
    return s;
  }
  function tokens(s) { return norm(s).split(" ").filter(function (w) { return w.length > 0; }); }
  /* Damerau-ish edit distance capped at 2 for fuzzy matching of short tokens. */
  function dist(a, b) {
    if (a === b) return 0; if (Math.abs(a.length - b.length) > 2) return 3;
    var prev = [], cur = [], i, j;
    for (j = 0; j <= b.length; j++) prev[j] = j;
    for (i = 1; i <= a.length; i++) {
      cur = [i]; var min = i;
      for (j = 1; j <= b.length; j++) { cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); if (cur[j] < min) min = cur[j]; }
      if (min > 2) return 3; prev = cur;
    }
    return prev[b.length];
  }
  /* Score a haystack string against a query: 0 = no match. Exact phrase > all tokens > partial > fuzzy. */
  function score(hay, q) {
    var h = norm(hay); if (!h) return 0;
    var nq = norm(q); if (!nq) return 0;
    if (h === nq) return 100;
    if (h.indexOf(nq) >= 0) return 80 + Math.min(15, Math.round(15 * nq.length / h.length));
    var qt = tokens(nq), ht = h.split(" "), total = 0;
    for (var i = 0; i < qt.length; i++) {
      var tk = qt[i], best = 0;
      for (var j = 0; j < ht.length; j++) {
        var w = ht[j];
        if (w === tk) { best = 10; break; }
        if (w.indexOf(tk) === 0) best = Math.max(best, 8);
        else if (w.indexOf(tk) >= 0) best = Math.max(best, 6);
        else if (tk.length >= 4 && dist(w, tk) <= (tk.length >= 7 ? 2 : 1)) best = Math.max(best, 4);
      }
      if (!best) return 0; // every token must match somewhere
      total += best;
    }
    return Math.round(40 * total / (qt.length * 10));
  }
  /* Search an array of items. fields: array of accessor names or functions. Returns [{item, score}] sorted. */
  function search(items, q, fields, limit) {
    q = String(q || "").trim(); if (!q) return [];
    var out = [];
    for (var i = 0; i < items.length; i++) {
      var it = items[i], best = 0;
      for (var f = 0; f < fields.length; f++) {
        var v = typeof fields[f] === "function" ? fields[f](it) : it[fields[f]];
        if (v == null) continue;
        if (typeof v === "object") v = Object.keys(v).map(function (k) { return v[k]; }).join(" ");
        var s = score(v, q); if (s > best) best = s;
        if (best >= 95) break;
      }
      if (best) out.push({ item: it, score: best });
    }
    out.sort(function (a, b) { return b.score - a.score; });
    return limit ? out.slice(0, limit) : out;
  }
  /* Wrap matches of q inside text with <mark>, diacritics-insensitively (returns HTML, escaped). */
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function highlight(text, q) {
    text = String(text || ""); var qt = tokens(q); if (!qt.length) return esc(text);
    // Build a map from normalized index → original index so we can mark the original string.
    var map = [], n = "", i;
    for (i = 0; i < text.length; i++) { var ch = norm(text[i]); if (ch) { for (var k = 0; k < ch.length; k++) { map.push(i); n += ch[k]; } } else if (text[i] === " " || /\s/.test(text[i])) { map.push(i); n += " "; } }
    var marks = new Array(text.length).fill(false);
    qt.forEach(function (tk) { var p = 0; while ((p = n.indexOf(tk, p)) >= 0) { for (var j = p; j < p + tk.length; j++) marks[map[j]] = true; p += tk.length; } });
    var html = "", open = false;
    for (i = 0; i < text.length; i++) {
      var m = marks[i] || (open && /[ً-ٰٟؐ-ؚ]/.test(text[i]));
      if (m && !open) { html += "<mark>"; open = true; } else if (!m && open) { html += "</mark>"; open = false; }
      html += esc(text[i]);
    }
    if (open) html += "</mark>";
    return html;
  }
  /* Per-module recent-search history (max 12) in localStorage. */
  function history(ns) {
    var key = "mhs:search:" + ns;
    return {
      list: function () { try { return JSON.parse(localStorage.getItem(key)) || []; } catch (e) { return []; } },
      add: function (q) { q = String(q || "").trim(); if (q.length < 2) return; var l = this.list().filter(function (x) { return x !== q; }); l.unshift(q); try { localStorage.setItem(key, JSON.stringify(l.slice(0, 12))); } catch (e) {} },
      clear: function () { try { localStorage.removeItem(key); } catch (e) {} }
    };
  }
  /* A ready-made search box with history chips + suggestions. onQuery(q) is debounced. */
  function box(opts) {
    var X = window.MHSX, hist = history(opts.ns || "x"), tmr = null;
    var input = X.el("input", { type: "search", placeholder: opts.placeholder || "Search…", "aria-label": opts.placeholder || "Search", autocomplete: "off", enterkeyhint: "search", value: opts.value || "" });
    var chips = X.el("div", { class: "mhs-srch-hist" });
    function drawHist() {
      chips.replaceChildren();
      var l = hist.list(); if (!l.length || input.value) { chips.hidden = true; return; }
      chips.hidden = false;
      l.slice(0, 8).forEach(function (q) { chips.appendChild(X.el("button", { type: "button", class: "mhs-chip", text: "🕘 " + q, on: { click: function () { input.value = q; fire(true); } } })); });
      (opts.suggest || []).slice(0, 6).forEach(function (q) { chips.appendChild(X.el("button", { type: "button", class: "mhs-chip", text: "✨ " + q, on: { click: function () { input.value = q; fire(true); } } })); });
    }
    function fire(commit) { clearTimeout(tmr); if (!input.isConnected) return; var q = input.value; if (commit && q.trim().length >= 2) hist.add(q); drawHist(); opts.onQuery(q); }
    input.addEventListener("input", function () { clearTimeout(tmr); tmr = setTimeout(function () { fire(false); }, 160); });
    input.addEventListener("change", function () { fire(true); });
    input.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); fire(true); input.blur(); } });
    var wrap = X.el("div", { class: "mhs-mini-search mhs-srch" }, [input]);
    drawHist();
    return { el: X.el("div", { class: "mhs-srch-wrap" }, [wrap, chips]), input: input, refresh: drawHist };
  }
  window.MHSSearch = { norm: norm, normAr: normAr, tokens: tokens, score: score, search: search, highlight: highlight, history: history, box: box, esc: esc };
})();
