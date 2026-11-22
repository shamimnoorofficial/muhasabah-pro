/* <mhs-footer> — app footer: copyright, legal links and the developer signature.
 * Rendered as the last child of the main content, so it scrolls with the page and the
 * main container's bottom padding keeps it clear of the mobile navigation bar. */
(function () {
  "use strict";
  if (!window.customElements || customElements.get("mhs-footer")) return;
  var X = window.MHSX;
  var t = X.tr({
    en: { rights: "All rights reserved.", dev: "Developed by", privacy: "Privacy", terms: "Terms", refund: "Refunds", rating: "Rated Everyone", about: "About", gh: "Open Shamim Noor's website in a new tab" },
    bn: { rights: "সর্বস্বত্ব সংরক্ষিত।", dev: "ডেভেলপ করেছেন", privacy: "গোপনীয়তা", terms: "শর্তাবলি", refund: "রিফান্ড", rating: "সবার জন্য উপযোগী", about: "পরিচিতি", gh: "নতুন ট্যাবে শামীম নূরের ওয়েবসাইট খুলুন" }
  });
  var GH = '<svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10Z"/></svg>';
  function render(host) {
    var y = new Date().getFullYear();
    host.replaceChildren(X.el("footer", { class: "mhs-foot", dir: X.lang() === "ar" ? "rtl" : "ltr" }, [
      X.el("div", { class: "mhs-foot-row" }, [
        X.el("span", { class: "mhs-foot-copy", text: "© " + X.num(y, { useGrouping: false }) + " Muhasabah: Islamic Lifestyle. " + t("rights") }),
        X.el("a", { class: "mhs-foot-dev", href: "https://shamimnoor.dev", target: "_blank", rel: "noopener noreferrer", "aria-label": t("gh"), title: "shamimnoor.dev" }, [
          X.el("span", { class: "gh", html: GH }),
          X.el("span", { class: "by", text: t("dev") }),
          X.el("b", { text: "Shamim Noor" }),
          X.el("span", { class: "arrow", "aria-hidden": "true", text: "↗" })
        ])
      ]),
      X.el("nav", { class: "mhs-foot-links", "aria-label": "Legal" }, [
        X.el("a", { href: "/about", text: t("about") }),
        X.el("a", { href: "/legal/privacy", text: t("privacy") }),
        X.el("a", { href: "/legal/terms", text: t("terms") }),
        X.el("a", { href: "/legal/refund", text: t("refund") }),
        X.el("a", { href: "/legal/content-rating", text: t("rating") })
      ])
    ]));
  }
  customElements.define("mhs-footer", class extends HTMLElement {
    connectedCallback() { render(this); }
    static get observedAttributes() { return ["lang"]; }
    attributeChangedCallback() { if (this.isConnected) render(this); }
  });
})();
