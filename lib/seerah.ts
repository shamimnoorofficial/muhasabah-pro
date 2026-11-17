import { createHash } from 'node:crypto';

/* Ar-Raheeq Al-Makhtum (The Sealed Nectar), English translation by Issam Diab, read from the public
 * archive.org scan. The scan is verified by hash, then cleaned and structured into chapters and
 * pages once on the server. Edition v2 replaces the raw 4000-character slices of v1: scan headers
 * and page numbers are removed, wrapped lines are re-joined into paragraphs, OCR damage is repaired
 * and honorifics use the international forms (ﷺ for the Prophet, (RA), (AS)). */
export const SEERAH = {
  version: 'english-issam-diab-v2',
  legacyVersion: 'english-issam-diab-v1',
  title: 'Ar-Raheeq Al-Makhtum · The Sealed Nectar',
  author: 'Safiur Rahman al-Mubarakpuri',
  translator: 'Issam Diab',
  publisher: 'Dar-us-Salam',
  source: 'https://archive.org/details/en_The_Sealed_Nectar',
  textUrl: 'https://archive.org/download/en_The_Sealed_Nectar/en_The_Sealed_Nectar_djvu.txt',
  pdf: 'https://archive.org/download/en_The_Sealed_Nectar/en_The_Sealed_Nectar.pdf',
  sha256: 'd431a0ed10fad97ae51540a2847d3c60efa9a590054d81d8510b98e91ee8c85f',
} as const;

export type Chapter = { title: string; level: 1 | 2; page: number; index: number };
export type Edition = {
  version: string; title: string; author: string; translator: string; publisher: string; source: string; pdf: string;
  chapters: Chapter[]; pages: string[];
};

