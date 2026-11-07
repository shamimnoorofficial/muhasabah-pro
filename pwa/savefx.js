/* MHSSaveFX — unified save feedback: animated checkmark + toast + "Saved ✓ · time" pill, autosave
 * indicator and unsaved-changes protection. Hooked into the Journal (explicit + autosave), Notes,
 * Ledger, To-Do, Habits and Zikr through the data layer events, so every module shows the same
 * clear confirmation without each one re-implementing it. Optional haptic. Respects reduced motion. */
(function () {
  "use strict";
  if (window.MHSSaveFX) return;
  var STR = {
    en: { saved: "Saved ✓", savedAt: "Saved ✓ · {t}", saving: "Saving…", unsaved: "Unsaved changes", autosave: "Autosave on", leave: "You have unsaved changes." },
    bn: { saved: "সংরক্ষিত ✓", savedAt: "সংরক্ষিত ✓ · {t}", saving: "সংরক্ষণ হচ্ছে…", unsaved: "অসংরক্ষিত পরিবর্তন", autosave: "অটোসেভ চালু", leave: "অসংরক্ষিত পরিবর্তন আছে।" },
    ar: { saved: "تم الحفظ ✓", savedAt: "تم الحفظ ✓ · {t}", saving: "جارٍ الحفظ…", unsaved: "تغييرات غير محفوظة", autosave: "الحفظ التلقائي مفعّل", leave: "لديك تغييرات غير محفوظة." }
  };
  function lang() { var l = (window.MHSLocale || document.documentElement.lang || "en").split("-")[0]; if (window.MHSI18n && window.MHSI18n.base) l = window.MHSI18n.base(l); return STR[l] ? l : "en"; }
  function t(k, v) { var s = (STR[lang()] || STR.en)[k] || STR.en[k]; if (v) Object.keys(v).forEach(function (x) { s = s.split("{" + x + "}").join(v[x]); }); return s; }
  function time(ts) { try { return new Date(ts || Date.now()).toLocaleTimeString(lang() === "bn" ? "bn-BD" : lang() === "ar" ? "ar" : undefined, { hour: "2-digit", minute: "2-digit" }); } catch (e) { var d = new Date(ts || Date.now()); return d.getHours() + ":" + String(d.getMinutes()).padStart(2, "0"); } }
  function reduced() { try { return matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) { return false; } }
  function toast(m) { if (window.MHSApp && window.MHSApp.toast) return window.MHSApp.toast(m); if (window.MHSActions && window.MHSActions.toast) return window.MHSActions.toast(m); }
  var lastFlash = 0;
  /* Big animated checkmark in the centre + toast. Throttled so rapid saves don't spam. */
  function flash(opts) {
    opts = opts || {};
    var now = Date.now(); if (now - lastFlash < 1200) return; lastFlash = now;
    if (!reduced()) {
      var el = document.createElement("div"); el.className = "mhs-savefx"; el.setAttribute("aria-hidden", "true");
      el.innerHTML = '<svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
      document.body.appendChild(el); setTimeout(function () { el.remove(); }, 950);
    }
    if (opts.toast !== false) toast(opts.message || t("savedAt", { t: time() }));
    if (opts.haptic !== false) try { navigator.vibrate && navigator.vibrate(14); } catch (e) {}
  }
  /* A status pill you can mount anywhere: pill.set("saving"|"saved"|"dirty"). */
  function pill(host, opts) {
    opts = opts || {};
    var el = document.createElement("span"); el.className = "mhs-saved-pill"; el.setAttribute("role", "status"); el.setAttribute("aria-live", "polite");
    el.innerHTML = '<span class="dot" aria-hidden="true"></span><span class="txt"></span>';
    var txt = el.querySelector(".txt"), savedAt = null;
    var api = { el: el, set: function (state) {
      el.dataset.state = state;
      if (state === "saving") txt.textContent = t("saving");
      else if (state === "dirty") txt.textContent = t("unsaved");
      else { savedAt = Date.now(); txt.textContent = opts.compact ? "✓ " + time(savedAt) : t("savedAt", { t: time(savedAt) }); }
    } };
    api.set("saved"); if (host) host.appendChild(el);
    return api;
  }

  /* ---- unsaved-changes protection ---- */
  var dirty = {};
  function markDirty(k, on) { if (on) dirty[k] = Date.now(); else delete dirty[k]; }
  window.addEventListener("beforeunload", function (e) { if (Object.keys(dirty).length) { e.preventDefault(); e.returnValue = t("leave"); return t("leave"); } });

  /* ---- Journal hook: footer [data-status] flips saving → saved; textarea input = dirty ---- */
  function hookJournal(dlg) {
    if (dlg.__sfx) return; dlg.__sfx = true;
    var status = dlg.querySelector("[data-status]"); if (!status) return;
    // The journal's own status text stays visible (it also reports sync errors); the pill adds the
    // animated "✓ · last saved time" beside it.
    var p = pill(null, { compact: true }); status.parentNode.insertBefore(p.el, status.nextSibling); status.parentNode.classList.add("mhs-j-saved-wrap");
    var was = status.dataset.state || "";
    p.set(was === "saving" ? "saving" : "saved");
    new MutationObserver(function () {
      var st = status.dataset.state || "";
      if (st === "saving") p.set("saving");
      else if (/saved/.test(st) || st === "offline") { var hadDirty = !!dirty.journal; markDirty("journal", false); p.set("saved"); if (hadDirty || was === "saving") flash({ toast: false }); }
      was = st;
    }).observe(status, { attributes: true, attributeFilter: ["data-state"], childList: true, characterData: true, subtree: true });
    dlg.addEventListener("input", function (e) { if (e.target && e.target.tagName === "TEXTAREA") { markDirty("journal", true); p.set("dirty"); } }, true);
    dlg.querySelectorAll("footer button").forEach(function (b) { b.addEventListener("click", function () { setTimeout(function () { flash({ message: t("savedAt", { t: time() }) }); markDirty("journal", false); p.set("saved"); }, 250); }); });
    dlg.addEventListener("close", function () { markDirty("journal", false); });
  }
  new MutationObserver(function () { var d = document.getElementById("mhs-journal") || document.querySelector("dialog.mhs-journal, dialog[aria-label*='Journal' i], dialog[aria-label*='দিনলিপি']"); if (d && d.open) hookJournal(d); })
    .observe(document.body, { childList: true, subtree: true });

  /* ---- Notes · Ledger · Zikr · Essential · Habits/To-Do (via data layer events) ---- */
  var pending = {}, LABEL = { notes: "📝", hisab: "💰", zikr: "📿", essential: "📿", amol: "🤲", todo: "✅", habit: "🕌" };
  function softSaved(k) {
    clearTimeout(pending[k]);
    pending[k] = setTimeout(function () { toast((LABEL[k] || "") + " " + t("savedAt", { t: time() })); try { navigator.vibrate && navigator.vibrate(8); } catch (e) {} }, k === "zikr" ? 2500 : 700);
  }
  document.addEventListener("mhs:suite", function (e) { var k = e.detail && e.detail.key; if (!k || e.detail.remote) return; if (k === "notes" || k === "hisab" || k === "zikr") softSaved(k); });
  document.addEventListener("mhs:essential", function () { softSaved("essential"); });
  document.addEventListener("mhs:points", function () { softSaved("habit"); });
  document.addEventListener("mhs:new-todo", function () { softSaved("todo"); });
  /* Explicit "Save" buttons inside Notes / Ledger / Zikr sheets get the big checkmark. */
  document.addEventListener("click", function (e) {
    var b = e.target && e.target.closest && e.target.closest("dialog.mhs-mini button[type=submit], dialog.mhs-mini .mhs-btn.primary");
    if (!b) return; var txt = (b.textContent || "").trim();
    if (/^(Save|সংরক্ষণ|حفظ|Add|যোগ|أضف|Done|হয়েছে|تم)/.test(txt)) setTimeout(function () { flash({ toast: false }); }, 60);
  }, true);

  window.MHSSaveFX = { flash: flash, pill: pill, markDirty: markDirty, t: t, time: time };
})();
