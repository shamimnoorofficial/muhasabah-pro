/* Promotional screenshot generator (developer tool — not part of the build).
 *   1. serve the repo on :8889 (e.g. `netlify dev --port 8889` or any static server)
 *   2. node scripts/promo-screenshots.cjs
 * Seeds realistic demo data, captures real app screens with Playwright and composes them into
 * framed store graphics (1080×1920 narrow, 1920×1080 wide) as WebP in /screenshots/promo/.
 * Also writes the manifest `screenshots` array. */
const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');
const BASE = process.env.BASE || 'http://localhost:8889';
const OUT = path.join(__dirname, '..', 'screenshots', 'promo');
fs.mkdirSync(OUT, { recursive: true });

function demo(now) {
  const day = 864e5, D = n => new Date(now - n * day);
  const key = d => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  const at = (n, h, m) => { const d = D(n); d.setHours(h, m || 0, 0, 0); return d.getTime(); };
  const H = (id, title, icon, cat, pts, dl) => ({ id, title, icon, category: cat, points: pts, deadline: dl || '23:59:00', repeat: ['Everyday'], status: 'active', createdAt: now - 40 * day, grace: 0, autoPenalty: true, color: '#00C853' });
  const habits = [H('h1', 'Fajr in congregation', '🌅', 'Fard', 30, '23:59:00'), H('h2', 'Quran — 1 page', '📖', 'Sunnah', 20), H('h3', 'Morning adhkar', '🤲', 'Sunnah', 15), H('h4', 'No social media after Isha', '📵', 'Personal', 25), H('h5', '20 min walk', '🚶', 'Personal', 10), H('h6', 'Tahajjud', '🌙', 'Nafl', 40)];
  const ledger = [];
  for (let n = 20; n >= 1; n--) habits.forEach((h, i) => { if ((n * 7 + i * 3) % 5 !== 0) ledger.push({ id: 'l' + n + h.id, ts: at(n, 5 + i * 2, 10), delta: h.points, reason: h.title, note: 'Exact • On-time', type: 'checkIn', habitId: h.id }); });
  ['h1', 'h2', 'h3'].forEach((id, i) => { const h = habits.find(x => x.id === id); ledger.push({ id: 'lt' + id, ts: now - (3 - i) * 36e5, delta: h.points, reason: h.title, note: 'Exact • On-time', type: 'checkIn', habitId: id }); });
  ledger.push({ id: 'lp1', ts: at(4, 23, 59), delta: -10, reason: '20 min walk', note: 'Missed', type: 'autoPenalty', habitId: 'h5' });
  ledger.sort((a, b) => b.ts - a.ts);
  const todos = [
    { id: 't1', title: 'Call Ammu after Asr', points: 15, penalty: 5, deadline: '18:00:00', icon: '📞', status: 'active', doneAt: null, createdAt: now - 4e6 },
    { id: 't2', title: 'Pay electricity bill', points: 10, penalty: 5, deadline: '21:00:00', icon: '💡', status: 'active', doneAt: null, createdAt: now - 5e6 },
    { id: 't3', title: 'Prepare Jumu\'ah khutbah notes', points: 20, penalty: 0, deadline: '23:00:00', icon: '🕌', status: 'active', doneAt: null, createdAt: now - 6e6 },
    { id: 't4', title: 'Donate to the masjid fund', points: 25, penalty: 0, deadline: '23:59:00', icon: '💝', status: 'done', doneAt: now - 2e6, createdAt: now - 9e6 }];
  const notes = [
    { id: 'n1', emoji: '🛒', title: 'Ramadan shopping', text: '', color: 'green', pinned: true, archived: false, tags: ['home'], checklist: [{ id: 'c1', text: 'Dates — 2 kg', done: true }, { id: 'c2', text: 'Chickpeas', done: true }, { id: 'c3', text: 'Rooh Afza', done: false }, { id: 'c4', text: 'Milk & yoghurt', done: false }], media: [], createdAt: now - 3 * day, updatedAt: now - 2e6 },
    { id: 'n2', emoji: '💡', title: 'Khutbah reflection', text: 'Patience (sabr) is not passive waiting — it is staying firm on what is right while you work. "Indeed, Allah is with the patient." (2:153)', color: 'blue', pinned: true, archived: false, tags: ['ilm'], checklist: [], media: [], createdAt: now - 2 * day, updatedAt: now - 7e6 },
    { id: 'n3', emoji: '📚', title: 'Books to read', text: 'Riyad as-Salihin\nThe Sealed Nectar\nPurification of the Heart', color: 'amber', pinned: false, archived: false, tags: ['ilm'], checklist: [], media: [], createdAt: now - 6 * day, updatedAt: now - day },
    { id: 'n4', emoji: '🧮', title: 'Zakat estimate', text: 'Savings 245,000 + gold 60,000 = 305,000\n305000 × 2.5% = 7,625', color: 'teal', pinned: false, archived: false, tags: ['money'], checklist: [], media: [], createdAt: now - 5 * day, updatedAt: now - 3 * day },
    { id: 'n5', emoji: '✈️', title: 'Umrah plan', text: 'Visa docs, vaccination card, ihram ×2, small dua book.', color: 'purple', pinned: false, archived: false, tags: ['travel'], checklist: [], media: [], createdAt: now - 9 * day, updatedAt: now - 4 * day },
    { id: 'n6', emoji: '🌱', title: 'Weekly muhasabah', text: 'Better: Fajr on time 6/7. Improve: less phone after Isha, more Quran.', color: 'rose', pinned: false, archived: false, tags: ['self'], checklist: [], media: [], createdAt: now - day, updatedAt: now - 3e6 }];
  const k0 = key(D(0));
  const E = (id, bookId, dir, amount, note, n, party, category) => ({ id, bookId, dir, amount, note, party, category, date: key(D(n)), ts: at(n, 10 + (amount % 7), 0) });
  const hisab = { currency: '৳', books: [
    { id: 'b1', name: 'Shop dues', emoji: '🧾', type: 'dues', createdAt: now - 30 * day },
    { id: 'b2', name: 'Daily cash', emoji: '💵', type: 'cash', createdAt: now - 30 * day },
    { id: 'b3', name: 'Staff salary', emoji: '👥', type: 'payroll', createdAt: now - 30 * day, salaries: { 'Rahim': 12000, 'Sumaiya': 15000 } }],
    entries: [
      E('e1', 'b1', 'out', 2400, 'Rice 25 kg', 6, 'Karim Mia'), E('e2', 'b1', 'in', 1000, 'Cash payment', 2, 'Karim Mia'), E('e3', 'b1', 'out', 850, 'Oil & sugar', 3, 'Rashida Begum'),
      E('e4', 'b1', 'out', 1600, 'Monthly groceries', 1, 'Jamal Uddin'), E('e5', 'b1', 'in', 600, 'bKash', 0, 'Jamal Uddin'),
      E('e6', 'b2', 'in', 5200, 'Shop sales', 6, null, '🛍️ Sales'), E('e7', 'b2', 'out', 1200, 'Stock', 5, null, '📦 Stock'), E('e8', 'b2', 'in', 4300, 'Shop sales', 4, null, '🛍️ Sales'),
      E('e9', 'b2', 'out', 350, 'Tea & snacks', 3, null, '☕ Food'), E('e10', 'b2', 'in', 6100, 'Shop sales', 2, null, '🛍️ Sales'), E('e11', 'b2', 'out', 900, 'Rickshaw & transport', 1, null, '🚌 Transport'),
      E('e12', 'b2', 'in', 3800, 'Shop sales', 0, null, '🛍️ Sales'), E('e13', 'b2', 'out', 500, 'Sadaqah', 0, null, '💝 Sadaqah'),
      E('e14', 'b3', 'in', 12000, 'October salary', 5, 'Rahim'), E('e15', 'b3', 'in', 15000, 'October salary', 5, 'Sumaiya'), E('e16', 'b3', 'out', 12000, 'Paid', 1, 'Rahim'), E('e17', 'b3', 'out', 8000, 'Advance', 0, 'Sumaiya')] };
  const zlog = {}; for (let n = 9; n >= 0; n--) zlog[key(D(n))] = { subhanallah: 33 + (n % 3) * 33, alhamdulillah: 33, allahuakbar: 34, istighfar: n % 2 ? 100 : 0 };
  zlog[k0] = { subhanallah: 66, alhamdulillah: 33, allahuakbar: 34, istighfar: 21 };
  const adone = {}; const ids = ['quls', 'bismillah3', 'sayyid', 'tasbih33', 'kursi', 'eat', 'ate', 'leave', 'sleep', 'wake', 'mulk'];
  for (let n = 9; n >= 0; n--) adone[key(D(n))] = ids.slice(0, 5 + (n % 5));
  const qlog = {}; for (let n = 9; n >= 0; n--) if (n % 4) qlog[key(D(n))] = { n: 6 + n * 2, seen: [] };
  return { data: { lang: 'en', onboarded: true, habits, todos, ledger, todoPrefs: { points: 10, penalty: 5, deadline: '23:59:00' },
    x: { notes, hisab, zikr: { log: zlog, custom: [], goal: 300, sel: 'subhanallah', vibe: true, sound: false }, amol: { done: adone } } }, qlog };
}

