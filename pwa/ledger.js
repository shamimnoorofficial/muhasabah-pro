/* Muhasabah Hisab Khata (হিসাব খাতা) — a lightweight ledger book / Google Sheets alternative.
 * Customer dues (বাকির খাতা), daily income & expense, payroll (বেতন) and custom books.
 * Data: MHSX.get("hisab") → { books:[], entries:[], currency }  (part of backups & sync).
 * API: MHSHisab.open(opts?) · MHSHisab.stats() */
(function () {
  "use strict";
  if (window.MHSHisab) return;
  var X = window.MHSX;
  if (!X) return;

  var t = X.tr({
    en: {
      title: "Hisab Khata", sub: "Dues, cash book & payroll", menuSub: "Dues, income-expense, payroll",
      receivable: "To receive", payable: "Salary due", monthNet: "This month", books: "Your books", newBook: "New book",
      noBooks: "No books yet. Start with a template below.", tplDues: "Customer dues", tplCash: "Daily cash", tplPayroll: "Payroll", tplCustom: "Custom",
      typeDues: "Dues book", typeCash: "Cash book", typePayroll: "Payroll", typeCustom: "Ledger",
      bookName: "Book name", emoji: "Emoji", create: "Create book", cancel: "Cancel", save: "Save", del: "Delete", confirm: "Tap again to delete",
      currency: "Currency", settings: "Settings",
      sheet: "Sheet", people: "People", search: "Search entries…", allMonths: "All", addEntry: "Add entry",
      date: "Date", details: "Details", in: "In", out: "Out", balance: "Balance",
      duesOut: "You gave", duesIn: "You got", cashIn: "Income", cashOut: "Expense", payIn: "Salary due", payOut: "Paid", custIn: "Credit", custOut: "Debit",
      party: "Name", customer: "Customer name", employee: "Employee name", note: "Note (optional)", amount: "Amount", category: "Category",
      owesYou: "Owes you", youOwe: "You owe", settled: "Settled", outstanding: "Outstanding",
      noEntries: "No entries yet. Tap + to add the first one.", noPeople: "No people yet.",
      remind: "Send reminder", reminderMsg: "Assalamu alaikum {n}, your due balance is {a} as of {d}. JazakAllahu khairan. — sent from Muhasabah",
      salary: "Monthly salary", setSalary: "Set salary", addSalaries: "Add this month's salary", salariesAdded: "{n} salary entries added", noSalaries: "Set a monthly salary for an employee first.",
      salaryOf: "Salary · {m}", exportCsv: "Export CSV", deleteBook: "Delete book", bad: "Enter a valid amount", saved: "Saved", deleted: "Deleted",
      calc: "Calculator", entries: "{n} entries", today: "Today", rename: "Rename"
    },
    bn: {
      title: "হিসাব খাতা", sub: "বাকি, ক্যাশ বই ও বেতন", menuSub: "বাকির খাতা, আয়-ব্যয়, বেতন",
      receivable: "পাবো", payable: "বেতন বাকি", monthNet: "এই মাস", books: "আপনার খাতা", newBook: "নতুন খাতা",
      noBooks: "এখনো কোনো খাতা নেই। নিচের টেমপ্লেট দিয়ে শুরু করুন।", tplDues: "বাকির খাতা", tplCash: "দৈনিক আয়-ব্যয়", tplPayroll: "বেতন হিসাব", tplCustom: "কাস্টম",
      typeDues: "বাকির খাতা", typeCash: "ক্যাশ বই", typePayroll: "বেতন হিসাব", typeCustom: "খাতা",
      bookName: "খাতার নাম", emoji: "ইমোজি", create: "খাতা তৈরি", cancel: "বাতিল", save: "সংরক্ষণ", del: "মুছুন", confirm: "মুছতে আবার চাপুন",
      currency: "মুদ্রা", settings: "সেটিংস",
      sheet: "শিট", people: "ব্যক্তি", search: "এন্ট্রি খুঁজুন…", allMonths: "সব", addEntry: "এন্ট্রি যোগ",
      date: "তারিখ", details: "বিবরণ", in: "জমা", out: "খরচ", balance: "ব্যালেন্স",
      duesOut: "দিলাম", duesIn: "পেলাম", cashIn: "আয়", cashOut: "ব্যয়", payIn: "পাওনা হয়েছে", payOut: "পরিশোধ", custIn: "জমা", custOut: "খরচ",
      party: "নাম", customer: "কাস্টমারের নাম", employee: "কর্মীর নাম", note: "নোট (ঐচ্ছিক)", amount: "পরিমাণ", category: "ক্যাটাগরি",
      owesYou: "পাবেন", youOwe: "দেবেন", settled: "পরিশোধিত", outstanding: "বাকি",
      noEntries: "এখনো কোনো এন্ট্রি নেই। + চেপে প্রথমটি যোগ করুন।", noPeople: "এখনো কেউ নেই।",
      remind: "তাগাদা পাঠান", reminderMsg: "আসসালামু আলাইকুম {n}, {d} পর্যন্ত আপনার বাকি {a}। জাযাকাল্লাহু খাইরান। — মুহাসাবা থেকে পাঠানো",
      salary: "মাসিক বেতন", setSalary: "বেতন নির্ধারণ", addSalaries: "এই মাসের বেতন যোগ করুন", salariesAdded: "{n}টি বেতন এন্ট্রি যোগ হয়েছে", noSalaries: "আগে কোনো কর্মীর মাসিক বেতন নির্ধারণ করুন।",
      salaryOf: "বেতন · {m}", exportCsv: "CSV এক্সপোর্ট", deleteBook: "খাতা মুছুন", bad: "সঠিক পরিমাণ লিখুন", saved: "সংরক্ষিত", deleted: "মুছে ফেলা হয়েছে",
      calc: "ক্যালকুলেটর", entries: "{n}টি এন্ট্রি", today: "আজ", rename: "নাম বদল"
    },
    ar: {
      title: "دفتر الحسابات", sub: "الديون والصندوق والرواتب", menuSub: "ديون، دخل ومصروف، رواتب",
      receivable: "لك", payable: "رواتب مستحقة", monthNet: "هذا الشهر", books: "دفاترك", newBook: "دفتر جديد",
      noBooks: "لا دفاتر بعد. ابدأ بقالب.", tplDues: "ديون العملاء", tplCash: "الصندوق اليومي", tplPayroll: "الرواتب", tplCustom: "مخصص",
      typeDues: "دفتر ديون", typeCash: "دفتر صندوق", typePayroll: "رواتب", typeCustom: "دفتر",
      duesOut: "أعطيت", duesIn: "استلمت", cashIn: "دخل", cashOut: "مصروف", payIn: "راتب مستحق", payOut: "مدفوع", custIn: "دائن", custOut: "مدين",
      sheet: "الجدول", people: "الأشخاص", in: "وارد", out: "صادر", balance: "الرصيد", date: "التاريخ", details: "التفاصيل"
    }
  });

  var CURRENCIES = ["৳", "$", "€", "£", "₹", "﷼", "Rs "];
  var CATS = ["🛒", "🍽️", "🚌", "💡", "🏠", "💊", "🎓", "🤲", "💼", "📦"];
  var TEMPLATES = [
    { type: "dues", emoji: "🧾", name: "tplDues" },
    { type: "cash", emoji: "💵", name: "tplCash" },
    { type: "payroll", emoji: "👥", name: "tplPayroll" },
    { type: "custom", emoji: "📒", name: "tplCustom" }
  ];

  /* ---------- data ---------- */
  function load() {
    var d = X.get("hisab", null);
    if (!d || typeof d !== "object") d = {};
    return {
      books: Array.isArray(d.books) ? d.books : [],
      entries: Array.isArray(d.entries) ? d.entries : [],
      currency: d.currency || (X.lang() === "bn" ? "৳" : "$")
    };
  }
  function save(d) { X.set("hisab", d); }
  function bookOf(d, id) { return d.books.filter(function (b) { return b.id === id; })[0]; }
  function entriesOf(d, id) { return d.entries.filter(function (e) { return e.bookId === id; }); }
  function sorted(list) {
    return list.slice().sort(function (a, b) { return a.date < b.date ? -1 : a.date > b.date ? 1 : (a.ts || 0) - (b.ts || 0); });
  }
  function sign(e) { return e.dir === "in" ? 1 : -1; }
  /* For dues books the running balance is "they owe you" (out − in); otherwise in − out. */
  function delta(book, e) {
    var a = Number(e.amount) || 0;
    return book.type === "dues" ? -sign(e) * a : sign(e) * a;
  }
  function totals(book, list) {
    var tin = 0, tout = 0;
    list.forEach(function (e) { if (e.dir === "in") tin += Number(e.amount) || 0; else tout += Number(e.amount) || 0; });
    return { tin: tin, tout: tout, bal: book.type === "dues" ? tout - tin : tin - tout };
  }
  function parties(book, list) {
    var map = {};
    list.forEach(function (e) {
      var n = (e.party || "").trim();
      if (!n) return;
      var k = n.toLowerCase();
      var p = map[k] || (map[k] = { name: n, bal: 0, count: 0, last: "" });
      p.bal += delta(book, e); p.count++;
      if (e.date > p.last) p.last = e.date;
    });
    if (book.type === "payroll" && book.salaries) Object.keys(book.salaries).forEach(function (n) {
      var k = n.toLowerCase();
      if (!map[k]) map[k] = { name: n, bal: 0, count: 0, last: "" };
    });
    return Object.keys(map).map(function (k) { return map[k]; }).sort(function (a, b) { return Math.abs(b.bal) - Math.abs(a.bal) || a.name.localeCompare(b.name); });
  }
  function labels(type) {
    return type === "dues" ? { in: t("duesIn"), out: t("duesOut") }
      : type === "cash" ? { in: t("cashIn"), out: t("cashOut") }
      : type === "payroll" ? { in: t("payIn"), out: t("payOut") }
      : { in: t("custIn"), out: t("custOut") };
  }
  function typeLabel(type) {
    return t(type === "dues" ? "typeDues" : type === "cash" ? "typeCash" : type === "payroll" ? "typePayroll" : "typeCustom");
  }
  function monthKey(date) { return String(date || "").slice(0, 7); }
  function monthName(mk) {
    var p = mk.split("-");
    return X.fmtDate(new Date(+p[0], +p[1] - 1, 1), { month: "short", year: "numeric" });
  }

  function stats() {
    var d = load(), mk = monthKey(X.dayKey()), today = X.dayKey();
    var receivable = 0, payable = 0, monthIn = 0, monthOut = 0, entriesToday = 0;
    var days = X.lastDays(7).map(X.dayKey), week = [0, 0, 0, 0, 0, 0, 0];
    d.books.forEach(function (b) {
      var list = entriesOf(d, b.id);
      if (b.type === "dues") parties(b, list).forEach(function (p) { if (p.bal > 0) receivable += p.bal; });
      if (b.type === "payroll") parties(b, list).forEach(function (p) { if (p.bal > 0) payable += p.bal; });
      if (b.type === "cash") list.forEach(function (e) {
        var a = Number(e.amount) || 0;
        if (monthKey(e.date) === mk) { if (e.dir === "in") monthIn += a; else monthOut += a; }
        var i = days.indexOf(e.date);
        if (i !== -1) week[i] += sign(e) * a;
      });
    });
    d.entries.forEach(function (e) { if (e.date === today) entriesToday++; });
    return { books: d.books.length, receivable: receivable, payable: payable, monthIn: monthIn, monthOut: monthOut, monthNet: monthIn - monthOut, currency: d.currency, week: week, entriesToday: entriesToday };
  }

  /* ---------- UI ---------- */
  var S = null; // open sheet
  var V = { view: "home", bookId: null, tab: "sheet", party: null, month: "", q: "" };
  var el = X.el;

  function cur() { return load().currency; }
  function m(v) { return X.money(v, cur()); }

  function render() {
    if (!S) return;
    closeForm();
    clearFab();
    var b = S.body;
    b.replaceChildren();
    b.classList.add("mhs-hb");
    var d = load();
    if (V.view === "book" && bookOf(d, V.bookId)) {
      if (V.party) renderParty(d, b); else renderBook(d, b);
    } else {
      V.view = "home"; V.bookId = null; V.party = null;
      renderHome(d, b);
    }
  }

  function setHead(title, sub, back) {
    S.setTitle(title, sub);
    S.showBack(back);
    S.onBack = back ? function () {
      if (form) { closeForm(); return true; }
      if (V.party) { V.party = null; render(); return true; }
      if (V.view === "book") { V.view = "home"; render(); return true; }
      return false;
    } : function () { if (form) { closeForm(); return true; } return false; };
  }

  function tools(btns) {
    S.tools.replaceChildren.apply(S.tools, btns);
  }
  function ib(iconKey, label, fn) {
    return el("button", { type: "button", class: "mhs-mini-ib", "aria-label": label, title: label, on: { click: fn } }, [X.icon(iconKey)]);
  }

  function renderHome(d, b) {
    setHead(t("title"), t("sub"), false);
    tools([ib("calc", t("calc"), function () { window.MHSCalc && MHSCalc.open({ host: S.dialog }); })]);
    var st = stats();
    var totalMonth = st.monthIn + st.monthOut;
    b.appendChild(el("div", { class: "mhs-hb-dash" }, [
      el("div", { class: "mhs-hb-kpi is-in" }, [el("small", { text: t("receivable") }), el("b", { text: m(st.receivable) })]),
      el("div", { class: "mhs-hb-kpi is-out" }, [el("small", { text: t("payable") }), el("b", { text: m(st.payable) })]),
      el("div", { class: "mhs-hb-kpi is-net" }, [
        el("div", { class: "mhs-hb-ringwrap", html: X.ring(totalMonth ? st.monthIn / totalMonth : 0, 44, 5, "#00c853", "rgba(255,82,82,.55)") }),
        el("div", { class: "mhs-hb-kpi-t" }, [
          el("small", { text: t("monthNet") }),
          el("b", { class: st.monthNet < 0 ? "neg" : "pos", text: m(st.monthNet) }),
          el("span", { class: "mhs-hb-spark", html: X.bars(st.week.map(function (v) { return Math.max(0, v); }), 70, 18, "#00c853") })
        ])
      ])
    ]));

    b.appendChild(el("h3", { class: "mhs-hb-h", text: t("books") }));
    var list = el("div", { class: "mhs-hb-books" });
    if (!d.books.length) list.appendChild(el("p", { class: "mhs-mini-msg", text: t("noBooks") }));
    d.books.forEach(function (book) {
      var es = entriesOf(d, book.id), tt = totals(book, es);
      list.appendChild(el("button", { type: "button", class: "mhs-hb-book", on: { click: function () { V.view = "book"; V.bookId = book.id; V.tab = book.type === "dues" || book.type === "payroll" ? "people" : "sheet"; V.month = ""; V.q = ""; render(); } } }, [
        el("span", { class: "mhs-hb-emo", text: book.emoji || "📒" }),
        el("span", { class: "txt" }, [el("b", { text: book.name }), el("small", { text: typeLabel(book.type) + " · " + t("entries", { n: X.num(es.length) }) })]),
        el("span", { class: "mhs-hb-bal " + (tt.bal < 0 ? "neg" : tt.bal > 0 ? "pos" : ""), text: m(tt.bal) })
      ]));
    });
    b.appendChild(list);

    b.appendChild(el("h3", { class: "mhs-hb-h", text: t("newBook") }));
    var tpl = el("div", { class: "mhs-hb-tpls" });
    TEMPLATES.forEach(function (tp) {
      tpl.appendChild(el("button", { type: "button", class: "mhs-hb-tpl", on: { click: function () { openBookForm(tp); } } }, [
        el("span", { class: "mhs-hb-emo", text: tp.emoji }), el("span", { text: t(tp.name) })
      ]));
    });
    b.appendChild(tpl);

    var curRow = el("div", { class: "mhs-hb-cur", role: "radiogroup", "aria-label": t("currency") });
    CURRENCIES.forEach(function (c) {
      curRow.appendChild(el("button", { type: "button", role: "radio", "aria-checked": String(d.currency === c), class: "mhs-chip" + (d.currency === c ? " is-on" : ""), text: c.trim(), on: { click: function () {
        var dd = load(); dd.currency = c; save(dd); render();
      } } }));
    });
    b.appendChild(el("div", { class: "mhs-hb-settings" }, [el("small", { text: t("currency") }), curRow]));
  }

  function renderBook(d, b) {
    var book = bookOf(d, V.bookId), all = entriesOf(d, book.id), L = labels(book.type);
    setHead((book.emoji ? book.emoji + " " : "") + book.name, typeLabel(book.type), true);
    tools([
      ib("calc", t("calc"), function () { window.MHSCalc && MHSCalc.open({ host: S.dialog }); }),
      ib("download", t("exportCsv"), function () { exportCsv(book); }),
      ib("edit", t("settings"), function () { openBookForm(null, book); })
    ]);
    var tt = totals(book, all);
    b.appendChild(el("div", { class: "mhs-hb-sum" }, [
      el("div", { class: "is-in" }, [el("small", { text: L.in }), el("b", { text: m(tt.tin) })]),
      el("div", { class: "is-out" }, [el("small", { text: L.out }), el("b", { text: m(tt.tout) })]),
      el("div", { class: "is-bal" }, [el("small", { text: book.type === "dues" ? t("receivable") : book.type === "payroll" ? t("outstanding") : t("balance") }), el("b", { class: tt.bal < 0 ? "neg" : "", text: m(tt.bal) })])
    ]));

    var hasPeople = book.type === "dues" || book.type === "payroll";
    if (hasPeople) {
      var seg = el("div", { class: "mhs-hb-seg", role: "tablist" });
      [["people", t("people")], ["sheet", t("sheet")]].forEach(function (p) {
        seg.appendChild(el("button", { type: "button", role: "tab", "aria-selected": String(V.tab === p[0]), class: V.tab === p[0] ? "is-on" : "", text: p[1], on: { click: function () { V.tab = p[0]; render(); } } }));
      });
      b.appendChild(seg);
    } else V.tab = "sheet";

    if (book.type === "payroll") {
      b.appendChild(el("button", { type: "button", class: "mhs-hb-wide", text: "＋ " + t("addSalaries"), on: { click: function () { addSalaries(book); } } }));
    }

    var search = el("input", { type: "search", value: V.q, placeholder: t("search"), "aria-label": t("search"), enterkeyhint: "search" });
    var bodyHost = el("div");
    search.addEventListener("input", function () { V.q = search.value; drawList(); });
    b.appendChild(el("div", { class: "mhs-mini-search" }, [search]));

    if (V.tab === "sheet") {
      var months = {};
      all.forEach(function (e) { months[monthKey(e.date)] = 1; });
      var mks = Object.keys(months).sort().reverse();
      if (mks.length > 1) {
        var chips = el("div", { class: "mhs-mini-chips mhs-hb-months" });
        [""].concat(mks).forEach(function (mk) {
          chips.appendChild(el("button", { type: "button", class: "mhs-chip" + (V.month === mk ? " is-on" : ""), text: mk ? monthName(mk) : t("allMonths"), on: { click: function () { V.month = mk; render(); } } }));
        });
        b.appendChild(chips);
      }
    }
    b.appendChild(bodyHost);

    function drawList() {
      bodyHost.replaceChildren();
      var q = V.q.trim().toLowerCase();
      if (V.tab === "people") {
        var ps = parties(book, all).filter(function (p) { return !q || p.name.toLowerCase().indexOf(q) !== -1; });
        if (!ps.length) { bodyHost.appendChild(el("p", { class: "mhs-mini-msg", text: all.length ? t("noPeople") : t("noEntries") })); return; }
        var ul = el("div", { class: "mhs-mini-list" });
        ps.forEach(function (p) {
          var state = p.bal > 0 ? (book.type === "dues" ? t("owesYou") : t("outstanding")) : p.bal < 0 ? (book.type === "dues" ? t("youOwe") : t("balance")) : t("settled");
          var sal = book.salaries && book.salaries[p.name];
          ul.appendChild(el("button", { type: "button", class: "mhs-mini-row mhs-hb-person", on: { click: function () { V.party = p.name; render(); } } }, [
            el("span", { class: "mhs-hb-av", text: initials(p.name) }),
            el("span", { class: "txt" }, [el("b", { text: p.name }), el("small", { text: (sal ? t("salary") + " " + m(sal) + " · " : "") + (p.last ? X.fmtDate(dateTs(p.last)) : "") })]),
            el("span", { class: "mhs-hb-pbal " + (p.bal > 0 ? "pos" : p.bal < 0 ? "neg" : "") }, [el("b", { text: m(Math.abs(p.bal)) }), el("small", { text: state })])
          ]));
        });
        bodyHost.appendChild(ul);
      } else {
        var rows = sorted(all).filter(function (e) { return !V.month || monthKey(e.date) === V.month; });
        drawSheet(bodyHost, book, rows, q);
      }
    }
    drawList();
    addFab(function () { openEntry(book, null, null); });
  }

  function renderParty(d, b) {
    var book = bookOf(d, V.bookId), name = V.party;
    var list = entriesOf(d, book.id).filter(function (e) { return (e.party || "").trim().toLowerCase() === name.toLowerCase(); });
    var tt = totals(book, list), L = labels(book.type);
    setHead(name, (book.emoji || "") + " " + book.name, true);
    var btns = [ib("calc", t("calc"), function () { window.MHSCalc && MHSCalc.open({ host: S.dialog }); })];
    if (book.type === "dues") btns.push(ib("share", t("remind"), function () { remind(name, tt.bal); }));
    tools(btns);
    b.appendChild(el("div", { class: "mhs-hb-party-hero " + (tt.bal > 0 ? "pos" : tt.bal < 0 ? "neg" : "") }, [
      el("span", { class: "mhs-hb-av lg", text: initials(name) }),
      el("small", { text: tt.bal > 0 ? (book.type === "dues" ? t("owesYou") : t("outstanding")) : tt.bal < 0 ? (book.type === "dues" ? t("youOwe") : t("balance")) : t("settled") }),
      el("b", { text: m(Math.abs(tt.bal)) }),
      el("div", { class: "mhs-hb-qa" }, [
        el("button", { type: "button", class: "mhs-hb-qbtn is-out", text: "− " + L.out, on: { click: function () { openEntry(book, null, { party: name, dir: "out" }); } } }),
        el("button", { type: "button", class: "mhs-hb-qbtn is-in", text: "+ " + L.in, on: { click: function () { openEntry(book, null, { party: name, dir: "in" }); } } })
      ])
    ]));
    if (book.type === "dues" && tt.bal > 0) {
      b.appendChild(el("button", { type: "button", class: "mhs-hb-wide", text: "↗ " + t("remind"), on: { click: function () { remind(name, tt.bal); } } }));
    }
    if (book.type === "payroll") {
      var salIn = el("input", { type: "text", inputmode: "decimal", value: book.salaries && book.salaries[name] ? String(book.salaries[name]) : "", placeholder: "0", "aria-label": t("salary") });
      b.appendChild(el("div", { class: "mhs-hb-salrow" }, [
        el("label", null, [el("small", { text: t("salary") }), salIn]),
        el("button", { type: "button", class: "mhs-btn primary", text: t("setSalary"), on: { click: function () {
          var v = parseAmount(salIn.value);
          var dd = load(), bk = bookOf(dd, book.id);
          bk.salaries = bk.salaries || {};
          if (v > 0) bk.salaries[name] = v; else delete bk.salaries[name];
          save(dd); X.toast(t("saved")); render();
        } } })
      ]));
    }
    drawSheet(b, book, sorted(list), "");
    addFab(function () { openEntry(book, null, { party: name }); });
  }

  function drawSheet(host, book, rows, q) {
    var L = labels(book.type);
    if (!rows.length) { host.appendChild(el("p", { class: "mhs-mini-msg", text: t("noEntries") })); return; }
    var run = 0, items = rows.map(function (e) { run += delta(book, e); return { e: e, bal: run }; });
    if (q) items = items.filter(function (it) { return ((it.e.party || "") + " " + (it.e.note || "") + " " + (it.e.category || "") + " " + it.e.amount).toLowerCase().indexOf(q) !== -1; });
    var wrap = el("div", { class: "mhs-hb-sheetwrap", role: "region", "aria-label": t("sheet"), tabindex: "0" });
    var table = el("table", { class: "mhs-hb-sheet" });
    table.appendChild(el("thead", null, [el("tr", null, [
      el("th", { scope: "col", text: t("date") }), el("th", { scope: "col", text: t("details") }),
      el("th", { scope: "col", class: "n", text: L.in }), el("th", { scope: "col", class: "n", text: L.out }), el("th", { scope: "col", class: "n", text: t("balance") })
    ])]));
    var tb = el("tbody");
    items.slice().reverse().forEach(function (it) {
      var e = it.e, det = [e.category, e.party, e.note].filter(Boolean).join(" · ") || "—";
      var tr = el("tr", { tabindex: "0", on: {
        click: function () { openEntry(book, e); },
        keydown: function (ev) { if (ev.key === "Enter") openEntry(book, e); }
      } }, [
        el("td", { class: "d", text: X.fmtDate(dateTs(e.date), { day: "numeric", month: "short" }) }),
        el("td", { class: "det", text: det }),
        el("td", { class: "n in", text: e.dir === "in" ? X.money(e.amount, "") : "" }),
        el("td", { class: "n out", text: e.dir === "out" ? X.money(e.amount, "") : "" }),
        el("td", { class: "n bal" + (it.bal < 0 ? " neg" : ""), text: X.money(it.bal, "") })
      ]);
      tb.appendChild(tr);
    });
    table.appendChild(tb);
    var tt = totals(book, items.map(function (i) { return i.e; }));
    table.appendChild(el("tfoot", null, [el("tr", null, [
      el("td", { colspan: "2", text: "Σ " + cur().trim() }),
      el("td", { class: "n in", text: X.money(tt.tin, "") }), el("td", { class: "n out", text: X.money(tt.tout, "") }),
      el("td", { class: "n bal" + (tt.bal < 0 ? " neg" : ""), text: X.money(tt.bal, "") })
    ])]));
    wrap.appendChild(table);
    host.appendChild(wrap);
  }

  function addFab(fn) {
    var old = S.dialog.querySelector(".mhs-hb-fab");
    old && old.remove();
    S.dialog.appendChild(el("button", { type: "button", class: "mhs-hb-fab", "aria-label": t("addEntry"), title: t("addEntry"), on: { click: fn } }, [X.icon("plus")]));
  }
  function clearFab() { var o = S && S.dialog.querySelector(".mhs-hb-fab"); o && o.remove(); }

  function initials(n) {
    var p = String(n || "?").trim().split(/\s+/);
    return Array.from(p[0] || "?")[0].toUpperCase() + (p[1] ? Array.from(p[1])[0].toUpperCase() : "");
  }
  function dateTs(ds) { var p = String(ds).split("-"); return new Date(+p[0], (+p[1] || 1) - 1, +p[2] || 1).getTime(); }
  function parseAmount(v) {
    v = String(v || "").trim();
    if (!v) return 0;
    var n;
    try { n = window.MHSCalc ? MHSCalc.evaluate(v) : parseFloat(v); } catch (e) { n = NaN; }
    if (n === undefined || isNaN(n)) n = parseFloat(v.replace(/,/g, ""));
    return isFinite(n) ? Math.round(n * 100) / 100 : NaN;
  }

  function remind(name, bal) {
    var msg = t("reminderMsg", { n: name, a: m(bal), d: X.fmtDate(Date.now(), { day: "numeric", month: "long", year: "numeric" }) });
    X.share(msg, t("title"));
  }

  function addSalaries(book) {
    var d = load(), bk = bookOf(d, book.id), sal = bk.salaries || {}, names = Object.keys(sal);
    if (!names.length) { X.toast(t("noSalaries")); return; }
    var mk = monthKey(X.dayKey()), note = t("salaryOf", { m: monthName(mk) }), n = 0;
    names.forEach(function (name) {
      var exists = d.entries.some(function (e) { return e.bookId === bk.id && e.dir === "in" && (e.party || "").toLowerCase() === name.toLowerCase() && e.note === note; });
      if (exists || !(sal[name] > 0)) return;
      d.entries.push({ id: X.uid("he"), bookId: bk.id, party: name, dir: "in", amount: sal[name], note: note, category: "", date: X.dayKey(), ts: Date.now() + n });
      n++;
    });
    save(d); X.haptic(14); X.toast(t("salariesAdded", { n: X.num(n) })); render();
  }

  function exportCsv(book) {
    var run = function () {
      var d = load(), rows = sorted(entriesOf(d, book.id)), bal = 0;
      var q = function (s) { s = String(s == null ? "" : s); return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
      var out = ["Date,Party,Details,In,Out,Balance"];
      rows.forEach(function (e) {
        bal += delta(book, e);
        out.push([e.date, e.party || "", [e.category, e.note].filter(Boolean).join(" "), e.dir === "in" ? e.amount : "", e.dir === "out" ? e.amount : "", Math.round(bal * 100) / 100].map(q).join(","));
      });
      var blob = new Blob(["﻿" + out.join("\n")], { type: "text/csv;charset=utf-8" });
      var url = URL.createObjectURL(blob), a = document.createElement("a");
      a.href = url; a.download = (book.name || "hisab").replace(/[^\wঀ-৿ -]+/g, "").trim().replace(/\s+/g, "_") + "_" + X.dayKey() + ".csv";
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(function () { URL.revokeObjectURL(url); }, 1500);
    };
    if (window.MHSGate) MHSGate.require("csv", run); else run();
  }

  /* ---------- bottom panels (forms) ---------- */
  var form = null;
  function closeForm() {
    if (form) { form.remove(); form = null; }
    window.MHSCalc && MHSCalc.close();
  }
  function panel(title, kids) {
    closeForm();
    form = el("div", { class: "mhs-hb-form", role: "dialog", "aria-label": title }, [
      el("div", { class: "mhs-hb-form-top" }, [el("b", { text: title }), el("button", { type: "button", class: "mhs-mini-ib", "aria-label": t("cancel"), on: { click: closeForm } }, [X.icon("x")])])
    ].concat(kids));
    form.addEventListener("keydown", function (e) { if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); closeForm(); } });
    S.dialog.appendChild(form);
    return form;
  }

  function openBookForm(tpl, book) {
    var editing = !!book, type = book ? book.type : tpl.type, emoji = book ? book.emoji : tpl.emoji;
    var name = el("input", { type: "text", value: book ? book.name : t(tpl.name), maxlength: "60", "aria-label": t("bookName"), placeholder: t("bookName") });
    var emo = X.emojiField(emoji, type === "dues" ? ["🧾", "🏪", "🛍️", "🤝"] : type === "cash" ? ["💵", "👛", "🏦", "📊"] : type === "payroll" ? ["👥", "🧑‍🔧", "🏭", "💼"] : ["📒", "📘", "🕌", "🏠"], function (g) { emoji = g; });
    var del = null;
    if (editing) {
      del = el("button", { type: "button", class: "mhs-hb-del", text: t("deleteBook"), on: { click: function () {
        if (!del.dataset.armed) { del.dataset.armed = "1"; del.textContent = t("confirm"); setTimeout(function () { if (del.isConnected) { delete del.dataset.armed; del.textContent = t("deleteBook"); } }, 3500); return; }
        var d = load();
        d.books = d.books.filter(function (b) { return b.id !== book.id; });
        d.entries = d.entries.filter(function (e) { return e.bookId !== book.id; });
        save(d); X.toast(t("deleted")); V.view = "home"; render();
      } } });
    }
    panel(editing ? t("rename") : t("newBook"), [
      el("label", { class: "mhs-hb-f" }, [el("small", { text: t("emoji") }), emo]),
      el("label", { class: "mhs-hb-f" }, [el("small", { text: t("bookName") }), name]),
      el("div", { class: "mhs-hb-actions" }, [
        del,
        el("button", { type: "button", class: "mhs-btn primary mhs-hb-save", text: editing ? t("save") : t("create"), on: { click: function () {
          var n = name.value.trim() || t(tpl ? tpl.name : "tplCustom");
          var d = load();
          if (editing) { var bk = bookOf(d, book.id); bk.name = n; bk.emoji = emoji || bk.emoji; }
          else {
            var nb = { id: X.uid("hb"), name: n, emoji: emoji || "📒", type: type, createdAt: Date.now() };
            if (type === "payroll") nb.salaries = {};
            d.books.push(nb); V.view = "book"; V.bookId = nb.id; V.tab = type === "dues" || type === "payroll" ? "people" : "sheet"; V.party = null; V.q = ""; V.month = "";
          }
          save(d); X.haptic(12); render();
        } } })
      ])
    ]);
    setTimeout(function () { name.focus(); name.select(); }, 60);
  }

  function openEntry(book, entry, preset) {
    preset = preset || {};
    var L = labels(book.type), d = load();
    var dir = entry ? entry.dir : preset.dir || (book.type === "cash" ? "out" : book.type === "payroll" ? "out" : "out");
    var cat = entry ? entry.category || "" : "";
    var known = parties(book, entriesOf(d, book.id)).map(function (p) { return p.name; });
    var listId = "mhs-hb-dl-" + book.id;

    var seg = el("div", { class: "mhs-hb-dir", role: "radiogroup" });
    function drawSeg() {
      seg.replaceChildren(
        el("button", { type: "button", role: "radio", "aria-checked": String(dir === "out"), class: "is-out" + (dir === "out" ? " is-on" : ""), text: L.out, on: { click: function () { dir = "out"; drawSeg(); } } }),
        el("button", { type: "button", role: "radio", "aria-checked": String(dir === "in"), class: "is-in" + (dir === "in" ? " is-on" : ""), text: L.in, on: { click: function () { dir = "in"; drawSeg(); } } })
      );
      amount.classList.toggle("is-in", dir === "in");
      amount.classList.toggle("is-out", dir === "out");
    }
    var amount = el("input", { type: "text", inputmode: "decimal", class: "mhs-hb-amt", value: entry ? String(entry.amount) : "", placeholder: "0", "aria-label": t("amount"), autocomplete: "off", enterkeyhint: "done" });
    var calcBtn = el("button", { type: "button", class: "mhs-hb-calcbtn", "aria-label": t("calc"), title: t("calc"), on: { click: function () {
      window.MHSCalc && MHSCalc.open({ host: S.dialog, value: amount.value, onUse: function (n) { amount.value = String(Math.round(n * 100) / 100); } });
    } } }, [X.icon("calc")]);
    var party = el("input", { type: "text", value: entry ? entry.party || "" : preset.party || "", list: listId, maxlength: "60", autocomplete: "off", placeholder: book.type === "payroll" ? t("employee") : book.type === "dues" ? t("customer") : t("party"), "aria-label": t("party") });
    var dl = el("datalist", { id: listId }, known.map(function (n) { return el("option", { value: n }); }));
    var note = el("input", { type: "text", value: entry ? entry.note || "" : "", maxlength: "140", placeholder: t("note"), "aria-label": t("note") });
    var date = el("input", { type: "date", value: entry ? entry.date : X.dayKey(), "aria-label": t("date") });
    var cats = null;
    if (book.type === "cash" || book.type === "custom") {
      cats = el("div", { class: "mhs-hb-cats", "aria-label": t("category") });
      CATS.forEach(function (c) {
        cats.appendChild(el("button", { type: "button", class: "mhs-emoji-pick" + (cat === c ? " is-on" : ""), text: c, "aria-label": c, on: { click: function () {
          cat = cat === c ? "" : c;
          cats.querySelectorAll("button").forEach(function (b) { b.classList.toggle("is-on", b.textContent === cat); });
        } } }));
      });
    }
    var del = null;
    if (entry) {
      del = el("button", { type: "button", class: "mhs-hb-del", text: t("del"), on: { click: function () {
        if (!del.dataset.armed) { del.dataset.armed = "1"; del.textContent = t("confirm"); setTimeout(function () { if (del.isConnected) { delete del.dataset.armed; del.textContent = t("del"); } }, 3500); return; }
        var dd = load(); dd.entries = dd.entries.filter(function (e) { return e.id !== entry.id; }); save(dd); X.toast(t("deleted")); render();
      } } });
    }
    function submit() {
      var a = parseAmount(amount.value);
      if (!(a > 0)) { X.toast(t("bad")); amount.focus(); return; }
      var dd = load();
      var rec = { bookId: book.id, party: party.value.trim(), dir: dir, amount: a, note: note.value.trim(), category: cat, date: /^\d{4}-\d{2}-\d{2}$/.test(date.value) ? date.value : X.dayKey() };
      if (entry) dd.entries = dd.entries.map(function (e) { return e.id === entry.id ? Object.assign({}, e, rec) : e; });
      else dd.entries.push(Object.assign({ id: X.uid("he"), ts: Date.now() }, rec));
      save(dd); X.haptic(14); X.toast(t("saved")); render();
    }
    amount.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); submit(); } });
    var showParty = book.type !== "cash" || (entry && entry.party);
    panel(entry ? t("save") : t("addEntry"), [
      seg,
      el("div", { class: "mhs-hb-amtrow" }, [el("span", { class: "mhs-hb-cursym", text: cur().trim() }), amount, calcBtn]),
      showParty ? el("div", { class: "mhs-hb-f" }, [party, dl]) : null,
      cats,
      el("div", { class: "mhs-hb-f2" }, [note, date]),
      el("div", { class: "mhs-hb-actions" }, [del, el("button", { type: "button", class: "mhs-btn primary mhs-hb-save", text: t("save"), on: { click: submit } })])
    ]);
    drawSeg();
    setTimeout(function () { amount.focus(); }, 60);
  }

  function open(opts) {
    opts = opts || {};
    if (!window.MHSSheet) return;
    if (S && S.dialog.open) { if (opts.bookId) { V.view = "book"; V.bookId = opts.bookId; V.party = null; render(); } return; }
    S = X.sheet({ id: "mhs-hisab", title: t("title"), sub: t("sub"), onClose: function () { S = null; form = null; } });
    if (!S) return;
    S.dialog.classList.add("mhs-hb-dialog");
    V = { view: opts.bookId ? "book" : "home", bookId: opts.bookId || null, tab: "sheet", party: null, month: "", q: "" };
    if (opts.bookId) { var bk = bookOf(load(), opts.bookId); if (bk && (bk.type === "dues" || bk.type === "payroll")) V.tab = "people"; }
    render();
    if (opts.add && V.view === "book") { var b2 = bookOf(load(), V.bookId); b2 && openEntry(b2, null, null); }
  }

  X.on(function (key) { if (S && (key === "hisab" || key === "*") && !form) render(); });

  window.MHSHisab = { open: open, stats: stats };
  X.action({ k: "hisab", label: function () { return t("title"); }, sub: function () { return t("menuSub"); }, icon: X.ICONS.ledger, c: "linear-gradient(140deg,#26a69a,#00695c)", run: function () { window.MHSHisab.open(); } });
})();