/* OCR repairs. The scan dropped accented vowels ("Allâh" → "All?") and kept a few HTML entities. */
const FIXES: [RegExp, string][] = [
  [/\?#146;/g, '’'], [/\?\/i>/g, ''], [/<\/?i>/g, ''],
  [/\bAll\?/g, 'Allah'], [/'Abdull\?/g, "'Abdullah"], [/\bQur'\?n?/g, "Qur'an"],
  [/\bS\? ah\b/g, 'Surah'], [/\bSal\?/g, 'Salat'], [/\bDa'\?/g, "Dawud"], [/\bMahm\?/g, 'Mahmud'],
  [/\bTham\?/g, 'Thamud'], [/\bMulsims\b/g, 'Muslims'], [/\bAI-(?=['A-Z])/g, 'Al-'], [/\bAl-Mushrik\?/g, 'Al-Mushrikun'], [/\bH\?M\?/g, 'Ha-Mim'], [/\bT\?H\?/g, 'Ta-Ha'], [/\bT\?H\b/g, 'Ta-Ha'],
  // Honorifics. "SWT" after "Messenger of Allah" is a misread of the ﷺ ligature.
  [/Messenger of Allah SWT/g, 'Messenger of Allah ﷺ'],
  [/\s*[[(]\s*pbuh\w?\s*[\])]?/gi, ' ﷺ'], [/ ﷺ['’]s\b/g, "'s ﷺ"], [/\s*\[\s*R\s*\]/g, ' (RA)'], [/\s*\[\s*AWS\s*\]/g, ' (AS)'],
  // Spacing left over from the scan.
  [/ﷺ\s+([,.;:!?)\]])/g, 'ﷺ$1'], [/\s+([,.;:!?])(?=\s|$)/g, '$1'], [/\(\s+/g, '('], [/\s+\)/g, ')'],
  [/(\d) \.(?=\s)/g, '$1.'], [/(\w) '(s|re|ll)\b/g, "$1'$2"], [/(\w)- (?=[A-Za-z])/g, '$1-'], [/\.\.(?!\.)/g, '.'], [/ {2,}/g, ' '],
];
export function repair(text: string): string {
  let out = String(text);
  for (const [re, to] of FIXES) out = out.replace(re, to);
  return out.trim();
}

const norm = (s: string) => repair(s).toLowerCase().replace(/ﷺ|\((ra|as)\)/g, '').replace(/[^a-z0-9]+/g, '');

/* The book's own table of contents: chapters (plain lines with a page number) and sections (• / ■). */
export function parseToc(raw: string): { title: string; level: 1 | 2 }[] {
  const lines = raw.replace(/\r\n?/g, '\n').split('\n');
  const start = lines.findIndex(l => /TABLE\s+OF\s+CONTENTS/.test(l));
  const out: { title: string; level: 1 | 2 }[] = [];
  let last: { title: string; level: 1 | 2 } | null = null, open = false;
  for (let i = start + 1; i < lines.length; i++) {
    const line = lines[i].replace(/\s+/g, ' ').trim();
    if (!line) { open = false; continue; }
    if (line === 'MSA NIU' || /^[._]?\d+(\s\d+)?$/.test(line)) { open = false; continue; }
    if (/^Location and Nature of Arab Tribes$/i.test(line) && out.length > 10) break; // first body heading
    const bullet = /^[•■▪●]\s*/.test(line);
    const numbered = /\s\d{1,3}(\s\d{1,2})?$/.test(line);
    const title = line.replace(/^[•■▪●]\s*/, '').replace(/\s+\d{1,3}(\s\d{1,2})?$/, '').trim();
    if (!title || /^(Publisher Note|Author's Note|Certificate)$/i.test(title)) { open = false; continue; }
    // A wrapped entry continues directly on the next line (no blank line, no bullet).
    if (last && open && !bullet) { last.title += ' ' + title; open = !numbered; continue; }
    last = { title, level: bullet ? 2 : 1 };
    out.push(last); open = !numbered;
  }
  return out;
}

/* Paragraphs of the body text without scan headers, page numbers or hard line wraps. */
export function paragraphs(raw: string): string[] {
  const lines = raw.replace(/\r\n?/g, '\n').split('\n');
  const toc = lines.findIndex(l => /TABLE\s+OF\s+CONTENTS/.test(l));
  let body = toc;
  for (let i = toc + 1, seen = 0; i < lines.length; i++) {
    if (/^Location\s+and\s+Nature\s+of\s+Arab\s+Tribes\s*$/i.test(lines[i].trim()) && ++seen) { body = i; break; }
  }
  const out: string[] = [];
  let buf: string[] = [];
  const flush = () => { if (buf.length) { out.push(buf.join(' ')); buf = []; } };
  for (let i = body; i < lines.length; i++) {
    const line = lines[i].replace(/\s+/g, ' ').trim();
    if (line === 'MSA NIU' || /^\d{1,3}$/.test(line)) continue; // page header / page number
    if (!line) { flush(); continue; }
    buf.push(line);
  }
  flush();
  // Re-join paragraphs that a page break split mid-sentence.
  const joined: string[] = [];
  for (const p of out) {
    const prev = joined[joined.length - 1];
    if (prev && ((!/[.!?:"'”’)\]]$/.test(prev) && /^[a-z(,;]/.test(p)) || /[,;]$/.test(prev))) joined[joined.length - 1] = prev + ' ' + p;
    else joined.push(p);
  }
  return joined.map(repair).filter(Boolean);
}

/* Split long paragraphs at sentence ends so no page grows beyond the target size. */
function pieces(p: string, max: number): string[] {
  if (p.length <= max) return [p];
  const parts: string[] = [];
  let rest = p;
  while (rest.length > max) {
    const cut = Math.max(rest.lastIndexOf('. ', max), rest.lastIndexOf('." ', max), rest.lastIndexOf('? ', max));
    const at = cut > max / 3 ? cut + 1 : rest.lastIndexOf(' ', max);
    parts.push(rest.slice(0, at).trim()); rest = rest.slice(at).trim();
  }
  if (rest) parts.push(rest);
  return parts;
}

function bigrams(s: string) { const m = new Map<string, number>(); for (let i = 0; i < s.length - 1; i++) { const b = s.slice(i, i + 2); m.set(b, (m.get(b) || 0) + 1); } return m; }
function dice(a: string, b: string) {
  if (Math.abs(a.length - b.length) > Math.max(a.length, b.length) * 0.35) return 0;
  const x = bigrams(a), y = bigrams(b); let hit = 0;
  for (const [k, n] of x) hit += Math.min(n, y.get(k) || 0);
  return (2 * hit) / Math.max(1, a.length + b.length - 2);
}
/* Character position in `text` just after the words of `title` (matched ignoring punctuation). */
function cutAfter(text: string, title: string) {
  const want = norm(title); let acc = '';
  for (let i = 0; i < text.length; i++) { acc += /[a-z0-9]/i.test(text[i]) ? text[i].toLowerCase() : ''; if (acc === want) return i + 1; if (!want.startsWith(acc)) return -1; }
  return -1;
}
function shift(marks: Map<number, { title: string; level: 1 | 2 }>, at: number) {
  const moved = [...marks].map(([k, v]) => [k >= at ? k + 1 : k, v] as const); marks.clear(); moved.forEach(([k, v]) => marks.set(k, v));
}
function shiftCandidates(list: { i: number }[], at: number) { list.forEach(c => { if (c.i >= at) c.i++; }); }

/* Pages hold whole paragraphs. "# " marks a chapter title and "## " a section title inside a page.
 * Every chapter starts on a new page, so the table of contents opens at the top of a page. */
export function buildEdition(raw: string, size = 2400): Edition {
  const toc = parseToc(raw), paras = paragraphs(raw);
  const marks = new Map<number, { title: string; level: 1 | 2 }>();
  // Headings in the body are spelled slightly differently from the contents page ("Compaign" /
  // "Campaign", added numbering or dates), and the scanned contents page is not always in reading
  // order, so match each entry to the most similar short paragraph anywhere in the book.
  const candidates = paras.map((p, i) => ({ i, key: norm(p.replace(/^\d+\.\s*/, '')), short: p.length < 170 && !/[.;,]$/.test(p.replace(/A\.H\.?$/, '')) }))
    .filter(c => c.short && c.key.length > 2);
  let from = 0;
  for (const entry of toc) {
    const want = norm(entry.title);
    if (want.length < 4) continue;
    let best = -1, score = 0;
    for (const c of candidates) {
      if (marks.has(c.i)) continue;
      const s = c.key === want ? 1 : c.key.startsWith(want) ? 0.96 : c.key.length > 10 && c.key.length >= want.length * 0.5 && want.startsWith(c.key) ? 0.86 : dice(c.key, want);
      const near = c.i >= from ? 0.02 : 0; // prefer reading order on ties
      if (s + near > score) { score = s + near; best = c.i; }
    }
    if (best >= 0 && score >= 0.8) {
      let title = paras[best].replace(/^\d+\.\s*/, '').replace(/[.:]$/, '');
      // Two headings scanned onto one line: keep the first, put the rest back as its own paragraph.
      const key = norm(title);
      if (key.startsWith(want) && key.length > want.length + 8) {
        const cut = cutAfter(title, entry.title);
        if (cut > 0) { paras.splice(best + 1, 0, title.slice(cut).trim()); shift(marks, best + 1); shiftCandidates(candidates, best + 1); title = title.slice(0, cut).trim(); }
      }
      marks.set(best, { title, level: entry.level }); from = best + 1;
      continue;
    }
    // The scan sometimes glued a heading to the end of the previous paragraph.
    const words = entry.title.replace(/\[[^\]]*\]|SWT/g, ' ').match(/[A-Za-z0-9']+/g) || [];
    if (words.length < 3) continue;
    const re = new RegExp('(^|[.!?"”]\\s+)(' + words.map(w => w.replace(/'/g, "'?")).join('[\\s:,\\-]*') + ')\\s+(?=[A-Z])', 'i');
    for (let i = from; i < paras.length; i++) {
      const m = re.exec(paras[i]);
      if (!m || marks.has(i)) continue;
      const head = m.index + m[1].length, end = m.index + m[0].length;
      const before = paras[i].slice(0, head).trim(), title = m[2].trim(), after = paras[i].slice(end).trim();
      if (!after) continue;
      if (before) { paras.splice(i, 1, before, title, after); shift(marks, i + 1); shift(marks, i + 1); shiftCandidates(candidates, i + 1); shiftCandidates(candidates, i + 1); marks.set(i + 1, { title, level: entry.level }); from = i + 2; }
      else { paras.splice(i, 1, title, after); shift(marks, i + 1); shiftCandidates(candidates, i + 1); marks.set(i, { title, level: entry.level }); from = i + 1; }
      break;
    }
  }
  const pages: string[] = [], chapters: Chapter[] = [];
  let page: string[] = [], length = 0, headings = 0;
  const close = () => { if (page.length) { pages.push(page.join('\n\n')); page = []; length = 0; headings = 0; } };
  paras.forEach((p, i) => {
    const mark = marks.get(i);
    if (mark) {
      if (mark.level === 1 || length > size * 0.7) close();
      chapters.push({ title: mark.title, level: mark.level, page: pages.length, index: headings++ });
      page.push((mark.level === 1 ? '# ' : '## ') + mark.title); length += mark.title.length;
      return;
    }
    for (const part of pieces(p, size)) {
      if (length && length + part.length > size) close();
      page.push(part); length += part.length + 2;
    }
  });
  close();
  return { version: SEERAH.version, title: SEERAH.title, author: SEERAH.author, translator: SEERAH.translator, publisher: SEERAH.publisher, source: SEERAH.source, pdf: SEERAH.pdf, chapters, pages };
}

/* Legacy v1 slices, still used to map saved v1 positions onto v2 pages. */
export function splitPassages(text: string, size = 4000): string[] {
  const normalized = text.replace(/\r\n?/g, '\n').replace(/[ \t]+/g, ' ').replace(/ *\n */g, '\n').replace(/\n{3,}/g, '\n\n').trim();
  const pages: string[] = [];
  let offset = 0;
  while (offset < normalized.length) {
    let end = Math.min(offset + size, normalized.length);
    if (end < normalized.length) {
      const paragraph = normalized.lastIndexOf('\n\n', end);
      const space = normalized.lastIndexOf(' ', end);
      if (paragraph > offset + size / 2) end = paragraph;
      else if (space > offset) end = space;
    }
    pages.push(normalized.slice(offset, end).trim());
    offset = end;
    while (/\s/.test(normalized[offset] || '') && offset < normalized.length) offset++;
  }
  return pages;
}

export function verifySource(text: string) {
  return createHash('sha256').update(text).digest('hex') === SEERAH.sha256;
}

/* Native script of each language that does not use the Latin alphabet. Used to reject a machine
 * translation that came back in English (or transliterated into Latin letters) instead of the
 * reader's language. Latin-script languages are not checked this way. */
const SCRIPTS: Record<string, RegExp> = {
  bn: /[\u0980-\u09FF]/g, as: /[\u0980-\u09FF]/g,
  ar: /[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]/g, fa: /[\u0600-\u06FF\uFB50-\uFDFF\uFE70-\uFEFF]/g, ur: /[\u0600-\u06FF\uFB50-\uFDFF\uFE70-\uFEFF]/g,
  ps: /[\u0600-\u06FF\uFB50-\uFDFF\uFE70-\uFEFF]/g, sd: /[\u0600-\u06FF\uFB50-\uFDFF\uFE70-\uFEFF]/g, ug: /[\u0600-\u06FF\uFB50-\uFDFF\uFE70-\uFEFF]/g, ckb: /[\u0600-\u06FF\uFB50-\uFDFF\uFE70-\uFEFF]/g,
  he: /[\u0590-\u05FF]/g, yi: /[\u0590-\u05FF]/g, dv: /[\u0780-\u07BF]/g,
  hi: /[\u0900-\u097F]/g, mr: /[\u0900-\u097F]/g, ne: /[\u0900-\u097F]/g,
  pa: /[\u0A00-\u0A7F]/g, gu: /[\u0A80-\u0AFF]/g, or: /[\u0B00-\u0B7F]/g, ta: /[\u0B80-\u0BFF]/g, te: /[\u0C00-\u0C7F]/g,
  kn: /[\u0C80-\u0CFF]/g, ml: /[\u0D00-\u0D7F]/g, si: /[\u0D80-\u0DFF]/g, th: /[\u0E00-\u0E7F]/g, lo: /[\u0E80-\u0EFF]/g,
  my: /[\u1000-\u109F]/g, ka: /[\u10A0-\u10FF]/g, hy: /[\u0530-\u058F]/g, am: /[\u1200-\u139F]/g, ti: /[\u1200-\u139F]/g, km: /[\u1780-\u17FF]/g,
  el: /[\u0370-\u03FF\u1F00-\u1FFF]/g,
  ru: /[\u0400-\u04FF]/g, uk: /[\u0400-\u04FF]/g, be: /[\u0400-\u04FF]/g, bg: /[\u0400-\u04FF]/g, mk: /[\u0400-\u04FF]/g, sr: /[\u0400-\u04FF]/g,
  kk: /[\u0400-\u04FF]/g, ky: /[\u0400-\u04FF]/g, tg: /[\u0400-\u04FF]/g, tt: /[\u0400-\u04FF]/g, mn: /[\u0400-\u04FF]/g,
  'zh-CN': /[\u3400-\u9FFF]/g, 'zh-TW': /[\u3400-\u9FFF]/g, ja: /[\u3040-\u30FF\u3400-\u9FFF]/g, ko: /[\uAC00-\uD7AF\u1100-\u11FF]/g,
};
/* True when the text is written in the language's own script: at least 70% of its letters are in that
 * script once quoted Arabic is set aside (the book quotes the Quran verbatim). Latin-script languages
 * always pass. Short scraps (a name, a number) pass too. */
export function inScript(lang: string, text: string): boolean {
  const re = SCRIPTS[lang];
  if (!re) return true;
  const arabic = /^(ar|fa|ur|ps|sd|ug|ckb)$/.test(lang);
  const body = arabic ? String(text) : String(text).replace(/[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]+/g, ' ');
  const native = (body.match(re) || []).length, latin = (body.match(/[A-Za-z\u00C0-\u024F]/g) || []).length;
  if (native + latin < 12) return true;
  return native / (native + latin) >= 0.7;
}
export const headingCount = (text: string) => (String(text).match(/^#{1,2} /gm) || []).length;

/* Honorifics the model sometimes leaves in English, by language. */
const HONORIFICS: Record<string, [RegExp, string][]> = {
  bn: [[/\(\s*RA\s*\)/g, '(রা.)'], [/\(\s*AS\s*\)/g, '(আ.)'], [/\(\s*রাঃ?\s*\)/g, '(রা.)'], [/\(\s*আঃ?\s*\)/g, '(আ.)'], [/\(\s*সাঃ?\.?\s*\)|\(\s*সাল্লাল্লাহু আলাইহি ওয়াসাল্লাম\s*\)/g, 'ﷺ']],
  ar: [[/\(\s*RA\s*\)/g, '(رضي الله عنه)'], [/\(\s*AS\s*\)/g, '(عليه السلام)']],
};
/* Tidy a machine translation: the honorific ligature, no leftover scan markers or chat preambles,
 * honorifics in the reader's language and one Unicode form so search and highlights match. */
export function tidyTranslation(text: string, lang = ''): string {
  let out = String(text).normalize('NFC')
    .replace(/^\s*(?:here(?:'s| is) (?:the|my) [^\n]*translation[^\n]*:|translation:)\s*\n+/i, '')
    .replace(/\*\*([^*\n]+)\*\*/g, '$1')
    .replace(/\s*[[(]\s*pbuh\s*[\])]/gi, ' ﷺ');
  for (const [re, to] of HONORIFICS[lang] || []) out = out.replace(re, to);
  return out.replace(/ﷺ\s*ﷺ/g, 'ﷺ').replace(/ﷺ\s+([,.;:!?)\]।،؛])/g, 'ﷺ$1').replace(/[ \t]{2,}/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
}