const SHOTS = [
  // [file, headline, sub, setup]
  ['01-home-overview', 'Your whole life,<br>one honest audit', 'Nafs · Qalb · Ruh scorecard and the Muhasabah Index', async p => { await p.locator('mhs-overview').scrollIntoViewIfNeeded(); await p.evaluate(() => window.scrollBy(0, -70)); }],
  ['02-home-checklist', 'Tick habits &amp; to-dos<br>right from Home', 'Circular check-ins that update instantly', async p => { await p.locator('[data-tour="home-check"]').scrollIntoViewIfNeeded(); await p.evaluate(() => window.scrollBy(0, -90)); }],
  ['03-home-dashboard', 'Points, streaks<br>&amp; progress', 'Make habit, get reward', async p => { await p.evaluate(() => window.scrollTo(0, 0)); }],
  ['04-todo', 'A To Do list that<br>respects your time', 'Deadlines, points and quick add', async p => { await p.evaluate(() => window.MHSApp.nav('today')); await p.waitForTimeout(500); await p.evaluate(() => window.scrollTo(0, 0)); }],
  ['05-habits', 'Build Islamic habits<br>that last', 'Fard, Sunnah, Nafl & personal goals', async p => { await p.evaluate(() => window.MHSApp.nav('habits')); await p.waitForTimeout(500); await p.evaluate(() => window.scrollTo(0, 0)); }],
  ['06-quick-menu', 'Everything is<br>one tap away', '10 integrated mini-apps behind a single +', async p => { await p.evaluate(() => { window.MHSApp.nav('dashboard'); window.scrollTo(0, 0); }); await p.waitForTimeout(300); await p.locator('#mhs-fab').click(); await p.waitForTimeout(600); }],
  ['07-notes', 'Notes like Keep,<br>made for you', 'Text, checklists, photos, audio & video', async p => { await p.evaluate(() => window.MHSNotes.open()); await p.waitForTimeout(600); }],
  ['08-notes-calculator', 'A calculator<br>inside every note', 'Work out zakat or bills without leaving', async p => { await p.evaluate(() => window.MHSNotes.open({ id: 'n4' })); await p.waitForTimeout(500); await p.evaluate(() => window.MHSCalc.open({ host: document.querySelector('dialog[open]'), value: '305000×2.5%', onUse: () => {} })); await p.waitForTimeout(400); }],
  ['09-hisab', 'হিসাব খাতা —<br>your pocket ledger', 'Customer dues, daily cash & payroll', async p => { await p.evaluate(() => window.MHSHisab.open()); await p.waitForTimeout(600); }],
  ['10-hisab-sheet', 'Spreadsheet clarity,<br>zero setup', 'Running balance for every entry', async p => { await p.evaluate(() => window.MHSHisab.open({ bookId: 'b2' })); await p.waitForTimeout(500); const s = p.locator('#mhs-hisab').getByRole('tab', { name: /sheet/i }); if (await s.count()) { await s.first().click(); await p.waitForTimeout(400); } }],
  ['11-hisab-dues', 'Know who owes you —<br>and remind kindly', 'Share a polite reminder in one tap', async p => { await p.evaluate(() => window.MHSHisab.open({ bookId: 'b1' })); await p.waitForTimeout(600); }],
  ['12-zikr', 'A tasbih that<br>feels real', 'Vibration, targets, rounds and history', async p => { await p.evaluate(() => window.MHSZikr.open({ zikr: 'subhanallah' })); await p.waitForTimeout(400); const z = p.locator('#mhs-zikr .mhs-zk-tap'); for (let i = 0; i < 23; i++) await z.click({ delay: 5 }); await p.waitForTimeout(700); }],
  ['13-amol', 'Daily amol with<br>authentic sources', 'Morning, evening, after salah & before sleep', async p => { await p.evaluate(() => window.MHSAmol.open({ tab: 'amol' })); await p.waitForTimeout(600); }],
  ['14-namaz', 'Learn namaz<br>step by step', 'Wudu, every position and its words', async p => { await p.evaluate(() => window.MHSAmol.open({ tab: 'namaz' })); await p.waitForTimeout(400); await p.evaluate(() => { const d = document.querySelector('#mhs-amol details:nth-of-type(1)'); if (d) d.open = false; }); await p.waitForTimeout(200); }],
  ['15-masail', 'Everyday masail,<br>clearly answered', 'Wudu, travel, qada, fasting, zakat & more', async p => { await p.evaluate(() => window.MHSAmol.open({ tab: 'masail' })); await p.waitForTimeout(500); }],
  ['16-quran', 'The Holy Quran,<br>built in', 'All 114 surahs with translation', async p => { await p.evaluate(() => window.MHSQuran.open()); await p.waitForTimeout(700); }],
  ['17-hadith', 'Authentic hadith<br>at your fingertips', 'Bukhari, Muslim and more', async p => { await p.evaluate(() => window.MHSHadith.open()); await p.waitForTimeout(800); }],
  ['18-wisdom', 'A reminder for<br>every moment', 'Verses, hadith & sayings — share or save', async p => { await p.evaluate(() => window.MHSWisdom.open()); await p.waitForTimeout(800); }],
  ['19-prayer', 'Prayer times<br>&amp; Qibla compass', 'Plus nearby mosques on the map', async p => { await p.evaluate(() => window.MHSQibla.open()); await p.waitForTimeout(1200); }],
  ['20-widget', 'Check in without<br>opening the app', 'Home-screen widget with live sync', async (p, ctx) => null],
  ['21-plans', 'Free forever.<br>Pro when you\'re ready', 'Lifetime Drive sync or Cloud server sync', async p => { await p.evaluate(() => window.MHSApp.nav('settings')); await p.waitForTimeout(600); await p.locator('mhs-plans').scrollIntoViewIfNeeded(); await p.evaluate(() => window.scrollBy(0, -80)); }]
];
const WIDE = [
  ['w1-home', 'Your 360° Muhasabah on desktop', 'Analytics, habits and every mini-app side by side', async p => { await p.evaluate(() => { window.MHSApp.nav('dashboard'); }); await p.waitForTimeout(400); await p.locator('mhs-overview').scrollIntoViewIfNeeded(); await p.evaluate(() => window.scrollBy(0, -40)); }],
  ['w2-habits', 'Habits that build a better you', 'Fard, Sunnah and personal goals with points', async p => { await p.evaluate(() => window.MHSApp.nav('habits')); await p.waitForTimeout(500); await p.evaluate(() => window.scrollTo(0, 0)); }],
  ['w3-notes', 'Notes, checklists and media', 'With a calculator built in', async p => { await p.evaluate(() => window.MHSNotes.open()); await p.waitForTimeout(600); }],
  ['w4-hisab', 'হিসাব খাতা — dues, cash & payroll', 'A light-weight ledger with running balances', async p => { await p.evaluate(() => window.MHSHisab.open({ bookId: 'b2' })); await p.waitForTimeout(600); }]
];

