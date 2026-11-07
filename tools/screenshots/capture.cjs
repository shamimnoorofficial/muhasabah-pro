/* Store-grade promotional screenshots — reproducible pipeline (developer tool, not part of the build).
 *
 *   1. serve the repo on :8889   → /opt/buildhome/node-deps/node_modules/.bin/netlify dev --port 8889  (or any static server)
 *   2. node tools/screenshots/capture.cjs            (env: BASE=http://localhost:8889  LANGS=en,bn  ONLY=01,05)
 *
 * What it does
 *   • seeds realistic demo data (habits, to-dos, notes, ledger, zikr, amol, essential amol, bookmarks…)
 *   • captures REAL app screens with Playwright (phone 390×844 @3x, desktop 1280×800 @1.5x)
 *   • composes each capture into a framed store graphic: 1080×1920 (narrow) and 1920×1080 (wide),
 *     dark glassmorphism gradient, device frame, bold benefit headline + subline (English and Bengali)
 *   • renders the Play feature graphic (1024×500) and a 512×512 icon
 *   • writes WebP (and PNG for the feature graphic/icon) into /assets/screenshots/ and rewrites the
 *     `screenshots` array of manifest.webmanifest (narrow + wide, every shot, descriptive labels)
 *   • curates the best 8 for the Play listing in /assets/screenshots/play/ (Play allows max 8 per device type)
 */
const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');

const BASE = process.env.BASE || 'http://localhost:8889';
const ROOT = path.join(__dirname, '..', '..');
const OUT = path.join(ROOT, 'assets', 'screenshots');
const LANGS = (process.env.LANGS || 'en,bn').split(',');
const ONLY = process.env.ONLY ? process.env.ONLY.split(',') : null;
fs.mkdirSync(OUT, { recursive: true });
fs.mkdirSync(path.join(OUT, 'play'), { recursive: true });

const NOW = new Date('2026-11-07T10:20:00+06:00').getTime(); // 16:20 in Dhaka — Asr is live, Maghrib next
const FONTS = 'https://fonts.googleapis.com/css2?family=Sora:wght@600;700;800&family=Inter:wght@400;500;600&family=Noto+Sans+Bengali:wght@500;600;700&family=Noto+Color+Emoji&family=Amiri:wght@400;700&display=block';
const EMOJI_CSS = `@import url('https://fonts.googleapis.com/css2?family=Noto+Color+Emoji&family=Noto+Sans+Bengali:wght@400;500;600;700&display=block');
body,button,input,select,textarea,dialog,dialog *:not(.num):not([lang=ar]):not(.ar){font-family:Inter,"Noto Sans Bengali",system-ui,sans-serif,"Noto Color Emoji"!important}
[style*="font-display"],h1,h2,.mhs-ps-headline{font-family:Sora,"Noto Sans Bengali",system-ui,sans-serif,"Noto Color Emoji"!important}
.num,[class*="font-mono"],.mhs-ps-s,.mhs-ps-e,.mhs-ps-cd,.mhs-ph-row .tm,.mhs-ph-row .cd,.wg-pt .tm,.wg-pt .cd,.wg-pt-cd{font-family:"JetBrains Mono","Noto Sans Bengali",ui-monospace,monospace,"Noto Color Emoji"!important}
.mhs-kh-ar,.mhs-rf-ar,.mhs-am-ar,.mhs-q-sura .ar,.mhs-q-ayah .ar,.mhs-w-ar,.mhs-kh-name .ar,.mhs-zk-ar,.wg-zk-ar,.wg-rem .ar{font-family:Amiri,"Noto Naskh Arabic",serif!important}
.mhs-dn-pill,#mhs-install-bar,#mhs-backup-bar,.mhs-toast,.mhs-pt-toast,dialog.mhs-eng{display:none!important}
*{caret-color:transparent!important}`;

