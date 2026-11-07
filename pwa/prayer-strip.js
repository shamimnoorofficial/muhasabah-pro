/* <mhs-prayer-strip> — compact prayer strip pinned to the very top of Home.
 * Five prayers with start · end, the current and next prayer highlighted, a live countdown
 * headline ("Asr starts in 42 min" / "Dhuhr ends in 1h 10m") that ticks every second while the
 * page is visible, pauses in the background and resyncs on resume, and a "More" button that
 * opens the Prayer hub. The existing "Prayer times today" card stays — this is an addition. */
(function () {
  "use strict";
  if (window.customElements && customElements.get("mhs-prayer-strip")) return;
  var X = window.MHSX, T = function () { return window.MHSTimes; };
  var t = X.tr({
    en: { more: "More", eyebrow: "Prayer times", allow: "Use my location", noLoc: "Allow location or pick a city to see today's prayer times.", locating: "Finding your location…", until: "until", today: "Today", hub: "Open Prayer & Qibla hub" },
    bn: { more: "আরো জানুন", eyebrow: "নামাজের সময়", allow: "আমার লোকেশন ব্যবহার করুন", noLoc: "আজকের নামাজের সময় দেখতে লোকেশন অনুমতি দিন বা একটি শহর বেছে নিন।", locating: "লোকেশন খোঁজা হচ্ছে…", until: "পর্যন্ত", today: "আজ", hub: "নামাজ ও কিবলা হাব খুলুন" },
    ar: { more: "المزيد", eyebrow: "مواقيت الصلاة", allow: "استخدم موقعي", noLoc: "اسمح بالموقع أو اختر مدينة لعرض مواقيت اليوم.", locating: "جارٍ تحديد موقعك…", until: "حتى", today: "اليوم", hub: "افتح الصلاة والقبلة" }
  });

  function openHub(tab) { X.whenReady("MHSPrayerHub", function (h) { h.open({ tab: tab || "times" }); }); }

  var Strip = class extends HTMLElement {
    static get observedAttributes() { return ["lang"]; }
    connectedCallback() {
      var self = this;
      this._tick = function () { if (!document.hidden && self.isConnected) self.update(); };
      this._re = function () { self.render(); };
      this._vis = function () { if (!document.hidden) { self.render(); self.start(); } else self.stop(); };
      window.addEventListener("mhs-prayer-change", this._re);
      document.addEventListener("visibilitychange", this._vis);
      this.render(); this.start();
    }
    disconnectedCallback() { this.stop(); window.removeEventListener("mhs-prayer-change", this._re); document.removeEventListener("visibilitychange", this._vis); }
    attributeChangedCallback() { if (this.isConnected) this.render(); }
    start() { this.stop(); this._iv = setInterval(this._tick, 1000); }
    stop() { clearInterval(this._iv); this._iv = null; }
    render() {
      var M = T();
      if (!M) { setTimeout(this._re, 200); return; }
      var host = this, wrap = X.el("section", { class: "panel mhs-ps", "aria-label": t("eyebrow"), dir: X.lang() === "ar" ? "rtl" : "ltr" });
      var head = X.el("div", { class: "mhs-ps-head" }, [
        X.el("div", { class: "mhs-ps-ttl" }, [X.el("span", { class: "mhs-ps-eyebrow", text: "🕌 " + t("eyebrow") }), X.el("b", { class: "mhs-ps-headline", "aria-live": "polite" })]),
        X.el("button", { type: "button", class: "mhs-ps-more", "aria-label": t("hub"), on: { click: function () { openHub("times"); } } }, [t("more"), X.el("span", { "aria-hidden": "true", text: " ›" })])
      ]);
      wrap.appendChild(head);
      if (!M.hasLocation()) {
        var msg = X.el("p", { class: "mhs-ps-msg", text: t("noLoc") });
        var btn = X.el("button", { type: "button", class: "mhs-btn primary", text: t("allow"), on: { click: function () {
          btn.disabled = true; msg.textContent = t("locating");
          var P = window.MHSPrayer;
          (P && P.enableLocation ? P.enableLocation() : Promise.resolve("unsupported")).then(function () { host.render(); });
        } } });
        wrap.append(msg, X.el("div", { class: "mhs-ps-actions" }, [btn, X.el("button", { type: "button", class: "mhs-btn", text: t("more"), on: { click: function () { openHub("settings"); } } })]));
        this.replaceChildren(wrap); return;
      }
      var grid = X.el("div", { class: "mhs-ps-grid", role: "list" });
      M.FARD.forEach(function (id) {
        grid.appendChild(X.el("button", { type: "button", role: "listitem", class: "mhs-ps-p", "data-id": id, on: { click: function () { openHub("times"); } } }, [
          X.el("span", { class: "mhs-ps-ico", "aria-hidden": "true" }), X.el("span", { class: "mhs-ps-n" }), X.el("span", { class: "num mhs-ps-s" }), X.el("span", { class: "num mhs-ps-e" }), X.el("span", { class: "num mhs-ps-cd" })
        ]));
      });
      wrap.appendChild(grid);
      wrap.appendChild(X.el("div", { class: "mhs-ps-bar", "aria-hidden": "true" }, [X.el("i")]));
      this.replaceChildren(wrap);
      this.update(true);
    }
    update(force) {
      var M = T(); if (!M || !M.hasLocation()) return;
      var s = M.status(); if (!s) return;
      var head = this.querySelector(".mhs-ps-headline"); if (!head) return;
      if (head.textContent !== s.headline) head.textContent = s.headline;
      var now = s.now, activeId = s.active && s.active.id, nextId = s.next && !s.next.tomorrow ? s.next.id : (s.next && s.next.tomorrow && s.next.id === "fajr" ? "fajr" : null);
      var changed = false;
      this.querySelectorAll(".mhs-ps-p").forEach(function (el) {
        var id = el.getAttribute("data-id"), w = s.fard.filter(function (x) { return x.id === id; })[0]; if (!w) return;
        var isNow = id === activeId, isNext = id === nextId && !isNow, past = !isNow && now >= (w.softEnd || w.end);
        var state = isNow ? "now" : isNext ? "next" : past ? "past" : "";
        if (el.getAttribute("data-state") !== state) { el.setAttribute("data-state", state); el.classList.toggle("is-now", isNow); el.classList.toggle("is-next", isNext); el.classList.toggle("is-past", past); changed = true; }
        if (force || changed) {
          el.querySelector(".mhs-ps-ico").textContent = w.icon;
          el.querySelector(".mhs-ps-n").textContent = w.name;
          el.querySelector(".mhs-ps-s").textContent = M.fmt(w.start, { noAmPm: true });
          el.querySelector(".mhs-ps-e").textContent = "→ " + M.fmt(w.end, { noAmPm: true });
        }
        var cd = el.querySelector(".mhs-ps-cd"), txt = isNow ? M.countdown(w.end - now) + " " + M.t("left") : isNext ? "▸ " + M.countdown(w.start - now) : "";
        if (cd.textContent !== txt) cd.textContent = txt;
      });
      var bar = this.querySelector(".mhs-ps-bar i");
      if (bar && s.active) { var p = Math.min(1, Math.max(0, (now - s.active.start) / (s.active.end - s.active.start))); bar.style.width = (p * 100).toFixed(2) + "%"; bar.parentNode.classList.toggle("is-forbidden", !!s.forbidden); }
      else if (bar) { bar.style.width = "0%"; }
      if (changed && !force) { this.classList.add("is-transition"); var self = this; setTimeout(function () { self.classList.remove("is-transition"); }, 900); }
    }
  };
  customElements.define("mhs-prayer-strip", Strip);

  /* Mount at the very top of Home. The dashboard is React-rendered; we insert a foreign node
   * as its first child and re-insert whenever the dashboard is re-created. */
  function mount() {
    var main = document.querySelector("main"); if (!main) return;
    var home = main.querySelector(".space-y-8"); if (!home) return;
    if (!home.querySelector('[data-tour="home-check"]') && !home.querySelector("mhs-overview")) return; // not the Home tab
    if (home.firstElementChild && home.firstElementChild.tagName === "MHS-PRAYER-STRIP") return;
    var old = document.querySelector("mhs-prayer-strip"); if (old) old.remove();
    var el = document.createElement("mhs-prayer-strip"); el.setAttribute("lang", document.documentElement.lang || "en");
    home.insertBefore(el, home.firstChild);
  }
  var pending = false;
  new MutationObserver(function () { if (pending) return; pending = true; requestAnimationFrame(function () { pending = false; mount(); }); })
    .observe(document.getElementById("root") || document.body, { childList: true, subtree: true });
  mount();
})();