async function compose(browser, png, { headline, sub, wide, idx }) {
  const W = wide ? 1920 : 1080, H = wide ? 1080 : 1920;
  const pg = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
  const img = 'data:image/png;base64,' + png.toString('base64');
  const hues = [['#00e676', '#00b8d4'], ['#ffd54f', '#00e676'], ['#7c4dff', '#00b8d4'], ['#00b8d4', '#00e676'], ['#ff4081', '#7c4dff']][idx % 5];
  const phone = wide
    ? `<div class="lap"><div class="scr"><img src="${img}"></div></div>`
    : `<div class="ph"><div class="scr"><img src="${img}"></div></div>`;
  await pg.setContent(`<!doctype html><html><head><link href="https://fonts.googleapis.com/css2?family=Sora:wght@600;700&family=Inter:wght@400;500&family=Noto+Sans+Bengali:wght@600;700&display=block" rel="stylesheet"><style>
  *{margin:0;box-sizing:border-box}body{width:${W}px;height:${H}px;overflow:hidden;background:#06080d;color:#eef6f1;font-family:Inter,sans-serif;position:relative}
  .bg{position:absolute;inset:0;background:radial-gradient(60% 40% at 85% 8%,${hues[0]}38,transparent 70%),radial-gradient(55% 35% at 10% 92%,${hues[1]}30,transparent 70%),linear-gradient(180deg,#0a0d14,#06080d)}
  .grid{position:absolute;inset:0;background-image:linear-gradient(#ffffff08 1px,transparent 1px),linear-gradient(90deg,#ffffff08 1px,transparent 1px);background-size:60px 60px;mask:linear-gradient(180deg,#000,transparent 60%)}
  .brand{position:absolute;${wide ? 'left:110px;top:120px' : 'left:0;right:0;top:92px;justify-content:center'};display:flex;align-items:center;gap:14px;font:600 26px Sora,sans-serif;letter-spacing:.02em;color:#cfe9da}
  .brand img{width:44px;height:44px;filter:drop-shadow(0 0 12px ${hues[0]}aa)}
  h1{position:absolute;${wide ? 'left:110px;top:220px;width:720px;text-align:left;font-size:76px' : 'left:60px;right:60px;top:170px;text-align:center;font-size:74px'};font-family:Sora,"Noto Sans Bengali",sans-serif;font-weight:700;line-height:1.08;letter-spacing:-.02em}
  h1 em{font-style:normal;background:linear-gradient(90deg,${hues[0]},${hues[1]});-webkit-background-clip:text;color:transparent}
  p.sub{position:absolute;${wide ? 'left:110px;top:520px;width:640px;text-align:left' : 'left:80px;right:80px;top:356px;text-align:center'};font-size:32px;line-height:1.35;color:#9fb3a6}
  .ph{position:absolute;left:50%;top:462px;width:664px;height:1404px;transform:translateX(-50%);border-radius:92px;padding:22px;background:linear-gradient(145deg,#2a3140,#0d1017 40%,#1b212c);box-shadow:0 60px 120px #000c,0 0 0 2px #ffffff14 inset,0 0 80px ${hues[0]}22}
  .ph .scr{width:100%;height:100%;border-radius:72px;overflow:hidden;background:#0a0d14}
  .ph img{width:100%;display:block}
  .isl{position:absolute;top:44px;left:50%;width:150px;height:42px;margin-left:-75px;border-radius:30px;background:#000}
  .lap{position:absolute;right:90px;top:188px;width:1000px;height:704px;border-radius:34px;padding:16px;background:linear-gradient(145deg,#2a3140,#0d1017 40%,#1b212c);box-shadow:0 50px 110px #000c,0 0 0 2px #ffffff14 inset}
  .lap .scr{width:100%;height:100%;border-radius:22px;overflow:hidden}.lap img{width:100%;display:block}
  .pill{position:absolute;${wide ? 'left:110px;bottom:120px' : 'left:0;right:0;bottom:22px;text-align:center'};font:500 22px Inter;color:#6f857a}
  </style></head><body><div class="bg"></div><div class="grid"></div>
  <div class="brand"><img src="${BASE}/icons/logo.webp">Muhasabah Plus</div>
  <h1>${headline.replace(/<br>(.*)$/, '<br><em>$1</em>')}</h1><p class="sub">${sub}</p>${phone}
  <div class="pill">Free · Offline · Private · Rated Everyone</div></body></html>`, { waitUntil: 'networkidle' });
  await pg.evaluate(() => document.fonts.ready);
  const shot = await pg.screenshot({ type: 'png' });
  const webp = await pg.evaluate(async b64 => {
    const im = new Image(); im.src = 'data:image/png;base64,' + b64; await im.decode();
    const c = document.createElement('canvas'); c.width = im.width; c.height = im.height; c.getContext('2d').drawImage(im, 0, 0);
    return c.toDataURL('image/webp', 0.86).split(',')[1];
  }, shot.toString('base64'));
  await pg.close();
  return Buffer.from(webp, 'base64');
}

