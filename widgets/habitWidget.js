/* Muhasabah widgets — Habit check-in widget. Circular checkboxes, instant optimistic feedback. */
(function () {
  "use strict";
  var S = window.MHSWidgetStore, U = window.MHSWidgetUI;

  function render(host, data, opts) {
    opts = opts || {};
    var items = S.habitsToday(data);
    var list = U.el("ul", { class: "wg-list wg-habits", role: "list" });
    if (!items.length) list.appendChild(U.el("li", { class: "wg-empty", text: U.t("noHabits") }));
    items.sort(function (a, b) { return (a.done - b.done) || (a.missed - b.missed) || (a.deadline - b.deadline); })
      .slice(0, opts.limit || 50)
      .forEach(function (it) {
        var h = it.h, li = U.el("li", { class: "wg-row" + (it.done ? " is-done" : "") + (it.missed && !it.done ? " is-missed" : "") });
        var cb = U.check(it.done, h.title, function () {
          if (it.done || cb.disabled) return;
          cb.classList.add("is-done", "is-pop"); cb.setAttribute("aria-checked", "true"); li.classList.add("is-done"); U.haptic(18);
          cb.disabled = true;
          S.checkHabit(h.id).then(function (r) {
            if (r.ok && r.via === "app" && r.data && !S.habitsToday(r.data).some(function (x) { return x.h.id === h.id && x.done; })) r = { ok: false, reason: "deadline" };
            if (!r.ok) {
              cb.classList.remove("is-done", "is-pop"); cb.setAttribute("aria-checked", "false"); li.classList.remove("is-done"); cb.disabled = false;
              U.toast(r.reason === "waqt" ? U.t("waqt", { t: r.at }) : U.t(r.reason === "deadline" ? "deadline" : "missing"), "warn");
              return;
            }
            U.toast(U.t("checked", { p: U.num(Number(h.points) || 0) }), "ok");
            opts.onChange && opts.onChange(r.data);
          });
        }, it.missed && !it.done);
        var dl = U.el("small", { text: it.done ? U.t("done") : it.missed ? U.t("missed") : U.t("due", { t: S.hm(it.deadline) }) });
        li.append(cb, U.el("span", { class: "wg-ico", "aria-hidden": "true", text: h.icon || "🕌" }), U.el("span", { class: "wg-txt" }, [U.el("b", { text: h.title }), dl]), U.el("span", { class: "wg-pts", text: "+" + U.num(Number(h.points) || 0) }));
        list.appendChild(li);
      });
    host.replaceChildren(list);
    return items;
  }
  window.MHSHabitWidget = { render: render };
})();