/* ---------- demo data ---------- */
function demo(now) {
  const day = 864e5, D = n => new Date(now - n * day);
  const key = d => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  const at = (n, h, m) => { const d = D(n); d.setHours(h, m || 0, 0, 0); return d.getTime(); };
  const H = (id, title, icon, cat, pts, dl) => ({ id, title, icon, category: cat, points: pts, deadline: dl || '23:59:00', repeat: ['Everyday'], status: 'active', createdAt: now - 40 * day, grace: 0, autoPenalty: true, color: '#00C853' });
  const habits = [H('h1', 'Fajr on time', '🌅', 'Fard', 30), H('h2', 'Quran — 1 page', '📖', 'Sunnah', 20), H('h3', 'Morning adhkar', '🤲', 'Sunnah', 15), H('h4', 'No social media after Isha', '📵', 'Personal', 25), H('h5', '20 min walk', '🚶', 'Personal', 10), H('h6', 'Tahajjud', '🌙', 'Nafl', 40)];
  const ledger = [];
  for (let n = 20; n >= 1; n--) habits.forEach((h, i) => { if ((n * 7 + i * 3) % 5 !== 0) ledger.push({ id: 'l' + n + h.id, ts: at(n, 5 + i * 2, 10), delta: h.points, reason: h.title, note: 'Exact • On-time', type: 'checkIn', habitId: h.id }); });
  ['h1', 'h2', 'h3'].forEach((id, i) => { const h = habits.find(x => x.id === id); ledger.push({ id: 'lt' + id, ts: now - (3 - i) * 36e5, delta: h.points, reason: h.title, note: 'Exact • On-time', type: 'checkIn', habitId: id }); });
  ledger.push({ id: 'lp1', ts: at(4, 23, 59), delta: -10, reason: '20 min walk', note: 'Missed', type: 'autoPenalty', habitId: 'h5' });
  ledger.sort((a, b) => b.ts - a.ts);
  const todos = [
    { id: 't1', title: 'Call Ammu after Asr', points: 15, penalty: 5, deadline: '18:00:00', icon: '📞', status: 'active', doneAt: null, createdAt: now - 4e6 },
    { id: 't2', title: 'Pay electricity bill', points: 10, penalty: 5, deadline: '21:00:00', icon: '💡', status: 'active', doneAt: null, createdAt: now - 5e6 },
    { id: 't3', title: "Prepare Jumu'ah khutbah notes", points: 20, penalty: 0, deadline: '23:00:00', icon: '🕌', status: 'active', doneAt: null, createdAt: now - 6e6 },
    { id: 't4', title: 'Donate to the masjid fund', points: 25, penalty: 0, deadline: '23:59:00', icon: '💝', status: 'done', doneAt: now - 2e6, createdAt: now - 9e6 }];
  const notes = [
    { id: 'n1', emoji: '🛒', title: 'Ramadan shopping', text: '', color: 'green', pinned: true, archived: false, tags: ['home'], checklist: [{ id: 'c1', text: 'Dates — 2 kg', done: true }, { id: 'c2', text: 'Chickpeas', done: true }, { id: 'c3', text: 'Rooh Afza', done: false }, { id: 'c4', text: 'Milk & yoghurt', done: false }], media: [], createdAt: now - 3 * day, updatedAt: now - 2e6 },
    { id: 'n2', emoji: '💡', title: 'Khutbah reflection', text: 'Patience (sabr) is not passive waiting — it is staying firm on what is right while you work. "Indeed, Allah is with the patient." (2:153)', color: 'blue', pinned: true, archived: false, tags: ['ilm'], checklist: [], media: [], createdAt: now - 2 * day, updatedAt: now - 7e6 },
    { id: 'n3', emoji: '📚', title: 'Books to read', text: 'Riyad as-Salihin\nThe Sealed Nectar\nPurification of the Heart', color: 'amber', pinned: false, archived: false, tags: ['ilm'], checklist: [], media: [], createdAt: now - 6 * day, updatedAt: now - day },
    { id: 'n4', emoji: '🧮', title: 'Zakat estimate', text: 'Savings 245,000 + gold 60,000 = 305,000\n305000 × 2.5% = 7,625', color: 'teal', pinned: false, archived: false, tags: ['money'], checklist: [], media: [], createdAt: now - 5 * day, updatedAt: now - 3 * day },
    { id: 'n5', emoji: '✈️', title: 'Umrah plan', text: 'Visa docs, vaccination card, ihram ×2, small dua book.', color: 'purple', pinned: false, archived: false, tags: ['travel'], checklist: [], media: [], createdAt: now - 9 * day, updatedAt: now - 4 * day },
    { id: 'n6', emoji: '🌱', title: 'Weekly muhasabah', text: 'Better: Fajr on time 6/7. Improve: less phone after Isha, more Quran.', color: 'rose', pinned: false, archived: false, tags: ['self'], checklist: [], media: [], createdAt: now - day, updatedAt: now - 3e6 }];
  const E = (id, bookId, dir, amount, note, n, party, category) => ({ id, bookId, dir, amount, note, party, category, date: key(D(n)), ts: at(n, 10 + (amount % 7), 0) });
  const hisab = { currency: '৳', books: [
    { id: 'b1', name: 'Shop dues', emoji: '🧾', type: 'dues', createdAt: now - 30 * day },
    { id: 'b2', name: 'Daily cash', emoji: '💵', type: 'cash', createdAt: now - 30 * day },
    { id: 'b3', name: 'Staff salary', emoji: '👥', type: 'payroll', createdAt: now - 30 * day, salaries: { Rahim: 12000, Sumaiya: 15000 } }],
    entries: [
      E('e1', 'b1', 'out', 2400, 'Rice 25 kg', 6, 'Karim Mia'), E('e2', 'b1', 'in', 1000, 'Cash payment', 2, 'Karim Mia'), E('e3', 'b1', 'out', 850, 'Oil & sugar', 3, 'Rashida Begum'),
      E('e4', 'b1', 'out', 1600, 'Monthly groceries', 1, 'Jamal Uddin'), E('e5', 'b1', 'in', 600, 'bKash', 0, 'Jamal Uddin'),
      E('e6', 'b2', 'in', 5200, 'Shop sales', 6, null, '🛍️ Sales'), E('e7', 'b2', 'out', 1200, 'Stock', 5, null, '📦 Stock'), E('e8', 'b2', 'in', 4300, 'Shop sales', 4, null, '🛍️ Sales'),
      E('e9', 'b2', 'out', 350, 'Tea & snacks', 3, null, '☕ Food'), E('e10', 'b2', 'in', 6100, 'Shop sales', 2, null, '🛍️ Sales'), E('e11', 'b2', 'out', 900, 'Rickshaw & transport', 1, null, '🚌 Transport'),
      E('e12', 'b2', 'in', 3800, 'Shop sales', 0, null, '🛍️ Sales'), E('e13', 'b2', 'out', 500, 'Sadaqah', 0, null, '💝 Sadaqah'),
      E('e14', 'b3', 'in', 12000, 'October salary', 5, 'Rahim'), E('e15', 'b3', 'in', 15000, 'October salary', 5, 'Sumaiya'), E('e16', 'b3', 'out', 12000, 'Paid', 1, 'Rahim'), E('e17', 'b3', 'out', 8000, 'Advance', 0, 'Sumaiya')] };
  const zlog = {}; for (let n = 9; n >= 0; n--) zlog[key(D(n))] = { subhanallah: 33 + (n % 3) * 33, alhamdulillah: 33, allahuakbar: 34, istighfar: n % 2 ? 100 : 0 };
  zlog[key(D(0))] = { subhanallah: 66, alhamdulillah: 33, allahuakbar: 34, istighfar: 21 };
  const adone = {}; const ids = ['quls', 'bismillah3', 'sayyid', 'tasbih33', 'kursi', 'eat', 'ate', 'leave', 'sleep', 'wake', 'mulk'];
  for (let n = 9; n >= 0; n--) adone[key(D(n))] = ids.slice(0, 5 + (n % 5));
  const edone = {}; const eids = ['p-fajr', 'p-dhuhr', 'p-asr', 'kursi', 'tasbih', 'morning', 'quran', 'istighfar', 'durood', 'rawatib', 'sadaqah'];
  for (let n = 9; n >= 0; n--) edone[key(D(n))] = eids.slice(0, 6 + (n % 5));
  edone[key(D(0))] = ['p-fajr', 'p-dhuhr', 'p-asr', 'kursi', 'tasbih', 'morning', 'quran'];
  const qlog = {}; for (let n = 9; n >= 0; n--) if (n % 4) qlog[key(D(n))] = { n: 6 + n * 2, seen: [] };
  const kread = {}; for (let n = 6; n >= 0; n--) kread[key(D(n))] = { dua: 2 + n, name: 3, wisdom: 1 + (n % 3) };
  const journal = {}; [0, 1, 2, 4, 5, 8].forEach(n => { journal[key(D(n))] = { text: n === 0 ? 'Alhamdulillah — Fajr in the masjid today, then a quiet page of Quran before work. I lost patience in traffic; tomorrow: breathe, say Bismillah, and remember 94:6.' : 'Fajr on time, morning adhkar done. Read Surah Mulk before sleeping. Need to call Ammu more often.', updatedAt: at(n, 22, 10) }; });
  return { data: { lang: 'en', onboarded: true, habits, todos, ledger, journal, todoPrefs: { points: 10, penalty: 5, deadline: '23:59:00' },
    x: { notes, hisab, zikr: { log: zlog, custom: [], goal: 300, sel: 'subhanallah', vibe: true, sound: false }, amol: { done: adone }, essential: { done: edone, order: [], hidden: [], custom: [] },
      kread, kbm: { dua: ['dua-morning-sayyidul-istighfar'], amol: [], name: ['name-1', 'name-55'], wisdom: [] },
      widgetcfg: { items: ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha', 'sehri', 'iftar', 'tahajjud', 'essential', 'streak'], fields: { start: true, end: true, countdown: true, highlight: true }, size: 'regular', theme: 'dark', lang: '', order: ['prayers', 'essential', 'streak', 'todo', 'zikr', 'reminder'] } } }, qlog };
}

/* ---------- the shots: hook → daily value → depth → trust → Pro ---------- */
// [file, en headline, en sub, bn headline, bn sub, setup(page), opts]
const SHOTS = [
  ['01-home', 'Master your day,<br>mind & soul', 'Prayer strip, live countdown and a 360° Muhasabah overview', 'দিন, মন ও আত্মা —<br>সব এক জায়গায়', 'নামাজের স্ট্রিপ, লাইভ কাউন্টডাউন ও ৩৬০° মুহাসাবা', async p => { await p.evaluate(() => window.scrollTo(0, 0)); }],
  ['02-prayer-times', 'Never miss<br>a prayer', 'Start, end and live countdown for all five prayers', 'আর কোনো নামাজ<br>মিস নয়', 'পাঁচ ওয়াক্তের শুরু, শেষ ও লাইভ কাউন্টডাউন', async p => { await p.evaluate(() => window.MHSPrayerHub.open({ tab: 'times' })); await p.waitForTimeout(900); }],
  ['03-special-times', 'Sehri, Iftar,<br>Tahajjud & more', 'Ishraq, Chasht, Awwabin and forbidden times — all with countdowns', 'সেহরি, ইফতার,<br>তাহাজ্জুদ ও আরও', 'ইশরাক, চাশত, আউয়াবিন ও নিষিদ্ধ সময় — কাউন্টডাউনসহ', async p => { await p.evaluate(() => window.MHSPrayerHub.open({ tab: 'times' })); await p.waitForTimeout(700); await p.evaluate(() => { const s = document.querySelector('#mhs-prayerhub .mhs-ph-special'); if (s) s.scrollIntoView({ block: 'start' }); }); await p.waitForTimeout(300); }],
  ['04-widget', 'Your deen on the<br>home screen', 'Widget Wizard: pick prayers, amol, streaks — add in one tap', 'হোম স্ক্রিনেই<br>আপনার দ্বীন', 'উইজেট উইজার্ড: নামাজ, আমল, ধারা — এক ট্যাপে যোগ', async p => { await p.evaluate(() => window.MHSWidgetWizard.open()); await p.waitForTimeout(500); }, { widget: true }],
  ['05-qibla', 'Find the Qibla<br>anywhere', 'Sensor-based compass with calibration and distance to Makkah', 'যেকোনো জায়গায়<br>কিবলা খুঁজুন', 'সেন্সরভিত্তিক কম্পাস, ক্যালিব্রেশন ও মক্কার দূরত্ব', async p => { await p.evaluate(() => window.MHSPrayerHub.open({ tab: 'qibla' })); await p.waitForTimeout(700); }],
  ['06-mosques', 'Mosques<br>near you', 'Google Maps integration — directions in one tap', 'আপনার কাছের<br>মসজিদ', 'Google Maps সংযুক্ত — এক ট্যাপে দিকনির্দেশ', async p => { await p.evaluate(() => window.MHSPrayerHub.open({ tab: 'mosques' })); await p.waitForTimeout(2500); }],
  ['07-essential-amol', 'The amol that<br>matter most', 'One-tap check-ins with virtue and source, synced to analytics', 'সবচেয়ে প্রয়োজনীয়<br>আমল', 'ফজিলত ও সূত্রসহ এক-ট্যাপ চেক-ইন, অ্যানালিটিক্সে সিঙ্ক', async p => { await p.evaluate(() => window.MHSPrayerHub.open({ tab: 'amol' })); await p.waitForTimeout(700); }],
  ['08-todo', 'A To-Do list that<br>respects your time', 'Deadlines, points and quick add', 'সময়কে সম্মান করে<br>এমন করণীয় তালিকা', 'সময়সীমা, পয়েন্ট ও দ্রুত যোগ', async p => { await p.evaluate(() => window.MHSApp.nav('today')); await p.waitForTimeout(500); await p.evaluate(() => window.scrollTo(0, 0)); }],
  ['09-habits', 'Build Islamic habits<br>that last', 'Fard, Sunnah, Nafl & personal goals with streaks', 'টিকে থাকার মতো<br>ইসলামি অভ্যাস', 'ফরজ, সুন্নত, নফল ও ব্যক্তিগত লক্ষ্য, ধারাসহ', async p => { await p.evaluate(() => window.MHSApp.nav('habits')); await p.waitForTimeout(500); await p.evaluate(() => window.scrollTo(0, 0)); }],
  ['10-analytics', 'See your whole<br>life at a glance', 'Rings, trends and scorecards across every module', 'পুরো জীবন<br>এক নজরে', 'প্রতিটি মডিউলের রিং, ট্রেন্ড ও স্কোরকার্ড', async p => { await p.evaluate(() => window.MHSApp.nav('dashboard')); await p.waitForTimeout(400); await p.locator('mhs-overview').scrollIntoViewIfNeeded(); await p.evaluate(() => window.scrollBy(0, 120)); await p.waitForTimeout(300); }],
  ['11-muhasabah', 'Nafs · Qalb · Ruh', 'An honest spiritual audit — self, heart and soul scores', 'নফস · কলব · রূহ', 'সততার আত্মহিসাব — নিজ, হৃদয় ও আত্মার স্কোর', async p => { await p.evaluate(() => window.MHSApp.nav('dashboard')); await p.waitForTimeout(400); await p.locator('mhs-overview').scrollIntoViewIfNeeded(); await p.evaluate(() => window.scrollBy(0, -60)); await p.waitForTimeout(300); }],
  ['12-journal', 'A journal for<br>every day', 'Autosave with clear “Saved ✓” confirmation and streaks', 'প্রতিদিনের<br>দিনলিপি', 'অটোসেভ, স্পষ্ট “সংরক্ষিত ✓” নিশ্চয়তা ও ধারা', async p => { await p.evaluate(() => window.MHSJournal.open()); await p.waitForTimeout(900); }],
  ['13-notes', 'Notes like Keep,<br>made for you', 'Text, checklists, photos, audio, video — and a calculator', 'Keep-এর মতো নোট,<br>আপনার জন্য', 'লেখা, চেকলিস্ট, ছবি, অডিও, ভিডিও — এবং ক্যালকুলেটর', async p => { await p.evaluate(() => window.MHSNotes.open()); await p.waitForTimeout(700); }],
  ['14-ledger', 'হিসাব খাতা —<br>your pocket ledger', 'Customer dues, daily cash & payroll with running balances', 'হিসাব খাতা —<br>পকেটের লেজার', 'বাকির খাতা, দৈনিক ক্যাশ ও বেতন — চলতি ব্যালেন্সসহ', async p => { await p.evaluate(() => window.MHSHisab.open({ bookId: 'b2' })); await p.waitForTimeout(700); }],
  ['15-quran', 'The Holy Quran,<br>searchable offline', 'All 114 surahs, bookmarks and diacritics-free search', 'পবিত্র কুরআন —<br>অফলাইনে খুঁজুন', '১১৪ সূরা, বুকমার্ক ও হরকতবিহীন খোঁজ', async p => { await p.evaluate(() => window.MHSQuran.open({ surah: 2, ayah: 255 })); await p.waitForTimeout(2500); }],
  ['16-hadith', 'Authentic hadith<br>at your fingertips', 'Bukhari, Muslim and more — with bookmarks and share', 'হাতের মুঠোয়<br>সহিহ হাদিস', 'বুখারী, মুসলিম ও আরও — বুকমার্ক ও শেয়ারসহ', async p => { await p.evaluate(() => window.MHSHadith.open()); await p.waitForTimeout(900); }],
  ['17-wisdom', 'Wisdom of the<br>Prophet ﷺ & scholars', 'Categories, authors, search, bookmarks and your own entries', 'নবী ﷺ ও আলেমদের<br>হিকমাহ', 'বিষয়, বক্তা, খোঁজ, বুকমার্ক ও নিজের লেখা', async p => { await p.evaluate(() => window.MHSWisdomApp.open()); await p.waitForTimeout(1200); }],
  ['18-reminder', 'A reminder for<br>every moment', 'Quran · Hadith · Wisdom — tap to the source, share with one tap', 'প্রতিটি মুহূর্তের<br>স্মরণ', 'কুরআন · হাদিস · হিকমাহ — উৎসে যান, এক ট্যাপে শেয়ার', async p => { await p.evaluate(() => window.MHSReminder.open()); await p.waitForTimeout(1200); }],
  ['19-duas-names', 'Masnun duas &<br>99 Names of Allah', 'Hisnul Muslim style, with meaning, source and bookmarks', 'মাসনুন দোয়া ও<br>আল্লাহর ৯৯ নাম', 'হিসনুল মুসলিম ধাঁচে — অর্থ, সূত্র ও বুকমার্কসহ', async p => { await p.evaluate(() => window.MHSKnowledge.open({ tab: 'names' })); await p.waitForTimeout(1200); }],
  ['20-zikr', 'A tasbih that<br>feels real', 'Vibration, targets, rounds and history', 'সত্যিকারের অনুভূতির<br>তাসবিহ', 'কম্পন, লক্ষ্য, রাউন্ড ও ইতিহাস', async p => { await p.evaluate(() => window.MHSZikr.open({ zikr: 'subhanallah' })); await p.waitForTimeout(400); const z = p.locator('#mhs-zikr .mhs-zk-tap'); for (let i = 0; i < 23; i++) await z.click({ delay: 5 }); await p.waitForTimeout(600); }],
  ['21-pro', 'Free forever.<br>Pro when you’re ready', 'Google Drive sync, cloud backup and the golden crest', 'চিরকাল ফ্রি।<br>প্রস্তুত হলে প্রো', 'Google Drive সিঙ্ক, ক্লাউড ব্যাকআপ ও গোল্ডেন ক্রেস্ট', async p => { await p.evaluate(() => window.MHSApp.nav('settings')); await p.waitForTimeout(600); await p.locator('mhs-plans').scrollIntoViewIfNeeded(); await p.evaluate(() => window.scrollBy(0, -80)); await p.waitForTimeout(300); }]
];
const PLAY_PICK = ['01-home', '02-prayer-times', '03-special-times', '07-essential-amol', '15-quran', '19-duas-names', '10-analytics', '04-widget'];
const WIDE_PICK = ['01-home', '02-prayer-times', '07-essential-amol', '10-analytics', '13-notes', '14-ledger', '15-quran', '19-duas-names'];
const HUES = [['#00e676', '#00b8d4'], ['#ffd54f', '#00e676'], ['#7c4dff', '#00b8d4'], ['#00b8d4', '#00e676'], ['#ff4081', '#7c4dff'], ['#ffd54f', '#ff8f00']];

/* ---------- compose ---------- */
async function compose(browser, png, { headline, sub, wide, idx, lang }) {
  const W = wide ? 1920 : 1080, H = wide ? 1080 : 1920;
  const pg = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
  const img = 'data:image/png;base64,' + png.toString('base64');
  const hues = HUES[idx % HUES.length];
  const pill = lang === 'bn' ? 'ফ্রি · অফলাইন · ব্যক্তিগত · সবার জন্য' : 'Free · Offline · Private · Rated Everyone';
  const device = wide ? `<div class="lap"><div class="scr"><img src="${img}"></div></div>` : `<div class="ph"><div class="scr"><img src="${img}"></div></div>`;
  await pg.setContent(`<!doctype html><html lang="${lang}"><head><link href="${FONTS}" rel="stylesheet"><style>
  *{margin:0;box-sizing:border-box}body{width:${W}px;height:${H}px;overflow:hidden;background:#06080d;color:#eef6f1;font-family:Inter,"Noto Sans Bengali",sans-serif,"Noto Color Emoji";position:relative}
  .bg{position:absolute;inset:0;background:radial-gradient(60% 40% at 85% 8%,${hues[0]}3d,transparent 70%),radial-gradient(55% 35% at 10% 92%,${hues[1]}33,transparent 70%),linear-gradient(180deg,#0a0d14,#06080d)}
  .grid{position:absolute;inset:0;background-image:linear-gradient(#ffffff08 1px,transparent 1px),linear-gradient(90deg,#ffffff08 1px,transparent 1px);background-size:60px 60px;-webkit-mask:linear-gradient(180deg,#000,transparent 60%);mask:linear-gradient(180deg,#000,transparent 60%)}
  .orb{position:absolute;border-radius:50%;filter:blur(70px);opacity:.5}
  .brand{position:absolute;${wide ? 'left:110px;top:110px' : 'left:0;right:0;top:84px;justify-content:center'};display:flex;align-items:center;gap:14px;font:600 26px Sora,"Noto Sans Bengali",sans-serif;letter-spacing:.02em;color:#cfe9da}
  .brand img{width:44px;height:44px;filter:drop-shadow(0 0 12px ${hues[0]}aa)}
  h1{position:absolute;${wide ? 'left:110px;top:210px;width:720px;text-align:left;font-size:74px' : 'left:56px;right:56px;top:160px;text-align:center;font-size:' + (lang === 'bn' ? '66px' : '74px')};font-family:Sora,"Noto Sans Bengali",sans-serif;font-weight:700;line-height:1.12;letter-spacing:-.02em;text-wrap:balance}
  h1 em{font-style:normal;background:linear-gradient(90deg,${hues[0]},${hues[1]});-webkit-background-clip:text;background-clip:text;color:transparent}
  p.sub{position:absolute;${wide ? 'left:110px;top:520px;width:640px;text-align:left' : 'left:80px;right:80px;top:' + (lang === 'bn' ? '352px' : '356px') + ';text-align:center'};font-size:${lang === 'bn' ? '29px' : '31px'};line-height:1.4;color:#9fb3a6;text-wrap:balance}
  .ph{position:absolute;left:50%;top:470px;width:664px;height:1404px;transform:translateX(-50%);border-radius:92px;padding:22px;background:linear-gradient(145deg,#2a3140,#0d1017 40%,#1b212c);box-shadow:0 60px 120px #000c,0 0 0 2px #ffffff14 inset,0 0 90px ${hues[0]}22}
  .ph .scr{width:100%;height:100%;border-radius:72px;overflow:hidden;background:#0a0d14}
  .ph img{width:100%;display:block}
  .isl{position:absolute;top:40px;left:50%;width:150px;height:40px;margin-left:-75px;border-radius:30px;background:#000;z-index:2}
  .lap{position:absolute;right:90px;top:188px;width:1000px;height:704px;border-radius:34px;padding:16px;background:linear-gradient(145deg,#2a3140,#0d1017 40%,#1b212c);box-shadow:0 50px 110px #000c,0 0 0 2px #ffffff14 inset,0 0 90px ${hues[0]}22}
  .lap .scr{width:100%;height:100%;border-radius:22px;overflow:hidden;background:#0a0d14}.lap img{width:100%;display:block}
  .pill{position:absolute;${wide ? 'left:110px;bottom:110px' : 'left:0;right:0;bottom:22px;text-align:center'};font:500 22px Inter,"Noto Sans Bengali",sans-serif;color:#6f857a}
  </style></head><body><div class="bg"></div><div class="grid"></div>
  <div class="orb" style="width:520px;height:520px;background:${hues[0]};left:${wide ? '60%' : '-20%'};top:${wide ? '-20%' : '30%'}"></div>
  <div class="brand"><img src="${BASE}/icons/logo.webp">Muhasabah-Pro</div>
  <h1>${headline.replace(/<br>(.*)$/, '<br><em>$1</em>')}</h1><p class="sub">${sub}</p>${device}
  <div class="pill">${pill}</div></body></html>`, { waitUntil: 'networkidle' });
  await loadFonts(pg);
  const shot = await pg.screenshot({ type: 'png' });
  const webp = await toWebp(pg, shot, 0.86);
  await pg.close();
  return webp;
}
async function toWebp(pg, png, q) {
  const b64 = await pg.evaluate(async ([b, q]) => {
    const im = new Image(); im.src = 'data:image/png;base64,' + b; await im.decode();
    const c = document.createElement('canvas'); c.width = im.width; c.height = im.height; c.getContext('2d').drawImage(im, 0, 0);
    return c.toDataURL('image/webp', q).split(',')[1];
  }, [png.toString('base64'), q]);
  return Buffer.from(b64, 'base64');
}

/* ---------- feature graphic + icon ---------- */
async function featureGraphic(browser, lang) {
  const pg = await browser.newPage({ viewport: { width: 1024, height: 500 }, deviceScaleFactor: 1 });
  const h = lang === 'bn' ? 'দিন, মন ও আত্মা — <em>এক অ্যাপে</em>' : 'Master your day, mind & <em>soul</em>';
  const s = lang === 'bn' ? 'নামাজের সময় · কুরআন · হাদিস · দোয়া · আমল · অভ্যাস · উইজেট — ফ্রি, অফলাইন, ব্যক্তিগত' : 'Prayer times · Quran · Hadith · Duas · Amol · Habits · Widgets — free, offline, private';
  await pg.setContent(`<!doctype html><html><head><link href="${FONTS}" rel="stylesheet"><style>*{margin:0;box-sizing:border-box}body{width:1024px;height:500px;overflow:hidden;position:relative;background:radial-gradient(60% 60% at 85% 20%,#00e67640,transparent 70%),radial-gradient(50% 50% at 10% 90%,#00b8d438,transparent 70%),linear-gradient(180deg,#0a0d14,#06080d);color:#eef6f1;font-family:Inter,"Noto Sans Bengali",sans-serif}
  .grid{position:absolute;inset:0;background-image:linear-gradient(#ffffff08 1px,transparent 1px),linear-gradient(90deg,#ffffff08 1px,transparent 1px);background-size:50px 50px;-webkit-mask:linear-gradient(90deg,#000,transparent 80%);mask:linear-gradient(90deg,#000,transparent 80%)}
  .logo{position:absolute;left:70px;top:72px;display:flex;align-items:center;gap:16px;font:600 24px Sora,sans-serif;color:#cfe9da}.logo img{width:56px;height:56px;filter:drop-shadow(0 0 16px #00e676aa)}
  h1{position:absolute;left:70px;top:160px;width:600px;font:700 ${lang === 'bn' ? '46px' : '52px'}/1.15 Sora,"Noto Sans Bengali",sans-serif;letter-spacing:-.02em}h1 em{font-style:normal;background:linear-gradient(90deg,#00e676,#00b8d4);-webkit-background-clip:text;background-clip:text;color:transparent}
  p{position:absolute;left:70px;top:${lang === 'bn' ? '300px' : '300px'};width:560px;font-size:${lang === 'bn' ? '19px' : '21px'};line-height:1.45;color:#9fb3a6}
  .badge{position:absolute;left:70px;bottom:52px;display:flex;gap:10px}.badge span{padding:8px 16px;border-radius:999px;border:1px solid #00e67655;background:#00e67612;color:#8ff3c0;font-size:14px;font-weight:600}
  .ring{position:absolute;right:120px;top:50%;width:300px;height:300px;margin-top:-150px;border-radius:50%;background:conic-gradient(#00e676 0 72%,#ffffff12 72% 100%);-webkit-mask:radial-gradient(farthest-side,transparent calc(100% - 26px),#000 calc(100% - 25px));mask:radial-gradient(farthest-side,transparent calc(100% - 26px),#000 calc(100% - 25px));filter:drop-shadow(0 0 30px #00e67666)}
  .ring2{right:150px;width:240px;height:240px;margin-top:-120px;background:conic-gradient(#00b8d4 0 58%,#ffffff12 58% 100%)}.ring3{right:180px;width:180px;height:180px;margin-top:-90px;background:conic-gradient(#ffd54f 0 86%,#ffffff12 86% 100%)}
  .mid{position:absolute;right:230px;top:50%;transform:translateY(-50%);width:80px;text-align:center;font:700 40px Sora,sans-serif;color:#eef6f1}</style></head><body><div class="grid"></div>
  <div class="logo"><img src="${BASE}/icons/logo.webp">Muhasabah-Pro</div><h1>${h}</h1><p>${s}</p>
  <div class="badge"><span>🕌 ${lang === 'bn' ? 'নামাজ' : 'Prayer'}</span><span>📖 ${lang === 'bn' ? 'কুরআন' : 'Quran'}</span><span>🤲 ${lang === 'bn' ? 'দোয়া' : 'Duas'}</span><span>🔥 ${lang === 'bn' ? 'অভ্যাস' : 'Habits'}</span></div>
  <div class="ring"></div><div class="ring ring2"></div><div class="ring ring3"></div><div class="mid">72</div></body></html>`, { waitUntil: 'networkidle' });
  await loadFonts(pg);
  const png = await pg.screenshot({ type: 'png' }); await pg.close(); return png;
}
async function icon512(browser) {
  const pg = await browser.newPage({ viewport: { width: 512, height: 512 }, deviceScaleFactor: 1 });
  await pg.setContent(`<!doctype html><html><body style="margin:0;width:512px;height:512px;display:grid;place-items:center;background:radial-gradient(80% 80% at 30% 20%,#13261c,#0a0d14)"><img src="${BASE}/icons/icon-512.png" style="width:512px;height:512px;display:block"></body></html>`, { waitUntil: 'networkidle' });
  const png = await pg.screenshot({ type: 'png' }); await pg.close(); return png;
}

/* ---------- main ---------- */
(async () => {
  const browser = await chromium.launch();
  const { data, qlog } = demo(NOW);
  if (!ONLY) { // full run: start from a clean folder so no stale graphics linger
    for (const f of fs.readdirSync(OUT)) { const fp = path.join(OUT, f); if (fs.statSync(fp).isFile()) fs.unlinkSync(fp); }
    for (const f of fs.readdirSync(path.join(OUT, 'play'))) fs.unlinkSync(path.join(OUT, 'play', f));
  }

  async function app(viewport, scale, lang) {
    const ctx = await browser.newContext({ viewport, deviceScaleFactor: scale, serviceWorkers: 'block', timezoneId: 'Asia/Dhaka', locale: lang === 'bn' ? 'bn-BD' : 'en-US', geolocation: { latitude: 23.8103, longitude: 90.4125 }, permissions: ['geolocation'] });
    await ctx.clock.setFixedTime(NOW);
    await ctx.route('**/api/**', r => r.fulfill({ status: 503, json: { error: 'off' } }));
    await ctx.route('**/.netlify/functions/**', r => r.fulfill({ json: null }));
    await ctx.addInitScript(([d, q, lang]) => {
      if (sessionStorage.getItem('seeded')) return; sessionStorage.setItem('seeded', '1');
      d.lang = lang;
      localStorage.setItem('muhasabah:data:v1', JSON.stringify(d)); localStorage.setItem('muhasabah:savedAt', String(Date.now()));
      localStorage.setItem('mhs:x:quranlog', JSON.stringify(q));
      localStorage.setItem('mhs:ftue:v1', JSON.stringify({ intro: 1, tour: 1, tips: {} }));
      localStorage.setItem('muhasabah:install-dismissed', String(Date.now() + 1e10));
      localStorage.setItem('muhasabah:prayer', JSON.stringify({ on: true, lat: 23.8103, lng: 90.4125, place: 'Dhaka', src: 'gps', method: 'karachi', asr: 'hanafi', links: {} }));
      localStorage.setItem('mhs:quran:marks', JSON.stringify([{ s: 2, a: 255, at: Date.now() }, { s: 18, a: 10, at: Date.now() }, { s: 94, a: 6, at: Date.now() }]));
      localStorage.setItem('mhs:hadith:marks', JSON.stringify([{ b: 'bukhari', n: 1, title: 'Actions are by intentions', at: Date.now() }]));
      localStorage.setItem('mhs:wisdom:favs', JSON.stringify(['v94:6', 'hbukhari:1']));
      localStorage.setItem('mhs:engage:v1', JSON.stringify({ days: [], never: true }));
      localStorage.setItem('mhs:widgetcfg', JSON.stringify(d.x.widgetcfg));
      localStorage.setItem('mhs:defaults:v1', JSON.stringify({ at: Date.now(), lang: lang, theme: 'dark', themeChosen: true }));
    }, [data, qlog, lang]);
    const p = await ctx.newPage();
    await p.goto(BASE + '/?tab=dashboard'); await p.locator('#mhs-startup').waitFor({ state: 'detached' }); await p.waitForTimeout(1800);
    await p.addStyleTag({ content: EMOJI_CSS }); await loadFonts(p);
    return { ctx, p };
  }
  async function reset(p) {
    await p.evaluate(() => { document.querySelectorAll('dialog[open]').forEach(d => { try { d.close(); } catch (e) {} }); window.MHSApp.nav('dashboard'); window.scrollTo(0, 0); });
    await p.waitForTimeout(350);
  }
  async function widgetShot(ctx, lang, scale, viewport) {
    const w = await ctx.newPage(); await w.setViewportSize(viewport);
    await w.goto(BASE + '/widgets/?view=custom&source=shot'); await w.waitForTimeout(1500);
    await w.addStyleTag({ content: EMOJI_CSS + ' .wg-foot:last-child{display:none}' }); await loadFonts(w);
    const png = await w.screenshot({ type: 'png', clip: { x: 0, y: 0, width: viewport.width, height: viewport.height } }); await w.close(); return png;
  }

  const manifest = [];
  for (const lang of LANGS) {
    // ---- narrow (phone) ----
    const { ctx, p } = await app({ width: 390, height: 844 }, 3, lang);
    let idx = 0;
    for (const [file, enH, enS, bnH, bnS, setup, opts] of SHOTS) {
      if (ONLY && !ONLY.some(o => file.startsWith(o))) { idx++; continue; }
      await reset(p);
      let png;
      if (opts && opts.widget) png = await widgetShot(ctx, lang, 3, { width: 390, height: 844 });
      else { try { await setup(p); } catch (e) { console.log('setup', file, e.message.split('\n')[0]); } await p.waitForTimeout(250); png = await p.screenshot({ type: 'png' }); }
      const headline = lang === 'bn' ? bnH : enH, sub = lang === 'bn' ? bnS : enS;
      const out = await compose(browser, png, { headline, sub, wide: false, idx, lang });
      const name = `${file}${lang === 'en' ? '' : '.' + lang}.webp`;
      fs.writeFileSync(path.join(OUT, name), out);
      if (PLAY_PICK.includes(file)) fs.writeFileSync(path.join(OUT, 'play', `phone-${String(PLAY_PICK.indexOf(file) + 1).padStart(2, '0')}-${file}${lang === 'en' ? '' : '.' + lang}.webp`), out);
      manifest.push({ src: `/assets/screenshots/${name}`, sizes: '1080x1920', type: 'image/webp', form_factor: 'narrow', platform: lang === 'bn' ? undefined : undefined, label: strip(headline) + ' — ' + strip(sub), lang });
      console.log('✓', name, (out.length / 1024 | 0) + ' KB');
      idx++;
    }
    await ctx.close();
    // ---- wide (desktop / tablet) ----
    const d = await app({ width: 1280, height: 800 }, 1.5, lang);
    idx = 0;
    for (const [file, enH, enS, bnH, bnS, setup, opts] of SHOTS) {
      if (!WIDE_PICK.includes(file) || (ONLY && !ONLY.some(o => file.startsWith(o)))) { idx++; continue; }
      await reset(d.p);
      let png;
      if (opts && opts.widget) png = await widgetShot(d.ctx, lang, 1.5, { width: 1280, height: 800 });
      else { try { await setup(d.p); } catch (e) { console.log('setup', file, e.message.split('\n')[0]); } await d.p.waitForTimeout(250); png = await d.p.screenshot({ type: 'png' }); }
      const headline = lang === 'bn' ? bnH : enH, sub = lang === 'bn' ? bnS : enS;
      const out = await compose(browser, png, { headline: headline.replace('<br>', ' '), sub, wide: true, idx, lang });
      const name = `w-${file}${lang === 'en' ? '' : '.' + lang}.webp`;
      fs.writeFileSync(path.join(OUT, name), out);
      if (lang === 'en') fs.writeFileSync(path.join(OUT, 'play', `tablet-${String(WIDE_PICK.indexOf(file) + 1).padStart(2, '0')}-${file}.webp`), out);
      manifest.push({ src: `/assets/screenshots/${name}`, sizes: '1920x1080', type: 'image/webp', form_factor: 'wide', label: strip(headline) + ' — ' + strip(sub), lang });
      console.log('✓', name, (out.length / 1024 | 0) + ' KB');
      idx++;
    }
    await d.ctx.close();
    fs.writeFileSync(path.join(OUT, `feature-graphic${lang === 'en' ? '' : '.' + lang}.png`), await featureGraphic(browser, lang));
  }
  fs.writeFileSync(path.join(OUT, 'icon-512.png'), await icon512(browser));
  // captions file (EN + BN) for store listings
  fs.writeFileSync(path.join(OUT, 'captions.json'), JSON.stringify(SHOTS.map(([file, enH, enS, bnH, bnS]) => ({ file, en: { headline: strip(enH), sub: enS }, bn: { headline: strip(bnH), sub: bnS } })), null, 2));
  // manifest
  if (!ONLY) {
    const mp = path.join(ROOT, 'manifest.webmanifest');
    const m = JSON.parse(fs.readFileSync(mp, 'utf8'));
    m.screenshots = manifest.filter(x => x.lang === 'en').concat(manifest.filter(x => x.lang !== 'en')).map(x => { const o = { src: x.src, sizes: x.sizes, type: x.type, form_factor: x.form_factor, label: x.label }; if (x.lang !== 'en') o.platform = undefined; return o; });
    if (m.widgets && m.widgets[0]) m.widgets[0].screenshots = [{ src: '/assets/screenshots/04-widget.webp', sizes: '1080x1920', label: 'Configurable home-screen widget with prayer countdowns and amol check-ins' }];
    fs.writeFileSync(mp, JSON.stringify(m, null, 2) + '\n');
    console.log('manifest: ' + m.screenshots.length + ' screenshots');
  }
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });

/* Google's Noto Color Emoji is split into unicode-range subsets that load lazily; force the glyphs we use. */
const EMOJI_SAMPLE = '🕌🌅🕛🌇🌆🌃🔁🔹🛡️📿🌄🌙🤲💚📖✨☀️🛏️🌌🕋🌕💝⭐🧭🕐🍽️🕯️🌤️⛔🔔💡📚🗒️💰☑️✍️🔖🔥📞📵🚶🧾💵👥🛒🧮✈️🌱🔍↗♥♡📋🎲🗑⚙︎📲🔊⬇🤲';
async function loadFonts(page) {
  await page.evaluate(async (sample) => {
    try { await Promise.all([document.fonts.load('16px "Noto Color Emoji"', sample), document.fonts.load('16px "Noto Sans Bengali"', 'নামাজ'), document.fonts.load('600 16px "Noto Sans Bengali"', 'নামাজ'), document.fonts.load('16px Amiri', 'بِسْمِ'), document.fonts.load('16px Sora', 'A'), document.fonts.load('16px Inter', 'A')]); } catch (e) {}
    await document.fonts.ready;
  }, EMOJI_SAMPLE);
  await page.waitForTimeout(500);
}

function strip(s) { return String(s).replace(/<br>/g, ' ').replace(/&amp;/g, '&').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim(); }