(async () => {
  const browser = await chromium.launch();
  const now = new Date('2026-11-06T08:40:00Z').getTime(); // 14:40 in Dhaka: a typical afternoon
  const { data, qlog } = demo(now);
  async function app(viewport, scale) {
    const ctx = await browser.newContext({ viewport, deviceScaleFactor: scale, serviceWorkers: 'block', timezoneId: 'Asia/Dhaka', geolocation: { latitude: 23.8103, longitude: 90.4125 }, permissions: ['geolocation'] });
    await ctx.clock.setFixedTime(now);
    await ctx.route('**/api/**', r => r.fulfill({ status: 503, json: { error: 'off' } }));
    await ctx.route('**/.netlify/functions/**', r => r.fulfill({ json: null }));
    await ctx.addInitScript(([d, q]) => {
      if (sessionStorage.getItem('seeded')) return; sessionStorage.setItem('seeded', '1');
      localStorage.setItem('muhasabah:data:v1', JSON.stringify(d)); localStorage.setItem('muhasabah:savedAt', String(Date.now()));
      localStorage.setItem('mhs:x:quranlog', JSON.stringify(q));
      localStorage.setItem('mhs:ftue:v1', JSON.stringify({ intro: 1, tour: 1, tips: {} }));
      localStorage.setItem('muhasabah:install-dismissed', String(Date.now() + 1e10));
    }, [data, qlog]);
    const p = await ctx.newPage();
    await p.goto(BASE + '/?tab=dashboard'); await p.locator('#mhs-startup').waitFor({ state: 'detached' }); await p.waitForTimeout(1800);
    await p.addStyleTag({ content: '.mhs-dn-pill,#mhs-install-bar,#mhs-backup-bar,.mhs-toast{display:none!important}' });
    return { ctx, p };
  }
  async function reset(p) {
    await p.evaluate(() => { document.querySelectorAll('dialog[open]').forEach(d => d.close()); window.MHSActions && window.MHSActions.close(); window.MHSCalc && window.MHSCalc.close(); });
    await p.waitForTimeout(350);
  }
  const manifest = [];
  let { ctx, p } = await app({ width: 412, height: 892 }, 2.5);
  for (let i = 0; i < SHOTS.length; i++) {
    const [file, headline, sub, setup] = SHOTS[i];
    let png;
    if (file === '20-widget') {
      const w = await ctx.newPage(); await w.goto(BASE + '/widgets/?view=today'); await w.waitForTimeout(900);
      png = await w.screenshot(); await w.close();
    } else {
      await reset(p); await setup(p, ctx); await p.waitForTimeout(500);
      png = await p.screenshot();
    }
    fs.writeFileSync(path.join(OUT, file + '.webp'), await compose(browser, png, { headline, sub, idx: i }));
    manifest.push({ src: `/screenshots/promo/${file}.webp`, sizes: '1080x1920', type: 'image/webp', form_factor: 'narrow', label: `${headline.replace(/<br>/g, ' ').replace(/&amp;/g, '&')} — ${sub}` });
    console.log('narrow', file);
  }
  await ctx.close();
  ({ ctx, p } = await app({ width: 1440, height: 1000 }, 1.5));
  for (let i = 0; i < WIDE.length; i++) {
    const [file, headline, sub, setup] = WIDE[i];
    await reset(p); await setup(p); await p.waitForTimeout(500);
    const png = await p.screenshot();
    fs.writeFileSync(path.join(OUT, file + '.webp'), await compose(browser, png, { headline, sub, wide: true, idx: i }));
    manifest.push({ src: `/screenshots/promo/${file}.webp`, sizes: '1920x1080', type: 'image/webp', form_factor: 'wide', label: `${headline} — ${sub}` });
    console.log('wide', file);
  }
  await browser.close();
  fs.writeFileSync(path.join(OUT, 'screenshots.json'), JSON.stringify(manifest, null, 2) + '\n');
  console.log('wrote', manifest.length, 'screenshots');
})().catch(e => { console.error(e); process.exit(1); });
