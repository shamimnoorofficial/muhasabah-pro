/* Muhasabah Notes — a Google Keep-style notebook inside the app.
 * Text, checklists, photos, audio recordings and videos; search, pin, archive, tags, colours
 * and an embedded calculator. Notes live in the main data object (MHSX.get/set "notes"), so they
 * are part of backups and sync; media Blobs live in IndexedDB ("media:<id>") on this device.
 *
 * API: MHSNotes.open(opts)  opts.new: "text"|"list"|"image"|"audio"|"video", opts.id: note id
 *      MHSNotes.stats()     → { total, pinned, archived, media, editedToday, week: [7] } */
(function () {
  "use strict";
  if (window.MHSNotes || !window.MHSX) return;
  var X = window.MHSX;
  var MAX = 30 * 1024 * 1024;

  var t = X.tr({
    en: {
      title: "Notes", sub: "Text, lists, photos, audio & video", menuSub: "Keep-style notes with media",
      take: "Take a note…", search: "Search notes", all: "All", pinned: "Pinned", others: "Others", archived: "Archived",
      sTotal: "Notes", sPinned: "Pinned", sMedia: "With media", sWeek: "Edited this week",
      local: "Photos, audio and video stay on this device.", proMedia: "Sync notes to Google Drive — Pro",
      empty: "No notes yet. Tap “Take a note…” to start.", noMatch: "No notes match your search.", emptyArch: "No archived notes.",
      titlePh: "Title", textPh: "Note", tagsPh: "Add tag and press Enter", itemPh: "List item", addItem: "Add item",
      text: "Text note", list: "Checklist", photo: "Photo", audio: "Audio", video: "Video", calc: "Calculator",
      pin: "Pin", unpin: "Unpin", archive: "Archive", unarchive: "Unarchive", del: "Delete", confirm: "Tap again to delete",
      share: "Share", color: "Colour", tags: "Tags", record: "Recording…", stop: "Stop", tooBig: "File is larger than 30 MB",
      mediaFail: "Couldn't save the file", micFail: "Microphone not available — choose an audio file instead",
      deleted: "Note deleted", saved: "Saved", remove: "Remove", edited: "Edited {d}", items: "{a}/{b} done", back: "Back"
    },
    bn: {
      title: "নোট", sub: "লেখা, তালিকা, ছবি, অডিও ও ভিডিও", menuSub: "মিডিয়াসহ কিপ-স্টাইল নোট",
      take: "একটি নোট লিখুন…", search: "নোট খুঁজুন", all: "সব", pinned: "পিন করা", others: "অন্যান্য", archived: "আর্কাইভ",
      sTotal: "নোট", sPinned: "পিন", sMedia: "মিডিয়াসহ", sWeek: "এই সপ্তাহে সম্পাদিত",
      local: "ছবি, অডিও ও ভিডিও এই ডিভাইসেই থাকে।", proMedia: "নোট Google Drive-এ সিঙ্ক — প্রো",
      empty: "এখনো কোনো নোট নেই। “একটি নোট লিখুন…” চাপুন।", noMatch: "খোঁজার সাথে কোনো নোট মেলেনি।", emptyArch: "কোনো আর্কাইভ নোট নেই।",
      titlePh: "শিরোনাম", textPh: "নোট", tagsPh: "ট্যাগ লিখে Enter চাপুন", itemPh: "তালিকার আইটেম", addItem: "আইটেম যোগ",
      text: "লেখা নোট", list: "চেকলিস্ট", photo: "ছবি", audio: "অডিও", video: "ভিডিও", calc: "ক্যালকুলেটর",
      pin: "পিন", unpin: "আনপিন", archive: "আর্কাইভ", unarchive: "আর্কাইভ থেকে ফেরান", del: "মুছুন", confirm: "মুছতে আবার চাপুন",
      share: "শেয়ার", color: "রং", tags: "ট্যাগ", record: "রেকর্ড হচ্ছে…", stop: "থামুন", tooBig: "ফাইলটি ৩০ MB-এর বেশি",
      mediaFail: "ফাইল সংরক্ষণ করা যায়নি", micFail: "মাইক্রোফোন পাওয়া যায়নি — অডিও ফাইল বেছে নিন",
      deleted: "নোট মুছে ফেলা হয়েছে", saved: "সংরক্ষিত", remove: "সরান", edited: "সম্পাদিত {d}", items: "{a}/{b} সম্পন্ন", back: "ফিরে যান"
    }
  });

  var COLORS = [
    { k: "none", c: "transparent" }, { k: "emerald", c: "#00c853" }, { k: "teal", c: "#1de9b6" }, { k: "blue", c: "#448aff" },
    { k: "violet", c: "#b388ff" }, { k: "rose", c: "#ff4081" }, { k: "amber", c: "#ffc400" }, { k: "slate", c: "#90a4ae" }
  ];
  function colorOf(k) { for (var i = 0; i < COLORS.length; i++) if (COLORS[i].k === k) return COLORS[i].c; return "transparent"; }
  var PICKS = ["📝", "💡", "📌", "🕌", "📖", "🛒", "💰", "🎯", "❤️", "⭐"];

  function load() { var a = X.get("notes", []); return Array.isArray(a) ? a.filter(function (n) { return n && n.id; }) : []; }
  function save(arr) { X.set("notes", arr); }
  function isEmpty(n) {
    return !(n.title || "").trim() && !(n.text || "").trim() && !(n.media || []).length &&
      !(n.checklist || []).some(function (i) { return (i.text || "").trim(); });
  }

  function stats() {
    var notes = load(), days = X.lastDays(7).map(X.dayKey), week = [0, 0, 0, 0, 0, 0, 0], today = X.dayKey();
    var out = { total: 0, pinned: 0, archived: 0, media: 0, editedToday: 0, week: week };
    notes.forEach(function (n) {
      if (n.archived) out.archived++; else out.total++;
      if (n.pinned && !n.archived) out.pinned++;
      if ((n.media || []).length) out.media++;
      var d = X.dayKey(new Date(n.updatedAt || n.createdAt || 0)), i = days.indexOf(d);
      if (i !== -1) week[i]++;
      if (d === today) out.editedToday++;
    });
    return out;
  }

  /* ---------- state for the open sheet ---------- */
  var sh = null, view = "list", filter = "all", query = "", urls = [], cur = null, saveTimer = null, rec = null;

  function objUrl(blob) { var u = URL.createObjectURL(blob); urls.push(u); return u; }
  function revokeAll() { urls.forEach(function (u) { try { URL.revokeObjectURL(u); } catch (e) {} }); urls = []; }

  function persist(note) {
    var arr = load(), i = arr.findIndex(function (n) { return n.id === note.id; });
    if (isEmpty(note)) {
      if (i !== -1) { arr.splice(i, 1); save(arr); }
      return;
    }
    note.updatedAt = Date.now();
    if (i === -1) arr.unshift(note); else arr[i] = note;
    save(arr);
  }
  function schedule() { clearTimeout(saveTimer); saveTimer = setTimeout(function () { if (cur) persist(cur); }, 400); }
  function flush() { clearTimeout(saveTimer); if (cur) persist(cur); }

  function removeNote(id) {
    var arr = load(), n = arr.find(function (x) { return x.id === id; });
    if (n) (n.media || []).forEach(function (m) { X.media.del(m.id); });
    save(arr.filter(function (x) { return x.id !== id; }));
  }
  function togglePin(id) {
    var arr = load(), n = arr.find(function (x) { return x.id === id; });
    if (!n) return;
    n.pinned = !n.pinned; if (n.pinned) n.archived = false; n.updatedAt = Date.now();
    save(arr); X.haptic(12); X.toast(n.pinned ? t("pinned") : t("unpin"));
  }

  function noteText(n) {
    var s = (n.title ? n.title + "\n\n" : "") + (n.text || "");
    if ((n.checklist || []).length) s += (s ? "\n" : "") + n.checklist.map(function (i) { return (i.done ? "☑ " : "☐ ") + i.text; }).join("\n");
    if ((n.tags || []).length) s += "\n\n" + n.tags.map(function (g) { return "#" + g; }).join(" ");
    return s.trim();
  }

  /* ---------- list view ---------- */
  function statTile(v, l) { return X.el("div", { class: "mhs-nt-stat" }, [X.el("b", { text: X.num(v) }), X.el("span", { text: l })]); }

  function renderList() {
    view = "list"; cur = null;
    revokeAll();
    sh.showBack(false); sh.onBack = null;
    sh.setTitle(t("title"), t("sub"));
    var body = sh.body; body.replaceChildren();
    var notes = load(), st = stats();

    var spark = X.el("div", { class: "mhs-nt-spark", html: X.bars(st.week, 84, 28, "#ffc400") });
    body.appendChild(X.el("section", { class: "mhs-nt-dash" }, [
      X.el("div", { class: "mhs-nt-stats" }, [statTile(st.total, t("sTotal")), statTile(st.pinned, t("sPinned")), statTile(st.media, t("sMedia")),
        X.el("div", { class: "mhs-nt-stat wk" }, [spark, X.el("span", { text: t("sWeek") })])]),
      X.el("div", { class: "mhs-nt-local" }, [
        X.el("span", { text: "🔒 " + t("local") }),
        window.MHSGate && !window.MHSGate.has("media") ? X.el("button", { type: "button", class: "mhs-nt-pro", text: "☁ " + t("proMedia"), on: { click: function () { window.MHSGate.prompt("media"); } } }) : null
      ])
    ]));

    // Keep-style composer bar
    function quick(kind, ic, label) {
      return X.el("button", { type: "button", class: "mhs-nt-qb", "aria-label": label, title: label, on: { click: function (e) { e.stopPropagation(); openEditor(null, kind); } } }, [X.icon(ic)]);
    }
    body.appendChild(X.el("div", { class: "mhs-nt-take", role: "button", tabindex: "0", on: {
      click: function () { openEditor(null, "text"); },
      keydown: function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openEditor(null, "text"); } }
    } }, [
      X.el("span", { class: "ph", text: t("take") }),
      quick("list", "list", t("list")), quick("image", "image", t("photo")), quick("audio", "mic", t("audio")), quick("video", "video", t("video"))
    ]));

    var input = X.el("input", { type: "search", placeholder: t("search"), "aria-label": t("search"), value: query, enterkeyhint: "search" });
    input.addEventListener("input", function () { query = input.value; drawGrid(); });
    body.appendChild(X.el("div", { class: "mhs-mini-search" }, [input]));

    var tags = {};
    notes.forEach(function (n) { (n.tags || []).forEach(function (g) { tags[g] = (tags[g] || 0) + 1; }); });
    var chips = X.el("div", { class: "mhs-mini-chips", role: "tablist" });
    function chip(key, label) {
      chips.appendChild(X.el("button", { type: "button", role: "tab", class: "mhs-chip" + (filter === key ? " is-on" : ""), "aria-selected": filter === key ? "true" : "false", text: label, on: { click: function () { filter = key; renderList(); } } }));
    }
    chip("all", t("all")); chip("pinned", "📌 " + t("pinned"));
    Object.keys(tags).sort().forEach(function (g) { chip("tag:" + g, "#" + g); });
    chip("archived", "🗄 " + t("archived"));
    if (filter.indexOf("tag:") === 0 && !tags[filter.slice(4)]) filter = "all";
    body.appendChild(chips);

    var gridWrap = X.el("div", { class: "mhs-nt-wrap" });
    body.appendChild(gridWrap);

    function drawGrid() {
      revokeAll();
      gridWrap.replaceChildren();
      var q = query.trim().toLowerCase();
      var list = load().filter(function (n) {
        if (filter === "archived") { if (!n.archived) return false; }
        else if (n.archived) return false;
        if (filter === "pinned" && !n.pinned) return false;
        if (filter.indexOf("tag:") === 0 && (n.tags || []).indexOf(filter.slice(4)) === -1) return false;
        if (q) {
          var hay = [n.title, n.text, (n.tags || []).join(" "), (n.checklist || []).map(function (i) { return i.text; }).join(" ")].join(" ").toLowerCase();
          if (hay.indexOf(q) === -1) return false;
        }
        return true;
      }).sort(function (a, b) { return (b.updatedAt || 0) - (a.updatedAt || 0); });

      if (!list.length) {
        gridWrap.appendChild(X.el("div", { class: "mhs-mini-msg", text: q ? t("noMatch") : filter === "archived" ? t("emptyArch") : t("empty") }));
        return;
      }
      var pinned = list.filter(function (n) { return n.pinned; }), rest = list.filter(function (n) { return !n.pinned; });
      function section(label, arr) {
        if (!arr.length) return;
        if (label) gridWrap.appendChild(X.el("div", { class: "mhs-nt-sec", text: label }));
        var g = X.el("div", { class: "mhs-nt-grid" });
        arr.forEach(function (n) { g.appendChild(card(n)); });
        gridWrap.appendChild(g);
      }
      if (filter === "all" && pinned.length && rest.length) { section(t("pinned"), pinned); section(t("others"), rest); }
      else section(null, list);
    }
    drawGrid();
  }

  function card(n) {
    var c = colorOf(n.color);
    var el = X.el("article", { class: "mhs-nt-card" + (n.color && n.color !== "none" ? " tinted" : ""), tabindex: "0", style: { "--nt": c } });
    var head = X.el("div", { class: "mhs-nt-chead" }, [
      n.emoji ? X.el("span", { class: "mhs-nt-emo", text: n.emoji }) : null,
      n.title ? X.el("b", { class: "mhs-nt-ctitle", text: n.title }) : null,
      X.el("button", { type: "button", class: "mhs-nt-pinbtn" + (n.pinned ? " is-on" : ""), "aria-label": n.pinned ? t("unpin") : t("pin"), title: n.pinned ? t("unpin") : t("pin"), on: { click: function (e) { e.stopPropagation(); togglePin(n.id); renderList(); } } }, [X.icon("pin")])
    ]);
    el.appendChild(head);
    var media = n.media || [];
    var imgs = media.filter(function (m) { return m.kind === "image"; });
    if (imgs.length) {
      var th = X.el("div", { class: "mhs-nt-thumbs" + (imgs.length > 1 ? " multi" : "") });
      imgs.slice(0, 4).forEach(function (m) {
        var img = X.el("img", { alt: "", loading: "lazy", decoding: "async" });
        X.media.get(m.id).then(function (b) { if (b) img.src = objUrl(b); }).catch(function () {});
        th.appendChild(img);
      });
      el.appendChild(th);
    }
    if (n.text) el.appendChild(X.el("p", { class: "mhs-nt-ex", text: n.text.length > 280 ? n.text.slice(0, 280) + "…" : n.text }));
    var cl = n.checklist || [];
    if (cl.length) {
      var ul = X.el("ul", { class: "mhs-nt-cl" });
      cl.slice(0, 5).forEach(function (i) { ul.appendChild(X.el("li", { class: i.done ? "done" : "" }, [X.el("span", { class: "bx", "aria-hidden": "true", text: i.done ? "✓" : "" }), X.el("span", { text: i.text })])); });
      el.appendChild(ul);
      var done = cl.filter(function (i) { return i.done; }).length;
      el.appendChild(X.el("div", { class: "mhs-nt-prog" }, [X.el("i", { class: "trk" }, [X.el("span", { style: { width: (cl.length ? done / cl.length * 100 : 0) + "%" } })]), X.el("small", { text: t("items", { a: X.num(done), b: X.num(cl.length) }) })]));
    }
    var badges = [];
    var au = media.filter(function (m) { return m.kind === "audio"; }).length, vi = media.filter(function (m) { return m.kind === "video"; }).length;
    if (au) badges.push(X.el("span", { class: "mhs-nt-badge", text: "🎙 " + X.num(au) }));
    if (vi) badges.push(X.el("span", { class: "mhs-nt-badge", text: "🎬 " + X.num(vi) }));
    (n.tags || []).slice(0, 4).forEach(function (g) { badges.push(X.el("span", { class: "mhs-nt-tag", text: "#" + g })); });
    if (badges.length) el.appendChild(X.el("div", { class: "mhs-nt-badges" }, badges));

    // tap → open; long-press → pin
    var lp = null, long = false;
    function start() { long = false; lp = setTimeout(function () { long = true; togglePin(n.id); renderList(); }, 550); }
    function cancel() { clearTimeout(lp); }
    el.addEventListener("pointerdown", start);
    el.addEventListener("pointerup", cancel);
    el.addEventListener("pointerleave", cancel);
    el.addEventListener("pointercancel", cancel);
    el.addEventListener("contextmenu", function (e) { e.preventDefault(); });
    el.addEventListener("click", function () { if (!long) openEditor(n.id); });
    el.addEventListener("keydown", function (e) { if (e.key === "Enter") openEditor(n.id); });
    return el;
  }

  /* ---------- editor view ---------- */
  function openEditor(id, kind) {
    view = "edit";
    revokeAll();
    var existing = id ? load().find(function (n) { return n.id === id; }) : null;
    cur = existing ? JSON.parse(JSON.stringify(existing)) : {
      id: X.uid("n"), emoji: "", title: "", text: "", color: "none", pinned: false, archived: false,
      tags: [], checklist: kind === "list" ? [{ id: X.uid("i"), text: "", done: false }] : [], media: [], createdAt: Date.now(), updatedAt: Date.now()
    };
    cur.tags = cur.tags || []; cur.checklist = cur.checklist || []; cur.media = cur.media || [];
    var note = cur;
    sh.showBack(true);
    sh.onBack = function () { flush(); renderList(); return true; };
    sh.setTitle(existing ? t("title") : t("take").replace("…", ""), existing ? t("edited", { d: X.fmtDate(existing.updatedAt || existing.createdAt, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) }) : "");

    var body = sh.body; body.replaceChildren();
    var wrap = X.el("div", { class: "mhs-nt-ed", style: { "--nt": colorOf(note.color) } });
    if (note.color && note.color !== "none") wrap.classList.add("tinted");
    body.appendChild(wrap);

    // emoji + title
    wrap.appendChild(X.el("div", { class: "mhs-nt-erow" }, [
      X.emojiField(note.emoji, PICKS, function (v) { note.emoji = v; schedule(); })
    ]));
    var title = X.el("input", { type: "text", class: "mhs-nt-title", placeholder: t("titlePh"), "aria-label": t("titlePh"), value: note.title, maxlength: "200", enterkeyhint: "next" });
    title.addEventListener("input", function () { note.title = title.value; schedule(); });
    title.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); ta.focus(); } });
    wrap.appendChild(title);

    var ta = X.el("textarea", { class: "mhs-nt-text", placeholder: t("textPh"), "aria-label": t("textPh"), rows: "4" });
    ta.value = note.text;
    function grow() { ta.style.height = "auto"; ta.style.height = Math.max(110, ta.scrollHeight) + "px"; }
    ta.addEventListener("input", function () { note.text = ta.value; grow(); schedule(); });
    wrap.appendChild(ta);
    setTimeout(grow, 0);

    // checklist
    var clBox = X.el("div", { class: "mhs-nt-clbox" });
    wrap.appendChild(clBox);
    function drawChecklist(focusId) {
      clBox.replaceChildren();
      if (!note.checklist.length) return;
      note.checklist.forEach(function (it) {
        var inp = X.el("input", { type: "text", class: "mhs-nt-itxt", value: it.text, placeholder: t("itemPh"), "aria-label": t("itemPh"), enterkeyhint: "next" });
        inp.addEventListener("input", function () { it.text = inp.value; schedule(); });
        inp.addEventListener("keydown", function (e) {
          if (e.key === "Enter") { e.preventDefault(); var ni = { id: X.uid("i"), text: "", done: false }; note.checklist.splice(note.checklist.indexOf(it) + 1, 0, ni); drawChecklist(ni.id); }
          else if (e.key === "Backspace" && !inp.value && note.checklist.length > 1) { e.preventDefault(); var ix = note.checklist.indexOf(it); note.checklist.splice(ix, 1); schedule(); drawChecklist((note.checklist[ix - 1] || note.checklist[0]).id); }
        });
        var row = X.el("div", { class: "mhs-nt-item" + (it.done ? " done" : "") }, [
          X.el("button", { type: "button", class: "mhs-nt-check" + (it.done ? " is-on" : ""), role: "checkbox", "aria-checked": it.done ? "true" : "false", "aria-label": it.text || t("itemPh"), on: { click: function () { it.done = !it.done; X.haptic(8); schedule(); drawChecklist(); } } }, [it.done ? X.icon("check") : null]),
          inp,
          X.el("button", { type: "button", class: "mhs-nt-ix", "aria-label": t("remove"), on: { click: function () { note.checklist.splice(note.checklist.indexOf(it), 1); schedule(); drawChecklist(); } } }, [X.icon("x")])
        ]);
        clBox.appendChild(row);
        if (focusId === it.id) setTimeout(function () { inp.focus(); }, 0);
      });
      clBox.appendChild(X.el("button", { type: "button", class: "mhs-nt-additem", on: { click: function () { var ni = { id: X.uid("i"), text: "", done: false }; note.checklist.push(ni); drawChecklist(ni.id); } } }, [X.icon("plus"), t("addItem")]));
    }
    drawChecklist(kind === "list" && note.checklist[0] ? note.checklist[0].id : null);

    // media
    var mediaBox = X.el("div", { class: "mhs-nt-media" });
    wrap.appendChild(mediaBox);
    function drawMedia() {
      mediaBox.replaceChildren();
      note.media.forEach(function (m) {
        var item = X.el("div", { class: "mhs-nt-mi " + m.kind });
        var del = X.el("button", { type: "button", class: "mhs-nt-mdel", "aria-label": t("remove"), on: { click: function () {
          note.media = note.media.filter(function (x) { return x.id !== m.id; }); X.media.del(m.id); schedule(); drawMedia();
        } } }, [X.icon("x")]);
        X.media.get(m.id).then(function (b) {
          if (!b) return;
          var u = objUrl(b), node;
          if (m.kind === "image") node = X.el("img", { src: u, alt: m.name || "", decoding: "async", on: { click: function () { viewImage(u); } } });
          else if (m.kind === "video") node = X.el("video", { src: u, controls: true, playsinline: true, preload: "metadata" });
          else node = X.el("audio", { src: u, controls: true, preload: "metadata" });
          item.insertBefore(node, del);
        }).catch(function () {});
        item.appendChild(del);
        mediaBox.appendChild(item);
      });
    }
    drawMedia();

    function addBlob(blob, kind, name) {
      if (!blob) return;
      if (blob.size > MAX) { X.toast(t("tooBig")); return; }
      var m = { id: X.uid("m"), kind: kind, mime: blob.type || "", size: blob.size, name: name || "" };
      X.media.put(m.id, blob).then(function () {
        note.media.push(m); schedule(); drawMedia();
      }).catch(function () { X.toast(t("mediaFail")); });
    }
    function pick(kind) {
      var inp = X.el("input", { type: "file", accept: kind + "/*", hidden: true, multiple: kind === "image" ? true : null });
      inp.addEventListener("change", function () {
        Array.prototype.forEach.call(inp.files || [], function (f) { addBlob(f, kind, f.name); });
        inp.remove();
      });
      wrap.appendChild(inp);
      inp.click();
    }

    // audio recording
    var recBar = X.el("div", { class: "mhs-nt-rec", hidden: true });
    wrap.appendChild(recBar);
    function recordAudio() {
      if (rec) return;
      if (!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia && window.MediaRecorder)) { X.toast(t("micFail")); pick("audio"); return; }
      navigator.mediaDevices.getUserMedia({ audio: true }).then(function (stream) {
        var chunks = [], mr = new MediaRecorder(stream), t0 = Date.now();
        var timeEl = X.el("b", { text: "0:00" });
        var timer = setInterval(function () { var s = Math.floor((Date.now() - t0) / 1000); timeEl.textContent = Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0"); }, 250);
        rec = { mr: mr, stream: stream, timer: timer };
        recBar.replaceChildren(X.el("span", { class: "dot", "aria-hidden": "true" }), X.el("span", { text: t("record") }), timeEl,
          X.el("button", { type: "button", class: "mhs-nt-stop", on: { click: stopRec } }, [t("stop")]));
        recBar.hidden = false;
        mr.ondataavailable = function (e) { if (e.data && e.data.size) chunks.push(e.data); };
        mr.onstop = function () {
          var blob = new Blob(chunks, { type: mr.mimeType || "audio/webm" });
          if (blob.size) addBlob(blob, "audio", "recording-" + X.dayKey() + ".webm");
        };
        mr.start();
      }).catch(function () { X.toast(t("micFail")); pick("audio"); });
    }
    function stopRec() {
      if (!rec) return;
      clearInterval(rec.timer);
      try { rec.mr.state !== "inactive" && rec.mr.stop(); } catch (e) {}
      rec.stream.getTracks().forEach(function (tr) { tr.stop(); });
      rec = null; recBar.hidden = true;
    }

    function insertAtCursor(s) {
      var a = ta.selectionStart != null ? ta.selectionStart : ta.value.length, b = ta.selectionEnd != null ? ta.selectionEnd : a;
      var before = ta.value.slice(0, a), pre = before && !/\s$/.test(before) ? " " : "";
      ta.value = before + pre + s + ta.value.slice(b);
      var p = (before + pre + s).length;
      try { ta.setSelectionRange(p, p); } catch (e) {}
      note.text = ta.value; grow(); schedule(); ta.focus();
    }
    function openCalc() {
      if (!window.MHSCalc) return;
      window.MHSCalc.open({ host: sh.dialog, onUse: function (n, expr) { insertAtCursor(expr + " = " + X.num(n, { maximumFractionDigits: 6 })); } });
    }

    // tags
    var tagBox = X.el("div", { class: "mhs-nt-tags", "aria-label": t("tags") });
    var tagIn = X.el("input", { type: "text", class: "mhs-nt-tagin", placeholder: t("tagsPh"), "aria-label": t("tagsPh"), enterkeyhint: "done" });
    function addTag(v) {
      v = String(v || "").replace(/^#/, "").replace(/,/g, "").trim().slice(0, 30);
      if (v && note.tags.indexOf(v) === -1) { note.tags.push(v); schedule(); }
      tagIn.value = ""; drawTags();
    }
    tagIn.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addTag(tagIn.value); }
      else if (e.key === "Backspace" && !tagIn.value && note.tags.length) { note.tags.pop(); schedule(); drawTags(); }
    });
    tagIn.addEventListener("input", function () { if (tagIn.value.indexOf(",") !== -1) addTag(tagIn.value); });
    tagIn.addEventListener("blur", function () { if (tagIn.value.trim()) addTag(tagIn.value); });
    function drawTags() {
      tagBox.replaceChildren();
      note.tags.forEach(function (g) {
        tagBox.appendChild(X.el("span", { class: "mhs-nt-tagchip" }, ["#" + g, X.el("button", { type: "button", "aria-label": t("remove") + " " + g, on: { click: function () { note.tags = note.tags.filter(function (x) { return x !== g; }); schedule(); drawTags(); } } }, [X.icon("x")])]));
      });
      tagBox.appendChild(tagIn);
    }
    drawTags();
    wrap.appendChild(tagBox);

    // colours
    var sw = X.el("div", { class: "mhs-nt-colors", role: "radiogroup", "aria-label": t("color") });
    COLORS.forEach(function (c) {
      sw.appendChild(X.el("button", { type: "button", role: "radio", class: "mhs-nt-sw" + (note.color === c.k || (!note.color && c.k === "none") ? " is-on" : "") + (c.k === "none" ? " none" : ""), "aria-checked": note.color === c.k ? "true" : "false", "aria-label": c.k, style: { "--c": c.c }, on: { click: function () {
        note.color = c.k; wrap.style.setProperty("--nt", c.c); wrap.classList.toggle("tinted", c.k !== "none");
        sw.querySelectorAll(".mhs-nt-sw").forEach(function (b) { var on = b.getAttribute("aria-label") === c.k; b.classList.toggle("is-on", on); b.setAttribute("aria-checked", on ? "true" : "false"); });
        schedule();
      } } }));
    });
    wrap.appendChild(sw);

    // toolbar
    function tb(ic, label, fn, extra) {
      return X.el("button", { type: "button", class: "mhs-nt-tb" + (extra || ""), "aria-label": label, title: label, on: { click: fn } }, [X.icon(ic), X.el("span", { text: label })]);
    }
    var pinB = tb("pin", note.pinned ? t("unpin") : t("pin"), function () {
      note.pinned = !note.pinned; if (note.pinned) note.archived = false;
      pinB.classList.toggle("is-on", note.pinned); pinB.querySelector("span").textContent = note.pinned ? t("unpin") : t("pin"); X.haptic(8); schedule();
    }, note.pinned ? " is-on" : "");
    var delB = tb("trash", t("del"), function () {
      if (!delB.dataset.armed) {
        delB.dataset.armed = "1"; delB.classList.add("danger"); delB.querySelector("span").textContent = t("confirm");
        setTimeout(function () { if (delB.isConnected) { delete delB.dataset.armed; delB.classList.remove("danger"); delB.querySelector("span").textContent = t("del"); } }, 3500);
        return;
      }
      clearTimeout(saveTimer); stopRec(); removeNote(note.id); cur = null; X.toast(t("deleted")); renderList();
    }, " del");
    var bar = X.el("div", { class: "mhs-nt-toolbar" }, [
      tb("image", t("photo"), function () { pick("image"); }),
      tb("mic", t("audio"), recordAudio),
      tb("video", t("video"), function () { pick("video"); }),
      tb("list", t("list"), function () { var ni = { id: X.uid("i"), text: "", done: false }; note.checklist.push(ni); drawChecklist(ni.id); }),
      tb("calc", t("calc"), openCalc),
      pinB,
      tb("archive", note.archived ? t("unarchive") : t("archive"), function () {
        note.archived = !note.archived; if (note.archived) note.pinned = false; flush(); X.toast(note.archived ? t("archived") : t("unarchive")); renderList();
      }),
      tb("share", t("share"), function () { var s = noteText(note); if (s) X.share(s, note.title || t("title")); }),
      delB
    ]);
    wrap.appendChild(bar);

    // kick off quick actions from the composer
    if (kind === "image" || kind === "video") setTimeout(function () { pick(kind); }, 50);
    else if (kind === "audio") setTimeout(recordAudio, 50);
    else if (kind !== "list" && !existing) setTimeout(function () { ta.focus(); }, 80);
    body.scrollTop = 0;
  }

  function viewImage(u) {
    var ov = X.el("div", { class: "mhs-nt-viewer", role: "dialog", "aria-label": t("photo"), tabindex: "-1", on: { click: function () { ov.remove(); } } }, [
      X.el("img", { src: u, alt: "" }),
      X.el("button", { type: "button", class: "mhs-mini-ib", "aria-label": t("back") }, [X.icon("x")])
    ]);
    ov.addEventListener("keydown", function (e) { if (e.key === "Escape") { e.stopPropagation(); e.preventDefault(); ov.remove(); } });
    sh.dialog.appendChild(ov); ov.focus();
  }

  function open(opts) {
    opts = opts || {};
    if (!window.MHSSheet) return;
    if (sh && sh.dialog.open) {
      if (opts.id) openEditor(opts.id); else if (opts.new) openEditor(null, opts.new);
      return;
    }
    view = "list"; filter = "all"; query = "";
    sh = X.sheet({ id: "mhs-notes", title: t("title"), sub: t("sub"), onClose: function () {
      clearTimeout(saveTimer);
      if (cur) persist(cur);
      if (rec) { try { clearInterval(rec.timer); rec.mr.stop(); rec.stream.getTracks().forEach(function (x) { x.stop(); }); } catch (e) {} rec = null; }
      if (window.MHSCalc) window.MHSCalc.close();
      revokeAll(); cur = null; sh = null;
    } });
    if (!sh) return;
    sh.dialog.classList.add("mhs-nt-sheet");
    sh.tools.appendChild(X.el("button", { type: "button", class: "mhs-mini-ib", "aria-label": t("calc"), title: t("calc"), on: { click: function () {
      if (!window.MHSCalc) return;
      window.MHSCalc.open({ host: sh.dialog, onUse: view === "edit" ? function (n, expr) {
        var ta = sh.body.querySelector(".mhs-nt-text"); if (!ta) return;
        var a = ta.selectionStart != null ? ta.selectionStart : ta.value.length;
        var ins = (a && !/\s$/.test(ta.value.slice(0, a)) ? " " : "") + expr + " = " + X.num(n, { maximumFractionDigits: 6 });
        ta.value = ta.value.slice(0, a) + ins + ta.value.slice(ta.selectionEnd != null ? ta.selectionEnd : a);
        ta.dispatchEvent(new Event("input", { bubbles: true }));
      } : null });
    } } }, [X.icon("calc")]));
    if (opts.id) openEditor(opts.id); else if (opts.new) openEditor(null, opts.new); else renderList();
  }

  X.on(function (key) { if ((key === "notes" || key === "*") && sh && view === "list") renderList(); });

  X.action({ k: "notes", label: function () { return t("title"); }, sub: function () { return t("menuSub"); }, icon: X.ICONS.note, c: "linear-gradient(140deg,#fbc02d,#f57f17)", run: function () { open(); } });

  window.MHSNotes = { open: open, stats: stats };
})();
