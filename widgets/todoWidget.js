/* Muhasabah widgets — To-Do widget: quick add + one-tap completion. */
(function () {
  "use strict";
  var S = window.MHSWidgetStore, U = window.MHSWidgetUI;

  function render(host, data, opts) {
    opts = opts || {};
    var todos = (data.todos || []).filter(function (x) { return x && (x.status !== "done" || (x.doneAt && new Date(x.doneAt).toDateString() === new Date().toDateString())); })
      .sort(function (a, b) { return ((a.status === "done") - (b.status === "done")) || ((b.createdAt || 0) - (a.createdAt || 0)); });
    var list = U.el("ul", { class: "wg-list wg-todos", role: "list" });
    if (!todos.length) list.appendChild(U.el("li", { class: "wg-empty", text: U.t("noTodos") }));
    todos.slice(0, opts.limit || 50).forEach(function (td) {
      var done = td.status === "done", li = U.el("li", { class: "wg-row" + (done ? " is-done" : "") });
      var cb = U.check(done, td.title, function () {
        if (done || cb.disabled) return;
        cb.disabled = true; cb.classList.add("is-done", "is-pop"); cb.setAttribute("aria-checked", "true"); li.classList.add("is-done"); U.haptic(18);
        S.checkTodo(td.id).then(function (r) {
          if (!r.ok) { cb.disabled = false; cb.classList.remove("is-done", "is-pop"); cb.setAttribute("aria-checked", "false"); li.classList.remove("is-done"); U.toast(U.t("missing"), "warn"); return; }
          var p = Math.abs(Number(td.points) || 0);
          U.toast(p ? U.t("checked", { p: U.num(p) }) : U.t("done"), "ok");
          opts.onChange && opts.onChange(r.data);
        });
      });
      li.append(cb, U.el("span", { class: "wg-ico", "aria-hidden": "true", text: td.icon || "📌" }), U.el("span", { class: "wg-txt" }, [U.el("b", { text: td.title })]), Number(td.points) ? U.el("span", { class: "wg-pts", text: "+" + U.num(Math.abs(Number(td.points))) }) : null);
      list.appendChild(li);
    });
    var input = U.el("input", { type: "text", class: "wg-add-in", placeholder: U.t("add"), "aria-label": U.t("add"), maxlength: "140", enterkeyhint: "done", autocomplete: "off" });
    var form = U.el("form", { class: "wg-add", on: { submit: function (e) {
      e.preventDefault();
      var v = input.value.trim();
      if (v.length < 2) { U.toast(U.t("short"), "warn"); return; }
      input.value = ""; U.haptic(10);
      S.addTodo(v).then(function (r) { if (r.ok) { U.toast(U.t("added"), "ok"); opts.onChange && opts.onChange(r.data); } });
    } } }, [input, U.el("button", { type: "submit", class: "wg-add-go", "aria-label": U.t("addBtn"), text: "+" })]);
    host.replaceChildren(form, list);
    if (opts.focus) setTimeout(function () { input.focus(); }, 60);
    return todos;
  }
  window.MHSTodoWidget = { render: render };
})();
