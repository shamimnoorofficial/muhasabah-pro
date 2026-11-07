/* Muhasabah widgets — boot. Views: ?view=today (default) | habits | todo  (&add=1 focuses quick add). */
(function () {
  "use strict";
  var S = window.MHSWidgetStore, U = window.MHSWidgetUI;
  var q = new URLSearchParams(location.search), view = q.get("view") || "today";
  if (["today", "habits", "todo", "custom"].indexOf(view) === -1) view = "today";
  /* Configurable widget built by the Widget Wizard in the app → delegated to customWidget.js */
  if (view === "custom" && window.MHSCustomWidget) { window.MHSCustomWidget.boot(); return; }
  var $ = function (id) { return document.getElementById(id); };

  function summary(data) {
    var items = S.habitsToday(data), done = items.filter(function (x) { return x.done; }).length;
    var box = $("wg-summary");
    var r = U.el("div", { class: "wg-ring" }, [U.ring(items.length ? done / items.length : 0, 68), U.el("b", { text: items.length ? Math.round(100 * done / items.length) + "%" : "—" })]);
    box.replaceChildren(r,
      U.el("div", { class: "wg-sum-txt" }, [
        U.el("b", { text: U.num(done) + " " + U.t("of") + " " + U.num(items.length) + " " + U.t("habits").toLowerCase() }),
        U.el("small", { text: new Date().toLocaleDateString(document.documentElement.lang || undefined, { weekday: "long", day: "numeric", month: "long" }) })
      ]),
      U.el("div", { class: "wg-kpis" }, [
        U.el("span", null, [U.el("b", { text: U.num(S.balance(data)) }), U.el("small", { text: U.t("points") })]),
        U.el("span", null, [U.el("b", { text: "🔥 " + U.num(S.streak(data)) }), U.el("small", { text: U.t("streak") })])
      ]));
  }

  function draw(data) {
    if (data && data.lang) U.setLang(data.lang);
    document.querySelectorAll("[data-t]").forEach(function (n) { n.textContent = U.t(n.getAttribute("data-t")); });
    var add = $("wg-add-placeholder"); if (add) add.placeholder = U.t("add");
    summary(data);
    document.querySelectorAll(".wg-tab").forEach(function (b) { var on = b.getAttribute("data-view") === view; b.classList.toggle("is-on", on); b.setAttribute("aria-selected", on ? "true" : "false"); });
    $("wg-habits-sec").hidden = view === "todo";
    $("wg-todo-sec").hidden = view === "habits";
    window.MHSHabitWidget.render($("wg-habits"), data, { onChange: refresh, limit: view === "today" ? 8 : 50 });
    window.MHSTodoWidget.render($("wg-todos"), data, { onChange: refresh, limit: view === "today" ? 6 : 50, focus: q.get("add") === "1" && view !== "habits" });
    q.delete("add");
  }
  function refresh(data) { if (data) draw(data); else S.load().then(draw); }

  document.querySelectorAll(".wg-tab").forEach(function (b) {
    b.addEventListener("click", function () {
      view = b.getAttribute("data-view");
      try { history.replaceState(null, "", "?view=" + view); } catch (e) {}
      refresh();
    });
  });
  S.onChange(function (d) { refresh(d); $("wg-sync").textContent = U.t("live"); });
  document.addEventListener("visibilitychange", function () { if (!document.hidden) refresh(); });
  S.load().then(draw);
  if (!window.matchMedia("(display-mode: standalone)").matches) { var tip = $("wg-tip"); if (tip) tip.hidden = false; }
  if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(function () {});
})();
