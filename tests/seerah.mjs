import assert from 'node:assert/strict';
import { splitPassages, verifySource, repair, buildEdition, tidyTranslation } from '../lib/seerah.ts';
// Legacy v1 slices (used to map old saved positions) keep every word.
const source = 'First paragraph.\n\n' + 'A long paragraph with every word preserved. '.repeat(400) + '\n\nFinal paragraph.';
const pages = splitPassages(source);
assert.ok(pages.length > 2 && pages.every(p => p.length <= 4000));
assert.equal(pages.join(' ').replace(/\s+/g, ' '), source.replace(/\s+/g, ' '));
assert.equal(verifySource('<html>source replaced</html>'), false);
// Honorifics follow international usage and OCR damage is repaired.
assert.equal(repair('the Prophet [pbuh] said'), 'the Prophet ﷺ said');
assert.equal(repair('Prophet [pbuh] , then'), 'Prophet ﷺ, then');
assert.equal(repair("Abu Bakr [R] and Abraham [AWS] praised All?  ."), 'Abu Bakr (RA) and Abraham (AS) praised Allah.');
assert.equal(repair("the Qur'?  says"), "the Qur'an says");
assert.equal(tidyTranslation('নবী [pbuh] বললেন'), 'নবী ﷺ বললেন');
// A miniature scan: contents page, page headers/numbers, hard line wraps.
const scan = ['TABLE  OF  CONTENTS', '', 'Location  and  nature  of  Arab  Tribes  8', '', '•  Location  of  the  Arabs', '', 'Rulership  in  Arabia  14', '', '•  Arab  Tribes', '', '1', '', 'MSA  NIU',
  '', 'Location  and  Nature  of  Arab  Tribes', '', 'The  biography  of  Prophet  Muhammad  [pbuh]  is  an', 'embodiment  of  the  Message.', '', 'Location  of  the  Arabs', '', 'Arabia  is  a  desert  land  of  great', '', '8', '', 'MSA  NIU', '', 'importance.', '',
  'Rulership  in  Arabia', '', 'Kings  ruled  in  Yemen.', '', 'Arab  Tribes', '', 'The  tribes  were  many.'].join('\n');
const e = buildEdition(scan);
assert.deepEqual(e.chapters.map(c => [c.title, c.level, c.page]), [['Location and Nature of Arab Tribes', 1, 0], ['Location of the Arabs', 2, 0], ['Rulership in Arabia', 1, 1], ['Arab Tribes', 2, 1]]);
const text = e.pages.join('\n');
assert.ok(!/MSA NIU|pbuh|\n8\n/.test(text), 'scan headers, page numbers and [pbuh] are removed');
assert.match(text, /Muhammad ﷺ is an embodiment/, 'wrapped lines are joined');
assert.match(text, /desert land of great importance\./, 'paragraphs split by a page break are joined');
assert.ok(e.pages[0].startsWith('# Location and Nature of Arab Tribes'));
console.log('Seerah: chapters, cleaned paragraphs, international honorifics and changed-source rejection passed');
