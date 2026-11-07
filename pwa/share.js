/* MHSShare — the universal "share with link" service used by every module.
 *
 *   MHSShare.share({ medium, title, ar, text, tl, meaning, src, url })  → navigator.share / clipboard
 *   MHSShare.text(payload)        → the formatted plain text (RTL-safe, with reference + footer + UTM link)
 *   MHSShare.link(medium)         → https://muhasabah-pro.app?utm_source=app_share&utm_medium=<medium>
 *   MHSShare.card(payload)        → Promise<Blob> — a 1080×1350 PNG card with watermark (canvas)
 *   MHSShare.shareCard(payload)   → shares the PNG (Web Share Level 2) or downloads it
 *   MHSShare.menu(payload)        → small bottom sheet: Share text · Share image · Copy
 *   MHSShare.invite()             → shares the invite copy (3-day prompt, settings)
 *
 * Every payload automatically ends with the branded footer. Works inside the TWA: navigator.share is
 * forwarded to the Android share sheet; if unavailable we copy to the clipboard and toast "Copied with link". */
(function () {
  "use strict";
  if (window.MHSShare) return;
  var C = window.MHSShareConfig;
  var RTL = /[֐-׿؀-ۿݐ-ݿࢠ-ࣿﭐ-﷿ﹰ-﻿]/;
  var LRM = "‎", RLM = "‏";

  var STR = {
    en: { copied: "Copied with link", text: "Share as text", image: "Share as image", copy: "Copy text", saved: "Image saved", title: "Share", making: "Preparing image…", failed: "Couldn't share. Copied instead." },
    bn: { copied: "লিংকসহ কপি হয়েছে", text: "টেক্সট শেয়ার", image: "ছবি হিসেবে শেয়ার", copy: "টেক্সট কপি", saved: "ছবি সংরক্ষিত", title: "শেয়ার করুন", making: "ছবি তৈরি হচ্ছে…", failed: "শেয়ার করা যায়নি। কপি করা হয়েছে।" },
    ar: { copied: "تم النسخ مع الرابط", text: "مشاركة كنص", image: "مشاركة كصورة", copy: "نسخ النص", saved: "تم حفظ الصورة", title: "مشاركة", making: "جارٍ تجهيز الصورة…", failed: "تعذّرت المشاركة. تم النسخ." }
  };
  function lang() {
    var l = (window.MHSLocale || document.documentElement.lang || "en").split("-")[0];
    if (window.MHSI18n && window.MHSI18n.base) l = window.MHSI18n.base(l);
    return STR[l] ? l : "en";
  }
  function t(k) { return (STR[lang()] || STR.en)[k] || STR.en[k]; }
  function toast(m) {
    if (window.MHSApp && window.MHSApp.toast) return window.MHSApp.toast(m);
    if (window.MHSActions && window.MHSActions.toast) return window.MHSActions.toast(m);
    var d = document.createElement("div"); d.className = "mhs-toast"; d.setAttribute("role", "status"); d.textContent = m;
    document.body.appendChild(d); setTimeout(function () { d.style.opacity = "0"; }, 2400); setTimeout(function () { d.remove(); }, 2900);
  }
  function medium(m) { m = String(m || "").toLowerCase(); return C.mediums.indexOf(m) >= 0 ? m : "app"; }

  /* ---- link + footer ---- */
  function link(m, extra) {
    var u = C.url + "?utm_source=" + encodeURIComponent(C.utm.source) + "&" + C.utm.param + "=" + encodeURIComponent(medium(m));
    if (extra) Object.keys(extra).forEach(function (k) { if (extra[k] != null && extra[k] !== "") u += "&" + encodeURIComponent(k) + "=" + encodeURIComponent(extra[k]); });
    return u;
  }
  function footer(m, extra) { return "\n\n" + (C.signature[lang()] || C.signature.en) + "\n" + link(m, extra); }
  function hasFooter(s) { return String(s || "").indexOf(C.url) >= 0; }

  /* Wrap a line so mixed-direction text keeps its own direction when pasted into chats. */
  function dirSafe(s) {
    s = String(s || "").trim();
    if (!s) return "";
    return RTL.test(s.charAt(0)) ? RLM + s + RLM : LRM + s + LRM;
  }
  /* Build the plain-text payload:
   *   <arabic>            (RTL-safe)
   *   <transliteration>
   *   <meaning / text>
   *   — <reference>
   *   [footer] */
  function text(p) {
    p = p || {};
    if (typeof p === "string") p = { text: p };
    var lines = [];
    if (p.title) lines.push(dirSafe(p.title));
    if (p.ar) lines.push(dirSafe(p.ar));
    if (p.tl) lines.push(dirSafe(p.tl));
    if (p.text) lines.push(dirSafe(p.text));
    if (p.meaning && p.meaning !== p.text) lines.push(dirSafe(p.meaning));
    var body = lines.filter(Boolean).join("\n\n");
    if (p.src) body += "\n" + dirSafe("— " + p.src);
    if (p.by && !p.src) body += "\n" + dirSafe("— " + p.by);
    if (!hasFooter(body)) body += footer(p.medium, p.link);
    return body;
  }

  function copy(s) {
    if (navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(s).then(function () { toast(t("copied")); return "copied"; }, function () { return legacyCopy(s); });
    return Promise.resolve(legacyCopy(s));
  }
  function legacyCopy(s) {
    try {
      var ta = document.createElement("textarea"); ta.value = s; ta.setAttribute("readonly", ""); ta.style.position = "fixed"; ta.style.opacity = "0";
      document.body.appendChild(ta); ta.select(); document.execCommand("copy"); ta.remove(); toast(t("copied")); return "copied";
    } catch (e) { return "failed"; }
  }

  /* Share plain text. Returns a promise resolving to "shared" | "copied" | "cancelled" | "failed". */
  function share(p) {
    var s = text(p), title = (p && p.title) || C.brand;
    if (navigator.share) {
      return navigator.share({ title: title, text: s }).then(function () { return "shared"; }, function (e) {
        if (e && e.name === "AbortError") return "cancelled";
        return copy(s);
      });
    }
    return copy(s);
  }

  /* ---- image card (canvas) ---- */
  function wrap(ctx, str, maxW) {
    var words = String(str || "").split(/\s+/), lines = [], cur = "";
    words.forEach(function (w) {
      var test = cur ? cur + " " + w : w;
      if (ctx.measureText(test).width > maxW && cur) { lines.push(cur); cur = w; } else cur = test;
    });
    if (cur) lines.push(cur);
    return lines;
  }
  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }
  var THEMES = {
    quran: ["#00e676", "#00b8d4"], hadith: ["#ffd54f", "#ff8f00"], wisdom: ["#ff4081", "#e040fb"], dua: ["#7c4dff", "#00b8d4"], names: ["#ffd54f", "#00e676"],
    amol: ["#00e676", "#ffd54f"], reminder: ["#00b8d4", "#7c4dff"], zikr: ["#00e676", "#7c4dff"], streak: ["#ff8f00", "#ff4081"], app: ["#00e676", "#00b8d4"]
  };
  function fontsReady() { return document.fonts && document.fonts.ready ? document.fonts.ready.catch(function () {}) : Promise.resolve(); }
  function card(p) {
    p = p || {};
    var W = 1080, H = 1350, m = medium(p.medium), hue = THEMES[m] || THEMES.app;
    var c = document.createElement("canvas"); c.width = W; c.height = H;
    var ctx = c.getContext("2d");
    return fontsReady().then(function () {
      // background
      var g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, "#0d1118"); g.addColorStop(1, "#06080d");
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      var r1 = ctx.createRadialGradient(W * 0.85, H * 0.08, 10, W * 0.85, H * 0.08, 620); r1.addColorStop(0, hue[0] + "55"); r1.addColorStop(1, "transparent");
      ctx.fillStyle = r1; ctx.fillRect(0, 0, W, H);
      var r2 = ctx.createRadialGradient(W * 0.1, H * 0.95, 10, W * 0.1, H * 0.95, 620); r2.addColorStop(0, hue[1] + "44"); r2.addColorStop(1, "transparent");
      ctx.fillStyle = r2; ctx.fillRect(0, 0, W, H);
      // subtle grid
      ctx.strokeStyle = "rgba(255,255,255,0.035)"; ctx.lineWidth = 1;
      for (var x = 0; x < W; x += 60) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
      for (var y = 0; y < H; y += 60) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
      // glass panel
      var px = 70, py = 180, pw = W - 140, ph = H - 360;
      ctx.save(); roundRect(ctx, px, py, pw, ph, 48); ctx.fillStyle = "rgba(20,26,36,0.78)"; ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.1)"; ctx.lineWidth = 2; ctx.stroke(); ctx.restore();
      // eyebrow
      ctx.fillStyle = hue[0]; ctx.font = "600 26px Sora, Inter, system-ui, sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "top";
      ctx.fillText(String(p.eyebrow || p.kind || m).toUpperCase().split("").join(" "), W / 2, py + 54);
      var cy = py + 120, maxW = pw - 140;
      // arabic
      if (p.ar) {
        ctx.fillStyle = "#eef6f1"; ctx.direction = "rtl";
        var size = String(p.ar).length > 160 ? 46 : String(p.ar).length > 90 ? 54 : 64;
        ctx.font = "400 " + size + "px Amiri, 'Scheherazade New', 'Noto Naskh Arabic', serif";
        var al = wrap(ctx, p.ar, maxW).slice(0, 7);
        al.forEach(function (ln) { ctx.fillText(ln, W / 2, cy); cy += size * 1.75; });
        ctx.direction = "ltr"; cy += 20;
      }
      if (p.tl) {
        ctx.fillStyle = "#9fb3a6"; ctx.font = "italic 400 28px Inter, system-ui, sans-serif";
        wrap(ctx, p.tl, maxW).slice(0, 4).forEach(function (ln) { ctx.fillText(ln, W / 2, cy); cy += 40; });
        cy += 16;
      }
      var main = p.text || p.meaning || "";
      if (main) {
        ctx.fillStyle = "#eef6f1";
        var ms = main.length > 320 ? 30 : main.length > 200 ? 34 : main.length > 120 ? 38 : 44;
        ctx.font = "500 " + ms + "px Inter, 'Noto Sans Bengali', system-ui, sans-serif";
        ctx.direction = RTL.test(main.charAt(0)) ? "rtl" : "ltr";
        var ml = wrap(ctx, main, maxW).slice(0, 10);
        ml.forEach(function (ln) { ctx.fillText(ln, W / 2, cy); cy += ms * 1.5; });
        ctx.direction = "ltr";
      }
      // reference
      var ref = p.src || p.by;
      if (ref) {
        cy = Math.max(cy + 24, py + ph - 140);
        ctx.fillStyle = hue[0]; ctx.font = "600 26px Inter, system-ui, sans-serif";
        ctx.fillText("— " + ref, W / 2, cy);
      }
      // footer brand
      ctx.textAlign = "center"; ctx.fillStyle = "#cfe9da"; ctx.font = "700 34px Sora, Inter, system-ui, sans-serif";
      ctx.fillText(C.brand, W / 2, H - 132);
      ctx.fillStyle = "#6f857a"; ctx.font = "500 26px Inter, system-ui, sans-serif";
      ctx.fillText(C.watermark + "   ·   " + (lang() === "bn" ? "ফ্রি · অফলাইন · ব্যক্তিগত" : lang() === "ar" ? "مجاني · دون إنترنت · خاص" : "Free · Offline · Private"), W / 2, H - 82);
      // crest
      ctx.save(); ctx.translate(W / 2, 92); ctx.fillStyle = hue[0]; ctx.shadowColor = hue[0]; ctx.shadowBlur = 30;
      ctx.beginPath(); ctx.moveTo(0, -36); ctx.lineTo(32, -20); ctx.lineTo(32, 10); ctx.quadraticCurveTo(32, 32, 0, 44); ctx.quadraticCurveTo(-32, 32, -32, 10); ctx.lineTo(-32, -20); ctx.closePath(); ctx.fill();
      ctx.shadowBlur = 0; ctx.strokeStyle = "#06080d"; ctx.lineWidth = 6; ctx.lineCap = "round"; ctx.lineJoin = "round";
      ctx.beginPath(); ctx.moveTo(-13, 4); ctx.lineTo(-3, 15); ctx.lineTo(15, -9); ctx.stroke(); ctx.restore();
      return new Promise(function (res) { c.toBlob(function (b) { res(b); }, "image/png"); });
    });
  }
  function download(blob, name) {
    var u = URL.createObjectURL(blob), a = document.createElement("a"); a.href = u; a.download = name || "muhasabah-pro.png";
    document.body.appendChild(a); a.click(); setTimeout(function () { a.remove(); URL.revokeObjectURL(u); }, 1500);
  }
  function shareCard(p) {
    toast(t("making"));
    return card(p).then(function (blob) {
      if (!blob) throw new Error("canvas");
      var file = null;
      try { file = new File([blob], "muhasabah-pro-" + medium(p.medium) + ".png", { type: "image/png" }); } catch (e) {}
      var s = text(p);
      if (file && navigator.canShare && navigator.canShare({ files: [file] })) {
        return navigator.share({ files: [file], title: (p && p.title) || C.brand, text: s }).then(function () { return "shared"; }, function (e) {
          if (e && e.name === "AbortError") return "cancelled";
          download(blob, file.name); toast(t("saved")); return "downloaded";
        });
      }
      download(blob, "muhasabah-pro.png"); toast(t("saved"));
      return copy(s).then(function () { return "downloaded"; });
    }).catch(function () { return share(p); });
  }

  /* ---- share menu (bottom sheet) ---- */
  function menu(p) {
    var old = document.getElementById("mhs-share-menu"); if (old) old.remove();
    var d = document.createElement("dialog"); d.id = "mhs-share-menu"; d.className = "mhs-share-menu"; d.setAttribute("aria-label", t("title"));
    d.setAttribute("dir", document.documentElement.dir || "ltr");
    var prev = text(p);
    function btn(label, icon, fn) {
      var b = document.createElement("button"); b.type = "button"; b.className = "mhs-share-opt";
      b.innerHTML = '<span class="ic" aria-hidden="true">' + icon + "</span><span>" + label + "</span>";
      b.addEventListener("click", function () { close(); setTimeout(fn, 60); });
      return b;
    }
    var pre = document.createElement("pre"); pre.className = "mhs-share-prev"; pre.textContent = prev.length > 420 ? prev.slice(0, 420) + "…" : prev;
    var h = document.createElement("h3"); h.textContent = t("title");
    var grip = document.createElement("span"); grip.className = "grip"; grip.setAttribute("aria-hidden", "true");
    d.append(grip, h, pre, btn(t("text"), "💬", function () { share(p); }), btn(t("image"), "🖼️", function () { shareCard(p); }), btn(t("copy"), "📋", function () { copy(prev); }));
    function close() { if (d.open) d.close(); }
    d.addEventListener("click", function (e) { if (e.target === d) close(); });
    d.addEventListener("close", function () { d.remove(); });
    document.body.appendChild(d);
    try { d.showModal(); } catch (e) { d.remove(); share(p); }
  }

  function invite() {
    return share({ medium: "invite", title: C.brand, text: C.invite[lang()] || C.invite.en });
  }

  /* Guess the medium from whichever mini-app sheet is open — used by the legacy share hook. */
  function guess() {
    var dlg = document.querySelector("dialog.mhs-mini[open]");
    var id = dlg ? dlg.id : "";
    if (/quran/.test(id)) return "quran";
    if (/hadith/.test(id)) return "hadith";
    if (/wisdom|reminder/.test(id)) return "wisdom";
    if (/dua|knowledge|names/.test(id)) return "dua";
    if (/amol|essential|prayer|qibla/.test(id)) return "amol";
    if (/zikr/.test(id)) return "zikr";
    if (/journal/.test(id)) return "journal";
    return "app";
  }

  window.MHSShare = { config: C, link: link, footer: footer, text: text, share: share, copy: copy, card: card, shareCard: shareCard, menu: menu, invite: invite, medium: medium, guess: guess, toast: toast };

  /* Route the legacy helpers through the service so Quran/Hadith/Zikr/Amol/Notes shares
   * automatically gain the footer + UTM link (installs once MHSActions exists). */
  function hook() {
    if (window.MHSActions && !window.MHSActions.__shareHooked) {
      window.MHSActions.__shareHooked = true;
      window.MHSActions.share = function (s, title) {
        var m = guess();
        var body = String(s || "");
        var src = null, mm = body.match(/\n—\s*([^\n]+)\s*$/);
        if (mm) { src = mm[1].trim(); body = body.slice(0, mm.index); }
        return share({ medium: m, title: title, text: body.trim(), src: src });
      };
    }
    if (window.MHSX && !window.MHSX.__shareHooked) {
      window.MHSX.__shareHooked = true;
      window.MHSX.share = function (s, title) { return window.MHSActions && window.MHSActions.share ? window.MHSActions.share(s, title) : share({ text: s, title: title }); };
      window.MHSX.shareItem = function (p) { return menu(p); };
    }
  }
  hook();
  var n = 0, iv = setInterval(function () { hook(); if ((window.MHSActions && window.MHSX) || ++n > 80) clearInterval(iv); }, 100);
})();
