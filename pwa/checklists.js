/* MHSChecklists — reusable checklists, Google Keep style.
 * Create: type an item, press Enter for the next one (paste several lines at once), then "Add list".
 * Use: ticked items move to a "Completed" group at the bottom; unticking returns an item to its
 * original place (by the time it was added). "Uncheck all" makes the same list ready again, so a
 * shopping list or a travel list never needs to be rewritten.
 * Data: MHSX "checklists" → [{ id, title, items:[{ id, text, done, at, doneAt }], at, updatedAt }],
 * part of the local backup and sync. Shown as a section in the To-Do tab and in the quick-add sheet. */
(function () {
  'use strict';
  if (window.MHSChecklists) return;
  var X = window.MHSX;
  function L(en, bn, ar) { return X.lang() === 'bn' ? bn : X.lang() === 'ar' ? ar : en; }
  function lists() { var v = X.get('checklists', []); return Array.isArray(v) ? v : []; }
  function save(all) { X.set('checklists', all); render(); document.dispatchEvent(new CustomEvent('mhs:checklists')); }
  function find(id) { return lists().filter(function (l) { return l.id === id; })[0]; }
  function update(id, fn) { var all = lists(), l = all.filter(function (x) { return x.id === id; })[0]; if (!l) return; fn(l); l.updatedAt = Date.now(); save(all); }
  function sorted(l) {
    var open = l.items.filter(function (i) { return !i.done; }).sort(function (a, b) { return a.at - b.at; });
    var done = l.items.filter(function (i) { return i.done; }).sort(function (a, b) { return (b.doneAt || 0) - (a.doneAt || 0); });
    return { open: open, done: done };
  }
  function item(text, at) { return { id: X.uid ? X.uid() : 'i' + Date.now() + Math.random().toString(36).slice(2, 6), text: String(text).trim().slice(0, 300), done: false, at: at || Date.now(), doneAt: null }; }
  function check(id, itemId, on) {
    update(id, function (l) { l.items.forEach(function (i) { if (i.id === itemId) { i.done = on; i.doneAt = on ? Date.now() : null; } }); });
    X.haptic(on ? 14 : 6);
  }

  /* ---------- composer: Enter → next row ---------- */
  function composer(opts) {
    opts = opts || {};
    var wrap = X.el('div', { class: 'mhs-cl-compose' });
    var title = X.el('input', { class: 'mhs-cl-title-in', placeholder: L('List title (e.g. Groceries, Travel, Ramadan prep)', 'তালিকার নাম (যেমন: বাজার, ভ্রমণ, রমজানের প্রস্তুতি)', 'عنوان القائمة (مثل: البقالة، السفر، استعداد رمضان)'), 'aria-label': L('List title', 'তালিকার নাম', 'عنوان القائمة'), maxlength: 80, enterkeyhint: 'next', value: opts.title || '' });
    var rows = X.el('ol', { class: 'mhs-cl-rows' });
    function row(value, focus, after) {
      var input = X.el('input', { class: 'mhs-cl-row-in', placeholder: L('List item', 'তালিকার আইটেম', 'عنصر'), 'aria-label': L('List item', 'তালিকার আইটেম', 'عنصر'), maxlength: 300, enterkeyhint: 'enter', value: value || '' });
      var li = X.el('li', {}, [X.el('span', { class: 'mhs-cl-box', 'aria-hidden': 'true' }), input, X.el('button', { type: 'button', class: 'mhs-cl-x', 'aria-label': L('Remove item', 'আইটেম সরান', 'إزالة العنصر'), text: '×', on: { click: function () { var prev = li.previousSibling || li.nextSibling; li.remove(); if (!rows.children.length) row('', true); else if (prev) prev.querySelector('input').focus(); } } })]);
      input.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' && !e.isComposing) { e.preventDefault(); if (!input.value.trim()) return; var next = li.nextSibling; if (next && !next.querySelector('input').value) next.querySelector('input').focus(); else row('', true, li); }
        else if (e.key === 'Backspace' && !input.value && rows.children.length > 1) { e.preventDefault(); var prev = li.previousSibling || li.nextSibling; li.remove(); prev.querySelector('input').focus(); }
      });
      input.addEventListener('paste', function (e) {
        var text = (e.clipboardData || window.clipboardData).getData('text'); if (!/\n/.test(text)) return;
        e.preventDefault(); var parts = text.split(/\r?\n/).map(function (s) { return s.replace(/^\s*(?:[-*•☐☑✓✔]|\d+[.)]|\[[ x]\])\s*/i, '').trim(); }).filter(Boolean);
        if (!parts.length) return; input.value = (input.value + parts.shift()).slice(0, 300); var at = li; parts.forEach(function (p) { at = row(p, false, at); }); at.querySelector('input').focus();
      });
      if (after && after.nextSibling) rows.insertBefore(li, after.nextSibling); else rows.appendChild(li);
      if (focus) { if (input.isConnected) input.focus(); else setTimeout(function () { input.focus(); }, 0); }
      return li;
    }
    title.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); rows.querySelector('input').focus(); } });
    (opts.items && opts.items.length ? opts.items : ['']).forEach(function (v) { row(v); });
    wrap.append(title, rows, X.el('p', { class: 'mhs-mini-note', text: L('Press Enter for the next item. Paste a list to add many at once.', 'পরের আইটেমের জন্য Enter চাপুন। একসাথে অনেকগুলো যোগ করতে তালিকা পেস্ট করুন।', 'اضغط Enter للعنصر التالي. الصق قائمة لإضافة عدة عناصر.') }));
    return {
      el: wrap, focus: function () { (title.value ? rows.querySelector('input') : title).focus(); },
      value: function () { return { title: title.value.trim(), items: Array.prototype.map.call(rows.querySelectorAll('input'), function (i) { return i.value.trim(); }).filter(Boolean) }; }
    };
  }
  function create(v) {
    if (!v.items.length) { X.toast(L('Add at least one item', 'অন্তত একটি আইটেম যোগ করুন', 'أضف عنصراً واحداً على الأقل')); return null; }
    var now = Date.now(), l = { id: 'cl' + now.toString(36) + Math.random().toString(36).slice(2, 5), title: v.title || L('Checklist', 'চেকলিস্ট', 'قائمة تحقق'), items: v.items.map(function (t, i) { return item(t, now + i); }), at: now, updatedAt: now };
    var all = lists(); all.unshift(l); save(all);
    if (window.MHSSaveFX && window.MHSSaveFX.flash) window.MHSSaveFX.flash({ message: L('Checklist added', 'চেকলিস্ট যোগ হয়েছে', 'تمت إضافة القائمة') + ' · ' + X.num(l.items.length) }); else X.toast(L('Checklist added', 'চেকলিস্ট যোগ হয়েছে', 'تمت إضافة القائمة'));
    return l;
  }
  function newList(seed) {
    var sh = X.sheet({ id: 'mhs-checklist-new', title: L('New checklist', 'নতুন চেকলিস্ট', 'قائمة تحقق جديدة'), sub: L('Reusable list · tick, untick, reuse', 'বারবার ব্যবহারযোগ্য তালিকা', 'قائمة قابلة لإعادة الاستخدام') });
    var c = composer({ items: seed ? [seed] : [] }); sh.body.appendChild(c.el);
    sh.body.appendChild(X.el('div', { class: 'mhs-actions' }, [X.el('button', { type: 'button', class: 'mhs-btn primary', text: '＋ ' + L('Add list', 'তালিকা যোগ করুন', 'إضافة القائمة'), on: { click: function () { if (create(c.value())) sh.close(); } } })]));
    c.focus();
  }

  /* ---------- one list ---------- */
  var openId = null, sheet = null, showDone = true;
  function open(id) {
    if (!find(id)) return;
    openId = id;
    if (!sheet || !sheet.dialog.open) sheet = X.sheet({ id: 'mhs-checklist', title: '', onClose: function () { sheet = null; openId = null; } });
    draw();
  }
  function draw() {
    if (!sheet || !openId) return;
    var l = find(openId); if (!l) { sheet.close(); return; }
    var s = sorted(l), b = sheet.body, focusAdd = document.activeElement && document.activeElement.classList.contains('mhs-cl-add-in');
    sheet.setTitle(l.title, X.num(s.done.length) + ' / ' + X.num(l.items.length) + ' ' + L('done', 'সম্পন্ন', 'مكتمل'));
    b.replaceChildren();
    var title = X.el('input', { class: 'mhs-cl-title-in', value: l.title, maxlength: 80, 'aria-label': L('List title', 'তালিকার নাম', 'عنوان القائمة') });
    title.addEventListener('change', function () { var v = title.value.trim(); if (v) update(l.id, function (x) { x.title = v; }); });
    var pct = l.items.length ? Math.round(s.done.length / l.items.length * 100) : 0;
    var bar = X.el('div', { class: 'mhs-cl-progress', role: 'progressbar', 'aria-valuemin': 0, 'aria-valuemax': 100, 'aria-valuenow': pct }, [X.el('i', { style: { width: pct + '%' } })]);
    var add = X.el('input', { class: 'mhs-cl-add-in', placeholder: '＋ ' + L('Add item', 'আইটেম যোগ করুন', 'أضف عنصراً'), 'aria-label': L('Add item', 'আইটেম যোগ করুন', 'أضف عنصراً'), maxlength: 300, enterkeyhint: 'enter' });
    add.addEventListener('keydown', function (e) { if (e.key === 'Enter' && !e.isComposing) { e.preventDefault(); var v = add.value.trim(); if (!v) return; update(l.id, function (x) { x.items.push(item(v)); }); } });
    add.addEventListener('paste', function (e) { var text = (e.clipboardData || window.clipboardData).getData('text'); if (!/\n/.test(text)) return; e.preventDefault(); var parts = text.split(/\r?\n/).map(function (x) { return x.trim(); }).filter(Boolean), now = Date.now(); update(l.id, function (x) { parts.forEach(function (p, i) { x.items.push(item(p, now + i)); }); }); });
    function row(i) {
      var cb = X.el('input', { type: 'checkbox', checked: i.done ? true : null, 'aria-label': i.text, on: { change: function () { li.classList.add(cb.checked ? 'is-checking' : 'is-unchecking'); setTimeout(function () { check(l.id, i.id, cb.checked); }, 180); } } });
      var text = X.el('input', { class: 'mhs-cl-text', value: i.text, maxlength: 300, 'aria-label': L('Edit item', 'আইটেম সম্পাদনা', 'تعديل العنصر') });
      text.addEventListener('change', function () { var v = text.value.trim(); update(l.id, function (x) { x.items = v ? x.items.map(function (y) { if (y.id === i.id) y.text = v; return y; }) : x.items.filter(function (y) { return y.id !== i.id; }); }); });
      text.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); text.blur(); add.focus(); } });
      var li = X.el('li', { class: 'mhs-cl-item' + (i.done ? ' is-done' : '') }, [X.el('label', { class: 'mhs-cl-check' }, [cb, X.el('span', { 'aria-hidden': 'true' })]), text,
        X.el('button', { type: 'button', class: 'mhs-cl-x', 'aria-label': L('Delete item', 'আইটেম মুছুন', 'حذف العنصر'), text: '×', on: { click: function () { update(l.id, function (x) { x.items = x.items.filter(function (y) { return y.id !== i.id; }); }); } } })]);
      return li;
    }
    var openList = X.el('ul', { class: 'mhs-cl-list' }, s.open.map(row));
    b.append(title, bar, add, openList);
    if (!s.open.length && l.items.length) b.appendChild(X.el('p', { class: 'mhs-cl-alldone', text: '🎉 ' + L('All done! Uncheck all to use this list again.', 'সব সম্পন্ন! আবার ব্যবহার করতে সব আনচেক করুন।', 'اكتمل الكل! ألغِ التحديد لإعادة استخدامها.') }));
    if (s.done.length) {
      var head = X.el('button', { type: 'button', class: 'mhs-cl-donehead', 'aria-expanded': String(showDone), on: { click: function () { showDone = !showDone; draw(); } } }, [X.el('span', { text: (showDone ? '▾ ' : '▸ ') + X.num(s.done.length) + ' ' + L('completed', 'সম্পন্ন', 'مكتمل') })]);
      b.append(head); if (showDone) b.appendChild(X.el('ul', { class: 'mhs-cl-list is-done' }, s.done.map(row)));
    }
    b.appendChild(X.el('div', { class: 'mhs-cl-tools' }, [
      s.done.length ? X.el('button', { type: 'button', class: 'mhs-btn', text: '↺ ' + L('Uncheck all', 'সব আনচেক করুন', 'إلغاء تحديد الكل'), on: { click: function () { update(l.id, function (x) { x.items.forEach(function (y) { y.done = false; y.doneAt = null; }); }); X.toast(L('Ready to use again', 'আবার ব্যবহারের জন্য প্রস্তুত', 'جاهزة للاستخدام مجدداً')); } } }) : null,
      s.done.length ? X.el('button', { type: 'button', class: 'mhs-btn', text: L('Delete ticked items', 'টিক দেওয়া আইটেম মুছুন', 'حذف المحددة'), on: { click: function () { update(l.id, function (x) { x.items = x.items.filter(function (y) { return !y.done; }); }); } } }) : null,
      X.el('button', { type: 'button', class: 'mhs-btn', text: L('Share', 'শেয়ার', 'مشاركة'), on: { click: function () { var all = sorted(find(l.id)); X.share(l.title + '\n' + all.open.map(function (i) { return '☐ ' + i.text; }).concat(all.done.map(function (i) { return '☑ ' + i.text; })).join('\n'), l.title); } } }),
      window.MHSApp && window.MHSApp.addTodo ? X.el('button', { type: 'button', class: 'mhs-btn', text: L('Add open items to today\'s To-Do', 'বাকি আইটেম আজকের টু-ডুতে যোগ', 'أضف المتبقي إلى مهام اليوم'), on: { click: function () { var n = 0; sorted(find(l.id)).open.forEach(function (i) { if (window.MHSApp.addTodo(i.text)) n++; }); X.toast(X.num(n) + ' ' + L('to-dos added', 'টি টু-ডু যোগ হয়েছে', 'مهام أضيفت')); } } }) : null,
      X.el('button', { type: 'button', class: 'mhs-btn mhs-cl-danger', text: L('Delete list', 'তালিকা মুছুন', 'حذف القائمة'), on: { click: function (e) { var btn = e.currentTarget; if (!btn.dataset.armed) { btn.dataset.armed = '1'; btn.textContent = L('Tap again to delete', 'মুছতে আবার চাপুন', 'اضغط مرة أخرى للحذف'); setTimeout(function () { if (btn.isConnected) { delete btn.dataset.armed; btn.textContent = L('Delete list', 'তালিকা মুছুন', 'حذف القائمة'); } }, 4000); return; } save(lists().filter(function (x) { return x.id !== l.id; })); sheet && sheet.close(); } } })
    ]));
    if (focusAdd) add.focus();
  }

  /* ---------- section in the To-Do tab ---------- */
  function card(l) {
    var s = sorted(l), pct = l.items.length ? s.done.length / l.items.length : 0;
    var preview = X.el('ul', { class: 'mhs-cl-mini' }, s.open.slice(0, 4).map(function (i) {
      var cb = X.el('input', { type: 'checkbox', 'aria-label': i.text, on: { click: function (e) { e.stopPropagation(); }, change: function () { check(l.id, i.id, cb.checked); } } });
      return X.el('li', {}, [X.el('label', { class: 'mhs-cl-check', on: { click: function (e) { e.stopPropagation(); } } }, [cb, X.el('span', { 'aria-hidden': 'true' })]), X.el('span', { class: 't', text: i.text })]);
    }));
    var more = s.open.length > 4 ? X.el('small', { class: 'mhs-cl-more', text: '+' + X.num(s.open.length - 4) + ' ' + L('more', 'আরও', 'أخرى') }) : null;
    return X.el('article', { class: 'mhs-cl-card' + (!s.open.length && l.items.length ? ' is-complete' : ''), tabindex: 0, role: 'button', 'aria-label': l.title, on: { click: function () { open(l.id); }, keydown: function (e) { if (e.key === 'Enter' && e.target === e.currentTarget) open(l.id); } } }, [
      X.el('header', {}, [X.el('b', { text: l.title }), X.el('span', { class: 'n', text: X.num(s.done.length) + '/' + X.num(l.items.length) })]),
      X.el('div', { class: 'mhs-cl-progress' }, [X.el('i', { style: { width: Math.round(pct * 100) + '%' } })]),
      s.open.length ? preview : X.el('p', { class: 'mhs-cl-alldone', text: '✓ ' + L('All done', 'সব সম্পন্ন', 'اكتمل الكل') }), more]);
  }
  var hostEl = null;
  function section() {
    var all = lists();
    var el = X.el('section', { class: 'mhs-cl-section panel', 'aria-label': L('Checklists', 'চেকলিস্ট', 'قوائم التحقق') });
    el.appendChild(X.el('div', { class: 'mhs-cl-head' }, [X.el('div', {}, [X.el('h3', { text: '☑ ' + L('Checklists', 'চেকলিস্ট', 'قوائم التحقق') }), X.el('p', { class: 'mhs-todo-sub', text: L('Reusable lists — tick, untick, use again', 'বারবার ব্যবহারযোগ্য তালিকা — টিক দিন, আনটিক করুন, আবার ব্যবহার করুন', 'قوائم قابلة لإعادة الاستخدام') })]),
      X.el('button', { type: 'button', class: 'mhs-btn primary mhs-cl-new', text: '＋ ' + L('New list', 'নতুন তালিকা', 'قائمة جديدة'), on: { click: function () { newList(); } } })]));
    if (!all.length) el.appendChild(X.el('button', { type: 'button', class: 'mhs-cl-empty', on: { click: function () { newList(); } } }, [X.el('span', { text: '☑' }), X.el('b', { text: L('Create your first checklist', 'প্রথম চেকলিস্ট তৈরি করুন', 'أنشئ أول قائمة تحقق') }), X.el('small', { text: L('Groceries, travel packing, Ramadan or Hajj preparation…', 'বাজার, ভ্রমণের গোছগাছ, রমজান বা হজের প্রস্তুতি…', 'البقالة، حقيبة السفر، الاستعداد لرمضان أو الحج…') })]));
    else el.appendChild(X.el('div', { class: 'mhs-cl-grid' }, all.map(card)));
    return el;
  }
  function render() {
    var panel = document.querySelector('.mhs-todo-panel');
    if (!panel) { if (hostEl) hostEl.remove(); hostEl = null; draw(); return; }
    var fresh = section();
    if (hostEl && hostEl.isConnected) hostEl.replaceWith(fresh); else panel.insertAdjacentElement('afterend', fresh);
    hostEl = fresh; draw();
  }
  var queued = false;
  new MutationObserver(function () {
    if (queued) return; queued = true;
    requestAnimationFrame(function () { queued = false; var panel = document.querySelector('.mhs-todo-panel'); if (panel && (!hostEl || !hostEl.isConnected || hostEl.previousElementSibling !== panel)) render(); });
  }).observe(document.body, { childList: true, subtree: true });
  document.addEventListener('mhs:extras', render);
  X.on(function (key) { if (key === 'checklists' || key === '*') { if (hostEl) render(); } });

  window.MHSChecklists = { list: lists, open: open, create: function (title, items) { return create({ title: title || '', items: items || [] }); }, newList: newList, composer: composer, add: create, check: check };
})();
