/* Collects every English interface string from the app sources into i18n/catalog.json.
 * The catalog is the allow-list for automatic translation: only these strings are ever
 * sent for translation, so personal data such as journal text or habit notes never leaves
 * the device. Run with `node scripts/i18n-catalog.mjs` after changing interface text
 * (the deploy build runs it too). */
import { readFile, writeFile, readdir, mkdir } from "node:fs/promises";

const sources = ["assets/app.js", "index.html"];
for (const f of await readdir("pwa")) if (f.endsWith(".js") && f !== "identity.js" && f !== "languages.js" && f !== "i18n.js") sources.push("pwa/" + f);

/* Words that only ever appear in class names, CSS or code, never as interface text. */
const CODE_WORDS = new Set("flex grid block inline hidden absolute relative fixed sticky static rounded border text bg px py mx my mt mb ml mr pt pb pl pr gap items justify center start end col row wrap shrink grow font sm md lg xl w h z inset top left right bottom opacity shadow ring transition duration ease transform scale translate overflow auto none pointer cursor select space truncate uppercase lowercase tracking leading whitespace backdrop blur sr only object cover contain aspect min max full screen dark light hover focus active disabled group peer div span button input svg path circle rect g img label section aside main nav header footer strong small option ul li ol p a br hr em b i utf json text/plain application px rem em vh vw solid dashed dotted ltr rtl true false null undefined function return const let var this new typeof void delete async await default get put post patch head options checkbox radio range number date time email password submit reset file tel url search color module script style link meta noopener noreferrer blank self anonymous use credentials include same origin cors no store cache reload rgba rgb hsl var calc linear gradient radial conic".split(" "));

const isUi = s => {
  if (s.length < 2 || s.length > 400) return false;
  if (!/[A-Za-z].*[A-Za-z]/.test(s)) return false;
  if (/[ঀ-৿؀-ۿ]/.test(s)) return false; // Bengali or Arabic: already a translation
  if (/^(https?:|mailto:|\/|\.\/|#|data:|blob:|\[|\{|<)/.test(s)) return false;
  if (/[{}<>=;`\\]|=>|\$\{|\b(?:function|return|document|window|localStorage)\b|\(\)|&&|\|\|/.test(s)) return false;
  if (/^[a-z]+(?:[A-Z][a-z0-9]*)+$/.test(s) || /^[A-Z][a-z]+[A-Z]\w*$/.test(s)) return false; // camel/Pascal identifier
  if (/^[(),.+*/:?]/.test(s) || /\s\+(\s|$)|^\+|[\w\]]\(|\.\w+\(|\$\d|^M[\d.]|\bReact\b|__\w/.test(s)) return false; // code fragments
  if (/^[a-z]+$/.test(s)) return false; // lone lowercase words are keys/events, not labels
  if (/^[\w.$-]+:[\w./-]+$/.test(s) || /^mhs[:\-_]/i.test(s)) return false; // keys, ids
  if (/^[a-z0-9_.$-]+$/.test(s) && !/^[a-z]{3,}$/.test(s)) return false; // snake / kebab ids
  const words = s.split(/\s+/).filter(Boolean);
  const plain = words.map(w => w.replace(/^[^A-Za-z]+|[^A-Za-z]+$/g, "").toLowerCase());
  if (words.some(w => /^[a-z0-9]+[-:\[/_][\w\[\]./:%#()-]*$/.test(w) && /[:\[\]_]|-\d|^-/.test(w))) return false; // tailwind utilities
  if (words.every((w, k) => CODE_WORDS.has(plain[k]) || /^[a-z]+-[a-z0-9-]+$/.test(w))) return false;
  if (words.length === 1 && /^[a-z]/.test(s) && !/^[a-z]+$/.test(s)) return false;
  return true;
};


/* A small JavaScript tokenizer: yields string and template literals while skipping
 * comments and regular expressions, so a stray quote never shifts what is read. */
function* stringLiterals(src) {
  let k = 0, prev = "";
  const n = src.length;
  while (k < n) {
    const c = src[k];
    if (c === "/" && src[k + 1] === "/") { k = src.indexOf("\n", k); if (k < 0) break; continue; }
    if (c === "/" && src[k + 1] === "*") { k = src.indexOf("*/", k + 2); if (k < 0) break; k += 2; continue; }
    if (c === '"' || c === "'" || c === "`") {
      let j = k + 1, text = "", depth = 0;
      while (j < n) {
        const d = src[j];
        if (d === "\\") { text += d + src[j + 1]; j += 2; continue; }
        if (c === "`" && d === "$" && src[j + 1] === "{") depth++;
        else if (c === "`" && depth && d === "}") depth--;
        else if (d === c && !depth) break;
        else if (d === "\n" && c !== "`") break;
        text += d; j++;
      }
      if (text.length <= 600) yield { text, template: c === "`" };
      k = j + 1; prev = "a"; continue;
    }
    if (c === "/" && (prev === "" || "(,=:[!&|?{};+-*%<>~^".includes(prev))) {
      let j = k + 1, cls = false;
      while (j < n && src[j] !== "\n") {
        const d = src[j];
        if (d === "\\") { j += 2; continue; }
        if (d === "[") cls = true; else if (d === "]") cls = false; else if (d === "/" && !cls) break;
        j++;
      }
      k = j + 1; prev = "a"; continue;
    }
    if (!/\s/.test(c)) prev = /[\w$)\]]/.test(c) ? "a" : c;
    k++;
  }
}

const found = new Set();
const add = raw => {
  const s = raw.replace(/\\n/g, "\n").replace(/\\'/g, "'").replace(/\\"/g, '"').replace(/\\u([0-9a-fA-F]{4})/g, (_, h) => String.fromCharCode(parseInt(h, 16))).replace(/\s+/g, " ").trim();
  if (!isUi(s)) return;
  found.add(s);
  /* Labels often carry a leading symbol or a trailing ellipsis/colon in the source. */
  const core = s.replace(/^[^\p{L}]+|[^\p{L}.?!)]+$/gu, "").trim();
  if (core && core !== s && isUi(core)) found.add(core);
};

for (const file of sources) {
  const src = await readFile(file, "utf8");
  if (file.endsWith(".html")) {
    for (const m of src.matchAll(/>([^<>]{2,400})</g)) add(m[1]);
    for (const m of src.matchAll(/\b(?:aria-label|title|placeholder|alt)="([^"]{2,400})"/g)) add(m[1]);
    continue;
  }
  for (const literal of stringLiterals(src)) {
    if (literal.template) for (const part of literal.text.split(/\$\{[^}]*\}/)) add(part);
    else add(literal.text);
  }
}

/* Static HTML strings produced by innerHTML templates (e.g. '<b>Title</b>'). */
for (const s of [...found]) if (/<[a-z]/i.test(s)) found.delete(s);

const catalog = [...found].sort();
await mkdir("i18n", { recursive: true });
await writeFile("i18n/catalog.json", JSON.stringify(catalog) + "\n");
console.log(`i18n: ${catalog.length} interface strings → i18n/catalog.json`);
