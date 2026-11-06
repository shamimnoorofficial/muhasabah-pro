/* Muhasabah smart calculator — a compact keypad that opens inside any mini-app (Notes, Ledger).
 * Safe expression evaluation (no eval): + − × ÷ %, parentheses, decimals, percentages.
 * MHSCalc.open({ host: dialogElement, value: "12+3", onUse: function (number, expression) {} }) */
(function () {
  "use strict";
  if (window.MHSCalc) return;
  var X = window.MHSX;
  var t = X.tr({
    en: { title: "Calculator", use: "Insert", close: "Close calculator", copy: "Copied", history: "History", err: "Check the expression" },
    bn: { title: "ক্যালকুলেটর", use: "বসান", close: "ক্যালকুলেটর বন্ধ", copy: "কপি হয়েছে", history: "ইতিহাস", err: "হিসাবটি ঠিক করুন" },
    ar: { title: "الآلة الحاسبة", use: "إدراج", close: "إغلاق", copy: "تم النسخ", history: "السجل", err: "تحقق من العملية" }
  });

  /* Tokenize and evaluate with the shunting-yard algorithm. */
  function evaluate(src) {
    var s = String(src || "").replace(/[×x*]/g, "*").replace(/[÷/]/g, "/").replace(/[−–]/g, "-").replace(/,/g, "")
      .replace(/[০-৯]/g, function (d) { return String(d.charCodeAt(0) - 0x09e6); })
      .replace(/[٠-٩]/g, function (d) { return String(d.charCodeAt(0) - 0x0660); });
    var out = [], ops = [], i = 0, prev = "op";
    var prec = { "+": 1, "-": 1, "*": 2, "/": 2, "u-": 3 };
    function apply() {
      var op = ops.pop();
      if (op === "u-") { if (!out.length) throw 0; out.push(-out.pop()); return; }
      var b = out.pop(), a = out.pop();
      if (a === undefined || b === undefined) throw 0;
      out.push(op === "+" ? a + b : op === "-" ? a - b : op === "*" ? a * b : a / b);
    }
    while (i < s.length) {
      var c = s[i];
      if (c === " ") { i++; continue; }
      if (/[0-9.]/.test(c)) {
        var j = i; while (j < s.length && /[0-9.]/.test(s[j])) j++;
        var n = parseFloat(s.slice(i, j)); if (isNaN(n)) throw 0;
        i = j;
        if (s[i] === "%") { n = n / 100; i++; }
        out.push(n); prev = "num"; continue;
      }
      if (c === "(") { ops.push(c); prev = "op"; i++; continue; }
      if (c === ")") { while (ops.length && ops[ops.length - 1] !== "(") apply(); if (!ops.length) throw 0; ops.pop(); prev = "num"; i++; continue; }
      if ("+-*/".indexOf(c) !== -1) {
        var op = c === "-" && prev === "op" ? "u-" : c;
        if (op === "u-") { ops.push(op); i++; continue; }
        while (ops.length && ops[ops.length - 1] !== "(" && prec[ops[ops.length - 1]] >= prec[op]) apply();
        ops.push(op); prev = "op"; i++; continue;
      }
      throw 0;
    }
    while (ops.length) { if (ops[ops.length - 1] === "(") ops.pop(); else apply(); }
    if (out.length !== 1 || !isFinite(out[0])) throw 0;
    return Math.round(out[0] * 1e10) / 1e10;
  }

  var KEYS = [["C", "(", ")", "÷"], ["7", "8", "9", "×"], ["4", "5", "6", "−"], ["1", "2", "3", "+"], ["%", "0", ".", "⌫"]];
  var pop = null;

  function close() { if (pop) { pop.remove(); pop = null; } }

  function open(opts) {
    opts = opts || {};
    close();
    var host = opts.host || document.querySelector("dialog[open]") || document.body;
    var expr = String(opts.value || "");
    var hist = X.readLS("calc-hist", []);
    var exprEl = X.el("div", { class: "mhs-calc-expr", "aria-live": "polite" });
    var resEl = X.el("div", { class: "mhs-calc-res" });
    var histEl = X.el("div", { class: "mhs-calc-hist", "aria-label": t("history") });
    function result() { try { return expr.trim() ? evaluate(expr) : null; } catch (e) { return undefined; } }
    function render() {
      exprEl.textContent = expr || "0";
      var r = result();
      resEl.textContent = r === undefined ? "…" : r === null ? "" : "= " + X.num(r, { maximumFractionDigits: 6 });
      histEl.replaceChildren();
      hist.slice(0, 4).forEach(function (h) {
        histEl.appendChild(X.el("button", { type: "button", class: "mhs-calc-hchip", text: h.e + " = " + X.num(h.r, { maximumFractionDigits: 6 }), on: { click: function () { expr = String(h.r); render(); } } }));
      });
    }
    function press(k) {
      X.haptic(6);
      if (k === "C") expr = "";
      else if (k === "⌫") expr = expr.slice(0, -1);
      else if (k === "=") {
        var r = result();
        if (r === undefined) { X.toast(t("err")); return; }
        if (r !== null) {
          hist.unshift({ e: expr, r: r }); hist = hist.slice(0, 12);
          try { localStorage.setItem("mhs:x:calc-hist", JSON.stringify(hist)); } catch (e) {}
          expr = String(r);
        }
      } else expr += k;
      render();
    }
    var pad = X.el("div", { class: "mhs-calc-pad" });
    KEYS.forEach(function (row) {
      row.forEach(function (k) {
        var cls = "mhs-calc-key" + ("÷×−+".indexOf(k) !== -1 ? " op" : k === "C" || k === "⌫" ? " fn" : "");
        pad.appendChild(X.el("button", { type: "button", class: cls, text: k, "aria-label": k, on: { click: function () { press(k); } } }));
      });
    });
    var foot = X.el("div", { class: "mhs-calc-foot" }, [
      X.el("button", { type: "button", class: "mhs-calc-key eq", text: "=", on: { click: function () { press("="); } } }),
      opts.onUse ? X.el("button", { type: "button", class: "mhs-calc-use", text: t("use"), on: { click: function () {
        var r = result();
        if (r === undefined || r === null) { X.toast(t("err")); return; }
        opts.onUse(r, expr); close();
      } } }) : null
    ]);
    pop = X.el("div", { class: "mhs-calc-pop", role: "dialog", "aria-label": t("title") }, [
      X.el("div", { class: "mhs-calc-top" }, [
        X.el("span", { class: "mhs-calc-ttl", text: "🧮 " + t("title") }),
        X.el("button", { type: "button", class: "mhs-mini-ib", "aria-label": t("close"), on: { click: close } }, [X.icon("x")])
      ]),
      X.el("div", { class: "mhs-calc-screen" }, [exprEl, resEl]), histEl, pad, foot
    ]);
    pop.addEventListener("keydown", function (e) {
      if (e.key === "Escape") { e.stopPropagation(); e.preventDefault(); close(); return; }
      var map = { "*": "×", "/": "÷", "-": "−", Enter: "=", Backspace: "⌫" };
      var k = map[e.key] || e.key;
      if (/^[0-9.()%+]$/.test(k) || ["×", "÷", "−", "=", "⌫"].indexOf(k) !== -1) { e.preventDefault(); press(k); }
    });
    host.appendChild(pop);
    render();
    setTimeout(function () { var b = pop && pop.querySelector(".mhs-calc-key"); b && b.focus({ preventScroll: true }); }, 40);
    return { close: close };
  }

  window.MHSCalc = { open: open, close: close, evaluate: evaluate };
})();
