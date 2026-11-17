"use strict";
(function() {
  "use strict";
  var Y = "muhasabah:prayer", z = ["fajr", "dhuhr", "asr", "maghrib", "isha", "tahajjud"], H = { karachi: { fajr: 18, isha: 18, name: "Karachi (Univ. of Islamic Sciences)" }, mwl: { fajr: 18, isha: 17, name: "Muslim World League" }, isna: { fajr: 15, isha: 15, name: "ISNA (North America)" }, egypt: { fajr: 19.5, isha: 17.5, name: "Egyptian Authority" }, makkah: { fajr: 18.5, ishaMin: 90, name: "Umm al-Qura (Makkah)" }, dubai: { fajr: 18.2, isha: 18.2, off: { dhuhr: 2, maghrib: 3 }, name: "Dubai (UAE)" }, kuwait: { fajr: 18, isha: 17.5, name: "Kuwait" }, qatar: { fajr: 18, ishaMin: 90, name: "Qatar" }, gulf: { fajr: 19.5, ishaMin: 90, name: "Gulf Region" }, jakim: { fajr: 20, isha: 18, name: "JAKIM / MUIS (Malaysia, Singapore)" }, kemenag: { fajr: 20, isha: 18, name: "Kemenag (Indonesia)" }, turkey: { fajr: 18, isha: 17, off: { sunrise: -7, dhuhr: 4, asr: 4, maghrib: 7 }, name: "Diyanet (T\xFCrkiye)" }, tehran: { fajr: 17.7, isha: 14, maghrib: 4.5, name: "Tehran (Univ. of Tehran)" }, morocco: { fajr: 19, isha: 17, off: { dhuhr: 4, maghrib: 5 }, name: "Morocco" }, france: { fajr: 12, isha: 12, name: "UOIF (France)" }, russia: { fajr: 16, isha: 15, name: "Russia (Spiritual Administration)" }, auto: { fajr: 18, isha: 17, name: "Automatic (by location)" } }, M = [["Dhaka", 23.8103, 90.4125], ["Chattogram", 22.3569, 91.7832], ["Sylhet", 24.8949, 91.8687], ["Rajshahi", 24.3745, 88.6042], ["Khulna", 22.8456, 89.5403], ["Barishal", 22.701, 90.3535], ["Rangpur", 25.7439, 89.2752], ["Mymensingh", 24.7471, 90.4203], ["Cumilla", 23.4607, 91.1809], ["Gazipur", 23.9999, 90.4203], ["Narayanganj", 23.6238, 90.5], ["Bogura", 24.8465, 89.3773], ["Cox's Bazar", 21.4272, 92.0058], ["Jashore", 23.1664, 89.2081], ["Dinajpur", 25.6217, 88.6355], ["Kolkata", 22.5726, 88.3639], ["Delhi", 28.6139, 77.209], ["Karachi", 24.8607, 67.0011], ["Makkah", 21.3891, 39.8579], ["Madinah", 24.5247, 39.5692], ["Riyadh", 24.7136, 46.6753], ["Dubai", 25.2048, 55.2708], ["Doha", 25.2854, 51.531], ["Kuwait City", 29.3759, 47.9774], ["Muscat", 23.588, 58.3829], ["Kuala Lumpur", 3.139, 101.6869], ["Singapore", 1.3521, 103.8198], ["Jakarta", -6.2088, 106.8456], ["Istanbul", 41.0082, 28.9784], ["Cairo", 30.0444, 31.2357], ["London", 51.5074, -0.1278], ["Paris", 48.8566, 2.3522], ["Rome", 41.9028, 12.4964], ["New York", 40.7128, -74.006], ["Toronto", 43.6532, -79.3832], ["Sydney", -33.8688, 151.2093], ["Tokyo", 35.6762, 139.6503], ["Seoul", 37.5665, 126.978]];
  function b() {
    var a = {};
    try {
      a = JSON.parse(localStorage.getItem(Y)) || {};
    } catch {
    }
    return { on: a.on !== false, src: a.src || "", at: typeof a.at == "number" ? a.at : 0, asked: !!a.asked, lat: typeof a.lat == "number" ? a.lat : null, lng: typeof a.lng == "number" ? a.lng : null, place: a.place || "", method: H[a.method] && !(!a.mv && a.method === "karachi" && a.asr !== "standard") ? a.method : "auto", asr: a.mv && (a.asr === "standard" || a.asr === "hanafi") ? a.asr : a.asr === "standard" ? "standard" : "auto", mv: a.mv || 0, links: a.links && typeof a.links == "object" ? a.links : {} };
  }
  var S = {};
  function A(a) {
    try {
      localStorage.setItem(Y, JSON.stringify(a));
    } catch {
    }
    S = {};
    try {
      window.dispatchEvent(new CustomEvent("mhs-prayer-change"));
    } catch {
    }
  }
  var C = Math.PI / 180;
  function x(a) {
    return Math.sin(a * C);
  }
  function _(a) {
    return Math.cos(a * C);
  }
  function ea(a) {
    return Math.tan(a * C);
  }
  function na(a) {
    return Math.asin(a) / C;
  }
  function sa(a) {
    return Math.acos(a) / C;
  }
  function ra(a, t) {
    return Math.atan2(a, t) / C;
  }
  function ia(a) {
    return Math.atan(1 / a) / C;
  }
  function L(a, t) {
    return a = a - t * Math.floor(a / t), a < 0 ? a + t : a;
  }
  function oa(a, t, e) {
    t <= 2 && (a -= 1, t += 12);
    var s = Math.floor(a / 100), c = 2 - s + Math.floor(s / 4);
    return Math.floor(365.25 * (a + 4716)) + Math.floor(30.6001 * (t + 1)) + e + c - 1524.5;
  }
  function F(a) {
    var t = a - 2451545, e = L(357.529 + 0.98560028 * t, 360), s = L(280.459 + 0.98564736 * t, 360), c = L(s + 1.915 * x(e) + 0.02 * x(2 * e), 360), u = 23.439 - 36e-8 * t, y = ra(_(u) * x(c), _(c)) / 15;
    return { decl: na(x(u) * x(c)), eqt: s / 15 - L(y, 24) };
  }
  function la(a, t, e, s, c, u, y) {
    var v = oa(a, t, e) - c / 360;
    function f(l) {
      return L(12 - F(v + l).eqt, 24);
    }
    function h(l, p, Z) {
      var aa = F(v + p).decl, va = f(p), J = (-x(l) - x(aa) * x(s)) / (_(aa) * _(s));
      if (J < -1 || J > 1) return NaN;
      var ta = sa(J) / 15;
      return va + (Z ? -ta : ta);
    }
    function k(l) {
      var p = F(v + l).decl;
      return h(-ia(y + ea(Math.abs(s - p))), l);
    }
    for (var m = H[u], i = { fajr: 5, sunrise: 6, dhuhr: 12, asr: 13, sunset: 18, isha: 18 }, d = 0; d < 2; d++) i = { fajr: h(m.fajr, i.fajr / 24, true), sunrise: h(0.833, i.sunrise / 24, true), dhuhr: f(i.dhuhr / 24), asr: k(i.asr / 24), sunset: h(0.833, i.sunset / 24), isha: m.ishaMin ? NaN : h(m.isha, i.isha / 24) }, ["fajr", "sunrise", "asr", "sunset", "isha"].forEach(function(l) {
      isNaN(i[l]) && (i[l] = { fajr: 5, sunrise: 6, asr: 13, sunset: 18, isha: 18 }[l]);
    });
    if (i = { fajr: h(m.fajr, i.fajr / 24, true), sunrise: h(0.833, i.sunrise / 24, true), dhuhr: f(i.dhuhr / 24), asr: k(i.asr / 24), sunset: h(0.833, i.sunset / 24), isha: m.ishaMin ? NaN : h(m.isha, i.isha / 24) }, isNaN(i.sunrise) || isNaN(i.sunset)) return null;
    m.ishaMin && (i.isha = i.sunset + m.ishaMin / 60);
    var g = 24 - (i.sunset - i.sunrise), E = m.fajr / 60 * g, o = (m.isha || 18) / 60 * g;
    return (isNaN(i.fajr) || i.sunrise - i.fajr > E) && (i.fajr = i.sunrise - E), !m.ishaMin && (isNaN(i.isha) || i.isha - i.sunset > o) && (i.isha = i.sunset + o), i.maghrib = m.maghrib && !isNaN(h(m.maghrib, i.sunset / 24)) ? h(m.maghrib, i.sunset / 24) : i.sunset, i.midnight = i.sunset + (i.fajr + 24 - i.sunset) / 2, i;
  }
  function mhsRegion(t) {
    var a = t.lat, g = t.lng;
    function B2(l1, l2, g1, g2) {
      return a >= l1 && a <= l2 && g >= g1 && g <= g2;
    }
    if (a === null || g === null) return { method: "mwl", asr: "standard" };
    if (B2(24.4, 26.2, 50.7, 51.7)) return { method: "qatar", asr: "standard" };
    if (B2(25.7, 26.4, 50.3, 50.85)) return { method: "gulf", asr: "standard" };
    if (B2(22.5, 26.1, 51.5, 56.5)) return { method: "dubai", asr: "standard" };
    if (B2(28.5, 30.1, 46.5, 48.5)) return { method: "kuwait", asr: "standard" };
    if (B2(16.6, 26.5, 52, 60)) return { method: "gulf", asr: "standard" };
    if (B2(12, 32.2, 34.5, 55.7)) return { method: "makkah", asr: "standard" };
    if (B2(25, 39.8, 44, 61)) return { method: "tehran", asr: "standard" };
    if (B2(5, 38.5, 60.5, 97.5)) return { method: "karachi", asr: "hanafi" };
    if (B2(36, 42.2, 26, 44.8)) return { method: "turkey", asr: "standard" };
    if (B2(36.5, 46, 50, 87.5)) return { method: "mwl", asr: "hanafi" };
    if (B2(21.5, 31.7, 24.7, 35) || B2(8, 22, 21.8, 38.6) || B2(29, 37.5, 34, 42.5) || B2(29, 37.4, 38.8, 48.6) || B2(19.5, 33.2, 9.3, 25)) return { method: "egypt", asr: "standard" };
    if (B2(27, 36, -13.2, -1)) return { method: "morocco", asr: "standard" };
    if (B2(1.15, 1.48, 103.6, 104.1) || B2(0.85, 7.4, 99.6, 119.3)) return { method: "jakim", asr: "standard" };
    if (B2(-11.2, 6.2, 95, 141.1)) return { method: "kemenag", asr: "standard" };
    if (B2(14, 72, -170, -50)) return { method: "isna", asr: "standard" };
    if (a >= 50 && g >= 27) return { method: "russia", asr: "standard" };
    return { method: "mwl", asr: "standard" };
  }
  function mhsResolve(t) {
    var r2 = mhsRegion(t);
    return { method: t.method === "auto" || !H[t.method] ? r2.method : t.method, asr: t.asr === "auto" || t.asr !== "hanafi" && t.asr !== "standard" ? r2.asr : t.asr };
  }
  function T(a) {
    var t = b(), rz = mhsResolve(t);
    if (t.lat === null || t.lng === null) return null;
    var e = a ? new Date(a) : /* @__PURE__ */ new Date(), s = e.getFullYear(), c = e.getMonth(), u = e.getDate(), y = s + "-" + c + "-" + u + "|" + t.lat + "," + t.lng + "|" + rz.method + "|" + rz.asr;
    if (y in S) return S[y];
    var v = la(s, c + 1, u, t.lat, t.lng, rz.method, rz.asr === "hanafi" ? 2 : 1), f = null;
    if (v) {
      var h = Date.UTC(s, c, u), k = t.lng / 15;
      f = {}, Object.keys(v).forEach(function(d) {
        f[d] = Math.round((h + (v[d] - k) * 36e5) / 6e4) * 6e4;
      }), f.dhuhr += 6e4;
      var mo = H[rz.method] && H[rz.method].off;
      mo && Object.keys(mo).forEach(function(d) {
        f[d] != null && (f[d] += mo[d] * 6e4);
      });
      var m = new Date(s, c, u, 23, 59, 59, 0).getTime();
      f.ishaEnd = Math.min(f.midnight, m);
    }
    var i = Object.keys(S);
    return i.length > 40 && (S = {}), S[y] = f, f;
  }
  function D(a, t) {
    var e = T(t);
    if (!e) return null;
    switch (a) {
      case "fajr":
        return { start: e.fajr, end: e.sunrise };
      case "dhuhr":
        return { start: e.dhuhr, end: e.asr };
      case "asr":
        return { start: e.asr, end: e.sunset };
      case "maghrib":
        return { start: e.maghrib, end: e.isha };
      case "isha":
        return { start: e.isha, end: e.ishaEnd };
      case "tahajjud":
        return { start: null, end: e.fajr };
    }
    return null;
  }
  function R(a, t) {
    if (t = t || b(), !t.on || !a || !a.id) return null;
    var e = a.id in t.links ? t.links[a.id] : O(a.title);
    return z.indexOf(e) >= 0 ? e : null;
  }
  var U = [["tahajjud", /tahaj+ud|tahajjod|qiyam|তাহাজ্জু?দ|কিয়াম|تهجد|قيام/i], ["fajr", /fa[jg]r|fazr|ফজর|الفجر|فجر|subh/i], ["dhuhr", /dhuhr|zuhr|zohr|duhr|johr|zuhur|যোহর|জোহর|যুহর|ظهر/i], ["asr", /\basr\b|asar|আসর|عصر/i], ["maghrib", /maghrib|magrib|মাগরিব|مغرب/i], ["isha", /isha|esha|ইশা|এশা|عشاء|العشاء/i]];
  function O(a) {
    a = String(a || "");
    for (var t = 0; t < U.length; t++) if (U[t][1].test(a)) return U[t][0];
    return null;
  }
  var ca = { "Asia/Dhaka": "Dhaka", "Asia/Dacca": "Dhaka", "Asia/Kolkata": "Kolkata", "Asia/Calcutta": "Kolkata", "Asia/Karachi": "Karachi", "Asia/Riyadh": "Riyadh", "Asia/Dubai": "Dubai", "Asia/Qatar": "Doha", "Asia/Kuwait": "Kuwait City", "Asia/Muscat": "Muscat", "Asia/Kuala_Lumpur": "Kuala Lumpur", "Asia/Singapore": "Singapore", "Asia/Jakarta": "Jakarta", "Europe/Istanbul": "Istanbul", "Africa/Cairo": "Cairo", "Europe/London": "London", "Europe/Paris": "Paris", "Europe/Rome": "Rome", "America/New_York": "New York", "America/Toronto": "Toronto", "Australia/Sydney": "Sydney", "Asia/Tokyo": "Tokyo", "Asia/Seoul": "Seoul" };
  function ua(a) {
    for (var t = 0; t < M.length; t++) if (M[t][0] === a) return M[t];
    return null;
  }
  function Q(a) {
    var t = b();
    t.lat = Math.round(a.coords.latitude * 1e4) / 1e4, t.lng = Math.round(a.coords.longitude * 1e4) / 1e4;
    // Name the place after the nearest known city (within ~35 km) so people can see the fix is right.
    var near = null, best = 35;
    M.forEach(function(c) {
      var dy = (c[1] - t.lat) * 111, dx = (c[2] - t.lng) * 111 * Math.cos(t.lat * C), km = Math.sqrt(dx * dx + dy * dy);
      km < best && (best = km, near = c[0]);
    });
    t.place = "\u{1F4CD} " + (near ? near + " \xB7 " : "") + t.lat.toFixed(3) + ", " + t.lng.toFixed(3), t.src = "gps", t.at = Date.now(), t.asked = true, A(t);
  }
  // Ask the device for its position. A quick network/cached fix is tried first; if that times out or
  // is unavailable (GPS-only phones, network location switched off), retry once with high accuracy.
  // fail(err) gets an object with code 1 (denied), 2 (unavailable), 3 (timeout) or 0 (unsupported/insecure).
  var locBusy = null;
  function P(a, t) {
    if (!navigator.geolocation || window.isSecureContext === false) {
      a && a({ code: 0 });
      return;
    }
    if (locBusy) {
      locBusy.push([a, t]);
      return;
    }
    locBusy = [[a, t]];
    function done(ok, err) {
      var q2 = locBusy || [];
      locBusy = null;
      q2.forEach(function(cb) {
        try {
          ok ? cb[1] && cb[1]() : cb[0] && cb[0](err);
        } catch {
        }
      });
    }
    function fail(e) {
      var s = b();
      s.asked = true, A(s), done(false, e || { code: 2 });
    }
    function win(e) {
      Q(e), done(true);
    }
    try {
      navigator.geolocation.getCurrentPosition(win, function(e) {
        if (e && e.code === 1) return fail(e);
        try {
          navigator.geolocation.getCurrentPosition(win, fail, { enableHighAccuracy: true, timeout: 2e4, maximumAge: 0 });
        } catch (x) {
          fail({ code: 2 });
        }
      }, { enableHighAccuracy: false, timeout: 1e4, maximumAge: 6e5 });
    } catch (x) {
      fail({ code: 2 });
    }
  }
  function da() {
    if (!navigator.geolocation || window.isSecureContext === false) return Promise.resolve("unsupported");
    var a = b();
    return !navigator.permissions || !navigator.permissions.query ? Promise.resolve(a.src === "gps" ? "granted" : "prompt") : navigator.permissions.query({ name: "geolocation" }).then(function(t) {
      return t.state;
    }, function() {
      return a.src === "gps" ? "granted" : "prompt";
    });
  }
  // Resolves to "granted", "denied", "unavailable" (location services off / no fix), or "unsupported".
  // Older callers treat anything that is not "granted" or "denied" as a retryable error.
  function ha() {
    return new Promise(function(a) {
      if (!navigator.geolocation || window.isSecureContext === false) return a("unsupported");
      P(function(t) {
        a(t && t.code === 1 ? "denied" : t && t.code === 0 ? "unsupported" : "unavailable");
      }, function() {
        var t = b();
        t.on = true, I(t), A(t), a("granted");
      });
    });
  }
  // Pick a city from the built-in list (index into MHSPrayer.cities) when GPS isn't an option.
  function pickCity(i) {
    var c = M[+i];
    if (!c) return false;
    var t = b();
    return t.lat = c[1], t.lng = c[2], t.place = c[0], t.src = "city", t.at = Date.now(), t.asked = true, t.on || (t.on = true), I(t), A(t), true;
  }
  // Watch for the permission being switched on later (e.g. in phone settings) and fetch a fix then.
  try {
    navigator.permissions && navigator.permissions.query && navigator.permissions.query({ name: "geolocation" }).then(function(st) {
      st && "onchange" in st && st.addEventListener("change", function() {
        try {
          window.dispatchEvent(new CustomEvent("mhs-location-permission", { detail: st.state }));
        } catch {
        }
        var c = b();
        st.state === "granted" && c.on && c.src !== "city" && c.src !== "manual" && P();
      });
    }, function() {
    });
  } catch {
  }
  function W() {
    var a = b();
    if (a.on) {
      if (a.lat === null) {
        var t = "";
        try {
          t = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
        } catch {
        }
        var e = ua(ca[t]);
        e && (a.lat = e[1], a.lng = e[2], a.place = e[0], a.src = "tz", A(a));
      }
      if (a = b(), a.src !== "city") {
        var s = Date.now() - a.at > 36e5, c = navigator.permissions && navigator.permissions.query ? navigator.permissions.query({ name: "geolocation" }).then(function(u) {
          return u.state;
        }, function() {
          return "prompt";
        }) : Promise.resolve("prompt");
        c.then(function(u) {
          u === "granted" && (a.src !== "gps" || s) && P();
        });
      }
    }
  }
  var q = { prayers: z, config: b, resolve: function() {
    return mhsResolve(b());
  }, methods: H, day: T, window: D, link: function(a) {
    return R(a);
  }, dl: function(a, t) {
    var e = R(a);
    if (!e) return null;
    var s = D(e, t);
    return s ? s.end : null;
  }, start: function(a, t) {
    var e = R(a);
    if (!e) return null;
    var s = D(e, t);
    return s ? s.start : null;
  }, guess: O, locate: P, locationState: da, enableLocation: ha, cities: M, pickCity: pickCity };
  window.MHSPrayer = q;
  var j = { en: { title: "Prayer times by location", sub: "Deadlines for prayer habits follow the real waqt every day, calculated on this device. No internet, no server, no tracking.", enable: "Use real prayer times as deadlines", loc: "Location", useLoc: "\u{1F4CD} Use my location", locating: "Getting location\u2026", locFail: "Couldn't get your location. Allow location access or pick a city below.", locDenied: "Location is blocked for this app. Allow it in your browser or phone settings (Site settings \u2192 Location), or pick a city below.", locOff: "Couldn't get a location fix. Turn on your phone's location (GPS) and try again, or pick a city below.", locNone: "This device or browser can't share its location. Pick a city below.", locNote: "Location is read once and saved only on this device. It's never sent anywhere and never tracked.", noLoc: "No location set", city: "Or pick a city", pick: "Choose\u2026", method: "Calculation method", asr: "Asr", hanafi: "Hanafi (later)", standard: "Shafi'i / Maliki / Hanbali", today: "Today's times", starts: "Start", ends: "Deadline", forbidden: "Forbidden times (no salah)", fSunrise: "Sunrise", fZawal: "Zawal (midday)", fSunset: "Before sunset", links: "Linked habits", linksHelp: "Pick which prayer each habit is. Linked habits use the waqt end as deadline and can't be checked before the waqt starts. Unlinked habits keep your own deadline.", none: "\u2014 Own deadline \u2014", noHabits: "No active habits yet.", names: { fajr: "Fajr", dhuhr: "Dhuhr", asr: "Asr", maghrib: "Maghrib", isha: "Isha", tahajjud: "Tahajjud", sunrise: "Sunrise", midnight: "Midnight" }, notes: "Fajr ends at sunrise, Dhuhr at Asr, Asr at sunset, Maghrib at Isha. Isha's deadline is Islamic midnight (latest 23:59), Tahajjud ends at Fajr. Times can differ from your local mosque by 1\u20133 minutes.", offTip: "Turn this on and set a location to apply real prayer times.", wTitle: "Prayer times", now: "Now", next: "Next", left: "left", in: "in", until: "until", startsAt: "starts", deadline: "deadline", fNow: "Forbidden time \u2014 don't pray now", fUntil: "ends", srcGps: "from your location", srcTz: "guessed from time zone \u2014 tap \u{1F4CD} for exact times", srcCity: "selected city", setLoc: "Set your location to get exact prayer times and fair deadlines.", ended: "Today's prayers are over" }, ar: { locDenied: "الموقع محظور لهذا التطبيق. اسمح به من إعدادات المتصفح أو الهاتف (إعدادات الموقع ← الموقع الجغرافي)، أو اختر مدينة أدناه.", locOff: "تعذّر تحديد موقعك. شغّل خدمة الموقع (GPS) في هاتفك وحاول مرة أخرى، أو اختر مدينة أدناه.", locNone: "لا يستطيع هذا الجهاز أو المتصفح مشاركة الموقع. اختر مدينة أدناه.", title: "\u0645\u0648\u0627\u0642\u064A\u062A \u0627\u0644\u0635\u0644\u0627\u0629 \u062D\u0633\u0628 \u0627\u0644\u0645\u0648\u0642\u0639", sub: "\u0645\u0648\u0627\u0639\u064A\u062F \u0639\u0627\u062F\u0627\u062A \u0627\u0644\u0635\u0644\u0627\u0629 \u062A\u062A\u0628\u0639 \u0627\u0644\u0648\u0642\u062A \u0627\u0644\u062D\u0642\u064A\u0642\u064A \u0643\u0644 \u064A\u0648\u0645\u060C \u0648\u062A\u064F\u062D\u0633\u0628 \u0639\u0644\u0649 \u0647\u0630\u0627 \u0627\u0644\u062C\u0647\u0627\u0632 \u062F\u0648\u0646 \u0625\u0646\u062A\u0631\u0646\u062A \u0623\u0648 \u062E\u0627\u062F\u0645 \u0623\u0648 \u062A\u062A\u0628\u0639.", enable: "\u0627\u0633\u062A\u062E\u062F\u0645 \u0645\u0648\u0627\u0642\u064A\u062A \u0627\u0644\u0635\u0644\u0627\u0629 \u0627\u0644\u062D\u0642\u064A\u0642\u064A\u0629 \u0643\u0645\u0648\u0627\u0639\u064A\u062F", loc: "\u0627\u0644\u0645\u0648\u0642\u0639", useLoc: "\u{1F4CD} \u0627\u0633\u062A\u062E\u062F\u0645 \u0645\u0648\u0642\u0639\u064A", locating: "\u062C\u0627\u0631\u064D \u062A\u062D\u062F\u064A\u062F \u0627\u0644\u0645\u0648\u0642\u0639\u2026", locFail: "\u062A\u0639\u0630\u0651\u0631 \u062A\u062D\u062F\u064A\u062F \u0645\u0648\u0642\u0639\u0643. \u0627\u0633\u0645\u062D \u0628\u0627\u0644\u0648\u0635\u0648\u0644 \u0625\u0644\u0649 \u0627\u0644\u0645\u0648\u0642\u0639 \u0623\u0648 \u0627\u062E\u062A\u0631 \u0645\u062F\u064A\u0646\u0629.", locNote: "\u064A\u064F\u0642\u0631\u0623 \u0627\u0644\u0645\u0648\u0642\u0639 \u0645\u0631\u0629 \u0648\u0627\u062D\u062F\u0629 \u0648\u064A\u064F\u062D\u0641\u0638 \u0639\u0644\u0649 \u0647\u0630\u0627 \u0627\u0644\u062C\u0647\u0627\u0632 \u0641\u0642\u0637\u060C \u0648\u0644\u0627 \u064A\u064F\u0631\u0633\u0644 \u0623\u0648 \u064A\u064F\u062A\u062A\u0628\u0639.", noLoc: "\u0644\u0645 \u064A\u064F\u062D\u062F\u062F \u0645\u0648\u0642\u0639", city: "\u0623\u0648 \u0627\u062E\u062A\u0631 \u0645\u062F\u064A\u0646\u0629", pick: "\u0627\u062E\u062A\u0631\u2026", method: "\u0637\u0631\u064A\u0642\u0629 \u0627\u0644\u062D\u0633\u0627\u0628", asr: "\u0627\u0644\u0639\u0635\u0631", hanafi: "\u062D\u0646\u0641\u064A (\u0645\u062A\u0623\u062E\u0631)", standard: "\u0634\u0627\u0641\u0639\u064A / \u0645\u0627\u0644\u0643\u064A / \u062D\u0646\u0628\u0644\u064A", today: "\u0645\u0648\u0627\u0642\u064A\u062A \u0627\u0644\u064A\u0648\u0645", starts: "\u0627\u0644\u0628\u062F\u0627\u064A\u0629", ends: "\u0627\u0644\u0645\u0648\u0639\u062F", forbidden: "\u0623\u0648\u0642\u0627\u062A \u0627\u0644\u0646\u0647\u064A \u0639\u0646 \u0627\u0644\u0635\u0644\u0627\u0629", fSunrise: "\u0627\u0644\u0634\u0631\u0648\u0642", fZawal: "\u0627\u0644\u0632\u0648\u0627\u0644", fSunset: "\u0642\u0628\u0644 \u0627\u0644\u063A\u0631\u0648\u0628", links: "\u0627\u0644\u0639\u0627\u062F\u0627\u062A \u0627\u0644\u0645\u0631\u062A\u0628\u0637\u0629", linksHelp: "\u0627\u062E\u062A\u0631 \u0627\u0644\u0635\u0644\u0627\u0629 \u0644\u0643\u0644 \u0639\u0627\u062F\u0629. \u0627\u0644\u0639\u0627\u062F\u0627\u062A \u0627\u0644\u0645\u0631\u062A\u0628\u0637\u0629 \u0645\u0648\u0639\u062F\u0647\u0627 \u0646\u0647\u0627\u064A\u0629 \u0627\u0644\u0648\u0642\u062A\u060C \u0648\u0644\u0627 \u064A\u0645\u0643\u0646 \u0625\u0643\u0645\u0627\u0644\u0647\u0627 \u0642\u0628\u0644 \u062F\u062E\u0648\u0644 \u0627\u0644\u0648\u0642\u062A. \u063A\u064A\u0631 \u0627\u0644\u0645\u0631\u062A\u0628\u0637\u0629 \u062A\u0628\u0642\u0649 \u0628\u0645\u0648\u0639\u062F\u0643.", none: "\u2014 \u0645\u0648\u0639\u062F\u064A \u0627\u0644\u062E\u0627\u0635 \u2014", noHabits: "\u0644\u0627 \u062A\u0648\u062C\u062F \u0639\u0627\u062F\u0627\u062A \u0646\u0634\u0637\u0629 \u0628\u0639\u062F.", names: { fajr: "\u0627\u0644\u0641\u062C\u0631", dhuhr: "\u0627\u0644\u0638\u0647\u0631", asr: "\u0627\u0644\u0639\u0635\u0631", maghrib: "\u0627\u0644\u0645\u063A\u0631\u0628", isha: "\u0627\u0644\u0639\u0634\u0627\u0621", tahajjud: "\u0627\u0644\u062A\u0647\u062C\u062F", sunrise: "\u0627\u0644\u0634\u0631\u0648\u0642", midnight: "\u0645\u0646\u062A\u0635\u0641 \u0627\u0644\u0644\u064A\u0644" }, notes: "\u064A\u0646\u062A\u0647\u064A \u0627\u0644\u0641\u062C\u0631 \u0628\u0627\u0644\u0634\u0631\u0648\u0642\u060C \u0648\u0627\u0644\u0638\u0647\u0631 \u0628\u0627\u0644\u0639\u0635\u0631\u060C \u0648\u0627\u0644\u0639\u0635\u0631 \u0628\u0627\u0644\u063A\u0631\u0648\u0628\u060C \u0648\u0627\u0644\u0645\u063A\u0631\u0628 \u0628\u0627\u0644\u0639\u0634\u0627\u0621. \u0645\u0648\u0639\u062F \u0627\u0644\u0639\u0634\u0627\u0621 \u0645\u0646\u062A\u0635\u0641 \u0627\u0644\u0644\u064A\u0644 \u0627\u0644\u0634\u0631\u0639\u064A (\u062D\u062A\u0649 23:59)\u060C \u0648\u0627\u0644\u062A\u0647\u062C\u062F \u064A\u0646\u062A\u0647\u064A \u0628\u0627\u0644\u0641\u062C\u0631. \u0642\u062F \u062A\u062E\u062A\u0644\u0641 \u0627\u0644\u0623\u0648\u0642\u0627\u062A \u0639\u0646 \u0645\u0633\u062C\u062F\u0643 \u0628\u062F\u0642\u064A\u0642\u0629 \u0625\u0644\u0649 \u062B\u0644\u0627\u062B.", offTip: "\u0641\u0639\u0651\u0644 \u0627\u0644\u062E\u064A\u0627\u0631 \u0648\u062D\u062F\u062F \u0645\u0648\u0642\u0639\u0627\u064B \u0644\u062A\u0637\u0628\u064A\u0642 \u0627\u0644\u0645\u0648\u0627\u0642\u064A\u062A \u0627\u0644\u062D\u0642\u064A\u0642\u064A\u0629.", wTitle: "\u0645\u0648\u0627\u0642\u064A\u062A \u0627\u0644\u0635\u0644\u0627\u0629", now: "\u0627\u0644\u0622\u0646", next: "\u0627\u0644\u062A\u0627\u0644\u064A", left: "\u0645\u062A\u0628\u0642\u064D", in: "\u0628\u0639\u062F", until: "\u062D\u062A\u0649", startsAt: "\u064A\u0628\u062F\u0623", deadline: "\u0627\u0644\u0645\u0648\u0639\u062F", fNow: "\u0648\u0642\u062A \u0646\u0647\u064A \u2014 \u0644\u0627 \u062A\u0635\u0644\u0650\u0651 \u0627\u0644\u0622\u0646", fUntil: "\u064A\u0646\u062A\u0647\u064A", srcGps: "\u0645\u0646 \u0645\u0648\u0642\u0639\u0643", srcTz: "\u0645\u0642\u062F\u0651\u0631 \u0645\u0646 \u0627\u0644\u0645\u0646\u0637\u0642\u0629 \u0627\u0644\u0632\u0645\u0646\u064A\u0629 \u2014 \u0627\u0636\u063A\u0637 \u{1F4CD} \u0644\u0644\u062F\u0642\u0629", srcCity: "\u0645\u062F\u064A\u0646\u0629 \u0645\u062E\u062A\u0627\u0631\u0629", setLoc: "\u062D\u062F\u062F \u0645\u0648\u0642\u0639\u0643 \u0644\u0645\u0648\u0627\u0642\u064A\u062A \u062F\u0642\u064A\u0642\u0629 \u0648\u0645\u0648\u0627\u0639\u064A\u062F \u0639\u0627\u062F\u0644\u0629.", ended: "\u0627\u0646\u062A\u0647\u062A \u0635\u0644\u0648\u0627\u062A \u0627\u0644\u064A\u0648\u0645" } };
  typeof j < "u" && j.en && (j.bn = Object.fromEntries(Object.entries(j.en).map(function(a) {
    return [a[0], window.MHSBengali[a[1]] || a[1]];
  })));
  function G() {
    var a = window.MHS && window.MHS.current();
    return a && ["en", "ar", "bn"].includes(a.lang) ? a.lang : "en";
  }
  Object.assign(j.bn, { locDenied: "এই অ্যাপের জন্য লোকেশন বন্ধ করা আছে। ব্রাউজার বা ফোনের সেটিংস (Site settings → Location) থেকে চালু করুন, অথবা নিচ থেকে একটি শহর বেছে নিন।", locOff: "লোকেশন পাওয়া যায়নি। ফোনের লোকেশন (GPS) চালু করে আবার চেষ্টা করুন, অথবা নিচ থেকে একটি শহর বেছে নিন।", locNone: "এই ডিভাইস বা ব্রাউজার লোকেশন দিতে পারে না। নিচ থেকে একটি শহর বেছে নিন।", title: "\u0985\u09AC\u09B8\u09CD\u09A5\u09BE\u09A8 \u0985\u09A8\u09C1\u09AF\u09BE\u09AF\u09BC\u09C0 \u09A8\u09BE\u09AE\u09BE\u099C\u09C7\u09B0 \u09B8\u09AE\u09AF\u09BC", sub: "\u09A8\u09BE\u09AE\u09BE\u099C\u09C7\u09B0 \u0985\u09AD\u09CD\u09AF\u09BE\u09B8\u09C7\u09B0 \u09B8\u09AE\u09AF\u09BC\u09B8\u09C0\u09AE\u09BE \u09AA\u09CD\u09B0\u09A4\u09BF\u09A6\u09BF\u09A8\u09C7\u09B0 \u09AA\u09CD\u09B0\u0995\u09C3\u09A4 \u0993\u09AF\u09BC\u09BE\u0995\u09CD\u09A4 \u0985\u09A8\u09C1\u09AF\u09BE\u09AF\u09BC\u09C0 \u098F\u0987 \u09A1\u09BF\u09AD\u09BE\u0987\u09B8\u09C7 \u09B9\u09BF\u09B8\u09BE\u09AC \u09B9\u09AF\u09BC\u0964", enable: "\u09AA\u09CD\u09B0\u0995\u09C3\u09A4 \u09A8\u09BE\u09AE\u09BE\u099C\u09C7\u09B0 \u09B8\u09AE\u09AF\u09BC\u0995\u09C7 \u09B8\u09AE\u09AF\u09BC\u09B8\u09C0\u09AE\u09BE \u09B9\u09BF\u09B8\u09C7\u09AC\u09C7 \u09AC\u09CD\u09AF\u09AC\u09B9\u09BE\u09B0 \u0995\u09B0\u09C1\u09A8", loc: "\u0985\u09AC\u09B8\u09CD\u09A5\u09BE\u09A8", useLoc: "\u0986\u09AE\u09BE\u09B0 \u0985\u09AC\u09B8\u09CD\u09A5\u09BE\u09A8 \u09AC\u09CD\u09AF\u09AC\u09B9\u09BE\u09B0 \u0995\u09B0\u09C1\u09A8", locating: "\u0985\u09AC\u09B8\u09CD\u09A5\u09BE\u09A8 \u0996\u09CB\u0981\u099C\u09BE \u09B9\u099A\u09CD\u099B\u09C7\u2026", locFail: "\u0985\u09AC\u09B8\u09CD\u09A5\u09BE\u09A8 \u09AA\u09BE\u0993\u09AF\u09BC\u09BE \u09AF\u09BE\u09AF\u09BC\u09A8\u09BF\u0964 \u0985\u09A8\u09C1\u09AE\u09A4\u09BF \u09A6\u09BF\u09A8 \u09AC\u09BE \u098F\u0995\u099F\u09BF \u09B6\u09B9\u09B0 \u09AC\u09C7\u099B\u09C7 \u09A8\u09BF\u09A8\u0964", locNote: "\u0985\u09AC\u09B8\u09CD\u09A5\u09BE\u09A8 \u098F\u0995\u09AC\u09BE\u09B0 \u09A8\u09BF\u09AF\u09BC\u09C7 \u09B6\u09C1\u09A7\u09C1 \u098F\u0987 \u09A1\u09BF\u09AD\u09BE\u0987\u09B8\u09C7 \u09B0\u09BE\u0996\u09BE \u09B9\u09AF\u09BC\u0964 \u0995\u09CB\u09A5\u09BE\u0993 \u09AA\u09BE\u09A0\u09BE\u09A8\u09CB \u09B9\u09AF\u09BC \u09A8\u09BE\u0964", noLoc: "\u0985\u09AC\u09B8\u09CD\u09A5\u09BE\u09A8 \u09A8\u09BF\u09B0\u09CD\u09A7\u09BE\u09B0\u09BF\u09A4 \u09A8\u09AF\u09BC", city: "\u0985\u09A5\u09AC\u09BE \u09B6\u09B9\u09B0 \u09AC\u09BE\u099B\u09BE\u0987 \u0995\u09B0\u09C1\u09A8", pick: "\u09AC\u09BE\u099B\u09BE\u0987 \u0995\u09B0\u09C1\u09A8\u2026", method: "\u0997\u09A3\u09A8\u09BE \u09AA\u09A6\u09CD\u09A7\u09A4\u09BF", asr: "\u0986\u09B8\u09B0", hanafi: "\u09B9\u09BE\u09A8\u09BE\u09AB\u09BF (\u09A6\u09C7\u09B0\u09BF\u09A4\u09C7)", standard: "\u09B6\u09BE\u09AB\u09C7\u09AF\u09BC\u09BF / \u09AE\u09BE\u09B2\u09BF\u0995\u09BF / \u09B9\u09BE\u09AE\u09CD\u09AC\u09B2\u09BF", today: "\u0986\u099C\u0995\u09C7\u09B0 \u09B8\u09AE\u09AF\u09BC\u09B8\u09C2\u099A\u09BF", starts: "\u09B6\u09C1\u09B0\u09C1", ends: "\u09B6\u09C7\u09B7", forbidden: "\u09A8\u09BE\u09AE\u09BE\u099C\u09C7\u09B0 \u09A8\u09BF\u09B7\u09BF\u09A6\u09CD\u09A7 \u09B8\u09AE\u09AF\u09BC", fSunrise: "\u09B8\u09C2\u09B0\u09CD\u09AF\u09CB\u09A6\u09AF\u09BC", fZawal: "\u09A6\u09CD\u09AC\u09BF\u09AA\u09CD\u09B0\u09B9\u09B0", fSunset: "\u09B8\u09C2\u09B0\u09CD\u09AF\u09BE\u09B8\u09CD\u09A4", names: { fajr: "\u09AB\u099C\u09B0", dhuhr: "\u09AF\u09CB\u09B9\u09B0", asr: "\u0986\u09B8\u09B0", maghrib: "\u09AE\u09BE\u0997\u09B0\u09BF\u09AC", isha: "\u098F\u09B6\u09BE" }, startsAt: "\u09B6\u09C1\u09B0\u09C1", deadline: "\u09B8\u09AE\u09AF\u09BC\u09B8\u09C0\u09AE\u09BE", fNow: "\u09A8\u09BF\u09B7\u09BF\u09A6\u09CD\u09A7 \u09B8\u09AE\u09AF\u09BC\u2014\u098F\u0996\u09A8 \u09A8\u09BE\u09AE\u09BE\u099C \u09AA\u09A1\u09BC\u09AC\u09C7\u09A8 \u09A8\u09BE", fUntil: "\u09B6\u09C7\u09B7", srcGps: "\u0986\u09AA\u09A8\u09BE\u09B0 \u0985\u09AC\u09B8\u09CD\u09A5\u09BE\u09A8 \u09A5\u09C7\u0995\u09C7", srcTz: "\u09B8\u09AE\u09AF\u09BC \u0985\u099E\u09CD\u099A\u09B2 \u09A5\u09C7\u0995\u09C7 \u0985\u09A8\u09C1\u09AE\u09BE\u09A8\u2014\u09B8\u09A0\u09BF\u0995 \u09B8\u09AE\u09AF\u09BC\u09C7\u09B0 \u099C\u09A8\u09CD\u09AF \u0985\u09AC\u09B8\u09CD\u09A5\u09BE\u09A8 \u09A6\u09BF\u09A8", srcCity: "\u09AC\u09BE\u099B\u09BE\u0987 \u0995\u09B0\u09BE \u09B6\u09B9\u09B0", setLoc: "\u09B8\u09A0\u09BF\u0995 \u09A8\u09BE\u09AE\u09BE\u099C\u09C7\u09B0 \u09B8\u09AE\u09AF\u09BC \u0993 \u09B8\u09AE\u09AF\u09BC\u09B8\u09C0\u09AE\u09BE\u09B0 \u099C\u09A8\u09CD\u09AF \u0986\u09AA\u09A8\u09BE\u09B0 \u0985\u09AC\u09B8\u09CD\u09A5\u09BE\u09A8 \u09A6\u09BF\u09A8\u0964", ended: "\u0986\u099C\u0995\u09C7\u09B0 \u09B8\u09AC \u09A8\u09BE\u09AE\u09BE\u099C\u09C7\u09B0 \u09B8\u09AE\u09AF\u09BC \u09B6\u09C7\u09B7" });
  function r(a) {
    return (j[G()] || j.en)[a] || j.en[a];
  }
  function N(a) {
    return (r("names") || j.en.names)[a] || a;
  }
  function w(a) {
    if (!a && a !== 0) return "\u2014";
    var t = new Date(a);
    return String(t.getHours()).padStart(2, "0") + ":" + String(t.getMinutes()).padStart(2, "0");
  }
  q.name = N, q.hm = w;
  function n(a, t, e) {
    var s = document.createElement(a);
    return t && Object.keys(t).forEach(function(c) {
      c === "on" ? Object.keys(t.on).forEach(function(u) {
        s.addEventListener(u, t.on[u]);
      }) : c === "text" ? s.textContent = t.text : c === "checked" ? s.checked = !!t.checked : c === "selected" ? s.selected = !!t.selected : c === "value" ? s.value = t.value : s.setAttribute(c, t[c]);
    }), (e || []).forEach(function(c) {
      c && s.appendChild(typeof c == "string" ? document.createTextNode(c) : c);
    }), s;
  }
  function K(a, t, e) {
    var s = n("select", { class: "mhs-select", on: { change: function() {
      e(s.value);
    } } });
    return a.forEach(function(c) {
      s.appendChild(n("option", { value: c[0], selected: c[0] === t, text: c[1] }));
    }), s.value = t, s;
  }
  function V() {
    var a = window.MHS && window.MHS.current();
    return a && Array.isArray(a.habits) ? a.habits.filter(function(t) {
      return t && t.status === "active";
    }) : [];
  }
  function I(a) {
    var t = false;
    return V().forEach(function(e) {
      if (!(e.id in a.links)) {
        var s = O(e.title);
        a.links[e.id] = s || "", t = true;
      }
    }), t;
  }
  var X = window.HTMLElement || function() {
  };
  class fa extends X {
    static get observedAttributes() {
      return ["lang"];
    }
    connectedCallback() {
      var t = this;
      this._tick = setInterval(function() {
        !document.hidden && t.isConnected && t.render();
      }, 6e4), this.render();
    }
    disconnectedCallback() {
      clearInterval(this._tick);
    }
    attributeChangedCallback() {
      this.isConnected && this.render();
    }
    update(t) {
      var e = b();
      t(e), A(e), this.render();
    }
    locate() {
      var t = this;
      t._msg = r("locating"), t.render(), P(function(e) {
        t._msg = r(e && e.code === 1 ? "locDenied" : e && e.code === 0 ? "locNone" : "locOff"), t.render();
      }, function() {
        t._msg = "", t.update(function(s) {
          s.on || (s.on = true, I(s));
        });
      });
    }
    render() {
      var t = this, e = b();
      e.on && I(e) && A(e);
      var s = n("div", { class: "panel mhs-panel", dir: G() === "ar" ? "rtl" : "ltr" });
      s.appendChild(n("div", { class: "mhs-head" }, [n("h3", { class: "mhs-title", text: "\u{1F54C} " + r("title") }), n("p", { class: "mhs-muted", text: r("sub") })]));
      var c = n("input", { type: "checkbox", checked: e.on, on: { change: function() {
        var o = c.checked;
        t.update(function(l) {
          l.on = o, o && I(l);
        }), o && u() && t.locate();
      } } });
      function u() {
        var o = b();
        return o.lat === null;
      }
      s.appendChild(n("label", { class: "mhs-switch" }, [c, n("span", { text: r("enable") })]));
      var y = [["", r("pick")]].concat(M.map(function(o, l) {
        return [String(l), o[0]];
      })), v = "";
      M.forEach(function(o, l) {
        o[1] === e.lat && o[2] === e.lng && (v = String(l));
      });
      var f = n("div", { class: "mhs-sec" }, [n("div", { class: "mhs-label", text: r("loc") }), n("div", { class: "mhs-status" + (e.lat !== null ? " ok" : ""), text: e.lat !== null ? (e.place || e.lat + ", " + e.lng) + " \u2022 " + r(e.src === "gps" ? "srcGps" : e.src === "tz" ? "srcTz" : "srcCity") : r("noLoc") }), t._msg ? n("div", { class: "mhs-status warn", text: t._msg }) : null, n("div", { class: "mhs-actions" }, [n("button", { type: "button", class: "mhs-btn primary", on: { click: function() {
        t.locate();
      } } }, [r("useLoc")]), K(y, v, function(o) {
        if (o !== "") {
          var l = M[+o];
          t._msg = "", t.update(function(p) {
            p.lat = l[1], p.lng = l[2], p.place = l[0], p.src = "city", p.at = Date.now(), p.on || (p.on = true, I(p));
          });
        }
      })]), n("p", { class: "mhs-muted", text: r("locNote") })]);
      s.appendChild(f), s.appendChild(n("div", { class: "mhs-sec mhs-row" }, [n("div", { class: "mhs-grow" }, [n("div", { class: "mhs-label", text: r("method") }), K(Object.keys(H).map(function(o) {
        return [o, H[o].name];
      }), e.method, function(o) {
        t.update(function(l) {
          l.method = o, l.mv = 2;
        });
      })]), n("div", { class: "mhs-grow" }, [n("div", { class: "mhs-label", text: r("asr") }), K([["auto", H.auto.name], ["hanafi", r("hanafi")], ["standard", r("standard")]], e.asr, function(o) {
        t.update(function(l) {
          l.asr = o, l.mv = 2;
        });
      })])]));
      var h = T();
      if (h) {
        var k = Date.now(), m = ["fajr", "dhuhr", "asr", "maghrib", "isha", "tahajjud"].map(function(o) {
          var l = D(o), p = l && (l.start === null || k >= l.start) && k < l.end;
          return n("div", { class: "mhs-item mhs-pt" + (p ? " live" : "") }, [n("span", { class: "mhs-pt-n", text: N(o) }), n("span", { class: "num mhs-pt-t", text: (l.start !== null ? w(l.start) : "\u2026") + " \u2192 " + w(l.end) })]);
        });
        s.appendChild(n("div", { class: "mhs-sec" }, [n("div", { class: "mhs-label", text: r("today") + " \u2022 " + r("starts") + " \u2192 " + r("ends") }), n("div", { class: "mhs-list" }, m)]));
        var i = [[r("fSunrise"), h.sunrise, h.sunrise + 15 * 6e4], [r("fZawal"), h.dhuhr - 7 * 6e4, h.dhuhr - 6e4], [r("fSunset"), h.sunset - 15 * 6e4, h.sunset]].map(function(o) {
          var l = k >= o[1] && k < o[2];
          return n("div", { class: "mhs-item mhs-pt bad" + (l ? " live" : "") }, [n("span", { class: "mhs-pt-n", text: "\u26D4 " + o[0] }), n("span", { class: "num mhs-pt-t", text: w(o[1]) + " \u2013 " + w(o[2]) })]);
        });
        s.appendChild(n("div", { class: "mhs-sec" }, [n("div", { class: "mhs-label", text: r("forbidden") }), n("div", { class: "mhs-list" }, i)]));
      }
      var d = V(), g = [["", r("none")]].concat(z.map(function(o) {
        return [o, "\u{1F54C} " + N(o)];
      })), E = n("div", { class: "mhs-list" }, d.length ? d.map(function(o) {
        var l = e.links[o.id] !== void 0 ? e.links[o.id] : O(o.title) || "";
        return n("div", { class: "mhs-item" }, [n("span", { class: "mhs-pt-n", text: (o.icon ? o.icon + " " : "") + o.title }), K(g, l, function(p) {
          t.update(function(Z) {
            Z.links[o.id] = p;
          });
        })]);
      }) : [n("div", { class: "mhs-muted", text: r("noHabits") })]);
      s.appendChild(n("div", { class: "mhs-sec" }, [n("div", { class: "mhs-label", text: r("links") }), n("p", { class: "mhs-muted", text: r("linksHelp") }), E])), s.appendChild(n("p", { class: "mhs-muted", text: e.on && e.lat !== null ? r("notes") : r("offTip") })), this.replaceChildren(s);
    }
  }
  window.customElements && !customElements.get("mhs-prayer") && customElements.define("mhs-prayer", fa);
  function $(a) {
    return [["fSunrise", a.sunrise, a.sunrise + 15 * 6e4], ["fZawal", a.dhuhr - 7 * 6e4, a.dhuhr - 6e4], ["fSunset", a.sunset - 15 * 6e4, a.sunset]];
  }
  q.forbidden = function(a) {
    var t = T(a);
    return t ? $(t) : [];
  };
  function B(a) {
    var t = Math.max(0, Math.round(a / 6e4)), e = Math.floor(t / 60);
    return e ? e + "h " + t % 60 + "m" : t + "m";
  }
  class ma extends X {
    static get observedAttributes() {
      return ["lang"];
    }
    connectedCallback() {
      var t = this;
      this._r = function() {
        t.isConnected && t.render();
      }, this._tick = setInterval(function() {
        document.hidden || t._r();
      }, 3e4), window.addEventListener("mhs-prayer-change", this._r), document.addEventListener("visibilitychange", this._r), this.render();
    }
    disconnectedCallback() {
      clearInterval(this._tick), window.removeEventListener("mhs-prayer-change", this._r), document.removeEventListener("visibilitychange", this._r);
    }
    attributeChangedCallback() {
      this.isConnected && this.render();
    }
    render() {
      var t = b();
      if (!t.on) {
        this.replaceChildren();
        return;
      }
      var e = n("div", { class: "panel mhs-waqt", dir: G() === "ar" ? "rtl" : "ltr" }), s = T(), c = n("div", { class: "mhs-w-head" }, [n("div", { class: "mhs-w-title", text: "\u{1F54C} " + r("wTitle") }), n("button", { type: "button", class: "mhs-w-loc", title: r("useLoc"), on: { click: function() {
        var d = this;
        d.textContent = r("locating"), P(function() {
          d.textContent = "\u{1F4CD} " + r("locFail");
        });
      } } }, ["\u{1F4CD} " + (t.lat !== null ? t.src === "gps" ? r("srcGps") : t.place : r("useLoc"))])]);
      if (e.appendChild(c), !s) {
        e.appendChild(n("p", { class: "mhs-muted", text: r("setLoc") })), this.replaceChildren(e);
        return;
      }
      t.src === "tz" && e.appendChild(n("p", { class: "mhs-muted mhs-w-note", text: t.place + " \u2022 " + r("srcTz") }));
      var u = Date.now(), y = ["fajr", "dhuhr", "asr", "maghrib", "isha"], v = {};
      y.forEach(function(d) {
        v[d] = D(d);
      });
      var f = null, h = null;
      y.forEach(function(d) {
        var g = v[d];
        u >= g.start && u < g.end && (f = d), !h && u < g.start && (h = d);
      });
      var k = $(s), m = null;
      k.forEach(function(d) {
        u >= d[1] && u < d[2] && (m = d);
      });
      var i;
      m ? i = n("div", { class: "mhs-w-now bad" }, [n("b", { text: "\u26D4 " + r("fNow") }), n("span", { class: "num", text: r(m[0]) + " \u2022 " + r("fUntil") + " " + w(m[2]) + " (" + B(m[2] - u) + ")" })]) : f ? i = n("div", { class: "mhs-w-now" + (v[f].end - u < 30 * 6e4 ? " warn" : "") }, [n("b", { text: r("now") + ": " + N(f) }), n("span", { class: "num", text: r("deadline") + " " + w(v[f].end) + " \u2022 " + B(v[f].end - u) + " " + r("left") })]) : h ? i = n("div", { class: "mhs-w-now idle" }, [n("b", { text: r("next") + ": " + N(h) }), n("span", { class: "num", text: r("startsAt") + " " + w(v[h].start) + " \u2022 " + r("in") + " " + B(v[h].start - u) })]) : i = n("div", { class: "mhs-w-now idle" }, [n("b", { text: r("ended") })]), e.appendChild(i), e.appendChild(n("div", { class: "mhs-w-grid" }, y.map(function(d) {
        var g = v[d], E = d === f ? " live" : u >= g.end ? " past" : "";
        return n("div", { class: "mhs-w-p" + E }, [n("div", { class: "mhs-w-n", text: N(d) }), n("div", { class: "num mhs-w-s", text: w(g.start) }), n("div", { class: "num mhs-w-e", title: r("until") + " " + w(g.end) }, [n("span", { class: "mhs-w-u", text: r("until") }), n("span", { text: w(g.end) })])]);
      }))), e.appendChild(n("div", { class: "mhs-w-fb" }, k.map(function(d) {
        var g = u >= d[1] && u < d[2];
        return n("span", { class: "mhs-w-chip num" + (g ? " live" : u >= d[2] ? " past" : ""), text: "\u26D4 " + r(d[0]) + " " + w(d[1]) + "\u2013" + w(d[2]) });
      }))), this.replaceChildren(e);
    }
  }
  window.customElements && !customElements.get("mhs-waqt") && customElements.define("mhs-waqt", ma);
  try {
    W();
  } catch {
  }
  document.addEventListener("visibilitychange", function() {
    if (!document.hidden) try {
      W();
    } catch {
    }
  });
})();
