import { createHash } from 'node:crypto';

export const SEERAH = {
  version: 'english-issam-diab-v1',
  title: 'Ar-Raheeq Al-Makhtum · The Sealed Nectar',
  author: 'Safiur Rahman al-Mubarakpuri',
  translator: 'Issam Diab',
  publisher: 'Dar-us-Salam',
  source: 'https://archive.org/details/en_The_Sealed_Nectar',
  textUrl: 'https://archive.org/download/en_The_Sealed_Nectar/en_The_Sealed_Nectar_djvu.txt',
  pdf: 'https://archive.org/download/en_The_Sealed_Nectar/en_The_Sealed_Nectar.pdf',
  sha256: 'd431a0ed10fad97ae51540a2847d3c60efa9a590054d81d8510b98e91ee8c85f',
} as const;

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
