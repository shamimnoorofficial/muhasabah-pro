/* Automatic interface translation for every language except English. Bengali and Arabic
 * have hand-written translations; this only fills in strings they do not cover. Only strings from the app's own interface catalog are accepted, so
 * nothing personal is ever translated here. Each string is translated once per language
 * with AI Gateway and cached in Netlify Blobs, so every later visitor gets it instantly. */
import Anthropic from '@anthropic-ai/sdk';
import { getStore } from '@netlify/blobs';
import type { Config } from '@netlify/functions';
import catalog from '../../i18n/catalog.json' with { type: 'json' };
import languages from '../../i18n/languages.json' with { type: 'json' };

const CATALOG = new Set<string>(catalog as string[]);
const LANGUAGES = new Set<string>(languages as string[]);
const SOURCE = 'en';
const MAX_BATCH = 40;
type Dict = Record<string, string>;

const englishNames = new Intl.DisplayNames(['en'], { type: 'language', fallback: 'none' });
function languageName(code: string) {
  if (!LANGUAGES.has(code) || code === SOURCE) return null;
  const special: Record<string, string> = { 'zh-CN': 'Simplified Chinese', 'zh-TW': 'Traditional Chinese', 'pt-BR': 'Brazilian Portuguese', pt: 'European Portuguese', ckb: 'Central Kurdish (Sorani)', bn: 'Bengali (Bangla, as used in Bangladesh)', ar: 'Modern Standard Arabic', ku: 'Kurdish (Kurmanji)' };
  try { return special[code] || englishNames.of(code) || null; } catch { return null; }
}

const store = () => getStore({ name: 'i18n', consistency: 'strong' });
const keyFor = (lang: string) => `v1/${lang}`;

async function translate(lang: string, name: string, strings: string[]): Promise<Dict> {
  const anthropic = new Anthropic();
  const input = Object.fromEntries(strings.map((s, k) => [k, s]));
  const message = await anthropic.messages.create({
    model: 'claude-haiku-5-5',
    max_tokens: 8000,
    system:
      `You translate the user interface of "Muhasabah", an Islamic habit tracker and private journal, from English into ${name} (${lang}). ` +
      'Write natural, concise interface wording a native speaker expects in a mobile app. Keep the same tone and capitalization style. ' +
      'Keep emojis, symbols (•, →, ·, ▲, %, +, −), numbers, currency amounts, "{name}" placeholders and line breaks exactly. ' +
      'Never translate the brand names Muhasabah, Muhasabah Pro, Pro, Stripe, Google Drive, PayPal, Hijri or AH. ' +
      'For Islamic terms (Fajr, Dhuhr, Asr, Maghrib, Isha, Salah, Quran, Sunnah, Fard, Dua, Dhikr, Waqt, Hanafi, Shafi\'i) use the form Muslims who speak this language normally use. ' +
      'Reply with only a JSON object that maps every input key to its translation.',
    messages: [{ role: 'user', content: JSON.stringify(input) }],
  });
  const text = message.content.map(part => (part.type === 'text' ? part.text : '')).join('');
  const start = text.indexOf('{'), end = text.lastIndexOf('}');
  if (start < 0 || end < start) throw new Error('No JSON in translation reply');
  const parsed = JSON.parse(text.slice(start, end + 1)) as Record<string, unknown>;
  const out: Dict = {};
  strings.forEach((s, k) => {
    const value = parsed[k];
    if (typeof value === 'string' && value.trim() && value.length < s.length * 6 + 80) out[s] = value.trim();
  });
  return out;
}

async function merge(lang: string, additions: Dict) {
  const blobs = store();
  for (let attempt = 0; attempt < 5; attempt++) {
    const current = await blobs.getWithMetadata(keyFor(lang), { type: 'json' });
    const next = { ...((current?.data as Dict) || {}), ...additions };
    const result = current
      ? await blobs.setJSON(keyFor(lang), next, { onlyIfMatch: current.etag })
      : await blobs.setJSON(keyFor(lang), next, { onlyIfNew: true });
    if (result.modified) return next;
  }
  return null;
}

export default async (req: Request) => {
  const url = new URL(req.url);
  if (req.method === 'GET') {
    const lang = url.searchParams.get('lang') || '';
    if (!languageName(lang)) return Response.json({ error: 'Unsupported language' }, { status: 400 });
    const dict = ((await store().get(keyFor(lang), { type: 'json' })) as Dict) || {};
    return Response.json({ lang, total: CATALOG.size, translations: dict }, { headers: { 'Cache-Control': 'public, max-age=60' } });
  }
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });
  if (req.headers.get('origin') && req.headers.get('origin') !== url.origin) return new Response('Forbidden', { status: 403 });

  let body: { lang?: unknown; strings?: unknown };
  try { body = await req.json(); } catch { return Response.json({ error: 'Invalid JSON' }, { status: 400 }); }
  const lang = typeof body.lang === 'string' ? body.lang : '';
  const name = languageName(lang);
  if (!name) return Response.json({ error: 'Unsupported language' }, { status: 400 });
  const wanted = Array.isArray(body.strings)
    ? [...new Set(body.strings.filter((s): s is string => typeof s === 'string' && CATALOG.has(s)))].slice(0, MAX_BATCH)
    : [];
  if (!wanted.length) return Response.json({ translations: {} });

  const cached = ((await store().get(keyFor(lang), { type: 'json' })) as Dict) || {};
  const missing = wanted.filter(s => !cached[s]);
  let fresh: Dict = {};
  if (missing.length) {
    try {
      fresh = await translate(lang, name, missing);
      if (Object.keys(fresh).length) await merge(lang, fresh);
    } catch (error) {
      console.error('i18n translation failed', lang, error instanceof Error ? error.message : error);
      if (missing.length === wanted.length) return Response.json({ error: 'Translation unavailable' }, { status: 503 });
    }
  }
  const translations: Dict = {};
  for (const s of wanted) if (cached[s] || fresh[s]) translations[s] = cached[s] || fresh[s];
  return Response.json({ translations });
};

export const config: Config = { path: '/api/i18n' };
