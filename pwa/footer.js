/* <mhs-footer> — app footer: copyright, legal links and the developer signature.
 * Rendered as the last child of the main content, so it scrolls with the page and the
 * main container's bottom padding keeps it clear of the mobile navigation bar. */
(function () {
  "use strict";
  if (!window.customElements || customElements.get("mhs-footer")) return;
  var X = window.MHSX;
  var t = X.tr({
    en: { rights: "All rights reserved.", dev: "Developed by", privacy: "Privacy", terms: "Terms", refund: "Refunds", rating: "Rated Everyone", gh: "Open Shamim Noor's GitHub profile in a new tab" },
    bn: { rights: "সর্বস্বত্ব সংরক্ষিত।", dev: "ডেভেলপ করেছেন", privacy: "গোপনীয়তা", terms: "শর্তাবলি", refund: "রিফান্ড", rating: "সবার জন্য উপযোগী", gh: "নতুন ট্যাবে শামীম নূরের GitHub প্রোফাইল খুলুন" }
  });
  var GH = '<svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true"><path fill="currentColor" d="M12 .5a11.5 11.5 0 0 0-3.64 22.4c.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.37-3.88-1.37-.53-1.33-1.28-1.69-1.28-1.69-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.68 0-1.26.45-2.28 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.78 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.83 1.19 3.09 0 4.41-2.7 5.38-5.26 5.67.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 12 .5Z"/></svg>';
  function render(host) {
    var y = new Date().getFullYear();
    host.replaceChildren(X.el("footer", { class: "mhs-foot", dir: X.lang() === "ar" ? "rtl" : "ltr" }, [
      X.el("div", { class: "mhs-foot-row" }, [
        X.el("span", { class: "mhs-foot-copy", text: "© " + X.num(y, { useGrouping: false }) + " Muhasabah Pro. " + t("rights") }),
        X.el("a", { class: "mhs-foot-dev", href: "https://github.com/shamimnoorofficial", target: "_blank", rel: "noopener noreferrer", "aria-label": t("gh"), title: "github.com/shamimnoorofficial" }, [
          X.el("span", { class: "gh", html: GH }),
          X.el("span", { class: "by", text: t("dev") }),
          X.el("b", { text: "Shamim Noor" }),
          X.el("span", { class: "arrow", "aria-hidden": "true", text: "↗" })
        ])
      ]),
      X.el("nav", { class: "mhs-foot-links", "aria-label": "Legal" }, [
        X.el("a", { href: "/legal/privacy", text: t("privacy") }), X.el("span", { "aria-hidden": "true", text: "·" }),
        X.el("a", { href: "/legal/terms", text: t("terms") }), X.el("span", { "aria-hidden": "true", text: "·" }),
        X.el("a", { href: "/legal/refund", text: t("refund") }), X.el("span", { "aria-hidden": "true", text: "·" }),
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
